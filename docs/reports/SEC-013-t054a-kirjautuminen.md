# SEC-013 · T-054a kirjautumiskerros, firebase-riippuvuus, CSP ja dist-tarkistus · katselmointi

**Päivä:** 2026-10-03 · **Katselmoija:** Digiturva · **Malli:** D-014 (kevyt)
**Laajuus:** `git diff 7b41972..HEAD` (commitit e9459fa, a5453e9, 7d75fc1) haarassa `t-054-kirjautuminen-ja-pilvitallennus`: `package.json` ja lukko (`firebase@12.19.0`, `@grpc/grpc-js`-override), `firebase.json` (CSP), `src/account/**`, `src/ui/AccountMenu.tsx`, `src/ui/texts.ts`, `src/storage/*` (tiliavaimet), `src/domain/uid.ts`, `eslint.config.js`, `vite.config.ts`, `scripts/check-dist-env.mjs` ja kolme workflowta. Vertailukohta SR-21–SR-29 (SEC-011) ja D-017 Muutos K-P8. Konsoliasetuksia (SR-25) ei tarkistettu (ei pääsyä).

## Tulos
Ei Critical-, High- eikä Medium-löydöksiä. Yksi Low ja kaksi Info. **Ei estä T-054a:n Done-tilaa eikä yhdistämistä testiin.** SEC-038 on korjattava ennen kuin kirjautuminen julkaistaan tuotantoon tai avataan muille kuin kehittäjälle. Pieni dokumenttikorjaus tehty suoraan: PRIVACY.md:n rivi 11 ja luku 10.3 vastasivat vielä yhden projektin mallia (`test_users`), nyt Muutos K-P8:n mukaisia, ja Firestoren nykyinen sijainti `nam5` on kirjattu.

Ajettu: `npm test` 846/846, `npm run lint` 0, `npm run build` ja `npm run build:test` läpi, `check-dist-env` OK molemmissa tiloissa ja ristiin ajettuna (prod-build test-tarkistuksella) hylkää, kuten pitää. `npm audit`: 0 haavoittuvuutta.

## Löydökset

### SEC-038 · Kirjautumisdialogin tietosuojateksti ei pidä paikkaansa · Low
**Sijainti:** `src/ui/texts.ts`, `accountPrivacy`; PRIVACY.md 10.2 rivi 17 ja 10.3.
**Toistaminen:** Avaa "Kirjaudu" testisivustolla. Teksti: "Tilille tallennetaan vain pakkasi ja kokoelmasi sekä Googlen antama tunniste, ei nimeäsi eikä sähköpostiasi. Tiedot säilytetään Googlen palvelimilla Suomessa…"
**Vaikutus:** (1) Firestore on tällä hetkellä `nam5` (USA) molemmissa projekteissa (kortin infrakirjaus), joten "Suomessa" ei pidä paikkaansa. (2) Firebase Authentication tallentaa sähköpostin, nimen ja kuvan URL:n Googlen globaaliin palveluun (PRIVACY.md rivi 17), joten "ei nimeäsi eikä sähköpostiasi" voi johtaa harhaan, vaikka sovellus ei itse tallenna niitä Firestoreen. Läpinäkyvyysvaatimus (GDPR 13) koskee tekstiä, joka näytetään ennen kirjautumista. T-054a ei tallenna mitään Firestoreen, ja testisivustolla kirjautuu vain kehittäjä, joten vaikutus on nyt pieni.
**Korjausehdotus:** Ennen tuotantojulkaisua tai kirjautumisen avaamista muille: käyttäjä luo tietokannat uudelleen `europe-north1`:een (tai teksti muutetaan vastaamaan todellista sijaintia), ja Sisällöntuottaja täsmentää tekstin muotoon, jossa sanotaan, että Google-kirjautuminen (Firebase Authentication) käsittelee sähköpostia ja nimeä, mutta sovellus ei tallenna niitä pakkojen ja kokoelman yhteyteen. Tietosuojaselosteen linkki lisätään T-054d:ssä (SR-29 kohdat 2–3). Oikeudellinen arvio ei kuulu Digiturvalle.

### SEC-039 · CSP sallii `firestore.googleapis.com`:n jo ennen kuin sitä käytetään · Info
**Sijainti:** `firebase.json`, `connect-src`.
**Havainto:** T-054a ei käytä Firestorea, mutta origin on lisätty jo nyt D-017 kohdan 9 ja SR-24 kohdan 1 mukaisesti. Origin on tarkka (ei jokeria), ja Firestore-pyyntöjä rajaavat säännöt. Tarpeeton lisähyökkäyspinta on käytännössä olematon.
**Tila:** Info, hyväksytty. CSP:n toimivuus redirect-kirjautumisessa (`apis.google.com`, `/__/auth/iframe` `frame-src 'self'`) varmistetaan testisivustolla Chromessa ja Firefoxissa kortin kriteerin mukaan (SEC-033 avoinna).

### SEC-040 · Uusi localStorage-avain `cyberdeck:account:redirect-pending` · Info
**Sijainti:** `src/storage/keys.ts`, `repositories.ts`, `firebaseAuthClient.ts`.
**Havainto:** Arvo on aina `'1'` tai avain puuttuu, ei henkilötietoa. Asetetaan juuri ennen `signInWithRedirect`ia ja poistetaan `getRedirectResult`in jälkeen (`finally`) sekä virheessä. Jos käyttäjä palaa Googlesta takaisin-napilla, avain jää ja seuraava käynnistys lataa SDK:n kerran (yhteys Googleen) ja poistaa sen. Tämä seuraa käyttäjän omasta kirjautumisyrityksestä, eikä toinen origin voi asettaa avainta. Kirjattu PRIVACY.md:n riville 11.
**Tila:** Info, hyväksytty poikkeamana D-017:stä.

## Tarkistettu, ei löydöksiä
| Alue | Tulos |
|---|---|
| Riippuvuus (SR-28) | `firebase` tarkka `12.19.0`, lukon integriteetti sama kuin SEC-011:ssä. Override `@grpc/grpc-js` 1.14.5 voimassa (`npm ls`: "overridden"), `npm audit` 0. Uudet install-skriptit vain `@firebase/util` ja `protobufjs`, samat versiot kuin SEC-034:ssä. |
| Bundle (SR-28 kohta 3) | `dist/`issä ei `@grpc`, `firebase/analytics`, `measurementId` eikä `gtag`. apiKey vain laiskassa `firebaseAuthClient`-chunkissa. Firebase omana chunkkinaan, `loadFirebase` ainoa SDK-tuonti. |
| CSP (SR-24) | Tarkat originit D-017 kohdan 9 mukaan, identtinen molemmilla sivustoilla. Ei `unsafe-*`, jokereita eikä `https:`. `frame-ancestors 'none'`, XFO, COOP ja `no-referrer` ennallaan, ei `/__/**`-otsakesääntöjä. `firebaseConfig.test.ts` valvoo. |
| Config ja sites.ts (SR-21 kohta 2, K-P8) | Ympäristö valitaan `MODE`:lla, käyttämätön ympäristö putoaa (todennettu molemmista buildeista). `selectAuthMode` vertaa `location.host`ia tarkasti, testit kattavat `…web.app.evil.example`, `evil-…`, `*.firebaseapp.com`, localhost-huijaukset ja prodin localhostin. Web-config ei ole salaisuus (R-14). |
| dist-tarkistus | Lukee arvot `config.ts`:stä, tunnistaa id:n kokonaisena (`cyberdeck-tcg` ≠ `cyberdeck-tcg-dev`), joten toisen ympäristön hostit (`…-dev.web.app`) jäävät myös kiinni. Vaatii omat arvot. Tyhjä tai puuttuva `dist/` kaataa ajon. |
| Workflowt | Vain yksi `run`-rivi lisätty buildin jälkeen ja ennen deployta kaikkiin kolmeen. Ei uusia oikeuksia, salaisuuksia eikä actioneita. PR- ja test-workflow käyttävät vain dev-salaisuutta. |
| Kirjautuminen (SR-21) | Vain `GoogleAuthProvider`, `prompt: 'select_account'`, ei lisäscopeja. `initializeAuth` + `indexedDBLocalPersistence`. Tokeneita ei lueta. Virheistä luetaan vain `code` ja näytetään kiinteä viesti. Sähköposti vain muistista ja React-tekstinä. Kirjautumaton käyttäjä ei lataa SDK:ta (lazy client + vihjeet), testeissä `loadFirebase` estetty. |
| Tiliavaimet (SR-23 kohta 8, SR-29 kohta 1) | `last-uid` validoidaan `isUid`illa luettaessa ja kirjoitettaessa, poistetaan uloskirjautuessa. Avaimet eivät koskaan heitä. |
| Lokit (SR-27) | Ei `console`-kutsuja tilikerroksessa eikä AccountMenussa, ESLint `no-console: error` `src/account/**`. |
| ESLint-rajat | `firebase/*` vain `src/account/firebase/**`:ssa ja siellä vain `app`, `auth`, `firestore/lite`. UI tuo vain `../account`in. |
| Salaisuudet | Diff ja `git log --all -p` (`private_key`, `BEGIN … PRIVATE`, `client_secret`, `ghp_`, `AKIA`): osumia vain aiempien raporttien tarkistustaulukoissa. |
| XSS | Ei `dangerouslySetInnerHTML`ia eikä HTML-merkkijonoja; käyttäjälle näkyvät tilitiedot tekstinä (SR-1). |
