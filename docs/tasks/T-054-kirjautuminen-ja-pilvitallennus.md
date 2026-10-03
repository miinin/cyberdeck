# T-054 · Google-kirjautuminen ja pakkojen ja kokoelman pilvitallennus
**Tila:** Backlog (suunniteltu, odottaa D-017:n hyväksyntää ja Digiturvan uhkamallia) · **Omistaja:** Koodari (vaiheittain) · **MVP:** 2 · **Prioriteetti:** Must
**Päätökset:** D-016 (käyttäjä), D-017 (Arkkitehti, Ehdotettu). **Haara:** `t-054-kirjautuminen-ja-pilvitallennus` (suunnittelu); toteutus vaiheittain haaroihin `t-054a-…`, `t-054b-…` jne.
**Katselmoinnit:** Digiturva ◐ (uhkamalli ja sääntöluonnos ✓ 2026-10-03 SEC-011; riippuvuus a:ssa, koodi b:ssä ja c:ssä) · Arkkitehti ☐ (b:n tietomalli ja c:n synkronointi) · UX ja Sisällöntuottaja ☐ (kirjautumis-, yhdistämis- ja uloskirjautumisdialogit ennen c:tä) · Testikäyttäjä ☐ (d:n jälkeen kahdella laitteella)
**Riippuvuudet:** käyttäjän konsolitehtävät (alla) ennen a:n testausta testisivustolla.

## Tavoite
Käyttäjä voi halutessaan kirjautua Google-tilillä, jolloin pakat ja kokoelma tallentuvat tilille ja näkyvät kaikilla laitteilla. Ilman kirjautumista kaikki toimii kuten ennen. Rakenne: D-017.

## Käyttäjän tehtävät konsolissa (ennen T-054a:n testausta)
Firebase Console, projekti `cyberdeck-tcg`:
1. **Authentication → Get started → Sign-in method → Google → Enable.** Anna julkinen nimi (esim. "Cyberdeck") ja tukisähköposti, Save.
2. **Authentication → Settings → Authorized domains:** tarkista, että listalla ovat `localhost`, `cyberdeck-tcg.firebaseapp.com` ja `cyberdeck-tcg.web.app` (lisätään oletuksena), ja **lisää `cyberdeck-tcg-test.web.app`**. PR-esikatseluja (`cyberdeck-tcg-test--pr-…web.app`) ei lisätä, koska jokerimerkki ei käy eikä käyttämämme GitHub Action lisää niitä automaattisesti. Esikatselussa kirjautuminen on siksi pois käytöstä (D-017 kohta 1).
3. **Firestore Database → Create database:** Standard edition, tietokanta `(default)`, sijainti **`europe-north1` (Finland)** (suositus: lähin ja Spark-ilmaistasoon sopiva yksi tietokanta; `eur3` on monialueinen vaihtoehto). **Sijaintia ei voi muuttaa jälkikäteen.** Aloita tilassa **"Start in production mode"** (kaikki kielletty), jolloin mitään ei ole auki ennen omien sääntöjen deployta.
4. **Project settings → General → Your apps → Add app → Web (</>)**, nimi esim. "cyberdeck-web", **älä** valitse Firebase Hostingin liittämistä uudelleen. Kopioi `firebaseConfig`-olion arvot (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) ja anna ne PM:lle. Ne eivät ole salaisuuksia, ja ne committataan tiedostoon `src/account/firebase/config.ts` (D-017 kohta 2).
5. **Plan pysyy Sparkina.** Älä hyväksy Blaze-päivitystä, jos konsoli sitä tarjoaa.

Google Cloud Console (sama projekti, https://console.cloud.google.com/apis/credentials?project=cyberdeck-tcg):
6. **APIs & Services → Credentials → OAuth 2.0 Client IDs → "Web client (auto created by Google Service)" → Authorized redirect URIs:** lisää `https://cyberdeck-tcg.web.app/__/auth/handler` ja `https://cyberdeck-tcg-test.web.app/__/auth/handler`, Save. Tämä tarvitaan, koska `authDomain` on sivuston oma domain (uudelleenohjaus samassa originissa).
7. **APIs & Services → OAuth consent screen (Branding):** tarkista sovelluksen nimi ja tukisähköposti. Lisää halutessasi tietosuojasivun linkki, kun PRIVACY-teksti on julkaistu (T-054d).
8. (Suositus) **Credentials → API keys → Browser key (auto created by Firebase) → Application restrictions → Websites:** `https://cyberdeck-tcg.web.app/*`, `https://cyberdeck-tcg-test.web.app/*`, `https://*.web.app/*` (esikatselut) ja `http://localhost:*/*`.

Komentorivi (T-054b:n jälkeen, ennen b:n yhdistämistä testiin; hook kysyy luvan):
9. `firebase deploy --only firestore:rules,firestore:indexes` (säännöt koskevat molempia sivustoja heti, D-017 kohta 10).

## Vaiheet ja hyväksymiskriteerit

### T-054a · Config, auth-tila ja kirjautumis-UI (ei vielä pilvitallennusta)
- [ ] `firebase` lisätty tarkalla versiolla (`npm i -E firebase`), ja koodissa tuodaan vain `firebase/app`, `firebase/auth` ja (b:ssä) `firebase/firestore/lite`. Digiturvan riippuvuuskatselmointi.
- [ ] `src/account/`: `types.ts` (AuthClient, AccountUser), `firebase/config.ts` (committattu config, authDomain ja ympäristöjuuri hostin mukaan sallitulta listalta), `firebase/loadFirebase.ts` (ainoa `firebase/*`:n tuoja, dynaaminen `import()`), `firebase/firebaseAuthClient.ts` (redirect julkaistuilla sivustoilla, popup localhostissa, `getRedirectResult` käynnistyksessä), `memory.ts` (`createFakeAuth`), `index.ts`.
- [ ] SDK ladataan vain "Kirjaudu"-painalluksesta tai kun `cyberdeck:account:last-uid` on olemassa. Testi: kirjautumaton käynnistys ei kutsu `loadFirebase`a.
- [ ] Yläpalkissa "Kirjaudu"-painike (16+-maininta ja lyhyt tietosuojateksti kirjautumisdialogissa). Kirjautuneena valikko: "Kirjautuneena: <sähköposti>" (vain muistissa) ja "Kirjaudu ulos". Esikatselussa painike kertoo, ettei kirjautuminen ole käytössä. Tekstit `texts.ts`:ssä.
- [ ] `App` ottaa propin `account?: AccountServices`. `src/test/setup.ts` mockaa `loadFirebase`n heittämään "Real Firebase is disabled in tests".
- [ ] ESLint: `firebase/*` sallittu vain `src/account/firebase/**`:ssa, UI tuo vain `../account`in.
- [ ] CSP molemmille sivustoille identtisesti (D-017 kohta 9): `script-src 'self' https://apis.google.com`, connect-src lisäksi `identitytoolkit`, `securetoken` ja `firestore.googleapis.com`, `frame-src 'self'`. `firebaseConfig.test.ts` tarkalla origin-listalla.
- [ ] Bundle: pääpaketin koko ei kasva yli 2 kt gzip (Firebase omana laiskana chunkkina). Chunkin koko kirjataan luovutukseen.
- [ ] Varmistus testisivustolla yhdistämisen jälkeen: kirjautuminen ja uloskirjautuminen toimivat Chromessa ja Firefoxissa, selaimen konsolissa ei CSP-virheitä. Jos `/__/auth/iframe` estyy X-Frame-Optionsin tai frame-ancestorsin takia, korjataan (SAMEORIGIN / 'self') ja kirjataan tähän.
- [ ] `npm test`, `npm run lint`, `npm run build` läpi.

### T-054b · Firestore-repository ja säännöt (vaatii Digiturvan uhkamallin)
- [ ] `envelope.ts`: `decodeEnvelopeValue(value, spec)`, ja `decodeEnvelope` käyttää sitä. Vanhat testit läpi ennallaan.
- [ ] `src/account/firebase/firestoreCloudStore.ts` (`CloudStore`: `readMeta`, `readAll`, `commit(change, expectedRev)` `runTransaction`illa, meta-revin tarkistus, `CloudError`-luokittelu) ja `memory.ts`: `createMemoryCloud()` samalla sopimuksella. Sopimustestit ajetaan muistitoteutusta vasten.
- [ ] Tietomalli D-017 kohta 3: `{root}/{uid}`, `decks/{deckId}`, `collection/main`; root `users` tuotannossa ja `test_users` muualla. Pilvestä luettu data validoidaan samoilla `parse*`-funktioilla, ja virheelliset rivit pudotetaan (lasketaan). Uudempi skeemaversio → `locked`.
- [ ] Kokoelman koodatun koon tarkistus (alle 900 000 tavua) ennen kirjoitusta → `CloudError('too-large')`.
- [ ] `firestore.rules` (vain omistaja, vain sallitut polut ja kentät, kokorajat, kaikki muu kielletty) ja tyhjä `firestore.indexes.json`, `firebase.json`iin `firestore`-osio. Digiturva katselmoi säännöt. Käyttäjä deployaa (konsolitehtävä 9) ennen yhdistämistä testiin.
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
- **T-054a:** SR-21 (tarkka host-lista, tuntematon host → kirjautuminen pois, juuri ei oletuksena `users`, `select_account`, ei tokenien käsittelyä), SR-24 (tarkka CSP, ei jokerimerkkejä, XFO/frame-ancestors/COOP/no-referrer ennallaan), SR-25 (konsoli: API restrictions pakollinen, referrer-rajaus ilman `*.web.app`:ia, ks. SEC-028), SR-27 (`no-console` `src/account/**`), SR-28 (`firebase@12.19.0` tarkkana, `@grpc/grpc-js`-override, `dist/`-tarkistus), SR-29 kohta 2 (16+ ja tietosuojateksti dialogissa).
- **T-054b:** SR-22 (säännöt liitteen mukaan, production mode ennen deployta, käsin todennus kuudella tapauksella), SR-23 kohdat 1–6, 8–9 (validointi, ei mappien levitystä, virheellinen ≠ poisto, `MAX_DECKS + 1`).
- **T-054c:** SR-23 kohta 7 (toisella laitteella poistettu tili ei palaudu automaattisesti), SR-26 kohdat 1–3 (`last-uid` pois, minimi-ilmoitus jaetusta koneesta, suositus "Poista tiedot tästä selaimesta").
- **T-054d:** SR-26 kohdat 4–5 ("Poista tilin tiedot", Auth-käyttäjän poisto K-P5), SR-29 kohdat 3–4 (seloste ennen avaamista muille).
- **Käyttäjälle PM:n kautta:** R-18 / K-P8 (testisivuston koodi pääsee saman käyttäjän tuotantodataan), K-P5–K-P7. Konsolitehtävä 8 päivitettävä SEC-028:n mukaan, D-017 kohta 7 SEC-029:n mukaan.

## Käyttäjän päätettävät asiat
- D-017:n hyväksyntä (uusi riippuvuus `firebase` noin 63 kt gzip vain kirjautuville, CSP:n laajennus Googlen osoitteisiin).
- Firestoren sijainti: suositus `europe-north1` (pysyvä valinta).
- Poisto-oikeus MVP:ssä: (a) "Poista tilin tiedot" -painike, joka poistaa pakat, kokoelman ja metan Firestoresta (noin 30 riviä, suositus) vai (b) ohje, jolla käyttäjä pyytää poistoa ylläpitäjältä. Firebase Auth -tilin poisto vaatii tuoreen kirjautumisen, joten se tehdään vain, jos käyttäjä haluaa.
- Uloskirjautuminen poistaa tilin tiedot selaimesta (ehdotus D-017 kohta 7). Vaihtoehto: säilytetään selaimessa seuraavaa kirjautumista varten.

## Rajaukset (ei kuulu tähän)
- Muut kirjautumistavat (D-016: vain Google).
- Reaaliaikainen synkronointi (`onSnapshot`), kokoelman pilkkominen useaan dokumenttiin, sääntöjen emulaattoritestit, erillinen testiprojekti → IDEAS.md.
- Asetusten (teema, näkymät) synkronointi.
- Kirjautuminen PR-esikatseluissa.

## Luovutukset
### Luovutus Arkkitehti → PM · 2026-10-03
Suunnittelu valmis: ADR D-017 (Ehdotettu), tämä kortti ja vaiheet a–d. Seuraavaksi: käyttäjän hyväksyntä D-017:lle ja päätökset yllä, konsolitehtävät 1–8, Digiturvan uhkamalli ja sääntövaatimukset (ennen b:tä), sitten T-054a Koodarille.

### Luovutus Digiturva → PM · 2026-10-03
Uhkamalli (STRIDE) ja turvavaatimukset SR-21–SR-29 valmiit: `docs/reports/SEC-011-t054-uhkamalli.md`, sääntöluonnos liitteenä (ei repon juuressa), PRIVACY.md luku 10 luonnoksena, SECURITY.md luku 17 ja riskit R-18–R-20. Löydökset: 2 Medium (SEC-028 API-avaimen rajaus, SEC-030 yhteinen projekti → R-18 käyttäjän hyväksyttäväksi), 3 Low, 2 Info. `firebase@12.19.0` hyväksyttävä ehdoin SR-28. Veto: ei blokkaa T-054a:ta. T-054b:tä ei yhdistetä testiin ennen sääntöjen deployta ja käsin todennusta. Seuraavaksi: PM hyväksyy SR:t kriteereiksi, päivittää konsolitehtävän 8 ja D-017 kohdan 7, vie K-P5–K-P8 käyttäjälle.
