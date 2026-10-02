# T-045 · Hiominen: tyyppimerkin kulma, värisuodatin palloina, Legend-nimen esto, yhtenäiset rivit, Power ja kuvanäkymä pakkaeditoriin
**Tila:** Done · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02)
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
### Luovutus 2026-10-02 · Koodari → PM
- Mitä tehtiin: (1) `.type-badge::after` piirtää viistoreunan `--badge-color`illa gradientilla (molemmat teemat samalla tokenilla). (2) Väriryhmän chipit pelkkinä palloina (`CardColor swatchOnly`, visually-hidden nimi, `title`, valittu = chipin reuna + rasti, korkeus 28 px). (3) `hasSameNameLegend` (deckRules) + estävä toast pakkaeditorissa (`role="status"`, 4 s, Sulje ilmoitus); himmennys ja selite ennallaan, neljäs Legend sallittu. (4) `.card-row` on grid `minmax(0,1fr) auto`, min-korkeus 3.5 rem, koskee haku- ja pakkarivejä. (5) cardMeta: + Power ja Rarity. (6) Lista/Kuvat-valinta (`DeckPickImage.tsx`, md-kuva, laiska lataus, kuva = "Lisää pakkaan: <nimi>", −/+ kuvan alla); valinta `cyberdeck:deck-pick-view` (preferences.loadDeckPickView/saveDeckPickView).
- Mitä pyydän: PM tarkistaa esikatselusta ulkoasun (viistokulma, kuvaruudukon leveys 8 rem+, rivien korkeus), sillä visuaalista tarkistusta selaimessa en tehnyt.
- Huomio: kuvanäkymässä kuvapainike ja + -painike ovat molemmat nimeltä "Lisää pakkaan: <nimi>" (kriteerin mukaan). Ei uusia riippuvuuksia.
- Testit: `npm test` 589 läpi (uudet: hasSameNameLegend, preferences, toast, 4 s katoaminen, Power/Rarity, kuvanäkymä ja muisti), lint ja build läpi. CHANGELOG päivitetty.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0

### PM 2026-10-02 · Done (D-014)
- Esikatselu PR #16: tyyppimerkin viisto kulma (vaalea teema), värisuodatin palloina, kuvanäkymä ja samannimisen Legendin esto tarkistettu kuvakaappauksin. PM korjasi kaksi virhettä: samannimisen Legendin vihje sanoi "Voit silti lisätä kortin" (regressiotesti lisätty), ja kuvanäkymän hintId oli kaikille sama `blocker-` (päällekkäiset id:t).
