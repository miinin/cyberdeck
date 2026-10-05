import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { App } from '../App';

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
    await renderView();
    expect(screen.getByRole('heading', { level: 1, name: 'Have/Want' })).toBeInTheDocument();
    expect(screen.getByText(/Want-listalla ei ole vielä kortteja/)).toBeInTheDocument();
    expect(screen.getByText(/Sinulla ei ole vielä vaihdettavia kortteja/)).toBeInTheDocument();
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

  it('adds a card to the want list by searching its name, then edits the count separately from the collection', async () => {
    const user = userEvent.setup();
    const repositories = await renderView();
    await user.type(screen.getByLabelText('Hae kortin nimellä'), 'gamma');
    await user.click(screen.getByRole('button', { name: 'Lisää wantiin: Gamma Ray' }));
    await settle();
    expect(await wantEntries(repositories)).toEqual([{ card: 'gamma', count: 1 }]);
    await user.click(addWant('Gamma Ray'));
    await user.click(addWant('Gamma Ray'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([{ card: 'gamma', count: 3 }]);
    expect((await repositories.collection.load()).value.entries).toEqual([]);
    expect(document.querySelector('.playset-mark')).toBeNull();
    await user.click(removeWant('Gamma Ray'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([{ card: 'gamma', count: 2 }]);
  });

  it('says so when the search finds nothing', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.type(screen.getByLabelText('Hae kortin nimellä'), 'zzzz');
    expect(screen.getByText('Hakua vastaavia kortteja ei löytynyt.')).toBeInTheDocument();
  });

  it('lists the want list cards and drops a row, moving focus to the Want heading, when its count reaches 0', async () => {
    const user = userEvent.setup();
    const repositories = await renderView(createMemoryRepositories({ initial: stored('cyberdeck:wants', [['beta', 1]]) }));
    const list = screen.getAllByRole('list')[0] as HTMLElement;
    expect(within(list).getAllByText('Beta').length).toBeGreaterThan(0);
    await user.click(removeWant('Beta'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([]);
    expect(screen.getByRole('heading', { level: 2, name: 'Want' })).toHaveFocus();
    expect(screen.getByText(/Want-listalla ei ole vielä kortteja/)).toBeInTheDocument();
  });

  it('lists only the tradeable copies of the collection, as text', async () => {
    // Alpha: 5 owned, playset 3, so 2 free. Beta: 3 owned, 0 free.
    await renderView(
      createMemoryRepositories({ initial: stored('cyberdeck:collection', [['alpha', 5], ['beta', 3]]) }),
    );
    const section = screen.getByRole('region', { name: 'Have' });
    expect(within(section).getByText('Alpha')).toBeInTheDocument();
    expect(within(section).getByText('vaihdettavissa 2')).toBeInTheDocument();
    expect(within(section).queryByText('Beta')).toBeNull();
    expect(within(section).queryByRole('button')).toBeNull();
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
    await renderView(
      createMemoryRepositories({
        initial: { ...stored('cyberdeck:wants', [['beta', 2]]), ...stored('cyberdeck:collection', [['alpha', 5]]) },
      }),
    );
    const want = screen.getByRole('region', { name: 'Want' });
    expect(within(want).getByRole('list', { name: 'Want' })).toHaveClass('card-grid');
    expect(within(want).getByRole('button', { name: 'Lisää wantiin yksi kappale: Beta' })).toBeInTheDocument();
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
});
