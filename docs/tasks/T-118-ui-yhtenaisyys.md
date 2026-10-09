# T-118 · Koko sivuston UI-yhtenäisyys ja viimeistely ennen julkaisua

**Tila:** Done (2026-10-09). **Haara:** suoraan `test` (D-029). **Päättäjä:** käyttäjä (2026-10-09: "UX 5/5, ulkoasu autistisen tarkasti yhteneväinen ja viimeistelty; liukukytkimet ja painikkeet yhteneväisiä, ehyitä ja toimivia").

## Vaihe 1: auditointi (Opus, UX-rooli)
Tuotos on `docs/reports/UX-118-yhtenaisyys.md`. Koodia ei muuteta tässä vaiheessa.

**Kuvakaappaukset:** jokainen näkymä ja tila tuotantobuildista (`npm run build` ja `vite preview`, CDP/headless Chrome). Leveydet 390 × 844 ja 1440 × 900, tumma ja vaalea teema, fi (en tarkistetaan pistokokein).
- Kortit: lista, kuvat, suodattimet auki, kortin tiedot.
- Kokoelma: tyhjä tila, yleiskuva, kansio, skanneri auki ilman kameraa (virhetila).
- Pakat: tyhjä tila, lista, tuonti, Netdeck.
- Pakkaeditori: Pakka- ja Lisää-välilehti, näkymät Lista, Pinot ja Kortit, tilastot, testikäsi, näkyvyys ja vahvistuslomake.
- Julkiset pakat ja julkinen pakka, jaettu pakka, Have/Want ja vaihtolinkki, Proxy.
- Tilivalikko, ensikirjautumisen dialogi, painosvarmistus ja muut dialogit, alatunniste, 404 tai tuntematon reitti.

**Komponentti-inventaario:** jokaisesta komponenttityypistä kaikki variantit, joissa se esiintyy, sekä mitat (korkeus, reunus, viiste, fonttikoko, kirjainväli, kirjainkoko, välit) ja poikkeamat.
- Painikkeet: primääri, sekundääri, ikoni, linkkipainike, vaarallinen toiminto.
- Kytkimet, segmenttivalitsimet ja välilehdet.
- Valintaruudut ja radiot.
- Tekstikentät, haku ja select.
- Ilmoitukset, merkit ja tagit, (i)-vihjeet, popoverit ja valikot, dialogit.
- Otsikkotasot (h1, h2, h3), osiolaatikot ja kortit, tyhjät tilat, edistymispalkit, laskurit (×N).

**Löydökset vakavuusjärjestyksessä:** jokaisesta näkymä, kuvakaappaus, tarkka ongelma ja korjausohje (tiedosto, selektori tai komponentti sekä tavoitearvo). Etsi erityisesti:
- epäyhtenäiset muodot, korkeudet ja tyylit
- rikkinäiset tai leikkautuvat elementit, päällekkäisyydet ja vaakavieritys
- tasausviat ja epäjohdonmukaiset välit
- turha teksti ja toisteisuus, turhat laatikot
- epäselvät toiminnot ja fokus- tai hover-tilojen puutteet
- kontrastit molemmissa teemoissa
- kirjainkoon epäjohdonmukaisuus (VERSAALIT vs. normaali)
- kielivirheet ja sekakieli

**Yhtenäisyysstandardi:** kirjataan raportin alkuun ja tarvittaessa myös `docs/UX.md`:hen lyhyenä lukuna. Kullekin komponentille määritellään yksi tapa: korkeus, viiste, tyyli ja tilat.

## Vaihe 2: korjaukset (Koodari)
Kaikki raportin löydökset korjataan, ja standardi toteutetaan yhteisinä CSS-luokkina tai komponentteina päällekkäisten tyylien sijaan (kuollut CSS poistetaan). Lopuksi uudet kuvakaappaukset samoista näkymistä vahvistavat korjaukset.

## Hyväksymiskriteerit
- Jokaisella komponenttityypillä on yksi yhtenäinen ulkoasu koko sivustolla.
- Ei rikkinäisiä, leikkautuvia tai päällekkäisiä elementtejä, ei vaakavieritystä 320–1440 px:llä, eikä sisäisiä vieritysalueita.
- Testit päivitetään, eikä niitä heikennetä. `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus

### Vaihe 1: auditointi (UX, Opus)
Valmis: `docs/reports/UX-118-yhtenaisyys.md` (43 löydöstä: 1 kriittinen, 15 korkeaa, 15 keskitasoa, 12 matalaa).

### Vaihe 2: korjaukset (Koodari, 2026-10-09, suoraan `test`-haaraan, D-029)

**Tila:** Done. Kaikki 43 löydöstä on korjattu. Yhtään ei jäänyt virheelliseksi. Kaksi (UX-118-09 ja UX-118-14) toteutettiin PM:n päätöksen mukaan, ks. alla.

**PM:n päätökset toteutettu**
- UX-118-09: `.scan-fab`, `.scan-fab-spacer` ja koko `variant="floating"` poistettu (CSS, `CardScanner.tsx`, `CollectionView.tsx`). Skannaus on kaikilla leveyksillä otsikkorivin `.button-secondary.scan-open` "Skannaa". Tyhjässä tilassa on lisäksi `ScanPrompt` ensisijaisena. Testit: uudet kokeet `CardScanner.test.tsx` ja `CollectionView.test.tsx` (yksi painike otsikkorivillä, ei kelluvaa, tyhjän tilan kehotus). T-108-kortissa on muutosmerkintä.
- UX-118-14: alle 40 rem leveällä testikäsi ja painosvarmistus ovat koko näytön näkymiä (ei kehystä, `min-block-size: 100dvh`). Kortin tiedot oli jo sellainen (T-090). Dialogikerros vierii kokonaisuutena kuin sivu, eikä sisällä ole omia vieritysalueita. Pienet vahvistukset (pakan poisto, jonon tyhjennys, ensikirjautuminen) pysyvät keskitettyinä laatikkoina, koska ne mahtuvat näyttöön. Painosvarmistuksen kuva rajattu 40 dvh:iin. Kirjattu UX.md 3.6:een.

**Yhteiset luokat ja komponentit (`src/styles.css`, uudet `SegmentedChoice.tsx` ja `Chevron.tsx`)**
`.segmented` (React: `SegmentedChoice`, korvaa `.view-select .options`, `.deck-tabs`, `.editor-tabs`, `.segmented-options` ja `.scanner-mode`), `.button-danger`, `.button-compact`, `.step--compact` (Stepper käyttää aina), `.tile-action` pieneksi viistetyksi painikkeeksi, `.disclosure`, `.file-input`, yhtenäinen linkkityyli (`:where(a:not([class]))`, `.text-link`, `.link-button`), `.panel` (korvaa `.stats-card` ja vanhan kulmasulkupaneelin) ja `.empty`. Kuollut CSS poistettu: vanhat segmentti-, välilehti-, skanneritila-, kelluva-painike-, `.stat-odds`- ja `.stats-card`-säännöt, `.deck-empty`, `.collection-empty`, `.editor-proxy`, päällekkäiset `.view-select`-säännöt ja `has-move`-sarakkeet. Painikkeille asetettu eksplisiittinen `font-size` (juurisyy 14/16 px -vaihteluun: `font: inherit` peri pienemmän vanhemman koon).

**Löydöstaulukko**

| # | Tila | Miten |
|---|---|---|
| 01 | Korjattu | `.deck-row` ei enää `overflow: hidden`, valikon `z-index: 20`. Kuvakaappaus: valikko aukeaa seuraavan kortin päälle. |
| 02 | Korjattu | Syy: `.import-sources[hidden]` kumoutui `display: grid`:llä. Lomakkeita ei renderöidä jaetussa tilassa (`sharedText`). Testi tiukennettu (ei vain piilossa). |
| 03 | Korjattu | Yksi sarakejoukko kaikille riveille (`gem name count step move`), `.deck-tile-notes` omalle alueelleen. `has-move` poistettu. |
| 04 | Korjattu | `.col-deck` 11 rem, `nowrap` vain kun poimijan container on vähintään 26 rem. Mitattu 700–1920 px: ylitys 0 px. |
| 05 | Korjattu | Nimilappu umpinainen, 1.75 rem. Kokokortit (Legendit, sideboard, Kortit-näkymä) eivät näytä lappua, koska nimi on painettu korttiin. |
| 06 | Korjattu | Yksi `.segmented` kaikkialla. Suodattimen Kokoelma-ryhmä radiosta segmentiksi. Kaikki 44 px ulkomitta. |
| 07 | Korjattu | Kentät `block-size: 44 px`, `align-items: center`, `align-self: stretch` pois. Mitattu: kaikki haku-, url-, teksti- ja select-kentät 44 px. |
| 08 | Korjattu | Vain 44 px ja 32 px (`.step--compact`, `.tile-action` 32 px ja 6 px viiste). |
| 09 | Korjattu | PM:n päätös, ks. yllä. |
| 10 | Korjattu | Globaali linkkityyli. Kortin tiedot, julkinen pakka ja vaihtolinkki tarkistettu kuvista. |
| 11 | Korjattu | `.disclosure` viidessä paikassa (Näytä painokset, Muut tuotteet, Asetukset, puuttuvat kortit, jakajan kokoelma). "Erittely" on nyt "Näytä painokset" (en: "Show printings"). |
| 12 | Korjattu | `.button-danger` pakan poistossa, jonon tyhjennyksessä ja tilin poistossa. Testi tarkistaa luokan ja järjestyksen. |
| 13 | Korjattu | `.file-input`, natiivi kenttä piilossa, tiedoston nimi näkyy. Uusi testi. |
| 14 | Korjattu | PM:n päätös, ks. yllä. |
| 15 | Korjattu | `.card-collection` rivittyy ja välit `--space-3`. Linkki alleviivattu. |
| 16 | Korjattu | Taulukot, `.panel`, jakajan kokoelma `.disclosure`, "Avaa oma Have/Want". "ei yhtään" on "–" (ruudunlukijalle piilotettu teksti). Testit päivitetty rivipohjaisiksi. |
| 17 | Korjattu | Peruuta ensin kaikissa, "Peru" on "Peruuta", alle 40 rem pino täysleveänä, pääpainike ylhäällä. |
| 18 | Korjattu | Testikäsi käyttää `.dialog-close` ×. Skannerin virhetilan "Sulje" pysyy rivissä (kuten raportissa). |
| 19 | Korjattu | Pakat, Kokoelma, Julkiset ja Have/Want käyttävät `.empty`. Toisteinen lause pois. Painikkeet vasemmalle. Testit päivitetty otsikkopohjaisiksi. |
| 20 | Korjattu | Perussääntö h3: 16 px, 700, versaalit. Ylikirjoitukset poistettu. Kokoelman kortit `.panel-title`. |
| 21 | Korjattu | Vain 18 px ja `.button-compact` 16 px (Kopioi, Koko ruudulla). |
| 22 | Korjattu | "Harvinaisuus" sarakkeessa ja järjestyksessä. Testit päivitetty. |
| 23 | Korjattu | H2 hakurivin yläpuolelle, "Rivit" on "Lista", järjestys Kuvat \| Lista. Editorin testit rajattu `group`-nimellä, koska "Lista" on nyt myös pakkanäkymässä. |
| 24 | Korjattu | Pakkasarakkeessa aina siirto "→ SB". `onAddToSideboard` poistettu DeckLististä. |
| 25 | Korjattu | Kokoelman tiilet `repeat(auto-fill, minmax(10rem, 14rem))`, tekstit 14 px. |
| 26 | Korjattu | Segmenttikohtainen tekstiväri, kontrastit 4.88–16.2 : 1 (laskettu molemmissa teemoissa). |
| 27 | Korjattu | Version nimi näkyviin (`.card-art-label`) tuloslistan versioruuduissa. |
| 28 | Korjattu | Teksti `.hint`-tyylillä (neutraali vihje). |
| 29 | Korjattu | Have/Want: piilotettu label ja placeholder. UX.md 3.4 päivitetty. |
| 30 | Korjattu | "Tulosta puuttuvat proxyiksi" pakan alaosaan "Lähetä pakka proxy-jonoon" -painikkeen viereen. |
| 31 | Korjattu | `.option` 32 px. |
| 32 | Korjattu | `.proxy-card-remove` 28 px viistetty, `.pocket-count`, `.art-count-badge` (tokenit `--color-bg`, `--color-text`), `.nav-badge` ja `.pocket-beta` neliöiksi. |
| 33 | Korjattu | Keltaisen tyypin reuna tekstivärillä vaalealla teemalla. |
| 34 | Korjattu | Teksti lyhennetty "Kaikki proxy-jonoon" (en: "All to the proxy queue"), koska rivitys katkesi viivan kohdalta. |
| 35 | Korjattu | Sisennys pois, `.missing-link` on tavallinen `.link-button`. |
| 36 | Korjattu | Tuntematon julkinen pakka, jaettu pakka, vaihtolinkki ja kortti käyttävät `.notice-danger` ja `.text-link`. Uusi teksti "Korttia ei löytynyt." |
| 37 | Korjattu | "Siirry Kortit-osioon" ja "Siirry Pakat-osioon" (fi), "Go to Cards" ja "Go to Decks" (en). Myös "Kortit-sivulla" on "Kortit-osiossa". |
| 38 | Korjattu | Vaiheet `nowrap`, nuoli seuraavan vaiheen alussa, painikerivi vasemmalle. |
| 39 | Korjattu | Yksi `Chevron`-SVG (kansio, versionvaihto, proxy-sivutus, Tuo-valikko). |
| 40 | Korjattu | `line-height: var(--line-height-heading)` ja kynäpainikkeen negatiivinen marginaali. |
| 41 | Korjattu | Valitsin aina omalla rivillään otsikon alla. |
| 42 | Korjattu | 640–1024 px: logo ja työkalut ensimmäisellä rivillä, navigaatio toisella. 320 px: SUODATTIMET kapeampi ja 16 px, placeholder näkyy kokonaan. |
| 43 | Korjattu | ×N: kuvan päällä keltainen suorakulma (pinot ja kansio), listassa teksti. |

**Matkalla havaitut ja korjatut viat (ei raportissa)**
- `.segmented` venyi koko rivin levyiseksi pystysuuntaisessa säiliössä (Omat/Julkiset): `inline-size: fit-content`.
- `.link-button` (inline-flex) nieli nuolen ja tekstin välisen välilyönnin ("←Takaisin"): lisätty `gap`.
- Painikkeiden fonttikoko periytyi pienemmästä vanhemmasta (testikäsi, tilastot): eksplisiittinen `font-size`.
- `.group-odds select` oli 16 px: nyt 18 px ja 44 px.
- "Lisää proxy-jonoon" ja "Koko ruudulla" rivittyivät kahdelle riville kortin tiedoissa (mobiili): `.detail-proxy` koko leveydelle, nappiteksti "Koko ruudulla". Täysi nimi säilyy `aria-label`:ssa ("Näytä koko ruudulla").
- `.scan-prompt-icon`: keltainen ohut viiva vaalealla teemalla, nyt `--color-accent-edge`.
- Muutetut painiketekstit (päätökset, kirjattu tähän): "Koko ruudulla", "Kaikki proxy-jonoon", "Näytä painokset". Uudet tekstit fi ja en: tiedostokenttä, vaihtotaulukot, tyhjän julkisen listan otsikko ja "Korttia ei löytynyt."

**Tarkistukset**
- Kuvakaappaukset ajettu rakennetusta `vite preview`:stä (`scratchpad\run.mjs`, kaikki viisi ryhmää, 390 ja 1440, tumma ja vaalea). Kriittiset ja korkeat näkymät katsottu kuvista (pakat ja valikko, editori Lista/Pinot/Kortit/Lisää/tilastot, tuonti, jaettu pakka, vaihtolinkki, Have/Want, Proxy, Kokoelma, kortin tiedot, dialogit, tyhjät tilat) molemmilla leveyksillä ja molemmissa teemoissa. Loppujen kuvien mitat ja vieritys tarkistettiin skripteillä (`sweep.mjs`, `scrollscan.mjs`, mittaus `inv/*.json`:sta). Vaakavieritystä ei millään leveydellä (`sweep.mjs`: 320, 360, 600, 768, 900, 1024, 1280 ja 10 reittiä, ei tulosteita).
- `scrollscan.mjs`: sisäisiä vieritysalueita ei ole. Mobiilissa raportoituu vain koko näytön dialogikerros (kortin tiedot, testikäsi), joka on sivun kaltainen näkymä ja vierii kokonaisuutena (PM:n päätös). 1440 px: ei mitään.
- Rajaus: kirjautuneen tilin valikko, julkaisun vahvistuslomake ja julkisten pakkojen sisältö eivät ole nähtävissä esikatselubuildissa (ei kirjautumista, ks. raportin rajaukset). Ensikirjautumisen dialogi tarkistettiin samalla simulaatiolla kuin auditoinnissa.

**Koodikatselmointi:** tehty · Pakollisia korjattu 3 (puuttuva CSS-kirjoitus ensimmäisessä komentosarjassa, venyvä segmentti, link-buttonin välilyönti) · Suosituksia 2 (velaksi: käyttämättömät vanhat luokat `card-row-meta`, `color-bar*`, `legend-slot-*`, `stat-summary`, `version-thumb*` voi poistaa erillisellä siivouksella. Kirjautuneen tilan näkymät on katsottava oikealla tilillä).

**Testit ja tarkistukset:** `npm test` 116 tiedostoa ja 1550 testiä läpi (1544 ennen, 6 uutta), `npm run lint` ja `npm run build` läpi.
