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
