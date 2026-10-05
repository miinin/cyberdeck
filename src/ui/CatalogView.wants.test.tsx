import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { CatalogView } from './CatalogView';
import { ANNOUNCE_DELAY_MS } from './useDelayedAnnouncement';

function card(slug: string, name: string): Card {
  return { id: `id-${slug}`, key: slug, slug, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 2, power: null, ram: null, rarity: null };
}
const cards = [card('alpha', 'Alpha'), card('beta', 'Beta')];

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

async function renderView(repositories: Repositories = createMemoryRepositories(), view: 'grid' | 'table' = 'grid') {
  await repositories.preferences.saveEditMode(true);
  await repositories.preferences.saveView(view);
  const slot = document.createElement('div');
  document.body.appendChild(slot);
  render(<CatalogView cards={cards} repositories={repositories} headerSlot={slot} />);
  await settle();
  return repositories;
}

const wantEntries = async (repositories: Repositories) => (await repositories.wants.load()).value.entries;
const addWant = (name: string) => screen.getByRole('button', { name: `Lisää wantiin yksi kappale: ${name}` });
const removeWant = (name: string) => screen.getByRole('button', { name: `Vähennä wantista yksi kappale: ${name}` });

describe('CatalogView want list (T-064b)', () => {
  it.each(['grid', 'table'] as const)('edits the want count separately from the collection in the %s view', async (view) => {
    const user = userEvent.setup();
    const repositories = await renderView(undefined, view);
    await user.click(addWant('Alpha'));
    await user.click(addWant('Alpha'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([{ card: 'alpha', count: 2 }]);
    expect((await repositories.collection.load()).value.entries).toEqual([]);
    await user.click(removeWant('Alpha'));
    await settle();
    expect(await wantEntries(repositories)).toEqual([{ card: 'alpha', count: 1 }]);
  });

  it('has no playset mark on the want count', async () => {
    const user = userEvent.setup();
    await renderView();
    for (let i = 0; i < 3; i += 1) await user.click(addWant('Alpha'));
    expect(document.querySelector('.playset-mark')).toBeNull();
  });

  it('filters to the cards on the want list and keeps a row until the filter changes', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories({
      initial: {
        'cyberdeck:wants': JSON.stringify({
          schemaVersion: 1,
          savedAt: '2026-10-01T10:00:00.000Z',
          data: { entries: [{ card: 'beta', count: 1 }] },
        }),
      },
    });
    await renderView(repositories);
    await user.click(screen.getByRole('radio', { name: 'Want' }));
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Beta']);
    await user.click(removeWant('Beta'));
    await settle();
    expect(within(list).getByRole('heading', { level: 3, name: 'Beta' })).toBeInTheDocument();
  });

  it('guides when the want filter is on and the list is empty', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.click(screen.getByRole('radio', { name: 'Want' }));
    expect(screen.getByText(/Want-listalla ei ole vielä kortteja/)).toBeInTheDocument();
  });

  it('announces the saved want count', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await renderView();
      await user.click(addWant('Alpha'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY_MS + 100);
      });
      expect(screen.getByText('Alpha: 1 kappale wantissa.')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
