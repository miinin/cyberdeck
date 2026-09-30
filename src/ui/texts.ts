// User-facing texts. Source: docs/UX.md luku 4.5 (UX Designer). The footer draft is based on
// UX.md 4.3 and SECURITY.md luku 7; the Content Producer reviews it later.

const numberFormat = new Intl.NumberFormat('fi-FI');

/** "1 kortti", "2 korttia", "1 024 korttia" */
export function cardCount(count: number): string {
  return `${numberFormat.format(count)} ${count === 1 ? 'kortti' : 'korttia'}`;
}

export const texts = {
  appName: 'Cyberdeck',
  heading: 'Kortit',
  retry: 'Yritä uudelleen',

  loading: 'Haetaan kortteja…',

  loaded: (count: number) => `${cardCount(count)} ladattu.`,

  emptyStatus: cardCount(0),
  emptyBody: 'Kortteja ei löytynyt. Korttitietokanta on juuri nyt tyhjä. Yritä myöhemmin uudelleen.',
  emptyLive: 'Kortteja ei löytynyt.',

  errorTitle: 'Korttien haku epäonnistui',
  errorBody: 'Korttitietoja ei saatu juuri nyt haettua. Tarkista verkkoyhteys ja yritä uudelleen.',
  errorLive: 'Korttien haku epäonnistui.',

  partialStatus: (received: number, total: number) =>
    `${numberFormat.format(received)} / ${numberFormat.format(total)} korttia`,
  partialTitle: 'Kaikkia kortteja ei saatu',
  partialBody: 'Osa korttitiedoista jäi hakematta. Lista on puutteellinen. Yritä uudelleen hakeaksesi kaikki kortit.',
  partialLive: (received: number, total: number) =>
    `Näytetään ${numberFormat.format(received)} / ${numberFormat.format(total)} korttia. Osa korttitiedoista jäi hakematta.`,

  tableCaption: 'Kaikki kortit',
  columnName: 'Nimi',
  columnType: 'Tyyppi',
  columnCost: 'Hinta',
  missingValue: '–',
  noCost: 'ei hintaa',

  footerUnofficial:
    'Epävirallinen fanityökalu. Ei WeirdCon, Netdeck.gg:n eikä CD PROJEKT REDin hyväksymä tai tukema.',
  footerSource: 'Korttitiedot: Netdeck.gg',
} as const;
