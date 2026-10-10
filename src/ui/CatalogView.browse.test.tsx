import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { CatalogView } from './CatalogView';

const COLLECTION_KEY = 'cyberdeck:collection';

function card(slug: string, name: string, extra: Partial<Card> = {}): Card {
  return { id: `id-${slug}`, key: slug, slug, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 2, power: 3, ram: null, rarity: 'Common', ...extra };
}

const cards: Card[] = [card('alpha', 'Alpha'), card('beta', 'Beta', { type: 'Program', color: 'Blue' })];

const withOwned = (entries: { card: string; count: number }[]) =>
  createMemoryRepositories({
    initial: {
      [COLLECTION_KEY]: JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-01T10:00:00.000Z', data: { entries } }),
    },
  });

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

async function renderView(repositories: Repositories) {
  const slot = document.createElement('div');
  document.body.appendChild(slot);
  render(<CatalogView cards={cards} repositories={repositories} headerSlot={slot} />);
  await settle();
}

const markButton = () => screen.queryByRole('button', { name: 'Merkitse omat kortit' });
const banner = () => screen.queryByRole('region', { name: 'Merkintätila.' });
const done = () => screen.getByRole('button', { name: 'Valmis' });
const stepButtons = () => screen.queryAllByRole('button', { name: /^(Vähennä|Lisää) yksi kappale/ });

describe('CatalogView: marking own cards (T-040, T-123)', () => {
  it('is off by default when the collection has cards: counts show, buttons and banner do not', async () => {
    await renderView(withOwned([{ card: 'alpha', count: 2 }]));
    expect(markButton()).toBeInTheDocument();
    expect(banner()).toBeNull();
    expect(screen.queryByRole('switch', { name: 'Muokkaa kokoelmaa' })).toBeNull();
    expect(stepButtons()).toHaveLength(0);
    expect(screen.getByText(/Kokoelmassa/, { selector: '.visually-hidden' })).toBeInTheDocument();
    // No reminder for a collection that has cards.
    expect(screen.queryByText('Kokoelmasi on tyhjä. Aloita merkitsemällä omat korttisi.')).toBeNull();
  });

  it('explains the button with its title and description', async () => {
    await renderView(withOwned([{ card: 'alpha', count: 2 }]));
    const hint = 'Näyttää jokaisen kortin alla + ja −, joilla kirjaat, montako kappaletta omistat.';
    expect(markButton()).toHaveAttribute('title', hint);
    expect(markButton()).toHaveAccessibleDescription(hint);
  });

  it('is on by default for an empty collection and stays on after the first card is added', async () => {
    const user = userEvent.setup();
    await renderView(createMemoryRepositories());
    expect(banner()).toBeInTheDocument();
    expect(markButton()).toBeNull();
    await user.click(screen.getAllByRole('button', { name: /^Lisää/ }).at(0) as HTMLElement);
    await settle();
    expect(banner()).toBeInTheDocument();
    expect(stepButtons().length).toBeGreaterThan(0);
  });

  it('reminds an empty collection with the mode off', async () => {
    const repositories = createMemoryRepositories();
    await repositories.preferences.saveEditMode(false);
    await renderView(repositories);
    expect(markButton()).toBeInTheDocument();
    expect(screen.getByText('Kokoelmasi on tyhjä. Aloita merkitsemällä omat korttisi.')).toBeInTheDocument();
  });

  it('shows the banner and the buttons when started, remembers the choice and leaves with Valmis', async () => {
    const user = userEvent.setup();
    const repositories = withOwned([{ card: 'alpha', count: 1 }]);
    await renderView(repositories);
    await user.click(markButton() as HTMLElement);
    expect(banner()).toBeInTheDocument();
    expect(within(banner() as HTMLElement).getByText(/Kirjaa omistamasi määrä/)).toBeInTheDocument();
    expect(markButton()).toBeNull();
    expect(stepButtons()).toHaveLength(4);
    expect(done()).toHaveFocus();
    expect(await repositories.preferences.loadEditMode()).toBe(true);

    await user.click(done());
    expect(banner()).toBeNull();
    expect(stepButtons()).toHaveLength(0);
    expect(markButton()).toHaveFocus();
    expect(await repositories.preferences.loadEditMode()).toBe(false);
  });

  it('keeps the edition choice in the banner and saves it', async () => {
    const user = userEvent.setup();
    const repositories = withOwned([{ card: 'alpha', count: 1 }]);
    await renderView(repositories);
    expect(screen.queryByRole('radio', { name: 'Retail' })).toBeNull();
    await user.click(markButton() as HTMLElement);
    const choice = within(banner() as HTMLElement).getByRole('radio', { name: 'Retail' });
    await user.click(choice);
    expect(choice).toBeChecked();
    expect(await repositories.preferences.loadDefaultEdition()).toBe('retail');
  });

  it('uses the saved choice, also "off" for an empty collection', async () => {
    const repositories = createMemoryRepositories();
    await repositories.preferences.saveEditMode(false);
    await renderView(repositories);
    expect(banner()).toBeNull();
    expect(markButton()).toBeInTheDocument();
    expect(stepButtons()).toHaveLength(0);
  });

  it('uses the saved choice "on" for a collection with cards', async () => {
    const repositories = withOwned([{ card: 'alpha', count: 1 }]);
    await repositories.preferences.saveEditMode(true);
    await renderView(repositories);
    expect(banner()).toBeInTheDocument();
    expect(stepButtons()).toHaveLength(4);
  });
});

describe('CatalogView: view selector and table (T-040)', () => {
  it('shows the grid by default and switches to a table that is remembered', async () => {
    const user = userEvent.setup();
    const repositories = withOwned([{ card: 'alpha', count: 3 }]);
    await renderView(repositories);
    expect(screen.getByRole('radio', { name: 'Kuvat' })).toBeChecked();
    expect(screen.queryByRole('table')).toBeNull();

    await user.click(screen.getByRole('radio', { name: 'Lista' }));
    expect(screen.getByRole('table', { name: 'Kaikki kortit' })).toBeInTheDocument();
    expect(await repositories.preferences.loadView()).toBe('table');
  });

  it('starts in the saved table view', async () => {
    const repositories = withOwned([]);
    await repositories.preferences.saveView('table');
    await renderView(repositories);
    expect(screen.getByRole('radio', { name: 'Lista' })).toBeChecked();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('has the required columns, a focusable named scroll region and one row per card', async () => {
    const repositories = withOwned([{ card: 'alpha', count: 1 }]);
    await repositories.preferences.saveView('table');
    await renderView(repositories);
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Kuva', 'Nimi', 'Tyyppi', 'Harvinaisuus', 'Cost', 'Power', 'RAM', 'Kokoelma']);
    const region = screen.getByRole('region', { name: /taulukko/ });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);
  });

  it('marks owned and full-playset rows and shows count only while not editing', async () => {
    const repositories = withOwned([
      { card: 'alpha', count: 1 },
      { card: 'beta', count: 3 },
    ]);
    await repositories.preferences.saveView('table');
    await renderView(repositories);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveClass('is-owned');
    expect(rows[1]).not.toHaveClass('is-playset');
    expect(rows[2]).toHaveClass('is-playset');
    expect(stepButtons()).toHaveLength(0);
  });

  it('opens the image dialog from the name and works with search and edit switch', async () => {
    const user = userEvent.setup();
    const repositories = withOwned([{ card: 'alpha', count: 1 }]);
    await repositories.preferences.saveView('table');
    await renderView(repositories);

    await user.type(screen.getByRole('searchbox'), 'beta');
    await settle();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('table', { name: 'Hakua vastaavat kortit' })).toBeInTheDocument();

    await user.click(markButton() as HTMLElement);
    expect(stepButtons()).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
