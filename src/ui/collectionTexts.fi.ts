import type { Achievement } from '../domain/achievements';

const cards = (n: number) => (n === 1 ? '1 kortti' : `${n} korttia`);

/** Texts of the Collection progress section (T-105). */
export const collectionTextsFi = {
  navCollection: 'Kokoelma',
  heading: 'Kokoelma',
  loading: 'Ladataan kokoelmaa…',
  unavailable: 'Kokoelmaa ei voitu lukea. Lataa sivu uudelleen. Jos ongelma jatkuu, tarkista selaimen yksityisyysasetukset.',
  emptyTitle: 'Kokoelmasi on vielä tyhjä',
  emptyBody: 'Skannaa kortit tai lisää ne Kortit-osiossa, niin tähän ilmestyvät omat korttisi, keräysaste, puuttuvat kortit ja täydet pelisarjat.',
  emptyLink: 'Selaa kortteja ja lisää',
  overviewHeading: 'Yleiskuva',
  ownedDistinct: 'Eri korttia omistettu',
  ownedOf: (owned: number, total: number) => `${owned} / ${total} eri korttia omistettu`,
  copiesLabel: 'Kopioita',
  copiesHint: 'kaikki kappaleet yhteensä',
  playsetsLabel: 'Täysiä pelisarjoja',
  playsetsHint: (total: number) => `${total} kortista, 3 kpl (Legend 1)`,
  setsHeading: 'Seteittäin',
  setsHint: 'Laskee kortit, joille olet merkinnyt painoksen (versio). Kopiot ilman merkittyä painosta eivät kuulu mihinkään setiin.',
  setsNoVersions: 'Et ole merkinnyt vielä yhtään painosta, joten setit näyttävät nollaa. Merkitse painokset kortin tiedoissa.',
  otherProducts: 'Muut tuotteet',
  rarityHeading: 'Harvinaisuuksittain',
  specialHeading: 'Erikoisversiot',
  colorsTypesHeading: 'Värit ja tyypit',
  colorsHeading: 'Värit',
  typesHeading: 'Tyypit',
  noColor: 'Ei väriä',
  rowSpoken: (name: string, owned: number, total: number) => `${name}: ${owned} / ${total} eri korttia omistettu`,
  missingHeading: 'Puuttuvat kortit',
  missingIntro: 'Kortit, joista sinulla ei ole yhtään kappaletta. Kortin klikkaus avaa sen tiedot.',
  filterSet: 'Pelisarja',
  filterRarity: 'Harvinaisuus',
  filterAll: 'Kaikki',
  missingCount: (n: number) => (n === 0 ? 'Ei puuttuvia kortteja tällä rajauksella.' : `${cards(n)} puuttuu.`),
  allOwned: 'Sinulla on jokaista korttia vähintään yksi. Hienoa!',
  openCard: 'Avaa kortin tiedot: ',
  wantLabel: 'Lisää puuttuvat want-listalle',
  proxyLabel: 'Lähetä puuttuvat proxy-jonoon',
  proxyNote: 'Proxy-jonoon tulee yksi kappale kutakin korttia. Jonoon mahtuu enintään 200 korttia.',
  viewLabel: 'Näkymä',
  viewOwn: 'Omat kortit',
  viewOverview: 'Yleiskuva',
  viewBinder: 'Kansio',
  binderHeading: 'Keräilykansio',
  betaMark: 'Beta',
  binderShowMissing: 'Näytä puuttuvat',
  binderOwnedCount: (owned: number, total: number) => `${owned} / ${total} korttia omistettu`,
  binderEmpty: 'Näillä valinnoilla ei ole näytettäviä kortteja.',
  binderGroup: 'Keräilykansion sivut',
  binderHelp: 'Käännä sivua nuolilla, nuolinäppäimillä tai pyyhkäisemällä.',
  binderPrev: 'Edellinen sivu',
  binderNext: 'Seuraava sivu',
  binderPage: (page: number) => `Sivu ${page}`,
  binderPosition: (first: number, last: number, total: number) => (first === last ? `Sivu ${first} / ${total}` : `Sivut ${first}–${last} / ${total}`),
  pocketOwned: (number: string, name: string, copies: number, betaOnly = false) => `#${number} ${name}, omistettu ${copies}${betaOnly ? ', Beta-painos' : ''}`,
  pocketMissing: (number: string, name: string) => `#${number} ${name}, puuttuu`,
  binderModeLabel: 'Kansion tila',
  binderModeSet: 'Setti',
  binderModeCustom: 'Oma kansio',
  binderEdit: 'Muokkaa',
  coverFront: 'Etukansi',
  coverBack: 'Takakansi',
  coverSetName: 'Welcome to Night City',
  binderCustomCount: (n: number) => `${cards(n)} kansiossa`,
  binderDefaultName: 'Oma kansio',
  binderSlot: (page: number, slot: number) => `Sivu ${page}, tasku ${slot}`,
  binderSlotEmpty: (slot: string) => `${slot}, tyhjä`,
  binderSlotCard: (slot: string, name: string, backed: boolean) => (backed ? `${slot}, ${name}` : `${slot}, ${name}, ei omistettu`),
  binderToolsGroup: 'Kansion muokkaus',
  binderEditHint: 'Valitse tasku ja sitten toinen tasku: kortit vaihtavat paikkaa tai kortti siirtyy tyhjään taskuun. Tyhjä tasku avaa kortinvalitsimen.',
  binderRename: 'Kansion nimi',
  binderClearPocket: 'Tyhjennä tasku',
  binderChangeCard: 'Vaihda kortti',
  binderAddPage: 'Lisää sivu',
  binderRemovePage: (page: number) => `Poista sivu ${page}`,
  binderRemovePageHint: 'Vain tyhjän sivun voi poistaa.',
  binderSaveFailed: 'Kansion asettelua ei voitu tallentaa tälle laitteelle. Muutokset säilyvät vain, kunnes suljet sivun.',
  binderSelected: (slot: string) => `${slot} valittu.`,
  binderDeselected: 'Valinta poistettu.',
  binderSwapped: (a: string, b: string) => `Kortit vaihdettu: ${a} ja ${b}.`,
  binderMoved: (a: string, b: string) => `Kortti siirretty: ${a} → ${b}.`,
  binderCleared: (slot: string) => `${slot} tyhjennetty.`,
  binderPlaced: (name: string, slot: string) => `${name} sijoitettu: ${slot}.`,
  binderPageAdded: (page: number) => `Sivu ${page} lisätty.`,
  binderPageRemoved: (page: number) => `Sivu ${page} poistettu.`,
  binderPickTitle: 'Valitse kortti taskuun',
  binderPickSearch: 'Hae omista korteista nimellä',
  binderPickPlaced: (placed: number, copies: number) => `${placed} / ${copies} kansiossa`,
  binderPickFull: 'kaikki kopiot kansiossa',
  binderPickMore: (n: number) => `Vielä ${cards(n)}. Tarkenna hakua.`,
  binderPickNone: 'Ei omistettuja kortteja tällä haulla.',
  binderPickCancel: 'Peruuta',
  wantNote: 'Want-listalle tulee kunkin kortin täysi pelisarja.',
  achievementsHeading: 'Saavutukset',
  achievementsEarned: (earned: number, total: number) => `${earned} / ${total} saavutettu`,
  achievementsNext: 'Seuraavat keikat',
  achievementUnlocked: 'Avattu',
  achievementsOpen: (n: number) => `Lisää lukittuja (${n})`,
  achievementsAllDone: 'Kaikki saavutukset ansaittu!',
  achievementsEarnedList: 'Ansaitut saavutukset',
  achievementsOpenList: 'Avoimet saavutukset',
  // T-150: names and lines with Night City attitude. The subject is the color, type or rarity (official name).
  achievementTitle: (item: Achievement): string => {
    switch (item.kind) {
      case 'distinct':
        return 'Puoli kaupunkia';
      case 'all':
        return 'Koko Night City';
      case 'copies':
        return item.subject === 250 ? 'Kasa kromia' : item.subject === 500 ? 'Korttiholvi' : 'Arasakan arkisto';
      case 'playsets':
        return 'Täysi arsenaali';
      case 'set':
        return 'Tervetuloa Night Cityyn';
      case 'color':
        return ({ Red: 'Punainen raivo', Yellow: 'Neonkeltainen', Green: 'Myrkynvihreä', Blue: 'Kylmä sininen' } as Record<string, string>)[String(item.subject)] ?? `Väri täynnä: ${item.subject}`;
      case 'type':
        return ({ Legend: 'Legendojen kaupunki', Unit: 'Oma jengi', Gear: 'Asevarasto', Program: 'Daemon-kirjasto' } as Record<string, string>)[String(item.subject)] ?? `Tyyppi täynnä: ${item.subject}`;
      case 'rarity':
        return ({ Rare: 'Preem-kamaa', 'Epic Rare': 'Eeppinen keikka', 'Secret Rare': 'Salaisuuksien välittäjä', 'Iconic Rare': 'Ikoni', 'Nova Rare': 'Supernova' } as Record<string, string>)[String(item.subject)] ?? `Harvinaisuus täynnä: ${item.subject}`;
    }
  },
  achievementFlavor: (item: Achievement): string => {
    switch (item.kind) {
      case 'distinct':
        return `${item.subject} eri korttia. Puolet kaupungin kasvoista kansiossa.`;
      case 'all':
        return 'Jokainen kortti. Jokainen kuja.';
      case 'copies':
        return item.subject === 250
          ? '250 kappaletta. Pöytä alkaa notkua.'
          : item.subject === 500
            ? '500 kappaletta. Tarvitset isomman laatikon, choom.'
            : '1000 kappaletta. Arasaka olisi kateellinen.';
      case 'playsets':
        return 'Pelisarja jokaisesta kortista. Valmis mihin tahansa keikkaan.';
      case 'set':
        return 'Welcome to Night City kokonaan kasassa.';
      case 'color':
        return `Jokainen ${item.subject}-kortti.`;
      case 'type':
        return ({ Legend: 'Jokainen Legend. Kaupunki muistaa nimet.', Unit: 'Jokainen Unit riveissä.', Gear: 'Jokainen Gear hyllyssä.', Program: 'Jokainen Program ladattuna.' } as Record<string, string>)[String(item.subject)] ?? `Jokainen ${item.subject}.`;
      case 'rarity':
        return item.subject === 'Nova Rare' || item.subject === 'Iconic Rare' ? `Jokainen ${item.subject} -kuvitus.` : `Jokainen ${item.subject} -kortti.`;
    }
  },

};
