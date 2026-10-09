import { useEffect, useMemo, useRef, useState } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { countOf, minCountOf } from '../domain/collection';
import { editionPrinting, protectedCount, setCopiesByEdition, targetPrinting } from '../domain/edition';
import type { CollectionEntry } from '../domain/collection';
import { artRarity, artsOf, matchedSpecialRarity, ownedPerArt, setArtCount } from '../domain/arts';
import type { Art } from '../domain/arts';
import { setFilterId } from '../domain/printing';
import { variantImageUrl } from '../data/variantImages';
import { hasSetPrinting, ownsSetVersion, setOptions } from '../domain/setFilter';
import type { MissingRow } from '../domain/wants';
import { StorageError, isStoragePersisted, requestPersistentStorage } from '../storage';
import type { CatalogViewMode, DefaultEdition, Repositories } from '../storage';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  officialRarity,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  numberFilterOptionsFor,
  isFilterActive,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { CardFilters } from './CardFilters';
import type { CollectionFilter } from './CardFilters';
import { EditionConfirmDialog, editionConfirmed, markEditionConfirmed } from './EditionConfirmDialog';
import { CardImageDialog } from './CardImageDialog';
import { CardList } from './CardList';
import type { CardListItem } from './CardList';
import { AddMissingToWantsButton } from './AddMissingToWants';
import { SortSelect } from './SortSelect';
import { DEFAULT_SORT, sortCards } from '../domain/cardSort';
import type { CardSort } from '../domain/cardSort';
import { CardTable } from './CardTable';
import { ListToolbar } from './ListToolbar';
import type { ImageSize } from './ListToolbar';
import { ActiveFilters, criteriaFilters } from './ActiveFilters';
import { useCardHoverPreview } from './CardHoverPreview';
import type { ActiveFilter } from './ActiveFilters';
import { WIDE_QUERY } from './useMediaQuery';
import type { OwnedColumn } from './CardList';
import { CollectionNotices, loadNotices } from './CollectionNotices';
import { CountControl } from './CountControl';
import { tradeableCount } from '../domain/tradeCompare';
import { countIn, versionCountIn } from './collectionStore';
import { entryOf as entryOfCard, writeEntry as writeCardEntry } from './collectionEntry';
import { CardVersions } from './CardVersions';
import { ScanCardsButton } from './CardScanner';
import type { CollectionSnapshot } from './collectionStore';
import { StorageReminder, persistenceResultText } from './StorageReminder';
import type { PersistenceState } from './StorageReminder';
import { cardCount, texts } from './texts';
import { useCollection } from './useCollection';
import { useWants } from './useWants';
import type { WantsHandle } from './useWants';
import { SendToProxyButton, useProxyQueue } from './SendToProxy';
import { proxyTexts } from './proxyTexts';
import { useDecks } from './useDecks';
import { useCollectionAnnouncements, useLoadNoticeAnnouncement } from './useCollectionAnnouncements';
import { useDelayedAnnouncement } from './useDelayedAnnouncement';
import type { Announcement } from './useDelayedAnnouncement';

/** What the live region says about a filter result (UX.md 5.6). The key identifies state + count. */
function describeResult(active: boolean, shown: number, all: number): Announcement {
  if (!active) return { key: `all:${all}`, text: texts.allShownLive(all) };
  if (shown === 0) return { key: 'none', text: texts.noResultsLive };
  return { key: `some:${shown}`, text: texts.filteredLive(shown, all) };
}

const COLLECTION_FILTER_LABELS = {
  owned: texts.collectionOwned,
  missing: texts.collectionMissing,
} as const;
const NO_DECKS: readonly { id: string; name: string }[] = [];
const NO_KEYS: ReadonlySet<CardKey> = new Set();

/** Summary of the whole collection, counted only from cards in the loaded list (UX.md 6.5, A3). */
function collectionSummary(snapshot: CollectionSnapshot, cards: readonly Card[]): string {
  let distinct = 0;
  let total = 0;
  for (const card of cards) {
    const count = countOf(snapshot.saved, card.key);
    if (count > 0) {
      distinct += 1;
      total += count;
    }
  }
  return distinct === 0 ? texts.collectionEmpty : texts.collectionSummary(distinct, total);
}

/** The stores a host page already owns (T-112): "Omat kortit" on the Collection page shares them, so no change is lost between views. */
export interface SharedStores {
  collection: ReturnType<typeof useCollection>;
  wants: WantsHandle;
  proxyQueue: ReturnType<typeof useProxyQueue>;
}

type CatalogProps = {
  /** All cards, bundled with the app (D-013). A stable reference: it also owns the live announcements. */
  cards: readonly Card[];
  /** Created once in App (a stable reference). */
  repositories: Repositories;
  /** Header element for the persistent storage button (rendered by App). */
  headerSlot?: HTMLElement | null;
  /** The card whose details the URL asks for (#/kortti/<key>, T-081); an unknown key opens nothing. */
  routeCardKey?: string | null;
  /**
   * 'collection' (T-112) is the Collection page's "Omat kortit" view: the same list and filters, but only owned cards,
   * counts always editable, no heading of its own (the host page has it) and no scan button (it is in the host's title row).
   */
  mode?: 'catalog' | 'collection';
  /** Stores owned by the host page; required in 'collection' mode. */
  shared?: SharedStores;
};

function OwnStoresCatalog(props: CatalogProps) {
  const { repositories } = props;
  const collection = useCollection(repositories.collection);
  const wants = useWants(repositories.wants);
  const proxyQueue = useProxyQueue(repositories.proxy);
  return <CatalogBody {...props} stores={{ collection, wants, proxyQueue }} />;
}

export function CatalogView(props: CatalogProps) {
  return props.shared === undefined ? <OwnStoresCatalog {...props} /> : <CatalogBody {...props} stores={props.shared} />;
}

function CatalogBody({
  cards: allCards,
  repositories,
  headerSlot = null,
  routeCardKey = null,
  mode = 'catalog',
  stores,
}: CatalogProps & { stores: SharedStores }) {
  const locked = mode === 'collection';
  /** The ownership filter a list starts with and returns to when cleared: fixed to owned cards in 'collection' mode. */
  const baseFilter: CollectionFilter = locked ? 'owned' : 'all';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const collectionAllRef = useRef<HTMLInputElement>(null);
  const [collectionChoice, setCollectionFilter] = useState<CollectionFilter>(baseFilter);
  /** Rows kept visible under "Vain omistetut" after their count went to 0 (UX.md 6.6, A5). */
  const [setChoice, setSetChoice] = useState<string | null>(null);
  const [kept, setKept] = useState<ReadonlySet<CardKey>>(NO_KEYS);
  const { snapshot: collection, store: collectionStore } = stores.collection;
  const wants = stores.wants;
  const proxyQueue = stores.proxyQueue;
  // Which decks each card is in (T-013). Decks that cannot be read just leave the mention out.
  const { phase: decksPhase, decks } = useDecks(repositories.decks);
  const decksByCard = useMemo(() => {
    const byCard = new Map<CardKey, { id: string; name: string }[]>();
    for (const deck of decks) {
      for (const key of new Set(deck.sections.flatMap((section) => section.cards.map((row) => row.card)))) {
        byCard.set(key, [...(byCard.get(key) ?? []), { id: deck.id, name: deck.name }]);
      }
    }
    return byCard;
  }, [decks]);
  const decksOf = decksPhase === 'ready'
      ? (card: Card) => (decksByCard.get(card.key) ?? NO_DECKS).map((deck) => deck.name)
      : undefined;
  const [persistence, setPersistence] = useState<PersistenceState>('idle');
  const persistenceResultRef = useRef<HTMLParagraphElement>(null);
  /** Set by the button: the result paragraph takes focus once it is rendered. */
  const focusPersistenceResult = useRef(false);
  /** The card in the enlarged image dialog, and the thumbnail button that opened it (T-027 UX). */
  const [pickedCard, setOpenCard] = useState<Card | null>(null);
  // T-081: a direct link (#/kortti/<key>) opens the card's details until they are closed.
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const routeCard = routeCardKey === null || routeCardKey === dismissedKey ? null : (allCards.find((c) => c.key === routeCardKey) ?? null);
  const openCard = pickedCard ?? routeCard;
  /** A version's art shown in the dialog instead of the base image (T-076); reset whenever the dialog opens or closes. */
  const [shownArt, setShownArt] = useState<string | null>(null);
  // The "all arts" switch (D-021): session state, not saved.
  const [allArts, setAllArts] = useState(false);
  const imageOpenerRef = useRef<HTMLButtonElement | null>(null);
  // Bigger image beside a table row on mouse hover (T-052); the grid already shows the images.
  const preview = useCardHoverPreview();

  // List view and the edit switch are remembered like the theme (T-040). The edit switch has no saved
  // value until the user chooses; then it starts on for an empty collection and off otherwise, decided once.
  const [view, setView] = useState<CatalogViewMode>('grid');
  // Grid image size (T-050a): session state, not saved.
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [sort, setSort] = useState<CardSort>(DEFAULT_SORT);
  const [editMode, setEditMode] = useState<boolean | null>(null);
  // The edition the + adds to (D-022); saved like the other view settings.
  const [editionState, setEdition] = useState<DefaultEdition>('beta');
  const edition = editionState;
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const userChose = useRef({ view: false, edit: false, edition: false });
  useEffect(() => {
    let active = true;
    void Promise.all([
      repositories.preferences.loadView(),
      repositories.preferences.loadEditMode(),
      repositories.preferences.loadDefaultEdition(),
    ]).then(
      ([savedView, savedEdit, savedEdition]) => {
        if (!active) return;
        if (!userChose.current.view) setView(savedView);
        if (!userChose.current.edit) setEditMode(savedEdit);
        if (!userChose.current.edition) setEdition(savedEdition);
        setPreferencesLoaded(true);
      },
    );
    return () => {
      active = false;
    };
  }, [repositories]);
  if (editMode === null && preferencesLoaded && collection.phase === 'ready') {
    setEditMode(allCards.every((card) => countOf(collection.saved, card.key) === 0));
  }
  const editable = locked || editMode === true;
  const savePreference = (save: Promise<unknown>) => {
    // No message to the user, as with the theme (T-025 A3); only the error kind.
    save.catch((error: unknown) => {
      console.warn(`Preference could not be saved (${error instanceof StorageError ? error.kind : 'unknown'})`);
    });
  };
  const handleViewChange = (next: CatalogViewMode) => {
    userChose.current.view = true;
    setView(next);
    savePreference(repositories.preferences.saveView(next));
  };
  const handleEditionChange = (next: DefaultEdition) => {
    userChose.current.edition = true;
    setEdition(next);
    savePreference(repositories.preferences.saveDefaultEdition(next));
  };
  // T-101: the first add of a card with both editions in a session asks which edition it is.
  const [pendingAdd, setPendingAdd] = useState<{ card: Card; run: (edition: DefaultEdition) => void } | null>(null);
  const needsEditionConfirm = (card: Card, adding: boolean) =>
    adding && editionPrinting(card, 'beta') !== null && editionPrinting(card, 'retail') !== null && !editionConfirmed();
  const guardAdd = (card: Card, adding: boolean, run: (edition: DefaultEdition) => void) => {
    if (needsEditionConfirm(card, adding)) setPendingAdd({ card, run });
    else run(editionState);
  };
  const handleEditionChosen = (chosen: DefaultEdition) => {
    const pending = pendingAdd;
    setPendingAdd(null);
    markEditionConfirmed();
    handleEditionChange(chosen);
    pending?.run(chosen);
  };
  const handleEditChange = (next: boolean) => {
    userChose.current.edit = true;
    setEditMode(next);
    savePreference(repositories.preferences.saveEditMode(next));
  };

  // The filter exists only while counts can be changed; a locked collection turns it off (UX.md 6.6).
  if (collectionChoice !== baseFilter && (collection.phase === 'locked' || collection.phase === 'unavailable')) {
    setCollectionFilter(baseFilter);
  }
  const collectionFilter: CollectionFilter = locked ? 'owned' : collection.phase === 'ready' ? collectionChoice : 'all';
  const listedOnly = collectionFilter === 'owned';
  const visibleCards = (
    next: CardFilterCriteria,
    nextFilter: CollectionFilter,
    nextKept: ReadonlySet<CardKey>,
    family: string | null = setChoice,
  ) => {
    const matching = filterCards(allCards, next).filter((card) => family === null || hasSetPrinting(card, family));
    if (nextFilter === 'all') return matching;
    return matching.filter((card) => {
      if (nextKept.has(card.key)) return true;
      const count = countIn(collection, card.key);
      if (nextFilter === 'owned') {
        // T-074: with a set chosen, "Omistetut" means a recorded version from that set.
        return family === null || collection.phase !== 'ready' ? count > 0 : ownsSetVersion(card, family, collection.saved);
      }
      return count < playsetSize(card);
    });
  };
  const isActive = (next: CardFilterCriteria, nextFilter: CollectionFilter, family: string | null = setChoice) =>
    isFilterActive(next) || nextFilter !== baseFilter || family !== null;

  const filtered = visibleCards(criteria, collectionFilter, kept);
  // T-060: the grid follows the shared order; the table sorts the same way itself (header buttons).
  const sortedForGrid = view === 'grid' ? sortCards(filtered, sort.key, sort.direction) : filtered;
  const filterActive = isActive(criteria, collectionFilter);
  const artMatchesFilter = (art: Art) =>
    art.printings.some(
      (p) =>
        (criteria.rarities.length === 0 || (p.rarity !== null && criteria.rarities.includes(officialRarity(p.rarity)))) &&
        (setChoice === null || setFilterId(p) === setChoice),
    );
  // T-066: shown cards short of a playset, for "add missing to wants".
  const missingRows: MissingRow[] = [];
  if (collection.phase === 'ready') {
    for (const card of filtered) {
      const missing = playsetSize(card) - countIn(collection, card.key);
      if (missing > 0) missingRows.push({ card: card.key, missing });
    }
  }

  // The cards are there from the first render, so the live region starts with the loaded message.
  // It already tells the unfiltered result, so that result is not announced again right away.
  const allShown = describeResult(false, allCards.length, allCards.length);
  // The size of the list the live messages compare to: every card, or in 'collection' mode the owned ones.
  const listTotal = locked && collection.phase === 'ready' ? allCards.filter((card) => countIn(collection, card.key) > 0).length : allCards.length;
  const announcer = useDelayedAnnouncement(allCards, allShown.key);
  const collectionAnnouncer = useCollectionAnnouncements(announcer, collectionStore, allCards, collection.saveError);

  const collectionNotices = loadNotices(collection, repositories.persistent);
  useLoadNoticeAnnouncement(
    announcer,
    allCards,
    collection.loadCount,
    collectionNotices.map((notice) => notice.live).join(' '),
  );

  // Read-only check: never asks the user, so it may run on load (A2). The request itself waits for the button (SR-13).
  useEffect(() => {
    if (!repositories.persistent) return;
    let active = true;
    void isStoragePersisted().then((persisted) => {
      if (active && persisted) setPersistence((current) => (current === 'idle' ? 'already' : current));
    });
    return () => {
      active = false;
    };
  }, [repositories]);

  const handleRequestPersistence = () => {
    setPersistence('busy');
    void requestPersistentStorage().then((granted) => {
      const result: PersistenceState = granted ? 'granted' : 'denied';
      focusPersistenceResult.current = true;
      setPersistence(result);
      collectionAnnouncer.announce(persistenceResultText(result) ?? '');
    });
  };

  useEffect(() => {
    // The button is replaced by the result; keep focus from falling to <body> (UX.md 6.7).
    if (focusPersistenceResult.current && persistenceResultText(persistence) !== null) {
      focusPersistenceResult.current = false;
      persistenceResultRef.current?.focus();
    }
  }, [persistence]);

  const focusHeading = () => (headingRef.current ?? searchInputRef.current)?.focus();

  /** Any change of the search, a selection or "Vain omistetut" (UX.md 5.6, 6.6). */
  const updateFilters = (
    next: CardFilterCriteria,
    nextFilter: CollectionFilter,
    when: 'later' | 'now' | 'never',
    force = false,
  ) => {
    setCriteria(next);
    setCollectionFilter(nextFilter);
    // New conditions: rows whose count went to 0 are no longer kept.
    setKept(NO_KEYS);
    const announcement = describeResult(
      isActive(next, nextFilter),
      visibleCards(next, nextFilter, NO_KEYS).length,
      listTotal,
    );
    if (when === 'later') announcer.announceLater(announcement);
    else if (when === 'now') announcer.announceNow(announcement, force);
    else announcer.cancel();
  };
  const updateCriteria = (next: CardFilterCriteria, when: 'later' | 'now' | 'never') =>
    updateFilters(next, collectionFilter, when);

  const handleSetChange = (family: string | null) => {
    setSetChoice(family);
    setKept(NO_KEYS);
    announcer.announceNow(
      describeResult(
        isActive(criteria, collectionFilter, family),
        visibleCards(criteria, collectionFilter, NO_KEYS, family).length,
        listTotal,
      ),
      true,
    );
  };

  const handleClearFilters = () => {
    setSetChoice(null);
    updateFilters(EMPTY_CRITERIA, baseFilter, 'now', true);
    // The button disappears with the empty result; the search field is the natural next step (UX.md 5.7).
    searchInputRef.current?.focus();
  };

  // Arts (D-021): a special rarity is an art only when its picture exists.
  const hasArt = (key: string, rarity: string) => variantImageUrl(key, rarity) !== null;
  const artsByCard = useMemo(() => new Map(allCards.map((card) => [card.key, artsOf(card, hasArt)])), [allCards]);
  const artsFor = (card: Card) => artsByCard.get(card.key) ?? [];
  const entryOf = (card: Card): CollectionEntry | undefined => entryOfCard(collection, card);
  const writeEntry = (card: Card, before: CollectionEntry | undefined, after: CollectionEntry | undefined) =>
    writeCardEntry(collectionStore, card, before, after);
  /** The card box's counter (D-022): a card with a Welcome to Night City printing counts by edition. */
  const handleCountChange = (card: Card, count: number, edition: DefaultEdition = editionState) => {
    if (collectionFilter !== 'all') setKept((current) => (current.has(card.key) ? current : new Set(current).add(card.key)));
    if (collection.phase !== 'ready' || targetPrinting(card, edition) === null) {
      collectionStore.setCount(card.key, count);
      return;
    }
    const before = entryOf(card);
    try {
      const after = setCopiesByEdition({ entries: before === undefined ? [] : [before] }, card, edition, count);
      writeEntry(card, before, after.entries[0]);
    } catch {
      collectionAnnouncer.announceLimit(card);
    }
  };
  const handleArtChange = (card: Card, art: Art, next: number, edition: DefaultEdition = editionState) => {
    const before = entryOf(card);
    if (next > (ownedPerArt(before, card, artsFor(card)).get(art.artId) ?? 0) && countIn(collection, card.key) >= 999) {
      collectionAnnouncer.announceLimit(card);
      return;
    }
    try {
      const start = { entries: before === undefined ? [] : [before] };
      // D-022: the base art of a Welcome to Night City card counts by edition, like the card box.
      const edited =
        art.rarity === null && targetPrinting(card, edition) !== null
          ? setCopiesByEdition(start, card, edition, (before?.count ?? 0) + next - (ownedPerArt(before, card, artsFor(card)).get(art.artId) ?? 0))
          : setArtCount(start, card, art.artId, next, artsFor(card));
      writeEntry(card, before, edited.entries[0]);
    } catch {
      collectionAnnouncer.announceLimit(card);
    }
  };
  /** The picture of the special art a search result matches (rarity or set filter), or null (D-021). */
  const filterArtUrl = (card: Card): string | null => {
    const rarity = matchedSpecialRarity(card, criteria.rarities, setChoice, hasArt);
    return rarity === null ? null : variantImageUrl(card.key, rarity);
  };

  /** The rarity a table row shows: the special rarity a filter matches, else the card's own. */
  const rarityOf = (card: Card): string | null => matchedSpecialRarity(card, criteria.rarities, setChoice, hasArt) ?? card.rarity;

  // One box per card, or in the "all arts" mode one per art (D-021).
  const gridItems: CardListItem[] | undefined =
    view !== 'grid'
      ? undefined
      : allArts
        ? sortedForGrid.flatMap((card): CardListItem[] => {
            const arts = artsFor(card);
            if (arts.length === 0) return [{ card, art: null, imageUrl: null, artCount: 1 }];
            const matching = arts.filter(artMatchesFilter);
            const perArt = ownedPerArt(entryOf(card), card, arts);
            return (matching.length > 0 ? matching : arts)
              .filter((art) => !(listedOnly && !kept.has(card.key) && (perArt.get(art.artId) ?? 0) === 0))
              .map((art) => ({
                card,
                art,
                imageUrl: art.rarity === null ? null : variantImageUrl(card.key, art.rarity),
                artCount: arts.length,
              }));
          })
        : sortedForGrid.map((card): CardListItem => {
            const arts = artsFor(card);
            const imageUrl = filterArtUrl(card);
            const versionUrls = arts.map((art) => (art.rarity === null ? null : variantImageUrl(card.key, art.rarity)));
            const versionRarities = arts.map((art) => artRarity(card, art));
            const lone = arts.length === 1 && arts[0] !== undefined ? artRarity(card, arts[0]) : undefined;
            return { card, art: null, imageUrl, artCount: arts.length, versionUrls, versionRarities, startVersion: Math.max(0, versionUrls.indexOf(imageUrl)), rarity: lone };
          });

  const owned: OwnedColumn | undefined =
    collection.phase === 'unavailable'
      ? undefined
      : {
          mode: collection.phase,
          countOf: (card) => countIn(collection, card.key),
          onChange: (card, count) => guardAdd(card, count > countIn(collection, card.key), (ed) => handleCountChange(card, count, ed)),
          onLimit: collectionAnnouncer.announceLimit,
          minOf: (card) =>
            targetPrinting(card, edition) === null ? minCountOf(collection.saved, card.key) : protectedCount(collection.saved, card),
          artCountOf: (card, art) => ownedPerArt(entryOf(card), card, artsFor(card)).get(art.artId) ?? 0,
          onArtChange: (card, art, count) => {
            if (collectionFilter !== 'all') setKept((current) => (current.has(card.key) ? current : new Set(current).add(card.key)));
            const adding = art.rarity === null && count > (ownedPerArt(entryOf(card), card, artsFor(card)).get(art.artId) ?? 0);
            guardAdd(card, adding, (ed) => handleArtChange(card, art, count, ed));
          },
          editable,
        };
  const summary =
    collection.phase === 'loading'
      ? texts.collectionLoading
      : collection.phase === 'ready'
        ? collectionSummary(collection, allCards)
        : null;

  const setList = useMemo(() => setOptions(allCards), [allCards]);
  const setLabels = new Map(setList.map((option) => [option.family, option.label]));
  const setGroups = new Map(setList.map((option) => [option.family, option.group]));

  const status = filterActive ? texts.filteredStatus(filtered.length, allCards.length) : cardCount(allCards.length);
  const listCaption = filterActive ? texts.tableCaptionFiltered : texts.tableCaption;
  const noResults = filtered.length === 0;
  // "Vain omistetut" alone and nothing owned: guide to marking cards instead (UX.md 6.6).
  const noOwnedCards = !locked && noResults && listedOnly && !isFilterActive(criteria);

  // T-070: the card detail panel in the image dialog; counters only once their stores are ready.
  const details =
    openCard === null ? undefined : (
      <>
        {collection.phase === 'ready' && (
          <section aria-labelledby="card-detail-collection" className="detail-collection">
            <h3 id="card-detail-collection">{texts.detailCollection}</h3>
            <CountControl
              card={openCard}
              count={countIn(collection, openCard.key)}
              mode="ready"
              onChange={(card, count) => {
                if (needsEditionConfirm(card, count > countIn(collection, card.key))) {
                  setPendingAdd({ card, run: (ed) => handleCountChange(card, count, ed) });
                } else collectionStore.setCount(card.key, count);
              }}
              onLimit={collectionAnnouncer.announceLimit}
              editable={editable}
              min={minCountOf(collection.saved, openCard.key)}
            />
            {countIn(collection, openCard.key) < playsetSize(openCard) && (
              <p>{texts.detailPlaysetMissing(playsetSize(openCard) - countIn(collection, openCard.key))}</p>
            )}
            {countIn(collection, openCard.key) >= playsetSize(openCard) && <p>{texts.playsetFull}</p>}
            {editable && countIn(collection, openCard.key) > 0 && countIn(collection, openCard.key) <= minCountOf(collection.saved, openCard.key) && (
              <p className="hint">{texts.versionsLowerFirst}</p>
            )}
          </section>
        )}
        {collection.phase === 'ready' && (
          <CardVersions
            card={openCard}
            count={countIn(collection, openCard.key)}
            versionCount={(printing) => versionCountIn(collection, openCard.key, printing)}
            editable={editable}
            onChange={(printing, count) => collectionStore.setVersionCount(openCard.key, printing, count)}
            onArtChange={(art, count) =>
              guardAdd(openCard, art.rarity === null && count > (ownedPerArt(entryOf(openCard), openCard, artsFor(openCard)).get(art.artId) ?? 0), (ed) =>
                handleArtChange(openCard, art, count, ed),
              )
            }
            onLimit={collectionAnnouncer.announceLimit}
            shownArt={shownArt}
            onShowArt={setShownArt}
          />
        )}
        {wants.snapshot.phase === 'ready' && (
          <section aria-labelledby="card-detail-want" className="detail-want">
            <h3 id="card-detail-want">{texts.detailWant}</h3>
            <CountControl
              card={openCard}
              count={countIn(wants.snapshot, openCard.key)}
              mode="ready"
              onChange={(card, count) => wants.store.setCount(card.key, count)}
              onLimit={() => undefined}
              editable
              kind="want"
            />
            {collection.phase === 'ready' && tradeableCount(countIn(collection, openCard.key), openCard) > 0 && (
              <p>{texts.detailTradeable(tradeableCount(countIn(collection, openCard.key), openCard))}</p>
            )}
          </section>
        )}
        {proxyQueue.snapshot.phase === 'ready' && (
          <div className="detail-proxy proxy-send">
            <SendToProxyButton rows={[{ card: openCard.key, count: 1 }]} queue={proxyQueue} label={proxyTexts.addCardToQueue} />
          </div>
        )}
        {decksPhase === 'ready' && (
          <section aria-labelledby="card-detail-decks" className="detail-decks">
            <h3 id="card-detail-decks">{texts.detailDecks}</h3>
            {(decksByCard.get(openCard.key) ?? NO_DECKS).length === 0 ? (
              <p>{texts.detailNoDecks}</p>
            ) : (
              <ul>
                {(decksByCard.get(openCard.key) ?? NO_DECKS).map((deck) => (
                  <li key={deck.id}>
                    <a href={`#/pakat/${deck.id}`}>{deck.name}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </>
    );

  const handleOpenImage = (card: Card, opener: HTMLButtonElement, artUrl: string | null = null) => {
    preview.hide();
    imageOpenerRef.current = opener;
    setOpenCard(card);
    setShownArt(artUrl);
  };

  const handleCloseImage = () => {
    if (routeCardKey !== null) {
      setDismissedKey(routeCardKey);
      if (window.location.hash !== '#/') window.location.hash = '#/';
    }
    setOpenCard(null);
    setShownArt(null);
    // Back to the thumbnail; if its row is gone, the search field is the nearest stable place.
    const opener = imageOpenerRef.current;
    imageOpenerRef.current = null;
    if (opener?.isConnected) opener.focus();
    else searchInputRef.current?.focus();
  };

  const handleShowAll = () => {
    updateFilters(criteria, baseFilter, 'now', true);
    collectionAllRef.current?.focus();
  };

  // Chips for the selected values, in the order of the form (T-050a, T-052).
  const activeFilters: ActiveFilter[] = [
    ...(locked || collectionFilter === 'all'
      ? []
      : [
          {
            id: 'collection',
            label: COLLECTION_FILTER_LABELS[collectionFilter],
            onRemove: () => updateFilters(criteria, baseFilter, 'later'),
          },
        ]),
    ...(setChoice === null
      ? []
      : [
          {
            id: 'set',
            label: (setGroups.get(setChoice) === 'other' ? texts.productChip : texts.setChip)(setLabels.get(setChoice) ?? setChoice),
            onRemove: () => handleSetChange(null),
          },
        ]),
    ...criteriaFilters(criteria, (next) => updateCriteria(next, 'later')),
  ];

  return (
    <>
      {locked ? (
        summary !== null && (
          <p id="collection-summary" className="status-line is-summary">
            {summary}
          </p>
        )
      ) : (
        <div className="page-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {texts.heading}
          </h1>
          <div className="page-head-status">
            <p id="card-status" className="status-line">
              {status}
            </p>
            {summary !== null && (
              <p id="collection-summary" className="status-line is-summary">
                {summary}
              </p>
            )}
          </div>
        </div>
      )}
      {/* Stays mounted so screen readers announce each change. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcer.text ?? texts.loaded(listTotal)}
      </div>

      {routeCardKey !== null && routeCardKey !== dismissedKey && routeCard === null && (
        <div className="notice notice-danger" role="alert">
          <p>{texts.cardNotFound}</p>
          <a className="text-link" href="#/">
            {texts.cardNotFoundBack}
          </a>
        </div>
      )}

      <CollectionNotices
        snapshot={collection}
        persistent={repositories.persistent}
        onDismiss={(kind) => {
          collectionStore.dismissNotice(kind);
          focusHeading();
        }}
        onDismissSaveError={() => {
          collectionStore.dismissSaveError();
          focusHeading();
        }}
        onReload={() => {
          focusHeading();
          collectionStore.reload();
        }}
      />

      {collection.phase === 'ready' && repositories.persistent && (
        <StorageReminder
          state={persistence}
          resultRef={persistenceResultRef}
          slot={headerSlot}
          onRequest={handleRequestPersistence}
        />
      )}

      <div className="catalog-layout">
        <section className="catalog-filters" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="filters-heading">
            {texts.filtersHeading}
          </h2>
          <CardFilters
            criteria={criteria}
            setOptions={setList}
            setFamily={setChoice}
            onSetChange={handleSetChange}
            typeOptions={filterOptions(
              KNOWN_CARD_TYPES,
              allCards.map((card) => card.type),
              criteria.types,
            )}
            colorOptions={filterOptions(
              KNOWN_CARD_COLORS,
              allCards.map((card) => card.color),
              criteria.colors,
            )}
            rarityOptions={filterOptions(
              KNOWN_CARD_RARITIES,
              allCards
                .flatMap((card) => [card.rarity, ...(card.printings ?? []).map((p) => p.rarity)])
                .map((r) => (r === null ? null : officialRarity(r))),
              criteria.rarities,
            )}
            numberOptions={numberFilterOptionsFor(allCards, criteria)}
            searchInputRef={searchInputRef}
            collectionFilter={collection.phase === 'ready' && !locked ? collectionFilter : undefined}
            collectionAllRef={collectionAllRef}
            onCollectionFilterChange={(next) => updateFilters(criteria, next, 'later')}
            onQueryChange={(query, composing) =>
              updateCriteria({ ...criteria, query }, composing ? 'never' : 'later')
            }
            onToggleType={(type) => updateCriteria({ ...criteria, types: toggleValue(criteria.types, type) }, 'later')}
            onToggleColor={(color) =>
              updateCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) }, 'later')
            }
            onToggleSellable={() => updateCriteria({ ...criteria, sellable: criteria.sellable !== true }, 'later')}
            onToggleRarity={(rarity) =>
              updateCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) }, 'later')
            }
            onToggleNumber={(group, value) =>
              updateCriteria({ ...criteria, [group]: toggleValue(criteria[group], value) }, 'later')
            }
            onSearchSubmit={() =>
              announcer.announceNow(describeResult(filterActive, filtered.length, listTotal))
            }
            collapsibleBelow={WIDE_QUERY}
            results={{ count: filtered.length, id: 'active-filters' }}
          />
        </section>

        <section className="catalog-results" aria-labelledby="results-heading" data-image-size={imageSize}>
          <h2 id="results-heading" className="visually-hidden">
            {texts.resultsHeading}
          </h2>
          <ListToolbar
            view={view}
            onViewChange={handleViewChange}
            editable={collection.phase === 'ready' ? editable : undefined}
            onEditChange={handleEditChange}
            hideEditSwitch={locked}
            imageSize={view === 'grid' ? imageSize : undefined}
            onImageSizeChange={setImageSize}
            allArts={view === 'grid' ? allArts : undefined}
            onAllArtsChange={setAllArts}
            edition={edition}
            onEditionChange={handleEditionChange}
          />
          <div className="sort-row">
            <SortSelect sort={sort} onChange={setSort} />
            {!locked && <ScanCardsButton cards={allCards} snapshot={collection} store={collectionStore} edition={edition} onEditionChange={handleEditionChange} preferences={repositories.preferences} />}
            {editable && collection.phase === 'ready' && wants.snapshot.phase === 'ready' && (
              <div className="missing-add missing-add--quiet">
                <AddMissingToWantsButton rows={missingRows} wants={wants} className="link-button missing-link" confirm />
              </div>
            )}
          </div>

          <ActiveFilters
            filters={activeFilters}
            // The empty state has its own button for the same action (no two buttons with one name).
            showClear={filterActive && !(noResults && !noOwnedCards)}
            onClear={handleClearFilters}
            searchInputRef={searchInputRef}
          />

          {noResults && (
            <div className="empty">
              <p>{noOwnedCards ? texts.ownedOnlyEmptyBody : texts.noResultsBody}</p>
              <button
                type="button"
                className="button-primary"
                onClick={noOwnedCards ? handleShowAll : handleClearFilters}
              >
                {noOwnedCards ? texts.showAllCards : texts.clearFilters}
              </button>
            </div>
          )}

          {filtered.length > 0 &&
            (view === 'table' ? (
              <CardTable
                cards={filtered}
                caption={listCaption}
                owned={owned}
                decksOf={decksOf}
                onOpenImage={handleOpenImage}
                artUrlOf={filterArtUrl}
                rarityOf={rarityOf}
                hoverProps={preview.bind}
                sort={sort}
                onSortChange={setSort}
              />
            ) : (
              <CardList cards={sortedForGrid} items={gridItems} caption={listCaption} owned={owned} decksOf={decksOf} onOpenImage={handleOpenImage} />
            ))}
        </section>
      </div>

      {view === 'table' && preview.preview}
      <EditionConfirmDialog card={pendingAdd?.card ?? null} onChoose={handleEditionChosen} onCancel={() => setPendingAdd(null)} />
      <CardImageDialog card={openCard} onClose={handleCloseImage} details={details} artUrl={shownArt} />
    </>
  );
}
