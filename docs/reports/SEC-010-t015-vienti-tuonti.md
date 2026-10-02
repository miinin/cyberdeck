# SEC-010 · T-015 pakan vienti ja tuonti (.json/.txt) · kevyt tietoturvakatselmointi

**Päivä:** 2026-10-02 · **Katselmoija:** Digiturva · **Malli:** D-014 (kevyt)
**Laajuus:** `git diff origin/test...origin/t-015-vienti-tuonti -- src` (commit f2f6440) vaatimuksia SR-18 ja SR-19 (sekä SR-11, SR-14, SR-15, SR-17) vasten, riski R-13 ja löydös SEC-021. Ei uusia riippuvuuksia eikä muutoksia `package.json`:iin tai `firebase.json`:iin, joten `npm audit` ei ollut tarpeen ja CSP ei muuttunut. Ajettu: `npx vitest run src/domain/deckJson.test.ts src/domain/deckExport.test.ts src/domain/deckText.test.ts src/ui/DeckExportImport.test.tsx` → 4 tiedostoa, 49/49 läpi. Selaimessa ei ajettu käsin.

## Tulos
Ei Critical-, High- eikä Medium-löydöksiä. Yksi Low ja yksi Info. Ei estä Done-tilaa. SEC-021 varmistettu. R-13 suljettu.

## Löydökset

### SEC-026 · Kopion nimen katkaisu voi jakaa surrogaattiparin · Low
**Sijainti:** src/domain/deckEdit.ts:35, `name.slice(0, MAX_DECK_NAME_LENGTH - suffix.length - 4)` · **Tehtävä:** T-013 (havaittu T-015:ssä, Koodari kirjasi suosituksena)
**Toistaminen:** 1) Luo pakka, jonka nimi on 100 merkkiä ja jossa emoji osuu katkaisukohtaan. 2) Kopioi pakka. 3) Kopion nimeen jää pariton surrogaatti.
**Odotettu:** katkaisu koodipisteittäin kuten SEC-021:n korjauksessa · **Havaittu:** UTF-16-yksiköittäin.
**Vaikutus:** kosmeettinen (rikkinäinen merkki nimessä). Ei tietoturvavaikutusta: pariton surrogaatti ei ole ohjaus- tai suunnanohjausmerkki, ja nimi validoidaan tallennettaessa.
**Korjausehdotus:** `Array.from(name).slice(0, …).join('')` ja testi emojilla katkaisukohdassa. Backlog.
**Tila:** Avoin (backlog)

### SEC-027 · `revokeObjectURL` heti `setTimeout(…, 0)`:lla · Info
**Sijainti:** src/ui/downloadFile.ts:12
**Havainto:** URL vapautetaan seuraavalla tehtävällä klikkauksen jälkeen. Nykyselaimissa lataus on jo alkanut, mutta jos jokin selain (vanha Safari/Firefox) peruu latauksen, korjaus on pidempi viive (esim. 1–10 s). Ei tietoturvavaikutusta. Muistiin ei jää vapauttamatonta URL:ia.
**Tila:** Info, ei toimenpiteitä, ellei Testikäyttäjä havaitse epäonnistuvia latauksia.

## SEC-021 (T-014) · Varmistettu
`src/domain/deckText.ts`: `Array.from(cleaned).slice(0, MAX_DECK_NAME_LENGTH).join('')`, ja `deckText.test.ts` testaa emojin katkaisukohdassa. Myös `deckJson.ts`:n tunnistamattoman rivin katkaisu ja `exportFileName` käyttävät `Array.from`ia.

## Tarkistettu, ei löydöksiä
- **Kokoraja ennen lukemista (SR-18):** `DeckImport.handleFile` tarkistaa `file.size` ennen `file.text()`:iä (.json 256 kt, muut 64 kt). `parseDeckJson` tarkistaa pituuden uudelleen (myös liitetty teksti). Jäsennin valitaan sisällön (`{`) eikä tiedostopäätteen mukaan, mutta molemmat polut tarkistavat oman rajansa, joten ohitusta ei ole.
- **JSON.parse:** `try/catch`, ei reviveriä. BOM poistetaan. Virhe → yleinen viesti, ei sisäistä tietoa.
- **format/version:** `raw.format === 'cyberdeck.deck'` ja `raw.version === 1` tiukalla vertailulla, muuten "ei pakka".
- **Prototyypin saastutus:** tulos rakennetaan `parseDeckContent`illa (SR-11) sallituista kentistä, kortit kerätään `Map`:iin, `isCardKey` hylkää `__proto__`-avaimen. Testi `__proto__`/`constructor`/`prototype` kaikilla tasoilla.
- **id ja ylimääräiset kentät:** tiedoston `id`, aikaleimat ja muut kentät ohitetaan. Tallennus `repositories.decks.create(...)` luo aina uuden pakan uudella id:llä (UI-testi `not.toBe('file-id')`). Pakkatuonti ei muuta kokoelmaa.
- **Kortin nimi (SR-14):** tiedoston `name`-kenttää ei käytetä lainkaan. Nimi tulee omasta korttidatasta, tunnistamaton kortti näytetään validoidulla avaimella.
- **Tiedostonimi (SR-19):** `/ \ : * ? " < > |`, ohjausmerkit ja suunnanohjausmerkit (`UNSAFE_CHARACTERS`: U+061C, U+200E/F, U+202A–E, U+2066–9, U+FEFF) poistetaan, 60 koodipistettä, alku- ja loppupisteet pois, tyhjälle `pakka`. Testi kattaa merkit ja U+202E:n.
- **.txt-injektio:** pakan nimi ja korttinimet ajetaan `singleLine`n (rivinvaihdot, U+2028/2029, ohjausmerkit pois), joten nimi ei voi lisätä rivejä tai `//`-osio-otsikoita. `#` ja `//` nimen sisällä pysyvät otsikkorivillä. Round trip -testit nimillä `// Legends (3)`, `# x`, emoji, `<b>"x"</b> \ /`.
- **.json-vienti (SR-19):** vain format, version, nimi, osiot, kortin avain, nimi ja määrä. Ei id:tä, aikaleimoja, kokoelmaa tai laitetietoja (testi).
- **Lataus:** `Blob` oikealla MIME-tyypillä, `a[download]`, linkki poistetaan DOMista, `revokeObjectURL` kutsutaan (testi). CSP:tä ei tarvinnut muuttaa (blob-lataus `a[download]`illa ei vaadi direktiivimuutosta).
- **XSS:** ei `innerHTML`/`dangerouslySetInnerHTML`. Nimet renderöidään Reactin tekstinä.
- **Salaisuudet:** diffistä ei löytynyt avaimia tai tokeneita (osuma `'secret'` on testin paikkamerkki).
