# UX-118 · Koko sivuston UI-yhtenäisyysauditointi (T-118, vaihe 1)

**Päivä:** 2026-10-09 · **Rooli:** UX (Opus) · **Kohde:** `test`-haaran tuotantobuild (`npm run build` ja `vite preview`)
**Menetelmä:** headless Chrome CDP:n kautta, realistinen localStorage-tila (kokoelmassa 60 eri korttia ja 131 kappaletta, versioerittelyjä, 3 pakkaa: laillinen "Punainen aggro" sideboardilla, vajaa "Keltainen kontrolli – keskeneräinen versio" ja tyhjä "Uusi pakka", 8 wantia ja 5 korttia proxy-jonossa). Kuvat otettiin leveyksillä 390 × 844 ja 1440 × 900, tummassa ja vaaleassa teemassa (176 kuvaa). Vaakavieritys tarkistettiin lisäksi leveyksillä 320, 360, 600, 768, 900, 1024 ja 1280 kymmenellä reitillä. Komponenttien mitat (getComputedStyle) kerättiin jokaisesta tilasta, ja sisäiset vieritysalueet ja kontrastit tarkistettiin skriptillä. Englanti tarkistettiin pistokokein (ei löydöksiä).

**Kuvakaappaukset** ovat scratchpadissa: `S = C:\Users\miininmm\AppData\Local\Temp\claude\c--Users-miininmm-dev-cyberdeck\cfe0fdc2-9fa9-4861-b499-35bde76ef86d\scratchpad\shots\`. Nimeämistapa on `<ryhmä>-<tila>-<leveys>-<teema>.png`, esimerkiksi `S\editor-legal-390-dark.png`. Kaikki tilat ovat olemassa molemmissa teemoissa ja molemmilla leveyksillä.

**Rajaukset:** Esikatselubuildissa ei ole kirjautumista, joten kirjautuneen tilivalikon, julkaisun vahvistuslomakkeen (näkyvyys) ja julkisten pakkojen listan sisällön näkymät jäivät näkemättä. Ensikirjautumisen dialogi simuloitiin samalla merkinnällä ja luokilla (`.confirm-dialog`, `.row-actions`), ks. `S\misc-firstsignin-dialog-sim-*.png`. Nämä tarkistetaan uudelleen vaiheen 2 lopussa.

**Hyvää ja säilytettävää:** Vaakavieritystä ei ole millään leveydellä 320–1440. Liukukytkin (`.edit-switch`) on jo yksi yhteinen komponentti kolmessa paikassa ja näkyvyyskytkimessä. Ensisijainen ja toissijainen painike ovat rakenteeltaan oikein (reuna ja täyttö, viiste 10 px). Fokusrengas toimii ja ohittaa viisteen. Ilmoituslaatikot (raidoitus ja vasen kisko) ovat yhtenäisiä.

---

## a) Yhtenäisyysstandardi

Yksi tapa jokaiselle komponenttityypille. Koodari toteuttaa luokat `src/styles.css`:ään ja poistaa korvatut päällekkäiset säännöt. Kaikki mitat ovat CSS-arvoina. "Ohjainkorkeus" on aina `--target-min` (44 px) **ulkomittana** (reunat mukaan lukien, `box-sizing: border-box`, kiinteä `block-size`, ei pelkkä `min-height`).

| Komponentti | Luokka (olemassa / luotava) | Korkeus | Muoto | Teksti | Tilat |
|---|---|---|---|---|---|
| Ensisijainen painike | `.button-primary` (on) | 44 px | viiste `--cut` 10 px, ei pyöristystä | 18 px (`--font-size-base`), 700, VERSAALIT, `--letter-spacing-button` | hover: täyttö `--color-accent-2` + alleviivaus; fokus: `clip-path:none` + `--focus-ring`; disabled: `aria-disabled` + harmaa |
| Toissijainen painike | `.button-secondary` (on) | 44 px | sama viiste | sama kuin ensisijainen | sama hover/fokus |
| Vaarallinen toiminto | **`.button-danger` (luotava)** | 44 px | sama viiste | sama, väri `--color-danger` | reuna `--color-danger`, täyttö `--color-danger-surface`, teksti `--color-danger`; hover alleviivaus + täyttö `--color-danger` ja teksti `--color-bg` |
| Tiivis painike | **`.button-compact` (luotava, muunnin)** | 44 px | sama | 16 px, `padding-inline: var(--space-3)` | kuten perusluokka. Ainoa sallittu pienempi fonttikoko painikkeissa. 14 px poistuu. |
| Ikonipainike | **`.icon-button` (on, yhtenäistetään)** | 44 × 44 | toissijaisen painikkeen kehys ja viiste, kun painike on erillinen; kehyksetön vain otsikon vieressä (kynä) ja yläpalkissa | ikoni 20 px | kuten toissijainen |
| Dialogin sulkeminen | `.dialog-close` (on) | 44 × 44 | toissijainen + viiste | × 22 px | kaikissa koko näytön dialogeissa (kortin tiedot, testikäsi) oikeassa yläkulmassa. Vahvistusdialogeissa ei ×, vaan "Peruuta". |
| Tekstilinkki | **`a` perustyyli + `.text-link` (luotava)** | – | – | perii, `text-decoration: underline`, `text-decoration-color: var(--color-accent-edge)`, `text-underline-offset: 3px` | väri `--color-text` (ei selaimen sininen tai violetti), hover `--color-info`, fokus `--focus-ring` |
| Linkkipainike | `.link-button` (on) | vähintään 32 px kosketusalue | – | aina alleviivattu kuten `.text-link` | kuten tekstilinkki. Ei koskaan kiinni toisessa ohjaimessa (vähintään `--space-3` väli). |
| Määrälaskuri (−/+) | `.step` (on) + **`.step--compact` (luotava)** | 44 px tai tiivis 32 px | viiste 8 px tai tiivis 6 px | 22 px tai tiivis 18 px | vain kaksi kokoa. 28 px poistuu. |
| Pieni toimintopainike (SB) | `.tile-action` (on) | 32 px | viiste 6 px (kuten `.step--compact`) | 14 px, 700 | kuten toissijainen |
| Liukukytkin | `.edit-switch` (on) | 44 px kosketusalue, rata 40 × 20 | suorakulmainen rata, neliönuppi | label oikealla, 18 px, 500 | ON: reuna ja nuppi `--color-accent-edge`, nuppi oikealla. Ei pyöreää versiota. |
| Segmenttivalitsin / välilehdet | **`.segmented` (yhdistetään yhdeksi)** | 44 px ulkomitta | ryhmällä 2 px reuna `--color-border-strong`, osien välissä 2 px viiva, ei viistettä | 18 px, 700, normaali kirjainkoko | valittu: täyttö `--color-brand-yellow`, teksti `#000`; hover `--color-surface-hover`; fokus `outline-offset: -4px`. Korvaa `.view-select`, `.deck-tabs`, `.editor-tabs`, `.segmented-options` ja `.scanner-mode-option`. |
| Valintaruutu-chip | `.option` (on) | 32 px | suorakulmainen, 1 px reuna | 16 px | valittu: reuna `--color-info`, tausta `--color-selected-surface`, ruksi |
| Yksi valinta (radio) | – | – | – | – | **Aina `.segmented`**, ei checkbox-chip-ulkoasua |
| Tekstikenttä, haku, select | `.field input`, `select` | 44 px ulkomitta (`block-size: var(--target-min)`, `line-height: 1.2`) | suorakulmainen, 1 px reuna ja 2 px alareuna | 18 px, 500 | hover reuna `--color-info`, fokus `--focus-ring`. Label: hakukentässä visuaalisesti piilotettu label ja placeholder "Hae nimellä…", muissa kentissä näkyvä label yläpuolella (16 px, 700, VERSAALIT). |
| Tiedostokenttä | **`.file-input` (luotava)** | 44 px | natiivi input piilotetaan (`.visually-hidden`), `<label class="button-secondary">Valitse tiedosto</label>` + tiedostonimi muted-tekstinä | kuten toissijainen | fokus näkyy labelissa (`:has(input:focus-visible)`) |
| Avattava osio | **`.disclosure` (luotava `<details>`-elementille)** | `summary` 44 px | – | 16 px, 700, VERSAALIT, `--letter-spacing-caps` | `summary::before` on chevron ▸ (CSS-kolmio), joka kääntyy 90° auki-tilassa. Hover alleviivaus, fokus `--focus-ring`. Natiivi merkki piilotetaan (`list-style: none`, `::-webkit-details-marker {display:none}`). |
| Merkit ja tagit | `.type-badge`, `.set-chip`, `.stat-chip` | 24 px | suorakulmio tai viiste, **ei pyöristystä** | 12–14 px, 700, VERSAALIT | – |
| Laskuri ×N | `.deck-tile-count`, `.stack-card-count`, `.pocket-count` | – | keltainen suorakulmio, ei pyöristystä | mono 16 px, 700 | sama ulkoasu kaikkialla |
| (i)-vihje | `.info-tip-button` (on) | 44 px kosketusalue | pyöreä i-ikoni sallittu poikkeus (ikoni, ei ohjaimen muoto) | – | – |
| Popover ja valikko | `.export-menu-panel`, `.deck-actions-panel` | – | 1 px reuna `--color-border-strong`, tausta `--color-surface`, `z-index: 20`. **Yksikään vanhempi ei saa leikata (`overflow: hidden`).** | valikkokohdat `.button-secondary` täysleveinä | Esc sulkee, fokus palaa |
| Vahvistusdialogi | `.confirm-dialog` (on) | – | `.confirm-dialog-body` | otsikko h2 | painikejärjestys DOMissa: Peruuta, sitten pääpainike oikealle. Alle 40rem leveydellä `.row-actions` on `flex-direction: column-reverse; align-items: stretch`, eli pääpainike on ylhäällä ja kaikki ovat täysleveitä. Peruutus on aina "Peruuta". |
| Koko näytön dialogi | `.card-dialog`, `.test-hand-dialog` | – | alle 40rem dialogi on koko näytön levyinen ja korkuinen sivu (`inset:0`, ei kehystä), ja sen sisältö vierii kuin sivu | – | sulkeminen `.dialog-close` (×) oikeassa yläkulmassa |
| Otsikot | `h1`, `h2`, `h3` | – | h1-alleviivauspalkki | h1 36 px / h2 22 px / h3 16 px; **kaikki 700 ja VERSAALIT**, kirjainväli h1 0.08em, h2 0.05em, h3 0.08em | ei pieniä alkukirjaimia otsikoissa (poikkeus: kortin nimi `.card-name`) |
| Osiolaatikko | **`.panel` (yhdistetään)** | – | tausta `--color-surface`, 1 px `--color-border`, vasemman yläkulman 40 × 2 px keltainen tikku (nykyinen `.stats-card`) | otsikko h2 16 px VERSAALIT muted | korvaa keltaisen vasemman kiskon tuontiosioissa. Kisko jää vain ilmoituksille ja tilannelaatikolle. |
| Tyhjä tila | `.empty` (on, UX.md 3.4) | – | 1 px katkoviiva `--color-border-strong`, tausta `--color-surface` | otsikko h2 22 px, yksi lause, toiminnot vasemmalle tasattuna | ei toista otsikkoa leipätekstissä |
| Edistymispalkki | `.progress-bar` | 8 px | suorakulmio | – | täyttö `--color-accent` (tai kortin väri) |

---

## b) Komponentti-inventaario ja poikkeamat

Mitat ovat tummasta teemasta, molemmat leveydet yhdessä (sulkeissa esiintymien määrä). Vaalea teema on mitoiltaan identtinen.

**Painikkeet**
- `.button-primary`: korkeus 44 ✓, viiste 10 px ✓, **fonttikoko 18 px (45), 14 px (31), 16 px (21)**. 14 px tulee pakkakorttien toiminnoista (`.deck-row > .row-actions > button`, styles.css:4225) ja 16 px testikäsipainikkeesta ja dialogeista.
- `.button-secondary`: korkeus 44 (175), **59 px (3, kaksirivinen "NÄYTÄ KOKO RUUDULLA", `.card-zoom-open`)**. Fonttikoko 18 / 16 / 14 px, padding `8px 16px` / `8px` / `8px 12px`.
- `.button-secondary.filter-toggle` (SUODATTIMET): **46 px** (venyy hakukentän mukaan, `.search-row .filter-toggle { align-self: stretch }`).
- `.scan-fab` (mobiilin "Skannaa kortteja"): **47 px, `border-radius: 999px`, ei versaaleja, varjo** (styles.css:7729).
- `.scanner-mode-option`: 47 px, 2 px reuna, valittu vain keltaisella reunalla, ei versaaleja (styles.css:7787).
- Vaarallinen toiminto: **ei omaa luokkaa**. Pakan poisto (`ConfirmDeleteDialog.tsx:44`), jonon tyhjennys (`ProxyView.tsx:148`) ja tilin poisto (`AccountMenu.tsx:178`) käyttävät keltaista `.button-primary`a.
- Ikonipainikkeet: `.icon-button` (kynä) 44 px kehyksetön, `.icon-delete` (roskakori) 44 px kehyksellä, `.dialog-close` × 44 px, `.version-step` ‹ › 44 px suorakulmio ilman viistettä ja Arial-fontilla, `.proxy-card-remove` × **28 px pyöreä** (`border-radius: 50%`, styles.css:7219).
- Linkkipainikkeet `.link-button`: korkeus 24 / 27 / 44 / 48 px, alleviivaus vaihtelee. "Lisää puuttuvat wantiin" (`.missing-link`) on aina alleviivattu ja sillä on 4 px sisennys. "Proxy-jonoon" on alleviivattu vain hoverissa, "← Takaisin pakkoihin" aina keltaisella alleviivauksella.
- Paljaat `<a>`-linkit: **selaimen oletusvärit** `rgb(158,158,255)` ja vierailtu violetti. Esiintyy kortin tietojen "Pakoissa"-listassa, julkisen pakan "Takaisin julkisiin pakkoihin" -linkissä ja vaihtolinkin "Siirry Kortit-sivulle" -linkissä.

**Määrälaskurit**
- `.step`: **kolme kokoa: 44 px (2880), 32 px (1661) ja 28 px (218)**, viisteet 8 / 6.4 / 4.8 px. 28 px tulee pakkaeditorin listariveiltä (`.deck-tile .step`, styles.css:3596), 32 px lisäystaulukosta (`.pick-table`).
- `.tile-action` ("+ SB", "→ SB", "→ Pää"): 28 px, 13 px, ei viistettä.

**Kytkimet, segmentit ja välilehdet**
- `.edit-switch` (Muokkaa kokoelmaa, Kaikki versiot, Näytä puuttuvat, näkyvyys): 44 px, rata 40 × 20 ✓ yhtenäinen. Näkyvyyskytkimessä on kaksipuolinen label (Yksityinen / Julkinen), muissa label oikealla.
- Segmenttivalitsimia on **viisi eri toteutusta**:
  - `.view-select .option` (Kuvat/Lista, Pieni/Normaali/Iso, Beta/Retail, Yleiskuva/Kansio, Lista/Pinot/Kortit, Rivit/Kuvat): ulkomitta 44 px, 2 px reuna, 18 px.
  - `.deck-tabs a` (Omat pakat / Julkiset pakat): 44 px, 2 px reuna, linkkejä.
  - `.editor-tabs button` (Pakka / Lisää kortteja): **48 px** ulkomitta (44 + 2 × 2 px reuna).
  - `.segmented-option` (Aloitus / Vuoro 1 / 3 / 5): **46 px** ulkomitta, 1 px reuna, **16 px** fontti.
  - `.scanner-mode-option` (Yksi kerrallaan / Jatkuva): erilliset painikkeet, valittu vain reunalla.
- Suodattimien "Kokoelma"-ryhmä (Kaikki / Omistetut / Puuttuvat) on **radio, mutta näyttää valintaruudulta** (`.option` ja neliö ruksilla).

**Valintaruudut ja chipit**
- `.option` (tyyppi, väri, harvinaisuus, myytävyys): **28 px**. `.option-number` (cost, power, RAM): **32 px**, mono. Valintaruutu 16 px.

**Tekstikentät**
- `input[type=search]`: **46 px** (`min-height` 44 + sisältö). `input[type=url]`: 46 px. `select`: 44 px. Pakan nimi `input[text]` editorissa: 52 px, 22 px VERSAALIT, vain alaviiva (tarkoituksellinen otsikkokenttä, ok).
- Hakukentän label: Kortit, Proxy ja editori käyttävät pelkkää placeholderia ("Hae nimellä…"), Have/Want näkyvää VERSAALI-labelia "HAE KORTIN NIMELLÄ" ja tyhjää kenttää ilman placeholderia.
- `input[type=file]`: **natiivi harmaa selaimen painike Arial-fontilla** (tuonti ja jaettu pakka).

**Ilmoitukset, merkit, vihjeet ja valikot**
- Ilmoituslaatikot (`.notice`, raidoitus) ✓ yhtenäisiä.
- Merkit: `.type-badge` viiste ✓. `.art-count-badge` ("1/3 versiota") `border-radius: 4px` ja määrittelemättömät tokenit `--surface` ja `--text` (styles.css:4908). `.pocket-count` (×4 kansiossa) `border-radius: 999px` (styles.css:8096). `.nav-badge` (Proxy 7) on pyöreä.
- (i)-vihjeet: 44 px kosketusalue, pyöreä ikoni (sallittu).
- Valikot: Tuo-valikko ✓. **Vie ja jaa -valikko leikkautuu** (ks. 01).
- Avattavat osiot `<summary>`: korkeus 24 / 27 / 32 / 44 px. "Erittely" ja "Asetukset" ovat ilman merkkiä ja muted-värisiä, eivätkä näytä klikattavilta. "Näytä puuttuvat kortit" näyttää natiivin ▶-merkin, "Muut tuotteet (10)" on lihavoitu ilman merkkiä.

**Dialogit**
- `.confirm-dialog`: toimintojen järjestys vaihtelee. Poisto, painos ja ensikirjautuminen: Peruuta ensin. Skanneri: Peru viimeisenä omalla rivillään. Mobiilissa painikkeet rivittyvät epätasaisesti. Peruutusteksti on "Peruuta" (deckTexts, texts.account) tai "Peru" (scannerTexts.cancel, texts.editionConfirmCancel).
- Sulkeminen: kortin tiedot ×, testikäsi "SULJE"-painike, skannerin virhetila "SULJE".
- Sisäinen vieritys mobiilissa: `.card-dialog` 1075 > 844, `.test-hand-dialog` 1164 > 844 ja `.edition-confirm` 849 > 844.

**Otsikot**
- h1 36 px VERSAALIT ✓.
- h2: 22 px (yleinen), **18 px** (`.deck-section-title`, `.filters-heading`) ja **16 px** (`.stats-card-title` kokoelmassa h2:na, editorissa sama tyyli h3:na).
- h3 ilman luokkaa: **normaali kirjainkoko 21 / 16 px** ("Kokoelmassa", "Versiot", "Want-listalla", "Pakoissa", "Lisää kortteja wantiin", "Sinulla on, he haluavat", "Heillä on, sinä haluat", "Tallenna pakaksi"). Muut h3:t ovat 16 px VERSAALEJA (`.stats-card-title`, `.deck-group-title`, `.progress-subtitle`).

**Osiolaatikot ja tyhjät tilat**
- Laatikkotyylejä on neljä: `.stats-card` (keltainen kulmatikku), tuontiosiot (keltainen vasen kisko), `.deck-row` (3 px keltainen yläreuna) ja `.card-filters`-paneeli (kulmasulut).
- Tyhjiä tiloja on kolme tyyliä: `.empty.deck-empty` katkoviivalla (Pakat, Julkiset pakat), `.collection-empty` + `.scan-prompt` kiinteällä reunalla ja kulmatikulla (Kokoelma) sekä Have/Want ja Proxy pelkkänä tekstinä ilman laatikkoa.

**Edistymispalkit ja laskurit**
- Palkit ovat 8 px ✓. Seteittäin-, Harvinaisuuksittain- ja Värit-korttien palkkisarakkeet ovat 1440:lla eri levyisiä (noin 120 / 112 / 120 px), mikä on pieni epätasaisuus.
- ×N: `.deck-tile-count` keltainen mono ilman taustaa, `.stack-card-count` keltainen suorakulmio, `.pocket-count` keltainen pilleri. Kolme ulkoasua samalle asialle.

---

## c) Löydökset vakavuusjärjestyksessä

Yhteensä 43: Kriittinen 1, Korkea 15, Keskitaso 15, Matala 12. Rivinumerot viittaavat `src/styles.css`:ään, ellei toisin mainita.

### Kriittinen

**UX-118-01 · Pakat: "Vie ja jaa" -valikko leikkautuu eikä sitä voi käyttää**
- Näkymä: Pakat-lista, 390 ja 1440, molemmat teemat.
- Ongelma: Valikko (`.export-menu-panel`) avautuu kortin sisään, mutta `.deck-row { overflow: hidden }` (rivi 4117) leikkaa sen. Näkyviin jää vain ohut reunanpala kortin alareunaan, joten Vie .json-, Vie .txt- ja Jaa linkki -toiminnot ovat saavuttamattomia hiirellä ja kosketuksella.
- Korjaus: Poista `overflow: hidden` riviltä 4117. Kuvabanneri leikataan jo omassa säännössään (`.deck-card-banner { overflow: hidden }`, rivi 4132). Anna `.export-menu-panel`ille `position: absolute; z-index: 20; inset-block-start: 100%`, jotta se aukeaa seuraavan kortin päälle. Tarkista, että valikko ei leikkaudu viimeisessä kortissa ja että Esc sulkee valikon ja palauttaa fokuksen.
- Kuvat: `S\probe-exportmenu-390-dark.png`, `S\decks-export-menu-1440-dark.png`

### Korkea

**UX-118-02 · Jaettu pakka -linkki näyttää koko tuontilomakkeen**
- Näkymä: `#/jaa/<data>`, 390 ja 1440.
- Ongelma: Linkin avaaja näkee ensin otsikon "Jaettu pakka" ja sen alla "Hae pakka Netdeck-linkistä" -kentän, "Liitä pakkalista tai tiedosto" -tekstialueen ja tiedostovalitsimen. Vasta niiden jälkeen tulevat tarkistuksen tulos ja tallennus. Linkin saajan kannalta lomakkeet ovat turhia ja hämmentäviä, ja näkymä näyttää rikkinäiseltä.
- Korjaus: Lisää `DeckImport`-komponenttiin (`src/ui/DeckImport.tsx`) prop, esimerkiksi `mode: 'import' | 'shared'`. Kun arvo on `'shared'`, Netdeck- ja Liitä-osiot jätetään renderöimättä. `SharedDeckView.tsx:61` välittää `mode="shared"`. Näkymässä on silloin vain otsikko, johdanto, tarkistuksen tulos, puuttuvien toiminnot ja "Tallenna pakaksi".
- Kuvat: `S\misc-shared-deck-390-dark.png`, `S\misc-shared-deck-1440-light.png`

**UX-118-03 · Pakkaeditori, Lista: rivien ohjaimet eivät ole samassa linjassa**
- Näkymä: Pakkaeditorin pakkasarake, Lista, 390 ja 1440.
- Ongelma: ×N, −/+ ja → SB siirtyvät rivistä toiseen 16 px vaakasuunnassa (esim. 1440:lla ×3:n vasen reuna on 1220 tai 1236 px). Syy: `.deck-tile-notes` ei ole grid-alueella niillä riveillä, joilla ei ole luokkaa `.is-missing` tai `.is-problem`, joten grid luo kaksi implisiittistä 0 px:n saraketta ja kaksi ylimääräistä `gap`ia. Lisäksi Legend-riveiltä puuttuu move-sarake, joten niiden ohjaimet ovat oikeassa reunassa ja muiden 50 px vasemmalla.
- Korjaus: (1) Lisää sääntö `.deck-tile-notes { grid-area: miss; }` ja `.deck-tile:not(.is-missing):not(.is-problem) .deck-tile-notes { display: none; }` (rivin 3569 lähelle). (2) Käytä listanäkymän kaikilla riveillä samaa saraketta: `.deck-tile { grid-template-columns: 2rem minmax(0, 1fr) 2.5rem auto 3.25rem; grid-template-areas: 'gem name count step move'; }`. Sarake on tyhjä riveillä, joilla ei ole siirtopainiketta. Poista erillinen `.deck-tile.has-move` -sarakemäärittely (rivi 5650). Tavoite: ×N, −, + ja SB ovat samassa x-kohdassa kaikilla riveillä, Legendit ja sideboard mukaan lukien.
- Kuvat: `S\editor-legal-390-dark.png`, `S\editor-legal-1440-dark.png`, `S\editor-partial-390-dark.png`

**UX-118-04 · Pakkaeditori, lisäystaulukko: "+ SB" valuu taulukon ulkopuolelle**
- Näkymä: Lisää kortteja, Rivit, 1440.
- Ongelma: Pakassa-sarakkeen leveys on `8.5rem` (136 px, rivi 2835), mutta −, määrä, + ja "+ SB" tarvitsevat noin 151 px. "+ SB" ulottuu x = 1003:een, vaikka taulukko päättyy x = 988:aan, ja se piirtyy pakkasarakkeen tilannelaatikon reunan päälle.
- Korjaus: `.pick-table .col-deck { inline-size: 10.5rem; white-space: nowrap; }` (rivi 2834). Tarkista myös murtopisteiden arvot riveillä 2987 (`7rem`) ja 3113 (`10rem`): sarakkeen leveyden on riitettävä sisällölle kaikilla leveyksillä, tai "+ SB" siirretään omalle rivilleen −/+:n alle kapeassa näkymässä. Tavoite: sisältö ei ylitä taulukon reunaa millään leveydellä 640–1440.
- Kuvat: `S\editor-legal-1440-dark.png` (oikea reuna x ≈ 990–1003), `S\editor-stats-1440-dark.png`

**UX-118-05 · Pakkaeditori, Pinot: nimilappu on kortin painetun tekstin päällä**
- Näkymä: Pinot, Legendit ja pinot, 390 ja 1440.
- Ongelma: `.stack-card-name` on liukuvärillinen ja läpikuultava (rivi 3673). Kortin oma kustannusnumero ("05", "02") ja nimi näkyvät lapun alta, joten teksti on tekstin päällä.
- Korjaus: Anna lapulle umpinainen tausta `background: var(--color-surface); padding-block: 0.3rem;` ja kiinteä korkeus `block-size: 1.75rem`, joka peittää kortin yläkaistan kokonaan. Vaihtoehto: siirrä nimi kortin kuvan yläpuolelle omaksi kaistakseen. Tavoite: kortin painettua tekstiä ei näy nimilapun takaa.
- Kuvat: `S\probe-pinot-stack-390-dark.png`, `S\editor-view-pinot-390-dark.png`

**UX-118-06 · Segmenttivalitsimia on viisi erilaista, ja radio näyttää valintaruudulta**
- Näkymä: kaikki. Kortit (Kuvat/Lista, Pieni/Normaali/Iso, Beta/Retail), Kokoelma (Yleiskuva/Kansio), Pakat (Omat/Julkiset), editori (Pakka/Lisää kortteja, Lista/Pinot/Kortit, Rivit/Kuvat, Aloitus/Vuoro), skanneri (Yksi kerrallaan/Jatkuva) ja suodattimet (Kokoelma: Kaikki/Omistetut/Puuttuvat).
- Ongelma: Ulkomitat ovat 44 / 46 / 48 px, reunat 1 tai 2 px ja fontit 16 tai 18 px. Skannerin valitsimessa valinta näkyy vain keltaisena reunana. Suodattimien Kokoelma-ryhmä on yksivalinta, mutta se näyttää monivalinnalta (neliö ja ruksi).
- Korjaus: Luo yksi `.segmented`-komponentti standardin mukaan (44 px ulkomitta, 2 px ryhmäreuna, 18 px 700, valittu = keltainen täyttö ja musta teksti). Ota se käyttöön `.view-select .options`issa (rivi 8432), `.deck-tabs`issa (6626), `.editor-tabs`issa (8199: poista ylimääräinen ulkoreuna niin, että ulkomitta on 44), `.segmented-options`issa (6254: fontti 18 px, reuna 2 px), `.scanner-mode-option`issa (7787: muuta ryhmäksi samalla ulkoasulla) ja suodattimen Kokoelma-ryhmässä (`CardFilters.tsx:194`, radio → `.segmented`). Poista vanhat päällekkäiset säännöt.
- Kuvat: `S\cards-edit-mode-1440-dark.png`, `S\editor-legal-390-dark.png`, `S\coll-scanner-390-dark.png`, `S\cards-filters-open-390-dark.png`

**UX-118-07 · Saman rivin ohjaimet ovat eri korkuisia ja eri tasossa**
- Näkymä: Kortit, Proxy ja editori (haku + SUODATTIMET), Have/Want (Pieni/Normaali/Iso + Järjestys-selectit), 390 ja 1440.
- Ongelma: Hakukenttä on 46 px ja SUODATTIMET venyy 46 px:iin (`align-self: stretch`, rivi 8414), kun select ja muut painikkeet ovat 44 px. Have/Wantissa segmentin yläreuna on 226 px ja selectien 222 px, eli 4 px eri tasossa.
- Korjaus: `.field input[type='search'], .field input[type='url'], .field input[type='text'] { block-size: var(--target-min); line-height: 1.2; }` (rivi 707 ja vastaavat). Poista `align-self: stretch` riviltä 8414. Työkalurivien flex-säiliöihin (`.list-toolbar`, `.search-row`, Have/Want-työkalurivi) `align-items: center` ja `.view-select legend`ista float pois (rivit 1613 ja 8420). Tavoite: kaikki saman rivin ohjaimet ovat 44 px ja keskitetty samaan linjaan.
- Kuvat: `S\misc-havewant-1440-dark.png`, `S\cards-list-390-dark.png`

**UX-118-08 · Määrälaskureita (−/+) on kolmea kokoa**
- Näkymä: kortin tiedot ja ruudukko 44 px, lisäystaulukko 32 px, editorin pakkarivit 28 px.
- Ongelma: Kolme kokoa samalle ohjaimelle. 28 px on kosketuksessa liian pieni (390:llä pakkarivien −/+ ovat 28 × 28 vierekkäin 2 px välillä).
- Korjaus: Luo `.step--compact` (`inline-size` ja `block-size` 2rem, `--cut: 0.375rem`, `font-size: var(--font-size-base)`) ja käytä sitä `.deck-tile .step`in (rivi 3596) ja `.pick-table`n laskurien sijaan. Väli `.card-row-controls`issa on `var(--space-1)`. `.tile-action` (rivi 5622) saa saman 32 px korkeuden ja `--shape-chamfer`-viisteen 6 px:llä. Muualla käytetään 44 px:n `.step`iä. Tavoite: vain 44 px ja 32 px.
- Kuvat: `S\editor-legal-390-dark.png`, `S\cards-detail-1440-dark.png`

**UX-118-09 · Mobiilin pyöreä "Skannaa kortteja" -kelluva painike**
- Näkymä: Kokoelma (yleiskuva, kansio, tyhjä), 390, molemmat teemat.
- Ongelma: `.scan-fab` (rivi 7729) on pilleri (`border-radius: 999px`), siinä ei ole versaaleja ja sillä on pehmeä varjo, eli juuri se iOS-tyyli, josta käyttäjä on huomauttanut. Vaaleassa teemassa siitä puuttuu musta reuna, joka muilla ensisijaisilla painikkeilla on. Painike peittää sisältöä (Seteittäin-kortin "Muut tuotteet" -rivin ja kansion sivunumeron). Tyhjässä tilassa se toistaa samaa toimintoa kuin sen yläpuolella oleva "SKANNAA KORTTEJA" -painike.
- Korjaus: Poista `.scan-fab` ja `.scan-fab-spacer` (rivit 7717–7760) sekä vastaava JSX `CollectionView.tsx`:stä. Näytä mobiilissa sama `.button-secondary.scan-open` -painike ("SKANNAA") otsikkorivillä kuin 1440:lla. Jos kelluva painike halutaan säilyttää (tuotepäätös, kysy käyttäjältä), sen on oltava `.button-primary` (viiste, versaalit, ei varjoa, vaaleassa teemassa musta reuna), eikä sitä näytetä tyhjässä tilassa.
- Kuvat: `S\coll-overview-390-dark.png`, `S\coll-binder-390-dark.png`, `S\coll-collection-empty-390-light.png`

**UX-118-10 · Linkit näkyvät selaimen oletusväreillä (sininen ja violetti)**
- Näkymä: kortin tiedot ("Pakoissa: Punainen aggro"), julkinen pakka ei löydy ("Takaisin julkisiin pakkoihin") ja vaihtolinkki ("Siirry Kortit-sivulle"), molemmat leveydet ja teemat.
- Ongelma: `styles.css`:ssä ei ole `a`-perustyyliä, joten linkit ovat `rgb(158,158,255)` tai vierailtuina violetteja. Ne rikkovat teeman ja vaaleassa teemassa myös kontrastin.
- Korjaus: Lisää perussääntöihin (rivin 200 jälkeen): `a { color: var(--color-text); text-decoration: underline; text-decoration-color: var(--color-accent-edge); text-decoration-thickness: 2px; text-underline-offset: 3px; } a:hover { color: var(--color-info); } a:focus-visible { outline: var(--focus-ring); outline-offset: 2px; }`. Tarkista, etteivät `.brand`, `.main-nav a`, `.deck-tabs a`, `.missing-tile` ja `.pocket-link` peri alleviivausta (`text-decoration: none` niissä).
- Kuvat: `S\cards-detail-1440-dark.png`, `S\misc-public-deck-1440-dark.png`, `S\misc-trade-link-1440-dark.png`

**UX-118-11 · Avattavat osiot eivät näytä klikattavilta ja ovat kaikki erilaisia**
- Näkymä: kortin tiedot ("Erittely" jokaisen version alla), Proxy ("Asetukset"), Kokoelma ("Muut tuotteet (10)") ja jaettu pakka ("Näytä puuttuvat kortit").
- Ongelma: "Erittely" ja "Asetukset" ovat muted-värisiä pelkkiä sanoja ilman merkkiä, eikä niitä tunnista toiminnoiksi. Neljällä osiolla on neljä eri ulkoasua (24–44 px, natiivi ▶ tai ei mitään).
- Korjaus: Luo `.disclosure summary` standardin mukaan (44 px, 16 px 700 VERSAALIT, CSS-chevron `::before`, joka kääntyy `[open]`-tilassa, natiivimerkki piilossa). Lisää luokka `<details className="disclosure">` kohteisiin `CardVersions.tsx:193` (art-breakdown), Proxy-asetukset (`ProxyView.tsx`), kokoelman "Muut tuotteet" ja DeckImportin puuttuvat kortit. Korvaa `.art-breakdown summary` -säännöt (rivit 4897, 5197, 5407). "Erittely" kannattaa nimetä selkeämmin, esimerkiksi "Näytä painokset" (TXT-tarkistus).
- Kuvat: `S\cards-detail-1440-dark.png`, `S\misc-proxy-1440-light.png`, `S\misc-shared-deck-390-dark.png`

**UX-118-12 · Vaaralliset toiminnot ovat keltaisia pääpainikkeita**
- Näkymä: pakan poiston vahvistus, proxy-jonon tyhjennyksen vahvistus ja tilin poisto.
- Ongelma: "POISTA PAKKA" on keltainen `.button-primary`, joka on sama ulkoasu kuin "Avaa" tai "Tallenna". Peruuttamaton toiminto ei erotu.
- Korjaus: Luo `.button-danger` standardin mukaan (rakenne kuten `.button-secondary`: reuna `--color-danger` ja `::before`-täyttö `--color-danger-surface`, teksti `--color-danger`). Käytä sitä kohteissa `ConfirmDeleteDialog.tsx:44`, `ProxyView.tsx:148` ja `AccountMenu.tsx:178`. Oletusfokus pysyy Peruuta-painikkeessa.
- Kuvat: `S\decks-delete-dialog-390-dark.png`, `S\decks-delete-dialog-1440-light.png`

**UX-118-13 · Tiedostovalitsin on selaimen natiivi harmaa painike**
- Näkymä: Tuo pakkalista ja jaettu pakka, molemmat leveydet ja teemat.
- Ongelma: "Valitse tiedosto | Ei valittua tiedostoa" näkyy Arial-fontilla ja harmaana ainoana teemaan kuulumattomana ohjaimena.
- Korjaus: Luo `.file-input` standardin mukaan. Natiivi `<input type="file">` saa luokan `.visually-hidden`, sen `<label>` saa luokan `button-secondary` ja tekstin "VALITSE TIEDOSTO", ja valitun tiedoston nimi näytetään muted-tekstinä vieressä (tai "Ei valittua tiedostoa"). Fokus näkyy: `.file-input:has(input:focus-visible) label { outline: var(--focus-ring); }`. Koodi: `DeckImport.tsx`.
- Kuvat: `S\decks-import-text-390-dark.png`, `S\decks-import-text-1440-light.png`

**UX-118-14 · Mobiilidialogeissa on sisäinen vieritys**
- Näkymä: 390, kortin tiedot (1075 > 844), testikäsi (1164 > 844) ja painosvarmistus (849 > 844).
- Ongelma: Dialogin sisältö vierii dialogin sisällä sivun päällä. Tämä rikkoo sääntöä "ei sisäisiä vieritysalueita".
- Korjaus: Alle 40rem leveydellä `.card-dialog`, `.test-hand-dialog` ja `.confirm-dialog` ovat koko näytön sivuja: `.card-dialog-body` ja `.confirm-dialog-body` saavat `width: 100%; min-height: 100dvh; margin: 0; border: 0`, eikä taustalla näy sivua. Silloin vieritys on käytännössä sivun vieritystä ilman kehystä. Painosvarmistuksessa kuvan koko rajataan niin, että koko dialogi mahtuu 844 px:iin: `.edition-confirm-picture img { max-block-size: 40dvh; }` (rivi 6868). Kirjaa ratkaisu UX.md:hen poikkeukseksi, jos PM hyväksyy.
- Kuvat: `S\cards-image-dialog-390-dark.png`, `S\editor-testhand-390-dark.png`, `S\cards-edition-dialog-390-dark.png`

**UX-118-15 · Have/Want: "Proxy-jonoon" on kiinni +-painikkeessa**
- Näkymä: Have/Want, want-kortit, 390 ja 1440.
- Ongelma: Linkkipainike alkaa heti keltaisen +-painikkeen reunasta ilman väliä, joten "+ Proxy-jonoon" näyttää yhdeltä painikkeelta. Lisäksi se ei ole alleviivattu, toisin kuin muut linkkipainikkeet.
- Korjaus: Siirrä `SendToProxyButton` (`HaveWantView.tsx:169`) omalle rivilleen laskurin alle tai anna sille `margin-inline-start: var(--space-3)`. Käytä standardin linkkipainikettä (aina alleviivattu, vähintään 32 px kosketusalue).
- Kuvat: `S\misc-havewant-1440-dark.png`, `S\misc-havewant-390-light.png`

**UX-118-16 · Vaihtolinkin näkymä on muotoilematon ja toisteinen**
- Näkymä: `#/vaihto/<data>`, molemmat leveydet.
- Ongelma: Sisältö on pelkkiä selaimen luettelopisteitä. "vaihdettavissa: ei yhtään" toistuu noin 20 kertaa. Otsikot vaihtelevat VERSAALEISTA ("JAKAJAN KOKOELMA") normaaliin kirjainkokoon ("Sinulla on, he haluavat"). Loppulinkki on oletusvärinen (ks. 10). Näkymä näyttää keskeneräiseltä muuhun sivustoon verrattuna.
- Korjaus: (1) Osiot `.panel`-laatikkoihin ja h3:t standardin mukaan. (2) Listat taulukoksi tai riveiksi `.card-table`-tyylillä: nimi, kpl, vaihdettavissa (luku, tyhjä tai "–" eikä toistuvaa tekstiä). (3) "Jakajan kokoelma" avattavaksi `.disclosure`-osioksi, koska vertailu on tärkein sisältö. (4) Loppuun `.button-secondary` "Avaa oma Have/Want". Koodi: `SharedTradeView.tsx`.
- Kuvat: `S\misc-trade-link-390-dark.png`, `S\misc-trade-link-1440-dark.png`

### Keskitaso

**UX-118-17 · Dialogien toimintorivit: järjestys, rivitys ja sanamuoto vaihtelevat**
- Näkymä: painosvarmistus, skanneri, pakan poisto ja ensikirjautuminen, 390.
- Ongelma: Skannerissa Peru on viimeisenä omalla rivillään, muissa ensimmäisenä. Mobiilissa painikkeet rivittyvät epätasaisesti (painosvarmistus: "PERU, LISÄÄ BETA" ja seuraavalla rivillä "LISÄÄ RETAIL"; ensikirjautuminen: kolme eri levyistä painiketta porrastettuna). Peruutus on sekä "Peru" että "Peruuta".
- Korjaus: `.confirm-dialog .row-actions`: DOM-järjestys on Peruuta ja sitten muut. `@media (max-width: 39.99rem) { .confirm-dialog .row-actions { flex-direction: column-reverse; align-items: stretch; } }`. Tekstit `scannerTexts.fi.ts:7` ja `texts.fi.ts:250` muotoon "Peruuta" (en: "Cancel"). Skannerin painikejärjestys `CardScanner.tsx`:ssä sama.
- Kuvat: `S\cards-edition-dialog-390-dark.png`, `S\coll-scanner-390-dark.png`, `S\misc-firstsignin-dialog-sim-390-dark.png`

**UX-118-18 · Dialogin sulkeminen on × tai "SULJE"**
- Näkymä: kortin tiedot ×, testikäsi "SULJE" ja skannerin virhe "SULJE".
- Korjaus: Koko näytön dialogit (kortin tiedot ja testikäsi) käyttävät `.dialog-close`-×-painiketta oikeassa yläkulmassa (`TestHandDialog.tsx`). Skannerin virhetila on vahvistusdialogi ja pitää "Sulje"-painikkeen rivissä. Tavoite: sama sulkemistapa samalle dialogityypille.
- Kuvat: `S\editor-testhand-1440-dark.png`, `S\cards-detail-1440-dark.png`

**UX-118-19 · Tyhjillä tiloilla on kolme ulkoasua ja toisteista tekstiä**
- Näkymä: Pakat tyhjä, Kokoelma tyhjä, Julkiset pakat tyhjä, Have/Want tyhjä ja Proxy tyhjä.
- Ongelma: Katkoviivalaatikko (Pakat, Julkiset), kiinteä laatikko kulmatikulla (Kokoelma) ja pelkkä teksti (Have/Want). Pakat: otsikko "EI VIELÄ PAKKOJA" ja heti perään "Sinulla ei ole vielä pakkoja." Kokoelma: samassa laatikossa kaksi ensisijaista painiketta, joista toinen on tasattu oikealle ja toinen vasemmalle.
- Korjaus: Kaikki käyttävät `.empty`-luokkaa (rivi 670). `.collection-empty` (7449) ja `.scan-prompt` (7762) sisältöineen `.empty`n sisään, ja jako on viivalla. Painikkeet tasataan vasemmalle (`.scan-prompt .button-primary { align-self: flex-start; }`). Pakoista poistetaan toistava lause (`deckTexts.fi.ts`: tyhjän tilan teksti alkaa suoraan ohjeella "Rakenna pakka…"). Have/Want: want-lista ja have-lista tyhjinä `.empty`-laatikkoon.
- Kuvat: `S\coll-decks-empty-390-dark.png`, `S\coll-collection-empty-390-dark.png`, `S\coll-havewant-empty-390-dark.png`, `S\misc-public-list-390-dark.png`

**UX-118-20 · Otsikoiden kirjainkoko ja koko vaihtelevat**
- Näkymä: kortin tiedot (Kokoelmassa, Versiot, Want-listalla, Pakoissa), Have/Want ("Lisää kortteja wantiin"), vaihtolinkki ja jaettu pakka ("Tallenna pakaksi").
- Ongelma: h3:t ilman luokkaa ovat normaalilla kirjainkoolla 21 tai 16 px, muut h3:t 16 px VERSAALEJA. h2:ta on kokoja 22, 18 ja 16 px.
- Korjaus: Perussääntö `h3` (rivi 2095): 16 px, 700, `text-transform: uppercase`, `letter-spacing: var(--letter-spacing-caps)`. Poista ylikirjoitukset `.card-dialog-details h3` (1203), `.import-layout h3` (4314), `.import-save h3` (4348) ja `.detail-collection h3` (5135). h2: `.deck-section-title` ja `.filters-heading` pysyvät 18 px:ssä (sarakeotsikko), muut h2:t 22 px. Kokoelman `.stats-card-title`-h2:t muutetaan h3-tyylisiksi samaan tapaan kuin editorissa.
- Kuvat: `S\cards-detail-1440-dark.png`, `S\coll-havewant-empty-390-dark.png`, `S\misc-trade-link-390-dark.png`

**UX-118-21 · Painikkeiden fonttikoko on 14, 16 tai 18 px**
- Näkymä: pakkakortit (AVAA, KOPIOI 14 px), testikäsi ja dialogit 16 px, muut 18 px.
- Korjaus: Poista `font-size: 0.875rem` säännöstä `.deck-row > .row-actions > button` (rivi 4227) ja korvaa se `.button-compact`-muuntimella (16 px, `padding-inline: var(--space-3)`). Muut 16 px:n poikkeukset (`.card-zoom-open` 5532, testikäsi) poistetaan tai muutetaan `.button-compact`-muuntimeksi. Tavoite: painikkeissa vain 18 px tai 16 px (compact).
- Kuvat: `S\decks-list-1440-dark.png`

**UX-118-22 · Sekakieli: "Rarity" suomenkielisessä käyttöliittymässä**
- Näkymä: Kortit, Lista (sarakeotsikko) ja järjestysvalikko sekä editorin lisäystaulukko.
- Ongelma: Suodattimissa on "HARVINAISUUS", mutta sarakkeessa ja järjestyksessä "Rarity". Cost, Power ja RAM ovat pelin termejä ja saavat jäädä.
- Korjaus: `src/ui/texts.fi.ts:143` `rarity: 'Harvinaisuus'` ja `:179` `columnRarity: 'Harvinaisuus'`.
- Kuvat: `S\cards-list-1440-dark.png`, `S\editor-legal-1440-dark.png`

**UX-118-23 · Lisää kortteja -osio: otsikko on hakurivin alla, ja näkymävalitsimen nimet poikkeavat**
- Näkymä: editori, Lisää kortteja, 390 ja 1440.
- Ongelma: Otsikko "LISÄÄ KORTTEJA" tulee hakukentän ja SUODATTIMET-painikkeen jälkeen. Valitsin on "Rivit | Kuvat", kun Kortit-sivulla sama asia on "Kuvat | Lista".
- Korjaus: Siirrä h2 hakurivin yläpuolelle (`DeckEditor.tsx`, hakusarake). Valitsimen nimet ovat "Kuvat" ja "Lista" kaikkialla ja järjestys "Kuvat | Lista" (`deckTexts.fi.ts`, Rivit → Lista; en: "Rows" → "List").
- Kuvat: `S\editor-add-tab-390-dark.png`, `S\editor-legal-1440-dark.png`

**UX-118-24 · Sideboard-painike tekee eri asian eri näkymissä**
- Näkymä: editorin pakkasarake, Lista ("→ SB" siirtää) vs. Kortit ja Pinot ("+ SB" lisää kopion).
- Ongelma: Samassa pakassa sama paikka käyttäytyy eri tavalla näkymän mukaan.
- Korjaus: Pakkasarakkeen kaikissa näkymissä käytetään siirtoa ("→ SB" / "→ Pää", `moveToSideboardShort`). "+ SB" jää vain hakutulosten puolelle (`DeckList.tsx` `stack-card-actions`, rivi 183).
- Kuvat: `S\editor-view-kortit-390-dark.png`, `S\editor-legal-390-dark.png`

**UX-118-25 · Kokoelman yleiskuva: valtavat tyhjät KPI-laatikot ja 11 px:n teksti**
- Näkymä: Kokoelma, Yleiskuva, 1440 (ja 390 pieni teksti).
- Ongelma: Kopioita- ja Täysiä pelisarjoja -laatikot venyvät noin 590 px leveiksi kahdelle luvulle. Aputeksti (`.kpi-hint`) on 11 px ja otsikko (`dt`) 12 px.
- Korjaus: `.kpi-tiles { grid-template-columns: repeat(auto-fill, minmax(12rem, 16rem)); }` (rivit 5913 ja 8570). `.kpi-tiles .kpi-hint { font-size: 0.875rem; }` (5944) ja `.kpi-tiles dt { font-size: 0.875rem; }` (5929). Tavoite: ei alle 14 px:n tekstiä.
- Kuvat: `S\coll-overview-1440-dark.png`, `S\coll-overview-390-light.png`

**UX-118-26 · Vaalea teema: tyyppipalkin luku on vaaleaa tekstiä oliivilla (kontrasti 2.7:1)**
- Näkymä: editori, Tilastot, Tyypit, vaalea teema.
- Ongelma: `.type-bar-seg { color: var(--color-bg) }` (rivi 6225) antaa vaalealla teemalla tekstin #f3f0e6 taustalle #b38f00, eli 2.7:1 (alle 4.5).
- Korjaus: `:root[data-theme='light'] .type-bar-seg { color: var(--color-on-accent); }` tai segmenttikohtainen tekstiväri, jonka kontrasti on vähintään 4.5:1. Tarkista kaikki kolme segmenttiväriä molemmissa teemoissa.
- Kuvat: `S\probe-typebar-1440-light.png`

**UX-118-27 · Proxy: saman kortin versioita ei erota toisistaan**
- Näkymä: Proxy, Valitse kortit, molemmat leveydet.
- Ongelma: Kolme ruutua nimellä "V / Streetkid" ilman versiotietoa, ja eroja näkee vain kuvasta.
- Korjaus: Ruudun nimen alle versiomerkintä samalla tavalla kuin kortin tiedoissa: harvinaisuussymboli ja nimi (esim. "Iconic Rare") tai setti ja numero `.set-chip`-tyylillä (`ProxyView.tsx`).
- Kuvat: `S\misc-proxy-390-dark.png`, `S\misc-proxy-1440-light.png`

**UX-118-28 · Kortin tiedot: virheteksti näkyy ilman käyttäjän toimintaa**
- Näkymä: kortin tiedot, kortti jolla on versioerittely, molemmat leveydet.
- Ongelma: "Kokonaismäärä ei voi olla pienempi kuin versioiden summa. Vähennä ensin jotain versiota." näkyy pysyvästi, vaikka käyttäjä ei ole tehnyt mitään. Se näyttää virheeltä.
- Korjaus: Näytä teksti vasta, kun käyttäjä painaa estettyä −-painiketta (toast tai `aria-live`-viesti kuten muissa rajoissa), tai muotoile se neutraaliksi vihjeeksi `.hint`-tyylillä. Koodi: `CatalogView.tsx` (detail-collection).
- Kuvat: `S\cards-detail-1440-dark.png`, `S\cards-image-dialog-390-dark.png`

**UX-118-29 · Hakukentän label-käytäntö vaihtelee**
- Näkymä: Kortit, Proxy ja editori (placeholder "Hae nimellä…", ei näkyvää labelia) vs. Have/Want (näkyvä "HAE KORTIN NIMELLÄ" -label ja tyhjä kenttä).
- Korjaus: Have/Want noudattaa samaa kuin muut: visuaalisesti piilotettu label ja placeholder "Hae nimellä…" (`HaveWantView.tsx:181`). Päivitä UX.md 3.4:n tekstikenttäkohta: hakukentässä näkyvä label saa olla piilotettu, muissa kentissä ei.
- Kuvat: `S\coll-havewant-empty-390-dark.png`, `S\cards-list-390-dark.png`

**UX-118-30 · Editori: "Tulosta puuttuvat proxyiksi" ylimpänä toimintona, ja proxytoiminto on kahdesti**
- Näkymä: editori, 390 ja 1440.
- Ongelma: Toissijainen toiminto on heti nimen alla ennen välilehtiä ja pakkaa. Pakan alaosassa on lisäksi "LÄHETÄ PAKKA PROXY-JONOON". Kaksi lähes samaa toimintoa kahdessa paikassa.
- Korjaus: Siirrä "Tulosta puuttuvat proxyiksi" pakan alaosaan "Lähetä pakka proxy-jonoon" -painikkeen viereen samaan `.row-actions`-riviin, tai vientivalikkoon (Vie ja jaa). Nimen alla on silloin vain nimi, tallennustila ja vientivalikko.
- Kuvat: `S\editor-legal-390-dark.png`, `S\editor-legal-1440-dark.png`

**UX-118-31 · Suodatinchipit ovat 28 tai 32 px korkeita**
- Näkymä: Kortit, suodattimet (tyyppi, väri ja harvinaisuus 28 px; cost, power ja RAM 32 px).
- Korjaus: `.option { min-height: 2rem; }` (rivi 768), jolloin kaikki chipit ovat 32 px. `.option-number` (2259) ei tarvitse omaa korkeutta.
- Kuvat: `S\cards-list-1440-dark.png`, `S\cards-filters-open-390-dark.png`

### Matala

**UX-118-32 · Pyöristetyt elementit kulmaviisteteemassa**
- `.proxy-card-remove` `border-radius: 50%` (7219) → 28 × 28 suorakulmio `--shape-chamfer`-viisteellä ja `--cut: 0.375rem`. `.pocket-count` `999px` (8096) → 0. `.art-count-badge` `4px` (4908) → 0, ja tokenit `--surface` ja `--text` korvataan tokeneilla `--color-bg` ja `--color-text`. `.nav-badge` (Proxy-laskuri yläpalkissa) → neliö.
- Kuvat: `S\misc-proxy-1440-light.png`, `S\coll-binder-1440-dark.png`

**UX-118-33 · Vaalea teema: keltainen ohut reunaviiva Legend-merkissä**
- Keltaisten Legendien `LEGEND`-merkin reuna on keltainen vaalealla taustalla, mikä rikkoo UX.md 3.1:n sääntöä ("keltainen vain täyttönä"). Korjaus: `:root[data-theme='light'] .type-badge-yellow { border-color: var(--color-text); }` tai merkin tekstin ja reunan väriksi tummempi `--color-card-yellow`.
- Kuvat: `S\probe-typebar-1440-light.png` (Rogue Amendiares, Dum Dum)

**UX-118-34 · "LÄHETÄ KAIKKI WANT-KORTIT PROXY-JONOON" katkeaa sanan keskeltä 390:llä**
- `overflow-wrap: anywhere` katkaisee "PROXY-/JONOON". Korjaus: lyhyempi teksti "KAIKKI PROXY-JONOON" (`proxyTexts.fi.ts`) tai `overflow-wrap: break-word` tälle painikkeelle.
- Kuvat: `S\misc-havewant-390-dark.png`

**UX-118-35 · "Lisää puuttuvat wantiin" on sisennetty 4 px**
- `.missing-link { padding: 0 4px }` (4587) siirtää tekstin irti muusta sisällöstä. Korjaus: `padding-inline: 0`.
- Kuvat: `S\decks-list-1440-dark.png`

**UX-118-36 · "Ei löydy" -tilat ovat erilaisia**
- Tuntematon oma pakka näyttää punaisen ilmoituslaatikon. Tuntematon julkinen pakka näyttää h1:n ja oletusvärisen linkin. Tuntematon kortti (`#/kortti/ei-olemassa`) ohitetaan hiljaa. Korjaus: kaikki käyttävät `.notice-danger`-laatikkoa ja `.text-link`-paluulinkkiä. Tuntemattomasta kortista näytetään sama ilmoitus ("Korttia ei löytynyt").
- Kuvat: `S\misc-unknown-deck-390-dark.png`, `S\misc-public-deck-1440-dark.png`, `S\cards-unknown-390-dark.png`

**UX-118-37 · Sanamuoto: "Kortit-sivulle" vs. "Kortit-osioon"**
- Vaihtolinkki: "Siirry Kortit-sivulle". Kokoelma tyhjä: "Siirry Kortit-osioon". Korjaus: "Siirry Kortit-osioon" kaikkialla (navigaation termi on osio).
- Kuvat: `S\misc-trade-link-1440-dark.png`, `S\coll-collection-empty-390-dark.png`

**UX-118-38 · Proxy: vaiherivi rivittyy ja painikerivi on keskitetty**
- 390:llä vaihenuoli "→" jää rivin loppuun. Korjaus: jokainen vaihe on `white-space: nowrap` -elementti, ja nuoli kuuluu seuraavaan vaiheeseen. "TULOSTA" ja "TYHJENNÄ JONO" on keskitetty, kun muualla painikerivit ovat vasemmalla. Korjaus: `justify-content: flex-start`.
- Kuvat: `S\misc-proxy-390-dark.png`, `S\misc-proxy-1440-light.png`

**UX-118-39 · Nuolisymbolit vaihtelevat**
- Kansio ◀ ▶ (emoji-tyyliset kolmiot), versionvaihto ‹ ›, Tuo-valikko SVG-chevron. Korjaus: kaikki SVG-chevroneiksi samalla viivapaksuudella kuin `button-caret` (`CollectionBinder.tsx`, `CardImage.tsx`).
- Kuvat: `S\coll-binder-1440-dark.png`, `S\cards-images-390-dark.png`

**UX-118-40 · Pakkakortin kaksirivinen nimi rivittyy väljästi**
- `h2.deck-name` on kahdella rivillä 70 px korkea (rivikorkeus noin 1.6). Korjaus: `.deck-row .deck-name { line-height: var(--line-height-heading); }` (4167).
- Kuvat: `S\decks-list-1440-dark.png`

**UX-118-41 · Vajaa pakka: Lista/Pinot/Kortit-valitsin hyppää omalle rivilleen**
- Kun Pääpakka-otsikossa on varoitus "⚠ alle 40", valitsin rivittyy otsikon alle, kun laillisessa pakassa se on samalla rivillä. Korjaus: valitsin aina omalle rivilleen otsikon alle tai otsikko ja valitsin `flex-wrap: nowrap` ja varoitus otsikon alle.
- Kuvat: `S\editor-partial-390-dark.png`, `S\editor-legal-390-dark.png`

**UX-118-42 · Yläpalkki 768 px:llä ja hakukenttä 320 px:llä**
- 768:lla teema-, kieli- ja tilikuvakkeet rivittyvät yksin toiselle riville oikealle. 320:lla placeholder leikkautuu ("Hae nimell"). Korjaus: yläpalkin työkalut samalle riville navigaation kanssa 640–900 px:llä (navigaatiolinkkien `padding-inline` pienemmäksi), ja 320:lla SUODATTIMET-painike vain ikoniksi tai placeholder "Hae…".
- Kuvat: `S\sweep-header-768.png`, `S\sweep-header-320.png`

**UX-118-43 · ×N-laskurilla on kolme ulkoasua**
- Editorin listassa keltainen mono ilman taustaa, pinoissa keltainen suorakulmio ja kansiossa keltainen pilleri. Korjaus: kuvan päällä (pinot ja kansio) sama `.stack-card-count`-tyyli (keltainen suorakulmio), listassa teksti. Pilleri poistuu (ks. 32).
- Kuvat: `S\coll-binder-1440-dark.png`, `S\editor-view-pinot-390-dark.png`

---

## Seuraava askel (vaihe 2)

1. Toteuta ensin standardin yhteiset luokat (`.segmented`, `.button-danger`, `.button-compact`, `.step--compact`, `.disclosure`, `.file-input`, `a` / `.text-link`, `.panel`, `.empty`) ja poista korvatut säännöt. Sen jälkeen suurin osa löydöksistä 06–08, 10–13, 19–21, 31 ja 43 korjautuu samalla.
2. Korjaa kriittinen 01 ja rikkinäiset 02–05 erikseen ja testaa.
3. Päätettävät asiat käyttäjälle: UX-118-09 (kelluva skannauspainike pois vai pidetään) ja UX-118-14 (mobiilidialogit koko näytön sivuiksi).
4. Lopuksi kuvakaappaukset samoista tiloista samalla skriptillä (`scratchpad\run.mjs <leveys> <teema> <ryhmä>`, ryhmät cards, coll, decks, editor ja misc) sekä vaakavieritys- ja vieritysalueskannaukset (`sweep.mjs`, `scrollscan.mjs`).
