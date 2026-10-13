# T-164 · Pakkojen kokoaminen: pakanvaihto-ohje (I-1) ja yhteensopivuus (I-2)
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Katselmoinnit:** PM esikatselu (320 px, 390 px, 1440 px, tumma ja vaalea). Ei Digiturvaa: puhdas laskenta omista tiedoista, ainoa tallennus on olemassa oleva "Lisää puuttuvat wantiin" -polku. Ei tietomallimuutosta.
**Riippuvuudet:** T-014 (raportti), T-061b (want-liitos), T-121.

**Päättäjä:** käyttäjä (2026-10-13): "teepä I-1 ja I-2 sekä I-6, toteuta, testaa ja julkaise". PM: määrittely.

## Tavoite
Pakat-sivulla näkee, voiko pakan B koota purkamatta muita, ja saa siirtolistan. Lisäksi näkee, mitkä pakat kilpailevat samoista korteista, ja mitä pitäisi hankkia, jotta kaikki pakat ovat koottuina yhtä aikaa.

## Määrittely
1. **Paikka:** Pakat-sivun välilehdet `Omat | Kokoaminen | Julkiset` (en: `Own | Building | Public`). Uusi reitti `#/pakat/kokoaminen` (`routeHash`, `useHashRoute`, testit). Tyhjä tila: jos pakkoja ei ole, näytetään ohje tehdä pakka. Jos kokoelma ei ole valmis (ladataan tai ei saatavilla), näytetään tilarivi kuten muualla.
2. **Laskenta `src/domain/deckBuild.ts`** (puhtaat funktiot ja testit). Pakan kortit = `allDeckCounts` (pääpakka ja sideboard). Kortit, joita ei ole `cardsByKey`:ssä, ohitetaan. Omistetut = kokoelman määrä (`countIn`/`ownedOf` kuten DecksView).
   - `swapPlan(from: Deck | null, to: Deck, kept: Deck[], owned)`: rivi per kortti. `keep` = min(a, b), joka jää pöydälle. `toBinder` = a − keep, joka palautetaan kansioon. Kansiosta otetaan enintään `fromBinder` = min(b − keep, vapaat), kun vapaat = max(0, omistetut − a − Σ kootut muut). Loput ovat `missing`, ja riville tulee niiden pakkojen nimet, joissa kopioita on (`kept`-pakat).
   - `pairMissing(d1, d2, owned)` = Σ max(0, n1 + n2 − omistetut), ja diagonaalilla pakan oma puuttuva määrä. `allMissing(decks, owned)` = rivit, joissa Σ pakat − omistetut > 0 (muoto `MissingRow`, jotta AddMissingToWants toimii sellaisenaan).
3. **Pakanvaihto (I-1):** Valinnat "Pöydällä nyt" (pakka tai "Ei mitään") ja "Haluan pelata" (pakka). Valinnainen "Muut kootut pakat" (valintaruudut, oletuksena ei mitään), jotka pysyvät koottuina. Tulos on neljä ryhmää ja niiden määrät otsikoissa: **Pidä pakassa**, **Palauta kansioon**, **Ota kansiosta** ja **Puuttuu** (sekä "on pakassa C"). Puuttuville on `AddMissingToWantsButton`. Jos kaikki löytyy, näytetään selvä ✓-yhteenveto ("Voit koota pakan purkamatta muita"). Kortin nimi näytetään kuten pakkalistoissa (CardName). Ryhmät järjestetään nimen mukaan. Valinnat tallennetaan vain komponentin tilaan, ei tallennukseen (I-1:n "yksi painallus päivittää pakat" jää pois, koska koottu-tilaa ei ole tietomallissa. PM kirjaa sen IDEAS:iin).
4. **Yhteensopivuus (I-2):** Leveällä (vähintään noin 48 rem ja enintään 8 pakkaa) näytetään matriisi pakka × pakka. Solussa on puuttuvien kopioiden määrä, kun molemmat ovat koottuina. 0 = ✓ (onnistuu), ja muuten numero varoitusvärillä. Diagonaali on pakan oma tilanne ja erotetaan himmeämmällä taustalla. Solun saavutettava nimi on esim. "A ja B yhtä aikaa: puuttuu 3". Kapealla tai yli 8 pakalla näytetään sen sijaan lista vain kilpailevista pareista (parin puuttuvat > kummankin oma puuttuva yhteensä): "A + B: 3 korttia liian vähän". Jos kilpailevia pareja ei ole, näytetään "Kaikki pakat voivat olla koottuina pareittain". **Ei sisäistä eikä vaakavieritystä** (muisti), joten matriisi mahtuu leveyteen ja pitkät nimet katkeavat tai lyhenevät ellipsillä, jolloin täysi nimi on title- ja aria-tekstinä.
5. **Kokoa kaikki:** Yhteenveto "Jotta kaikki N pakkaa ovat koottuina yhtä aikaa, puuttuu X korttia (Y eri)" ja lista. Listassa ovat kortti, tarvitaan, omistat ja puuttuu. Lisäksi `AddMissingToWantsButton`. Jos mitään ei puutu, näytetään ✓-teksti.
6. **Tekstit** fi ja en `deckTexts`-tiedostoihin. Tyyli seuraa nykyistä kevyttä ilmettä (T-127): ei raskaita laatikoita. Täysi leveys on käytössä leveällä (muisti).
7. **Testit:** domain-testit (jaetut kortit, proxyt eli omistetut < a, sideboard, muut kootut pakat, tyhjä pakka) ja UI-testit (välilehti ja reitti, valinnat, ryhmät, matriisin ja listan vaihto, want-painike).

## Hyväksyntä
- Testit, lint ja build läpi. 320 px:ssä ei vaakavieritystä.

## Luovutus
