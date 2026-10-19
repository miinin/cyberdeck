# T-181 · Visuaalinen uudistus: tiivis, staattinen Cyberpunk (paketit 0–6)
**Tila:** Paketit 0 ja 1 Done (testissä 2026-10-19), seuraavaksi paketti 2 · **Omistaja:** Koodari (paketeittain) · **Lähde:** `docs/reports/UX-T181-kokonaiskatselmointi.md`, päätökset D-038 (R1–R9)
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
