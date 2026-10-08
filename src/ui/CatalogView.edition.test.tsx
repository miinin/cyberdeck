import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import type { Printing } from '../domain/printing';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { CatalogView } from './CatalogView';
import { resetEditionConfirmed } from './EditionConfirmDialog';

const COLLECTION_KEY = 'cyberdeck:collection';
const EDITION_KEY = 'cyberdeck:default-edition';
const BETA = 'welcometonightcitybeta:005a';
const RETAIL = 'welcometonightcityretail:005a';
const ICONIC = 'welcometonightcitybeta:144';

function p(setCode: string, setName: string, number: string, rarity: string): Printing {
  return { key: `${setCode}:${number.replace('β', '')}`, setCode, setName, number, rarity, language: 'en', artist: null, imageKey: '' };
}
function card(key: string, name: string, printings: Printing[]): Card {
  return { id: `id-${key}`, key, slug: key, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 2, power: null, ram: null, rarity: 'Rare', printings };
}

const wtnc = card('alpha', 'Alpha', [
  p('welcometonightcityretail', 'Welcome to Night City — Retail', '005a', 'Rare'),
  p('welcometonightcitybeta', 'Welcome to Night City — Beta', 'β005a', 'Rare'),
  p('welcometonightcitybeta', 'Welcome to Night City — Beta', 'β144', 'Iconic Legend'),
]);
const promo = card('bravo', 'Bravo', [p('set1promos', 'Set 1 Promos', '001', 'Promo')]);
const cards = [wtnc, promo];

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

async function renderView(repositories: Repositories, edit = true) {
  await repositories.preferences.saveEditMode(edit);
  render(<CatalogView cards={cards} repositories={repositories} headerSlot={null} />);
  await settle();
}

const stored = (entries: unknown[]) => JSON.stringify({ schemaVersion: 3, savedAt: '2026-10-06T10:00:00.000Z', data: { entries } });
const box = (name: string) => {
  const heading = within(screen.getByRole('list')).getAllByRole('heading', { level: 3 }).find((h) => h.textContent === name);
  const li = heading?.closest('li');
  if (!li) throw new Error(`No box for ${name}`);
  return li;
};
const plus = (name: string) => within(box(name)).getByRole('button', { name: `Lisää yksi kappale: ${name}` });
const minus = (name: string) => within(box(name)).getByRole('button', { name: `Vähennä yksi kappale: ${name}` });
const saved = async (repositories: Repositories) => (await repositories.collection.load()).value.entries;

beforeEach(() => {
  resetEditionConfirmed();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('CatalogView: default edition (D-022)', () => {
  it('offers Beta and Retail while editing, Beta chosen first', async () => {
    await renderView(createMemoryRepositories());
    const group = screen.getByRole('group', { name: 'Painos' });
    expect(within(group).getByRole('radio', { name: 'Beta' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'Retail' })).not.toBeChecked();
  });

  it('is left out while browsing', async () => {
    await renderView(createMemoryRepositories(), false);
    expect(screen.queryByRole('group', { name: 'Painos' })).toBeNull();
  });

  it('+ adds the first copy to Beta, and the choice of Retail is kept for the next visit', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await renderView(repositories);
    await user.click(plus('Alpha'));
    await user.click(within(screen.getByRole('dialog', { name: 'Lisätäänkö Beta vai Retail?' })).getByRole('button', { name: 'Lisää Beta' }));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'alpha', count: 1, versions: { [BETA]: 1 } }]);

    await user.click(screen.getByRole('radio', { name: 'Retail' }));
    await settle();
    await user.click(plus('Alpha'));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'alpha', count: 2, versions: { [BETA]: 1, [RETAIL]: 1 } }]);
    expect(await repositories.preferences.loadDefaultEdition()).toBe('retail');
  });

  it('starts from the saved edition', async () => {
    const repositories = createMemoryRepositories({ initial: { [EDITION_KEY]: 'retail' } });
    await renderView(repositories);
    expect(screen.getByRole('radio', { name: 'Retail' })).toBeChecked();
  });

  it('− takes from the default edition first, then the copies without an edition, and never an Iconic copy', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories({
      initial: { [COLLECTION_KEY]: stored([{ card: 'alpha', count: 5, versions: { [BETA]: 1, [RETAIL]: 1, [ICONIC]: 1 } }]) },
    });
    await renderView(repositories);
    await user.click(minus('Alpha'));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'alpha', count: 4, versions: { [RETAIL]: 1, [ICONIC]: 1 } }]);
    await user.click(minus('Alpha'));
    await settle();
    await user.click(minus('Alpha'));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'alpha', count: 2, versions: { [RETAIL]: 1, [ICONIC]: 1 } }]);
    await user.click(minus('Alpha'));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'alpha', count: 1, versions: { [ICONIC]: 1 } }]);
    expect(minus('Alpha')).toBeDisabled();
  });

  it('a card without a Welcome to Night City printing counts as before', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await renderView(repositories);
    await user.click(plus('Bravo'));
    await settle();
    await user.click(plus('Bravo'));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'bravo', count: 2 }]);
    await user.click(minus('Bravo'));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'bravo', count: 1 }]);
  });
});

describe('CatalogView: edition check before the first add (T-101)', () => {
  const dialogName = 'Lisätäänkö Beta vai Retail?';

  it('asks before the first add, with the β hint, and adds to the chosen edition', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await renderView(repositories);
    await user.click(plus('Alpha'));
    const dialog = screen.getByRole('dialog', { name: dialogName });
    expect(within(dialog).getByText('Beta-kortin numeron edessä on β (esim. β005a), Retail-kortissa ei.')).toBeInTheDocument();
    expect(await saved(repositories)).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: 'Lisää Retail' }));
    await settle();
    expect(await saved(repositories)).toEqual([{ card: 'alpha', count: 1, versions: { [RETAIL]: 1 } }]);
    expect(await repositories.preferences.loadDefaultEdition()).toBe('retail');
    expect(screen.queryByRole('dialog', { name: dialogName })).toBeNull();
  });

  it('does not ask again in the same session', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await renderView(repositories);
    await user.click(plus('Alpha'));
    await user.click(screen.getByRole('button', { name: 'Lisää Beta' }));
    await settle();
    await user.click(plus('Alpha'));
    await settle();
    expect(screen.queryByRole('dialog', { name: dialogName })).toBeNull();
    expect(await saved(repositories)).toEqual([{ card: 'alpha', count: 2, versions: { [BETA]: 2 } }]);
  });

  it('Peruuta adds nothing and the question stays for the next add', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await renderView(repositories);
    await user.click(plus('Alpha'));
    await user.click(screen.getByRole('button', { name: 'Peruuta' }));
    await settle();
    expect(await saved(repositories)).toEqual([]);
    await user.click(plus('Alpha'));
    expect(screen.getByRole('dialog', { name: dialogName })).toBeInTheDocument();
  });

  it('is not asked for a card without both editions', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await renderView(repositories);
    await user.click(plus('Bravo'));
    await settle();
    expect(screen.queryByRole('dialog', { name: dialogName })).toBeNull();
    expect(await saved(repositories)).toEqual([{ card: 'bravo', count: 1 }]);
  });

  it('is not asked when removing', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories({
      initial: { [COLLECTION_KEY]: stored([{ card: 'alpha', count: 2, versions: { [BETA]: 2 } }]) },
    });
    await renderView(repositories);
    await user.click(minus('Alpha'));
    await settle();
    expect(screen.queryByRole('dialog', { name: dialogName })).toBeNull();
  });
});

describe('CatalogView: set filter groups (D-022)', () => {
  it('lists the sets (Retail and Beta apart) before the other products', async () => {
    await renderView(createMemoryRepositories());
    const select = screen.getByLabelText('Setti / versio');
    const groups = Array.from(select.querySelectorAll('optgroup')).map((g) => [
      g.label,
      Array.from(g.querySelectorAll('option')).map((o) => o.textContent),
    ]);
    expect(groups).toEqual([
      ['Setit', ['Welcome to Night City', 'Welcome to Night City (Beta)']],
      ['Muut tuotteet', ['Set 1 Promos']],
    ]);
    fireEvent.change(select, { target: { value: 'welcome-to-night-city-beta' } });
    expect(within(screen.getByRole('list')).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Alpha']);
    expect(screen.getByText('Setti: Welcome to Night City (Beta)')).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'set-1-promos' } });
    expect(screen.getByText('Tuote: Set 1 Promos')).toBeInTheDocument();
  });
});
