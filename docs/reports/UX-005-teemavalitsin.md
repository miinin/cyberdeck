# UX-005 · T-025 Teemavalitsin: UX-katselmointi
**Päivä:** 2026-10-02 · **Katselmoija:** UX Designer · **Tehtävä:** T-025 · **PR:** #7 (haara `t-025-teemavalitsin`) · **Vertailu:** UX.md luku 8 (v0.9), tarkistuslista 8.9

## Yhteenveto
**Ei blokkaavia löydöksiä. Veto: ei.** Toteutus vastaa määrittelyä. Kaikki 8.9:n kohdat täyttyvät lukuun ottamatta kahta, joita ei voitu tarkistaa tässä ympäristössä (ruudunlukija, selaimen oikea zoom). Löydökset ovat Low-tasoa tai tiedoksi.

| Vakavuus | Määrä |
|---|---|
| Critical / High / Medium | 0 |
| Low | 3 (UX-005-1 … UX-005-3) |
| Tiedoksi | 2 |

## Miten katselmoitu
- PR #7:n esikatselu-URL ei ollut käytettävissä (GitHub Actions -ajo `build_and_preview` oli vielä kesken, PR:ssä ei kommentteja). Katselmointi tehtiin siksi paikallisesti: `vite build` haaran koodista (ulostulo scratchpadiin, pääkansion `dist` koskematta) ja oma pieni staattinen palvelin. Palvelin lähetti `firebase.json`in CSP-otsakkeen (ilman `upgrade-insecure-requests`, joka ei sovi `http://127.0.0.1`:een). Palvelin ja Chrome suljettiin koodista (`srv.close()`, `browser.close()`), omalla `--user-data-dir`illä.
- Chrome headless (puppeteer-core), axe-core 4.x (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`), laitteen asetus emuloitu `prefers-color-scheme: light`.
- Leveydet 320, 375, 640 ja 1280 px.
- Esikatselu-URL:n CSP-otsakkeet (oikea Firebase Hosting) ja julkaisun jälkeinen toiminta tarkistetaan vielä PM:n toimesta tai uudelleen esikatselussa.

## Tulokset

### Määrittelyn vertailu (8.9)
| Kohta | Tulos |
|---|---|
| `<button type="button">` `<header>`issa, ei uutta otsikkoa eikä maamerkkiä | Kunnossa. Maamerkit: header, main, footer, yksi `h1` "Kortit". `<title>` "Kortit · Cyberdeck", `lang="fi"`. |
| Saavutettava nimi `Vaalea teema` kaikilla leveyksillä, `aria-pressed` aina olemassa, nimi ei vaihdu | Kunnossa. Saavutettavuuspuu: `button "VAALEA TEEMA" pressed=false` 320 px:ssä ja 1280 px:ssä (Chrome antaa nimeen `text-transform`in mukaisen kirjainkoon, ei toteutusvirhe). Ikoni `aria-hidden="true"`, `focusable="false"`. |
| Ei live-aluetta, fokus pysyy, sama elementti | Kunnossa. Enter ja väli: fokus pysyy painikkeessa (`activeElement` = `.theme-toggle`). |
| Sarkaimella ensimmäinen pysähdys, Enter ja väli vaihtavat | Kunnossa. |
| Fokusrengas 3 px `--color-accent-2`, ei leikkaudu | Kunnossa. Mitattu `outline: 3px solid rgb(31,224,255)`, offset 3 px, `clip-path: none`. Kuvakaappaus 320 px:ssä: rengas näkyy kokonaan, oikea reuna ruudun sisällä (304 + 6 = 310 < 320). |
| Kosketusalue 44 × 44 px | Kunnossa. Mitattu korkeus 44 px, leveys 108 px (< 40 rem) ja 160 px (≥ 40 rem). |
| Ei vaakavieritystä 320 px, 200 % ja 400 % | Kunnossa (ks. alla). |
| Hover ei pelkkä väri, tila ei pelkällä värillä | Kunnossa. Hover alleviivaa. Pressed = täytetty aurinko ja täytetty tausta. Todettu myös `forced-colors: active` -tilassa (CDP-emulointi): reuna 2 px `ButtonText`, painettu tila näkyy täytetystä ikonista. |
| axe molemmissa teemoissa | 0 rikkomusta tummassa ja vaaleassa, 320 ja 1280 px. `incomplete: color-contrast` (taustakuvat ja gradientit, axe ei laske). Ei mitattu eikä korvattu mittauksella: kontrastit nojaavat UX.md 8.5:n laskentaan. Visuaalinen tarkistus kuvakaappauksista: teksti, ikoni ja reunat selvästi erottuvia kummassakin tilassa. |
| `prefers-reduced-motion`, ei omaa teemanvaihtoanimaatiota | Kunnossa teeman osalta (ks. UX-005-2 ja Tiedoksi 1). |
| Ei `style`-attribuutteja eikä inline-skriptiä, `theme-init.js` ennen tyylitiedostoa | Kunnossa. `dist/index.html`: `<script src="/theme-init.js">` ennen moduuliskriptiä ja tyylitiedostoa. CSP voimassa koko ajon: ei CSP-virheitä konsolissa, `theme-init.js` ajautui (`script-src 'self'`). |
| Tallennettu `light` → ensimmäinen piirto vaalea | Kunnossa. Uudelleenlatauksella teema vaalea (`data-theme=light`, tausta `rgb(243,240,230)`, `localStorage` = `light`). Koodari mittasi myös viivästetyllä JS-paketilla (luovutus). Tuntematon arvo (`banana`) → tumma, arvoa ei korjata. |
| Oletus tumma laitteen asetuksesta riippumatta | Kunnossa. Laite emuloitu vaaleaksi, ensimmäinen käynti tumma kaikilla leveyksillä (`rgb(11,12,16)`). |

### Heuristinen arviointi (Nielsen)
- **Järjestelmän tila:** tila näkyy kolmella tavalla (täytetty ikoni, täytetty tausta, `aria-pressed`). Teema vaihtuu heti.
- **Johdonmukaisuus:** painike käyttää samaa reunan ja täytön rakennetta kuin muut painikkeet. Fokus ja hover samat kuin muualla.
- **Hallinta ja vapaus:** vaihto kumottavissa samalla painikkeella.
- **Minimalismi:** yksi kontrolli, ei ylimääräistä.
- **Yksi huomio (tiedoksi):** painikkeen nimi on "Vaalea teema" ja tila "painettu" = vaalea. Näkönäkökulmasta ensikertalainen voi epäröidä, mitä painettu tarkoittaa, mutta täytetty aurinko ja vaalea sivu kertovat sen heti. Ei toimenpidettä.

### Tarkistukset erikseen
- **Näppäimistöpolku:** Tab → painike (ensimmäinen pysähdys) → Enter vaihtaa vaaleaksi → väli vaihtaa tummaksi → väli vaaleaksi. Fokus pysyy. Valinta säilyy uudelleenlatauksessa.
- **320 px:** otsikkopalkki kahdella rivillä (korkeus 110 px), painike omalla rivillään oikeassa reunassa, `scrollWidth` 320 = `clientWidth` 320. 375 px:ssä ja sitä leveämmällä yksi rivi (69 px).
- **200 % tekstikoko (juurifontti) 320 px:ssä:** `scrollWidth` 320, ei vaakavieritystä, painike 108 × 44 px.
- **400 % zoom:** vastine 320 CSS px:n näkymä, sama tulos kuin 320 px:ssä. Selaimen oikeaa zoomia ei ajettu.
- **Tekstin välistys (1.4.12: rivikorkeus 1.5, kirjainväli 0.12 em, sanaväli 0.16 em):** 320 px:ssä ei vaakavieritystä, ei katkeavaa tekstiä, otsikkopalkki 69 px.
- **Forced-colors:** painike näkyy reunallisena (2 px), ikoni `currentColor`, tila erottuu.
- **Robustisuus:** tuntematon tallennettu arvo → tumma. Konsolissa ei virheitä.

### Koodarin DOM-poikkeaman arvio (kääre-`span`)
**Hyväksytty.** Määrittelyn rakenne (`<span>Vaalea</span><span class="theme-toggle-suffix"> teema</span>`) toimii selaimissa, jotka laskevat nimen CSS-laatikkojen mukaan, mutta flex-`gap` (`--space-2`) ja `dom-accessibility-api` (testit) antavat nimeksi "Vaaleateema". Toteutuksen rakenne (yksi kääre, välilyönti omana tekstisolmunaan) on paras tunnettu ratkaisu: nimi on "Vaalea teema" Chromen saavutettavuuspuussa ja testikirjastossa, ja ikonin ja tekstin väli säilyy `gap`illa. Toteutus tuottaa täsmälleen saman visuaalisen ja ääni-ilmaisun kuin määrittely. Päivitin UX.md 8.4:n DOM-esimerkin vastaamaan toteutusta. Ei vaikutusta Koodarin tehtävään.

### 320 px:n rivitys
**Hyväksytty (8.3 sallii).** Mittaus: nimi 144,4 px + painike 107,7 px + merkki ja välit = noin 294 px > 288 px. Vaihtoehtoja ei tarvita: ratkaisu on selkeä (painike omalla rivillään, oikeassa reunassa, 44 px korkea), ei vaakavieritystä ja palkki kasvaa vain 41 px. Yksirivinen 320 px vaatisi nimen tai painikkeen pienentämistä (kosketusalue tai kirjainväli), mikä olisi huonompi kauppa. Pienintä leveyttä, jolla yksi rivi mahtuu, ei mitattu tarkasti. 375 px mahtuu varmasti.

## Löydökset

### UX-005-1 · 320 px:n otsikkopalkki kahdella rivillä, painike yksin omalla rivillään · Low
**Sijainti:** `.site-header .container` · **Tehtävä:** T-025
**Toistaminen:** 1) Avaa sivu 320 px:n leveydellä. 2) Katso otsikkopalkkia.
**Odotettu:** yksi rivi (UX.md 8.3 tavoite) · **Havaittu:** kaksi riviä, korkeus 110 px, painike omalla rivillään oikealla.
**Vaikutus:** palkki vie 41 px enemmän pystytilaa pienimmällä näytöllä. Toiminta ei kärsi.
**Korjausehdotus:** ei toimenpidettä. Määrittely salli tämän. Jos halutaan yksi rivi, vaihtoehto on nimen kirjainvälin kaventaminen ≤ 320 px:ssä (kosketusalueeseen ei kosketa), mutta se vaatii erillisen päätöksen.
**Tila:** Hyväksytty (ei muutosta).

### UX-005-2 · Lomakekontrollien 0,12 s:n siirtymä näkyy teeman vaihdossa · Low
**Sijainti:** `src/styles.css` `@media (prefers-reduced-motion: no-preference)` -lohko (rivit noin 1183–1203) · **Tehtävä:** T-025 (T-021:n siirtymät)
**Toistaminen:** 1) Ota käyttöön `prefers-reduced-motion: no-preference`. 2) Paina "Vaalea teema" ja katso kuvaa heti painalluksen jälkeen.
**Odotettu:** teema vaihtuu heti (UX.md 8.5: ei omaa animaatiota). · **Havaittu:** sivupinnat vaihtuvat heti, mutta painikkeet (`.button-secondary`, `.step`, `.theme-toggle`), valintaruudut (`.option`) ja hakukenttä häivytetään 120 ms. Mitattuja siirtymiä noin 600 kpl 151 kortin listalla. Kuvakaappaus 120 ms:n sisällä näyttää väliaikaisen välitilan.
**Vaikutus:** kosmeettinen, alle 0,15 s, ei vilkkumista. Ei estä käyttöä.
**Korjausehdotus:** valinnainen: lisää siirtymä-säännöt vain `:root:not([data-theme-changing])`-tyylisellä rajauksella, tai hyväksy 120 ms:n pehmennys. Ehdotus: hyväksy, koska pehmennys on lyhyt ja johdonmukainen hover-siirtymien kanssa.
**Tila:** Avoin (backlog, ei blokkaa).

### UX-005-3 · Reduced-motion-sääntö tekee jokaisesta elementistä mikrosiirtymän · Low
**Sijainti:** `src/styles.css` `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { transition-duration: 0.01ms !important; … } }` · **Tehtävä:** T-021 (ei T-025)
**Toistaminen:** 1) Ota käyttöön `prefers-reduced-motion: reduce` (headless Chrome käyttää sitä oletuksena). 2) Paina "Vaalea teema" ja lue `getComputedStyle(document.body).backgroundColor` heti perään.
**Havaittu:** `data-theme="light"` on jo asetettu, mutta `backgroundColor` palauttaa vielä vanhan arvon. Syy: `0.01ms` ei ole nolla, joten selain käynnistää siirtymän (noin 4 500 siirtymää 151 kortin listalla), ja ensimmäinen kysely samassa tehtävässä näkee alkuarvon. 400 ms myöhemmin arvo on oikea. Kyse ei ole käyttäjälle näkyvästä viiveestä: 0,01 ms päättyy ennen seuraavaa kuvaa.
**Vaikutus:** ei näkyvä. Selittää Digiturvan ja PM:n havainnon "tausta oli heti painalluksen jälkeen vielä tumma". Aiheuttaa lisäksi turhia siirtymäobjekteja ja voi hämätä testejä, jotka lukevat tyylit heti.
**Korjausehdotus:** `transition: none !important` (tai `transition-duration: 0s !important`) `reduce`-säännössä. Pieni, oma tehtävä tai korjaus seuraavan tyylimuutoksen yhteydessä. Ei T-025:n vika.
**Tila:** Avoin (backlog, ei blokkaa).

### Tiedoksi
1. **Havainto "tausta tumma heti painalluksen jälkeen" (PM:n lisäkysymys):** syy on UX-005-3, ei oikea ongelma. Kun `prefers-reduced-motion` on `no-preference`, `body` ei siirry lainkaan (sivupinnoilla ei ole siirtymää), ja kuva vaihtuu samassa kuvassa kuin `data-theme`. Reduce-tilassa siirtymä on 0,01 ms. Kummassakaan tapauksessa käyttäjä ei näe tummaa viivettä.
2. **Ei tarkistettu:** oikea ruudunlukija (NVDA/VoiceOver) eikä selaimen oma 200 %/400 % zoom (korvattu 320 px:n ja juurifontin mittauksella), oikea Firebase Hostingin CSP esikatselu-URL:ssa (paikallinen palvelin lähetti saman CSP:n), kontrastien mittaus selaimessa (axe `incomplete`).

## Suositus
Hyväksy UX:n osalta. Ei avoimia blokkaavia löydöksiä. Low-löydökset kirjataan backlogiin PM:n harkinnan mukaan (UX-005-2 ja UX-005-3 voi yhdistää yhdeksi pieneksi tyylitehtäväksi).
