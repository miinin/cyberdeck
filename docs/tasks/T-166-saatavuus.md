# T-166 · Kortin saatavuus tietolaatikossa (mistä kortin saa)
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Katselmoinnit:** PM esikatselee (tumma ja vaalea, 320 px ja työpöytä). Ei riskimuutoksia (ei dataa, tallennusta eikä riippuvuuksia), joten julkaisu suoraan (D-029).
**Riippuvuudet:** T-091 (versioiden settisirut), T-160 (NOT_IN_SET_BOOSTERS).

**Päättäjä:** käyttäjä (2026-10-14, choom.gg:n malli: "saatavilla Edgerunnerissa, ei WtNC:ssä"). PM: määrittely.

## Tausta
Kortin tietodialogin Versiot-osio näyttää jo jokaisen kuvituksen settisirut, mutta ei kerro selvästi, saako kortin boostereista. Esimerkiksi 11 korttia ei ole lainkaan Welcome to Night City -boostereissa (vain aloitus- tai demopakoissa, Box Toppereissa ja turnauspalkintoina), ja osa erikoiskuvituksista on vain turnauspalkintoja (V Streetkidin Iconic Legend, T-160).

## Määrittely
1. **Domain** (`src/domain/setFilter.ts` tai uusi `availability.ts`): `availabilityOf(printings)` → `{ inBoosters: boolean; sources: { kind: 'starter' | 'demo' | 'prize' | 'promo'; names: string[] }[] }`.
   - `inBoosters` = jokin painos on `isMainSetPrinting` (huomioi T-160:n `NOT_IN_SET_BOOSTERS`).
   - Muut painokset luokitellaan `setFamilyName`:n mukaan: `Starter Deck` → starter, `Demo Deck` → demo, `Open|Brawl|Showdown` → prize (turnauspalkinto), muut (Promos, Box Toppers, Pre-Release) → promo. Nimet ilman duplikaatteja datan järjestyksessä, ryhmät järjestyksessä starter, demo, promo, prize. WtNC-painos, joka ei ole boostereissa, ei tuota lähdettä.
2. **Tietolaatikko** (`CatalogView.tsx`, `details`): uusi osio "Saatavuus" / "Availability" ensimmäiseksi. Se näkyy aina, eikä se odota kokoelman latausta. Se koskee koko korttia (kaikki painokset):
   - Boostereissa: rivi "Welcome to Night City -boosterit". Muut lähteet näytetään hillitysti ryhmittäin (esim. "Myös aloituspakat: The Heist").
   - Ei boostereissa: korostettu huomautus (aksenttiväri ja reunus, tyyli teeman tokeneista, toimii tummassa ja vaaleassa) "Ei Welcome to Night City -boostereissa". Sen alla ryhmät: "Aloituspakat: …", "Demopakat: …", "Promot: …", "Turnauspalkinnot: …".
   - Lyhyet nimet ovat sallittuja (`setAbbreviation` CardVersionsista), mutta kokonaisnimen pitää olla saatavilla (title/visually-hidden).
3. **Kuvituskohtainen merkki** (`CardVersions.tsx`, `ArtSets`): kun kortti on boostereissa mutta kuvitus ei ole (yhtään `isMainSetPrinting`-painosta), sirujen viereen tulee pieni korostettu merkki "Ei boostereissa" / "Not in boosters".
4. **Tekstit** fi ja en (`texts.fi.ts`, `texts.en.ts`).
5. Ei sisäisiä vierityksiä (pitkä lähdelista rivittyy). Mobiilissa mahtuu 320 px:iin.
6. **Testit:** domain-yksikkötestit (boosterikortti, aloituspakkakortti, V 144 -tapaus, ryhmittely ja järjestys) ja UI-testi: Viktor Vektor — Sit Down and Relax näyttää huomautuksen ja ryhmät, boosterikortti ei näytä huomautusta, ja kuvitusmerkki näkyy.

## Hyväksyntä
Testit, lint ja build läpi. PM tarkistaa ulkoasun esikatselusta.

## Luovutus
**Koodari, 2026-10-14.** Tehty: `src/domain/availability.ts` (`availabilityOf`, `artOutsideBoosters`), `src/ui/CardAvailability.tsx` (uusi osio tietolaatikon ensimmäiseksi, näkyy kun kortilla on painoksia, ei odota kokoelmaa), kuvitusmerkki `ArtSets`issa, tekstit fi ja en, CSS (varoitusvärit tokeneista, `overflow-wrap`, ei sisäisiä vierityksiä). Lähteissä näytetään täydet setin nimet (rivittyvät), ei lyhenteitä. Testit: `availability.test.ts` ja `CatalogView.availability.test.tsx` (Viktor Vektor, Royce). `npm test` 1834/1834, lint ja build läpi (yksi satunnainen aikakatkaisu täydellä ajolla, uusinnassa kahdesti läpi).
Huomio: puhelinasettelussa osio tulee kuvan ja laskurien alle (ruudukko), työpöydällä koko leveydelle ylimmäksi. PM tarkistaa ulkoasun esikatselusta.
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0

PM (2026-10-14): Tarkistettu esikatselusta (työpöytä 1440 px ja 320 px emuloituna). Lisätty: ryhmän nimi (esim. "Aloituspakat:") korostetaan, ja listan sisennys poistettiin. Huomio: V Streetkidin Iconic Rare -kuvituksissa näkyy "Ei boostereissa" ja WtNC-siru, mutta muuta lähdettä ei näy, koska data ei kerro sitä (T-160). Testit 1834/1834, lint ja build läpi.
