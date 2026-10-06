# T-102 · Proxy-tulostus (suunnitelma)

**Tila:** Review (PR testiin, haara `t-102-proxy`). Käyttäjän päätökset on kirjattu (2026-10-06), ja ne ohittavat alla olevan käyttäjäpolun siltä osin kuin ne eroavat siitä.

## Tavoite
Pelaaja valitsee kortit, jotka hän haluaa tulostaa. Sovellus asettelee ne A4-arkille oikeaan kokoon, ja pelaaja tulostaa ne selaimen tulostustoiminnolla. Tyypillinen käyttö on pakan testaaminen ennen kuin kaikki kortit on hankittu.

## Lähtötiedot
- **Kortin koko:** 63 × 88 mm, tavallinen pelikorttikoko. Sovelluksen kuvasuhde `CARD_IMAGE_ASPECT = 1024/733` ≈ 1,397 täsmää siihen (88/63 ≈ 1,397).
- **Kuvien tarkkuus:**
  - Sovelluksen isot kuvat (`src/assets/cards/lg`, 720 × 1006 px) antavat 63 mm:n leveydellä noin 290 dpi. Tämä riittää hyvin, sillä tulostukseen riittää jo 250–300 dpi.
  - Versiokuvat (`src/assets/cards/variants`) ovat samaa luokkaa.
  - Uusia kuvia tai palvelinta ei tarvita.
- **Arkin asettelu:**
  - A4-arkille (210 × 297 mm) mahtuu 3 × 3 = 9 korttia: 189 × 264 mm, jolloin reunoille jää noin 10,5 mm ja 16,5 mm.
  - Useimmat tulostimet tulostavat noin 4–5 mm:n reunaan asti, joten 9 korttia mahtuu turvallisesti.
- **Tulostustekniikka:**
  - Tulostetaan selaimen omalla tulostuksella. CSS: `@page { size: A4; margin: 0 }` ja mitat millimetreinä (`mm`), jotta koko on oikea.
  - Uutta riippuvuutta (PDF-kirjastoa) ei tarvita.
  - Käyttäjää ohjeistetaan valitsemaan tulostusdialogissa skaalaus **100 % / todellinen koko**, ei "sovita sivulle".

## Käyttäjäpolku
1. **Proxy-tulostuksen avaus:** näkymään pääsee kolmesta paikasta.
   - **Pakkaeditorista:** valittuna joko pakan kaikki kortit tai vain kokoelmasta puuttuvat (yleisin tarve).
   - **Kortit-näkymästä:** valitut kortit.
   - **Have/Want-näkymästä:** want-listan kortit.
2. **Tulostusnäkymä** (`#/tulosta`, ruudulla):
   - **Korttilista:** jokaisella kortilla on määrä (−/+) ja valintaruutu. Pakasta tulleilla korteilla määrä vastaa oletuksena pakan tai puuttuvien määrää.
   - **Versio:** kortin versio (kuvitus) valitaan, jos niitä on useita. Oletuksena on peruskuvitus.
   - **Asetukset:**
     - leikkausmerkit (päällä tai pois)
     - kortin väliin pieni rako (0 / 1 / 2 mm), joka helpottaa leikkaamista
     - mustavalkoinen värisäästö (valinnainen)
     - "Proxy"-merkintä kortin kulmaan (oletuksena päällä, ks. päätettävät)
   - **Esikatselu:** ruudulla näkyvät arkit oikeassa mittasuhteessa. Ruudun alareunassa näkyy yhteenveto, esim. "27 korttia · 3 arkkia".
   - **Tulostus:** "Tulosta"-painike avaa selaimen tulostusdialogin, jossa on ohje 100 %:n skaalauksesta.
3. **Tulostusvalmiste:**
   - Vain arkit tulostetaan. Ylä- ja alapalkki sekä painikkeet piilotetaan `@media print` -säännöllä.
   - Jokainen arkki alkaa uudelta sivulta (`break-after: page`).
   - Kuvat ladataan ennen tulostusdialogin avaamista: odotetaan, että kaikki `img.decode()`-kutsut ovat valmiit, ettei tulosteeseen jää tyhjiä paikkoja.

## Tekninen rakenne
- **Domain** `src/domain/proxySheet.ts`, puhtaat funktiot ja testit:
  - `layoutSheets(items, options)` jakaa kortit (avain, kuvitus, määrä) yhdeksän kortin arkeiksi ja laskee sijainnit millimetreinä.
  - Kortteja voi olla enintään esim. 200, jotta selain ei kaadu.
- **UI** `src/ui/ProxyPrintView.tsx` sekä tulostus-CSS. Reitti `#/tulosta`, ja valinta välitetään istunnon tilana (sessionStorage), ei URL:ssa.
- **Testi kokoerolle:** vaihtoehtoisesti käyttäjä voi tulostaa ensin yhden kalibrointiarkin, jossa on 63 × 88 mm:n kehys ja viivain. Sillä hän tarkistaa, että tulostin ei skaalaa.
- **Saavutettavuus:** tulostusnäkymän toiminnot ovat tavallisia lomakekontrolleja. Esikatselun kuvilla on alt-teksti (kortin nimi).
- **Ei vaikutusta tietomalliin, tallennukseen eikä Firebaseen.** Digiturvan katselmointia ei tarvita (ei uutta syötettä ulkoa), paitsi jos tulostusasetukset tallennetaan.

## Työmäärä (arvio)
- Domain ja testit: noin 1 h.
- Tulostusnäkymä, tulostus-CSS ja reitti: noin 2–3 h.
- Kalibrointi ja tulostustestaus oikealla tulostimella: käyttäjä.

## Päätettävät (käyttäjä)
1. **Proxyjen salliminen:** julkaisijan (WeirdCo / CD PROJEKT RED) proxy-linjausta ei löytynyt. Sallitaanko tulostus henkilökohtaiseen testikäyttöön, ja näytetäänkö näkymässä huomautus "Vain henkilökohtaiseen testikäyttöön, ei myyntiin eikä turnauksiin"? Suositus: kyllä ja huomautus.
2. **"PROXY"-merkintä:** tuleeko kortin päälle pieni merkintä, joka erottaa proxyn oikeasta kortista? Suositus: kyllä, oletuksena päällä.
3. **Paperikoko:** riittääkö A4, vai tarvitaanko myös US Letter? Suositus: A4 ensin.
4. **Lähteet:** mistä tulostettavat kortit valitaan ensimmäisessä versiossa? Suositus: pakkaeditori (kaikki tai puuttuvat) ja Kortit-näkymä.

## Käyttäjän päätökset (2026-10-06)
1. **Proxyt sallitaan** henkilökohtaiseen testikäyttöön. Näkymässä on huomautus "Vain henkilökohtaiseen testikäyttöön, ei myyntiin eikä turnauksiin".
2. **PROXY-merkintä** tulee, mutta **pieni ja huomaamaton**: esimerkiksi pieni puoliläpinäkyvä teksti kortin reunassa, joka ei peitä kortin tekstejä.
3. **Paperikoko:** pelkkä A4 riittää.
4. **Lähteet: oma Proxy-osio yläpalkkiin.**
   - **Lisääminen:** Proxy-osiossa kortteja lisätään samaan tapaan kuin Kortit-osiossa (haku, suodattimet, kuvat ja ±). Kortit menevät suoraan **tulostusjonoon** ("proxy-kone"), jossa ne odottavat tulostusta.
   - **Lähettäminen muualta:** kortteja voi lähettää jonoon myös **Want-listalta** (yksittäin ja "kaikki want-kortit") ja **Pakoista** (koko pakka tai vain kokoelmasta puuttuvat).
   - **Säilyminen:** jono säilyy sivulatauksen yli. Se tallennetaan paikallisesti tallennuskerroksen kautta, eli uusi tallennusavain, ja tämä vaatii Digiturvan katselmoinnin. Jono ei synkronoidu pilveen ensimmäisessä versiossa.
   - **Tulostus:** jonosta tulostetaan arkit. Tulostuksen jälkeen käyttäjältä kysytään, tyhjennetäänkö jono.

## Luovutus
- Koodi:  (layout, leikkausmerkit, jono, enintään 200 korttia), tallennus  (, sama muoto ja validointi kuin kokoelmalla, ei pilvisynkkaa), , , ,  (fi+en), reitti  ja nav-linkki, lähetysnapit Have/Wantissa (yksittäin ja kaikki) ja pakkaeditorissa (koko pakka, puuttuvat), tyylit (,  = 1 mm tulosteessa).
- Kuvitus valitaan jonossa kuvitus kerrallaan (sama art-malli kuin kokoelmassa: versions-erittely); ruudut per kuvitus.
- Esikatselu käyttää samoja elementtejä kuin tuloste (skaalaus cqw:llä). Tulostus odottaa img.decode(), kysyy tyhjennyksen jälkeen.
- Testit: 1416+ läpi, lint ja build läpi. Uusia testejä: storage/proxy, domain/proxySheet, ui/ProxyView. App.theme-testin Tab-määrä +1 (uusi nav-linkki).
- Digiturva: uusi tallennusavain  (paikallinen, validoitu parseCollectionilla, varmuuskopio vioittuessa, poistuu tilin mukana). Ei uusia riippuvuuksia, ei muutoksia firebase.json:iin.
- Käyttäjän tarkistettavaa: oikea tulostus (kalibrointiarkki), PROXY-merkin paikka/näkyvyys kuvissa,  vaatii Chrome 85+/Firefox 110+/Safari 17.4+ (muuten selaimen oletusmarginaalit).
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 2 (writeEntry/entryOf toistuvat CatalogView:ssä ja ProxyView:ssä, voi siirtää yhteiseen; ProxyView-testit eivät kata kuvitusvalintaa, vain domain).
