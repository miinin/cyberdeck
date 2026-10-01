# T-001 · Kävelevä luuranko: korttilista rajapinnasta näytölle
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 0 · **Prioriteetti:** Must
**Suunnittelu:** Arkkitehti ☐ (teknologia ja rakenne, ADR) · Digiturva ☐ (ulkoinen rajapinta, korttikuvien käyttöoikeus) · UX ☐ (korttilistan näkymä ja tilat)
**Katselmoinnit:** Koodikatselmointi ☑ · Arkkitehti ☑ · Digiturva ☑ · UX ☑ · Sisällöntuottaja ☑ · Testikäyttäjä ☑ · Dokumentoija ☑
**Riippuvuudet:** T-000 (Done). Julkaisuputken workflowt ovat jo haarassa `t-001-kaveleva-luuranko`.
**Haara:** `t-001-kaveleva-luuranko`

## Tavoite
Rakennetaan ohut päästä päähän toimiva versio: sovellus hakee Cyberpunk TCG:n kortit Netdeck.gg:n julkisesta rajapinnasta ja näyttää ne listana. Samalla todennetaan, että build, testit ja julkaisuputki (PR → esikatselu-URL → test) toimivat. Kaikki MVP-1:n työ rakentuu tämän päälle.

## Hyväksymiskriteerit
- [ ] Teknologia- ja rakennepäätös on kirjattu ADR:ksi DECISIONS.md:hen ja ARCHITECTURE.md:hen. Päätöksessä on vähintään kaksi vaihtoehtoa, ja build tuottaa `dist/`-kansion, jota workflowt odottavat.
- [ ] `npm ci`, `npm run build`, `npm test` ja `npm run lint` menevät läpi puhtaasta kloonista. Ajo-ohje on STATUS.md:ssä.
- [ ] Sovellus näyttää kaikki rajapinnan kortit (kaikki sivut, ei vain ensimmäiset 60) nimellä, tyypillä ja hinnalla. Korttimäärä vastaa rajapinnan `total`-kenttää.
- [ ] Näkymässä on lataus-, virhe- ja tyhjä tila. Kun rajapinta ei vastaa, käyttäjä näkee ymmärrettävän virheilmoituksen eikä teknistä tietoa.
- [ ] Rajapintakutsut on eristetty omaan kerrokseensa (PROJECT.md:n riski), ja kerroksella on yksikkötestit, jotka eivät kutsu oikeaa rajapintaa.
- [ ] PR testiin tuottaa toimivan esikatselu-URL:n, ja yhdistäminen testiin päivittää testisivuston https://cyberdeck-tcg-test.web.app.

### Turvavaatimukset (Digiturva, tarkemmin docs/SECURITY.md kohta 6)
- [ ] **SR-1:** Rajapinnan data tulostetaan vain tekstinä. Ei `innerHTML`/`insertAdjacentHTML`/`dangerouslySetInnerHTML`/`v-html`/`eval`-käyttöä, ja lint-sääntö estää ne. Yksikkötesti: nimi `<img src=x onerror=alert(1)>` näkyy kirjaimellisena tekstinä.
- [ ] **SR-2:** `firebase.json`issa on molemmille sivustoille CSP ilman `unsafe-inline`- ja `unsafe-eval`-lähteitä (`connect-src 'self' https://api.netdeck.gg`, `img-src 'self' data:`). Esikatselussa ei CSP-virheitä konsolissa.
- [ ] **SR-3:** Otsakkeet `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy` (camera, microphone, geolocation, payment, usb pois) ja `Cross-Origin-Opener-Policy: same-origin`.
- [ ] **SR-4:** Rajapinnan osoite on vakiona yhdessä paikassa. `fetch`: `credentials: 'omit'` ja `referrerPolicy: 'no-referrer'`. Vastauksen muoto tarkistetaan, ja virheellinen kortti ohitetaan.
- [ ] **SR-5:** Aikakatkaisu 10–15 s per pyyntö ja enintään yksi uusintayritys. Sivutuksella on kova yläraja, ja se pysähtyy tyhjään sivuun tai `offset`iin, joka ei kasva. Yksikkötestit: aikakatkaisu, HTTP 500, virheellinen JSON ja `total` > todellinen määrä.
- [ ] **SR-6:** Uudet suorat riippuvuudet kirjataan korttiin (versio, lisenssi, ylläpito, perustelu). `package-lock.json` commitoidaan. `npm audit --audit-level=high` ei löydä High- tai Critical-haavoittuvuuksia tuotantoriippuvuuksista.
- [ ] **SR-7:** Build ei hae mitään verkosta (ei etäfontteja, CDN:ää tai analytiikkaa).
- [ ] **SR-8:** Jokaisessa workflowssa on `permissions`-lohko. `preview.yml`:n fork-ehto säilyy, ei `pull_request_target`-triggeriä, eikä `run:`-komennoissa käytetä käyttäjän syötettä.
- [ ] **SR-9:** Muutokset hakemistoon `.github/workflows/`, `firebase.json`iin ja `.firebaserc`:hen menevät Digiturvan katselmointiin.
- [ ] **SR-10:** Ei salaisuuksia repossa tai lokeissa. Firebase JS SDK:ta ei käytetä MVP-0:ssa.
- [ ] Korttikuvia ei näytetä, ladata eikä kopioida (R-1).
- [ ] Sivun alaosassa on epävirallisuusmerkintä ja lähdemaininta (Netdeck.gg). Tekstin muotoilee Sisällöntuottaja.

## Rajaukset (ei kuulu tähän)
- Kokoelman merkintä, pakat ja haku (MVP-1)
- Pakkalistan tuonti (MVP-1)
- Korttikuvat, jos niiden käyttöoikeus ei ole selvillä. Tekstipohjainen lista riittää MVP-0:aan.
- Välimuisti tai offline-tila (Arkkitehti voi kirjata sen tulevaksi tehtäväksi)

## Työloki
### Checkpoint 2026-09-30 · PM
- Tehty: PROJECT.md hyväksytty (D-004), kortti määritelty, tila Ready.
- Seuraava askel: Arkkitehti tekee teknologia- ja rakennepäätöksen. UX ja Digiturva suunnittelevat rinnakkain.
- Avoimet kysymykset: `gh`-työkalu puuttuu PM:n ympäristöstä, mikä estää PR:n avaamisen (käyttäjä). → ratkaistu, katso checkpoint alla.

## Luovutukset
### Luovutus 2026-09-30 · UX Designer → Koodari
- Mitä tehtiin: `docs/UX.md` luotiin. Luvuissa 1–3 ovat design-järjestelmän minimitaso (periaatteet, tokenit vaalealle ja tummalle tilalle, typografia, välistys ja komponentit). Luvussa 4 on korttilistan näkymämäärittely: polku, rautalanka, taulukko (Nimi, Tyyppi, Hinta) ja viisi tilaa (lataus, onnistuminen, tyhjä, virhe ja osittainen) tarkkoine teksteineen, fokus, live-alue, responsiivisuus 320 px:stä ylöspäin ja saavutettavuustarkistuslista (4.9).
- Mitä pyydän: Koodari toteuttaa näkymän UX.md:n luvun 4 mukaan ja käyttää luvun 3 tokeneita. Rajapintakerroksen pitää erottaa tilat onnistuminen, tyhjä, virhe ja osittainen (osa sivuista epäonnistui tai kortteja saatiin vähemmän kuin `total`). Sovelluksen pitää päästä pois lataustilasta (ehdotus: aikakatkaisu 15 s per pyyntö).
- Mistä katsoa: `docs/UX.md`, luvut 3 ja 4.
- Tunnetut rajoitteet ja riskit: Sarakkeen nimi "Hinta" ja englanninkieliset korttityypit ovat alustavia. Alatunnisteen lähdemaininta on avoinna. Avoimet kysymykset K1–K4 ovat PM:llä.
- Testit: Kontrastisuhteet laskettiin WCAG 2.x -kaavalla, ja kaikki täyttävät AA-tason. Sovellusta ei vielä ole.

### Luovutus 2026-09-30 · Digiturva → PM, Koodari
- Mitä tehtiin: Luotiin `docs/SECURITY.md`: MVP-0:n uhkamalli (STRIDE, luottamusrajat), turvavaatimukset SR-1–SR-10, korttikuvien ja -datan käyttöoikeusarvio ja avoimet riskit R-1–R-7. Rajapinta tarkistettiin vain lukemalla (curl): total 151, sivu enintään 100, CORS sallii kaikki sivustot ja evästeet. Git-historiasta ei löytynyt salaisuuksia.
- Mitä pyydän: PM lisää SR-vaatimukset hyväksymiskriteereiksi (tehty) ja vie avoimet kysymykset (R-1, R-2, R-4) käyttäjälle. Koodari toteuttaa vaatimukset (CSP ja otsakkeet firebase.jsoniin, workflowjen permissions-lohkot) ja kirjaa riippuvuudet korttiin. Toteutuksen jälkeen Digiturva katselmoi (SEC-raportti, npm audit).
- Mistä katsoa: `docs/SECURITY.md`, kohdat 6 (vaatimukset), 7 (käyttöoikeus) ja 9 (riskit).
- Tunnetut rajoitteet ja riskit: Korttien käyttöehdot ovat epävarmat. Netdeck.gg:n käyttöehtoja ei löytynyt, ja cyberpunktcg.com kieltää scrapingin. Kuvat jätetään pois. Julkaisuavain on kaikkien workflowjen käytössä (R-4). Henkilötietoja ei MVP-0:ssa ole, joten PRIVACY.md luodaan MVP-1:ssä.
- Testit: ei koodia vielä. npm auditia ei voitu ajaa (ei package.jsonia).

### Checkpoint 2026-09-30 · PM (käyttäjän vastaukset)
- Korttikuvat (R-1): käyttäjä tuo kuvat käyttöön myöhemmin itse. T-001 pysyy tekstipohjaisena.
- Korttidata (R-2): käyttäjä hyväksyi, että korttidata haetaan Netdeck.gg:n rajapinnan kautta. PM kirjaa päätöksen DECISIONS.md:hen, kun Arkkitehdin ADR on valmis.
- `gh`: oli jo asennettu ja kirjautunut (miinin), mutta ei istunnon PATHissa. Käytä polkua `C:\Program Files\GitHub CLI\gh.exe`, kunnes VS Code käynnistetään uudelleen. Blokkeri poistettu.
- K1 ja K2 (UX): käyttäjä ei vielä vastannut. Edetään UX.md:n oletuksilla ("Hinta", tyypit englanniksi). Kyse on tekstimuutoksesta, jonka voi vaihtaa myöhemmin.
- R-4 (julkaisuavain): avoin, ei blokkaa T-001:tä.
- R-4 PM:n ehdotus käyttäjälle: prod ja test ovat samassa Firebase-projektissa, joten mikä tahansa avain, jolla voi julkaista testiin, voi julkaista myös tuotantoon. GitHubin asetus ei poista riskiä. Varsinainen korjaus on erillinen Firebase-projekti testille (D-003 vaihtoehto C), joka tehdään joka tapauksessa, kun sovellus alkaa tallentaa dataa. Siihen asti riski pysyy Mediumina, koska repoon pääsevät vain käyttäjä ja agentit ja fork-PR:t on estetty.

### Luovutus 2026-09-30 · Arkkitehti → Koodari
- Mitä tehtiin: Teknologia- ja rakennepäätös D-005 (Vite 8 + React 19 + TypeScript 6, Vitest 5 + jsdom 29 + Testing Library, ESLint 10) ja `docs/ARCHITECTURE.md`. Toolchain ja versiot todennettiin yhteensopiviksi scratchpadissa (asennus, jsdom-testi, tsc, eslint, vite build → dist/, npm audit 0).
- Mitä pyydän: Toteutus ARCHITECTURE.md:n lukujen 3–9 mukaan: hakemistot ja moduulit, `fetchAllCards`, `mapCard`, `CardApiError`, `useCardCatalog`, npm-skriptit, tarkat riippuvuusversiot (luku 7 / D-005) ja pakolliset testit (luku 8). Kerrosraja valvotaan ESLintin `no-restricted-imports`-säännöllä.
- Mistä katsoa: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` D-005.
- Tunnetut rajoitteet ja riskit: Lataus on noin 1,4 Mt ja noin 4–6 s ilman välimuistia (T-003). Testit eivät ole CI:ssä (T-004). Lintissä ei ole saavutettavuussääntöjä (T-005, UX:n axe-ajo korvaa). TypeScript 7 ja jsdom 30 eivät käy (typescript-eslint, Node 24.14).
- Testit: Sovelluskoodia ei kirjoitettu. Toolchain-kokeilu scratchpadissa meni läpi.

### Checkpoint 2026-09-30 · PM (suunnittelu valmis, päätökset)
- D-005 hyväksytty (PM). D-006 kirjattu (käyttäjä: data rajapinnasta, kuvat myöhemmin).
- **Ristiriita UX ↔ Arkkitehti ratkaistu (PM):** Jos yksikin sivu epäonnistuu, näytetään VIRHE-tila ja Yritä uudelleen (Arkkitehti, yksinkertaisempi). UX:n OSITTAINEN-tila näytetään, kun kaikki sivut onnistuivat mutta näytettäviä kortteja on vähemmän kuin `total` (esim. `mapCard` ohitti virheellisiä kortteja, `skipped` > 0). Automaattisia uusintayrityksiä ei tarvita (SR-5 sallii enintään yhden). Käyttäjä voi yrittää uudelleen painikkeesta.
- "Hinta" = pelin sisäinen kustannus (`cost`), ei raha. Sarakkeen nimi on UX.md:n mukainen ("Hinta"), ja käyttäjä voi muuttaa sen myöhemmin (K1).
- Turvallisuusotsakkeet (Arkkitehdin K3): Digiturva vaatii ne (SR-2, SR-3), joten Koodari lisää ne `firebase.json`iin.
- Korttien järjestys (Arkkitehdin K4): rajapinnan järjestys riittää MVP-0:aan. Muut K4:n kohdat on määritelty UX.md:ssä.
- K5 (seurataanko kokoelmassa kortteja vai painoksia) on MVP-1:n tuotekysymys käyttäjälle. Se ei estä T-001:tä.
- Jatkotehtävät kirjattu: T-003, T-004, T-005.
- Seuraava askel: Koodari toteuttaa.

### Suunnitelma 2026-09-30 · Koodari
1. Projektin runko: package.json (tarkat versiot D-005), .npmrc, tsconfig, vite.config.ts, eslint.config.js (kerrosraja + SR-1-säännöt), index.html, testien setup (verkon esto). Build → dist/.
2. domain/card.ts ja api/: errors, mapCard, netdeckClient (sivutus, aikakatkaisu, validointi) + yksikkötestit (ARCHITECTURE luku 8, SR-4, SR-5).
3. ui/: texts.ts, useCardCatalog, CardList, CatalogView (tilat UX.md 4.5 + PM:n ratkaisu VIRHE/OSITTAINEN), App, styles.css (tokenit) + testit (SR-1 XSS-testi).
4. firebase.json: CSP ja turvallisuusotsakkeet (SR-2, SR-3). Workflowt: permissions-lohkot (SR-8).
5. Koodikatselmointi, audit, ajo-ohje STATUS.md:hen, ARCHITECTURE.md:n toteutusosa, luovutus, PR.

### Riippuvuudet (SR-6) · Koodari 2026-09-30
Kaikki versiot on lukittu tarkasti (`.npmrc` `save-exact=true`, ei `^` eikä `~`), ja `package-lock.json` on commitoitu. Versiot noudattavat D-005:tä. Ylläpito: jokainen paketti on npm-rekisterin uusin versio (`latest`) 2026-09-30, paitsi TypeScript (uusin 7.0.2) ja jsdom (uusin 30.1.1), jotka on rajattu D-005:n perusteella. Ei `preinstall`-, `install`- eikä `postinstall`-skriptejä (`npm query ':attr(scripts, [postinstall])'` ym. tyhjä). `npm audit --audit-level=high`: 0 haavoittuvuutta (myös `--omit=dev`: 0).

| Paketti | Versio | Tyyppi | Lisenssi | Perustelu |
|---|---|---|---|---|
| react | 19.3.0 | tuotanto | MIT | Käyttöliittymä (D-005) |
| react-dom | 19.3.0 | tuotanto | MIT | Reactin DOM-renderöinti |
| vite | 8.3.1 | kehitys | MIT | Build ja kehityspalvelin → `dist/` |
| @vitejs/plugin-react | 6.1.1 | kehitys | MIT | JSX Vitessä |
| typescript | 6.0.3 | kehitys | Apache-2.0 | Tyyppitarkistus (TS 7 ei käy typescript-eslintin kanssa) |
| vitest | 5.0.3 | kehitys | MIT | Testiajuri |
| jsdom | 29.1.1 | kehitys | MIT | DOM testeissä (jsdom 30 vaatii Node 24.15:n) |
| @testing-library/react | 16.3.3 | kehitys | MIT | Komponenttitestit roolikyselyillä |
| @testing-library/dom | 10.4.2 | kehitys | MIT | Edellisen vertaisriippuvuus |
| @testing-library/jest-dom | 7.0.1 | kehitys | MIT | DOM-matcherit |
| @testing-library/user-event | 14.6.7 | kehitys | MIT | Käyttäjän toiminnot testeissä |
| @types/react, @types/react-dom | 19.3.0 | kehitys | MIT | Tyypit |
| eslint | 10.11.0 | kehitys | MIT | Lint (SR-1, kerrosraja) |
| @eslint/js | 10.0.1 | kehitys | MIT | ESLintin perussäännöt |
| typescript-eslint | 8.71.0 | kehitys | MIT | TypeScript-säännöt |
| eslint-plugin-react-hooks | 7.1.1 | kehitys | MIT | Hookien säännöt |
| globals | 17.12.0 | kehitys | MIT | Globaalit muuttujat ESLintille |

### Checkpoint 2026-09-30 · Koodari
- Tehty: runko ja rajapintakerros (18f4b37), näkymä ja tilat (1cbaa58), CSP, otsakkeet ja workflowjen oikeudet (commit "Add CSP and security headers"), koodikatselmoinnin korjaus (commit "Stop starting page requests once a page has failed"). ARCHITECTURE.md:n toteutusosa ja STATUS.md:n ajo-ohje on päivitetty.
- Kesken: ei mitään. PR testiin ja esikatselun tarkistus, katso luovutus.
- Seuraava askel: katselmoinnit (Digiturva, UX, Arkkitehti, Sisällöntuottaja) esikatselu-URL:ssa.
- Avoimet kysymykset: katso luovutus.
- Muutetut tiedostot: `package.json`, `package-lock.json`, `.npmrc`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `index.html`, `src/**`, `firebase.json`, `.github/workflows/deploy-prod.yml`, `.github/workflows/deploy-test.yml`, `docs/ARCHITECTURE.md`, `docs/STATUS.md`, tämä kortti.

### Luovutus 2026-09-30 · Koodari → Digiturva, UX, Arkkitehti, Sisällöntuottaja (PM ohjaa)
- **Mitä tehtiin:** ARCHITECTURE.md:n mukainen Vite + React + TypeScript -sovellus. `src/api/` hakee kaikki sivut (rajattu rinnakkaisuus 3, aikakatkaisu 15 s per pyyntö, ei automaattisia uusintayrityksiä, sivukatto 20, pysähtyy tyhjään sivuun tai väärään offsetiin, muodon tarkistus, `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`). `src/ui/` näyttää taulukon (Nimi, Tyyppi, Hinta) ja UX.md 4.5:n tilat PM:n ratkaisun mukaan: yksikin epäonnistunut sivu = VIRHE, kortteja vähemmän kuin `total` = OSITTAINEN. `firebase.json` sai CSP:n ja SR-3:n otsakkeet molemmille sivustoille. Deploy-workflowt saivat `permissions: contents: read`, ja käyttämätön `repoToken` poistettiin live-julkaisuista. Alatunniste: "Epävirallinen fanityökalu. Ei WeirdCon, Netdeck.gg:n eikä CD PROJEKT REDin hyväksymä tai tukema." ja "Korttitiedot: Netdeck.gg" (luonnos SECURITY.md 7:n ja UX.md 4.3:n pohjalta, Sisällöntuottaja tarkistaa).
- **Mitä pyydän:** Digiturva: SEC-katselmointi (SR-1–SR-10, `firebase.json`, workflowt SR-9, riippuvuudet yllä, CSP-virheet selaimen konsolissa esikatselussa). UX: näkymä, tilat, näppäimistö, axe ja live-alueen poikkeama (ARCHITECTURE.md → Toteutuksen yksityiskohdat). Arkkitehti: rakenne ja poikkeamat (oma aikakatkaisu, rajattu rinnakkaisuus). Sisällöntuottaja: alatunnisteen teksti ja muut käyttöliittymätekstit (`src/ui/texts.ts`). Testikäyttäjä katselmointien jälkeen.
- **Mistä katsoa:** PR testiin (URL alla), esikatselu-URL PR:n kommentissa. Koodi: `src/api/netdeckClient.ts`, `src/api/mapCard.ts`, `src/ui/CatalogView.tsx`, `src/ui/CardList.tsx`, `src/ui/texts.ts`, `src/styles.css`, `firebase.json`, `eslint.config.js`. Ajo: `npm ci && npm run dev`. Virhetilan saa näkyviin paikallisesti esim. estämällä `api.netdeck.gg`:n selaimen kehitystyökaluissa (Network → Block request domain).
- **Tunnetut rajoitteet ja riskit:** Lataus kestää noin 6 s (3 sivua, ei välimuistia, T-003). Epäonnistuneen sivun jälkeen jo lähteneet (enintään 2) pyynnöt valmistuvat taustalla, ja tulos hylätään. CSP-virheitä ei ole tarkistettu oikeassa selaimessa (ei selainta tässä ympäristössä). Otsakkeet tarkistetaan esikatselusta `curl -sI`:llä. Tyylejä ei ole tarkistettu visuaalisesti eikä axe-ajolla. Testit ja lint eivät ole CI:ssä (T-004).
- **Testit:** `npm test` 71/71 läpi (5 tiedostoa: rajapintakerros 27, mapCard 20, CatalogView 15, useCardCatalog 5, App 4). `npm run lint` 0 virhettä ja 0 varoitusta. `npm run build` → `dist/` (JS 71,7 kt gzip, ei inline-skriptejä). `npm audit --audit-level=high` 0. Puhdas klooni (`npm ci`, build, test, lint) läpi. Lint-säännöt todennettu väliaikaisella tiedostolla: SR-1-rakenteet ja kerrosrajan ohitus antavat virheen. Oikea rajapinta kerran käsin: 151 / 151.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (epäonnistuneen sivun jälkeen aloitettiin uusia pyyntöjä, regressiotesti lisätty) · Suosituksia 2: (1) keskeneräisten pyyntöjen peruutus epäonnistumisen jälkeen, (2) `tsconfig.json`:n `vitest/globals`-tyypit näkyvät myös sovelluskoodille, joten testit ja sovelluskoodi voisi erottaa omiin tsconfigeihin. Molemmat ovat pieniä. Ehdotan PM:lle yhteistä `[velka]`-tehtävää.
- **PR ja esikatselu (2026-10-01):** PR https://github.com/miinin/cyberdeck/pull/1 (base `test`). Preview-workflow onnistui (`build_and_preview` ja Deploy Preview läpi). Esikatselu: https://cyberdeck-tcg-test--pr1-t-001-kaveleva-luura-wj9wvfxt.web.app (voimassa 14 päivää). `curl -sI` näyttää CSP:n ja kaikki SR-3:n otsakkeet (myös Firebasen HSTS). `index.html`:ssä ei ole inline-skriptejä. Rajapinta vastaa esikatselun originille `Access-Control-Allow-Origin`-otsakkeella. Selaimen konsolia (CSP-virheet) ei ole tarkistettu, koska tässä ympäristössä ei ole selainta (Digiturva ja UX tarkistavat).

### Luovutus 2026-10-01 · Sisällöntuottaja → Koodari, PM
- Mitä tehtiin: Sisältö- ja kielitarkastus (texts.ts, index.html, alatunniste). Luotiin docs/CONTENT.md (kohderyhmä, kielitaso, äänensävy, sanasto, sisältöjen sijainti ja oikeudet). Raportti docs/reports/TXT-001-t001-tarkastus.md.
- Mitä pyydän: Koodari päivittää texts.ts:n raportin lopun mukaan (TXT-001, TXT-002, TXT-004) ja vastaavat testit. PM päättää TXT-003:sta sekä K1:stä ja K2:sta (suositus: Hinta ja englanninkieliset tyypit säilyvät). UX päivittää UX.md 4.4:n ja 4.5:n (TXT-007, TXT-001).
- Mistä katsoa: docs/reports/TXT-001-t001-tarkastus.md, docs/CONTENT.md
- Tunnetut rajoitteet ja riskit: Tekstejä ei nähty renderöitynä, koska selainta ei ole. Veto: ei. Avoimet: TXT-001 Medium, TXT-002–004 Low.
- Testit: ei koodimuutoksia. curl esikatseluun ja rajapintaan.

### Checkpoint 2026-10-01 · PM (TXT-päätökset)
- K1 ja K2: Sisällöntuottajan suositus vahvistaa UX:n oletuksen ("Hinta", tyypit englanniksi). Pidetään. Käyttäjä voi muuttaa myöhemmin.
- TXT-001, TXT-002 ja TXT-004 menevät Koodarin korjauskierrokseen yhdessä muiden katselmointien löydösten kanssa.
- TXT-003 (englanninkielinen fanisisältömerkintä): ei blokkaa. Kirjattu STATUS.md:n kysymyksiin käyttäjälle.

### Luovutus 2026-10-01 · Arkkitehti → PM
- Mitä tehtiin: Arkkitehtuurikatselmointi (diff origin/test...HEAD, b0e1916). Rakenne noudattaa ARCHITECTURE.md:tä ja D-005:tä. Koodarin poikkeamat hyväksytty: (1) oma AbortController + setTimeout, koska AbortSignal.any puuttuu Viten oletuskohteesta (Safari 16.4, Firefox 114); (2) enintään 3 rinnakkaista sivuhakua (SR-5, D-006). ARCHITECTURE.md päivitetty (luvut 3, 5.2–5.5, 7, 9, 11).
- Mitä pyydän: PM commitoi ARCHITECTURE.md:n ja raportin. ARCH-003 (firebase.json-otsakkeiden ja CSP:n yhdenmukaisuustesti) liitetään T-004:ään.
- Mistä katsoa: docs/reports/ARCH-001-t001-katselmointi.md, docs/ARCHITECTURE.md.
- Tunnetut rajoitteet ja riskit: ARCH-001–ARCH-005 ovat Low-tasoa. ARCH-001 on korjattu dokumentaatioon, ARCH-002 on T-006:ssa ja MAX_PAGES-katto (1200 korttia) tarkistetaan T-003:ssa.
- Testit: npx vitest run 71/71 läpi, npx eslint . --max-warnings 0 läpi (2026-10-01).
- Veto: ei.

### Luovutus 2026-10-01 · Digiturva → PM
- Mitä tehtiin: Tietoturvakatselmointi SR-1–SR-10, riippuvuudet (npm audit, lisenssit, install-skriptit, lähteet), workflowt ja firebase.json (SR-9), otsakkeet esikatselusta (curl -sI), CSP selaimessa (headless Chrome, ei virheitä, 151 riviä) ja salaisuushaku git-historiasta. SECURITY.md päivitetty: R-2 hyväksytty (D-006), R-1 päivitetty, uudet R-8 ja R-9.
- Tulos: Ei Critical-, High- eikä Medium-löydöksiä. Low 2 (SEC-002 lint-kiertotiet, SEC-003 persist-credentials), Info 1 (SEC-004). Digiturva ei blokkaa Done-tilaa.
- Mitä pyydän: SEC-002 ja SEC-003 velaksi. Hyväksymiskriteeri 6 (testisivusto) todennetaan test-haaraan yhdistämisen jälkeen.
- Mistä katsoa: docs/reports/SEC-001-t001-katselmointi.md, docs/SECURITY.md luvut 6, 9, 10 ja 11.
- Tunnetut rajoitteet ja riskit: R-3 ja R-4 ennallaan.
- Testit: npm test 71/71, lint 0, build ok, npm audit 0 (myös --omit=dev).

### Checkpoint 2026-10-01 · PM (SEC-päätökset)
- SEC-003 (`persist-credentials: false`) liitetty T-004:ään. SEC-002 (lint-kiertotiet) on uusi tehtävä T-007, joka tehdään ennen kuin `rules_text`iä muotoillaan.

### Luovutus 2026-10-01 · UX Designer → PM
- Mitä tehtiin: UX-katselmointi esikatselu-URL:ssa (kaikki tilat pakotettuina, vaalea ja tumma teema): axe-core 0 rikkomusta, näppäimistöpolku, fokuksen hallinta, saavutettavuuspuu, live-alueen aikajana, 320/640/1280 px, tekstin välistys ja kontrastit. Koodarin live-alueen poikkeama hyväksytty (UX-001), ja UX.md päivitetty v0.2:ksi (4.3, 4.4, 4.9).
- Mitä pyydän: PM merkitsee UX-katselmoinnin tehdyksi. Päätös UX-003:sta. Alatunnisteen taivutushavainto Sisällöntuottajalle.
- Mistä katsoa: docs/reports/UX-001-t001-katselmointi.md, docs/UX.md (v0.2).
- Tunnetut rajoitteet ja riskit: Ei testattu oikealla ruudunlukijalla, mobiililaitteella, forced colors -tilassa eikä Safarilla tai Firefoxilla.
- Testit: axe-core 4.13 neljässä tilassa × 2 teemaa: 0 rikkomusta. Veto: ei.

### Checkpoint 2026-10-01 · PM (katselmoinnit valmiit)
- Kaikki neljä katselmointia valmiit, ei vetoja. Avoimet korjattavat: TXT-001 (Medium), TXT-002 ja TXT-004 (Low). TXT-002:n ehdotus korjaa myös UX:n huomaaman taivutuksen.
- UX-003 (vaakavieritys yli WCAG-vaatimusten, 320 px ja 200 % fontti) kirjattu IDEAS.md:hen.
- Seuraava askel: Koodari korjaa TXT-001, TXT-002 ja TXT-004. Sen jälkeen Testikäyttäjä ja Sisällöntuottajan varmistus rinnakkain.

### Luovutus 2026-10-01 · Koodari → Sisällöntuottaja, Testikäyttäjä (PM ohjaa)
- Mitä tehtiin: TXT-001, TXT-002 (ensisijainen vaihtoehto pelin nimen kanssa) ja TXT-004 korjattu `src/ui/texts.ts`:ään raportin ehdotusten mukaan (commit 6667d77). Testit todentavat uudet tekstit kirjaimellisesti: OSITTAINEN-tilan otsikko, leipäteksti ja live-alue, TYHJÄ-tilan leipäteksti ja alatunniste (`CatalogView.test.tsx`, `App.test.tsx`). TXT-003:een ei koskettu.
- Mitä pyydän: Sisällöntuottaja varmistaa korjaukset ja sulkee löydökset. Testikäyttäjä aloittaa rikkomistestauksen.
- Mistä katsoa: commit 6667d77, esikatselu https://cyberdeck-tcg-test--pr1-t-001-kaveleva-luura-wj9wvfxt.web.app (URL ennallaan, paketti index-D8UMX4QW.js sisältää uudet tekstit).
- Tunnetut rajoitteet ja riskit: UX.md 4.5:n OSITTAINEN- ja TYHJÄ-tekstit ovat vielä vanhat (UX Designerin tiedosto, ei muokattu).
- Testit: `npm test` 71/71, `npm run lint` 0 virhettä ja 0 varoitusta, `npm run build` ok. Preview-workflow (run 36820974748) onnistui.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0

### Luovutus 2026-10-01 · Sisällöntuottaja → PM (korjausten varmistus)
- TXT-001, TXT-002 ja TXT-004 varmistettu (commit 6667d77, diff ja esikatselun JS-paketti). Ei uusia löydöksiä. TXT-003 avoinna käyttäjän kysymyksenä (ei blokkaa). Veto: ei.

### Luovutus 2026-10-01 · Dokumentoija → PM
- Mitä tehtiin: README.md kirjoitettu (mikä, kenelle, URL:t, pikakäynnistys, rakenne, julkaisu, docs-linkit). CHANGELOG.md:n [Julkaisematon]-osioon ensimmäisen version merkinnät käyttäjän kielellä. .env.example ja docs/guides/ eivät ole tarpeen MVP-0:ssa.
- Testit: puhdas klooni (commit 9101b7a), Node 24.14.0: npm ci ok, npm test 71/71, lint 0, build ok, npm audit 0, npm run dev käynnistyy.
- Tunnetut rajoitteet ja riskit: Ei DOC-löydöksiä. Dokumentoija pysäytti testatessaan todennäköisesti käyttäjän toisen projektin kehityspalvelimen portista 5173 (`npx kill-port`), katso LESSONS L-001.

### Luovutus 2026-10-01 · Testikäyttäjä → PM
- Mitä tehtiin: Rikkomistestaus PR #1:n esikatselussa neljällä persoonalla, noin 45 skenaariota (rajapintavastaukset siepattu: virheet, viiveet, vihamielinen data; syvälinkit, hostingin polut, otsakkeet, näppäimistö, päivitys, takaisin-painike, 320 px ja kierto) ja lopuksi koodiluku.
- Mitä pyydän: PM päättää Low-löydösten B-001–B-010 jatkon.
- Mistä katsoa: docs/reports/BREAK-001-t001.md
- Tunnetut rajoitteet ja riskit: Vain headless Chrome ja emuloitu mobiili. Ei oikeaa laitetta, Safaria, Firefoxia eikä ruudunlukijaa. Testisivustoa ei testattu.
- Testit: Arvio Kestää. Ei blokkaavia bugeja, 10 Low-löydöstä. Veto: ei.

### Checkpoint 2026-10-01 · PM (BREAK-päätökset)
- B-001, B-003, B-006 ja B-009 → T-008 (virhe- ja osittaisen tilan parannukset, MVP-1).
- B-004 ja B-010 → T-009 (Hostingin kovennus ja Firebase-API-avaimen rajaus ennen datatallennusta, Digiturva).
- B-002 yhdistetty IDEAS.md:n UX-003-riviin. B-005 ja B-008 → IDEAS.md (MVP-1:n reititys ja mobiililista). B-007 = K1, käyttäjän kysymys STATUS.md:ssä.
