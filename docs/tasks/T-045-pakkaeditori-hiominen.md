# T-045 · Hiominen: tyyppimerkin kulma, värisuodatin palloina, Legend-nimen esto, yhtenäiset rivit, Power ja kuvanäkymä pakkaeditoriin
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02)
**Malli:** D-014. PM tarkistaa esikatselun.
**Haara:** `t-045-pakkaeditori-hiominen`

## Hyväksymiskriteerit
1. **Tyyppimerkin viisto kulma:** `.type-badge` (styles.css, T-036) leikkaa kulman `clip-path`illa, mutta 1 px:n reuna ei jatku viistoa pitkin, joten kulma näyttää rikkinäiseltä. Korjaa niin, että viisto reuna piirtyy samalla värillä, esim. `::after`-pseudoelementillä (diagonaali) tai taustagradientilla. Merkki näyttää samalta kuin muut viistetyt painikkeet. Tarkista molemmat teemat.
2. **Värisuodatin pelkkinä palloina:** Väri-ryhmän valinnoissa (katalogi ja pakkaeditori, `CardFilters`) näkyy vain väripallo/-swatch ilman tekstiä. Saavutettava nimi säilyy (visually-hidden "Red" jne.), ja `title` näyttää nimen hoverilla. Valittu tila näkyy selvästi (reuna tai rasti), ei pelkällä värillä. Kosketusalue on vähintään 24 px.
3. **Samannimisen Legendin esto:**
   - Pakkaeditorissa Legendin lisäys estetään, jos pakassa on jo samanniminen Legend (pelkkä `name`, alaotsikolla ei ole väliä, T-013:n sääntö).
   - Käyttäjälle näytetään ohimenevä ilmoitus (toast tai kupla lisäyspainikkeen lähellä), esim. "Pakassa on jo Legend nimeltä V." `role="status"`, näkyy noin 4 s ja on suljettavissa.
   - Hakulistassa tällainen kortti näkyy himmennettynä ja selitys näkyy kuten nyt.
   - Neljännen Legendin lisäys pysyy sallittuna varoituksella kuten nyt. Vain sama nimi estetään.
   - Testi.
4. **Yhtenäiset hakulistan rivit:** pakkaeditorin hakulistassa −/määrä/+ on nyt välillä oikealla, välillä rivin alla (rivittyy nimen pituuden mukaan). Tee rivistä grid: tiedot vasemmalla (`minmax(0,1fr)`) ja kontrolli aina oikealla samassa kohdassa. Pitkä nimi rivittyy tekstinä. Sama koskee pakan puolen rivejä (T-041:n tiivistys samalla, rivin korkeus noin 56–64 px).
5. **Power näkyviin:** pakkaeditorin tekstiriveillä (haku ja pakka) näkyvät Cost, Power ja RAM (+ Rarity, jos mahtuu). Puuttuva arvo jätetään pois kuten nyt.
6. **Kuvanäkymä pakan kokoamiseen:** pakkaeditorin hakulistaan tulee valinta "Lista / Kuvat".
   - Kuvat-tilassa näkyy ruudukko kortin `md`-kuvista (noin 8–10 rem leveitä), kuvan alla määrä pakassa ja −/+.
   - Kuvan painallus lisää kortin pakkaan (sama kuin +). Saavutettava nimi on "Lisää pakkaan: <nimi>".
   - Laiska lataus.
   - Valinta muistetaan preferences-varastossa (kuten näkymävalinta T-040).
7. Testit, koko `npm test`, lint ja build menevät läpi. CHANGELOG `[Julkaisematon]`.

## Luovutukset
