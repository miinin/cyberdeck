# SEC-012 · T-054a0 testisivusto erilliseen Firebase-projektiin · workflow- ja infrakatselmointi

**Päivä:** 2026-10-03 · **Katselmoija:** Digiturva · **Malli:** D-014 (kevyt)
**Laajuus:** `git diff 558a506..HEAD` (commit 4098ad3) haarassa `t-054-kirjautuminen-ja-pilvitallennus`: `.firebaserc`, `package.json` (`build:test`), `.github/workflows/deploy-test.yml` ja `preview.yml`, URL-päivitykset dokumenteissa. Vertailukohta D-017 "Muutos K-P8" ja SEC-011. Ei uusia riippuvuuksia (vain uusi npm-skripti), joten `npm audit` ei ollut tarpeen. Konsolia tai GitHubin asetuksia ei tarkistettu (ei pääsyä), vaan roolit arvioitiin konsolitehtävän 7 ja action-hosting-deployn ohjeen perusteella.

## Tulos
Ei Critical-, High- eikä Medium-löydöksiä. Yksi Low (aiempi R-4, nyt pienempi) ja kaksi Info. **Ei estä yhdistämistä testiin.** Muutos parantaa turvaa: tuotannon deploy-salaisuus poistui PR- ja test-workflowista, joten PR-haarojen koodi ei enää aja tuotantoprojektin oikeuksilla.

## Löydökset

### SEC-035 · Tuotannon salaisuus on yhä repotason salaisuus · Low
**Sijainti:** GitHubin asetukset (`FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG`), `.github/workflows/deploy-prod.yml` · **Riski:** R-4
**Toistaminen:** 1) Henkilö, jolla on push-oikeus repoon, tekee haaran ja muuttaa `preview.yml`:ssä salaisuuden nimeksi `FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG`, `projectId: cyberdeck-tcg`, `target: prod`, `channelId: live`. 2) Avaa PR:n. 3) `pull_request`-workflow ajetaan PR-haaran versiolla ja saa repotason salaisuuden.
**Odotettu:** tuotannon salaisuus vain `main`-haaran ajoille · **Havaittu:** kaikki saman repon workflow-ajot voivat viitata siihen.
**Vaikutus:** tuotantosivuston korvaaminen. Todennäköisyys on nyt aiempaa pienempi: hyökkäys vaatii nimenomaisen workflow-muutoksen, joka jää SR-9:n katselmointiin, eikä tavallinen PR-esikatselu enää koske tuotantoa. Vain repon omistajalla on push-oikeus, ja fork-PR:t eivät saa salaisuuksia.
**Korjausehdotus (käyttäjän toimi GitHubissa):** Settings → Environments → `production`, Deployment branches: vain `main`. Siirrä salaisuus environment-salaisuudeksi (poista repotason versio) ja lisää `deploy-prod.yml`:n jobiin `environment: production`. Workflow-rivi lisätään vasta, kun environment on olemassa, muuten tuotantodeploy kaatuu.
**Tila:** Avoin, ei estä. R-4 päivitetty.

### SEC-036 · Esikatselun Auth-domainin lisäys epäonnistuu odotetusti · Info
**Havainto:** action-hosting-deploy (firebase-tools `hosting:channel:deploy`) yrittää lisätä esikatselukanavan domainin Authin sallittuihin domaineihin. Ilman Firebase Authentication Admin -roolia se tulostaa varoituksen, mutta deploy onnistuu. Tämä on toivottu tila: esikatseludomainit eivät päädy testiprojektin sallittuihin domaineihin (konsolitehtävä 5, SR-21).
**Toimenpide:** ensimmäisen PR-esikatselun lokista tarkistetaan, että kyse on varoituksesta eikä virheestä. Jos deploy kaatuu muuhun oikeuteen, puuttuva rooli lisätään ja kirjataan korttiin (D-017). Authentication Adminia ei lisätä.

### SEC-037 · Vanha testisivusto jää palvelemaan vanhaa buildia · Info
**Havainto:** `cyberdeck-tcg-test.web.app` (tuotantoprojektissa) palvelee viimeisintä test-buildia, kunnes konsolitehtävä 13 (`hosting:disable`) tehdään. Vanhat PR-esikatselut vanhenevat 14 vrk:ssa. Sivustolla ei ole kirjautumista eikä Firebase-configia, joten vaikutus on vain vanhentunut sisältö.
**Toimenpide:** konsolitehtävä 13 heti, kun uusi testisivusto toimii.

## Tarkistettu, ei löydöksiä
- **Tuotannon salaisuus ei PR- eikä test-workflowssa:** `grep` `.github/workflows/`: `FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG` vain `deploy-prod.yml`:ssä, `projectId: cyberdeck-tcg` ja `target: prod` vain siellä. `preview.yml` ja `deploy-test.yml` käyttävät `..._DEV`-salaisuutta ja `cyberdeck-tcg-dev`-projektia.
- **Fork-PR:t:** `preview.yml` käyttää `pull_request`-tapahtumaa (ei `pull_request_target`), joten GitHub ei anna fork-PR:ille salaisuuksia, ja lisäksi job ohitetaan ehdolla `head.repo.full_name == github.repository`. Ei `workflow_run`- tai `issue_comment`-laukaisimia.
- **Oikeudet:** `deploy-test.yml` `contents: read`; `preview.yml` `contents: read`, `pull-requests: write` (esikatselukommentti), `checks: write` (actionin check run). Vähimmät actionin tarpeisiin. `persist-credentials: false` säilyy kaikissa kolmessa workflowssa.
- **Testibuild ei voi deployata tuotantoon:** test-workflowt antavat vain testiprojektin palvelutilin avaimen, ja tili luodaan `cyberdeck-tcg-dev`-projektiin (konsolitehtävä 7), joten sillä ei ole oikeuksia `cyberdeck-tcg`:hen. `.firebaserc`:ssä `test`-target on enää vain `cyberdeck-tcg-dev`-projektissa ja `prod` vain `cyberdeck-tcg`:ssä, joten väärä target-projekti-pari kaatuu eikä osu toiseen sivustoon. `deploy-prod.yml` käyttää `npm run build`:ia (MODE `production`). Väärän configin päätyminen väärälle sivustolle torjutaan T-054a:ssa (`check-dist-env.mjs`, tarkka host-tarkistus). **Käyttäjän varmistus:** testiprojektin palvelutiliä ei lisätä tuotantoprojektin IAM:iin.
- **Palvelutilin roolit:** Firebase Hosting Admin (sivuston ja kanavien deploy) ja API Keys Viewer (firebase-tools lukee web-configin deployssa) riittävät action-hosting-deployn ohjeen mukaan. Cloud Run Viewer on tarpeeton (ei Cloud Run -rewritejä, `firebase.json` vain `index.html`-rewrite). Authentication Admin jätetään tarkoituksella pois (SEC-036). Vähimmät, hyväksytään.
- **`.firebaserc` ja `firebase.json`:** `firebase.json`:in kohteet `prod` ja `test` ennallaan, samat otsakkeet (CSP) molemmissa. `default`-alias on yhä tuotanto, joten aliaksetonta `firebase deploy` -komentoa suojaa edelleen hook (ennallaan).
- **`build:test`:** `vite build --mode test` muuttaa vain `MODE`:n, optimoinnit ennallaan. Ei `.env`-tiedostoja.
- **Salaisuudet:** diff ja `git log --all -p` (`private_key`, `BEGIN … PRIVATE`, `client_email`): osumia vain aiempien raporttien tarkistustaulukoissa, ei avaimia.
- **Actionien versiot:** ennallaan (`@v4`, `@v0`, tagit, ei SHA). Ei uusi asia tässä muutoksessa (SR-8, aiempi tila).
