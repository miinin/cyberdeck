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
- [ ] `firebase` lisätty tarkalla versiolla (`npm i -E firebase`), ja koodissa tuodaan vain `firebase/app`, `firebase/auth` ja (b:ssä) `firebase/firestore/lite`. Digiturvan riippuvuuskatselmointi.
- [ ] `src/account/`: `types.ts` (AuthClient, AccountUser), `firebase/config.ts` (committatut `PROD_ENV` ja `TEST_ENV`, valinta `import.meta.env.MODE === 'production'`, puhdas `selectAuthMode(env, host)`: tarkka `siteHost` → redirect, test-config + localhost → popup, muuten pois; D-017 Muutos K-P8), `firebase/loadFirebase.ts` (ainoa `firebase/*`:n tuoja, dynaaminen `import()`), `firebase/firebaseAuthClient.ts` (redirect julkaistuilla sivustoilla, popup localhostissa, `getRedirectResult` käynnistyksessä), `memory.ts` (`createFakeAuth`), `index.ts`.
- [ ] SDK ladataan vain "Kirjaudu"-painalluksesta tai kun `cyberdeck:account:last-uid` on olemassa. Testi: kirjautumaton käynnistys ei kutsu `loadFirebase`a.
- [ ] Yläpalkissa "Kirjaudu"-painike (16+-maininta ja lyhyt tietosuojateksti kirjautumisdialogissa). Kirjautuneena valikko: "Kirjautuneena: <sähköposti>" (vain muistissa) ja "Kirjaudu ulos". Esikatselussa painike kertoo, ettei kirjautuminen ole käytössä. Tekstit `texts.ts`:ssä.
- [ ] `App` ottaa propin `account?: AccountServices`. `src/test/setup.ts` mockaa `loadFirebase`n heittämään "Real Firebase is disabled in tests".
- [ ] ESLint: `firebase/*` sallittu vain `src/account/firebase/**`:ssa, UI tuo vain `../account`in.
- [ ] CSP molemmille sivustoille identtisesti (D-017 kohta 9): `script-src 'self' https://apis.google.com`, connect-src lisäksi `identitytoolkit`, `securetoken` ja `firestore.googleapis.com`, `frame-src 'self'`. `firebaseConfig.test.ts` tarkalla origin-listalla.
- [ ] Bundle: pääpaketin koko ei kasva yli 2 kt gzip (Firebase omana laiskana chunkkina). Chunkin koko kirjataan luovutukseen.
- [ ] `scripts/check-dist-env.mjs <production|test>`: build hylätään, jos `dist/` sisältää toisen ympäristön `projectId`:n tai `apiKey`:n. Ajetaan kaikissa kolmessa workflowssa buildin jälkeen (workflow-muutos → Digiturva). Yksikkötestit `selectAuthMode`ille, myös `cyberdeck-tcg.web.app.evil.example` ja test-config tuotantohostilla.
- [ ] Varmistus testisivustolla yhdistämisen jälkeen: kirjautuminen ja uloskirjautuminen toimivat Chromessa ja Firefoxissa, selaimen konsolissa ei CSP-virheitä. Jos `/__/auth/iframe` estyy X-Frame-Optionsin tai frame-ancestorsin takia, korjataan (SAMEORIGIN / 'self') ja kirjataan tähän.
- [ ] `npm test`, `npm run lint`, `npm run build` läpi.

### T-054b · Firestore-repository ja säännöt (vaatii Digiturvan uhkamallin)
- [ ] `envelope.ts`: `decodeEnvelopeValue(value, spec)`, ja `decodeEnvelope` käyttää sitä. Vanhat testit läpi ennallaan.
- [ ] `src/account/firebase/firestoreCloudStore.ts` (`CloudStore`: `readMeta`, `readAll`, `commit(change, expectedRev)` `runTransaction`illa, meta-revin tarkistus, `CloudError`-luokittelu) ja `memory.ts`: `createMemoryCloud()` samalla sopimuksella. Sopimustestit ajetaan muistitoteutusta vasten.
- [ ] Tietomalli D-017 kohta 3: `users/{uid}`, `users/{uid}/decks/{deckId}`, `users/{uid}/collection/main` molemmissa projekteissa (ei `test_users`-juurta, D-017 Muutos K-P8). Pilvestä luettu data validoidaan samoilla `parse*`-funktioilla, ja virheelliset rivit pudotetaan (lasketaan). Uudempi skeemaversio → `locked`.
- [ ] Kokoelman koodatun koon tarkistus (alle 900 000 tavua) ennen kirjoitusta → `CloudError('too-large')`.
- [ ] `firestore.rules` (vain omistaja, vain sallitut polut ja kentät, kokorajat, kaikki muu kielletty) ja tyhjä `firestore.indexes.json`, `firebase.json`iin `firestore`-osio. Digiturva katselmoi säännöt. Käyttäjä deployaa (konsolitehtävä 9) ennen yhdistämistä testiin.
- [ ] Säännöt deployattu testiprojektiin (konsolitehtävä 12, `--project test`) ennen yhdistämistä testiin ja tuotantoprojektiin ennen julkaisua.
- [ ] Käsin testisivustolla: toisen käyttäjän polkuun kirjoitus ja luku hylätään (selaimen konsolista), oma polku toimii.
- [ ] Testit, lint, build läpi.

### T-054c · Synkronointi, ensimmäinen siirto ja yhdistämisdialogi
- [ ] `createRepositories({ namespace })` ja samassa välilehdessä toimiva `notify`. Tilin avaimet `cyberdeck:u:{uid}:…`, uid validoidaan. Kirjautumattoman avaimet ennallaan.
- [ ] `App` vaihtaa repositoriot ja näkymäpuun `key={uid ?? 'local'}`. `useDecks`, `useCollection` ja `collectionStore` ennallaan (vain testit uusille poluille).
- [ ] `src/account/sync/merge.ts` (puhdas): pakkojen kolmitiemerge (vain toinen muuttunut → se; molemmat → suurempi updatedAt, tasapeli pilvi; poisto vs. muokkaus → muokattu säilyy) ja kokoelman korteittainen kolmitiemerge (molemmat muuttaneet → paikallinen). Kattavat yksikkötestit kaikille haaroille.
- [ ] `src/account/sync/syncEngine.ts`: Web Locks, meta-rev-oikotie (1 luku, kun ei muutoksia), transaktiokonflikti → uusi kierros enintään 3 kertaa, laukaisijat (käynnistys, muutos + 3 s, focus, visibilitychange, online, 5 min), tila `idle | syncing | offline | error | locked`. Testit valekellolla ja muistipilvellä, ei oikeaa verkkoa.
- [ ] Ensimmäinen kirjautuminen: tyhjä selain → veto; tyhjä tili → siirto ja kirjautumattoman avainten tyhjennys onnistuneen commitin jälkeen, varmuuskopio ennen; molemmissa tietoja → dialogi (Yhdistä / Käytä vain tilin tietoja / Peruuta). Testit kaikille kolmelle.
- [ ] Uloskirjautuminen (D-017, käyttäjän valinta): synkronoimattomista muutoksista varoitus, sitten `signOut`. Tilin avaimet `cyberdeck:u:{uid}:*` **jäävät** selaimeen, ja käyttäjälle kerrotaan se ("Tiedot jäävät tähän selaimeen"). Uloskirjautuneena näkyy kirjautumattoman oma data, ei tilin dataa. Testi: avaimet säilyvät, eikä tilin data näy uloskirjautuneena.
- [ ] Synkronoinnin tila näkyy kirjautumisvalikossa (esim. "Tallennettu tilille klo 14.32" / "Ei yhteyttä, muutokset tallessa tällä laitteella"). Tekstit UX:ltä ja Sisällöntuottajalta.
- [ ] Testit, lint, build läpi. Käsin: kaksi selainta samalla tilillä, muutos näkyy toisessa viimeistään fokuksen jälkeen.

### T-054d · Pakkaeditorin ristiriita (T-042), tietosuoja ja viimeistely
- [ ] `DeckRepository.update(id, content, { expectedUpdatedAt })` → `StorageError('conflict')`, kun tallennettu updatedAt on eri. Pakkaeditori lataa uuden version, jos omia tallentamattomia muutoksia ei ole, ja muuten näyttää ilmoituksen (Lataa uusin / Pidä omat muutokset). Testit: kaksi välilehteä (storage-tapahtuma) ja synkronoinnin tuoma muutos. T-042 merkitään tehdyksi.
- [ ] PRIVACY.md ja sovelluksen tietosuojateksti: mitä tallennetaan (uid, pakat, kokoelma), missä (Firestore europe-north1, Firebase Auth), 16+, miten tiedot poistetaan. Digiturva ja Dokumentoija.
- [ ] Poisto-oikeus: käyttäjän päätös (alla) toteutettu.
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
