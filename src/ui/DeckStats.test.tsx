import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DeckContent } from '../domain/deck';
import { colorDistribution, costCurve, groupDeck, toCardsByKey } from '../domain/deckRules';
import type { Rng } from '../domain/testHand';
import { DeckStats } from './DeckStats';
import { legendCards, testCards, unitCards } from './deckTestUtils';

/** Seeded linear congruential generator, so the dealt hand is the same every run. */
function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const cardsByKey = toCardsByKey(testCards);

function renderStats(deck: DeckContent) {
  const grouped = groupDeck(deck, cardsByKey);
  const mainCount = grouped.groups.reduce((sum, group) => sum + group.rows.reduce((n, row) => n + row.count, 0), 0);
  return render(
    <DeckStats
      deck={deck}
      cardsByKey={cardsByKey}
      curve={costCurve(deck, cardsByKey)}
      colors={colorDistribution(deck, cardsByKey)}
      groups={grouped.groups}
      mainCount={mainCount}
      ramLimitsText=""
      missingText=""
      rng={lcg(5)}
    />,
  );
}

const fullDeck: DeckContent = {
  name: 'Testi',
  sections: [
    {
      name: '',
      cards: [
        ...legendCards.map((c) => ({ card: c.key, count: 1 })),
        ...unitCards.map((c) => ({ card: c.key, count: 3 })),
      ],
    },
  ],
};
const emptyDeck: DeckContent = {
  name: 'Tyhjä',
  sections: [{ name: '', cards: [] }],
};

describe('DeckStats (T-053)', () => {
  it('shows the overview, the charts as text and the draw odds per moment (T-093)', () => {
    renderStats(fullDeck);
    const summary = screen.getByText('Keskihinta').closest('dl') as HTMLElement;
    expect(summary).toHaveTextContent('Keskihinta1,0');
    expect(summary).toHaveTextContent('Halpa aloitus100 %');
    expect(screen.getByText('Pääpakassa 42 korttia, sallittu 40–50.')).toBeInTheDocument();
    expect(screen.getByText('Power-jakauma (Unitit)')).toBeInTheDocument();
    expect(screen.getByText('1 × 42')).toBeInTheDocument();

    // The Cost bars are buttons; one shows its cards under the chart.
    const bar = screen.getByRole('button', { name: 'Cost 1: 42 korttia' });
    expect(screen.getByText('Napauta pylvästä, niin näet sen kortit.')).toBeInTheDocument();
    fireEvent.click(bar);
    expect(bar).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Cost 1 · 42 korttia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cost 0: 0 korttia' })).toBeDisabled();

    // 3 copies in 42 cards: 6, 7, 9 and 11 cards seen.
    const odds = () => Array.from(document.querySelectorAll('.odds-bar-pct'), (el) => el.textContent);
    expect(odds()[0]).toBe('38 %');
    fireEvent.click(screen.getByRole('radio', { name: 'Vuoro 1' }));
    expect(odds()[0]).toBe('43 %');
    fireEvent.click(screen.getByRole('radio', { name: 'Vuoro 5' }));
    expect(odds()[0]).toBe('61 %');
  });

  // T-096: sellable cards against the recommendation, and Eddies by turn.
  it('shows the Eddies card: sellable count, recommendation and the turn curve', () => {
    const sellableCards = toCardsByKey(testCards.map((c, i) => ({ ...c, eddiable: c.type !== 'Legend' && i % 2 === 0 })));
    const grouped = groupDeck(fullDeck, sellableCards);
    render(
      <DeckStats deck={fullDeck} cardsByKey={sellableCards} colors={colorDistribution(fullDeck, sellableCards)} groups={grouped.groups} mainCount={42} missingText="" rng={lcg(5)} />,
    );
    expect(screen.getByRole('heading', { name: 'Eddiet (€$)' })).toBeInTheDocument();
    expect(screen.getByText(/^Pakassa on \d+ myytävää korttia, suositus noin \d+\.$/)).toBeInTheDocument();
    expect(screen.getByText(/^Vuoro 1: keskimäärin/)).toBeInTheDocument();
    expect(screen.getByText(/^Myynti joka vuoro vuoroon 2 asti:/)).toBeInTheDocument();
  });

  it('shows dashes for an empty deck and disables the test hand', () => {
    renderStats(emptyDeck);
    expect(screen.getAllByText('ei tietoa')).toHaveLength(3);
    const open = screen.getByRole('button', { name: 'Nosta testikäsi' });
    expect(open).toBeDisabled();
    expect(open).toHaveAccessibleDescription('Lisää pakkaan kortteja, niin voit nostaa testikäden.');
  });

  it('deals a hand, draws a card and allows one mulligan', () => {
    renderStats(fullDeck);
    const open = screen.getByRole('button', { name: 'Nosta testikäsi' });
    fireEvent.click(open);
    const dialog = screen.getByRole('dialog', { name: 'Testikäsi' });
    const hand = () => within(dialog).getByRole('list', { name: /^Käsi/ });
    expect(within(hand()).getAllByRole('img')).toHaveLength(6);
    expect(hand()).toHaveAccessibleName('Käsi, 6 korttia');
    expect(within(dialog).getByRole('button', { name: 'Nosta kortti' })).toHaveFocus();
    expect(dialog).toHaveTextContent('Kädessä 6 · Pakassa 36 · Mulligan: käyttämättä');
    expect(dialog).toHaveTextContent('Legendien järjestys:');
    expect(dialog).toHaveTextContent(/Uusi käsi: Unit \d+/);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Mulligan' }));
    expect(within(dialog).getByRole('button', { name: 'Mulligan käytetty' })).toBeDisabled();
    expect(dialog).toHaveTextContent('Mulligan tehty. Uusi käsi:');
    expect(dialog).toHaveTextContent('Mulligan: käytetty');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Nosta kortti' }));
    expect(within(hand()).getAllByRole('img')).toHaveLength(7);
    expect(dialog).toHaveTextContent(/Nostit: Unit \d+\. Kädessä 7 korttia\./);
    expect(within(hand()).getByText('(uusin)')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Uusi käsi' }));
    expect(within(hand()).getAllByRole('img')).toHaveLength(6);
    expect(within(dialog).getByRole('button', { name: 'Mulligan' })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Sulje' }));
    expect(open).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables the mulligan after a draw', () => {
    renderStats(fullDeck);
    fireEvent.click(screen.getByRole('button', { name: 'Nosta testikäsi' }));
    const dialog = screen.getByRole('dialog', { name: 'Testikäsi' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Nosta kortti' }));
    expect(within(dialog).getByRole('button', { name: 'Mulligan' })).toBeDisabled();
  });

  it('deals every card of a small deck and says so', () => {
    renderStats({
      name: 'Pieni',
      sections: [{ name: '', cards: [{ card: 'u1', count: 3 }] }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Nosta testikäsi' }));
    const dialog = screen.getByRole('dialog', { name: 'Testikäsi' });
    expect(dialog).toHaveTextContent('Kädessä 3 · Pakka on tyhjä');
    expect(dialog).toHaveTextContent('Pakassa on alle 6 korttia.');
    expect(dialog).toHaveTextContent('Ei Legendejä.');
    expect(within(dialog).getByRole('button', { name: 'Nosta kortti' })).toBeDisabled();
    // The first enabled action gets the focus instead.
    expect(within(dialog).getByRole('button', { name: 'Mulligan' })).toHaveFocus();
  });
});
