# ARCHITECTURE · cyberdeck

> Omistaja: Arkkitehti. Koodari päivittää toteutuksen yksityiskohdat (osio "Toteutuksen yksityiskohdat").
> Päivitetty 2026-10-01 (Arkkitehti, T-001:n katselmointi ARCH-001: poikkeamat hyväksytty ja kirjattu lukuihin 3, 5, 7 ja 9). Teknologiapäätös: D-005 (tila: Voimassa).

## 1. Yleiskuva

Cyberdeck on selaimessa toimiva yhden sivun sovellus (SPA). MVP-0:ssa ja MVP-1:ssä ei ole omaa palvelinta eikä tietokantaa. Selain hakee korttidatan suoraan Netdeck.gg:n julkisesta rajapinnasta. Firebase Hosting jakaa vain staattiset tiedostot.

```
┌──────────── Selain ─────────────────────────────────────────┐
│                                                              │
│  ui/  (React-komponentit, tilat: lataus/virhe/tyhjä/valmis)  │
│    │  kutsuu vain api/index.ts:n julkista rajapintaa          │
│    ▼                                                         │
│  api/ (rajapintakerros: HTTP, sivutus, aikakatkaisu,         │
│    │   raakadatan validointi → sisäinen Card-malli)          │
│    │                                                         │
│  domain/ (sisäinen korttimalli, ei riippuvuuksia)            │
│                                                              │
└────┼─────────────────────────────────────────────────────────┘
     │ HTTPS GET (CORS, ei evästeitä, ei avainta)
     ▼
  api.netdeck.gg/api/cards/cyberpunk      Firebase Hosting (dist/)
                                           cyberdeck-tcg(-test).web.app
```

**Riippuvuuksien suunta:** `ui → api → domain` ja `ui → domain`. `domain` ei tuo mitään. `api` ei tuo Reactia. Vain `api/` tuntee Netdeck.gg:n URL:n ja raakadatan muodon (PROJECT.md:n riski "rajapinta muuttuu tai sulkeutuu"). Jos rajapinta vaihtuu, muutetaan vain `api/`.

## 2. Teknologiat (D-005)

| Osa | Valinta | Huom. |
|---|---|---|
| Kieli | TypeScript 6.0 (strict) | TS 7 ei vielä käy typescript-eslintin kanssa |
| Käyttöliittymä | React 19 | |
| Build ja kehityspalvelin | Vite 8 | tuottaa `dist/`:n, jonka workflowt julkaisevat |
| Testit | Vitest 5 + jsdom 29 + Testing Library | ei oikeita verkkokutsuja (luku 7) |
| Lint | ESLint 10 (flat config) + typescript-eslint + react-hooks | |
| Hosting | Firebase Hosting, staattinen, Spark | `firebase.json`: `public: dist`, SPA-rewrite `index.html`:ään |
| Node | 22 (workflowt), `engines: >=22.13.0` | |

## 3. Hakemistorakenne

```
/
├── index.html                 Vite-sisääntulo, <html lang="fi">, <title>
├── package.json               skriptit ja tarkasti lukitut versiot (ei ^ eikä ~)
├── package-lock.json          commitoidaan (workflowt ajavat npm ci)
├── .npmrc                     save-exact=true
├── tsconfig.json              yksi konfiguraatio: src/ + vite.config.ts
├── vite.config.ts             Vite + Vitest-asetukset (test.environment = jsdom)
├── eslint.config.js           flat config, kerrosrajan valvonta (luku 4)
├── firebase.json              hosting (prod, test) + CSP ja turvallisuusotsakkeet (SR-2, SR-3)
└── src/
    ├── main.tsx               createRoot + <App /> (StrictMode)
    ├── App.tsx                ylin komponentti: useCardCatalog → CatalogView
    ├── styles.css             UX.md:n tokenit (UX Designer määrittää)
    ├── domain/
    │   └── card.ts            Card-tyyppi (sisäinen malli)
    ├── api/
    │   ├── index.ts           JULKINEN rajapinta: fetchAllCards, CardApiError, tyypit
    │   ├── netdeckClient.ts   HTTP, sivutus, aikakatkaisu, virheiden luokittelu
    │   ├── netdeckTypes.ts    Netdeck.gg:n raakamuodon tyypit: NetdeckPage, NetdeckCardFields (vain api/:n sisällä)
    │   ├── mapCard.ts         raaka kortti (unknown) → Card | null
    │   ├── errors.ts          CardApiError ja virhetyypit
    │   ├── netdeckClient.test.ts
    │   ├── mapCard.test.ts
    │   └── __fixtures__/
    │       └── netdeckPages.ts   pienet käsin tehdyt sivut testeihin
    ├── ui/
    │   ├── useCardCatalog.ts  hook: lataa kortit, tila discriminated unionina, retry
    │   ├── CatalogView.tsx    tilojen valinta: lataus / virhe / tyhjä / lista
    │   ├── CardList.tsx       esittävä komponentti: nimi, tyyppi, kustannus
    │   ├── texts.ts           käyttöliittymätekstit (UX ja Sisällöntuottaja)
    │   ├── CatalogView.test.tsx
    │   └── useCardCatalog.test.tsx
    ├── App.test.tsx
    └── test/
        └── setup.ts           jest-dom-matcherit + oikean verkon esto
```

Testit ovat testattavan tiedoston vieressä (`*.test.ts(x)`). Ei `components/`-, `services/`- tai `utils/`-yleishakemistoja ennen kuin niille on tarve.

## 4. Kerrosraja ja sen valvonta

- `src/ui/**`, `src/domain/**` ja `src/App.tsx` saavat tuoda rajapintakerroksesta vain `api/index.ts`:n (`import { fetchAllCards } from '../api'`).
- Valvotaan ESLintillä, ettei rajasta tarvitse muistaa: `no-restricted-imports` `src/ui/**`-, `src/domain/**`- ja `src/App.tsx`-tiedostoille, kielletyt mallit `**/api/netdeck*`, `**/api/mapCard*` ja `**/api/errors*` (käytä `../api`). `src/domain/**`:lle lisäksi `react` ja `**/api` (domain ei riipu mistään).

## 5. Rajapintakerros (`src/api/`)

### 5.1 Netdeck.gg-rajapinta (todennettu 2026-09-30)

- `GET https://api.netdeck.gg/api/cards/cyberpunk?limit=<n>&offset=<n>`
- Vastaus: `{ items: NetdeckCard[], total: number, limit: number, offset: number }`
- Oletus `limit` 60. Rajapinta rajaa isomman arvon 100:aan. `limit=0` palauttaa `total: 0`, ja negatiivinen `offset` antaa HTTP 500 -virheen. Käytetään aina `limit=60` ja `offset ≥ 0`.
- 151 korttia 2026-09-30 → 3 sivua (60 + 60 + 31). Sivun koko on noin 465 kt pakkaamattomana (vastaus ei ole gzip-pakattu, koska `printings` ja allekirjoitetut kuva-URL:t kasvattavat sitä), ja yksi pyyntö kestää noin 2 s.
- `Cache-Control: private, no-store`. CORS sallii pyytävän originin ja vastaa `Access-Control-Allow-Credentials: true`. Evästeitä ei kuitenkaan lähetetä (`credentials: 'omit'`).
- Kentät, joita malli käyttää: `id` (UUID, yksilöllinen), `slug` (yksilöllinen, esim. `v-streetkid`), `name` (ei yksilöllinen: 131 eri nimeä 151 kortilla), `subname` (null 87 kortilla), `canonical_name` (yksilöllinen, "V — Streetkid"), `card_type` (Legend/Unit/Gear/Program), `color`, `cost` (number tai **null**).
- Hintaa (rahassa) rajapinnassa ei ole. T-001:n "hinta" tulkitaan pelin kustannukseksi (`cost`). Katso avoin kysymys K1.

### 5.2 Julkinen rajapinta (`api/index.ts`)

```ts
export { fetchAllCards } from './netdeckClient';
export { CardApiError } from './errors';
export type { CardApiErrorKind } from './errors';
export type { CardCatalog, FetchAllCardsOptions } from './netdeckClient';
```

```ts
// netdeckClient.ts
export const NETDECK_CARDS_URL = 'https://api.netdeck.gg/api/cards/cyberpunk';
export const PAGE_SIZE = 60;
export const DEFAULT_TIMEOUT_MS = 15_000;
export const MAX_PAGES = 20;            // suojaa loputtomalta silmukalta (= 1200 korttia, katso 5.3)
export const MAX_CONCURRENT_REQUESTS = 3; // rinnakkaisia sivupyyntöjä enintään (SR-5, ARCH-001)

export interface CardCatalog {
  cards: Card[];          // rajapinnan järjestyksessä, duplikaatit (sama id) poistettu
  reportedTotal: number;  // rajapinnan total-kenttä ensimmäiseltä sivulta
  skipped: number;        // raakakortit, joita mapCard ei hyväksynyt
}

export interface FetchAllCardsOptions {
  fetchFn?: typeof fetch;   // oletus globalThis.fetch; testit antavat väärennöksen
  signal?: AbortSignal;     // kutsujan peruutus (komponentin purku)
  timeoutMs?: number;       // aikakatkaisu per pyyntö, oletus DEFAULT_TIMEOUT_MS
}

export async function fetchAllCards(options?: FetchAllCardsOptions): Promise<CardCatalog>;

// sisäinen, testataan fetchAllCardsin kautta
async function fetchPage(offset: number, opts: Required<Pick<FetchAllCardsOptions,'fetchFn'|'timeoutMs'>> & { signal?: AbortSignal }): Promise<NetdeckPage>;
function parsePage(json: unknown): NetdeckPage;  // heittää CardApiError('invalid-response')
```

### 5.3 Sivutusalgoritmi

1. Hae sivu `offset=0, limit=PAGE_SIZE`. Lue `total` ja palautettu `limit`.
2. Jos `total <= items.length`, valmis. Muuten laske loput offsetit: `limit, 2*limit, …` niin kauan kuin `offset < total`. Käytä palautettua `limit`-arvoa, ei omaa oletusta (jos rajapinta pienentää sivukokoa, kortteja ei jää väliin). Jos `limit <= 0` tai sivuja tulisi yli `MAX_PAGES`, heitä `invalid-response`.
3. ~~Hae loput sivut rinnakkain (`Promise.all`).~~ → tarkennettu katselmoinnissa ARCH-001: hae loput sivut rinnakkain, mutta **enintään `MAX_CONCURRENT_REQUESTS = 3` pyyntöä kerrallaan** (työjono, jossa on `min(3, sivujen määrä)` työntekijää). Nopeuttaa latausta, koska yksi sivu kestää noin 2 s, ja pitää kuorman Netdeck.gg:lle maltillisena, vaikka `total` kasvaisi tai olisi virheellinen (SR-5, D-006). Nykyisellä 151 kortilla loppuja sivuja on 2, joten raja ei hidasta latausta. Yksikin epäonnistunut sivu = koko lataus epäonnistuu (ei osittaista listaa MVP-0:ssa), eikä uusia pyyntöjä aloiteta sen jälkeen. Myös tyhjä sivu lopettaa uusien pyyntöjen aloittamisen (SR-5). Jo lähteneet pyynnöt (enintään 2) valmistuvat taustalla, ja niiden tulos hylätään. Niiden peruutus on velkatehtävä T-006.
   - `MAX_PAGES` on kova katto: jos `total` vaatisi yli 20 sivua (yli 1200 korttia sivukoolla 60), koko lataus epäonnistuu `invalid-response`-virheeseen. Raja on noin 8-kertainen nykyiseen korttimäärään nähden. Se tarkistetaan viimeistään välimuistin ADR:ssä (T-003) tai kun korttimäärä ylittää 600.
4. Yhdistä sivujen `items` järjestyksessä, muunna `mapCard`-funktiolla, poista duplikaatit `id`:n perusteella ja laske hylätyt `skipped`-kenttään.
5. Palauta `{ cards, reportedTotal: total, skipped }`. Kun data on eheää, `cards.length === reportedTotal` (hyväksymiskriteeri). Jos ne poikkeavat, kirjaa `console.warn` luvuilla (ei muuta dataa) ja näytä kortit silti.

### 5.4 Pyynnön asetukset

- `fetchFn(url, { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', referrerPolicy: 'no-referrer', signal })` (SR-4)
- Vastauksen `offset` on oltava sama kuin pyydetty, muuten `invalid-response` (SR-5).
- ~~`signal = AbortSignal.any([AbortSignal.timeout(timeoutMs), options.signal].filter(Boolean))`~~ → korvattu katselmoinnissa ARCH-001: jokaisella pyynnöllä on oma `AbortController`. `setTimeout(timeoutMs)` asettaa `timedOut`-lipun ja peruuttaa ohjaimen. Kutsujan `signal`in `abort`-tapahtuma peruuttaa saman ohjaimen. `finally`-lohko tyhjentää ajastimen ja poistaa kuuntelijan. Aikakatkaisu kattaa myös vastauksen rungon lukemisen (`response.json()`).
  - Perustelu: `AbortSignal.any` on Safarissa vasta versiosta 17.4 ja Firefoxissa versiosta 124, mutta Vite 8:n oletuskohde (`build.target`, baseline-widely-available) on `chrome111`, `edge111`, `firefox114`, `safari16.4`, `ios16.4` (tarkistettu `node_modules/vite`:sta 2026-10-01). Vite ei lisää polyfillejä, joten `AbortSignal.any` kaatuisi osassa kohdeselaimia. Oma `timedOut`-lippu erottaa aikakatkaisun kutsujan peruutuksesta luotettavammin kuin virheen nimi (`TimeoutError` tai `AbortError`), joka vaihtelee selaimittain ja testiympäristöissä.
  - Sääntö jatkoon: selaimen API:t valitaan Viten oletuskohteen mukaan. Uudempaa API:a käytetään vain ominaisuustunnistuksen ja varapolun kanssa, tai kohteen nostosta tehdään päätös.
- URL rakennetaan `new URL(NETDECK_CARDS_URL)` + `searchParams.set(...)`. Merkkijonoja ei liimata yhteen.

### 5.5 Virheenkäsittely

```ts
// errors.ts
export type CardApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid-response';

export class CardApiError extends Error {
  readonly kind: CardApiErrorKind;
  readonly status?: number;       // vain kind === 'http'
  constructor(kind: CardApiErrorKind, message: string, options?: { status?: number; cause?: unknown });
}
```

| Tilanne | Tunnistus | Tulos |
|---|---|---|
| Ei yhteyttä, DNS, CORS-esto | `fetch` heittää `TypeError` | `CardApiError('network')` |
| Aikakatkaisu | oma `timedOut`-lippu (5.4), ei virheen nimeä | `CardApiError('timeout')` |
| Kutsuja peruutti (`options.signal`) | `options.signal.aborted` | heitetään alkuperäinen virhe **sellaisenaan**. Hook ohittaa sen, eikä käyttäjälle näytetä virhettä. |
| HTTP ei 2xx | `!response.ok` | `CardApiError('http', …, { status })` |
| JSON ei jäsenny tai muoto väärä (`items` ei taulukko, `total`/`limit` ei ei-negatiivinen kokonaisluku) | `parsePage` | `CardApiError('invalid-response')` |
| Yksittäinen kortti puutteellinen | `mapCard` palauttaa `null` | kortti jätetään pois, `skipped += 1` |

- Tekninen viesti (`message`, `status`, `cause`) on vain kehittäjälle: `console.error` hookissa. Käyttäjälle näytetään UX:n ja Sisällöntuottajan teksti `kind`-arvon mukaan (`ui/texts.ts`), ei koskaan `error.message`-kenttää, stack tracea eikä URL:ia.
- Automaattista uudelleenyritystä ei ole. Käyttäjällä on "Yritä uudelleen" -toiminto (UX määrittää).

### 5.6 Raakadatan muunnos (`mapCard.ts`)

```ts
export function mapCard(raw: unknown): Card | null;
```

- Hyväksyy vain objektin, jossa `id`, `slug`, `name` ja `card_type` ovat ei-tyhjiä merkkijonoja. Muuten palauttaa `null`.
- `canonical_name` puuttuu → `displayName` = `name` + (`subname` ? ` — ${subname}` : '').
- `cost`: `number` (äärellinen) → luku, muuten `null`. `subname` ja `color`: ei-tyhjä merkkijono → arvo, muuten `null`.
- Tuntemattomat kentät ohitetaan. **`image_url`, `printings` ja sääntötekstit eivät siirry malliin** (kuvien käyttöoikeus selvittämättä, allekirjoitetut URL:t vanhenevat, eikä MVP-0 tarvitse niitä).
- Ei `any`-tyyppiä: raakadata käsitellään `unknown`-tyyppinä pienillä tyyppivahdeilla (`isRecord`, `nonEmptyString`). Ei validointikirjastoa (zod tms.), koska kenttiä on vähän eikä uutta riippuvuutta tarvita.

## 6. Sisäinen korttimalli (`src/domain/card.ts`)

```ts
/** Sovelluksen oma korttimalli. Ei riipu Netdeck.gg:n kenttänimistä. */
export interface Card {
  id: string;            // lähteen yksilöivä tunniste (Netdeck UUID)
  slug: string;          // luettava, yksilöllinen avain, esim. "v-streetkid"
  name: string;          // "V"
  subname: string | null;// "Streetkid"
  displayName: string;   // "V — Streetkid" (yksilöllinen, näytetään listassa)
  type: string;          // "Legend" | "Unit" | "Gear" | "Program" (merkkijono: uusi tyyppi ei riko sovellusta)
  color: string | null;  // "Red" | "Yellow" | "Green" | "Blue"
  cost: number | null;   // pelin kustannus, null jos kortilla ei ole
}
```

**Miksi juuri nämä:** MVP-0 näyttää nimen, tyypin ja kustannuksen. `slug` ja `displayName` ovat mukana, koska ne ovat yksilöllisiä ja nimi ei ole (sama nimi, eri alaotsikko). MVP-1:n kokoelma ja pakat tarvitsevat pysyvän viitteen korttiin, ja pakkalistan tuonti tunnistaa kortit nimen ja alaotsikon perusteella. `color` on mukana, koska se on halpa ja todennäköisesti MVP-1:n suodatuksessa. Muita kenttiä ei lisätä ennen kuin tehtävä tarvitsee niitä. Kenttien lisääminen on turvallista, koska malli ei ole vielä pysyvästi tallennettu.

**MVP-1:tä varten (ei toteuteta T-001:ssä):**
- Kokoelma ja pakat tallennetaan kortin viitteenä, ei kopiona kortin tiedoista. Alustava suositus on käyttää viitteenä `slug`-kenttää (luettava ja rakennettavissa uudelleen nimestä, jos lähde vaihtuu) eikä Netdeckin UUID:tä. Päätös tehdään ADR:nä MVP-1:n tallennustehtävässä.
- Keräilynumerot (`printings[].collector_number`, esim. `005a`, `β005a`) lisätään malliin vasta, kun pakkalistan tuonti tarvitsee niitä ja oikea vientiesimerkki on saatu (TUTKIMUS.md). Rajapinnan numerot eivät suoraan vastaa Cyberdeck Toolsin muotoa `A027`.
- Tallennus on todennäköisesti selaimen `localStorage` omassa `src/storage/`-moduulissaan ennen MVP-2:n kirjautumista.

## 7. Käyttöliittymäkerros (`src/ui/`)

```ts
// useCardCatalog.ts
export type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; kind: CardApiErrorKind }
  | { status: 'ready'; catalog: CardCatalog };   // tyhjä tila = ready ja cards.length === 0

export function useCardCatalog(load?: (signal: AbortSignal) => Promise<CardCatalog>): {
  state: CatalogState;
  retry: () => void;
};
// oletus load = (signal) => fetchAllCards({ signal })
// useEffect + AbortController: purku peruuttaa pyynnön (StrictMode ajaa efektin kahdesti kehitystilassa)
// Sopimus (ARCH-001): `load` on vakaa viite (moduulitason funktio, useCallback tai propsi, joka ei vaihdu
// renderöinnissä). Joka renderöinnillä uusi funktio käynnistäisi latauksen joka kerta uudelleen.
// AbortError ohitetaan. Muu kuin CardApiError → kind 'network' + console.error.

// CatalogView.tsx
export function CatalogView(props: { state: CatalogState; onRetry: () => void }): JSX.Element;

// CardList.tsx
export function CardList(props: { cards: Card[] }): JSX.Element;

// App.tsx
export function App(props: { loadCatalog?: (signal: AbortSignal) => Promise<CardCatalog> }): JSX.Element;
```

- Näkymän rakenne, tekstit, saavutettavuus (otsikot, `aria-live` lataukselle ja virheelle, taulukko vai lista) ja tyylit tulevat UX Designerin määrittelystä T-001-korttiin. Tämä dokumentti määrittää vain tilat ja rajapinnat.
- Kortit näytetään rajapinnan järjestyksessä, ellei UX määritä muuta. 151 riviä renderöidään suoraan ilman virtualisointia.
- Tilanhallintakirjastoa tai reititintä ei käytetä MVP-0:ssa.

## 8. Testaus ilman oikeaa rajapintaa

- **Rajapintakerros:** `fetchAllCards({ fetchFn })` saa väärennetyn `fetch`-funktion (`vi.fn`), joka palauttaa `new Response(JSON.stringify(page), { status })` offsetin mukaan. Fixtuurit (`__fixtures__/netdeckPages.ts`) ovat pieniä ja käsin tehtyjä: esim. `total: 5`, `limit: 2` → 3 sivua. Yhdessä kortissa on oikean rajapinnan kenttämuoto (lyhennettynä, ilman allekirjoitettua kuva-URL:ia).
- **Pakolliset rajapintakerroksen testit:** kaikki sivut haetaan ja `cards.length === reportedTotal`; oikeat offsetit (`0, 2, 4`) ja `limit=60` URL:ssa oletuksena; palautetun `limit`-arvon käyttö; yksi sivu (`total <= limit`) → yksi kutsu; `total: 0` → tyhjä lista; duplikaatti-id poistetaan; HTTP 500 → `kind 'http'`, `status 500`; `fetch` heittää `TypeError` → `'network'`; aikakatkaisu → `'timeout'` (väärennös, joka kunnioittaa signaalia, ja lyhyt `timeoutMs`); kutsujan peruutus → `AbortError` eikä `CardApiError`; rikkinäinen JSON ja väärä muoto → `'invalid-response'`; `limit: 0` → `'invalid-response'` (ei ikuista silmukkaa); `credentials: 'omit'` välitetään.
- **mapCard:** kelvollinen kortti; `cost: null`; `subname: null`; puuttuva `canonical_name`; puuttuva `id`/`slug`/`name`/`card_type` → `null`; ei-objekti (`null`, merkkijono, taulukko) → `null`; `image_url` ja `printings` eivät päädy tulokseen.
- **Käyttöliittymä:** `CatalogView` jokaisessa tilassa (lataus, virhe ja uudelleenyritys, tyhjä, lista) Testing Libraryn roolikyselyillä. `App` saa `loadCatalog`-väärennöksen.
- **Verkon esto:** `src/test/setup.ts` korvaa `globalThis.fetch`-funktion sellaisella, joka heittää virheen `"Real network access is disabled in tests"`. Testi, joka unohtaa väärennöksen, epäonnistuu eikä kutsu oikeaa rajapintaa.
- Oikeaa rajapintaa vasten ajettava sopimustesti on erillinen jatkoidea (ei CI:hin, ei T-001:een).

## 9. Build, ajo ja julkaisu

- `npm run build` = tyyppitarkistus + `vite build` → `dist/`. Tyyppivirhe rikkoo buildin, jolloin workflow ei julkaise.
- Workflowt (`.github/workflows/`) ajavat vain `npm ci && npm run build`. Testit ja lint ajetaan paikallisesti ennen luovutusta (rules.md 6). Niiden lisääminen PR-workflowhun on suositeltu jatkotehtävä.
- ~~`firebase.json` ei muutu.~~ → T-001: `firebase.json`:n molemmilla sivustoilla (prod, test) on sama `headers`-osio: CSP (`connect-src 'self' https://api.netdeck.gg`, ei `unsafe-inline`- eikä `unsafe-eval`-lähteitä) ja SR-3:n otsakkeet. Sisällöstä päättää Digiturva (SR-2, SR-3, SR-9).
  - Kytkökset, jotka on pidettävä yhdenmukaisina: CSP:n `connect-src` ↔ `NETDECK_CARDS_URL` (`api/netdeckClient.ts`) sekä prod- ja test-lohkojen otsakkeet keskenään (JSON ei salli yhteistä lohkoa). Jos rajapinnan osoite vaihtuu, myös CSP:tä on muutettava, muuten selain estää haun. Katso ARCH-001, löydös ARCH-003.
  - `vite.config.ts`: `assetsInlineLimit: 0`, jotta CSP ei tarvitse `data:`-lähteitä skripteille.

## 10. Ulkoiset palvelut

| Palvelu | Käyttö | Kustannus | Riski ja torjunta |
|---|---|---|---|
| Netdeck.gg API | korttidata, luku selaimesta | ilmainen, ei avainta | muutos tai sulkeutuminen → eristetty `api/`-kerrokseen. Välimuisti on jatkotehtävä. Käyttöehtoja ei ole tarkistettu (Digiturva). |
| Firebase Hosting | staattinen jakelu, 2 sivustoa | Spark (ilmainen) | ei dataa, ei lukitusta |

## 11. Tunnettu rakenteellinen velka ja jatkotehtäväehdotukset (PM priorisoi)

1. **Korttidatan välimuisti** (MVP-1:n alussa): yksi lataus on noin 1,4 Mt ja noin 4–6 s. Muunnettujen `Card`-olioiden tallennus `localStorage`en aikaleimalla ja taustapäivitys. Pienentää myös rajapinnan sulkeutumisen riskiä. Oma ADR.
2. **Testit ja lint CI:hin** (T-004): `npm test && npm run lint` preview-workflowhun ennen buildia.
3. **ESLint-saavutettavuusliitännäinen** (T-005), kun ESLint 10:n kanssa yhteensopiva versio on saatavilla (eslint-plugin-jsx-a11y 6.10.2 tukee vain ESLint 9:ää).

4. **Keskeneräisten pyyntöjen peruutus epäonnistumisen jälkeen ja testityyppien (`vitest/globals`) erottaminen sovelluksen tsconfigista** (T-006).
5. **`firebase.json`:n otsakkeiden yhdenmukaisuus** (ARCH-003): pieni testi, joka varmistaa, että prod- ja test-lohkojen otsakkeet ovat samat ja että CSP:n `connect-src` sisältää `NETDECK_CARDS_URL`:n originin. Ehdotus PM:lle.

## Toteutuksen yksityiskohdat

_Koodari täydentää T-001:n toteutuksen jälkeen (poikkeamat suunnitelmasta perusteluineen)._

### T-001 · Koodari 2026-09-30

Toteutus noudattaa lukuja 3–9. Poikkeamat ja tarkennukset perusteluineen:

- **Aikakatkaisu omalla `AbortController`illa ja `setTimeout`illa** (Arkkitehti hyväksyi 2026-10-01, ARCH-001, kirjattu lukuun 5.4), ei `AbortSignal.any`/`AbortSignal.timeout`-yhdistelmällä (5.4). Perustelu: `AbortSignal.any` puuttuu Safarista ennen versiota 17.4, ja oma `timedOut`-lippu erottaa aikakatkaisun kutsujan peruutuksesta ilman virheen nimeen luottamista. Käyttäytyminen on sama kuin 5.5:n taulukossa.
- **Rinnakkaisuus rajattu** (5.3 kohta 3 + SR-5, Arkkitehti hyväksyi 2026-10-01, ARCH-001, kirjattu lukuun 5.3): loput sivut haetaan enintään `MAX_CONCURRENT_REQUESTS = 3` pyyntöä kerrallaan (ei rajatonta `Promise.all`ia). Uusia pyyntöjä ei aloiteta, kun jokin sivu on epäonnistunut tai palauttanut tyhjän `items`-taulukon (SR-5: sivutus pysähtyy tyhjään sivuun).
- **`offset`-tarkistus:** jos sivun palauttama `offset` ei vastaa pyydettyä, heitetään `invalid-response` (SR-5: offset, joka ei kasva). `parsePage` vaatii myös `offset`in ei-negatiiviseksi kokonaisluvuksi.
- **Tyhjä ensimmäinen sivu** lopettaa haun, vaikka `total` olisi suurempi (ei turhia pyyntöjä). Näkymä näyttää silloin OSITTAINEN-tilan ilman tyhjää taulukkoa.
- **`fetch`-asetuksissa myös `referrerPolicy: 'no-referrer'`** (SR-4).
- **`mapCard` trimmaa merkkijonot:** pelkkiä välilyöntejä sisältävä kenttä tulkitaan puuttuvaksi.
- **Tilojen valinta** (`ui/CatalogView.tsx`, `toViewModel`): PM:n päätös 2026-09-30. `error` → VIRHE. `ready` ja `cards.length < reportedTotal` → OSITTAINEN. `ready` ja 0 korttia → TYHJÄ. Muuten ONNISTUMINEN saatujen korttien määrällä (myös, jos korttien määrä on suurempi kuin `total`).
- **Live-alue** (`role="status"`) on DOM:ssa ensimmäisestä renderöinnistä asti, ja sen sisältö on silloin jo "Haetaan kortteja…" (UX.md 4.3 pyytää tyhjää aluetta). Alue pysyy samana elementtinä kaikissa tiloissa, joten tilamuutokset ilmoitetaan. Sivun latautuessa lataustekstin ilmoittaminen ei ole välttämätöntä, koska se näkyy myös tilarivillä. UX tarkistaa katselmoinnissa.
- **Lint (SR-1):** `no-restricted-syntax` estää `dangerouslySetInnerHTML`:n, `innerHTML`/`outerHTML`-sijoitukset, `insertAdjacentHTML`:n, `document.write`:n ja merkkijonoajastimet. `no-eval`, `no-implied-eval` ja `no-new-func` ovat päällä. Kerrosraja valvotaan luvun 4 mukaan (myös `src/main.tsx`).
- **Workflowt (SR-8):** `deploy-prod.yml` ja `deploy-test.yml` saivat `permissions: contents: read`. `repoToken` poistettiin live-julkaisuista, koska `action-hosting-deploy` käyttää tokenia vain PR-ajoissa (tarkistettu lähdekoodista `src/index.ts`).
- **Todennettu oikeaa rajapintaa vasten** kerran käsin 2026-09-30 (ei testisarjassa): 151 / 151 korttia, 0 ohitettua, noin 6 s.

### T-010 · Koodari 2026-10-01

Haku ja suodatus (UX.md luku 5). Ei uusia riippuvuuksia, ei muutoksia rajapintakerrokseen eikä tietomalliin.

- **`src/domain/cardSearch.ts`** (uusi, puhdas, ei riippuvuuksia): `normalizeForSearch` (NFD, yhdistävien merkkien `\p{M}` ja näkymättömien muotoilumerkkien `\p{Cf}` poisto, pienet kirjaimet, välimerkit `\p{P}` välilyönneiksi, välilyöntien tiivistys; B-013, B-014), `filterCards` (hakusana pilkotaan sanoiksi, ja jokaisen sanan on löydyttävä `"{name} {subname}"`-merkkijonosta `includes`-vertailulla; pelkistä välimerkeistä koostuva hakusana = ei hakua; ryhmän sisällä TAI, ryhmät ja haku JA), `filterOptions` (tunnetut arvot kiinteässä järjestyksessä + tuntemattomat datasta ja valinnoista), `toggleValue`, `isFilterActive`. Ei säännöllisiä lausekkeita käyttäjän syötteestä, joten erikoismerkit ovat tavallista tekstiä (SR-1, ei ReDoS-riskiä).
- **`src/ui/CardFilters.tsx`** (uusi): esittävä lomake (`form role="search"`, hakukenttä `maxLength=100`, kaksi fieldsetiä). Esc ja Enter käsitellään `keydown`issa. IME-koostaminen tunnistetaan `isComposing`-lipusta.
- **`src/ui/CardColor.tsx`** (uusi): väri tekstinä + koristeellinen näyte. Käytössä taulukossa ja suodattimissa. Värien suomenkieliset nimet `texts.ts`:n `colorNames`-Mapissa (Map eikä objekti, jotta `"constructor"` tms. rajapinnan arvo ei osu prototyyppiin).
- **`src/ui/useDelayedAnnouncement.ts`** (uusi): live-alueen 750 ms:n hillintä. Ilmoitukset sidotaan `owner`-arvoon (`CatalogState`-olio). Kun tila vaihtuu (uudelleenyritys), odottava ajastin perutaan efektin purussa ja aiempi ilmoitus hylätään, joten latausviesti ei jää vanhentuneen tuloksen alle. Sama tulos (avain: tila + määrä) ei toistu. `Tyhjennä haku ja suodattimet` ilmoittaa aina heti (`force`). Jos haku tai valinta on käytössä tilan vaihtuessa, `CatalogView` yhdistää latausviestiin suodatuksen tuloksen (UX-002, K9). Tulos lasketaan tilan saapumishetken hakuehdoista (`loadedWith`-tila), jotta myöhemmät muutokset ilmoitetaan viiveellä eikä latausviestiä kirjoiteta uudelleen. Tuloksen avain on toistokiellon lähtökohta (`baseline`).
- **`CatalogView`**: hakutila (`criteria`) on `CatalogView`issa, joka pysyy asennettuna kaikissa tiloissa, joten haku ja valinnat säilyvät uudelleenyrityksen yli. Lomake renderöidään vain, kun ladattuja kortteja on vähintään yksi (myös OSITTAINEN ilman yhtään saatua korttia jää ilman lomaketta, koska suodatettavaa ei ole). `CardList` saa captionin propsina.
- **Testit:** `cardSearch.test.ts` (logiikka) ja `CatalogView.filters.test.tsx` (näkymä). Live-alueen testit käyttävät `fireEvent`iä ja Vitestin valeajastimia, koska user-event jumittuu valeajastimien kanssa (LESSONS L-002).
