# SEC-106: T-106 kameraskanneri, diff-katselmointi

**Digiturva · 2026-10-08 · PR #115 · `git diff origin/test...origin/t-106-skanneri` (commitit 234e72b–816cdfa)**

## Tulos
- **Löydökset:** Critical 0, High 0, Medium 1, Low 1, Info 2.
- **Veto:** Kyllä, kunnes SEC-106-1 on korjattu. Korjaus on pieni (noin 10 riviä). SEC-106-2 kannattaa korjata samalla.
- Ajonaikaiset riippuvuudet eivät muuttuneet (`package.json`:iin tuli vain kaksi skriptiä, ja `sharp` oli jo devDependency). Siksi `npm audit` -ajoa ei tarvittu. Workflowt, `firestore.rules` ja `storage.rules` eivät muuttuneet.
- Haaran historiasta ei löytynyt salaisuuksia (haettu `AIza`, `secret`, `password`, `api_key` ja `PRIVATE KEY` lisätyiltä riveiltä sormenjälki-JSONia lukuun ottamatta, koska se on pelkkää heksaa).

## Löydökset

### SEC-106-1 · Kamera jää päälle, kun välilehti piilotetaan · Medium
**Sijainti:** `src/ui/CardScanner.tsx:123–174`. Komponentissa ei ole `visibilitychange`- tai `pagehide`-käsittelyä. · **Tehtävä:** T-106
**Toistaminen:** 1) Avaa skanneri työpöydän Chromessa ja valitse painos, jolloin kamera käynnistyy. 2) Vaihda toiseen välilehteen tai pienennä ikkuna. 3) Kameran merkkivalo ja välilehden kameraikoni jäävät päälle, ja stream kulkee taustalla niin kauan kuin dialogi on auki.
**Odotettu:** Kamera sammuu, kun sivu ei ole näkyvissä (PM:n katselmointiperuste "välilehden vaihto", tietosuoja sisäänrakennetusti). · **Havaittu:** Stream pysähtyy vain dialogin sulkeutuessa tai komponentin poistuessa (unmount).
**Vaikutus:** Kuvaa ei tallenneta eikä lähetetä, joten tietovuotoa ei ole. Laite kuitenkin kuvaa ilman, että käyttäjä näkee sitä, mikä on vastoin käyttäjän odotusta ja PRIVACY.md 12:n henkeä ("vain kun käyttäjä skannaa"). Mobiilissa selain yleensä mykistää taustalla olevan kameran, mutta silloin video jää paluun jälkeen mustaksi (track `muted` tai `ended`).
**Korjausehdotus:** Lisää efekti, joka `document.visibilityState === 'hidden'` -tilassa kutsuu `stopStream(streamRef.current)`, asettaa `streamRef.current = null` ja palauttaa vaiheeksi `'edition'`, jos vaihe on `'camera'`, `'starting'` tai `'result'`. Tällöin paluun jälkeen kamera käynnistetään uudelleen käyttäjän painalluksesta, mikä sopii myös iOS:lle. Testi: `visibilitychange` (hidden) kutsuu trackien `stop()`-metodia.
**Tila:** Avoin

### SEC-106-2 · Virhetila ei pysäytä jo avattua kameraa · Low
**Sijainti:** `src/ui/CardScanner.tsx:193–196` (`capture`: `getContext` palauttaa nullin, jolloin `setStage('error')` ajetaan ilman `stopStream`:ia) · **Tehtävä:** T-106
**Toistaminen:** 1) Kamera on käynnissä. 2) `canvas.getContext('2d')` palauttaa nullin (esimerkiksi canvas estetty tai muisti lopussa). 3) Virheteksti näkyy, mutta stream jää käyntiin, eikä videota enää näytetä.
**Odotettu:** Virhetilaan siirtyminen sammuttaa kameran. · **Havaittu:** Kamera jää päälle, kunnes käyttäjä painaa Sulje tai Yritä uudelleen.
**Vaikutus:** Sama kuin SEC-106-1 mutta harvinainen: kamera on päällä näkymättömänä.
**Korjausehdotus:** Tee apufunktio `fail(message)`, joka pysäyttää streamin, nollaa `streamRef`:n ja asettaa virhetilan. Käytä sitä kaikissa virhepoluissa.
**Tila:** Avoin

### SEC-106-3 · Tulosvaiheessa kamera on päällä, vaikka videota ei näytetä · Info
**Sijainti:** `src/ui/CardScanner.tsx:145–151` ja vaihe `'result'` · **Tehtävä:** T-106
**Havaittu:** Ratkaisu on tarkoituksellinen: paluu kameraan on nopea, eikä lupaa kysytä uudelleen. Selaimen kameraikoni kertoo käytöstä. Hyväksyttävää, kun SEC-106-1 rajaa ajan näkyvään välilehteen.
**Korjausehdotus:** Ei pakollinen. Jos halutaan, PRIVACY.md 12:een voi lisätä lauseen "kamera pysyy päällä skannerin ollessa auki".
**Tila:** Info

### SEC-106-4 · Kesken istunnon päättyvää trackia ei käsitellä · Info
**Sijainti:** `src/ui/CardScanner.tsx:153–174` · **Tehtävä:** T-106
**Havaittu:** Jos käyttäjä peruu kameran luvan kesken istunnon tai toinen sovellus varaa kameran, track päättyy (`ended`), ja video jää jäätyneeksi ilman virheilmoitusta. Kyse on käytettävyydestä eikä turvallisuudesta.
**Korjausehdotus:** Kuuntele trackin `ended`-tapahtumaa ja siirry virhetilaan tekstillä `scannerTexts.failed`. Valinnainen.
**Tila:** Info

## Tarkistetut alueet ilman löydöksiä
- **firebase.json:** Molemmissa hosting-kohteissa muuttui ainoastaan `camera=()` → `camera=(self)`. `microphone`, `geolocation`, `payment`, `usb` ja `interest-cohort` pysyvät estettyinä, ja CSP sekä muut otsakkeet ovat ennallaan. `(self)` on pienin toimiva rajaus. Upotusta ei voi käyttää kameran kautta, koska `frame-ancestors 'none'` ja `X-Frame-Options: DENY` ovat voimassa. MediaStream liitetään `srcObject`:lla, joten CSP:n `media-src`-muutosta ei tarvita. SECURITY.md:n otsakerivi vastaa tiedostoa.
- **getUserMedia:** Kamera avataan vain käyttäjän painalluksesta (painosvalinta), `audio: false`. Mikrofonia ei pyydetä. Jos komponentti poistuu odotuksen aikana, uusi stream pysäytetään heti (rivit 162–165), ja edellinen stream pysäytetään ennen uuden tallentamista. Dialogin sulkeminen (Sulje, Esc, taustan napautus) kulkee `onClose` → unmount → cleanup -ketjua, joka pysäyttää kaikki trackit. Näkymästä poistuminen kulkee samaa reittiä.
- **Kuvadata:** Canvas luodaan jokaisella kuvauksella muistiin, eikä sitä liitetä DOMiin. `ImageData` päätyy vain `queryFingerprints`-funktiolle, ja tilaan jää ainoastaan tunnistetut kortit. Uusissa `src`-tiedostoissa ei ole `console`-, `localStorage`-, `sessionStorage`-, `indexedDB`-, `fetch`-, `toDataURL`-, `toBlob`- eikä `postMessage`-kutsuja. `console.log` esiintyy vain kehittäjän skripteissä (`scripts/`), eikä se tulosta kuvadataa.
- **cardFingerprints.json:** Tiedosto on staattinen ja repoon commitoitu, ja Vite paketoi sen omaksi chunkikseen samalta originilta. Ulkoista lähdettä ei ole. Tiedosto jäsennetään `JSON`-moduulina ilman `eval`- tai `Function`-kutsuja. `parseFingerprintFile` tarkistaa version, ruudukon ja alueet tarkasti, id:n regexillä (`^[a-z0-9-]{1,100}(__…)?$`), duplikaatit ja tiivisteet (tarkka pituus ja `[0-9a-f]`). Virheellinen tiedosto hylätään kokonaan. Id:tä käytetään vain Map-hakuun, eikä sitä renderöidä. Kokoa (101 kt) ei tarvitse rajata, koska tiedosto on luotettava build-artefakti.
- **Generointiskripti:** `scripts/cards-fingerprints.mjs` lukee vain paikallisia kuvakansioita eikä tee verkkoliikennettä. `measureScanner.mjs` on paikallinen mittaus.
- **Kokoelmaan kirjoitus:** `collectionEntry.ts`:n `entryOf` ja `writeEntry` on siirretty CatalogView:sta sanasta sanaan, ja kirjoitus kulkee saman `CollectionStore`- ja repository-polun kautta, joten validointi on ennallaan. `addCopies` tarkistaa vaiheen `ready` ja rajan `MAX_COPIES` (999), ja domain-funktioiden poikkeukset käsitellään. Kopiomäärä on rajattu käyttöliittymässä välille 1–99. Firestore-säännöt ovat ennallaan, joten palvelinpään rajat pätevät edelleen.
- **XSS:** Kortin nimi ja harvinaisuus renderöidään React-tekstinä. Kuvien URL:t tulevat sovelluksen omista kuva-apufunktioista. `dangerouslySetInnerHTML`:ia ei käytetä.
- **useDefaultEdition:** Asetus luetaan ja tallennetaan olemassa olevan `preferences`-repositoryn kautta. Uusia avaimia ei ole.
- **PRIVACY.md 12:** Vastaa toteutusta. Lause "kamera sammuu, kun skanneri suljetaan" pitää paikkansa. SEC-106-1:n korjauksen jälkeen lauseeseen voi lisätä "tai kun sovellus siirtyy taustalle". Henkilötietoja tai uusia tallennusavaimia ei synny, joten eskaloitavaa ei ole.
