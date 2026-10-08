# T-117 · Pakat-sivun uudistus: tyylikäs ja teemaan sopiva

**Tila:** Done. **Haara:** suoraan `test` (D-029). **Päättäjä:** käyttäjä (palaute 2026-10-09: "ruma; valtavat ei-viistetyt laatikot ylhäällä ja viistetyt rumasti alla"), PM (ratkaisu).

Korjaa matkalla havaitsemasi ilmeiset ulkoasuviat kysymättä.

## Nykytila (puhelin)
- Ylhäällä ovat valtavat suorakulmaiset välilehdet "Omat pakat | Julkiset pakat" (`deck-tabs`).
- Niiden alla on kolme isoa painiketta eri muodoissa ja kahdella rivillä: keltainen viistetty "UUSI PAKKA", "TUO PAKKALISTA" ja "HAE NETDECK.GG:STÄ" (`deck-toolbar`).
- Pakkakortissa (`deck-row`) on legendien kuvat, nimi ja kynä, värit, rivi "Legendit 3/3 · Pääpakka 40/40–50", palkki, "Laillinen", "Kokoelmasta puuttuu N" ja iso "LISÄÄ PUUTTUVAT WANTIIN" -painike.

## Tavoite
1. **Otsikkorivi:** "PAKAT" vasemmalla ja oikealla samalla rivillä kompakti primääripainike **"+ Uusi pakka"** (viistetty kuten muut painikkeet, `--target-min`-korkuinen eikä jättikokoinen).
2. **Tuonti yhteen paikkaan:** "Tuo pakkalista" ja "Hae Netdeck.gg:stä" yhdistetään yhdeksi toissijaiseksi **"Tuo ▾"** -painikkeeksi, joka avaa pienen valikon (pakkalista / Netdeck.gg). Valikko suljetaan Escillä ja ulkopuolisella napautuksella, ja siinä on `aria-expanded`. Valikko voi myös olla Uusi pakka -painikkeen vieressä. Tärkeintä on, että ohjaimia on yksi rivi ja ne ovat samankokoisia.
3. **Omat | Julkiset:** kompakti segmenttivalitsin samalla tyylillä kuin muualla (T-115:n segmentti), ei sivun levyisiä jättilaatikoita. Ulkoreunat ovat yhteneväiset painikkeiden viisteen kanssa, jos segmenttityyli sen sallii. Muuten käytetään samaa tyyliä kuin muilla sivuilla. Yhtenäisyys on tärkeintä.
4. **Muodot yhtenäisiksi:** sivulla ei saa olla sekaisin suorakulmaisia ja viistettyjä samanarvoisia ohjaimia. Käytä teeman viistettä (`--shape-chamfer`) johdonmukaisesti.
5. **Pakkakortti tiiviimmäksi:**
   - Tilarivi on yksi rivi: "✓ Laillinen · 40/40 · 2 puuttuu".
   - Iso "Lisää puuttuvat wantiin" muuttuu pieneksi toissijaiseksi toiminnoksi (tekstilinkki tai pieni painike), joka näkyy vain, kun kortteja puuttuu.
   - Värit pysyvät pieninä merkkeinä. Muokkauskynä on nimen vieressä.
   - Kortin klikkaus avaa pakan kuten nyt.
   - Leveällä näytöllä kortit asettuvat ruudukkoon (`repeat(auto-fill, minmax(20rem, 1fr))`) koko leveydelle.
6. **Tyhjä tila:** siisti tyhjän tilan kehotus ("Ei vielä pakkoja", "+ Uusi pakka" ja "Tuo").

## Hyväksymiskriteerit
- Puhelimessa otsikkorivi ja ohjaimet mahtuvat yhdelle tai kahdelle siistille riville, ja ensimmäinen pakkakortti näkyy ensimmäisessä näkymässä 390 × 844 -näytöllä.
- Muodot ovat yhtenäiset, eikä jättilaatikoita ole.
- Testit päivitetään (DecksView-, DeckImport- ja Netdeck-testit), eikä niitä heikennetä.
- Ei vaakavieritystä leveyksillä 320, 390 ja 1440 px (tarkista Chromella).
- `npm test` (ajetaan kerran), `npm run lint` ja `npm run build` menevät läpi.

## Luovutus

### Luovutus (Koodari, 2026-10-09)
Valmis. Commitit suoraan `test`-haaraan (D-029).
- **Otsikkorivi:** "PAKAT" vasemmalla, oikealla `DeckActions` (uusi `DeckImportMenu.tsx`): chamfer-painikkeet "+ Uusi pakka" ja "Tuo ▾". Tuo-valikossa "Tuo pakkalista" ja "Hae Netdeck.gg:stä". Valikko: `aria-expanded`/`aria-controls`, sulkeutuu Escillä (fokus takaisin painikkeeseen) ja ulkopuolisella painalluksella. Tyhjässä tilassa samat ohjaimet ovat tyhjän tilan laatikossa (ei kahta kopiota).
- **Omat | Julkiset:** `.deck-tabs` käyttää nyt Kortit-sivun Kuvat/Lista-segmentin tyyliä (2 px suorakulmainen reuna, keltainen valittu, `fit-content`).
- **Pakkakortti:** laskurivi + värit samalla rivillä, yksi tilarivi "✓ Laillinen · 42 puuttuu" (tai "⚠ Keskeneräinen · 3 rikettä · 4 puuttuu" / "Kaikki kokoelmassa"), "Lisää puuttuvat wantiin" pieneksi tekstilinkiksi vain kun kortteja puuttuu. Ruudukko `minmax(20rem,1fr)`.
- **Valinnat:** tilariviltä jätin "40/40" pois, koska laskurivi ("Pääpakka 40/40–50") ja palkki näyttävät sen jo. Kortin klikkaus ei avaa pakkaa (ei ollut ennenkään; "Avaa"-painike säilyi). Palattaessa tuonnista fokus menee "Tuo"-painikkeeseen. Lisätyt tekstit: `importMenu`, `missingShort`, `allOwnedShort` (fi ja en). Poistettu kuollut `.deck-toolbar`-CSS. Nimitörmäys vältetty: otsikkorivin luokka on `decks-head` (`deck-head` kuuluu editorille).
- **Tarkistus Chromella (CDP):** 320, 390 ja 1440 px, ei vaakavieritystä (scrollWidth = clientWidth). 390 × 844: ensimmäinen pakkakortti mahtuu kokonaan ensimmäiseen näkymään. Valikko ja tyhjä tila katsottu.
- **Testit:** DecksView-testit päivitetty ja kaksi uutta (valikko, Esc ja ulkopuolinen painallus; tilarivi ja wants-linkki). Apufunktio `chooseImport` (deckTestUtils) DeckImport-, DeckExportImport- ja MissingCards.wants-testeihin.
- Tulokset: `npm test` 1541 läpi, lint ja build läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0
