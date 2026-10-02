# T-040 · Selaus ja muokkaus erilleen, kompakti taulukkonäkymä
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02)
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
