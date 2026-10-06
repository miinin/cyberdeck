# T-098 · Julkiset pakat (D-025)

**Tila:** Määritelty. Toteutus ei ole alkanut. Ennen toteutusta tarvitaan Digiturvan uhkamalli (SEC-098, säännöt ja henkilötiedot) ja Arkkitehdin katselmointi tietomallista.

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
- [ ] **SR-30** `pubId = hex(sha256(uid + ":" + deckId))`, eikä julkisessa dokumentissa ole uid:tä (korvaa kortin `ownerUid`-suunnitelman, SEC-098-1 ja SEC-098-3).
- [ ] **SR-31** Kentät `hasOnly`, kaikki rajattuja merkkijonoja tai lukuja, ei listoja. `updatedAt == request.time`.
- [ ] **SR-32** Sisältö = jakolinkin koodaus (`encodeDeckShare`, ≤ 16 000 merkkiä), ja luku samalla jäsentimellä.
- [ ] **SR-33** Säännöissä `limit ≤ 50`. Sivukoko ≤ 24, kursorisivutus, ei `onSnapshot`, välimuisti istunnon ajan.
- [ ] **SR-34** Julkinen kirjoitus viivästettynä (≥ 15 s tai editorista poistuttaessa), säännöissä ≥ 10 s päivitysväli.
- [ ] **SR-35** Yksityiseksi tai poisto: julkinen kopio poistetaan ensin. Julkisuustila tallennetaan yksityiseen pakkaan.
- [ ] **SR-36** Tilin poisto poistaa kaikki `pubId`:t ennen yksityisiä tietoja (testi).
- [ ] **SR-37** Luettu data validoidaan, vain React-teksti, ei datasta muodostettuja `href`-arvoja.
- [ ] **SR-38** Julkaisun vahvistus ja varoitus, nimimerkki oletuksena piilossa, ei esitäyttöä Googlen nimellä.
- [ ] **SR-39** "Tallenna omaksi" luo aina uuden yksityisen pakan.
- [ ] **SR-40** Vain `match /publicDecks/{pubId}`. Käyttäjä deployaa ensin testiprojektiin ja testaa (SEC-098-7), tuotantoon ennen `/julkaise`:a.
- [ ] **SR-41** `noindex` julkisiin näkymiin (K-P12).
- [ ] **SR-42** Poistopyyntöjen ohje PRIVACY.md:ssä ja ylläpitäjän ohje konsolipoistoon.
- **Käyttäjän päätökset ennen toteutusta:** K-P9 (julkaistaanko uid, Digiturva: ei), K-P10 (ilman ilmiantoa, Digiturva: kyllä), K-P11 (hyväksytäänkö R-21 ilman App Checkia), K-P12 (hakukoneindeksointi, Digiturva: ei).

## Luovutus · Digiturva · 2026-10-06
Uhkamalli valmis (SEC-098): High 1, Medium 3, Low 2, Info 1, kaikki suunnitelmatason. SECURITY.md: luku 18 ja R-21–R-23. PRIVACY.md-muutosehdotus raportissa (luku 11 ja luvun 10.1 korjaus), tiedostoa ei muokattu. `firestore.rules`-tiedostoa ei muutettu eikä mitään deployattu. Veto: Done vaatii SR-30–SR-36:n ja SR-40:n toteutuksen ja Digiturvan diff-katselmoinnin.
