import type { CardKey } from './cardKey';
import { MAX_DECK_CARD_COUNT, MAX_DECK_NAME_LENGTH, SIDEBOARD_SECTION_NAME } from './deck';
import type { Deck, DeckContent, DeckSection } from './deck';
import { cleanText } from './validate';
import { currentDeckMessages } from './deckMessages';

/** Finnish default; the UI language's name comes from currentDeckMessages() (T-068). */
export const DEFAULT_DECK_NAME = 'Uusi pakka';

/** A deck with the single unnamed main section (T-013 keeps Legends and the rest in it). */
export function emptyDeckContent(name: string): DeckContent {
  return { name, sections: [{ name: '', cards: [] }] };
}

/** "Uusi pakka", then "Uusi pakka 2", "Uusi pakka 3", … the first one not already used. */
export function uniqueDeckName(existing: readonly string[], base: string = currentDeckMessages().defaultDeckName): string {
  const used = new Set(existing);
  if (!used.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base} ${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

export type DeckNameResult = { ok: true; name: string } | { ok: false; error: 'empty' | 'too-long' };

/** Trims the name and checks the 1–100 length the repository enforces. */
export function checkDeckName(input: string): DeckNameResult {
  const name = cleanText(input, 1, MAX_DECK_NAME_LENGTH);
  if (name !== null) return { ok: true, name };
  return { ok: false, error: cleanText(input, 1, Number.MAX_SAFE_INTEGER) === null ? 'empty' : 'too-long' };
}

/** Name for a copy: "<name> (kopio)", shortened so it still fits the limit, made unique. */
export function copyDeckName(name: string, existing: readonly string[]): string {
  const suffix = ' (kopio)';
  // Cut by code points so an emoji is never split (SEC-026).
  const kept = Array.from(name).slice(0, MAX_DECK_NAME_LENGTH - suffix.length - 4).join('');
  const base = `${kept.trimEnd()}${suffix}`;
  return uniqueDeckName(existing, base);
}

/** Content for "Kopioi": same cards, new name. */
export function copyContent(deck: Deck, name: string): DeckContent {
  return { name, sections: deck.sections.map((section) => ({ name: section.name, cards: [...section.cards] })) };
}

/** Rows over all sections. */
export function distinctRows(deck: DeckContent): number {
  return deck.sections.reduce((sum, section) => sum + section.cards.length, 0);
}

/**
 * Sets the total copies of a card (0 removes it). The card lives in the first section that already
 * has it, or in the first section; any other rows of it are removed. The count is capped at 99.
 */
export function withDeckCount(deck: DeckContent, card: CardKey, count: number): DeckContent {
  const next = Math.max(0, Math.min(MAX_DECK_CARD_COUNT, Math.trunc(count)));
  let sections: DeckSection[] = [...deck.sections];
  // The sideboard is edited by withSideboardCount only (T-058).
  let mainIndexes = sections.flatMap((section, i) => (section.name === SIDEBOARD_SECTION_NAME ? [] : [i]));
  if (mainIndexes.length === 0) {
    sections = [{ name: '', cards: [] }, ...sections];
    mainIndexes = [0];
  }
  const home = mainIndexes.find((i) => sections[i]?.cards.some((row) => row.card === card)) ?? mainIndexes[0] ?? 0;
  return {
    name: deck.name,
    sections: sections.map((section, index) => {
      const others = section.cards.filter((row) => row.card !== card);
      if (section.name === SIDEBOARD_SECTION_NAME) return section;
      if (index !== home || next === 0) return { name: section.name, cards: others };
      const existing = section.cards.findIndex((row) => row.card === card);
      if (existing < 0) return { name: section.name, cards: [...others, { card, count: next }] };
      const cards = [...section.cards];
      cards[existing] = { card, count: next };
      return { name: section.name, cards };
    }),
  };
}

/**
 * Sets the copies of a card in the sideboard section (0 removes it). The section is created when needed
 * and dropped when it becomes empty (T-058).
 */
export function withSideboardCount(deck: DeckContent, card: CardKey, count: number): DeckContent {
  const next = Math.max(0, Math.min(MAX_DECK_CARD_COUNT, Math.trunc(count)));
  const others = deck.sections.filter((section) => section.name !== SIDEBOARD_SECTION_NAME);
  const cards = deck.sections
    .filter((section) => section.name === SIDEBOARD_SECTION_NAME)
    .flatMap((section) => section.cards)
    .filter((row) => row.card !== card);
  const merged = next > 0 ? [...cards, { card, count: next }] : cards;
  return {
    name: deck.name,
    sections: merged.length > 0 ? [...others, { name: SIDEBOARD_SECTION_NAME, cards: merged }] : others,
  };
}
