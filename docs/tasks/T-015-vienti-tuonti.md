# T-015 · Pakan vienti ja tuonti .json- ja .txt-tiedostona
**Tila:** Done · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must
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
### Luovutus 2026-10-02 · Koodari → PM (sitten Digiturva ja UX)
- Mitä tehtiin (3 committia + viimeistely): `deckExport.ts` (json/txt-vienti, tiedostonimi SR-19), `deckJson.ts` (SR-18-tuonti: 256 kt, try/catch ilman revieveriä, format/version, `parseDeckContent`, kortin nimi omasta datasta, id ja ylimääräiset kentät ohitetaan), `ExportButtons` + `downloadFile.ts` (Blob, a[download], revokeObjectURL), Vie-painikkeet pakkalistassa ja editorissa, tuontinäkymän valitsin hyväksyy .json (tunnistus `{`-alusta; tiedostokoko-raja 256 kt json / 64 kt txt ennen lukemista), SEC-021 (`Array.from`-katkaisu), CHANGELOG.
- Mitä pyydän: Digiturva (SR-18/19, tiedostot) ja UX (uudet painikkeet ja virheviestit).
- Tekstit (UX/Sisältö tarkistettava): "Vie .json", "Vie .txt", virheet "Tiedosto ei ole cyberdeckin pakka." / "Tiedostoa ei voitu lukea. Tarkista…" / "Enintään 256 kt"; tuontiohje ja valitsimen label muutettu ("Tai valitse .txt- tai .json-tiedosto").
- Rajoitteet: .json- ja .txt-tuonti litistävät osiot yhteen nimettömään osioon (editori käyttää yhtä osiota); json:n kortin `name`-kenttää ei käytetä lainkaan (tuntematon kortti näytetään avaimella). `deckEdit.ts` kopion nimen `slice` on samaa katkaisuluokkaa kuin SEC-021, ei korjattu (ei tehtävän rajauksessa).
- Testit: `npm test` 42 tiedostoa / 680 testiä läpi, lint 0 varoitusta, build OK. Uudet: deckExport.test, deckJson.test (round trip, `__proto__`, rajat), DeckExportImport.test (UI, lataus, uusi id), deckText.test (SEC-021). Selaimessa ei ajettu käsin.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (tiedostonimen `\`-suodatus puuttui regexistä, korjattu testillä) · Suosituksia 2 (yllä: copy-nimen katkaisu, osioiden säilytys)

### Luovutus 2026-10-02 · Digiturva → PM
- Katselmointi `docs/reports/SEC-010-t015-vienti-tuonti.md`: SR-18 ja SR-19 täyttyvät, ei Critical/High/Medium. SEC-026 (Low, kopion nimen `slice` deckEdit.ts:35, backlog), SEC-027 (Info). SEC-021 varmistettu, R-13 suljettu. Ei estä Done-tilaa.

### PM 2026-10-02 · Done (D-014)
- PR #18: CI vihreä. Digiturva SEC-010: ei Critical/High, R-13 suljettu, SEC-021 Varmistettu. PM korjasi SEC-026:n (kopion nimen katkaisu koodipisteittäin) regressiotestillä, joka kaatuu ilman korjausta. SEC-027 (Info) jätetään ennalleen. Selaimessa ei kokeiltu latausta, vain testit.
