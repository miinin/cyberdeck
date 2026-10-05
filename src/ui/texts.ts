import type { AuthErrorKind } from '../account';
import { MAX_COLLECTION_ENTRIES } from '../domain/collection';

// User-facing texts. Source: docs/UX.md luvut 4.5, 5 and 6 (UX Designer). The footer is based on
// UX.md 4.3 and SECURITY.md luku 7. Reviewed in docs/reports/TXT-001-t001-tarkastus.md.

const numberFormat = new Intl.NumberFormat('fi-FI');

/** "1 kortti", "2 korttia", "1 024 korttia" */
export function cardCount(count: number): string {
  return `${numberFormat.format(count)} ${count === 1 ? 'kortti' : 'korttia'}`;
}

/** "12 / 151 korttia": "korttia" does not inflect in this form (UX.md 5.6). */
function cardShare(shown: number, all: number): string {
  return `${numberFormat.format(shown)} / ${numberFormat.format(all)} korttia`;
}

/** " kappale" / " kappaletta" after a number (UX.md 6.4.1). */
export function copiesSuffix(count: number): string {
  return count === 1 ? ' kappale' : ' kappaletta';
}

/** "1 kappale", "5 kappaletta", "1 024 kappaletta" */
function copies(count: number): string {
  return `${numberFormat.format(count)}${copiesSuffix(count)}`;
}

/** "1 eri kortti", "3 eri korttia" */
function distinctCards(count: number): string {
  return `${numberFormat.format(count)} eri ${count === 1 ? 'kortti' : 'korttia'}`;
}

export const texts = {
  appName: 'Cyberdeck',
  // Theme toggle (UX.md 8.4): the accessible name is always 'Vaalea teema'; the space comes from the markup.
  themeToggleLabel: 'Vaalea',
  themeToggleSuffix: 'teema',
  themeToggleTitleLight: 'Vaihda vaaleaan teemaan',
  themeToggleTitleDark: 'Vaihda tummaan teemaan',
  // Account (T-054a). The dialog body follows the PRIVACY.md luku 10 draft (Digiturva, SR-29 kohta 2);
  // the other texts are working copy until UX and Sisällöntuottaja review them before T-054c.
  accountSignIn: 'Kirjaudu',
  accountSigningIn: 'Kirjaudutaan…',
  accountMenu: 'Tili',
  accountDialogTitle: 'Kirjaudu Google-tilillä',
  accountAgeLimit: 'Kirjautuminen on tarkoitettu 16 vuotta täyttäneille.',
  accountPrivacy:
    'Tilille tallennetaan vain pakkasi, kokoelmasi ja want-listasi sekä Googlen antama tunniste, ei nimeäsi eikä sähköpostiasi. Tiedot säilytetään Googlen palvelimilla EU:ssa, ja voit poistaa ne milloin tahansa.',
  accountPrivacyGoogle:
    'Googlen tilitietosi (nimi ja sähköpostiosoite) säilyvät Firebase Authenticationissa, ei pakkojesi, kokoelmasi eikä want-listasi mukana.',
  accountPrivacyController: 'Rekisterinpitäjä: Miika Miinin, miikamiinin@gmail.com.',
  accountContinue: 'Jatka Googleen',
  accountCancel: 'Peruuta',
  accountClose: 'Sulje',
  accountUnavailableTitle: 'Kirjautuminen ei ole käytössä',
  accountUnavailableBody: 'Kirjautuminen toimii vain sovelluksen omassa osoitteessa, ei esikatselussa.',
  accountSignedInAs: (email: string | null) =>
    email === null ? 'Kirjautuneena Google-tilillä' : `Kirjautuneena: ${email}`,
  accountSignOut: 'Kirjaudu ulos',
  // Sync status in the account menu (T-054c). Working copy until UX and Sisällöntuottaja review it.
  accountSyncSyncing: 'Tallennetaan tilille…',
  accountSyncSaved: (time: string) => `Tallennettu tilille klo ${time}`,
  accountSyncWaiting: 'Muutokset tallennetaan tilille automaattisesti.',
  accountSyncOffline: 'Ei yhteyttä, muutokset tallessa tällä laitteella.',
  accountSyncError: 'Tilille tallennus ei onnistunut, muutokset ovat tallessa tällä laitteella.',
  accountSyncLocked: 'Tili on päivitetty uudempaan versioon. Lataa sivu uudelleen.',
  accountSyncNow: 'Synkronoi nyt',
  // Sign-out with unsynced changes and the notice after signing out (T-054c, D-017).
  accountSignOutWarnTitle: 'Kaikkia muutoksia ei ole tallennettu tilille',
  accountSignOutWarnBody:
    'Muutokset ovat tallessa tässä selaimessa ja siirtyvät tilille, kun kirjaudut samalla tilillä uudelleen.',
  accountSignOutAnyway: 'Kirjaudu silti ulos',
  accountSignedOutNotice:
    'Kirjauduit ulos. Tilisi tiedot jäävät tähän selaimeen. Jos käytät jaettua konetta, poista ne ennen kuin lähdet: kirjaudu sisään ja valitse "Poista tilin tiedot".',
  accountSignedOutDismiss: 'Sulje ilmoitus',
  // Deleting the account data (T-054d, D-017 K-P5).
  accountDelete: 'Poista tilin tiedot',
  accountDeleteTitle: 'Poistetaanko tilin tiedot?',
  accountDeleteBody:
    'Pakat ja kokoelma poistetaan tililtä ja tästä selaimesta, ja Google-tilillä kirjautuminen poistetaan tästä palvelusta. Poistoa ei voi perua. Selaimen kirjautumattoman tilan tiedot eivät poistu.',
  accountDeleteConfirm: 'Poista tiedot ja tili',
  accountDeleting: 'Poistetaan…',
  accountDeleteReauth: 'Siirrytään Googleen vahvistamaan kirjautuminen. Poisto valmistuu, kun palaat sivulle.',
  accountDeleteFailedCloud: 'Tietojen poisto ei onnistunut. Tarkista yhteys ja yritä uudelleen.',
  accountDeleteFailedAccount: 'Tiedot poistettiin, mutta tilin poisto ei onnistunut. Yritä uudelleen.',
  accountDeletedNotice: 'Tilin tiedot ja tili on poistettu.',
  // First sign-in with data on both sides (T-054c).
  accountChooseTitle: 'Tässä selaimessa ja tilillä on tietoja',
  accountChooseBody:
    'Voit yhdistää selaimen pakat ja kokoelman tilin tietoihin tai käyttää vain tilin tietoja. Selaimen tiedoista tehdään varmuuskopio, eikä mitään poisteta ennen kuin tallennus tilille on onnistunut.',
  accountChooseMerge: 'Yhdistä',
  accountChooseAccountOnly: 'Käytä vain tilin tietoja',
  /** Fixed messages by AuthErrorKind (SR-21 kohta 4). */
  accountErrors: {
    network: 'Kirjautuminen ei onnistunut, koska yhteyttä ei saatu. Yritä uudelleen.',
    'popup-blocked': 'Selain esti kirjautumisikkunan. Salli ponnahdusikkunat tälle sivulle ja yritä uudelleen.',
    unknown: 'Kirjautuminen ei onnistunut. Yritä uudelleen.',
  } satisfies Record<AuthErrorKind, string>,
  heading: 'Kortit',
  /** Live region text when the list is shown (UX.md 4.5). */
  loaded: (count: number) => `${cardCount(count)} ladattu.`,

  tableCaption: 'Kaikki kortit',
  tableCaptionFiltered: 'Hakua vastaavat kortit',
  // Card images: T-027 UX handover (PM accepted the dialog on 2026-10-02).
  columnImage: 'Kuva',
  enlargeImage: 'Suurenna kuva: ',
  closeDialog: 'Sulje',
  closeSymbol: '×',
  playsetFull: 'Pelisarja täynnä',
  imageLoadError: 'Kuvaa ei voitu ladata.',
  columnName: 'Nimi',
  // T-060: card order selector (session state only).
  sortLabel: 'Järjestys',
  sortOptions: { number: 'Numero', name: 'Nimi (A–Ö)', cost: 'Cost', power: 'Power', ram: 'RAM', type: 'Tyyppi', rarity: 'Rarity' },
  sortDirectionLabel: 'Suunta',
  sortAscending: 'Nouseva',
  sortDescending: 'Laskeva',
  columnTypeAndColor: 'Tyyppi ja väri',
  columnCost: 'Cost',
  missingValue: '–',
  noCost: 'ei hintaa',
  columnPower: 'Power',
  noPower: 'ei poweria',
  columnRam: 'RAM',
  noRam: 'ei RAMia',
  noColor: 'ei väriä',

  // Search and filters: UX.md luku 5 (PM accepted K6–K8 on 2026-10-01).
  filterFormLabel: 'Hae ja suodata kortteja',
  searchLabel: 'Hae nimellä',
  searchHint: 'Kortin nimi tai alaotsikko. Osa sanasta riittää.',
  filterHint: 'Valitse yksi tai useampi. Ilman valintaa näytetään kaikki.',
  typeLegend: 'Tyyppi',
  colorLegend: 'Väri',
  rarityLegend: 'Harvinaisuus',
  columnRarity: 'Rarity',
  noRarity: 'ei harvinaisuutta',
  filteredStatus: (shown: number, all: number) => cardShare(shown, all),
  filteredLive: (shown: number, all: number) => `Näytetään ${cardShare(shown, all)}.`,
  // TXT-009: a single card is "1 kortti", not "kaikki 1 korttia".
  allShownLive: (all: number) =>
    all === 1 ? `Näytetään ${cardCount(1)}.` : `Näytetään kaikki ${numberFormat.format(all)} korttia.`,
  noResultsLive: 'Hakua vastaavia kortteja ei löytynyt.',
  noResultsBody: 'Hakua vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista.',
  clearFilters: 'Tyhjennä haku ja suodattimet',
  // T-050a: filter side panel, active filter chips and the image size.
  filtersHeading: 'Suodattimet',
  filtersToggle: (selected: number) => (selected === 0 ? 'Suodattimet' : `Suodattimet (${selected})`),
  resultsHeading: 'Tulokset',
  activeFilters: 'Valitut suodattimet',
  removeFilter: (value: string) => `Poista suodatin: ${value}`,
  imageSizeLegend: 'Kuvakoko',
  imageSizeSmall: 'Pieni',
  imageSizeMedium: 'Normaali',
  imageSizeLarge: 'Iso',

  // Collection: UX.md luku 6 (T-012; PM accepted A1–A7 on 2026-10-01).
  columnOwned: 'Omistan',
  increaseOne: 'Lisää yksi kappale: ',
  decreaseOne: 'Vähennä yksi kappale: ',
  minusSymbol: '−',
  countPrefix: 'Kokoelmassa ',
  notOwned: 'Ei kokoelmassa',
  // Want list (T-064b)
  increaseWant: 'Lisää wantiin yksi kappale: ',
  decreaseWant: 'Vähennä wantista yksi kappale: ',
  wantPrefix: 'Wantissa ',
  notWanted: 'Ei wantissa',
  wantLive: (name: string, count: number) =>
    count === 0 ? `${name}: poistettu wantista.` : `${name}: ${copies(count)} wantissa.`,
  countLoading: 'ladataan',
  notEditable: 'ei muokattavissa',

  collectionLoading: 'Haetaan kokoelmaa…',
  collectionEmpty: 'Kokoelmassa ei ole vielä kortteja.',
  collectionSummary: (distinct: number, total: number) =>
    `Kokoelmassa ${distinctCards(distinct)}, yhteensä ${copies(total)}.`,

  addedLive: (name: string, count: number) => `${name} lisätty kokoelmaan: ${copies(count)}.`,
  countLive: (name: string, count: number) => `${name}: ${copies(count)} kokoelmassa.`,
  removedLive: (name: string) => `${name} poistettu kokoelmasta.`,
  maxReachedLive: (name: string) => `Enimmäismäärä 999 on täynnä: ${name}.`,
  externalChangeLive: 'Kokoelma päivittyi toisessa välilehdessä.',
  countNotChanged: 'Kortin määrä ei muuttunut.',

  // T-040: browsing and editing apart, list views.
  editSwitchLabel: 'Muokkaa kokoelmaa',
  viewLegend: 'Näkymä',
  viewGrid: 'Ruudukko',
  viewTable: 'Taulukko',
  columnCollection: 'Kokoelma',
  columnType: 'Tyyppi',
  tableRegionLabel: (caption: string) => `${caption}, taulukko`,

  collectionLegend: 'Kokoelma',
  collectionAll: 'Kaikki',
  collectionOwned: 'Omistetut',
  collectionMissing: 'Puuttuvat',
  ownedOnlyEmptyBody:
    'Kokoelmassa ei ole vielä kortteja. Valitse Kokoelma-ryhmästä "Kaikki" ja merkitse omistamasi kortit listasta.',
  showAllCards: 'Näytä kaikki kortit',

  browserOnly:
    'Kokoelma tallentuu vain tähän selaimeen tällä laitteella. Se ei siirry toiselle laitteelle eikä toiseen selaimeen.',
  requestPersistent: 'Pyydä pysyvää tallennusta',
  persistentHint:
    'Pysyvä tallennus pyytää selainta säilyttämään kokoelman, vaikka laitteen tallennustila vähenee. Selaimen tietojen tyhjennys poistaa kokoelman silti.',
  persistentGranted: 'Selain lupasi säilyttää kokoelmasi. Selaimen tietojen tyhjennys poistaa sen silti.',
  persistentDenied:
    'Selain ei antanut lupaa pysyvään tallennukseen. Kokoelma tallentuu silti, mutta selain voi poistaa sen, jos laitteen tila loppuu. Älä tyhjennä selaimen tietoja.',
  persistentAlready: 'Selain on luvannut säilyttää kokoelmasi. Selaimen tietojen tyhjennys poistaa sen silti.',

  closeNotice: 'Sulje',
  closeNoticeLabel: (title: string) => `Sulje ilmoitus: ${title}`,

  collectionUnavailableTitle: 'Kokoelmaa ei voitu lukea',
  collectionUnavailableBody:
    'Selain ei antanut lukea tallennettuja tietoja. Korttilista toimii, mutta omistettuja kortteja ei voi nyt merkitä. Voit yrittää uudelleen tai tarkistaa selaimen yksityisyysasetukset.',
  collectionUnavailableLive: 'Kokoelmaa ei voitu lukea.',
  reloadCollection: 'Lue kokoelma uudelleen',

  notPersistentTitle: 'Tietoja ei voi tallentaa',
  notPersistentBody:
    'Selain ei salli tietojen tallentamista tälle sivustolle. Voit merkitä kortteja, mutta merkinnät häviävät, kun suljet tai päivität sivun. Tarkista selaimen yksityisyysasetukset tai avaa sivu tavallisessa selausikkunassa.',
  notPersistentLive: 'Tietoja ei voi tallentaa.',

  resetTitle: 'Vanhat kokoelmatiedot eivät olleet luettavissa',
  resetBody:
    'Tallennetut kokoelmatiedot olivat vioittuneet, joten kokoelma aloitettiin tyhjänä. Vanhoista tiedoista on otettu kopio selaimeen, mutta sovellus ei vielä osaa palauttaa sitä.',
  resetLive: 'Vanhat kokoelmatiedot eivät olleet luettavissa.',

  resetNoBackupTitle: 'Vanhoja kokoelmatietoja ei voitu käsitellä',
  resetNoBackupBody:
    'Tallennetut kokoelmatiedot olivat vioittuneet, eikä niistä saatu kopiota. Vanhoja tietoja ei ole poistettu, joten uusia merkintöjä ei voi tallentaa, ennen kuin selain sallii tallennuksen. Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta ja päivitä sivu.',
  resetNoBackupLive: 'Vanhoja kokoelmatietoja ei voitu käsitellä.',

  repairedTitle: 'Osa kokoelman tiedoista oli vioittunut',
  repairedBody: (dropped: number) =>
    dropped === 1
      ? 'Yhtä merkintää ei voitu lukea, ja se jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.'
      : `${numberFormat.format(dropped)} merkintää ei voitu lukea, ja ne jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.`,
  repairedLive: 'Osa kokoelman tiedoista oli vioittunut.',

  newerVersionTitle: 'Kokoelma on tallennettu uudemmalla versiolla',
  newerVersionBody:
    'Selaimeen tallennetut tiedot ovat peräisin sovelluksen uudemmasta versiosta. Kokoelmaa ei näytetä eikä sitä voi muokata, jotta tiedot eivät vioitu. Päivitä sivu. Jos ilmoitus ei katoa, sulje kaikki tämän sivuston välilehdet ja avaa sivu uudelleen. Älä tyhjennä selaimen tietoja, koska kokoelma poistuisi.',
  newerVersionLive: 'Kokoelma on tallennettu uudemmalla versiolla.',

  saveFailedTitle: 'Muutosta ei voitu tallentaa',
  saveFailedQuotaBody:
    'Selaimen tallennustila on täynnä, joten kortin määrä ei muuttunut. Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta ja yritä uudelleen.',
  saveFailedUnavailableBody:
    'Selain esti tallennuksen, joten kortin määrä ei muuttunut. Yritä uudelleen. Jos ongelma jatkuu, tarkista selaimen yksityisyysasetukset.',
  saveFailedOtherBody: 'Jokin meni pieleen, ja kortin määrä ei muuttunut. Yritä uudelleen.',
  collectionFullTitle: 'Kokoelma on täynnä',
  collectionFullBody:
    `Kokoelmaan mahtuu enintään ${numberFormat.format(MAX_COLLECTION_ENTRIES)} eri korttia, joten uutta korttia ei voi lisätä. Voit poistaa kortteja, joita et enää tarvitse.`,

  // Have/Want section (T-065)
  haveWantHeading: 'Have/Want',
  haveWantIntro: 'Kokoa tähän kortit, joita haluat, ja katso, mitä sinulla on vaihdettavaksi. Jaa lista vaihtolinkkinä.',
  wantHeading: 'Want',
  wantIntro: 'Kortit, joita haluat. Muuta määrää plus- ja miinuspainikkeilla.',
  wantEmpty: 'Want-listalla ei ole vielä kortteja. Hae kortti nimellä alta ja lisää se.',
  wantLoading: 'Haetaan want-listaa…',
  wantUnavailable: 'Want-listaa ei voi tällä hetkellä käyttää. Lataa sivu uudelleen.',
  wantSearchHeading: 'Lisää kortteja wantiin',
  wantSearchLabel: 'Hae kortin nimellä',
  wantSearchPrompt: 'Kirjoita kortin nimi, niin ehdotukset näkyvät tässä.',
  wantSearchNone: 'Hakua vastaavia kortteja ei löytynyt.',
  wantSearchMore: (shown: number) => `Näytetään ${shown} ensimmäistä. Tarkenna hakua.`,
  wantAdd: 'Lisää wantiin',
  wantAddLabel: 'Lisää wantiin: ',
  wantInList: (count: number) => `wantissa ${count}`,
  haveHeading: 'Have',
  haveIntro: 'Kortit, joita sinulla on yli täyden pelisetin. Ne ovat vaihdettavissa. Määrää muutat Kortit-sivulla.',
  haveEmpty: 'Sinulla ei ole vielä vaihdettavia kortteja. Vaihdettavissa ovat kappaleet, jotka ylittävät täyden pelisetin (3 kappaletta, Legend-korteista 1).',
  haveLoading: 'Haetaan kokoelmaa…',
  haveUnavailable: 'Kokoelmaa ei voi tällä hetkellä lukea.',
  haveRow: (tradeable: number) => `vaihdettavissa ${tradeable}`,
  // Trade link (T-062, T-063)
  tradeShareButton: 'Jaa kokoelma ja want',
  tradeShareNote: 'Linkin saaja näkee koko kokoelmasi ja want-listasi.',
  tradeShareCopied: 'Vaihtolinkki kopioitu',
  tradeShareCopyFailed: 'Kopiointi ei onnistunut. Kopioi linkki tästä:',
  tradeShareLinkLabel: 'Vaihtolinkki',
  tradeShareTooBig: 'Kokoelma on liian suuri linkkiin',
  tradeInvalidHeading: 'Linkki ei toimi',
  tradeInvalid: 'Vaihtolinkki on rikkinäinen tai liian pitkä. Pyydä lähettäjää jakamaan se uudelleen.',
  tradeToCards: 'Siirry Kortit-sivulle',
  tradeHeading: 'Vaihtolinkki',
  tradeIntro: 'Tämä on toisen pelaajan kokoelma ja want-lista linkin luontihetkellä. Mitään ei tallenneta.',
  tradeDropped: (count: number) => `${count} riviä linkistä oli virheellisiä ja jätettiin pois.`,
  tradeUnknown: (count: number) =>
    `${count} korttia ei löydy sovelluksen korttitiedoista, joten niitä ei näytetä eikä vertailla.`,
  tradeCompareHeading: 'Vertailu omaan kokoelmaasi',
  tradeCompareUnavailable:
    'Oma kokoelmasi tai want-listasi ei ole käytettävissä, joten vertailua ei voi näyttää. Näet silti jakajan listat.',
  tradeCompareLoading: 'Ladataan omaa kokoelmaasi.',
  tradeCompareExplain:
    'Vaihdettavissa ovat vain kappaleet, jotka ylittävät täyden pelisetin (3 kappaletta, Legend-korteista 1).',
  tradeIGiveHeading: 'Sinulla on, he haluavat',
  tradeTheyGiveHeading: 'Heillä on, sinä haluat',
  tradeNothing: 'Ei osumia.',
  tradeTheirHaveHeading: 'Jakajan kokoelma',
  tradeTheirWantHeading: 'Jakajan want',
  tradeEmptyList: 'Lista on tyhjä.',
  tradeHaveRow: (owned: number, tradeable: number) =>
    `${copies(owned)}, vaihdettavissa: ${tradeable > 0 ? copies(tradeable) : 'ei yhtään'}`,
  tradeWantRow: (count: number) => `haluaa ${copies(count)}`,
  tradeCompareRow: (count: number) => copies(count),

  footerUnofficial:
    'Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.',
  footerSource: 'Korttitiedot: Netdeck.gg',
} as const;

/** Card colors in Finnish (UX.md 5.2, K6). Other API values are shown as such, in English. */
export const colorNames: ReadonlyMap<string, string> = new Map([
  ['Red', 'Red'],
  ['Yellow', 'Yellow'],
  ['Green', 'Green'],
  ['Blue', 'Blue'],
]);
