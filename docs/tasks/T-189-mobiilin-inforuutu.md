# T-189 · Mobiilin inforuutu siistiksi ja cost-laatikon kehys
**Tila:** Review · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-21 (puhelinkuva tuotannosta, 2 saraketta)
**Katselmoinnit:** PM kuvakaappauksista. Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

## Määrittely (PM)
Puhelimessa (2 saraketta, ruutu noin 9–11rem leveä) inforuudun merkit ja tunnisteet hajoavat sekavasti ("haulikon ammuntakuvio"): COST-tunniste ja merkki, tyyppitabi, rarity-painike omalla rivillään ja POWER/RAM rivittyvät eri kohtiin.

1. **Kapea inforuutu (container query ruudun leveyden mukaan, ei näytön):** kun ruutu on kapea, merkit ovat yhtenäisessä, tasatussa asettelussa:
   - Rivi 1: nimi ja omistusmäärä. Rivi 2: alanimi (kuten nyt).
   - Rivi 3: tyyppitabi vasemmalla ja rarity oikealla samalla rivillä.
   - Rivi 4: cost, power ja RAM yhdellä rivillä tasavälein. Tekstitunnisteet (COST, POWER, RAM) pienenä tunnisteena merkin **yläpuolella** (pinottu pari, keskitetty) tai jos ei mahdu, visuaalisesti piilossa mutta saavutettavana nimenä ja `title`na. Ei rivitystä merkin ja tunnisteen väliin.
   - Kaikki merkit samankorkuisia ja pystysuunnassa tasattuja, ei orpoja rivejä eikä isoja aukkoja.
   - Merkkien koko skaalautuu ruudun mukaan (esim. `cqi`), mutta luvut vähintään 0.875rem.
   - Leveällä ruudulla (työpöytä) nykyinen asettelu säilyy, jos se toimii, mutta saman periaatteen (merkit tasattuina riveinä, rarity samalla rivillä tyypin kanssa) saa ottaa käyttöön myös siellä.
2. **Cost-laatikon kehys toisinpäin:** nyt kulmissa on hakaset ja sivujen keskellä tyhjää. Oikein on: sivujen keskellä viivat ja kulmat tyhjinä (kuten kortin cost-laatikossa, jossa kehys katkeaa kulmista). Hehku ja tumma pohja säilyvät.
3. Tarkista 320, 375 ja 390 px (iPhone), molemmat teemat, sekä 1280 ja 1920, ettei työpöytä hajoa. Myös Kokoelma › Omat ja Have/Want, merkintätila.

**Rajoitteet:** ei vaakaylivuotoa, ei sisäistä vieritystä, AA, reduced-motion, forced-colors.
Haara `t-189-mobiilin-inforuutu` testistä.

## Luovutus (Koodari, 2026-10-21)
Haara `t-189-mobiilin-inforuutu`. Muutokset: `src/styles/cards.css`, uusi `src/styles.t189.test.ts`. Ei TSX-muutoksia.
1. **Asettelu (kaikilla leveyksillä, ei vain kapealla):** `.card-box` on nyt `container-type: inline-size`; `.card-meta` on kolmen yhtä leveän sarakkeen ruudukko. Rivi 1: tyyppitabi (sarakkeet 1–2) vasemmalla, rarity oikealla (sarake 3). Rivi 2: cost, power ja RAM tasavälein, kukin pinottuna pariksi: tunniste (COST/POWER/RAM, muted, versaali) merkin yläpuolella keskitettynä, ei rivitystä. Kaikki merkit 1,875 rem korkeita (kapealla `clamp(1.625rem, 17cqi, 1.875rem)`), joten tunnisteet ja merkit ovat samalla linjalla. Rivi 1 (nimi, alanimi) ennallaan. Kapea ruutu (`@container (max-width: 11rem)`): merkit pienenevät ruudun mukaan, luvut 0,875 rem (vähintään), kirjainvälit tiukemmat; tunnisteita ei tarvinnut piilottaa 320 px:ssäkään (mahtuvat).
2. **Cost-laatikko (PM-korjaus):** ei täyttä kehystä eikä sisäviivoja: vain kunkin sivun keskimmäiset 60 %, 2 px kortin värillä, itse reunalla; kulmat tyhjinä. Hehku ja tumma pohja säilyvät.
2b. **Puuttuva arvo (PM-korjaus):** puuttuva cost, power tai RAM näytetään samankokoisessa tummassa merkissä viivalla (samat sivuviivat), joten tunniste pysyy samalla linjalla. Lähikuvat: `*-w390-crop-missing`, `*-w1280-crop-missing`, `*-crop-cost`.
3. **Tarkistettu** 320, 375, 390, 1280, 1920 px, tumma ja vaalea: Kortit, merkintätila, Kokoelma (Omat), Have/Want. Vaakaylivuotoa ei (scrollWidth − innerWidth ≤ 0 kaikissa), ei sisäistä vieritystä, ei konsolivirheitä. Desktop: inforuutu on nyt samaa rakennetta (rarity tyypin rivillä, tunnisteet merkin päällä) eikä hajoa.
Kuvat: scratchpad `ux/t189/` (`{dark,light}-w{320,375,390,1280,1920}-{cards,marking,collection,havewant}.png`; lähikuvat `*-w390-crop-two-boxes`, `*-w1280-crop-two-boxes`, `*-w390-crop-cost`, `*-w1280-crop-cost`).
Koodikatselmointi: tehty · Pakollisia korjattu 1 (power/RAM-merkit olivat cost-merkkiä 4 px matalampia, joten tunnisteet eivät olleet samalla linjalla: korkeus yhtenäistetty) · Suosituksia 1: CSS-testit ovat merkkijonotarkistuksia (jsdom ei maalaa).
Testit: npm test 2153 läpi, lint ja build läpi.
