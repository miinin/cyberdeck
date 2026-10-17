# BREAK-T172-T173: rikkomistestaus (goldfish ja sealed)

Testattu: dev-palvelin (Vite, StrictMode) ja tuotantobuild (`vite preview`), headless Edge (puppeteer-core, skriptit scratchpadissa, ei repossa). Src-koodia ei muutettu.

## Yhteenveto
Löydöksiä 6: Pakollisia 1, Suosituksia 5. Tietoturvapuoli (rikottu `cyberdeck:sealed`) kestää kaiken.

## Löydökset

### BRK-01 Pakollinen: Pelaa-painike on käytössä mutta ei tee mitään (Gear ilman kohdetta)
- Toisto: tee pakka, jossa on Gear-kortteja mutta ei Legendejä (esim. pelkkiä Gear-kortteja, tai keskeneräinen pakka). `#/pakat/<id>/goldfish`, Aloitan ensin, Pidä käsi, heitä Gig-noppa, valitse Gear-kortti kädestä, paina Pelaa.
- Havainto: Pelaa on aktiivinen eikä näytä virhettä, mutta klikkaus ei tee mitään (kortti jää käteen, ei viestiä). Toistui joka vuoro 1-7. `playProblem` hyväksyy tilanteen, kun kohdetta ei ole annettu, ja `play` palauttaa hiljaa `needs-target`; `apply` ei näytä refuusiota.
- Odotettu: Pelaa on pois käytöstä ja perustelu näkyy ("Ei kohdetta Gearille"), kun `targets` on tyhjä (ei Unitteja eikä Legendejä). Sama pätee Unitittomaan alkuun legendillisessäkin pakassa vain, jos kohde puuttuu.

### BRK-02 Suositus: Pidä käsi -teksti kertoo aina 6 korttia
- Toisto: pakka, jossa on 1 korttia (tai alle 6 pääpakan korttia), Aloitan ensin.
- Havainto: "Pidä 6 kortin käsi ... nostat 6 uutta", vaikka käsi on 1 korttia (`openingHint(OPENING_HAND)`).
- Odotettu: käytetään oikeaa kädenkokoa. Lisäksi 1 kortin pakassa peli päättyy heti vuoron 1 nostoon (tappio, "Vuoro 1/7"): toimii, mutta kannattaa harkita varoitusta alle 7 kortin pakoista.

### BRK-03 Suositus: kohdistus katoaa "Pelaa uudestaan" / "Aloita alusta" / aloitusvalinnan jälkeen
- Toisto: pelaa peli loppuun, paina Pelaa uudestaan (tai valitse Aloitan ensin/toisena).
- Havainto: `document.activeElement` on BODY, koska painike poistuu eikä `begin` aseta `pendingFocus`. Ruudunlukija- ja näppäimistökäyttäjä menettää paikkansa.
- Odotettu: kohdistus siirretään otsikkoon (esim. Aloituskäsi-otsikko).

### BRK-04 Suositus: avaamatta jäänyt pakkaus katoaa näkyvistä Takaisin/Eteenpäin/uudelleenlatauksen jälkeen
- Toisto: `#/pakat/sealed`, Aloita sealed, Avaa pakkaus, älä paljasta kortteja, lataa sivu uudelleen (tai Takaisin ja Eteenpäin).
- Havainto: pakkaus on jo tallennettu pooliin (`opened` kasvoi, 12 korttia poolissa), mutta näkymä siirtyy seuraavaan askeleeseen ("Booster 3/6"): käyttäjä ei koskaan näe paljastusta.
- Odotettu: joko paljastus tallennetaan/jatketaan, tai pakkaus lisätään pooliin vasta kun se on paljastettu. Muuten vähintään huomautus, että pakkaus on poolissa. (Kortit näkyvät rakentimessa, joten tietoa ei menetetä.)

### BRK-05 Suositus: Tallenna pakaksi luo kaksoiskappaleita
- Toisto: sealed-rakennin, Tallenna pakaksi, paina uudestaan (hidas tai oikea tuplaklikki).
- Havainto: synkroninen tuplaklikki suojautuu (`saving`-ref), mutta toinen klikkaus ehtii luoda uuden pakan "Sealed (pvm) 2", "3". Painike ei muutu tallennuksen jälkeen.
- Odotettu: tallennuksen jälkeen painike pois käytöstä (tai tila "Tallennettu") kunnes poolia/pakkaa muutetaan; `setSaved(null)` tekee sen jo muutoksista.

### BRK-06 Suositus: tyhjä Legendit-paneeli ja harhaanjohtava syy pakassa ilman Legendejä
- Toisto: goldfish pakalla, jossa ei ole Legendejä.
- Havainto: Legendit-paneeli on tyhjä ilman selitystä, ja Kutsu Legendi -painikkeen syy on "Kaikki Legendit ovat jo yläspäin" (`no-face-down-legend`).
- Odotettu: viesti "Pakassa ei ole Legendejä" ja sopiva syyteksti.

## Testattu ilman löydöstä
- Tyhjä pakka ja pelkät Legendit: "Pakassa ei ole kortteja" -viesti. 1 kortin pakka: deckout, ei kaatumista. Pakka ilman myytäviä kortteja: Myy pois käytöstä, syy näkyy.
- Tuplaklikit (synkroninen ja oikea): Myy, Pelaa, Lopeta vuoro, Gig-noppa, Aloita sealed, Avaa pakkaus: toiminto tapahtuu kerran (synkroninen tuplaklikki Avaa pakkaus -painikkeeseen avasi kaksi pakkausta, `opened` 2, mutta oikea tuplaklikki vain yhden: vain tekoäly-/skriptiolosuhde, ei raportoitu).
- Takaisin/Eteenpäin goldfishissa ja sealedissa: pelitila nollautuu (ei tallenneta, tarkoituksellista), ei virheitä. Tuntematon pakka-id, `a/b`, `..%2F`: "Pakkaa ei löytynyt" tai pakkalista.
- 7 vuoron peli loppuun (Unitit, Gear, Program, Legendin kutsu, hyökkäys), Pelaa uudestaan: tila nollautuu. Sealed-pakan pelaaminen goldfishissa ja paluu: toimii; ei käynnissä olevaa sealedia -viesti reitillä.
- `cyberdeck:sealed` rikottuna: väärä JSON, tyhjä, null, taulukko, `__proto__` (ei prototyyppisaastetta), `constructor`-kortti, 1e308, 1e9, negatiivinen, desimaali, 5000 kortin pooli, tuntemattomat avaimet (ei renderöidä), `<script>`-setti, kaksoislegendit, uudempi versio (lukittu-viesti): kaikki joko hylätään (aloitus alusta, varmuuskopio `cyberdeck:backup:sealed:*`) tai hyväksytään turvallisesti. Huomio: devissä (StrictMode) "lukukelvoton"-ilmoitus ei näy, koska effect ajetaan kahdesti; tuotantobuildissa ilmoitus näkyy.
- 320 px ja 1280 px, vaalea ja tumma teema: ei vaakasuuntaista ylivuotoa (goldfish: aloitus, mulligan, vuoro, yhteenveto; sealed-rakennin). Roolit: `role=status` -live-alueet, `aria-pressed`, `aria-label` kortti- ja noppapainikkeissa, otsikot toimivat.
