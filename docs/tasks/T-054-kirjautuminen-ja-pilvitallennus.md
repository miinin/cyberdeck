# T-054 · Google-kirjautuminen ja pakkojen ja kokoelman pilvitallennus
**Tila:** Backlog (suunniteltu, odottaa D-017:n hyväksyntää ja Digiturvan uhkamallia) · **Omistaja:** Koodari (vaiheittain) · **MVP:** 2 · **Prioriteetti:** Must
**Päätökset:** D-016 (käyttäjä), D-017 (Arkkitehti, Ehdotettu). **Haara:** `t-054-kirjautuminen-ja-pilvitallennus` (suunnittelu); toteutus vaiheittain haaroihin `t-054a-…`, `t-054b-…` jne.
**Katselmoinnit:** Digiturva ◐ (uhkamalli ja sääntöluonnos ✓ 2026-10-03 SEC-011; workflowt ja palvelutili a0:ssa; riippuvuus a:ssa, koodi b:ssä ja c:ssä) · Arkkitehti ☐ (b:n tietomalli ja c:n synkronointi) · UX ja Sisällöntuottaja ☐ (kirjautumis-, yhdistämis- ja uloskirjautumisdialogit ennen c:tä) · Testikäyttäjä ☐ (d:n jälkeen kahdella laitteella)
**Riippuvuudet:** konsolitehtävät 1–8 ennen T-054a0:aa, 9–11 ennen a:n testausta testisivustolla (D-017 Muutos K-P8: testisivusto `cyberdeck-tcg-dev.web.app` omassa projektissa).

## Tavoite
Käyttäjä voi halutessaan kirjautua Google-tilillä, jolloin pakat ja kokoelma tallentuvat tilille ja näkyvät kaikilla laitteilla. Ilman kirjautumista kaikki toimii kuten ennen. Rakenne: D-017.

## Käyttäjän tehtävät konsolissa (D-017 Muutos K-P8: kaksi projektia)
Projektit: **tuotanto `cyberdeck-tcg`** (sivusto `cyberdeck-tcg.web.app`) ja **testi `cyberdeck-tcg-dev`** (uusi, sivusto `cyberdeck-tcg-dev.web.app`). Jos id `cyberdeck-tcg-dev` on varattu, valitse vapaa id ja kerro se PM:lle, joka korvaa sen kaikkialla. Tehtävät 1–8 ennen infratehtävää T-054a0, 9–11 ennen T-054a:n testausta, 12–13 myöhemmin. **Plan pysyy Sparkina molemmissa: älä hyväksy Blaze-päivitystä, jos konsoli sitä tarjoaa.**

**A. Testiprojekti (Firebase Console, https://console.firebase.google.com):**
1. **Add project** → id `cyberdeck-tcg-dev`, Google Analytics **pois**. Tarkista, että plan on Spark.
2. **Build → Hosting → Get started** (oletussivusto `cyberdeck-tcg-dev` syntyy; CLI-ohjeita ei tarvitse ajaa).
3. **Project settings → General → Your apps → Add app → Web (</>)**, nimi "cyberdeck-web-test", älä liitä Hostingia. Kopioi `firebaseConfig`-arvot (apiKey, projectId, messagingSenderId, appId) PM:lle. Ne eivät ole salaisuuksia.
4. **Authentication → Get started → Sign-in method → Google → Enable**, julkinen nimi "Cyberdeck (testi)", tukisähköposti, Save.
5. **Authentication → Settings → Authorized domains:** listalla oletuksena `localhost`, `cyberdeck-tcg-dev.firebaseapp.com` ja `cyberdeck-tcg-dev.web.app`. Muita ei lisätä (esikatseluissa kirjautuminen on pois).
6. **Firestore Database → Create database:** Standard, `(default)`, sijainti **`europe-north1` (Finland)**, **Start in production mode**. Sijaintia ei voi muuttaa jälkikäteen.

**B. Testiprojektin deploy-tunnus (Google Cloud Console, projekti `cyberdeck-tcg-dev`):**
7. **IAM & Admin → Service accounts → Create service account**, nimi `github-action-cyberdeck`. Roolit: **Firebase Hosting Admin** ja **API Keys Viewer** (vähimmät, D-017 K-P8). Sitten **Keys → Add key → JSON** (tiedosto latautuu, se on salaisuus).
8. **GitHub-salaisuus:** käyttäjä ajaa itse: `gh secret set FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG_DEV --repo miinin/cyberdeck < polku/avain.json` ja **poistaa JSON-tiedoston koneelta heti**. (PM voi ajaa komennon vain käyttäjän erillisellä luvalla. Avainta ei liitetä chattiin eikä tallenneta repoon.)

**C. Tuotantoprojekti `cyberdeck-tcg`:**
9. Firebase Console: **Authentication → Google → Enable** (julkinen nimi "Cyberdeck", tukisähköposti). **Authorized domains:** `localhost`, `cyberdeck-tcg.firebaseapp.com`, `cyberdeck-tcg.web.app` (oletukset). **Älä lisää** testi- tai esikatseludomaineja. **Firestore → Create database:** Standard, `(default)`, `europe-north1`, production mode. **Add app → Web**, nimi "cyberdeck-web", config PM:lle.

**D. OAuth ja API-avaimet (Google Cloud Console, kummassakin projektissa erikseen):**
10. **APIs & Services → Credentials → OAuth 2.0 Client IDs → "Web client (auto created by Google Service)" → Authorized redirect URIs:** testiprojektiin `https://cyberdeck-tcg-dev.web.app/__/auth/handler`, tuotantoon `https://cyberdeck-tcg.web.app/__/auth/handler` (`*.firebaseapp.com/__/auth/handler` on listalla valmiina, jätä se). **OAuth consent screen (Branding):** sovelluksen nimi ja tukisähköposti; tietosuojalinkki T-054d:ssä.
11. **Credentials → API keys → "Browser key (auto created by Firebase)" → API restrictions → Restrict key (pakollinen, SEC-028):** vain Identity Toolkit API, Token Service API ja Cloud Firestore API. Application restrictions (referrer) jätetään toistaiseksi pois (`no-referrer` voi estää kirjautumisen); jos kokeillaan, vain tarkat osoitteet, ei koskaan `*.web.app`.

**E. Komentorivi (hook kysyy luvan):**
12. Säännöt: `firebase deploy --only firestore:rules,firestore:indexes --project test` ennen kuin T-054b yhdistetään testiin, ja `--project default` ennen T-054b:n julkaisua tuotantoon.
13. Kun uusi testisivusto toimii (T-054a0 valmis): vanha testisivusto pois käytöstä: `firebase hosting:disable --site cyberdeck-tcg-test --project default` (sivusto palauttaa sen jälkeen 404). Poistoa (`hosting:sites:delete`) ei tarvita.

## Vaiheet ja hyväksymiskriteerit

### T-054a0 · Infra: testisivusto erilliseen projektiin (D-017 Muutos K-P8)
Edellyttää konsolitehtävät 1–8. Oma haara `t-054a0-testiprojekti`, pieni muutos (ei sovelluskoodia).
- [ ] `.firebaserc`: aliakset `default: cyberdeck-tcg` ja `test: cyberdeck-tcg-dev`; targets `cyberdeck-tcg` → `hosting.prod: ["cyberdeck-tcg"]`, `cyberdeck-tcg-dev` → `hosting.test: ["cyberdeck-tcg-dev"]`. `firebase.json` ennallaan.
- [ ] `package.json`: `"build:test": "tsc --noEmit && vite build --mode test"`.
- [ ] `deploy-test.yml` ja `preview.yml`: `projectId: cyberdeck-tcg-dev`, `secrets.FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG_DEV`, `npm run build:test`. `deploy-prod.yml` ennallaan. Tuotannon salaisuutta ei mainita muissa workflowissa (tarkistus: `grep`).
- [ ] **Digiturvan katselmointi** (workflowt, `.firebaserc`, palvelutilin roolit) ennen yhdistämistä testiin.
- [ ] Yhdistämisen jälkeen: `https://cyberdeck-tcg-dev.web.app` näyttää test-haaran version, ja PR:n esikatselulinkki osoittaa `cyberdeck-tcg-dev--pr-…web.app`:iin. Jos deploy kaatuu oikeuksiin, puuttuva rooli lisätään ja kirjataan tähän.
- [ ] Testisivuston URL päivitetty: `CLAUDE.md`, `README.md`, `docs/STATUS.md`, `docs/SECURITY.md` (vanhat raportit ennallaan). Sitten konsolitehtävä 13.
- [ ] `npm test`, `npm run lint`, `npm run build` ja `npm run build:test` läpi.

### T-054a · Config, auth-tila ja kirjautumis-UI (ei vielä pilvitallennusta)
- [x] `firebase` lisätty tarkalla versiolla (`npm i -E firebase`), ja koodissa tuodaan vain `firebase/app`, `firebase/auth` ja (b:ssä) `firebase/firestore/lite`. Digiturvan riippuvuuskatselmointi.
- [x] `src/account/`: `types.ts` (AuthClient, AccountUser), `firebase/config.ts` (committatut `PROD_ENV` ja `TEST_ENV`, valinta `import.meta.env.MODE === 'production'`, puhdas `selectAuthMode(env, host)`: tarkka `siteHost` → redirect, test-config + localhost → popup, muuten pois; D-017 Muutos K-P8), `firebase/loadFirebase.ts` (ainoa `firebase/*`:n tuoja, dynaaminen `import()`), `firebase/firebaseAuthClient.ts` (redirect julkaistuilla sivustoilla, popup localhostissa, `getRedirectResult` käynnistyksessä), `memory.ts` (`createFakeAuth`), `index.ts`.
- [x] SDK ladataan vain "Kirjaudu"-painalluksesta tai kun `cyberdeck:account:last-uid` on olemassa. Testi: kirjautumaton käynnistys ei kutsu `loadFirebase`a.
- [x] Yläpalkissa "Kirjaudu"-painike (16+-maininta ja lyhyt tietosuojateksti kirjautumisdialogissa). Kirjautuneena valikko: "Kirjautuneena: <sähköposti>" (vain muistissa) ja "Kirjaudu ulos". Esikatselussa painike kertoo, ettei kirjautuminen ole käytössä. Tekstit `texts.ts`:ssä.
- [x] `App` ottaa propin `account?: AccountServices`. `src/test/setup.ts` mockaa `loadFirebase`n heittämään "Real Firebase is disabled in tests".
- [x] ESLint: `firebase/*` sallittu vain `src/account/firebase/**`:ssa, UI tuo vain `../account`in.
- [x] CSP molemmille sivustoille identtisesti (D-017 kohta 9): `script-src 'self' https://apis.google.com`, connect-src lisäksi `identitytoolkit`, `securetoken` ja `firestore.googleapis.com`, `frame-src 'self'`. `firebaseConfig.test.ts` tarkalla origin-listalla.
- [ ] Bundle (**+2,18 kt, raja ylittyy 0,18 kt, PM päättää**, ks. luovutus): pääpaketin koko ei kasva yli 2 kt gzip (Firebase omana laiskana chunkkina). Chunkin koko kirjataan luovutukseen.
- [x] `scripts/check-dist-env.mjs <production|test>`: build hylätään, jos `dist/` sisältää toisen ympäristön `projectId`:n tai `apiKey`:n. Ajetaan kaikissa kolmessa workflowssa buildin jälkeen (workflow-muutos → Digiturva). Yksikkötestit `selectAuthMode`ille, myös `cyberdeck-tcg.web.app.evil.example` ja test-config tuotantohostilla.
- [ ] Varmistus testisivustolla yhdistämisen jälkeen: kirjautuminen ja uloskirjautuminen toimivat Chromessa ja Firefoxissa, selaimen konsolissa ei CSP-virheitä. Jos `/__/auth/iframe` estyy X-Frame-Optionsin tai frame-ancestorsin takia, korjataan (SAMEORIGIN / 'self') ja kirjataan tähän.
- [x] `npm test`, `npm run lint`, `npm run build` läpi.

### T-054b · Firestore-repository ja säännöt (vaatii Digiturvan uhkamallin)
- [x] `envelope.ts`: `decodeEnvelopeValue(value, spec)`, ja `decodeEnvelope` käyttää sitä. Vanhat testit läpi ennallaan.
- [x] `src/account/firebase/firestoreCloudStore.ts` (`CloudStore`: `readMeta`, `readAll`, `commit(change, expectedRev)` `runTransaction`illa, meta-revin tarkistus, `CloudError`-luokittelu) ja `memory.ts`: `createMemoryCloud()` samalla sopimuksella. Sopimustestit ajetaan muistitoteutusta vasten.
- [x] Tietomalli D-017 kohta 3: `users/{uid}`, `users/{uid}/decks/{deckId}`, `users/{uid}/collection/main` molemmissa projekteissa (ei `test_users`-juurta, D-017 Muutos K-P8). Pilvestä luettu data validoidaan samoilla `parse*`-funktioilla, ja virheelliset rivit pudotetaan (lasketaan). Uudempi skeemaversio → `locked`.
- [x] Kokoelman koodatun koon tarkistus (alle 900 000 tavua) ennen kirjoitusta → `CloudError('too-large')`.
- [x] `firestore.rules` (vain omistaja, vain sallitut polut ja kentät, kokorajat, kaikki muu kielletty) ja tyhjä `firestore.indexes.json`, `firebase.json`iin `firestore`-osio. Digiturva katselmoi säännöt. **(Digiturvan katselmointi jäljellä.)** Käyttäjä deployaa (konsolitehtävä 9) ennen yhdistämistä testiin.
- [ ] Säännöt deployattu testiprojektiin (konsolitehtävä 12, `--project test`) ennen yhdistämistä testiin ja tuotantoprojektiin ennen julkaisua.
- [ ] Käsin testisivustolla: toisen käyttäjän polkuun kirjoitus ja luku hylätään (selaimen konsolista), oma polku toimii.
- [x] Testit, lint, build läpi.

### T-054c · Synkronointi, ensimmäinen siirto ja yhdistämisdialogi
- [x] `createRepositories({ namespace })` ja samassa välilehdessä toimiva `notify`. Tilin avaimet `cyberdeck:u:{uid}:…`, uid validoidaan. Kirjautumattoman avaimet ennallaan.
- [x] `App` vaihtaa repositoriot ja näkymäpuun `key={uid ?? 'local'}`. `useDecks`, `useCollection` ja `collectionStore` ennallaan (vain testit uusille poluille).
- [x] `src/account/sync/merge.ts` (puhdas): pakkojen kolmitiemerge (vain toinen muuttunut → se; molemmat → suurempi updatedAt, tasapeli pilvi; poisto vs. muokkaus → muokattu säilyy) ja kokoelman korteittainen kolmitiemerge (molemmat muuttaneet → paikallinen). Kattavat yksikkötestit kaikille haaroille.
- [x] `src/account/sync/syncEngine.ts`: Web Locks, meta-rev-oikotie (1 luku, kun ei muutoksia), transaktiokonflikti → uusi kierros enintään 3 kertaa, laukaisijat (käynnistys, muutos + 3 s, focus, visibilitychange, online, 5 min), tila `idle | syncing | offline | error | locked`. Testit valekellolla ja muistipilvellä, ei oikeaa verkkoa.
- [x] Ensimmäinen kirjautuminen: tyhjä selain → veto; tyhjä tili → siirto ja kirjautumattoman avainten tyhjennys onnistuneen commitin jälkeen, varmuuskopio ennen; molemmissa tietoja → dialogi (Yhdistä / Käytä vain tilin tietoja / Peruuta). Testit kaikille kolmelle.
- [x] Uloskirjautuminen (D-017, käyttäjän valinta): synkronoimattomista muutoksista varoitus, sitten `signOut`. Tilin avaimet `cyberdeck:u:{uid}:*` **jäävät** selaimeen, ja käyttäjälle kerrotaan se ("Tiedot jäävät tähän selaimeen"). Uloskirjautuneena näkyy kirjautumattoman oma data, ei tilin dataa. Testi: avaimet säilyvät, eikä tilin data näy uloskirjautuneena.
- [x] Synkronoinnin tila näkyy kirjautumisvalikossa (esim. "Tallennettu tilille klo 14.32" / "Ei yhteyttä, muutokset tallessa tällä laitteella"). Tekstit UX:ltä ja Sisällöntuottajalta.
- [ ] Testit, lint, build läpi. Käsin: kaksi selainta samalla tilillä, muutos näkyy toisessa viimeistään fokuksen jälkeen.

### T-054d · Pakkaeditorin ristiriita (T-042), tietosuoja ja viimeistely
- [x] `DeckRepository.update(id, content, { expectedUpdatedAt })` → `StorageError('conflict')`, kun tallennettu updatedAt on eri. Pakkaeditori lataa uuden version, jos omia tallentamattomia muutoksia ei ole, ja muuten näyttää ilmoituksen (Lataa uusin / Pidä omat muutokset). Testit: kaksi välilehteä (storage-tapahtuma) ja synkronoinnin tuoma muutos. T-042 merkitään tehdyksi.
- [ ] PRIVACY.md ja sovelluksen tietosuojateksti: mitä tallennetaan (uid, pakat, kokoelma), missä (Firestore europe-north1, Firebase Auth), 16+, miten tiedot poistetaan. Digiturva ja Dokumentoija.
- [x] Poisto-oikeus: käyttäjän päätös (alla) toteutettu.
- [ ] Testikäyttäjä kahdella laitteella ja offline-tilassa. UX-katselmointi dialogeista.

## Digiturvan turvavaatimukset (ehdotus hyväksymiskriteereiksi, PM hyväksyy)
Uhkamalli ja vaatimukset: `docs/reports/SEC-011-t054-uhkamalli.md`, sääntöluonnos `docs/reports/SEC-011-t054-liite-firestore.rules`, tietosuoja PRIVACY.md luku 10 (luonnos).
- **T-054a:** SR-21 (tarkka host-lista, tuntematon host → kirjautuminen pois, väärän ympäristön build väärällä sivustolla → kirjautuminen pois, `select_account`, ei tokenien käsittelyä), SR-24 (tarkka CSP, ei jokerimerkkejä, XFO/frame-ancestors/COOP/no-referrer ennallaan), SR-25 (konsoli: API restrictions pakollinen, referrer-rajaus ilman `*.web.app`:ia, ks. SEC-028), SR-27 (`no-console` `src/account/**`), SR-28 (`firebase@12.19.0` tarkkana, `@grpc/grpc-js`-override, `dist/`-tarkistus), SR-29 kohta 2 (16+ ja tietosuojateksti dialogissa).
- **T-054b:** SR-22 (säännöt liitteen mukaan, production mode ennen deployta, käsin todennus kuudella tapauksella), SR-23 kohdat 1–6, 8–9 (validointi, ei mappien levitystä, virheellinen ≠ poisto, `MAX_DECKS + 1`).
- **T-054c:** SR-23 kohta 7 (toisella laitteella poistettu tili ei palaudu automaattisesti), SR-26 kohdat 1–3 (`last-uid` pois, minimi-ilmoitus jaetusta koneesta, suositus "Poista tiedot tästä selaimesta").
- **T-054d:** SR-26 kohdat 4–5 ("Poista tilin tiedot", Auth-käyttäjän poisto K-P5), SR-29 kohdat 3–4 (seloste ennen avaamista muille).
- **Käyttäjälle PM:n kautta:** R-18 / K-P8 ratkaistu erillisellä testiprojektilla (D-017 Muutos K-P8, T-054a0), K-P5–K-P7. Konsolitehtävä 8 päivitettävä SEC-028:n mukaan, D-017 kohta 7 SEC-029:n mukaan.

## Käyttäjän päätettävät asiat
- D-017:n hyväksyntä (uusi riippuvuus `firebase` noin 63 kt gzip vain kirjautuville, CSP:n laajennus Googlen osoitteisiin).
- Firestoren sijainti: suositus `europe-north1` (pysyvä valinta).
- Poisto-oikeus MVP:ssä: (a) "Poista tilin tiedot" -painike, joka poistaa pakat, kokoelman ja metan Firestoresta (noin 30 riviä, suositus) vai (b) ohje, jolla käyttäjä pyytää poistoa ylläpitäjältä. Firebase Auth -tilin poisto vaatii tuoreen kirjautumisen, joten se tehdään vain, jos käyttäjä haluaa.
- Uloskirjautuminen poistaa tilin tiedot selaimesta (ehdotus D-017 kohta 7). Vaihtoehto: säilytetään selaimessa seuraavaa kirjautumista varten.

## Rajaukset (ei kuulu tähän)
- Muut kirjautumistavat (D-016: vain Google).
- Reaaliaikainen synkronointi (`onSnapshot`), kokoelman pilkkominen useaan dokumenttiin, sääntöjen emulaattoritestit → IDEAS.md.
- Asetusten (teema, näkymät) synkronointi.
- Kirjautuminen PR-esikatseluissa.

## Luovutukset
### Luovutus Arkkitehti → PM · 2026-10-03
Suunnittelu valmis: ADR D-017 (Ehdotettu), tämä kortti ja vaiheet a–d. Seuraavaksi: käyttäjän hyväksyntä D-017:lle ja päätökset yllä, konsolitehtävät 1–8, Digiturvan uhkamalli ja sääntövaatimukset (ennen b:tä), sitten T-054a Koodarille.

### Luovutus Digiturva → PM · 2026-10-03
Uhkamalli (STRIDE) ja turvavaatimukset SR-21–SR-29 valmiit: `docs/reports/SEC-011-t054-uhkamalli.md`, sääntöluonnos liitteenä (ei repon juuressa), PRIVACY.md luku 10 luonnoksena, SECURITY.md luku 17 ja riskit R-18–R-20. Löydökset: 2 Medium (SEC-028 API-avaimen rajaus, SEC-030 yhteinen projekti → R-18 käyttäjän hyväksyttäväksi), 3 Low, 2 Info. `firebase@12.19.0` hyväksyttävä ehdoin SR-28. Veto: ei blokkaa T-054a:ta. T-054b:tä ei yhdistetä testiin ennen sääntöjen deployta ja käsin todennusta. Seuraavaksi: PM hyväksyy SR:t kriteereiksi, päivittää konsolitehtävän 8 ja D-017 kohdan 7, vie K-P5–K-P8 käyttäjälle.

### Luovutus Arkkitehti → PM · 2026-10-03 (K-P8)
D-017:ään lisätty "Muutos K-P8": testisivusto uuteen Spark-projektiin `cyberdeck-tcg-dev` (vaihtoehto A; URL vaihtuu, koska site id ei siirry), config buildin `MODE`:n mukaan + tarkka host-tarkistus + dist-tarkistus, juuri aina `users`. Konsolitehtävät 1–13 päivitetty, uusi infratehtävä T-054a0 (Digiturva katselmoi workflowt). Seuraavaksi: käyttäjä tekee tehtävät 1–8, sitten T-054a0 Koodarille.

## Luovutus T-054a0 (Koodari, 2026-10-03)
Tehty: `.firebaserc` (alias `test` → `cyberdeck-tcg-dev`, targetit projekteittain), `package.json` `build:test`, `deploy-test.yml` ja `preview.yml` (projectId `cyberdeck-tcg-dev`, salaisuus `FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG_DEV`, `npm run build:test`), testisivuston URL `CLAUDE.md`, `README.md`, `docs/STATUS.md`, `docs/SECURITY.md`. `deploy-prod.yml` ja `firebase.json` ennallaan; tuotannon salaisuus vain deploy-prodissa (grep). Ei deployta eikä konsoliajoja.
**Käyttäjän tehtävät ennen yhdistämistä testiin:** konsolitehtävät 1–8 (projekti `cyberdeck-tcg-dev`, Spark, Hosting-sivusto, palvelutili roolein Firebase Hosting Admin + API Keys Viewer, GitHub-salaisuus `FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG_DEV`). Yhdistämisen jälkeen: tarkista `https://cyberdeck-tcg-dev.web.app` ja PR-esikatselu, sitten konsolitehtävä 13 (vanha testisivusto pois). Digiturvan katselmointi jäljellä.
Testit: npm test, lint, build, build:test läpi. Commit-vaiheessa Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0.

## Katselmointi T-054a0 (Digiturva, 2026-10-03)
`docs/reports/SEC-012-t054a0-testiprojekti.md`. Tulos: hyväksytty, ei estä yhdistämistä testiin. Tuotannon salaisuus vain `deploy-prod.yml`:ssä, fork-PR:t eivät saa salaisuuksia, oikeudet minimissä ja `persist-credentials: false` säilyy, test-build ei voi deployata tuotantoon, roolit Hosting Admin + API Keys Viewer vahvistettu. Löydökset: SEC-035 Low (tuotannon salaisuus GitHub Environmentiin, käyttäjän toimi, R-4 → Low), SEC-036 Info (esikatselun Auth-domain-varoitus on odotettu), SEC-037 Info (konsolitehtävä 13 pian). Koodiin ei korjauksia. Käyttäjä varmistaa, ettei testiprojektin palvelutiliä lisätä tuotantoprojektin IAM:iin.

### PM:n infrakirjaus 2026-10-03
- PM loi CLI:llä projektin `cyberdeck-tcg-dev` (Spark, sivusto https://cyberdeck-tcg-dev.web.app) sekä web-sovelluksen kumpaankin projektiin. Configit (eivät salaisuuksia, D-017) ovat alla. Koodari vie ne tiedostoon `src/account/firebase/config.ts`.
  - **prod** `cyberdeck-tcg`: apiKey `AIzaSyDulWCXsbWoRQG58MaUqypk2Mycf6X7KN4`, authDomain `cyberdeck-tcg.web.app` (D-017: sivuston oma domain; CLI:n oletus oli cyberdeck-tcg.firebaseapp.com), projectId `cyberdeck-tcg`, storageBucket `cyberdeck-tcg.firebasestorage.app`, messagingSenderId `912904162092`, appId `1:912904162092:web:e8349acff636cfab9a3a89`
  - **test** `cyberdeck-tcg-dev`: apiKey `AIzaSyDyvDT1RKZy2QmRxKgCzk9Jm-y6aDunIVs`, authDomain `cyberdeck-tcg-dev.web.app`, projectId `cyberdeck-tcg-dev`, storageBucket `cyberdeck-tcg-dev.firebasestorage.app`, messagingSenderId `911337127286`, appId `1:911337127286:web:d5ab822eea52f30ce20e57`
- **Virhe:** Firestore `(default)` syntyi sijaintiin `nam5` (USA) molemmissa projekteissa (LESSONS 2026-10-03). Tietokannat ovat tyhjiä, ja niissä on kaiken kieltävät säännöt. Poisto ja uudelleenluonti `europe-north1`:een on käyttäjän tehtävä (auto mode esti poiston). Säännöt deployataan uudelleen vasta, kun sijainti on korjattu.

## Luovutus T-054a (Koodari, 2026-10-03)
**Tehty (haara `t-054-kirjautuminen-ja-pilvitallennus`, ei pushattu):** `e9459fa` riippuvuus, `a5453e9` toteutus.
- `firebase@12.19.0` täsmäversiona (integriteetti = SR-28), `overrides: { "@grpc/grpc-js": "1.14.5" }` → `npm audit` 0.
- `src/account/`: `types.ts`, `authState.ts`, `lazyAuthClient.ts`, `memory.ts` (`createFakeAuth`), `index.ts`; `firebase/config.ts` (`PROD_ENV`/`TEST_ENV`, vain avaimet), `firebase/sites.ts` (hostit ja puhdas `selectAuthMode(site, host)`), `firebase/loadFirebase.ts` (ainoa `firebase/*`-tuoja, dynaaminen), `firebase/firebaseAuthClient.ts` (`initializeAuth` + `indexedDBLocalPersistence`, `select_account`, popup localhostissa, redirect sivustolla, `getRedirectResult` paluussa, virheet kiinteiksi lajeiksi `error.code`n perusteella, tokeneita ei lueta).
- **Poikkeamat D-017:stä (perustelu koko):** (1) config jaettu kahteen tiedostoon (`sites.ts` pääpakettiin, avaimet laiskaan chunkkiin). (2) `AuthClient`issa lisäksi `state()` ja `start()`. (3) Pääpaketissa on vain ohut `createLazyAuthClient`; varsinainen asiakas latautuu samassa laiskassa chunkissa SDK:n kanssa. (4) Uusi avain `cyberdeck:account:redirect-pending` (`'1'`, ei henkilötietoa): ilman sitä redirect-paluussa ei olisi `last-uid`ia, eikä tulosta luettaisi. Kirjattu PRIVACY.md:n riville 11. **Digiturva katselmoi.** (5) `vite.config.ts`: `modulePreload: false` (polyfill pois pääpaketista, −0,35 kt).
- Tallennus: `PreferencesRepository` sai synkroniset `loadLastUid/saveLastUid/loadRedirectPending/saveRedirectPending` (eivät koskaan heitä, uid validoidaan `isUid`illa, `src/domain/uid.ts`).
- UI: `AccountMenu` yläpalkissa ennen teemakytkintä. Kirjautumaton: "Kirjaudu" → dialogi (otsikko, 16+, tietosuojateksti PRIVACY.md:n luonnoksesta, Peruuta / Jatka Googleen, virhe `role="alert"`). Esikatselussa sama painike avaa dialogin "Kirjautuminen ei ole käytössä". Kirjautunut: "Tili" (aria-expanded) → "Kirjautuneena: <sähköposti>" ja "Kirjaudu ulos"; sulkeutuu Escillä ja kun fokus poistuu. Alle 40 rem pelkkä henkilökuvake (nimi säilyy ruudunlukijalle), jotta yläpalkin rivi mahtuu 375 px:iin; samalla yläpalkin vaakaväli alle 40 rem `--space-2`. Hiljainen palautus käynnistyksessä ei näytä virhettä (offline-käynnistys), epäonnistunut redirect-kirjautuminen avaa dialogin virheineen.
- CSP molemmille sivustoille (D-017 kohta 9), `firebaseConfig.test.ts` jäsentää CSP:n ja tarkistaa tarkat lähteet, ei jokerimerkkejä/skeemoja/unsafe-avainsanoja, XFO/COOP/Referrer ennallaan, ei `/__`-otsakesääntöjä.
- `scripts/check-dist-env.mjs <production|test>` lukee arvot `config.ts`:stä, hylkää toisen ympäristön `projectId`:n (kokonaisena id:nä, `cyberdeck-tcg` ≠ `cyberdeck-tcg-dev`) ja `apiKey`n, vaatii omat, ja kieltää `@grpc`, `firebase/analytics` (tuontipolkuna; `firebase/app` sisältää komponenttinimen `@firebase/analytics` lokitaulukossaan, mikä ei lataa mitään), `measurementId`, `gtag`. Lisätty kaikkiin kolmeen workflowhun buildin jälkeen (**workflow-muutos → Digiturva**).
- ESLint: `firebase/*` vain `src/account/firebase/**`:ssa ja siellä vain `app`, `auth`, `firestore/lite` (regex, koska glob osui myös `./firebase/config`iin), UI tuo vain `../account`in, `no-console: error` `src/account/**`. Negatiiviset tarkistukset ajettu käsin.
- `setup.ts` mockaa `loadFirebase`n heittämään "Real Firebase is disabled in tests".

**Koot (gzip):** pääpaketti 125,79 → 127,97 kt = **+2,18 kt** (raja 2 kt, ylitys 0,18 kt). Erittely: AccountMenu ~1,0, Viten `__vitePreload`-apuri ~0,6 (tulee aina dynaamisen importin mukana, ei poistu asetuksella), tekstit ~0,45, laiska asiakas + config + muut ~0,6. Kokeiltu: kirjautuneen valikko React.lazyllä säästi vain 0,07 kt → hylätty monimutkaisuuden takia. CSS +0,19 kt. **Laiska Firebase-osa yhteensä 47,8 kt** (36,2 + 9,9 + 1,3 asiakas + 0,4). **PM päättää:** hyväksytäänkö +2,18 kt vai karsitaanko (esim. dialogi ja tekstit laiskaksi chunkiksi, jolloin dialogi ei aukea offline-tilassa).
**dist-tarkistus:** `@grpc`, `measurementId`, `gtag` = 0 osumaa; check-dist-env OK molemmissa tiloissa, ja ristiin ajettuna (test-build tuotantotarkistuksella ja päinvastoin) hylkää.
**Testit:** `npm test` 846/846 (56 tiedostoa, uusia 46), `npm run lint` 0, `npm run build` ja `npm run build:test` läpi, `npm audit` 0. Vanha testi `App.theme.test.tsx` sai yhden Tab-painalluksen lisää (tilinappi on uusi kohde ennen teemakytkintä), muita testejä ei muutettu.
**Kuvakaappaukset** (build:test + vite preview, headless Chrome, kirjautumaton): scratchpad `test-375-header.png`, `test-375-dialog.png`, `test-1920-header.png`, `test-1920-dialog.png`. Ei vaakavieritystä. Preview suljettu (portissa 4173 pyörii t-027-worktreen vanha preview, ei minun, jätetty).
Koodikatselmointi: tehty · Pakollisia korjattu 2 (uloskirjautuessa painike näytti "Kirjaudutaan…"; laiska asiakas saattoi jäädä loading-tilaan) · Suosituksia 2
**Velka (suositukset):** (1) uloskirjautumisen virhe ei näy kirjautuneen valikossa (vain tila säilyy); (2) Safari ei fokusoi painiketta klikatessa, joten valikko ei sulkeudu ulkopuoliseen klikkaukseen (Esc toimii).
**Avoimet kysymykset PM:lle:**
1. Bundlen ylitys 0,18 kt (yllä).
2. Tekstit ovat työversioita (dialogin runko PRIVACY.md:n luonnoksesta) → Sisällöntuottaja ja UX ennen T-054c:tä. Tietosuojaselosteen linkki puuttuu (seloste T-054d).
3. **Dialogi sanoo "Tiedot säilytetään Googlen palvelimilla Suomessa", mutta Firestore on nyt `nam5` (USA) molemmissa projekteissa** (PM:n infrakirjaus). Teksti on totta vasta, kun käyttäjä on luonut tietokannat uudelleen `europe-north1`:een. Pilvitallennusta ei vielä ole (T-054b), joten T-054a ei tallenna mitään Firestoreen.
**Seuraavaksi:** Digiturva (riippuvuus + override, workflowt, CSP, redirect-pending-avain, dist-tarkistus), sitten PR testiin; testisivustolla kirjautumisen ja CSP:n käsin varmistus Chromessa ja Firefoxissa (konsolitehtävät 9–11 ennen).

### Katselmointi · Digiturva · T-054a · 2026-10-03
**Tulos:** SEC-013 (`docs/reports/SEC-013-t054a-kirjautuminen.md`): 0 Critical, 0 High, 0 Medium, 1 Low, 2 Info. **Veto: ei** (ei estä Done-tilaa eikä yhdistämistä testiin). `npm test` 846/846, lint 0, build ja build:test läpi, check-dist-env OK, `npm audit` 0.
- SEC-038 (Low): dialogin tietosuojateksti ("Suomessa", "ei nimeäsi eikä sähköpostiasi") ei pidä paikkaansa, koska Firestore on `nam5` ja Firebase Auth tallentaa sähköpostin ja nimen. Korjattava ennen tuotantojulkaisua tai kirjautumisen avaamista muille.
- SEC-039 (Info) Firestore-origin CSP:ssä etukäteen, SEC-040 (Info) `redirect-pending`-avain hyväksytty.
- Korjattu suoraan: PRIVACY.md rivi 11 ja 10.3 Muutos K-P8:n mukaisiksi (ei `test_users`), Firestoren nykyinen sijainti kirjattu.
- Avoinna: CSP:n ja kirjautumisen käsin varmistus testisivustolla (SEC-033).

## Luovutus T-054b (Koodari, 2026-10-03)
**Tehty (haara `t-054-kirjautuminen-ja-pilvitallennus`, ei pushattu, ei deployta eikä firebase-komentoja):**
- `src/storage/envelope.ts`: `decodeEnvelopeValue(value, spec)`, `decodeEnvelope` = JSON.parse + se. `storage/index.ts` vie lisäksi `COLLECTION_ENVELOPE_SPEC`in (sama versio, migraatiot ja `parseCollection` kuin localStoragessa).
- `src/account/types.ts`: `CloudMeta { rev, newer }`, `CloudDoc<T>` (`missing | ok | invalid`), `CloudSnapshot { meta, decks, invalidDeckIds, collection, dropped, locked, limitExceeded }`, `CloudChange { putDecks, deleteDecks, collection? }`, `CloudStore`. `cloudError.ts`: `CloudError` ja `toCloudError` (vain Firestoren `code`, `Object.hasOwn`-haku).
- `src/account/cloudCodec.ts` (puhdas, yhteinen molemmille toteutuksille): juuri `users`, pakan id dokumentin id:stä (`isDeckId`), dokumentit `decodeEnvelopeValue` + `parseDeck`/`parseCollection`, vain tunnetut kentät (ei levitystä), virheellinen dokumentti → `invalidDeckIds`/`collection: invalid` + `dropped` (ei poisto, SR-23.3), uudempi versio → `locked`, yli `MAX_DECKS` → `limitExceeded`. `checkChange`: pakat ja kokoelma validoidaan, enintään 500 kirjoitusta, kokoelman JSON-UTF-8-koko alle 900 000 tavua → `too-large`.
- `src/account/firebase/firestoreCloudStore.ts`: Firestore Lite (`loadFirestore` uutena funktiona `loadFirebase.ts`:ssä, `getApp()` = auth-asiakkaan oletussovellus), uid tarkistetaan (SR-23.8), `readAll` = meta + decks (`limit(MAX_DECKS + 1)`) + collection, `commit` `runTransaction`illa: meta luetaan uudelleen, newer → `locked`, rev ≠ odotettu → `conflict`, meta `{ schemaVersion, rev + 1, updatedAt: serverTimestamp() }`. SDK:n latausvirhe → `offline`, uusi yritys seuraavalla kutsulla.
- `memory.ts`: `createMemoryCloud({ uid, now, maxCollectionBytes })` samalla sopimuksella + `setRaw/getRaw/paths/reads/failNext`. `setup.ts` mockaa myös `loadFirestore`n.
- `firestore.rules` liitteen A mukaan, **poikkeama: vain juuri `users` (`match /users/{uid}`), `{root}`-parametri ja `test_users` pois (D-017 Muutos K-P8)**, muuten sisältö sama. `firestore.indexes.json` tyhjä, `firebase.json`iin `firestore`-osio. `src/firestoreRules.test.ts` tarkistaa staattisesti: ei `if true`, ei `read`/`write`, ei `test_users`/`{document=**}`, tarkat match-polut ja jokainen allow alkaa `isOwner(uid)`.
- IDEAS.md: emulaattoritestit (Javaa ei ole koneella, eikä uutta riippuvuutta lisätty) → **sääntöjen testaus käsin** SR-22.4:n kuudella tapauksella testisivustolla deployn jälkeen.
**Poikkeamat D-017:stä (Digiturva/PM):** (1) `CloudErrorKind`issa lisäksi `locked` (commit, kun pilven meta on uudempaa versiota, estää vanhan asiakkaan metan alennuksen). (2) `CloudSnapshot`in muoto tarkennettu (yllä), jotta merge (T-054c) erottaa virheellisen poistetusta. (3) `AccountServices.cloud(uid)` ja Appin kytkentä jätetty T-054c:hen, joten Firestore ei vielä ole buildissa eikä pääpaketti kasva (pääpaketti 127,26 kt gzip). (4) Pakkadokumentin skeemaversio on oma vakio (1), koska localStoragen pakkamigraatiot koskevat listamuotoa.
**Testit:** `npm test` 895/895 (58 tiedostoa; uusia: sopimustestit muisti- ja Firestore-toteutukselle valemoduuleilla, `toCloudError`, säännöt, `decodeEnvelopeValue`), `npm run lint` 0, `npm run build` ja `npm run build:test` läpi, check-dist-env (test) OK. Ei oikeaa verkkoa.
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1
**Velka:** kokoelman koko arvioidaan JSON-UTF-8-pituudella, joka on Firestoren laskentaa suurempi (turvallinen suuntaan).
**Ennen yhdistämistä testiin (käyttäjä):** tietokannat uudelleen `europe-north1`:een, sitten `firebase deploy --only firestore:rules,firestore:indexes --project test` ja SR-22.4:n käsin todennus (kirjataan tähän). **Seuraavaksi:** Digiturva katselmoi `firestore.rules`in ja poikkeamat, sitten T-054c.

## Katselmointi T-054b (Digiturva, 2026-10-03)
Raportti `docs/reports/SEC-014-t054b-firestore.md`. Säännöt vastaavat SR-22:ta ja luonnosta (ainoa ero: vain juuri `users`, K-P8, hyväksytty). SR-23 kohdat 1–6 ja 8–9 täyttyvät, lokeja ei ole, poikkeamat `locked` ja `CloudSnapshot` hyväksytty. Löydökset: 1 Low (SEC-041, `checkChange` koodasi raa'an syötteen, **korjattu** + testi), 2 Info (SEC-042, SEC-043). `npm test` 897/897, lint 0, build ja build:test läpi. **Veto:** koodi ei estä Done-tilaa. Testiin yhdistäminen vasta, kun tietokanta on `europe-north1`:ssä, säännöt on deployattu ja raportin käsin todennuslista (rivit 1–12 heti, 13–15 T-054c:n jälkeen) on kirjattu tähän. T-054c:n katselmoinnissa tarkistetaan, ettei merge käsittele `invalidDeckIds`/`invalid`/`limitExceeded`/`locked`-tiloja poistona.

## Luovutus T-054c ja T-054d (Koodari, 2026-10-03)
**Tehty (haara `t-054-kirjautuminen-ja-pilvitallennus`, ei pushattu):**
- Tallennus: `createRepositories({ namespace })` (avaimet `cyberdeck:u:{uid}:*`, uid validoidaan), `Repositories.forAccount(uid)` ja `Repositories.sync` (`SyncStorage`: `read`, `apply(expected, next)` vain jos paikallinen data ei muuttunut, `loadBase/saveBase`, `backupAll`, `clear`, `eraseAccount`, `onChange`). `apply` ilmoittaa käyttöliittymän `subscribe`-kuuntelijoille samassa välilehdessä (`useDecks`, `collectionStore` ennallaan). Asetukset eivät ole nimiavaruudessa.
- `AccountServices.cloud(uid)` (laiska Firestore-lataus omaan chunkkiinsa), `CloudStore.deleteAll()`. `src/account/sync/merge.ts` (puhdas kolmitiemerge, pakat updatedAt, kokoelma korteittain, virheellinen pilvidokumentti ei ole poisto), `syncEngine.ts` (Web Locks, rev-oikotie: 1 luku kun ei muutoksia ja pelkkä push ilman `readAll`ia, 3 kierrosta konfliktissa, uusi kierros jos paikallinen data muuttui kesken, laukaisijat käynnistys / muutos + 3 s / focus / visibilitychange / online / 5 min, tilat), `session.ts` (ensimmäinen kirjautuminen: tyhjä selain = veto, tyhjä tili = siirto, molemmissa dataa = dialogi; varmuuskopio ennen, kirjautumattoman avaimet tyhjennetään vasta onnistuneen synkronoinnin jälkeen; offline-tilassa suunnittelu toistuu focus/online-tapahtumasta).
- Käyttöliittymä: `App` vaihtaa repositoriot ja näkymäpuun `key={uid ?? 'local'}`; `AccountMenu`: synkronoinnin tila, Synkronoi nyt, varoitus synkronoimattomista muutoksista ennen uloskirjautumista, uloskirjautumisen ilmoitus (tiedot jäävät selaimeen; vain `last-uid` poistuu), Poista tilin tiedot (pilvidata, selaimen tilidata, `deleteUser`; `auth/requires-recent-login` → `reauthenticateWithRedirect` ja poisto valmistuu paluun jälkeen `delete-pending`-vihjeellä; väärä tili tai peruttu paluu ei poista mitään). `FirstSignInDialog` (Yhdistä / Käytä vain tilin tietoja / Peruuta = uloskirjautuminen).
- T-054d: `DeckRepository.update(id, content, { expectedUpdatedAt })` → `StorageError('conflict')`; pakkaeditori näyttää uusimman version ilman omia muutoksia (synkronoinnin tai toisen välilehden tuoma) ja muuten Lataa uusin / Pidä omat muutokset. T-042 tehty (merkitse TASKS.md). Poistuessa ja pagehidessa tallennus ei käytä `expectedUpdatedAt`ia (viimeisin muokkaus säilyy, eikä sivun sulkeminen voi näyttää dialogia).
- Teksti: kirjautumisdialogissa "EU:ssa" (SEC-038), maininta että Google-tili (nimi, sähköposti) on Firebase Authenticationissa, rekisterinpitäjän paikkamerkki "[nimi ja sähköposti lisätään]". PRIVACY.md ja D-017: Firestore tuotanto `eur3`, testi `europe-north1`. Kaikki uudet tekstit ovat työversioita, joita UX ja Sisällöntuottaja eivät ole katselmoineet.
**Testit:** `npm test` kaikki läpi (uusia: merge, syncEngine kymmeniä tapauksia valekellolla ja muistipilvellä, session, tallennuksen nimiavaruus ja `sync`, deleteAll-sopimus, Auth deleteAccount, App-tason kirjautumisvirrat ja poisto, editorin konflikti), `npm run lint` 0, `npm run build` ja `npm run build:test` läpi. Ei oikeaa verkkoa. Pääpaketti kasvoi 127,26 kt → 133,10 kt gzip (sync, merge, UI); Firebase pysyy omissa chunkeissaan.
**Käsin tekemättä (käyttäjä/Testikäyttäjä):** kaksi selainta samalla tilillä testisivustolla, SR-22.4:n ja Digiturvan käsin todennuslistan rivit 13–15, Digiturvan katselmointi (T-054c: SR-23.7 toisella laitteella poistettu tili, SR-26; T-054d: SR-26.4–5, SR-29.3–4), UX-katselmointi dialogeille ja teksteille, Sisällöntuottajan tekstit. Huomio Digiturvalle: merge ei käsittele `invalidDeckIds`/`invalid`/`limitExceeded`/`locked`-tiloja poistona (testit).
**Velka:** (1) Toisella laitteella poistettu tili (SR-23.7): pilvi on tyhjä ja base on olemassa, joten merge käsittelee pilven tyhjyyden poistona ja poistaa muuttumattomat paikalliset pakat (ei palauta niitä); paikalliset muutokset base-tilan jälkeen siirtyvät uudelleen pilveen. Digiturva arvioi, riittääkö tämä vai pitääkö kysyä käyttäjältä. (2) Dialogin ja valikon tekstit ja saavutettavuus (fokus dialogin sulkeutuessa) UX:n katselmoitavaksi. (3) Kokoelman koon arvio on edelleen JSON-UTF-8-pituus.
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 3
