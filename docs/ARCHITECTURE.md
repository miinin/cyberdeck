# ARCHITECTURE · cyberdeck

> Omistaja: Arkkitehti. Koodari päivittää toteutuksen yksityiskohdat (osio "Toteutuksen yksityiskohdat").
> Päivitetty 2026-10-01 (Arkkitehti, T-001:n katselmointi ARCH-001: poikkeamat hyväksytty ja kirjattu lukuihin 3, 5, 7 ja 9). Teknologiapäätös: D-005 (tila: Voimassa).
> Päivitetty 2026-10-01 (Arkkitehti, T-011): tietomalli ja paikallinen tallennuskerros, luku 12 sekä muutokset lukuihin 1, 3, 4 ja 6. Päätös: D-008 (tila: Ehdotettu).
> Päivitetty 2026-10-02 (Arkkitehti, T-026 ja T-027): korttidata ja korttikuvat sovelluksen mukana, uusi luku 13 sekä merkinnät lukuihin 1, 5, 7, 9, 10 ja 11. Päätös: D-013 (tila: Ehdotettu).

## 1. Yleiskuva

Cyberdeck on selaimessa toimiva yhden sivun sovellus (SPA). MVP-0:ssa ja MVP-1:ssä ei ole omaa palvelinta eikä tietokantaa. ~~Selain hakee korttidatan suoraan Netdeck.gg:n julkisesta rajapinnasta.~~ → T-026 (D-013): korttidata on buildissa (`src/data/cards.json`), ja vain kehittäjän päivityskomento kutsuu Netdeck.gg:tä. Kaavio ja kerrokset: luku 13.1. Firebase Hosting jakaa vain staattiset tiedostot.

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

**MVP-1 (T-011, D-008)** lisää tallennuskerroksen. Kaavio on luvussa 12.1.

```
ui/ ──► storage/index.ts ──► domain/ (Collection, Deck, CardKey, validointi)
              │
              └─► localStorage (vain storage/keyValueStore.ts koskee siihen)
```

**Riippuvuuksien suunta:** `ui → api → domain`, `ui → storage → domain` ja `ui → domain`. `storage` ei tuo `api`a, `ui`:ta eikä Reactia. `domain` ei tuo mitään. `api` ei tuo Reactia. Vain `api/` tuntee Netdeck.gg:n URL:n ja raakadatan muodon (PROJECT.md:n riski "rajapinta muuttuu tai sulkeutuu"). Jos rajapinta vaihtuu, muutetaan vain `api/`. **T-026 (D-013):** sovellus ei enää importtaa `api`a. Uusi suunta on `ui → data → domain`, ja `api`a käyttää vain `scripts/` (luku 13.1).

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
    │   ├── card.ts            Card-tyyppi (sisäinen malli), T-011: kenttä key
    │   ├── cardKey.ts         T-011: CardKey, normalizeCardName, cardKey, isCardKey (luku 12.3)
    │   ├── collection.ts      T-011: Collection-malli ja puhtaat apufunktiot (luku 12.4)
    │   ├── deck.ts            T-011: Deck-malli ja rajat (luku 12.4)
    │   ├── validate.ts        T-011: cleanText, parseCollection, parseDeckContent, parseDeck, parseDeckList (luku 12.5)
    │   └── *.test.ts
    ├── storage/               T-011: tallennuskerros (luku 12)
    │   ├── index.ts           JULKINEN rajapinta: tyypit, StorageError, openBrowserRepositories, createMemoryRepositories, requestPersistentStorage
    │   ├── types.ts           CollectionRepository, DeckRepository, Repositories, Loaded, LoadNotice
    │   ├── errors.ts          StorageError ja StorageErrorKind
    │   ├── keyValueStore.ts   ainoa tiedosto, joka koskee localStorageen: openBrowserStore, createMemoryStore, subscribeToBrowserStorage
    │   ├── envelope.ts        skeemakääre, versiot ja migraatiot (puhtaat funktiot)
    │   ├── repositories.ts    createRepositories: kokoelma- ja pakkarepositoriot KeyValueStoren päällä
    │   ├── keys.ts            tallennusavaimet ja versiot (vakiot)
    │   └── *.test.ts
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
- **T-011 (D-008, SR-12):**
  - `src/ui/**`, `src/App.tsx` ja `src/main.tsx` saavat tuoda tallennuskerroksesta vain `storage/index.ts`:n (`'../storage'`). Kielletty malli: `**/storage/*`.
  - `src/domain/**`: kielletään myös `**/storage` ja `**/storage/**`.
  - `src/storage/**`: kielletään `react`, `**/ui`, `**/ui/**`, `**/api` ja `**/api/**`.
  - Kaikkialla paitsi `src/storage/**`:ssa ja `src/test/**`:ssa: `no-restricted-globals` (`localStorage`, `sessionStorage`, `indexedDB`) ja `no-restricted-properties` (`window`, `globalThis` ja `self` × samat kolme ominaisuutta; `self` lisättiin toteutuksessa, ARCH-002-raportti). Näin käyttöliittymä ei voi käyttää selaimen tallennusta suoraan.
  - **Huom. flat config:** saman säännön (`no-restricted-imports`) myöhempi lohko korvaa aiemman eikä yhdistä niitä. API- ja storage-mallit on siksi annettava samassa lohkossa (`patterns: [apiInternals, storageInternals]`).

## 5. Rajapintakerros (`src/api/`)

> T-026 (D-013): kerros säilyy ennallaan, mutta sitä käyttää vain päivityskomento `npm run cards:update` (luku 13.4), ei selain.

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
  key: CardKey;          // T-011 (D-008): oma yksilöivä avain cardKey(name, subname), esim. "v-streetkid"
}
```

**T-011:** `mapCard` laskee `key = cardKey(name, subname)` ja palauttaa `null` (eli `skipped += 1`), jos `!isCardKey(key)` (esim. nimi ilman latinalaisia kirjaimia tai numeroita tai yli 100 merkkiä). Kokoelma ja pakat viittaavat korttiin vain `key`-kentällä (luku 12.3).

**Miksi juuri nämä:** MVP-0 näyttää nimen, tyypin ja kustannuksen. `slug` ja `displayName` ovat mukana, koska ne ovat yksilöllisiä ja nimi ei ole (sama nimi, eri alaotsikko). MVP-1:n kokoelma ja pakat tarvitsevat pysyvän viitteen korttiin, ja pakkalistan tuonti tunnistaa kortit nimen ja alaotsikon perusteella. `color` on mukana, koska se on halpa ja todennäköisesti MVP-1:n suodatuksessa. Muita kenttiä ei lisätä ennen kuin tehtävä tarvitsee niitä. Kenttien lisääminen on turvallista, koska malli ei ole vielä pysyvästi tallennettu.

**MVP-1:tä varten (ei toteuteta T-001:ssä):**
- Kokoelma ja pakat tallennetaan kortin viitteenä, ei kopiona kortin tiedoista. ~~Alustava suositus on käyttää viitteenä `slug`-kenttää (luettava ja rakennettavissa uudelleen nimestä, jos lähde vaihtuu) eikä Netdeckin UUID:tä. Päätös tehdään ADR:nä MVP-1:n tallennustehtävässä.~~ → korvattu, katso D-008 ja luku 12.3: viitteenä on oma `key` (`cardKey(name, subname)`). Netdeckin slug ei ole johdettavissa nimestä 16 kortilla 151:stä (todennettu 2026-10-01).
- Keräilynumerot (`printings[].collector_number`, esim. `005a`, `β005a`) lisätään malliin vasta, kun pakkalistan tuonti tarvitsee niitä ja oikea vientiesimerkki on saatu (TUTKIMUS.md). Rajapinnan numerot eivät suoraan vastaa Cyberdeck Toolsin muotoa `A027`.
- ~~Tallennus on todennäköisesti selaimen `localStorage` omassa `src/storage/`-moduulissaan ennen MVP-2:n kirjautumista.~~ → päätetty, katso D-008 ja luku 12.

## 7. Käyttöliittymäkerros (`src/ui/`)

> T-026 (D-013): `useCardCatalog`, `CatalogState` sekä lataus-, virhe- ja osittaisen datan tilat poistuvat. `CatalogView` saa `cards`-listan suoraan (luku 13.5). Alla oleva kuvaa T-001:n ja T-012:n tilaa.

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
  - **T-026 (D-013):** `connect-src 'self'` ja välimuistisääntö `/assets/**` (luku 13.7). Alla oleva `connect-src`-kytkös poistuu.
  - Kytkökset, jotka on pidettävä yhdenmukaisina: CSP:n `connect-src` ↔ `NETDECK_CARDS_URL` (`api/netdeckClient.ts`) sekä prod- ja test-lohkojen otsakkeet keskenään (JSON ei salli yhteistä lohkoa). Jos rajapinnan osoite vaihtuu, myös CSP:tä on muutettava, muuten selain estää haun. Katso ARCH-001, löydös ARCH-003.
  - `vite.config.ts`: `assetsInlineLimit: 0`, jotta CSP ei tarvitse `data:`-lähteitä skripteille.

## 10. Ulkoiset palvelut

| Palvelu | Käyttö | Kustannus | Riski ja torjunta |
|---|---|---|---|
| Netdeck.gg API | ~~korttidata, luku selaimesta~~ → T-026: vain kehittäjän komento `cards:update` (D-013) | ilmainen, ei avainta | muutos tai sulkeutuminen → eristetty `api/`-kerrokseen. Välimuisti on jatkotehtävä. Käyttöehtoja ei ole tarkistettu (Digiturva). |
| Firebase Hosting | staattinen jakelu, 2 sivustoa; T-026 ja T-027: myös korttidata ja -kuvat | Spark (ilmainen): 10 Gt tallennus (myös vanhat julkaisut) ja 10 Gt/kk siirto, sivustot jakavat kiintiön (D-013 osa 5) | ei lukitusta (staattiset tiedostot). Siirtokiintiön ylitys poistaa sivustot käytöstä kuukauden loppuun: kuvat ladataan laiskasti, ja niillä on vuoden välimuisti. |
| sharp (devDependency, T-027) | kuvien muunnos WebP:ksi kehittäjän koneella | ilmainen, Apache-2.0 + LGPL-3.0 (libvips) | ehdotettu, vaatii PM:n ja Digiturvan hyväksynnän (D-013 osa 4) |

## 11. Tunnettu rakenteellinen velka ja jatkotehtäväehdotukset (PM priorisoi)

1. ~~**Korttidatan välimuisti** (MVP-1:n alussa):~~ → korvattu, D-012 ja D-013: data on buildissa (T-026). yksi lataus on noin 1,4 Mt ja noin 4–6 s. Muunnettujen `Card`-olioiden tallennus `localStorage`en aikaleimalla ja taustapäivitys. Pienentää myös rajapinnan sulkeutumisen riskiä. Oma ADR.
2. **Testit ja lint CI:hin** (T-004): `npm test && npm run lint` preview-workflowhun ennen buildia.
3. **ESLint-saavutettavuusliitännäinen** (T-005), kun ESLint 10:n kanssa yhteensopiva versio on saatavilla (eslint-plugin-jsx-a11y 6.10.2 tukee vain ESLint 9:ää).

4. **Keskeneräisten pyyntöjen peruutus epäonnistumisen jälkeen ja testityyppien (`vitest/globals`) erottaminen sovelluksen tsconfigista** (T-006).
5. **`firebase.json`:n otsakkeiden yhdenmukaisuus** (ARCH-003): pieni testi, joka varmistaa, että prod- ja test-lohkojen otsakkeet ovat samat ja että CSP:n `connect-src` sisältää `NETDECK_CARDS_URL`:n originin. Ehdotus PM:lle.
6. **Migraatioketjun kytkentä ja invarianttitesti** (ARCH-007, T-011:n katselmointi): tuotannon migraatioketju on nyt `repositories.ts`:ssä kovakoodattu tyhjä taulukko. Ennen ensimmäistä oikeaa migraatiota (tai jo nyt pienenä velkatehtävänä) ketjut siirretään `storage/migrations.ts`:ään, ja testi varmistaa `MIGRATIONS.length + 1 === SCHEMA_VERSION` kummallekin kokonaisuudelle. Ilman sitä version nosto ilman ketjua tulkitsisi kaiken datan rikkinäiseksi (varmuuskopio syntyy, mutta käyttäjä näkee tyhjän tilan).
7. **Tallennuskiintiön kokonaisbudjetti** (ARCH-006): SR-11:n rajojen pahin tapaus (200 pakkaa × 500 riviä) ja kolme varmuuskopiota voisivat ylittää `localStorage`n noin 5 MiB:n kiintiön. Nykyisellä korttimäärällä (151) tämä ei ole realistista. Tarkistetaan T-003:n välimuistin ADR:ssä, kun kiintiö jaetaan.

## 12. Tietomalli ja tallennuskerros (T-011, D-008)

Turvavaatimukset: SECURITY.md SR-11, SR-12, SR-13 ja SR-16 sitovat T-011:tä. Tämän luvun rajat ja käytännöt on sovitettu niihin.

### 12.1 Rakenne

```
ui/ (T-012, T-013 …)
  │  vain storage/index.ts
  ▼
storage/index.ts ── openBrowserRepositories() ─┬─ openBrowserStore() ok  → createRepositories({ store: localStorage, persistent: true })
                                              └─ ei saatavilla        → createRepositories({ store: muisti,  persistent: false })
storage/repositories.ts  (luku–validointi–muutos–validointi–yksi setItem)
  ├─ envelope.ts   kääre { schemaVersion, savedAt, data }, migraatiot
  ├─ keyValueStore.ts   KeyValueStore: localStorage tai Map, storage-tapahtuma
  └─ domain/validate.ts  parseCollection, parseDeckList (sama validointi kuin T-015:n tuonnissa, SR-11)
```

MVP-2:ssa `storage/firestore/` toteuttaa samat `CollectionRepository`- ja `DeckRepository`-rajapinnat (D-008 kohta 5), ja `openBrowserRepositories`n rinnalle tulee valinta kirjautumisen mukaan. Käyttöliittymä ei muutu.

### 12.2 Tallennusavaimet ja muoto

| Avain | Sisältö |
|---|---|
| `cyberdeck:collection` | `{"schemaVersion":1,"savedAt":"2026-10-01T12:00:00.000Z","data":{"entries":[{"card":"v-streetkid","count":2}]}}` |
| `cyberdeck:decks` | `{"schemaVersion":1,"savedAt":"…","data":{"decks":[{"id":"<uuid>","name":"Esimerkkipakka","sections":[{"name":"Legends","cards":[{"card":"v-streetkid","count":1}]}],"createdAt":"…","updatedAt":"…"}]}}` |
| `cyberdeck:backup:<collection\|decks>:<ISO-aikaleima>[:<n>]` | alkuperäinen raaka merkkijono sellaisenaan (luku 12.7). Pääte `:<n>` (1, 2, …) lisätään vain, jos samalla millisekunnilla on jo varmuuskopio. |

- `keys.ts`: `COLLECTION_KEY`, `DECKS_KEY`, `BACKUP_PREFIX = 'cyberdeck:backup:'`, `COLLECTION_SCHEMA_VERSION = 1`, `DECKS_SCHEMA_VERSION = 1`, `MAX_BACKUPS_PER_AGGREGATE = 3`.
- Versio on kääreessä, ei avaimen nimessä (SR-12:n `cyberdeck:v1:…` oli esimerkki): migraatio ei vaadi avaimen vaihtoa, ja vanha data löytyy aina samasta paikasta. Nimiavaruus `cyberdeck:` erottaa käyttäjän datan T-003:n välimuistista (jonka avain on eri, esim. `cyberdeck:cache:…`).
- Tuotanto, testi ja esikatselukanavat ovat eri origineja, joten niiden tallennustilat ovat erillään (SECURITY.md luku 11).

### 12.3 Kortin avain (`src/domain/cardKey.ts`)

```ts
export type CardKey = string;
export const MAX_CARD_KEY_LENGTH = 100;

/** Muuttaa minkä tahansa korttinimen vertailumuotoon. Sama funktio tuottaa avaimen ja täsmää tuontirivit (T-014). */
export function normalizeCardName(text: string): string;
//   text.normalize('NFKD')
//   → poista yhdistyvät merkit /\p{M}/gu
//   → toLowerCase()
//   → poista heittomerkit /['‘’`]/g
//   → korvaa /[^a-z0-9]+/g → '-'
//   → poista reunojen '-' (/^-+|-+$/g)
// Lineaarinen, ei sisäkkäisiä toistoja (SR-17). Ei rakenna regexiä syötteestä.

export function cardKey(name: string, subname: string | null): CardKey;
//   normalizeCardName(subname ? `${name} ${subname}` : name)

/** Muoto ^[a-z0-9]+(?:-[a-z0-9]+)*$, pituus 1–100, ei 'constructor' eikä 'prototype' (SR-11). */
export function isCardKey(value: unknown): value is CardKey;
```

Esimerkit testeiksi: `cardKey('V', 'Streetkid')` = `v-streetkid`; `cardKey('Judy Álvarez', 'Braindance Maestro')` = `judy-alvarez-braindance-maestro`; `cardKey('Royce', "Don't Call Me Simon")` = `royce-dont-call-me-simon`; `normalizeCardName('Dum Dum - Maelstrom Triggerman')` = `normalizeCardName('Dum Dum — Maelstrom Triggerman')` = `cardKey('Dum Dum', 'Maelstrom Triggerman')`; `normalizeCardName('  ')` = `''` ja `isCardKey('')` = false.

### 12.4 Tietomalli (`src/domain/collection.ts`, `src/domain/deck.ts`)

```ts
// collection.ts
export const MAX_COLLECTION_COUNT = 999;      // SR-11
export const MAX_COLLECTION_ENTRIES = 5000;   // SR-11
export interface CollectionEntry { readonly card: CardKey; readonly count: number }   // count 1–999 tallennettuna
export interface Collection { readonly entries: readonly CollectionEntry[] }          // card yksilöllinen, järjestys avaimen mukaan
export const EMPTY_COLLECTION: Collection;
export function countOf(collection: Collection, card: CardKey): number;               // 0, jos ei ole
export function withCount(collection: Collection, card: CardKey, count: number): Collection;
//   puhdas: uusi olio, 0 poistaa rivin, järjestys avaimen mukaan; heittää RangeError, jos count ei ole kokonaisluku 0–999 tai avain ei kelpaa
export function toCountMap(collection: Collection): Map<CardKey, number>;            // hakuihin Map, ei objekti (SR-11)

// deck.ts
export type DeckId = string;                  // crypto.randomUUID(); muoto ^[A-Za-z0-9_-]{1,64}$
export const MAX_DECKS = 200;
export const MAX_DECK_CARD_COUNT = 99;        // yhden rivin määrä 1–99 (SR-11)
export const MAX_DECK_DISTINCT_CARDS = 500;   // rivejä yhteensä kaikissa osioissa
export const MAX_DECK_NAME_LENGTH = 100;      // 1–100 trimmauksen jälkeen
export const MAX_SECTIONS = 20;
export const MAX_SECTION_NAME_LENGTH = 50;    // 0–50; tyhjä = nimetön pääosio
export interface DeckCard { readonly card: CardKey; readonly count: number }
export interface DeckSection { readonly name: string; readonly cards: readonly DeckCard[] }  // kortti enintään kerran per osio
export interface DeckContent { readonly name: string; readonly sections: readonly DeckSection[] }
export interface Deck extends DeckContent { readonly id: DeckId; readonly createdAt: string; readonly updatedAt: string } // ISO 8601
```

- Sama kortti saa olla eri osioissa (esim. pääpakka ja `Sideboard`). Osioiden nimet ja järjestys tulevat käyttäjältä tai tuonnista. T-013 päättää (UX:n kanssa) oletusosiot uudelle pakalle.
- Kortin tiedot haetaan luettelosta avaimella. Avain, jota luettelossa ei ole, säilyy datassa (ei poisteta), ja käyttöliittymä näyttää sen avaimena.
- Painosvalmius: rivi saa myöhemmin valinnaisen kentän `printings` (D-008 kohta 2). Ei toteuteta nyt, eikä kenttää ole tyypissä.

### 12.5 Validointi (`src/domain/validate.ts`)

```ts
export interface Parsed<T> { value: T; dropped: number }   // dropped = pois jätetyt rivit, osiot tai pakat

/** NFC, poistaa C0- ja C1-ohjausmerkit (myös rivinvaihdot) sekä U+202A–U+202E ja U+2066–U+2069, trimmaa.
 *  Palauttaa null, jos arvo ei ole merkkijono tai pituus ei ole min–max. */
export function cleanText(value: unknown, minLength: number, maxLength: number): string | null;

export function parseCollection(raw: unknown): Parsed<Collection> | null;   // null = juuri väärän muotoinen
export function parseDeckContent(raw: unknown): Parsed<DeckContent> | null; // null = nimi tai sections puuttuu tai on virheellinen
export function parseDeck(raw: unknown): Parsed<Deck> | null;               // lisäksi id; virheellinen aikaleima → '1970-01-01T00:00:00.000Z'
export function parseDeckList(raw: unknown): Parsed<Deck[]> | null;         // { decks: [...] }
```

Säännöt (SR-11):
- Ei koskaan heitä. Syöte on `unknown`, ja tyyppivahdit ovat pieniä (`isRecord`, joka hylkää taulukot ja `null`in). Ei `any`-tyyppiä, ei `as`-muunnoksia syötteelle, ei spreadia, `Object.assign`ia eikä syväyhdistämistä syötteestä. Tulos rakennetaan uusina olioina sallituista kentistä.
- Taulukoita käydään läpi vain ylärajaan asti (esim. `entries.slice(0, MAX_COLLECTION_ENTRIES)`), ja ylimenevät lasketaan `dropped`-kenttään.
- Pudotetaan ja lasketaan: virheellinen rivi (avain ei kelpaa, määrä ei kokonaisluku rajoissa), toistuva avain (ensimmäinen voittaa), virheellinen osio (nimi ei kelpaa tai `cards` ei taulukko), virheellinen pakka listassa, toistuva pakan id (ensimmäinen voittaa) ja pakan ylimenevät rivit.
- Kokoelmassa tallennettu määrä on 1–999 (0 ei ole tallennettu rivi, joten se pudotetaan).
- Ylimääräiset kentät ohitetaan. `__proto__`-, `constructor`- ja `prototype`-avaimet eivät vaikuta tulokseen (testi: `({} as Record<string, unknown>).polluted === undefined`).
- Sama `parseDeckContent` käytetään T-015:n .json-tuonnissa (SR-18).
- `api/mapCard.ts`:n `isRecord`- ja `nonEmptyString`-apurit voivat siirtyä tänne, ja `api` tuo ne domainista (suunta `api → domain` on sallittu). Ei pakollinen T-011:ssä.

### 12.6 Tallennuskerroksen rajapinta (`src/storage/`)

```ts
// errors.ts
export type StorageErrorKind =
  | 'unavailable'     // tallennustila estetty tai heitti muun virheen
  | 'quota'           // QuotaExceededError (myös Firefoxin NS_ERROR_DOM_QUOTA_REACHED)
  | 'newer-version'   // tallennettu data on uudempaa versiota; kirjoitus estetty
  | 'invalid-input'   // kutsujan antama data ei läpäise validointia
  | 'limit-reached'   // MAX_DECKS tai MAX_COLLECTION_ENTRIES täynnä
  | 'not-found';      // update tuntemattomalla id:llä
export class StorageError extends Error {
  readonly kind: StorageErrorKind;
  constructor(kind: StorageErrorKind, message: string, options?: { cause?: unknown });
}

// types.ts
export type LoadNotice =
  | { kind: 'repaired'; dropped: number }                 // osa riveistä pudotettiin, loput säilyivät
  | { kind: 'reset'; backupKey: string | null }           // data lukukelvotonta: kopioitu varmuuskopioon, aloitettu tyhjästä
  | { kind: 'migrated'; from: number; to: number }
  | { kind: 'newer-version'; version: number };           // näytetään tyhjänä, kirjoitukset estetty
export interface Loaded<T> { value: T; notices: LoadNotice[] }

export interface CollectionRepository {
  load(): Promise<Loaded<Collection>>;
  /** count 0 poistaa. Palauttaa tallennetun kokoelman. */
  setCount(card: CardKey, count: number): Promise<Collection>;
  /** Kutsutaan, kun data muuttui tämän instanssin ulkopuolella (toinen välilehti; MVP-2: onSnapshot). */
  subscribe(listener: () => void): () => void;
}

export interface DeckRepository {
  list(): Promise<Loaded<Deck[]>>;                         // tallennusjärjestyksessä (luontijärjestys)
  get(id: DeckId): Promise<Deck | null>;
  create(content: DeckContent): Promise<Deck>;             // uusi id ja aikaleimat; ei koskaan käytä kutsujan id:tä (SR-18)
  update(id: DeckId, content: DeckContent): Promise<Deck>; // päivittää updatedAt; tuntematon id → 'not-found'
  remove(id: DeckId): Promise<void>;                       // tuntematon id → ei virhettä
  subscribe(listener: () => void): () => void;
}

export interface Repositories {
  collection: CollectionRepository;
  decks: DeckRepository;
  /** false = selaimen tallennus ei käytössä, data vain muistissa (UX näyttää ilmoituksen, SR-13). */
  persistent: boolean;
}

// keyValueStore.ts (ainoa tiedosto, joka koskee localStorageen)
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}
export function openBrowserStore(): KeyValueStore | null;
//   try { const s = window.localStorage; s.setItem('cyberdeck:probe','1'); s.removeItem('cyberdeck:probe') } catch → null
//   (pelkkä window.localStorage-ominaisuuden luku voi heittää SecurityErrorin, SR-13)
export function createMemoryStore(initial?: Readonly<Record<string, string>>): KeyValueStore;  // Map-pohjainen
export function subscribeToBrowserStorage(keys: readonly string[], listener: () => void): () => void;
//   window 'storage' -tapahtuma: kutsuu, kun event.key on listassa tai null (clear)
export function requestPersistentStorage(): Promise<boolean>;
//   navigator.storage?.persist?.() try/catch, muuten false. Kutsutaan vain käyttäjän toimesta (T-012, SR-13), ei käynnistyksessä.

// envelope.ts (puhtaita funktioita, eivät koske tallennustilaan)
export type Migration = (data: unknown) => unknown;      // migrations[i]: versio i+1 → i+2
export interface EnvelopeSpec<T> {
  currentVersion: number;
  migrations: readonly Migration[];
  parse: (data: unknown) => Parsed<T> | null;
}
export type Decoded<T> =
  | { kind: 'empty' }                                      // raw === null
  | { kind: 'ok'; value: T; dropped: number; fromVersion: number }
  | { kind: 'corrupt' }                                    // JSON, kääre tai data virheellinen, tai migraatio heitti
  | { kind: 'newer'; version: number };
export function decodeEnvelope<T>(raw: string | null, spec: EnvelopeSpec<T>): Decoded<T>;  // ei heitä
export function encodeEnvelope(data: unknown, version: number, savedAt: Date): string;
//   schemaVersion: kokonaisluku ≥ 1, muuten corrupt. version > currentVersion → newer.

// repositories.ts
export interface RepositoryOptions {
  store: KeyValueStore;
  persistent: boolean;
  now?: () => Date;                                        // oletus () => new Date()
  newId?: () => string;                                    // oletus () => crypto.randomUUID()
  subscribe?: (keys: readonly string[], listener: () => void) => () => void;  // oletus: ei tapahtumia
  migrations?: { collection?: readonly Migration[]; decks?: readonly Migration[] };  // vain testit; oletus []
  //   annettu ketju korvaa oletusketjun, ja nykyinen versio on silloin ketju.length + 1 (ARCH-007)
}
export function createRepositories(options: RepositoryOptions): Repositories;

// index.ts (julkinen)
export type { CollectionRepository, DeckRepository, Repositories, Loaded, LoadNotice } from './types';
export { StorageError } from './errors';
export type { StorageErrorKind } from './errors';
export { requestPersistentStorage } from './keyValueStore';
export function openBrowserRepositories(): Repositories;
//   openBrowserStore() → createRepositories({ store, persistent: true, subscribe: subscribeToBrowserStorage })
//   null → createRepositories({ store: createMemoryStore(), persistent: false })
export function createMemoryRepositories(options?: { initial?: Readonly<Record<string, string>>; now?: () => Date; newId?: () => string }): Repositories;
//   käyttöliittymätestit (T-012, T-013) ja tallennustilan puuttuminen
```

### 12.7 Luku- ja kirjoituspolku

**Luku** (`load`, `list`, `get`):
1. `raw = store.getItem(key)` (heittää → `StorageError('unavailable')`).
2. `decodeEnvelope(raw, spec)`:
   - `empty` → tyhjä arvo, ei ilmoitusta.
   - `ok` → arvo. `dropped > 0` → ilmoitus `repaired` ja `console.warn` pelkällä lukumäärällä (ei dataa, SR-11). `fromVersion < current` → `migrated`.
   - `corrupt` → varmuuskopio (alla). Kun se onnistuu, `store.removeItem(key)` → ilmoitus `reset` ja varmuuskopion avain. Jos varmuuskopio epäonnistuu, live-avainta ei poisteta, ilmoitus on `reset` ja `backupKey: null`, ja kirjoitukset epäonnistuvat seuraavassa kohdassa, kunnes tilaa on.
   - `newer` → tyhjä arvo ja ilmoitus `newer-version`. Mitään ei kirjoiteta.

**Kirjoitus** (`setCount`, `create`, `update`, `remove`), yksi looginen muutos = yksi `setItem` (SR-13). Kirjoitus kutsuu `now()`:ia kerran, ja samaa arvoa käytetään `savedAt`-, `createdAt`- ja `updatedAt`-kentissä sekä varmuuskopioavaimessa:
1. Validoi kutsujan syöte (`isCardKey`, määrä, `parseDeckContent`, jonka `dropped` on oltava 0) → muuten `invalid-input`. `cleanText` saa siistiä nimen (ohjausmerkit, trimmaus), ja palautettu arvo näyttää siistityn nimen.
2. **Lue tuore tila tallennustilasta joka kerta** (ei välimuistia instanssissa) ja dekoodaa. Näin toisen välilehden muutokset eivät katoa (R-11, SR-13). Kaikki tapahtuu samassa synkronisessa osassa ilman `await`ia lukemisen ja kirjoittamisen välissä.
3. `newer` → `StorageError('newer-version')`. `corrupt`, `ok` vanhemmalla versiolla tai `ok`, josta pudotettiin rivejä (`dropped > 0`) → varmuuskopio ensin (epäonnistuu → `quota` tai `unavailable`, eikä päälle kirjoiteta). Näin korjauksessa pudotetut rivit eivät katoa ensimmäisessä tallennuksessa.
4. Laske uusi arvo puhtailla funktioilla (`withCount` jne.) ja tarkista rajat (`limit-reached`). Jos muutos palauttaa saman olion (esim. `remove` tuntemattomalla id:llä), mitään ei kirjoiteta eikä varmuuskopioida. `create`: jos `newId()` palauttaa virheellisen tai jo käytetyn id:n → `unavailable`, eikä olemassa olevaa pakkaa ylikirjoiteta.
5. `store.setItem(key, encodeEnvelope(value, current, now()))`. `QuotaExceededError` → `quota`, muu virhe → `unavailable`. Edellinen arvo säilyy, koska `setItem` ei kirjoita osittain.

**Varmuuskopio:** `store.setItem('cyberdeck:backup:<aggregate>:<now().toISOString()>', raw)`. Varmuuskopio ei koskaan ylikirjoita toista (törmäyksessä pääte `:1`, `:2` …). Sen jälkeen poistetaan saman kokonaisuuden vanhimmat varmuuskopiot niin, että jäljelle jää `MAX_BACKUPS_PER_AGGREGATE` (järjestys avaimen mukaan, ISO-aikaleima järjestyy aakkosittain). Juuri kirjoitettua varmuuskopiota ei karsita koskaan, vaikka kello olisi siirtynyt taaksepäin, eikä karsinnan epäonnistuminen kaada kirjoitusta. Karsinta koskee vain `cyberdeck:backup:`-alkuisia avaimia, ei koskaan käyttäjän live-dataa (SR-13, R-12). Varmuuskopioiden palautuksen käyttöliittymä ei kuulu T-011:een (ehdotus IDEAS.md:hen).

**Välilehdet:** `subscribe` kuuntelee `storage`-tapahtumaa (vain muut välilehdet laukaisevat sen). Kuuntelija (T-012:n hook) lukee tilan uudelleen. Saman välilehden kirjoitukset palauttavat uuden arvon suoraan.

### 12.8 Testit (Vitest, jsdom; ei uusia riippuvuuksia)

jsdom toteuttaa `localStorage`n. `src/test/setup.ts` tyhjentää sen `afterEach`-vaiheessa (`localStorage.clear()`). Testit ovat testattavan tiedoston vieressä.

- **`domain/cardKey.test.ts`:** luvun 12.3 esimerkit; heittomerkkivariantit (`'`, `’`); isot ja pienet kirjaimet; pelkkä välilyönti → `''`; `isCardKey`: `''`, 101 merkkiä, `constructor`, `prototype`, `__proto__`, `V-Streetkid` (isot kirjaimet) → false. Fixtuuri, jossa on esimerkkipakan 19 nimeä ja alaotsikkoa: jokainen `docs/examples/esimerkkipakka.txt`:n rivin nimiosa normalisoituu jonkin kortin avaimeksi, ja fixtuurin avaimet ovat yksilöllisiä.
- **`domain/collection.test.ts`:** `withCount` lisää, päivittää ja poistaa (0); järjestys avaimen mukaan; alkuperäinen olio ei muutu; virheellinen määrä tai avain → `RangeError`.
- **`domain/validate.test.ts`** (SR-11:n luettelo): virheellinen juuri (`null`, merkkijono, taulukko, `entries` ei taulukko) → `null`; väärä tyyppi joka kentässä; määrä −1, 0, 1.5, `NaN`, 1000 (kokoelma) ja 100 (pakka) → pudotetaan; ylipitkä ja tyhjä nimi; ohjausmerkit ja rivinvaihto nimessä poistuvat; suunnanohjausmerkit poistuvat; NFC; toistuvat avaimet ja pakan id:t; `JSON.parse('{"__proto__":{"polluted":1}, …}')` ei saastuta prototyyppiä; ylimääräiset kentät eivät päädy tulokseen; osittain rikkinäisestä datasta ehjä osa säilyy ja `dropped` on oikein; yli `MAX_DECKS` pakkaa → ylimenevät pudotetaan.
- **`storage/envelope.test.ts`:** `null` → `empty`; kelvollinen → `ok`; rikkinäinen JSON, puuttuva tai ei-kokonaislukuinen `schemaVersion`, `data` väärä → `corrupt`; `schemaVersion` 2, kun nykyinen on 1 → `newer`; testissä annettu migraatioketju 1 → 2 → 3 ajetaan järjestyksessä; heittävä migraatio → `corrupt`; `encodeEnvelope` → `decodeEnvelope` palauttaa saman arvon.
- **`storage/repositories.test.ts`** (`createMemoryStore` ja väärennetyt `now`/`newId`):
  - tyhjä tila: `load` → tyhjä kokoelma eikä ilmoituksia, `list` → `[]`;
  - tallennus ja luku: `setCount` ja uusi instanssi samalla storella palauttaa saman; `create`/`update`/`remove`/`get`; `update` tuntemattomalla id:llä → `not-found`; `remove` tuntemattomalla → ei virhettä; `create` ei käytä syötteen id:tä;
  - rikkinäinen data: varmuuskopioavaimessa on alkuperäinen raaka merkkijono sellaisenaan, ilmoitus `reset`, seuraava kirjoitus onnistuu; osittain rikkinäinen → `repaired` ja ehjä osa säilyy;
  - skeemaversio: uudempi versio → `load` tyhjä ja `newer-version`, `setCount` → `StorageError('newer-version')` ja raaka arvo on täsmälleen ennallaan; vanhempi versio (testimigraatio) → `migrated`, ja ensimmäinen kirjoitus tekee varmuuskopion ennen päällekirjoitusta;
  - tallennustilan täyttyminen: store, jonka `setItem` heittää `new DOMException('full', 'QuotaExceededError')` → `quota`, ja edellinen tallennettu arvo säilyy;
  - varmuuskopion epäonnistuminen rikkinäisessä tilassa → live-arvoa ei poisteta eikä ylikirjoiteta;
  - kaksi instanssia samalla storella (kaksi välilehteä): kumpikin lisää eri kortin → molemmat säilyvät (luku ennen kirjoitusta);
  - varmuuskopioiden karsinta: neljäs rikkinäinen luku → kolme uusinta jää, live-dataan ei kosketa;
  - rajat: `invalid-input` (avain, määrä, tyhjä nimi) ja `limit-reached` (201. pakka).
- **`storage/keyValueStore.test.ts`:** `openBrowserStore` jsdomissa → toimiva store; `vi.spyOn(window, 'localStorage', 'get')` heittää `SecurityError` → `null`; `openBrowserRepositories` palauttaa silloin `persistent: false`, ja tallennus toimii muistissa; `subscribeToBrowserStorage`: `window.dispatchEvent(new StorageEvent('storage', { key: 'cyberdeck:collection' }))` kutsuu kuuntelijaa, muu avain ei kutsu, `key: null` kutsuu, ja peruutuksen jälkeen ei kutsuta; `requestPersistentStorage` ilman `navigator.storage`a → `false`.
- **`api/mapCard.test.ts`:** `key` lasketaan (`v-streetkid`); nimi, josta tulee tyhjä avain → `null`. Olemassa olevat Card-fixtuurit (esim. `ui/CatalogView.test.tsx`) saavat `key`-kentän.

### 12.9 Luovutus Koodarille (T-011)

Toteutusjärjestys niin, että jokainen askel on commitoitavissa ja testit menevät läpi:
1. `domain/cardKey.ts` ja testit. `Card.key` ja `mapCard` sekä fixtuurien päivitys.
2. `domain/collection.ts`, `domain/deck.ts` ja `domain/validate.ts` testeineen.
3. `storage/keys.ts`, `errors.ts`, `envelope.ts` ja testit.
4. `storage/keyValueStore.ts`, `repositories.ts`, `types.ts`, `index.ts` ja testit. `src/test/setup.ts`: `localStorage.clear()` `afterEach`issa.
5. ESLint-säännöt luvun 4 mukaan. Varmista, että lint estää `localStorage`n käytön esim. `src/ui/`-tiedostossa (kokeile ja poista kokeilu).

Ei käyttöliittymää, ei hookeja, eikä `App`ia muuteta (T-012). Ei uusia riippuvuuksia. Poikkeamat tästä luvusta kirjataan perusteluineen "Toteutuksen yksityiskohdat" -osioon.

## 13. Korttidata ja korttikuvat sovelluksen mukana (T-026, T-027, D-013)

Päätös ja vaihtoehtojen vertailu: D-013 (tila: Ehdotettu). Tämä luku kuvaa rakenteen ja rajapinnat. Se korvaa lukujen 1, 5, 7 ja 10 ajonaikaisen haun (merkitty niihin).

### 13.1 Yleiskuva

```
KEHITTÄJÄN KONE (käsin, harvoin)                      SELAIN (ei verkkokutsuja korttidatalle)
─────────────────────────────────                     ──────────────────────────────────────
npm run cards:update                                   main.tsx → App
  scripts/cards-update.mjs  (Viten runnerImport)         │  cards = CARDS (src/data/cards.ts)
    └─ scripts/cards/updateCards.ts                      ▼
         ├─ src/api  fetchAllCards()  ──HTTPS──► Netdeck  CatalogView({ cards, repositories })
         ├─ src/domain/cardFile.ts  parseCardFile           └─ CardList → CardImage (T-027)
         └─ kirjoittaa src/data/cards.json  ──────────►            └─ getCardImage(key)  (src/data/cardImages.ts)
                                                                        └─ /assets/<key>-<hash>.webp (oma origin)
npm run cards:images -- <kansio>      (T-027)
  scripts/cards-images.mjs  (runnerImport)
    └─ scripts/cards/importImages.ts
         ├─ matchImages.ts  (puhdas: nimet → avaimet)
         ├─ convertImage.ts (sharp → WebP sm/lg)
         └─ kirjoittaa src/assets/cards/{sm,lg}/<key>.webp
```

**Riippuvuuksien suunta (uusi):** `ui → data → domain`, `ui → storage → domain`, `ui → domain`. `scripts → api → domain` ja `scripts → domain`. **Sovelluskoodi (`src/ui`, `src/data`, `src/domain`, `src/storage`, `App.tsx`, `main.tsx`) ei importtaa `src/api`a lainkaan**, joten Netdeck-koodi ei päädy pakettiin. `src/data` ei importtaa Reactia, `ui`:ta, `storage`a eikä `api`a.

### 13.2 Hakemistot ja tiedostot

```
/
├── package.json             + "cards:update": "node scripts/cards-update.mjs"
│                            + "cards:images": "node scripts/cards-images.mjs"     (T-027)
│                            + devDependency "sharp": "0.35.5"                     (T-027, vasta hyväksynnän jälkeen)
├── tsconfig.json            + "resolveJsonModule": true, include + "scripts"
├── eslint.config.js         + scripts/**: Node-globaalit; sovelluskoodille api-kielto (13.6)
├── firebase.json            connect-src 'self'; + /assets/** Cache-Control (13.7)
├── .gitignore               + card-images-src/                                    (T-027)
├── scripts/
│   ├── cards-update.mjs     ohut sisääntulo: runnerImport('scripts/cards/updateCards.ts') → main(), exit-koodi
│   ├── cards-images.mjs     sama T-027:lle (importImages.ts)
│   └── cards/
│       ├── updateCards.ts        updateCards(deps): haku → tarkistus → diff → kirjoitus
│       ├── updateCards.test.ts   väärennetty fetch ja muistinvarainen tiedosto, ei verkkoa
│       ├── cardFileDiff.ts       diffCardFiles(old, next): { added, removed, changed }
│       ├── matchImages.ts        T-027: puhdas yhdistäminen
│       ├── matchImages.test.ts
│       ├── convertImage.ts       T-027: sharp-kääre (ainoa tiedosto, joka importtaa sharpin)
│       ├── importImages.ts       T-027: tiedostojärjestelmä + raportti
│       └── importImages.test.ts  T-027: väliaikaiskansio, sharpilla luodut pienet testikuvat
└── src/
    ├── domain/
    │   ├── cardImage.ts          T-027: CARD_IMAGE_WIDTH, CARD_IMAGE_ASPECT (vakiot)
    │   ├── cardFile.ts           CARD_FILE_FORMAT, CARD_FILE_VERSION, CardFile, parseCardFile, toCardFile
    │   └── cardFile.test.ts
    ├── data/
    │   ├── cards.json            GENEROITU (cards:update). Ei käsin muokata.
    │   ├── cards.ts              export const CARDS: readonly Card[]
    │   ├── cards.test.ts         parseCardFile(cards.json) onnistuu, ≥ 1 kortti, avaimet yksilöllisiä
    │   ├── cardImages.ts         T-027: getCardImage(key)
    │   └── cardImages.test.ts    T-027
    ├── assets/cards/             T-027: GENEROITU (cards:images)
    │   ├── sm/<key>.webp
    │   └── lg/<key>.webp
    ├── api/                      ENNALLAAN, vain scripts/ käyttää (D-013 osa 2)
    └── ui/
        ├── useCardCatalog.ts     POISTETAAN (+ testi)
        ├── CatalogView.tsx       props { cards, repositories }; lataus-, virhe-, osittainen ja tyhjä tila pois
        └── CardImage.tsx         T-027: kuva tai paikkamerkki (UX määrittää paikan)
```

### 13.3 Datatiedosto ja validointi (`src/domain/cardFile.ts`)

```ts
export const CARD_FILE_FORMAT = 'cyberdeck.cards';
export const CARD_FILE_VERSION = 1;
/** Upper bound for every text field, so a broken source cannot bloat the bundle. */
export const MAX_CARD_TEXT_LENGTH = 200;

export interface CardFile {
  format: typeof CARD_FILE_FORMAT;
  version: typeof CARD_FILE_VERSION;
  cards: Card[];
}

/** Builds the file object with a fixed key order (format, version, cards; Card fields in model order). */
export function toCardFile(cards: readonly Card[]): CardFile;

/**
 * Validates a parsed card file and returns the cards. Throws Error with a developer message
 * on the first problem. Rules:
 * - root is an object with exactly format === CARD_FILE_FORMAT, version === CARD_FILE_VERSION, cards: array (length ≥ 1)
 * - each card has exactly the Card fields (no extra fields), id/slug/name/displayName/type: non-empty strings,
 *   subname/color: non-empty string or null, cost: finite number or null, all strings ≤ MAX_CARD_TEXT_LENGTH
 * - key === cardKey(name, subname) and isCardKey(key)
 * - key and id unique across the file
 */
export function parseCardFile(json: unknown): Card[];
```

- Domain-kerros: ei riippuvuuksia (käyttää `cardKey.ts`:ää). Puhdas funktio, ei tiedostojärjestelmää.
- `src/data/cards.ts`:
  ```ts
  import type { Card } from '../domain/card';
  import file from './cards.json';
  /** All cards, bundled at build time (D-013). Validated by cards:update and cards.test.ts. */
  export const CARDS: readonly Card[] = file.cards;
  ```
  Jos `tsc` ei hyväksy JSON-tyypin sijoitusta `Card[]`:ksi (esim. `null`-kenttien päättely), Koodari käyttää yhtä `as Card[]` -muunnosta ja kommenttia, joka viittaa testiin. Ei ajonaikaista validointia.

### 13.4 Päivityskomento (`scripts/cards/updateCards.ts`)

```ts
export interface UpdateCardsDeps {
  fetchFn?: typeof fetch;                       // default globalThis.fetch; tests inject a fake
  readText: (path: string) => Promise<string | null>; // null when the file does not exist
  writeText: (path: string, text: string) => Promise<void>;
  log: (line: string) => void;
}
export type UpdateCardsResult =
  | { status: 'unchanged'; count: number }
  | { status: 'written'; count: number; diff: CardFileDiff }
  | { status: 'failed'; reason: string };        // file untouched

export const CARDS_JSON_PATH = 'src/data/cards.json';
export function serializeCardFile(file: CardFile): string; // JSON.stringify(file, null, 2) + '\n'
export async function updateCards(deps: UpdateCardsDeps): Promise<UpdateCardsResult>;
export async function main(): Promise<number>;   // node:fs/promises, console.log; returns exit code
```

Kulku: `fetchAllCards({ fetchFn })` → epäonnistuu, jos `skipped > 0`, `cards.length !== reportedTotal` tai tuloksessa on toistuva avain → `toCardFile(cards)` → `parseCardFile(JSON.parse(serializeCardFile(file)))` (kierros) → luetaan vanha tiedosto. Jos vanha on olemassa ja `parseCardFile` hyväksyy sen, lasketaan `diffCardFiles` ja raportoidaan. Rikkinäinen vanha tiedosto ei estä uuden kirjoittamista, mutta siitä tulee varoitus. Sama merkkijono → `unchanged`, muuten kirjoitus.

Raportin rivit (englanniksi, kehittäjän konsoli): `Cards: 151`, `Added (n): key, …`, `Removed (n): key, …  WARNING: saved collections may refer to these keys`, `Changed (n): key (fields), …`, `Wrote src/data/cards.json` tai `No changes`.

`scripts/cards-update.mjs`:
```js
import { runnerImport } from 'vite';
const { module } = await runnerImport('./scripts/cards/updateCards.ts', { configFile: false, logLevel: 'error' });
process.exitCode = await module.main();
```
(`root` on `process.cwd()`, joten komento ajetaan repon juuresta, kuten `npm run` tekee.)

### 13.5 Käyttöliittymän muutokset (T-026)

- `App`: `export function App({ cards = CARDS, repositories }: { cards?: readonly Card[]; repositories?: Repositories })`. Ei `useCardCatalog`ia. Testit antavat pienen korttilistan propsina kuten ennen `loadCatalog`ia.
- `CatalogView`: props `{ cards: readonly Card[]; repositories: Repositories }`. `toViewModel` sievenee valmiin listan tapaukseen: tilarivi näyttää korttimäärän heti, eikä `notice`a, `showRetry`tä, `missingCards`ia eikä latauspalkkia enää ole. Poistuvat tekstit (`loading`, `error*`, `partial*`, `retry`, `empty*`) poistetaan `texts.ts`:stä vain, jos mikään muu ei käytä niitä. `partialFilteredLive` ja muut suodatuksen tekstit säilyvät, jos niitä käytetään.
- Testit: lataus-, virhe-, uudelleenyritys- ja osittaisen tilan testit poistetaan, koska tila ei ole enää mahdollinen (rules.md 6: ei heikennetä, vaan poistuneen ominaisuuden testit poistuvat sen mukana, ja PM hyväksyy tämän D-013:lla). Lista-, suodatus- ja kokoelmatestit säilyvät ja saavat kortit propsina. Uusi testi: `App` ilman propsia renderöi `CARDS`-datan kortin heti (synkronisesti, ilman `findBy`/`waitFor`ia).
- Alatunnisteen lähdemaininta (`footerSource`, "Korttitiedot: Netdeck.gg") säilyy.

### 13.6 Kerrosrajan valvonta (ESLint)

- `src/ui/**`, `src/App.tsx`, `src/main.tsx`, `src/storage/**`, `src/data/**` ja `src/domain/**`: kielletään `**/api` ja `**/api/**` kokonaan (viesti: "The app uses bundled card data (src/data); src/api is only for scripts/ (D-013)."). Huomaa luvun 4 flat config -sääntö: kaikki `no-restricted-imports`-mallit samassa lohkossa per tiedostojoukko.
- `src/data/**`: kielletään lisäksi `react`, `**/ui`, `**/ui/**`, `**/storage`, `**/storage/**`.
- `scripts/**/*.{ts,mjs}`: `globals.node`. Skriptit saavat importata `src/api`n (vain `index.ts`), `src/domain`in ja `src/data`n.
- `src/api/**` testeineen säilyy lintin ja testien piirissä.

### 13.7 firebase.json

Molemmille sivustoille (`prod`, `test`), identtisinä (ARCH-003):
```json
"headers": [
  { "source": "**", "headers": [ { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" }, …muut SR-3:n otsakkeet ennallaan… ] },
  { "source": "/assets/**", "headers": [ { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" } ] }
]
```
Todennus esikatselussa: `curl -sI <esikatselu-URL>/assets/<jokin tiedosto>` näyttää sekä `Content-Security-Policy`- että `Cache-Control: public, max-age=31536000, immutable` -otsakkeen, ja `curl -sI <esikatselu-URL>/` näyttää CSP:n, jossa on `connect-src 'self'`. Jos CSP puuttuu asset-vastauksesta, CSP lisätään myös `/assets/**`-sääntöön, ja asiasta ilmoitetaan Digiturvalle.

### 13.8 Korttikuvat (T-027)

```ts
// src/domain/cardImage.ts (puhdas, myös skriptit importtaavat tämän)
/** Output widths in px; one place for UX to change (D-013 osa 4). */
export const CARD_IMAGE_WIDTH = { sm: 240, lg: 720 } as const;
export const CARD_IMAGE_ASPECT = 88 / 63;   // korkeus / leveys, korttiformaatti 63 × 88 mm (tarkistetaan kuvapaketista)

// src/data/cardImages.ts
export interface CardImage { small: string; large: string }
export function getCardImage(key: CardKey): CardImage | null;

// Toteutus:
const small = import.meta.glob<string>('../assets/cards/sm/*.webp', { eager: true, query: '?url', import: 'default' });
const large = import.meta.glob<string>('../assets/cards/lg/*.webp', { eager: true, query: '?url', import: 'default' });
// → Map<CardKey, CardImage>: avain = tiedostonimi ilman päätettä, vain jos isCardKey ja molemmat koot löytyvät.
```

```ts
// scripts/cards/matchImages.ts (puhdas, ei tiedostojärjestelmää)
export type MatchRule = 'map' | 'key' | 'slug' | 'name';
export interface ImageMatchReport {
  matched: { file: string; key: CardKey; rule: MatchRule }[];
  unmatched: { file: string; reason: 'no-match' | 'ambiguous' | 'conflict' | 'invalid-map-entry' }[];
  ignored: string[];              // hidden files, Thumbs.db, desktop.ini, non-image extensions
  missingCards: { key: CardKey; displayName: string }[];
}
export function matchImages(fileNames: readonly string[], cards: readonly Card[], map?: Readonly<Record<string, string>>): ImageMatchReport;

// scripts/cards/convertImage.ts (ainoa sharpia käyttävä tiedosto)
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
export async function convertImage(sourcePath: string, outputs: { sm: string; lg: string }): Promise<void>;
// sharp(source, { failOn: 'error' }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(...)
// (metatiedot jäävät pois oletuksena, koska withMetadata()-kutsua ei tehdä)

// scripts/cards/importImages.ts
export async function importImages(sourceDir: string, deps): Promise<{ exitCode: number; report: ImageMatchReport & { rejected: …; orphans: CardKey[] } }>;
```

- Hyväksytyt lähdemuodot: PNG, JPEG ja WebP (tunnistus sharpin `metadata().format`ista). Pääte vain esisuodattaa.
- `<CardImage card size="sm|lg">` (UX määrittää sijainnin ja alt-tekstin): `getCardImage(card.key)` → `<img src loading="lazy" decoding="async" width height alt>` tai paikkamerkki (`<span className="card-image card-image--missing" aria-hidden="true">`). `onError` vaihtaa paikkamerkkiin.
- Ennen kuvapakettia: `src/assets/cards/` puuttuu tai on tyhjä, ja `getCardImage` palauttaa aina `null` (kaikilla paikkamerkki). Testeissä Vitest tukee `import.meta.glob`ia. Yhdistämislogiikka testataan nimilistoilla, ja muunnos pienellä kuvalla, jonka sharp luo testissä (`sharp({ create: … })`). Oikeita korttikuvia ei commitoida testidataksi.

### 13.9 Kytkökset, jotka on pidettävä yhdenmukaisina

- `Card`-malli ↔ `parseCardFile`in kenttälista ↔ `toCardFile`n kenttäjärjestys. Uusi kenttä `Card`iin = kaikki kolme ja `cards.json` uudelleen (`cards:update`).
- `cardKey()` ↔ tallennetut avaimet ↔ kuvatiedostojen nimet. `cardKey`n muutos vaatii migraation (D-008 kohta 4) ja kuvien uudelleennimeämisen.
- `CARD_IMAGE_WIDTH` ↔ `convertImage`n leveydet (sama vakio `src/domain/cardImage.ts`:stä; skriptit eivät importtaa `src/data/cardImages.ts`:ää, koska siinä on Viten `import.meta.glob`).

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

### T-011 · Koodari 2026-10-01

Toteutus noudattaa lukua 12 ja luvun 4 T-011-kohtia. Poikkeamat ja tarkennukset perusteluineen. **Arkkitehti hyväksyi kaikki 2026-10-01 (ARCH-002-raportti) ja kirjasi ne lukuihin 4, 12.2, 12.6 ja 12.7.** Testimigraatioiden jatkotoimi on luvun 11 kohdassa 6 (ARCH-007).

- **Yksi aikaleima per kirjoitus:** `mutate` kutsuu `now()`:ia kerran, ja samaa arvoa käytetään kääreen `savedAt`-kenttään, pakan `createdAt`/`updatedAt`-kenttiin ja saman kirjoituksen varmuuskopioavaimeen. Näin arvot täsmäävät, ja testien kello on ennustettava.
- **Varmuuskopio myös korjatusta datasta** (laajennus 12.7:n kohtaan 3): jos luettu data oli kelvollista mutta siitä pudotettiin rivejä (`dropped > 0`), alkuperäinen raaka merkkijono kopioidaan varmuuskopioon ennen ensimmäistä päällekirjoitusta. Perustelu: muuten pudotetut rivit katoaisivat lopullisesti ensimmäisessä tallennuksessa (SR-11: ei tietojen menetystä). Seuraavalla kerralla data on jo ehjää, eikä uutta varmuuskopiota synny.
- **Varmuuskopioavaimen törmäys:** jos samalla millisekunnilla on jo varmuuskopio, avaimeen lisätään `:1`, `:2` jne. Varmuuskopio ei koskaan ylikirjoita toista.
- **Juuri kirjoitettua varmuuskopiota ei karsita koskaan**, vaikka kello olisi siirtynyt taaksepäin ja sen aikaleima olisi vanhin. Karsinta jättää kolme varmuuskopiota (uusi ja kaksi uusinta muuta). Karsinnan epäonnistuminen ei kaada kirjoitusta.
- **Testimigraatiot:** `RepositoryOptions.migrations` korvaa oletusketjun (tyhjä), ja silloin nykyinen versio on `migrations.length + 1` (`migrations[i]`: versio i+1 → i+2). Ilman testimigraatioita versio tulee `keys.ts`:stä. Kun ensimmäinen oikea migraatio tehdään, `keys.ts`:n versio nostetaan ja ketju lisätään `repositories.ts`:ään.
- **`remove` tuntemattomalla id:llä** ei kirjoita mitään (eikä tee varmuuskopiota). Yleisesti `mutate` ohittaa kirjoituksen, kun muutos palauttaa saman olion.
- **Pakan id:n törmäys** (`newId()` palauttaa jo käytetyn tai virheellisen id:n) → `StorageError('unavailable')`. Ei tapahdu `crypto.randomUUID()`:lla käytännössä, mutta olemassa olevaa pakkaa ei koskaan ylikirjoiteta.
- **Lisäapurit:** `RESERVED_OBJECT_KEYS` (`domain/cardKey.ts`), `compareCardKeys` (`domain/collection.ts`, koodiyksikköjärjestys, ei `localeCompare`ia, jotta järjestys on sama kaikissa selaimissa), `isRecord`, `isDeckId` (hylkää myös `__proto__`-, `constructor`- ja `prototype`-id:t) ja `EPOCH_TIMESTAMP` (`domain/validate.ts`) sekä `toStorageError` (`storage/errors.ts`, `QuotaExceededError` ja `NS_ERROR_DOM_QUOTA_REACHED` → `quota`, muut → `unavailable`).
- **Aikaleimat:** hyväksytään vain muoto `YYYY-MM-DDTHH:MM:SS(.sss)Z`, joka jäsentyy kelvolliseksi päivämääräksi. Se normalisoidaan `toISOString()`-muotoon. Muut → `1970-01-01T00:00:00.000Z`.
- **Merkkijonojen pituus** lasketaan UTF-16-koodiyksikköinä (`string.length`), kuten selaimen `maxlength`. Emoji voi viedä kaksi merkkiä 100 merkin rajasta.
- **`cleanText`** poistaa C0- ja C1-ohjausmerkit, myös DEL-merkin (U+007F). Rivinvaihto poistetaan eikä korvata välilyönnillä (luku 12.5).
- **ESLint:** `no-restricted-properties` kattaa `window`- ja `globalThis`-olioiden lisäksi `self`-olion. Tarkistettu kokeilutiedostoilla (poistettu): `src/ui/`:ssa `localStorage`, `window.localStorage`, `globalThis.sessionStorage`, `indexedDB` ja `../storage/repositories` antavat virheen, `src/domain/`:ssa `../storage` antaa virheen, `src/storage/`:ssa `../api` ja `../ui/...` antavat virheen, ja `src/ui/`:n `'../storage'`-tuonti sallitaan.
- **Testit:** `src/test/setup.ts` tyhjentää `localStorage`n jokaisen testin jälkeen. Jos testi mockaa `window.localStorage`-getterin, sen on palautettava mockit omassa `afterEach`issaan (esim. `vi.restoreAllMocks()`), koska `restoreMocks` palauttaa ne vasta ennen seuraavaa testiä. `cardKey.test.ts` lukee `docs/examples/esimerkkipakka.txt`:n Viten `?raw`-tuonnilla, joten testi seuraa esimerkkitiedostoa.

### T-010 · Koodari 2026-10-01

Haku ja suodatus (UX.md luku 5). Ei uusia riippuvuuksia, ei muutoksia rajapintakerrokseen eikä tietomalliin.

- **`src/domain/cardSearch.ts`** (uusi, puhdas, ei riippuvuuksia): `normalizeForSearch` (NFD, yhdistävien merkkien `\p{M}` ja näkymättömien muotoilumerkkien `\p{Cf}` poisto, pienet kirjaimet, välimerkit `\p{P}` välilyönneiksi, välilyöntien tiivistys; B-013, B-014), `filterCards` (hakusana pilkotaan sanoiksi, ja jokaisen sanan on löydyttävä `"{name} {subname}"`-merkkijonosta `includes`-vertailulla; pelkistä välimerkeistä koostuva hakusana = ei hakua; ryhmän sisällä TAI, ryhmät ja haku JA), `filterOptions` (tunnetut arvot kiinteässä järjestyksessä + tuntemattomat datasta ja valinnoista), `toggleValue`, `isFilterActive`. Ei säännöllisiä lausekkeita käyttäjän syötteestä, joten erikoismerkit ovat tavallista tekstiä (SR-1, ei ReDoS-riskiä).
- **`src/ui/CardFilters.tsx`** (uusi): esittävä lomake (`form role="search"`, hakukenttä `maxLength=100`, kaksi fieldsetiä). Esc ja Enter käsitellään `keydown`issa. IME-koostaminen tunnistetaan `isComposing`-lipusta.
- **`src/ui/CardColor.tsx`** (uusi): väri tekstinä + koristeellinen näyte. Käytössä taulukossa ja suodattimissa. Värien suomenkieliset nimet `texts.ts`:n `colorNames`-Mapissa (Map eikä objekti, jotta `"constructor"` tms. rajapinnan arvo ei osu prototyyppiin).
- **`src/ui/useDelayedAnnouncement.ts`** (uusi): live-alueen 750 ms:n hillintä. Ilmoitukset sidotaan `owner`-arvoon (`CatalogState`-olio). Kun tila vaihtuu (uudelleenyritys), odottava ajastin perutaan efektin purussa ja aiempi ilmoitus hylätään, joten latausviesti ei jää vanhentuneen tuloksen alle. Sama tulos (avain: tila + määrä) ei toistu. `Tyhjennä haku ja suodattimet` ilmoittaa aina heti (`force`). Jos haku tai valinta on käytössä tilan vaihtuessa, `CatalogView` yhdistää latausviestiin suodatuksen tuloksen (UX-002, K9). Tulos lasketaan tilan saapumishetken hakuehdoista (`loadedWith`-tila), jotta myöhemmät muutokset ilmoitetaan viiveellä eikä latausviestiä kirjoiteta uudelleen. Tuloksen avain on toistokiellon lähtökohta (`baseline`).
- **`CatalogView`**: hakutila (`criteria`) on `CatalogView`issa, joka pysyy asennettuna kaikissa tiloissa, joten haku ja valinnat säilyvät uudelleenyrityksen yli. Lomake renderöidään vain, kun ladattuja kortteja on vähintään yksi (myös OSITTAINEN ilman yhtään saatua korttia jää ilman lomaketta, koska suodatettavaa ei ole). `CardList` saa captionin propsina.
- **Testit:** `cardSearch.test.ts` (logiikka) ja `CatalogView.filters.test.tsx` (näkymä). Live-alueen testit käyttävät `fireEvent`iä ja Vitestin valeajastimia, koska user-event jumittuu valeajastimien kanssa (LESSONS L-002).

### T-012 · Koodari 2026-10-01

Kokoelmanäkymä (UX.md luku 6). Ei uusia riippuvuuksia, ei muutoksia tietomalliin. Käyttöliittymä käyttää vain `src/storage/index.ts`:n julkista rajapintaa (SR-12).

- **Tallennuskerroksen lisäys (A2, PM 2026-10-01):** `isStoragePersisted(): Promise<boolean>` (`keyValueStore.ts`, julkaistu `index.ts`:ssä). Vain-luku `navigator.storage.persisted()`, try/catch, muuten `false`. Ei koskaan kysy käyttäjältä, joten sen saa kutsua sivun latautuessa. `requestPersistentStorage` kutsutaan edelleen vain painikkeesta (SR-13).
- **`App`** avaa `openBrowserRepositories()`:n kerran (`useState`-alustus) ja antaa sen `CatalogView`lle propsina `repositories`. Testit antavat `createMemoryRepositories()`:n (tai sen kopion, jossa `persistent: true`).
- **`src/ui/collectionStore.ts`** (uusi, puhdas TS, ei Reactia): kokoelman tila `phase` (`loading` / `ready` / `locked` / `unavailable`), viimeksi tallennettu `Collection` (`saved`), tallentamattomat tavoitemäärät (`targets`) ja näkyvät ilmoitukset. Säännöt: näytöllä on uusin tavoitemäärä; tallennukset ovat peräkkäisiä, ja odottamaan jää vain kunkin kortin uusin tavoite (välissä olevia arvoja ei tallenneta); vanhempi vastaus ei poista uudempaa tavoitetta; epäonnistunut tallennus hylkää kaikki odottavat tavoitteet, joten näytöllä on viimeksi tallennettu kokoelma. `StorageError('newer-version')` tallennuksessa → `locked`. Toisen välilehden muutos (`subscribe`) ladataan uudelleen vasta, kun omat tallennukset ovat valmiit (ja hylätään, jos käyttäjä ehti painaa latauksen aikana). Tapahtumat `saved` / `save-failed` / `idle` / `external` ilmoituksia varten. `start`/`dispose` kestää StrictModen kaksoisajon (`generation`-laskuri).
- **`useCollection`** kytkee ohjaimen Reactiin (`useSyncExternalStore`). `repository`-viitteen on oltava vakaa.
- **`useCollectionAnnouncements`**: live-ilmoitukset UX.md 6.9:n mukaan. Sama `useDelayedAnnouncement`-ajastin kuin suodatuksessa (myöhempi korvaa aiemman). Hook sai valinnaisen viiveen, funktiona annettavan ilmoituksen (voi palauttaa `null`, jos tallennus on yhä kesken) ja `token()`-laskurin, josta näkee, onko joku muu ilmoittanut välissä. Painallussarja kootaan yhdeksi viestiksi alkutilasta lopputilaan ja vain viimeksi muutetusta kortista. Latauksen ilmoituslaatikot ilmoitetaan yhtenä viestinä 1,5 s latausviestin jälkeen (`useLoadNoticeAnnouncement`, kerran per lataus).
- **`CountControl`**: `+` on aina viimeinen lapsi, joten React säilyttää saman elementin, kun `−` ilmestyy tai katoaa. Fokus siirretään `+`:aan ennen kuin `−` poistuu (painallus) tai heti poiston jälkeen, jos `−` oli viimeksi fokusoitu ja fokus putosi `body`:yn (toisen välilehden päivitys).
- **`CardList`**: eksplisiittiset ARIA-roolit (`table`, `rowgroup`, `row`, `columnheader`, `rowheader`, `cell`), koska alle 40 rem:n korttiasettelu käyttää `display: grid`. Tyypin, värin ja hinnan välinen `·` on oikea `aria-hidden`-elementti (näkyy vain kapeassa asettelussa). "Hinta"-etuliite tulee CSS:stä `attr(data-label)`, jotta teksti pysyy `texts.ts`:ssä.
- **"Vain omistetut"** on `CatalogView`n tila (ei `CardFilterCriteria`n osa, koska se tarvitsee kokoelman määrät). Rivit, joiden määrä painettiin nollaan suodatuksen aikana, pidetään näkyvissä (`kept`-joukko), kunnes hakuehdot muuttuvat (A5).
- **Tunnetut rajoitteet:** jsdom ei tue CSS-asettelua, joten korttimaisen asettelun, 320 px:n ja zoomin tarkistus sekä axe-ajo jäävät UX-katselmointiin. Jokainen määrän muutos renderöi koko taulukon (noin 150 riviä); mittaus ja tarvittaessa `memo` vasta, jos se näkyy hitautena.

### T-026 · Koodari 2026-10-02

Korttidata sovelluksen mukana luvun 13 mukaan (D-013 osat 1–3). Ei uusia riippuvuuksia.

- **`src/domain/cardFile.ts`**: `toCardFile` (kiinteä kenttäjärjestys) ja `parseCardFile` (tarkat kentät, tyypit, tekstit 1–200 merkkiä, `key === cardKey(name, subname)`, uniikit avaimet ja id:t, ei tyhjää listaa, `format`/`version`). Heittää kehittäjälle tarkoitetun virheen.
- **`scripts/cards/updateCards.ts`** (+ `cardFileDiff.ts`): tiedostopääsy injektoidaan (`readText`/`writeText`/`log`, valinnainen `fetchFn`), joten testit eivät tarvitse levyä eikä verkkoa. Tulos `unchanged` / `written` / `failed`. `skipped > 0`, määrä ≠ `reportedTotal` tai toistuva avain → `failed`, eikä tiedostoa kirjoiteta. Kirjoitettava teksti validoidaan uudelleen ennen kirjoitusta. `scripts/cards-update.mjs` lataa TS-koodin Viten `runnerImport`illa.
- **`src/data/cards.ts`** vie `CARDS`-taulukon (`cards.json` importattuna, `resolveJsonModule`). Ajonaikaista validointia ei ole; `cards.test.ts` ajaa `parseCardFile`n bundlattavaan tiedostoon.
- **Käyttöliittymä:** `App` antaa `CatalogView`lle `cards`-propsin (oletus `CARDS`, testit antavat pienen listan). `useCardCatalog`, lataus-, virhe-, osittaisen ja tyhjän tilan näkymät, tekstit, latauspalkin CSS ja niiden testit poistettu (PM A2). Live-alue alkaa latausviestillä ensimmäisestä renderöinnistä.
- **ESLint:** sovelluskoodi (`src/ui`, `App`, `main`, `src/data`) ei saa importata `src/api`:a. `scripts/**/*.ts` käyttää vain sen julkista indeksiä. `scripts/**/*.mjs` saa Node-globaalit.
- **firebase.json:** `connect-src 'self'` ja `/assets/**` → `Cache-Control: public, max-age=31536000, immutable` molemmille sivustoille (13.7). Otsakkeiden yhdistyminen (CSP myös asset-vastauksessa) todennetaan esikatselussa `curl -sI`:llä.
- **Determinismi:** toinen `npm run cards:update` -ajo 2026-10-02 → `Cards: 151`, `No changes` (tiedosto tavu tavulta sama, myös järjestys).
- **Avainvertailu (D-008):** 151 korttia, 151 uniikkia avainta ja id:tä. `mapCard` ja `cardKey` eivät muuttuneet, ja `parseCardFile` tarkistaa jokaisen avaimen `cardKey(name, subname)`:ta vasten, joten avaimet ovat samat kuin rajapintakerroksen tuottamat.

### T-027 · Koodari 2026-10-02

Korttikuvat luvun 13.8 ja D-013:n osan 4 mukaan. Uusi devDependency `sharp@0.35.5` (PM hyväksyi, Digiturva katselmoi). Poikkeamat ja tarkennukset perusteluineen:

- **Map-tiedosto repossa:** `scripts/cards/card-images.map.json` (ei `<lähdekansio>/card-images.map.json`). Lähdekansio ei ole gitissä, joten korjaukset katoaisivat seuraavassa tuonnissa. Tiedosto validoidaan: pelkät tiedostonimet (ei `/`, `\`, `.`, `..`), arvot merkkijonoja, avaimen on oltava datassa (`isCardKey`). Virheellinen tiedosto → exit 1 ennen muunnosta.
- **Sääntö 3 (slug):** `normalizeCardName(tiedostonimi) === card.slug` (ei pelkkä pienennys). Käyttäjän paketti korvaa heittomerkin alaviivalla (`Royce_Don_t_Call_Me_Simon`), mikä vastaa Netdeckin slugia `don-t`. Osui 9 tiedostoon.
- **sharp `.mjs`-tiedostossa:** `scripts/cards/convertImage.mjs` (ei `.ts`). sharpin tyypit vaativat `@types/node`-paketin, jota projektissa ei ole. `importImages.ts` saa muuntimen injektiona, joten TypeScript-koodi ei tarvitse Node-tyyppejä (sama periaate kuin `cards-update.mjs`). Muunnin tunnistaa muodon sisällöstä (`metadata().format` ∈ png/jpeg/webp) ja kirjoittaa WebP:n laadulla 80 ilman metatietoja.
- **Koot:** `CARD_IMAGE_WIDTH = { sm: 160, lg: 720 }` (UX 240 → 160) ja `CARD_IMAGE_ASPECT = 1024 / 733` (mitattu paketista, ei 88/63). `cardImageHeight(size)` antaa img-elementin `height`-attribuutin (sm 224, lg 1006). CSS:n `aspect-ratio: 733 / 1024` on sama luku.
- **Tuonti ei poista mitään**, kuten D-013. Muunnoksessa epäonnistunut kuva raportoidaan hylättynä, ja sen kortti listataan kuvattomaksi. Exit 1 vain, jos kansiota ei ole, map on virheellinen tai yhtään kuvaa ei muunnettu.
- **`CardImage`** on vain listan pikkukuva (ei `size`-propsia): napin sisällä `alt=""`-kuva ja visually-hidden "Suurenna kuva: <nimi>". Iso kuva on `CardImageDialog`issa (natiivi `<dialog>`, `showModal`), koska sen alt-teksti, lataus (`eager`) ja virhetila (`role="alert"`) poikkeavat pikkukuvasta. Dialogissa ei ole sisäväliä, joten klikkaus itse `dialog`-elementtiin on klikkaus taustaan. Kaikki sulkutavat päättyvät `close`-tapahtumaan, ja `CatalogView` palauttaa fokuksen avanneeseen nappiin tai hakukenttään.
- **Testit:** jsdomissa ei ole `showModal`ia, joten `src/test/setup.ts` lisää minimaalisen korvikkeen. `convertImage.test.mjs` luo pienen kuvan sharpilla ja lukee tulosteet puskurina (sharpin tiedostovälimuisti lukitsee tiedostot Windowsissa). `App.test.tsx`:n "never shows images" korvattiin testillä, joka sallii vain sovelluksen omat kuvat (D-012 toi kuvat laajuuteen).
