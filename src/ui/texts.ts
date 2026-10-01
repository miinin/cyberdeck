// User-facing texts. Source: docs/UX.md luku 4.5 (UX Designer). The footer is based on
// UX.md 4.3 and SECURITY.md luku 7. Reviewed in docs/reports/TXT-001-t001-tarkastus.md.

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
  emptyBody:
    'Kortteja ei löytynyt. Korttitietojen lähde ei juuri nyt palauttanut yhtään korttia. Yritä hetken päästä uudelleen.',
  emptyLive: 'Kortteja ei löytynyt.',

  errorTitle: 'Korttien haku epäonnistui',
  errorBody: 'Korttitietoja ei saatu juuri nyt haettua. Tarkista verkkoyhteys ja yritä uudelleen.',
  errorLive: 'Korttien haku epäonnistui.',

  partialStatus: (received: number, total: number) =>
    `${numberFormat.format(received)} / ${numberFormat.format(total)} korttia`,
  partialTitle: 'Kaikkia kortteja ei saatu näkyviin',
  partialBody:
    'Osa korteista puuttuu listasta, koska niiden tietoja ei saatu tai ne olivat puutteellisia. Voit yrittää hakea kortit uudelleen.',
  partialLive: (received: number, total: number) =>
    `Näytetään ${numberFormat.format(received)} / ${numberFormat.format(total)} korttia. Osa korteista puuttuu listasta.`,

  tableCaption: 'Kaikki kortit',
  columnName: 'Nimi',
  columnType: 'Tyyppi',
  columnCost: 'Hinta',
  missingValue: '–',
  noCost: 'ei hintaa',

  footerUnofficial:
    'Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.',
  footerSource: 'Korttitiedot: Netdeck.gg',
} as const;
