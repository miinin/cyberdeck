import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Deck } from '../domain/deck';
import { allMissing, competingPairs, deckMissing, pairMissing, swapPlan } from '../domain/deckBuild';
import type { SwapRow } from '../domain/deckBuild';
import type { CardsByKey } from '../domain/deckRules';
import { intlLocale } from '../locale';
import { AddMissingToWantsButton } from './AddMissingToWants';
import { CardName } from './CardName';
import { deckTexts } from './deckTexts';
import { useMediaQuery } from './useMediaQuery';
import type { WantsHandle } from './useWants';

/** The matrix needs room for one column per deck: from about 48 rem up and for at most this many decks. */
const MATRIX_QUERY = '(min-width: 48rem)';
const MATRIX_MAX_DECKS = 8;

function CardLine({ cardsByKey, card, count, note }: { cardsByKey: CardsByKey; card: string; count: number; note?: string }) {
  const known = cardsByKey.get(card);
  return (
    <li>
      <span className="build-count">{count}×</span> {known === undefined ? card : <CardName card={known} />}
      {note !== undefined && <span className="build-note"> · {note}</span>}
    </li>
  );
}

/** One group with its own count per row: the group is a list of "n× Card". */
function CountedGroup({
  title,
  entries,
  cardsByKey,
  note,
}: {
  title: string;
  entries: readonly { row: SwapRow; count: number }[];
  cardsByKey: CardsByKey;
  note?: (row: SwapRow) => string | undefined;
}) {
  return (
    <section className="build-group">
      <h3>{title}</h3>
      <ul>
        {entries.map(({ row, count }) => (
          <CardLine key={row.card} cardsByKey={cardsByKey} card={row.card} count={count} note={note?.(row)} />
        ))}
      </ul>
    </section>
  );
}

function SwapGuide({
  decks,
  cardsByKey,
  owned,
  wants,
}: {
  decks: readonly Deck[];
  cardsByKey: CardsByKey;
  owned: (key: string) => number;
  wants: WantsHandle;
}) {
  const ids = { from: useId(), to: useId() };
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [keptIds, setKeptIds] = useState<readonly string[]>([]);
  const from = decks.find((deck) => deck.id === fromId) ?? null;
  const to = decks.find((deck) => deck.id === toId) ?? null;
  const kept = decks.filter((deck) => keptIds.includes(deck.id) && deck.id !== from?.id && deck.id !== to?.id);
  const known = (key: string) => cardsByKey.has(key);

  const nameOf = (key: string) => cardsByKey.get(key)?.name ?? key;
  const rows: SwapRow[] | null =
    to === null || from?.id === to.id
      ? null
      : swapPlan(from, to, kept, owned, known)
          .filter((row) => row.keep + row.toBinder + row.fromBinder + row.missing > 0)
          .sort((a, b) => nameOf(a.card).localeCompare(nameOf(b.card), intlLocale));

  const missingRows = rows?.filter((row) => row.missing > 0) ?? [];
  const missingTotal = missingRows.reduce((sum, row) => sum + row.missing, 0);
  const keepRows = rows?.filter((row) => row.keep > 0).map((row) => ({ row, count: row.keep })) ?? [];
  const toBinderRows = rows?.filter((row) => row.toBinder > 0).map((row) => ({ row, count: row.toBinder })) ?? [];
  const fromBinderRows = rows?.filter((row) => row.fromBinder > 0).map((row) => ({ row, count: row.fromBinder })) ?? [];
  const sum = (entries: readonly { count: number }[]) => entries.reduce((total, entry) => total + entry.count, 0);
  const others = decks.filter((deck) => deck.id !== from?.id && deck.id !== to?.id);

  return (
    <section className="build-section" aria-labelledby={`${ids.from}-h`}>
      <h2 id={`${ids.from}-h`}>{deckTexts.swapHeading}</h2>
      <p className="build-intro">{deckTexts.swapIntro}</p>
      <div className="build-selects">
        <div className="field">
          <label htmlFor={ids.from}>{deckTexts.swapFromLabel}</label>
          <select id={ids.from} value={from?.id ?? ''} onChange={(event) => setFromId(event.target.value)}>
            <option value="">{deckTexts.swapFromNone}</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </div>
        <span className="build-arrow" aria-hidden="true">
          →
        </span>
        <div className="field">
          <label htmlFor={ids.to}>{deckTexts.swapToLabel}</label>
          <select id={ids.to} value={to?.id ?? ''} onChange={(event) => setToId(event.target.value)}>
            <option value="">{deckTexts.swapToPlaceholder}</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {others.length > 0 && (
        <fieldset className="build-kept">
          <legend>{deckTexts.swapKeptLabel}</legend>
          <div className="options">
            {others.map((deck) => (
              <label key={deck.id} className="option">
                <input
                  type="checkbox"
                  checked={keptIds.includes(deck.id)}
                  onChange={(event) => setKeptIds(event.target.checked ? [...keptIds, deck.id] : keptIds.filter((id) => id !== deck.id))}
                />{' '}
                {deck.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {to === null && <p className="status-line">{deckTexts.swapPick}</p>}
      {to !== null && rows === null && <p className="status-line">{deckTexts.swapSame}</p>}
      {rows !== null && (
        <div className="build-result" aria-live="polite">
          {missingTotal === 0 ? (
            <p className="build-ok">
              <span aria-hidden="true">✓ </span>
              {deckTexts.swapAllFound}
            </p>
          ) : (
            <p className="build-warn">{deckTexts.swapSomeMissing(missingTotal)}</p>
          )}
          {rows.length === 0 && <p className="status-line">{deckTexts.swapNoRows}</p>}
          <div className="build-groups">
            {keepRows.length > 0 && (
              <CountedGroup title={deckTexts.swapKeepGroup(sum(keepRows))} entries={keepRows} cardsByKey={cardsByKey} />
            )}
            {toBinderRows.length > 0 && (
              <CountedGroup title={deckTexts.swapToBinderGroup(sum(toBinderRows))} entries={toBinderRows} cardsByKey={cardsByKey} />
            )}
            {fromBinderRows.length > 0 && (
              <CountedGroup title={deckTexts.swapFromBinderGroup(sum(fromBinderRows))} entries={fromBinderRows} cardsByKey={cardsByKey} />
            )}
            {missingRows.length > 0 && (
              <CountedGroup
                title={deckTexts.swapMissingGroup(missingTotal)}
                entries={missingRows.map((row) => ({
                  row,
                  count: row.missing,
                }))}
                cardsByKey={cardsByKey}
                note={(row) => (row.inDecks.length > 0 ? deckTexts.swapInDecks(row.inDecks) : undefined)}
              />
            )}
          </div>
          {missingRows.length > 0 && (
            <div className="row-actions">
              <AddMissingToWantsButton
                rows={missingRows.map((row) => ({
                  card: row.card,
                  missing: row.missing,
                }))}
                wants={wants}
                name={deckTexts.swapAddName(to?.name ?? '')}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Compatibility({ decks, cardsByKey, owned }: { decks: readonly Deck[]; cardsByKey: CardsByKey; owned: (key: string) => number }) {
  const matrixFits = useMediaQuery(MATRIX_QUERY, true) && decks.length <= MATRIX_MAX_DECKS;
  const known = (key: string) => cardsByKey.has(key);
  const pairs = competingPairs(decks, owned, known);
  return (
    <section className="build-section" aria-labelledby="build-compat-h">
      <h2 id="build-compat-h">{deckTexts.compatHeading}</h2>
      <p className="build-intro">{deckTexts.compatIntro}</p>
      {decks.length < 2 ? (
        <p className="status-line">{deckTexts.compatOneDeck}</p>
      ) : matrixFits ? (
        <table className="build-matrix" aria-label={deckTexts.compatMatrixLabel} style={{ '--decks': decks.length } as CSSProperties}>
          <thead>
            <tr>
              <td />
              {decks.map((deck) => (
                <th key={deck.id} scope="col" title={deck.name}>
                  <span className="build-cut">{deck.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decks.map((row) => (
              <tr key={row.id}>
                <th scope="row" title={row.name}>
                  <span className="build-cut">{row.name}</span>
                </th>
                {decks.map((column) => {
                  const diagonal = row.id === column.id;
                  const missing = diagonal ? deckMissing(row, owned, known) : pairMissing(row, column, owned, known);
                  const label = diagonal ? deckTexts.compatOwn(row.name, missing) : deckTexts.compatCell(row.name, column.name, missing);
                  return (
                    <td key={column.id} className={`${diagonal ? 'is-own ' : ''}${missing === 0 ? 'is-ok' : 'is-short'}`}>
                      <span className="visually-hidden">{label}</span>
                      <span aria-hidden="true" title={label}>
                        {missing === 0 ? '✓' : missing}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : pairs.length === 0 ? (
        <p className="build-ok">
          <span aria-hidden="true">✓ </span>
          {deckTexts.compatNoPairs}
        </p>
      ) : (
        <>
          <h3>{deckTexts.compatPairs}</h3>
          <ul className="build-pairs">
            {pairs.map((pair) => (
              <li key={`${pair.first.id}-${pair.second.id}`}>{deckTexts.compatPair(pair.first.name, pair.second.name, pair.together)}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function BuildAll({
  decks,
  cardsByKey,
  owned,
  wants,
}: {
  decks: readonly Deck[];
  cardsByKey: CardsByKey;
  owned: (key: string) => number;
  wants: WantsHandle;
}) {
  const nameOf = (key: string) => cardsByKey.get(key)?.name ?? key;
  const rows = allMissing(decks, owned, (key) => cardsByKey.has(key)).sort((a, b) =>
    nameOf(a.card).localeCompare(nameOf(b.card), intlLocale),
  );
  const missing = rows.reduce((sum, row) => sum + row.missing, 0);
  return (
    <section className="build-section" aria-labelledby="build-all-h">
      <h2 id="build-all-h">{deckTexts.allHeading}</h2>
      {rows.length === 0 ? (
        <p className="build-ok">
          <span aria-hidden="true">✓ </span>
          {deckTexts.allOk(decks.length)}
        </p>
      ) : (
        <>
          <p className="build-warn">{deckTexts.allSummary(decks.length, missing, rows.length)}</p>
          <table className="build-table" aria-label={deckTexts.allListLabel}>
            <thead>
              <tr>
                <th scope="col">{deckTexts.allColCard}</th>
                <th scope="col">{deckTexts.allColNeed}</th>
                <th scope="col">{deckTexts.allColOwned}</th>
                <th scope="col">{deckTexts.allColMissing}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const card = cardsByKey.get(row.card);
                return (
                  <tr key={row.card}>
                    <th scope="row">{card === undefined ? row.card : <CardName card={card} />}</th>
                    <td>{row.need}</td>
                    <td>{row.owned}</td>
                    <td className="is-short">{row.missing}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="row-actions">
            <AddMissingToWantsButton
              rows={rows.map((row) => ({
                card: row.card,
                missing: row.missing,
              }))}
              wants={wants}
              label={deckTexts.allAddLabel}
            />
          </div>
        </>
      )}
    </section>
  );
}

/** The "Kokoaminen" tab (T-164): deck swap guide, compatibility of decks and what building all of them takes. */
export function DeckBuildView({
  decks,
  cardsByKey,
  owned,
  wants,
}: {
  decks: readonly Deck[];
  cardsByKey: CardsByKey;
  owned: (key: string) => number;
  wants: WantsHandle;
}) {
  if (decks.length === 0) {
    return (
      <div className="empty">
        <h2>{deckTexts.buildEmptyTitle}</h2>
        <p>{deckTexts.buildEmpty}</p>
      </div>
    );
  }
  return (
    <div className="build-view">
      <SwapGuide decks={decks} cardsByKey={cardsByKey} owned={owned} wants={wants} />
      <Compatibility decks={decks} cardsByKey={cardsByKey} owned={owned} />
      <BuildAll decks={decks} cardsByKey={cardsByKey} owned={owned} wants={wants} />
    </div>
  );
}
