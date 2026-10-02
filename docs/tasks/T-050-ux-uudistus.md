# T-050 · UX-uudistus: koko leveyden asettelu ja pakkaeditori
**Tila:** Ready (määrittely) · **Omistaja:** UX Designer → Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must
**Malli:** D-014. Ei uusia riippuvuuksia eikä tietomallin muutosta. Ei uutta tallennettavaa asetusta (kuvakoko ei tallennu, ks. IDEAS-ehdotus lopussa).
**Haara:** `t-050-ux-uudistus` (vaiheittain: T-050a, T-050b ja T-050c omina committeinaan tai omina PR:inään)

## Käyttäjän palaute (2026-10-03, 2850 px näyttö)
1. "Miksi sivun leveydestä käytetään näin naurettavan vähän tilaa?" Kortit-sivu on 56rem:n sarakkeessa. Reunoille saa jäädä kapeat tyylikkäät kaistat.
2. Pakanrakennus ei ole tyylikäs, ja oleellinen tieto on vaikea nähdä. Kuvien pitää olla isompia ja tekstiversion selkeämpi. Kaksisarakkeinen hakutulos ei toimi, vaan halutaan yksi kortti per rivi.
3. Tavoite on UX 5/5 sekä ulkoasussa että toiminnoissa.

## Lähteet ja löydetyt käytännöt (tutkimus 2026-10-03)
| Palvelu | Käytäntö, jonka otamme |
|---|---|
| Archidekt ([ominaisuudet](https://edhrec.com/guides/how-to-use-archidekt-the-mtg-deckbuilding-site), [static card view](https://archidekt.com/news/20605672), [stacks](https://archidekt.com/news/3346825)) | Näkymät Stacks, Text, Grid ja Table. Kuvakoko Small, Medium tai Large. "Disable margins" isoille näytöille. Kiinteä esikatselu pakan oikealla puolella päivittyy hoverilla. |
| Moxfield ([wiki](https://github.com/moxfield/moxfield-public/wiki/Features), [Stacks](https://x.com/moxfieldmtg/status/1351687064736198657)) | Teksti- ja kuvanäkymä, ryhmittely tyypin, värin tai hinnan mukaan, kustannuskäyrä ja tyyppijakauma, laillisuus aina näkyvissä. Pikanäppäimet (Alt+1 lisää, Alt+2 poistaa, `/` hakuun). |
| Ripperdeck.gg (Cyberpunk TCG, [etusivu](https://ripperdeck.gg/)) | Reaaliaikainen laillisuus, Eddie-käyrä, RAM-budjetti ja tyyppijakauma rakentamisen aikana. Pikasuodattimet: tyyppi, väri ja hintahaarukka. |
| CyberDecks.app (Cyberpunk TCG) | RAM-rajat ja värisäännöt valvotaan automaattisesti. |
| Netdeck.gg (virallinen Cyberpunk-korttitietokanta) | Täysleveä kuvaruudukko ja suodattimet sivupaneelissa. |
| Dreamborn.ink (Lorcana) | Ruudukko, suodattimet ja määrän valinta (1–4) suoraan kortista. Käyrä pakan yhteydessä. |
| Hearthstone-pakanrakentaja (virallinen) | Napsautus lisää ja oikea napsautus poistaa. Pakkarivi on "laatta": hintajalokivi, nimi ja kortin kuvan rajattu kaistale taustalla. Määrä on näkyvissä, ja täysi pakka näkyy laskurissa. |
| SnapComplete / Untapped (Marvel Snap) | Kortit, joita ei omisteta, näytetään himmennettyinä eikä niitä piiloteta. Pikasuodatin hinnalle 1–6+. Toimii puhelimessa. |

**Yhteenveto käytännöistä:**
- Leveys käytetään sisältöön. Kapeaksi rajataan vain luettava teksti (lomakkeet ja ilmoitukset).
- Suodattimet ovat leveällä näytöllä sivupaneelissa ja kapealla avattavina.
- Poimijassa on kaksi näkymää: rivinäkymä, jossa on pieni kuva ja tasatut sarakkeet, sekä kuvanäkymä, jossa kuvakoko on valittavissa.
- Pakkalista on tiivis laatta (hinta, nimi, määrä ja kuvakaistale), ryhmitelty tyypeittäin. Isompi kuva tulee hoverilla.
- Napsautus lisää, ja oikea napsautus tai Shift+napsautus poistaa.
- Laillisuus ja laskurit ovat aina näkyvissä (sticky). Tilastoina näytetään käyrä, väri- ja tyyppijakauma.
- Mobiilissa on alapalkki "Pakka 38/50", josta pääsee pakkaan.

---

## Yhteiset periaatteet (kaikki vaiheet)

### Sivun leveyssääntö
- Uudet tokenit `:root`:iin:
  - `--page-max-width: 160rem` (2560 px). 2850 px näytöllä reunoille jää noin 145 px kaistat ja lisäksi sisennys.
  - `--gutter: clamp(1rem, 2vw, 3rem)`. Korvaa nykyisen 1rem/1.5rem-portaan (`@media (min-width: 40rem)` -kohta riveillä noin 183–186).
  - `--prose-max-width: 44rem` luettavalle tekstille.
- `.container` käyttää kaikissa näkymissä arvoa `max-width: var(--page-max-width)`. `--content-max-width` ja `--editor-max-width`, `.container-wide` ja App.tsx:n `wide`-haara poistetaan (tai `wide` jää ilman vaikutusta, ja testit päivitetään).
- Kapeaksi jäävät `.prose`-luokalla (`max-width: var(--prose-max-width)`): ilmoitukset (`.notice`), tyhjän tilan tekstit, pakan nimen kenttä, tuonti ja vienti sekä StorageReminder. Header ja footer seuraavat samaa `.container`-leveyttä, joten logo ja navigaatio ovat linjassa sisällön kanssa.
- Kaistat: `body`-tausta pysyy nykyisenä, ja `.container`-alueen reunoille ei tule kehystä. Kaistat ovat siis vain tyhjää taustaa. Visuaalinen tyyli ei muutu.

### Breakpointit (rem, ei px)
| Nimi | Ehto | Käyttö |
|---|---|---|
| S | < 40rem | Yksi sarake, suodattimet avattavina, mobiilin alapalkki editorissa |
| M | ≥ 40rem | Leveämpi sisennys, ruudukko 2–3 saraketta |
| L | ≥ 64rem | Suodattimet sivupaneeliin (Kortit), editorissa kaksi saraketta (poimija ja pakka) |
| XL | ≥ 100rem | Editorissa kolme saraketta (suodattimet, poimija ja pakka) |

Sticky-sarakkeet vain, kun `@media (min-height: 40rem)`. Matalalla ikkunalla tai 400 % zoomilla mikään ei jää jumiin (WCAG 1.4.10).

### Saavutettavuus (WCAG 2.2 AA), koskee kaikkia vaiheita
- **DOM-järjestys = visuaalinen järjestys = fokusjärjestys:** otsikko → suodattimet → tulokset → pakka. CSS `order` -ominaisuutta ei käytetä sisällön uudelleenjärjestämiseen.
- **Maamerkit:** `main` säilyy. Suodatinpaneeli on `<section aria-labelledby="filters-heading">`, jossa on näkyvä `h2` "Suodattimet". Kortit-sivulla tulosalue on `<section aria-labelledby="results-heading">`, jossa on visually-hidden `h2` "Tulokset".
- **Kohteiden koko:** vähintään 24×24 px (2.5.8), ensisijaiset toiminnot 44 px (`--target-min`).
- **Fokus ei peity (2.4.11):** sticky-elementit (mobiilin alapalkki ja pakkasarakkeen otsake) eivät peitä fokusoitua elementtiä. Käytetään `scroll-padding-bottom: calc(alapalkin korkeus + 1rem)` `html`:ssä, kun alapalkki on näkyvissä.
- **Hover-sisältö (1.4.13):** esikatselu suljetaan Escillä, se ei peitä laukaisijaa, ja se pysyy näkyvissä, kun hiiri on laukaisijan päällä. Se on `aria-hidden="true"`, koska sama tieto on rivillä tekstinä ja kuvadialogissa.
- **Liike:** kaikki uudet siirtymät (esikatselun häivytys, pinon nosto ja alapalkki) ovat vain `@media (prefers-reduced-motion: no-preference)` -lohkossa.
- **Kontrasti:** uudet merkit (määrä, hinta ja puuttuu) vähintään 4.5:1 tekstinä ja 3:1 ei-tekstinä molemmissa teemoissa. Tieto ei ole koskaan pelkän värin varassa.
- **Forced colors:** väriraidat ja pylväät näkyvät (`forced-color-adjust` tai reunaviiva), kuten nykyisessä `@media (forced-colors: active)` -lohkossa.

---

## T-050a · Asettelu ja Kortit-sivu (noin 120–150 riviä, CSS-painotteinen)

### Rautalanka L ≥ 64rem (Kortit)
```
| kaista |  Kortit                                     151 korttia · Kokoelmassa 87/151           | kaista |
|        | ┌ Suodattimet ──────┐ ┌ [Ruudukko|Taulukko]  [Kuvakoko: Pieni|Keski|Iso]  [Muokkaa] ┐ |        |
|        | │ Hae [________]    │ │ Aktiiviset: [Red ×] [Unit ×]  Tyhjennä suodattimet          │ |        |
|        | │ Kokoelma ( )( )() │ │ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐      │ |        |
|        | │ Tyyppi  □□□□      │ │ │kuva││kuva││kuva││    ││    ││    ││    ││    ││    │      │ |        |
|        | │ Väri    □□□□      │ │ │nimi││    ││    ││    ││    ││    ││    ││    ││    │      │ |        |
|        | │ Harvin. □□□□      │ │ └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘      │ |        |
|        | └ sticky, 17rem ────┘ └ ruudukko auto-fill ─────────────────────────────────────────┘ |        |
```

### Rautalanka S < 64rem (Kortit)
```
Kortit
151 korttia
Hae [______________]
[Suodattimet (2) ▾]        <- button aria-expanded, avaa paneelin hakukentän alle
Aktiiviset: [Red ×] [Unit ×] Tyhjennä suodattimet
[Ruudukko|Taulukko] [Kuvakoko ▾]
┌─────┐┌─────┐
│kuva ││kuva │   (2 saraketta ≥ 22rem, 1 sarake 320 px)
└─────┘└─────┘
```

### Hyväksymiskriteerit (T-050a)
1. **Leveys:** kaikki näkymät (Kortit, Pakat, editori, header ja footer) käyttävät `--page-max-width: 160rem` -arvoa ja `--gutter: clamp(1rem, 2vw, 3rem)` -sisennystä. 2850 px:n ikkunassa sisältö on 2560 px leveä ja keskitetty. Luettava teksti on `.prose`-rajattu (44rem).
2. **Kortit, L ≥ 64rem:** `.catalog-layout { display: grid; grid-template-columns: 17rem minmax(0, 1fr); gap: var(--space-6); }`. Vasemmalla on `CardFilters` sivupaneelina (`position: sticky; top: var(--space-4); max-height: calc(100vh - 2rem); overflow: auto;` vain kun `min-height: 40rem`). Paneelin fieldsetit ovat pystysuunnassa, ja vaihtoehdot rivittyvät. Oikealla ovat työkalurivi (`ListToolbar`), aktiivisten suodattimien sirut ja tulokset.
3. **Ruudukko ja kuvakoko:** `.card-grid` saa CSS-muuttujan `--card-min`. Kuvakoko-valitsin (radioryhmä, legend "Kuvakoko") arvoilla **Pieni** 11rem, **Keski** 14rem (oletus) ja **Iso** 18rem: `grid-template-columns: repeat(auto-fill, minmax(min(var(--card-min), 100%), 1fr))`. 2560 px:n sisältöalueella Keski tuottaa noin 9 saraketta. Valinta ei tallennu (istunnon tila). Valitsin näkyy vain Ruudukko-näkymässä.
4. **Taulukko:** `CardTable` on enintään `max-width: 100rem` tulosalueella (vasemmalle tasattu), jotta 7 saraketta eivät veny 2400 px leveiksi. Pikkukuvan koko pysyy ennallaan.
5. **Suodattimet, S < 64rem:** hakukenttä on aina näkyvissä. Muut fieldsetit (Kokoelma, Tyyppi, Väri ja Harvinaisuus) ovat paneelissa, joka avataan napilla **"Suodattimet"**. Kun suodattimia on valittuna, nappi on muotoa **"Suodattimet (2)"** (valittujen määrä, ei Kokoelma="Kaikki"). Nappi: `aria-expanded`, `aria-controls="filter-panel"`. Oletuksena suljettu. Avaaminen ei siirrä fokusta. L-koossa nappi piilotetaan ja paneeli on aina auki (`hidden` vain alle 64rem, toteutus `matchMedia('(min-width: 64rem)')` -hookilla, ei pelkällä CSS:llä, jotta `aria-expanded` pitää paikkansa).
6. **Aktiiviset suodattimet -sirut:** tulosten yläpuolella on rivi, joka näkyy vain, kun suodattimia on. Jokainen valinta on nappi, esim. **"Red ×"**, jonka saavutettava nimi on **"Poista suodatin: Red"**. Lopussa on tekstinappi **"Tyhjennä suodattimet"** (olemassa oleva `texts.clearFilters`). Sirun poisto palauttaa fokuksen seuraavaan siruun, tai jos siruja ei ole jäljellä, hakukenttään. Tulosmäärä ilmoitetaan nykyisellä viivästetyllä ilmoituksella.
7. **Otsikot:** h1 "Kortit" → h2 "Suodattimet" (näkyvä paneelissa) → h2 "Tulokset" (visually-hidden) → korttien h3 (nykyinen). Pakat-sivu (DecksView) käyttää samaa leveyttä, ja sen ruudukko pysyy `minmax(20rem, 1fr)`.
8. **Ei vaakavieritystä** 320 px:ssä eikä 400 % zoomilla 1280 px:ssä. Taulukon oma vieritysalue (`table-scroll`) on sallittu.
9. Testit: `CardFilters`-napin `aria-expanded` ja laskuri, sirujen poisto ja fokus (jsdomissa `matchMedia` mockataan kapeaksi ja leveäksi). `npm test`, lint ja build läpi. CHANGELOG.
10. Kuvakaappaukset (scratchpad): 375×800, 1280×900, 1920×1080 ja 2850×1400, Kortit ja Pakat.

---

## T-050b · Pakkaeditorin poimija (noin 150 riviä)

### Rautalanka XL ≥ 100rem
```
| ← Pakat   Arasaka Control                         [Nimi ____] [Vie ▾]     Tallennettu |
| ┌Suodattimet┐ ┌ Lisää kortteja ─────────────────────────────┐ ┌ Pakka (sticky) ─────────┐ |
| │Hae [____] │ │ 151/151 korttia  [Rivit|Kuvat] [Pieni|Keski|Iso]│ │ (T-050c)                 │ |
| │Tyyppi     │ │ Napsauta lisää · oikea napsautus poistaa      │ │                          │ |
| │Väri       │ │ ┌──┬──┬──────────────────┬──────┬──┬──┬────┬───────┐│ │                          │ |
| │Hinta 0..6+│ │ │▣ │④ │Adam Smasher      │Unit ●│ 6│ 1│Rare│−  2 +│ │ │                          │ |
| │Harvin.    │ │ │  │  │Ender of Legends  │Red   │  │  │    │       │ │ │                          │ |
| │           │ │ ├──┼──┼──────────────────┼──────┼──┼──┼────┼───────┤ │ │                          │ |
| └17rem──────┘ └ yksi kortti per rivi, koko leveys ───────────────┘ └ clamp(24rem,22vw,30rem) ┘ |
```
- L (64–100rem): kaksi saraketta (poimija | pakka). Suodattimet ovat poimijan yläosassa avattavina kuten T-050a:n kohdassa 5 (sama komponentti ja sama logiikka, raja 100rem editorissa).
- S (< 64rem): yksi sarake ja T-050c:n alapalkki.

### Rivinäkymä "Rivit" (korvaa nykyisen kaksisarakkeisen "Lista"-näkymän)
- **Semantiikka:** `<table>`, jonka caption on visually-hidden **"Hakutulokset"**. Sarakkeet (näkyvät `th scope="col"`):
  | Sarake | Sisältö | Leveys |
  |---|---|---|
  | (Kuva, visually-hidden otsikko) | Pikkukuva 3rem × 4.2rem (`object-fit: cover`), nappi avaa kuvadialogin (olemassa oleva `CardImageDialog`, nimi "Suurenna kuva: {nimi}") | 3.5rem |
  | Cost | Jalokivi: ympyrä 1.75rem, numero keskellä, kortin värin reuna. Legend tai hinnaton: "–". | 3rem |
  | Nimi (`th scope="row"`) | Nimi lihavoituna, alaotsikko himmeämpänä omalla rivillä (`CardName`) | minmax(12rem, 1fr) |
  | Tyyppi | Tyyppimerkki ja värinimi (nykyinen `typeBadgeClass`) | 8rem |
  | Power | numero tai "–" | 4rem, oikealle |
  | RAM | numero tai "–" | 4rem, oikealle |
  | Harvinaisuus | teksti | 7rem |
  | Pakassa | `Stepper` (− n +), 32 px napit, määrä näkyvissä. Jos estetty, alla pieni teksti (nykyinen `dimmedHint`-teksti lyhennettynä merkiksi, koko teksti `aria-describedby`). | 8.5rem |
- **Rivin korkeus** noin 4.75rem (pikkukuva määrää). Vuororivit `--color-surface-2`-tyylillä. Hover korostaa rivin taustaa.
- **Pakassa oleva kortti:** rivillä on vasemmassa reunassa 3px korostusraita, ja määrä on lihavoitu (ei pelkkä väri, sillä määrä näkyy numerona).
- **Estetty kortti** (`addBlocker`): rivi himmennetään (opacity 0.6 vain kuvalle ja nimelle, ei napeille eikä tekstille kontrastin vuoksi), ja merkki **"Raja täynnä"** tai **"Sama Legend"** näkyy Pakassa-solussa.
- Alle 48rem: sarakkeet Tyyppi, Power, RAM ja Harvinaisuus piilotetaan, ja niiden arvot näytetään nimen alla metarivinä "Unit · Red · Cost 4 · Power 6 · RAM 1 · Rare" (`cardMeta`, lyhenne pysyy englanninkielisenä pelitermeinä). Rivi pysyy yhtenä korttina per rivi.

### Kuvanäkymä "Kuvat"
- Kuvakoko-valitsin **Pieni** 9rem, **Keski** 13rem (oletus) ja **Iso** 17rem. Sama komponentti kuin T-050a:n kohdassa 3, sama `--card-min`-muuttuja `.pick-images`-ruudukossa. Kuvat `md` (360 px) ja `srcset` `lg` (720 px) 2x-näytöille.
- Kortin alla on yksi rivi: nimi (ellipsoitu, `title` = koko nimi) ja kompakti `Stepper`. Määrämerkki **"2 pakassa"** jää kuvan oikeaan yläkulmaan (nykyinen `pick-badge`).

### Lisäämisen vuorovaikutus
1. **Napsautus kuvaan** (Kuvat) lisää yhden kopion (nykyinen). **Rivit:** napsautus rivin tyhjään kohtaan (ei nappeihin) lisää yhden kopion vain `@media (pointer: fine)` -laitteilla. Kosketuksessa lisätään vain +-napilla, ettei vieritys lisää kortteja vahingossa.
2. **Oikea napsautus tai Shift+napsautus** kortin kuvaan tai riviin poistaa yhden kopion. `contextmenu`-oletus estetään vain, jos kortti on pakassa. Muuten selaimen valikko näkyy normaalisti.
3. **Näppäimistö:** kun fokus on rivin tai kortin sisällä (`onKeyDown` rivielementillä), `+` tai `=` lisää ja `-` poistaa. Merkkioikopolut ovat aktiivisia vain fokusoidussa komponentissa (WCAG 2.1.4 -poikkeus). Napeille `aria-keyshortcuts="+"` ja `"-"`. Globaaleja yksimerkkisiä oikopolkuja ei lisätä.
4. **Ohjeteksti** näkymävalitsimen alla, vain `pointer: fine`: **"Napsauta korttia lisätäksesi. Oikea napsautus tai Shift+napsautus poistaa. Näppäimistöllä + ja −."**
5. **Ilmoitus ruudunlukijalle:** yksi `aria-live="polite"`-alue (visually-hidden) ilmoittaa muutoksen: **"{nimi}: {n} pakassa. Pääpakka {m} korttia."** Legendillä viimeinen osa on **"Legendejä {l}/3."** Debounce 400 ms, jolloin nopeasta toistosta ilmoitetaan vain viimeinen. Nykyinen `save-status` jätetään `role="status"`:ksi, mutta "Tallennetaan…" ei enää ilmoita (näytetään, ei live). Vain "Tallennettu" ja virhe ilmoitetaan, jotta ilmoitukset eivät tule päällekkäin.

### Hover-esikatselu (molemmat poimijanäkymät ja pakkalista)
- Uusi komponentti `CardHoverPreview.tsx`: yksi jaettu, `position: fixed` -kuva, leveys 18rem (`lg`-kuva). Näkyy, kun hiiri (`pointerType === 'mouse'`) on rivin tai pakkalaatan päällä 250 ms. Sijoitetaan laukaisijan viereen sille puolelle, jossa on tilaa (oikealle, muuten vasemmalle) ja pystysuunnassa ikkunan sisään. Ei peitä laukaisijaa.
- Häviää, kun hiiri poistuu, vieritettäessä, `Esc`:llä tai kun kuvadialogi avautuu. `aria-hidden="true"`, `pointer-events: none`. Ei näy kosketuslaitteilla (`hover: hover` ja `pointer: fine`). Kuvanäkymässä Pieni-koolla esikatselu näkyy, Keski- ja Iso-koolla ei.
- Fokuskäyttäjä avaa saman kuvan nimellä tai pikkukuvalla (kuvadialogi), joten fokus ei avaa esikatselua.

### Hyväksymiskriteerit (T-050b)
1. XL-, L- ja S-asettelut toimivat yllä kuvatusti. Poimija käyttää koko jäljelle jäävän leveyden. Kaksisarakkeinen `.search-results`-ruudukko (`minmax(22rem, 1fr)`) poistuu.
2. Rivit-näkymä on taulukko, jossa on yksi kortti per rivi, tasatut sarakkeet, pikkukuva, hintajalokivi ja Stepper. Alle 48rem metarivi on nimen alla. Näkymävalitsimen tekstit ovat **"Rivit"** ja **"Kuvat"** (`deckTexts.pickViewList` muuttuu "Rivit"-tekstiksi, ja tallennettu arvo `'list'` säilyy).
3. Kuvat-näkymässä on kuvakoko Pieni/Keski/Iso (9/13/17rem, oletus Keski).
4. Napsautus, oikea napsautus, Shift+napsautus sekä näppäimet + ja − toimivat kuvatusti. Testit: `fireEvent.contextMenu`, `click` + `shiftKey` ja `keyDown` `+`/`-` muuttavat määrää. Contextmenu ei estä oletusta, kun määrä on 0.
5. Live-ilmoitus "{nimi}: {n} pakassa. Pääpakka {m} korttia." debouncella. Testi fake-ajastimilla.
6. Hover-esikatselu: näkyy 250 ms:n jälkeen hiirellä, häviää Escillä ja poistuttaessa, `aria-hidden`. Testi: `pointerEnter` + ajastin → kuva DOMissa, `keyDown Escape` → poissa.
7. Kaikki uudet tekstit ovat `deckTexts.ts`:ssä. Olemassa olevat testit päivitetään vain rakenteen osalta, logiikkatestejä ei heikennetä. `npm test`, lint ja build läpi. CHANGELOG.
8. Kuvakaappaukset: 375×800, 1280×900, 1920×1080 ja 2850×1400, sekä Rivit että Kuvat, pakassa noin 15 korttia.

---

## T-050c · Pakkasarake, tilastot ja mobiili (noin 150 riviä)

### Rautalanka, pakkasarake (sticky, oma vieritys)
```
┌ Pakka ───────────────────────────────┐
│ Pääpakka 38/40–50  ███████████░  │  <- sticky-otsake sarakkeen sisällä
│ Legendit 3/3 · ✓ Laillinen            │     (tai "⚠ 2 ongelmaa" -linkki listaan)
├───────────────────────────────────────┤
│ LEGENDIT (3/3)                        │
│ ┌────┐┌────┐┌────┐                    │  <- 3 kuvaruutua, tyhjä paikka katkoviivalla:
│ │kuva││kuva││ +  │                    │     "Legend-paikka vapaana"
│ └────┘└────┘└────┘                    │
│ UNIT (22)                       [Lista|Pinot]
│ ④ Adam Smasher        ░░kuva░░ ×3 −+  │  <- laatta: jalokivi, nimi, kuvakaistale, määrä
│ ② 6th Street Recruits ░░kuva░░ ×2 −+  │
│   puuttuu 1                           │
│ GEAR (8) …                            │
├ Tilastot ─────────────────────────────┤
│ Kustannuskäyrä (nykyinen CostCurve)   │
│ Värit:  Red ████████ 24 (63 %)        │
│         Blue ███ 8 (21 %)             │
│ Tyypit: Unit 22 · Gear 8 · Program 8  │
│ RAM-rajat: Red 4 · Blue 2             │
│ Puuttuu kokoelmasta: 3                │
└───────────────────────────────────────┘
```

### Sisältö ja säännöt
1. **Sticky-otsake** pakkasarakkeen yläosassa (`position: sticky; top: 0` sarakkeen omassa vierityksessä):
   - Edistymispalkki `<progress>`-elementtinä tai `role="meter"` -elementtinä, jonka saavutettava nimi on **"Pääpakka {m}/40–50"**. Palkin väri: alle 40 neutraali, 40–50 onnistumisväri, yli 50 vaaraväri. Teksti näkyy aina palkin vieressä.
   - Laillisuusmerkki: **"✓ Laillinen"** (`deckTexts.allGood`-vastine lyhyenä: **"Laillinen"**) tai **"⚠ {n} ongelmaa"** / **"⚠ 1 ongelma"**. Ongelmamerkki on nappi, joka vierittää ongelmalistaan ja siirtää fokuksen sen otsikkoon (h3 **"Ongelmat"**, `tabIndex={-1}`). Nykyinen `aria-live`-ongelmalista säilyy otsakkeen alla.
2. **Legendit kuvaruutuina:** kolme paikkaa vierekkäin (kukin noin 1/3 sarakkeesta, kuvasuhde kuten kortissa). Kuva on nappi (avaa kuvadialogin, nimi "Suurenna kuva: {nimi}"), ja sen alla on poistonappi **"Poista {nimi}"** (24 px, ikoni ×). Tyhjä paikka: katkoviivakehys ja teksti **"Legend-paikka vapaana"** (ei interaktiivinen).
3. **Pääpakan laatta (näkymä "Lista", oletus):** korkeus 2.75rem. Grid: `2rem minmax(0,1fr) auto auto`.
   - Jalokivi (hinta) vasemmalla, kortin värin raita sen alla (nykyinen väriraita säilyy).
   - Nimi (alaotsikko himmeä ja ellipsoitu). Nimi on nappi, joka avaa kuvadialogin (nykyinen).
   - Taustalla oikealla kortin kuvan kaistale: `background-image` (`md`-kuva), `background-position: center 25%`, `background-size: 9rem auto`, maski `linear-gradient(to right, transparent, #000 40%)`, leveys 9rem. Kaistale on koriste (CSS-tausta, ei img-elementti), ja tekstin kontrasti varmistetaan pinnan värisellä gradientilla tekstin alla.
   - `×3` lihavoituna ja `Stepper` (−/+, 28 px). "puuttuu N" -merkki säilyy (teksti, ei pelkkä väri).
   - Hover-esikatselu (T-050b) toimii laatoilla.
4. **Näkymä "Pinot"** (valitsin ryhmäotsikon rivillä, radio "Pakkanäkymä": **Lista** | **Pinot**, istunnon tila): jokainen tyyppiryhmä on sarake, jossa on päällekkäiset kortit (kukin näyttää ylimmät 2.25rem, eli nimipalkin). Hover tai fokus nostaa kortin kokonaan näkyviin (`transform` vain no-preference-tilassa, muuten pelkkä z-index). Jokainen kortti on nappi "Suurenna kuva: {nimi}, {n} pakassa". Määrä näkyy kuvan päällä merkkinä "×3". Pinot-näkymässä ei ole Stepperiä, sillä muokkaus tehdään Lista-näkymässä tai poimijassa (oikea napsautus toimii myös pinossa).
5. **Tilastot** (`<section aria-labelledby="stats-heading">`, h3 **"Tilastot"**):
   - Kustannuskäyrä: nykyinen `CostCurve`.
   - **Värit:** vaakapylväs per väri, jossa näkyvät nimi, määrä ja prosentti. Pylväs on koriste (`aria-hidden`), ja teksti kertoo kaiken. Puhdas funktio `colorDistribution(content, cardsByKey)` → `[{ color, count }]` (`deckRules.ts`), testi.
   - **Tyypit:** rivi "Unit 22 · Gear 8 · Program 8" (ryhmistä laskettuna, ei uutta logiikkaa).
   - RAM-rajat ja "Puuttuu kokoelmasta" siirtyvät tänne nykyisestä `summary-counts`-lohkosta.
6. **Mobiili S < 64rem:** alhaalla on kiinteä palkki `position: sticky; bottom: 0` (koko leveys, korkeus 3.5rem, `role` ei tarvita), jossa on teksti **"Pakka {m}/40–50 · Legendit {l}/3"**, laillisuusmerkki ja nappi **"Näytä pakka"**. Nappi vierittää pakkaosioon ja siirtää fokuksen sen otsikkoon. Pakkaosion alussa on linkkinappi **"Takaisin hakuun"**, joka siirtää fokuksen hakukenttään. Palkki piilotetaan, kun pakkaosio on näkyvissä (IntersectionObserver). `scroll-padding-bottom` estää palkkia peittämästä fokusta (2.4.11).

### Hyväksymiskriteerit (T-050c)
1. Sticky-otsake: `<progress>` tai meter, jossa on saavutettava nimi, ja laillisuusnappi, joka vie fokuksen "Ongelmat"-otsikkoon. Testi.
2. Legendit kolmena kuvaruutuna. Tyhjät paikat näkyvät, ja poistonappi toimii. Testi.
3. Pääpakan laatta: jalokivi, nimi, kuvakaistale, ×N, Stepper ja puuttuu-merkki. Kontrasti 4.5:1 tarkistetaan molemmissa teemoissa (axe ja manuaalinen).
4. Lista/Pinot-valitsin. Pinoissa hover ja fokus nostavat kortin, ja reduced motion ilman siirtymää.
5. `colorDistribution` + testi. Väri- ja tyyppijakauma ja RAM-rajat Tilastot-osiossa.
6. Mobiilin alapalkki: näkyy alle 64rem, piilossa kun pakka on näkyvissä, ja fokus siirtyy oikein. Ei vaakavieritystä 320 px:ssä.
7. Tekstit `deckTexts.ts`:ssä. Testit, lint ja build läpi. CHANGELOG.
8. Kuvakaappaukset kuten T-050b:ssä, lisäksi Pinot ja mobiilin alapalkki.

---

## Uudet tekstit (tarkat)
| Avain (ehdotus) | Teksti |
|---|---|
| `texts.filtersHeading` | Suodattimet |
| `texts.filtersToggle(n)` | Suodattimet / Suodattimet ({n}) |
| `texts.resultsHeading` | Tulokset |
| `texts.removeFilter(v)` | Poista suodatin: {v} |
| `texts.imageSizeLegend` | Kuvakoko |
| `texts.imageSizeSmall` / `Medium` / `Large` | Pieni / Keski / Iso |
| `deckTexts.pickViewList` | Rivit |
| `deckTexts.pickHint` | Napsauta korttia lisätäksesi. Oikea napsautus tai Shift+napsautus poistaa. Näppäimistöllä + ja −. |
| `deckTexts.resultsCaption` | Hakutulokset |
| `deckTexts.colCost` / `colName` / `colType` / `colPower` / `colRam` / `colRarity` / `colInDeck` | Cost / Nimi / Tyyppi / Power / RAM / Harvinaisuus / Pakassa (pelitermit englanniksi kuten `texts.columnCost`, `columnPower`; käytä olemassa olevia avaimia) |
| `deckTexts.blockedLimit` / `blockedLegend` | Raja täynnä / Sama Legend |
| `deckTexts.changeAnnounce(name, n, m)` | {nimi}: {n} pakassa. Pääpakka {m} korttia. |
| `deckTexts.changeAnnounceLegend(name, n, l)` | {nimi}: {n} pakassa. Legendejä {l}/3. |
| `deckTexts.mainProgress(m)` | Pääpakka {m}/40–50 |
| `deckTexts.legalShort` | Laillinen |
| `deckTexts.issuesCount(n)` | 1 ongelma / {n} ongelmaa |
| `deckTexts.issuesHeading` | Ongelmat (näkyväksi) |
| `deckTexts.legendSlotEmpty` | Legend-paikka vapaana |
| `deckTexts.deckViewLegend` / `deckViewList` / `deckViewStacks` | Pakkanäkymä / Lista / Pinot |
| `deckTexts.statsHeading` | Tilastot |
| `deckTexts.colorsLabel` / `typesLabel` | Värit / Tyypit |
| `deckTexts.colorShare(color, n, pct)` | {väri} {n} ({pct} %) |
| `deckTexts.mobileBar(m, l)` | Pakka {m}/40–50 · Legendit {l}/3 |
| `deckTexts.showDeck` / `backToSearch` | Näytä pakka / Takaisin hakuun |

## Rajaukset ja riskit
- Ei uusia riippuvuuksia: esikatselu, pinot ja palkki tehdään CSS:llä ja pienillä hookeilla (`useMediaQuery`).
- Ei uutta tallennettavaa asetusta. Kuvakoko ja pakkanäkymä ovat istunnon tilaa. Tallentaminen kirjataan IDEAS.md:hen (vaatisi preferences-repon laajennuksen ja kevyen Digiturva-katselmoinnin).
- Raahaa ja pudota (Moxfield, Archidekt) sekä kortin tekstin haku jätetään pois. Korttidatassa ei ole sääntötekstiä.
- DeckEditor.tsx on 644 riviä. T-050b/c saa siirtää osia omiin komponentteihin (`DeckPickTable.tsx`, `DeckList.tsx`, `DeckStats.tsx`, `CardHoverPreview.tsx`) ilman logiikan muutoksia.
- UX-katselmointi (axe ja manuaalinen: näppäimistö, 200/400 % zoom, kontrastit) kun T-050c on valmis, uuden ison näkymän sääntö (D-014).

## Luovutukset

### Luovutus (UX Designer, 2026-10-03)
Tutkimus (Archidekt, Moxfield, Ripperdeck, CyberDecks, Netdeck, Dreamborn, Hearthstone, Marvel Snap -työkalut) ja toteutettava määrittely kolmessa vaiheessa: T-050a asettelu ja Kortit-sivu, T-050b poimija (rivit taulukkona, kuvakoko, napsautus/oikea napsautus/näppäimet, hover-esikatselu, live-ilmoitus), T-050c pakkasarake (sticky laillisuus ja edistymispalkki, Legend-kuvaruudut, laatat kuvakaistaleella, Pinot, tilastot, mobiilin alapalkki). Seuraavaksi Koodari aloittaa T-050a:sta.

### Luovutus (Koodari, T-050a, 2026-10-03)
Toteutettu: `--page-max-width: 160rem`, `--gutter: clamp(1rem, 2vw, 3rem)` ja `--prose-max-width: 44rem` (`.prose`, `.notice`, `.empty`, `.storage-reminder`). `.container-wide` ja App.tsx:n `wide` poistettu. Kortit: `.page-head` (h1 vasemmalla, tilarivit oikealla), `.catalog-layout` (17rem sticky-sivupaneeli ≥ 64rem ja `min-height: 40rem`), section-maamerkit "Suodattimet" ja "Tulokset", `CardFilters`-propsi `collapsibleBelow` (`useMediaQuery`-hook, jsdomissa oletus leveä) ja nappi "Suodattimet (n)" (`aria-expanded`, `aria-controls="filter-panel"`), uusi `ActiveFilters` (sirut, fokus seuraavaan, edelliseen tai hakuun), kuvakoko Pieni/Keski/Iso (`data-image-size` ja `--card-min`, ei inline-tyyliä CSP:n vuoksi) ja taulukko enintään 100rem.
Testit: uusi `CatalogView.layout.test.tsx` (6 testiä). Kahden vanhan testin h2-tarkistus päivitetty rakenteen osalta (asettelun otsikot suodatetaan pois). npm test 697/697, lint ja build läpi. Ei vaakavieritystä 320 px:ssä.
Poikkeamat: (1) Sirurivin näkyvä nimi "Aktiiviset" (`texts.activeFilters`) on rautalangasta, sitä ei ollut tekstitaulukossa. Se on `aria-hidden`, koska sirujen nimet ("Poista suodatin: X") riittävät. (2) Sirurivin "Tyhjennä haku ja suodattimet" piilotetaan, kun tyhjän tuloksen laatikossa on sama nappi, ettei sivulla ole kahta samannimistä nappia. (3) Hakutekstistä ei tehdä sirua, koska hakukenttä on aina näkyvissä. (4) DeckEditor käyttää `CardFilters`-komponenttia ennallaan ilman `collapsibleBelow`-propsia (T-050b). Editori on nyt 2560 px leveä, ja vanha hakulistan ruudukko näyttää 2850 px:n näytöllä viisi saraketta, kunnes T-050b korvaa sen.
Kuvat: scratchpad `a-cards-*`, `a-decks-*` ja `a-editor-*` (375/320, 1280, 1920 ja 2850; tumma ja vaalea).
Koodikatselmointi: tehty · Pakollisia korjattu 1 (kaksi samannimistä tyhjennysnappia) · Suosituksia 1 (`--space2`-kirjoitusvirhe poistettu, ei velkaa).
Seuraavaksi: PM tarkistaa esikatselusta, sitten T-050b.
