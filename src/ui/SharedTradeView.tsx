import { useEffect, useMemo, useRef } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import type { CollectionEntry } from '../domain/collection';
import { toCardsByKey } from '../domain/deckRules';
import { compareTrade, tradeableCount } from '../domain/tradeCompare';
import { decodeTradeShare } from '../domain/tradeShare';
import { haveSourceOf } from '../domain/tradeRule';
import { useTradeRule } from './useTradeRule';
import type { Repositories } from '../storage';
import { CardName } from './CardName';
import { texts } from './texts';
import { useCollection } from './useCollection';
import { useWants } from './useWants';

interface TradeRow {
  card: Card;
  count: number;
  /** Tradeable copies; undefined = the column is not shown. */
  tradeable?: number;
}

/** Rows of known cards as a table of React text; cards missing from the card data are left out (they are counted elsewhere). */
function CardTable({
  rows,
  cardsByKey,
  caption,
  countHeading,
  tradeableOf,
}: {
  rows: readonly CollectionEntry[];
  cardsByKey: ReadonlyMap<CardKey, Card>;
  caption: string;
  countHeading: string;
  /** Adds the "Vaihdettavissa" column. */
  tradeableOf?: (entry: CollectionEntry, card: Card) => number;
}) {
  const known = rows.flatMap((entry): TradeRow[] => {
    const card = cardsByKey.get(entry.card);
    return card === undefined ? [] : [{ card, count: entry.count, tradeable: tradeableOf?.(entry, card) }];
  });
  if (known.length === 0) return <p>{texts.tradeNothing}</p>;
  return (
    <table className="trade-table">
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{texts.tradeColCard}</th>
          <th scope="col" className="trade-number">
            {countHeading}
          </th>
          {tradeableOf !== undefined && (
            <th scope="col" className="trade-number">
              {texts.tradeColTradeable}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {known.map(({ card, count, tradeable }) => (
          <tr key={card.key}>
            <th scope="row">
              <CardName card={card} />
            </th>
            <td className="trade-number">{count}</td>
            {tradeable !== undefined && (
              <td className="trade-number">
                {tradeable > 0 ? (
                  tradeable
                ) : (
                  <>
                    <span aria-hidden="true">–</span>
                    <span className="visually-hidden">{texts.tradeNoneTradeable}</span>
                  </>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
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
  // My side follows my own trade rule (T-135); theirs comes in the link (older links: the playset rule).
  const { rule: myRule, tradeableOf: myTradeableOf } = useTradeRule(repositories, cardsByKey);
  const { snapshot: myHaves } = useCollection(repositories.haves);
  // My offer: my own Have list or my collection under my rule, as on my Have/Want page (T-143).
  const myOffer = useMemo(() => {
    const own = new Map(myHaves.phase === 'ready' ? myHaves.saved.entries.map((entry) => [entry.card, entry.count] as const) : []);
    const collectionCards = mine.phase === 'ready' ? mine.saved.entries.length : 0;
    return haveSourceOf(myRule, own.size, collectionCards) === 'list' ? own : myTradeableOf(mine.saved);
  }, [myHaves.phase, myHaves.saved, mine.phase, mine.saved, myRule, myTradeableOf]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [data]);

  const comparison = useMemo(
    () =>
      shared !== null && mine.phase === 'ready' && myWants.phase === 'ready'
        ? compareTrade(mine.saved, myWants.saved, shared.have, shared.want, cardsByKey, { mine: myOffer, theirs: shared.tradeable })
        : null,
    [shared, mine.phase, mine.saved, myWants.phase, myWants.saved, cardsByKey, myOffer],
  );

  // A link from an own Have list (T-143) offers every shared copy: it is their Have list, not their collection.
  const haveHeading =
    shared?.tradeable !== undefined && shared.have.entries.every((entry) => shared.tradeable?.get(entry.card) === entry.count)
      ? texts.tradeTheirHaveListHeading
      : texts.tradeTheirHaveHeading;

  if (shared === null) {
    return (
      <>
        <h1 ref={headingRef} tabIndex={-1}>
          {texts.tradeInvalidHeading}
        </h1>
        <div className="notice notice-danger" role="alert">
          <p>{texts.tradeInvalid}</p>
        </div>
        <p>
          <a className="text-link" href="#/">
            {texts.tradeToCards}
          </a>
        </p>
      </>
    );
  }

  const unknown = [...shared.have.entries, ...shared.want.entries].filter(
    (entry) => !cardsByKey.has(entry.card),
  ).length;
  const loading = mine.phase === 'loading' || myWants.phase === 'loading';
  const compareTable = (rows: readonly CollectionEntry[], caption: string) => (
    <CardTable rows={rows} cardsByKey={cardsByKey} caption={caption} countHeading={texts.tradeColCount} />
  );

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {texts.tradeHeading}
      </h1>
      <p>{texts.tradeIntro}</p>
      {shared.dropped > 0 && <p role="status">{texts.tradeDropped(shared.dropped)}</p>}
      {unknown > 0 && <p role="status">{texts.tradeUnknown(unknown)}</p>}

      <section className="panel" aria-labelledby="trade-compare-heading">
        <h2 id="trade-compare-heading" className="panel-title">
          {texts.tradeCompareHeading}
        </h2>
        {comparison !== null ? (
          <>
            <p className="hint">{texts.tradeCompareExplain}</p>
            <h3>{texts.tradeIGiveHeading}</h3>
            {compareTable(comparison.iCanGive, texts.tradeIGiveHeading)}
            <h3>{texts.tradeTheyGiveHeading}</h3>
            {compareTable(comparison.theyCanGive, texts.tradeTheyGiveHeading)}
          </>
        ) : (
          <p>{loading ? texts.tradeCompareLoading : texts.tradeCompareUnavailable}</p>
        )}
      </section>

      <section className="panel" aria-labelledby="trade-have-heading">
        <details className="disclosure">
          <summary>
            <span id="trade-have-heading">{haveHeading}</span>
            <span className="hint"> ({shared.have.entries.length})</span>
          </summary>
          {shared.have.entries.length === 0 ? (
            <p>{texts.tradeEmptyList}</p>
          ) : (
            <CardTable
              rows={shared.have.entries}
              cardsByKey={cardsByKey}
              caption={haveHeading}
              countHeading={texts.tradeColCount}
              tradeableOf={(entry, card) => (shared.tradeable === undefined ? tradeableCount(entry.count, card) : (shared.tradeable.get(entry.card) ?? 0))}
            />
          )}
        </details>
      </section>

      <section className="panel" aria-labelledby="trade-want-heading">
        <h2 id="trade-want-heading" className="panel-title">
          {texts.tradeTheirWantHeading}
        </h2>
        {shared.want.entries.length === 0 ? (
          <p>{texts.tradeEmptyList}</p>
        ) : (
          <CardTable
            rows={shared.want.entries}
            cardsByKey={cardsByKey}
            caption={texts.tradeTheirWantHeading}
            countHeading={texts.tradeColWants}
          />
        )}
      </section>

      <p>
        <a className="button-secondary" href="#/vaihto">
          {texts.tradeOpenOwn}
        </a>
      </p>
    </>
  );
}
