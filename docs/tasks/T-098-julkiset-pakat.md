# T-098 · Julkiset pakat (D-025)

**Tila:** Toteutettu, odottaa Digiturvan diff-katselmointia, sääntöjen deployta testiprojektiin ja PM:n katselmointia (PR testiin).

## Tavoite
Käyttäjä valitsee jokaiselle pakalleen, onko se **yksityinen** (oletus) vai **julkinen**. Julkiset pakat näkyvät Pakat-osiossa kaikille, myös kirjautumattomille. Julkaisija valitsee, näkyykö hänen **oma nimimerkkinsä** vai julkaistaanko pakka nimettömänä.

## Käyttäjän päätökset (2026-10-06)
1. **Nimi:** käyttäjä kirjoittaa nimimerkin itse. Google-tilin nimeä ei näytetä koskaan.
2. **Näkyvyys:** julkiset pakat näkyvät kaikille. Julkaiseminen vaatii Google-kirjautumisen.
3. **Päivitys:** julkinen versio päivittyy automaattisesti, kun omistaja tallentaa pakan kirjautuneena.

## Toteutuksen osat
- **Domain:** julkisen pakan muoto ja validointi (`src/domain/publicDeck.ts`): nimimerkin siivous (1–30 merkkiä, `cleanText`) ja pakan sisältö samoilla rajoilla kuin tallennuksessa.
- **Firestore:**
  - **Kokoelma:** `publicDecks/{deckId}`.
  - **Säännöt:** luku ja listaus ovat kaikille sallittuja, ja kysely on rajattu (`limit ≤ 50`). Kirjoittaa ja poistaa voi vain omistaja (`ownerUid == auth.uid`, vain Google-kirjautuminen). Kenttien muoto ja aikaleimat tarkistetaan palvelimen ajalla.
  - **Sääntöjen deploy:** käyttäjä deployaa säännöt käsin kumpaankin projektiin.
- **Synkronointi:**
  - **Julkinen pakka:** pakan tallennus kirjoittaa myös julkisen kopion.
  - **Yksityiseksi tai poisto:** jos pakka muutetaan yksityiseksi tai poistetaan, julkinen kopio poistetaan.
  - **Tilin poisto:** tilin poisto poistaa käyttäjän julkiset pakat.
- **Pakkaeditori:** pakkaeditoriin tulee Näkyvyys-valinta (Yksityinen / Julkinen), ruksi "Näytä nimimerkkini" ja nimimerkkikenttä.
  - **Ilman kirjautumista:** Julkinen-valinta on pois käytöstä, ja sen vieressä on kehotus kirjautua.
  - **Tila:** pakkaeditori näyttää julkaisun tilan, eli onko pakka julkaistu ja milloin se on viimeksi päivitetty.
- **Pakat-sivu:**
  - **Välilehdet:** sivulla on välilehdet "Omat pakat" ja "Julkiset pakat".
  - **Julkisen pakan rivi:** rivillä näkyvät nimi, Legendit, korttimäärä, nimimerkki tai "Nimetön" ja päivitysaika.
  - **Avaaminen:** pakka avautuu lukunäkymään, jossa on "Tallenna omaksi". Lukunäkymä on sama kuin jaetulla pakalla.
- **Tietosuoja:** PRIVACY.md kertoo, mitä julkaistaan (pakan sisältö, nimimerkki ja pseudonyyminen tunniste) ja miten julkaisu poistetaan.

## Avoimet kysymykset
- **Ilmiantaminen:** tarvitaanko julkisille pakoille ilmiantotoiminto, tai muu moderointi asiattomille pakan nimille ja nimimerkeille? Ensimmäinen versio on ilman sitä, ja riski kirjataan.
- **Haku:** tarvitaanko julkisiin pakkoihin haku tai suodatus, esimerkiksi Legendin mukaan? Ensimmäisessä versiossa julkiset pakat järjestetään vain uusimman mukaan.

## Turvavaatimukset (Digiturva SEC-098, ehdotus hyväksymiskriteereiksi, PM hyväksyy)
Raportti `docs/reports/SEC-098-julkiset-pakat.md`, sääntöehdotus `docs/reports/SEC-098-liite-firestore.rules`.
- [x] **SR-30** `pubId = hex(sha256(uid + ":" + deckId))`, eikä julkisessa dokumentissa ole uid:tä (korvaa kortin `ownerUid`-suunnitelman, SEC-098-1 ja SEC-098-3).
- [x] **SR-31** Kentät `hasOnly`, kaikki rajattuja merkkijonoja tai lukuja, ei listoja. `updatedAt == request.time`.
- [x] **SR-32** Sisältö = jakolinkin koodaus (`encodeDeckShare`, ≤ 16 000 merkkiä), ja luku samalla jäsentimellä.
- [x] **SR-33** Säännöissä `limit ≤ 50`. Sivukoko ≤ 24, kursorisivutus, ei `onSnapshot`, välimuisti istunnon ajan.
- [x] **SR-34** Julkinen kirjoitus viivästettynä (≥ 15 s tai editorista poistuttaessa), säännöissä ≥ 10 s päivitysväli.
- [x] **SR-35** Yksityiseksi tai poisto: julkinen kopio poistetaan ensin. Julkisuustila tallennetaan yksityiseen pakkaan.
- [x] **SR-36** Tilin poisto poistaa kaikki `pubId`:t ennen yksityisiä tietoja (testi).
- [x] **SR-37** Luettu data validoidaan, vain React-teksti, ei datasta muodostettuja `href`-arvoja.
- [x] **SR-38** Julkaisun vahvistus ja varoitus, nimimerkki oletuksena piilossa, ei esitäyttöä Googlen nimellä.
- [x] **SR-39** "Tallenna omaksi" luo aina uuden yksityisen pakan.
- [~] **SR-40** (säännöt kirjoitettu, EI deployattu: käyttäjä deployaa ensin testiprojektiin ja tekee SEC-098-7:n käsitestit) Vain `match /publicDecks/{pubId}`. Käyttäjä deployaa ensin testiprojektiin ja testaa (SEC-098-7), tuotantoon ennen `/julkaise`:a.
- [x] **SR-41** `noindex` julkisiin näkymiin (K-P12).
- [x] **SR-42** Poistopyyntöjen ohje PRIVACY.md:ssä ja ylläpitäjän ohje konsolipoistoon.
- **Käyttäjän päätökset ennen toteutusta:** K-P9 (julkaistaanko uid, Digiturva: ei), K-P10 (ilman ilmiantoa, Digiturva: kyllä), K-P11 (hyväksytäänkö R-21 ilman App Checkia), K-P12 (hakukoneindeksointi, Digiturva: ei).

## Luovutus · Digiturva · 2026-10-06
Uhkamalli valmis (SEC-098): High 1, Medium 3, Low 2, Info 1, kaikki suunnitelmatason. SECURITY.md: luku 18 ja R-21–R-23. PRIVACY.md-muutosehdotus raportissa (luku 11 ja luvun 10.1 korjaus), tiedostoa ei muokattu. `firestore.rules`-tiedostoa ei muutettu eikä mitään deployattu. Veto: Done vaatii SR-30–SR-36:n ja SR-40:n toteutuksen ja Digiturvan diff-katselmoinnin.

## Luovutus · Koodari · 2026-10-06
Haara `t-098-julkiset-pakat`, PR testiin. Muutokset:
- **Domain:** `src/domain/publicDeck.ts` (pubId = sha256(uid:deckId) Web Cryptolla, `buildPublicDeckInput`, `parsePublicDeck`), `Deck.publish?: { public, nickname }` (`deck.ts`, `validate.ts`: `parseDeckPublish`, `cleanNickname` 1–30). Vanhat pakat = yksityisiä, skeemaversio ennallaan (kenttä valinnainen).
- **Tallennus:** `DeckRepository.setPublish` (päivittää updatedAt); `update` säilyttää asetukset. Pilvikoodekki tallentaa asetukset kenttinä `visibility` (private/public) ja `nickname` pakan dokumentissa. Poikkeama liitteestä: ei arvoa `public-anonymous`, koska nimettömyys on `nickname == null`.
- **Säännöt:** `firestore.rules` (isDeckDoc, publicKey, isPublicDeck, `match /publicDecks/{pubId}`) liitteen mukaan. Staattiset testit `src/firestoreRules.test.ts`. **Emulaattoritestejä ei ole** (ei emulaattoria projektissa): SEC-098-7:n käsitestit tehdään testiprojektissa deployn jälkeen.
- **Pilvi:** `firebase/firestorePublicDecks.ts` (luku nimetyllä appilla `public-read` ilman kirjautumista, kirjoitus oletusappilla, transaktio create/update, `limit 24`, `orderBy updatedAt desc`, `startAfter`, ei onSnapshot), `publicPublisher.ts` (15 s viive, väh. 10,5 s väli, flush editorista poistuttaessa), `memory.ts` (`createMemoryPublicDecks`). Tilin poisto: `firestoreCloudStore.deleteAll` poistaa pilven pakkojen julkiset kopiot ensin, `session.deleteAccountData` paikallisten pakkojen kopiot ensin (SR-36, testit).
- **UI:** Pakat-sivun välilehdet (`#/pakat`, `#/pakat/julkiset`), `PublicDecksList` (24/sivu, "Näytä lisää", istuntovälimuisti, "Päivitä lista"), `PublicDeckView` (`#/pakat/julkinen/<pubId>`, käyttää SharedDeckView/DeckImport-lukunäkymää, "Tallenna omaksi" luo uuden yksityisen pakan), `DeckVisibility` pakkaeditorissa (vahvistus, varoitus, nimimerkki oletuksena piilossa ja tyhjä, kirjautumaton: Julkinen pois käytöstä + kehotus), "Julkinen"-merkki omalla rivillä, noindex-meta julkisissa näkymissä. Tekstit fi+en (`deckTexts`), kirjoitettu Koodarin toimesta, **Sisällöntuottajan kielentarkistus puuttuu**.
- **PRIVACY.md:** luku 11 (11.1–11.7, mukana ylläpitäjän poistoreitti), luvun 10.1 korjaus, muutosloki.
- **Testit:** 1362 läpi (uusia noin 70: domain, repository, koodekki, store-sopimus muistilla ja Firestore-fakella, publisher, istunto/tilin poisto, reitit, UI). Lint ja build läpi.
- **Poikkeamat ja avoimet:**
  - SR-35: jos julkisen kopion poisto epäonnistuu, pakka pysyy julkisena ja sovellus sanoo sen (ei jonoa, ei "poistuu kun yhteys palaa").
  - R-22: toisella laitteella synkronoinnin kautta poistettu pakka jättää julkisen kopion (orpo). Korjaus vaatisi synkronointikerroksen kytkennän, ei tehty.
  - SR-41: noindex on dynaaminen meta (sovellus on yksi sivu hash-reiteillä), ei X-Robots-Tag-otsaketta.
  - SR-42: Tietoa-sivun ohjetta ei ole, vain PRIVACY.md 11.7.
  - Esikatselu (PR-esikatselun osoite): kirjautuminen ei ole käytössä esikatseluissa, joten julkaisua ei voi kokeilla siellä. Julkisten pakkojen luku toimii kaikkialla, mutta vasta kun säännöt on deployattu.
  - Rooli-ajot jäljellä: Digiturvan diff-katselmointi (veto: SR-30–36, SR-40), Sisällöntuottaja (tekstit), UX/Testikäyttäjä (uusi iso näkymä).
- **Käyttäjän pakolliset toimet:** (1) `firebase deploy --only firestore:rules --project test`, käsitestit (oma luonti, päivitys, poisto; toisen päivitys/poisto/valtaus hylätään; listaus ilman limitiä hylätään; <10 s päivitys hylätään), (2) sama tuotantoon ennen `/julkaise`:a.
Koodikatselmointi: tehty · Pakollisia korjattu 3 (useSyncExternalStore-silmukka, aria-live-valitsin, vanhan välimuistin lista julkaisun jälkeen) · Suosituksia 3 (R-22 orvot kopiot, Tietoa-sivun ohje, Sisällöntuottajan tarkistus)
