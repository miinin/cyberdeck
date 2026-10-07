# T-109 · Kokoelma: kansionäkymä, myytävät-tilasto pois

**Tila:** In Progress. **Haara:** `t-109-kokoelma-kansio`, tehty T-108:n haarasta. **Päättäjä:** käyttäjä (toive 2026-10-08), PM (toteutustapa).

## Tavoite
- **Myytävät pois:** Myytävät (€$) -luku poistetaan Kokoelma-näkymän yleiskuvasta. Käyttäjän mukaan sille ei ole käyttöä. Pakkaeditorin Eddies-suositus (D-024) ja Kortit-näkymän myytävät-suodatin jäävät ennalleen.
- **Esitystavat:** kokoelmaa voi esitellä eri tavoin, esimerkiksi keräilykansion sivuina.

## Ratkaisu
- **Näkymävalitsin:** Kokoelma-näkymän otsikon alle tulee valitsin (segmented control), jossa on kaksi näkymää: "Overview" eli nykyinen T-105:n edistymisnäkymä ja "Binder" eli kansio. Valinta muistetaan laitteella. Näkymät ovat osoitteessa omina tiloinaan, jos reititys sen sallii.
- **Kansio:**
  - **Taskusivut:** 3 × 3 korttitaskua sivulla, kuten oikeassa keräilykansiossa. Kortit ovat setin numerojärjestyksessä, ja jokaisella kortilla on oma taskunsa.
  - **Kortit taskuissa:**
    - **Omistettu:** kortin kuva ja kappalemäärän merkki, kun kappaleita on vähintään 2.
    - **Puuttuva:** himmeä ääriviiva, jossa ovat numero ja nimi.
  - **Valinnat:** sivun yläpuolella valitaan setti (oletuksena ensimmäinen) ja kuvitus, eli perus tai "show owned art". Lisäksi on valitsin "Show missing" (päällä/pois).
  - **Leveä näyttö:** kaksi sivua on vierekkäin kuin aukeama, ja niiden välissä on taite. Sivu käännetään nuolilla, näppäimistön nuolinäppäimillä tai mobiilissa pyyhkäisemällä. Kääntämisessä on hillitty animaatio, joka ohitetaan, jos käyttäjä on valinnut `prefers-reduced-motion`.
  - **Kapea näyttö:** näkyvissä on yksi sivu, ja sen alla on sivunumerot "Page 3 / 9".
  - **Kortin napautus:** avaa saman korttinäkymän kuin muualla.
- **Ulkoasu:** kansio on tumma, ja taskuissa on hento muovinen kiilto. Kortit ovat oikeassa mittasuhteessa (63:88), ja näkymä käyttää koko leveyden. Sivun sisällä ei ole vieritystä, vaan vain sivu vierii.

## Hyväksymiskriteerit
- Myytävät-luku ja sen testit on poistettu, eikä muu Eddies-toiminnallisuus muutu.
- Kansio näyttää kaikki setin kortit oikeassa järjestyksessä. Omistetut ja puuttuvat erottuvat toisistaan, ja sivutus toimii näppäimistöllä ja hiirellä.
- Saavutettavuus: sivuilla on otsikot, taskuilla on nimet ("#12 Name, owned 2" / "missing"), ja sivunvaihdosta ilmoitetaan aria-live-alueella.
- `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus
