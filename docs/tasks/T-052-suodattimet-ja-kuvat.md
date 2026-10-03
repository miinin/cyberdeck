# T-052 · Hover-esikatselun korvaus, isommat kuvat, Cost/Power/RAM-suodattimet, värilaattojen korjaus
**Tila:** Review · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-03)
**Malli:** D-014. Käyttäjä on poissa ja kielsi luvan kysymisen. PM yhdistää testiin, kun PR:n tarkistukset ovat vihreät.
**Haara:** `t-052-suodattimet-ja-kuvat`

## Palaute (käyttäjä 2026-10-03)
1. Ei pidä tyhjästä kaistaleesta poimijataulukon ja pakkasarakkeen välissä, johon hover-kuva ilmestyy. Tilalle halutaan parempi ratkaisu.
2. Selatessa kuvien pitää olla isompia: nykyisen "Iso"-koon pitää olla uusi "Normaali", ja uuden "Ison" vielä isompi.
3. Suodattimiin lisätään ainakin hinta (Cost) ja Power sekä RAM.
4. Värisuodattimen värisymbolit vuotavat laatikon yli.
5. (PM havaitsi) Tyhjässä pakassa Unit-riveillä näkyy "Ylittää rajan", vaikka määrä on 0. Estomerkki on väärä (todennäköisesti RAM-raja ilman Legendiä, vrt. B-020).

## Hyväksymiskriteerit
1. **Kaistale pois:** poimijataulukko täyttää leveyden sarakkeessaan (72rem:n raja poistetaan tai sitä kasvatetaan niin, ettei näkyvää tyhjää kaistaletta jää). Nimi-sarake saa tilan, eikä sarakkeiden väliin jää isoja aukkoja.
2. **Parempi esikatselu:**
   - Hover-esikatselu on kelluva kuva kursorin tai rivin vieressä. Se sijoittuu näkymän sisään (flip, jos ei mahdu) eikä peitä riviä, jota osoitetaan.
   - Vaihtoehtoisesti tai lisäksi pikkukuvan klikkaus avaa ison kuvadialogin kuten nyt.
   - Esc ja vieritys sulkevat esikatselun, ja vain hiiri avaa sen (WCAG 1.4.13 kuten ennen).
   - Kortit-sivun taulukkonäkymään sama esikatselu.
3. **Kuvakoot** (Kortit-sivu ja editorin Kuvat-näkymä): Pieni = nykyinen Normaali, Normaali = nykyinen Iso, Iso = selvästi isompi (noin 24–26rem leveä). Oletus on Normaali.
4. **Suodattimet Cost, Power ja RAM** sekä Kortit-sivulle että editoriin (CardFilters ja cardSearch.ts):
   - valintanapit arvoista (esim. Cost 0–9+, Power 0–10+, RAM 1–4+) monivalintana samalla tyylillä kuin Harvinaisuus, tai min–max
   - kortti, jolla ei ole arvoa (null), ei osu, kun suodatin on päällä
   - aktiiviset suodattimet näkyvät poistettavina merkkeinä ("Cost 3")
   - puhtaat funktiot ja yksikkötestit
5. **Värisuodatin:** laatat ja symbolit pysyvät laatikkonsa sisällä kaikilla leveyksillä ja kummallakin teemalla.
6. **Bugi:** estomerkki näkyy vain, kun lisääminen todella ylittää säännön. Testi: tyhjässä pakassa ei ole estomerkkejä Unit-, Gear- tai Program-riveillä.
7. Kuvakaappaukset 375, 1920 ja 2850 px kummallakin teemalla, ei vaakavieritystä. `npm test`, lint ja build läpi, testejä ei heikennetä. CHANGELOG.

## Luovutukset

### Luovutus 2026-10-03 · Koodari → PM
**Tehty:**
1. **Kaistale pois:** `.pick-table`:n 72rem:n raja on poistettu, joten taulukko täyttää sarakkeensa. Leveässä poimijassa (`@container picker (min-width: 80rem)`) kiinteät sarakkeet (Tyyppi, Power ja RAM, Rarity, Pakassa) levenevät hieman, ja loput tilasta saa Nimi. Myös Kortit-sivun taulukon 100rem:n raja on poistettu samasta syystä.
2. **Esikatselu** (`CardHoverPreview.tsx`): kapean liipaisimen (≤ 640 px, pakkarivi) vieressä kuten ennen. Leveän rivin kohdalla kuva kelluu osoittimen oikealla puolella (tai vasemmalla, jos ei mahdu) rivin ylä- tai alapuolella sen mukaan, kummalla on enemmän tilaa, eikä se peitä riviä. Osoittimen x-koordinaatti päivittyy pointermovesta. Koko `clamp(18rem, 14vw, 24rem)`. Kortit-sivun Taulukko-näkymä käyttää samaa hookia (`CardTable.hoverProps`), ja kuvadialogin avaus sulkee esikatselun. Esc, vieritys ja "vain hiiri" toimivat kuten ennen. `place()` on viety testattavaksi.
3. **Kuvakoot:** Kortit-sivulla 14/18/25rem, editorissa 13/17/25rem, oletuksena Normaali. Editorin Iso-koossa puhelimessa on yksi kortti riviä kohti. Isoa kokoa varten `srcSet` 360w/720w ja `sizes="auto, 18rem"` (lazy-kuvat), jolloin Iso saa 720 px:n tiedoston (tarkistettu currentSrc:stä). Apufunktiot ovat `domain/cardImage.ts`:ssä.
4. **Cost-, Power- ja RAM-suodattimet** (`cardSearch.ts`): `costs/powers/rams` lisätty CardFilterCriteriaan. Funktiot `numberOption`, `numberFilterOptions`, `numberFilterOptionsFor` ja `matchesNumberFilter`, kattoina Cost 9+, Power 10+ ja RAM 4+. **Valinta:** vaihtoehdot tulevat datasta, eli vain ne arvot, joita korteilla on (Cost 1–8 ja 9+, Power 0–9 ja 10+, RAM 1–3 ja 4+), joten tyhjiä nappeja ei ole. Null ei osu. UI:ssa arvot ovat kompakteja numeronäppäimiä: natiivi checkbox on näkymätön mutta fokusoitava, valittu näppäin täytetään aksenttivärillä ja lihavoidaan, ja forced-colors-tilassa käytetään Highlightia. Merkit "Cost 3" ja "Power 10+": `criteriaFilters()` (ActiveFilters.tsx) on jaettu Kortit-sivun ja editorin kesken. Editoriin lisättiin ActiveFilters-rivi ja Tyhjennä haku ja suodattimet.
5. **Värilaatat:** `.option-color > span` on inline-flex, ja laatta on keskitetty 0.875rem:n kokoisena, joten se ei enää pistä reunan yli.
6. **Bugi:** `addBlocker` ei tarkista RAM-rajaa, kun pakassa ei ole Legendiä (vrt. B-020). Yksikkötesti ja UI-testi: tyhjässä pakassa ei ole Ylittää rajan -merkkejä.
7. **Lisäkorjaus:** `.table-scroll { position: relative }`. Taulukon solujen visually-hidden-tekstit levensivät sivua 375 px:n leveydellä Kortit-taulukossa (scrollWidth 663, oli jo test-haarassa).

**Testit:** `npm test` 48 tiedostoa ja 745 testiä läpi. Uusia testejä: cardSearch (numerosuodattimet), deckRules (tyhjä pakka), CardHoverPreview.test.ts (sijoittelu), CatalogView.filters (Cost/RAM, merkki), DeckEditor.pick (RAM-suodatin ja merkki, tyhjän pakan merkit, Kortit-taulukon esikatselu). `npm run lint` ja `npm run build` läpi.
**Kuvakaappaukset:** scratchpad `ux/h-final-*` (375, 1920 ja 2850 px, kumpikin teema, näkymät cards, cardstable, editor, editorimg, hover, cardshover ja filters) ja `ux/h-a3-filters-*`. Vaakavieritystä ei ole yhdessäkään.
**Koodikatselmointi:** tehty · Pakollisia korjattu 1 (Iso-kuvan resoluutio: 360 px:n kuva venyi 25rem:iin, korjattu srcSetillä) · Suosituksia 2.
**Velka / suositukset:** (a) Kortit-taulukon numerosarakkeiden otsikot ovat vasemmalla ja arvot oikealla (oli jo ennestään). (b) Esikatselu ei sulkeudu, jos rivi katoaa suodatuksen vuoksi osoittimen alta (pointerleave ei laukea). Sama koski editoria jo ennen.
**Riippuvuudet:** ei uusia.
**Seuraavaksi:** PM tarkistaa esikatselusta. UX tai Testikäyttäjä vasta MVP-tason lopussa (D-014).
