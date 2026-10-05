# T-064 · Want-lista ja kokoelman vaihtojako (suunnittelu)
**Tila:** Suunniteltu (odottaa hyväksyntää) · **Omistaja:** Arkkitehti → Koodari · **MVP:** 2 · **Malli:** D-014
**Haara:** `t-064-want-malli` (vain dokumentit) · **ADR:** D-018 (Ehdotettu)

## Tarve
1. Want-lista: kortit ja halutut määrät; pakkaeditorin puuttuvat kortit (`MissingCard`, `src/domain/deckExport.ts`) wantiin yhdellä napilla.
2. Kokoelman jako linkkinä (have + want); vastaanottaja näkee "minulla on, sinä haluat" ja "sinulla on, minä haluan".
3. Jakonäkymässä vaihdettavissa = omistettu − `playsetSize(card)` (ylimäärä).

## Tietomalli (D-018 kohta 1)
- `src/domain/wants.ts`: `type WantList = Collection`, `EMPTY_WANTS`, `addMissingToWants(wants, missing)`.
- Rivi `{ card: CardKey, count: 1–999 }`, enintään 5000 riviä, järjestys `compareCardKeys` (samat invariantit kuin kokoelmassa).
- Määrä = montako kappaletta **lisää** halutaan.

## Tallennus ja migraatio
- Uusi avain `cyberdeck:wants`, tilikohtaisesti `cyberdeck:u:{uid}:wants`, envelope `{schemaVersion: 1, savedAt, data: {entries}}`, validointi `parseCollection`.
- `WANTS_SCHEMA_VERSION = 1`, `WANTS_MIGRATIONS = []`. **Ei migraatiota:** vanhat avaimet ja kokoelman skeema ennallaan.
- Varmuuskopiot `cyberdeck:backup:wants:<ISO>` (max 3, SR-11, SR-13). `newer-version` ja `reset`-ilmoitukset kuten kokoelmalla.
- `Repositories.wants: CollectionRepository`; toteutus = nykyinen kokoelmarepositorio avaimella ja aggregaatin nimellä parametrisoituna (ei kopiota).

## Synkka ja Firestore (D-018 kohta 2)
- `LocalData.wants`, `SyncBase.wants` (puuttuu tallennetusta pohjasta → tyhjä), `CloudSnapshot.wants`, `CloudChange.wants?`.
- `mergeCollection` sellaisenaan; `fullSync`-rajatarkistus myös wanteille; `push` vertaa `sameCollection(local.wants, base.wants)`.
- `firestoreCloudStore`: `users/{uid}/collection/want` luetaan `readAll`issa, kirjoitetaan `commit`in transaktiossa, poistetaan `deleteAll`issa.
- `cloudCodec`: dekoodaus `COLLECTION_ENVELOPE_SPEC`illä (oma spec, jos versio eriytyy), `validateChange` laskee kirjoituksen ja 900 000 tavun rajan.
- `copySignedOutData` yhdistää myös wantit.
- `firestore.rules`: `match /collection/{docId}` kolmessa kohdassa `docId == 'main'` → `docId in ['main', 'want']`. Kommentin tietomalliin rivi `users/{uid}/collection/want`.
- **Deploy (käyttäjä, hook kysyy):** `--project test` ennen kuin T-064a yhdistetään testiin, `--project default` ennen julkaisua.

## Vaihtojakolinkki (D-018 kohta 3)
- Reitti `#/vaihto/<data>` (`useHashRoute`: `{ name: 'trade'; data }`), näkymä `SharedTradeView`.
- data = base64url(UTF-8). Teksti: otsikko `cyberdeck-vaihto 1`, sitten rivit `h <määrä> <avain>` (have) ja `w <määrä> <avain>` (want).
- Rajat: data ≤ `MAX_SHARE_DATA_LENGTH` (16 000), dekoodattu ≤ `MAX_IMPORT_BYTES`, rivejä ≤ 2 × `MAX_COLLECTION_ENTRIES`, rivi-regex `^([hw]) ([1-9][0-9]{0,2}) ([a-z0-9-]{1,100})$` + `isCardKey`, väärä otsikko/versio → virheellinen linkki, väärä rivi tai tuplasti esiintyvä avain → rivi pois (`dropped`). Hakutaulut `Map`.
- Liian iso kokoelma → virheilmoitus, ei katkaistua linkkiä. Nyt (151 korttia) koko kokoelma + want ≈ 6–11 k merkkiä.

## Toteutusjärjestys (pienet osat, kukin oma haara ja PR)
| Osa | Sisältö | Arvio (tuotanto + testit) | Katselmointi |
|---|---|---|---|
| **T-064a** | wants.ts, avaimet, repositorio, synkka, cloud store, säännöt, PRIVACY.md | ~150 + ~150 | Digiturva (tallennus, synkka, säännöt) |
| **T-064b** | Wantin muokkaus Kortit-näkymässä (muokkaustilan want-laskuri, suodatin "vain wantit") | ~100 + ~40 | PM esikatselu; UX-linjaus ennen |
| **T-061b** | "Lisää puuttuvat wantiin" DeckEditorin puuttuvat-listaan: `addMissingToWants` (max(nykyinen want, puuttuva), katto 999), ilmoitus "N korttia lisätty wantiin" | ~50 + ~40 | PM esikatselu |
| **T-062** | tradeShare.ts (encode/decode), tradeCompare.ts, reitti, SharedTradeView, "Jaa vaihtolinkki" -nappi | ~200 + ~150 | Digiturva (URL-syöte), UX |
| **T-063** | Tarjolla = `max(0, omistettu − playsetSize)` vertailussa ja näkymässä | ~20 + ~30 | PM esikatselu |

Riippuvuudet: T-064a → T-064b, T-061b → T-062 → T-063. T-062:n vertailu toimii myös ilman kirjautumista.

## Digiturvan tarkistettavat kohdat
1. Sääntömuutos: vain `main` ja `want` sallittuja docId:itä, `isCollectionDoc` kattaa wantin, ei uusia polkuja; emulaattori- tai sääntötesti, että `collection/muu` hylätään.
2. `deleteAll` poistaa `collection/want` (tilin poisto, PRIVACY.md).
3. Paikallinen validointi luettaessa (SR-11): rikkinäinen want-data → varmuuskopio + tyhjä, ei kaada; `newer-version` estää kirjoitukset.
4. Jakolinkki on epäluotettava syöte (SR-17-malli): koko- ja rivirajat ennen jäsennystä, lineaarinen regex, `isCardKey` ja varatut avaimet, `Map`, ei HTML:ää (SR-1), ei verkkoliikennettä linkin datasta (SR-15).
5. Tietosuoja: linkki paljastaa vain korttiavaimet ja määrät, ei uid:tä, nimeä eikä sähköpostia. Hash ei lähde palvelimelle eikä Referer-otsakkeeseen (SR-3). Jakajalle näkyvä huomautus, että linkin saaja näkee koko kokoelman.
6. PRIVACY.md:n inventaario (SR-16): want-lista paikallisesti ja pilvessä.

## Avoimet tuotekysymykset (käyttäjä)
1. Jaetaanko linkissä **koko kokoelma** vai vain **ylimäärä** (vaihdettavat)? Suositus: koko kokoelma (käyttäjän pyyntö "have"); vain ylimäärä olisi lyhyempi ja yksityisempi.
2. "Lisää puuttuvat wantiin": jos kortti on jo wantissa, **max** (suositus, ei tuplaa saman puutteen eri pakoista) vai **summa**?
3. Vähennetäänkö wantia automaattisesti, kun kokoelmaan lisätään sama kortti? Suositus: ei nyt (yksinkertaisin), myöhemmin IDEAS.md.

## Luovutus
Arkkitehti 2026-10-05: ADR D-018 (Ehdotettu) ja tämä kortti. Ei koodia. Seuraava: käyttäjä vastaa avoimiin kysymyksiin ja hyväksyy D-018:n, sitten T-064a Koodarille ja Digiturvan katselmointi ennen yhdistämistä.

## SEC-064a (Digiturva 2026-10-05, katselmointi 3e68c67, diff t-064-want-malli..HEAD)
Tulos: **hyväksytty**, ei blokkaavia löydöksiä. Critical 0, High 0, Medium 0, Low 2 (1 korjattu), Info 1.
- **L1 (korjattu):** PRIVACY.md:n rivit 4 ja 15 sekä luvun "Pilvidata"-poistorivi eivät maininneet want-listaa (`backup:wants`, `cyberdeck:u:{uid}:wants`, pilvipoisto). Korjattu commitissa `T-064a: Security review fixes`.
- **L2 (avoin, T-064b):** `src/ui/texts.ts:49` kirjautumisen tietosuojateksti "Tilille tallennetaan vain pakkasi ja kokoelmasi…" ei mainitse want-listaa. Ei vielä harhaanjohtava, koska wantia ei voi muokata UI:sta ennen T-064b:tä. Korjaus: lisää "want-listasi" T-064b:ssä (Sisällöntuottaja/PM).
- **I1:** Sääntötesti on merkkijonotesti (`src/firestoreRules.test.ts`), ei emulaattoritesti. Se varmistaa, että ainoa sallittu docId-lista on `['main','want']` kaikissa kolmessa säännössä ja ettei `docId ==` -muotoa ole, joten `collection/muu` hylätään. Riittää kortin kohtaan 1; emulaattoritesti IDEAS-tasoinen.

Tarkistettu, ei löydöksiä: (1) firestore.rules: vain `main`/`want`, `isOwner` + `isCollectionDoc` koskee myös wantia, ei uusia polkuja. (2) `deleteAll` poistaa `collection/want` samassa transaktiossa (3 kirjoitusta), `eraseAccount` poistaa etuliitteellä myös `…:wants` ja sen varakopiot. (3) Paikallinen luku: oma envelope ja skeemaversio, `parseCollection` (SR-11), rikkinäinen → varakopio + tyhjä; `readLocal` palauttaa null (synkka seis) jos want on `newer`/`corrupt`; pilven `newer` lukitsee kirjoitukset, `invalid` ei koskaan ylikirjoitu. (4) `checkChange` validoi wantin ja kokorajan ennen lähetystä, transaktion kirjoituslaskuri sisältää wantin. (5) Vanha sync-base ilman `wants` → tyhjä, ei kaadu. (6) `addMissingToWants`: `isCardKey`, kokonaisluku, katto 999 ja 5000 riviä, `Map`. (7) Ei uusia riippuvuuksia, ei firebase.json-muutoksia, ei salaisuuksia diffissä. Kohdat 4–5 (jakolinkki) kuuluvat T-062:een.
