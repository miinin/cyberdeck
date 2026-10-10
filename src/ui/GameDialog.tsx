import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { isPlayedOn, localDay, MAX_EVENT_LENGTH, MAX_NOTE_LENGTH, MAX_OPPONENT_LEGENDS, MAX_OPPONENT_LENGTH } from '../domain/games';
import type { GameInput, GameRecord, GameResult, GameTurn } from '../domain/games';
import { ColorLetters } from './ColorLetters';
import { SwitchButton } from './ListToolbar';
import { SegmentedChoice } from './SegmentedChoice';
import { gameTexts } from './gameTexts';
import type { GameChangeResult } from './useGameLog';

/** The fields the form fills in; the deck comes from the place that opens it. */
export type GameFields = Omit<GameInput, 'deckId'>;

/** What the dialog is for: a new game, or the game being edited. `null` = closed. */
export type GameDialogTarget = { mode: 'new' } | { mode: 'edit'; game: GameRecord } | null;

const RESULT_OPTIONS: readonly (readonly [GameResult | '', string])[] = [
  ['win', gameTexts.win],
  ['loss', gameTexts.loss],
  ['draw', gameTexts.draw],
];

const TURN_OPTIONS: readonly (readonly [GameTurn | 'none', string])[] = [
  ['first', gameTexts.wentFirst],
  ['second', gameTexts.wentSecond],
  ['none', gameTexts.turnNone],
];

/** Legends shown as search results at a time: the list never needs a scroll area of its own. */
const LEGEND_RESULTS = 6;

/** A line break is one space: the stored texts have no control characters (SR-44). */
const oneLine = (text: string) => text.replace(/[\r\n]+/g, ' ');

/** Why a game was not saved, as the user reads it. */
function errorText(kind: Exclude<GameChangeResult, null>): string {
  if (kind === 'limit-reached') return gameTexts.logFull;
  if (kind === 'invalid-input') return gameTexts.saveInvalid;
  return gameTexts.saveFailed;
}

/**
 * The form of one game (T-122). The result is the only required field; the rest sit in the "More details"
 * disclosure, which is open when editing a game that has some. Everything typed is plain text (SR-46).
 */
function GameForm({
  game,
  legends,
  names,
  events,
  legendsFor,
  onSave,
  onCancel,
}: {
  game: GameRecord | null;
  /** All Legend cards, for the opponent's Legends. */
  legends: readonly Card[];
  /** Earlier opponent names and events (newest first), offered as suggestions. */
  names: readonly string[];
  events: readonly string[];
  /** The Legends of the newest game against an opponent of this name (the prefill). */
  legendsFor: (name: string) => readonly CardKey[];
  onSave: (fields: GameFields) => Promise<GameChangeResult>;
  onCancel: () => void;
}) {
  const ids = useId();
  const [result, setResult] = useState<GameResult | null>(game?.result ?? null);
  const [opponent, setOpponent] = useState(game?.opponentName ?? '');
  const [picked, setPicked] = useState<readonly CardKey[]>(game?.opponentLegends ?? []);
  const [query, setQuery] = useState('');
  const [playedOn, setPlayedOn] = useState(game?.playedOn ?? localDay(new Date()));
  const [turn, setTurn] = useState<GameTurn | null>(game?.turn ?? null);
  const [event, setEvent] = useState(game?.event ?? '');
  const [sideboard, setSideboard] = useState(game?.sideboard ?? false);
  const [note, setNote] = useState(game?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasDetails = game !== null && (game.turn !== null || game.event !== null || game.sideboard || game.note !== null);

  const byKey = useMemo(() => new Map(legends.map((card) => [card.key, card])), [legends]);
  // Keys that are not in the card data are kept as they are but not shown (they still count toward the limit).
  const shown = picked.filter((key) => byKey.has(key));
  const full = picked.length >= MAX_OPPONENT_LEGENDS;
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return [];
    return legends.filter((card) => !picked.includes(card.key) && card.displayName.toLowerCase().includes(needle));
  }, [legends, picked, query]);

  const fillLegends = () => {
    if (picked.length > 0) return;
    const earlier = legendsFor(opponent);
    if (earlier.length > 0) setPicked(earlier);
  };

  const submit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    if (result === null || saving) return;
    if (!isPlayedOn(playedOn)) {
      setError(gameTexts.saveInvalid);
      return;
    }
    setSaving(true);
    setError(null);
    const outcome = await onSave({
      playedOn,
      result,
      opponentName: oneLine(opponent),
      opponentLegends: picked,
      turn,
      event: oneLine(event),
      sideboard,
      note: oneLine(note),
    });
    setSaving(false);
    if (outcome !== null) setError(errorText(outcome));
  };

  return (
    <form className="game-form" onSubmit={(formEvent) => void submit(formEvent)} noValidate>
      <h2 id={`${ids}-title`}>{game === null ? gameTexts.newGameTitle : gameTexts.editGame}</h2>

      <SegmentedChoice
        legend={gameTexts.result}
        legendVisible
        name={`${ids}-result`}
        value={result ?? ''}
        options={RESULT_OPTIONS}
        fill
        onChange={(next) => next !== '' && setResult(next)}
      />

      <div className="field">
        <label htmlFor={`${ids}-opponent`}>{gameTexts.opponent}</label>
        <input
          id={`${ids}-opponent`}
          type="text"
          value={opponent}
          maxLength={MAX_OPPONENT_LENGTH}
          placeholder={gameTexts.opponentPlaceholder}
          list={`${ids}-names`}
          autoComplete="off"
          aria-describedby={`${ids}-opponent-hint`}
          onChange={(changeEvent) => setOpponent(changeEvent.target.value)}
          onBlur={fillLegends}
        />
        <datalist id={`${ids}-names`}>
          {names.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p id={`${ids}-opponent-hint`} className="hint">
          {gameTexts.opponentHint}
        </p>
      </div>

      <div className="field game-legends" role="group" aria-labelledby={`${ids}-legends-label`}>
        <span id={`${ids}-legends-label`} className="field-label">
          {gameTexts.opponentLegends}
        </span>
        <p className="hint">{gameTexts.legendsHint}</p>
        {shown.length > 0 && (
          <ul className="game-chips">
            {shown.map((key) => {
              const card = byKey.get(key);
              if (card === undefined) return null;
              return (
                <li key={key}>
                  <button
                    type="button"
                    className="game-chip"
                    aria-label={gameTexts.legendRemove(card.displayName)}
                    onClick={() => setPicked(picked.filter((item) => item !== key))}
                  >
                    {card.color !== null && <ColorLetters colours={[card.color]} />}
                    <span className="game-chip-name">{card.displayName}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {full ? (
          <p className="hint">{gameTexts.legendsFull}</p>
        ) : (
          <>
            <input
              type="search"
              value={query}
              aria-label={gameTexts.legendSearch}
              placeholder={gameTexts.legendSearch}
              autoComplete="off"
              onChange={(changeEvent) => setQuery(changeEvent.target.value)}
            />
            {query.trim() !== '' && matches.length === 0 && <p className="hint">{gameTexts.legendNoResults}</p>}
            {matches.length > 0 && (
              <ul className="game-matches">
                {matches.slice(0, LEGEND_RESULTS).map((card) => (
                  <li key={card.key}>
                    <button
                      type="button"
                      className="button-secondary game-match"
                      aria-label={gameTexts.legendAdd(card.displayName)}
                      onClick={() => {
                        setPicked([...picked, card.key]);
                        setQuery('');
                      }}
                    >
                      {card.color !== null && <ColorLetters colours={[card.color]} />}
                      <span>{card.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <details className="disclosure game-more" open={hasDetails}>
        <summary>{gameTexts.more}</summary>
        <div className="game-more-body">
          <div className="field">
            <label htmlFor={`${ids}-day`}>{gameTexts.playedOn}</label>
            <input id={`${ids}-day`} type="date" value={playedOn} onChange={(changeEvent) => setPlayedOn(changeEvent.target.value)} />
          </div>
          <SegmentedChoice
            legend={gameTexts.turn}
            legendVisible
            name={`${ids}-turn`}
            value={turn ?? 'none'}
            options={TURN_OPTIONS}
            onChange={(next) => setTurn(next === 'none' ? null : next)}
          />
          <div className="field">
            <label htmlFor={`${ids}-event`}>{gameTexts.event}</label>
            <input
              id={`${ids}-event`}
              type="text"
              value={event}
              maxLength={MAX_EVENT_LENGTH}
              placeholder={gameTexts.eventPlaceholder}
              list={`${ids}-events`}
              autoComplete="off"
              onChange={(changeEvent) => setEvent(changeEvent.target.value)}
            />
            <datalist id={`${ids}-events`}>
              {events.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <SwitchButton checked={sideboard} label={gameTexts.sideboardUsed} onChange={setSideboard} />
          <div className="field">
            <label htmlFor={`${ids}-note`}>{gameTexts.note}</label>
            <textarea
              id={`${ids}-note`}
              className="game-note"
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              rows={Math.min(10, Math.max(3, Math.ceil(note.length / 30)))}
              aria-describedby={`${ids}-note-hint`}
              onChange={(changeEvent) => setNote(changeEvent.target.value)}
            />
            <p id={`${ids}-note-hint`} className="hint">
              {gameTexts.noteHint}
            </p>
          </div>
        </div>
      </details>

      {error !== null && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {result === null && (
        <p id={`${ids}-need-result`} className="hint">
          {gameTexts.resultRequired}
        </p>
      )}
      <div className="row-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>
          {gameTexts.cancel}
        </button>
        <button
          type="submit"
          className="button-primary"
          disabled={result === null || saving}
          aria-describedby={result === null ? `${ids}-need-result` : undefined}
        >
          {gameTexts.save}
        </button>
      </div>
    </form>
  );
}

/**
 * The dialog around the form (T-122): a native modal like the other dialogs; the form is mounted only while it is
 * open, so every opening starts from the game being edited or from an empty form.
 */
export function GameDialog({
  target,
  legends,
  names,
  events,
  legendsFor,
  onSave,
  onClose,
}: {
  target: GameDialogTarget;
  legends: readonly Card[];
  names: readonly string[];
  events: readonly string[];
  legendsFor: (name: string) => readonly CardKey[];
  onSave: (fields: GameFields) => Promise<GameChangeResult>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = target !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog game-dialog"
      aria-label={target?.mode === 'edit' ? gameTexts.editGame : gameTexts.newGameTitle}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {target !== null && (
        <div className="confirm-dialog-body game-dialog-body">
          <GameForm
            key={target.mode === 'edit' ? target.game.id : 'new'}
            game={target.mode === 'edit' ? target.game : null}
            legends={legends}
            names={names}
            events={events}
            legendsFor={legendsFor}
            onSave={onSave}
            onCancel={() => dialogRef.current?.close()}
          />
        </div>
      )}
    </dialog>
  );
}

