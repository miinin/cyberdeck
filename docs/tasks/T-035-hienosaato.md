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
### Luovutus 2026-10-02 · Koodari → PM
- Tehty: aina paikallaan oleva −/määrä/+ (− `disabled` kun 0, määrä 0 näkyy), palkki pois, reunaväri 0 = harmaa / 1–2 = info (syaani) / playset = vihreä + ✓ ja visually-hidden "Pelisarja täynnä" (texts.ts), `playsetSize()` domain/card.ts, dialogin sulku × (aria-label "Sulje", 44 px).
- Uusi token `--color-success`: tumma #39e08a, vaalea #17713f (laskettu noin >=4,5:1 pintaa vasten, ei mitattu työkalulla). `--color-owned` nyt transparent (ei taustasävyä).
- Fokus: kun − muuttuu disabled-tilaan fokusoituna, fokus siirretään +:aan (myös Chromen disabled-fokus-oikku).
- Testit: 1442/1442 läpi, lint ja build läpi. Uudet: playsetSize, playset-merkintä, − disabled 0:ssa. Ei tarkistettu silmin selaimessa.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (käyttämättömät --color-owned-hover-tokenit ja is-owned:hover-sääntö voi siivota). Prettier --check valittaa 65 tiedostoa jo ennestään (ei osa lintiä).
