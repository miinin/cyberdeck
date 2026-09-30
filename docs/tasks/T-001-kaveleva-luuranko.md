# T-001 · Kävelevä luuranko: korttilista rajapinnasta näytölle
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 0 · **Prioriteetti:** Must
**Suunnittelu:** Arkkitehti ☐ (teknologia ja rakenne, ADR) · Digiturva ☐ (ulkoinen rajapinta, korttikuvien käyttöoikeus) · UX ☐ (korttilistan näkymä ja tilat)
**Katselmoinnit:** Koodikatselmointi ☐ · Arkkitehti ☐ · Digiturva ☐ · UX ☐ · Testikäyttäjä ☐ · Dokumentoija ☐
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
