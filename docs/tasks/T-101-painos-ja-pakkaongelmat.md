# T-101 · Painoksen varmistus ja pakkaeditorin ongelmamerkinnät

## Tavoite
Viisi korjausta: (1) Beta/Retail-varmistus ennen kokoelmaan lisäystä, (2) ongelmakortit ja -osiot merkitään pakkalistaan, (3) Legendit myös tekstinä, (4) Sideboard Pinot-näkymään, (5) hillitympi Gear-väri tilastoihin.

## Hyväksymiskriteerit
1. Kun käyttäjä lisää ensimmäisen kerran istunnossa kortin, jolla on sekä Beta- että Retail-painos, näytetään natiivi dialogi "Lisätäänkö Beta vai Retail?" (Beta / Retail / Peru, Esc = peru). Valinta asettaa oletuspainoksen ja lisää kortin. Dialogissa kortin kuva, jossa alakulma on korostettu, ja teksti "Beta-kortin numeron edessä on β (esim. β005a), Retail-kortissa ei." (texts.fi/en `editionConfirmHint`). Ei dialogia vähennykselle eikä kortille, jolla on vain toinen painos. Toimii Kortit-näkymässä (kortit, taulukko, kuvaruudukko) ja kortin tietonäkymässä.
2. Ongelmalliset rivit (liikaa kopioita, RAM, sama Legend, sideboard-rajat) saavat punaisen reunan, merkin "⚠ syy", `title`-selityksen ja ruudunlukijateksti. Osioiden otsikoiden vieressä merkki, kun määrä on väärä (Pääpakka alle 40 / yli 50, Sideboard ei 0 eikä 7, Legendit ei 3). Ongelmaluettelon rivillä "Näytä rivi" -painike siirtää fokuksen riville.
3. Legend-paikkojen alla tekstirivi Legendien nimistä (nimi + alanimi).
4. Pinot-näkymässä myös Sideboard on pinoina; ±, → Pää ja pinon kuvan avaus säilyvät.
5. `--seg-gear` #ff4fd8 → #9d7fd6 (tumma, ~6:1 taustaa vasten) ja #6d4fb0 (vaalea, ~5,4:1).

## Toteutus
- `EditionConfirmDialog.tsx` (uusi), `CatalogView.tsx` (`guardAdd`), `DeckProblems.tsx` (uusi), `DeckList.tsx`, `Sideboard.tsx`, `DeckEditor.tsx`, `styles.css`, `texts.*`, `deckTexts.*`.
- Ei uusia riippuvuuksia.

## Luovutukset
### Luovutus 2026-10-06 · Koodari
Tehty. `npm test`, `npm run lint`, `npm run build` läpi. Uudet testit: `CatalogView.edition.test.tsx` (dialogi), `DeckEditor.problems.test.tsx` (merkinnät, Legend-tekstit, sideboard-pinot).
- **Poikkeama:** "Istunto" = sivun auki oloaika (moduulimuuttuja). `sessionStorage` on kielletty SR-12:lla (vain storage-kerros), ja storage-kerroksen laajennus oli tehtävää suurempi. Sivun uudelleenlataus kysyy uudestaan. Jos halutaan pysyvämpi, lisätään sessiotuki storage-kerrokseen.
- Painoksen tunnistuskohdan korostus kuvassa on arvio (alakulman kaista); tarkista esikatselusta osuuko oikeaan kohtaan.
- Kortin tietonäkymän yläosan kokonaismäärälaskuri (`CountControl`) käyttää dialogia, mutta ei muuten edition-logiikkaa (ennallaan).
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (DeckList/Sideboard-pinokortin yhteinen komponentti, nyt kevyt kaksoistoteutus)
