import { intlLocale } from '../locale';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
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
import { recordsByDeck, recordText } from '../domain/gameStats';
import type { Tally } from '../domain/gameStats';
import { buildPublicDeckInput } from '../domain/publicDeck';
import type { MissingRow } from '../domain/wants';
import { StorageError } from '../storage';
import type { LoadNotice, Repositories, StorageErrorKind } from '../storage';
import { AddMissingToWantsButton } from './AddMissingToWants';
import { DeckBuildView } from './DeckBuildView';
import { countIn } from './collectionStore';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { PencilIcon, TrashIcon } from './icons';
import { DeckCardImage } from './DeckList';
import { DeckImport } from './DeckImport';
import { DeckActions } from './DeckImportMenu';
import { requestDeckScan } from './scanIntent';
import { deckTexts } from './deckTexts';
import { ExportButtons } from './ExportButtons';
import { PublicDecksList } from './PublicDecksList';
import { usePublicDecks } from './PublicDecksContext';
import { forgetPublicDecks } from './publicDecksCache';
import { routeHash } from './useHashRoute';
import { useCollection } from './useCollection';
import { gameTexts } from './gameTexts';
import { useDecks } from './useDecks';
import { useGameLog } from './useGameLog';
import { useWants } from './useWants';
import type { WantsHandle } from './useWants';

const dateFormat = new Intl.DateTimeFormat(intlLocale, {
  dateStyle: 'short',
  timeStyle: 'short',
});

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

/**
 * The deck's colour code as players write it (T-117): one letter per Legend, the most common colour first, e.g. two
 * Green and one Red Legend = "GGR". Without Legends, one letter per main deck colour.
 */
export function deckColorCode(grouped: DeckGroups, main: readonly ColorShare[]): string[] {
  const legendColors = grouped.legends.map((row) => row.card.color).filter((color): color is string => color !== null);
  if (legendColors.length === 0) {
    return [...new Set(main.map((share) => share.color).filter((color): color is string => color !== null))];
  }
  const counts = new Map<string, number>();
  for (const color of legendColors) counts.set(color, (counts.get(color) ?? 0) + 1);
  // Map keeps first-seen order, and the sort is stable, so ties stay in Legend order.
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).flatMap(([color, count]) => Array<string>(count).fill(color));
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
  nameAction,
  record,
}: {
  deck: Deck;
  cardsByKey: CardsByKey;
  /** Copies in the collection, or null when the collection cannot be compared. */
  ownedOf: (key: string) => number | null;
  wants: WantsHandle;
  /** The rename button, shown after the deck name. */
  nameAction: ReactNode;
  /** The deck's game record (T-122), or undefined when no games are logged. */
  record?: Tally;
}) {
  const totals = deckTotals(deck, cardsByKey);
  const errors = errorsOf(validateDeck(deck, cardsByKey)).length;
  const grouped = groupDeck(deck, cardsByKey);
  const colors = deckColorCode(grouped, colorDistribution(deck, cardsByKey));
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
        <h2 className="deck-name">
          {deck.name}
          {nameAction}
        </h2>
        <div className="deck-card-meta">
          <p className="deck-counts">{deckTexts.counts(totals.legends, totals.main)}</p>
          {colors.length > 0 && (
            <p className="deck-color-code">
              <span className="visually-hidden">{`${deckTexts.deckColors}: ${colors.join(', ')}`}</span>
              <span aria-hidden="true">
                {colors.map((color, index) => (
                  <span key={index} className={`deck-color-letter is-${color.toLowerCase()}`}>
                    {color.charAt(0).toUpperCase()}
                  </span>
                ))}
              </span>
            </p>
          )}
          {record !== undefined && (
            <p className="deck-record">
              <span className="visually-hidden">{gameTexts.recordAria(record.wins, record.losses, record.draws)}</span>
              <span aria-hidden="true" title={gameTexts.recordAria(record.wins, record.losses, record.draws)}>
                {recordText(record)}
              </span>
            </p>
          )}
        </div>
        <progress
          className={`deck-progress is-${mainState}`}
          max={MAX_MAIN_DECK}
          value={Math.min(totals.main, MAX_MAIN_DECK)}
          aria-hidden="true"
        />
        <p className="deck-card-facts">
          {errors === 0 ? (
            <span className="legality is-legal">
              <span aria-hidden="true">✓</span> {deckTexts.legalSpoken}
            </span>
          ) : (
            <span className="legality is-issues">
              <span aria-hidden="true">⚠</span> {deckTexts.unfinished(errors)}
            </span>
          )}
          {missing !== null && copies > 0 && (
            <>
              <span aria-hidden="true"> · </span>
              <span className={missing > 0 ? 'deck-card-missing' : 'deck-card-owned'}>
                {missing > 0 ? deckTexts.missingShort(missing) : deckTexts.allOwnedShort}
              </span>
            </>
          )}
        </p>
        {missingRows.length > 0 && (
          <div className="missing-add missing-add--quiet">
            <AddMissingToWantsButton
              rows={missingRows}
              wants={wants}
              className="link-button missing-link"
              name={deckTexts.forDeck(deckTexts.addMissingToWants, deck.name)}
            />
          </div>
        )}
        <p className="deck-updated">
          {deckTexts.updated} <time dateTime={deck.updatedAt}>{dateFormat.format(new Date(deck.updatedAt))}</time>
        </p>
        {deck.publish?.public === true && <p className="deck-public-badge">{deckTexts.publicBadge}</p>}
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
  tab = 'own',
  onOpen,
}: {
  cards: readonly Card[];
  repositories: Repositories;
  /** "own" = the user's decks, "public" = the public decks of everyone (T-098). */
  tab?: 'own' | 'public' | 'build';
  onOpen: (id: string) => void;
}) {
  const repository = repositories.decks;
  const { store: publicStore, publisher } = usePublicDecks();
  const [removeFailed, setRemoveFailed] = useState(false);
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
  const gameLog = useGameLog(repositories.games);
  const records = useMemo(() => recordsByDeck(gameLog.log.games), [gameLog.log]);
  const ownedOf = (key: string) => (collection.phase === 'ready' ? countIn(collection, key) : null);
  const [live, setLive] = useState('');
  /** Element to focus after the next render (a data attribute of a row button, or the heading). */
  const focusTarget = useRef<string | null>(null);
  const deleteOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
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

  const handleCreate = async (scan = false) => {
    const content: DeckContent = emptyDeckContent(uniqueDeckName(names));
    setFailure(null);
    try {
      const deck = await repository.create(content);
      if (scan) requestDeckScan(deck.id);
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
    if (ok) {
      setRenamingId(null);
      // A public deck shows its new name in the public list too (delayed like every public update, SR-34).
      if (deck.publish?.public === true && publisher !== null) {
        const built = buildPublicDeckInput(deck.id, { name, sections: deck.sections }, cardsByKey, deck.publish.nickname);
        if (built.ok) publisher.schedule(built.input);
      }
    }
  };

  const handleCopy = (deck: Deck) => {
    const name = copyDeckName(deck.name, names);
    void run(() => repository.create(copyContent(deck, name)), deckTexts.copiedLive(name), 'heading');
  };

  const handleDelete = () => {
    const deck = deleting;
    if (deck === null) return;
    setDeleting(null);
    setRemoveFailed(false);
    void run(
      async () => {
        // SR-35: the public copy goes first; if it cannot be deleted, the deck stays and so does the copy.
        if (deck.publish?.public === true && publisher !== null) {
          try {
            await publisher.unpublish(deck.id);
          } catch (error) {
            setRemoveFailed(true);
            throw error;
          }
          forgetPublicDecks(publicStore);
        }
        await repository.remove(deck.id);
      },
      deckTexts.deletedLive(deck.name),
      'heading',
    );
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
          focusTarget.current = 'import-menu';
          setImporting(null);
        }}
      />
    );
  }

  const actions = <DeckActions onCreate={() => void handleCreate()} onScan={() => void handleCreate(true)} onImport={setImporting} />;
  const showHeadActions = tab === 'own' && phase === 'ready' && decks.length > 0;

  return (
    <>
      <div className="page-head decks-head">
        <h1 ref={headingRef} tabIndex={-1}>
          {deckTexts.listHeading}
        </h1>
        {showHeadActions && actions}
      </div>
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </div>
      <nav className="segmented decks-tabs" aria-label={deckTexts.decksTabsLabel}>
        <a className="segmented-option" href={routeHash({ name: 'decks' })} aria-current={tab === 'own' ? 'page' : undefined}>
          {deckTexts.tabOwn}
        </a>
        <a className="segmented-option" href={routeHash({ name: 'deckBuild' })} aria-current={tab === 'build' ? 'page' : undefined}>
          {deckTexts.tabBuild}
        </a>
        <a className="segmented-option" href={routeHash({ name: 'publicDecks' })} aria-current={tab === 'public' ? 'page' : undefined}>
          {deckTexts.tabPublic}
        </a>
      </nav>
      {tab === 'public' && <PublicDecksList onOpen={(id) => (window.location.hash = routeHash({ name: 'publicDeck', id }))} />}

      {tab === 'own' && notices.map((notice) => {
        const text = noticeText(notice);
        return text === null ? null : (
          <div key={notice.kind} className="notice notice-warning">
            <p>{text}</p>
          </div>
        );
      })}
      {tab === 'own' && failure !== null && (
        <div className="notice notice-danger" role="alert">
          <p>{removeFailed ? deckTexts.visRemoveFailed : deckTexts.actionFailed(failure)}</p>
          <button type="button" className="button-secondary" onClick={() => setFailure(null)}>
            {deckTexts.errorDismiss}
          </button>
        </div>
      )}

      {tab !== 'public' && phase === 'loading' && <p className="status-line">{deckTexts.listLoading}</p>}
      {tab !== 'public' && phase === 'unavailable' && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.listUnavailable}</p>
        </div>
      )}

      {tab === 'build' && phase === 'ready' && collection.phase === 'loading' && <p className="status-line">{deckTexts.buildCollectionLoading}</p>}
      {tab === 'build' && phase === 'ready' && collection.phase !== 'loading' && collection.phase !== 'ready' && decks.length > 0 && (
        <div className="notice notice-warning">
          <p>{deckTexts.collectionNotReady}</p>
        </div>
      )}
      {tab === 'build' && phase === 'ready' && (decks.length === 0 || collection.phase === 'ready') && (
        <DeckBuildView decks={decks} cardsByKey={cardsByKey} owned={(key) => countIn(collection, key)} wants={wants} />
      )}

      {tab === 'own' && phase === 'ready' && (
        <>
          {decks.length === 0 ? (
            <div className="empty">
              <h2>{deckTexts.listEmptyTitle}</h2>
              <p>{deckTexts.listEmpty}</p>
              {actions}
            </div>
          ) : (
            <>
              <ul className="deck-list" aria-label={deckTexts.decksLabel}>
                {decks.map((deck) => (
                  <li key={deck.id} className="deck-row">
                    <DeckCardSummary
                      deck={deck}
                      cardsByKey={cardsByKey}
                      ownedOf={ownedOf}
                      wants={wants}
                      record={records.get(deck.id)}
                      nameAction={
                        renamingId === deck.id ? null : (
                          <button
                            type="button"
                            className="icon-button"
                            data-focus-id={`rename-${deck.id}`}
                            aria-label={deckTexts.forDeck(deckTexts.rename, deck.name)}
                            title={deckTexts.forDeck(deckTexts.rename, deck.name)}
                            onClick={() => setRenamingId(deck.id)}
                          >
                            <PencilIcon />
                          </button>
                        )
                      }
                    />
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
                          className="button-secondary button-compact"
                          aria-label={deckTexts.forDeck(deckTexts.copy, deck.name)}
                          onClick={() => handleCopy(deck)}
                        >
                          {deckTexts.copy}
                        </button>
                        {/* Export before delete, so the destructive action is last (T-050). */}
                        <ExportButtons deck={deck} cardsByKey={cardsByKey} />
                        <button
                          type="button"
                          className="button-secondary icon-delete"
                          aria-label={deckTexts.forDeck(deckTexts.removeDeck, deck.name)}
                          title={deckTexts.forDeck(deckTexts.removeDeck, deck.name)}
                          onClick={(event) => {
                            deleteOpenerRef.current = event.currentTarget;
                            setDeleting(deck);
                          }}
                        >
                          <TrashIcon />
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

      <ConfirmDeleteDialog
        name={deleting?.name ?? null}
        extra={deleting !== null && records.has(deleting.id) ? gameTexts.deleteDeckGames(records.get(deleting.id)?.games ?? 0) : undefined}
        onConfirm={handleDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
