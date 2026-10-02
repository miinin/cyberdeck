# T-004 · Testit ja lint CI:hin (sisältää T-024, T-029, T-032)
**Tila:** Done · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must
**Malli:** D-014. Digiturva tekee kevyen katselmoinnin, koska workflowt muuttuvat (SR-9, SEC-003).
**Haara:** `t-004-ci-testit`

## Tavoite
Rikkinäinen koodi ei pääse testisivustolle eikä tuotantoon. Testit ja lint ajetaan jokaisessa PR:ssä ja ennen julkaisua.

## Hyväksymiskriteerit
1. **T-029:** `.claude/**` on pois ESLintin (`ignores`) ja Vitestin (`exclude`) piiristä, jotta worktreet eivät tuplaa tai riko ajoja.
2. **T-024:** testi "formats large counts the Finnish way" (1 024 riviä) ei aikakatkea koko sarjan kuormassa. Korjaa syy (esim. pienempi data, joka todentaa saman muotoilun, tai testin kohdistaminen muotoilufunktioon). Testin todentama asia ei saa heikentyä. Muut koko sarjassa satunnaisesti kaatuvat testit korjataan samalla tavalla, jos niitä löytyy.
3. **T-032:** `.gitignore`en lisätään `/public/*.webp`.
4. **Workflowt:**
   - `preview.yml`, `deploy-test.yml` ja `deploy-prod.yml` ajavat ennen buildia `npm run lint` ja `npm test`, ja epäonnistuminen estää julkaisun.
   - `actions/checkout`iin `persist-credentials: false` (SEC-003).
   - Ei uusia salaisuuksia eikä laajempia oikeuksia (`permissions` ennallaan tai tiukemmat).
5. **ARCH-003:** testi, joka varmistaa, että firebase.jsonin kahden sivuston otsakkeet (CSP ym.) ovat identtiset.
6. **Todennus:**
   - Koko `npm test` paikallisesti 3 kertaa peräkkäin ilman kaatumisia, ajat kirjataan luovutukseen.
   - Lint ja build menevät läpi.
   - PR:n workflow-ajo on vihreä (PM todentaa).

## Rajaukset
- Ei uutta CI-palvelua eikä maksullisia ominaisuuksia.

## Luovutukset

### Luovutus 2026-10-02 · Koodari → PM (Digiturva kevyt katselmointi workflowista)
- Mitä tehtiin: T-029 `.claude/**` pois ESLintistä (`globalIgnores`) ja Vitestistä (`exclude`). T-024: raskas 1 024 rivin renderöintitesti korvattu `cardCount`-muotoilutestillä (`src/ui/texts.test.ts`), sama asia todennetaan. T-032 `/public/*.webp` .gitignoreen. Kaikkiin kolmeen workflowiin `persist-credentials: false` sekä `npm ci`, `npm run lint`, `npm test` ennen buildia (triggerit, permissions ja deploy-vaiheet koskemattomina). ARCH-003: `src/firebaseConfig.test.ts` vertaa prod- ja test-sivuston otsakkeita.
- Lisäksi: `src/App.theme.test.tsx` kaatui deterministisesti (T-013 lisäsi navigaatiolinkit ennen teemakytkintä, joten kytkin ei ole enää ensimmäinen Tab-kohde). Testi korjattu tabuloimaan linkkien yli. Tuotantokoodi ennallaan.
- Mitä pyydän: Digiturvan kevyt katselmointi (.github/workflows), PM todentaa PR:n workflow-ajon.
- Testit: `npm test` 3 kertaa, 34 tiedostoa / 559 testiä läpi joka kerta, ajat 22 s, 22 s, 21 s. Lint ja build läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (theme-testi) · Suosituksia 0

### Luovutus 2026-10-02 · Digiturva → PM
- Kevyt katselmointi (.github, firebase.json, .gitignore, eslint.config.js, vite.config.ts): `persist-credentials: false` kaikissa kolmessa checkoutissa, ei uusia salaisuuksia, permissions ja triggerit ennallaan (ei `pull_request_target`ia), lint ja test ennen buildia ja deployta. firebase.json ei muuttunut. SEC-003 Varmistettu ja suljettu (`reports/SEC-001-t001-katselmointi.md`). Uusia löydöksiä 0, veto: ei.

### PM 2026-10-02 · Done (D-014)
- PR #14: build_and_preview (lint + test + build) vihreä 1 min 49 s. Digiturva: SEC-003 Varmistettu, ei löydöksiä. Avoin: SECURITY.md R-9 suljetaan Digiturvan seuraavassa katselmoinnissa.
