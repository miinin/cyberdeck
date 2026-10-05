import { intlLocale } from '../locale';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Card } from '../domain/card';
import type { Deck, DeckContent } from '../domain/deck';
import { checkDeckName, copyContent, copyDeckName, emptyDeckContent, uniqueDeckName } from '../domain/deckEdit';
import {
  colorDistribution,
  allDeckCounts,
  deckCounts,
  deckTotals,
  errorsOf,
  groupDeck,
  LEGEND_COUNT,
  MAX_MAIN_DECK,
  MIN_MAIN_DECK,
  toCardsByKey,
  validateDeck,
} from '../domain/deckRules';
import type { CardsByKey, ColorShare, DeckGroups } from '../domain/deckRules';
import type { MissingRow } from '../domain/wants';
import { StorageError } from '../storage';
import type { LoadNotice, Repositories, StorageErrorKind } from '../storage';
import { CardColor } from './CardColor';
import { AddMissingToWantsButton } from './AddMissingToWants';
import { countIn } from './collectionStore';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { DeckCardImage } from './DeckList';
import { DeckImport } from './DeckImport';
import { deckTexts } from './deckTexts';
import { ExportButtons } from './ExportButtons';
import { useCollection } from './useCollection';
import { useDecks } from './useDecks';
import { useWants } from './useWants';
import type { WantsHandle } from './useWants';

const dateFormat = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'short', timeStyle: 'short' });

function errorKind(error: unknown): StorageErrorKind | 'unknown' {
  return error instanceof StorageError ? error.kind : 'unknown';
}

function noticeText(notice: LoadNotice): string | null {
  switch (notice.kind) {
    case 'repaired':
      return deckTexts.decksRepairedNotice;
    case 'reset':
      return deckTexts.decksResetNotice;
    case 'newer-version':
      return deckTexts.actionFailed('newer-version');
    default:
      return null;
  }
}

/** Colours of a deck: the Legends' colours first, then the main deck's, each once. */
function deckColors(grouped: DeckGroups, main: readonly ColorShare[]): string[] {
  const colors = [...grouped.legends.map((row) => row.card.color), ...main.map((share) => share.color)];
  return [...new Set(colors.filter((color): color is string => color !== null))];
}

/**
 * One deck as a card (T-051): the Legends' art as a banner, colours, the main deck progress, legality,
 * what is missing from the collection and when it was changed.
 */
function DeckCardSummary({
  deck,
  cardsByKey,
  ownedOf,
  wants,
}: {
  deck: Deck;
  cardsByKey: CardsByKey;
  /** Copies in the collection, or null when the collection cannot be compared. */
  ownedOf: (key: string) => number | null;
  wants: WantsHandle;
}) {
  const totals = deckTotals(deck, cardsByKey);
  const errors = errorsOf(validateDeck(deck, cardsByKey)).length;
  const grouped = groupDeck(deck, cardsByKey);
  const colors = deckColors(grouped, colorDistribution(deck, cardsByKey));
  const mainState = totals.main < MIN_MAIN_DECK ? 'under' : totals.main > MAX_MAIN_DECK ? 'over' : 'ok';
  const missingRows: MissingRow[] = [];
  let missing: number | null = 0;
  let copies = 0;
  const mainCounts = deckCounts(deck);
  for (const [key, count] of allDeckCounts(deck)) {
    if (!cardsByKey.has(key)) continue;
    copies += mainCounts.get(key) ?? 0;
    const have = ownedOf(key);
    if (have === null) missing = null;
    else if (missing !== null && count > have) {
      missing += count - have;
      missingRows.push({ card: key, missing: count - have });
    }
  }
  const emptySlots = Math.max(0, LEGEND_COUNT - grouped.legends.length);
  return (
    <>
      <div className="deck-card-banner" aria-hidden="true">
        {grouped.legends.slice(0, LEGEND_COUNT).map((row) => (
          <DeckCardImage key={row.card.key} card={row.card} className="deck-card-art" />
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <span key={`empty-${i}`} className="deck-card-art card-image--missing" />
        ))}
      </div>
      <div className="deck-card-body">
        <h2 className="deck-name">{deck.name}</h2>
        {colors.length > 0 && (
          <p className="deck-card-colors">
            <span className="visually-hidden">{deckTexts.deckColors}: </span>
            {colors.map((color) => (
              <span key={color} className="deck-card-color">
                <CardColor color={color} />
              </span>
            ))}
          </p>
        )}
        <p className="deck-counts">{deckTexts.counts(totals.legends, totals.main)}</p>
        <progress
          className={`deck-progress is-${mainState}`}
          max={MAX_MAIN_DECK}
          value={Math.min(totals.main, MAX_MAIN_DECK)}
          aria-hidden="true"
        />
        <div className="deck-card-facts">
          {errors === 0 ? (
            <p className="legality is-legal">
              <span aria-hidden="true">✓</span> {deckTexts.legalSpoken}
            </p>
          ) : (
            <p className="legality is-issues">
              <span aria-hidden="true">⚠</span> {deckTexts.unfinished(errors)}
            </p>
          )}
          {missing !== null && copies > 0 && (
            <p className={missing > 0 ? 'deck-card-missing' : 'deck-card-owned'}>
              {deckTexts.missingFromCollection(missing)}
            </p>
          )}
          {missingRows.length > 0 && (
            <div className="missing-add">
              <AddMissingToWantsButton
                rows={missingRows}
                wants={wants}
                name={deckTexts.forDeck(deckTexts.addMissingToWants, deck.name)}
              />
            </div>
          )}
        </div>
        <p className="deck-updated">
          {deckTexts.updated} <time dateTime={deck.updatedAt}>{dateFormat.format(new Date(deck.updatedAt))}</time>
        </p>
      </div>
    </>
  );
}

/** Inline rename form on a deck row. Validates like the repository: 1–100 characters after trimming. */
function RenameForm({ deck, onSave, onCancel }: { deck: Deck; onSave: (name: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(deck.name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `rename-${deck.id}`;

  useEffect(() => inputRef.current?.select(), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = checkDeckName(text);
    if (!result.ok) {
      setError(result.error === 'empty' ? deckTexts.nameEmpty : deckTexts.nameTooLong);
      inputRef.current?.focus();
      return;
    }
    onSave(result.name);
  };

  return (
    <form className="deck-rename" onSubmit={submit} noValidate>
      <label htmlFor={inputId}>{deckTexts.nameLabel}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={text}
        aria-invalid={error !== null ? 'true' : undefined}
        aria-describedby={error !== null ? `${inputId}-error` : undefined}
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel();
        }}
      />
      {error !== null && (
        <p id={`${inputId}-error`} className="field-error">
          {error}
        </p>
      )}
      <div className="row-actions">
        <button type="submit" className="button-primary">
          {deckTexts.saveName}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          {deckTexts.cancel}
        </button>
      </div>
    </form>
  );
}

export function DecksView({
  cards,
  repositories,
  onOpen,
}: {
  cards: readonly Card[];
  repositories: Repositories;
  onOpen: (id: string) => void;
}) {
  const repository = repositories.decks;
  const { phase, decks, notices, reload } = useDecks(repository);
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Deck | null>(null);
  const [failure, setFailure] = useState<StorageErrorKind | 'unknown' | null>(null);
  /** Open import page, and which field it starts in. */
  const [importing, setImporting] = useState<'text' | 'link' | null>(null);
  const { snapshot: collection } = useCollection(repositories.collection);
  const wants = useWants(repositories.wants);
  const ownedOf = (key: string) => (collection.phase === 'ready' ? countIn(collection, key) : null);
  const [live, setLive] = useState('');
  /** Element to focus after the next render (a data attribute of a row button, or the heading). */
  const focusTarget = useRef<string | null>(null);
  const deleteOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // No dependencies: runs after every render and moves focus once when a target was set.
  useEffect(() => {
    const target = focusTarget.current;
    if (target === null) return;
    focusTarget.current = null;
    const element =
      target === 'heading'
        ? headingRef.current
        : document.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(target)}"]`);
    element?.focus();
  });

  const names = decks.map((deck) => deck.name);

  /** Runs a repository change, then reloads the list. A failure is shown in a box above the list. */
  const run = async (change: () => Promise<unknown>, message: string, focus: string): Promise<boolean> => {
    setFailure(null);
    try {
      await change();
    } catch (error) {
      setFailure(errorKind(error));
      return false;
    }
    await reload();
    setLive(message);
    focusTarget.current = focus;
    return true;
  };

  const handleCreate = async () => {
    const content: DeckContent = emptyDeckContent(uniqueDeckName(names));
    setFailure(null);
    try {
      const deck = await repository.create(content);
      onOpen(deck.id);
    } catch (error) {
      setFailure(errorKind(error));
    }
  };

  const handleRename = async (deck: Deck, name: string) => {
    const ok = await run(
      () => repository.update(deck.id, { name, sections: deck.sections }),
      deckTexts.renamedLive(name),
      `rename-${deck.id}`,
    );
    if (ok) setRenamingId(null);
  };

  const handleCopy = (deck: Deck) => {
    const name = copyDeckName(deck.name, names);
    void run(() => repository.create(copyContent(deck, name)), deckTexts.copiedLive(name), 'heading');
  };

  const handleDelete = () => {
    const deck = deleting;
    if (deck === null) return;
    setDeleting(null);
    void run(() => repository.remove(deck.id), deckTexts.deletedLive(deck.name), 'heading');
  };

  const handleCancelDelete = () => {
    // Also fires after a confirmed delete (the dialog closes); then there is nothing to restore.
    if (deleting === null) return;
    setDeleting(null);
    const opener = deleteOpenerRef.current;
    if (opener?.isConnected) opener.focus();
  };

  if (importing !== null) {
    return (
      <DeckImport
        cards={cards}
        repositories={repositories}
        decks={decks}
        onOpen={onOpen}
        startAtLink={importing === 'link'}
        onClose={() => {
          focusTarget.current = importing === 'link' ? 'netdeck' : 'import';
          setImporting(null);
        }}
      />
    );
  }

  const actions = (
    <div className="deck-toolbar">
      <button type="button" className="button-primary" onClick={() => void handleCreate()}>
        {deckTexts.newDeck}
      </button>
      <button type="button" className="button-secondary" data-focus-id="import" onClick={() => setImporting('text')}>
        {deckTexts.importButton}
      </button>
      <button type="button" className="button-secondary" data-focus-id="netdeck" onClick={() => setImporting('link')}>
        {deckTexts.fetchNetdeck}
      </button>
    </div>
  );

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {deckTexts.listHeading}
      </h1>
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </div>

      {notices.map((notice) => {
        const text = noticeText(notice);
        return text === null ? null : (
          <div key={notice.kind} className="notice notice-warning">
            <p>{text}</p>
          </div>
        );
      })}
      {failure !== null && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.actionFailed(failure)}</p>
          <button type="button" className="button-secondary" onClick={() => setFailure(null)}>
            {deckTexts.errorDismiss}
          </button>
        </div>
      )}

      {phase === 'loading' && <p className="status-line">{deckTexts.listLoading}</p>}
      {phase === 'unavailable' && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.listUnavailable}</p>
        </div>
      )}

      {phase === 'ready' && (
        <>
          {decks.length === 0 ? (
            <div className="empty deck-empty">
              <h2 className="deck-empty-title">{deckTexts.listEmptyTitle}</h2>
              <p>{deckTexts.listEmpty}</p>
              <p className="hint">{deckTexts.listEmptyHint}</p>
              {actions}
            </div>
          ) : (
            <>
              {actions}
              <ul className="deck-list" aria-label={deckTexts.decksLabel}>
                {decks.map((deck) => (
                  <li key={deck.id} className="deck-row">
                    <DeckCardSummary deck={deck} cardsByKey={cardsByKey} ownedOf={ownedOf} wants={wants} />
                    {renamingId === deck.id ? (
                      <RenameForm
                        deck={deck}
                        onSave={(name) => void handleRename(deck, name)}
                        onCancel={() => {
                          setRenamingId(null);
                          focusTarget.current = `rename-${deck.id}`;
                        }}
                      />
                    ) : (
                      <div className="row-actions">
                        <button
                          type="button"
                          className="button-primary"
                          aria-label={deckTexts.forDeck(deckTexts.open, deck.name)}
                          onClick={() => onOpen(deck.id)}
                        >
                          {deckTexts.open}
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          data-focus-id={`rename-${deck.id}`}
                          aria-label={deckTexts.forDeck(deckTexts.rename, deck.name)}
                          onClick={() => setRenamingId(deck.id)}
                        >
                          {deckTexts.rename}
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          aria-label={deckTexts.forDeck(deckTexts.copy, deck.name)}
                          onClick={() => handleCopy(deck)}
                        >
                          {deckTexts.copy}
                        </button>
                        {/* Export before delete, so the destructive action is last (T-050). */}
                        <ExportButtons deck={deck} cardsByKey={cardsByKey} />
                        <button
                          type="button"
                          className="button-secondary"
                          aria-label={deckTexts.forDeck(deckTexts.remove, deck.name)}
                          onClick={(event) => {
                            deleteOpenerRef.current = event.currentTarget;
                            setDeleting(deck);
                          }}
                        >
                          {deckTexts.remove}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <ConfirmDeleteDialog name={deleting?.name ?? null} onConfirm={handleDelete} onCancel={handleCancelDelete} />
    </>
  );
}
