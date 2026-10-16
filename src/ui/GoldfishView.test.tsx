import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DeckContent } from '../domain/deck';
import { toCardsByKey } from '../domain/deckRules';
import type { Rng } from '../domain/testHand';
import { createMemoryRepositories } from '../storage';
import { GoldfishDeckPage, GoldfishView } from './GoldfishView';
import { card, legalCards, legendCards, renderRoute, storedDecks } from './deckTestUtils';

afterEach(cleanup);

function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

// Every main card costs 1 and has the sale mark, so the played path does not depend on the shuffle.
const mains = Array.from({ length: 16 }, (_, i) =>
  card(`m${i}`, { name: `Main ${i}`, displayName: `Main ${i}`, cost: 1, power: 12, eddiable: true }),
);
const cardsByKey = toCardsByKey([...legendCards, ...mains]);
const deck: DeckContent = {
  name: 'Solo',
  sections: [{ name: '', cards: [...legendCards, ...mains].map((c) => ({ card: c.key, count: 1 })) }],
};

function renderView(content: DeckContent = deck, onBack = vi.fn()) {
  const user = userEvent.setup();
  render(<GoldfishView deck={content} cardsByKey={cardsByKey} rng={lcg(7)} onBack={onBack} />);
  return { user, onBack };
}

const handButtons = () => screen.getAllByRole('button', { name: /^Valitse kortti/ });

describe('GoldfishView (T-172)', () => {
  it('shows the empty-deck message and the back button', async () => {
    const { user, onBack } = renderView({ name: 'Tyhjä', sections: [] });
    expect(screen.getByText(/Pakassa ei ole kortteja/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Takaisin pakkaan/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('plays the path: order, mulligan, keep, Gig, sell, play, attack, summary', async () => {
    const { user } = renderView();
    expect(screen.getByText(/Tilaa ei tallenneta/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aloitan toisena' }));

    // Opening hand: one mulligan.
    expect(screen.getByRole('heading', { name: 'Aloituskäsi' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mulligan' }));
    expect(screen.getByRole('button', { name: 'Mulligan käytetty' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Pidä käsi' }));

    // Turn 1: drew a seventh card; the main phase waits for the Gig and the d20 stays last.
    expect(screen.getByRole('heading', { name: 'Käsi (7)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lopeta vuoro' })).toBeDisabled();
    expect(screen.getByText(/Valitse Gig-noppa ja heitä se/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heitä d20' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Heitä d6' }));
    expect(screen.getAllByText(/Heitit d6:/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Heitä d6' })).toBeDisabled();

    // Sell the first card: 1 Eddie; a second sale is refused with the reason.
    await user.click(handButtons()[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Myy' }));
    expect(screen.getByRole('heading', { name: 'Käsi (6)' })).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
    await user.click(handButtons()[0] as HTMLElement);
    expect(screen.getByRole('button', { name: 'Myy' })).toBeDisabled();
    expect(screen.getByText('Jo myyty tällä vuorolla')).toBeInTheDocument();

    // Play a Unit for 1 $: it enters in Lag and cannot attack yet.
    await user.click(screen.getByRole('button', { name: /^Pelaa \(1 \$\)/ }));
    expect(screen.getByRole('heading', { name: 'Käsi (5)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Hyökkää/ })).toBeDisabled();
    expect(screen.getByText(/· Lag/)).toBeInTheDocument();

    // Next turn: the Unit is ready and attacks for 1 + floor(12 / 10) = 2 Gigs.
    await user.click(screen.getByRole('button', { name: 'Lopeta vuoro' }));
    expect(screen.getByRole('heading', { name: 'Käsi (6)' })).toBeInTheDocument();
    expect(screen.getByText('2/7')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Heitä d4' }));
    await user.click(screen.getByRole('button', { name: /^Hyökkää \(\+2 Gigiä\)/ }));
    expect(screen.getByRole('button', { name: /^Hyökkää/ })).toBeDisabled();
    expect(screen.getByText('Vuoroloki')).toBeInTheDocument();
    expect(screen.getAllByText(/^V\d:/)).toHaveLength(2);

    // End the game: the summary.
    await user.click(screen.getByRole('button', { name: 'Lopeta peli' }));
    const summary = screen.getByRole('heading', { name: 'Yhteenveto' }).closest('.gf-summary') as HTMLElement;
    expect(within(summary).getByText('vuorolla 1')).toBeInTheDocument();
    expect(within(summary).getByText('Peli lopetettu.')).toBeInTheDocument();
    await user.click(within(summary).getByRole('button', { name: 'Pelaa uudestaan' }));
    expect(screen.getByRole('heading', { name: 'Aloituskäsi' })).toBeInTheDocument();
  });

  it('invokes a Legend once a turn and gives the reason afterwards', async () => {
    const { user } = renderView();
    await user.click(screen.getByRole('button', { name: 'Aloitan toisena' }));
    await user.click(screen.getByRole('button', { name: 'Pidä käsi' }));
    await user.click(screen.getByRole('button', { name: 'Heitä d4' }));
    await user.click(screen.getByRole('button', { name: 'Kutsu Legendi (1 $)' }));
    expect(screen.getByRole('button', { name: 'Kutsu Legendi (1 $)' })).toBeDisabled();
    expect(screen.getByText('Jo kutsuttu tällä vuorolla')).toBeInTheDocument();
  });

  it('goes back to the choice of order from "Aloita alusta"', async () => {
    const { user } = renderView();
    await user.click(screen.getByRole('button', { name: 'Aloitan ensin' }));
    await user.click(screen.getByRole('button', { name: 'Pidä käsi' }));
    await user.click(screen.getByRole('button', { name: 'Aloita alusta' }));
    expect(screen.getByRole('button', { name: 'Aloitan ensin' })).toBeInTheDocument();
  });
});

describe('Goldfish route (T-172)', () => {
  it('opens the solo play of a stored deck', async () => {
    renderRoute(
      '#/pakat/a/goldfish',
      createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards: legalCards() }]) }),
    );
    expect(await screen.findByRole('button', { name: 'Aloitan ensin' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Oma pakka');
  });

  it('says so when the deck does not exist', async () => {
    render(
      <GoldfishDeckPage deckId="zzz" cards={[]} repository={createMemoryRepositories().decks} onBack={() => undefined} />,
    );
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Pakkaa ei löytynyt.'));
  });

  it('has a "Pelaa yksin" link in the deck statistics', async () => {
    renderRoute(
      '#/pakat/a',
      createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards: legalCards() }]) }),
    );
    const link = await screen.findByRole('link', { name: 'Pelaa yksin' });
    expect(link).toHaveAttribute('href', '#/pakat/a/goldfish');
  });
});
