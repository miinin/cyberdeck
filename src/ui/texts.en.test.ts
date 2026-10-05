import { deckMessagesEn, deckMessagesFi } from '../domain/deckMessages';
import { deckTextsEn } from './deckTexts.en';
import { deckTextsFi } from './deckTexts.fi';
import { textsEn } from './texts.en';
import { textsFi } from './texts.fi';

// The English objects have the Finnish objects' type, so TypeScript enforces every key and signature
// (npm run build). These tests check the runtime key sets too and the English plural forms.
function keys(value: object): string[] {
  return Object.keys(value).sort();
}

describe('English texts', () => {
  it('have the same keys as the Finnish texts', () => {
    expect(keys(textsEn)).toEqual(keys(textsFi));
    expect(keys(deckTextsEn)).toEqual(keys(deckTextsFi));
    expect(keys(textsEn.accountErrors)).toEqual(keys(textsFi.accountErrors));
    expect(keys(deckTextsEn.importErrors)).toEqual(keys(deckTextsFi.importErrors));
    expect(keys(deckTextsEn.linkErrors)).toEqual(keys(deckTextsFi.linkErrors));
    expect(keys(deckMessagesEn)).toEqual(keys(deckMessagesFi));
  });

  it('inflect card counts', () => {
    expect(textsEn.cardCount(1)).toBe('1 card');
    expect(textsEn.cardCount(0)).toBe('0 cards');
    expect(textsEn.cardCount(1024)).toBe('1,024 cards');
    expect(textsEn.collectionSummary(1, 1)).toBe('Your collection has 1 distinct card, 1 copy in total.');
    expect(textsEn.collectionSummary(3, 5)).toBe('Your collection has 3 distinct cards, 5 copies in total.');
    expect(textsEn.allShownLive(1)).toBe('Showing 1 card.');
    expect(textsEn.allShownLive(151)).toBe('Showing all 151 cards.');
  });

  it('inflect deck counts and format numbers the English way', () => {
    expect(deckTextsEn.unfinished(1)).toBe('Unfinished · 1 issue');
    expect(deckTextsEn.issuesCount(2)).toBe('2 issues');
    expect(deckTextsEn.addedToWants(1)).toBe('Added 1 card to wants.');
    expect(deckTextsEn.addedToWants(4)).toBe('Added 4 cards to wants.');
    expect(deckTextsEn.formatDecimal(3.25)).toBe('3.3');
    expect(deckTextsEn.formatPercent(0.391)).toBe('39%');
    expect(deckTextsEn.formatPercent(0.999)).toBe('> 99%');
  });

  it('English rule messages inflect', () => {
    expect(deckMessagesEn.unknownCards(1, ['x'])).toBe('1 card in the deck is missing from the card data: x.');
    expect(deckMessagesEn.unknownCards(2, ['x', 'y'])).toBe('2 cards in the deck are missing from the card data: x, y.');
    expect(deckMessagesEn.mainSize(38, 40, 50)).toContain('at least 40');
    expect(deckMessagesEn.mainSize(51, 40, 50)).toContain('at most 50');
  });
});
