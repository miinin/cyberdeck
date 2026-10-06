# SEC-T008: Datan tarkistus (PR #92)

**Katselmoija:** Digiturva · **Päivä:** 2026-10-06 · **Haara:** t-008-datan-tarkistus (f926bf5) · **Tulos:** Hyväksytty, ei blokkaavia löydöksiä.

## Tarkistettu
- `src/api/mapCard.ts`: `finiteNumber` korvattu `gameValue`-tarkistuksella (kokonaisluku 0–99). Validointi tiukkenee: aiemmin hyväksytyt negatiiviset, desimaali- ja jättiluvut (esim. 1e308) näytetään nyt puuttuvina (null). Tyyppitarkistus (`typeof === 'number'`) säilyy, joten merkkijonot ja NaN hylätään kuten ennenkin. Ei heikennystä.
- Kelvollisen datan säilyminen: `src/data/cards.json` (151 korttia) arvot: cost 1–9, power 0–15, ram 1–6, kaikki kokonaislukuja. Kaikki mahtuvat välille 0–99, joten mikään kelvollinen arvo ei putoa.
- `src/api/netdeckClient.ts` `toCatalog`: päällekkäinen id lasketaan nyt `skipped`-lukuun. Ensimmäinen esiintymä säilyy kuten ennenkin, joten id-törmäyksellä ei voi korvata jo hyväksyttyä korttia. Muutos koskee vain lokin lukua.
- Testit: `npx vitest run src/api` 67/67 läpi. Uudet testit kattavat arvot -5, 1.5, 1e308, 1e16 ja 100 sekä duplikaatin laskennan.
- Riippuvuudet, firebase.json ja workflowt eivät muuttuneet, joten `npm audit` -ajoa ei tarvittu. Diffissä ei ole salaisuuksia.
- BREAK-raporttien tilamuutokset (B-001, B-006, B-016 vanhentuneet D-012:n myötä) ovat pelkkää dokumentaatiota, eikä niillä ole turvavaikutusta.

## Löydökset
- Critical 0, High 0, Medium 0, Low 0.
- Info: Paketoidun tiedoston validaattori `src/domain/cardFile.ts` (`requireNumberOrNull`) ei rajaa arvoja välille 0–99. Tiedosto tehdään build-aikana `mapCard`in kautta ja on luotettu, joten tämä ei ole riski. Rajauksen voi halutessaan yhtenäistää myöhemmin (vapaaehtoinen).

**Veto:** ei blokkaa Done-tilaa.
