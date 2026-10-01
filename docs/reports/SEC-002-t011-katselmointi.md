# SEC-002 · T-011 tallennuskerroksen tietoturvakatselmointi

**Katselmoija:** Digiturva · **Päivä:** 2026-10-01 · **Tehtävä:** T-011 · **PR:** #4
**Katselmoitu:** `git diff origin/test...t-011-tallennuskerros` (commitit de73f83–59619d2), painopisteenä `src/domain/validate.ts`, `src/domain/cardKey.ts`, `src/storage/*.ts` ja `eslint.config.js`.
**Vaatimukset:** SR-11, SR-12, SR-13 ja SR-16 (SECURITY.md luku 11.6) sekä Arkkitehdin poikkeama (versio kääreessä eikä avaimen nimessä).

## Yhteenveto

| Vakavuus | Määrä |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 2 (SEC-005, SEC-006) |
| Info | 4 (SEC-007–SEC-010) |

**Veto: ei.** Ei Critical- eikä High-löydöksiä, joten Done-tila ei esty tietoturvan perusteella. SR-11, SR-12, SR-13 ja SR-16 täyttyvät. Low-löydökset kannattaa korjata ennen T-012:ta, koska T-012 on ensimmäinen tehtävä, joka näyttää tallennettua dataa käyttäjälle.

## Ajetut tarkistukset

| Tarkistus | Tulos |
|---|---|
| `npx vitest run --dir src` | 12 tiedostoa, 281/281 läpi |
| `npm run lint` (`--max-warnings 0`) | OK |
| `npm audit` | 0 haavoittuvuutta. `package.json` ja `package-lock.json` eivät muuttuneet, eli uusia riippuvuuksia ei ole. |
| Salaisuushaku: tehtävän commitit (`git log -p origin/test..HEAD`) ja koko historia (`git log --all -p`, Googlen API-avaimet, GitHub-tokenit, yksityiset avaimet) sekä seurattujen tiedostojen nimet (`.env`, serviceAccount, credentials) | Ei osumia. Tehtävän diffissä on vain dokumentaatiossa mainintoja sanoista "token" ja "API-avain". |
| Suora tallennustilan käyttö `src/storage/`:n ja `src/test/`:n ulkopuolella (`localStorage`, `sessionStorage`, `indexedDB`, `cookie`) | Ei osumia |
| Ohjausmerkkien poisto (`cleanText`), kokeiltu Nodella | C0, C1 ja U+202A–U+202E sekä U+2066–U+2069 poistuvat. U+200E, U+200F, U+061C, U+2028 ja U+2029 jäävät (SEC-005). |

## Vaatimusten täyttyminen

### SR-11 · Validointi luettaessa ja tietojen säilyminen: täyttyy
- **Ajonaikainen validointi:** `parseCollection`, `parseDeckContent`, `parseDeck` ja `parseDeckList` saavat syötteen tyyppinä `unknown`, eivät heitä poikkeusta ja rakentavat tuloksen uutena oliona sallituista kentistä. Spreadia, `Object.assign`ia tai yhdistämistä jäsennettyyn dataan ei ole. Tuntemattomat kentät jäävät pois.
- **Prototyypin saastutus:** `isCardKey` ja `isDeckId` hylkäävät avaimet `__proto__`, `constructor` ja `prototype` erikseen, muototarkistuksen lisäksi. Hakutaulu `toCountMap` on `Map`. Testit todentavat, että `({}).polluted` ja `Object.prototype.polluted` eivät synny (validate.test.ts:152 ja :279). JSON.parse luo `__proto__`-avaimesta tavallisen oman ominaisuuden, jota validointi ei lue.
- **Raja-arvot:** Kokoelman määrä on 1–999 (0 poistaa rivin). Pakan määrä on 1–99. Pakkoja on enintään 200, rivejä pakan kaikissa osioissa yhteensä enintään 500 ja kokoelmassa enintään 5 000. Pakan nimi on 1–100 merkkiä, osion nimi 0–50 merkkiä ja osioita enintään 20. Kortin avain on 1–100 merkkiä muodossa `^[a-z0-9]+(?:-[a-z0-9]+)*$`, ja pakan id täyttää ehdon `^[A-Za-z0-9_-]{1,64}$`. Desimaalit, NaN, negatiiviset ja ylisuuret luvut hylätään `Number.isInteger`- ja välitarkistuksella. Jokaisella listalla ja merkkijonolla on yläraja, joten Arkkitehdin lisäämät rajat ovat SR-11:n mukaisia.
- **Nimet:** NFC-normalisointi, ohjaus- ja suunnanohjausmerkkien poisto ja trimmaus. Pituus tarkistetaan puhdistuksen jälkeen. Muutama näkymätön muotoilumerkki jää poistamatta (SEC-005, Low).
- **Skeemaversio:** Kääre on muotoa `{schemaVersion, savedAt, data}`. Uudempi versio näytetään tyhjänä, kirjoitukset estetään (`newer-version`) eikä raakadataa muuteta (testattu, myös `remove`). Vanhempi versio migroidaan, ja raakadata varmuuskopioidaan ennen ensimmäistä päällekirjoitusta. Jos migraatio puuttuu tai heittää poikkeuksen, data käsitellään rikkinäisenä.
- **Varakopio:** Lukukelvoton data kopioidaan avaimeen `cyberdeck:backup:<collection|decks>:<ISO-aika>[:n]` ennen kuin live-avain poistetaan. Jos varmuuskopiointi epäonnistuu, live-dataa ei poisteta eikä ylikirjoiteta (testattu), ja kirjoitukset epäonnistuvat, kunnes varmuuskopio onnistuu (katso SEC-007). Osittain rikkinäisestä datasta ehjä osa säilyy, ja `console.warn` kirjaa vain ohitettujen rivien määrän, ei dataa. Varmuuskopioita säilytetään enintään 3 kustakin tietokokonaisuudesta, ja siivous poistaa vain varmuuskopioavaimia. Juuri kirjoitettua varmuuskopiota ei poisteta, vaikka kello siirtyisi taaksepäin (testattu).
- **Sama validointi tuonnissa:** `parseDeckContent` on vientikelpoinen T-015:lle, ja `validContent` hylkää kutsujan datan, jos validointi pudottaisi siitä jotain. Kutsujan antamaa id:tä ei käytetä (`create` luo id:n itse), mikä täyttää SR-18:n vaatimuksen etukäteen.

### SR-12 · Tallennus vain tallennuskerroksen kautta: täyttyy (poikkeama hyväksytty)
- **Lint-rajat:** `no-restricted-globals` ja `no-restricted-properties` (`window`, `globalThis`, `self` × `localStorage`, `sessionStorage`, `indexedDB`) koskevat kaikkia `.ts`- ja `.tsx`-tiedostoja paitsi `src/storage/**`- ja `src/test/**`-hakemistoja. ESLint tunnistaa myös `window['localStorage']`-muodon ja destrukturoinnin. Käyttöliittymä saa tuoda tallennuskerroksen vain sen `index.ts`:n kautta, eikä domain-kerros saa tuoda tallennuskerrosta. Koodari on todentanut säännöt kokeilutiedostoilla. Lint on kehittäjän suojakaide, ei turvaraja. Varsinainen raja on validointi luettaessa.
- **Evästeet:** Koodissa ei ole evästeitä. Lint ei estä `document.cookie`-käyttöä (SEC-010, Info).
- **Arkkitehdin poikkeama (avaimet `cyberdeck:collection` ja `cyberdeck:decks`, versio kääreessä): hyväksytty.** SR-12:ssa versio oli avaimessa vain esimerkkinä. Vaatimuksen tavoitteet täyttyvät:
  1. *Nimiavaruus:* kaikilla avaimilla on etuliite `cyberdeck:`, ja varmuuskopioilla on oma etuliitteensä `cyberdeck:backup:`. T-003:n välimuisti saa oman etuliitteensä, joten käyttäjän data ja välimuisti eivät sekoitu.
  2. *Versiointi:* kääreen `schemaVersion` validoidaan ennen dataa.
  3. *Turvallisuushyöty:* Kääreessä oleva versio on turvallisempi kuin avaimen nimessä oleva. Jos sovelluksen vanha versio jää auki toiseen välilehteen tai julkaisu perutaan, vanha koodi näkee uudemman version ja estää kirjoitukset. Jos versio olisi avaimen nimessä, vanha koodi ei näkisi `v2`-avainta lainkaan ja kirjoittaisi `v1`-avaimeen rinnakkaista dataa, jolloin muutoksia katoaisi hiljaa. Poikkeama kirjataan SR-12:een (SECURITY.md).
  - *Ehto T-012:lle:* `newer-version`-tilassa data näytetään tyhjänä. Käyttöliittymän on näytettävä ilmoitus (esim. "Tiedot on tallennettu uudemmalla versiolla. Päivitä sivu."), jotta käyttäjä ei luule tietojensa kadonneen.

### SR-13 · Tallennusvirheet: täyttyy
- **SecurityError:** `window.localStorage`-ominaisuuden lukeminen on try-lohkossa (`openBrowserStore`), ja testi kattaa getterin, joka heittää poikkeuksen. Jos koetallennus epäonnistuu, käytetään muistinvaraista tallennusta (`persistent: false`), ja käyttöliittymä näyttää ilmoituksen T-012:ssa. Kiintiövirhe koetallennuksessa kuitenkin piilottaa olemassa olevan datan (SEC-006, Low).
- **Kutsut ja virheet:** Jokainen `getItem`-, `setItem`-, `removeItem`- ja `keys`-kutsu repositorioissa on try-lohkossa, ja virheet muunnetaan `StorageError`-olioiksi (`quota` tai `unavailable`). Myös Firefoxin `NS_ERROR_DOM_QUOTA_REACHED` tunnistetaan. Viesti on vain kehittäjälle, ja käyttöliittymä valitsee näytettävän tekstin `kind`-kentän perusteella. Stack tracea ei näytetä käyttäjälle.
- **Kiintiövirhe:** Edellinen tila säilyy (testattu). Käyttäjän dataa ei koskaan poisteta tilan vapauttamiseksi. Välimuistia ei vielä ole (T-003), joten "välimuisti ensin" -sääntö siirtyy T-003:lle (R-12).
- **Atomisuus:** Yksi looginen muutos tallennetaan yhdellä `setItem`-kutsulla. Varmuuskopio kirjoitetaan ennen live-avainta, joten keskeytys jättää aina joko vanhan tilan tai varmuuskopion ja uuden tilan.
- **Välilehdet:** Tila luetaan tuoreena ennen jokaista kirjoitusta ilman awaitia välissä, ja `storage`-tapahtuma tilataan (`subscribe`). R-11 on minimoitu mutta ei poistettu: jos toinen välilehti on vanhentuneessa näkymässä, se voi tallentaa vanhaan tilaan perustuvan muutoksen. Repositorio kuitenkin tekee muutoksen tuoreeseen tilaan (esim. `setCount` muuttaa vain yhtä riviä), joten koko tilaa ei korvata. Pakan `update` korvaa koko pakan sisällön, mutta se kohdistuu yhteen pakkaan. Hyväksyttävä taso MVP-1:ssä.
- **`navigator.storage.persist()`:** Rajapinta on olemassa, sitä ei kutsuta käynnistyksessä ja se on dokumentoitu kutsuttavaksi vain käyttäjän toimesta. Suositus täyttyy.

### SR-16 · Ei henkilö- tai laitetunnisteita: täyttyy
- Tallennettavat kentät: kortin avain, määrä, pakan id (`crypto.randomUUID`, pakkokohtainen eikä laite- tai käyttäjätunniste), pakan nimi, osion nimi, `createdAt` ja `updatedAt` pakoille sekä kääreen `schemaVersion` ja `savedAt`. Lisäksi tallennustila kokeillaan hetkellisesti avaimella `cyberdeck:probe`, joka poistetaan heti.
- Ei käyttäjä- tai laitetunnisteita, sähköposteja eikä tokeneita. Uudet kentät (osion nimi, aikaleimat ja varmuuskopiot) on lisätty PRIVACY.md:n inventaarioon tässä katselmoinnissa.

## Löydökset

### SEC-005 · Nimistä jää poistamatta osa näkymättömistä suunta- ja rivinvaihtomerkeistä · Low
**Sijainti:** `src/domain/validate.ts:32` (`UNSAFE_CHARACTERS`) · **Tehtävä:** T-011
**Toistaminen:** 1) `cleanText('Pakka // Units (99)', 1, 100)` 2) `cleanText('‏abc', 1, 100)` 3) Nodella todennettu: U+200E (LRM), U+200F (RLM), U+061C (ALM), U+2028 (LINE SEPARATOR), U+2029 (PARAGRAPH SEPARATOR) ja U+FEFF jäävät merkkijonoon.
**Odotettu:** SR-11:n mukaan ohjausmerkit ja suunnanohjausmerkit poistetaan, jotta nimi ei voi huijata näytössä eikä rikkoa .txt-vientiä. · **Havaittu:** Poistetaan vain C0, C1, U+202A–U+202E ja U+2066–U+2069.
**Vaikutus:** Pieni. React renderöi nimen tekstinä, joten XSS-riskiä ei ole. LRM, RLM ja ALM voivat siirtää välimerkkejä näytössä. U+2028 ja U+2029 näkyvät monissa editoreissa rivinvaihtoina, joten T-015:n .txt-vientiin tuleva nimi voi näyttää ylimääräiseltä riviltä tai osio-otsikolta (SR-19). T-014:n jäsennin ei kuitenkaan tulkitse niitä rivinvaihdoiksi.
**Korjausehdotus:** Lisää säännölliseen lausekkeeseen `؜‎‏  ﻿`, esim. `/[\u0000-\u001F\u007F-\u009F؜‎‏ -‮⁦-⁩﻿]/g`. ZWJ (U+200D) ja ZWNJ (U+200C) jätetään ennalleen, koska emojisarjat (👨‍👩‍👧) ja jotkin kirjoitusjärjestelmät tarvitsevat niitä. Lisää testi validate.test.ts:n ohjausmerkkitesteihin. Korjaus ennen T-012:ta tai viimeistään T-015:ssä (SR-19).
**Tila:** Avoin → Korjattu (commit 15812ba)

### SEC-006 · Kiintiövirhe koetallennuksessa piilottaa olemassa olevan datan · Low
**Sijainti:** `src/storage/keyValueStore.ts:38–46` (`openBrowserStore`) ja `src/storage/index.ts:15–20` · **Tehtävä:** T-011
**Toistaminen:** 1) Tallenna kokoelma. 2) Täytä origin-kohtainen localStorage muilla avaimilla niin, että `setItem('cyberdeck:probe','1')` heittää `QuotaExceededError`in (realistista, kun T-003:n välimuisti on samassa tallennustilassa, R-12). 3) Avaa sovellus.
**Odotettu:** Tallennettu kokoelma näkyy, ja vain uudet tallennukset epäonnistuvat hallitusti (`quota`). · **Havaittu:** `openBrowserStore` palauttaa `null`, joten käyttöön otetaan muistinvarainen tallennus. Käyttäjä näkee tyhjän kokoelman ja ilmoituksen "tiedot eivät tallennu", vaikka data on tallessa.
**Vaikutus:** Data ei katoa, eikä sitä ylikirjoiteta. Käyttäjä kuitenkin luulee tietojensa kadonneen ja voi esimerkiksi tyhjentää selaimen tiedot korjatakseen tilanteen, jolloin data katoaa oikeasti (SR-13: "edellinen tallennettu tila ei katoa").
**Korjausehdotus:** Erottele virheet koetallennuksessa: jos `window.localStorage`-ominaisuuden luku tai `getItem` epäonnistuu (SecurityError), palautetaan `null` kuten nyt. Jos vain `setItem` heittää kiintiövirheen, palautetaan oikea tallennustila (luku toimii, kirjoitukset antavat `quota`-virheen). Lisää testi, jossa koetallennus heittää `QuotaExceededError`in ja olemassa oleva data luetaan. Korjaus ennen T-012:ta tai viimeistään T-003:ssa.
**Tila:** Avoin → Korjattu (commit 7dc05c5)

### SEC-007 · Epäonnistunut varmuuskopio estää kirjoitukset pysyvästi ilman toipumispolkua · Info
**Sijainti:** `src/storage/repositories.ts` (`resetCorrupt`, `mutate`) · **Tehtävä:** T-011 → T-012
**Toistaminen:** 1) Live-avaimessa on suuri rikkinäinen arvo, ja tila on niin täynnä, ettei varmuuskopio mahdu. 2) `load()` palauttaa ilmoituksen `{kind:'reset', backupKey:null}`. 3) Jokainen `setCount` tai `create` heittää `quota`-virheen.
**Odotettu ja havaittu:** Toimii SR-11:n ja SR-13:n mukaisesti (dataa ei menetetä), mutta käyttäjä ei voi toipua sovelluksessa.
**Vaikutus:** Saatavuus. Tilanne vaatii, että live-data on rikkinäinen ja tallennustila täynnä. Sovellus ei itse voi tuottaa liian suurta tai rikkinäistä dataa, koska validointi estää sen.
**Korjausehdotus:** Ei koodimuutosta T-011:een. T-012:n UX huomioi ilmoituksen `reset` + `backupKey: null` ja kertoo, että tallennus ei onnistu. Palautus- ja vientipolku on jo IDEAS.md:ssä (varmuuskopioiden palautuksen käyttöliittymä).
**Tila:** Avoin (T-012:n UX)

### SEC-008 · Teoreettinen enimmäisdata ylittää localStoragen kiintiön · Info
**Sijainti:** `src/domain/deck.ts` (rajat) · **Tehtävä:** T-011
**Havainto:** 200 pakkaa × 500 riviä × noin 120 tavua ≈ 12 Mt, ja kokoelma on enintään noin 0,6 Mt. localStoragen kiintiö on noin 5 Mt (osassa selaimista merkkeinä). Lisäksi kustakin tietokokonaisuudesta voi olla 3 varmuuskopiota.
**Vaikutus:** Ei tietoturvaongelma. Kiintiövirhe käsitellään hallitusti, eikä edellinen tila katoa. Tavallinen käyttö (pakassa noin 20–60 riviä) jää selvästi alle rajan.
**Korjausehdotus:** Ei toimenpiteitä nyt. T-003:n ADR ottaa välimuistin ja käyttäjän datan kiintiön jaon huomioon (R-12).
**Tila:** Havainto

### SEC-009 · `crypto.randomUUID` puuttuu turvattomassa kontekstissa → TypeError eikä StorageError · Info
**Sijainti:** `src/storage/repositories.ts:71` (`newId`-oletus) · **Tehtävä:** T-011
**Havainto:** `crypto.randomUUID` on käytettävissä vain turvallisessa kontekstissa (HTTPS tai localhost) ja uusissa selaimissa (esim. Safari 15.4+). Firebase Hosting on aina HTTPS, joten tuotannossa ongelmaa ei ole. Vanhassa selaimessa tai LAN-osoitteessa kehityskäytössä (`http://192.168…`) `create` epäonnistuu TypeErrorilla, joka ei ole `StorageError`.
**Vaikutus:** Saatavuus, ei tietoturvaa. Käyttöliittymä voi näyttää yleisen virheen väärästä syystä.
**Korjausehdotus:** Kääri id:n luonti `create`ssa try-lohkoon ja muunna virhe `StorageError('unavailable')`-virheeksi. Valinnainen.
**Tila:** Havainto

### SEC-010 · Lint ei estä evästeiden käyttöä · Info
**Sijainti:** `eslint.config.js` · **Tehtävä:** T-011
**Havainto:** SR-12 kieltää evästeet, mutta `document.cookie` ei ole lint-säännön piirissä. Koodissa ei ole evästeitä (grep).
**Korjausehdotus:** Valinnainen: lisää `no-restricted-properties`-sääntöön `{ object: 'document', property: 'cookie' }`. Voidaan tehdä T-016:n tai seuraavan lint-muutoksen yhteydessä.
**Tila:** Havainto

## Tarkistettu, ei löydöksiä

- **Pääsynhallinta ja autentikointi:** Ei sovellu (ei palvelinta eikä kirjautumista). Data on origin-kohtaista, ja tuotanto, testi ja esikatselut ovat eri origineja.
- **Injektiot:** Tallennettua dataa ei käytetä kyselyissä, poluissa, URL:issa eikä regexien rakentamisessa (SR-15). Validoinnin regexit ovat ankkuroituja ja ilman sisäkkäisiä toistoja (`CARD_KEY_PATTERN`, `DECK_ID_PATTERN`, `ISO_TIMESTAMP_PATTERN`), joten ReDoS-riskiä ei ole. `normalizeCardName` on lineaarinen.
- **XSS:** Ei käyttöliittymämuutoksia. Tallennettu teksti ei kulje HTML-nieluihin. SR-14:n testi kuuluu T-013:een.
- **Prototyypin saastutus:** Katso SR-11. Testit kattavat juuritason, rivitason ja avaimen arvona olevan `__proto__`-tapauksen.
- **Kryptografia ja salaisuudet:** Kryptografiaa ei käytetä id:n luontia lukuun ottamatta (`crypto.randomUUID`). Salaisuuksia ei ole koodissa, diffissä eikä historiassa.
- **Virheet ja lokit:** `console.warn` kirjaa vain tietokokonaisuuden nimen ja ohitettujen rivien määrän, ei dataa eikä avaimia (testattu: `expect.not.stringContaining('constructor')`). `StorageError.cause` on vain kehittäjälle.
- **Palvelunesto:** Kaikki listat on rajattu. Jäsennys iteroi enintään syötteen pituuden verran, ja syöte on itse kiintiön rajaama. T-015:n tiedostokokoraja (SR-18) rajaa tuonnin erikseen.
- **Konfiguraatio:** Turvallisuusotsakkeisiin, CSP:hen tai workflowihin ei tullut muutoksia (SR-9 ei laukea).
- **Riippuvuudet:** Ei muutoksia, `npm audit` 0.
- **Tietosuoja:** Ei henkilötietoja lokeissa, URL:issa tai verkossa. Selaimen tallennustilassa ovat vain inventaarion kentät (PRIVACY.md päivitetty). Ei evästeitä eikä analytiikkaa.
- **Tekoälyominaisuudet:** Ei sovellu.

## Dokumentaatiomuutokset tässä katselmoinnissa
- `docs/SECURITY.md`: SR-12:n avainmuodon poikkeama hyväksytty, SR-11–SR-13 ja SR-16 merkitty täyttyneiksi, löydökset SEC-005 ja SEC-006 riskitaulukkoon (R-15, R-16), R-11:n tila ja muutosloki.
- `docs/PRIVACY.md`: Tallennusteknologia (localStorage), osion nimi, aikaleimat, varmuuskopioiden määrä ja koetallennusavain lisätty inventaarioon. Muutosloki.
