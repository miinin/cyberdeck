import { describe, expect, it } from 'vitest';
import { SIDEBOARD_SECTION_NAME } from './deck';
import type { DeckContent } from './deck';
import { withDeckCount, withSideboardCount } from './deckEdit';
import { decodeDeckShare, encodeDeckShare } from './deckShare';
import { deckToJson, deckToText } from './deckExport';
import { parseDeckJson } from './deckJson';
import { allDeckCounts, deckCounts, deckTotals, sideboardCounts, toCardsByKey, validateDeck } from './deckRules';
import { parseDeckText } from './deckText';
import { CARDS } from './testCards';

const byKey = toCardsByKey(CARDS);
const [a, b] = CARDS.filter((c) => c.type !== 'Legend');
const legend = CARDS.find((c) => c.type === 'Legend');
if (a === undefined || b === undefined || legend === undefined) throw new Error('test cards');

const base: DeckContent = { name: 'D', sections: [{ name: '', cards: [{ card: a.key, count: 2 }] }] };

describe('sideboard section', () => {
  it('keeps the sideboard apart from the main deck counts and totals', () => {
    const deck = withSideboardCount(base, b.key, 3);
    expect(deck.sections.at(-1)?.name).toBe(SIDEBOARD_SECTION_NAME);
    expect(deckCounts(deck).has(b.key)).toBe(false);
    expect(sideboardCounts(deck).get(b.key)).toBe(3);
    expect(allDeckCounts(deck).get(b.key)).toBe(3);
    expect(deckTotals(deck, byKey).main).toBe(2);
  });

  it('withDeckCount never puts a card into the sideboard, and removing the last card drops the section', () => {
    const side = withSideboardCount(base, b.key, 1);
    expect(withDeckCount(side, b.key, 2).sections[0]?.cards).toContainEqual({ card: b.key, count: 2 });
    expect(withSideboardCount(side, b.key, 0).sections).toHaveLength(1);
  });

  it('requires exactly 7 cards when used, 0 is fine', () => {
    const sizeIssue = (deck: DeckContent) => validateDeck(deck, byKey).some((i) => i.type === 'sideboard-size');
    expect(sizeIssue(base)).toBe(false);
    expect(sizeIssue(withSideboardCount(base, b.key, 3))).toBe(true);
    expect(sizeIssue(withSideboardCount(base, b.key, 7))).toBe(false);
    expect(sizeIssue(withSideboardCount(base, b.key, 8))).toBe(true);
  });

  it('limits main plus sideboard to 3 copies and refuses Legends', () => {
    const over = withSideboardCount(base, a.key, 2);
    expect(validateDeck(over, byKey).some((i) => i.type === 'sideboard-copies')).toBe(true);
    const ok = withSideboardCount(base, a.key, 1);
    expect(validateDeck(ok, byKey).some((i) => i.type === 'sideboard-copies')).toBe(false);
    const withLegend = withSideboardCount(base, legend.key, 1);
    expect(validateDeck(withLegend, byKey).some((i) => i.type === 'sideboard-legend')).toBe(true);
  });

  it('round-trips through text, share link and JSON', () => {
    const deck = withSideboardCount(base, b.key, 2);
    const text = deckToText(deck, byKey);
    expect(text).toContain('// Sideboard (2)');
    const parsed = parseDeckText(text, CARDS);
    expect(parsed.ok && parsed.deck.sideboard?.map((r) => [r.card.key, r.count])).toEqual([[b.key, 2]]);
    expect(parsed.ok && parsed.deck.rows.map((r) => r.card.key)).toEqual([a.key]);

    const shared = decodeDeckShare(encodeDeckShare(deck, byKey)) ?? '';
    const sharedParsed = parseDeckText(shared, CARDS);
    expect(sharedParsed.ok && sharedParsed.deck.sideboard?.length).toBe(1);

    const json = parseDeckJson(deckToJson(deck, byKey), CARDS);
    expect(json.ok && json.deck.sideboard?.map((r) => [r.card.key, r.count])).toEqual([[b.key, 2]]);
    expect(json.ok && json.deck.rows).toHaveLength(1);
  });
});
