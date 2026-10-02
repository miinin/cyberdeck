# T-004 · Testit ja lint CI:hin (sisältää T-024, T-029, T-032)
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must
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
