# SEC-011 · T-054 kirjautuminen ja pilvitallennus · uhkamalli ja turvavaatimukset ennen toteutusta

**Päivä:** 2026-10-03 · **Laatija:** Digiturva · **Malli:** D-014 (kevyt)
**Laajuus:** D-016, D-017 (hyväksytty käyttäjän valinnoin) ja `docs/tasks/T-054-kirjautuminen-ja-pilvitallennus.md`. Koodia ei vielä ole, joten tämä on suunnittelukatselmointi. Tarkistettu lisäksi: `firebase.json`, `src/domain/deck.ts`, `validate.ts`, `collection.ts`, `cardKey.ts` (rajat sääntöjä varten), `eslint.config.*`, testisivuston otsakkeet (`curl -I`, vain luku, oma sivusto) ja riippuvuus `firebase@12.19.0` (npm-rekisteri, koeasennus scratchpadissa `--ignore-scripts`, `npm audit`, `npm audit signatures`).
**Liite A:** `docs/reports/SEC-011-t054-liite-firestore.rules` (sääntöluonnos, ei vielä repon juuressa eikä deployattu).
**Tietosuoja:** `docs/PRIVACY.md` luku 10 (luonnos).

## Tulos
Ei Critical- eikä High-löydöksiä suunnitelmassa. Kaksi Medium (SEC-028 API-avaimen rajaus, SEC-030 testin ja tuotannon yhteinen projekti), kolme Low ja kaksi Info. Turvavaatimukset **SR-21–SR-29** alla. **Veto:** ei blokkaa T-054a:n aloitusta. T-054b:tä ei yhdistetä testiin ennen kuin SR-22:n säännöt on deployattu ja käsin todennettu. Kirjautumista ei avata muille kuin kehittäjälle ennen SR-29:n tietosuojaselostetta ja käyttäjän päätöstä R-18:sta.

## Uhkamalli (STRIDE)

**Uudet suojattavat asiat:** Google-tilin istunto (Firebase refresh- ja ID-token selaimen IndexedDB:ssä), uid, käyttäjän pilvidata (pakat, kokoelma), Firestoren ja Authin ilmaiskiintiö (Spark), Firebase Auth -tietue (sähköposti, nimi, kuvan URL, kirjautumisajat; Googlen hallussa).
**Uudet luottamusrajat:** selain ↔ Firebase Auth / Google OAuth (uudelleenohjaus `/__/auth/handler`), selain ↔ Firestore (REST, Lite), Firestore → selain (pilvidata on epäluotettavaa, koska sen on voinut kirjoittaa toinen laite, vanha tai buginen versio tai käyttäjä itse REST-rajapinnalla), testisivuston koodi ↔ tuotannon data (sama projekti).
**Hyökkääjät:** kuka tahansa Google-tilin omaava (pääsee Firestoreen julkisella apiKeyllä), toinen saman koneen käyttäjä, haitallinen tai buginen PR-koodi testisivustolla, XSS (jos sellainen syntyisi).

| | Uhka | Todennäköisyys / vaikutus | Torjunta |
|---|---|---|---|
| **S** | Toinen käyttäjä lukee tai kirjoittaa toisen uid:n polkuun | Keskisuuri / Suuri ilman sääntöjä | SR-22 (vain omistaja, `request.auth.uid == uid`), tietokanta production modessa ennen deployta |
| **S** | Kirjautuminen muulla tavalla (anonyymi, sähköposti) REST:llä julkisella apiKeyllä | Pieni / Keskisuuri | Vain Google päällä (SR-25), säännöissä `sign_in_provider == 'google.com'` (SR-22) |
| **S** | Jaetulla koneella seuraava käyttäjä kirjautuu edellisen Google-istunnolla huomaamattaan | Keskisuuri / Pieni | `prompt: 'select_account'`, uloskirjautumisen ilmoitus (SR-26) |
| **S** | Haitallinen sivu (esim. PR-esikatselu tai localhost) käynnistää kirjautumisen projektiin | Pieni / Keskisuuri | Authorized domains vain omat (SR-25), sovelluksen tarkka host-lista (SR-21) |
| **T** | Käyttäjä tai buginen asiakas kirjoittaa ylimääräisiä kenttiä, jättidokumentteja tai vääriä tyyppejä | Keskisuuri / Pieni | Kenttä- ja kokorajat säännöissä (SR-22), asiakkaan validointi luettaessa (SR-23) |
| **T** | Rikkinäinen pilvidokumentti tulkitaan poistoksi ja synkronointi poistaa pakan kaikilta laitteilta | Keskisuuri / Keskisuuri | SR-23 kohta 3 (virheellinen ≠ poistettu) |
| **T** | Testisivuston koodi kirjoittaa tuotannon juureen `users/{uid}` | Pieni / Keskisuuri | Host-lista oletuksena ei koskaan `users` (SR-21), jäännösriski R-18 |
| **R** | Kuka muutti dataa? | Pieni / Pieni | Ei tarvita: vain omistaja kirjoittaa omaa dataansa. Meta `updatedAt` on palvelimen aika. Data Access -auditointilokit pidetään pois (SR-27). |
| **I** | Tilin data jää jaetulle koneelle uloskirjautumisen jälkeen (käyttäjän valinta) | Keskisuuri / Pieni | SR-26 (ilmoitus, tilin data ei näy uloskirjautuneena, valinnainen poisto), R-20 |
| **I** | Sähköposti tai token päätyy konsoliin, lokeihin, localStorageen tai Firestoreen | Pieni / Keskisuuri | SR-21 kohta 3, SR-27, SR-29 kohta 1 |
| **I** | Referer vuotaa osoitteen Googlelle | Pieni / Pieni | `Referrer-Policy: no-referrer` säilyy (SR-24) |
| **D** | Kuka tahansa Google-käyttäjä täyttää Sparkin päiväkiintiön tai 1 GiB tallennustilan omalla uid:llään (säännöt eivät voi rajata dokumenttien määrää) | Pieni / Pieni (paikallinen ensin: sovellus toimii, vain synkronointi katkeaa) | Kokorajat (SR-22), Spark ei laskuta, App Check myöhemmin (IDEAS), R-19 |
| **D** | Oma synkronointi silmukoi ja kuluttaa kiintiön | Pieni / Keskisuuri | D-017:n meta-rev-oikotie, enintään 3 uusintaa, laukaisijoiden viiveet; testit valekellolla |
| **E** | Laaja CSP-lisäys (esim. `*.googleapis.com`, `'unsafe-inline'`) avaa XSS:lle tien | Pieni / Suuri | Tarkka CSP (SR-24), lisäykset vain havaitusta tarpeesta |
| **E** | `/__/auth/*`-sivujen otsakkeiden löysennys koko sivustolle | Pieni / Keskisuuri | Todennettu tarpeettomaksi (SEC-033), SR-24 kohta 2 |
| **E** | Riippuvuuden install-skripti CI:ssä julkaisusalaisuuden kanssa (R-5) | Pieni / Suuri | Install-skriptit luettu (SEC-034), tarkka versio ja lukko (SR-28) |

## Turvavaatimukset SR-21–SR-29 (ehdotukset hyväksymiskriteereiksi, PM hyväksyy)

#### SR-21 · Kirjautuminen (T-054a)
1. Vain `GoogleAuthProvider`, ei lisäscopeja, `setCustomParameters({ prompt: 'select_account' })`.
2. Host valitaan **tarkalla vertailulla** `location.host`ia vasten (ei `includes`/`endsWith`): `cyberdeck-tcg.web.app` → authDomain sama, juuri `users`; `cyberdeck-tcg-test.web.app` → authDomain sama, juuri `test_users`; `localhost:<portti>` ja `127.0.0.1:<portti>` → authDomain `cyberdeck-tcg.firebaseapp.com`, popup, juuri `test_users`. **Kaikki muu** (PR-esikatselut, `cyberdeck-tcg.firebaseapp.com`, tuntemattomat) → kirjautuminen pois, SDK:ta ei ladata. Juuri ei ole koskaan oletuksena `users`. Yksikkötestit jokaiselle haaralle ja esim. hostille `cyberdeck-tcg.web.app.evil.example`.
3. `initializeAuth` + `indexedDBLocalPersistence`. Tokeneita (`getIdToken`, `refreshToken`, `stsTokenManager`) ei lueta omaan koodiin, tallenneta eikä tulosteta. `firebase/*` tuodaan vain `src/account/firebase/**`:ssa ja vain `firebase/app`, `firebase/auth`, `firebase/firestore/lite` (ESLint `no-restricted-imports`, muut alipolut kielletty, esim. `firebase/analytics`).
4. `getRedirectResult`- ja `signIn`-virheet näytetään kiinteinä viesteinä `error.code`n perusteella. Sähköposti näytetään vain tekstinä (SR-1) ja vain muistista.
5. Kirjautumaton käyttäjä ei lataa SDK:ta eikä ota yhteyttä Googleen (kortin testi `loadFirebase`-kutsuista).

#### SR-22 · Firestore-säännöt (T-054b, liite A)
1. Repon juureen `firestore.rules` liitteen A mukaisena, `firestore.indexes.json` tyhjänä ja `firebase.json`iin `firestore`-osio. Poikkeamat liitteestä perustellaan luovutuksessa ja Digiturva katselmoi ne.
2. Sisältö: vain juuret `users` ja `test_users`; vain omistaja (`request.auth.uid == uid`) ja vain Google-kirjautuminen; vain polut meta, `decks/{deckId}` (`^[A-Za-z0-9_-]{1,64}$`) ja `collection/main`; tarkat avainjoukot (`hasAll` + `hasOnly`) kaikilla tasoilla; `schemaVersion` kokonaisluku 1–1000; meta `rev` luodaan arvolla 1 ja kasvaa täsmälleen yhdellä; meta `updatedAt == request.time` (serverTimestamp); pakan nimi 1–200, `sections` ≤ 20, kokoelman `entries` ≤ 5000; juuren listaus kielletty; kaikki muu kielletty. Ei koskaan `allow … if true`, ei edes väliaikaisesti.
3. Tietokanta luodaan production modessa (kaikki kielletty) ja pysyy siinä, kunnes käyttäjä deployaa säännöt (konsolitehtävä 9) **ennen** kuin T-054b yhdistetään testiin.
4. Käsin testisivustolla (selaimen konsolista, kirjattava korttiin): oma polku luku ja kirjoitus toimii; toisen uid:n polku luku ja kirjoitus hylätään; tuntematon juuri (esim. `foo/{uid}`) hylätään; ylimääräinen kenttä hylätään; väärä `rev` hylätään; kirjautumaton pyyntö hylätään. Firebase-konsolin Rules Playground käy myös.
5. SR-9 laajennetaan: `firestore.rules`, `firestore.indexes.json` ja Firebase-konsolin Auth- ja API-avainasetukset kuuluvat aina Digiturvan katselmointiin. Emulaattoritestit → IDEAS.md (D-017).

#### SR-23 · Pilvidata on epäluotettavaa (T-054b, T-054c)
1. Jokainen luettu dokumentti kulkee `decodeEnvelopeValue` + `parseDeck`/`parseCollection` -polun läpi. Pakan id otetaan dokumentin id:stä ja tarkistetaan `isDeckId`llä. Datan omaa `id`-kenttää ei käytetä.
2. Firestoren mappeja ei levitetä (`...`, `Object.assign`, syvä merge) sovelluksen olioihin, vaan luetaan vain tunnetut kentät. Testi: pilvidokumentti, jossa on avaimet `__proto__`, `constructor` ja ylimääräisiä kenttiä, ei saastuta prototyyppiä eikä tuo kenttiä malliin.
3. **Virheellinen pilvidokumentti ei ole poisto.** Merge ei tulkitse pudotettua riviä poistoksi eikä poista tai ylikirjoita virheellistä pilvidokumenttia automaattisesti. Pudotettujen määrä näytetään tilassa (`error`-varoitus). Testi: pohjassa oleva pakka muuttuu pilvessä virheelliseksi → paikallinen pakka säilyy.
4. Uudempi `schemaVersion` (meta tai dokumentti) → `locked`, ei kirjoituksia.
5. `readAll` hakee enintään `MAX_DECKS + 1` pakkaa. Jos raja ylittyy, tila on `locked` tai `error` eikä mitään poisteta.
6. Ennen kirjoitusta paikallinen data on validoitu (SR-11) ja kokoelman koodattu koko on alle 900 000 tavua (kortin kriteeri).
7. Jos meta puuttuu mutta synkronoinnin pohjan `rev` > 0 (tiedot poistettu toisella laitteella "Poista tilin tiedot" -toiminnolla), synkronointi ei työnnä paikallista dataa automaattisesti takaisin, vaan kysyy käyttäjältä.
8. uid tarkistetaan (`^[A-Za-z0-9]{1,128}$`) ennen kuin sitä käytetään localStorage-avaimessa tai polussa.
9. Kaikki pilvestä tullut renderöidään tekstinä (SR-1).

#### SR-24 · CSP ja otsakkeet (T-054a)
1. CSP D-017 kohdan 9 mukaisesti, identtisenä molemmilla sivustoilla: `script-src 'self' https://apis.google.com`, `connect-src 'self' https://api.netdeck.gg https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com`, `frame-src 'self'`. Ei `'unsafe-inline'`, `'unsafe-eval'`, jokerimerkkejä (`*.googleapis.com`, `*.google.com`) eikä `https:`-skeemaa. Lisäorigini vain selaimen konsolissa havaitun CSP-virheen perusteella, ja jokainen lisäys kirjataan korttiin ja katselmoidaan.
2. `frame-ancestors 'none'` ja `X-Frame-Options: DENY` säilyvät. **Todennettu 2026-10-03** (`curl -I`): Firebase Hosting ei lisää `firebase.json`in otsakkeita polkuihin `/__/auth/iframe` ja `/__/auth/handler` (vain `/` ja `/__/firebase/init.json` saavat ne), joten oman originin iframe toimii ilman löysennystä. `/__/**`-poluille ei lisätä otsakesääntöjä. Jos testisivustolla silti havaitaan esto, ratkaisu tuodaan Digiturvalle ennen muutosta.
3. `Cross-Origin-Opener-Policy: same-origin` säilyy (julkaistuilla sivustoilla uudelleenohjaus, popup vain localhostissa).
4. `Referrer-Policy: no-referrer` säilyy (SR-3). Sitä ei löysennetä API-avaimen referrer-rajauksen vuoksi (SR-25).
5. `firebaseConfig.test.ts` tarkistaa CSP:n tarkat origin-listat molemmille sivustoille.

#### SR-25 · Konsoliasetukset ja API-avaimen rajaus (käyttäjä, ennen T-054a:n testausta)
1. **API restrictions (pakollinen):** selainavain rajataan rajapintoihin Identity Toolkit API, Token Service API ja Cloud Firestore API. Jos kirjautuminen tai synkronointi ei toimi, puuttuva rajapinta lisätään ja kirjataan.
2. **Application restrictions (valinnainen):** jos referrer-rajaus otetaan käyttöön, vain tarkat osoitteet `https://cyberdeck-tcg.web.app/*`, `https://cyberdeck-tcg-test.web.app/*`, `https://cyberdeck-tcg.firebaseapp.com/*` ja `http://localhost:*/*`. **Ei koskaan `https://*.web.app/*`** (SEC-028). Koska sivusto lähettää `no-referrer`, rajaus voi estää kirjautumisen (`API_KEY_HTTP_REFERRER_BLOCKED`). Testataan testisivustolla; jos estää, referrer-rajaus poistetaan eikä `Referrer-Policy`a löysennetä. apiKey ei ole salaisuus, suojaus on säännöissä.
3. Authorized domains: vain `localhost`, `cyberdeck-tcg.firebaseapp.com`, `cyberdeck-tcg.web.app`, `cyberdeck-tcg-test.web.app`.
4. Sign-in providers: vain Google. Anonyymi ja sähköposti pois. Email enumeration protection päällä (oletus).
5. Firestore `europe-north1`, production mode. Plan pysyy Sparkina.
6. Cloud Audit Logsin Data Access -lokit Firestorelle pysyvät pois päältä (oletus), koska ne kirjaisivat uid:t ja IP-osoitteet.

#### SR-26 · Uloskirjautuminen, jaettu kone ja tilin tietojen poisto (T-054c, T-054d)
1. Uloskirjautuminen: `signOut` (poistaa Firebasen istunnon IndexedDB:stä) ja `cyberdeck:account:last-uid` poistetaan, jotta SDK ei lataudu eikä kirjaudu automaattisesti seuraavalla käynnistyksellä. `cyberdeck:u:{uid}:*` jää käyttäjän valinnan mukaan. Uloskirjautuneena tilin data ei näy (kortin testi).
2. **Minimi-ilmoitus (pakollinen)** uloskirjautumisen jälkeen tai dialogissa, sisällöltään: *"Kirjauduit ulos. Tilin pakat ja kokoelma jäivät tähän selaimeen, mutta ne näkyvät vasta, kun kirjaudut uudelleen. Jos kone on yhteinen, poista ne tästä selaimesta ja kirjaudu ulos myös Google-tililtä."* Sisällöntuottaja muotoilee, sisältö säilyy.
3. **Suositus (Should, PM päättää):** ilmoituksessa painike "Poista tiedot tästä selaimesta", joka poistaa `cyberdeck:u:{uid}:*` (myös synkronoinnin pohjan) vahvistuksen jälkeen. Pilven data säilyy.
4. **"Poista tilin tiedot" (GDPR 17, käyttäjän päätös D-017):** vahvistusdialogi, joka kertoo, että poisto on peruuttamaton ja koskee kaikkia laitteita. Poistaa nykyisen juuren `decks/*`, `collection/main` ja metan (batch, enintään 500 operaatiota), sitten `cyberdeck:u:{uid}:*` ja `last-uid` tästä selaimesta, ja kirjaa ulos. Onnistuminen tarkistetaan (meta puuttuu, pakkoja ei ole). Muilla laitteilla SR-23 kohta 7 estää paluun. Testit muistipilvellä.
5. Firebase Auth -tietue (sähköposti, nimi, kuvan URL) jää Googlelle, ellei sitä poisteta. Digiturvan suositus: sama toiminto poistaa myös Auth-käyttäjän (`deleteUser`, ja `auth/requires-recent-login` → `reauthenticateWithRedirect` ja uusi yritys). Muuten PRIVACY-selosteeseen ohje poistopyynnöstä ylläpitäjälle. **Käyttäjän päätös, K-P5.**

#### SR-27 · Lokit ja virheet (kaikki vaiheet)
1. Tuotantokoodi ei kirjoita konsoliin uid:tä, sähköpostia, tokeneita, `User`-oliota, pilvidokumenttien sisältöä eikä raakoja virheolioita. ESLint `no-console: error` hakemistoon `src/account/**`.
2. Virheet luokitellaan (`CloudError`) ja näytetään kiinteinä viesteinä. Firestore Liten `setLogLevel('error')` tai `'silent'`.
3. Ei analytiikkaa, virheraportointipalvelua, Performance Monitoringia eikä Crashlyticsia.
4. Testeissä oikea Firebase on estetty (`loadFirebase`-mock), kuten `fetch`.

#### SR-28 · Riippuvuus `firebase` (T-054a)
1. `npm i -E firebase@12.19.0`, lukkotiedosto mukaan. Integriteetti `sha512-kwXCLcI0ly2lkwygkbuRx6SsX3DSO96355YrWh9SWZ5ncsxK/y5cirn3sY6nZVSiBVE++2nL6Hchzu1EB8uohQ==`.
2. `npm audit` näyttää 4 High -löydöstä yhdestä syystä: `@firebase/firestore` → `@grpc/grpc-js@1.9.16` (SEC-031). Korjaus: `package.json`iin `"overrides": { "@grpc/grpc-js": "1.14.5" }`, jonka jälkeen `npm audit` = 0, ja testit ja build läpi. Jos override aiheuttaa ongelmia, tilanne kirjataan Low-riskiksi (vain Node-polku, ei selainpaketissa) ja PM kysyy käyttäjältä hyväksynnän.
3. Build-tarkistus luovutukseen: `dist/`issä ei ole merkkijonoja `@grpc`, `firebase/analytics`, `measurementId` eikä `gtag`. Firebase on omana laiskana chunkkinaan.
4. Päivitykset omana tehtävänään `npm audit`illa (ei `^`-versioita).

#### SR-29 · Tietosuoja (T-054a ja T-054d, PRIVACY.md luku 10)
1. Firestoreen tallennetaan vain: uid (polussa), pakat, kokoelma ja meta (`schemaVersion`, `rev`, palvelimen aika). Ei sähköpostia, nimeä, kuvaa eikä laitetietoja. localStorageen uid saa päätyä vain avaimiin `cyberdeck:u:{uid}:…` ja `cyberdeck:account:last-uid` (SR-16:n poikkeus, kirjattu PRIVACY.md:hen).
2. Kirjautumisdialogi ennen uudelleenohjausta: 16 vuoden ikäraja, lyhyt tietosuojateksti (mitä tallennetaan, missä, miten poistetaan) ja linkki tietosuojaselosteeseen.
3. Tietosuojaseloste julkaistaan sovelluksessa ennen kuin kirjautuminen avataan muille kuin kehittäjälle: rekisterinpitäjä (käyttäjä, nimi ja yhteystieto, K-P7), tarkoitus, peruste, vastaanottajat (Google Firebase käsittelijänä), sijainti (Firestore `europe-north1`, Firebase Auth Googlen globaali palvelu), säilytys (K-P6), oikeudet, "Poista tilin tiedot", valitusoikeus tietosuojavaltuutetulle. Digiturva luonnostelee, Sisällöntuottaja tarkistaa kielen, käyttäjä hyväksyy. Digiturva ei anna oikeudellista neuvontaa.
4. Uusi kenttä Firestoreen tai localStorageen = PRIVACY.md:n inventaarion päivitys ja Digiturvan katselmointi.

**Kohdistus vaiheisiin:** T-054a: SR-21, SR-24, SR-25, SR-27, SR-28, SR-29 kohta 2. T-054b: SR-22, SR-23 kohdat 1–6, 8–9, SR-27. T-054c: SR-23 kohta 7, SR-26 kohdat 1–3. T-054d: SR-26 kohdat 4–5, SR-29 kohdat 3–4.

## Löydökset (suunnitelma)

### SEC-028 · API-avaimen referrer-rajaus on joko hyödytön tai rikkoo kirjautumisen · Medium
**Sijainti:** `docs/tasks/T-054-kirjautuminen-ja-pilvitallennus.md`, konsolitehtävä 8 · **Tehtävä:** T-054
**Toistaminen:** 1) Lue tehtävä 8: listalla `https://*.web.app/*`. 2) Vertaa `firebase.json`: `Referrer-Policy: no-referrer`.
**Odotettu:** rajaus vain omiin osoitteisiin ja toimii · **Havaittu:** `*.web.app` kattaa jokaisen Firebase Hosting -sivuston maailmassa, joten rajaus ei estä ketään. Toisaalta `no-referrer` voi pudottaa Referer-otsakkeen Googlen rajapintakutsuista, jolloin tarkka rajaus estäisi kirjautumisen. Lisäksi API restrictions puuttuu.
**Vaikutus:** väärä turvallisuuden tunne tai rikkinäinen kirjautuminen. Ei datavuotoa (säännöt suojaavat).
**Korjausehdotus:** SR-25 kohdat 1–2: API restrictions pakolliseksi, referrer-rajaus vain tarkoilla osoitteilla ja vain jos todennetusti toimii. PM päivittää konsolitehtävän 8. Esikatseluille avainta ei tarvita, koska niissä kirjautuminen on pois.
**Tila:** Avoin (PM päivittää kortin)

### SEC-029 · D-017 kohta 7 on ristiriidassa käyttäjän valinnan kanssa · Low
**Sijainti:** `docs/DECISIONS.md` D-017 kohta 7 ("poistetaan `cyberdeck:u:{uid}:*`") vs. saman ADR:n hyväksyntäosa ja kortin T-054c ("jäävät").
**Vaikutus:** Koodari voi toteuttaa väärän version. Lisäksi `last-uid`in kohtalo uloskirjautuessa ei ole yksiselitteinen.
**Korjausehdotus:** PM merkitsee kohdan 7 tekstin korvatuksi hyväksyntäosalla ja lisää: `last-uid` poistetaan aina uloskirjautuessa (SR-26 kohta 1).
**Tila:** Avoin (PM)

### SEC-030 · Testisivuston koodi pääsee saman käyttäjän tuotantodataan · Medium
**Sijainti:** D-017 kohta 2 (ympäristöjuuri), SECURITY.md luku 12 MVP2-1 (toteuttamatta).
**Toistaminen:** 1) Kirjaudu testisivustolle. 2) Testisivuston koodi (mikä tahansa testiin yhdistetty PR) voi kutsua Firestorea polulla `users/{uid}`. 3) Säännöt sallivat, koska ne eivät näe, miltä sivustolta pyyntö tulee.
**Vaikutus:** buginen tai haitallinen testikoodi voi lukea, muuttaa tai poistaa testisivustolle kirjautuneen käyttäjän tuotantodatan. Muiden käyttäjien dataan ei pääse. Käytännössä koskee kehittäjää ja testaajia.
**Korjausehdotus:** SR-21 kohta 2 (juuri ei koskaan oletuksena `users`), testisivustolle kirjautuvat vain kehittäjä ja testaajat (kerrotaan testisivuston kirjautumisdialogissa), PR-katselmointi. Pysyvä korjaus: erillinen testiprojekti (D-017 vaihtoehto D, IDEAS). **Jäännösriski R-18 vaatii käyttäjän nimenomaisen hyväksynnän** (rules.md 8), koska D-017:n hyväksyntä ei maininnut sitä riskinä.
**Tila:** Avoin (PM → käyttäjä)

### SEC-031 · `npm audit`: 4 High `@grpc/grpc-js@1.9.16`:n kautta · Low
**Sijainti:** `firebase@12.19.0` → `@firebase/firestore@4.17.2` → `@grpc/grpc-js@1.9.16` (GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4, korjattu 1.13.6:ssa).
**Toistaminen:** koeasennus `npm i -E firebase@12.19.0 --ignore-scripts && npm audit` → 4 high (sama juurisyy neljässä paketissa).
**Vaikutus:** ei selaimessa. Haavoittuvuudet koskevat gRPC-palvelinta ja Node-asiakkaan varmenteiden käsittelyä. Selaimen Lite-paketti (`dist/lite/common-*.esm.js`) ei tuo `@grpc`ia (tarkistettu). `npm audit` ei kuitenkaan ole enää puhdas, mikä peittää tulevat oikeat löydökset.
**Korjausehdotus:** SR-28 kohta 2 (`overrides` → 1.14.5).
**Tila:** Avoin (T-054a)

### SEC-032 · Kiintiön ja tallennustilan väärinkäyttö millä tahansa Google-tilillä · Low
**Sijainti:** Firestoren arkkitehtuuri (säännöt eivät voi laskea dokumenttien määrää).
**Vaikutus:** hyökkääjä voi luoda omalle uid:lleen satoja tuhansia pakkadokumentteja tai lukea omia dokumenttejaan silmukassa ja täyttää Sparkin päiväkiintiön (50 000 lukua / 20 000 kirjoitusta) tai 1 GiB:n. Seuraus: kaikkien synkronointi katkeaa päivän loppuun asti. Paikallinen data ja sovellus toimivat. Ei kustannuksia (Spark).
**Korjausehdotus:** hyväksytään nyt jäännösriskinä R-19 (Low). App Check (reCAPTCHA) myöhemmin, jos väärinkäyttöä havaitaan → IDEAS.md. Käyttäjä seuraa käyttöä konsolista.
**Tila:** Avoin (R-19)

### SEC-033 · `/__/auth/*` ei saa `firebase.json`in otsakkeita · Info
**Havainto:** `curl -I https://cyberdeck-tcg-test.web.app/__/auth/iframe` ja `/__/auth/handler` → 200 ilman CSP:tä, X-Frame-Optionsia ja COOP:ia; `/` saa ne. Sivut ovat Firebasen omia (`iframe.js`, `fireauth.iframe.AuthRelay`). Kortin T-054a-kriteeri "jos `/__/auth/iframe` estyy X-Frame-Optionsin takia" on siksi epätodennäköinen, eikä otsakkeita pidä löysentää.
**Tila:** Info. Varmistetaan testisivustolla T-054a:n jälkeen.

### SEC-034 · Firebase-pakettien install-skriptit · Info
**Havainto:** `@firebase/util` `postinstall.js` lukee ympäristömuuttujan `FIREBASE_WEBAPP_CONFIG` ja kirjoittaa omaan `dist`-hakemistoonsa (automaattikonfiguraatio). `protobufjs` `postinstall` tulostaa vain versiovaroituksen. Kumpikaan ei ota verkkoyhteyttä. CI:ssä ympäristömuuttujaa ei ole. Liittyy R-5:een.
**Tila:** Info, ei toimenpiteitä.

## Riippuvuus `firebase@12.19.0`
- Uusin versio (`dist-tags.latest`), julkaistu 2026-09-09. Lisenssi Apache-2.0. Ylläpitäjät `firebase-ops <firebase-npm@google.com>`, `google-wombot` ja kaksi Googlen kehittäjää. Repo `github.com/firebase/firebase-js-sdk`.
- Koeasennus: 87 pakettia, `npm audit signatures`: 86 rekisterin allekirjoitusta, 2 attestaatiota, ei virheitä. Purettu koko 36,8 Mt (vain tarvittavat osat päätyvät pakettiin).
- `npm audit`: SEC-031. Muita tunnettuja haavoittuvuuksia ei ole.
- **Tila:** hyväksyttävä ehdoin SR-28.

## Tarkistettu, ei löydöksiä
- **Kirjautumistapa:** redirect samassa originissa on oikea valinta (kolmannen osapuolen tallennuksen esto ei haittaa, COOP säilyy). Popup vain localhostissa, jossa Vite ei lähetä COOP:ia.
- **Konfiguraatio koodissa:** web-config ei ole salaisuus (R-14). Viten env-muuttujia ei tarvita. Ei salaisuuksia repossa (palvelutili säilyy vain GitHubin salaisuutena).
- **Sääntöjen deploy käsin:** CI:n palvelutilin oikeuksia ei laajenneta (R-4 ei pahene).
- **Firestore Lite:** ei IndexedDB-datavälimuistia, joten pilvidataa ei jää selaimeen SDK:n välimuistiin. Uloskirjautumisessa riittää `signOut` + omat avaimet.
- **Tietomallin rajat:** säännöt vastaavat `MAX_SECTIONS` 20, `MAX_COLLECTION_ENTRIES` 5000, `MAX_DECK_NAME_LENGTH` 100 (säännöissä 200 väljyydellä), `isDeckId` `^[A-Za-z0-9_-]{1,64}$`.
- **Synkronoinnin transaktio:** enintään 200 pakkaa + kokoelma + meta, alle Firestoren 500 kirjoituksen rajan.
- **Esikatselut:** eivät ole authorized domains -listalla, joten kirjautuminen ei onnistu niissä, vaikka PR-koodi muuttaisi host-listaa.
- **Evästeet:** sovellus ei aseta evästeitä. Firebase Auth käyttää IndexedDB:tä. Googlen evästeet ovat accounts.google.comissa, ja kirjautuminen on käyttäjän itse käynnistämä (PRIVACY.md luku 10).
