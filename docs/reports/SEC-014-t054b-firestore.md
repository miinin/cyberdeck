# SEC-014 · T-054b Firestore-säännöt, pilvitallennus ja SR-23-validointi · katselmointi

**Päivä:** 2026-10-03 · **Katselmoija:** Digiturva · **Malli:** D-014 (kevyt)
**Laajuus:** commit 8bda431 haarassa `t-054-kirjautuminen-ja-pilvitallennus`: `firestore.rules`, `firestore.indexes.json`, `firebase.json` (`firestore`-osio), `src/account/{cloudCodec,cloudError,types,memory,index}.ts`, `src/account/firebase/{firestoreCloudStore,loadFirebase}.ts`, `src/storage/{envelope,index}.ts`, testit. Vertailukohta SR-22, SR-23 kohdat 1–6 ja 8–9, SR-27 (SEC-011) ja sääntöluonnos `SEC-011-t054-liite-firestore.rules`. Konsolia ja deployattuja sääntöjä ei tarkistettu (ei pääsyä, ei deployta).

## Tulos
Ei Critical-, High- eikä Medium-löydöksiä. Yksi Low (korjattu tässä katselmoinnissa) ja kaksi Info. **Koodi ei estä Done-tilaa.** SEC-011:n ehto on yhä voimassa: **T-054b:tä ei yhdistetä testiin ennen kuin tietokanta on `europe-north1`:ssä production modessa, säännöt on deployattu ja alla oleva käsin todennus on tehty ja kirjattu korttiin.**

Ajettu korjauksen jälkeen: `npm test` 897/897, `npm run lint` 0, `npm run build` ja `npm run build:test` läpi. Riippuvuudet eivät muuttuneet, joten `npm audit` ei tarvittu (0 SEC-013:ssa).

## Löydökset

### SEC-041 · `checkChange` validoi, mutta pilveen koodattiin raaka syöte · Low · korjattu
**Sijainti:** `src/account/cloudCodec.ts` `checkChange`, `firestoreCloudStore.ts` ja `memory.ts` `commit`.
**Toistaminen:** `commit({ putDecks: [{ ...deck, name: '  Pakka‮  ', createdAt: 'x'.repeat(100) }] }, 0)`. `parseDeck` hyväksyi pakan (`dropped: 0`, koska `cleanText` siistii nimen ja virheellinen aikaleima muuttuu epochiksi), mutta `encodeDeckDoc` kirjoitti alkuperäisen nimen (bidi-ohjausmerkkeineen) ja 100 merkin aikaleiman.
**Vaikutus:** Pieni. Paikallinen data on jo validoitu (SR-11), ja lukija siistii arvot uudelleen (SR-23.1). Säännöt olisivat hylänneet yli 40 merkin aikaleiman, jolloin koko synkronointi olisi kaatunut `denied`-virheeseen. Rikkoo SR-23.6:n ajatuksen "kirjoitetaan vain validoitua".
**Korjaus (tehty):** `checkChange` palauttaa muutoksen, joka on rakennettu vain jäsennetyistä arvoista, ja molemmat toteutukset koodaavat sen. Uusi sopimustesti "writes the validated values, not the raw input" ajetaan molemmille toteutuksille.

### SEC-042 · Säännöt eivät sido pakka- ja kokoelmakirjoituksia metan `rev`-kasvuun · Info
**Sijainti:** `firestore.rules`, `decks/{deckId}` ja `collection/{docId}`.
**Havainto:** Oma (muokattu) asiakas voi kirjoittaa tai poistaa pakkoja kasvattamatta `rev`iä, jolloin muiden laitteiden meta-rev-oikotie ei huomaa muutosta. Samoin meta voidaan poistaa ja luoda uudelleen arvolla `rev: 1`, ja vanha asiakas voi laskea metan `schemaVersion`ia (säännöt sallivat 1–1000). Kaikki koskee vain käyttäjän omaa dataa, eikä toisen käyttäjän dataan pääse. Sama ratkaisu oli luonnoksessa tietoisesti: `getAfter()`-sidonta maksaisi lisälukuja jokaisesta kirjoituksesta.
**Tila:** Hyväksytty. Asiakkaan puolustus: transaktio ja `locked` (alentamisen esto), SR-23.7 (puuttuva meta, kun pohjan `rev` > 0) toteutetaan T-054c:ssä.

### SEC-043 · Poikkeamat luonnoksesta ja D-017:stä · Info
**Havainto:** (1) Säännöissä vain juuri `users` (`{root}`-parametri ja `test_users` pois, D-017 Muutos K-P8). Tämä tiukentaa luonnosta, koska projektit ovat erilliset ja sama tiedosto deployataan molempiin. Muu sisältö on rivi riviltä luonnoksen mukainen (tarkistettu diffillä, erot vain kommenteissa ja `isOwner`in juuriehdossa). (2) `CloudError('locked')` commitissa, kun pilven meta on uudempaa versiota: oikea ja tarpeellinen (SR-23.4), heitetään transaktion sisällä ennen kirjoituksia, eikä `toCloudError` muuta sitä. (3) `CloudSnapshot { meta, decks, invalidDeckIds, collection: missing | ok | invalid, dropped, locked, limitExceeded }` erottaa virheellisen poistetusta (SR-23.3) ja ylirajan (SR-23.5). Merge (T-054c) **ei saa** käsitellä `invalidDeckIds`-pakkoja eikä `collection: invalid`-tilaa poistona, eikä poistaa mitään, kun `limitExceeded` tai `locked` on tosi. Tämä katselmoidaan T-054c:ssä.
**Tila:** Hyväksytty.

## Tarkistettu, ei löydöksiä
| Alue | Tulos |
|---|---|
| SR-22 omistajuus ja tunnistus | Jokainen `allow` alkaa `isOwner(uid)`: `request.auth != null`, `sign_in_provider == 'google.com'`, `request.auth.uid == uid`. Ei `read`/`write`-oikotietä, ei `if true`, ei `{document=**}`. Staattinen testi `firestoreRules.test.ts` valvoo. |
| SR-22 polut | Vain `users/{uid}`, `users/{uid}/decks/{deckId}` (`^[A-Za-z0-9_-]{1,64}$`) ja `users/{uid}/collection/main`. `users`-listaus ei sallittu (ei `list`iä), `collection`-listaus ei sallittu. Muu kielletty oletuksena. |
| SR-22 tietomuoto | `hasAll` + `hasOnly` kaikilla tasoilla (envelope, deck data, collection data, meta). `schemaVersion` int 1–1000, `savedAt` 1–40, nimi 1–200, `sections` ≤ 20, `entries` ≤ 5000, aikaleimat 1–40. |
| SR-22 meta | `create` vain `rev == 1`, `update` vain `rev == resource.data.rev + 1`, `updatedAt == request.time` (asiakas lähettää `serverTimestamp()`). |
| Asiakkaan ja sääntöjen yhteensopivuus | Asiakkaan rajat ovat sääntöjä tiukemmat (nimi 100, osiot 20, kokoelma 5000, ISO-aikaleima 24 merkkiä), joten validi data ei törmää sääntöihin. Kirjoitukset `set()` = koko dokumentti, joten `hasOnly` toimii. |
| SR-23.1–2 | Luku `decodeEnvelopeValue` + `parseDeck`/`parseCollection`, id dokumentin id:stä `isDeckId`llä (`__proto__` ym. varatut avaimet hylätään), data-olion `id`tä ei käytetä, vain tunnetut kentät luetaan. Testi `__proto__`/`constructor`-avaimilla on olemassa. |
| SR-23.3–5 | Virheellinen → `invalidDeckIds`/`invalid` + `dropped`, uudempi → `locked`, `limit(MAX_DECKS + 1)` → `limitExceeded`. Meta, jota säännöt eivät sallisi → `CloudError('unknown')`. |
| SR-23.6 | Kirjoitukset ≤ 500, kokoelma < 900 000 tavua (JSON-UTF-8, yläarvio), pakat ja kokoelma validoidaan ennen lähetystä (SEC-041 korjauksen jälkeen myös koodataan validoitu). |
| SR-23.8 | `isUid` ennen kuin uid päätyy polkuun, muuten `CloudError` heti. |
| SR-23.9 | Ei renderöintiä tässä vaiheessa. Pilvidata kulkee samoihin domain-olioihin kuin localStoragen data, jotka renderöidään tekstinä. |
| Lokit (SR-27) | Ei `console`-kutsuja `src/account/**`:ssa (`no-console: error`). `toCloudError` lukee vain `code`n, `cause` säilytetään mutta sitä ei näytetä eikä lokiteta. Virheviestissä vain laji. |
| Testien eristys | `setup.ts` estää myös `loadFirestore`n. Testit käyttävät muistipilveä ja valemoduuleja, ei oikeaa verkkoa. |
| Bundle | Firestore ei vielä buildissa (kytkentä T-054c:ssä), pääpaketti ennallaan. |
| Salaisuudet | Diffissä ei avaimia eikä tokeneita. Historiassa vain Firebase-web-apiKeyt (`config.ts`, eivät salaisuuksia, R-14, rajaus SEC-028). |

## Käsin tehtävä sääntötodennus (SR-22.4) deployn jälkeen
Ajaa käyttäjä tai PM kummassakin projektissa (ensin `test` = `cyberdeck-tcg-dev`, ennen `/julkaise` myös `default` = `cyberdeck-tcg`). Tulokset kirjataan korttiin (päivä, projekti, jokaisen rivin tulos). Jos yksikin rivi poikkeaa odotetusta, ei yhdistetä vaan pysähdytään ja kysytään Digiturvalta.

**Valmistelu:**
- [ ] Firestore Database → tietokannan sijainti `europe-north1` ja tila production mode (ennen deployta säännöt `allow read, write: if false`).
- [ ] `firebase deploy --only firestore:rules,firestore:indexes --project test`. Konsolin Rules-välilehdellä näkyy otsikkokommentti "Cyberdeck Firestore rules (T-054b)" ja `match /users/{uid}`.

**Rules Playground** (Firestore → Rules → Rules Playground). "Authenticated" päälle, Provider `google.com`, Firebase UID esim. `alice123`. Kirjoituksissa kirjoitetaan dokumentti JSONina "Build document" -kohdassa.

| # | Simulaatio | Polku | Auth | Odotettu |
|---|---|---|---|---|
| 1 | get | `users/alice123` | google, `alice123` | Allow |
| 2 | create | `users/alice123/decks/d1`, `{schemaVersion: 1, savedAt: "2026-10-03T12:00:00.000Z", data: {name: "Testi", sections: [], createdAt: "2026-10-03T12:00:00.000Z", updatedAt: "2026-10-03T12:00:00.000Z"}}` | google, `alice123` | Allow |
| 3 | get | `users/bob456` | google, `alice123` | Deny |
| 4 | create | `users/bob456/decks/d1` (sama data kuin rivi 2) | google, `alice123` | Deny |
| 5 | get | `users/alice123` | ei kirjautunut | Deny |
| 6 | get | `users/alice123` | Provider `anonymous` (tai `password`), `alice123` | Deny |
| 7 | get | `foo/alice123` ja `test_users/alice123` | google, `alice123` | Deny |
| 8 | create | rivin 2 data + ylimääräinen kenttä `owner: "x"` juuressa, toisella kerralla `data.extra: 1` | google, `alice123` | Deny |
| 9 | create | `users/alice123/decks/a b` (välilyönti) ja `users/alice123/collection/other` (`{schemaVersion:1, savedAt:"x", data:{entries:[]}}`) | google, `alice123` | Deny |
| 10 | create | rivin 2 data, `name` 201 merkkiä | google, `alice123` | Deny |
| 11 | create | `users/alice123`, `{schemaVersion: 1, rev: 2, updatedAt: <timestamp>}` | google, `alice123` | Deny (rev ei ole 1) |
| 12 | create | `users/alice123`, `{schemaVersion: 1, rev: 1, updatedAt: "2026-10-03"}` (merkkijono) | google, `alice123` | Deny (ei palvelimen aika) |

**Sovelluksessa** (kun synkronointi on kytketty T-054c:ssä, testisivustolla kehittäjän tilillä):
- [ ] 13. Ensimmäinen synkronointi onnistuu: Firestore Data -välilehdellä `users/<oma uid>` sisältää `rev: 1`, `schemaVersion: 1` ja `updatedAt` (timestamp), ja `decks/*` sekä `collection/main` näkyvät.
- [ ] 14. Muutos ja uusi synkronointi kasvattaa `rev`in täsmälleen yhdellä (rev+1 ja `serverTimestamp` hyväksytään, `update`-sääntö).
- [ ] 15. Kun konsolissa muokataan metan `rev` käsin suuremmaksi ja sovellus synkronoi, tuloksena on konflikti ja uusi kierros, ei ylikirjoitusta vanhalla rev:llä.

Rivit 1–12 vastaavat SR-22.4:n kuutta vaadittua tapausta (oma polku, toisen polku, tuntematon juuri, ylimääräinen kenttä, väärä `rev`, kirjautumaton) ja lisäksi tunnistustavan, polkurajat, kokorajat ja palvelimen ajan. Rivit 13–15 todentavat positiiviset kirjoituspolut, joita Playground ei pysty simuloimaan (`serverTimestamp`).
