import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { card, storedCollection } from './deckTestUtils';

const RETAIL = 'Welcome to Night City — Retail';
const pad = (n: number) => String(n).padStart(3, '0');
// Eleven cards in the Retail set, listed in reverse so the collector number order has to be applied.
const cards: Card[] = Array.from({ length: 11 }, (_, i) => 11 - i).map((n) =>
  card(`c${n}`, {
    name: `Card ${n}`,
    displayName: `Card ${n}`,
    printings: [{ key: `wtnc:${pad(n)}`, setCode: 'wtnc', setName: RETAIL, number: pad(n), rarity: 'Common', language: 'en', artist: null, imageKey: `c${n}` }],
  }),
);

async function renderBinder(entries: [string, number][], repositories: Repositories = createMemoryRepositories({ initial: storedCollection(entries) })) {
  window.location.hash = '#/kokoelma';
  render(<App cards={cards} repositories={repositories} />);
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
  await userEvent.click(await screen.findByRole('radio', { name: /^(Kansio|Binder)$/ }));
  return repositories;
}

const pockets = () => screen.getAllByRole('listitem').filter((item) => item.classList.contains('pocket'));

describe('CollectionBinder', () => {
  it('shows nine pockets a page in collector number order, owned and missing told apart', async () => {
    await renderBinder([['c1', 2], ['c3', 1]]);
    expect(pockets()).toHaveLength(9);
    const links = pockets().map((item) => within(item).getByRole('link').getAttribute('aria-label'));
    expect(links[0]).toMatch(/^#001 Card 1, (omistettu|owned) 2$/);
    expect(links[1]).toMatch(/^#002 Card 2, (puuttuu|missing)$/);
    expect(links[2]).toMatch(/^#003 Card 3, (omistettu|owned) 1$/);
    expect(within(pockets()[0] as HTMLElement).getByRole('link')).toHaveAttribute('href', '#/kortti/c1');
    expect(screen.getByText(/Sivu 1 \/ 2|Page 1 \/ 2/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^(Sivu|Page) 1$/ })).toBeInTheDocument();
  });

  it('turns the page with the buttons and the arrow keys, and announces it', async () => {
    await renderBinder([['c1', 1]]);
    await userEvent.click(screen.getByRole('button', { name: /Seuraava sivu|Next page/ }));
    expect(pockets()).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(/Sivu 2 \/ 2|Page 2 \/ 2/);
    const book = screen.getByRole('group', { name: /Keräilykansion sivut|Binder pages/ });
    book.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('status')).toHaveTextContent(/Sivu 1 \/ 2|Page 1 \/ 2/);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('status')).toHaveTextContent(/Sivu 2 \/ 2|Page 2 \/ 2/);
  });

  it('hides the missing cards on request and remembers the choices', async () => {
    const repositories = await renderBinder([['c1', 1], ['c5', 3]]);
    await userEvent.click(screen.getByRole('checkbox', { name: /Näytä puuttuvat|Show missing/ }));
    expect(pockets()).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(/Sivu 1 \/ 1|Page 1 \/ 1/);
    expect(await repositories.preferences.loadCollectionPrefs()).toEqual({ view: 'binder', art: 'base', showMissing: false });
  });

  it('opens on the binder when it was the last choice', async () => {
    const repositories = createMemoryRepositories({ initial: storedCollection([['c1', 1]]) });
    await repositories.preferences.saveCollectionPrefs({ view: 'binder', art: 'owned', showMissing: true });
    window.location.hash = '#/kokoelma';
    render(<App cards={cards} repositories={repositories} />);
    expect(await screen.findAllByRole('link', { name: /#001 Card 1/ })).toHaveLength(1);
    expect(screen.getByRole('radio', { name: /Omistamasi kuvitus|Show owned art/ })).toBeChecked();
  });
});
