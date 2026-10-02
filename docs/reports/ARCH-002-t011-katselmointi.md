# ARCH-002 · T-011:n arkkitehtuurikatselmointi (tietomalli ja tallennuskerros)

**Katselmoija:** Arkkitehti · **Päivä:** 2026-10-01 · **Tehtävä:** T-011 · **Haara:** `t-011-tallennuskerros` (HEAD 59619d2), PR #4
**Katselmoitu:** `git diff origin/test...HEAD` (34 tiedostoa), painopisteenä `src/storage/*`, `src/domain/{cardKey,collection,deck,validate}.ts`, `src/domain/card.ts`, `src/api/mapCard.ts`, `eslint.config.js` ja `src/test/setup.ts`. Vertailukohta: ARCHITECTURE.md luvut 4 ja 12, D-008 ja SECURITY.md SR-11–SR-13.
**Ajettu itse:** `npx vitest run --dir src`: 12 tiedostoa, 281/281 läpi. `npx eslint .`: exit 0. `npx tsc -b`: exit 0.

## Yhteenveto ja veto-päätös

**Veto: ei.** Toteutus noudattaa lukua 12 ja D-008:aa. Kerrokset ovat `ui → storage → domain` ja `api → domain`. `domain/` ei riipu mistään, `storage/` riippuu vain domainista (ei Reactia, `ui`:ta eikä `api`:a), ja `storage/index.ts` on ainoa julkinen rajapinta. ESLint valvoo kaikki rajat, myös selaimen tallennus-API:t (SR-12). Kehäriippuvuuksia ei ole (`validate → collection, deck, cardKey`, `collection → cardKey`). Repository-rajapinta on asynkroninen ja tallennustekniikasta riippumaton: `KeyValueStore` on ainoa selaimeen kytketty osa, joten Firestore-toteutus (MVP-2) mahtuu samojen `CollectionRepository`- ja `DeckRepository`-rajapintojen taakse. Tietomalli on taulukkopohjainen ja versioitu kääreessä, ja `Card.key` on lisätty D-008 kohdan 2 mukaan. Ei uusia riippuvuuksia, kustannuksia eikä palvelulukitusta.

Ei Critical-, High- eikä Medium-löydöksiä. Kolme Low-löydöstä (ARCH-006–ARCH-008), joista mikään ei estä Done-tilaa.

## Koodarin poikkeamat (ARCHITECTURE.md → Toteutuksen yksityiskohdat → T-011)

### Poikkeama 1 · Yksi aikaleima per kirjoitus · **Hyväksytty**
`savedAt`, `createdAt`/`updatedAt` ja varmuuskopioavain täsmäävät, ja testien kello on ennustettava. Ei rakenteellista haittaa. Kirjattu lukuun 12.7.

### Poikkeama 2 · Varmuuskopio myös korjatusta datasta (`dropped > 0`) · **Hyväksytty**
Tämä korjaa suunnitelman aukon: luvun 12.7 alkuperäisellä säännöllä pudotetut rivit olisivat kadonneet lopullisesti ensimmäisessä tallennuksessa, mikä on ristiriidassa SR-11:n kanssa (ei tietojen menetystä). Varmuuskopio syntyy vain kerran, koska kirjoituksen jälkeen data on ehjää. Kirjattu lukuun 12.7 kohtaan 3.

### Poikkeama 3 · Varmuuskopioavaimen törmäyspääte `:1`, `:2` … · **Hyväksytty**
Varmuuskopio ei voi ylikirjoittaa toista. Järjestys säilyy (`…Z` < `…Z:1`), ja karsinta toimii aakkosjärjestyksellä edelleen oikein. Kirjattu lukuihin 12.2 ja 12.7.

### Poikkeama 4 · Juuri kirjoitettua varmuuskopiota ei karsita, ja karsinnan virhe ei kaada kirjoitusta · **Hyväksytty**
Suojaa kellon siirtymiseltä taaksepäin. Karsinta koskee edelleen vain `cyberdeck:backup:<kokonaisuus>:`-alkuisia avaimia, joten käyttäjän live-dataan ei kosketa (SR-13, R-12). Kirjattu lukuun 12.7.

### Poikkeama 5 · Testimigraatiot määräävät nykyisen version (`migrations.length + 1`) · **Hyväksytty, jatkotoimi ARCH-007**
Ratkaisu on yksinkertainen ja riittää MVP-1:een, koska oikeita migraatioita ei vielä ole. Siinä on kuitenkin ansa ensimmäistä migraatiota varten (katso ARCH-007). Kirjattu lukuun 12.6.

### Muut tarkennukset · **Hyväksytty**
`remove` tuntemattomalla id:llä ei kirjoita (yleisesti `mutate` ohittaa kirjoituksen, kun muutos palauttaa saman olion), pakan id:n törmäys → `unavailable`, lisäapurit (`RESERVED_OBJECT_KEYS`, `compareCardKeys` koodiyksikköjärjestyksellä, `isRecord`, `isDeckId`, `EPOCH_TIMESTAMP`, `toStorageError`), aikaleimojen tiukka muoto, pituus UTF-16-koodiyksikköinä, `cleanText` poistaa myös DEL-merkin ja ESLintin `self`-olio. Mikään ei muuta julkista rajapintaa eikä riko kerrosrajaa. Kirjattu lukuihin 4 ja 12.7, kun ne vaikuttavat käyttäytymiseen. Tietoturvan kannalta olennaiset kohdat (aikaleimat, UTF-16-pituus, ohjausmerkit, avaimen versio kääreessä) arvioi Digiturva.

## Tarkistuslista (agents.md, Arkkitehti)

- [x] Noudattaa ARCHITECTURE.md:n rakennetta ja vastuunjakoa. Ei kerrosten ohituksia eikä kehäriippuvuuksia. `envelope.ts` tuo `isRecord`in domainista (sallittu suunta).
- [x] Ei uusia riippuvuuksia eikä palveluita. jsdomin `localStorage` riittää testeihin.
- [x] Tietomalli on yhteensopiva olemassa olevan datan kanssa: tallennettua dataa ei ole ennen T-011:tä. `Card.key` on additiivinen. `mapCard` hylkää kortin, jonka nimestä ei synny kelvollista avainta, ja hylkäys lasketaan olemassa olevaan `skipped`-laskuriin, joten se näkyy luettelon OSITTAINEN-tilassa eikä katoa hiljaa. Nykydatassa pisin avain on 43 merkkiä (raja 100).
- [x] Ei tarpeetonta abstraktiota. `Aggregate<T>` ja `mutate` poistavat kokoelman ja pakkojen kirjoituspolun kopioinnin, ja `KeyValueStore` on ainoa vaihtopiste.
- [x] Konfiguraatio erillään koodista: avaimet, versiot ja rajat ovat vakioina `keys.ts`:ssä ja domainissa.
- [x] Kustannukset: ei kustannuksia. Firestore-suunta (D-008 kohta 5) säilyy, ja rajapinta tukee `onSnapshot`-tyylistä `subscribe`a.

Lisäksi tarkistettu, ei löydöksiä: luku–validointi–kirjoitus tapahtuu yhdessä synkronisessa lohkossa ilman `await`ia (R-11 minimoitu), `newer`-versiota ei koskaan kirjoiteta yli, `corrupt` varmuuskopioidaan ennen poistoa, eikä live-avainta poisteta, jos varmuuskopio epäonnistuu. Selainvirheet muunnetaan `StorageError`iksi yhdessä paikassa (`toStorageError`). `openBrowserRepositories` palaa muistinvaraiseen tilaan (`persistent: false`), ja ESLint-rajojen flat config -ansa (myöhempi `no-restricted-imports` korvaa aiemman) on huomioitu.

## Löydökset

### ARCH-006 · Pahimman tapauksen datamäärä voi ylittää `localStorage`n kiintiön · Low
**Sijainti:** `src/domain/deck.ts` (`MAX_DECKS`, `MAX_DECK_DISTINCT_CARDS`), `src/storage/keys.ts` (`MAX_BACKUPS_PER_AGGREGATE`) · **Tehtävä:** T-011
**Toistaminen:** 1) Laske SR-11:n rajoilla: 200 pakkaa × 500 riviä × noin 35 merkkiä ≈ 3,5 M merkkiä. 2) Lisää rikkinäisen tai korjatun datan varmuuskopio (sama koko).
**Odotettu:** kaikki rajojen sisällä oleva data mahtuu tallennukseen. · **Havaittu:** pahin tapaus ylittää noin 5 MiB:n kiintiön. Silloin varmuuskopio epäonnistuu ja kirjoitukset estetään (`quota`). Tämä on oikea, dataa säilyttävä käytös, mutta käyttäjä jää jumiin.
**Vaikutus:** ei realistinen nykyisellä korttimäärällä (151 eri korttia, D-008:n arvio noin 2 kt per pakka). Merkitys kasvaa, kun T-003:n välimuisti jakaa saman kiintiön.
**Korjausehdotus:** ei muutoksia nyt. T-003:n ADR:ssä kiintiöbudjetti (välimuisti + käyttäjädata + varmuuskopiot) ja tarvittaessa pienempi `MAX_DECK_DISTINCT_CARDS`. Kirjattu ARCHITECTURE.md:n lukuun 11 kohtaan 7.
**Tila:** Avoin (backlog, T-003)

### ARCH-007 · Tuotannon migraatioketju on kovakoodattu tyhjäksi, eikä version ja ketjun yhdenmukaisuutta testata · Low
**Sijainti:** `src/storage/repositories.ts`, `specWith` (`migrations: []`), `src/storage/keys.ts` · **Tehtävä:** T-011
**Toistaminen:** 1) Nosta `COLLECTION_SCHEMA_VERSION` arvoon 2 lisäämättä migraatiota `specWith`iin. 2) Lataa versiolla 1 tallennettu kokoelma.
**Odotettu:** testi tai tyyppi estää version noston ilman ketjua. · **Havaittu:** `decodeEnvelope` ei löydä `migrations[0]`:aa → `corrupt` → kaikkien käyttäjien data siirtyy varmuuskopioon, ja sovellus näyttää tyhjän tilan. Data ei katoa, mutta käyttäjä näkee sen kadonneen.
**Vaikutus:** ansa ensimmäiselle oikealle migraatiolle. Ei vaikutusta nyt (versio 1, ei migraatioita).
**Korjausehdotus:** pieni velkatehtävä tai ensimmäisen migraation yhteydessä: `storage/migrations.ts` (`COLLECTION_MIGRATIONS`, `DECKS_MIGRATIONS`), `specWith` käyttää niitä oletuksena, ja testi varmistaa `MIGRATIONS.length + 1 === SCHEMA_VERSION` kummallekin kokonaisuudelle. Kirjattu ARCHITECTURE.md:n lukuun 11 kohtaan 6.
**Tila:** Avoin → Korjattu (commit 61c17e3)

### ARCH-008 · D-008:n seuraukset ja toteutus eroavat tallennus-API:en sallitussa alueessa · Low
**Sijainti:** `docs/DECISIONS.md` D-008 → Seuraukset ("kaikkialla paitsi `src/storage/keyValueStore.ts`:ssä") ↔ `eslint.config.js` (`ignores: ['src/storage/**', 'src/test/**']`) ja ARCHITECTURE.md luku 4 · **Tehtävä:** T-011
**Toistaminen:** 1) Lisää `localStorage.getItem('x')` tiedostoon `src/storage/repositories.ts`. 2) Aja `npx eslint src/storage`.
**Odotettu (D-008):** virhe. · **Havaittu:** ei virhettä. Toteutus vastaa ARCHITECTURE.md:n lukua 4 ja SR-12:ta ("vain `src/storage/`"), mutta ei D-008:n tarkempaa sanamuotoa eikä `keyValueStore.ts`:n kommenttia "The only module that touches the browser's storage APIs".
**Vaikutus:** pieni. Repository voisi ohittaa `KeyValueStore`n, jolloin muistinvarainen varapolku ja testattavuus heikkenisivät. Nykyinen koodi ei tee niin.
**Korjausehdotus:** suositus on kiristää lint vastaamaan D-008:aa: tallennus-API-lohkon `ignores` muotoon `['src/storage/keyValueStore.ts', 'src/storage/keyValueStore.test.ts', 'src/test/**']` (yksi rivi, Koodari, voi tehdä T-011:ssä tai T-016:n yhteydessä). Vaihtoehtoisesti PM lisää D-008:aan tarkennuksen, että raja on `src/storage/**`.
**Tila:** Avoin → Korjattu (commit 4a22b96, lint kiristetty D-008:n mukaiseksi)

## Havaintoja jatkotehtäville (ei löydöksiä)

- **T-012/T-013:** `createMemoryRepositories` palauttaa aina `persistent: false`, joten käyttöliittymätestit näkevät oletuksena "ei tallennu" -tilan. Jos T-012:n testit tarvitsevat pysyvän tilan polun, `persistent?`-valinnainen parametri lisätään silloin (pieni muutos, ei vaadi ADR:ää).
- **T-012:** `get()` ja `load()` voivat kirjoittaa (rikkinäisen datan varmuuskopio ja nollaus). Tämä on suunniteltua (12.7). Hookin pitää näyttää `reset`-ilmoitus vain kerran, vaikka useampi komponentti lukisi.
- **ARCHITECTURE.md päivitetty tässä katselmoinnissa:** luku 4 (`self`), 12.2 (varmuuskopioavaimen pääte), 12.6 (`migrations`-valinnan merkitys), 12.7 (yksi aikaleima, `dropped > 0` -varmuuskopio, kirjoituksen ohitus, id-törmäys, varmuuskopion törmäys ja karsinta), luku 11 kohdat 6–7 sekä merkintä hyväksynnästä Toteutuksen yksityiskohdat -osioon.
