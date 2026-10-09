# T-119 · Skannaa suoraan pakkaan

**Tila:** Done. **Päättäjä:** käyttäjä (2026-10-09: idea "skannaa suoraan pakkaan"; valinnat alla), PM (määrittely).

## Tavoite
Fyysisen pakan saa sovellukseen skannaamalla. Nykyinen skanneri (`CardScannerDialog`, T-106/T-108/T-113) lisää kortit aina kokoelmaan. Nyt sitä voi käyttää myös pakan kokoamiseen.

## Käyttäjän päätökset
1. **Kohde valitaan skannerissa:** "Vain pakkaan" (oletus) tai "Pakkaan ja kokoelmaan".
2. **Pakan osa valitaan skannerissa:** "Pääpakka" (oletus) tai "Sideboard". Legend menee aina legend-paikalle (sideboard ei salli Legendiä, `deckTexts.sideboardNoLegend`).
3. **Käynnistys:** pakkaeditorista (Skannaa-painike) ja Pakat-listalta ("Skannaa uusi pakka": luo pakan kuten `handleCreate`, avaa editorin ja skannerin heti).

## Hyväksymiskriteerit
- [ ] `CardScannerDialog` saa valinnaisen pakkakohteen (esim. prop `deck`), jonka kautta lisäys ja kumoa menevät pakkaan. Ilman sitä käytös on täsmälleen ennallaan (Kortit- ja Kokoelma-näkymät, nykyiset testit eivät muutu).
- [ ] Pakkatilassa skannerissa on kaksi `SegmentedChoice`-valintaa (T-118): kohde (Vain pakkaan / Pakkaan ja kokoelmaan) ja osa (Pääpakka / Sideboard). Valinnat säilyvät skannerin auki ollessa. Painikkeiden ja otsikon tekstit kertovat, että kortti menee pakkaan "<pakan nimi>".
- [ ] Lisäys pakkaan käyttää DeckEditorin olemassa olevia sääntöjä (`setCount`/`addToSideboard`-logiikka): samanniminen Legend, `MAX_COPIES`, `MAX_DECK_DISTINCT_CARDS`, `SIDEBOARD_SIZE`. Estetty lisäys näkyy skannerin omassa ilmoituksessa (`addProblem`) eikä hiljaa katoa. Jos kohde on "Pakkaan ja kokoelmaan" ja pakkaan lisäys estyy, kokoelmaankaan ei lisätä.
- [ ] Sekä yksi kerrallaan- että jatkuva tila toimivat pakkatilassa. Määrävalinta (`copies`) koskee pakkaa. "Kumoa viimeisin" poistaa kopion pakasta ja, jos se lisättiin myös kokoelmaan, sieltä.
- [ ] Pakkaeditorissa Skannaa-painike (kameraikoni) lisäkorttien hakuun liittyvien toimintojen yhteydessä. Ei näy, jos `cameraSupported()` on epätosi.
- [ ] Pakat-listalla "Skannaa uusi pakka" -painike "Uusi pakka" -painikkeen vieressä, toissijainen. Ei näy ilman kameraa.
- [ ] Tekstit fi ja en (`scannerTexts.*`, `deckTexts.*`). Ei inner scrollia, ei päällekkäisyyksiä 320 px:llä.
- [ ] Testit: pakkatilan lisäys pääpakkaan, sideboardiin, Legend legend-paikalle, estetty lisäys (raja) näyttää viestin, "Pakkaan ja kokoelmaan" lisää molempiin, kumoa, Pakat-listan painike luo pakan ja avaa skannerin. `npm test`, `npm run lint`, `npm run build` läpi.

## Rajaukset
- Ei uusia riippuvuuksia, ei tietomallimuutoksia (pakka tukee jo sideboardia).
- Kameran käsittely ja tunnistus ennallaan (ei Digiturvaa, koska kameraan tai tallennukseen ei kosketa; tallennus kulkee pakkaeditorin olemassa olevan `schedule`-polun kautta).

## Luovutus

**Koodari, 2026-10-09 · Tila: valmis PM:n katselmointiin (työ suoraan test-haarassa, D-029).**
- Skanneri: `CardScannerDialog`/`ScanCardsButton` saavat valinnaisen `deck: ScanDeckTarget` (`{ name, add(card, part, copies): string | null, remove(...) }`). Ilman sitä käytös on ennallaan. Pakkatilassa edition-vaiheessa kaksi `SegmentedChoice`a (Vain pakkaan / Pakkaan ja kokoelmaan; Pääpakka / Sideboard), valinnat säilyvät dialogin ajan. "Vain pakkaan" ei kysy painosta (yksi "Aloita skannaus" -painike). Legend menee aina päälistalle. "Pakkaan ja kokoelmaan": pakka ensin, ja jos kokoelma kieltäytyy, pakkamuutos perutaan; esto näkyy `addProblem`/`notice`-viestinä. Kumoa poistaa pakasta ja tarvittaessa kokoelmasta.
- DeckEditor: lisäyssäännöt eriytetty `mainBlock`/`sideBlock`-funktioiksi (palauttavat estoviestin), joita sekä napit (`setCount`, `setSideCount`) että skannerin `scanTarget` käyttävät. Skannerin lisäys on kaikki tai ei mitään ja pääpakassakin raja `MAX_COPIES` (pääpakka+sideboard). Muutos: sideboardin kokoraja tarkistetaan nyt `sideBlock`issa (aiemmin vain `addToSideboard`issa).
- Käynnistys: Skannaa-painike (kameraikoni) "Lisää kortteja" -otsikon vieressä (`editor-add-head`); Pakat-listalla "Skannaa uusi pakka" (`DeckActions.onScan`, `handleCreate(true)`), joka välittää editorille muistinvaraisen lipun (`scanIntent.ts`). Molemmat piilossa ilman kameraa. `.deck-actions` sallii rivityksen (kolme painiketta 320 px:llä).
- Tekstit: `scannerTexts.*` fi+en. Ei uusia riippuvuuksia, ei tietomallimuutoksia.
- Testit: uusi `CardScanner.deck.test.tsx` (13 testiä: pääpakka, sideboard, Legend, raja-estot, molempiin, kokoelmaan ei lisätä jos pakka estää, jatkuva tila + kumoa, Pakat-painike, ei kameraa). `npm test` 1563/1563, lint ja build läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (selaimessa/oikealla kameralla ei kokeiltu: UX-silmäys 320 px:llä ja Pakat-rivin rivitys kannattaa tarkistaa esikatselussa).
