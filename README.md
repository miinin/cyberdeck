# Cyberdeck

Cyberdeck on epävirallinen apuväline Cyberpunk TCG -korttipelin pelaajille. Sen tavoite on pitää kirjaa omasta kortti­kokoelmasta ja pakoista ja kertoa, missä omassa pakassa puuttuva kortti on. Sovellus on tehty pelaajalle itselleen ja hänen pelikavereilleen.

Nyt valmiina on ensimmäinen versio: lista kaikista pelin korteista nimen, tyypin ja hinnan kanssa. Korttitiedot haetaan [Netdeck.gg](https://netdeck.gg):n julkisesta rajapinnasta. Kokoelma, pakat ja pakkalistan tuonti tulevat seuraavissa versioissa ([docs/PROJECT.md](docs/PROJECT.md)).

- Tuotanto: https://cyberdeck-tcg.web.app
- Testisivusto: https://cyberdeck-tcg-dev.web.app

Cyberdeck ei ole WeirdCon, Netdeck.gg:n eikä CD PROJEKT REDin hyväksymä tai tukema.

## Pikakäynnistys

Tarvitset Node.js:n version 22.13 tai uudemman. Avaimia tai ympäristömuuttujia ei tarvita.

```
npm ci              # asenna riippuvuudet package-lock.jsonin mukaan
npm run dev         # kehityspalvelin, http://localhost:5173
npm test            # yksikkötestit kerran (ei verkkokutsuja)
npm run lint        # ESLint, varoituksia ei sallita
npm run build       # tyyppitarkistus ja tuotantobuild kansioon dist/
```

Lisää komentoja (`test:watch`, `preview`, `npm audit`) on [ajo-ohjeessa](docs/STATUS.md#ajo-ohje). Turvallisuusotsakkeet (CSP ym.) tulevat `firebase.json`ista, joten ne ovat käytössä vain Firebase Hostingissa, eivät `npm run dev`:ssä.

## Rakenne

```
src/
├── api/      Netdeck.gg-rajapinnan kutsut ja datan tarkistus (ainoa kerros, joka puhuu rajapinnalle)
├── domain/   Sovelluksen oma korttityyppi
├── ui/       Näkymät, tilat ja käyttöliittymätekstit (texts.ts)
└── test/     Testien yhteiset asetukset
firebase.json         Hosting ja turvallisuusotsakkeet
.github/workflows/    Esikatselu, testisivusto ja tuotanto
```

Tarkempi kuvaus: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Julkaisu

Työ tehdään tehtävähaaroissa (`t-XXX-nimi`). Pull request `test`-haaraan saa oman esikatseluosoitteen. Kun tehtävä yhdistetään `test`-haaraan, testisivusto päivittyy. Tuotantoon (`main`) viedään vain erillisellä julkaisulla. Katso [CLAUDE.md](CLAUDE.md) ja päätökset D-001 ja D-003 ([docs/DECISIONS.md](docs/DECISIONS.md)).

## Dokumentaatio

| Tiedosto | Sisältö |
|---|---|
| [docs/STATUS.md](docs/STATUS.md) | Nykytila, seuraavat askeleet ja ajo-ohje |
| [docs/PROJECT.md](docs/PROJECT.md) | Visio, kohderyhmä ja MVP-tasot |
| [docs/TASKS.md](docs/TASKS.md) | Tehtävät ja niiden tilat |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Päätökset perusteluineen |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Rakenne, teknologiat ja testit |
| [docs/SECURITY.md](docs/SECURITY.md) | Uhkamalli ja turvavaatimukset |
| [docs/UX.md](docs/UX.md) | Suunnitteluperiaatteet ja näkymät |
| [docs/CONTENT.md](docs/CONTENT.md) | Kielitaso, sanasto ja sisältöjen oikeudet |
| [CHANGELOG.md](CHANGELOG.md) | Käyttäjälle näkyvät muutokset |
| [rules.md](rules.md), [agents.md](agents.md), [MUISTILAPPU.md](MUISTILAPPU.md) | Työtavat ja roolit |
