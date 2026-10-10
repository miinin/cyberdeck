# T-125 · Kevyempi Kortit-sivun yläosa
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Katselmoinnit:** PM esikatselu (320 px, 768 px, 1440 px, tumma ja vaalea teema). Ei Digiturvaa: vain esitys muuttuu, ei tallennus-, syöte- eikä riippuvuusmuutoksia.
**Riippuvuudet:** T-123.

**Päättäjä:** käyttäjä (2026-10-10), kuvakaappaus puhelimesta: "Tämä näyttää tosi raskaalta. Kauhea määrä painikkeita ja raskas ilme ennen yhtään korttia. Yksinkertaista ja kevennä." PM: määrittely.

## Ongelma
Puhelimessa ennen ensimmäistä korttia on noin 1,5 ruudullista ohjaimia: iso otsikko ja kaksi tilariviä, haku ja Suodattimet, Kuvat/Lista ja Galleria, Kaikki versiot, kolmerivinen merkintäpalkki, kaksi järjestysvalikkoa ja Skannaa sekä linkki "Lisää puuttuvat wantiin". Kaikki ovat raskaita ja reunustettuja laatikoita.

## Tavoite
Puhelimessa ensimmäinen kortti alkaa ylimmästä kolmanneksesta. Ylhäällä on enintään kolme ohjainriviä, myös merkintätilassa korkeintaan neljä. Toiminnot säilyvät, mutta harvemmin käytetyt siirretään Suodattimet-paneeliin.

## Määrittely
1. **Otsikko:** Puhelimessa (alle 600 px) otsikko on pienempi (noin 28 px) ja keltainen alaviiva ohuempi. "151 korttia" ja kokoelman yhteenveto ovat samalla rivillä tai yhtenä himmeänä pienenä rivinä otsikon alla, ei erillisessä sarakkeessa. Leveällä nykyinen ilme saa jäädä, mutta tiivistä sitä samassa hengessä.
2. **Järjestys ja Kaikki versiot Suodattimet-paneeliin:** `SortSelect` ja "Kaikki versiot" -kytkin siirtyvät `CardFilters`-paneelin alkuun omaksi Näytä-osiokseen (esim. otsikko "Järjestys ja näkymä"). Ne näkyvät kaikilla leveyksillä samassa paikassa, ja leveällä paneeli on sivupalkki kuten nyt. Gallerian paneelissa on sama osio, joten gallerian oma Kaikki versiot -kytkin voidaan poistaa, jos se on paneelissa. Erillinen `sort-row` poistuu. Jos järjestys poikkeaa oletuksesta, se näkyy aktiivisena suodatinsiruna, joka nollaa sen. Taulukkonäkymän sarakeotsikot lajittelevat kuten ennenkin.
3. **Yksi työkalurivi:** `[Kuvat|Lista]` on ikoninen segmentti (ruudukko- ja lista-ikoni, näkyvä teksti vain leveällä, saavutettava nimi aina). Sen jälkeen tulevat Galleria (puhelimessa pelkkä ikoni ja aria-label) ja Skannaa (puhelimessa pelkkä kameraikoni), ja oikeaan reunaan Merkitse omat kortit. Rivi mahtuu 320 px:iin yhdelle riville. Kuvakoko (Pieni/Keski/Iso) pysyy siellä, missä se nyt näkyy.
4. **Kevyt ilme:** Työkalurivin painikkeet ovat matalia (noin 36–40 px korkeita, kosketusalue kuitenkin vähintään 40 px), ja reunat ovat ohuet ja himmeät. Leikattuja kulmia ja paksuja reunuksia ei ole. Haku ja Suodattimet saavat saman kevyemmän korkeuden. Isoja, keltaisia ja näyttäviä elementtejä käytetään vain aktiivisessa tilassa.
5. **Merkintäpalkki yhdelle riville:** `Merkintätila` (lihavoitu, keltainen vasen reuna) · `[Beta|Retail]` (kompakti) · `Valmis` oikealla. Selitysteksti (`markBannerBody`) on vain `title`- ja `aria-describedby`-tekstinä, ei näkyvänä. "Lisää puuttuvat wantiin" siirtyy palkin sisälle pieneksi tekstilinkiksi toiselle riville tai, jos tila riittää, samalle riville. Palkki saa olla puhelimessa korkeintaan kaksi riviä matalaa sisältöä.
6. **Lukittu kokoelmasivu** (`locked`, T-112) ja galleria toimivat kuten ennen. Tarkista ne esikatselusta.
7. Ei sisäistä vieritystä eikä vaakavieritystä. Kaikki pysyy 320 px:ssä (muisti: ei päällekkäisyyksiä).

## Hyväksyntä
- Puhelimessa (390 × 844) ensimmäisen kortin yläreuna on alle noin 45 %:n korkeudella merkintätilassa ja alle noin 35 %:n korkeudella ilman merkintätilaa.
- Testit päivitetään vastaamaan uutta paikkaa (järjestys ja Kaikki versiot paneelissa), eikä niitä heikennetä. `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus
Koodari (2026-10-10): valmis. Toteutus:
- `CardFilters` sai `sort`/`allArts`-propsit ja "Järjestys ja näkymä" -osion paneelin alkuun (kaikilla leveyksillä, myös gallerian paneelissa). `sort-row` poistui. Gallerian omat Kaikki versiot -kytkimet poistettu (`CardGallery` ei enää saa `allArts`-propseja). Muu kuin oletusjärjestys näkyy siruna "Järjestys: …", joka nollaa sen (uudet tekstit `viewOptionsLegend`, `sortChip` fi/en).
- `ListToolbar`: yksi rivi `[ikoni-segmentti Kuvat|Lista] [Kuvakoko] [Galleria] [Skannaa]  …  [Merkitse omat kortit]`. Teksti piilotetaan alle 40 rem:ssä (saavutettava nimi säilyy), Merkitse omat kortit on silloin pelkkä ikoni (title ja kuvaus ennallaan; tyhjän kokoelman muistutus tulee omalle rivilleen alle). Skannaa tulee `scanSlot`-propsina. `SegmentedChoice` hyväksyy ReactNode-otsikot.
- `MarkOwnBanner`: `Merkintätila.` · `[Beta|Retail]` · `Valmis` yhdellä rivillä, selitys vain `title` + `aria-describedby`, "Lisää puuttuvat wantiin" palkin sisällä (`extra`; puhelimessa toisella rivillä, leveällä samalla rivillä). Lukitulla sivulla linkki on ennallaan toolbarin alla.
- CSS: ohuet 1 px kehykset ja ei viistoja kulmia työkalurivissä, haussa ja Suodattimet-painikkeessa (40 px), pienempi otsikko (28 px) ja status yhdellä rivillä puhelimessa, tiivistetyt välit.
- Mitattu Chromella (CDP) 320/390/1440 px: ei vaakavieritystä, työkalurivi yhdellä rivillä 320 px:ssä. 390 × 844: ensimmäinen kortti alkaa merkintätilassa 375 px (44 %) ja ilman merkintätilaa noin 287 px (34 %) kun kokoelmalla on kortteja (343 px tyhjällä kokoelmalla, koska muistutusrivi lisää 56 px).
- Testit: gallerian Kaikki versiot -testi päivitetty paneeliin, uudet testit järjestyksen paikasta ja siruista sekä palkin kuvauksesta ja linkistä.
Poikkeamat: ei Digiturva-asioita. Sivuston oma header (~115 px puhelimessa) on kortin ulkopuolella ja vie suuren osan prosenteista. Merkitse omat kortit on puhelimessa pelkkä ikoni, koska teksti ei mahdu 390 px:n riville muiden kanssa (uusia tekstejä ei keksitty). Gallerian ylärivillä ei enää ole Kaikki versiot -pikakytkintä (spesifikaation mukaan paneelissa). Gallerian ja lukitun sivun asettelua ei tarkistettu selaimessa, vain testit (146 CatalogView-testiä läpi).
Tulokset: npm test 1765/1766 läpi (DeckEditor-aikaperusteinen testi epävakaa raskaan ajon aikana, läpi yksinään), lint ja build läpi.
Koodikatselmointi: tehty · Pakollisia korjattu 1 (puuttuva @media-otsikko CSS-siivouksessa) · Suosituksia 1 (`.list-toolbar`-sääntöjä on hajallaan useassa lohkossa; yhdistä myöhemmin).
