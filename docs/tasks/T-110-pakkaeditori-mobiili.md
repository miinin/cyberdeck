# T-110 · Pakkaeditori mobiilissa: Pakka | Lisää kortteja

**Tila:** Ready. **Haara:** `t-110-pakka-mobiili` (testistä). **Päättäjä:** käyttäjä (palaute 2026-10-08: "avaa pakka → miljoona riviä lisättäviä kortteja, pakka vasta rullauksen jälkeen"), PM (ratkaisu).

## Ongelma
Alle 64rem leveydellä editorin osiot ovat allekkain järjestyksessä suodattimet, hakutulokset ja pakka. Avattu pakka näyttää siis ensin koko korttikatalogin.

## Ratkaisu (PM)
- **Välilehdet alle 64rem leveydellä** (`useMediaQuery('(max-width: 63.999rem)')` tai vastaava olemassa oleva kysely): heti editorin otsikkorivin alla on kaksiosainen valitsin "Pakka (36/40)" | "Lisää kortteja". Toteuta se WAI-ARIA-välilehtinä tai `aria-pressed`-painikepareina, sama tyyli kuin olemassa olevilla segmenttivalitsimilla (`view-select`).
  - **Pakka:** näytetään vain `.editor-side`. Pakan yläosaan, osion alkuun, tulee iso painike "+ Lisää kortteja".
  - **Lisää kortteja:** näytetään `.editor-filters` ja `.editor-search`. Nykyinen `.deck-bar` (pakan tila ja "Näytä pakka") jää alareunaan, ja sen painike vaihtaa Pakka-välilehdelle ja vierittää sivun ylös.
  - **Oletus:** Pakka, paitsi tyhjälle pakalle (0 korttia main- ja legend-osiossa) Lisää kortteja. Valintaa ei tarvitse muistaa.
  - **Vaihto vierittää** sivun editorin alkuun, ja fokus siirtyy järkevästi.
  - Piilotettu osio poistetaan näkyvistä `hidden`-attribuutilla tai renderöimättä, mutta tila (suodattimet, haku) säilyy välilehteä vaihdettaessa.
- **Vähintään 64rem leveydellä** asettelu pysyy ennallaan, eikä valitsinta näytetä.
- Pakkaosion "← Takaisin hakuun" ja hakuosion "Siirry pakkaan" (`focus-reveal`) vaihtavat mobiilissa välilehteä.
- Tekstit lisätään `deckTexts.fi.ts`- ja `deckTexts.en.ts`-tiedostoihin.

## Hyväksymiskriteerit
- Puhelimessa korttejaan sisältävä pakka avautuu suoraan pakkaan, eikä hakutuloksia näy ennen kuin käyttäjä valitsee Lisää kortteja.
- Kortin lisäys toimii Lisää-välilehdellä kuten ennenkin, ja alapalkki näyttää pakan tilan.
- Testit: oletusvälilehti (tyhjä ja ei-tyhjä pakka), vaihto molempiin suuntiin, sekä se, että vähintään 64rem leveydellä kaikki osiot näkyvät.
- Ei sisäisiä vieritysalueita. Näkymä toimii 320 px:n leveydellä.
- `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus
