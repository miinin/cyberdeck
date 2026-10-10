# T-123 · Galleria-tila ja selkeämpi kokoelman merkintä
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
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
- [x] Galleria avautuu ja sulkeutuu (painike, ×, Esc, Takaisin, jos toteutettu). Fokus palaa oikein (testit).
- [x] Galleriassa näkyvät vain kuvat. Yläpalkki, alapalkki, suodatinsarake ja korttien tekstit ja laskurit eivät näy (testi).
- [x] Haku, suodattimet ja järjestys toimivat galleriassa ja säilyvät, kun galleria suljetaan (testi).
- [x] Katselin: edellinen ja seuraava (nuolet ja painikkeet), Esc ja Kortin tiedot -linkki (testit).
- [x] Ohjauspalkki häivytetään ja palautetaan, eikä se peitä ensimmäistä riviä.
- [x] "Muokkaa kokoelmaa" -kytkin on korvattu painikkeella ja tilapalkilla, Valmis lopettaa tilan, painosvalinta on palkissa, ja tallennettu asetus toimii kuten ennen (testit päivitetty, ei heikennetty).
- [x] Tekstit fi ja en. Ei sisäistä vieritystä, ei vaakavieritystä, ei päällekkäisyyksiä 320 px:llä, tumma ja vaalea teema, `prefers-reduced-motion` huomioitu.
- [x] Ei uusia riippuvuuksia. `npm test`, `npm run lint` ja `npm run build` läpi.

## Rajaukset
- Galleria vain Kortit-sivulla (ei Kokoelma- tai Pakat-sivuilla, myöhemmin IDEAS).
- Ei diaesitystä, ei kuvien latausta tai jakoa.

## Luovutus

**Koodari · 2026-10-10 · Tila: toteutettu, odottaa PM:n esikatselua**

Commitit (suoraan test-haaraan, D-029): `0c65a99` merkintäpainike ja tilapalkki, `6fe074b` galleria. Ei uusia riippuvuuksia, ei tallennusmuutoksia (`EDIT_MODE_KEY` ja oletuslogiikka ennallaan).

**Merkitse omat kortit.** `MarkOwnBanner.tsx` (painike `MarkOwnButton` ja palkki `MarkOwnBanner`). Kytkimen tilalla toissijainen painike (plus- ja kortti-ikoni, `title` ja `aria-describedby` = `markHint`). Päällä: keltareunainen tilapalkki työkalurivin alla, jossa teksti, painosvalinta ja Valmis. Fokus siirtyy Valmis-painikkeeseen ja takaisin Merkitse-painikkeeseen. Tyhjällä kokoelmalla ja tilan ollessa pois päältä näkyy `markEmptyHint`. Kokoelma-sivulla (`locked`) ei painiketta eikä palkkia, ja painosvalinta pysyy työkalurivillä. `editSwitchLabel` poistettu.

**Galleria.** `CardGallery.tsx` (palkki, ruudukko, tyhjä tulos), `GalleryViewer.tsx` (koko ruudun katselin), `galleryItems.ts` (kuvat ja nimet ruudukon kohteista), `useGallery.ts` (tila, historia, vieritys ja fokus), `useBarVisibility.ts` (häivytys). `CatalogView.tsx` sai vain tilan kytkennän ja `filters()`-apufunktion (sama lomake molemmissa näkymissä); `CardFilters` sai valinnaiset `hideSearch` ja `onShowResults`.
- Galleria korvaa sivun sisällön (ei päällekkäisiä id:itä). Sovelluksen yläpalkki (sisältää navigoinnin) ja alapalkki piilotetaan `hidden`-attribuutilla (`App.tsx`, `onGalleryChange`), tumma tausta tulee `html[data-gallery=on]`-attribuutista. Galleriassa käytetään aina tummaa paletia myös vaaleassa teemassa.
- Takaisin-painike toteutettu: avaus tekee `history.pushState` (sama osoite), sulkeminen kutsuu `history.back()`, ja `popstate` sulkee. Vierityskohta ja fokus (Galleria-painike) palautuvat.
- Ohjauspalkki on `position: sticky`, joten se varaa itse ruudukon yläpuolisen tilan (ei erillistä välikettä) ja kelluu vieritettäessä. Työpöytä: häipyy 2,5 s kuluttua, ellei hiiri tai fokus ole palkissa tai suodatinpaneeli auki; palaa hiiren liikkeestä, näppäimestä, fokuksesta tai ylösvierityksestä. Kosketus (`hover: none`): piiloutuu alasvierityksessä, palaa ylösvierityksessä. Alle 600 px: ×, hakuikoni, Suodattimet ja koko; Kaikki versiot siirtyy suodatinpaneeliin, korttimäärä jää pois.
- Suodatinpaneeli avautuu sivun vuossa palkin alle, ja "Näytä N korttia" sulkee sen ja vierittää ruudukkoon. Hakukenttä palkissa on sama `criteria.query`.
- Katselin on natiivi `<dialog>` (Esc, fokuksen ansa), nuolinäppäimet, painikkeet, pyyhkäisy (pointer-tapahtumat), naapurikuvien esilataus, sijainti "i / n". Kortin tiedot avaa nykyisen tietodialogin, ja fokus palaa korttiin.

**Poikkeamat kortista.**
1. "Kortin tiedot" on painike (ei `<a href="#/kortti/…">`): hash-reitin käyttö olisi sotkenut Takaisin-historian ja `dismissedKey`-logiikan. Avaa saman tietonäkymän suoraan tilasta.
2. Koko on kolmen vaihtoehdon segmentti (ei −/+). Alle 600 px palkki voi siksi mennä kahdelle riville 320 px:llä (ei päällekkäisyyksiä, rivit rivittyvät).
3. Korttikuvaa vailla oleva kortti näyttää galleriassa nimensä katkoviivakehyksessä (muuten se olisi näkymätön).
4. Kosketusnäyttöjen ja ohjauspalkin häivytyksen tosielämän tuntuma, 320 px:n ulkoasu ja vaalea teema on tarkistettu vain koodista ja jsdom-testeillä, ei selaimessa. PM:n esikatselu (320, 768, 1440 px, tumma ja vaalea) tarvitaan.

**Testit.** `CatalogView.browse.test.tsx` ja `AddMissingToWants.test.tsx` päivitetty uuteen merkintäkäyttöliittymään (kattavuus kasvoi: painike, kuvaus, tyhjä muistutus, Valmis, fokus, painos palkissa, tallennettu asetus päällä ja pois). `CatalogView.test.tsx`: ei muita painikkeita kuin Galleria. Uudet: `CatalogView.gallery.test.tsx` (22 testiä: avaus, sulkeminen painikkeella, Esc, Takaisin, otsikko ja alapalkki piiloon, vain kuvat, haku, suodattimet ja Näytä N korttia, järjestys, tyhjä tulos, koko, katselin, pyyhkäisy, Kortin tiedot, häivytys, puhelinleveys) ja `galleryItems.test.ts`.

**Tulokset.** `npx tsc --noEmit` ja `npx eslint . --max-warnings 0` puhtaat, `npm run build` läpi. `npm test`: 1764/1765 läpi; yksi epävakaa `DeckEditor.test.tsx` ("saves automatically after a short pause", 500 ms viive) kaatuu koko sarjan kuormassa mutta menee läpi yksin ajettuna (24/24). Se ei koske tätä muutosta.

Koodikatselmointi: tehty · Pakollisia korjattu 3 · Suosituksia 3
- Korjattu: `react-hooks/refs` -säännön vastaiset ref-kirjoitukset renderöinnin aikana (3 paikkaa); Valmis/Merkitse-painikkeiden fokus katosi tilanvaihdossa; työkalupalkin nimi oli sama kuin listan nimi.
- Velka (suositus): (1) `CatalogView.tsx` on yhä yli 800 riviä, ja `page`-JSX rakennetaan myös galleriassa; (2) kuvien esilataus katselimessa ei peruunnu nopeassa selauksessa; (3) tuplanäytön, näytönlukijan ja kosketuksen tosikäyttö testaamatta selaimessa.

Seuraavaksi: PM:n esikatselu (320, 768, 1440 px, tumma ja vaalea). Ei Digiturvaa (ei tallennus-, syöte- eikä riippuvuusmuutoksia).

### PM (2026-10-10)
- Tarkistettu paikallisesta buildista: Kortit-sivu ja merkintäpalkki (320 px tumma, 1440 px vaalea) sekä galleria (320 ja 1440 px). Korjattu itse: Galleria-painikkeen ikonin ja tekstin väli. Poikkeamat 1–5 hyväksytty.
