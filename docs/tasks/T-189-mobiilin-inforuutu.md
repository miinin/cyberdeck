# T-189 · Mobiilin inforuutu siistiksi ja cost-laatikon kehys
**Tila:** In Progress · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-21 (puhelinkuva tuotannosta, 2 saraketta)
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
