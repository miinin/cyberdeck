# SEC-089: T-089 esikatselukanavien vanhenemisaika

**Katselmoija:** Digiturva · **Päivä:** 2026-10-06 · **Haara:** t-089-esikatselu-kiintio · **Diff:** `origin/test...t-089-esikatselu-kiintio`

## Muutos
`.github/workflows/preview.yml`: action-hosting-deploy `expires: 14d` → `3d` ja selittävä kommentti. Lisäksi `docs/TASKS.md` (1 rivi). PM poisti käsin 50 yhdistettyjen PR:ien esikatselukanavaa projektista `cyberdeck-tcg-dev` (live-kanava jäi).

## Tulos: ei löydöksiä (Critical 0, High 0, Medium 0, Low 0)

## Tarkistetut alueet
- **Oikeudet:** workflown `permissions` (checks: write, contents: read, pull-requests: write) ennallaan. Fork-PR-rajaus (`head.repo.full_name == github.repository`) ja `persist-credentials: false` ennallaan.
- **Salaisuudet:** sama `FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG_DEV` ja `GITHUB_TOKEN`; ei uusia salaisuuksia eikä salaisuuksia diffissä.
- **Tuotanto:** esikatselu deployaa yhä vain `cyberdeck-tcg-dev`/`target: test`. Tuotannon (`cyberdeck-tcg`) ja testin live-deployt ovat eri workflowssa, eikä niihin koskettu.
- **Riippuvuudet:** ei muutoksia (action-versio `@v0` ennallaan), joten `npm audit` ei ollut tarpeen.
- **Vaikutus:** lyhyempi vanhenemisaika pienentää julkisesti saatavilla olevien vanhojen esikatseluversioiden määrää ja ikää, joten se on turvan kannalta parannus. Käsin tehty kanavien poisto koski vain esikatselukanavia testiprojektissa, ei live-kanavaa eikä tuotantoa.

## Huomio (ei löydös)
Kiintiö voi täyttyä uudelleen, jos yli noin 50 PR-päivitystä tai PR:ää tehdään 3 päivässä. Toimintaan liittyvä riski, ei tietoturvariski.

## Veto
Ei blokkaa Done-tilaa.
