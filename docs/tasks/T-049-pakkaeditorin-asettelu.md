# T-049 · Pakkaeditorin asettelu ja pakkalistan ulkoasu
**Tila:** Review · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02: "ei optimaalista tilankäyttöä, pakkalista ei tyylikäs, katso mallia muista ja tee parempi")
**Malli:** D-014. Ei uutta riippuvuutta eikä tietomallia. PM tarkistaa kuvakaappauksista.
**Haara:** `t-049-pakkaeditorin-asettelu`

## Ongelma
Pakkaeditori on 56rem:n sarakkeessa myös 2800 px:n näytöllä. Yhteenveto vie ison laatikon ylhäällä, hakutuloksissa on vain 2 korttia rinnakkain, ja pakkalistan rivit ovat isoja laatikoita (nimi, metarivi ja isot +/- napit).

## Mallit
Moxfield, Archidekt ja Netdeck: tiivis pakkalista (määrä, nimi, hinta oikealla, väriraita) tyypeittäin ryhmiteltynä, kustannuskäyrä ja korttipoimija leveässä ruudukossa.

## Hyväksymiskriteerit
1. **Leveys:** pakkaeditorinäkymä saa leveämmän rajan (esim. `--editor-max-width: 100rem`). Muut näkymät pysyvät ennallaan.
2. **Asettelu ≥ 75rem:** `editor-layout` on kaksi saraketta. Vasemmalla ovat haku, suodattimet ja tulosruudukko (`grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr))`, eli monta korttia rinnakkain). Oikealla on pakkasarake (noin 24–28rem), joka on `position: sticky` ja jolla on oma vieritys (`max-height: calc(100vh - X)`, `overflow:auto`). Suodattimet voivat olla tulosten yläpuolella tiiviinä. Alle 75rem pinotaan kuten nyt. Mobiili 320 px ei saa vierittyä vaakasuunnassa.
3. **Yhteenveto pakkasarakkeen yläosaan, tiiviinä:** laskurit rivinä (Legendit 1/3 · Pääpakka 7/40–50 · puuttuu 7), ongelmat lyhyenä listana kuten nyt (role/alert-semantiikka säilyy) ja **kustannuskäyrä**. Käyrä on pieni pylväskaavio pääpakan korttimääristä hinnoittain 0–6+, CSS-pylväät ja jokaisen pylvään määrä näkyvissä. Ruudunlukijalle sama tieto tekstinä tai visually-hidden-taulukkona. Iso yhteenvetolaatikko editorin yläpuolelta poistuu.
4. **Pakkalistan rivi (tiivis, noin 2rem):**
   - Vasemmalla kortin värin ohut raita (sama väri kuin tyyppimerkissä).
   - Määrä muodossa "3×", nimi yhdellä rivillä (alaotsikko himmeämpänä ja ellipsoituna) ja hinta oikealla pienenä merkkinä.
   - Puuttuva kortti näkyy pienenä merkkinä (esim. "puuttuu 2" tai värikoodi ja teksti, ei pelkkä väri).
   - −/+ ovat pienet (vähintään 24×24 px, WCAG 2.5.8), ja niiden aria-labelit säilyvät.
   - Metarivi (Unit · Red · Cost …) poistuu näkyvistä, mutta kortin nimeä painamalla tai fokuksella avautuu kortin kuva (olemassa oleva kuvadialogi) tai `title`.
   - Ryhmäotsikot "Unit (7)" pysyvät, tiivisti.
5. **Hakutuloskortti (Kuvat-näkymä):** pitkä vihjeteksti ("Pakassa on jo 3 kopiota. Voit silti lisätä kortin.") korvataan pienellä merkillä kuvan päällä tai alla ("3 pakassa"). Koko teksti säilyy ruudunlukijalle (aria-describedby).
6. Tekstit `deckTexts.ts`:ään. Olemassa olevat testit päivitetään vain teksti- ja rakennemuutosten osalta, logiikkatestejä ei heikennetä. Kustannuskäyrälle tehdään puhdas funktio ja testi. `npm test`, lint ja build läpi. CHANGELOG `[Julkaisematon]`.
7. **Kuvakaappaukset** headless Chromella (`vite preview`), 1600×1000 ja 375×800, pakkaeditori jossa on muutama kortti. Tallennetaan scratchpadiin, ei repoon, ja polut kerrotaan luovutuksessa.

## Rajaukset
- DeckEditor.tsx:n pilkkominen (T-041): saa siirtää osia omiin komponentteihin (esim. `DeckList.tsx`, `CostCurve.tsx`), mutta laajaa refaktorointia ei tehdä.

## Luovutukset

### Luovutus (Koodari)
Toteutettu hyväksymiskriteerit 1–7: `--editor-max-width: 100rem` (vain pakkanäkymä), kaksi saraketta ≥75rem (sticky pakkasarake, oma vieritys), yhteenveto pakkasarakkeen yläosaan, kustannuskäyrä (`costCurve` + testi, `CostCurve.tsx`, visually-hidden-taulukko), tiivis pakkarivi (`deck-line`: väriraita, `3×`, nimi joka avaa kuvadialogin, `puuttuu N`, Cost-merkki, 24 px −/+), hakutuloksen "N pakassa" -merkki Kuvat-näkymässä (koko vihje visually-hidden + aria-describedby + title). Tekstit `deckTexts.ts`:ssä. Testejä päivitetty vain rakenteen osalta (puuttuu-merkki), lisätty 3 testiä. CHANGELOG päivitetty.
Kuvakaappaukset (scratchpad, ei repoon): 1600×1000 dark/light/images, 2800×1400, 375×800; ei vaakavieritystä 375 px:ssä.
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 2 (mobiilissa yhteenveto on hakulistan jälkeen; suodatinpaneeli on edelleen iso).
