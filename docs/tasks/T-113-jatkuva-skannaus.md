# T-113 · Jatkuva skannaus toimimaan (suunnitelma)

**Tila:** Done. **Päättäjä:** käyttäjä (palaute 2026-10-08: "skannaus ilman kuvan ottamista ei toimi ollenkaan?"), PM (suunnitelma).

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

- Kamerapyyntö: `width/height ideal 1920×1080`; `focusMode: continuous` asetetaan try/catchissa vain, jos laite ilmoittaa tuen (`requestContinuousFocus`, `CardScanner.tsx`).
- `frameSharpness` (Laplacen varianssi) tiedostossa `src/domain/cardFingerprint.ts`, yksikkötesti mukana.
- Diagnostiikka: `src/ui/ScanDebugPanel.tsx`, näkyy vain osoitteella `?scandebug=1` (query, ei hash) kameranäkymässä molemmissa tiloissa. Elävä rivi 330 ms välein, "Save sample" / "Copy results" (leikepöytä, varana readonly-textarea ilman sisäistä vieritystä). Näytteet vain komponentin tilassa; ei tallennusta eikä lähetystä; ei uusia riippuvuuksia. Kamera sammuu kuten ennen.
- Testit: npm test 1519 läpi (ajettu kerran), lint ja build läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (mittaus ajaa kehyksen kopioinnin erikseen jatkuvan tilan ajastimen rinnalla; kehittäjätilassa hyväksyttävä).
- Esikatselu mittaukseen: `<preview>/?scandebug=1#/kokoelma`. Digiturvan tarkistus: kamerapyyntö ja diagnostiikan tallentamattomuus (SEC-106).

**PM-korjaus 2026-10-08 (käyttäjän palaute: kaksi mittauskierrosta hukkaan):**
- **Näytteet säilyvät:** ne pysyvät moduulin muistissa skannerin sulkemisen ja vaiheen vaihdon yli, ja jokainen tallennus kopioi kaikki tulokset leikepöydälle. Viimeisen näytteen voi kumota.
- **Elävä rivi:** se pysähtyy valinnan ajaksi, ja sillä on kiinteä kahden rivin korkeus, joten painikkeet eivät pompi. Valintapainikkeet ovat 2 × 2 -ruudukossa.
- **Kamera pysyy isona:** diagnostiikkatilassa vihjeet ja lisättyjen korttien lista piilotetaan.
- **Ei lisäyksiä kokoelmaan:** jatkuva tila ei lisää mitään kokoelmaan, kun diagnostiikkatila on päällä.

**Huomio T-113b:hen:** käyttäjällä on käsillä vain sinisiä kortteja, joten mittausdata on yksiväristä. Kynnykset ja usean kuvan sääntö viritetään oikealla datalla, mutta muiden värien korttien tulos pitää todentaa erikseen. Siihen käytetään `scripts/cards/measureScanner.mjs`-ajoa kaikilla väreillä (värikohtainen tulos raporttiin), ja oikeat kuvat muista väreistä tarkistetaan myöhemmin. Väärien osumien raja pidetään tiukkana: osuman ero toiseksi parhaaseen ei saa laskea alle sen, minkä synteettinen mittaus kestää kaikilla väreillä.

## Mittaustulos 2026-10-08 (käyttäjä, puhelin 1080×1920, 23 sinistä korttia)
- **Oikea kortti paras osuma:** 22/22 näytteessä. Yhdessä näytteessä oikeaa ei ollut kolmen parhaan joukossa.
- **Oikean osuman etäisyys:** 322–640, mediaani noin 500. Nykyinen raja 240 ei toteudu koskaan, ja tämä vahvistaa syyn 1.
- **Ero toiseksi parhaaseen:** 3–286. Ero on pieni (alle 40) viidessä näytteessä 22:sta.
- **Väärät ehdokkaat:** etäisyys yleensä 590–670. Saman kortin toinen kuvitus voi olla lähempänä (Floor It -kortin nova-rare 556).
- **Hylättävä tapaus:** ainoa "ei mikään" -näyte oli 578, ero 15.
- **Terävyys:** 248–1803. Matala terävyys ei yksin ennustanut virhettä, joten terävyysraja asetetaan vain hyvin matalaksi.

## T-113b · Määrittely (Ready)
**Haara:** `t-113-skanneri-mittaus`, sama PR #124 kuin muut T-113-osat.

1. **Uusi sääntö:** `CONFIDENCE = { maxDistance: 580, minGap: 40 }`. Yksi kerrallaan -tila esivalitsee varman osuman tällä säännöllä, kuten ennenkin.
2. **Jatkuva tila:** `stepContinuous` muutetaan niin, että kortti lisätään, kun sama varma id on ollut **3:ssa viimeisistä 4** kuvasta. Ikkunan kuvat ovat peräkkäisiä, ja tyhjä tai epävarma kuva on oma havaintonsa. Tuplien esto (`AWAY_MS`) säilyy. Kuvat, joiden terävyys on alle 150, ohitetaan, eikä niitä lasketa havainnoiksi.
3. **Ehdotus:** jos sama paras id (etäisyys enintään 650) on ollut paras vähintään 1,5 sekuntia mutta ei ole varma, kehyksen alle tulee kiinteän korkuinen rivi, jossa ovat pikkukuva, nimi ja painike **"Lisää"**. Napautus lisää yhden kappaleen session listaan kuten automaattinen lisäys, ja kumoa toimii samoin. Ehdotus päivittyy vasta, kun paras id vaihtuu ja uusi on pysynyt 1,5 sekuntia, joten mikään ei pompi sormen alla.
4. **Kehyksen tila:** "Etsitään" (neutraali), "Pidä paikallaan" (keltainen reunus, kun sama id on 1–2 kertaa ikkunassa) ja "Lisätty" (vihreä välähdys, nykyinen). Tila kerrotaan ruudunlukijalle vain lisäyksen kohdalla (nykyinen `role="status"`), eikä jatkuvasti.
5. **Muut värit:** aja `scripts/cards/measureScanner.mjs` uudella säännöllä ja raportoi väärät varmat osumat **värikohtaisesti** luovutukseen. Jos jollain värillä on väärä varma osuma uudella säännöllä, kiristä `minGap` tai `maxDistance` niin, että väärä varma osuma on 0, ja kerro tulos.
6. **Testit:** puhtaat funktiot (3/4-ikkuna, terävyysraja, ehdotuksen 1,5 sekunnin pysyvyys ja tuplien esto). Olemassa olevat continuousScan-testit päivitetään, mutta niitä ei heikennetä.

**Hyväksymiskriteerit:** `npm test` (ajetaan kerran), `npm run lint` ja `npm run build` menevät läpi. Mittausdatalla vähintään 17/22 lisätään automaattisesti ja "ei mikään" -tapaus hylätään.

## T-113b · Luovutus
- **Sääntö:** `CONFIDENCE = { maxDistance: 580, minGap: 40 }` (ei kiristetty). Jatkuva tila lisää kortin, kun sama varma id on 3:ssa viimeisistä 4 kuvasta (`stepContinuous`, ikkuna `window`); `AWAY_MS` säilyy. Kuvat, joiden terävyys on alle 150, ohitetaan eivätkä ole havaintoja.
- **Ehdotus:** `stepSuggestion` (puhdas funktio): paras id (etäisyys enintään 650, ei varma) pysynyt 1,5 s -> kiinteän korkuinen rivi (pikkukuva, nimi, "Lisää"). Ehdotus vaihtuu vasta, kun uusi paras id on pysynyt 1,5 s. Napautus lisää yhden kappaleen kuten automaattinen lisäys (kumoa toimii), eikä sama ehdotus palaa heti. Ei käytössä `?scandebug=1`-tilassa.
- **Kehys:** neutraali (valkoinen reuna, "Täytä kehys kortilla"), "Pidä paikallaan" (keltainen, kun id on ikkunassa 1–2 kertaa), "Lisätty" (vihreä). Ruudunlukijalle kerrotaan vain lisäys (`role="status"` ennallaan).
- **measureScanner (synteettinen, 5592 skannausta, sääntö 580/40), värikohtaisesti:** skannauksia / varmoja / väärä kortti / väärä kuvitus
  - Blue 1392 / 1277 / 0 / 1
  - Green 1440 / 1291 / 0 / 1
  - Red 1344 / 1211 / 0 / 3
  - Yellow 1416 / 1251 / 0 / 1
  Väärä varma kortti: 0 kaikissa väreissä. Kuusi "väärää" on saman kortin toinen kuvitus (nova/iconic), jota ei lasketa vääräksi kortiksi. Vertailu: 580/20 antaa 11, 580/60 antaa 4, 650/40 antaa 6 väärää kuvitusta. Skripti raportoi nyt värit (`colorOf` cards.jsonista).
- **Testit:** continuousScan-testit kirjoitettu uudelleen (3/4-ikkuna, pitäminen, terävyys, ehdotuksen 1,5 s pysyvyys); entisiä testejä ei heikennetty. `npm test` 1525 läpi, lint ja build läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (ei UI-testiä "Lisää"-ehdotuksen napille; logiikka katettu domain-testeillä).
