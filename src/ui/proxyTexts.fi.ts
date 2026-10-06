import { MAX_PROXY_CARDS } from '../domain/proxySheet';

/** Texts of the Proxy section and the buttons that send cards to its print queue (T-102). */
export const proxyTextsFi = {
  navProxy: 'Proxy',
  heading: 'Proxy-tulostus',
  intro:
    'Lisää kortit tulostusjonoon ja tulosta ne A4-arkeille oikeassa koossa: 63 × 88 mm, yhdeksän korttia arkilla. Jono säilyy tällä selaimella, kunnes tyhjennät sen.',
  disclaimer: 'Vain henkilökohtaiseen testikäyttöön, ei myyntiin eikä turnauksiin.',
  summary: (cards: number, sheets: number) =>
    `${cards === 1 ? '1 kortti' : `${cards} korttia`} · ${sheets === 1 ? '1 arkki' : `${sheets} arkkia`}`,
  jumpToQueue: 'Siirry jonoon',
  jumpToAdd: 'Lisää kortteja',

  queueHeading: 'Tulostusjono',
  queueLoading: 'Ladataan jonoa…',
  queueUnavailable: 'Jonoa ei voitu lukea. Lataa sivu uudelleen. Jos ongelma jatkuu, tarkista selaimen yksityisyysasetukset.',
  queueEmpty:
    'Jono on tyhjä. Hae kortteja alta ja lisää ne plus-painikkeella, tai lähetä kortteja Have/Want-näkymän want-listalta tai Pakoista.',
  queueListLabel: 'Jonossa olevat kortit',
  queueFull: `Jono on täynnä: siihen mahtuu enintään ${MAX_PROXY_CARDS} korttia.`,
  queueFullLive: `Jono on täynnä, enintään ${MAX_PROXY_CARDS} korttia.`,
  clearQueue: 'Tyhjennä jono',
  queueCleared: 'Jono tyhjennettiin.',
  queuedLive: (name: string, count: number) => `${name}: ${count} jonossa`,

  addHeading: 'Lisää kortteja jonoon',
  addIntro: 'Hae ja suodata kuten Kortit-osiossa. Plus-painike lisää kortin jonoon; kortin eri kuvitukset ovat omina ruutuinaan.',
  filtersHeading: 'Haku ja suodattimet',
  resultsHeading: 'Hakutulokset',
  resultsCaption: 'Lisättävät kortit',
  queueCaption: 'Tulostusjonon kortit',
  noResults: 'Hakua vastaavia kortteja ei löytynyt.',
  clearFilters: 'Tyhjennä haku ja suodattimet',

  /** CountControl texts of the queue. */
  increaseOne: 'Lisää jonoon yksi kappale: ',
  decreaseOne: 'Poista jonosta yksi kappale: ',
  countPrefix: 'Jonossa ',
  notQueued: 'Ei jonossa',

  settingsHeading: 'Tulostusasetukset',
  gapLegend: 'Rako korttien välissä',
  gapOption: (mm: number) => `${mm} mm`,
  cutMarks: 'Leikkausmerkit arkin reunoilla',
  proxyMark: 'Pieni PROXY-merkintä korttien alareunaan',
  calibration: 'Tulosta ensin kalibrointiarkki',
  calibrationHint: 'Yksi lisäarkki, jolla tarkistat, että tulostin ei skaalaa kokoa.',

  previewHeading: 'Esikatselu',
  previewHint: 'Arkit näkyvät pienennettyinä. Tulosteessa mitat ovat tarkat millimetrit.',
  sheetLabel: (n: number, total: number) => `Arkki ${n}/${total}`,
  calibrationSheetLabel: 'Kalibrointiarkki',
  printButton: 'Tulosta',
  preparing: 'Valmistellaan tulostusta…',
  printHint:
    'Valitse selaimen tulostusikkunassa paperiksi A4 ja skaalaukseksi 100 % (todellinen koko), älä "Sovita sivulle". Poista otsikot ja alatunnisteet, jos selain tarjoaa niitä.',
  printNothing: 'Lisää ensin kortteja jonoon.',

  calibrationTitle: 'Kalibrointiarkki',
  calibrationBody:
    'Mittaa tulosteesta: kehyksen tulee olla 63 × 88 mm ja viivaimen 100 mm. Jos mitat eivät täsmää, tulostin tai selain skaalaa. Tarkista silloin, että skaalaus on 100 %.',
  calibrationFrame: '63 × 88 mm',
  calibrationRuler: '100 mm',
  calibrationFooter: 'Cyberdeck TCG · kalibrointiarkki',
  imageMissing: 'Kuva puuttuu',

  clearTitle: 'Tyhjennetäänkö jono?',
  clearBody: (cards: number) => `Tulostus on valmis. Jonossa on ${cards === 1 ? '1 kortti' : `${cards} korttia`}. Tyhjennetäänkö jono nyt?`,
  clearManualBody: (cards: number) => `Jonossa on ${cards === 1 ? '1 kortti' : `${cards} korttia`}. Poistetaanko ne jonosta?`,
  clearConfirm: 'Tyhjennä jono',
  clearKeep: 'Säilytä jono',

  sendAllWants: 'Lähetä kaikki want-kortit proxy-jonoon',
  sendWant: 'Proxy-jonoon',
  sendWantName: (name: string) => `Lähetä proxy-jonoon: ${name}`,
  sendDeck: 'Lähetä pakka proxy-jonoon',
  sendMissing: 'Lähetä puuttuvat proxy-jonoon',
  sentResult: (added: number) => (added === 1 ? 'Jonoon lisättiin 1 kortti.' : `Jonoon lisättiin ${added} korttia.`),
  sentPartial: (added: number, skipped: number) =>
    `Jonoon lisättiin ${added} ${added === 1 ? 'kortti' : 'korttia'}. ${skipped} jäi pois, koska jono on täynnä (enintään ${MAX_PROXY_CARDS}).`,
  sentNothing: 'Ei lisättävää.',
  sentFull: `Jono on täynnä (enintään ${MAX_PROXY_CARDS} korttia), mitään ei lisätty.`,
  openProxy: 'Avaa Proxy-osio',
};
