# T-015 · Pakan vienti ja tuonti .json- ja .txt-tiedostona
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must
**Malli:** D-014. Digiturva katselmoi (tiedostot, epäluotettava syöte).
**Haara:** `t-015-vienti-tuonti`
**Sitovat vaatimukset:** SR-18, SR-19, SR-17 (.txt), SR-14, SR-15 (`sed -n '/^\*\*SR-18/,/^### 11.7/p' docs/SECURITY.md`). Vaihtomuoto D-007/D-008 (`grep -n "cyberdeck.deck" docs/DECISIONS.md`): `{ format: "cyberdeck.deck", version: 1, deck: { name, sections: [{ name, cards: [{ card, name, count }] }] } }`.

## Tavoite
Pelaaja varmuuskopioi pakkansa tai jakaa sen kaverille tiedostona, ja kaveri tuo sen omaan sovellukseensa.

## Hyväksymiskriteerit
1. **Vienti:** pakkalistassa ja editorissa on toiminto "Vie" → ".json" tai ".txt".
   - .json noudattaa vaihtomuotoa (ei id:tä eikä aikaleimoja).
   - .txt on viitemuodossa (`# Nimi`, `// Legends (3)`, `// Main deck (N)`, `3 Nimi - Alaotsikko`). Nimestä poistetaan rivinvaihdot ja ohjausmerkit.
   - Tiedostonimi muodostetaan SR-19:n mukaan.
   - Lataus `Blob` + `a[download]` + `revokeObjectURL`.
2. **Tuonti:** tuontinäkymän (T-014) tiedostovalitsin hyväksyy myös .json:n (`accept=".txt,.json,text/plain,application/json"`).
   - .json: SR-18 (256 kt ennen lukemista, `JSON.parse` try/catchissa, format/version-tarkistus, validointi `parseDeckContent`/SR-11, `__proto__`-testi, kortin nimi omasta datasta, tiedoston nimi vain varatekstinä).
   - .txt: T-014:n polku.
   - Tuonti näyttää saman raportin ja esikatselun, ja "Tallenna pakaksi" luo aina uuden pakan uudella id:llä.
3. **SEC-021 (T-014):** pakan nimen katkaisu 100 merkkiin tehdään koodipisteittäin (`Array.from`), ei `slice`llä, joten emoji ei katkea kesken.
4. **Round trip -testit:** vienti → tuonti palauttaa saman pakan sekä .json- että .txt-muodossa, myös nimellä, jossa on `//`, `#`, emoji ja erikoismerkkejä.
5. Koko `npm test`, lint ja build menevät läpi. CHANGELOG `[Julkaisematon]`.

## Rajaukset
- Koko kokoelman vienti ei kuulu tähän (IDEAS.md, jos tarpeen).

## Luovutukset
