import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Card } from '../domain/card';
import type { Deck, DeckContent } from '../domain/deck';
import { checkDeckName, copyContent, copyDeckName, emptyDeckContent, uniqueDeckName } from '../domain/deckEdit';
import { deckTotals, errorsOf, toCardsByKey, validateDeck } from '../domain/deckRules';
import type { CardsByKey } from '../domain/deckRules';
import { StorageError } from '../storage';
import type { LoadNotice, Repositories, StorageErrorKind } from '../storage';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { deckTexts } from './deckTexts';
import { useDecks } from './useDecks';

const dateFormat = new Intl.DateTimeFormat('fi-FI', { dateStyle: 'short', timeStyle: 'short' });

function errorKind(error: unknown): StorageErrorKind | 'unknown' {
  return error instanceof StorageError ? error.kind : 'unknown';
}

function noticeText(notice: LoadNotice): string | null {
  switch (notice.kind) {
    case 'repaired':
      return 'Osa tallennetuista pakoista oli vioittunut, ja ne jätettiin pois listasta.';
    case 'reset':
      return 'Tallennettuja pakkoja ei voitu lukea. Ne on kopioitu varmuuskopioon, ja lista aloitettiin tyhjästä.';
    case 'newer-version':
      return deckTexts.actionFailed('newer-version');
    default:
      return null;
  }
}

/** Counts and legality of one deck, shown on its row. */
function DeckRowSummary({ deck, cardsByKey }: { deck: Deck; cardsByKey: CardsByKey }) {
  const totals = deckTotals(deck, cardsByKey);
  const errors = errorsOf(validateDeck(deck, cardsByKey)).length;
  return (
    <>
      <p className="deck-counts">{deckTexts.counts(totals.legends, totals.main)}</p>
      <p className={errors === 0 ? 'deck-status is-legal' : 'deck-status'}>
        {errors === 0 ? (
          <>
            <span aria-hidden="true">{deckTexts.legal}</span>
            <span className="visually-hidden">{deckTexts.legalSpoken}</span>
          </>
        ) : (
          deckTexts.unfinished(errors)
        )}
      </p>
      <p className="deck-updated">
        {deckTexts.updated} <time dateTime={deck.updatedAt}>{dateFormat.format(new Date(deck.updatedAt))}</time>
      </p>
    </>
  );
}

/** Inline rename form on a deck row. Validates like the repository: 1–100 characters after trimming. */
function RenameForm({
  deck,
  onSave,
  onCancel,
}: {
  deck: Deck;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
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
  const [live, setLive] = useState('');
  /** Element to focus after the next render (a data attribute of a row button, or the heading). */
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const deleteOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (focusTarget === null) return;
    const element =
      focusTarget === 'heading'
        ? headingRef.current
        : document.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(focusTarget)}"]`);
    setFocusTarget(null);
    element?.focus();
  }, [focusTarget]);

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
    setFocusTarget(focus);
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
          <div className="deck-toolbar">
            <button type="button" className="button-primary" onClick={() => void handleCreate()}>
              {deckTexts.newDeck}
            </button>
          </div>

          {decks.length === 0 ? (
            <div className="empty">
              <p>{deckTexts.listEmpty}</p>
            </div>
          ) : (
            <ul className="deck-list" aria-label={deckTexts.decksLabel}>
              {decks.map((deck) => (
                <li key={deck.id} className="deck-row">
                  <h2 className="deck-name">{deck.name}</h2>
                  <DeckRowSummary deck={deck} cardsByKey={cardsByKey} />
                  {renamingId === deck.id ? (
                    <RenameForm
                      deck={deck}
                      onSave={(name) => void handleRename(deck, name)}
                      onCancel={() => {
                        setRenamingId(null);
                        setFocusTarget(`rename-${deck.id}`);
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
          )}
        </>
      )}

      <ConfirmDeleteDialog name={deleting?.name ?? null} onConfirm={handleDelete} onCancel={handleCancelDelete} />
    </>
  );
}
