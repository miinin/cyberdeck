# T-115 · UI-siistiminen: Kortit-sivun työkalurivi, pakkaeditorin otsikko ja kytkin, korttinäkymä pakkaan, sideboardin vaakavieritys

**Tila:** Review. **Haara:** `t-115-ui-siistiminen` (testistä). **Päättäjä:** käyttäjä (palaute 2026-10-08, tuotannon kuvakaappaukset), PM (ratkaisut).

## 1. Kortit-sivun työkalurivi (CatalogView, ListToolbar, CardFilters)
**Ongelma:** ohjaimet ovat eri korkeuksilla ja eri tasoissa pystysuunnassa. Kuvat ja Lista näyttävät valintaruuduilta, "Kaikki versiot" kelluu irrallaan, skannauspainike on iso ja reunassa, ja hakuruudussa on raskas otsikko- ja ohjelaatikko.

**Tavoite puhelimessa** (alle 40rem), ylhäältä alas:
1. **Hakurivi:** hakukenttä täyttää leveyden, ja samalla rivillä oikealla on "Suodattimet"-painike (ikoni ja teksti tai pelkkä ikoni, jossa on aktiivisten suodattimien määrä). Näkyvä otsikko "HAE NIMELLÄ" ja ohjeteksti poistetaan. Otsikko jää `visually-hidden`-labeliksi ja ohje `placeholder`- tai `aria-describedby`-tekstiksi. Kulmakoristeellinen laatikko poistetaan hausta.
2. **Näkymärivi** (yksi rivi, kaikki ohjaimet saman korkuisia `--target-min` ja keskitetty pystysuunnassa): segmenttivalitsin `[Kuvat | Lista]` samalla tyylillä kuin pakkaeditorin välilehdet (ei valintaruutuja) ja järjestys yhtenä kompaktina valitsimena, jossa suunta on painike ↑/↓ tai osa valintaa. Jos kaikki ei mahdu 320 px:n leveydelle, järjestys saa siirtyä omalle rivilleen, mutta ohjaimet pysyvät tasattuina.
3. **Kytkinrivi:** "Muokkaa kokoelmaa" ja "Kaikki versiot" ovat **samanlaisia kytkimiä** (nykyinen `edit-switch`-tyyli) vierekkäin tai allekkain tasattuina.
4. **Skannaus:** kompakti toissijainen painike, jossa on kameraikoni ja lyhyt teksti "Skannaa". Se tasataan muiden ohjaimien kanssa, esimerkiksi näkymärivin oikeaan reunaan tai hakurivin viereen ikonipainikkeeksi. Ei täysleveää eikä isoa painiketta.
5. **Rivien väli:** sama väli kaikkien rivien välillä, eikä ylimääräisiä marginaaleja.

**Työpöydällä** sama logiikka: ohjaimet yhdellä tai kahdella tasatulla rivillä, saman korkuisina. Painosvalinta (`edition-select`) noudattaa samaa segmenttityyliä.

## 2. Pakkaeditorin otsikkorivi ja näkyvyyskytkin
- **Yksi otsikkorivi:** pakan nimi vasemmalla venyen, ja oikealla samalla rivillä himmeä "✓ Tallennettu" sekä vienti- ja jakopainike ikonina. Nimen alle ja oikealle ei jää tyhjää tilaa.
- **Kytkin teeman mukaiseksi:** näkyvyyskytkin käyttää samaa kytkintyyliä kuin `edit-switch` (kulmikas, teeman värit, ei pyöreää iOS-palloa). Päällä (Julkinen) korostusväri. Tee yksi yhteinen kytkintyyli (CSS-luokka), jota molemmat käyttävät.
- **Näkyvyys yhdellä rivillä:** "Yksityinen [kytkin] Julkinen · Vain sinä näet pakan." Vihje himmeänä samalla rivillä, jos se mahtuu, muuten heti alla ilman isoa väliä.

## 3. Pakan korttinäkymä: "Kortit"
- Pakkanäkymän valitsimeen (`deckViewLegend`: Lista / Pinot) tulee kolmas vaihtoehto **"Kortit"**. Siinä on kaksi korttia rinnakkain koko leveydellä puhelimessa (`grid-template-columns: 1fr 1fr`), ja kortit näkyvät kokonaisina oikeassa 63:88-kuvasuhteessa ilman rajausta. Leveämmillä näytöillä sarakkeita on enemmän (`repeat(auto-fill, minmax(10rem, 1fr))`).
- Kappalemäärä näkyy merkkinä kortin kulmassa (×2), ja +/- toimii kuten muissa näkymissä. Kortin napautus avaa kuvan tai tiedot kuten nyt.
- Ryhmittely (Legendit, Pääpakka-ryhmät ja Sideboard) on sama kuin muissa näkymissä.
- Valinta muistetaan kuten nykyinen näkymävalinta.
- Tekstit lisätään fi- ja en-tiedostoihin.

## 4. Pinot-näkymä: sideboard ei saa levitä vaakasuunnassa
- Pinot-näkymässä sideboard levittää sivun niin, että sitä joutuu vierittämään sivuttain. Korjaa niin, että sideboardin pinot rivittyvät samoin kuin pääpakan pinot. Sivulla ei saa olla vaakavieritystä 320 px:stä ylöspäin, eikä sisäisiä vieritysalueita.

## Hyväksymiskriteerit
- Kortit-sivun ohjaimet ovat tasattuja ja saman korkuisia. Valintaruutumaiset segmenttipainikkeet ja iso skannauspainike on poistettu.
- Pakkaeditorin otsikko on yksi rivi, ja kytkin on teeman mukainen ja yhtenäinen Muokkaa kokoelmaa -kytkimen kanssa.
- Korttinäkymä näyttää puhelimessa kaksi kokonaista korttia rinnakkain.
- Ei vaakavieritystä millään näkymällä (testaa leveydet 320, 390 ja 1440 px).
- Testit päivitetään, eikä niitä heikennetä. Kytkinten `role="switch"`, nimet ja saavutettavuus säilyvät.
- `npm test` (ajetaan kerran), `npm run lint` ja `npm run build` menevät läpi.

## Luovutus

- **1. Kortit-sivu:** haku ja "Suodattimet" samalla rivillä (otsikko ja ohje `visually-hidden`, `panel`-koriste pois; placeholderia ei lisätty, koska olemassa oleva testi kieltää sen). Kuvat/Lista, kuvakoko ja painos ovat segmenttivalitsimia (editorin välilehtien tyyli; radiot säilyvät, joten saavutettavuus ennallaan; sama tyyli pakkaeditorin valitsimissa). "Muokkaa kokoelmaa" ja "Kaikki versiot" ovat samanlaiset `role="switch"`-kytkimet. Skannaus on kompakti toissijainen painike "Skannaa" (`aria-label` "Skannaa kortteja" säilyy) järjestysrivillä; puhelimessa "Järjestys"-teksti on vain ruudunlukijalle, jotta järjestys ja skannaus mahtuvat yhdelle riville 390 px:llä (320 px:llä skannaus siirtyy omalle rivilleen).
- **2. Pakkaeditori:** otsikkorivi on yksi rivi (nimi venyy, oikealla tallennustila ja vienti; alle 26 rem tallennustilasta näkyy vain ✓ ja teksti jää ruudunlukijalle). Näkyvyyskytkin käyttää `edit-switch`-tyyliä (kulmikas, teeman värit), ja vanha pyöreä kytkin-CSS poistettu. Vihje samalla rivillä tai heti alla.
- **3. "Kortit"-näkymä:** kolmas vaihtoehto Lista / Pinot / Kortit sekä pääpakassa, legendeissä että sideboardissa. Kaksi kokonaista korttia rinnakkain (`1fr 1fr`), alkaen 40 rem `auto-fill minmax(10rem, 1fr)`; määrämerkki kulmassa, +/- kortin alla, ryhmittely kuten Lista-näkymässä. Valintaa ei muisteta istuntojen välillä, koska nykyinenkään pakkanäkymä ei ole tallennettu (vain komponentin tila). Tekstit fi/en (`deckViewCards`, `openShort`).
- **4. Sideboard:** spread-ruudukko `minmax(min(7rem, 100%), 1fr)`, `min-inline-size: 0` ja rivittyvät painikkeet.
- **Tarkistus:** Chromella (CDP, leveydet 320, 390, 1440): `scrollWidth` = leveys kaikissa (ei vaakavieritystä), Kortit-sivu, pakkaeditori, Kortit-näkymä ja Pinot-sideboard katsottu kuvakaappauksista. Ei sisäisiä vieritysalueita lisätty.
- **Testit:** `npm test` 1526 läpi (ajettu kerran lopuksi, uusi testi Kortit-näkymälle), lint ja build läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (320 px:n tilastoruudun "Legendit/Sideboard"-otsikot menevät päällekkäin; vanha vika, ei tämän kortin alaa).
