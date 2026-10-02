# T-040 · Selaus ja muokkaus erilleen, kompakti taulukkonäkymä
**Tila:** Done · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02)
**Malli:** D-014. PM tarkistaa esikatselun, ja UX katselmoi MVP-1:n lopussa.
**Haara:** `t-040-selaus-taulukko`

## Tavoite
Kun kokoelma on kerran syötetty, pääkäyttö on selailu. Lisäys ja poisto ovat toissijaisia, eivätkä ne saa olla jatkuvasti näkyvissä. Selailuun tarvitaan myös kompakti taulukko.

## Hyväksymiskriteerit
1. **Muokkaustila:** kytkin "Muokkaa kokoelmaa" (`<button role="switch" aria-checked>` tai checkbox switch-tyylillä) sijoitetaan listan yläpuolelle näkymävalitsimen viereen.
   - Pois päältä (oletus): ruudukossa ja taulukossa näkyy vain määrä ja tila (harmaa, keltainen, vihreä ✓) ilman −/+-painikkeita.
   - Päällä: −/+-painikkeet näkyvät.
   - Poikkeus: jos kokoelma on tyhjä, oletus on päällä.
   - Valinta muistetaan preferences-varastossa samalla tavalla kuin teema (storage-kerros, ei suoraa localStoragea).
2. **Näkymävalitsin:** "Ruudukko" / "Taulukko" (radioryhmä tai segmenttipainike), joka myös muistetaan preferences-varastossa.
3. **Taulukko:** kompakti `<table>`, jossa on sarakkeet pikkukuva (nykyinen `sm`-kokoa ei enää ole, joten käytä `md`:tä 40 px:n leveydellä tai jätä kuva pois ja perustele), nimi, tyyppi (badge), Rarity, Cost, Power, RAM ja kokoelma. Nimen painallus tai kuvan painallus avaa nykyisen dialogin.
   - Kokoelmasarake näyttää muokkaustilassa −/+-kontrollin ja muuten pelkän määrän ja tilan.
   - Rivin reunassa tai määrässä näkyy sama tilaväri kuin ruudukossa.
   - Mobiilissa (< 40 rem) taulukko vierittyy vaakasuunnassa omassa säiliössään (`overflow-x: auto`, `tabindex="0"`, nimetty alue), ei koko sivu.
4. Suodatus, haku, want-lista ja ilmoitukset toimivat molemmissa näkymissä.
5. Testit kytkimelle, näkymävalinnalle (myös muistaminen) ja taulukon rakenteelle. `npm test` (muutetut osat), lint ja build menevät läpi. CHANGELOG `[Julkaisematon]`.

## Rajaukset
- Sarakkeiden lajittelu ei kuulu tähän (IDEAS.md).

## Luovutukset
### Luovutus 2026-10-02 · Koodari → PM
- Mitä tehtiin: preferences-varastoon `loadView/saveView` ja `loadEditMode/saveEditMode` (avaimet `cyberdeck:view`, `cyberdeck:edit-mode`, raakamerkkijonot kuten teema). `ListToolbar` (Ruudukko/Taulukko-radioryhmä + `role="switch"` "Muokkaa kokoelmaa") listan yläpuolella. `CountControl` sai `editable`-propin (pois päältä vain määrä ja tila, ✓ säilyy). Uusi `CardTable` (kuva md 40 px, nimi-painike avaa dialogin, tyyppi-badge, Rarity, Cost, Power, RAM, kokoelma; rivin vasen reuna keltainen/vihreä; `overflow-x: auto`, nimetty region, `tabindex=0`).
- Muokkaustilan oletus: tallennettu valinta, muuten päällä vain jos kokoelma on tyhjä. Oletus ratkaistaan kerran (lukitaan), joten ensimmäisen kortin lisäys ei piilota painikkeita; oletusta ei tallenneta. Kytkin näkyy vain kun kokoelma on `ready`.
- Uudet tekstit (Näkymä, Ruudukko, Taulukko, Muokkaa kokoelmaa, Tyyppi, Kokoelma, taulukon region-nimi) lisätty texts.ts:ään itse: Sisällöntuottaja/UX tarkistavat MVP-1:n lopussa.
- Testit: uusi CatalogView.browse.test.tsx (9), storage-testit (4), collection-testit asettavat kytkimen päälle. `vitest run src/ui src/storage src/App.test.tsx src/App.theme.test.tsx`: 452/452. Lint ja build läpi. CHANGELOG päivitetty.
- Rajoitteet: ei selainnäkymän silmämääräistä tarkistusta (vain jsdom); taulukon CSS (sarakeleveydet, mobiili) kannattaa katsoa esikatselussa.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0

### PM 2026-10-02 · Done (D-014)
- Esikatselu PR #12: taulukko (1280 px, muokkaustila päällä) ja ruudukko 320 px:ssä (scrollWidth 320, ei vaakavieritystä) tarkistettu kuvakaappauksin.
