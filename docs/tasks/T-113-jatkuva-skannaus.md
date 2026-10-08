# T-113 · Jatkuva skannaus toimimaan (suunnitelma)

**Tila:** Backlog (suunnitelma, ei toteutusta). **Päättäjä:** käyttäjä (palaute 2026-10-08: "skannaus ilman kuvan ottamista ei toimi ollenkaan?"), PM (suunnitelma).

## Nykytila
- **Yksi kerrallaan (toimii):** napautus ottaa kuvan. Kolme parasta osumaa näytetään, ja käyttäjä valitsee niistä, vaikka tunnistus ei olisi varma.
- **Jatkuva (ei toimi):** kuva otetaan noin 3,5 kertaa sekunnissa. Kortti lisätään vain, jos `isConfident` on tosi **kahdessa peräkkäisessä** kuvassa (`CONFIDENCE = { maxDistance: 240, minGap: 40 }`).

## Todennäköiset syyt (järjestyksessä)
1. **Kynnykset on viritetty synteettisillä kuvilla.** `scripts/cards/measureScanner.mjs` vääristää korttikuvia, mutta oikea kamerakuva on erilainen: valkotasapaino, heijastukset, epätarkkuus, liike, suojamuovi ja perspektiivi. Oikeassa kuvassa paras etäisyys jää todennäköisesti yli 240:n, joten "varma" ei toteudu koskaan eikä mitään lisätä. Yksi kerrallaan -tila toimii, koska se ei vaadi varmuutta.
2. **Palaute puuttuu.** Kehys ei kerro, näkeekö skanneri mitään tai onko tunnistus lähellä, joten jatkuva tila näyttää kuolleelta.
3. **Kamerakuva on heikko.** `getUserMedia` pyytää vain `facingMode: 'environment'` eikä resoluutiota tai tarkennusta. Moni puhelin antaa silloin 640 × 480 -kuvan, ja tarkennus voi jäädä lukkoon.
4. **Tiiviste on herkkä valaistukselle.** Värikeskiarvoista lasketut tiivisteet (16 × 16 × 3) reagoivat sävyn ja kirkkauden muutoksiin.

## Suunnitelma
**Vaihe 1. Mittaa ennen korjausta (pieni, ensin)**
- Piilotettu diagnostiikkatila (`?scandebug`). Mitään ei tallenneta eikä lähetetä. Kehyksen alla näkyvät jokaisesta kuvasta paras osuma, etäisyys, ero toiseksi parhaaseen ja kuvan terävyys.
- Käyttäjä skannaa puhelimella noin 20 korttia ja lähettää kuvakaappaukset. Kynnykset asetetaan oikean datan mukaan.

**Vaihe 2. Varmuus useista kuvista yhden tiukan rajan sijaan**
- Kortti lisätään, kun sama paras osuma toistuu esimerkiksi 3:ssa viimeisistä 4 kuvasta ja kaikki ovat löysemmän rajan sisällä. Raja otetaan vaiheen 1 datasta (arvio: etäisyys noin 300, ero noin 20).
- Peräkkäisten kuvien yhtäpitävyys on vahvempi todiste kuin yksi tiukka raja, joten väärien osumien riski pysyy pienenä.
- Toteutus puhtaina funktioina (`stepContinuous`) yksikkötesteineen. Tuplien esto (`AWAY_MS`) säilyy.

**Vaihe 3. Elävä palaute**
- Kehyksellä on kolme tilaa:
  - "Etsitään" (neutraali).
  - "Pidä paikallaan" (keltainen): sama ehdokas näkyy, mutta tunnistus ei ole vielä varma.
  - "Lisätty" (vihreä välähdys, nykyinen).
- Jos sama ehdokas on näkynyt noin 1,5 sekuntia ylittämättä varmuusrajaa, kehyksen alle tulee pikkukuva, nimi ja painike **"Lisää"**. Yksi napautus lisää kortin ilman kuvan ottamista. Tämä on myös varaväylä huonoon valoon.

**Vaihe 4. Parempi kamerakuva**
- Pyydetään `width: { ideal: 1920 }`, `height: { ideal: 1080 }` ja `focusMode: 'continuous'`, jos laite tukee niitä.
- Salamavalokytkin (`torch`) laitteille, jotka tukevat sitä.
- Epätarkat kuvat ohitetaan terävyysmittarilla (Laplacen varianssi).

**Vaihe 5. Vain tarvittaessa: valaistuksen kestävä tunnistus**
- Kirkkauden normalisointi tai gradienttipohjainen tiiviste värikeskiarvojen rinnalle.
- Vaatii sormenjälkien uudelleengeneroinnin (`cardFingerprints.json`), joten se on oma korttinsa.

## Pilkkominen
- **T-113a:** vaiheet 1 ja 4 (diagnostiikka ja kamerapyyntö). Noin yksi Koodarin kierros, jonka jälkeen käyttäjä mittaa.
- **T-113b:** vaiheet 2 ja 3 mittausdatan pohjalta.
- **T-113c (vain tarvittaessa):** vaihe 5.

Digiturva tarkistaa kamerapyynnön muutoksen ja sen, ettei diagnostiikka tallenna tai lähetä mitään (SEC-106).

## Hyväksymiskriteerit
- Jatkuvassa tilassa vähintään 9 korttia 10:stä lisätään 2 sekunnin sisällä tavallisessa sisävalossa.
- Vääriä lisäyksiä on 0 kahdestakymmenestä.
- Käyttäjä näkee koko ajan, mitä skanneri tekee.

---

## T-113a · Määrittely (Ready, 2026-10-08)
**Haara:** `t-113-skanneri-mittaus`. Tavoite on, että käyttäjä voi tänään mitata skannerin oikeilla korteilla puhelimellaan.

1. **Kamerapyyntö:** kamera pyydetään asetuksilla `{ facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }`. Kun stream on auki, kutsutaan `track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] })`, jos `getCapabilities().focusMode` sisältää arvon `continuous`. Kutsu tehdään try/catchissa, eikä virhe kaada skanneria. Tavallisen käyttäjän skannaus pysyy muuten ennallaan.
2. **Terävyys:** uusi puhdas funktio `frameSharpness(image: PixelImage): number` tiedostoon `src/domain/cardFingerprint.ts` tai uuteen domain-tiedostoon. Se laskee Laplacen varianssin harmaasävystä. Funktiolle tehdään yksikkötesti (terävä kuva > sumea kuva).
3. **Diagnostiikkatila:** tila on päällä vain, kun URL:ssa on `?scandebug=1` (`location.search`, ei hash). Silloin skannerin kameranäkymässä, kehyksen alla, näkyy tiivis paneeli:
   - **Elävä rivi**, joka päivittyy noin 3 kertaa sekunnissa molemmissa tiloissa: 3 parasta osumaa (nimi ja etäisyys), ero 1. ja 2. välillä, `isConfident` kyllä/ei, terävyys sekä videon resoluutio (`videoWidth × videoHeight`) ja tarkennustila.
   - **"Tallenna näyte"** -painike jäädyttää nykyisen kuvan luvut ja näyttää 3 parasta osumaa painikkeina sekä painikkeen "Ei mikään näistä". Käyttäjä napauttaa oikeaa korttia, ja näyte tallentuu muistiin (komponentin tila, ei tallennusta eikä lähetystä) muodossa `{ oikea: 1|2|3|0, top3: [{nimi, id, etäisyys}], ero, terävyys, resoluutio }`.
   - **Laskuri** "N näytettä" ja painike **"Kopioi tulokset"**: `navigator.clipboard.writeText(JSON)`. Jos kopiointi ei onnistu, JSON näytetään `<textarea readonly>`-kentässä, josta sen voi kopioida käsin. Kenttä saa kasvaa korkeutta, eikä siinä ole sisäistä vieritystä.
   - Tekstit vain englanniksi kovakoodattuna. Kyseessä on kehittäjätila, eikä sitä käännetä.
4. **Tietoturva:** kuvia ei tallenneta, mitään ei lähetetä, eikä uusia riippuvuuksia lisätä. Kamera sammuu kuten ennenkin (SEC-106).
5. **Testit:** terävyysfunktio, sekä se, että diagnostiikkapaneelia ei näy ilman parametria ja että se näkyy parametrin kanssa (kameraa mockaten kuten nykyisissä CardScanner-testeissä).

**Hyväksymiskriteerit:** `npm test` (ajetaan kerran), `npm run lint` ja `npm run build` menevät läpi, ja PR:n esikatselu toimii puhelimella osoitteessa `<preview>/?scandebug=1#/kokoelma`.

## T-113a · Luovutus
