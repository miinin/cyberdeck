# SEC-008 · T-014 pakkalistan tuonti · kevyt tietoturvakatselmointi

**Päivä:** 2026-10-02 · **Katselmoija:** Digiturva · **Malli:** D-014 (kevyt)
**Laajuus:** `git diff origin/test...origin/t-014-pakkalistan-tuonti -- src` (commit ced50be) vaatimuksia SR-17, SR-14, SR-15 ja SR-11 (nimet, `MAX_DECKS`) vasten, sekä riski R-13 tuonnin osalta. Ei uusia riippuvuuksia (package.json ei muuttunut), joten `npm audit` ei ollut tarpeen. Ajettu: `npx vitest run src/domain/deckText.test.ts src/domain/deckReport.test.ts src/ui/DeckImport.test.tsx` → 3 tiedostoa, 23/23 läpi.

## Tulos
Ei Critical-, High- eikä Medium-löydöksiä. Yksi Low ja yksi Info. Ei estä Done-tilaa.

## Löydökset

### SEC-021 · Pakan nimen katkaisu voi jakaa surrogaattiparin · Low
**Sijainti:** src/domain/deckText.ts, `parseDeckText`: `cleaned.slice(0, MAX_DECK_NAME_LENGTH)` · **Tehtävä:** T-014
**Toistaminen:** 1) Liitä lista, jonka ensimmäinen rivi on `# ` + 99 × `a` + `🔥` + jotain lisää. 2) Tarkista lista. 3) Nimikentässä on 99 `a`:ta ja yksinäinen korkea surrogaatti (näkyy korvausmerkkinä), ja se tallentuu sellaisenaan, koska `checkDeckName` hyväksyy sen.
**Odotettu:** katkaisu merkin (koodipisteen) rajalla. · **Havaittu:** `String.slice` katkaisee UTF-16-yksikön kohdalta.
**Vaikutus:** ei tietoturvavaikutusta. Nimeen jää rikkinäinen merkki, joka näkyy �-merkkinä ja muuttuu UTF-8-viennissä (T-015) U+FFFD:ksi, jolloin SR-19:n round trip -testi voi erota tällä nimellä.
**Korjausehdotus:** katkaise koodipisteittäin samoin kuin `shortened` (`Array.from(cleaned).slice(…)`), mutta niin, että tulos mahtuu `MAX_DECK_NAME_LENGTH`:iin UTF-16-pituutena, tai poista lopusta yksinäinen korkea surrogaatti (`/[\uD800-\uDBFF]$/`). Testi emojinimellä rajan kohdalla.
**Tila:** Avoin (backlog, PM päättää; voidaan korjata T-015:n yhteydessä)

### SEC-022 · SR-17:n suorituskykytestistä puuttuu kirjaimellinen 10 000 merkin rivi · Info
**Sijainti:** src/domain/deckText.test.ts, "parses worst-case lines quickly (ReDoS guard)" · **Tehtävä:** T-014
**Havaittu:** testi ajaa 300 riviä × 282 merkkiä ja kaksi pahinta yksittäistä riviä, mutta ei SR-17:n mainitsemaa 10 000 merkin riviä. Käytännössä tällainen rivi hylätään pituusrajalla ennen regexiä (`line-too-long`), joten riski on katettu.
**Korjausehdotus:** lisää samaan aikamittaukseen `parseDeckText('1 ' + 'a - '.repeat(2500), CARDS)` ja odotettu `line-too-long`, jotta vaatimus on todennettu kirjaimellisesti.
**Tila:** Avoin (valinnainen)

## Tarkistettu, ei löydöksiä
- **Kokoraja ennen lukemista:** `DeckImport.handleFile` tarkistaa `file.size > MAX_IMPORT_BYTES` (64 kt) ennen `file.text()`:iä ja tyhjentää kentän; testi todentaa, ettei liian suurta tiedostoa lueta. Liitetty teksti tarkistetaan `parseDeckText`issa merkkimääränä (`text.length`) ennen muuta käsittelyä, joten `maxlength`in ohitus ei auta. `accept` on vain käytettävyyttä.
- **Rivi- ja pituusrajat:** 300 riviä ja 300 merkkiä per rivi tarkistetaan koko syötteelle ennen yhdenkään rivin jäsennystä, ja ylitys palauttaa virheen ilman osittaista tulosta (testit 300/301 riviä ja 300/301 merkkiä). Virheilmoitukset ovat vakiotekstejä eivätkä toista syötettä.
- **Regexit:** `^(\S+)\s+(.+)$`, `^\d{1,2}$`, `^\d+x$`, `\r\n?` ovat ankkuroituja tai triviaaleja, eikä niissä ole sisäkkäisiä toistoja. `\S+` ja `\s+` ovat toisensa poissulkevia, joten pahin tapaus on lineaarinen, ja rivi on enintään 300 merkkiä. Diffissä ei ole `new RegExp`iä; nimet täsmätään `normalizeCardName` → `Map`-haku (testi `(.*)+$`). Määrä 1–99 sekä `3` että `3x`, yhdistetty määrä rajataan 99:ään.
- **Normalisointi ja ohjausmerkit:** BOM poistetaan (`charCodeAt(0) === 0xFEFF`, lisäksi `UNSAFE_CHARACTERS` sisältää U+FEFF), `\r\n`/`\r` → `\n`, NFC koko tekstille, `UNSAFE_CHARACTERS` (SR-11, C0/C1, suunnanohjaus, U+2028/2029) poistetaan joka riviltä ennen jäsennystä. `UNSAFE_CHARACTERS` vain exportattiin, sisältö ennallaan; `/g`-lippu on turvallinen `replace`issa (ei `test`/`exec`-tilaa).
- **Prototyypin saastutus:** hakutaulut ovat `Map`eja; `__proto__`- ja `constructor`-rivit päätyvät tunnistamattomiin (testi todentaa, ettei `({}).polluted` synny).
- **Renderöinti tekstinä (SR-14):** tunnistamattomat rivit (katkaistu 100 koodipisteeseen), kortti-, pakka- ja nimitekstit renderöidään React-tekstinä. Kortin nimi tulee omasta korttidatasta (`card.displayName`), ei syötteestä (SR-15). Diffissä ei `innerHTML`ia, `dangerouslySetInnerHTML`ia eikä dynaamisia `href`-arvoja. Testi: `<img src=x onerror=alert(1)>` näkyy kirjaimellisena eikä `img`-elementtiä synny.
- **Tallennus ei ylikirjoita:** "Tallenna pakaksi" kutsuu vain `decks.create`a, joka luo aina uuden id:n (`newId`, törmäystarkistus) ja validoi sisällön uudelleen (`validContent`). Mitään olemassa olevaa pakkaa tai kokoelmaa ei muuteta; tunnistamattomat rivit eivät tallennu. Tallennus tapahtuu vain käyttäjän painalluksesta raportin jälkeen.
- **`MAX_DECKS` ja nimisäännöt:** `create` heittää `limit-reached`, kun pakkoja on 200, ja virhe näytetään `deckTexts.actionFailed`-tekstillä (testi). Nimi `# `-riviltä puhdistetaan `cleanText`illä ja tallennettaessa `checkDeckName` (1–100 merkkiä, SR-11); tyhjä tai liian pitkä nimi näyttää virheen eikä tallenna. Eri kortteja enintään 300 < `MAX_DECK_DISTINCT_CARDS` (500).
- **Palvelunesto:** syötteen käsittely on rajattu ennen kalliita vaiheita; raportti on O(rivit × pakat), enintään 300 × 200. Hyvin suuren liitetyn tekstin pito tekstikentässä koskee vain käyttäjän omaa välilehteä (vrt. SEC-007).
- **Virheet:** `file.text()`:n virhe → yleinen `file-unreadable`, tallennusvirhe → `StorageError.kind`-teksti, ei teknisiä viestejä.
- **Henkilötiedot:** ei uusia henkilötietoja eikä ulkoisia kutsuja. PRIVACY.md ei vaadi muutoksia.
- **Salaisuudet:** diffissä ei avaimia, tokeneita eikä salasanoja (haku `api key|secret|token|password|AIza|PRIVATE KEY`).
- **Riippuvuudet:** ei muutoksia.

## App.test.tsx:n aikaraja 20 s (arvio)
Hyväksyttävä. Testi on synkroninen renderöinti ilman `waitFor`ia tai ajastimia, joten pidempi aikaraja ei voi peittää jumittumista, kilpailutilannetta eikä verkkopyyntöä (testi todentaa edelleen, ettei `fetch`iä kutsuta). Nosto koskee vain tätä testiä. Hitaus (151 kortin renderöinti jsdomissa rinnakkaisen sarjan kuormassa) on suorituskyky- tai testiympäristöasia, ei tietoturva-asia; jos se pahenee, PM voi kirjata sen velaksi (esim. listan renderöintikustannuksen mittaus).

## R-13 tuonnin osalta
.txt- ja tekstituonnin (T-014) torjunta SR-17, SR-14 ja SR-15 on toteutettu ja todennettu. R-13 jää avoimeksi .json-tuonnin ja .txt-tiedostotuonnin T-015-osuuden (SR-18, SR-19) osalta.
