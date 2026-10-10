# T-121 · Pakka omilla korteilla

**Tila:** Ready. **Päättäjä:** käyttäjä (2026-10-10: IDEAS "kokoelmatietoinen korvaus", vaihtoehto A), PM (määrittely).

## Tavoite
T-075 näyttää pakan puuttuvalle kortille yhden omistetun korvaajan (`src/domain/substitutes.ts`, `MissingCards`). Nyt käyttäjä näkee, kuinka pelattava pakka on heti omilla korteilla, ja saa yhdellä painalluksella pakasta kopion, jossa puuttuvat kopiot on korvattu omilla korteilla.

## PM:n määrittely
1. **Kaikki puuttuvat kopiot katetaan:** `findSubstitutes` korvaa nyt vain yhden kopion riviä kohden. Laajenna se kattamaan rivin koko puuttuva määrä. Yhdelle riville voi tulla useita korvaajia (esim. 2× A ja 1× B). Säännöt pysyvät T-075:n mukaisina: sama väri ja tyyppi, cost ±1, ei yli `playsetSize`-rajan pakassa (alkuperäiset ja korvaajat yhteensä), samaa omistettua kopiota ei käytetä kahdesti, eikä korvaajaksi oteta kopioita, joita pakka jo käyttää. Paluuarvo esim. `Map<CardKey, { card: Card; copies: number; owned: number }[]>`. Päivitä `MissingCards`-rivit: "Korvaajat: 2× A, 1× B" (fi/en).
2. **Pelattavuusluku** pakan tilastoissa puuttuvien korttien kohdalla (`DeckStats` ja `MissingCards`), kun kokoelma on käytössä ja jotain puuttuu, esim. "Omilla korteilla 44 / 50 · korvaajilla 49 / 50" (pääpakka; Legendit lasketaan erikseen tai jätetään pois, kunhan luku on selkeä ja testattu).
3. **"Tee kopio omilla korteilla"** -painike (toissijainen) puuttuvien korttien osioon, kun vähintään yksi korvaaja löytyy. Painike luo uuden pakan olemassa olevalla pakan luontipolulla (sama kuin pakan kopiointi tai `handleCreate`, ei tietomallimuutosta):
   - Nimi on `"<nimi> (omat kortit)"` (en: `"(my cards)"`) ja rajataan pakan nimen enimmäispituuteen.
   - Pääpakassa puuttuvat kopiot korvataan korvaajilla. Kopiot, joille korvaajaa ei löydy, jäävät ennalleen (ne puuttuvat edelleen). Legendit ja sideboard pysyvät ennallaan.
   - Uusi pakka on yksityinen (ei julkaisua) ja avautuu editoriin. Alkuperäinen pakka ei muutu.
   - Pakkasäännöt (`deckRules`) eivät saa rikkoutua kopiossa, koska kopiorajat on huomioitu jo kohdassa 1.
4. Logiikka puhtaina funktioina domainissa (esim. `substitutes.ts`: `applySubstitutes(deck, substitutes)` ja pelattavuusluku), ja niille yksikkötestit.

## Hyväksymiskriteerit
- [ ] Usean kopion korvaus, playset-raja, ei tuplakäyttöä (testit).
- [ ] Pelattavuusluku näkyy ja on oikein (testi).
- [ ] Kopio luodaan, alkuperäinen ei muutu ja kopio avautuu editoriin (testi).
- [ ] Tekstit fi ja en. Ei sisäistä vieritystä, ei päällekkäisyyksiä 320 px:llä.
- [ ] `npm test`, `npm run lint`, `npm run build` läpi.

## Rajaukset
- Ei uusia riippuvuuksia, ei tietomalli-, tallennus- tai synkronointimuutoksia (pakka luodaan olemassa olevalla polulla). Ei Digiturvaa.

## Luovutus
