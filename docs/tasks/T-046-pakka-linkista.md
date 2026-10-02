# T-046 · Pakan haku Netdeck-linkistä: "mitä minulta puuttuu tästä pakasta"
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02)
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
