# T-164 · Pakkojen kokoaminen: pakanvaihto-ohje (I-1) ja yhteensopivuus (I-2)
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
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

### Luovutus (Koodari, 2026-10-13)
**Tehty:** uusi välilehti `Kokoaminen` (reitti `#/pakat/kokoaminen`, `deckBuild`) ja näkymä `src/ui/DeckBuildView.tsx`. Laskenta `src/domain/deckBuild.ts` (`swapPlan`, `deckMissing`, `pairMissing`, `competingPairs`, `allMissing`; valinnainen `known`-suodatin ohittaa kortit, joita ei ole `cardsByKey`:ssä). Tekstit fi ja en, tyylit `styles.css`:n loppuun (`.build-*`).
- Pakanvaihto: valinnat "Pöydällä nyt" / "Haluan pelata" / "Muut kootut pakat", ryhmät Pidä, Palauta, Ota, Puuttuu (määrät otsikoissa, nimen mukaan, "on pakassa X"), ✓-yhteenveto ja want-painike (saavutettava nimi sisältää pakan nimen, koska sivulla on kaksi painiketta).
- Yhteensopivuus: matriisi (`table`, vähintään 48 rem ja enintään 8 pakkaa, nimet ellipsillä ja title-tekstillä, solun nimi visually-hidden-tekstinä), muuten lista kilpailevista pareista tai "Kaikki pakat voivat olla koottuina pareittain".
- Kokoa kaikki: yhteenveto, taulukko (Kortti, Tarvitaan, Omistat, Puuttuu) ja want-painike tai ✓.
- Tilat: ei pakkoja → ohje; pakat latautuvat → tilarivi; kokoelma latautuu → tilarivi; kokoelma ei saatavilla → varoitus.

**Testit:** `deckBuild.test.ts` (jaetut kortit, proxyt, sideboard, muut kootut, tyhjä pakka, parit, kaikki), `DeckBuildView.test.tsx` (välilehti, tyhjä tila, ryhmät, puuttuvat ja want, sama pakka, matriisi/lista, ei kilpailua, kokoa kaikki), reittitesti. `npm test` 1820/1820, lint ja build läpi.

**Poikkeamat / huomiot:**
- Olemassa olevat välilehtien nimet säilytettiin (`Omat pakat`, `Julkiset pakat`), uusi on `Kokoaminen`.
- Parilistassa luku on parin yhteenlaskettu puuttuva määrä (sama kuin matriisin solu), ei vain jakamisesta johtuva osuus.
- Visuaalista 320/390/1440 px -tarkistusta selaimessa ei tehty (jsdom ei mittaa asettelua): PM tarkistaa esikatselusta, erityisesti 4-sarakkeinen "Kokoa kaikki" -taulukko 320 px:ssä ja matriisi 8 pakalla.
- IDEAS-kirjaus ("yksi painallus päivittää pakat") jää PM:lle.

Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (matriisin ja listan vaihtoraja on kiinteä 48 rem / 8 pakkaa)

PM (2026-10-13): esikatselu Chromella 320, 390 ja 1440 px:ssä 4 ja 8 pakalla. Vaakavieritystä ei ole. Korjattu itse: valikot saivat kenttätyylin, Kokoa kaikki -taulukon nimet eivät enää katkea kesken sanan puhelimessa, ja matriisin sarakeotsikot rivittyvät kahdelle riville ennen lyhennystä. Pakanvaihdon laskenta tarkistettiin esimerkkidatalla. I-1:n "yksi painallus päivittää pakat" jäi pois (koottu-tila puuttuu tietomallista) ja on kirjattu IDEAS:iin.
