# T-187 · Inforuudun merkit tyylikkäiksi, pakkamäärä pois ja viisteiden korjaus
**Tila:** Done (tuotannossa 2026-10-20) · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-20 T-185:n jälkeen (5 kuvaa)
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

## Luovutus (Koodari, 2026-10-20)
Haara `t-187-merkit`. Muutokset: `cards.css`, `styles.css`, `collection.css`, `CardList.tsx`, `CatalogView.tsx`, testit (`styles.t187.test.ts` uusi; `CatalogView.decks.test.tsx`, `CatalogView.detail.test.tsx`, `styles.t181cards.test.ts` päivitetty).

**Merkit (ohuet viivat, tumma pohja #10101a, väri aksenttina, samat molemmissa teemoissa):** Cost = tumma neliö, ohut kehys, neljä HUD-kulmahakasta ja himmeä hehku, valkoiset numerot, ei viistettä (ei kustannusta: viiva samassa laatikossa ilman hakasia). Power = tummennettu kortin värinen täyttö, ohut kehys, pieni lovi vasemmalla ja viiste oikeassa alakulmassa, valkoinen luku. Tyyppi = tumma kuusikulmiotabi vinoilla päillä, ohut ääriviiva ja kortin värinen versaaliteksti. RAM = pieni tumma chip ohuella kehyksellä, "×2" ja kapea liuska oikealla. Tunnisteet POWER ja RAM poistettu; `title` ("Power 6", "RAM 2") ja dt-nimet säilyvät. Rarity ja inforuutu ennallaan. Kontrasti: valkoinen tummalla 18:1, kirkkaat värit tummalla ≥ 5,7:1 (kuvaajan mittaus: minContrast 5,47 muuten, ei uusia matalia).
**Pakkamäärä:** ◧ N poistettu korttiruudukon nimilapusta (`decksOf` pois CardLististä); lista ja korttidialogi näyttävät sen edelleen.
**Viisteiden syyt:** (1) Viistoviivagradientti piirtyi oletuksena padding-boxin mukaan eli 1 px reunaviivan sisään, joten viiva oli irti kehyksestä (kenttä, select, segmentti, .option, .card-tag, .object, ansiomerkki). Korjaus: `background-origin: border-box` kaikissa 8 gradienttisäännössä. (2) `.card-box` asetti paikallisen `--cut: 0.875rem`, mutta `--shape-chamfer` oli ratkaistu juuressa (0.5rem), joten leikkaus ja viiva olivat eri kokoiset. Korjaus: paikallinen polygon. (3) Värichipin (`.option`) viiste 5 px -> 4 px (`--cut-sm` ja `--shape-chamfer-sm` paikallisesti; huom. custom property ratkeaa siellä missä se on määritelty). Suodattimet-painike oli jo oikein eikä muuttunut.
Kuvat: scratchpad `ux/t187/` (crop-*: info-large, meta-red/yellow/green/blue, search = Hae-kenttä, seg, sel, chip, toolbar; tumma ja vaalea, 1280 ja 320; kokokuvat 320/1280/1920).
Koodikatselmointi: tehty · Pakollisia korjattu 2 (RAM-chipin täsmällisyys peitti padding- ja ::before-säännöt; tyyppitabin oma tausta näkyi viistojen päiden takana) · Suosituksia 2: (1) `CardDecks compact={true}` -muoto on nyt käyttämätön; (2) Pakat-listan ensimmäisen laatan oikeassa reunassa "RRR 3-1-1" leikkautuu (ennestään, ei tämän tehtävän aluetta).
Testit: npm test, lint ja build läpi (yksi ajoaikainen flaky aiemmassa ajossa, ks. T-186).

**PM 2026-10-20:** lisäksi Pakat-listan pakkalaatikon tulos (3–1–1) leikkautui 1280 px:ssä laatikon reunasta. Nyt se on aina omalla rivillään (`src/styles/decks.css`).
