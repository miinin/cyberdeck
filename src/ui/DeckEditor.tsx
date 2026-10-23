import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import type { Deck, DeckContent, DeckPublish } from '../domain/deck';
import { buildPublicDeckInput } from '../domain/publicDeck';
import { MAX_DECK_DISTINCT_CARDS, MAX_DECK_NAME_LENGTH, SIDEBOARD_SIZE } from '../domain/deck';
import { checkDeckName, copyDeckName, distinctRows, withDeckCount, withSideboardCount } from '../domain/deckEdit';
import {
  MAX_MAIN_DECK,
  MIN_MAIN_DECK,
  MAX_COPIES,
  addBlockerInfo,
  allDeckCounts,
  sideboardCounts,
  sideboardSize,
  colorDistribution,
  costCurve,
  deckCounts,
  deckTotals,
  groupDeck,
  hasSameNameLegend,
  ramLimits,
  toCardsByKey,
  validateDeck,
  MAX_COPIES as COPY_LIMIT,
} from '../domain/deckRules';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  officialRarity,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  isFilterActive,
  numberFilterOptionsFor,
  toggleValue,
  tagOptions,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { StorageError } from '../storage';
import type { DeckListView, DeckPickView, Repositories, StorageErrorKind } from '../storage';
import { ActiveFilters, criteriaFilters } from './ActiveFilters';
import { CardFilters } from './CardFilters';
import type { CollectionFilter } from './CardFilters';
import { useCardHoverPreview } from './CardHoverPreview';
import { openCardPage } from './cardRoute';
import { cardNameText } from './CardName';
import { DeckPickImage } from './DeckPickImage';
import { DeckVisibility } from './DeckVisibility';
import { InfoTip } from './InfoTip';
import { goldfishTexts } from './goldfishTexts';
import type { PublishResult } from './DeckVisibility';
import { usePublicDecks } from './PublicDecksContext';
import { forgetPublicDecks } from './publicDecksCache';
import type { PublishState } from '../account';

/** A left arrow for the back button of the header. */
function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  );
}

/** A play triangle for the solo play button of the header. */
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** A constant, so useSyncExternalStore sees an unchanged snapshot. */
const PICK_VIEW_OPTIONS = [
  ['images', deckTexts.pickViewImages],
  ['list', deckTexts.pickViewList],
] as const;

const IDLE_PUBLISH: PublishState = { kind: 'idle' };
import { DeckList } from './DeckList';
import type { DeckView } from './DeckList';
import { DeckPickTable } from './DeckPickTable';
import { DeckResults } from './DeckResults';
import { DeckStats } from './DeckStats';
import { Sideboard } from './Sideboard';
import { deckProblems } from './DeckProblems';
import type { MissingCard } from '../domain/deckExport';
import { applySubstitutes, findSubstitutes, playability as playabilityOf } from '../domain/substitutes';
import type { PickBlocker } from './DeckPickTable';
import { countIn } from './collectionStore';
import { deckTexts } from './deckTexts';
import { ExportButtons } from './ExportButtons';
import { ImageSizeSelect } from './ListToolbar';
import type { ImageSize } from './ListToolbar';
import { Stepper } from './Stepper';
import { texts } from './texts';
import { useCollection } from './useCollection';
import { WantCleanupBar, useWantCleanup } from './useWantCleanup';
import { useWants } from './useWants';
import { proxyTexts } from './proxyTexts';
import { SendToProxyButton, useProxyQueue } from './SendToProxy';
import { trackDeckSave } from './useDecks';
import { EDITOR_TABS_QUERY, EDITOR_WIDE_QUERY, FINE_POINTER_QUERY, useMediaQuery } from './useMediaQuery';
import { SegmentedChoice } from './SegmentedChoice';
import { ScanCardsButton, cameraSupported } from './CardScanner';
import type { DeckPart, ScanDeckTarget } from './CardScanner';
import { clearDeckScan, deckScanRequested } from './scanIntent';
import { useDefaultEdition } from './useDefaultEdition';

/** A change is saved this long after the last edit (T-013). */
export const AUTOSAVE_DELAY_MS = 500;

/** A count change is announced this long after the last one, so fast repeats are told once (T-050b). */
export const CHANGE_ANNOUNCE_MS = 400;

/** The "same Legend" message stays this long (T-045). */
export const TOAST_MS = 4000;

/** Why a card cannot be added to the deck: a notice stays on the page, the rest is a short toast. */
interface AddBlock {
  text: string;
  notice: boolean;
}

/** The parts of the editor: the deck, the card picker (a tab only on a narrow screen), the statistics and the results. */
type EditorTab = 'deck' | 'add' | 'stats' | 'results';

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
type SaveErrorKind = StorageErrorKind | 'unknown';

const errorKind = (error: unknown): SaveErrorKind => (error instanceof StorageError ? error.kind : 'unknown');

export function DeckEditor({
  deckId,
  cards,
  repositories,
  onBack,
  onOpenDeck,
}: {
  deckId: string;
  cards: readonly Card[];
  repositories: Repositories;
  onBack: () => void;
  /** Opens another deck in the editor (the copy made with own cards, T-121). */
  onOpenDeck?: (id: string) => void;
}) {
  const repository = repositories.decks;
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const { snapshot: collection, store: collectionStore } = useCollection(repositories.collection);
  const [scanEdition, setScanEdition] = useDefaultEdition(repositories);
  // Opened from the Scan a new deck button (T-119): the scanner opens as soon as the editor shows.
  const [scanAtStart] = useState(() => deckScanRequested(deckId));
  useEffect(() => clearDeckScan, []);
  const wants = useWants(repositories.wants);
  const wantCleanup = useWantCleanup(collectionStore, wants, cards);
  const proxyQueue = useProxyQueue(repositories.proxy);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'not-found' | 'unavailable'>('loading');
  const [content, setContent] = useState<DeckContent>({ name: '', sections: [] });
  const contentRef = useRef(content);
  const [nameText, setNameText] = useState('');
  const nameFieldRef = useRef<HTMLTextAreaElement>(null);
  // UX-21 (T-174): the name field grows with its text, so a long name is never cut off.
  useLayoutEffect(() => {
    const grow = () => {
      const field = nameFieldRef.current;
      if (field === null) return;
      field.style.blockSize = 'auto';
      field.style.blockSize = `${field.scrollHeight}px`;
    };
    grow();
    window.addEventListener('resize', grow);
    return () => window.removeEventListener('resize', grow);
  }, [nameText]);
  // Publishing settings (T-098) live in the stored deck, not in the content the autosave writes.
  const [publish, setPublish] = useState<DeckPublish | undefined>(undefined);
  const publishRef = useRef<DeckPublish | undefined>(undefined);
  const { store: publicStore, publisher, signInAvailable } = usePublicDecks();
  const subscribePublish = useCallback(
    (listener: () => void) => publisher?.onChange(listener) ?? (() => undefined),
    [publisher],
  );
  const publishState = useSyncExternalStore(subscribePublish, () => publisher?.state(deckId) ?? IDLE_PUBLISH);
  /** True after an edit in this editor: the public copy is sent when the editor is left (SR-34). */
  const publicDirty = useRef(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pickView, setPickView] = useState<DeckPickView>('list');
  const pickViewChosen = useRef(false);
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  /** UX-09 (T-174): the "Kokoelma" choice of the results. The default stays "Kaikki" (changing it is a product decision). */
  const [collectionChoice, setCollectionChoice] = useState<CollectionFilter>('all');
  const tagChoices = useMemo(() => tagOptions(cards), [cards]);
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const collectionAllRef = useRef<HTMLInputElement>(null);
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [changeText, setChangeText] = useState('');
  const changeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clickAdds = useMediaQuery(FINE_POINTER_QUERY, true);
  const preview = useCardHoverPreview();
  const [deckView, setDeckView] = useState<DeckView>('list');
  const deckViewChosen = useRef(false);
  const [deckInView, setDeckInView] = useState(false);
  const sideRef = useRef<HTMLElement>(null);
  const deckHeadingRef = useRef<HTMLHeadingElement>(null);
  const issuesHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => clearTimeout(changeTimer.current), []);

  // Autosave: the newest unsaved content waits in `pending`; saves run one after another.
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<SaveErrorKind | null>(null);
  const saveStateRef = useRef<SaveState>('saved');
  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);
  const pending = useRef<DeckContent | null>(null);
  /** The updatedAt we last loaded or saved: a different stored value means another tab or a sync changed the deck. */
  const knownUpdatedAt = useRef<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  /** Queues the newest content of a public deck for the delayed public update (SR-34). */
  const queuePublic = useCallback(
    (saved: DeckContent) => {
      const settings = publishRef.current;
      if (publisher === null || settings === undefined || !settings.public) return;
      const built = buildPublicDeckInput(deckId, saved, cardsByKey, settings.nickname);
      if (built.ok) publisher.schedule(built.input);
    },
    [publisher, deckId, cardsByKey],
  );

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    setSaveState('saving');
    chain.current = chain.current
      .then(() => repository.update(deckId, next, { expectedUpdatedAt: knownUpdatedAt.current }))
      .then(
        (saved) => {
          knownUpdatedAt.current = saved.updatedAt;
          queuePublic(saved);
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
  }, [repository, deckId, queuePublic]);

  const schedule = useCallback(
    (next: DeckContent) => {
      contentRef.current = next;
      setContent(next);
      publicDirty.current = true;
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
        knownUpdatedAt.current = deck.updatedAt;
        const loaded = { name: deck.name, sections: deck.sections };
        contentRef.current = loaded;
        publishRef.current = deck.publish;
        setPublish(deck.publish);
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

  // Another tab or a sync changed the stored decks: without unsaved changes of our own the editor shows the
  // newest version; with them, the conflict shows when saving (T-054d).
  useEffect(() => {
    if (phase !== 'ready') return;
    let active = true;
    const unsubscribe = repository.subscribe(() => {
      if (pending.current !== null || saveStateRef.current !== 'saved') return;
      void repository.get(deckId).then((deck) => {
        if (!active || pending.current !== null || saveStateRef.current !== 'saved') return;
        if (deck === null) {
          setPhase('not-found');
        } else if (deck.updatedAt !== knownUpdatedAt.current) {
          knownUpdatedAt.current = deck.updatedAt;
          publishRef.current = deck.publish;
          setPublish(deck.publish);
          const latest = { name: deck.name, sections: deck.sections };
          // Only the publishing settings may have changed (our own change): the content stays as it is.
          if (JSON.stringify(latest) !== JSON.stringify(contentRef.current)) {
            contentRef.current = latest;
            setContent(latest);
            setNameText(deck.name);
            setChangeText(deckTexts.reloadedLatest);
          }
        }
      }, () => undefined);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [phase, repository, deckId]);

  // The result view is remembered like the catalog view (T-045); a choice made before loading wins.
  useEffect(() => {
    void repositories.preferences.loadDeckPickView().then((saved) => {
      if (!pickViewChosen.current) setPickView(saved);
    });
  }, [repositories]);

  // The deck column view is remembered too (T-115); a choice made before loading wins.
  useEffect(() => {
    void repositories.preferences.loadDeckListView().then((saved) => {
      if (!deckViewChosen.current) setDeckView(saved);
    });
  }, [repositories]);

  const handleDeckView = (next: DeckListView) => {
    deckViewChosen.current = true;
    setDeckView(next);
    repositories.preferences.saveDeckListView(next).catch(() => undefined);
  };

  // The "same Legend" message goes away by itself after 4 s (T-045).
  useEffect(() => {
    if (toast === null) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (phase !== 'loading') headingRef.current?.focus({ preventScroll: true });
  }, [phase]);

  // Leaving the editor or closing the tab must not lose the last edit. The update runs its write
  // synchronously when called directly, so that also works inside pagehide.
  useEffect(() => {
    const saveNow = (afterRunningSave: boolean) => {
      const next = pending.current;
      // The deck list reads after leaving: it waits for the saves still running (B-017).
      if (next === null) {
        if (afterRunningSave) trackDeckSave(chain.current);
        return;
      }
      pending.current = null;
      // On unmount, wait for a save already in flight so the older content cannot land last.
      const write = () => repository.update(deckId, next);
      const save = afterRunningSave ? chain.current.then(write) : write();
      if (afterRunningSave) trackDeckSave(save);
      void save.catch(() => undefined);
    };
    const onPageHide = () => saveNow(false);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      clearTimeout(timer.current);
      saveNow(true);
      // Leaving the editor sends the public copy now (SR-34); the publisher outlives the editor.
      const settings = publishRef.current;
      if (publisher !== null && settings?.public === true && publicDirty.current) {
        publicDirty.current = false;
        const built = buildPublicDeckInput(deckId, contentRef.current, cardsByKey, settings.nickname);
        if (built.ok) {
          publisher.schedule(built.input);
          void publisher.flush(deckId).then(() => forgetPublicDecks(publicStore));
        }
      }
    };
    // cardsByKey is read at unmount time only; a change of it must not run the cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, deckId, publisher, publicStore]);

  /** Writes the publishing settings after the autosave has finished, so the two never conflict (T-098). */
  const savePublish = async (next: DeckPublish | undefined): Promise<void> => {
    flush();
    await chain.current;
    const saved = await repository.setPublish(deckId, next);
    knownUpdatedAt.current = saved.updatedAt;
    publishRef.current = saved.publish;
    setPublish(saved.publish);
  };

  /** Publishes or updates the nickname: the setting goes to the private deck first, then the public copy (SR-35). */
  const handlePublish = async (nickname: string | null): Promise<PublishResult> => {
    if (publisher === null) return 'failed';
    const built = buildPublicDeckInput(deckId, contentRef.current, cardsByKey, nickname);
    if (!built.ok) return built.error;
    const previous = publishRef.current;
    try {
      await savePublish({ public: true, nickname });
    } catch {
      return 'failed';
    }
    publisher.schedule(built.input);
    await publisher.flush(deckId);
    if (publisher.state(deckId).kind === 'error') {
      // Not published: do not leave the deck marked public (best effort).
      publisher.cancel(deckId);
      await savePublish(previous).catch(() => undefined);
      return 'failed';
    }
    publicDirty.current = false;
    forgetPublicDecks(publicStore);
    return 'ok';
  };

  /** Makes the deck private: the public copy is deleted first, and only then the setting changes (SR-35). */
  const handleMakePrivate = async (): Promise<boolean> => {
    try {
      await publisher?.unpublish(deckId);
      await savePublish({ public: false, nickname: publishRef.current?.nickname ?? null });
      publicDirty.current = false;
      forgetPublicDecks(publicStore);
      return true;
    } catch {
      return false;
    }
  };

  const handleRetryPublic = () => {
    const built = buildPublicDeckInput(deckId, contentRef.current, cardsByKey, publishRef.current?.nickname ?? null);
    if (built.ok && publisher !== null) {
      publisher.schedule(built.input);
      void publisher.flush(deckId);
    }
  };

  const issues = useMemo(() => validateDeck(content, cardsByKey), [content, cardsByKey]);
  const totals = useMemo(() => deckTotals(content, cardsByKey), [content, cardsByKey]);
  const problems = useMemo(() => deckProblems(issues, totals.main), [issues, totals.main]);
  const limits = useMemo(() => ramLimits(content, cardsByKey), [content, cardsByKey]);
  const counts = useMemo(() => deckCounts(content), [content]);
  const allCounts = useMemo(() => allDeckCounts(content), [content]);
  const sideRows = useMemo(
    () =>
      [...sideboardCounts(content)]
        .flatMap(([key, count]) => {
          const card = cardsByKey.get(key);
          return card === undefined ? [] : [{ card, count }];
        })
        .sort((a, b) => a.card.displayName.localeCompare(b.card.displayName, 'en')),
    [content, cardsByKey],
  );
  const curve = useMemo(() => costCurve(content, cardsByKey), [content, cardsByKey]);
  const grouped = useMemo(() => groupDeck(content, cardsByKey), [content, cardsByKey]);

  const collectionReady = collection.phase === 'ready';
  // The tab shows the deck's name (the page title is set by the app; this runs after it for a deck, and again on a rename).
  useEffect(() => {
    if (phase !== 'ready' || content.name === '') return;
    document.title = `${content.name} · ${texts.appName}`;
    return () => {
      document.title = `${deckTexts.navDecks} · ${texts.appName}`;
    };
  }, [phase, content.name]);
  const missingCards = useMemo(() => {
    const rows: MissingCard[] = [];
    for (const [key, count] of allCounts) {
      const card = cardsByKey.get(key);
      const missing = count - countIn(collection, key);
      if (card !== undefined && missing > 0) rows.push({ card, missing });
    }
    return rows;
  }, [allCounts, cardsByKey, collection]);
  const substitutes = useMemo(
    () =>
      collectionReady
        ? findSubstitutes(
            missingCards,
            cardsByKey.values(),
            (key) => countIn(collection, key),
            (key) => allCounts.get(key) ?? 0,
          )
        : undefined,
    [collectionReady, missingCards, cardsByKey, collection, allCounts],
  );
  const playability = useMemo(
    () =>
      substitutes === undefined
        ? undefined
        : playabilityOf(content, cardsByKey, (key) => countIn(collection, key), substitutes),
    [substitutes, content, cardsByKey, collection],
  );
  const canCopyWithOwn = useMemo(
    () =>
      substitutes !== undefined &&
      playability !== undefined &&
      playability.withSubstitutes > playability.own,
    [substitutes, playability],
  );
  /** A private copy where the missing main-deck copies are swapped for owned stand-ins; the original stays (T-121). */
  const handleCopyWithOwn = async () => {
    if (substitutes === undefined) return;
    try {
      const swapped = applySubstitutes(contentRef.current, cardsByKey, (key) => countIn(collection, key), substitutes);
      const listed = await repository.list();
      const names = listed.value.map((deck) => deck.name);
      const name = copyDeckName(contentRef.current.name, names, deckTexts.copyOwnSuffix);
      const created = await repository.create({ name, sections: swapped.sections });
      onOpenDeck?.(created.id);
    } catch {
      setToast(deckTexts.copyOwnFailed);
    }
  };
  const missingCopies = missingCards.reduce((sum, row) => sum + row.missing, 0);

  /**
   * The rules for raising a card in the main deck or the sideboard (T-045, T-074), shared by the buttons and the
   * scanner (T-119): the reason text, or null when the change is allowed. A "notice" stays on the page; the rest is a toast.
   */
  const mainBlock = (base: DeckContent, card: Card, count: number): AddBlock | null => {
    if (count > (deckCounts(base).get(card.key) ?? 0) && hasSameNameLegend(card, base, cardsByKey)) {
      return { text: deckTexts.sameLegend(card.name), notice: false };
    }
    const isNew = !deckCounts(base).has(card.key);
    if (isNew && count > 0 && distinctRows(base) >= MAX_DECK_DISTINCT_CARDS) {
      return { text: deckTexts.distinctLimit, notice: true };
    }
    return null;
  };

  const sideBlock = (base: DeckContent, card: Card, count: number): AddBlock | null => {
    const side = sideboardCounts(base).get(card.key) ?? 0;
    if (card.type === 'Legend') return { text: deckTexts.sideboardNoLegend, notice: false };
    if (count > side && sideboardSize(base) >= SIDEBOARD_SIZE) {
      return { text: deckTexts.sideboardFull(SIDEBOARD_SIZE), notice: false };
    }
    if (count > side && (allDeckCounts(base).get(card.key) ?? 0) >= MAX_COPIES) {
      return { text: deckTexts.sideboardCopiesFull(MAX_COPIES), notice: false };
    }
    if (side === 0 && count > 0 && distinctRows(base) >= MAX_DECK_DISTINCT_CARDS) {
      return { text: deckTexts.distinctLimit, notice: true };
    }
    return null;
  };

  const showBlock = (block: AddBlock) => (block.notice ? setNotice(block.text) : setToast(block.text));

  const setCount = (card: Card, count: number) => {
    const base = contentRef.current;
    const block = mainBlock(base, card, count);
    if (block !== null) {
      showBlock(block);
      return;
    }
    setNotice(null);
    const next = withDeckCount(base, card.key, count);
    schedule(next);
    clearTimeout(changeTimer.current);
    changeTimer.current = setTimeout(() => {
      const nextTotals = deckTotals(next, cardsByKey);
      const copies = deckCounts(next).get(card.key) ?? 0;
      const name = cardNameText(card);
      setChangeText(
        card.type === 'Legend'
          ? deckTexts.changeAnnounceLegend(name, copies, nextTotals.legends)
          : deckTexts.changeAnnounce(name, copies, nextTotals.main),
      );
    }, CHANGE_ANNOUNCE_MS);
  };

  const sideHeadingRef = useRef<HTMLHeadingElement>(null);

  const setSideCount = (card: Card, count: number) => {
    const base = contentRef.current;
    const block = sideBlock(base, card, count);
    if (block !== null) {
      showBlock(block);
      return;
    }
    setNotice(null);
    schedule(withSideboardCount(base, card.key, count));
  };

  /** Adds one copy straight to the sideboard from the search results (T-074). */
  const addToSideboard = (card: Card) => {
    setSideCount(card, (sideboardCounts(contentRef.current).get(card.key) ?? 0) + 1);
  };

  /** The deck the scanner fills (T-119): the same rules as the buttons, all copies or none. */
  const scanTarget: ScanDeckTarget = {
    name: content.name,
    add: (card, part, copies) => {
      let base = contentRef.current;
      for (let i = 0; i < copies; i += 1) {
        const main = deckCounts(base).get(card.key) ?? 0;
        const side = sideboardCounts(base).get(card.key) ?? 0;
        const copiesFull = (allDeckCounts(base).get(card.key) ?? 0) >= MAX_COPIES;
        const block =
          part === 'main'
            ? (mainBlock(base, card, main + 1) ?? (copiesFull ? { text: deckTexts.sideboardCopiesFull(MAX_COPIES), notice: false } : null))
            : sideBlock(base, card, side + 1);
        if (block !== null) return block.text;
        base = part === 'main' ? withDeckCount(base, card.key, main + 1) : withSideboardCount(base, card.key, side + 1);
      }
      setNotice(null);
      schedule(base);
      return null;
    },
    remove: (card: Card, part: DeckPart, copies: number) => {
      const base = contentRef.current;
      schedule(
        part === 'main'
          ? withDeckCount(base, card.key, Math.max(0, (deckCounts(base).get(card.key) ?? 0) - copies))
          : withSideboardCount(base, card.key, Math.max(0, (sideboardCounts(base).get(card.key) ?? 0) - copies)),
      );
    },
  };

  /** Moves one copy; the total of the card stays the same, so no copy limit is touched. */
  const moveCopy = (card: Card, toSideboard: boolean) => {
    const base = contentRef.current;
    if (toSideboard && card.type === 'Legend') {
      setToast(deckTexts.sideboardNoLegend);
      return;
    }
    const main = deckCounts(base).get(card.key) ?? 0;
    const side = sideboardCounts(base).get(card.key) ?? 0;
    if ((toSideboard ? main : side) === 0) return;
    const delta = toSideboard ? 1 : -1;
    schedule(withSideboardCount(withDeckCount(base, card.key, main - delta), card.key, side + delta));
    setChangeText(toSideboard ? deckTexts.movedToSideboard(card.displayName) : deckTexts.movedToMain(card.displayName));
    // The row leaves the sideboard: keep focus on its heading instead of losing it (WCAG 2.4.3).
    if (!toSideboard && side === 1) sideHeadingRef.current?.focus();
  };

  const openImage = (card: Card) => {
    preview.hide();
    // T-188: a card click always opens the card dialog (the Cards view at #/kortti/<key>); closing it returns to the deck.
    openCardPage(card.key);
  };

  /**
   * A card whose next copy would make the deck illegal is dimmed with a visible reason (T-103). A same-name
   * Legend is refused; every other block only warns and the card can still be added (T-045).
   */
  const blockerOf = (card: Card): PickBlocker | null => {
    if (hasSameNameLegend(card, content, cardsByKey)) {
      return { reason: deckTexts.sameLegendReason(card.name), short: deckTexts.blockedLegend };
    }
    const info = addBlockerInfo(card, content, cardsByKey);
    if (info === null) return null;
    const short =
      info.kind === 'ram-over'
        ? deckTexts.blockedRam(info.ram ?? 0, info.color ?? '', info.limit ?? 0)
        : info.kind === 'copies-full'
          ? deckTexts.blockedCopies(COPY_LIMIT)
          : deckTexts.blockedLegendsFull;
    return { reason: deckTexts.dimmedHint(info.message), short };
  };

  const handleName = (rawText: string) => {
    // A name is one line: a pasted line break becomes a space.
    const text = rawText.replace(/\s*[\r\n]+\s*/g, ' ');
    setNameText(text);
    const result = checkDeckName(text);
    if (!result.ok) {
      setNameError(result.error === 'empty' ? deckTexts.nameEmpty : deckTexts.nameTooLong);
      return;
    }
    setNameError(null);
    if (result.name !== contentRef.current.name) schedule({ ...contentRef.current, name: result.name });
  };

  const handlePickView = (next: DeckPickView) => {
    pickViewChosen.current = true;
    setPickView(next);
    repositories.preferences.saveDeckPickView(next).catch(() => undefined);
  };

  // Conflict answers: take the stored deck and drop our unsaved changes, or save ours over it.
  const handleLoadLatest = () => {
    clearTimeout(timer.current);
    pending.current = null;
    void repository.get(deckId).then((deck) => {
      if (deck === null) {
        setPhase('not-found');
        return;
      }
      knownUpdatedAt.current = deck.updatedAt;
      const latest = { name: deck.name, sections: deck.sections };
      contentRef.current = latest;
      setContent(latest);
      setNameText(deck.name);
      setSaveError(null);
      setSaveState('saved');
      setChangeText(deckTexts.reloadedLatest);
    });
  };

  const handleKeepMine = () => {
    void repository.get(deckId).then((deck) => {
      if (deck === null) {
        setSaveError('not-found');
        return;
      }
      knownUpdatedAt.current = deck.updatedAt;
      handleRetry();
    });
  };

  const handleRetry = () => {
    if (pending.current === null) pending.current = contentRef.current;
    flush();
  };

  const collectionFilter: CollectionFilter = collectionReady ? collectionChoice : 'all';
  const filtered = useMemo(() => {
    const matching = filterCards(cards, criteria);
    if (collectionFilter === 'all') return matching;
    return matching.filter((card) => {
      const owned = countIn(collection, card.key);
      return collectionFilter === 'owned' ? owned > 0 : owned < playsetSize(card);
    });
  }, [cards, criteria, collectionFilter, collection]);
  const colors = useMemo(() => colorDistribution(content, cardsByKey), [content, cardsByKey]);
  const legendsCount = totals.legends;

  // Below 64rem the bottom bar is hidden while the deck column is on screen (T-050c).
  useEffect(() => {
    const side = sideRef.current;
    if (side === null || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry !== undefined) setDeckInView(entry.isIntersecting);
    });
    observer.observe(side);
    return () => observer.disconnect();
  }, [phase]);

  const mainState = totals.main < MIN_MAIN_DECK ? 'under' : totals.main > MAX_MAIN_DECK ? 'over' : 'ok';
  const legalityMark =
    issues.length === 0 ? (
      <span className="legality is-legal">
        <span aria-hidden="true">✓</span>
        {deckTexts.legalShort}
      </span>
    ) : (
      <span className="legality is-issues">
        <span aria-hidden="true">⚠</span>
        {deckTexts.issuesCount(issues.length)}
      </span>
    );

  const showDeck = () => {
    if (tabbed) {
      selectTab('deck', true);
      return;
    }
    sideRef.current?.scrollIntoView?.({ block: 'start' });
    deckHeadingRef.current?.focus({ preventScroll: true });
  };

  const showIssues = () => {
    issuesHeadingRef.current?.scrollIntoView?.({ block: 'nearest' });
    issuesHeadingRef.current?.focus({ preventScroll: true });
  };

  // T-110: below 64rem the editor shows the deck or the card picker, one at a time. The default is chosen once, when
  // the deck has loaded: the deck, or the picker for an empty deck. Both parts stay mounted, so filters and search persist.
  const tabbed = useMediaQuery(EDITOR_TABS_QUERY, false);
  // T-181 (4b): the deck column holds three views (deck, statistics, results); below 64rem "add cards" is a fourth tab.
  const [tab, setTab] = useState<EditorTab | null>(null);
  if (phase === 'ready' && tab === null) setTab(totals.main + totals.legends === 0 && tabbed ? 'add' : 'deck');
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabFocus = useRef<EditorTab | null>(null);
  const [tabRequest, setTabRequest] = useState(0);
  // Wide: the picker is always shown and "add" means the deck view; narrow: one part at a time.
  const view: EditorTab = tab === 'add' && !tabbed ? 'deck' : (tab ?? 'deck');
  const deckHidden = tabbed && view === 'add';
  // Statistics and results take the whole width on a wide screen: they are views of their own, not a part under the deck.
  const widePane = !tabbed && (view === 'stats' || view === 'results');
  const pickerHidden = tabbed ? view !== 'add' : widePane;

  // `focus` is false when the tab button itself was used (it keeps the focus); otherwise the focus follows to the new part.
  const selectTab = (next: EditorTab, focus: boolean) => {
    setTab(next);
    tabFocus.current = focus ? next : null;
    setTabRequest((count) => count + 1);
  };

  useEffect(() => {
    if (tabRequest === 0) return;
    tabsRef.current?.scrollIntoView?.({ block: 'start' });
    const target = tabFocus.current;
    tabFocus.current = null;
    if (target === 'add') searchInputRef.current?.focus({ preventScroll: true });
    else if (target === 'deck') deckHeadingRef.current?.focus({ preventScroll: true });
  }, [tabRequest]);

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
        <p className="editor-crumb">
          <button type="button" className="link-button" onClick={onBack}>
            <span aria-hidden="true">← </span>
            {deckTexts.backToList}
          </button>
        </p>
      </>
    );
  }

  const tabsBar = (
    <div ref={tabsRef} className="segmented segmented--fill editor-tabs" role="group" aria-label={deckTexts.editorTabsLabel}>
      {tabbed ? (
        <>
          <button type="button" className="segmented-option" aria-pressed={view === 'deck'} onClick={() => selectTab('deck', false)}>
            {deckTexts.editorTabDeck}
          </button>
          <button
            type="button"
            className="segmented-option"
            aria-label={deckTexts.editorTabAdd}
            aria-pressed={view === 'add'}
            onClick={() => selectTab('add', false)}
          >
            {deckTexts.editorTabAddShort}
          </button>
        </>
      ) : (
        <button type="button" className="segmented-option" aria-pressed={view === 'deck'} onClick={() => selectTab('deck', false)}>
          {deckTexts.editorTabDeck}
        </button>
      )}
      <button type="button" className="segmented-option" aria-pressed={view === 'stats'} onClick={() => selectTab('stats', false)}>
        {deckTexts.editorTabStats}
      </button>
      <button type="button" className="segmented-option" aria-pressed={view === 'results'} onClick={() => selectTab('results', false)}>
        {deckTexts.editorTabResults}
      </button>
    </div>
  );

  return (
    <>
      <WantCleanupBar cleanup={wantCleanup} />
      {/* One header row (T-181, 4b): back, the name as an editable title, save state, visibility, export and solo play. */}
      <div className="editor-head">
        <button type="button" className="button-quiet editor-back" onClick={onBack}>
          <BackIcon />
          <span className="editor-back-label">{deckTexts.editorBack}</span>
        </button>
        <h1 ref={headingRef} tabIndex={-1} className="editor-name visually-hidden">
          {content.name}
        </h1>
        <div className="deck-name-field editor-name-field">
          <label htmlFor="deck-name" className="visually-hidden">
            {deckTexts.nameLabel}
          </label>
          <textarea
            id="deck-name"
            ref={nameFieldRef}
            rows={1}
            spellCheck={false}
            maxLength={MAX_DECK_NAME_LENGTH}
            value={nameText}
            aria-invalid={nameError !== null ? 'true' : undefined}
            aria-describedby={nameError !== null ? 'deck-name-error' : 'deck-name-hint'}
            onChange={(event) => handleName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
          />
          <p id="deck-name-hint" className="visually-hidden">
            {deckTexts.nameHint}
          </p>
          {nameError !== null && (
            <p id="deck-name-error" className="field-error">
              {nameError}
            </p>
          )}
        </div>
        {saveState !== 'error' && (
          // Only "Tallennettu" is spoken (T-050b): the in-between states are shown but would talk over the change message.
          <p className={`save-status save-badge${saveState === 'saved' ? ' is-saved' : ''}`}>
            <span role="status">{saveState === 'saved' ? deckTexts.saveSaved : ''}</span>
            {saveState !== 'saved' && (
              <span aria-hidden="true">{saveState === 'saving' ? deckTexts.saveSaving : deckTexts.saveDirty}</span>
            )}
          </p>
        )}
        <DeckVisibility
          publish={publish}
          signedIn={publisher !== null}
          signInAvailable={signInAvailable}
          state={publishState}
          onPublish={handlePublish}
          onMakePrivate={handleMakePrivate}
          onRetry={handleRetryPublic}
        />
        <div className="editor-tools">
          <ExportButtons deck={content} cardsByKey={cardsByKey} iconToggle />
          {totals.main > 0 && (
            <a className="button-quiet editor-play" href={`#/pakat/${deckId}/goldfish`}>
              <PlayIcon />
              <span className="editor-play-label">{goldfishTexts.open}</span>
            </a>
          )}
        </div>
      </div>

      {tabbed && tabsBar}

      {saveState === 'error' && saveError === 'conflict' && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.conflictMessage}</p>
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={handleLoadLatest}>
              {deckTexts.conflictLoadLatest}
            </button>
            <button type="button" className="button-secondary" onClick={handleKeepMine}>
              {deckTexts.conflictKeepMine}
            </button>
          </div>
        </div>
      )}
      {saveState === 'error' && saveError !== 'conflict' && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.saveFailed(saveError ?? 'unknown')}</p>
          <button type="button" className="button-secondary" onClick={handleRetry}>
            {deckTexts.saveRetry}
          </button>
        </div>
      )}

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {changeText}
      </p>

      <div className={`editor-layout${widePane ? ' is-wide-pane' : ''}`}>
        <section className="editor-filters" aria-labelledby="filters-heading" hidden={pickerHidden}>
          {/* The title of the whole "add cards" part sits above the search row (T-118, UX-118-23); the results region is named by it. */}
          <div className="editor-add-head">
            <h2 id="search-heading" className="editor-add-heading visually-hidden">
              {deckTexts.searchHeading}
            </h2>
            {cameraSupported() && (
              <ScanCardsButton
                cards={cards}
                snapshot={collection}
                store={collectionStore}
                edition={scanEdition}
                onEditionChange={setScanEdition}
                preferences={repositories.preferences}
                deck={scanTarget}
                openAtStart={scanAtStart}
              />
            )}
          </div>
          <h2 id="filters-heading" className="filters-heading">
            {texts.filtersHeading}
          </h2>
          <CardFilters
            criteria={criteria}
            typeOptions={filterOptions(KNOWN_CARD_TYPES, cards.map((card) => card.type), criteria.types)}
            colorOptions={filterOptions(KNOWN_CARD_COLORS, cards.map((card) => card.color), criteria.colors)}
            rarityOptions={filterOptions(KNOWN_CARD_RARITIES, cards.map((card) => (card.rarity === null ? null : officialRarity(card.rarity))), criteria.rarities)}
            numberOptions={numberFilterOptionsFor(cards, criteria)}
            searchInputRef={searchInputRef}
            collectionAllRef={collectionAllRef}
            collectionFilter={collectionReady ? collectionFilter : undefined}
            onCollectionFilterChange={setCollectionChoice}
            onQueryChange={(query) => setCriteria({ ...criteria, query })}
            onToggleType={(type) => setCriteria({ ...criteria, types: toggleValue(criteria.types, type) })}
            tagOptions={tagChoices}
            onTagChange={(tag) => setCriteria({ ...criteria, tag })}
            onToggleColor={(color) => setCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) })}
            onToggleRarity={(rarity) =>
              setCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) })
            }
            onToggleNumber={(group, value) => setCriteria({ ...criteria, [group]: toggleValue(criteria[group], value) })}
            onSearchSubmit={() => undefined}
            collapsibleBelow={EDITOR_WIDE_QUERY}
          />
        </section>

        <section className="editor-search" aria-labelledby="search-heading" data-image-size={imageSize} hidden={pickerHidden}>
          <div className="pick-bar">
            <p className="status-line" role="status">
              {deckTexts.searchResults(filtered.length, cards.length)}
            </p>
            {/* Skip past the results to the deck, shown when focused (UX-044). */}
            <button type="button" className="link-button focus-reveal" onClick={showDeck}>
              {deckTexts.goToDeck}
            </button>
            <SegmentedChoice
              legend={deckTexts.pickViewLegend}
              name="deck-pick-view"
              value={pickView}
              options={PICK_VIEW_OPTIONS}
              onChange={handlePickView}
            />
            <ImageSizeSelect name="deck-image-size" value={imageSize} onChange={setImageSize} disabled={pickView !== 'images'} />
            <span className="has-info-tip pick-tip">
              <InfoTip>
                <span className="pick-hint">{deckTexts.pickHint}</span> <span className="pick-hint pick-explain">{deckTexts.blockedExplain}</span>
              </InfoTip>
            </span>
          </div>
          <ActiveFilters
            filters={[
              ...(collectionFilter === 'all'
                ? []
                : [
                    {
                      id: 'collection',
                      label: collectionFilter === 'owned' ? texts.collectionOwned : texts.collectionMissing,
                      onRemove: () => setCollectionChoice('all'),
                    },
                  ]),
              ...criteriaFilters(criteria, setCriteria),
            ]}
            showClear={isFilterActive(criteria) || collectionFilter !== 'all'}
            onClear={() => {
              setCriteria(EMPTY_CRITERIA);
              setCollectionChoice('all');
              searchInputRef.current?.focus();
            }}
            searchInputRef={searchInputRef}
          />
          <div role="status" className="toast-slot">
            {toast !== null && (
              <p className="toast">
                <span>{toast}</span>
                <button type="button" className="toast-close" aria-label={deckTexts.toastClose} onClick={() => setToast(null)}>
                  ×
                </button>
              </p>
            )}
          </div>
          {filtered.length === 0 ? (
            <p className="empty">{deckTexts.noSearchResults}</p>
          ) : pickView === 'images' ? (
            <div className="pick-scroll">
              <ul className="pick-images" aria-label={deckTexts.searchHeading}>
                {filtered.map((card) => {
                  const blocker = blockerOf(card);
                  const hintId = `blocker-image-${card.key}`;
                  const count = counts.get(card.key) ?? 0;
                  return (
                    <DeckPickImage
                      key={card.key}
                      card={card}
                      count={count}
                      onChange={(next) => setCount(card, next)}
                      dimmed={blocker !== null}
                      title={blocker?.reason}
                      badge={count > 0 ? deckTexts.inDeckBadge(count) : null}
                      owned={collectionReady ? countIn(collection, card.key) : null}
                      hoverProps={imageSize === 'small' ? preview.bind(card) : undefined}
                      hint={
                        blocker !== null && (
                          <>
                            <span className="pick-blocked" aria-hidden="true">
                              ⚠ {blocker.short}
                            </span>
                            <span id={hintId} className="visually-hidden">
                              {blocker.reason}
                            </span>
                          </>
                        )
                      }
                    >
                      <Stepper
                        name={card.displayName}
                        count={count}
                        onChange={(next) => setCount(card, next)}
                        describedBy={blocker !== null ? hintId : undefined}
                        shortcuts
                      />
                      {card.type !== 'Legend' && (
                        <button
                          type="button"
                          className="tile-action"
                          aria-label={deckTexts.addToSideboard(card.displayName)}
                          title={deckTexts.addToSideboardTitle}
                          onClick={() => addToSideboard(card)}
                        >
                          {deckTexts.addToSideboardShort}
                        </button>
                      )}
                    </DeckPickImage>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="pick-scroll">
              <DeckPickTable
                cards={filtered}
                countOf={(card) => counts.get(card.key) ?? 0}
                blockerOf={blockerOf}
                onChange={setCount}
                onAddToSideboard={addToSideboard}
                onOpenImage={openImage}
                clickAdds={clickAdds}
                hoverProps={preview.bind}
                ownedOf={(card) => (collectionReady ? countIn(collection, card.key) : null)}
              />
            </div>
          )}
        </section>

        <div className="deck-bar" hidden={tabbed ? view !== 'add' : deckInView}>
          <p className="deck-bar-text">
            <span className="deck-bar-part">{deckTexts.mobileBarMain(totals.main)}</span>
            <span aria-hidden="true">·</span>
            <span className="deck-bar-part">{deckTexts.legendsProgress(legendsCount)}</span> {legalityMark}
          </p>
          <button type="button" className="button-primary deck-bar-button" onClick={showDeck}>
            {deckTexts.showDeck}
          </button>
        </div>

        <section className="editor-side" aria-labelledby="deck-heading" ref={sideRef} hidden={deckHidden}>
          {!tabbed && tabsBar}
          <div className="editor-pane" hidden={view !== 'deck'}>
          <div className="editor-status">
            <h2 id="deck-heading" className="visually-hidden" ref={deckHeadingRef} tabIndex={-1}>
              {deckTexts.sectionLabel(content.name)}
            </h2>
            <p className="editor-status-line">
              <span>{deckTexts.mainProgress(totals.main)}</span>
              {issues.length === 0 ? (
                legalityMark
              ) : (
                <button type="button" className="legality is-issues" onClick={showIssues}>
                  <span aria-hidden="true">⚠</span>
                  {deckTexts.issuesCount(issues.length)}
                </button>
              )}
              <span className="editor-status-sep" aria-hidden="true">
                ·
              </span>
              <span className="editor-status-sub">{deckTexts.legendsProgress(legendsCount)}</span>
            </p>
            <progress
              className={`editor-meter is-${mainState}`}
              max={MAX_MAIN_DECK}
              value={Math.min(totals.main, MAX_MAIN_DECK)}
              aria-label={deckTexts.mainProgress(totals.main)}
            />
            {!tabbed && (
              <button type="button" className="link-button focus-reveal deck-back" onClick={() => searchInputRef.current?.focus()}>
                <span aria-hidden="true">← </span>
                {deckTexts.backToSearch}
              </button>
            )}
          </div>

          <div aria-live="polite" aria-atomic="true">
            {issues.length === 0 ? (
              <p className="visually-hidden">{deckTexts.allGood}</p>
            ) : (
              <div className="deck-issues">
                <h3 ref={issuesHeadingRef} tabIndex={-1} className="deck-issues-title">
                  {deckTexts.issuesHeading}
                </h3>
                <ul className="issue-list">
                  {issues.map((issue) => (
                    <li key={issue.type + issue.cards.join(',')} className={issue.severity === 'warning' ? 'is-warning' : undefined}>
                      {issue.severity === 'warning' ? deckTexts.warningPrefix : ''}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {notice !== null && (
            <p className="field-error" role="alert">
              {notice}
            </p>
          )}

          <DeckList
            grouped={grouped}
            view={deckView}
            onViewChange={handleDeckView}
            mainCount={totals.main}
            legendsCount={legendsCount}
            ownedOf={(card) => (collectionReady ? countIn(collection, card.key) : null)}
            onChange={setCount}
            onOpenImage={openImage}
            hoverProps={preview.bind}
            onMoveToSideboard={(card) => moveCopy(card, true)}
            problems={problems}
          />
          <Sideboard
            rows={sideRows}
            size={sideboardSize(content)}
            view={deckView}
            problems={problems}
            onChange={setSideCount}
            onMoveToMain={(card) => moveCopy(card, false)}
            onOpenImage={openImage}
            headingRef={sideHeadingRef}
            hoverProps={preview.bind}
          />
          {grouped.unknown.length > 0 && (
            <div className="deck-section">
              <h3 className="deck-group-title">{deckTexts.unknownHeading}</h3>
              <ul className="deck-tiles">
                {grouped.unknown.map(({ key, count }) => (
                  <li key={key} className="deck-unknown">
                    <span className="deck-unknown-key">{key}</span>
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

          <div className="missing-add proxy-send">
            <SendToProxyButton
              rows={[...allCounts].filter(([key]) => cardsByKey.has(key)).map(([card, count]) => ({ card, count }))}
              queue={proxyQueue}
              label={proxyTexts.sendDeck}
            />
            {collectionReady && missingCards.length > 0 && (
              <SendToProxyButton
                rows={missingCards.map((row) => ({ card: row.card.key, count: row.missing }))}
                queue={proxyQueue}
                label={proxyTexts.printMissing}
              />
            )}
          </div>
          </div>

          <div className="editor-pane" hidden={view !== 'stats'}>
          <DeckStats
            deck={content}
            cardsByKey={cardsByKey}
            curve={curve}
            colors={colors}
            groups={grouped.groups}
            mainCount={totals.main}
            ramLimitsText={
              limits.size === 0
                ? deckTexts.ramLimitsNone
                : `${deckTexts.ramLimitsLabel}: ${[...limits].map(([color, limit]) => deckTexts.ramLimit(color, limit)).join(' · ')}`
            }
            missingCards={collectionReady ? missingCards : undefined}
            wants={wants}
            substitutes={substitutes}
            playability={playability}
            onCopyWithOwn={canCopyWithOwn && onOpenDeck !== undefined ? () => void handleCopyWithOwn() : undefined}
            missingText={
              collectionReady
                ? deckTexts.missingFromCollection(missingCopies)
                : collection.phase === 'loading'
                  ? ''
                  : deckTexts.collectionNotReady
            }
          />

          </div>

          <div className="editor-pane" hidden={view !== 'results'}>
            <DeckResults deckId={deckId} repository={repositories.games} cards={cards} cardsByKey={cardsByKey} />
          </div>
        </section>
      </div>

      {preview.preview}
    </>
  );
}
