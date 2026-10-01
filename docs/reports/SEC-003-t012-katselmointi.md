# SEC-003 · T-012 kokoelman tietoturva- ja tietosuojakatselmointi

**Tehtävä:** T-012 (Kokoelma: omistettujen korttien merkintä) · **Katselmoija:** Digiturva · **Päivä:** 2026-10-01
**Kohde:** `git diff origin/test...origin/t-012-kokoelma` (commitit c50a02d–b732d1d), PR #5, esikatselu https://cyberdeck-tcg-test--pr5-t-012-kokoelma-p0gxaskf.web.app
**Pyyntö:** SR-12, SR-13 (`isStoragePersisted`, `persist()` vain käyttäjän toimesta), määrien syöte ja rajat, tallennusvirheiden tekstit, SEC-007:n toipumispolku, R-11 (usea välilehti), SR-14–SR-16, PRIVACY.md.

## Yhteenveto

| Vakavuus | Määrä |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 2 (SEC-011, SEC-012) |
| Info | 1 (SEC-013) |

**Veto: ei.** Ei Critical- eikä High-löydöksiä, joten Done-tila ei esty tietoturvan tai tietosuojan perusteella. SR-12, SR-13, SR-14, SR-15 ja SR-16 täyttyvät. SEC-007 (T-011) on käsitelty käyttöliittymässä ja suljettu. Molemmat Low-löydökset koskevat ilmoitustekstejä, jotka voivat ohjata käyttäjän poistamaan oman kokoelmansa. Ne ovat pieniä tekstikorjauksia ja kannattaa tehdä tämän tehtävän korjauskierroksella, mutta SEC-011 on viimeistään korjattava ennen ensimmäistä skeemaversion nostoa.

## Ajetut tarkistukset

| Tarkistus | Tulos |
|---|---|
| `npm test` | 17 tiedostoa, 424/424 läpi |
| `npm run lint` (`--max-warnings 0`) | OK |
| `npm audit --audit-level=high` | 0 haavoittuvuutta. `package.json`, `package-lock.json`, `firebase.json` ja `.github/` eivät muuttuneet (diff-stat). |
| Salaisuushaku: tehtävän commitit (`git log -p origin/test..origin/t-012-kokoelma`) ja koko historia (`git log --all -p`: Googlen API-avaimet, GitHub-tokenit, yksityiset avaimet, `private_key`) sekä seurattujen tiedostojen nimet (`.env`, serviceAccount, credentials, `.pem`, `.key`) | Ei osumia |
| Diffin nielut: `innerHTML`, `dangerouslySetInnerHTML`, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `fetch(`, `href=`, `src=`, `eval`, `new Function`, `RegExp(`, `postMessage`, `window.open` | Ei osumia lisätyillä riveillä |
| Esikatselun otsakkeet (`curl -I`, yksi GET) | CSP ennallaan. `Cache-Control: max-age=3600` myös `index.html`:lle (liittyy SEC-011:een) |

## Vaatimusten täyttyminen

### SR-12 · Tallennus vain tallennuskerroksen kautta: täyttyy
- Käyttöliittymä tuo tallennuskerroksesta vain `src/storage/index.ts`:n julkisen rajapinnan: `openBrowserRepositories`, `isStoragePersisted`, `requestPersistentStorage`, `StorageError` ja tyypit (`App.tsx`, `CatalogView.tsx`, `collectionStore.ts`, `useCollection.ts`). Ei suoria tallennustilan kutsuja `src/storage/`:n ulkopuolella (grep ja lint).
- `isStoragePersisted()` on lisätty tallennuskerrokseen (`keyValueStore.ts`) ja viety `index.ts`:n kautta, kuten PM päätti (A2).
- Repositoriot avataan kerran sivun latauksessa (`useState`-alustaja `App.tsx`:ssä), joten `subscribe` ja koetallennus eivät monistu renderöinneissä.

### SR-13 · Tallennusvirheet ja pysyvä tallennus: täyttyy
- **`isStoragePersisted()`** kutsuu vain `navigator.storage.persisted()`, joka on vain-luku-kysely eikä näytä lupakyselyä missään selaimessa. Puuttuva rajapinta tai poikkeus → `false`. Testit: ei `navigator.storage`a, ei `persisted`ia, selain heittää, ja `persist` ei kutsuta (`keyValueStore.test.ts`).
- **`requestPersistentStorage()`** (`persist()`) kutsutaan vain painikkeen `onClick`issa (`handleRequestPersistence`). Näkymätestit todentavat, ettei `persist`ia kutsuta sivun latautuessa, että se kutsutaan kerran painalluksesta (myös `busy`-tilan tuplapainallus estetty) ja ettei sitä kutsuta, jos lupa on jo annettu. Painike näytetään vain, kun `persistent: true`.
- **Virheet:** käyttöliittymä valitsee tekstin vain `StorageError.kind`-kentästä (`saveErrorContent`). `message`ia, `cause`a, avaimia, versionumeroa tai `backupKey`tä ei näytetä (testi: teksti ei sisällä `cyberdeck:`, `backup` tai aikaleimaa). Tuntematon virhe → yleinen teksti. Tekninen tieto menee vain `console.error`iin; `StorageError`in viestit ovat kiinteitä eivätkä sisällä käyttäjän dataa.
- **Ei tallentamatonta määrää näytöllä:** epäonnistunut tallennus tyhjentää odottavat tavoitemäärät ja palauttaa näkymän viimeksi tallennettuun `Collection`iin (`collectionStore.drain`). Testattu `quota`-, `unavailable`-, `limit-reached`-, `invalid-input`- ja `newer-version`-virheillä.
- **`persistent: false`:** näytetään sulkematon varoitus, ja pysyvän tallennuksen painiketta ei näytetä.

### Määrien syöte ja rajat (0–999): täyttyy
- Määrä syntyy vain painikkeista: `+` → `count + 1` vain, kun `count < 999` (999:ssä `aria-disabled` ja ilmoitus, ei tallennusta), `−` näkyy vain, kun `count > 0`. Vapaata tekstisyötettä ei ole.
- Tallennuskerros validoi uudelleen (`isCardKey`, kokonaisluku, 0–999, `MAX_COLLECTION_ENTRIES`), joten käyttöliittymän ohittaminen (esim. konsolista) ei tuota virheellistä dataa. `invalid-input` näkyy yleisenä virheenä.
- Avain tulee `Card.key`:stä (korttiluettelon oma data), ei käyttäjältä.

### SEC-007 · Toipumispolku käyttöliittymässä: käsitelty
- `reset` + `backupKey: null` näyttää sulkemattoman danger-laatikon (`resetNoBackupTitle/Body`), jossa kerrotaan, että vanhoja tietoja ei ole poistettu ja uudet merkinnät eivät tallennu. Kontrollit pysyvät käytössä (A4), ja jokainen tallennus epäonnistuu `quota`- tai `unavailable`-tekstillä eikä jätä tallentamatonta määrää näytölle (testi).
- Toipuminen toimii ilman koodimuutosta: kun tilaa vapautuu, seuraava `setCount` (`mutate`) tai sivun uudelleenlataus (`resetCorrupt`) ottaa varmuuskopion ja jatkaa. Tekstin ohje on kuitenkin monitulkintainen (SEC-012).

### R-11 · Usean välilehden kilpailutilanne: minimoitu, ei uutta riskiä
- `collectionStore` tilaa `repository.subscribe`n. Kun toinen välilehti muuttaa dataa, kokoelma luetaan uudelleen. Jos oma tallennus on kesken, uudelleenluku siirretään sen jälkeen (`externalPending`), ja kesken alkanut painallus estää vanhan uudelleenluvun soveltamisen (`changeCount`). Vanhentuneen latauksen vastaukset hylätään (`generation`).
- Tallennukset ovat peräkkäisiä, ja vain kunkin kortin uusin tavoitemäärä odottaa. Tallennuskerros lukee tuoreen tilan ennen jokaista kirjoitusta, joten toisen välilehden muutokset muihin kortteihin säilyvät.
- Toinen välilehti voi siirtää näkymän LUKITTU-tilaan (`newer-version`), jolloin kirjoitukset estetään.
- Jäännösriski: SEC-013 (Info).

### SR-14 · Data vain tekstinä: täyttyy
- Kaikki uudet tekstit (korttinimet kontrollien saavutettavissa nimissä ja live-ilmoituksissa, ilmoituslaatikot, yhteenveto) renderöidään React-tekstisolmuina tai muodostetaan merkkijonoina live-alueelle. `aria-label` (`closeNoticeLabel`) rakentuu kiinteistä otsikoista. T-012 ei näytä käyttäjän kirjoittamaa tekstiä. Pakan nimen XSS-testi kuuluu edelleen T-013:een.

### SR-15 · Ei verkkoliikennettä tallennetusta datasta: täyttyy
- Kokoelman data ei päädy URL:iin, `fetch`iin, `href`- tai `src`-attribuuttiin. CSP:n `connect-src` ennallaan.

### SR-16 · Ei henkilötietoja tallennustilaan: täyttyy
- Tallennuskerroksen tietomalli ei muuttunut. Kokoelmaan tallentuvat vain kortin avain ja määrä. Uusia avaimia, evästeitä tai analytiikkaa ei tullut. "Vain omistetut" -valinta, piilotetut ilmoitukset ja pysyvän tallennuksen tila ovat vain muistissa.

## Löydökset

### SEC-011 · LUKITTU-tilan ohje "tyhjennä selaimen välimuisti" voi johtaa kokoelman poistamiseen · Low
**Sijainti:** `src/ui/texts.ts` (`newerVersionBody`), lähde `docs/UX.md` 6.8 · **Tehtävä:** T-012
**Toistaminen:** 1) Tallennettu kokoelma on uudemmassa skeemaversiossa kuin auki oleva sovellus (vanha välilehti tai julkaisun peruminen uuden skeemaversion jälkeen). 2) Näkymä näyttää: "Päivitä sivu. Jos tämä ei auta, tyhjennä selaimen välimuisti ja yritä uudelleen." 3) Firebase Hosting palauttaa `index.html`:n otsakkeella `Cache-Control: max-age=3600` (todennettu esikatselusta), joten pelkkä päivitys voi ladata vanhan version tunnin ajan, ja käyttäjä siirtyy ohjeen toiseen askeleeseen. 4) Chromen ja Edgen "Poista selaustiedot" -ikkunassa on tyypillisesti oletuksena valittuna myös "Evästeet ja muut sivustotiedot", joka poistaa localStoragen.
**Odotettu:** Ohje ei voi johtaa tallennettujen tietojen poistamiseen. · **Havaittu:** Ohje voi johtaa siihen, että käyttäjä poistaa juuri sen kokoelman, jota LUKITTU-tila suojaa. Teksti on lisäksi ristiriidassa `persistentDenied`-tekstin kanssa ("Älä tyhjennä selaimen tietoja").
**Vaikutus:** Koko kokoelman (ja T-013:n jälkeen pakkojen) menetys käyttäjän omalla toimella. Todennäköisyys on nyt hyvin pieni, koska skeemaversioita on vain yksi eikä `newer-version` voi syntyä ennen ensimmäistä skeemaversion nostoa. Siksi Low.
**Korjausehdotus:** 1) Muuta teksti muotoon, joka ei ohjaa tietojen tyhjennykseen, esim. "Päivitä sivu. Jos ilmoitus ei katoa, sulje kaikki tämän sivuston välilehdet ja avaa sivu uudelleen. Älä tyhjennä selaimen tietoja, koska kokoelma poistuisi." (UX:n mikrokopio, päivitys myös UX.md 6.8:aan). 2) Erillisenä tehtävänä (PM): `firebase.json`iin `Cache-Control: no-cache` `index.html`:lle (hajautetut `assets/`-tiedostot voivat säilyttää pitkän välimuistin), jotta päivitys hakee aina uusimman version. Muutos koskee `firebase.json`ia, joten se katselmoidaan (SR-9).
**Tila:** Avoin

### SEC-012 · SEC-007:n ohje "Vapauta selaimen tallennustilaa" on monitulkintainen · Low
**Sijainti:** `src/ui/texts.ts` (`resetNoBackupBody`), lähde `docs/UX.md` 6.8 · **Tehtävä:** T-012
**Toistaminen:** 1) Tallennettu kokoelma on lukukelvoton, ja tallennustila on niin täynnä, ettei varmuuskopio mahdu (`reset` + `backupKey: null`, SEC-007). 2) Näkymä ohjeistaa: "Vapauta selaimen tallennustilaa ja päivitä sivu."
**Odotettu:** Ohje kertoo, mistä tilaa vapautetaan, kuten `saveFailedQuotaBody` ("poistamalla selaimen tietoja muilta sivustoilta"). · **Havaittu:** Käyttäjä voi tulkita ohjeen niin, että hän poistaa tämän sivuston tiedot. Silloin lukukelvoton raakadata (jota tallennuskerros on nimenomaan säästänyt mahdollista myöhempää palautusta varten) ja T-013:n jälkeen myös pakat katoavat.
**Vaikutus:** Tietojen menetys käyttäjän toimella harvinaisessa tilanteessa (vaatii sekä rikkinäisen datan että täyden tallennustilan). Low.
**Korjausehdotus:** Yhdenmukaista teksti `saveFailedQuotaBody`n kanssa, esim. "Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta ja päivitä sivu." (UX:n mikrokopio, päivitys myös UX.md 6.8:aan).
**Tila:** Avoin

### SEC-013 · Vanhentuneesta näkymästä tallennetaan absoluuttinen määrä · Info
**Sijainti:** `src/ui/collectionStore.ts` (`setCount`), `src/ui/CountControl.tsx` · **Tehtävä:** T-012
**Havainto:** `+` ja `−` laskevat uuden määrän näytöllä olevasta arvosta ja tallentavat sen absoluuttisena (`setCount(card, n)`). Jos toinen välilehti on muuttanut saman kortin määrää eikä `storage`-tapahtuman uudelleenluku ole vielä ehtinyt näkymään, myöhempi tallennus kirjoittaa toisen välilehden arvon yli. Ikkuna on millisekuntien luokkaa, koska `storage`-tapahtuma toimitetaan myös taustavälilehdille, ja muutos koskee vain yhtä korttiriviä.
**Vaikutus:** Yhden kortin määrä voi poiketa käyttäjän tarkoittamasta yhdellä. Ei tietoturvaongelma, vaan R-11:n tunnettu jäännösriski.
**Korjausehdotus:** Ei toimenpiteitä nyt. Jos MVP-2:n synkronointi tuo saman ongelman verkon yli (pidempi viive), harkitaan muutosta lisäyksenä (delta) tai versiotarkistusta (MVP2-7).
**Tila:** Havainto

## Tarkistettu, ei löydöksiä

- **Pääsynhallinta ja autentikointi:** Ei sovellu (ei palvelinta eikä kirjautumista). Data on origin-kohtaista: esikatselu, testi ja tuotanto ovat eri origineja.
- **Injektiot:** Ei kyselyitä, polkuja, URL-rakennusta eikä käyttäjän syötteestä rakennettuja regexejä. "Vain omistetut" käyttää olemassa olevaa `filterCards`ia ja `Set`/`Map`-hakuja.
- **XSS:** Katso SR-14. Ei HTML-nieluja. CSP ennallaan.
- **CSRF:** Ei sovellu (ei tilaa muuttavia verkkopyyntöjä).
- **Kryptografia ja salaisuudet:** Ei uutta kryptografiaa. Salaisuuksia ei ole diffissä eikä historiassa.
- **Virheet ja lokit:** Käyttäjälle vain kiinteitä tekstejä. `console.error` saa `StorageError`in, jonka viesti on kiinteä ja `cause` selaimen poikkeus. Ei kortin avaimia, määriä eikä henkilötietoja lokeihin.
- **Palvelunesto:** Tallennukset ovat peräkkäisiä, ja jono pitää vain yhden odottavan arvon korttia kohden, joten nopeat painallukset eivät kasvata jonoa. Live-ilmoitukset hillitään (500 ms). Koko taulukon uudelleenrenderöinti jokaisesta muutoksesta on suorituskykyasia (T-019), ei palvelunesto.
- **Konfiguraatio:** `firebase.json`, workflowt ja turvallisuusotsakkeet eivät muuttuneet (SR-9 ei laukea).
- **Riippuvuudet:** Ei muutoksia, `npm audit` 0.
- **Tietosuoja:** Ei uusia tallennettavia kenttiä, evästeitä, analytiikkaa eikä kolmansia osapuolia. `persist()` ja `persisted()` eivät lähetä dataa minnekään. Näkymä kertoo, että kokoelma on vain tässä selaimessa (R-10, K-P2:n ensimmäinen puolisko). PRIVACY.md päivitetty.
- **Tekoälyominaisuudet:** Ei sovellu.
- **T-011:n Low-löydökset:** SEC-005 (näkymättömät merkit, `UNSAFE_CHARACTERS` sisältää nyt U+061C, U+200E, U+200F, U+2028, U+2029 ja U+FEFF) ja SEC-006 (kiintiövirhe koetallennuksessa palauttaa oikean tallennustilan, testi `keyValueStore.test.ts`) on korjattu ennen T-012:ta. SECURITY.md:n R-15 ja R-16 merkitty korjatuiksi.

## Dokumentaatiomuutokset tässä katselmoinnissa
- `docs/SECURITY.md`: R-10:n ja R-11:n tila, R-15 ja R-16 korjattu, SR-13:n `persist()`-suositus toteutettu, muutosloki.
- `docs/PRIVACY.md`: inventaarion rivi 1 toteutettu (T-012), pysyvän tallennuksen pyyntö luvussa 5, K-P2:n tila, muutosloki.
- `docs/reports/SEC-002-t011-katselmointi.md`: SEC-007:n tila → Korjattu (T-012) → Varmistettu.
