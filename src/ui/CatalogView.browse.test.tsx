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

const editSwitch = () => screen.getByRole('switch', { name: 'Muokkaa kokoelmaa' });
const stepButtons = () => screen.queryAllByRole('button', { name: /^(Vähennä|Lisää) yksi kappale/ });

describe('CatalogView: edit switch (T-040)', () => {
  it('is off by default when the collection has cards: counts show, buttons do not', async () => {
    await renderView(withOwned([{ card: 'alpha', count: 2 }]));
    expect(editSwitch()).toHaveAttribute('aria-checked', 'false');
    expect(stepButtons()).toHaveLength(0);
    expect(screen.getByText(/Kokoelmassa/, { selector: '.visually-hidden' })).toBeInTheDocument();
  });

  it('is on by default for an empty collection and stays on after the first card is added', async () => {
    const user = userEvent.setup();
    await renderView(createMemoryRepositories());
    expect(editSwitch()).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getAllByRole('button', { name: /^Lisää/ }).at(0) as HTMLElement);
    await settle();
    expect(editSwitch()).toHaveAttribute('aria-checked', 'true');
    expect(stepButtons().length).toBeGreaterThan(0);
  });

  it('shows the buttons when switched on and remembers the choice', async () => {
    const user = userEvent.setup();
    const repositories = withOwned([{ card: 'alpha', count: 1 }]);
    await renderView(repositories);
    await user.click(editSwitch());
    expect(editSwitch()).toHaveAttribute('aria-checked', 'true');
    expect(stepButtons()).toHaveLength(4);
    expect(await repositories.preferences.loadEditMode()).toBe(true);
  });

  it('uses the saved choice, also "off" for an empty collection', async () => {
    const repositories = createMemoryRepositories();
    await repositories.preferences.saveEditMode(false);
    await renderView(repositories);
    expect(editSwitch()).toHaveAttribute('aria-checked', 'false');
    expect(stepButtons()).toHaveLength(0);
  });
});

describe('CatalogView: view selector and table (T-040)', () => {
  it('shows the grid by default and switches to a table that is remembered', async () => {
    const user = userEvent.setup();
    const repositories = withOwned([{ card: 'alpha', count: 3 }]);
    await renderView(repositories);
    expect(screen.getByRole('radio', { name: 'Ruudukko' })).toBeChecked();
    expect(screen.queryByRole('table')).toBeNull();

    await user.click(screen.getByRole('radio', { name: 'Taulukko' }));
    expect(screen.getByRole('table', { name: 'Kaikki kortit' })).toBeInTheDocument();
    expect(await repositories.preferences.loadView()).toBe('table');
  });

  it('starts in the saved table view', async () => {
    const repositories = withOwned([]);
    await repositories.preferences.saveView('table');
    await renderView(repositories);
    expect(screen.getByRole('radio', { name: 'Taulukko' })).toBeChecked();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('has the required columns, a focusable named scroll region and one row per card', async () => {
    const repositories = withOwned([{ card: 'alpha', count: 1 }]);
    await repositories.preferences.saveView('table');
    await renderView(repositories);
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Kuva', 'Nimi', 'Tyyppi', 'Rarity', 'Cost', 'Power', 'RAM', 'Kokoelma']);
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

    await user.click(editSwitch());
    expect(stepButtons()).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
