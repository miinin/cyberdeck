import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { byColour, byEvent, byOpponent, legendsAgainst, recentTexts, recordText, tally, turnRates } from '../domain/gameStats';
import type { LegendInfo, Tally } from '../domain/gameStats';
import { gamesOfDeck } from '../domain/games';
import type { GameRecord } from '../domain/games';
import type { GameLogRepository } from '../storage';
import { ColorLetters } from './ColorLetters';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { GameDialog } from './GameDialog';
import type { GameDialogTarget, GameFields } from './GameDialog';
import { PencilIcon, TrashIcon } from './icons';

import { gameTexts } from './gameTexts';
import { useGameLog } from './useGameLog';
import type { GameChangeResult } from './useGameLog';

/** The newest games shown before "Show all". */
const RECENT_GAMES = 10;

/** The saved message stays this long, as in the deck editor. */
const TOAST_MS = 4000;

/** One result as a letter with a colour, and the word for a screen reader. */
function ResultBadge({ result }: { result: GameRecord['result'] }) {
  const short = result === 'win' ? gameTexts.winShort : result === 'loss' ? gameTexts.lossShort : gameTexts.drawShort;
  return (
    <span className={`result-badge is-${result}`}>
      <span aria-hidden="true">{short}</span>
      <span className="visually-hidden">{gameTexts.resultName[result]}</span>
    </span>
  );
}

const rate = (value: number | null) => (value === null ? '–' : gameTexts.percent(value));

/** Games, record and win percent as the cells of a table row. */
function TallyCells({ row }: { row: Tally }) {
  return (
    <>
      <td className="results-number results-games">{row.games}</td>
      <td className="results-number" aria-label={gameTexts.recordAria(row.wins, row.losses, row.draws)}>
        {recordText(row)}
      </td>
      <td className="results-number">{rate(row.winRate)}</td>
    </>
  );
}

function ResultsTable({
  title,
  firstColumn,
  rows,
}: {
  title: string;
  firstColumn: string;
  rows: readonly { key: string; label: ReactNode; tally: Tally }[];
}) {
  return (
    <div className="panel">
      <h3 className="panel-title">{title}</h3>
      <table className="results-table">
        <thead>
          <tr>
            <th scope="col">{firstColumn}</th>
            <th scope="col" className="results-number results-games">
              {gameTexts.kpiGames}
            </th>
            <th scope="col" className="results-number">
              {gameTexts.kpiRecord}
            </th>
            <th scope="col" className="results-number">
              {gameTexts.kpiWinRate}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <TallyCells row={row.tally} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The results of one deck (T-122, D-030): key numbers, the tables by opponent, colour and event, and the list of
 * games, with the form to log and edit them. All the free text (names, events, notes) is shown as plain text (SR-46).
 */
export function DeckResults({
  deckId,
  repository,
  cards,
  cardsByKey,
}: {
  deckId: string;
  /** Must be a stable reference. */
  repository: GameLogRepository;
  cards: readonly Card[];
  cardsByKey: ReadonlyMap<CardKey, Card>;
}) {
  const handle = useGameLog(repository);
  const { phase, log, notices } = handle;
  const [dialog, setDialog] = useState<GameDialogTarget>(null);
  const [deleting, setDeleting] = useState<GameRecord | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // After a delete the button that opened the question is gone: the focus moves to the heading.
  const [focusHeading, setFocusHeading] = useState(0);

  useEffect(() => {
    if (focusHeading > 0) headingRef.current?.focus();
  }, [focusHeading]);

  useEffect(() => {
    if (toast === null) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const legendInfo: LegendInfo = useMemo(
    () => (key) => {
      const card = cardsByKey.get(key);
      return card === undefined ? null : { name: card.displayName, colour: card.color };
    },
    [cardsByKey],
  );
  const legends = useMemo(
    () => cards.filter((card) => card.type === 'Legend').sort((a, b) => (a.displayName < b.displayName ? -1 : a.displayName > b.displayName ? 1 : 0)),
    [cards],
  );
  const games = useMemo(() => gamesOfDeck(log, deckId), [log, deckId]);
  const stats = useMemo(
    () => ({
      total: tally(games),
      turns: turnRates(games),
      opponents: byOpponent(games, legendInfo),
      colours: byColour(games, legendInfo),
      events: byEvent(games),
    }),
    [games, legendInfo],
  );
  // The suggestions come from every deck's games (newest first).
  const names = useMemo(() => recentTexts(log.games, (game) => game.opponentName), [log]);
  const events = useMemo(() => recentTexts(log.games, (game) => game.event), [log]);

  const opponentOf = (game: GameRecord): string => {
    if (game.opponentName !== null) return game.opponentName;
    const known = game.opponentLegends.flatMap((key) => legendInfo(key)?.name ?? []).sort();
    return known.length > 0 ? known.join(', ') : gameTexts.unknownOpponent;
  };

  const openDialog = (target: GameDialogTarget, opener: HTMLElement) => {
    openerRef.current = opener;
    setFailure(null);
    setDialog(target);
  };

  const closeDialog = () => {
    if (dialog === null) return;
    setDialog(null);
    const opener = openerRef.current;
    if (opener?.isConnected) opener.focus();
  };

  const save = async (fields: GameFields): Promise<GameChangeResult> => {
    if (dialog === null) return null;
    const editing = dialog.mode === 'edit' ? dialog.game : null;
    const input = { ...fields, deckId };
    const outcome = editing === null ? await handle.add(input) : await handle.update(editing.id, input);
    if (outcome === null) {
      setToast(editing === null ? gameTexts.saved : gameTexts.savedEdit);
      closeDialog();
    }
    return outcome;
  };

  const confirmDelete = async () => {
    const game = deleting;
    if (game === null) return;
    setDeleting(null);
    const outcome = await handle.remove(game.id);
    if (outcome === null) {
      setToast(gameTexts.deleted);
      setFocusHeading((n) => n + 1);
    } else {
      setFailure(gameTexts.saveFailed);
    }
  };

  const cancelDelete = () => {
    if (deleting === null) return;
    setDeleting(null);
    const opener = openerRef.current;
    if (opener?.isConnected) opener.focus();
  };

  const visible = showAll ? games : games.slice(0, RECENT_GAMES);
  const ready = phase === 'ready';
  const hint = notices.flatMap((notice) =>
    notice.kind === 'repaired' ? [gameTexts.repaired(notice.dropped)] : notice.kind === 'reset' ? [gameTexts.reset] : [],
  );

  return (
    <section className="deck-results" aria-labelledby="results-heading">
      <div className="results-head">
        <h2 id="results-heading" className="deck-section-title" ref={headingRef} tabIndex={-1}>
          {gameTexts.resultsHeading}
        </h2>
        {ready && (
          <button type="button" className="button-primary" onClick={(event) => openDialog({ mode: 'new' }, event.currentTarget)}>
            {gameTexts.logGame}
          </button>
        )}
      </div>

      <div role="status" className="toast-slot">
        {toast !== null && (
          <p className="toast">
            <span>{toast}</span>
          </p>
        )}
      </div>
      {failure !== null && (
        <p role="alert" className="field-error">
          {failure}
        </p>
      )}
      {phase === 'loading' && <p className="hint">{gameTexts.loading}</p>}
      {phase === 'unavailable' && <p className="field-error">{gameTexts.unavailable}</p>}
      {phase === 'locked' && <p className="field-error">{gameTexts.locked}</p>}
      {ready && hint.map((text) => <p key={text} className="hint">{text}</p>)}

      {ready && games.length === 0 && <p className="empty results-empty">{gameTexts.emptyResults}</p>}

      {ready && games.length > 0 && (
        <div className="results-cols">
          <div className="results-col">
          <div className="panel results-overview">
            <dl className="kpi-tiles">
              <div>
                <dt>{gameTexts.kpiGames}</dt>
                <dd>{stats.total.games}</dd>
              </div>
              <div>
                <dt>{gameTexts.kpiRecord}</dt>
                <dd aria-label={gameTexts.recordAria(stats.total.wins, stats.total.losses, stats.total.draws)}>{recordText(stats.total)}</dd>
              </div>
              <div>
                <dt>{gameTexts.kpiWinRate}</dt>
                <dd>{rate(stats.total.winRate)}</dd>
              </div>
              {stats.turns.recorded && (
                <>
                  <div>
                    <dt>{gameTexts.kpiFirst}</dt>
                    <dd>{rate(stats.turns.first)}</dd>
                  </div>
                  <div>
                    <dt>{gameTexts.kpiSecond}</dt>
                    <dd>{rate(stats.turns.second)}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <ResultsTable
            title={gameTexts.byOpponent}
            firstColumn={gameTexts.opponent}
            rows={stats.opponents.map((row, index) => ({
              key: `${row.kind}-${index}`,
              label: row.label ?? gameTexts.unknownOpponent,
              tally: row,
            }))}
          />
          {stats.colours.length > 0 && (
            <ResultsTable
              title={gameTexts.byColour}
              firstColumn={gameTexts.colours}
              rows={stats.colours.map((row) => ({
                key: row.colours.join('-'),
                label: <ColorLetters colours={row.colours} />,
                tally: row,
              }))}
            />
          )}
          {stats.events.length > 0 && (
            <ResultsTable
              title={gameTexts.byEvent}
              firstColumn={gameTexts.event}
              rows={stats.events.map((row, index) => ({ key: `${index}`, label: row.label, tally: row }))}
            />
          )}

          </div>

          <div className="results-col">
          <div className="panel">
            <h3 className="panel-title">{gameTexts.gamesList}</h3>
            <ul className="game-list">
              {visible.map((game) => {
                const day = gameTexts.formatDay(game.playedOn);
                const label = gameTexts.rowAria(day, opponentOf(game));
                return (
                  <li key={game.id} className="game-row">
                    <div className="game-row-main">
                      <p className="game-row-line">
                        <time dateTime={game.playedOn} className="game-row-day">
                          {day}
                        </time>
                        <ResultBadge result={game.result} />
                        <span className="game-row-opponent">{opponentOf(game)}</span>
                      </p>
                      {(game.turn !== null || game.sideboard || game.event !== null) && (
                        <p className="game-row-tags">
                          {game.turn !== null && (
                            <span className="game-tag">{game.turn === 'first' ? gameTexts.badgeFirst : gameTexts.badgeSecond}</span>
                          )}
                          {game.sideboard && (
                            <span className="game-tag" title={gameTexts.badgeSideboardLong}>
                              <span aria-hidden="true">{gameTexts.badgeSideboard}</span>
                              <span className="visually-hidden">{gameTexts.badgeSideboardLong}</span>
                            </span>
                          )}
                          {game.event !== null && <span className="game-tag">{game.event}</span>}
                        </p>
                      )}
                      {game.note !== null && <p className="game-row-note">{game.note}</p>}
                    </div>
                    <div className="game-row-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={gameTexts.editGameFor(label)}
                        title={gameTexts.editGameFor(label)}
                        onClick={(event) => openDialog({ mode: 'edit', game }, event.currentTarget)}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={gameTexts.deleteGameFor(label)}
                        title={gameTexts.deleteGameFor(label)}
                        onClick={(event) => {
                          openerRef.current = event.currentTarget;
                          setDeleting(game);
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {games.length > RECENT_GAMES && (
              <button type="button" className="button-secondary game-show-all" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
                {showAll ? gameTexts.showFewer : gameTexts.showAll(games.length)}
              </button>
            )}
          </div>
          </div>
        </div>
      )}

      <GameDialog
        target={dialog}
        legends={legends}
        names={names}
        events={events}
        legendsFor={(name) => legendsAgainst(log.games, name)}
        onSave={save}
        onClose={closeDialog}
      />
      <ConfirmDeleteDialog
        name={deleting === null ? null : gameTexts.rowAria(gameTexts.formatDay(deleting.playedOn), opponentOf(deleting))}
        title={gameTexts.deleteGameTitle}
        body={() =>
          deleting === null ? '' : gameTexts.deleteGame(gameTexts.formatDay(deleting.playedOn), opponentOf(deleting))
        }
        confirmLabel={gameTexts.deleteGameConfirm}
        cancelLabel={gameTexts.cancel}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
      />
    </section>
  );
}
