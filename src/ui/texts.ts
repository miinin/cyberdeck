// User-facing texts. Source: docs/UX.md luvut 4.5 and 5 (UX Designer). The footer is based on
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

const loaded = (count: number) => `${cardCount(count)} ladattu.`;
const partialMissing = 'Osa korteista puuttuu listasta.';

export const texts = {
  appName: 'Cyberdeck',
  heading: 'Kortit',
  retry: 'Yritä uudelleen',

  loading: 'Haetaan kortteja…',

  loaded,

  emptyStatus: cardCount(0),
  emptyBody:
    'Kortteja ei löytynyt. Korttitietojen lähde ei juuri nyt palauttanut yhtään korttia. Yritä hetken päästä uudelleen.',
  emptyLive: 'Kortteja ei löytynyt.',

  errorTitle: 'Korttien haku epäonnistui',
  errorBody: 'Korttitietoja ei saatu juuri nyt haettua. Tarkista verkkoyhteys ja yritä uudelleen.',
  errorLive: 'Korttien haku epäonnistui.',

  partialStatus: (received: number, total: number) => cardShare(received, total),
  partialTitle: 'Kaikkia kortteja ei saatu näkyviin',
  partialBody:
    'Osa korteista puuttuu listasta, koska niiden tietoja ei saatu tai ne olivat puutteellisia. Voit yrittää hakea kortit uudelleen.',
  partialLive: (received: number, total: number) => `Näytetään ${cardShare(received, total)}. ${partialMissing}`,

  tableCaption: 'Kaikki kortit',
  tableCaptionFiltered: 'Hakua vastaavat kortit',
  columnName: 'Nimi',
  columnTypeAndColor: 'Tyyppi ja väri',
  columnCost: 'Hinta',
  missingValue: '–',
  noCost: 'ei hintaa',
  noColor: 'ei väriä',

  // Search and filters: UX.md luku 5 (PM accepted K6–K8 on 2026-10-01).
  filterFormLabel: 'Hae ja suodata kortteja',
  searchLabel: 'Hae nimellä',
  searchHint: 'Kortin nimi tai alaotsikko. Osa sanasta riittää.',
  filterHint: 'Valitse yksi tai useampi. Ilman valintaa näytetään kaikki.',
  typeLegend: 'Tyyppi',
  colorLegend: 'Väri',
  filteredStatus: (shown: number, all: number) => cardShare(shown, all),
  filteredLive: (shown: number, all: number) => `Näytetään ${cardShare(shown, all)}.`,
  // TXT-009: a single card is "1 kortti", not "kaikki 1 korttia".
  allShownLive: (all: number) =>
    all === 1 ? `Näytetään ${cardCount(1)}.` : `Näytetään kaikki ${numberFormat.format(all)} korttia.`,
  noResultsLive: 'Hakua vastaavia kortteja ei löytynyt.',
  noResultsBody: 'Hakua vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista.',
  /** Loaded message when a search or selection was kept over a retry (UX.md 5.6, K9, UX-002). */
  loadedFilteredLive: (all: number, filterResult: string) => `${loaded(all)} ${filterResult}`,
  partialFilteredLive: (filterResult: string) => `${filterResult} ${partialMissing}`,
  clearFilters: 'Tyhjennä haku ja suodattimet',

  footerUnofficial:
    'Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.',
  footerSource: 'Korttitiedot: Netdeck.gg',
} as const;

/** Card colors in Finnish (UX.md 5.2, K6). Other API values are shown as such, in English. */
export const colorNames: ReadonlyMap<string, string> = new Map([
  ['Red', 'Punainen'],
  ['Yellow', 'Keltainen'],
  ['Green', 'Vihreä'],
  ['Blue', 'Sininen'],
]);
