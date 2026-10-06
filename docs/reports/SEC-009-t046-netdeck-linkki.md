# SEC-009 · T-046 Pakan haku Netdeck-linkistä · tietoturva- ja tietosuojakatselmointi
**Päivä:** 2026-10-02 · **Katselmoija:** Digiturva · **Tehtävä:** T-046 (D-015) · **Haara:** `t-046-pakka-linkista` (diff `origin/test...origin/t-046-pakka-linkista`, src + firebase.json) · **PR:** #17

## Yhteenveto
Ei Critical- eikä High-löydöksiä. Löydökset: 2 × Low, 1 × Info. Ei estä Done-tilaa. SR-20 (uusi) täyttyy. R-17 kirjattu SECURITY.md:hen, PRIVACY.md rivi 9b.

## Ajetut tarkistukset
- `npx vitest run`: 39 tiedostoa, 642/642 läpi (worktree, origin/t-046-pakka-linkista).
- `npm audit --omit=dev`: 0 haavoittuvuutta. Riippuvuudet eivät muuttuneet.
- Salaisuushaku diffistä (avain, token, secret, password): ei osumia.
- URL-regex kokeiltu käsin Nodella: `netdeck.gg.evil.com`, `evil.com@netdeck.gg`, `netdeck.gg@evil.com`, `netdeck.gg\@evil.com`, `http:`, `javascript://netdeck.gg/…`, polun jatke `/../x`, rivinvaihto `#`-osan jälkeen, liian pitkä UUID → kaikki hylätty. Isot kirjaimet hyväksytään ja UUID muutetaan pieniksi. 300 merkin syöte < 1 ms (ei ReDoSia).
- Esikatselu `https://cyberdeck-tcg-test--pr17-t-046-pakka-linkista-z5pwtoss.web.app/` (`curl -sI`): `Content-Security-Policy: … connect-src 'self' https://api.netdeck.gg; …`, muu CSP ennallaan, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`.

## Tarkistettu, ei löydöksiä
- **URL-jäsennys (SR-20.1):** ankkuroitu `^https://(www.)?netdeck.gg/` ja välitön `/` hostin jälkeen, joten `@`-, alidomain- ja skeematemput eivät mene läpi. Linkin hostia ei käytetä pyynnössä lainkaan: osoite on kiinteä `NETDECK_DECK_URL` + `encodeURIComponent(uuid)` (puolustus syvyyssuunnassa).
- **fetch (SR-20.2–3):** `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `method: 'GET'` (testi), AbortController 10 s kattaa myös rungon luvun, ei uudelleenyrityksiä, 404 → not-found, muu ei-ok → network. Content-Length (CORS-safelisted, luettavissa) ja luettu teksti ≤ 512 k merkkiä ennen `JSON.parse`a.
- **JSON-validointi (SR-20.4):** `isRecord` hylkää taulukot ja nullin, vyöhykkeet ≤ 3, rivit ≤ 300, `quantity` kokonaisluku 1–99, `id` 1–64 merkkiä, `zone_code` sallittujen listalta, tekstit `cleanText` (NFC, ohjaus- ja bidi-merkit pois, pituusraja). Rakennevirhe hylkää koko vastauksen. Ei objektien yhdistämistä eikä dynaamisia avaimia: täsmäys `Map`-rakenteilla, joten `__proto__`-avaimet eivät saastuta prototyyppiä. `image_url` ja muut kentät ohitetaan (testi varmistaa, ettei `evil.example` päädy malliin).
- **Renderöinti (SR-1, SR-20.5):** kaikki tekstinä Reactin kautta. Ei `innerHTML`ia tai `dangerouslySetInnerHTML`ia (git grep). Tallennettavan pakan nimi tulee `cleanText`istä ja kulkee SR-17:n tallennuspolun (aina uusi pakka) läpi. Sideboardia ja `source`a ei tallenneta.
- **Virheviestit:** kiinteät tekstit `deckTexts.linkErrors`-avaimilla. Poikkeuksen viesti sisältää vain virhetyypin, eikä sitä näytetä käyttäjälle. Odottamaton virhe → yleinen network-teksti.
- **CSP:** vain `connect-src` muuttui, molemmat sivustot identtiset (`firebaseConfig.test.ts`), todennettu esikatselussa.
- **Kilpailutilanteet:** uusi haku keskeyttää edellisen, ja unmount keskeyttää haun. Keskeytetyn haun tulos hylätään.

## Löydökset

### SEC-023 · Vastauksen runko luetaan kokonaan ennen kokorajaa, jos Content-Length puuttuu · Low
**Sijainti:** src/netdeck/fetchNetdeckDeck.ts (`await response.text()`) · **Tehtävä:** T-046
**Toistaminen:** 1) Väärennetty fetch palauttaa chunked-vastauksen ilman Content-Lengthiä ja kymmeniä megatavuja. 2) `response.text()` lukee kaiken muistiin. 3) Raja tarkistetaan vasta sen jälkeen.
**Odotettu:** luku keskeytyy 512 kt:n kohdalla · **Havaittu:** luku jatkuu, kunnes runko loppuu tai 10 s aikakatkaisu laukeaa.
**Vaikutus:** vain Netdeckin (tai sen kaappaajan) hallitsema vastaus voi kuormittaa käyttäjän oman välilehden muistia enintään 10 sekunnin ajan. Ei tietovuotoa. Koodari tunnisti rajoitteen luovutuksessa.
**Korjausehdotus:** lue `response.body.getReader()`-silmukassa ja peruuta (`reader.cancel()`, `controller.abort()`), kun luettu määrä ylittää rajan. Voidaan kirjata `[velka]`-tehtäväksi.
**Tila:** Korjattu (T-047)

### SEC-024 · Tunnistamattoman rivin `card.id` näytetään siivoamatta · Low
**Sijainti:** src/domain/netdeckDeck.ts `netdeckToParsedDeck` (label `row.id`, kun `card.name` puuttuu) · **Tehtävä:** T-046
**Toistaminen:** 1) Vastauksessa rivi, jossa `card.id` on esim. `"‮abc"` tai sisältää ohjausmerkkejä, eikä `card.name`a ole. 2) Rivi näkyy "Tunnistamattomat"-listassa id:nä.
**Odotettu:** näytettävä teksti siivottu kuten muut nimet (`cleanText`) · **Havaittu:** id validoidaan vain tyypin ja pituuden (≤ 64) osalta.
**Vaikutus:** kosmeettinen tekstin harhautus (bidi-ohjausmerkit) raporttinäkymässä. Ei XSS:ää, koska renderöinti on tekstinä, ja teksti on katkaistu 100 merkkiin. Id:tä ei tallenneta.
**Korjausehdotus:** validoi `card.id` tiukasti (esim. `/^[0-9A-Za-z-]{1,64}$/`) ja hylkää vastaus muuten, tai käytä labelissa `cleanText(row.id, 1, 64) ?? '?'`.
**Tila:** Korjattu (T-047)

### SEC-025 · Netdeck näkee käyttäjän IP-osoitteen ja Originin linkkihaussa · Info
**Sijainti:** src/netdeck/fetchNetdeckDeck.ts, firebase.json (CSP) · **Tehtävä:** T-046
**Havainto:** D-015:n mukainen ja hyväksytty muutos. Pyyntö lähtee vain painalluksesta, ja näkymässä on huomautus ennen hakua. Origin-otsake paljastaa pyynnön tulevan cyberdeckistä. Pakan tekijän nimimerkki (julkinen) näytetään, mutta sitä ei tallenneta. PRIVACY.md rivi 9b, yhteenveto ja säilytys päivitetty. K-P1 ja K-P2 (rekisterinpitäjä ja tietosuojailmoitus) koskevat taas Netdeck-yhteyttä linkkihaun osalta: käyttäjän päätettäväksi PM:n kautta.
**Korjausehdotus:** ei koodimuutosta. Mahdollisessa tietosuojailmoituksessa maininta linkkihausta.
**Tila:** Kirjattu

## Veto
Ei. Done-tilaa ei estetä (ei Critical- eikä High-löydöksiä).
