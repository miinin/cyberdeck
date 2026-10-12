import type { Achievement } from '../domain/achievements';
import type { collectionTextsFi } from './collectionTexts.fi';

const cards = (n: number) => (n === 1 ? '1 card' : `${n} cards`);

/** English texts of the Collection progress section (T-105); the same shape as the Finnish ones. */
export const collectionTextsEn: typeof collectionTextsFi = {
  navCollection: 'Collection',
  heading: 'Collection',
  loading: 'Loading your collection…',
  unavailable: 'Your collection could not be read. Reload the page. If the problem continues, check your browser privacy settings.',
  emptyTitle: 'Your collection is still empty',
  emptyBody: 'Scan cards or add them in the Cards section and this page shows your own cards, completion, missing cards and full playsets.',
  emptyLink: 'Browse cards and add',
  overviewHeading: 'Overview',
  ownedDistinct: 'Distinct cards owned',
  ownedOf: (owned: number, total: number) => `${owned} of ${total} distinct cards owned`,
  copiesLabel: 'Copies',
  copiesHint: 'all copies in total',
  playsetsLabel: 'Full playsets',
  playsetsHint: (total: number) => `of ${total} cards, 3 copies (Legend 1)`,
  setsHeading: 'By set',
  setsHint: 'Counts the cards whose version (printing) you have recorded. Copies without a recorded version do not belong to any set.',
  setsNoVersions: 'You have not recorded any versions yet, so the sets show zero. Record versions in the card details.',
  otherProducts: 'Other products',
  rarityHeading: 'By rarity',
  specialHeading: 'Special versions',
  colorsTypesHeading: 'Colors and types',
  colorsHeading: 'Colors',
  typesHeading: 'Types',
  noColor: 'No color',
  rowSpoken: (name: string, owned: number, total: number) => `${name}: ${owned} of ${total} distinct cards owned`,
  missingHeading: 'Missing cards',
  missingIntro: 'Cards you have no copy of. Click a card to open its details.',
  filterSet: 'Set',
  filterRarity: 'Rarity',
  filterAll: 'All',
  missingCount: (n: number) => (n === 0 ? 'No missing cards with this filter.' : `${cards(n)} missing.`),
  allOwned: 'You own at least one of every card. Great!',
  openCard: 'Open card details: ',
  wantLabel: 'Add missing to wants',
  proxyLabel: 'Send missing to the proxy queue',
  proxyNote: 'The proxy queue gets one copy of each card. It holds at most 200 cards.',
  viewLabel: 'View',
  viewOwn: 'My cards',
  viewOverview: 'Overview',
  viewBinder: 'Binder',
  binderHeading: 'Collector binder',
  betaMark: 'Beta',
  binderShowMissing: 'Show missing',
  binderOwnedCount: (owned: number, total: number) => `${owned} of ${total} cards owned`,
  binderEmpty: 'There are no cards to show with these options.',
  binderGroup: 'Binder pages',
  binderHelp: 'Turn the page with the arrows, the arrow keys or a swipe.',
  binderPrev: 'Previous page',
  binderNext: 'Next page',
  binderPage: (page: number) => `Page ${page}`,
  binderPosition: (first: number, last: number, total: number) => (first === last ? `Page ${first} / ${total}` : `Pages ${first}–${last} / ${total}`),
  pocketOwned: (number: string, name: string, copies: number, betaOnly = false) => `#${number} ${name}, owned ${copies}${betaOnly ? ', Beta edition' : ''}`,
  pocketMissing: (number: string, name: string) => `#${number} ${name}, missing`,
  binderModeLabel: 'Binder mode',
  binderModeSet: 'Set',
  binderModeCustom: 'My binder',
  binderEdit: 'Edit',
  coverFront: 'Front cover',
  coverBack: 'Back cover',
  coverSetName: 'Welcome to Night City',
  binderCustomCount: (n: number) => `${cards(n)} in the binder`,
  binderDefaultName: 'My binder',
  binderSlot: (page: number, slot: number) => `Page ${page}, pocket ${slot}`,
  binderSlotEmpty: (slot: string) => `${slot}, empty`,
  binderSlotCard: (slot: string, name: string, backed: boolean) => (backed ? `${slot}, ${name}` : `${slot}, ${name}, not owned`),
  binderToolsGroup: 'Edit the binder',
  binderEditHint: 'Select a pocket and then another: the cards swap places, or the card moves to an empty pocket. An empty pocket opens the card picker.',
  binderRename: 'Binder name',
  binderClearPocket: 'Empty pocket',
  binderChangeCard: 'Change card',
  binderAddPage: 'Add page',
  binderRemovePage: (page: number) => `Remove page ${page}`,
  binderRemovePageHint: 'Only an empty page can be removed.',
  binderSaveFailed: 'The binder layout could not be saved on this device. Changes last only until you close the page.',
  binderSelected: (slot: string) => `${slot} selected.`,
  binderDeselected: 'Selection cleared.',
  binderSwapped: (a: string, b: string) => `Cards swapped: ${a} and ${b}.`,
  binderMoved: (a: string, b: string) => `Card moved: ${a} → ${b}.`,
  binderCleared: (slot: string) => `${slot} emptied.`,
  binderPlaced: (name: string, slot: string) => `${name} placed: ${slot}.`,
  binderPageAdded: (page: number) => `Page ${page} added.`,
  binderPageRemoved: (page: number) => `Page ${page} removed.`,
  binderPickTitle: 'Choose a card for the pocket',
  binderPickSearch: 'Search your cards by name',
  binderPickPlaced: (placed: number, copies: number) => `${placed} / ${copies} in the binder`,
  binderPickFull: 'all copies are in the binder',
  binderPickMore: (n: number) => `${cards(n)} more. Narrow the search.`,
  binderPickNone: 'You own no cards that match.',
  binderPickCancel: 'Cancel',
  wantNote: 'The want list gets a full playset of each card.',
  achievementsHeading: 'Achievements',
  achievementsEarned: (earned: number, total: number) => `${earned} of ${total} earned`,
  achievementsNext: 'Next gigs',
  achievementUnlocked: 'Unlocked',
  achievementsOpen: (n: number) => `More locked (${n})`,
  achievementsAllDone: 'Every achievement earned!',
  achievementsEarnedList: 'Earned achievements',
  achievementsOpenList: 'Open achievements',
  achievementTitle: (item: Achievement): string => {
    switch (item.kind) {
      case 'distinct':
        return 'Half the City';
      case 'all':
        return 'All of Night City';
      case 'copies':
        return item.subject === 250 ? 'Pile of Chrome' : item.subject === 500 ? 'Card Vault' : 'Arasaka Archive';
      case 'playsets':
        return 'Full Arsenal';
      case 'set':
        return 'Welcome to Night City';
      case 'color':
        return ({ Red: 'Red Rage', Yellow: 'Neon Yellow', Green: 'Toxic Green', Blue: 'Cold Blue' } as Record<string, string>)[String(item.subject)] ?? `Color complete: ${item.subject}`;
      case 'type':
        return ({ Legend: 'City of Legends', Unit: 'Own Crew', Gear: 'Armory', Program: 'Daemon Library' } as Record<string, string>)[String(item.subject)] ?? `Type complete: ${item.subject}`;
      case 'rarity':
        return ({ Rare: 'Preem Stuff', 'Epic Rare': 'Epic Gig', 'Secret Rare': 'Secret Broker', 'Iconic Rare': 'Icon', 'Nova Rare': 'Supernova' } as Record<string, string>)[String(item.subject)] ?? `Rarity complete: ${item.subject}`;
    }
  },
  achievementFlavor: (item: Achievement): string => {
    switch (item.kind) {
      case 'distinct':
        return `${item.subject} different cards. Half the city's faces in your binder.`;
      case 'all':
        return 'Every card. Every alley.';
      case 'copies':
        return item.subject === 250
          ? '250 copies. The table starts to bend.'
          : item.subject === 500
            ? '500 copies. You need a bigger box, choom.'
            : '1000 copies. Arasaka would be jealous.';
      case 'playsets':
        return 'A playset of every card. Ready for any gig.';
      case 'set':
        return 'All of Welcome to Night City.';
      case 'color':
        return `Every ${item.subject} card.`;
      case 'type':
        return ({ Legend: 'Every Legend. The city remembers names.', Unit: 'Every Unit in line.', Gear: 'Every Gear on the rack.', Program: 'Every Program loaded.' } as Record<string, string>)[String(item.subject)] ?? `Every ${item.subject}.`;
      case 'rarity':
        return item.subject === 'Nova Rare' || item.subject === 'Iconic Rare' ? `Every ${item.subject} art.` : `Every ${item.subject} card.`;
    }
  },

};
