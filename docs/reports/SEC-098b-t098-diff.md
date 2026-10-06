# SEC-098b: T-098 julkiset pakat, diff- ja sääntökatselmointi

**Digiturva · 2026-10-06 · PR #101 · `git diff origin/test...origin/t-098-julkiset-pakat` (commitit f59ac99–793906f)**

## Tulos
- **Löydökset:** Critical 0, High 0, Medium 1, Low 2, Info 3.
- **Veto (SEC-098):** SR-30–SR-37 ja SR-40 (säännöt) on toteutettu hyväksyttävästi. *Alkuperäinen ehto: SR-36 vaati korjauksen SEC-098b-1.*
- **Veto, päivitys 2026-10-06 (korjausten varmistus, commit 4b6b2a5):** **Koodiehto täyttyy:** SEC-098b-1, -2 ja -3 on korjattu ja varmistettu (ks. löydösten tilat). Koodi ei enää blokkaa Done-tilaa. **Deploy-ehto (SR-40) on yhä voimassa:** käyttäjän on deployattava `firestore.rules` testiprojektiin ennen testiin yhdistämistä ja tehtävä alla olevat käsitestit 1–7 (SEC-098-7). Tuotantoon säännöt deployataan ennen `/julkaise`:a. `firestore.rules` ei muuttunut SEC-098b:n jälkeen (`git diff fe5685c 4b6b2a5 -- firestore.rules` on tyhjä), joten sääntökatselmointi on yhä voimassa.
- **Korjauskierroksen uudet havainnot:** Info 2 (SEC-098b-7, SEC-098b-8). Eivät blokkaa.
- Riippuvuudet eivät muuttuneet (`package.json` ei diffissä), joten `npm audit` -ajoa ei tarvittu. Diffistä ei löytynyt salaisuuksia (haettu `AIza`, `secret`, `private_key`, `password` ja `token =`).

## Löydökset

### SEC-098b-1 · Ajastettu julkinen päivitys voi luoda kopion uudelleen tilin poiston aikana · Medium
**Sijainti:** `src/account/publicPublisher.ts:85–95` (lähetys), `src/account/sync/session.ts:198–204` (`deleteAccountData`), `src/ui/AccountMenu.tsx:94`, `src/App.tsx:55–59` · **Tehtävä:** T-098, SR-36
**Toistaminen:** 1) Muokkaa julkista pakkaa. `publisher.schedule` ajastaa päivityksen 15 s:n päähän. 2) Avaa heti tilivalikko ja poista tilin tiedot alle 15 s:ssa (editori voi jäädä auki). 3) `deleteAccountData` poistaa `removeMany`:llä ja `cloud.deleteAll`:lla julkiset kopiot, mutta sovellustasoinen julkaisija ei tiedä tästä. 4) Ajastin laukeaa, kun käyttäjä on yhä kirjautuneena, ennen kuin Auth-käyttäjä poistetaan, tai lähetys on jo kesken. `store.publish` luo dokumentin uudelleen (create-sääntö sallii). Sama tapahtuu, jos lähetys odottaa `MIN_GAP_MS`:ää: `disposed` tarkistetaan vain ennen odotusta (rivi 85), ei odotuksen jälkeen.
**Odotettu:** Tilin poiston jälkeen käyttäjän julkisia pakkoja ei ole (SR-36). · **Havaittu:** Pakka nimimerkkeineen voi jäädä julkiseksi. Käyttäjä ei voi enää poistaa sitä, koska tiliä ei ole ja `pubId` vaatii uid:n. Kopion saa poistettua vain ylläpitäjä (SR-42).
**Vaikutus:** Käyttäjän itse kirjoittama nimimerkki ja pakan nimi jäävät pysyvästi julkisiksi vastoin poistopyyntöä (GDPR art. 17 -odotus). Todennäköisyys on pieni, mutta seuraus on peruuttamaton käyttäjälle.
**Korjausehdotus:**
1. `PublicDeckPublisher`-rajapintaan `drain(): Promise<void>`: aseta `disposed = true`, pysäytä ajastimet, tyhjennä `input`, odota `await Promise.all([...entries.values()].map((e) => e.chain))`.
2. `send`-funktiossa tarkista `disposed` uudelleen `MIN_GAP_MS`-odotuksen jälkeen ja juuri ennen `store.publish`-kutsua (`if (disposed) { entry.input ??= input; return; }`).
3. Tilin poistossa kutsu `await publisher?.drain()` ennen `session.deleteAccountData()`:a. Vaihtoehdot: `AccountMenu` saa julkaisijan `usePublicDecks()`:sta, tai `createAccountSession` saa option `beforeDeleteAccount?: () => Promise<void>`, jota `deleteAccountData` kutsuu ensimmäisenä ennen `removeMany`:ä.
4. Testi `publicDecks.test.ts`:ään tai `session.test.ts`:ään: `schedule(input)` → `drain()` + `deleteAccountData()` → ajastimia eteenpäin 30 s → muistin `publicDecks` on tyhjä. Toinen testi: lähetys odottaa minimiväliä, `drain()` kutsutaan odotuksen aikana, eikä kopiota synny.
**Tila:** Korjattu ja varmistettu (4b6b2a5). `drain()` asettaa `disposed`-tilan, pysäyttää ajastimet ja odottaa kaikki ketjut. `send` tarkistaa `disposed`-tilan minimivälin jälkeen ja vielä `isStillPublic`-kutsun jälkeen juuri ennen `store.publish`:ia. `createAccountSession` saa option `beforeDeleteAccount`, jota `deleteAccountData` kutsuu ensimmäisenä `try`-lohkossa ennen `removeMany`:ä. App välittää `publisher?.drain()`:n. Ketjut eivät hylkää (virhe otetaan kiinni `send`:ssä), joten `drain` ei kaada poistoa. Testit: `publicDecks.test.ts` (drain pysäyttää minimiväliä odottavan ja ajastetun lähetyksen, kopioita 0) ja `session.test.ts` (järjestys `before` → `removeMany`). Ajettu: `vitest run src/account src/ui/PublicDecks.test.tsx` 229/229 läpi.

### SEC-098b-2 · Toisella laitteella poistettu tai yksityiseksi muutettu pakka voi jäädä julkiseksi tai syntyä uudelleen (R-22) · Low
**Sijainti:** `src/account/publicPublisher.ts:83–104` ja synkronointikerros (`src/account/sync/*`), joka ei kutsu `publicDecks.remove`:a · **Tehtävä:** T-098, SR-35
**Toistaminen:** a) Laite B julkaisee pakan. Laite A, jonka paikallinen kopio ei vielä tiedä julkaisusta, poistaa pakan. Synkronointi poistaa pakan B:ltä, mutta julkinen kopio jää. b) Laitteella B on ajastettu päivitys (15 s). Laite A muuttaa pakan yksityiseksi, ja `unpublish` poistaa kopion. B:n ajastin laukeaa ja luo kopion uudelleen, vaikka synkronoitu asetus on `private`.
**Odotettu:** Yksityisellä tai poistetulla pakalla ei ole julkista kopiota. · **Havaittu:** Kopio jää orvoksi. Käyttäjä ei näe sitä omissa pakoissaan eikä voi poistaa sitä sovelluksesta. Tapauksessa b hän voi korjata tilanteen vaihtamalla pakan julkiseksi ja takaisin yksityiseksi, tapauksessa a ei mitenkään. Tilin poisto ei myöskään löydä kopiota, koska `deckId` ei ole enää tiedossa.
**Vaikutus:** Pakan nimi ja nimimerkki jäävät näkyviin, kunnes ylläpitäjä poistaa ne. Edellyttää kahta laitetta ja synkronointiviivettä.
**Korjausehdotus (jatkotehtävä, ei blokkaa):**
1. Julkaisijalle optio `isStillPublic(deckId): Promise<boolean>`. App välittää sen, ja se lukee tilin repositoriosta `deck?.publish?.public === true`. `send` kutsuu sitä juuri ennen `store.publish`:ia ja hylkää syötteen, jos tulos on false. Tämä korjaa tapauksen b.
2. Kun synkronointi poistaa pakan, jonka paikallinen `publish.public` oli true, tai vaihtaa sen arvoksi false, kutsutaan `publicDecks.remove(deckId)`. Kutsu on idempotentti, ja säännöt sallivat poiston olemattomasta dokumentista. Tämä korjaa tapauksen a.
3. R-22 jää SECURITY.md:hen jäännösriskiksi, kunnes korjaus on tehty. Kirjaa jatkotehtävä TASKS.md:hen.
**Tila:** Korjattu ja varmistettu (4b6b2a5), kapea jäännösriski jää. Tapaus b: App välittää julkaisijalle `isStillPublic`-tarkistuksen, joka lukee tilin repositoriosta `publish.public === true` juuri ennen lähetystä. Testi `does not send a deck that is no longer public`. Tapaus a: `src/account/publicWatch.ts` `watchPublicDecks` seuraa tilin pakkalistaa ja kutsuu `store.remove`:a pakalle, joka oli julkinen ja on nyt poistettu tai yksityinen (myös synkronoinnin tuomana). Kutsu on idempotentti ja virheet niellään. Testi `removes the public copy of a deck that sync deleted or made private` (a yksityiseksi, b poistettu, kopioita 0). **Jäännösriski (R-22, pienentynyt):** korjaus vaatii, että julkaissut laite avaa sovelluksen kirjautuneena ja näkee muutoksen synkronoinnin kautta. Jos se ei enää koskaan avaa sovellusta, tai jos poisto on ehtinyt paikalliseen dataan ennen ensimmäistä listausta, kopio voi jäädä orvoksi. PRIVACY 11.4 kertoo tästä (SEC-098b-3). SECURITY.md:n R-22:n kuvaus kannattaa päivittää vastaamaan pienentynyttä riskiä (PM).

### SEC-098b-3 · PRIVACY.md 11.4 ei kerro orvoista kopioista · Low
**Sijainti:** `docs/PRIVACY.md` luku 11.4 · **Tehtävä:** T-098, SR-42
**Havaittu:** Luvun 11.4 mukaan julkinen kopio poistetaan aina ennen yksityisiä tietoja. SEC-098b-2:n tapauksissa tämä ei pidä paikkaansa, ja SEC-098b-1:n tapauksessa ei ennen korjausta.
**Korjausehdotus:** Lisää lukuun 11.4 lause: "Jos pakka poistetaan tai muutetaan yksityiseksi toisella laitteella ennen kuin synkronointi on ehtinyt, julkinen kopio voi jäädä näkyviin. Tällöin pyydä poistoa (11.7)." Kun SEC-098b-2 on korjattu, lause poistetaan.
**Tila:** Korjattu ja varmistettu (4b6b2a5). Lause on lisätty sanatarkasti. Koska SEC-098b-2:sta jää kapea jäännösriski, lause pidetään selosteessa.

### SEC-098b-4 · Poikkeama liitteestä: ei arvoa `public-anonymous`, nimettömyys = `nickname == null` · Info (hyväksytty)
**Arvio:** Turvallisuuden kannalta poikkeama vastaa liitettä tai on parempi. Säännöt sallivat vain `visibility in ['private','public']`, ja `nickname` on `null` tai 1–60 merkkiä. `buildPublicDeckInput` muuttaa tyhjän tai virheellisen nimimerkin `null`:ksi (`cleanNickname`), joten virhetilanteessa julkaisu on nimetön eikä nimimerkki vuoda. Julkisessa dokumentissa ei ole uid:tä, sähköpostia eikä Google-nimeä. Nimimerkki tallentuu yksityiseen pakkaan myös `private`-tilassa, mikä on sallittua (PRIVACY rivi 21). Ei korjattavaa.

### SEC-098b-5 · Tunnetun uid:n haltija voi tunnistaa käyttäjän nimettömät pakat · Info
**Havaittu:** Julkisessa dokumentissa ovat `deckId` ja `pubId = sha256(uid:deckId)`. Jos joku tietää uid:n, hän voi listata kaikki julkiset pakat ja laskea jokaiselle tiivisteen. Näin hän löytää kyseisen käyttäjän nimettömät pakat. Sovellus ei julkaise uid:tä missään, ja ylläpitäjä näkee omistajuuden muutenkin, joten käytännön riski on pieni. PRIVACY rivi 22 ("ei yhdistettävissä ilman uid:tä") pitää paikkansa.
**Korjausehdotus:** Ei toimenpiteitä. Uid:tä ei pidä jatkossakaan näyttää käyttöliittymässä, jakolinkeissä eikä lokeissa (SR-27).

### SEC-098b-6 · Sääntöjen deployjärjestys: tilin poisto kaatuu ilman uusia sääntöjä · Info
**Havaittu:** `cloud.deleteAll` poistaa ensin `publicDecks`-dokumentit transaktiossa. Jos uusi koodi ajetaan projektissa, jonka säännöt ovat vanhat, transaktio saa `permission-denied`-virheen, ja **koko tilin poisto epäonnistuu**. Myös julkaisu epäonnistuu, mutta palaa hallitusti yksityiseksi.
**Korjausehdotus:** Noudata SR-40:tä: säännöt deployataan testiprojektiin ennen testiin yhdistämistä ja tuotantoon ennen `/julkaise`:a. Käsitesti 6 alla.

### SEC-098b-7 · `watchPublicDecks`: rinnakkaiset listaukset voivat ratketa väärässä järjestyksessä · Info
**Sijainti:** `src/account/publicWatch.ts:13–24` · **Tehtävä:** T-098
**Havaittu:** `check` käynnistää jokaisesta muutoksesta oman `decks.list()`-kutsun, eikä vanhentuneita tuloksia hylätä. Jos vanhempi listaus (pakka yksityinen) ratkeaisi uudemman (pakka julkinen) jälkeen, `gone` sisältäisi juuri julkaistun pakan, ja sen kopio poistettaisiin. Seuraus on vikasuuntaan turvallinen: kopio poistuu eikä vuoda, mutta julkaisu katoaisi hiljaa. Muistissa ja IndexedDB:ssä saman yhteyden lukujen järjestys säilyy, joten tämä ei käytännössä toteudu.
**Korjausehdotus (valinnainen):** Laskuri tai `latest`-tunniste, jolla vain viimeisimmän listauksen tulos käsitellään.
**Tila:** Info, ei blokkaa.

### SEC-098b-8 · Epäonnistuneen tilin poiston jälkeen julkaisija pysyy pois päältä · Info
**Sijainti:** `src/App.tsx` (`beforeDeleteAccount: () => publisher?.drain()`), `src/account/publicPublisher.ts` (`drain`) · **Tehtävä:** T-098
**Havaittu:** `drain` asettaa julkaisijan pysyvästi `disposed`-tilaan. Jos poisto epäonnistuu (esim. ei yhteyttä), julkisen pakan muokkausten ajastetut päivitykset eivät lähde ennen kuin tili tai sivu vaihtuu. Tämä on tietosuojan kannalta turvallinen suunta. Käytettävyys: julkinen kopio voi jäädä vanhaksi ilman ilmoitusta.
**Korjausehdotus (valinnainen):** Luo julkaisija uudelleen, jos `deleteAccountData` palauttaa false, tai kerro tila käyttäjälle.
**Tila:** Info, ei blokkaa.
## Tarkistetut alueet, ei löydöksiä
- **`firestore.rules` publicDecks (SR-30, SR-31, SR-33, SR-34, SR-40):**
  - Omistajuus: `pubId == lower(hex(sha256(auth.uid + ':' + deckId)))` tarkistetaan luonnissa (uudesta `deckId`:stä), päivityksessä (vanhasta `deckId`:stä, joka ei muutu) ja poistossa. `deckId`-regex ei salli kaksoispistettä, joten syötteiden törmäystä `uid:deckId` ei synny.
  - Kentät: `hasExactly`, jossa on yhdeksän kenttää. Kaikilla merkkijonoilla on rajat, `deck`-kentällä on regex, ei listoja. `updatedAt == request.time`, luonnissa myös `publishedAt == request.time`, ja päivityksessä `publishedAt` pysyy ennallaan.
  - Kyselyt ja tahti: `list` vain, kun `limit <= 50`. Puuttuva `limit` on null, jolloin vertailu epäonnistuu ja kysely hylätään. Päivitysten väli on vähintään 10 s.
  - Poisto: vain omistaja, tai dokumenttia ei ole olemassa (ei vaikutusta). Kaikki kirjoitukset vaativat Google-kirjautumisen.
  - Rajaus: ei `{document=**}`-osumaa. `users/*`-säännöistä muuttui vain `isDeckDoc`, johon tuli valinnaiset `visibility` (`private`/`public`) ja `nickname` (null tai 1–60), ja `hasAll` ja `hasOnly` pitävät pakolliset kentät ennallaan. Staattiset testit (`src/firestoreRules.test.ts`) kattavat nämä.
- **Lukuvalidointi ja renderöinti (SR-37, SR-32):**
  - `parsePublicDeck` validoi `pubId`:n, version, `deckId`:n, nimen ja legendit (`cleanText` poistaa ohjaus- ja bidi-merkit), korttimäärän, `deck`-kentän (base64url, ≤ 16 000), nimimerkin ja ISO-ajat. Tulos rakennetaan vain sallituista kentistä, ja virheellinen dokumentti ohitetaan (`dropped`).
  - Pakka jäsennetään samalla `SharedDeckView`- ja `decodeDeckShare`-polulla kuin jakolinkki.
  - Datasta ei muodosteta `href`-, `src`- tai `style`-arvoja eikä käytetä `dangerouslySetInnerHTML`:ää. Ainoat linkit ovat vakioreittejä, ja `routeHash` käyttää validoitua `pubId`:tä. Hash-reitti hyväksyy vain 64-merkkisen heksan.
- **Kirjautumaton luku:** Nimetyssä `public-read`-appissa on vain `apiKey`, `projectId`, `appId` ja `messagingSenderId`. Siinä ei ole Authia, joten pyyntöihin ei liity tunnistetta eikä appi vaikuta kirjautumisappiin. Ei `onSnapshot`-kuuntelijaa, sivukoko on 24, käytössä on kursorisivutus, ja välimuisti on store-kohtainen `WeakMap`.
- **Kirjoitus:** Julkaisu tehdään transaktiona (luonti tai päivitys). Dokumentti rakennetaan vain validoidusta syötteestä, eikä siihen tule uid:tä. Luku ja kirjoitus käyttävät eri appeja.
- **SR-35 (poikkeama hyväksytty):** Yksityiseksi muutto ja poisto poistavat ensin julkisen kopion. Jos se epäonnistuu, pakka pysyy julkisena ja käyttäjä näkee virheen. Ratkaisu toimii turvallisesti virhetilanteessa: sovellus ei koskaan näytä pakkaa yksityisenä, jos kopio on yhä julkinen. Jono ei ole turvallisuuden kannalta välttämätön. Julkaisun epäonnistuessa asetus palautetaan.
- **SR-36 järjestys:** `deleteAccountData` poistaa ensin paikallisten pakkojen kopiot (`removeMany`), sitten `deleteAll` poistaa pilven pakkojen kopiot ennen yksityisiä dokumentteja ja lopuksi Auth-käyttäjän (`AccountMenu`). Järjestys on oikein. Ajoitusongelma on kuvattu kohdassa SEC-098b-1.
- **SR-39:** "Tallenna omaksi" käyttää `DeckImport`-polkua (uusi pakka). Julkisuusasetusta, nimimerkkiä tai `deckId`:tä ei välitetä, ainoastaan aloitusnimi.
- **SR-41:** Julkisissa näkymissä on dynaaminen `noindex, nofollow`. Hash-reittejä ei muutenkaan indeksoida erillisinä sivuina.
- **Salaisuudet ja riippuvuudet:** ei löydöksiä (ks. Tulos).

## Käsitestit sääntöjen deployn jälkeen (testiprojekti, SEC-098-7, SR-40)
1. Julkaise pakka. Tarkista Firestore-konsolista, että dokumentin id on 64 pientä heksamerkkiä ja sama kuin selaimessa laskettu `sha256(uid:deckId)`. Näin varmistuu, että `hashing.sha256().toHexString().lower()` toimii.
2. Muokkaa julkista pakkaa, ja päivitys näkyy noin 15 s kuluttua. Kaksi nopeaa nimimerkin vaihtoa peräkkäin: kumpikin menee läpi ilman virhettä.
3. Avaa Julkiset pakat ja julkinen pakka kirjautumattomana (yksityisessä ikkunassa). Molemmat toimivat.
4. Toisella Google-tilillä: konsolista tai SDK:lla yritys kirjoittaa tai poistaa ensimmäisen tilin `pubId` epäonnistuu (`permission-denied`).
5. Muuta pakka yksityiseksi ja poista toinen julkinen pakka. Molempien dokumentit katoavat konsolista.
6. Poista tilin tiedot ja tarkista, ettei `publicDecks`-kokoelmaan jää tilin pakkoja. Kun SEC-098b-1 on korjattu, toista testi niin, että muokkaat julkista pakkaa alle 15 s ennen poistoa, ja odota sen jälkeen 30 s.
7. Vanhat pakat, jotka on tallennettu ennen T-098:aa, synkronoituvat yhä. `isDeckDoc` hyväksyy ne ilman uusia kenttiä.
