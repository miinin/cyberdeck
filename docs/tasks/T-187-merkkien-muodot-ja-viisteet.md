# T-187 · Inforuudun merkit tyylikkäiksi, pakkamäärä pois ja viisteiden korjaus
**Tila:** In Progress · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-20 T-185:n jälkeen (5 kuvaa)
**Katselmoinnit:** PM kuvakaappauksista. Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

## Määrittely (PM)
Käyttäjä: inforuutu ja rarity-symboli ovat hyviä. Merkit (isot kirkkaat nelikulmiot) näyttävät "MS Paint" -tyyliltä. Merkit saavat matkia kortin muotoja, mutta niiden ei tarvitse olla 1:1 eikä yhtä hallitsevia. Vaihtoehtoisesti voi keksiä tyylikkään modernin tavan esittää arvot.

Kortin muodot (käyttäjän kuvat):
- **Cost:** tumma neliö, ohut kortin värinen kehys ja jokaisessa kulmassa HUD-kulmahakaset, valkoiset lihavat numerot ja himmeä hehku. Ei viistettyä kulmaa.
- **Power:** puoliläpinäkyvä kortin värinen täyttö ja valkoiset numerot. Vasemmassa reunassa on pieni lovi tai tabi ja oikeassa alakulmassa viiste.
- **Tyyppi:** tumma täyttö, ohut kortin värinen ääriviiva, kortin värinen versaaliteksti ja vinot päät (kuusikulmio- tai nuolimainen tabi). Ei täyttä värialuetta.
- **RAM:** kortin värinen pieni chip, jonka sisällä tumma ympyrä ja "×2". Sivulla kapea hakasliuska.

Tehtävät:
1. **Merkit uusiksi** edellä kuvattujen muotojen pohjalta, hillitysti: ohuet viivat, tumma tai läpikuultava täyttö ja väri aksenttina, ei isoja kirkkaita laattoja. Tunnisteet (POWER, RAM) saavat jäädä pois, jos muoto ja `title` kertovat arvon. Saavutettava nimi säilyy ("Cost 5", "Power 6", "RAM 2"). AA molemmissa teemoissa.
2. **Pakkamäärä (◧ 2) pois** korttiruudukon nimilapusta. Pakkatieto näkyy edelleen korttidialogissa ja listanäkymän sarakkeessa.
3. **Viisteet** (käyttäjän kuva 5, Kortit-työkalurivi):
   - "Hae nimellä…" -kentästä puuttuu viiste tai viistoviiva tai se on väärin (viiva irti kehyksestä).
   - "Numero"-selectissä viiste on väärässä kohdassa tai viiva puuttuu.
   - Pieni/Normaali/Iso-segmentin viistoviiva on irti kehyksestä.
   - **Suodattimet-painike (mobiili) on oikea malli**, joten kaikki muut korjataan sen mukaisiksi: viiste oikeassa yläkulmassa ja viistoviiva samaa paksuutta ja väriä kuin kehys, yhtenäisenä kehyksen kanssa.
   - Värivalinnan chipeissä viiste on liian iso, joten se pienennetään (`--cut-sm` tai pienempi).
   - Käy läpi kaikki viistetyt elementit kaikilla sivuilla molemmissa teemoissa. Lähikuvat (crop) tärkeimmistä: kenttä, select, segmentti, chip, painike ja objekti.

**Rajoitteet:** ei uusia liikkuvia koristeita, ei sisäistä vieritystä eikä vaakaylivuotoa, AA, reduced-motion, forced-colors.
Haara `t-187-merkit` testistä.
