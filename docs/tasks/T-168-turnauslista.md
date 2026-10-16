# T-168 · Turnauksen pakkalista tulosteena (I-15)
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Päättäjä:** käyttäjä (2026-10-16) valitsi I-15:n puolen tunnin ominaisuudeksi. Virallisen lomakkeen muotoa ei ole tarkistettu, joten tämä on yleinen pakkalista. Muoto voidaan päivittää, kun virallinen lomake löytyy.

## Määrittely
- Pakkaeditorin vientivalikkoon (`ExportButtons`, QR:n viereen) tulee kohta **"Turnauslista"** (en: "Tournament list"). Se avaa dialogin, jossa on A4-pakkalistan esikatselu ja painikkeet **Tulosta** (`window.print()`) ja **Sulje**.
- Lista: otsikko "Pakkalista" ja tyhjät täyttörivit käsin kirjoitettaville tiedoille (Pelaaja, Tapahtuma, Päivämäärä). Sen jälkeen pakan nimi ja ryhmät järjestyksessä Legendit, Unit, Program, Gear, muut ja Sideboard. Jokaisella ryhmällä on otsikko ja yhteismäärä, ja jokaisella rivillä on määrä ja nimi (`Nimi - Alanimi`, kuten `deckToText`issä). Rivit ovat aakkosjärjestyksessä. Lopussa on yhteensä-rivi: pääpakka X, Legendit Y, sideboard Z.
- Laillisuus: `validateDeck`in virheet näkyvät **vain ruudulla** varoituksena listan yläpuolella ("Pakka ei ole turnauskelpoinen: …"). Tulosteeseen ne eivät tule. Laillisesta pakasta näytetään merkintä "Turnauskelpoinen ✓".
- Tuloste: valkoinen paperi ja musta teksti molemmissa teemoissa. Tulostettaessa näkyy vain lista (`@media print`: body-luokka dialogin ollessa auki, muu sivu piiloon, samaan tapaan kuin ProxyView).
- Lista mahtuu yhdelle A4-sivulle: kaksi saraketta (Legendit ja Unit vasemmalla, muut oikealla tai CSS columns).
- Logiikka on puhtaana funktiona `src/domain/tournamentList.ts` (ryhmät, rivit ja summat) yksikkötesteineen. UI-testissä valikon kohta avaa dialogin, ja ryhmät sekä summat näkyvät.
- Tekstit fi ja en olemassa olevaan tekstitiedostoon. Ei uutta riippuvuutta. Ei sisäistä vieritystä: dialogi kasvaa sivun mukana, kuten muut.

## Luovutus
Koodari (2026-10-16): Toteutettu suoraan test-haaraan (D-029). Uudet: `src/domain/tournamentList.ts` (+ testi), `src/ui/TournamentListDialog.tsx`, vientivalikon kohta "Turnauslista" (ExportButtons), tekstit `tl*` fi/en, tulostussäännöt styles.css:n loppuun (body-luokka `is-tournament-list`, visibility-temppu, koska dialogi on valikon sisällä). `listName` ja `singleLine` exportattu deckExport.ts:stä. Ei uutta riippuvuutta.
- Testit 1837 läpi, lint ja build läpi. UI-testi QrDialog.test.tsx:ssä.
- Ei tarkistettu selaimessa oikeaa tulostusta (A4-mahtuminen, tulostuksen esikatselu). Suositus: PM katsoo esikatselusta Tulosta-näkymän.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (tulostuksen silmämääräinen tarkistus).
