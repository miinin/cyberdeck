# T-035 · Hienosäätö: +/−-kontrolli, hillitty kokoelmatila (playset) ja dialogin sulkuruksi
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02, aikaraja 20 min)
**Malli:** D-014. PM tarkistaa esikatselun.
**Haara:** `t-035-hienosaato`

## Hyväksymiskriteerit
1. **Määräkontrolli:** − ja + näkyvät aina samoilla paikoilla, ja niiden välissä on määrä (myös `0`). Kun määrä on 0, − on `disabled` (tai `aria-disabled`). Mikään ei vaihda paikkaa painettaessa. Saavutettavat nimet ja ilmoitukset säilyvät.
2. **Kokoelmatila ilman asettelun siirtymää:** laatikon vasemman reunan keltainen palkki poistetaan. Tilalle tulee hillitty indikaattori, joka ei muuta laatikon kokoa: esim. laatikon 1 px:n reunan väri ja määräluvun väri.
   - 0 kpl = neutraali harmaa (nykyinen reuna)
   - 1–2 kpl = hillitty väri (esim. info- tai syaanitoken)
   - playset = vihreä (success-token tai vastaava olemassa oleva). Playset on 3 kpl, Legend-tyypillä 1 kpl.
   - Ei animaatioita, ei hehkua, ei paksuja palkkeja. Tieto ei saa välittyä pelkällä värillä: playset-tilassa näkyy pieni ✓-merkki määrän vieressä, ja sillä on visually-hidden-teksti "Pelisarja täynnä" (texts.ts). Määräluku itsessään kertoo 1–2 kpl.
   - Playset-raja on yhdessä apufunktiossa (esim. `playsetSize(card)` domainissa) ja testattu (Legend 1, muut 3).
3. **Dialogin sulkupainike:** "Sulje"-teksti korvataan ruksilla (×, `aria-label="Sulje"`, kosketusalue vähintään 44 × 44 px). Painike ei rivity.
4. Testit päivitetään ja lisätään (kontrolli määrällä 0, playset-raja, sulkupainikkeen nimi). `npm test`, lint ja build läpi. CHANGELOG `[Julkaisematon]`.

## Rajaukset
- Ei suodatinta "playset puuttuu" (IDEAS.md, jos haluat).

## Luovutukset
