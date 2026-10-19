# T-181 · Visuaalinen uudistus: tiivis, staattinen Cyberpunk (paketit 0–6)
**Tila:** Paketit 0 ja 1 Done (testissä 2026-10-19), seuraavaksi paketti 2 · **Omistaja:** Koodari (paketeittain) · **Lähde:** `docs/reports/UX-T181-kokonaiskatselmointi.md`, päätökset D-038 (R1–R9)
**Katselmoinnit:** PM esikatselusta. Paketti 1: ei riippuvuuksia, tallennusta, sääntöjä eikä workflowta, joten Digiturvaa ei tarvita. Paketti 6 tallentaa pakkoja: dev-testaus (D-029) ja Digiturvan kevyt katselmointi.

## Määrittely (PM)
Käyttäjän tavoite: "blown away": tyylikäs, tiivis, sujuva ja Cyberpunk, ei koskaan käytettävyyden kustannuksella. Glitch-otsikot säilyvät, mutta uusia liikkuvia koriste-elementtejä ei tule (vain toiminnalliset hover-, press- ja focus-siirtymät ≤ 150 ms, `prefers-reduced-motion` kunnioitetaan). Ei sisäistä vieritystä, ei vaakaylivuotoa 320 px:ssä, AA-kontrasti molemmissa teemoissa.

Paketit (raportin luku C): 0 skannerin mobiilikorjaus (tehty, T-181-0) · **1 globaali design-järjestelmä** · 2 Kortit ja korttiruudukko · 3 Kokoelma · 4a Pakat-lista · 4b Pakkaeditori · 5a Testaa · 5b Have/Want ja Proxy · 6 Premium-merkinnät ja pakkaan lisäys. Näkymäpaketit tehdään rinnakkain omiin `src/styles/*.css`-tiedostoihin.

### Paketti 1 (raportin luku A, luvun C rivi 1)
Tokenit, tausta, typografia, painikkeet (+ `.button-quiet`, `.icon-button`), kentät, segmentit (+ `--sm`), chipit, osio (`.panel`) ja `.object`, dialogit, taulukon perustyyli, linkit, yläpalkki ja mobiilinavi, alatunniste, `.page-head`, tyhjä tila ja notice sekä `src/styles/`-runko. UX.md luku 3 päivitetään. Vanhat token-nimet jäävät aliaksiksi.

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
