# T-181 · Visuaalinen uudistus: tiivis, staattinen Cyberpunk (paketit 0–6)
**Tila:** Paketit 0–3, 4a, 4b ja 5a Done, seuraavaksi paketti 5b (Have/Want ja Proxy) · **Omistaja:** Koodari (paketeittain) · **Lähde:** `docs/reports/UX-T181-kokonaiskatselmointi.md`, päätökset D-038 (R1–R9)
**Katselmoinnit:** PM esikatselusta. Paketti 1: ei riippuvuuksia, tallennusta, sääntöjä eikä workflowta, joten Digiturvaa ei tarvita. Paketti 6 tallentaa pakkoja: dev-testaus (D-029) ja Digiturvan kevyt katselmointi.

## Määrittely (PM)
Käyttäjän tavoite: "blown away": tyylikäs, tiivis, sujuva ja Cyberpunk, ei koskaan käytettävyyden kustannuksella. Glitch-otsikot säilyvät, mutta uusia liikkuvia koriste-elementtejä ei tule (vain toiminnalliset hover-, press- ja focus-siirtymät ≤ 150 ms, `prefers-reduced-motion` kunnioitetaan). Ei sisäistä vieritystä, ei vaakaylivuotoa 320 px:ssä, AA-kontrasti molemmissa teemoissa.

Paketit (raportin luku C): 0 skannerin mobiilikorjaus (tehty, T-181-0) · **1 globaali design-järjestelmä** · 2 Kortit ja korttiruudukko · 3 Kokoelma · 4a Pakat-lista · 4b Pakkaeditori · 5a Testaa · 5b Have/Want ja Proxy · 6 Premium-merkinnät ja pakkaan lisäys. Näkymäpaketit tehdään rinnakkain omiin `src/styles/*.css`-tiedostoihin.

### Paketti 1 (raportin luku A, luvun C rivi 1)
Tokenit, tausta, typografia, painikkeet (+ `.button-quiet`, `.icon-button`), kentät, segmentit (+ `--sm`), chipit, osio (`.panel`) ja `.object`, dialogit, taulukon perustyyli, linkit, yläpalkki ja mobiilinavi, alatunniste, `.page-head`, tyhjä tila ja notice sekä `src/styles/`-runko. UX.md luku 3 päivitetään. Vanhat token-nimet jäävät aliaksiksi.

### Paketti 2 (raportin B.1, B.2 ja luvun C rivi 2)
Kortit ja yhteinen korttiruudukko (CardList, jota käyttävät myös Kokoelma › Omat ja Have/Want), työkalurivi, sivupalkin suodattimet (`details.disclosure`-ryhmät), listanäkymä, merkintätilan alapalkki, galleria sekä korttidialogin asettelu (B.2, ei E.3:n pakkaan lisäystä). Hakukenttään luuppi-ikoni. Uudet ja korvaavat säännöt `src/styles/cards.css`:ään, ja vanhoista `styles.css`:n selektoreista poistetaan vain omat. Hyväksymiskriteerit: B.1 ja B.2, mitataan `capture.mjs`:llä (edellisen istunnon scratchpadissa `…/0e3c5532-…/scratchpad/ux/capture.mjs`).
**Lisäksi (B.9, PM:n oletus 2026-10-19):** lippupainikkeisiin näkyvä "FI"/"EN" (mono 0.75rem) ja saavutettava nimi "Suomi (FI)" / "English (EN)" (WCAG 2.5.3). Käyttäjä voi muuttaa tekstin.
Haara `t-181-2-kortit` testistä. Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

### Paketti 3 (raportin B.3 ja luvun C rivi 3)
Kokoelma: Omat kortit (otsikkorivi, käyttää paketin 2 ruudukkoa), Yleiskuva (mittarikaista, kolme saraketta, saavutuschipit ja kompakti "Seuraavat keikat", lukitut disclosurena), Kansio (aukeama mahtuu ruudulle, reunojen nuolipainikkeet), skanneri- ja kansiosivudialogien visuaali (vain luokat) ja tyhjä tila. Säännöt `src/styles/collection.css`:ään. Tilastojen palkkisiirtymät `prefers-reduced-motion`-ehdon sisään. Hyväksymiskriteerit: B.3, mitataan `capture.mjs`:llä. Testaa-osio on nyt violetti (`data-section='playtest'`), ei vaikuta tähän pakettiin.
Haara `t-181-3-kokoelma` testistä. Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

### Paketti 4a (raportin B.4 ja luvun C rivi 4a, PM 2026-10-22)
Pakat-lista, Kokoaminen, Julkiset ja tuonti raportin B.4:n kohtien 1–6 mukaan: koko pakkakortti on linkki (AVAA pois), ikonirivin toiminnot, kuvakaista 96 px, kortti ≤ 280 px, ruudukko `minmax(18rem, 1fr)`, otsikkorivillä `+ Uusi pakka` ja `Tuo ▾` (skannaus, pakkalista ja Netdeck valikkoon), lyhyet välilehdet, kompakti Kokoaminen ja Julkisten tyhjä tila. Lisäksi T-185:n suositukset: `.deck-row`-laatikot ja Tuo-valikko uusille pinnoille ja viisteille (kuten `.card-box`), pakkalistojen pyöreä cost-gem korttia matkivaksi merkiksi (T-187), ja tilastopalkkien siirtymät `prefers-reduced-motion`-ehdon sisään, jos niitä on näissä näkymissä. Säännöt `src/styles/decks.css`:ään, ja `styles.css`:stä poistetaan vain nämä selektorit. Kriteerit: B.4 (1280×800 kolme pakkaa ilman vieritystä, 1920 ≥ 5 riviä kohden, 320×640 ensimmäinen kortti ≤ 260 px, ei vaakaylivuotoa). Pakkojen toiminnallisuus ja tallennus ennallaan.
Suoraan `test`-haaraan (D-029). Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

### Paketti 4b (raportin B.5 ja luvun C rivi 4b, PM 2026-10-23)
Pakkaeditori raportin B.5:n kohtien 1–6 mukaan (R5: tilastot omalle välilehdelleen):
- **Otsikkorivi yhdellä rivillä** (≤ 64 px): `← Pakat` (ikoni ja teksti), muokattava nimi h1-koossa, ✓ Tallennettu (mono, muted), oikealla Yksityinen/Julkinen-kytkin, Vie ja jaa -valikko ja Pelaa yksin (`.button-quiet`). Kirjautumisvihje siirtyy kytkimen `InfoTip`iin, ja kirjautumattomalla kytkin on `aria-disabled` selityksen kanssa.
- **Sarakkeet:** ≥ 90rem kolme saraketta (suodattimet 16rem | haku ja tulokset | pakka 24rem). 64–90rem kaksi saraketta (`Suodattimet ▾` tulosten yläpuolella kuten nyt). Pakkasarakkeessa segmentti `Pakka | Tilastot | Tulokset` (oletus Pakka). Tilastot eivät ole enää pakan alla.
- **Tulosrivi 44 px yhdellä rivillä:** kuva 28 px, cost-gem, nimi ja alanimi, `Unit · P0 · R2` muted monona, varoitukset ikonina (tooltip ja saavutettava teksti), "Omistat 1" mono-lukuna ennen laskuria, −/+ 32 px (kosketuksella 40/44).
- **Tilarivi:** `PÄÄPAKKA 40/40–50 ✓ LAILLINEN · LEGENDIT 3/3` ja 4 px:n palkki ilman laatikkoa.
- **Tilastot-välilehti:** sormukset, kustannuskäyrä, eddit, värit ja tyypit sekä todennäköisyydet 2 × 3 -ruudukossa 1920:ssa ja kahdessa sarakkeessa 1280:ssa. DeckCharts ennallaan, kehykset pois. Palkkisiirtymät `prefers-reduced-motion`-ehdon sisään.
- **Testikäsi, Kirjaa peli ja Turnauslista:** dialogit A.3:n mukaan, ohjeteksti (i)-vihjeeseen.
- **4a:n suositukset:** `.cost-gem`-viisteet yhteen paikkaan (cards.css ja decks.css), `.object--menu`-fokuksen z-index yleiseksi, jos se on helppoa.
- Ei sisäistä vieritystä, ei vaakaylivuotoa 320 px:ssä (mobiilin alapalkki T-190 huomioidaan), AA molemmissa teemoissa, ei uusia animaatioita.
Kriteerit (B.5): 1280×800 hakukenttä ≤ 140 px, ensimmäinen tulosrivi ≤ 260 px ja Legendit näkyvät ilman vieritystä · 1920×1080 43 kortin pakkasarake (Lista, rivit 36 px) mahtuu ruudulle ja Tilastot ilman vieritystä · 320×640 Pakka-välilehden ensimmäinen pakkarivi ≤ 330 px.
Säännöt `src/styles/editor.css`:ään, ja `styles.css`:stä poistetaan vain nämä selektorit. Pakan toiminnallisuus, tallennus ja `domain/` ennallaan. Testit päivitetään rakenteen mukaan (`DeckEditor.tabs.test.tsx`), mutta niitä ei heikennetä. Suoraan `test`-haaraan (D-029). Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

### Paketti 5a (raportin B.6 ja käyttäjän toive, PM 2026-10-22)
Käyttäjä 2026-10-22: "Nyt se näyttää Unix-pohjaiselta tekstiseikkailulta... Visuaalisuutta peliin!" B.6:n kohdat 1–5 tehdään, ja lisäksi Testaa-osiosta tehdään visuaalinen pelipöytä:
- **Goldfish on pelilauta, ei paneelilista.** Lautamaton tausta (osion violetti, hienovarainen ruudukko tai piirilevykuvio, staattinen) ja alueet kuten oikeassa pelissä: Legendit, kenttä (Field), Gig-alue, käsi, pakka ja poistopino. Kaikki kortit näytetään **korttikuvina** (`gf-picture`, puuttuvalle kuvalle nykyinen varakuva). Käsi on alareunassa vierekkäin tai kevyesti limittäin, ja kortin klikkaus avaa korttidialogin tai toiminnon kuten nyt.
- **Tila näkyy kortista:** spent eli käännetty = kortti kierrettynä 90° (staattinen tila, ei animaatiota), lag = himmennys ja merkki, gear = kortin alla limittäin, kuvapuoli alaspäin olevat Legendit = kortin selkäpuoli (viistetty laatikko ja logoteksti, ei uutta kuvaa).
- **Gig-noppat nopan muotoisina** (d4 kolmio, d6 neliö, d8–d20 monikulmio `clip-path`illa), silmäluku isona monona ja kortin värin hehku. Tilarivi (vuoro, $, gigit 0/7) on pelilaudan yläreunan HUD-nauha monona.
- **Boosterit ja Sealed:** suljettu pakkaus on viistetty "booster-pakkaus"-objekti (setin nimi glitch-otsikkona ja kulmamerkinnät), ja harvinaiset saavat staattisen foil-kehyksen.
- Ei uusia animaatioita (D-038, käyttäjän linja). Hover, press ja focus ≤ 150 ms. Koko pelilauta mahtuu 1280×800:aan ilman vieritystä. 320 px:ssä alueet pinoutuvat, eikä niissä ole vaakaylivuotoa tai sisäistä vieritystä. Ruudunlukijan tekstit ja `aria-live` säilyvät.
Säännöt `src/styles/playtest.css`:ään. Pelilogiikkaan (`domain/goldfish.ts`) ei kosketa. Suoraan `test`-haaraan, ei Digiturvaa.

## Luovutus: paketti 1 (Koodari, 2026-10-19)
Haara `t-181-1-design-jarjestelma`.

**Toteutus**
- `src/styles/` (8 tyhjää tiedostoa otsakekommentilla) ja tuonnit `main.tsx`:ssä `styles.css`:n jälkeen järjestyksessä cards, collection, decks, editor, playtest, havewant, proxy, premium.
- Tokenit (A.1): pinnat `--surface-1…3`, `--surface-hover`, viivat `--line`, `--line-strong`, `--line-accent`, `--color-text-faint`, välit `--space-0/5/10` ja `--gap-section`, `--gap-stack`, `--pad-object`, `--pad-dialog`, kontrollit `--control-h` (40/44 px, R1) ja `--control-h-sm`, viisteet `--cut` 0.5rem, `--cut-sm`, `--cut-lg`, `--shape-chamfer-sm`, `--shape-object`, syvyys `--shadow-object`, `--shadow-pop`, `--glow-select`, typografia `--font-size-display`, `--font-size-label`, `--font-size-control`, `--font-size-tag`, `--letter-spacing-label`, liike `--ease`, `--ease-lift`, tausta `--grid-line`. Vanhat nimet aliaksina (`--color-surface` = `--surface-1` jne.).
- Tausta: staattinen 2rem:n HUD-ruudukko valoläikkien ja scanlinejen lisäksi (`forced-colors`: ei taustakuvia).
- Typografia (R2): h1 2rem (alle 40rem 1.625rem) ja 2.5rem × 3 px:n palkki, h2 1.25rem, h3, legendit, kenttien labelit, taulukon otsikot ja `.panel-title` 14 px:n labeleita, painikkeet ja segmentit 1rem.
- Komponentit: painikkeet (`--control-h`, lasimainen toissijainen, painettu tila, hover ilman alleviivausta), uudet `.button-quiet` ja `.button--sm`, `.icon-button` ja `.dialog-close` neliöinä, kentät `:where()`-perustyylillä (ei tarkkuutta), segmentit 1 px:n kehyksellä ja `.segmented--sm` (`SegmentedChoice size="sm"`), chipit, avoin `.panel` otsikkoviivalla, `.object`, `.empty` objektina, `.notice` tiiviimpänä, dialogit (`--surface-3`, neonyläviiva, `--shadow-pop`, blur-tausta, `.dialog-head`), tilivalikko ja InfoTip-popover, taulukon perustyyli, apuluokat `.label` ja `.mono`.
- Yläpalkki (R4): desktop 64 px (oli 69), puhelin 130 px (oli 165): logo ja työkalut 48 px:n rivillä, navigaatio 2 × 3, rivi 40 px, 14 px versaali. Hajallaan olleet yläpalkkisäännöt (8 kohtaa) koottu yhteen. Alatunniste tiivistetty, kaksi tekstiä rinnakkain ≥ 64rem.
- Poistettu T-127:n globaali ylikirjoitus (`main .button-*`, `main .segmented*`, `main .field input`), joka olisi kumonnut uudet perussäännöt.
- Korjattu samalla: jaetun rivin segmenttien tekstit (esim. skannerin "Yksi kerrallaan") menivät 320 px:ssä päällekkäin; nyt ne rivittyvät.
- UX.md luku 3 kirjoitettu uudelleen (design-järjestelmä, `src/styles/`, R1, R2, R4, R8-sticky-sääntö).

**Mittaukset (capture.mjs, 320 / 1280 px):** yläpalkki 165 → 130 / 69 → 65 px, h1:n yläreuna 173 → 138 / 93 → 85 px (kriteeri ≤ 150 täyttyy kaikilla mitatuilla sivuilla), vaakaylivuoto 0 kaikissa tiloissa, sisäisiä vieritysalueita 0. Kuvat: `scratchpad/ux/after-p1/` (vertailu `before/`).

**Kontrasti (laskettu):** muted 8.5 : 1 (tumma bg), 7.0 (surface-3), 7.3 (vaalea bg); faint 4.8–6.0; `--color-border-strong` 4.4 / 5.7; fokus 7.3 / 10.2.

**Testit:** uusi `src/styles.t181.test.ts` (R1, R2, aliakset, avoin osio ja objekti, uudet luokat, mobiilinavi, liiketokenit, tyylitiedostojen järjestys). `styles.ux174.test.ts` UX-16: hover-palkki 3 px → 2 px (sama tarkkuus). `SegmentedChoice.test.tsx`: `size`-prop.

**Näkymäpaketeille tiedoksi**
- Käytä tokeneita ja luokkia: `.object` (laatikko), `.panel` + `.panel-title` (avoin osio), `.button-quiet` (työkalurivit), `.icon-button`, `.button--sm`, `.segmented--sm` / `SegmentedChoice size="sm"`, `.label`, `.mono`, `.status-line`, `.dialog-head`.
- `.object`: `clip-path` leikkaa ulkovarjon. Jos objekti tarvitsee pudotusvarjon tai siitä ulottuu popover, jätä viiste pois.
- Kenttien perustyyli on nollatarkkuuksinen; vanhat paikkakohtaiset kenttätyylit (`.sort-select select`, `.set-filter select`, `.build-selects select` ym.) voittavat sen. Poistamalla ne näkymä saa yhtenäisen kentän.
- Näkymien omat korjattavat havainnot: pakkojen välilehdet rivittyvät 320 px:ssä kahdelle riville (4a), Sealedin settivalinta pinoutuu (5a), tilastojen 0.35–0.4 s:n palkkisiirtymät ovat `prefers-reduced-motion`-ehdon ulkopuolella (3, 4b), Tuo-valikko ja pakkakorttien laatikot käyttävät vielä vanhoja pintoja (4a).

**Ei tehty:** FI/EN-tekstit lippupainikkeisiin (B.9): näkyvä "FI" ei sisältyisi saavutettavaan nimeen "Suomi" (WCAG 2.5.3), joten se vaatii tekstipäätöksen (esim. nimi "Suomi (FI)"). Kysymys PM:lle. Hakukentän luuppi-ikoni kuuluu paketille 2 (CardFilters.tsx).

Koodikatselmointi: tehty · Pakollisia korjattu 1 (kenttien hover- ja fokussäännöt olivat 0,1,0-tarkkuudella ja olisivat voittaneet paikkakohtaisia tyylejä) · Suosituksia 2: (1) `.theme-toggle` on yhä painikeluettelossa, vaikka komponentti käyttää `.header-icon`-tyyliä (vanhaa, harmitonta); (2) dialogien laatikot eivät ole viistettyjä, koska `clip-path` leikkaisi varjon ja popoverit.

## Luovutus: paketti 2 (Koodari, 2026-10-19)
Haara `t-181-2-kortit`. Säännöt `src/styles/cards.css`:ssä (≈ 1 350 riviä); `styles.css`:stä poistettu omat selektorit (≈ 1 300 riviä, työkalulla selektori kerrallaan, ei muiden pakettien sääntöjä).

**Toteutus**
- Korttiruudukko (B.1): ei laatikkoa. Kuva + yksi datanauha (32 px): kustannusjalokivi, nimi yhdellä rivillä (ellipsi, `title` = koko nimi, alanimi vain ruudunlukijalle), "◧ 2" (saavutettava nimi "2 pakassa: …", `CardDecks compact`) ja omistuslaskuri. Alla muted mono -rivi `UNIT · P6 · R2 · ◇` (tyyppichip vain Legendillä; `dt`-selitteet ja "P"/"R" CSS-sisältönä `content: 'P' / ''`, joten ruudunlukija ei lue niitä kahdesti). Selaustilassa laskuri on nauhassa, merkintä- ja Have/Want-tilassa − / + on omalla rivillään (`.card-foot`), jotta napit mahtuvat.
- Koot: Pieni 8, Normaali 10.5, Iso 15 rem (kortin vähimmäisleveys). Kortin määrittelyn 9.5/12.5/17 rem antaisi 1280 px:ssä vain 4 korttia, joten kriteeri (≥ 5 / ≥ 7) ratkaisi. Alle 30 rem aina 2 saraketta.
- Työkalurivi: `Kuvat/Lista` ja `Pieni/Normaali/Iso` `segmented--sm`, Galleria/Skannaa/Merkitse `button-quiet` (Skannaa CSS:llä, koska `CardScanner.tsx` kuuluu paketille 3), lajittelu `SortSelect toolbar` (select + nuolipainike "Suunta: Nouseva"). Alle 40 rem lajittelu pysyy suodatinpaneelissa (rivillä ei ole tilaa; `useMediaQuery`).
- Sivupalkki 16 rem: haku luuppi-ikonilla, Kokoelma, Setti, Tagi, Tyyppi ja Väri 2 sarakkeessa, Harvinaisuus/Cost/Power/RAM suljettuina `details.disclosure`-ryhminä (`FilterGroup`; valinnan kanssa auki ja otsikossa "COST · 2"). Vanhat `.set-filter select` -tyylit poistettu, kentät saavat perustyylin. Ei sticky.
- Listanäkymä: rivi 44 px, nimi + alanimi samalla rivillä (alanimi muted), "Pakoissa" omassa sarakkeessa (uusi `cell-decks`, otsikko `deckTexts.columnDecks`), pikkukuva 28 px. Puhelimessa rivit rivittyvät kuten ennen.
- Merkintätilan alapalkki: 56 px, `--surface-3`, 2 px osioviiva ylhäällä, yksi rivi ≥ 40 rem.
- Korttidialogi (B.2): ≥ 40 rem `min(72rem, 100%)` ja kaksi saraketta (kuvan sarake seuraa ruudun korkeutta, `max-block-size: min(calc(100dvh - 4rem), 46rem)`), oikealla Kokoelma (määrä ja Want-laskuri rinnakkain), Pakat (lista + "Lisää proxy-jonoon" `button-quiet` otsikkorivillä) ja Versiot (`disclosure`, kiinni, otsikko "4 versiota · omistat 2"). Tagit ja saatavuus yhdellä mono-rivillä otsikon alla (`subline`-prop). < 40 rem koko näytön näkymä: kuva 60 % leveydestä.
- Pakkaan lisäystä (E.3), datapalkkia (E.1) ja Want-merkintää (E.2) ei tehty (paketti 6).
- B.9: lippupainikkeisiin näkyvä "FI"/"EN" (mono 0.75 rem, lipun alla) ja nimi "Suomi (FI)" / "English (EN)" (WCAG 2.5.3). Käyttäjä voi muuttaa tekstin (`FLAG_NAMES` LanguageSwitch.tsx:ssä).
- Proxy-sivun korttivalitsin käyttää samaa CardListiä: `.proxy-pick .card-head .card-cost` → `.card-strip .card-cost`, jotta kustannus pysyy piilossa. Muu Proxy-ulkoasu on paketin 5b.

**Mittaukset (capture-p2.mjs, tumma ja vaalea, seedattu kokoelma)**
| Kriteeri | Tulos |
|---|---|
| 1280×800 ensimmäinen kortti ≤ 200 | 197 (oli 253); Normaali 5 korttia/rivi, ensimmäinen rivi päättyy y = 503 (näkyy kokonaan) |
| 1920×1080 ≥ 7 korttia | 8 |
| 768 ≥ 3 korttia | 4 |
| 320×640 2 korttia, ensimmäinen ≤ 300 | 2 korttia, 295 (oli 347) |
| Lista: rivi ≤ 44, ≥ 11 riviä 1280×800 | 44 px, 12 riviä |
| Suodatinpalkki kiinni ≤ 760 (1280) | 755 |
| Dialogi ei vieri 1280×800 ja 1920×1080 | `scrollHeight` 800/800 ja 1080/1080 (myös 768: 1024/1024) |
| Dialogi 320: nimi, kuva 60 %, Kokoelma-laskuri ensimmäisellä ruudulla | otsikko y 16, kuva 174 px (60 % × 288), Kokoelma y 433–517 < 644; kerros vierii |
| Vaakaylivuoto 320 | 0 kaikissa tiloissa (Kortit, taulukko, suodattimet, merkintä, dialogi, Kokoelma › Omat, Have/Want, Proxy) |
| Sisäisiä vieritysalueita | 0 (320 px:n dialogi on itse kerros) |
Kuvat: `scratchpad/ux/a4/` (vertailu `base2/`).

**Testit:** `npm test` 161 tiedostoa / 2129 testiä läpi, `npm run lint` ja `npm run build` läpi. Uudet: `ui/CatalogView.t181.test.tsx` (nauha, meta-rivi, Legend-chip, laskuri nauhassa/rivillä, suodatinryhmät, haku-ikoni, järjestys työkaluriviltä), `styles.t181cards.test.ts` (koot, rivi 44 px, alapalkki, dialogi, ei animaatioita). Päivitetty (ei heikennetty, sama sisältö uuteen rakenteeseen): `styles.ux174.test.ts` UX-13 lukee `cards.css`:ää, `CatalogView.decks.test.tsx` (◧ 2 ja uusi "2 pakassa: …" -nimi, Pakoissa-sarake), `CatalogView.test.tsx` (lajittelu työkalurivillä, suunta nuolipainikkeella), `CatalogView.browse.test.tsx` (sarake), `CatalogView.detail.test.tsx`, `CardVersions.test.tsx` (sisempi `details`), `LanguageSwitch.test.tsx`.

**Huomioita PM:lle**
- Aktiivisten suodattimien rivi ei varaa tilaa, kun suodattimia ei ole (T-084:n "ei hyppyä" luovuttu, jotta ensimmäinen kortti mahtuu ≤ 200 px:iin). Chipin lisääminen siirtää kortteja noin 32 px.
- Pitkät nimet katkeavat nauhassa ellipsiin (esim. "Adam Sma…" 177 px:n kortissa); koko nimi on `title`:ssä ja dialogissa. Iso koko antaa enemmän tilaa.
- 320 px:ssä Kokoelman yhteenveto ("Kokoelmassa 114 eri korttia…") on yksi rivi ja päättyy tarvittaessa ellipsiin, jotta ensimmäinen kortti mahtuu ≤ 300 px:iin.
- Galleriaa (GalleryViewer/CardGallery) ei muutettu; vanha `.gallery-open`-tyyli poistui, mutta galleria käyttää omia luokkiaan. Visuaalista tarkistusta ei tehty gallerialle.
- Käyttämätön teksti `texts.versionsHeading` jäi (turvallinen poistaa myöhemmin).

Koodikatselmointi: tehty · Pakollisia korjattu 3 (suodatinpaneelin `[hidden]` kumoutui `display: flex`:llä; haku-ikoni jäi chamferatun kentän alle; dialogin Kokoelma/Want-otsikkoviivat eivät osuneet `.detail-counts`-lohkoihin) · Suosituksia 3: (1) `CardImageDialog.tsx`:n uusi `card-dialog-meta`-lohko on sisennetty väärin (lint ei vaadi); (2) `.card-table`-rivikiskot (`is-owned`/`is-playset`) ovat tilapäisesti cards.css:ssä, paketti 6 poistaa ne; (3) `.proxy-pick`-säännöt kuuluvat vielä styles.css:ään (paketti 5b).

**Korjauskierros (PM:n esikatselu):** listan Pakoissa-sarake näyttää pelkän luvun (nimi "2 pakassa" säilyy), alanimi on linkin ulkopuolella muted ilman alleviivausta, 320 px:n haku saa tilaa (kompakti Suodattimet-painike), suodatinpaneelin Järjestys-label, täysleveä Kokoelma-segmentti ja yhtenäinen vasen reuna, "Kaikki versiot" ei himmene (AA), dialogin Pakoissa-otsikko ja proxy-painike samalla rivillä; `texts.versionsHeading` poistettu. Testit/lint/build läpi.

## Luovutus: paketti 3 (Koodari, 2026-10-19)
Haara `t-181-3-kokoelma`. Kokoelman säännöt `src/styles/collection.css`:ssä; `styles.css`:stä poistettu vain omat selektorit (≈ 1 450 riviä, postcss-työkalulla, ei muiden pakettien sääntöjä). Testit: `styles.ux174.test.ts` lukee Kokoelman säännöt nyt collection.css:stä (ei heikennetty), uusi `styles.t181.collection.test.ts`.

**Toteutus**
- Yleiskuva: yläkaista ilman paneelia (rengas 96 px, Kopioita, Täysiä pelisarjoja ja Saavutukset mono 1.75rem, label 14 px, pystyhiusviivat). Seteittäin, Harvinaisuuksittain ja Värit ja tyypit kolmena sarakkeena (`auto-fit`, 3 kpl ≥ ~64rem), rivit 28 px, palkki 6 px, prosentti vain ruudunlukijalle. `AchievementsPanel` saa nyt valmiin `list`-propin (lasketaan kerran `CollectionView`:ssä, myös mittarille); solumittari poistettu.
- Saavutukset: avatut 32 px chippeinä (ikoni, nimi, ✓; "Avattu" ja kuvaus ruudunlukijalle), seuraavat 3–4-sarakkeisena listana (ikoni, nimi, `15/18`, 4 px palkki, tavoite yhdellä katkaistulla rivillä + `title`), lukitut disclosurena. Värit (tier, kortti- ja tyyppivärit, vaalean teeman ink) säilytetty.
- Puuttuvat kortit: yksi työkalurivi (suodattimet, määrä, kaksi painiketta), ohjetekstit yhdessä kappaleessa, ruudukko Pieni (8 rem).
- Kansio: ≥ 40rem aukeaman leveys mitoitetaan ruudun korkeudesta (`--binder-page-fit`, `--binder-chrome` 23rem), sivunvaihtonuolet reunoilla (`.binder-stage`, TSX-kääre), sijaintirivi aukeaman alla. Alle 40rem entinen asettelu.
- Omat kortit: `Lisää puuttuvat wantiin` siirretty työkalurivin loppuun (`ListToolbar endSlot`, ei omaa riviä), tilarivi lähemmäs h1:tä; puhelimessa h1 ja Skannaa (vain ikoni, nimi säilyy) samalla rivillä, segmentti omalla täyden leveyden rivillä.
- Tyhjä tila: `.empty--collection`, `max-inline-size: 44rem`, ikoni ja otsikko samalla rivillä. Skanneri-dialogi: Tila oli jo `segmented--fill` ja Beta/Retail kaksi isoa painiketta; ei muutosta tarvittu.
- Reduced-motion: Kokoelman säännöissä ei ole siirtymiä tai animaatioita no-preference-ehdon ulkopuolella (testi); `.ring-fill`-siirtymä on styles.css:ssä `reduce`-säännön alla.

**Mittaukset (capture-p3.mjs, tumma ja vaalea, seedattu kokoelma; kuvat `scratchpad/ux/p3/`)**
| Kriteeri | Tulos |
|---|---|
| Omat 1280×800 ensimmäinen kortti ≤ 220 | 215 (oli 263 paketin 2 jälkeen) |
| Omat 320 ensimmäinen kortti ≤ 330 | **396** (oli 451; ei saavutettu, ks. poikkeamat) |
| Yleiskuva 1920×1080: yläosa ennen puuttuvien kuvia | puuttuvat-osion otsikko y = 918, kuvaruudukko y = 1050 (< 1080) |
| Yleiskuva 1280×800 ≤ 1.6 ruutua (kuvaruudukon alkuun) | ruudukko alkaa y = 1181 = 1.48 ruutua (koko sivu 3.2, koska 37 puuttuvaa korttia vierii) |
| Rivi 28 px, palkki 6 px, chip 32 px | 28 (1920), 6, 32; 1280:ssa pitkä setin nimi (Beta) rivittyy ja rivi on 43 |
| Kansio 1280×800 aukeama ja nuolet ilman vieritystä | aukeama y 231–736, sijaintirivi päättyy y = 784 (< 800); nuolet y 452–516; 1920: 953 / 1001 |
| Skannerin runko ≥ min(36rem, 100 % − 16 px) | 576 (1280, 1920), 306 (320) |
| Vaakaylivuoto 320 | 0 kaikissa tiloissa |
| Sisäinen vieritys | 0 (dialogi vierii itse kerroksena, kuten ennenkin) |
| Kontrasti (laskettu tekstille, AA) | tumma min 4.66, vaalea min 6.91 yleiskuvassa; muissa ≥ 6.98. Mittarin väärät positiiviset: aina tumma kansi (#a9afbd sivunumero) ja gradienttitaustaiset ensisijaiset painikkeet |

**Poikkeamat ja kysymykset PM:lle**
1. Omat kortit 320: ≤ 330 ei täyty (396). Sisällön rivit (h1, segmentti, 2 riviä tilaa, haku + Suodattimet, kuvanäkymä + Beta/Retail, Lisää puuttuvat) vievät sen; 330 vaatisi jonkin poistamista (tilarivi tai want-linkki). Päätös?
2. "1 ruutu 1920×1080" täyttyy yläosalle (kaista, sarakkeet, saavutukset, puuttuvien työkalurivi), mutta koko sivu on 1.78 ruutua, koska 37 puuttuvan kortin kuvat vierivät ("kuvat saavat vieriä").
3. Kansion aukeama on 1280×800:ssa 713 px leveä (oli 782): kortit pienemmät, jotta sivunvaihto mahtuu ruudulle. `--binder-chrome` on mitattu arvo (23rem); jos yläpalkki tai h1 muuttuu, tarkista.
4. Seuraavat keikat -listassa tavoitekuvaus on katkaistu yhteen riviin (spesifikaatio listasi vain ikoni, nimi, palkki, count); jos halutaan pois, `.badge-grid--next .badge-flavor { display: none }`.
5. Kortin `CatalogView`/`ListToolbar` (paketti 2) sai pienen `endSlot`-propin Omat kortit -tilan want-linkkiä varten.

Koodikatselmointi: tehty · Pakollisia korjattu 2 (testit luki siirrettyjä sääntöjä styles.css:stä; `.missing-add`-ylikirjoitus olisi vuotanut muihin näkymiin, rajattu `.missing-bar`:iin) · Suosituksia 2: (1) kansion `--binder-chrome` on kovakoodattu mitattu luku; (2) `.progress-pct` piilotettu visuaalisesti, jos prosentit halutaan takaisin, ne mahtuvat ≥ 90rem:ssä.

**PM 2026-10-19 (paketti 3):** hyväksytty poikkeama: Omat kortit 320 px:ssä ensimmäinen kortti y = 396 (kriteeri ≤ 330, ennen T-181:tä 488). Sisältörivit ovat tarpeellisia; käyttäjä voi pyytää karsintaa.

## Luovutus: paketti 4a (Koodari, 2026-10-22)
Suoraan `test`-haaraan (D-029). Säännöt `src/styles/decks.css`:ssä; `styles.css`:stä poistettu vain 4a:n selektorit (85 sääntöä: `.deck-list`, `.deck-row`, `.deck-card-*`, `.deck-actions*`, `.public-deck-*`, `.build-*`, `.deck-record`, `.button-plus/-caret`; postcss-työkalulla). Jaetut `.decks-head`, `.decks-tabs` (Testaa käyttää), `.deck-progress`, `.deck-color-code`, `.export-menu*` (editori) jätetty paikalleen.

**Toteutus**
- Pakkakortti on objekti: koko kortti on linkki (otsikko `<a>`, `::after` venyttää; julkisissa `<button>`, koska data ei saa olla linkki, SR-37). AVAA poistui. Alareunassa päivämäärä vasemmalla ja ikonirivi (Kopioi, Vie ja jaa, Poista, 32 px, kosketuksella 40/44). Nimen vieressä värikoodi ja Nimeä uudelleen -ikoni. Kuvakaista 96 px, edistymispalkki 4 px. Viiste tehty `::before`-levyllä, jotta Vie ja jaa -valikko ei leikkaudu; fokus näkyy koko kortin ympärillä.
- Ruudukko `minmax(18rem, 1fr)`. Otsikkorivi `+ Uusi pakka` ja `Tuo ▾` (Skannaa uusi pakka, Tuo pakkalista, Hae Netdeck.gg:stä; valikko uusilla pinnoilla ja viisteellä). Välilehdet `Omat | Kokoaminen | Julkiset` (en: Mine | Build | Public), yksi rivi 320:ssa.
- Kokoaminen: Pakanvaihto yksi rivi (`select → select`), kooste heti alla sarakkeina, Yhteensopivuus kompakti värikoodattu matriisi (solu 32 px, leveys `--decks`-muuttujasta), Kokoa kaikki listana ilman vieritystä.
- Julkiset: päivityspainike ikonina otsikkorivillä (nimi "Päivitä lista"), tyhjä tila yhdellä rivillä (`.empty--row`), kortti ilman bannerria.
- Cost-gem pakkalistoissa (editorin laatat, valitsin, sivupakka, tuonti): tumma neliö ja kortin värinen viiva sivujen keskellä, valkoiset numerot (kuten T-187). Ei koske korttiruudukkoa eikä korttien infolaatikkoa.
- Muokattu-aika kortilla vain päivämääränä (koko aika `title`issä), jotta alarivi mahtuu.
- Tilastopalkkien siirtymiä näissä näkymissä ei ole, joten reduced-motion-työtä ei tarvittu.
- Testit: Omat/Julkiset-linkkien nimet (`Omat`, `Julkiset`), skannauspakkatesti avaa Tuo-valikon ensin. Ei testejä poistettu tai heikennetty.

**Mittaukset (capture-p4a.mjs, tumma ja vaalea, kolme testipakkaa)**
| Kriteeri | Tulos |
|---|---|
| 1280×800 kolme pakkaa ilman vieritystä | kortit y 214–473, sivu 1.0 ruutua (oli 1.03) |
| Kortin korkeus ≤ 280 | 259 (280 vain 320:ssa, kun tilarivi rivittyy kahdelle riville) |
| 1920 ≥ 5 per rivi | laskettu: 6 raitaa (1872 px / 18 rem), mitattu vain 3 pakalla, joten 3 riviä; ei mitattu viidellä pakalla |
| 320×640 ensimmäinen kortti ≤ 260 | alkaa y = 228 (oli 422); otsikko ja painikkeet kaksi riviä (h1 + yksi painikerivi), ei kolmea |
| Vaakaylivuoto 320 | 0 kaikissa tiloissa; sisäistä vieritystä 0 |
| Kontrasti (laskettu) | tumma min 6.03, vaalea min 5.12 |
| Kokoaminen 1280×800 | Pakanvaihto ja Yhteensopivuus näkyvät kokonaan (y 214–692) ilman valintaa; valinnan jälkeen kooste työntää Yhteensopivuuden alas (pitkät kortti­listat), sivu 3 ruutua |

**Poikkeamat ja kysymykset PM:lle**
1. Kokoaminen valinnan jälkeen: Yhteensopivuus ei mahdu ruudulle, koska "Palauta kansioon" -lista on 17 riviä. Voisi rajata (esim. kolme saraketta kahden rivin listaksi) jos halutaan.
2. 320: otsikko ja `+ Uusi pakka`/`Tuo` eivät mahdu samalle riville (~17 px liian vähän), joten painikkeet ovat omalla rivillään.
3. 1920 ≥ 5 per rivi mittaamatta viidellä pakalla.
4. Muokattu-aika vain päivämääränä (ks. yllä).

Koodikatselmointi: tehty · Pakollisia korjattu 2 (Vie ja jaa -valikon kerros ilman fokusta Safarissa: `:has([aria-expanded])`; 320-taulukon otsikot "Tarvitaan/Omistat" menivät päällekkäin) · Suosituksia 2: (1) `.cost-gem`-viistot ovat nyt kahdessa tiedostossa (cards.css ja decks.css), yhdistettävissä 4b:ssä; (2) `.deck-row`-selektorin `:has` -fokus-z-index voisi olla yleinen `.object--menu`.

## Luovutus: paketti 5a (Koodari, 2026-10-22)
Testa-osion visuaalinen pelipöytä, suoraan test-haaraan (D-029).

**Toteutus**
- Goldfish: violetti ruudukkolauta, HUD-nauha (vuoro, $, Eddies, Gigit, varastetut), alueet Legendit, Kenttä, Gig, Käsi sekä Pakka ja Trash -pinot. Kaikki kortit kuvina; spent = kierretty 90 astetta (staattinen), Lag = himmennys ja merkki, gear = chipit kortin alla limittäin, kuvapuoli alas = selkäpuoli (viistetty laatikko ja CYBERDECK-teksti). Noppa-muodot ja silmäluku isona monona hehkulla. Kustannus kortin kulmamerkkinä. Otsikko ja paluulinkki samalla rivillä työpöydällä.
- Boosterit ja Sealed: ohjausrivi (setti sm-segmentti, painike, mono-tilarivi, (i)-vihje selitteille). Ei paikanpitäjiä, tilalla suljettu pakkaus -objekti (glitch-otsikko staattisena, kulmamerkit). Avattu pakka 9+3 (1280) ja 12 riviin (1920), Epic, Iconic ja Secret saavat foil-kehyksen (staattinen gradientti). Sealed-aloitus: pakkaus ja aloituspainike.
- Pelaa yksin: pakat objektiriveinä (nimi, värikoodi, korttimäärä, ▶).
- Säännöt `src/styles/playtest.css`:ään, vanhat Goldfish-, pack-, solo- ja quick-open-säännöt poistettu styles.css:stä (jaettuja decks-head, decks-tabs, export-menu ei kosketa). Pelilogiikkaan ei kosketa, ei uusia riippuvuuksia.
- Testi: SealedView.test.tsx, avauksen alkutila: 12 tyhjää paikkaa -> suljettu pakkaus ja 0 listaelementtiä (vaatimuksen muutos, ei heikennys).

**Mittaukset (Chrome, tumma ja vaalea)**: vaakaylivuoto 0 ja sisäisiä vieritysalueita 0 kaikissa. 1280x800: Goldfish-lauta ja toimintopalkki mahtuvat (lauta 129-662 px, palkki 765 px), avattu booster 9+3 loppuu 771 px. 1920x1080: lauta ja palkki loppuvat 851 px, loki sivussa, booster 12 riviin 547 px. 320x640: ei ylivuotoa.

**Avoimet**: (1) 320 px:n boosterin ohjausrivi on 172 px: setti, painike+(i) ja tilarivi eli 3 visuaalista riviä (kriteeri enintään 2 ei täyty tilarivin pituuden vuoksi). (2) Noppojen hehku on osion violetti, ei kortin väri (kortin värin sääntö epäselvä). (3) Pakkausten kulmamerkit "CD" ja "TCG" ovat koristetekstiä, tarkista sisältö. (4) Tilarivin teksti on nykyiset merkkijonot (Avattu 1 pakkaus · Osumat: Epic 1, ...), ei kortin esimerkin muotoa.

Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1: GoldfishView.tsx jaettu osiin (alue-komponentit) myöhemmin.

Testit: npm test vihreä, lint ja build läpi.

## Luovutus: paketti 4b (Koodari, 2026-10-23)
Suoraan `test`-haaraan (D-029), ei pushattu. Säännöt `src/styles/editor.css`:ssä: ensin 434 editorin selektoria siirrettiin `styles.css`:stä postcss-työkalulla (commit ilman visuaalista muutosta), sitten uusi ulkoasu. `styles.css`:ään jätettiin jaetut luokat (`export-menu*`, `deck-head*`, `deck-bar*`, `.panel`, `.is-empty`, `.stat-block`, `ring-center`, `cost-curve-*`), jotta muiden tiedostojen kaskadi ei muutu.

**Toteutus**
- **Otsikkorivi** yhdellä rivillä (48 px, ≤ 64): `← Pakat` (ikoni + teksti), muokattava nimi, ✓ Tallennettu (mono), Yksityinen/Julkinen-kytkin + (i), Vie ja jaa -ikonipainike ja Pelaa yksin (`.button-quiet`, ikoni + teksti). Kirjautumis- ja yksityisyysvihje on kytkimen `InfoTip`issä; kirjautumattomalla kytkin on `aria-disabled` (ei `disabled`) ja vihje kertoo syyn. Julkaisulomake avautuu otsikon alle omalle rivilleen. Alle 40rem `← Pakat` ja Pelaa yksin ovat ikoneita (sanat saavutettavina nimina).
- **Sarakkeet**: ≥ 90rem (aiemmin 100rem) suodattimet 16rem | haku ja tulokset | pakka 24rem; 64–90rem kaksi saraketta (`Suodattimet ▾` + skannausikoni haun rivillä, paneeli tulosten yläpuolella). Skannaa-painike on ikonina alle 90rem.
- **Pakkasarakkeen näkymät** `Pakka | Tilastot | Tulokset` (oletus Pakka). Alle 64rem yksi palkki `Pakka | Lisää | Tilastot | Tulokset` (Lisää = saavutettava nimi "Lisää kortteja"). Tilastot ja Tulokset ovat leveällä ruudulla oma näkymänsä (`.is-wide-pane`: haku ja suodattimet piiloon, näkymä koko leveydelle, välilehtipalkki pysyy oikeassa reunassa), koska 24rem:n sarakkeeseen ei mahdu 2 × 3 -ruudukkoa. Kaikki osat pysyvät mountattuina (hidden), joten haku ja suodattimet säilyvät.
- **Tulosrivi** 44 px yhdellä rivillä: kuva 28 px, cost-gem, nimi + alanimi, `Unit · P0 · R2` mono (sarakkeet Tyyppi/Power/RAM yhdistetty sarakkeeksi Tiedot, ruudunlukija kuulee värin ja arvot), varoitus ikonina (tooltip + piilotettu teksti), "Omistat N" monona ennen laskuria. Ohjetekstit (klikkaus, haaleat kortit) ovat pick-barin (i)-vihjeessä. Kapealla (container) sarakkeet putoavat pois; 320 px: alanimi vain ruudunlukijalle.
- **Tilarivi** `PÄÄPAKKA 40/40–50 ✓ LAILLINEN · LEGENDIT 3/3` ja 4 px palkki, ilman laatikkoa. Pakkarivit 36 px (44 kosketuksella), otsikot pieniä label-tekstejä, tyhjän sideboardin selitys (i)-vihjeenä. "Takaisin hakuun" on `focus-reveal`-linkki.
- **Tilastot**: 3 pylvästä (≥ 90rem), 2 tasapainotettua (64–90rem), 1 kapealla; DeckCharts ennallaan, listat tiivistetty. `rulesNote` ja `Pelaa yksin` siirretty (Pelaa yksin otsikkoon). **Tulokset**: luvut ja taulukot vasemmalla, pelilista oikealla ≥ 64rem.
- **Testikäsi**: selitykset (i)-vihjeeseen. Kirjaa peli ja Turnauslista: ulkoasu oli jo A.3:n dialogimalli (T-181 aiemmin), ei muutosta; Kirjaa peli -lomakkeen yksityisyysohje jätettiin näkyviin tarkoituksella (GDPR-ohje, ei apuohje).
- 4a:n suositukset: `.cost-gem`:n perussääntö siirrettiin `decks.css`:ään (cards.css:n `.card-meta`-variantti ja decks.css:n listavariantti ovat nyt samassa kaskadissa; viisteet kahdessa paikassa mutta eri konteksteissa). `.object--menu`-fokuksen yleistämistä ei tehty: luokkaa ei ole, vain `.deck-row:has([aria-expanded])` (4a).
- Palkki- ja rengassiirtymät (5 kpl) siirretty `prefers-reduced-motion: no-preference` -ehdon sisään. Ei uusia animaatioita.
- Testit: rakenteen mukaan (Takaisin pakkoihin -> Pakat, Tilastot/Tulokset-välilehti avataan ensin, Tiedot-sarake, aria-disabled-kytkin, CSS-vartijat lukevat editor.css:n, UX-24 "varattu huomautusrivi" -> "kiinteä 44 px:n rivi"). Lisätty 2 välilehtitestiä. Ei testejä poistettu eikä heikennetty.

**Mittaukset** (Chrome, capture-p4b, 3 testipakkaa, 43 kortin pakka = 17 riviä; tumma ja vaalea)
| Kriteeri | Tulos |
|---|---|
| 1280×800 hakukenttä ≤ 140 | 129 (oli 353) |
| 1280×800 ensimmäinen tulosrivi ≤ 260 | 250 (oli 550) |
| 1280×800 Legendit ilman vieritystä | pakkarivit alkavat y 300, kolme Legendia loppuvat ~410 |
| 1920×1080 pakkasarake mahtuu (Lista, 36 px) | sarake 129–1069 (sisältäen sideboardin ja proxy-napit) |
| 1920×1080 Tilastot ilman vieritystä | kaaviot päättyvät 1051 (3 pylvästä) |
| 320×640 Pakka-välilehden ensimmäinen pakkarivi ≤ 330 | 320 (oli 782) |
| Otsikkorivi ≤ 64 | 48 (≥ 1280), 80 kahdella rivillä 320 px:ssä |
| Vaakaylivuoto, kaikki tilat 320/1280/1920 | 0 |
| Sisäinen vieritys | 0; poikkeus: Testikäsi-dialogi 320 px:ssä on koko ruudun dialogikerros (aiempi ratkaisu) |
| Kontrasti (laskettu) | tumma min 6.03, vaalea min 5.12; `.tile-action` mittaus antaa 3.96/3.33, koska mittari ei näe `::before`-täyttöä; oikea suhde teksti/täyttö 15.65 (tumma) ja 18.98 (vaalea) |

**Poikkeamat ja kysymykset PM:lle**
1. Tilastot ja Tulokset korvaavat haun leveällä ruudulla (oma näkymä), koska raportin 2 × 3 -ruudukko ei mahdu 24rem:n sarakkeeseen. Jos haluat tilastot pakkasarakkeeseen, ruudukko pitää luopua.
2. "43 kortin pakka" mitattu seed-pakalla, jossa on 43 korttia mutta 17 eri riviä. 43 eri kortin pakka (43 × 36 px) ei mahtuisi 1080:een.
3. 320 px: tulosrivin nimi rivittyy 2–4 riville (nimi saa ~100 px), rivi kasvaa yli 44 px; alanimi piilotettu. Korjaus vaatisi pakkaoikoteiden tai kuvan piilotusta.
4. Tilastojen sarakejako on kiinteä (overview+kustannus+värit | eddit+tyypit+pienet | todennäköisyydet+ryhmälaskuri+puuttuvat); eddit-kaavion tyhjä tila on DeckChartsin korkeus (ei muutettu).
5. Julkaisulomake (nimimerkki, varoitus) otsikon alla tarkistettu vain koodista ja testeistä, ei kuvasta (kirjautuminen puuttui capturesta).
6. Dev-palvelin pyörii portissa 5231 taustalla (sammuta tarvittaessa).

Koodikatselmointi: tehty · Pakollisia korjattu 3 (nimen `deck-head-*`-luokat kantoivat vanhan 1.25rem-fontin tilariville ja rivi rivittyi; 320 px:n hakukenttä kutistui 81 px:ään kun skannaus ja suodatinpainike veivät tilan; `.editor-head`- ja name-field-säännöt tuplina) · Suosituksia 3: (1) `DeckEditor.tsx` (1300 riviä) kannattaa jakaa osiin (otsikko, pakkapaneeli, hakupaneeli), (2) tilastopaneelien kiinteä sarakejako DeckStatsissa → data-ohjattu, (3) `.object--menu`-fokuksen z-index yleiseksi kun luokka syntyy.

Testit: npm test 2163 läpi, lint ja build läpi.
