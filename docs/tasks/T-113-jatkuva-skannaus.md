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
