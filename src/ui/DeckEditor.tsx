import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import type { Deck, DeckContent } from '../domain/deck';
import { MAX_DECK_DISTINCT_CARDS } from '../domain/deck';
import { checkDeckName, distinctRows, withDeckCount } from '../domain/deckEdit';
import {
  LEGEND_COUNT,
  addBlocker,
  deckCounts,
  deckTotals,
  groupDeck,
  ramLimits,
  toCardsByKey,
  validateDeck,
} from '../domain/deckRules';
import type { DeckRow } from '../domain/deckRules';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { StorageError } from '../storage';
import type { Repositories, StorageErrorKind } from '../storage';
import { CardFilters } from './CardFilters';
import { CardName } from './CardName';
import { countIn } from './collectionStore';
import { deckTexts } from './deckTexts';
import { texts } from './texts';
import { useCollection } from './useCollection';

/** A change is saved this long after the last edit (T-013). */
export const AUTOSAVE_DELAY_MS = 500;

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
type SaveErrorKind = StorageErrorKind | 'unknown';

const errorKind = (error: unknown): SaveErrorKind => (error instanceof StorageError ? error.kind : 'unknown');

/** "Unit · Red · Cost 3 · RAM 1": plain values, missing ones left out. */
function cardMeta(card: Card): string {
  return [
    card.type,
    card.color,
    card.cost === null ? null : `Cost ${card.cost}`,
    card.ram === null ? null : `RAM ${card.ram}`,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

/** − n + for one card. "−" stays focusable at 0 (aria-disabled) so focus is never lost. */
function Stepper({
  name,
  count,
  onChange,
  addLabel,
  describedBy,
}: {
  name: string;
  count: number;
  onChange: (count: number) => void;
  addLabel?: string;
  /** Id of a visible text that explains why adding breaks a rule. */
  describedBy?: string;
}) {
  return (
    <div className="card-row-controls">
      <button
        type="button"
        className="step step-minus"
        aria-disabled={count === 0 ? 'true' : undefined}
        aria-label={deckTexts.removeCard(name)}
        onClick={() => count > 0 && onChange(count - 1)}
      >
        <span aria-hidden="true">{texts.minusSymbol}</span>
      </button>
      <span className="deck-card-count">
        <span aria-hidden="true">{count}</span>
        <span className="visually-hidden">{deckTexts.inDeck(count)}</span>
      </span>
      <button
        type="button"
        className="step step-plus"
        aria-label={addLabel ?? deckTexts.addCard(name)}
        aria-describedby={describedBy}
        onClick={() => onChange(count + 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

export function DeckEditor({
  deckId,
  cards,
  repositories,
  onBack,
}: {
  deckId: string;
  cards: readonly Card[];
  repositories: Repositories;
  onBack: () => void;
}) {
  const repository = repositories.decks;
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const { snapshot: collection } = useCollection(repositories.collection);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'not-found' | 'unavailable'>('loading');
  const [content, setContent] = useState<DeckContent>({ name: '', sections: [] });
  const contentRef = useRef(content);
  const [nameText, setNameText] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const collectionAllRef = useRef<HTMLInputElement>(null);

  // Autosave: the newest unsaved content waits in `pending`; saves run one after another.
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<SaveErrorKind | null>(null);
  const pending = useRef<DeckContent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    setSaveState('saving');
    chain.current = chain.current
      .then(() => repository.update(deckId, next))
      .then(
        () => {
          setSaveError(null);
          setSaveState((state) => (pending.current === null ? 'saved' : state));
        },
        (error: unknown) => {
          // Nothing newer is waiting: keep this content so "Yritä tallentaa uudelleen" can resend it.
          if (pending.current === null) pending.current = next;
          setSaveError(errorKind(error));
          setSaveState('error');
        },
      );
  }, [repository, deckId]);

  const schedule = useCallback(
    (next: DeckContent) => {
      contentRef.current = next;
      setContent(next);
      pending.current = next;
      setSaveState('dirty');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    let active = true;
    repository.get(deckId).then(
      (deck: Deck | null) => {
        if (!active) return;
        if (deck === null) {
          setPhase('not-found');
          return;
        }
        const loaded = { name: deck.name, sections: deck.sections };
        contentRef.current = loaded;
        setContent(loaded);
        setNameText(deck.name);
        setPhase('ready');
      },
      () => active && setPhase('unavailable'),
    );
    return () => {
      active = false;
    };
  }, [repository, deckId]);

  useEffect(() => {
    if (phase !== 'loading') headingRef.current?.focus();
  }, [phase]);

  // Leaving the editor or closing the tab must not lose the last edit. The update runs its write
  // synchronously, so it also works inside pagehide.
  useEffect(() => {
    const saveNow = () => {
      const next = pending.current;
      if (next === null) return;
      pending.current = null;
      repository.update(deckId, next).catch(() => undefined);
    };
    window.addEventListener('pagehide', saveNow);
    return () => {
      window.removeEventListener('pagehide', saveNow);
      clearTimeout(timer.current);
      saveNow();
    };
  }, [repository, deckId]);

  const issues = useMemo(() => validateDeck(content, cardsByKey), [content, cardsByKey]);
  const totals = useMemo(() => deckTotals(content, cardsByKey), [content, cardsByKey]);
  const limits = useMemo(() => ramLimits(content, cardsByKey), [content, cardsByKey]);
  const counts = useMemo(() => deckCounts(content), [content]);
  const grouped = useMemo(() => groupDeck(content, cardsByKey), [content, cardsByKey]);

  const collectionReady = collection.phase === 'ready';
  const missingCopies = useMemo(() => {
    let missing = 0;
    for (const [key, count] of counts) {
      if (cardsByKey.has(key)) missing += Math.max(0, count - countIn(collection, key));
    }
    return missing;
  }, [counts, cardsByKey, collection]);

  const setCount = (card: Card, count: number) => {
    const base = contentRef.current;
    const isNew = !deckCounts(base).has(card.key);
    if (isNew && count > 0 && distinctRows(base) >= MAX_DECK_DISTINCT_CARDS) {
      setNotice(deckTexts.distinctLimit);
      return;
    }
    setNotice(null);
    schedule(withDeckCount(base, card.key, count));
  };

  const handleName = (text: string) => {
    setNameText(text);
    const result = checkDeckName(text);
    if (!result.ok) {
      setNameError(result.error === 'empty' ? deckTexts.nameEmpty : deckTexts.nameTooLong);
      return;
    }
    setNameError(null);
    if (result.name !== contentRef.current.name) schedule({ ...contentRef.current, name: result.name });
  };

  const handleRetry = () => {
    if (pending.current === null) pending.current = contentRef.current;
    flush();
  };

  const filtered = useMemo(() => filterCards(cards, criteria), [cards, criteria]);
  const legendsCount = totals.legends;

  if (phase !== 'ready') {
    return (
      <>
        <h1 ref={headingRef} tabIndex={-1}>
          {phase === 'loading' ? deckTexts.editorLoading : deckTexts.listHeading}
        </h1>
        {phase !== 'loading' && (
          <div className="notice notice-danger" role="alert">
            <p>{phase === 'not-found' ? deckTexts.editorNotFound : deckTexts.listUnavailable}</p>
          </div>
        )}
        <p className="editor-back">
          <button type="button" className="button-secondary" onClick={onBack}>
            {deckTexts.backToList}
          </button>
        </p>
      </>
    );
  }

  const renderDeckRow = (row: DeckRow) => {
    const have = collectionReady ? countIn(collection, row.card.key) : null;
    const missing = have !== null && have < row.count;
    return (
      <li key={row.card.key} className={'card-row' + (missing ? ' is-missing' : '')}>
        <span className="card-row-name">
          <span>
            <CardName card={row.card} />
          </span>
          <span className="card-row-meta">
            {cardMeta(row.card)}
            {have !== null && (
              <>
                {' · '}
                {deckTexts.owned(have, row.count)}
                {missing && ` · ${deckTexts.missingBadge}`}
              </>
            )}
          </span>
        </span>
        <Stepper
          name={row.card.displayName}
          count={row.count}
          onChange={(count) => setCount(row.card, count)}
        />
      </li>
    );
  };

  return (
    <>
      <p className="editor-back">
        <button type="button" className="button-secondary" onClick={onBack}>
          {deckTexts.backToList}
        </button>
      </p>
      <h1 ref={headingRef} tabIndex={-1}>
        {content.name}
      </h1>

      <div className="deck-name-field">
        <label htmlFor="deck-name">{deckTexts.nameLabel}</label>
        <input
          id="deck-name"
          type="text"
          value={nameText}
          aria-invalid={nameError !== null ? 'true' : undefined}
          aria-describedby={nameError !== null ? 'deck-name-error' : 'deck-name-hint'}
          onChange={(event) => handleName(event.target.value)}
        />
        <p id="deck-name-hint" className="hint">
          {deckTexts.nameHint}
        </p>
        {nameError !== null && (
          <p id="deck-name-error" className="field-error">
            {nameError}
          </p>
        )}
      </div>

      {saveState === 'error' ? (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.saveFailed(saveError ?? 'unknown')}</p>
          <button type="button" className="button-secondary" onClick={handleRetry}>
            {deckTexts.saveRetry}
          </button>
        </div>
      ) : (
        <p className="save-status" role="status">
          {saveState === 'saved' ? deckTexts.saveSaved : saveState === 'saving' ? deckTexts.saveSaving : deckTexts.saveDirty}
        </p>
      )}

      <section className="deck-summary" aria-labelledby="summary-heading">
        <h2 id="summary-heading">{deckTexts.summaryHeading}</h2>
        <p>{deckTexts.counts(totals.legends, totals.main)}</p>
        <p>
          {limits.size === 0
            ? deckTexts.ramLimitsNone
            : `${deckTexts.ramLimitsLabel}: ${[...limits].map(([color, limit]) => deckTexts.ramLimit(color, limit)).join(' · ')}`}
        </p>
        <p>
          {collectionReady
            ? deckTexts.missingFromCollection(missingCopies)
            : collection.phase === 'loading'
              ? ''
              : deckTexts.collectionNotReady}
        </p>
        <div aria-live="polite" aria-atomic="true">
          {issues.length === 0 ? (
            <p>{deckTexts.allGood}</p>
          ) : (
            <>
              <h3 className="visually-hidden">{deckTexts.issuesHeading}</h3>
              <ul className="issue-list">
                {issues.map((issue) => (
                  <li key={issue.type + issue.cards.join(',')} className={issue.severity === 'warning' ? 'is-warning' : undefined}>
                    {issue.severity === 'warning' ? deckTexts.warningPrefix : ''}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <p className="hint">{deckTexts.rulesNote}</p>
        {notice !== null && (
          <p className="field-error" role="alert">
            {notice}
          </p>
        )}
      </section>

      <div className="editor-layout">
        <section className="editor-search" aria-labelledby="search-heading">
          <h2 id="search-heading">{deckTexts.searchHeading}</h2>
          <CardFilters
            criteria={criteria}
            typeOptions={filterOptions(KNOWN_CARD_TYPES, cards.map((card) => card.type), criteria.types)}
            colorOptions={filterOptions(KNOWN_CARD_COLORS, cards.map((card) => card.color), criteria.colors)}
            rarityOptions={filterOptions(KNOWN_CARD_RARITIES, cards.map((card) => card.rarity), criteria.rarities)}
            searchInputRef={searchInputRef}
            collectionAllRef={collectionAllRef}
            onCollectionFilterChange={() => undefined}
            onQueryChange={(query) => setCriteria({ ...criteria, query })}
            onToggleType={(type) => setCriteria({ ...criteria, types: toggleValue(criteria.types, type) })}
            onToggleColor={(color) => setCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) })}
            onToggleRarity={(rarity) =>
              setCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) })
            }
            onSearchSubmit={() => undefined}
          />
          <p className="status-line" role="status">
            {deckTexts.searchResults(filtered.length, cards.length)}
          </p>
          {filtered.length === 0 ? (
            <p className="empty">{deckTexts.noSearchResults}</p>
          ) : (
            <ul className="search-results" aria-label={deckTexts.searchHeading}>
              {filtered.map((card) => {
                const blocker = addBlocker(card, content, cardsByKey);
                const hintId = `blocker-${card.key}`;
                return (
                  <li key={card.key} className={'card-row' + (blocker !== null ? ' is-dimmed' : '')}>
                    <span className="card-row-name">
                      <span>
                        <CardName card={card} />
                      </span>
                      <span className="card-row-meta">{cardMeta(card)}</span>
                      {blocker !== null && (
                        <span id={hintId} className="card-row-meta">
                          {deckTexts.dimmedHint(blocker)}
                        </span>
                      )}
                    </span>
                    <Stepper
                      name={card.displayName}
                      count={counts.get(card.key) ?? 0}
                      onChange={(count) => setCount(card, count)}
                      describedBy={blocker !== null ? hintId : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="editor-deck" aria-labelledby="deck-heading">
          <h2 id="deck-heading" className="visually-hidden">
            {deckTexts.sectionLabel(content.name)}
          </h2>
          <div className="deck-section">
            <h2>
              {deckTexts.legendsHeading} ({legendsCount}/{LEGEND_COUNT})
            </h2>
            {grouped.legends.length === 0 ? (
              <p className="hint">{deckTexts.legendsEmpty}</p>
            ) : (
              <ul className="deck-cards">{grouped.legends.map(renderDeckRow)}</ul>
            )}
          </div>
          <div className="deck-section">
            <h2>
              {deckTexts.mainHeading} ({totals.main})
            </h2>
            {grouped.groups.length === 0 && grouped.unknown.length === 0 && (
              <p className="hint">{deckTexts.deckEmpty}</p>
            )}
            {grouped.groups.map((group) => (
              <div key={group.type}>
                <h3 className="deck-group-title" lang="en">
                  {group.type} ({group.rows.reduce((sum, row) => sum + row.count, 0)})
                </h3>
                <ul className="deck-cards">{group.rows.map(renderDeckRow)}</ul>
              </div>
            ))}
            {grouped.unknown.length > 0 && (
              <div>
                <h3 className="deck-group-title">{deckTexts.unknownHeading}</h3>
                <ul className="deck-cards">
                  {grouped.unknown.map(({ key, count }) => (
                    <li key={key} className="card-row">
                      <span className="card-row-name">{key}</span>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => schedule(withDeckCount(contentRef.current, key, 0))}
                      >
                        {deckTexts.removeUnknown(key, count)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
