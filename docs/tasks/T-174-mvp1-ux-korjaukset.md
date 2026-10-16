# T-174 · MVP-1:n UX-loppukatselmoinnin korjaukset
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Lähde:** `docs/reports/MVP1-UX-2026-10-17.md` (32 löydöstä). Käyttäjän pysyvät toiveet: painikkeet eivät saa pompata, päällekkäisyydet ja ylivuodot korjataan aina, eikä sivulla ole sisäistä vieritystä.

## Korjataan (yksi kortti, yksi julkaisu)
- **Kaikki pakolliset UX-01–UX-13.** Huomio UX-09:ään: kytke pakkaeditorin hakutulosten valmis Omistetut-suodatin (`DeckEditor.tsx`, `onCollectionFilterChange` on nyt no-op) ja omistettujen määrä näkyviin. **Oletus pysyy Kaikki**, koska oletuksen muuttaminen on käyttäjän tuotepäätös (kirjattu STATUS.md:n kysymyksiin).
- **Suositukset, jotka ovat tyyli- tai asetteluvikoja:** UX-14 (toissijaisen painikkeen hover omassa sävyssään kuten T-170: ei syaania eikä alleviivausta, vaan reunan korostus ja 1 px nousu), UX-15, UX-16, UX-18, UX-19, UX-20, UX-21, UX-22, UX-23, UX-24 (varaa tila, jotta rivit eivät kasva), UX-25, UX-26, UX-27, UX-28, UX-29 ja UX-32a (tekstivirheet).
- **T-173:n suositus:** sealed-poolin ruudukko on 320 px:llä noin 10 000 px pitkä (2 saraketta). Tiivistä se esim. 3 sarakkeeseen ja ryhmittele tyypeittäin, jolloin tuplat näkyvät yhtenä ruutuna määrämerkillä.
- **Ei nyt:** UX-17 (dialogin sisäinen vieritys, käyttäjän päätös), UX-30 ja UX-31 (mikrokopio ja sisältö, PM käy läpi erikseen).

## Tarkistus
- Ennen ja jälkeen kuvakaappaukset jokaisesta löydöksestä raportin leveyksillä ja teemoissa (headless Chrome, skripti scratchpadiin). Mittaa pomppiminen elementin `getBoundingClientRect`-arvoilla ennen ja jälkeen tilan vaihdon (0 px).
- `npm test`, `npm run lint` ja `npm run build`. Jokaisesta pakollisesta korjauksesta, joka on testattavissa jsdomilla, kirjoitetaan testi (esim. UX-09-suodatin ja UX-11:n väri).

## Luovutus
