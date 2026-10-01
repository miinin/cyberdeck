# T-011 · Tietomalli ja paikallinen tallennuskerros
**Tila:** In Progress · **Omistaja:** Arkkitehti (suunnittelu) → Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Suunnittelu:** Arkkitehti ☑ (D-008) · Digiturva ☑ (paikallinen tallennus, PRIVACY.md)
**Katselmoinnit:** Koodikatselmointi ☑ · Arkkitehti ☑ · Digiturva ☑ · Dokumentoija: MVP-1:n lopussa (D-009)
**Riippuvuudet:** T-001 (Done), D-007. Ei käyttöliittymää, joten UX ja Testikäyttäjä eivät katselmoi.
**Haara:** `t-011-tallennuskerros`

## Tavoite
Kokoelma (T-012) ja pakat (T-013) tarvitsevat tietomallin ja tallennuksen, joka säilyy selaimen sulkemisen yli. D-007:n mukaan tallennus on nyt paikallinen, mutta Firebase-kirjautuminen ja pilvitallennus sekä korttien painokset pitää voida lisätä myöhemmin ilman, että tietomalli tai sitä käyttävä koodi kirjoitetaan uudelleen.

## Hyväksymiskriteerit
- [ ] ADR DECISIONS.md:hen: tallennustekniikka (vähintään kaksi vaihtoehtoa, esim. localStorage ja IndexedDB), tietomalli (kokoelma, pakat), korttien yksilöivä avain (D-007: korttitaso, valmius painoksille) ja skeemaversio migraatioita varten.
- [ ] ARCHITECTURE.md: tallennuskerroksen rajapinta (repository-tyyppinen), jonka takana paikallinen toteutus voidaan myöhemmin vaihtaa tai täydentää Firebase-toteutuksella. Käyttöliittymä ei käytä selaimen tallennusta suoraan.
- [ ] Toteutus: kokoelman ja pakkojen luku, tallennus ja poisto paikalliseen tallennukseen. Tallennettu data validoidaan luettaessa, eikä rikkinäinen tai vanhan version data kaada sovellusta.
- [ ] Yksikkötestit: tallennus ja luku, rikkinäinen data, tyhjä tila, skeemaversio ja tallennustilan puuttuminen tai täyttyminen.
- [ ] Digiturva on arvioinut paikallisen tallennuksen (mitä tallennetaan, ei henkilötietoja) ja kirjannut sen PRIVACY.md:hen tai SECURITY.md:hen.

### Turvavaatimukset (Digiturva, tarkemmin SECURITY.md luku 11)
- [ ] **SR-11:** Tallennettu data validoidaan ajonaikaisesti luettaessa, ja mukana on skeemaversio. Hyväksytty data rakennetaan uudeksi olioksi vain sallituista kentistä (ei spreadia eikä Object.assignia jäsennettyyn dataan). Raja-arvot: määrä 0–999 kokoelmassa ja 1–99 pakassa, enintään 200 pakkaa, 500 eri korttia pakassa ja 5 000 kokoelmassa, nimi 1–100 merkkiä. Nimistä poistetaan ohjaus- ja suunnanohjausmerkit, ja ne normalisoidaan NFC-muotoon. Hakutaulut ovat Map-olioita, ja avaimet `__proto__`, `constructor` ja `prototype` hylätään. Arkkitehti saa muuttaa lukuja, kunhan jokaisella listalla ja merkkijonolla on yläraja.
- [ ] **SR-11:** Tuntematonta tai uudempaa skeemaversiota ei ylikirjoiteta. Lukukelvoton raakadata siirretään varakopioavaimeen ennen tyhjää tilaa, ja osittain rikkinäisestä datasta ehjä osa säilyy. Sama validointifunktio palvelee myöhemmin T-015:n tuontia.
- [ ] **SR-12:** Vain `src/storage/` käyttää localStoragea tai IndexedDB:tä, ja lint-sääntö estää suoran käytön muualla. Avaimet ovat nimiavaruudessa ja versioituja (`cyberdeck:v1:…`). Ei evästeitä.
- [ ] **SR-13:** Jokainen tallennustilan kutsu on try/catchissa (SecurityError ja QuotaExceededError). Ilman tallennustilaa sovellus toimii muistinvaraisesti ja näyttää yleisen ilmoituksen. Kirjoitukset ovat atomisia, ja usean välilehden kilpailutilanne hoidetaan (Arkkitehti valitsee tavan). Kiintiövirheessä poistetaan vain välimuisti, ei koskaan käyttäjän dataa.
- [ ] **SR-16:** Tallennustilaan ei tallenneta henkilö-, laite- tai käyttäjätunnisteita eikä tokeneita. Uudet kentät päivitetään PRIVACY.md:n inventaarioon.
- [ ] Yksikkötestit: virheellinen JSON, väärät tyypit, negatiiviset, desimaali-, NaN- ja ylisuuret määrät, ylipitkä nimi, ohjausmerkit, `__proto__`- ja `constructor`-avaimet (prototyyppiin ei synny ominaisuutta), tuntematon skeemaversio (data säilyy muuttumattomana), osittain rikkinäinen data, kiintiövirhe ja estetty tallennustila.

## Rajaukset (ei kuulu tähän)
- Kokoelman ja pakkojen käyttöliittymä (T-012, T-013)
- Firebase-toteutus ja kirjautuminen (MVP-2)
- Vienti ja tuonti tiedostoihin (T-015)
- Korttidatan välimuisti (T-003, oma ADR)

## Työloki
### Checkpoint 2026-10-01 · PM
- Kortti määritelty, tila Ready. Seuraava askel: Arkkitehti tekee ADR:n ja tietomallin, Digiturva arvioi tallennuksen rinnakkain.

### Checkpoint 2026-10-01 · Koodari (suunnitelma)
- Suunnitelma ARCHITECTURE.md 12.9:n mukaan. Jokaisen askeleen jälkeen testit, lint, commit ja push:
  1. `domain/cardKey.ts` ja testit, `Card.key`, `mapCard` ja Card-fixtuurit.
  2. `domain/collection.ts`, `domain/deck.ts` ja `domain/validate.ts` testeineen.
  3. `storage/keys.ts`, `errors.ts` ja `envelope.ts` testeineen.
  4. `storage/keyValueStore.ts`, `types.ts`, `repositories.ts` ja `index.ts` testeineen, `localStorage.clear()` setupiin.
  5. ESLint-rajat (luku 4) ja kokeilu, että lint estää `localStorage`n `src/ui/`:ssa.
- Lopuksi koodikatselmointi, ARCHITECTURE.md:n toteutusosa, luovutus ja PR testiin.

## Luovutukset
### Luovutus 2026-10-01 · Digiturva → PM, Arkkitehti, Koodari
- Mitä tehtiin: MVP-1:n uhkamalli ja STRIDE (SECURITY.md luku 11), turvavaatimukset SR-11–SR-19, riskit R-10–R-14, MVP-2:n ennakoidut vaatimukset MVP2-1–MVP2-9 (luku 12) ja uusi docs/PRIVACY.md.
- Mitä pyydän: SR-11, SR-12, SR-13 ja SR-16 T-011:n kriteereiksi (tehty). SR-17 kuuluu T-014:ään ja SR-18–SR-19 T-015:een. Arkkitehti huomioi ADR:ssä skeemaversion ja varakopion, avainten nimiavaruuden, välilehtien synkronoinnin, kiintiön jakamisen T-003:n kanssa ja raja-arvot.
- Mistä katsoa: docs/SECURITY.md luvut 11–12, docs/PRIVACY.md.
- Tunnetut rajoitteet ja riskit: R-10 (Safari voi poistaa datan noin 7 vrk:n käyttämättömyyden jälkeen, ja selaimen tyhjennys poistaa datan). Torjuntana ovat T-015:n vienti ja ilmoitus siitä, että tiedot ovat vain tässä selaimessa. MVP2-5:n COOP-vaikutus kirjautumiseen on epävarma.
- Testit: ei ajettu (suunnittelu).

### Checkpoint 2026-10-01 · PM (Digiturvan ehdotukset)
- Tietosuojailmoitus ("tiedot vain tässä selaimessa", R-10:n torjunta) liitetään T-012:een (UX ja Sisällöntuottaja).
- "Poista kaikki tiedot tästä selaimesta" → IDEAS.md.
- K-P1–K-P4 kirjattu STATUS.md:hen käyttäjälle (eivät blokkaa).

### Luovutus 2026-10-01 · Arkkitehti → Koodari
- Mitä tehtiin: ADR D-008 ja ARCHITECTURE.md:n luku 12 (rakenne, allekirjoitukset, luku- ja kirjoituspolku, testilista). Lisäksi päivitetty luvut 1, 3, 4 ja 6 (`Card.key`, ESLint-säännöt). localStorage kahden versioidun kääreen `{schemaVersion,savedAt,data}` sisällä, Promise-pohjainen repository-rajapinta, kortin avain `cardKey(name, subname)`. Netdeckin slug ei ole johdettavissa nimestä 16 kortilla, joten se ei käy avaimeksi. Rajat sovitettu SR-11–SR-13:een.
- Mitä pyydän: Toteutus viidessä askeleessa ARCHITECTURE.md:n luvun 12.9 mukaan: (1) cardKey, Card.key, mapCard ja fixtuurit; (2) domain: collection, deck ja validate; (3) storage: keys, errors ja envelope; (4) keyValueStore, repositories, types ja index sekä localStorage.clear() test-setupiin; (5) ESLint-rajat tallennustilalle ja storage-kerroksen sisäisille tuonneille.
- Mistä katsoa: docs/ARCHITECTURE.md luku 12, docs/DECISIONS.md D-008, docs/SECURITY.md SR-11–SR-13 ja SR-16.
- Tunnetut rajoitteet ja riskit: Avain muuttuu, jos lähde muuttaa kortin nimeä (alias-migraatio tarvittaessa). Välilehtien kilpailutilanne on minimoitu mutta ei poistettu. Avaimen versio on kääreessä eikä avaimen nimessä (poikkeama SR-12:n esimerkistä, Digiturva arvioi katselmoinnissa).
- Testit: suunnittelu. Avainanalyysi oikeaa rajapintaa vasten: 151 korttia ja 151 yksilöllistä avainta, esimerkkipakasta 19/19 riviä täsmäsi.

### Checkpoint 2026-10-01 · PM
- D-008 hyväksytty (PM).
- Huom. rinnakkaisuus: T-010 muokkaa myös `src/ui/CatalogView.test.tsx`:ää (sarake "Tyyppi ja väri"). Ensin valmistuva yhdistetään testiin, ja toinen yhdistää testin haaraansa ja ratkaisee konfliktin ennen katselmointia.
- Arkkitehdin kysymykset: (2) tallennetaanko tuotu pakkalista pakaksi → käyttäjälle ennen T-014:ää; (3) uuden pakan oletusosiot → T-013 UX; (4) varmuuskopioiden palautuksen käyttöliittymä → IDEAS.md; (5) T-015:n muodon tunniste → T-015 (Arkkitehti ja Digiturva).
- Seuraava askel: Koodari toteuttaa.

### Checkpoint 2026-10-01 · Koodari
- Tehty: askeleet 1–5 (commitit de73f83 cardKey ja Card.key, f09bc33 domain-mallit ja validointi, 096f899 kääre, virheet ja avaimet, d2be651 KeyValueStore ja repositoriot, a86709b ESLint-rajat), dokumentaatio 8e2ed9f (ARCHITECTURE.md:n toteutusosa ja LESSONS L-002). PR #4 testiin, Preview-workflow vihreä.
- Kesken: ei mitään.
- Seuraava askel: katselmoinnit (Arkkitehti, Digiturva, Dokumentoija).
- Avoimet kysymykset: PM:lle (katso luovutus).
- Muutetut tiedostot: `eslint.config.js`, `src/api/mapCard.ts`, `src/api/mapCard.test.ts`, `src/App.test.tsx`, `src/ui/CatalogView.test.tsx` (yksi rivi: `key`), `src/test/setup.ts`, `src/domain/{card,cardKey,collection,deck,validate}.ts` testeineen, `src/storage/{index,types,errors,keys,envelope,keyValueStore,repositories}.ts` testeineen, `docs/ARCHITECTURE.md`, `docs/LESSONS.md`.

### Luovutus 2026-10-01 · Koodari → PM (Arkkitehti, Digiturva, Dokumentoija)
- Mitä tehtiin: tietomalli (`CardKey`, kokoelma, pakka), ajonaikainen validointi (SR-11) ja paikallinen tallennuskerros repository-rajapinnan takana (`src/storage/index.ts`): versioitu kääre ja migraatiot, varmuuskopio ennen jokaista päällekirjoitusta (rikkinäinen, vanhempi tai osittain korjattu data), uudemman version kirjoitusesto, `quota` ja `unavailable`, muistinvarainen varapolku (`persistent: false`), `storage`-tapahtuman tilaus ja `requestPersistentStorage`. ESLint estää selaimen tallennus-API:t ja tallennuskerroksen sisäiset tuonnit muualla (SR-12). Ei käyttöliittymää, hookeja, App-muutoksia eikä uusia riippuvuuksia.
- Mitä pyydän: Arkkitehti: rakennekatselmointi ja poikkeamien arviointi (ARCHITECTURE.md → Toteutuksen yksityiskohdat → T-011). Digiturva: SR-11, SR-12, SR-13 ja SR-16 sekä avaimen versio kääreessä (`cyberdeck:collection` eikä `cyberdeck:v1:…`, Arkkitehdin poikkeama). Dokumentoija: ARCHITECTURE-viittaukset ja tarvittaessa CHANGELOG (ei käyttäjälle näkyvää muutosta).
- Mistä katsoa: PR https://github.com/miinin/cyberdeck/pull/4, `git diff origin/test...t-011-tallennuskerros`, esikatselu https://cyberdeck-tcg-test--pr4-t-011-tallennuskerro-rkv0nnpi.web.app (näyttää saman korttilistan kuin ennen, koska käyttöliittymä ei muuttunut). Tärkeimmät: `src/storage/repositories.ts`, `src/domain/validate.ts`, `eslint.config.js`.
- Tunnetut rajoitteet ja riskit: Välilehtien kilpailutilanne on minimoitu (tuore luku ennen jokaista kirjoitusta, ei awaitia välissä) mutta ei poistettu (R-11). Nimien pituus lasketaan UTF-16-koodiyksikköinä. Kortin avaimen törmäystä luettelossa ei tarkisteta täällä (T-012:n indeksi, D-008). Kiintiövirheessä ei ole vielä välimuistia poistettavaksi (T-003).
- Testit: `npx vitest run --dir src` 12 tiedostoa, 281/281 läpi. `npm test` (sisältää myös T-010:n worktreen testit) 19 tiedostoa, 406/406 läpi. `npm run lint` OK, `npm run build` OK, `npm audit --audit-level=high` 0 haavoittuvuutta. PR #4:n `build_and_preview` ja `Deploy Preview` vihreät. Lint-sääntöjen toimivuus todennettu kokeilutiedostoilla (poistettu).
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 3 (S1: `api/mapCard.ts`:n `isRecord` ja `nonEmptyString` voisivat tulla `domain/validate.ts`:stä (luku 12.5, ei pakollinen), [velka]-ehdotus PM:lle. S2: setupin `localStorage.clear()` heittää, jos testi jättää `window.localStorage`-getterin mockatuksi, joten mockit palautetaan testin omassa `afterEach`issa (dokumentoitu ARCHITECTURE.md:hen). S3: katso avoin kysymys 1.)
- Avoimet kysymykset PM:lle:
  1. Vitest ja ESLint käyvät läpi myös `.claude/worktrees/`-hakemiston. Ajon aikana T-010:n keskeneräinen testi epäonnistui pääkansion `npm test`-ajossa, vaikka T-011:n koodi oli kunnossa. Ehdotus: lisätään `.claude/**` Vitestin `test.exclude`-listaan ja ESLintin `globalIgnores`iin omana pienenä tehtävänään (en muuttanut, koska tehtävä ei kuulu T-011:een ja T-010 voisi muuttaa samoja tiedostoja).
  2. Hyväksymiskriteerien rasteja en merkinnyt, koska PM todentaa ne. Toteutus kattaa kriteerit 3–4 ja SR-11, SR-12, SR-13 sekä SR-16:n toteutusosan. ADR, ARCHITECTURE ja Digiturvan arvio olivat jo valmiina.
  3. STATUS.md:tä en päivittänyt (rinnakkaisajo, PM päivittää).

### Checkpoint 2026-10-01 · PM
- Koodari valmis, PR #4 (Preview vihreä). Katselmoinnit: Arkkitehti (rakenne ja poikkeamat) ja Digiturva (SR-11–SR-13, SR-16, versio kääreessä).
- Koodarin ehdotukset: `.claude/**` pois testeistä ja lintistä → T-016, mapCardin apufunktiot → T-017. Kunnes T-016 on tehty, pääkansiossa ajetaan `npx vitest run --dir src`.

### Luovutus 2026-10-01 · Arkkitehti → PM
- ARCH-002-t011-katselmointi.md: rakenne D-008:n mukainen, Koodarin viisi poikkeamaa hyväksytty (ARCHITECTURE.md 4, 11, 12.2, 12.6, 12.7). Testit 281/281, eslint ja tsc OK. Veto: ei. Low: ARCH-006 (kiintiö, T-003), ARCH-007 (migraatioketjun invarianttitesti), ARCH-008 (lint-poikkeus vain keyValueStore.ts:ään).

### Luovutus 2026-10-01 · Digiturva → PM
- SEC-002-t011-katselmointi.md: SR-11, SR-12, SR-13 ja SR-16 täyttyvät. Versio kääreessä hyväksytty. Testit 281/281, lint OK, npm audit 0, salaisuushaku ei osumia. Veto: ei. Low: SEC-005 (puuttuvat näkymättömät merkit nimien siivouksessa), SEC-006 (kiintiövirhe koetallennuksessa piilottaa datan). Info SEC-007–SEC-010. Ehto T-012:lle: newer-version- ja reset-ilmoitukset näytetään käyttäjälle.

### Checkpoint 2026-10-01 · PM
- Korjauskierros ennen Donea (pienet, tarvitaan ennen T-012:ta): SEC-005, SEC-006, ARCH-007 (migrations.ts + invarianttitesti) ja ARCH-008 (lint-poikkeus). ARCH-006 ja SEC-008 → T-003. SEC-007 ja T-012:n ilmoitusehdot → T-012:n korttiin. SEC-009 ja SEC-010 → T-016:n yhteyteen (valinnaisia).
- D-009: Testikäyttäjä ja Dokumentoija tehdään MVP-1:n lopussa koko tasolle.

### Luovutus 2026-10-01 · Koodari → PM (korjauskierros)
- Mitä tehtiin: SEC-005 (15812ba) nimien siivous poistaa myös U+061C, U+200E, U+200F, U+2028, U+2029 ja U+FEFF, ZWJ/ZWNJ säilyvät. SEC-006 (7dc05c5) koetallennuksen kiintiövirhe palauttaa oikean tallennustilan (data näkyy, kirjoitukset → `quota`), luku- tai muu virhe → muistinvarainen tila; `isQuotaError` vietiin errors.ts:stä. ARCH-007 (61c17e3) `src/storage/migrations.ts` + invarianttitesti `migrations.test.ts`, `specWith` käyttää tuotantoketjua. ARCH-008 (4a22b96) tallennus-API-lint-poikkeus vain keyValueStore.ts:lle, sen testille ja src/test/**:lle (todennettu: localStorage muussa src/storage-tiedostossa → lint-virhe).
- Regressiotestit kirjoitettiin ensin ja todettiin epäonnistuviksi (3 kpl). Vanha testi "returns null when writing fails" muutettiin SEC-006:n mukaiseksi (SecurityError → null, kiintiö → tallennustila).
- Mitä pyydän: Digiturva varmistaa SEC-005/006, Arkkitehti ARCH-007/008.
- Testit: `npx vitest run --dir src` 288/288, eslint OK, build OK.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0
