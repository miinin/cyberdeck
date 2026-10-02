# T-046 · Pakan haku Netdeck-linkistä: "mitä minulta puuttuu tästä pakasta"
**Tila:** Done · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02)
**Malli:** D-014. Digiturva katselmoi, koska selain kutsuu taas ulkoista palvelua (CSP, tietosuoja, epäluotettava JSON). Muutos poikkeaa D-013:n `connect-src 'self'`-linjasta, mutta käyttäjä pyysi linkkihakua 2026-10-02. PM kirjaa päätöksen D-015:ksi.
**Haara:** `t-046-pakka-linkista`

## Tausta (PM:n selvitys 2026-10-02)
- Netdeckissä on julkinen rajapinta, joka sallii CORS:n meidän originillemme (vastaus `Access-Control-Allow-Origin: <origin>`):
  - Lista: `GET https://api.netdeck.gg/api/cyberpunk/decks/public?limit=N` palauttaa `{items, total, limit, offset}`. Itemeissä ovat `id`, `name`, `owner.display_name`, `card_count`, `is_valid`, `updated_at` ja `preview.colors`.
  - Yksittäinen pakka: `GET https://api.netdeck.gg/api/cyberpunk/decks/<uuid>` palauttaa `name` ja `zones[]`. Vyöhykkeet ovat `zone_code` `legends` / `deck` / `sideboard`, ja jokaisella vyöhykkeellä on `cards[]`, jossa on `quantity` ja `card.id`.
- `card.id` on sama kuin meidän `cards.json`in `id` (tarkistettu: Jackie Welles 40502c1f-…).
- Sivuston pakka-URL:t: sekä `https://netdeck.gg/decks/cyberpunk/<uuid>` että `https://netdeck.gg/cyberpunk/decks/<uuid>` vastaavat. Linkistä otetaan vain UUID.

## Hyväksymiskriteerit
1. **Tuontinäkymä (T-014):** tuontinäkymään tulee välilehti tai kenttä "Netdeck-linkki". Käyttäjä liittää URL:n ja painaa "Hae pakka".
   - URL:n on oltava `https://netdeck.gg/...` (tai `www.`), ja siitä poimitaan ankkuroidulla regexillä tasan yksi UUID. Muuten näytetään selkokielinen virhe, eikä pyyntöä tehdä.
2. **Haku** `src/api/netdeckDecks.ts`:
   - `fetch('https://api.netdeck.gg/api/cyberpunk/decks/' + uuid, { credentials: 'omit', referrerPolicy: 'no-referrer' })`
   - Aikakatkaisu 10 s (AbortController).
   - Vastauksen kokoraja 512 kt: `Content-Length` tarkistetaan, jos se on saatavilla, ja muuten luettu teksti ennen `JSON.parse`a.
   - Ei uudelleenyrityssilmukkaa.
   - Virheet selkokielellä: verkkovirhe, pakkaa ei löydy, vastaus ei kelpaa.
3. **Validointi:** vastaus validoidaan kuten muu epäluotettava syöte (validate.ts-apurit).
   - Hyväksytään vain tarvittavat kentät: `name` (merkkijono, siivotaan SR-11:n sääntöjen mukaan) ja `zones[].zone_code` ∈ {legends, deck, sideboard}.
   - `cards[].quantity` on kokonaisluku 1–99 ja `card.id` merkkijono enintään 64 merkkiä.
   - Rajat: enintään 3 vyöhykettä ja enintään 300 riviä yhteensä.
   - Muut kentät ohitetaan. Erityisesti `image_url`ia ei käytetä (SR-1).
4. **Kortit** täsmätään `card.id`:llä meidän dataan. Varapolku: `normalizeCardName(name - subname)`. Tunnistamattomat näytetään kuten T-014:ssä. Sideboard näytetään raportissa omana osionaan "Sideboard (ei mukana pakassa)", eikä sitä tallenneta pakkaan.
5. **Raportti ja "Tallenna pakaksi"** ovat samat kuin T-014:ssä (käytä samaa `deckReport`-polkua). Raportissa näkyvät pakan nimi ja tekijä ("Netdeck: <nimi>, tekijä <display_name>") tekstinä. Tallennetun pakan oletusnimi on Netdeck-pakan nimi.
6. **CSP:** `firebase.json`in molemmille sivustoille `connect-src 'self' https://api.netdeck.gg`. Ei muita muutoksia. firebaseConfig-testi (T-004) varmistaa, että sivustot ovat identtiset.
7. **Tietosuoja:** näkymässä on ennen hakua lyhyt huomautus: "Haku lähettää pyynnön Netdeck.gg-palveluun." Digiturva päivittää PRIVACY.md:n (IP-osoite Netdeckille vain käyttäjän pyynnöstä).
8. **Testit:** URL:n jäsennys (kelvolliset ja kelvottomat, myös `netdeck.gg.evil.com` ja `javascript:`), validointi (puuttuvat kentät, liian suuret määrät, liikaa rivejä, väärät tyypit, ylimääräiset kentät), täsmäys ja virhepolut väärennetyllä fetchillä (setup.ts estää oikean verkon). Koko `npm test`, lint ja build menevät läpi. CHANGELOG `[Julkaisematon]`.

## Rajaukset
- Julkisten pakkojen selauslista ("tuoreimmat" tai "turnaus") kuuluu IDEAS.md:hen. Rajapinnassa ei ole turnaussuodatinta (`sort=tournament` → 400).
- Muut pakkasivustot eivät kuulu tähän (ei rajapintaa tai CORS:ia). Niiden pakat tuodaan tekstinä (T-014).

## Luovutukset

### Luovutus 2026-10-02 · Koodari → PM (Digiturva katselmoi)
- Mitä tehtiin: linkkihaku tuontinäkymään (oma lomake "Hae pakka Netdeck-linkistä" tekstikentän yläpuolella). Uudet tiedostot: `src/domain/netdeckDeck.ts` (URL-jäsennys, validointi, täsmäys), `src/netdeck/fetchNetdeckDeck.ts` (haku), testit niille; muutettu `deckText.ts` (valinnaiset `sideboard`, `source`), `deckReport.ts` (`sideboardRows`, `source`), `DeckImport.tsx`, `deckTexts.ts`, `firebase.json` (connect-src molemmilla sivustoilla), `firebaseConfig.test.ts`, CHANGELOG.
- ESLint-ratkaisu: haku ei ole `src/api`:ssa, vaan uudessa kansiossa `src/netdeck/`. Näin `noApiInApp`-kielto (`**/api`, `**/api/**`) koskee edelleen vain kortti-API:a, eikä sääntöä muutettu. Poikkeus kortin kohtaan 2 (tiedostopolku). Domain-kerros ei riipu mistään uudesta. Arkkitehti voi halutessaan kirjata kansion ARCHITECTURE.md:hen.
- Toteutus: HTTPS-URL ankkuroitu regex (netdeck.gg / www., yksi UUID, URL ≤300 merkkiä), fetch `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, 10 s aikakatkaisu, Content-Length ja luetun tekstin raja 512 kt, ei uudelleenyritystä, UUID pienillä kirjaimilla. Validointi tiukka: mikä tahansa rakennevirhe (väärä tyyppi, quantity ei 1–99, id >64, >3 vyöhykettä, >300 riviä, tuntematon zone_code) hylkää koko vastauksen. Nimet `cleanText`illä. `image_url` ja muut kentät ohitetaan. Kortit täsmätään `card.id`:llä, varapolkuna `cardKey(name, subname)`. Valinnaisesti luetaan `card.name`/`card.subname` ja `owner.display_name` (oletus: rajapinnan muoto kortin mukaan, oikeaa vastausta ei verkossa testattu).
- Tunnetut rajoitteet: 512 kt raja tarkistetaan `text()`-luvun jälkeen, jos Content-Length puuttuu (ei striimausta). Lomakkeen tekstit (linkHeading, virheilmoitukset, "Haku lähettää pyynnön Netdeck.gg-palveluun.") kirjoitin itse kortin tekstien mukaan: Sisällöntuottaja/UX tarkistaa. PRIVACY.md jää Digiturvalle. Oikeaa Netdeck-vastausta ei haettu käsin (testit väärennetyllä fetchillä).
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (uusi kerros `src/netdeck` ARCHITECTURE.md:hen).
- Testit: koko `npm test` 635/635 läpi (39 tiedostoa), `npm run lint` (max-warnings 0) ja `npm run build` läpi, `tsc --noEmit` puhdas.

### Luovutus 2026-10-02 · Digiturva → PM
- Katselmointi tehty: `docs/reports/SEC-009-t046-netdeck-linkki.md`. Ei Critical/High (Low: SEC-023 striimaamaton kokoraja, SEC-024 siivoamaton id-label; Info: SEC-025). CSP todennettu esikatselussa, testit 642/642, `npm audit` 0. SECURITY.md (SR-20, R-17, luku 16) ja PRIVACY.md (rivi 9b) päivitetty. Ei vetoa.

### PM 2026-10-02 · Done (D-014, D-015)
- PR #17: CI vihreä. Esikatselussa oikea Netdeck-pakka (d6fc7253-…) haettiin linkistä: nimi, tekijä ja raportti (43 puuttuvaa) oikein. Digiturva SEC-009: ei Critical/High.
- Velaksi: T-047 (SEC-023 rungon luku paloittain, SEC-024 card.id:n siivous). Linkkikentän tyyli T-044:ään.
