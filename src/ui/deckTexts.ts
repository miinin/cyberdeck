import { LEGEND_COUNT, MAX_MAIN_DECK, MIN_MAIN_DECK } from '../domain/deckRules';
import { MAX_DECK_NAME_LENGTH } from '../domain/deck';
import type { StorageErrorKind } from '../storage';
import { cardCount } from './texts';

// User-facing texts of deck building (T-013). Terms follow docs/CONTENT.md: card type and game
// terms (Legend, RAM, Cost) stay in English, the rest is plain Finnish.

/** "1 rike", "2 rikettä" */
function issueCount(count: number): string {
  return `${count} ${count === 1 ? 'rike' : 'rikettä'}`;
}

export const deckTexts = {
  navLabel: 'Päävalikko',
  navCards: 'Kortit',
  navDecks: 'Pakat',

  listHeading: 'Pakat',
  listEmpty: 'Sinulla ei ole vielä pakkoja. Aloita luomalla ensimmäinen pakka.',
  listLoading: 'Ladataan pakkoja…',
  listUnavailable: 'Pakkoja ei voitu ladata. Lataa sivu uudelleen. Jos ongelma jatkuu, tarkista selaimen yksityisyysasetukset.',
  newDeck: 'Uusi pakka',
  // Deck cards and empty state (T-051)
  listEmptyTitle: 'Ei vielä pakkoja',
  listEmptyHint: 'Rakenna pakka kortti kerrallaan, liitä valmis pakkalista tai hae julkinen pakka Netdeck.gg:stä.',
  fetchNetdeck: 'Hae Netdeckistä',
  deckColors: 'Värit',
  decksLabel: 'Omat pakat',
  open: 'Avaa',
  rename: 'Nimeä uudelleen',
  copy: 'Kopioi',
  remove: 'Poista',
  /** Accessible names: the button text plus the deck name. */
  forDeck: (action: string, name: string) => `${action}: ${name}`,
  counts: (legends: number, main: number) =>
    `Legendit ${legends}/${LEGEND_COUNT} · Pääpakka ${main}/${MIN_MAIN_DECK}–${MAX_MAIN_DECK}`,
  legal: 'Laillinen ✓',
  legalSpoken: 'Laillinen',
  unfinished: (issues: number) => `Keskeneräinen · ${issueCount(issues)}`,
  updated: 'Muokattu',

  nameLabel: 'Pakan nimi',
  nameHint: `Enintään ${MAX_DECK_NAME_LENGTH} merkkiä.`,
  nameEmpty: 'Anna pakalle nimi.',
  nameTooLong: `Nimi on liian pitkä. Enintään ${MAX_DECK_NAME_LENGTH} merkkiä.`,
  saveName: 'Tallenna nimi',
  cancel: 'Peruuta',

  deleteTitle: 'Poistetaanko pakka?',
  deleteBody: (name: string) => `Pakka "${name}" poistetaan. Kortit säilyvät kokoelmassasi, mutta pakkaa ei voi palauttaa.`,
  deleteConfirm: 'Poista pakka',
  deletedLive: (name: string) => `Pakka "${name}" poistettu.`,
  createdLive: (name: string) => `Pakka "${name}" luotu.`,
  copiedLive: (name: string) => `Kopio "${name}" luotu.`,
  renamedLive: (name: string) => `Pakan nimi on nyt "${name}".`,

  errorDismiss: 'Sulje ilmoitus',
  /** What went wrong when a list action failed, by error kind. */
  actionFailed: (kind: StorageErrorKind | 'unknown') => {
    switch (kind) {
      case 'quota':
        return 'Selaimen tallennustila on täynnä, joten muutos ei tallentunut. Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta ja yritä uudelleen.';
      case 'unavailable':
        return 'Selain esti tallennuksen, joten muutos ei tallentunut. Yritä uudelleen. Jos ongelma jatkuu, tarkista selaimen yksityisyysasetukset.';
      case 'limit-reached':
        return 'Pakkoja on jo niin paljon, ettei uutta mahdu. Poista pakka, jota et enää tarvitse.';
      case 'newer-version':
        return 'Pakat on tallennettu uudemmalla sovellusversiolla, joten niitä ei voi muuttaa tällä versiolla. Lataa sivu uudelleen.';
      case 'not-found':
        return 'Pakkaa ei löytynyt. Se on voitu poistaa toisessa välilehdessä.';
      default:
        return 'Jokin meni pieleen, ja muutos ei tallentunut. Yritä uudelleen.';
    }
  },

  // Editor
  backToList: 'Takaisin pakkoihin',
  editorLoading: 'Ladataan pakkaa…',
  editorNotFound: 'Pakkaa ei löytynyt. Se on voitu poistaa.',
  legendsHeading: 'Legendit',
  mainHeading: 'Pääpakka',
  sectionLabel: (title: string) => `${title}: pakan kortit`,
  unknownHeading: 'Tuntemattomat kortit',
  removeUnknown: (key: string, count: number) => `Poista pakasta: ${key} (${count})`,
  deckEmpty: 'Pakka on tyhjä. Lisää kortteja hakulistasta.',
  legendsEmpty: 'Ei Legendejä. Lisää kolme eri Legendiä.',
  ramLimitsLabel: 'RAM-rajat',
  ramLimit: (color: string, limit: number) => `${color} ${limit}`,
  ramLimitsNone: 'Ei RAM-rajoja ennen kuin pakassa on Legend.',
  issuesHeading: 'Ongelmat',
  allGood: 'Pakka on laillinen.',
  issuesLive: (count: number) => (count === 0 ? 'Pakka on nyt laillinen.' : `Pakassa on ${issueCount(count)}.`),
  warningPrefix: 'Huomio: ',
  rulesNote: 'Tarkistettava: sääntö käyttää kortin yhtä väriä ja RAM-arvoa sellaisenaan.',
  missingFromCollection: (count: number) =>
    count === 0 ? 'Kaikki pakan kortit ovat kokoelmassasi.' : `Kokoelmasta puuttuu ${cardCount(count)}.`,
  collectionNotReady: 'Kokoelmaa ei voi verrata, koska sitä ei voitu ladata.',
  owned: (have: number, need: number) => `omistat ${have}/${need}`,
  missingBadge: 'puuttuu',
  missingCount: (count: number) => `puuttuu ${count}`,
  /** Small badge on a search result: copies already in the deck. */
  inDeckBadge: (count: number) => `${count} pakassa`,
  curveHeading: 'Kustannuskäyrä',
  curveCaption: 'Pääpakan kortit Costin mukaan',
  curveCost: 'Cost',
  curveCopies: 'Kortteja',
  curveBucket: (cost: number, last: number) => (cost >= last ? `${last}+` : String(cost)),
  addToDeck: 'Lisää pakkaan',
  addCard: (name: string) => `Lisää pakkaan: ${name}`,
  removeCard: (name: string) => `Poista pakasta: ${name}`,
  inDeck: (count: number) => `Pakassa ${count}`,
  searchHeading: 'Lisää kortteja',
  searchResults: (shown: number, all: number) => `${shown} / ${all} korttia`,
  noSearchResults: 'Hakua vastaavia kortteja ei löytynyt.',
  dimmedHint: (reason: string) => `${reason} Voit silti lisätä kortin.`,
  sameLegend: (name: string) => `Pakassa on jo Legend nimeltä ${name}.`,
  toastClose: 'Sulje ilmoitus',
  pickViewLegend: 'Näkymä',
  pickViewList: 'Rivit',
  pickViewImages: 'Kuvat',
  // Result picker (T-050b)
  pickHint: 'Napsauta korttia lisätäksesi. Oikea napsautus tai Shift+napsautus poistaa. Näppäimistöllä + ja −.',
  resultsCaption: 'Hakutulokset',
  colInDeck: 'Pakassa',
  /** A broken limit still lets the card be added, so the mark must not sound like a refusal (UX-045). */
  blockedLimit: 'Yli rajan',
  blockedLegend: 'Sama Legend',
  sameLegendReason: (name: string) => `Pakassa on jo Legend ${name}.`,
  changeAnnounce: (name: string, count: number, main: number) => `${name}: ${count} pakassa. Pääpakka ${main} korttia.`,
  changeAnnounceLegend: (name: string, count: number, legends: number) =>
    `${name}: ${count} pakassa. Legendejä ${legends}/${LEGEND_COUNT}.`,
  // Deck column (T-050c)
  mainProgress: (main: number) => `Pääpakka ${main}/${MIN_MAIN_DECK}–${MAX_MAIN_DECK}`,
  legendsProgress: (legends: number) => `Legendit ${legends}/${LEGEND_COUNT}`,
  legalShort: 'Laillinen',
  issuesCount: (count: number) => (count === 1 ? '1 ongelma' : `${count} ongelmaa`),
  legendSlotEmpty: 'Legend-paikka vapaana',
  deckViewLegend: 'Pakkanäkymä',
  deckViewList: 'Lista',
  deckViewStacks: 'Pinot',
  /** Copies on a deck tile or a stack card, e.g. "×3". */
  copies: (count: number) => `×${count}`,
  stackCard: (name: string, count: number) => `Suurenna kuva: ${name}, ${count} pakassa`,
  statsHeading: 'Tilastot',
  colorsLabel: 'Värit',
  typesLabel: 'Tyypit',
  colorShare: (color: string, count: number, pct: number) => `${color} ${count} (${pct} %)`,
  typeShare: (type: string, count: number) => `${type} ${count}`,
  mobileBarMain: (main: number) => `Pakka ${main}/${MIN_MAIN_DECK}–${MAX_MAIN_DECK}`,
  showDeck: 'Näytä pakka',
  goToDeck: 'Siirry pakkaan',
  backToSearch: 'Takaisin hakuun',
  distinctLimit: 'Pakkaan mahtuu enintään 500 eri korttia, joten uutta korttia ei voi lisätä.',

  saveSaved: 'Tallennettu',
  saveSaving: 'Tallennetaan…',
  saveDirty: 'Muutokset tallennetaan hetken kuluttua…',
  saveFailed: (kind: StorageErrorKind | 'unknown') => `Ei tallennettu. ${deckTexts.actionFailed(kind)}`,
  saveRetry: 'Yritä tallentaa uudelleen',

  // Export (T-015)
  exportJson: 'Vie .json',
  exportTxt: 'Vie .txt',

  // Import (T-014)
  importButton: 'Tuo pakkalista',
  importHeading: 'Tuo pakkalista',
  importIntro: 'Liitä pakkalista tekstikenttään tai valitse .txt- tai .json-tiedosto. Rivit ovat muotoa "3 Kortin nimi - Alaotsikko".',
  importTextLabel: 'Pakkalista',
  importFileLabel: 'Tai valitse .txt- tai .json-tiedosto',
  importCheck: 'Tarkista lista',
  importBack: 'Takaisin pakkoihin',
  importErrors: {
    empty: 'Lista on tyhjä. Liitä pakkalista tai valitse tiedosto.',
    'too-long': 'Lista on liian pitkä. Enintään 64 kt, 300 riviä ja 300 merkkiä riviä kohti.',
    'too-many-lines': 'Listassa on liian monta riviä. Enintään 64 kt, 300 riviä ja 300 merkkiä riviä kohti.',
    'line-too-long': 'Listassa on liian pitkä rivi. Enintään 64 kt, 300 riviä ja 300 merkkiä riviä kohti.',
    'file-too-big': 'Tiedosto on liian suuri. Enintään 64 kt.',
    'json-too-long': 'Tiedosto on liian suuri. Enintään 256 kt.',
    'not-json': 'Tiedostoa ei voitu lukea. Tarkista, että se on cyberdeckista viety .json-tiedosto.',
    'not-deck': 'Tiedosto ei ole cyberdeckin pakka.',
    'file-unreadable': 'Tiedostoa ei voitu lukea. Kokeile liittää sen sisältö tekstikenttään.',
  },
  // Netdeck link (T-046)
  linkHeading: 'Hae pakka Netdeck-linkistä',
  textHeading: 'Liitä pakkalista tai tiedosto',
  linkLabel: 'Netdeck-linkki',
  linkHint: 'Esimerkiksi https://netdeck.gg/decks/cyberpunk/… Haku lähettää pyynnön Netdeck.gg-palveluun.',
  linkButton: 'Hae pakka',
  linkLoading: 'Haetaan pakkaa…',
  linkErrors: {
    'bad-url': 'Linkki ei kelpaa. Liitä pakan osoite, joka alkaa https://netdeck.gg/.',
    network: 'Pakkaa ei voitu hakea. Tarkista verkkoyhteys ja yritä uudelleen.',
    timeout: 'Haku kesti liian kauan. Yritä uudelleen.',
    'not-found': 'Pakkaa ei löytynyt. Tarkista linkki. Pakan pitää olla julkinen.',
    'invalid-response': 'Netdeckin vastausta ei voitu lukea. Kokeile liittää pakkalista tekstinä.',
    'too-large': 'Netdeckin vastaus on liian suuri. Kokeile liittää pakkalista tekstinä.',
  },
  reportSource: (name: string, author: string | null) =>
    author === null ? `Netdeck: ${name}` : `Netdeck: ${name}, tekijä ${author}`,
  reportSideboardHeading: 'Sideboard (ei mukana pakassa)',
  reportSideboardHint: 'Näitä kortteja ei tallenneta pakkaan.',
  reportHeading: 'Tarkistuksen tulos',
  reportCards: 'Tunnistetut kortit',
  reportNone: 'Listasta ei tunnistettu yhtään korttia.',
  reportRow: (count: number, name: string) => `${count} × ${name}`,
  reportMissingHeading: 'Kokoelmasta puuttuvat kortit',
  reportMissingRow: (name: string, missing: number) => `${name}: ${missing} puuttuu`,
  reportAlsoIn: (names: readonly string[]) => `Myös pakoissa: ${names.join(', ')}`,
  reportUnrecognizedHeading: (count: number) => `Tunnistamattomat rivit (${count})`,
  reportUnrecognizedHint: 'Näitä rivejä ei tallenneta pakkaan.',
  reportLegalityHeading: 'Säännöt',
  reportSaveHeading: 'Tallenna pakaksi',
  reportSaveButton: 'Tallenna pakaksi',
  reportNothingRecognized: 'Yhtään korttia ei tunnistettu, joten pakkaa ei voi tallentaa. Tarkista rivit.',

  // Catalog
  inDecks: (count: number) => `Pakoissa: ${count}`,
  inDecksNames: (names: readonly string[]) => `Pakoissa: ${names.join(', ')}`,
} as const;
