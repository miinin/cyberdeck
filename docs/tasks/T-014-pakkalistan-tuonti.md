# T-014 · Pakkalistan tuonti tekstinä ja .txt-tiedostona, raportti ja "Tallenna pakaksi"
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must
**Malli:** D-014. Digiturva katselmoi, koska tehtävässä on epäluotettava syöte (SR-17, R-13).
**Haara:** `t-014-pakkalistan-tuonti`
**Käyttäjän päätökset 2026-10-02:** raportti näytetään ensin, ja sen alla on "Tallenna pakaksi" -painike (käyttäjä valitsee). Pakoille ei tehdä Koottu/Suunnitelma-tilaa (IDEAS.md).

## Tavoite
Pelaaja liittää netistä löytämänsä pakkalistan ja näkee heti, mitä kortteja hänen kokoelmastaan puuttuu ja missä hänen muissa pakoissaan tarvittavat kortit ovat. Halutessaan hän tallentaa listan pakaksi.

## Hyväksymiskriteerit
1. **Jäsennin** `src/domain/deckText.ts`, viitemuoto D-007 (`docs/examples/esimerkkipakka.txt`):
   - Muoto: `# Pakan nimi`, osio-otsikot `// Legends (3)` (ohitetaan, tyyppi päätellään kortista) ja rivit `3 Nimi - Alaotsikko`. Hyväksytään myös `3x Nimi` ja rivi ilman alaotsikkoa (yksiselitteinen pelkkä nimi).
   - Nimet täsmätään korttidataan `normalizeCardName` → `Card.key`.
   - Tunnistamattomat rivit palautetaan erikseen (enintään 100 merkkiä, SR-14).
   - Saman kortin rivit yhdistetään.
   - Kaikki SR-17:n rajat:
     - 64 kt (tiedosto `File.size`:sta ennen lukemista, teksti merkkimääränä)
     - 300 riviä, 300 merkkiä per rivi; ylitys keskeyttää koko tuonnin
     - BOM poistetaan, rivinvaihdot ja NFC normalisoidaan
     - määrä `^\d{1,2}$` ja 1–99
     - ankkuroidut regexit ilman sisäkkäisiä toistoja, ei regexiä käyttäjän syötteestä
     - suorituskykytesti: 10 000 merkin rivi ja 300 riviä jäsentyvät alle 100 ms:ssa
   - Testit esimerkkipakalla (kaikki 19 korttia tunnistuvat) ja rajoilla.
2. **Näkymä:** Pakat-sivulla on painike "Tuo pakkalista". Se avaa tuontinäkymän, jossa on tekstikenttä liittämiselle ja tiedostovalitsin (`accept=".txt,text/plain"`, vain käytettävyyttä varten). Painike "Tarkista lista" käynnistää tarkistuksen.
3. **Raportti** (näytetään ennen tallennusta):
   - Tunnistetut kortit määrineen ja jokaiselle "omistat X / tarvitaan Y".
   - Yhteenveto "Kokoelmasta puuttuu N korttia" ja puuttuvien lista.
   - Jokaiselle tarvittavalle kortille "Myös pakoissa: A, B", jos kortti on käyttäjän muissa pakoissa (kortin pakat T-013:sta).
   - Tunnistamattomat rivit omana listanaan.
   - Laillisuustarkistus `validateDeck`illa (T-013): rikkeet näytetään kuten editorissa.
4. **"Tallenna pakaksi":** nimi tulee `# `-riviltä tai on "Tuotu pakka", ja se on muokattavissa ennen tallennusta (SR-11:n nimisäännöt, `checkDeckName`). Tallennus luo uuden pakan decks-repositorioon, eikä mitään ylikirjoiteta. Tallennuksen jälkeen siirrytään editoriin. Virheet (esim. `MAX_DECKS`) näytetään selkokielellä.
5. Testit jäsentimelle, raportille ja tallennukselle. `npx vitest run` (koko sarja, nyt nopea), lint ja build menevät läpi. CHANGELOG `[Julkaisematon]`.

## Rajaukset
- Vienti ja .json-tuonti ovat T-015.
- Ei Koottu/Suunnitelma-tilaa.
- Ei raahaa ja pudota -tuontia (voi lisätä myöhemmin samoilla rajoilla).

## Luovutukset

### Luovutus 2026-10-02 · Koodari → Digiturva (SR-17, R-13) ja PM
- Mitä tehtiin: jäsennin `src/domain/deckText.ts` (kaikki SR-17:n rajat, ankkuroidut lineaariset regexit, ei regexiä syötteestä, BOM/rivinvaihdot/NFC/ohjausmerkit, `UNSAFE_CHARACTERS` exportattu validate.ts:stä jaettavaksi), raportti `src/domain/deckReport.ts`, näkymä `src/ui/DeckImport.tsx` (Pakat-sivun "Tuo pakkalista", tekstikenttä + tiedostovalitsin, tiedoston koko tarkistetaan ennen `file.text()`:iä), "Tallenna pakaksi" (nimi muokattavissa, `checkDeckName`, `decks.create`, siirtyy editoriin, virheet `deckTexts.actionFailed`). Tekstit `deckTexts.ts`:ssä (Sisällöntuottaja/UX katselmoivat), CHANGELOG päivitetty.
- Mistä katsoa: `git diff origin/test...HEAD`; testit `deckText.test.ts` (esimerkkipaka 19/19 tunnistuu, rajat, ReDoS-aika), `deckReport.test.ts`, `DeckImport.test.tsx` (raportti, SR-14 `<img>` tekstinä, 301 riviä, 64 kt tiedosto ei lueta, tallennus/nimen validointi/virhe).
- Tunnetut rajoitteet: saman kortin yhdistetty määrä katkaistaan 99:ään; vain ensimmäinen `# `-rivi on nimi; tunnistamaton rivi (esim. ilman määrää) ei ole osa pakkaa; ei raahaa ja pudota -tuontia.
- Sivuhuomio: `App.test.tsx` D-013 -testi aikakatkesi 5 s:n rajalla koko sarjassa myös ilman T-014:ää (päällä: aikaraja 20 s, vain tämä testi).
- Testit: `npx vitest run` 582/582, `eslint .` ja `tsc --noEmit` ja `npm run build` läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (DeckImport voisi käyttää useCollection-hookia; nykyinen suora `collection.load()` riittää kertakäyttöön)

### Luovutus 2026-10-02 · Digiturva → PM
- Katselmointi `docs/reports/SEC-008-t014-tuonti.md`: SR-17, SR-14 ja SR-15 täyttyvät, ei Critical/High/Medium; SEC-021 (Low, nimen katkaisu surrogaattiparin kohdalta) ja SEC-022 (Info, 10 000 merkin rivi testiin); App.test.tsx:n 20 s aikaraja hyväksyttävä. Ei estä Done-tilaa. SECURITY.md: R-9 suljettu, R-13 päivitetty.
