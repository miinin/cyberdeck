import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { App } from '../App';
import { CARDS } from '../data/cards';
import { variantImageUrl } from '../data/variantImages';

function card(slug: string, name: string): Card {
  return { id: `id-${slug}`, key: slug, slug, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 2, power: null, ram: null, rarity: null };
}
const cards = [card('alpha', 'Alpha'), card('beta', 'Beta'), card('gamma', 'Gamma Ray')];

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

async function renderView(repositories: Repositories = createMemoryRepositories(), hash = '#/vaihto') {
  window.location.hash = hash;
  render(<App cards={cards} repositories={repositories} />);
  await settle();
  return repositories;
}

const stored = (key: string, entries: [string, number][]) => ({
  [key]: JSON.stringify({
    schemaVersion: 1,
    savedAt: '2026-10-01T10:00:00.000Z',
    data: { entries: entries.map(([card, count]) => ({ card, count })) },
  }),
});
const wantEntries = async (repositories: Repositories) => (await repositories.wants.load()).value.entries;
const addWant = (name: string) => screen.getByRole('button', { name: `Lisää wantiin yksi kappale: ${name}` });
const removeWant = (name: string) => screen.getByRole('button', { name: `Vähennä wantista yksi kappale: ${name}` });

describe('Have/Want section (T-065)', () => {
  it('shows the heading, the empty states and the nav link as the current page', async () => {
    const user = userEvent.setup();
    await renderView();
    expect(screen.getByRole('heading', { level: 1, name: 'Have/Want' })).toBeInTheDocument();
    // An empty want list opens on all cards to add from.
    expect(screen.getByRole('radio', { name: 'Lisää kortteja' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Want-lista' }));
    expect(screen.getByText(/Lista on tyhjä/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Have (0)' }));
    expect(screen.getByText(/Ei vaihdettavia kortteja/)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /päävalikko|sivut|valikko/i });
    expect(within(nav).getByRole('link', { name: 'Have/Want' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Pakat' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Kortit' })).not.toHaveAttribute('aria-current');
  });

  it('keeps the Have/Want link current and Pakat not current on a shared trade link', async () => {
    await renderView(undefined, '#/vaihto/not-valid');
    expect(screen.getByRole('heading', { level: 1, name: 'Linkki ei toimi' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /päävalikko|sivut|valikko/i });
    expect(within(nav).getByRole('link', { name: 'Have/Want' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Pakat' })).not.toHaveAttribute('aria-current');
  });

  it('adds a card to the want list from all cards with the search, then edits the count separately from the collection (T-135)', async () => {
    const user = userEvent.setup();
    const repositories = await renderView();
    await user.type(screen.getByRole('searchbox'), 'gamma');
    expect(screen.queryByRole('button', { name: 'Lisää wantiin yksi kappale: Alpha' })).toBeNull();
    await user.click(addWant('Gamma Ray'));
    await user.click(addWant('Gamma Ray'));
    await user.click(addWant('Gamma Ray'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([{ card: 'gamma', count: 3 }]);
    expect((await repositories.collection.load()).value.entries).toEqual([]);
    expect(document.querySelector('.playset-mark')).toBeNull();
    await user.click(removeWant('Gamma Ray'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([{ card: 'gamma', count: 2 }]);
    expect(screen.getByRole('radio', { name: 'Want (1)' })).toBeChecked();
  });

  it('says so when the search finds nothing', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    expect(screen.getByText('Hakua vastaavia kortteja ei löytynyt.')).toBeInTheDocument();
  });

  it('lists the want list cards and drops a row, moving focus to the Want heading, when its count reaches 0', async () => {
    const user = userEvent.setup();
    const repositories = await renderView(createMemoryRepositories({ initial: stored('cyberdeck:wants', [['beta', 1]]) }));
    expect(screen.getByRole('radio', { name: 'Want-lista' })).toBeChecked();
    expect(screen.queryByRole('button', { name: 'Lisää wantiin yksi kappale: Alpha' })).toBeNull();
    await user.click(removeWant('Beta'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([]);
    expect(screen.getByRole('heading', { level: 2, name: 'Want' })).toHaveFocus();
    expect(screen.getByText(/Lista on tyhjä/)).toBeInTheDocument();
  });

  it('lists only the tradeable copies of the collection, as text, by the trade rule the user picks (T-135)', async () => {
    const user = userEvent.setup();
    // Alpha: 5 owned, playset 3, so 2 free. Beta: 3 owned, 0 free.
    const repositories = await renderView(createMemoryRepositories({ initial: stored('cyberdeck:collection', [['alpha', 5], ['beta', 3]]) }));
    await user.click(screen.getByRole('radio', { name: 'Have (1)' }));
    const section = screen.getByRole('region', { name: 'Have' });
    expect(within(section).getByText('Alpha')).toBeInTheDocument();
    expect(within(section).getByText('vaihdettavissa 2')).toBeInTheDocument();
    expect(within(section).queryByText('Beta')).toBeNull();
    // Keep one copy: Alpha 4 and Beta 2 are tradeable, and the rule is remembered.
    await user.click(within(section).getByRole('radio', { name: 'Yli 1 kappaleen' }));
    expect(within(section).getByText('vaihdettavissa 4')).toBeInTheDocument();
    expect(within(section).getByText('vaihdettavissa 2')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Have (2)' })).toBeChecked();
    await settle();
    expect(await repositories.preferences.loadTradeRule()).toEqual({ keep: 'one', keepDeckCards: false });
  });

  it('shows the cards as a list with the counts in their own column (T-135)', async () => {
    const user = userEvent.setup();
    await renderView(createMemoryRepositories({ initial: stored('cyberdeck:wants', [['beta', 2]]) }));
    await user.click(screen.getByRole('radio', { name: 'Lista' }));
    expect(screen.getByRole('columnheader', { name: 'Wantissa' })).toBeInTheDocument();
    expect(addWant('Beta')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Kuvakoko' })).toBeDisabled();
  });

  it('has the trade share button at the top', async () => {
    await renderView();
    expect(screen.getByRole('button', { name: 'Jaa Have/Want' })).toBeInTheDocument();
  });

  it('announces the saved want count', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await renderView(createMemoryRepositories({ initial: stored('cyberdeck:wants', [['alpha', 1]]) }));
      await user.click(addWant('Alpha'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(screen.getByText('Alpha: 2 kappaletta wantissa.')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Have/Want card grid (T-067)', () => {
  it('shows the want and have cards as grids with a want counter and the owned count', async () => {
    const user = userEvent.setup();
    await renderView(
      createMemoryRepositories({
        initial: { ...stored('cyberdeck:wants', [['beta', 2]]), ...stored('cyberdeck:collection', [['alpha', 5]]) },
      }),
    );
    const want = screen.getByRole('region', { name: 'Want' });
    expect(within(want).getByRole('list', { name: 'Want' })).toHaveClass('card-grid');
    expect(within(want).getByRole('button', { name: 'Lisää wantiin yksi kappale: Beta' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Have (1)' }));
    const have = screen.getByRole('region', { name: 'Have' });
    expect(within(have).getByRole('list', { name: 'Have' })).toHaveClass('card-grid');
    expect(within(have).getByText('omistettu 5', { exact: false })).toBeInTheDocument();
  });

  it('sorts both lists and changes the image size', async () => {
    const user = userEvent.setup();
    await renderView(createMemoryRepositories({ initial: stored('cyberdeck:wants', [['alpha', 1], ['beta', 1]]) }));
    const want = screen.getByRole('region', { name: 'Want' });
    const names = () => within(want).getAllByRole('heading', { level: 3 }).map((h) => h.textContent).filter((t) => t === 'Alpha' || t === 'Beta');
    expect(names()).toEqual(['Alpha', 'Beta']);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Suunta' }), 'desc');
    expect(names()).toEqual(['Beta', 'Alpha']);
    await user.click(screen.getByRole('radio', { name: 'Iso' }));
    expect(document.querySelector('.have-want-results')).toHaveAttribute('data-image-size', 'large');
  });

  it('keeps the guidance in (i) tips instead of permanent paragraphs', async () => {
    const user = userEvent.setup();
    await renderView();
    expect(screen.getByText(/Kokoa tähän kortit/)).not.toBeVisible();
    const [pageTip] = screen.getAllByRole('button', { name: 'Ohje' });
    expect(pageTip).toHaveAttribute('aria-expanded', 'false');
    await user.click(pageTip as HTMLElement);
    expect(pageTip).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Kokoa tähän kortit/)).toBeVisible();
    await user.keyboard('{Escape}');
    expect(pageTip).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/Kokoa tähän kortit/)).not.toBeVisible();
  });
});

describe('Have/Want arts (T-141)', () => {
  it('shows the Nova Rare art of a card when the Nova Rare filter is on, as on the Cards page', async () => {
    const card = CARDS.find((c) => c.rarity !== 'Nova Rare' && variantImageUrl(c.key, 'Nova Rare') !== null);
    if (card === undefined) throw new Error('no card with a Nova Rare art in the data');
    window.location.hash = '#/vaihto';
    render(<App cards={[card]} repositories={createMemoryRepositories()} />);
    await settle();
    const nova = screen.getByRole('checkbox', { name: /Nova Rare/, hidden: true });
    act(() => nova.click());
    await settle();
    const images = [...document.querySelectorAll('.card-grid img')].map((img) => img.getAttribute('src'));
    expect(images).toContain(variantImageUrl(card.key, 'Nova Rare'));
  });
});
