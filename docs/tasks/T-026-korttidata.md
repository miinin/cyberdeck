# T-026 · Korttidata sovelluksen mukana (ei hakua joka käynnillä)
**Tila:** In Progress · **Omistaja:** Arkkitehti → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-012)
**Suunnittelu:** Arkkitehti ☐ (ADR, kattaa myös T-027:n kuvat)
**Katselmoinnit:** Koodikatselmointi ☐ · Digiturva ☐ (data, CSP ja firebase.json, R-2) · UX ☐ (vain jos käyttäjälle näkyvät tilat muuttuvat)
**Riippuvuudet:** –. Korvaa T-003:n (välimuisti).
**Haara:** `t-026-korttidata`

## Tavoite
Kortit näkyvät heti ilman verkkohakua, eikä sovellus riipu Netdeckin rajapinnan saatavuudesta (D-012, PROJECT.md:n riski "rajapinta muuttuu tai sulkeutuu").

## Hyväksymiskriteerit
- [ ] Korttidata (151 korttia, `Card`-mallin kentät) on sovelluksessa staattisena datana, eikä sovellus kutsu Netdeckin rajapintaa käyttäjän selaimessa.
- [ ] Datan päivittämiseen on kehittäjän komento (esim. `npm run cards:update`). Se validoi datan samoilla säännöillä kuin nykyinen rajapintakerros (SR-1, SR-3 jne.) ja tuottaa deterministisen tiedoston. Ohje STATUS.md:n ajo-ohjeeseen.
- [ ] Kokoelman avaimet (`Card.key`, D-008) pysyvät samoina, eikä tallennettu data muutu.
- [ ] Lataus-, virhe- ja osittaisen datan tilat, jotka eivät enää ole mahdollisia, poistetaan tai sovitetaan Arkkitehdin linjauksen mukaan ilman, että mikään toimiva ominaisuus heikkenee.
- [ ] CSP:n `connect-src` kiristetään, jos rajapintaa ei enää tarvita (Digiturva). Testit, lint ja build menevät läpi.

## Rajaukset (ei kuulu tähän)
- Korttikuvat (T-027)
- Painokset (D-007)

## Työloki
### Checkpoint 2026-10-02 · PM
- Kortti määritelty (D-012), tila Ready. Seuraava askel: Arkkitehti tekee ADR:n (data ja kuvat), sitten Koodari.

### Checkpoint 2026-10-02 · Arkkitehti
- Tehty: ADR D-013 (tila: Ehdotettu) ja ARCHITECTURE.md luku 13 (rakenne, rajapinnat, lint ja firebase.json). Kattaa myös T-027:n kuvat.
- Kesken: –
- Seuraava askel: PM hyväksyy D-013:n osat 1–3 (ei kustannuksia, ei uusia riippuvuuksia), jonka jälkeen Koodari toteuttaa alla olevan luovutuksen mukaan.
- Avoimet kysymykset: PM:lle luovutuksessa (A1–A3).
- Muutetut tiedostot: docs/DECISIONS.md, docs/ARCHITECTURE.md, docs/tasks/T-026-korttidata.md, docs/tasks/T-027-korttikuvat.md, docs/STATUS.md

### Suunnitelma 2026-10-02 · Koodari
1. `src/domain/cardFile.ts` + testit (toCardFile, parseCardFile).
2. Päivityskomento: `scripts/cards/updateCards.ts`, `cardFileDiff.ts`, `scripts/cards-update.mjs` + testit, package.json, tsconfig, ESLint (scripts).
3. `npm run cards:update` oikeaa rajapintaa vasten, determinismi (toinen ajo = No changes) ja avainvertailu.
4. `src/data/cards.ts` + testi, App ja CatalogView ilman lataustiloja, useCardCatalog pois, ESLintin api-kielto.
5. firebase.json (CSP connect-src 'self', /assets/** Cache-Control), STATUS.md ajo-ohje, CHANGELOG, ARCHITECTURE.md toteutusosa.
6. Koodikatselmointi ja luovutus. Esikatselun curl-todennus PM:lle, koska PR:ää ei avata tässä.

## Luovutukset

### Luovutus 2026-10-02 · Arkkitehti → PM → Koodari
- **Mitä tehtiin:** ADR D-013 ja ARCHITECTURE.md luku 13. Valinnat: data tiedostossa `src/data/cards.json`, joka importataan buildiin (ei fetchiä, ei lataustilaa). Päivityskomento `npm run cards:update` ajetaan Viten `runnerImport`illa (ei uutta riippuvuutta) ja käyttää olemassa olevaa `fetchAllCards`/`mapCard`ia. `src/api/` säilyy vain skriptin käytössä. CSP: `connect-src 'self'`. `/assets/**` saa vuoden välimuistin.
- **Mitä pyydän:** PM: D-013:n hyväksyntä (osat 1–3 eivät maksa eivätkä lukitse). Koodari: toteutus alla olevin askelin.
- **Mistä katsoa:** D-013 (DECISIONS.md), ARCHITECTURE.md 13.1–13.7 ja 13.9.
- **Toteutusaskeleet (jokainen oma commit, testit vihreinä):**
  1. `src/domain/cardFile.ts` + testit (`toCardFile`, `parseCardFile`: kelvollinen, ylimääräinen kenttä, puuttuva kenttä, väärä tyyppi, `key !== cardKey(name, subname)`, toistuva avain tai id, tyhjä lista, väärä `format` tai `version`, yli 200 merkin teksti).
  2. `scripts/cards/updateCards.ts`, `cardFileDiff.ts` ja `scripts/cards-update.mjs` + testit väärennetyllä `fetchFn`illä ja muistinvaraisilla `readText`/`writeText`-funktioilla (ei verkkoa: setup.ts estää). Testaa vähintään: kirjoitus, `unchanged` (sama tuloste tavu tavulta), `skipped > 0` → `failed` eikä kirjoitusta, määrän poikkeama → `failed`, poistetun avaimen varoitus. `package.json`: `"cards:update": "node scripts/cards-update.mjs"`. `tsconfig.json`: `resolveJsonModule` ja `scripts` includeen. ESLint: `scripts/**` Node-globaalit (13.6).
  3. Aja `npm run cards:update` **kerran** (3 pyyntöä Netdeckiin, SR-5) ja commitoi `src/data/cards.json`. Aja se toisen kerran ja varmista, että tulos on `No changes` (determinismi, myös korttien järjestys). Jos järjestys vaihtuu, pysähdy ja eskaloi PM:lle (D-013 osa 1). Varmista, että **kaikki 151 avainta ovat samat kuin `mapCard`in nykyiset** (D-008, hyväksymiskriteeri 3). Datan avaimet ovat samat kuin ennen, koska sama `mapCard` tuottaa ne.
  4. `src/data/cards.ts` + `cards.test.ts`. Käyttöliittymä: `App` ja `CatalogView` 13.5:n mukaan, `useCardCatalog` ja sen testi pois, tilojen testit päivitetään. ESLint: sovelluskoodille `api`-kielto (13.6).
  5. `firebase.json` 13.7:n mukaan (molemmat sivustot identtisinä). STATUS.md:n ajo-ohje: `npm run cards:update` ja maininta, ettei sovellus enää kutsu Netdeckiä selaimessa. CHANGELOG `[Julkaisematon]`: "Kortit näkyvät heti ilman latausta."
  6. Esikatselussa `curl -sI` (13.7) ja selaimen konsoli: ei CSP-virheitä, Network-välilehdellä ei pyyntöjä api.netdeck.gg:hen.
- **Hyväksymiskriteerien todennus:** (1) `grep -r "api.netdeck.gg" dist/` ei löydä mitään, ja esikatselun verkkoliikenteessä ei ole Netdeck-pyyntöjä. (2) Komento ja STATUS.md:n ohje. (3) Avainvertailu askeleessa 3. (4) Tilat 13.5:n mukaan. (5) CSP 13.7, `npm test`, `npm run lint` ja `npm run build`.
- **Tunnetut rajoitteet ja riskit:** `runnerImport` on Viten kokeellinen API (varapolku: `tsx` devDependencyna, vaatii PM:n luvan). Testit eivät ole CI:ssä (T-004), joten semanttinen validointi ei estä julkaisua, mutta tyyppitarkistus estää. Firebase-otsakkeiden yhdistäminen usean säännön kesken todennetaan esikatselussa (13.7).
- **Katselmoinnit:** Digiturva (firebase.json, CSP, SR-9; päivittää SECURITY.md:n R-1:n, R-2:n ehdot, R-6:n ja PRIVACY.md:n Netdeckin osalta). UX kevyesti (lataus- ja virhetilat poistuvat näkyvistä). Arkkitehti vain, jos toteutus poikkeaa luvusta 13.
- **Avoimet kysymykset PM:lle:**
  - A1: D-013:n hyväksyntä (osat 1–3 eivät vaadi käyttäjää: ei kustannuksia, ei riippuvuuksia, ei lukitusta).
  - A2: Poistuvien tilojen (lataus, virhe, osittainen) testien poisto on rules.md 6:n poikkeus. D-013 perustelee sen, mutta PM:n hyväksyntä kirjataan tähän korttiin.
  - A3: Havainto `index.html`:n välimuistista (`max-age=3600`, D-013:n seuraukset). Ehdotus: oma velkatehtävä.
- **Testit:** Arkkitehti ei toteuttanut koodia. Kokeiltu: `runnerImport` lataa `src/api/mapCard.ts`:n ja tuottaa fixtuurista oikean kortin. Noden natiivi TS-import epäonnistuu päätteettömiin importteihin. `npx vite build` → JS 260 kt (82 kt gzip). Testisivuston `Cache-Control: max-age=3600` mitattu `curl -sI`:llä.

### Checkpoint 2026-10-02 · PM (D-013 hyväksytty)
- D-013 hyväksytty (osat 1–3). `sharp` (osa 4, T-027) hyväksytty ehdolla, että Digiturva tarkistaa sen T-027:ssä.
- A2: poistuvien tilojen (lataus, virhe, osittainen, tyhjä) testit saa poistaa, koska tilat poistuvat sovelluksesta (rules.md 6:n poikkeus, PM hyväksyy). Muut testit eivät saa heikentyä.
- A3: `index.html`:n välimuistiotsake kuuluu jo T-009:ään (SEC-011). T-004:n prioriteetti nostettu (Should → Must), koska `parseCardFile`-testi ei vielä estä julkaisua.
- Tila In Progress. Seuraava askel: Koodari toteuttaa luovutuksen askeleet 1–6 tässä worktreessä.

### Checkpoint 2026-10-02 · PM (Koodari keskeytetty, istunto tyhjennetään)
- Tehty (Koodari): korttitiedoston muoto ja validointi (a6ed3ac), `cards:update`-komento testeineen (1741578), 151 kortin data (56709e9), lataus-, virhe-, osittaisen ja tyhjän tilan poisto (4a57aa1). PM commitoi keskeneräisen `firebase.json`-muutoksen (CSP `connect-src` ja `/assets/**`-otsakkeet), jota EI ole testattu: 8e35488.
- Kesken: luovutuksen askel 5 (firebase.json) tarkistamatta, askel 6 (esikatselu, `curl -sI`) tekemättä, avainvertailun tulos kirjaamatta, STATUS.md:n ajo-ohje, CHANGELOG, ARCHITECTURE.md:n toteutusosa, koodikatselmointi ja luovutus.
- Seuraava askel: uusi Koodari jatkaa tästä worktreestä (`.claude/worktrees/t-026`): `git log origin/test..HEAD`, tarkista firebase.json D-013:n osaa 3 ja ARCHITECTURE.md 13.7:ää vasten, aja `npm test`, `npm run lint` ja `npm run build` ja tee loput askeleet.
- Muutetut tiedostot: scripts/, src/data/, src/domain/cardFile.ts, src/ui/*, src/App.tsx, firebase.json, package.json.
