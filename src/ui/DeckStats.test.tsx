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
  it('shows the summary, distributions and the draw odds table', async () => {
    renderStats(fullDeck);
    const summary = screen.getByText('Keskihinta').closest('dl') as HTMLElement;
    expect(summary).toHaveTextContent('Keskihinta1,0');
    expect(summary).toHaveTextContent('Kortteja42');
    expect(screen.getByText('Power-jakauma (Unitit)')).toBeInTheDocument();
    expect(screen.getByText('1 × 42')).toBeInTheDocument();
    expect(screen.getByText(/aloituskädessä:/)).toHaveTextContent(
      'Vähintään yksi Cost ≤ 2 -kortti aloituskädessä: 100 %',
    );
    expect(screen.queryByRole('table', { name: /Todennäköisyys/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Nostotodennäköisyydet', { selector: 'summary' }));
    const table = await screen.findByRole('table', {
      name: 'Todennäköisyys nostaa vähintään yksi kopio',
    });
    const firstRow = within(table).getAllByRole('row')[1] as HTMLElement;
    // 3 copies in 42 cards: 6, 7, 9 and 11 cards seen.
    expect(
      within(firstRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['3', '38 %', '43 %', '52 %', '61 %']);
  });

  it('shows dashes for an empty deck and disables the test hand', () => {
    renderStats(emptyDeck);
    expect(screen.getAllByText('ei tietoa')).toHaveLength(2);
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
