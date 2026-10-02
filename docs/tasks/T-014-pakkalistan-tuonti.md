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
