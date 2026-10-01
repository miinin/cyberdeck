# ARCH-001 · T-001:n arkkitehtuurikatselmointi (kävelevä luuranko)

**Katselmoija:** Arkkitehti · **Päivä:** 2026-10-01 · **Tehtävä:** T-001 · **Haara:** `t-001-kaveleva-luuranko` (HEAD b0e1916)
**Katselmoitu:** `git diff origin/test...HEAD` (40 tiedostoa), painopisteenä `src/api/`, `src/ui/useCardCatalog.ts`, `src/App.tsx`, `src/main.tsx`, `eslint.config.js`, `tsconfig.json`, `vite.config.ts`, `package.json`, `firebase.json` ja `.github/workflows/`. Vertailukohta: `docs/ARCHITECTURE.md` (luvut 1–11) ja D-005.
**Ajettu itse:** `npx vitest run` 71/71 läpi, `npx eslint . --max-warnings 0` 0 virhettä. Viten oletuskohde tarkistettu tiedostosta `node_modules/vite/dist/node/chunks/node.js`.

## Yhteenveto ja veto-päätös

**Veto: ei.** Rakenne noudattaa ARCHITECTURE.md:tä: kerrokset `ui → api → domain`, `api/index.ts` ainoa julkinen rajapinta (ESLint valvoo, myös `src/main.tsx`), `domain/` ilman riippuvuuksia, raakadata `unknown`-tyyppinä ja vain `api/` tuntee Netdeck.gg:n URL:n ja kenttänimet. Tietomalli (`Card`) on täsmälleen suunniteltu, eikä kuvia, `printings`-tietoja tai sääntötekstejä vuoda malliin. Riippuvuudet vastaavat D-005:n lukittuja versioita, eikä uusia ajonaikaisia riippuvuuksia ole (vain react ja react-dom). Ei maksullisia palveluita eikä uutta lukittautumista (Firebase Hosting Spark, staattinen `dist/`).

Ei Critical- eikä High-löydöksiä. Löydökset ovat Low-tasoa. Yksi (ARCH-001) korjattiin tässä katselmoinnissa dokumentaatioon, muut menevät backlogiin tai ovat jo velkatehtävissä.

## Koodarin poikkeamat

### Poikkeama 1 · Oma `AbortController` + `setTimeout` `AbortSignal.any`/`AbortSignal.timeout`-yhdistelmän sijaan · **Hyväksytty**
- Perustelu pitää ja on vahvempi kuin Koodari kirjasi: Vite 8:n oletuskohde (`build.target`, baseline-widely-available) on `chrome111`, `edge111`, `firefox114`, `safari16.4`, `ios16.4`. `AbortSignal.any` tuli Safariin versiossa 17.4 ja Firefoxiin versiossa 124. Vite ei lisää polyfillejä, joten suunnitelman 5.4 mukainen toteutus olisi kaatunut osassa kohdeselaimia. Suunnitelma oli tässä kohdassa virheellinen, ja poikkeama korjaa sen.
- Toteutus on oikein: ajastin tyhjennetään ja kuuntelija poistetaan `finally`-lohkossa, kutsujan peruutus välitetään sellaisenaan (hook ohittaa sen), aikakatkaisu kattaa myös rungon lukemisen, ja `timedOut`-lippu erottaa aikakatkaisun peruutuksesta riippumatta virheen nimestä. Muut käytetyt API:t (`throwIfAborted`, `Error`-olion `cause`) ovat kohdeselaimissa tuettuja.
- ARCHITECTURE.md 5.4 ja 5.5 päivitetty. Lisätty sääntö: selaimen API:t valitaan Viten oletuskohteen mukaan.

### Poikkeama 2 · Enintään 3 rinnakkaista sivuhakua (`MAX_CONCURRENT_REQUESTS = 3`) rajattoman `Promise.all`in sijaan · **Hyväksytty**
- Perustelu: SR-5 ja D-006 (rajapintaa kutsutaan maltillisesti). Nykyisellä datalla (151 korttia, 2 jäljellä olevaa sivua) raja ei hidasta latausta. Raja estää 20 rinnakkaista pyyntöä, jos `total` kasvaa tai on virheellinen (`MAX_PAGES = 20`).
- Toteutus on yksinkertainen työjono (`min(3, sivuja)` työntekijää, jaettu `next`-indeksi, yksisäikeisessä JS:ssä kilpailutilanteeton). Sivujen järjestys säilyy (`pages[index]`). Epäonnistuminen tai tyhjä sivu estää uusien pyyntöjen aloittamisen. `Promise.all` liittää käsittelijät kaikkiin työntekijöihin, joten myöhemmät hylkäykset eivät jää käsittelemättä. Testit kattavat rajan (`maxInFlight`) ja pysähtymisen.
- ARCHITECTURE.md 5.2 ja 5.3 päivitetty.

### Muut toteutuksen tarkennukset (Koodarin listassa) · **Hyväksytty**
`offset`-tarkistus (SR-5), tyhjä ensimmäinen sivu lopettaa haun, `referrerPolicy: 'no-referrer'` (SR-4), `mapCard`-funktion merkkijonojen trimmaus, tilojen valinta `CatalogView`:n `toViewModel`-funktiossa (PM:n päätös) ja `firebase.json`:n otsakkeet. Mikään ei riko kerrosrajaa eikä muuta julkista rajapintaa. Live-alueen poikkeama kuuluu UX:lle.

## Tarkistuslista (agents.md, Arkkitehti)

- [x] Noudattaa ARCHITECTURE.md:n rakennetta ja vastuunjakoa: ei kerrosten ohituksia eikä kehäriippuvuuksia. `CardCatalog` määritellään `api/`:ssa ja `ui/` tuo sen `api/index.ts`:n kautta, kuten 5.2 ja 7 määrittävät.
- [x] Uudet riippuvuudet perusteltu ja kirjattu (D-005, kortin SR-6-taulukko). Ei poikkeamia lukituista versioista.
- [x] Tietomalli: ei pysyvää dataa, joten yhteensopivuutta tai migraatiota ei tarvita. `Card` sisältää MVP-1:n tarvitsemat yksilöivät kentät (`id`, `slug`, `displayName`).
- [x] Ei tarpeetonta abstraktiota: ei tilanhallintakirjastoa, reititintä, validointikirjastoa eikä yleishakemistoja. `fetchFn`- ja `load`-injektiot ovat testattavuuden vaatimia ja pieniä.
- [x] Konfiguraatio erillään koodista: rajapinnan osoite on yksi vakio, ympäristökohtaisia arvoja ei ole koodissa, ja sivustojen asetukset ovat `firebase.json`:ssa ja workflowissa.
- [x] Kustannukset: Spark, ei Firebase-tietokantaa eikä SDK:ta. Netdeck.gg:lle 3 pyyntöä latausta kohden. Välimuisti on T-003.

## Löydökset

### ARCH-001 · ARCHITECTURE.md ei vastannut toteutusta · Low
**Sijainti:** docs/ARCHITECTURE.md luvut 3, 5.2–5.5, 7 ja 9 · **Tehtävä:** T-001
**Toistaminen:** 1) Lue 5.4 (`AbortSignal.any`) ja 9 ("`firebase.json` ei muutu"). 2) Vertaa tiedostoihin `src/api/netdeckClient.ts` ja `firebase.json`.
**Odotettu:** Suunnitteluosa kuvaa hyväksytyn rakenteen · **Havaittu:** Poikkeamat olivat vain Koodarin toteutusosassa. Suunnitteluosa ohjasi edelleen käyttämään `AbortSignal.any`:a, joka ei toimi kohdeselaimissa.
**Vaikutus:** Seuraava toteuttaja voisi "korjata" koodin takaisin suunnitelman mukaiseksi ja rikkoa sen Safari 16.4–17.3:ssa ja Firefox 114–123:ssa.
**Korjausehdotus:** Päivitä luvut 3, 5.2, 5.3, 5.4, 5.5, 7, 9 ja 11 (vanhat kohdat yliviivattuina, rules.md 5.2).
**Tila:** Avoin → Korjattu (Arkkitehti 2026-10-01, ARCHITECTURE.md, ei commitoitu: PM commitoi) → Varmistettu (Arkkitehti 2026-10-01)

### ARCH-002 · Jo lähteneitä pyyntöjä ei peruuteta, kun sivu epäonnistuu · Low
**Sijainti:** src/api/netdeckClient.ts, `fetchRemainingPages` · **Tehtävä:** T-001
**Toistaminen:** 1) `total` = 300, sivu offsetilla 60 palauttaa HTTP 500. 2) Pyynnöt offseteille 120 ja 180 ovat jo käynnissä.
**Odotettu:** Keskeneräiset pyynnöt peruutetaan · **Havaittu:** Ne valmistuvat taustalla (enintään 2 pyyntöä, enintään 15 s), ja tulos hylätään.
**Vaikutus:** Turha kaistankäyttö (noin 465 kt pyyntöä kohden) ja rajapinnan kuormitus virhetilanteessa. Ei näy käyttäjälle eikä vaikuta oikeellisuuteen.
**Korjausehdotus:** Sisäinen `AbortController` `fetchRemainingPages`-funktiossa: välitetään sen signaali `fetchPage`-funktiolle kutsujan signaalin rinnalla (sama kuuntelijamalli kuin aikakatkaisussa) ja peruutetaan se ensimmäisestä virheestä. Huolehdi, että peruutetun pyynnön virhe ei korvaa alkuperäistä virhettä.
**Tila:** Avoin → jo kirjattu velaksi T-006 (Could). Ei vaadi toimenpiteitä T-001:ssä.

### ARCH-003 · `firebase.json`:n otsakkeet ovat kahdessa kopiossa ja CSP on kytketty rajapinnan osoitteeseen ilman tarkistusta · Low
**Sijainti:** firebase.json (lohkot `prod` ja `test`), src/api/netdeckClient.ts (`NETDECK_CARDS_URL`) · **Tehtävä:** T-001
**Toistaminen:** 1) Muuta CSP:tä vain toisessa lohkossa tai vaihda `NETDECK_CARDS_URL` toiseen originiin. 2) `npm test`, `npm run lint` ja `npm run build` menevät läpi.
**Odotettu:** Ristiriita huomataan ennen julkaisua · **Havaittu:** Testisivusto ja tuotanto voivat erota toisistaan huomaamatta, tai uusi rajapinnan osoite estetään selaimessa vasta julkaisun jälkeen (virhetila kaikille käyttäjille).
**Vaikutus:** Testisivusto ei silloin todenna tuotannon käyttäytymistä (D-003:n tarkoitus). Rajapinnan vaihto on PROJECT.md:ssä tunnistettu riski.
**Korjausehdotus:** Pieni Vitest-testi, joka lukee `firebase.json`:n ja varmistaa, että (a) prod- ja test-lohkojen `headers` ovat identtiset ja (b) CSP:n `connect-src` sisältää `new URL(NETDECK_CARDS_URL).origin`:n. Vaihtoehto on generoida `firebase.json` skriptillä, mutta se on raskaampi. Testi riittää. Toteutetaan T-004:n (testit CI:hin) yhteydessä tai omana pienenä velkatehtävänään.
**Tila:** Avoin → ehdotus PM:lle (backlog). Kirjattu ARCHITECTURE.md:n lukuihin 9 ja 11.

### ARCH-004 · `useCardCatalog(load)`: epävakaa `load`-funktio käynnistäisi latauksen jatkuvasti uudelleen · Low
**Sijainti:** src/ui/useCardCatalog.ts (efektin riippuvuus `[load, attempt]`) · **Tehtävä:** T-001
**Toistaminen:** 1) Kutsu `<App loadCatalog={(s) => fetchAllCards({ signal: s })} />` komponentista, joka renderöidään uudelleen. 2) Jokainen renderöinti peruuttaa latauksen ja aloittaa uuden.
**Odotettu:** Lataus käynnistyy vain kerran ja retry-painikkeesta · **Havaittu:** Nykyinen koodi on oikein, koska `App` saa propsin vain testeissä ja oletus on moduulitason vakio. Sopimusta ei kuitenkaan ollut kirjattu.
**Vaikutus:** MVP-1:ssä (esim. välimuisti, T-003) helppo virhe, joka aiheuttaa ylimääräisiä pyyntöjä rajapintaan.
**Korjausehdotus:** Sopimus kirjattu ARCHITECTURE.md:n lukuun 7 (`load` on vakaa viite). Koodimuutosta ei tarvita nyt. Jos hook saa myöhemmin parametreja, harkitse `useRef`-mallia tai `load`-funktion poistamista riippuvuuksista.
**Tila:** Avoin → Korjattu dokumentaatioon (Arkkitehti 2026-10-01) → Varmistettu.

### ARCH-005 · `MAX_PAGES` on kova katto, jonka ylitys kaataa koko latauksen · Low
**Sijainti:** src/api/netdeckClient.ts, `remainingOffsets` · **Tehtävä:** T-001
**Toistaminen:** 1) `total` = 1300, `limit` = 60 → 22 sivua. 2) `fetchAllCards` heittää `invalid-response`.
**Odotettu:** Kasvava korttimäärä ei riko sovellusta · **Havaittu:** Yli 1200 kortin jälkeen käyttäjä näkee virhetilan. Nykyään kortteja on 151, joten raja on noin 8-kertainen.
**Vaikutus:** Ei vaikutusta MVP-0:ssa eikä lähiaikoina. Katto on tietoinen suoja (SR-5), mutta sen ylitys näkyy käyttäjälle virheenä.
**Korjausehdotus:** Ei muutosta nyt. Katto tarkistetaan välimuistin ADR:ssä (T-003) tai kun korttimäärä ylittää 600 (kirjattu ARCHITECTURE.md:n lukuun 5.3).
**Tila:** Avoin → seurannassa (ei tehtävää).

### Huomio (ei löydös) · Testityypit näkyvät sovelluskoodille
`tsconfig.json`:n `types` sisältää `vitest/globals`-tyypit, joten sovelluskoodi voisi tyyppitarkistuksen puolesta käyttää `describe`- tai `vi`-globaaleja ja kaatua vasta ajossa. ESLint ei salli niitä sovelluskoodissa (globals vain testitiedostoille), joten riski on pieni. Velka on jo T-006:ssa.

## Myönteiset havainnot
- Kerrosraja on valvottu koneellisesti, ja Koodari todensi säännön väliaikaisella tiedostolla.
- `src/test/setup.ts` estää oikeat verkkokutsut kaikissa testeissä.
- `fetchFn`-oletus kutsuu `globalThis.fetch`-funktiota laiskasti, joten testien esto toimii myös moduulitason oletuksen kanssa.
- Virheluokittelu on keskitetty (`classifyRequestError`), eikä käyttäjälle päädy teknistä tietoa (`kind` → `texts.ts`).
- Workflowjen oikeudet on rajattu, ja `repoToken` on poistettu live-julkaisuista. Arkkitehtuurin kannalta kunnossa, tarkempi arvio Digiturvalla (SR-8, SR-9).
