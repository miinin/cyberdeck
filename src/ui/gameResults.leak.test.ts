import { legalCards, testCards } from './deckTestUtils';
import { deckToJson, deckToText } from '../domain/deckExport';
import { encodeDeckShare } from '../domain/deckShare';
import { toCardsByKey } from '../domain/deckRules';
import { buildPublicDeckInput } from '../domain/publicDeck';
import { encodeTradeShare } from '../domain/tradeShare';
import { createMemoryRepositories } from '../storage';

// T-122, SR-47: the results never reach the public copy, the share link, the exports or the deck's own document.

describe('game results stay out of everything that leaves the device', () => {
  it('leaves the deck, its stored document and all outputs exactly as they were', async () => {
    const repositories = createMemoryRepositories();
    const created = await repositories.decks.create({
      name: 'Oma pakka',
      sections: [{ name: '', cards: legalCards().map(([card, count]) => ({ card, count })) }],
    });
    const cardsByKey = toCardsByKey(testCards);
    const outputs = async () => {
      const deck = await repositories.decks.get(created.id);
      if (deck === null) throw new Error('deck missing');
      const content = { name: deck.name, sections: deck.sections };
      return {
        deck: JSON.stringify(deck),
        json: deckToJson(content, cardsByKey),
        text: deckToText(content, cardsByKey),
        share: encodeDeckShare(content, cardsByKey),
        pub: JSON.stringify(buildPublicDeckInput(deck.id, content, cardsByKey, null)),
        stored: JSON.stringify(
          (await repositories.decks.list()).value.map((item) => ({ ...item })),
        ),
      };
    };
    const before = await outputs();

    await repositories.games.add({
      deckId: created.id,
      playedOn: '2026-10-05',
      result: 'win',
      opponentName: 'Salainen vastustaja',
      opponentLegends: ['l1'],
      turn: 'first',
      event: 'Salainen tapahtuma',
      sideboard: true,
      note: 'Salainen muistiinpano',
    });
    const after = await outputs();

    expect(after).toEqual(before);
    for (const value of Object.values(after)) {
      expect(value).not.toMatch(/Salainen/);
    }
    // The trade link carries only the collection and the want list.
    expect(encodeTradeShare({ entries: [{ card: 'l1', count: 1 }] }, { entries: [] })).not.toMatch(/Salainen/);
  });

  it('keeps the games out of the deck document on disk', async () => {
    const repositories = createMemoryRepositories();
    const created = await repositories.decks.create({ name: 'Pakka', sections: [] });
    await repositories.games.add({
      deckId: created.id,
      playedOn: '2026-10-05',
      result: 'loss',
      opponentName: 'Vastus',
      opponentLegends: [],
      turn: null,
      event: null,
      sideboard: false,
      note: null,
    });
    const raw = JSON.stringify((await repositories.decks.list()).value);
    expect(raw).not.toContain('Vastus');
    expect(raw).not.toContain('games');
  });
});
