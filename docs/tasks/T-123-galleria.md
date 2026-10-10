# T-123 · Galleria-tila ja selkeämpi kokoelman merkintä
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Katselmoinnit:** PM esikatselu (320 px, 768 px, 1440 px, tumma ja vaalea teema). Ei Digiturvaa: ei tallennus-, syöte- eikä riippuvuusmuutoksia.
**Riippuvuudet:** T-040 (selaus ja muokkaus), T-050a (kuvakoko), T-077 (kuvitukset), T-091 (koko ruudun kuva).

**Päättäjä:** käyttäjä (2026-10-10). Tarve: "korttien katseluun tila, jossa art on pääroolissa, suodattimet helposti piiloon ja kortit täyteen loistoon ilman mitään ylimääräistä". Lisäksi testikäyttäjä ei uskaltanut painaa "Muokkaa kokoelmaa" -kytkintä, koska ei tiennyt, mitä se tekee. PM: määrittely.

## Tavoite
1. Kortit-sivulle tulee **Galleria**, jossa näkyy vain korttien kuvitus suurena tummalla taustalla. Kaikki muu on piilossa, mutta suodattimet ja haku ovat yhden painalluksen päässä.
2. "Muokkaa kokoelmaa" -kytkin korvataan toiminnolla, joka kertoo, mitä se tekee: **Merkitse omat kortit**. Kun merkintätila on päällä, näkyvä palkki selittää tilan, ja tilasta poistutaan Valmis-painikkeella.

## Määrittely: Galleria
- **Avaus:** Kortit-sivun työkalurivillä (`ListToolbar`) on näkymävalitsimen vieressä painike **Galleria** laajennusikonilla (toissijainen tyyli). Painike näkyy kaikilla leveyksillä. Galleria avautuu nykyisillä suodattimilla, haulla, järjestyksellä ja "Kaikki versiot" -valinnalla.
- **Mitä piilotetaan:** sovelluksen yläpalkki, mobiilin alapalkki, suodatinsarake, työkalurivi, järjestysrivi, ilmoitukset ja korttien tekstit, laskurit ja merkit. Tausta on aina tumma (myös vaaleassa teemassa), esim. `#0b0c10`, jotta kuvitus erottuu.
- **Ruudukko:** pelkät kuvat kortin mittasuhteissa (63 × 88), pyöristetyt kulmat kuten fyysisessä kortissa ja hillitty varjo. Käytä suurinta saatavilla olevaa kuvaa (lg). Kuvat ladataan laiskasti (`loading="lazy"`), kuten nyt. Väli on noin 16 px, ja sivun reunoilla on 16 px:n marginaali. Hover tai fokus nostaa kortin hieman (`transform`, ei siirtymää `prefers-reduced-motion: reduce` -tilassa). Fokusrengas näkyy.
- **Koko:** kolme porrasta, Normaali (oletus), Iso ja Valtava. Leveällä näytöllä noin 5, 3–4 ja 2 korttia rivillä (`grid-template-columns: repeat(auto-fill, minmax(…))`). Puhelimessa 2, 1 ja 1 (Valtava = koko leveys). Ei vaakavieritystä.
- **Ohjauspalkki:** ohut, kelluva palkki ylhäällä (puoliläpinäkyvä tumma, `backdrop-filter`, jos tuettu). Sisältö: **× Sulje galleria** · hakukenttä (sama `criteria.query`) · **Suodattimet (n)** (n = aktiivisten suodattimien määrä, näkyy vain, kun n > 0) · koko **−/+** tai kolmen vaihtoehdon segmentti · "Kaikki versiot" -kytkin · korttimäärä himmeänä. Palkki ei saa peittää kuvia pysyvästi:
  - Työpöydällä palkki häivytetään 2,5 sekunnin kuluttua, jos hiiri ei liiku ja fokus ei ole palkissa. Se palaa hiiren liikkeestä, näppäimestä tai vierityksestä ylöspäin.
  - Kosketuslaitteilla palkki piiloutuu alaspäin vieritettäessä ja palaa ylöspäin vieritettäessä (kuten selainten osoitepalkki).
  - Ruudukon yläpuolella on palkin korkuinen tyhjä tila, joten ensimmäinen rivi ei jää palkin alle.
  - Puhelimessa (alle 600 px) palkissa ovat vain ×, hakuikoni (avaa kentän palkin levyiseksi), Suodattimet ja koko. Kaikki versiot -kytkin on suodatinpaneelissa.
- **Suodattimet galleriassa:** **Suodattimet**-painike avaa nykyisen `CardFilters`-paneelin sivun alkuun ohjauspalkin alle, osaksi sivua (ei sisäistä vieritystä, ei ylle aukeavaa laatikkoa). Ruudukko siirtyy alemmas, ja painike muuttuu muotoon **Piilota suodattimet**. Paneelin loppuun tulee nykyinen "Näytä N korttia" -toiminto (T-087), joka sulkee paneelin ja vierittää ruudukon alkuun.
- **Kortin avaus:** klikkaus tai Enter avaa kuvan koko ruudun katselimeen (laajenna olemassa olevaa koko ruudun kuvaa, T-091). Katselimessa on edellinen ja seuraava kortti (nuolinäppäimet, pyyhkäisy, näkyvät nuolipainikkeet), Esc tai × sulkee, ja linkki **Kortin tiedot** avaa nykyisen tietonäkymän (`#/kortti/…`). Kun katselin sulkeutuu, fokus palaa korttiin.
- **Sulkeminen:** × Sulje galleria, Esc (kun katselin ei ole auki) ja selaimen Takaisin. Takaisin toteutetaan, jos se onnistuu siististi: esim. `history.pushState` ja `popstate`, hash pysyy samana. Jos ei onnistu, jätä se pois ja kirjaa luovutukseen. Sulkemisen jälkeen fokus palaa Galleria-painikkeeseen ja vierityskohta on järkevä.
- **Tila:** galleria on istunnon tila, eikä sitä tallenneta. Koon valinta muistetaan istunnon ajan.
- **Tyhjä tulos:** keskellä teksti `galleryEmpty` ja painike **Tyhjennä suodattimet**.
- **Saavutettavuus:** ruudukko on lista (`ul`), jonka nimi on `galleryLabel`. Jokainen kortti on painike, jonka nimi on kortin nimi (ja kuvitus, jos versio). Ohjauspalkki on `role="toolbar"`. Galleriaa avattaessa fokus siirtyy ohjauspalkin ensimmäiseen painikkeeseen.

## Määrittely: Merkitse omat kortit (korvaa kytkimen "Muokkaa kokoelmaa")
- **Pois päältä:** kytkimen tilalla on toissijainen painike, jossa on plus- ja kortti-ikoni: **Merkitse omat kortit**. Painikkeen `title` ja `aria-describedby` on `markHint`.
- **Päällä:** tulosten yläpuolelle, työkalurivin alle, tulee korostettu tilapalkki (keltainen vasen reunus kuten KPI-laatoissa ja hillitty tausta):
  - Teksti: **Merkitset omia korttejasi.** `markBannerBody`
  - Painoksen valinta Beta / Retail siirtyy tähän palkkiin (se koskee vain merkintää).
  - Ensisijainen painike **Valmis** lopettaa tilan.
  - Merkintätilan painiketta ei näytetä, kun tila on päällä (palkki korvaa sen).
  - Puhelimessa palkki on kahdella rivillä: teksti ja sen alla painos sekä Valmis.
- Tallennettu asetus (`EDIT_MODE_KEY`) ja nykyinen oletuslogiikka säilyvät ennallaan (tyhjä kokoelma → tila päällä). Vain esitys muuttuu, joten tallennusmuutosta ei ole.
- "Kaikki versiot" pysyy kytkimenä, koska se on näkymäasetus eikä toiminto.
- Lisää tyhjään kokoelmaan liittyvä ohje: jos kokoelma on tyhjä ja tila on pois päältä, painikkeen vieressä näkyy himmeänä `markEmptyHint`.

## Tekstit (fi / en)
| Avain | fi | en |
|---|---|---|
| galleryOpen | Galleria | Gallery |
| galleryClose | Sulje galleria | Close gallery |
| galleryLabel | Galleria: korttien kuvitukset | Gallery: card art |
| galleryFilters(n) | Suodattimet ({n}) / Suodattimet | Filters ({n}) / Filters |
| galleryHideFilters | Piilota suodattimet | Hide filters |
| gallerySize | Koko | Size |
| gallerySizes | Normaali / Iso / Valtava | Normal / Large / Huge |
| galleryCount(n) | {n} korttia | {n} cards |
| galleryEmpty | Yksikään kortti ei vastaa suodattimia. | No cards match the filters. |
| galleryClear | Tyhjennä suodattimet | Clear filters |
| viewerPrev / viewerNext | Edellinen kortti / Seuraava kortti | Previous card / Next card |
| viewerDetails | Kortin tiedot | Card details |
| viewerClose | Sulje | Close |
| viewerPosition(i,n) | {i} / {n} | {i} / {n} |
| markOpen | Merkitse omat kortit | Mark cards I own |
| markHint | Näyttää jokaisen kortin alla + ja −, joilla kirjaat, montako kappaletta omistat. | Shows + and − under each card to record how many copies you own. |
| markBannerTitle | Merkitset omia korttejasi. | You're marking the cards you own. |
| markBannerBody | Kirjaa omistamasi määrä kortin alla olevilla + ja − -painikkeilla. Muutokset tallentuvat heti. | Use + and − under a card to set how many you own. Changes save straight away. |
| markDone | Valmis | Done |
| markEmptyHint | Kokoelmasi on tyhjä. Aloita merkitsemällä omat korttisi. | Your collection is empty. Start by marking the cards you own. |

`editSwitchLabel` poistetaan, jos sitä ei enää käytetä (muista testit).

## Hyväksymiskriteerit
- [ ] Galleria avautuu ja sulkeutuu (painike, ×, Esc, Takaisin, jos toteutettu). Fokus palaa oikein (testit).
- [ ] Galleriassa näkyvät vain kuvat. Yläpalkki, alapalkki, suodatinsarake ja korttien tekstit ja laskurit eivät näy (testi).
- [ ] Haku, suodattimet ja järjestys toimivat galleriassa ja säilyvät, kun galleria suljetaan (testi).
- [ ] Katselin: edellinen ja seuraava (nuolet ja painikkeet), Esc ja Kortin tiedot -linkki (testit).
- [ ] Ohjauspalkki häivytetään ja palautetaan, eikä se peitä ensimmäistä riviä.
- [ ] "Muokkaa kokoelmaa" -kytkin on korvattu painikkeella ja tilapalkilla, Valmis lopettaa tilan, painosvalinta on palkissa, ja tallennettu asetus toimii kuten ennen (testit päivitetty, ei heikennetty).
- [ ] Tekstit fi ja en. Ei sisäistä vieritystä, ei vaakavieritystä, ei päällekkäisyyksiä 320 px:llä, tumma ja vaalea teema, `prefers-reduced-motion` huomioitu.
- [ ] Ei uusia riippuvuuksia. `npm test`, `npm run lint` ja `npm run build` läpi.

## Rajaukset
- Galleria vain Kortit-sivulla (ei Kokoelma- tai Pakat-sivuilla, myöhemmin IDEAS).
- Ei diaesitystä, ei kuvien latausta tai jakoa.

## Luovutus
