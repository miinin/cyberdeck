import { useEffect, useMemo, useRef } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import type { CollectionEntry } from '../domain/collection';
import { toCardsByKey } from '../domain/deckRules';
import { compareTrade, tradeableCount } from '../domain/tradeCompare';
import { decodeTradeShare } from '../domain/tradeShare';
import type { Repositories } from '../storage';
import { CardName } from './CardName';
import { texts } from './texts';
import { useCollection } from './useCollection';
import { useWants } from './useWants';

/** Rows of known cards as React text; cards missing from the card data are left out (they are counted elsewhere). */
function CardRows({
  rows,
  cardsByKey,
  describe,
}: {
  rows: readonly CollectionEntry[];
  cardsByKey: ReadonlyMap<CardKey, Card>;
  describe: (entry: CollectionEntry, card: Card) => string;
}) {
  const known = rows.flatMap((entry) => {
    const card = cardsByKey.get(entry.card);
    return card === undefined ? [] : [{ entry, card }];
  });
  if (known.length === 0) return <p>{texts.tradeNothing}</p>;
  return (
    <ul>
      {known.map(({ entry, card }) => (
        <li key={entry.card}>
          <CardName card={card} />: {describe(entry, card)}
        </li>
      ))}
    </ul>
  );
}

/**
 * A trade link opened (T-062): the sharer's collection and want list, and a comparison to the viewer's own.
 * Read only: nothing is saved. Both sides offer only tradeable copies (T-063). The data is untrusted (SR-17).
 */
export function SharedTradeView({
  data,
  cards,
  repositories,
}: {
  data: string;
  cards: readonly Card[];
  repositories: Repositories;
}) {
  const { snapshot: mine } = useCollection(repositories.collection);
  const { snapshot: myWants } = useWants(repositories.wants);
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const shared = useMemo(() => decodeTradeShare(data), [data]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [data]);

  const comparison = useMemo(
    () =>
      shared !== null && mine.phase === 'ready' && myWants.phase === 'ready'
        ? compareTrade(mine.saved, myWants.saved, shared.have, shared.want, cardsByKey)
        : null,
    [shared, mine.phase, mine.saved, myWants.phase, myWants.saved, cardsByKey],
  );

  if (shared === null) {
    return (
      <>
        <h1 ref={headingRef} tabIndex={-1}>
          {texts.tradeInvalidHeading}
        </h1>
        <p role="alert">{texts.tradeInvalid}</p>
        <p>
          <a href="#/">{texts.tradeToCards}</a>
        </p>
      </>
    );
  }

  const unknown = [...shared.have.entries, ...shared.want.entries].filter(
    (entry) => !cardsByKey.has(entry.card),
  ).length;
  const loading = mine.phase === 'loading' || myWants.phase === 'loading';
  const countRows = (rows: readonly CollectionEntry[]) => (
    <CardRows rows={rows} cardsByKey={cardsByKey} describe={(entry) => texts.tradeCompareRow(entry.count)} />
  );

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {texts.tradeHeading}
      </h1>
      <p>{texts.tradeIntro}</p>
      {shared.dropped > 0 && <p role="status">{texts.tradeDropped(shared.dropped)}</p>}
      {unknown > 0 && <p role="status">{texts.tradeUnknown(unknown)}</p>}

      <section aria-labelledby="trade-compare-heading">
        <h2 id="trade-compare-heading">{texts.tradeCompareHeading}</h2>
        {comparison !== null ? (
          <>
            <p className="hint">{texts.tradeCompareExplain}</p>
            <h3>{texts.tradeIGiveHeading}</h3>
            {countRows(comparison.iCanGive)}
            <h3>{texts.tradeTheyGiveHeading}</h3>
            {countRows(comparison.theyCanGive)}
          </>
        ) : (
          <p>{loading ? texts.tradeCompareLoading : texts.tradeCompareUnavailable}</p>
        )}
      </section>

      <section aria-labelledby="trade-have-heading">
        <h2 id="trade-have-heading">{texts.tradeTheirHaveHeading}</h2>
        {shared.have.entries.length === 0 ? (
          <p>{texts.tradeEmptyList}</p>
        ) : (
          <CardRows
            rows={shared.have.entries}
            cardsByKey={cardsByKey}
            describe={(entry, card) => texts.tradeHaveRow(entry.count, tradeableCount(entry.count, card))}
          />
        )}
      </section>

      <section aria-labelledby="trade-want-heading">
        <h2 id="trade-want-heading">{texts.tradeTheirWantHeading}</h2>
        {shared.want.entries.length === 0 ? (
          <p>{texts.tradeEmptyList}</p>
        ) : (
          <CardRows
            rows={shared.want.entries}
            cardsByKey={cardsByKey}
            describe={(entry) => texts.tradeWantRow(entry.count)}
          />
        )}
      </section>

      <p>
        <a href="#/">{texts.tradeToCards}</a>
      </p>
    </>
  );
}
