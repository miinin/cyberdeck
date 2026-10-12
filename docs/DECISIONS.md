# DECISIONS

Päätösloki. Vain lisäyksiä, ei poistoja (rules.md 5.2).

## D-001 · Haaramalli ja julkaisu · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** GitHub Actions julkaisee jokaisen main-haaraan tulevan muutoksen Firebase Hostingiin. rules.md 11 vaatii käyttäjän luvan ennen julkaisua.
**Vaihtoehdot:** A) Agentit työskentelevät haaroissa ja käyttäjä julkaisee /julkaise-komennolla. B) PM mergeää ja julkaisee automaattisesti, kun tehtävä on Done.
**Päätös:** A
**Perustelu:** Tuotanto muuttuu vain käyttäjän luvalla. PR:n esikatselu-URL:lla muutoksen voi tarkistaa ennen julkaisua.
**Seuraukset:** Yksi tehtävä = yksi haara `t-XXX-nimi` = yksi PR. Täydennetty päätöksellä D-003 (test-haara). GitHub Actions julkaisee palvelutilillä `github-deploy`, jolla on vain Hostingin julkaisuoikeudet (firebasehosting.admin, serviceUsageConsumer, apiKeysViewer, run.viewer). Avain on GitHubin salaisuutena. Suojaushook (`~/.claude/hooks/suojaa-julkaisu.js`) kysyy luvan main-pushiin, `gh pr merge`:en ja `firebase deploy`:hin ja estää force pushin.

## D-002 · Pääistunto toimii PM:nä, muut roolit aliagentteina · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** Käyttäjä haluaa antaa tehtäviä mahdollisimman helposti. Claude Coden aliagentit eivät voi kysyä käyttäjältä kesken työn.
**Päätös:** Käyttäjä keskustelee PM:n kanssa. PM delegoi muille rooleille aliagentteina (`~/.claude/agents/`): Arkkitehti, UX Designer, Sisällöntuottaja, Koodari, Digiturva, Testikäyttäjä ja Dokumentoija (agents.md v1.2).
**Seuraukset:** Aliagentit palauttavat avoimet kysymykset PM:lle, joka ratkaisee ne tai kysyy käyttäjältä.

## D-003 · Pysyvä testihaara ja testisivusto · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** PR-esikatselut ovat tehtäväkohtaisia ja vanhenevat. Käyttäjä haluaa kokeilla kaikkia julkaisemattomia muutoksia yhdessä pysyvässä osoitteessa ennen tuotantoa.
**Vaihtoehdot:** A) Pelkät PR-esikatselut. B) Pysyvä `test`-haara ja oma testisivusto samassa Firebase-projektissa. C) Pysyvä `test`-haara ja erillinen Firebase-projekti testille.
**Päätös:** B nyt. C:hen siirrytään, kun sovellus tallentaa dataa.
**Perustelu:** Staattisella sivustolla toinen Hosting-sivusto riittää ja on yksinkertaisin. Kun mukana on dataa, testin ja tuotannon data on erotettava kokonaan.
**Seuraukset:** Tehtävähaarat tehdään testistä, ja PR:t kohdistuvat testiin (GitHubin oletushaara = `test`). PM yhdistää Done-tehtävät testiin. `/julkaise` vie testin mainiin julkaisu-PR:llä. PR-esikatselut julkaistaan testisivustolle. Rinnakkaiset tehtävät tehdään omissa git worktreeissään (`/rinnakkain`).

## D-004 · PROJECT.md:n tavoitteet, rajaukset ja MVP-tasot hyväksytty · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** PM laati PROJECT.md:n luonnoksen perustamiskeskustelun pohjalta. Mittarit, rajaukset ja MVP-tasot olivat ehdotuksia.
**Vaihtoehdot:** A) Hyväksytään sellaisenaan B) Hyväksytään muutoksin C) Käydään kohta kohdalta läpi
**Päätös:** A
**Perustelu:** Käyttäjän valinta.
**Seuraukset:** MVP-0 alkaa T-001:llä (kävelevä luuranko). Arkkitehti tekee teknologiapäätöksen ennen toteutusta (agents.md, PM:n työtapa 2). Rajatut asiat on kirjattu IDEAS.md:hen. MVP-3:n sisältö päätetään MVP-2:n jälkeen.

## D-005 · MVP-0:n teknologiat: Vite + React + TypeScript, Vitest, ESLint · 2026-09-30 · Päättäjä: PM (Arkkitehdin ehdotus)
**Tila:** Voimassa (PM hyväksyi 2026-09-30: ei kustannuksia eikä palvelulukitusta)
**Konteksti:** T-001 rakentaa kävelevän luurangon. Kiinteät reunaehdot: Firebase Hosting julkaisee staattisen `dist/`-kansion, ja workflowt ajavat Node 22:lla `npm ci && npm run build` (D-001, D-003). Korttidata haetaan selaimesta Netdeck.gg:n julkisesta rajapinnasta (CORS auki, ei avainta, TUTKIMUS.md). MVP-1 tuo heti vuorovaikutteisen käyttöliittymän (kokoelman merkintä, pakat, haku, pakkalistan tuonti ja puuttuvien korttien raportti), ja MVP-2 kirjautumisen. Palvelinta ei tarvita ennen MVP-2:ta.
**Vaihtoehdot:**
- **A) Yksinkertaisin mahdollinen:** pelkkä HTML ja JavaScript ilman build-työkalua. `npm run build` kopioi tiedostot `dist/`:iin pienellä Node-skriptillä, testit Noden omalla `node:test`-ajurilla, ei tyyppitarkistusta.
  + Nolla ajonaikaista riippuvuutta, vähiten opittavaa.
  − Ei tyyppejä rajapintakerroksen ja sisäisen mallin välillä, mikä on juuri se kohta, jonka pitää kestää rajapinnan muutokset. Käyttöliittymän tila (kokoelma, pakat, suodatus) rakennetaan MVP-1:ssä käsin DOM-koodina, jota on vaikea testata ja ylläpitää. Kehityspalvelin ja moduulien niputus puuttuvat.
- **B) Vite + TypeScript ilman käyttöliittymäkehystä** (vanilla-DOM), Vitest, ESLint.
  + Tyypit ja nopea build. Riippuvuuksia vähän. Riittää MVP-0:n yhteen listaan.
  − MVP-1:n tilallinen käyttöliittymä kirjoitettaisiin itse (renderöinti, tapahtumat, tilanhallinta) tai kehys otettaisiin käyttöön heti MVP-1:n alussa, jolloin MVP-0:n näkymä kirjoitetaan uudelleen.
- **C) Vite + React + TypeScript**, Vitest + Testing Library + jsdom, ESLint + typescript-eslint. **(ehdotus)**
  + Komponentit ja tila ovat valmiina MVP-1:n näkymille. Laajimmin dokumentoitu yhdistelmä, joten agenttien virheiden riski on pienin. Testing Library testaa käyttäjän näkökulmasta (roolit ja nimet), mikä tukee saavutettavuutta. Vite tuottaa suoraan `dist/`:n.
  − Noin 70 kt (gzip) lisää JavaScriptiä ja enemmän kehitysriippuvuuksia kuin A:ssa tai B:ssä.
- (Tarkasteltu: Preact on Reactin kanssa yhteensopiva ja pienempi, mutta yhteensopivuuskerros ja suppeampi dokumentaatio eivät ole koon arvoisia tässä mittakaavassa. Svelte on hyvä, mutta uusi tiedostomuoto ja kääntäjä lisäävät opittavaa ilman selvää hyötyä.)
**Päätös:** C
**Perustelu:** Yksinkertaisin ratkaisu, joka kattaa jo seuraavan tason (MVP-1) ilman uudelleenkirjoitusta. Rajapinta-, malli- ja käyttöliittymäkerrokset erotetaan niin, että rajapintakerros ja malli ovat kehyksestä riippumatonta TypeScriptiä (ARCHITECTURE.md). Versiot on todennettu npm-rekisteristä ja kokeiltu yhdessä 2026-09-30 (asennus, testiajo jsdomissa, tyyppitarkistus, lint ja `vite build` → `dist/`, `npm audit`: 0 haavoittuvuutta).
**Lukitut versiot ja rajoitteet (todennettu 2026-09-30):**
- vite 8.3.1, @vitejs/plugin-react 6.1.1, react ja react-dom 19.3.0, typescript **6.0.3**, vitest 5.0.3, jsdom **29.1.1**, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.7, @types/react ja @types/react-dom 19.3.0, eslint **10.11.0**, @eslint/js 10.0.1, typescript-eslint 8.71.0, eslint-plugin-react-hooks 7.1.1, globals 17.12.0.
- TypeScript 7 jätetään pois, koska typescript-eslint 8.71 tukee vain versioita < 6.1.
- jsdom 30 vaatii Node 24.15:n tai uudemman, ja kehityskoneella on Node 24.14, joten valitaan jsdom 29.
- eslint-plugin-jsx-a11y (6.10.2) tukee vain ESLint 9:ää, joka on jo poistunut tuesta (npm-varoitus). Saavutettavuus varmistetaan UX:n axe- tai Lighthouse-ajoilla ja Testing Libraryn roolikyselyillä. Lint-tason saavutettavuustarkistus on erillinen ideakohta.
**Kustannukset ja lukittautuminen:** Ei maksullisia palveluita. Kaikki riippuvuudet ovat MIT-lisensoituja avoimen lähdekoodin paketteja (jsdom MIT, TypeScript Apache-2.0). Firebase Hosting pysyy Spark-tasolla. Ei uutta palvelulukitusta: `dist/` on tavallinen staattinen sivusto.
**Seuraukset:** Koodari toteuttaa T-001:n ARCHITECTURE.md:n rakenteella. Digiturva katselmoi riippuvuudet (rules.md 10). Suositeltavat jatkotehtävät PM:lle: korttidatan välimuisti (rajapinta on hidas, noin 2 s ja 465 kt per sivu), testien ja lintin ajo PR-workflowssa sekä ESLint-saavutettavuusliitännäinen, kun ESLint 10 -yhteensopiva versio on saatavilla.

## D-006 · Korttidata haetaan Netdeck.gg:n julkisesta rajapinnasta, korttikuvat myöhemmin · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** Digiturva (SECURITY.md R-1, R-2): Netdeck.gg:n käyttöehtoja ei löytynyt. cyberpunktcg.com kieltää "bots or scraping tools". Korttikuvien käyttöoikeus on epäselvä.
**Vaihtoehdot:** A) Haetaan data rajapinnasta käyttäjän selaimessa B) Ei käytetä rajapintaa ennen virallista lupaa
**Päätös:** A. Käyttäjä hyväksyi riskin R-2. Korttikuvia ei näytetä T-001:ssä, vaan käyttäjä tuo ne käyttöön myöhemmin (R-1).
**Perustelu:** Käyttäjän päätös. Sovellus on ei-kaupallinen, siinä on epävirallisuusmerkintä, ja rajapintaa kutsutaan maltillisesti.
**Seuraukset:** Digiturva kirjaa riskin hyväksytyksi SECURITY.md:hen seuraavassa katselmoinnissa. Korttikuvat tulevat omana tehtävänään, kun käyttäjä toimittaa ne.

## D-007 · MVP-1:n rajaukset: korttitaso, paikallinen tallennus ja pakkojen tiedostomuodot · 2026-10-01 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** MVP-1 tuo kokoelman, pakat ja pakkalistan tuonnin. Avoimia olivat K5 (kortit vai painokset), tallennuspaikka (kirjautuminen on MVP-2:ssa) ja tuontimuoto.
**Päätös:**
1. Kokoelma seuraa kortteja korttitasolla. Tietomalli jättää valmiuden painoksille (alt-artit, beta, kieliversiot), mutta niitä ei toteuteta nyt.
2. MVP-1 tallentaa kokoelman ja pakat vain paikallisesti selaimeen. Tallennuskerros suunnitellaan niin, että Firebase-kirjautuminen ja pilvitallennus voidaan lisätä myöhemmin (MVP-2) ilman tietomallin uudelleenkirjoitusta.
3. Pakkalistat tuodaan tekstinä tai .txt-tiedostona. Viitemuoto on `docs/examples/esimerkkipakka.txt`: `# Pakan nimi`, osio-otsikot `// Legends (3)`, rivit `3 Nimi - Alaotsikko`. Kaikki 19 esimerkin korttia vastaavat rajapinnan kortteja (PM tarkisti 2026-10-01).
4. Pakan voi viedä ja tuoda sekä .json- että .txt-muodossa (viitemuoto). Käyttötarkoitus: varmuuskopio ja jakaminen kaverille.
**Perustelu:** Käyttäjän päätös. Pienin toteutus, joka ratkaisee pääongelman ja jättää tien auki MVP-2:lle.
**Seuraukset:** MVP-1:n tehtävät T-010–T-015. Arkkitehti tekee tallennuskerroksesta ja tietomallista ADR:n (T-011). Digiturva arvioi paikallisen tallennuksen, tiedostojen tuonnin ja .json-tiedostot epäluotettavana syötteenä.

## D-008 · Kokoelman ja pakkojen tietomalli ja paikallinen tallennuskerros · 2026-10-01 · Päättäjä: PM (Arkkitehdin ehdotus)
**Tila:** Voimassa (PM hyväksyi 2026-10-01: ei kustannuksia, uusia riippuvuuksia eikä palvelulukitusta). Kohdan 5 Firebase-osuus on vain suunta: Firestore-päätös tehdään MVP-2:n ADR:ssä käyttäjän hyväksynnällä.
**Konteksti:** D-007: MVP-1 tallentaa kokoelman (T-012) ja pakat (T-013) vain selaimeen ja seuraa kortteja korttitasolla, mutta malli jättää valmiuden painoksille, ja MVP-2 lisää kirjautumisen ja pilvitallennuksen ilman tietomallin uudelleenkirjoitusta. T-014 tuo pakkalistan tekstinä (`3 Nimi - Alaotsikko`, osiot `// Legends (3)`), ja T-015 vie ja tuo pakan .json- ja .txt-muodossa. Kaikki tallennettu ja tuotu data on epäluotettavaa syötettä (D-007, rules.md 10). Datan koko on pieni: kokoelmassa on enintään noin 150 riviä (noin 5 kt), ja yksi pakka on noin 2 kt.

Päätöksessä on kuusi osaa. Rakenne ja allekirjoitukset ovat ARCHITECTURE.md:n luvussa 12.

### 1. Tallennustekniikka
**Vaihtoehdot:**
- **A) `localStorage` (yksinkertaisin mahdollinen)**, yksi JSON-merkkijono per kokonaisuus. **(ehdotus)**
  + Synkroninen ja yksinkertainen API, ei riippuvuuksia. jsdom toteuttaa sen (tarkistettu `node_modules/jsdom/lib/jsdom/browser/Window.js` 2026-10-01), joten testit toimivat sellaisenaan. `storage`-tapahtuma kertoo muiden välilehtien muutoksista. Kaikki kohdeselaimet tukevat.
  − Raja on 5 MiB per origin (MDN: Storage quotas and eviction criteria, tarkistettu 2026-10-01), mikä riittää satoihin pakkoihin. Ylitys heittää `QuotaExceededError`in, joka käsitellään. Synkroninen kirjoitus pysäyttää pääsäikeen hetkeksi, mutta muutaman kilotavun datalla viivettä ei huomaa.
- **B) IndexedDB suoraan selaimen API:lla.**
  + Asynkroninen, suurempi kiintiö ja transaktiot.
  − Huomattavasti monimutkaisempi API (tapahtumapohjaiset pyynnöt, versionvaihdot, `onblocked`). jsdom ei toteuta IndexedDB:tä (sama tarkistus), joten testeihin tarvittaisiin uusi riippuvuus (esim. fake-indexeddb). Hyödyt (koko, transaktiot) eivät koske tätä datamäärää.
- **C) IndexedDB kirjaston kautta** (idb-keyval, Dexie).
  − Uusi ajonaikainen riippuvuus (rules.md 10) ja lisäksi testien väärennösriippuvuus ilman tarvetta.
- (Hylätty jo D-007:ssä: Firebase ja anonyymi kirjautuminen heti MVP-1:ssä.)
**Valinta: A.** Rajapinta on silti asynkroninen (`Promise`), jotta IndexedDB- tai Firestore-toteutus voidaan vaihtaa sen taakse muuttamatta kutsujia.
**Molempia (A ja B) koskeva riski:** selaimen tallennustila on "best-effort". Selain voi tyhjentää sen tilanpuutteessa, ja Safari poistaa skriptin luoman datan, jos sivustolla ei ole ollut käyttäjän vuorovaikutusta 7 päivän selainkäytön aikana (MDN, sama lähde). Tekniikan valinta ei siis ratkaise datan pysyvyyttä. Torjunta: T-015:n .json-vienti varmuuskopiona nyt ja pilvitallennus MVP-2:ssa. Lisäksi tallennuskerros tarjoaa funktion `requestPersistentStorage()` (`navigator.storage.persist()`, SECURITY.md SR-13), jota T-012 kutsuu käyttäjän toimesta, ei käynnistyksessä.

### 2. Korttien yksilöivä avain (`CardKey`)
**Vaihtoehdot:**
- **A) Netdeckin UUID (`id`).** Vakaa, jos Netdeck ei vaihda sitä. Toisaalta läpinäkymätön (vientitiedostot eivät ole luettavia) ja sidottu yhteen lähteeseen: jos rajapinta vaihtuu (PROJECT.md:n riski, todennäköisyys keskisuuri), kaikki tallennettu data jää orvoksi. Tekstituonti ei voi tuottaa UUID:tä ilman korttiluetteloa.
- **B) Netdeckin `slug`.** Luettava, mutta sekin on lähteen omaa dataa. **ARCHITECTURE.md:n luvun 6 oletus, että slug on "rakennettavissa uudelleen nimestä", ei pidä:** 16 kortilla 151:stä slug poikkeaa nimen normalisoinnista (esim. `judy-a-lvarez-braindance-maestro` nimestä Judy Álvarez ja `royce-don-t-call-me-simon`). Todennettu rajapinnasta 2026-10-01.
- **C) Oma avain, joka johdetaan nimestä ja alaotsikosta**, `cardKey(name, subname)`: Unicode NFKD, diakriittiset merkit pois, pienet kirjaimet, heittomerkit (`'`, `’`, `‘`) pois, muiden kuin `a–z0–9`-merkkien jaksot yhdeksi väliviivaksi ja reunojen väliviivat pois. Esim. `V — Streetkid` → `v-streetkid` ja `Judy Álvarez — Braindance Maestro` → `judy-alvarez-braindance-maestro`. **(ehdotus)**
  + Riippumaton lähteestä: avain syntyy uudelleen mistä tahansa korttidatasta, jossa on nimi ja alaotsikko. Luettava vientitiedostoissa.
  + **Sama funktio ratkaisee T-014:n tuonnin:** `normalizeCardName("Dum Dum - Maelstrom Triggerman")` on sama kuin `cardKey("Dum Dum", "Maelstrom Triggerman")`, koska erotin (` - `, ` — ` tai välilyönti) katoaa normalisoinnissa. Todennettu 2026-10-01: 151 korttia tuottaa 151 eri avainta, ja esimerkkipakan kaikki 19 riviä löytyvät suoraan avaimella. Pisin avain on 43 merkkiä.
  − Jos kortin nimeä korjataan lähteessä (errata, aksentti), avain muuttuu. Torjunta: tallennettuja rivejä, joiden avainta ei löydy luettelosta, ei poisteta, vaan ne näytetään avaimella. Tarvittaessa lisätään aliaslista migraationa (kohta 4).
  − Teoreettinen törmäys (kaksi korttia samalla avaimella). Torjunta: luettelon indeksi varoittaa törmäyksestä (T-012), ja testi varmistaa fixtuurin avainten yksilöllisyyden.
**Valinta: C.** Avain lisätään `Card`-malliin kentäksi `key` (lasketaan `mapCard`issa). `id` ja `slug` säilyvät mallissa, mutta tallennettu data ei viittaa niihin.
**Painosvalmius:** kokoelman ja pakan rivi on `{ card: CardKey, count }`. Painokset lisätään myöhemmin **valinnaisena erittelynä** saman rivin sisään (esim. `printings?: { printing: PrintingKey; count: number }[]`, summa ≤ `count`), ja korttitason `count` säilyy kokonaismääränä. Vanha data on silloin sellaisenaan kelvollista. `PrintingKey`n muoto (todennäköisesti setti ja keräilynumero, esim. `welcometonightcityretail:005a`) päätetään painostehtävässä, ei nyt.

### 3. Tietomalli
**Vaihtoehdot:** A) Yksi tallennusavain kaikelle datalle. B) **Oma tallennusavain ja skeemaversio per kokonaisuus: kokoelma ja pakat. (ehdotus)** C) Oma avain jokaiselle pakalle.
**Valinta: B.** Rikkinäinen pakkadata ei vie kokoelmaa mukanaan, ja jako vastaa MVP-2:n Firestore-dokumentteja. C:n hyöty (pienemmät kirjoitukset) on merkityksetön tällä datamäärällä, ja pakkojen listaus vaatisi avainten luettelointia.
- **Kokoelma:** `{ entries: { card: CardKey; count: number }[] }`. `count` on kokonaisluku 1–999, ja määrä 0 poistaa rivin. Kortti esiintyy enintään kerran.
- **Pakka:** `{ id, name, sections: { name, cards: { card, count }[] }[], createdAt, updatedAt }`. Osiot ovat vapaasti nimettyjä ja järjestettyjä (T-014:n `// Legends (3)` → osio `Legends`, `Sideboard` → osio `Sideboard`). Osion korttimäärää ei tallenneta, vaan se lasketaan. `id` = `crypto.randomUUID()`.
- Kortin tiedot (nimi, tyyppi, kustannus) eivät tallennu, vaan ne haetaan luettelosta avaimella. "Missä pakoissa kortti on" ja "montako kopiota on vapaana" ovat johdettuja tietoja, eikä niitä tallenneta.
- Tallennusmuoto on taulukko eikä avaimin indeksoitu objekti (`Record<CardKey, …>`). Näin `__proto__`-tyyppiset avaimet eivät aiheuta ongelmia, ja järjestys on deterministinen.

### 4. Skeemaversio, validointi ja migraatiot
- Jokainen tallennettu arvo on kääre `{ schemaVersion, savedAt, data }`. Aloitusversio on 1 molemmille kokonaisuuksille.
- **Luettaessa:** JSON jäsennetään, versio tarkistetaan, migraatiot ajetaan järjestyksessä (n → n+1) ja tulos validoidaan valkolistalla. Virheellinen rivi pudotetaan ja lasketaan (`dropped`). Tuntemattomat kentät pudotetaan.
- **Juuri rikki** (JSON ei jäsenny tai kääre tai `data` on väärän muotoinen): raaka merkkijono kopioidaan varmuuskopioavaimeen **ennen** kuin mitään kirjoitetaan päälle. Sitten jatketaan tyhjästä ja kerrotaan kutsujalle (`notice: reset`). Jos varmuuskopiointi epäonnistuu, päälle ei kirjoiteta.
- **Uudempi versio kuin sovellus tuntee** (esim. sivuston palautus vanhaan versioon): data luetaan tyhjänä, ja kirjoitukset hylätään virheellä `newer-version`. Uudemman version dataa ei koskaan ylikirjoiteta.
- **Vanhempi versio:** migraatiot ajetaan muistissa. Ennen ensimmäistä päällekirjoittavaa tallennusta alkuperäinen kopioidaan varmuuskopioavaimeen.
- Kirjoitettaessa syöte validoidaan samalla validaattorilla. Virheellistä dataa ei tallenneta (`invalid-input`).

### 5. Firebase myöhemmin (MVP-2, suunta)
- Kaikki käyttöliittymäkoodi käyttää vain rajapintoja `CollectionRepository` ja `DeckRepository`. Firestore-toteutus tehdään samojen rajapintojen taakse omaan moduuliinsa, eivätkä kutsujat muutu. Kaikki metodit ovat jo asynkronisia, ja `subscribe` vastaa sekä `storage`-tapahtumaa että Firestoren `onSnapshot`ia.
- Alustava Firestore-rakenne: `users/{uid}/collection/main` (kokoelma yhtenä dokumenttina) ja `users/{uid}/decks/{deckId}` (dokumentti per pakka), sama kääre ja versio. Säännöt: `request.auth.uid == uid`. Firestoren rajat: 1 MiB per dokumentti, ja Spark-tasolla 50 000 lukua, 20 000 kirjoitusta ja 20 000 poistoa päivässä sekä 1 GiB tallennustilaa (firebase.google.com/docs/firestore/quotas, tarkistettu 2026-10-01). Kokoelma mahtuu yhteen dokumenttiin moninkertaisesti. Firestore-toteutus niputtaa nopeat määrämuutokset (debounce), jotta kirjoitusraja ei täyty.
- Paikallisen datan siirto pilveen ensimmäisellä kirjautumisella, erillinen testiprojekti (D-003, vaihtoehto C) ja Firestoren säännöt kuuluvat MVP-2:n omaan ADR:ään. Firestore on Spark-tasolla ilmainen, mutta **se lukitsee Googlen palveluun**, joten sen hyväksyy käyttäjä MVP-2:ssa, ei tämän päätöksen yhteydessä.

### 6. Vienti ja tuonti (T-015, T-014)
- **.json-vienti ei ole tallennusskeema** vaan oma, versioitu vaihtomuoto: `{ format: "cyberdeck.deck", version: 1, deck: { name, sections: [{ name, cards: [{ card, name, count }] }] } }`. Siinä ei ole `id`- eikä aikaleimakenttiä (tuonti luo uuden pakan). Näyttönimi `name` on mukana luettavuuden vuoksi ja varapolkuna: jos avainta ei löydy, tuonti yrittää nimen normalisointia. Perustelu: tallennusskeema saa muuttua (esim. MVP-2:n synkronointikentät) rikkomatta kaverille jaettuja tiedostoja. Validointi käyttää samoja domain-funktioita (`parseDeckContent`) ja kokorajoja. T-015 tarkentaa muodon ja tiedostokokorajan (Digiturva).
- **T-014:n tekstituonti:** rivin nimiosa → `normalizeCardName` → haku avaimella. Jos osumaa ei ole, haetaan pelkällä nimellä (`normalizeCardName(card.name)`): yksi osuma = löytyi, monta = monitulkintainen (esim. pelkkä `V`), nolla = tunnistamaton rivi, joka näytetään käyttäjälle. Hakufunktio kuuluu T-014:lle, normalisointi tähän tehtävään.

**Kustannukset ja lukittautuminen:** Ei kustannuksia, uusia riippuvuuksia eikä palvelulukitusta MVP-1:ssä.
**Seuraukset:**
- T-011 toteuttaa `src/domain/`-tiedostot (cardKey, collection, deck, validate) ja `src/storage/`-kerroksen ARCHITECTURE.md:n luvun 12 mukaan. `Card` saa kentän `key` (`mapCard` ja testien Card-fixtuurit päivittyvät).
- ESLint estää selaimen tallennus-API:t (`localStorage`, `sessionStorage`, `indexedDB`) kaikkialla paitsi `src/storage/keyValueStore.ts`:ssä sekä `storage`-kerroksen sisäiset tuonnit sen ulkopuolelta.
- T-012–T-015 käyttävät vain `src/storage/index.ts`:n julkista rajapintaa.
- Avoin PM:lle: tallennetaanko T-014:ssä tuotu pakkalista aina pakaksi, ja tarvitaanko pakalle tila "koottu / suunnitelma" (PROJECT.md: "missä omassa pakassasi kortti on"). Malli sallii molemmat myöhemmin valinnaisena kenttänä ilman migraatiota.

## D-009 · Kevennetty katselmointimalli ja halvemmat mallit kevyille rooleille · 2026-10-01 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** Jokainen aliagentti käytti 80 000–220 000 tokenia, ja viisi rinnakkaista agenttia kulutti noin 21 % viiden tunnin kiintiöstä minuutissa. T-010:n katselmoinnit keskeytyivät käyttörajaan. Jokainen tehtävä sai 5–7 katselmointia riippumatta riskistä.
**Vaihtoehdot:** A) Ennallaan B) Katselmoinnit riskin mukaan, Testikäyttäjä ja Dokumentoija MVP-tason lopussa, Sonnet kevyille rooleille ja enintään kaksi rinnakkaista agenttia C) Ei aliagentteja, PM tekee kaiken
**Päätös:** B. Käyttäjä pyysi tekemään kulutuksesta siedettävämpää ("liikaa tarkasteluja, etenkin näin alkuvaiheessa").
**Perustelu:** Laadun kannalta tärkeimmät tarkistukset (Koodarin katselmointi, UX käyttäjälle näkyviin muutoksiin ja Digiturva riskialttiisiin) säilyvät. Rikkomistestaus ja dokumentaatio ovat tehokkaampia koko MVP-tasolle kerralla. Sonnet riittää teksti- ja selaintarkastuksiin.
**Seuraukset:** agents.md v1.3 ("Yhteispeli" → oletukset). rules.md 7.2:n Definition of Done tulkitaan näin: Testikäyttäjä- ja Dokumentoija-kohdat täyttyvät MVP-tason lopussa. PM tyhjentää oman istuntonsa (`/clear`) tehtävien välissä, koska tila on tiedostoissa. Käynnissä olevat T-010:n ja T-011:n katselmoinnit viedään loppuun.

## D-010 · Ulkoasun uudistus Cyberpunk 2077 -henkiseksi ennen pakkoja · 2026-10-02 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** Sovellus toimii, mutta ulkoasu on käyttäjän mukaan "ei minkään näköinen". UX.md:n periaate 7 rajasi cyberpunk-hengen pelkkään korostusväriin.
**Päätös:**
1. Seuraavaksi tehdään T-021: koko palvelun visuaalinen ilme Cyberpunk 2077 -pelin tyyliin. Se ohittaa T-013:n järjestyksessä.
2. Prioriteetit: **1) käytettävyys** (kaiken on oltava intuitiivista ja helppokäyttöistä), **2) palvelu näyttää coolilta ja tuntuu Cyberpunk 2077 -henkiseltä alusta loppuun.** Ristiriidassa käytettävyys ja saavutettavuus (WCAG 2.2 AA) voittavat.
3. Tehtävään osallistuvat vain UX Designer ja Koodari. Muita katselmointeja ei tilata. Poikkeus: jos `firebase.json` (CSP) tai riippuvuudet muuttuvat, Digiturva tekee kevyen tarkistuksen (D-009).
**Perustelu:** Käyttäjän päätös.
**Seuraukset:** UX.md:n periaate 7 päivitetään. Pelin tavaramerkit, logot, kuvat ja pelin omat fontit eivät tule sovellukseen (tekijänoikeus, SECURITY.md luku 7): ilme rakennetaan omilla väreillä, muodoilla ja avoimen lisenssin fonteilla.

## D-011 · T-021:n suunta hyväksytty: vaalea ja tumma teema, fonttina Rajdhani · 2026-10-02 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** UX:n mallisivu `docs/design/t021-mallisivu.html` (UX.md v0.6, luku 7). Avoimet kysymykset V1 (vain tumma teema?) ja V2 (fontit).
**Päätös:**
1. Mallisivun visuaalinen suunta hyväksytään.
2. V1: sovelluksessa on **sekä tumma että vaalea** Cyberpunk-teema, ja se seuraa laitteen asetusta (`prefers-color-scheme`), kuten nyt. UX suunnittelee vaalean teeman tokenit ja kontrastit ennen toteutusta.
3. V2: fonttina on **Rajdhani** (SIL OFL 1.1, itse isännöity). Tämä tarkentaa D-010:tä: avoimen lisenssin fontti on sallittu, vaikka peli käyttää sitä. Pelin logot, kuvat ja tavaramerkit ovat yhä kiellettyjä. UX päättää numeroiden ja tilarivien fontin ja varmistaa Rajdhanin luettavuuden pienissä koissa.
4. V3–V8: UX:n oletukset hyväksytty (PM).
**Perustelu:** Käyttäjän päätös.
**Seuraukset:** UX päivittää UX.md:n luvut 3 ja 7 sekä mallisivun, ja sen jälkeen Koodari toteuttaa.

## D-012 · Korttidata ja korttikuvat sovelluksen mukaan, teemavalitsin · 2026-10-02 · Päättäjä: käyttäjä
**Tila:** Voimassa. Muuttaa D-006:ta (data haetaan rajapinnasta, kuvat myöhemmin) ja D-011:n kohtaa 2 (teema seuraa laitteen asetusta).
**Konteksti:** Käyttäjä ei halua, että kortit haetaan joka kerta erikseen. Käyttäjä toimittaa 151 korttikuvan paketin. SECURITY.md luku 7: korttikuville ei löytynyt käyttöoikeutta (R-1). Datan käyttöehdot ovat epäselvät (R-2), ja nyt data jaetaan omalta palvelimelta eikä haeta käyttäjän selaimessa.
**Päätös:**
1. Korttidata kovakoodataan sovellukseen (staattinen data buildissa). Sitä ei haeta Netdeckin rajapinnasta jokaisella käynnillä. Arkkitehti tekee ADR:n (päivitystapa, rajapintakerroksen kohtalo, CSP).
2. Korttikuvat sisällytetään sovellukseen ja näytetään testi- ja tuotantosivustolla. Sovellus valmistellaan niin, että käyttäjän toimittamat kuvat tulevat näkyviin.
3. **Riskit R-1 ja R-2 hyväksytty** tässä laajuudessa (käyttäjä 2026-10-02): kuvat ja data omalla julkisella palvelimella. Ei-kaupallisuus ja epävirallisuusmerkintä säilyvät (SECURITY.md luku 7).
4. Väriteema on käyttäjän helposti valittavissa. Oletus on tumma teema.
5. Nämä tehdään ennen T-013:a.
**Perustelu:** Käyttäjän päätös.
**Seuraukset:** T-025 (teemavalitsin), T-026 (korttidata, korvaa T-003:n), T-027 (korttikuvat). Digiturva päivittää SECURITY.md:n R-1:n, R-2:n ja luvun 10 seuraavassa katselmoinnissa.

## D-013 · Korttidata JSON-tiedostona buildissa, päivityskomento ja korttikuvat Viten assetteina · 2026-10-02 · Päättäjä: PM (Arkkitehdin ehdotus); osan 4 riippuvuus: PM ja Digiturva
**Tila:** Voimassa (PM hyväksyi 2026-10-02: osat 1–3 ilman kustannuksia, riippuvuuksia ja lukitusta. Osan 4 devDependency `sharp` hyväksytty PM:n puolesta ehdolla, että Digiturva tarkistaa sen T-027:n katselmoinnissa.) Toteuttaa D-012:n kohdat 1 ja 2. Korvaa D-006:n osuuden "data haetaan käyttäjän selaimessa" ja T-003:n (välimuisti). Rakenne: ARCHITECTURE.md luku 13.
**Konteksti:** D-012: kortit kovakoodataan sovellukseen, eikä niitä haeta joka käynnillä. Käyttäjä toimittaa 151 korttikuvan paketin, jonka tiedostonimiä ja muotoa ei vielä tunneta. Nykyinen rajapintakerros (`src/api/`) hakee 3 sivua (noin 1,4 Mt, 4–6 s) jokaisella käynnillä, ja käyttöliittymällä on lataus-, virhe- ja osittaisen datan tilat. Kokoelma viittaa kortteihin avaimella `Card.key` (D-008 kohta 2), jonka on pysyttävä samana. Testit ja lint eivät vielä ole CI:ssä (T-004): workflowt ajavat vain `npm ci && npm run build`.

Päätöksessä on viisi osaa.

### 1. Datan muoto ja sijainti
**Vaihtoehdot:**
- **A) `src/data/cards.json` importataan buildiin (yksinkertaisin mahdollinen). (ehdotus)**
  + Data on käytössä synkronisesti heti sovelluksen käynnistyessä: ei verkkopyyntöä, ei lataus- eikä virhetilaa. Vite tukee JSON-importia sellaisenaan, ja yli 10 kt:n JSON tuotetaan muodossa `JSON.parse("…")`, joka on nopea (Viten `json.stringify: 'auto'`, tarkistettu `node_modules/vite/dist/node/index.d.ts` 2026-10-02).
  + `tsc` tarkistaa buildissa, että JSON vastaa `Card`-tyyppiä (`resolveJsonModule`), joten väärän muotoinen data rikkoo buildin myös CI:ssä.
  − Kasvattaa pääpakettia: 151 korttia × noin 200 tavua ≈ 30 kt (noin 5 kt gzip). Nykyinen JS-paketti on 260 kt (82 kt gzip, mitattu 2026-10-02), joten lisäys on pieni.
  − Datan muutos vaihtaa JS-paketin tiivisteen, jolloin selain lataa paketin uudelleen. Päivityksiä on harvoin, joten haitta on merkityksetön.
- **B) `public/cards.json` haetaan omalta originilta (`fetch('/cards.json')`).**
  + Erillinen tiedosto, jonka voi päivittää ilman JS:n muutosta.
  − Lataus- ja virhetilat ja `useCardCatalog` jäävät, eli sovellus hakee yhä "joka kerta erikseen", vain eri osoitteesta. `public/`-tiedoston nimessä ei ole tiivistettä, joten välimuisti on joko lyhyt tai data voi vanhentua. `tsc` ei tarkista dataa.
- **C) Päivityskomento tuottaa TypeScript-moduulin (`cards.generated.ts`).**
  + Tyyppitarkistus kuten A:ssa.
  − Generoitu koodi joutuu lintin piiriin, eikä tiedostoa voi lukea datana (kuvatuonti, diff). Ei etua A:han nähden.

**Valinta: A.** Tiedoston muoto:
```json
{ "format": "cyberdeck.cards", "version": 1, "cards": [ { "id": "…", "slug": "v-streetkid", "name": "V", "subname": "Streetkid", "displayName": "V — Streetkid", "type": "Legend", "color": "Red", "cost": null, "key": "v-streetkid" } ] }
```
- Kentät ja niiden järjestys ovat täsmälleen `Card`-mallin kentät. Ei aikaleimaa eikä `reportedTotal`ia, jotta sama lähdedata tuottaa samat tavut. Päivityspäivä näkyy git-historiasta.
- Korttien järjestys on rajapinnan järjestys, koska se on nykyinen näyttöjärjestys (rules.md 5.3). Jos kaksi peräkkäistä ajoa tuottaa eri järjestyksen, Koodari eskaloi. Vaihtoehto on lajittelu avaimella, mutta se muuttaa näyttöjärjestystä ja vaatii UX:n.
- **Validointi** tehdään yhdellä funktiolla `parseCardFile(json: unknown): Card[]` (`src/domain/cardFile.ts`, heittää virheen) kahdessa kohdassa: päivityskomennossa ennen kirjoitusta ja yksikkötestissä `src/data/cards.test.ts`. Lisäksi `tsc` tarkistaa tyypit buildissa. Ajonaikaista validointia ei tehdä, koska data on oma, tarkistettu build-artefakti.
- **Käyttöliittymän tilat:** lataus-, virhe- ja osittaisen datan tilat sekä "Yritä uudelleen" poistetaan, koska ne eivät ole enää mahdollisia. Osittainen data estetään jo päivityskomennossa: se ei kirjoita tiedostoa, jos yksikin kortti hylätään. Tyhjän luettelon tila poistetaan, ja testi varmistaa, ettei data ole tyhjä. Suodatuksen "ei tuloksia" -tila säilyy. `useCardCatalog` ja `CatalogState` poistetaan, ja `App` antaa `CatalogView`lle suoraan `cards: readonly Card[]`. Mikään toimiva ominaisuus ei heikkene: lista näkyy heti.

### 2. Päivityskomento `npm run cards:update`
**Ajotapa, vaihtoehdot:**
- **A) Viten `runnerImport` (Vite on jo riippuvuus). (ehdotus)** Ohut Node-sisääntulo `scripts/cards-update.mjs` lataa TypeScript-moduulin Viten moduuliajurilla, joka ymmärtää projektin päätteettömät importit. Kokeiltu 2026-10-02: `runnerImport('src/api/mapCard.ts')` toimi Node 24.14:llä noin 75 ms:ssa. − API on merkitty `@experimental` (Vite 8.3.1). Rikkoutuminen näkyy heti kehittäjän komennossa, ei tuotannossa, ja varapolku on B.
- **B) `tsx` devDependencyna.** Vakaa, mutta uusi riippuvuus (esbuild-binääri) ilman lisähyötyä.
- **C) Noden oma tyyppien poisto (`node script.ts`).** Ei toimi sellaisenaan: Node vaatii importeihin päätteet, ja projektin koodi käyttää päätteettömiä importteja (kokeiltu: `ERR_MODULE_NOT_FOUND` `src/domain/cardKey`). Vaatisi kaikkien importtien muuttamisen.

**Valinta: A.**

**Toiminta:** `fetchAllCards()` (olemassa oleva rajapintakerros, SR-4 ja SR-5 voimassa) → tarkistukset → `parseCardFile`-kierros → vertailu nykyiseen tiedostoon → kirjoitus vain, jos sisältö muuttui. Komento epäonnistuu (exit 1, tiedostoa ei kosketa), jos haku epäonnistuu, `skipped > 0`, `cards.length !== reportedTotal`, avain tai id toistuu tai validointi hylkää datan. Raportti: korttimäärä sekä lisätyt, poistetut ja muuttuneet avaimet. **Poistunut avain on varoitus**, koska kokoelmassa voi olla rivejä sillä avaimella (D-008: rivit säilyvät ja näkyvät avaimella).
**Determinismi:** oliot rakennetaan kiinteässä kenttäjärjestyksessä, tuloste on `JSON.stringify(file, null, 2) + "\n"`, ja rivinvaihdot ovat LF (`.gitattributes`: `* text=auto eol=lf`).

**Rajapintakerroksen kohtalo, vaihtoehdot:** A) **`src/api/` säilyy ennallaan, mutta vain päivityskomento käyttää sitä. (ehdotus)** Testit säilyvät, eikä koodi päädy sovelluspakettiin, koska sovellus ei importtaa sitä (ESLint estää). B) Siirto hakemistoon `scripts/`: suurempi diff ilman toiminnallista hyötyä. **Valinta: A.** `CardCatalog` jää rajapintakerroksen tyypiksi, eikä käyttöliittymä enää käytä sitä.

**Uusia riippuvuuksia ei tule** osissa 1–3. **SR-7 (build ei hae verkosta) säilyy:** päivityskomento on kehittäjän käsin ajama komento eikä osa buildia, ja sen tulos katselmoidaan PR:ssä diffinä.

### 3. CSP
`connect-src 'self' https://api.netdeck.gg` → **`connect-src 'self'`** molemmilla sivustoilla, koska sovellus ei tee enää yhtään `fetch`-kutsua. `'none'` olisi tiukin, mutta `'self'` jättää tien auki MVP-2:lle ilman uutta CSP-muutosta. Lopullisen arvon päättää Digiturva (SR-2, SR-9). `img-src 'self' data:` riittää kuville (osa 4). ARCHITECTURE.md:n luvun 9 kytkös `connect-src` ↔ `NETDECK_CARDS_URL` (ARCH-003) poistuu. Samaan `firebase.json`-muutokseen tulee välimuistisääntö tiivisteellisille asseteille (osa 4), jotta Digiturva katselmoi tiedoston kerran.

### 4. Korttikuvat (T-027)
**Sijainti, vaihtoehdot:**
- **A) Viten assetit `src/assets/cards/{sm,lg}/<key>.webp` ja `import.meta.glob`. (ehdotus)** Vite lisää tiedostonimiin sisällön tiivisteen, joten kuvat voi välimuistittaa vuodeksi (`immutable`), ja vaihtunut kuva saa uuden URL:n. Build tietää, millä korteilla on kuva, joten puuttuvasta kuvasta ei tehdä turhaa 404-pyyntöä. Pakettiin tulee vain URL-merkkijonot (noin 302 kpl).
- **B) `public/cards/<key>.webp`.** Yksinkertaiset ja vakaat URL:t, mutta ei tiivistettä: välimuisti on joko lyhyt (Firebasen oletus `max-age=3600`, todennettu testisivustolta 2026-10-02) tai vaihdettu kuva voi jäädä vanhaksi. Puuttuva kuva selviää vasta 404:stä.

**Valinta: A.**

**Kohdemuoto ja koot:** WebP (kaikki Viten kohdeselaimet tukevat). Kaksi kokoa: `sm` 240 px leveä (listan pikkukuva, 2× noin 120 CSS-px) ja `lg` 720 px leveä (iso kuva, 2× noin 360 CSS-px), laatu 80, kuvasuhde säilyy, ei suurennusta, ja metatiedot (EXIF, GPS) poistetaan. Koot ovat vakioita yhdessä paikassa, ja UX voi muuttaa niitä T-027:n suunnittelussa. Arvio: `sm` 10–15 kt ja `lg` 50–90 kt, yhteensä noin 9–15 Mt 151 kortille (arvio, mitataan tuonnissa).

**Muunnostyökalu, vaihtoehdot:**
- **A) `sharp` devDependencyna. (ehdotus, vaatii PM:n ja Digiturvan hyväksynnän)** Versio 0.35.5 (julkaistu 2026-09-27, aktiivisesti ylläpidetty), lisenssi Apache-2.0. Esikäännetyt libvips-binäärit (`@img/sharp-*`, lisenssi Apache-2.0 AND LGPL-3.0-or-later) tulevat alustakohtaisina valinnaisina riippuvuuksina. **Ei install- eikä postinstall-skriptejä** (tarkistettu `npm view` sharpille, `@img/sharp-linux-x64`:lle ja `@img/sharp-libvips-linux-x64`:lle 2026-10-02), joten SR-6:n ehto täyttyy. Haitta: `npm ci` lataa myös CI:ssä noin 38 Mt binäärejä (linux-x64), vaikka build ei käytä niitä. Ne eivät päädy `dist/`iin. LGPL-kirjastoa ei levitetä, koska se on vain kehittäjän työkalu.
- **B) Ei riippuvuutta: kuvat muunnetaan käsin ulkoisella työkalulla** (esim. Squoosh tai `cwebp`), ja komento vain yhdistää, tarkistaa ja kopioi valmiit WebP-tiedostot. Toistettavuus ja koot riippuvat ihmisestä, ja kaksi kokoa × 151 kuvaa on virhealtista käsityötä. Noden vakiokirjastossa ei ole kuvakoodekkeja.
- **C) Alkuperäiset kuvat sellaisenaan.** Ei muunnosta, mutta koko on tuntematon (painokuvat ovat usein 1–3 Mt kappaleelta), mikä voi kuluttaa Spark-tason siirtokiintiön nopeasti (osa 5).

**Valinta: A.** Jos PM tai Digiturva ei hyväksy sharpia, varapolku on B samalla yhdistämis- ja raportointilogiikalla: muunnosvaihe ohitetaan, ja komento hyväksyy vain valmiit WebP-kuvat oikeissa mitoissa.

**Tuonti `npm run cards:images -- <lähdekansio>`:**
- Lähdekansio on repon ulkopuolella tai gitignoroidussa kansiossa `card-images-src/`. **Alkuperäisiä kuvia ei commitoida**, vain optimoidut tulosteet.
- **Yhdistämissääntö** järjestyksessä, ensimmäinen osuma voittaa:
  1. Valinnainen tiedosto `<lähdekansio>/card-images.map.json` muodossa `{ "<tiedostonimi>": "<card key>" }`. Se ratkaisee poikkeavat nimet (esim. keräilynumerot) ilman koodimuutosta.
  2. `normalizeCardName(tiedostonimi ilman päätettä) === card.key`. Kattaa muodot `V - Streetkid.png`, `v_streetkid.jpg` ja `Judy Álvarez — Braindance Maestro.webp`.
  3. Tiedostonimi ilman päätettä pienillä kirjaimilla `=== card.slug` (Netdeckin slug, joka poikkeaa avaimesta 16 kortilla).
  4. `normalizeCardName(tiedostonimi) === normalizeCardName(card.name)`, **vain jos osumia on yksi** (esim. alaotsikoton kortti). Monta osumaa = monitulkintainen, raportoidaan.
- **Raportti** (konsoli ja exit-koodi): yhdistetyt (määrä), tiedostot joille ei löytynyt korttia (syy: ei osumaa, monitulkintainen, ristiriita), kortit joilta puuttuu kuva (avain ja näyttönimi), hylätyt tiedostot (ei kuva, liian suuri), ohitetut (piilotiedostot, `Thumbs.db`) ja tulostekansion orvot kuvat (avainta ei ole datassa). Kaksi tiedostoa samalle kortille = ristiriita, eikä kumpaakaan käytetä. Exit 1 vain, jos kansiota ei ole tai yhtään kuvaa ei yhdistetty. Puuttuvat kuvat eivät ole virhe (paikkamerkki).
- **Turvallisuus:** tulostiedoston nimi muodostetaan vain kortin avaimesta (`isCardKey`), ei koskaan lähteen tiedostonimestä, joten polkujen ohitus ei ole mahdollinen. Sisältö tunnistetaan sharpin metatiedoista, ei päätteestä. Enimmäiskoko on 25 Mt per tiedosto, ja sharpin pikselikatto pidetään oletusarvossa. Map-tiedosto validoidaan: avaimen on oltava datassa, ja tiedostonimen on oltava pelkkä nimi lähdekansiossa.
- Tuonti kirjoittaa ja korvaa yhdistettyjen korttien kuvat, mutta **ei poista mitään**, jotta osittainen paketti ei hävitä aiempia kuvia. Orvot raportoidaan.

**Näyttö:** `src/data/cardImages.ts` → `getCardImage(key): { small: string; large: string } | null`. Kuva on natiivi `<img loading="lazy" decoding="async" width height>` ilman kirjastoa, ja kiinteät mitat estävät asettelun hyppimisen. Puuttuva kuva → CSS-paikkamerkki ilman pyyntöä, ja latausvirhe (`onError`) → sama paikkamerkki. Alt-teksti ja sijainti tulevat UX:ltä (nimen vieressä oleva pikkukuva on todennäköisesti koristeellinen, `alt=""`). SR-1: rajapinnan `image_url`ia ei käytetä.

**Repon koko:** 302 tiedostoa, noin 9–15 Mt, gitissä. Git LFS hylätään: se vaatisi muutoksia workflowihin (`lfs: true`) ja kuluttaisi LFS-kiintiötä ilman tarvetta. Jokainen kuvia muuttava uusintatuonti kasvattaa historiaa, joten tuonti tehdään harvoin.

**Välimuisti (firebase.json, molemmat sivustot):** uusi `headers`-sääntö `"source": "/assets/**"` → `Cache-Control: public, max-age=31536000, immutable`. Viten tiivisteelliset tiedostot (JS, CSS, fontit ja kuvat) eivät koskaan muutu samassa URL:ssa. Nykyinen `**`-sääntö (CSP ym.) säilyy. Koodari todentaa esikatselussa `curl -sI`:llä, että `/assets/`-tiedostolla on sekä CSP- että Cache-Control-otsake, koska Firebasen dokumentaatio ei kerro, yhdistetäänkö usean säännön otsakkeet.

### 5. Kustannukset ja lukittautuminen
- **Firebase Hosting, Spark** (firebase.google.com/docs/hosting/usage-quotas-pricing, tarkistettu 2026-10-02): tallennus 10 Gt ja siirto 10 Gt kuukaudessa ilman kustannuksia. Tallennukseen lasketaan myös säilytetyt vanhat julkaisut. Jos tallennus ylittyy, uusia julkaisuja ei voi tehdä. **Jos siirto ylittyy, sivustot poistetaan käytöstä armonajan jälkeen kuukauden loppuun asti** (Blaze: 0,15 $/Gt). Molemmat sivustot (prod ja test) ovat samassa projektissa ja jakavat kiintiön.
- **Arvio:** ensikäynti on noin 0,1 Mt sovellusta (gzip) ja laiskasti ladatut pikkukuvat (koko lista selattuna 151 × noin 12 kt ≈ 1,8 Mt). Isot kuvat ladataan vain avattaessa. Vuoden välimuistin takia toistuvat käynnit eivät juuri kuluta siirtoa. 10 Gt/kk riittää noin 5 000 täyteen ensikäyntiin kuukaudessa. Korttidatan siirto Netdeckiltä (1,4 Mt per käynti) poistuu kokonaan.
- **Tallennus:** yksi julkaisu on noin 15–20 Mt. Suositus käyttäjälle: aseta Firebase-konsolissa (Hosting → julkaisuhistorian säilytys) säilytettävien julkaisujen määrä, esim. 10 per sivusto. Esikatselukanavat vanhenevat itsestään.
- **Ei Blaze-tasoa, ei uusia palveluita eikä uutta lukittautumista.** Data ja kuvat ovat tavallisia staattisia tiedostoja `dist/`issä, ja ne siirtyvät mihin tahansa staattiseen hostingiin.

**Seuraukset:**
- T-026 toteuttaa osat 1–3 ja osan 4 välimuistisäännön (ARCHITECTURE.md luku 13, luovutus tehtäväkortissa). Digiturva katselmoi (CSP, firebase.json, SR-9) ja päivittää SECURITY.md:n R-1:n, R-2:n ehdot (ehto "dataa ei kopioida omaan Hostingiin" kumoutuu D-012:lla) ja R-6:n sekä PRIVACY.md:n (Netdeck ei enää näe käyttäjien IP-osoitteita). UX katselmoi kevyesti, koska lataus- ja virhetilat poistuvat näkyvistä.
- T-027 toteuttaa osan 4. Sharp lisätään vasta hyväksynnän jälkeen. Käyttöliittymä ja yhdistämislogiikka voidaan tehdä ja testata ilman kuvapakettia.
- Avoin velka: testit eivät ole CI:ssä (T-004), joten `parseCardFile`-testi ei estä julkaisua. Tyyppitarkistus estää. T-004:n prioriteetti nousee.
- Havainto PM:lle (ei kuulu tähän päätökseen): `index.html` tulee välimuistista (`max-age=3600`). Julkaisun jälkeen vanha `index.html` voi tunnin ajan viitata poistettuihin asset-tiedostoihin. Ehdotus: `Cache-Control: no-cache` `index.html`:lle omana velkatehtävänään, kun otsakkeiden yhdistäminen on todennettu.

## D-014 · Kevyt toimintamalli tokenien säästämiseksi · 2026-10-02 · Päättäjä: käyttäjä (pyyntö), PM (toteutus)
**Tila:** Voimassa. Täydentää D-009:ää ja ohittaa sen ristiriitaisilta osin.
**Konteksti:** 75 % viiden tunnin käyttökiintiöstä kului alle tunnissa (T-026 ja T-027: 6 aliagenttia, noin 1 M tokenia). Kulutuksen syyt: CLAUDE.md latasi rules.md:n ja agents.md:n (noin 66 kt) jokaiseen istuntoon ja aliagenttiin, agentit lukivat kokonaan ARCHITECTURE.md:n (85 kt) ja UX.md:n (170 kt), ja jokaiseen tehtävään käytettiin 3–5 agenttia.
**Vaihtoehdot:** A) Nykyinen malli. B) Kevyt malli: säännöt tiivistettynä CLAUDE.md:ssä ilman automaattista latausta, yksi Sonnet-Koodari pieniin tehtäviin, katselmoinnit vain riskin mukaan, ei väli-checkpointeja ja grepillä haettava luku.
**Päätös:** B
**Perustelu:** Käyttäjä pyysi. Laadun takaavat testit, lint, build, esikatselu ja riskiperusteiset katselmoinnit.
**Seuraukset:**
- CLAUDE.md:n luku "Kevyt malli".
- Aliagenttien määrittelyihin (`~/.claude/agents/`) on lisätty D-014-ohitus ja malli (Sonnet, paitsi Arkkitehti ja Digiturva Opus).
- Kun rules.md ja agents.md ovat ristiriidassa D-014:n kanssa, D-014 voittaa (käyttäjän nimenomainen ohje). agents.md:n versiomerkintä on vielä päivittämättä.

## D-015 · Pakan haku Netdeck-linkistä: selain kutsuu api.netdeck.gg:tä käyttäjän pyynnöstä · 2026-10-02 · Päättäjä: käyttäjä (pyyntö), PM
**Tila:** Voimassa. Tarkentaa D-013:a: `connect-src` laajenee osoitteeseen `https://api.netdeck.gg`.
**Konteksti:** Käyttäjä haluaa nähdä, mitä hänen kokoelmastaan puuttuu esimerkiksi turnauspakasta, linkin perusteella. Netdeckin julkinen pakkarajapinta sallii CORS:n (PM:n selvitys T-046-kortissa).
**Vaihtoehdot:** A) Vain tekstituonti (T-014), jolloin käyttäjä kopioi listan itse. B) Linkkihaku Netdeckistä selaimesta käyttäjän pyynnöstä. C) Oma välipalvelin (kustannus, ylläpito).
**Päätös:** B
**Perustelu:** Ei kustannuksia eikä uusia riippuvuuksia. Pyyntö lähtee vain käyttäjän painalluksesta, ja siitä on huomautus. Vastaus käsitellään epäluotettavana syötteenä (T-046 kriteerit 2–3). Korttidata pysyy buildissa (D-013 ennallaan).
**Seuraukset:** CSP `connect-src 'self' https://api.netdeck.gg`. PRIVACY.md: IP-osoite näkyy Netdeckille vain linkkihaussa (Digiturva päivittää). Muut pakkasivustot tuodaan tekstinä.

## D-016 · Kirjautuminen ja pilvitallennus: Google-kirjautuminen, vapaaehtoinen tili, 16+, Firebasen ilmaistaso · 2026-10-03 · Päättäjä: käyttäjä
**Päätös (käyttäjän vastaukset 2026-10-03):**
- Kirjautuminen vain Google-tilillä (Firebase Authentication).
- Tili on vapaaehtoinen. Ilman kirjautumista tiedot tallentuvat selaimeen kuten ennen. Ensimmäisellä kirjautumisella selaimen pakat ja kokoelma siirretään tilille, ja jos tilillä on jo tietoja, käyttäjältä kysytään. Sen jälkeen tiedot synkronoituvat laitteiden välillä.
- Ikäraja 16 vuotta (ratkaisee K-P3:n). Tallennetaan vain välttämätön: Google-tunniste (uid), pakat ja kokoelma. Sähköpostia ja nimeä ei tallenneta tietokantaan, ellei Arkkitehti perustele tarvetta.
- Vain Firebasen ilmaistaso (Spark), ei maksukorttia. Rekisterinpitäjä on käyttäjä Firebase-projektin omistajana (ratkaisee K-P1:n pilvitallennuksen osalta).
**Seuraavaksi:** Arkkitehti tekee ADR:n (tietomalli, synkronointi ja ristiriidat, rajapintakerros), ja Digiturva tekee uhkamallin ja Firestoren sääntövaatimukset ennen toteutusta (T-054).

## D-017 · Pilvitallennus: paikallinen ensin, Firebase Auth (Google, uudelleenohjaus) ja Firestore Lite -synkronointi kolmitiemergellä · 2026-10-03 · Päättäjä: Arkkitehti (ehdotus), PM ja käyttäjä hyväksyvät
**Tila:** Ehdotettu. Toteuttaa D-016:n. Tehtävä T-054 (vaiheet a–d). Digiturvan uhkamalli ja sääntövaatimukset ennen T-054b:tä. **Muutettu K-P8:lla (erillinen testiprojekti `cyberdeck-tcg-dev`, ks. D-017:n loppu): kohdat 1 (testisivusto), 2 (ympäristöjuuri), 3 (`{root}`) ja 10 (deploy) korvautuvat.**
**Konteksti:** Nykyinen tallennus on synkroninen localStorage-kerros (`src/storage/`): envelope `{schemaVersion, savedAt, data}`, validointi `src/domain/validate.ts`:ssä, varmuuskopiot, `subscribe` vain toisille välilehdille (storage-tapahtuma). UI käyttää vain rajapintoja `CollectionRepository` ja `DeckRepository`. D-016: vain Google, tili vapaaehtoinen, siirto selaimesta tilille, synkronointi laitteiden välillä, 16+, vain Spark. Testi- ja tuotantosivusto ovat **samassa Firebase-projektissa** (`cyberdeck-tcg`), joten niillä on yhteinen Auth ja Firestore.
**Mitatut koot** (firebase 12.19.0, esbuild 0.28 minify + gzip -9, vain tarvittavat funktiot): `firebase/app` + `firebase/auth` 34 kt; lisäksi `firebase/firestore/lite` yhteensä 63 kt; täysi `firebase/firestore` (persistentLocalCache, onSnapshot) yhteensä 190 kt. Firestore-rajat (dokumentaatio, tarkistettu 2026-10-03): dokumentti enintään 1 MiB; Spark 50 000 lukua, 20 000 kirjoitusta ja 20 000 poistoa päivässä, 1 GiB tallennustilaa.

**Vaihtoehdot:**
- **A) Firestore lähteenä, täysi modulaarinen SDK.** Kirjautuneena repositoriot lukevat ja kirjoittavat Firestorea. Offline-tila ja välilehdet hoituvat IndexedDB-välimuistilla (`persistentLocalCache` + `persistentMultipleTabManager`) ja reaaliaikaisuus `onSnapshot`illa. + Vähiten omaa synkronointikoodia, reaaliaikainen. − 190 kt gzip. Kaksi rinnakkaista tallennusmallia (localStorage kirjautumatta, IndexedDB-välimuisti kirjautuneena). `setDoc` ei ratkea offline-tilassa ennen palvelimen kuittausta, mikä rikkoo nykyisen "tallennettu"-semantiikan ja `collectionStore`n säännöt. Sääntöjen hylkäämä kirjoitus peruuntuu hiljaa jälkikäteen. Välimuisti on tyhjennettävä uloskirjautuessa (`terminate` + `clearIndexedDbPersistence`).
- **B) Paikallinen ensin + Firestore Lite (valittu).** localStorage pysyy ainoana paikallisena lähteenä myös kirjautuneena (tilikohtaisella avainetuliitteellä). Erillinen synkronointimoottori vetää ja työntää muutokset Firestore Liten REST-kutsuilla ja yhdistää ne puhtaalla kolmitiemergellä (pohja = viimeksi synkronoitu tila). + UI ja repositoriorajapinnat ennallaan, offline toimii kuten nyt, 63 kt gzip ladataan laiskasti vain kirjautuville, kirjautumattomilta ei lähde pyyntöjä Googlelle, ja synkronointilogiikka on puhdasta ja testattavaa ilman verkkoa. − Omaa synkronointikoodia (arviolta 300–400 riviä ja testit), ei reaaliaikaisuutta (synkronointi tapahtumista ja ajastimella).
- **C) REST ilman SDK:ta.** Google Identity Services -skripti antaa ID-tokenin, `identitytoolkit`-REST vaihtaa sen Firebase-tokeniksi, ja refresh-tokenin hallinta sekä Firestore REST tehdään itse. + Pienin koko (arviolta alle 10 kt omaa koodia). − Tietoturvakriittinen token- ja istuntokoodi olisi itse tehty, refresh-token tallennettaisiin itse, tulisi uusi ulkoinen skripti (accounts.google.com) ja enemmän virhemahdollisuuksia. Hylätään.
- (D) Erillinen Firebase-projekti testille: puhtain eristys, mutta vaatii toisen konsoliprojektin, toisen palvelutilin ja salaisuuden workflowhun. Ei nyt, vaan ympäristöjuuri (kohta 2).

**Päätös:** B.

**1. Kirjautuminen**
- Firebase Auth, vain `GoogleAuthProvider`. `initializeAuth(app, { persistence: indexedDBLocalPersistence, popupRedirectResolver: browserPopupRedirectResolver })`.
- **Julkaistuilla sivustoilla `signInWithRedirect` ja `authDomain` = sivuston oma host** (`cyberdeck-tcg.web.app` tai `cyberdeck-tcg-test.web.app`). Firebase Hosting tarjoaa `/__/auth/handler`in ja `/__/auth/iframe`n jokaisella sivustolla (reserved URLs), joten kirjautuminen tapahtuu samassa originissa. Silloin kolmannen osapuolen tallennuksen esto (Chrome 115+, Firefox 109+, Safari 16.1+) ei haittaa, ponnahdusikkunaa ei tarvita ja `Cross-Origin-Opener-Policy: same-origin` voi jäädä. Ponnahdusikkuna vaatisi COOP:n löysentämistä arvoon `same-origin-allow-popups`.
- **Kehityksessä (`vite`, localhost)** `authDomain` = `cyberdeck-tcg.firebaseapp.com` ja `signInWithPopup` (localhost on oletuksena sallittu, eikä Vite lähetä COOP-otsaketta).
- **PR-esikatselukanavat:** Firebase Auth ei salli jokerimerkkiä authorized domains -listassa. Firebase CLI lisää kanavan domainin automaattisesti, mutta käyttämämme `FirebaseExtended/action-hosting-deploy` ei (sen issue #39). Siksi esikatselussa kirjautuminen on pois käytöstä, ja painike kertoo, ettei kirjautuminen ole käytössä esikatselussa. Kirjautuminen testataan testisivustolla. Sallittujen hostien lista on koodissa (prod, test, localhost).
- Tietokantaan ei tallenneta sähköpostia eikä nimeä. UI voi näyttää Auth-olion sähköpostin muistissa ("Kirjautuneena: x@…"), jotta käyttäjä tietää, millä tilillä on. Sitä ei tallenneta Firestoreen eikä localStorageen.
- Firebasen SDK ladataan dynaamisella `import()`:lla vasta, kun käyttäjä painaa "Kirjaudu" tai localStoragessa on vihje aiemmasta kirjautumisesta (`cyberdeck:account:last-uid`). Kirjautumaton käyttäjä ei lataa SDK:ta eikä ota yhteyttä Googleen.

**2. Konfiguraatio**
- Web-sovelluksen config (apiKey, projectId, appId, messagingSenderId) ei ole salaisuus. Se committataan vakioina tiedostoon `src/account/firebase/config.ts`. `authDomain` valitaan ajossa `location.host`in mukaan sallitulta listalta. Viten env-muuttujia ei käytetä: ei uutta build-polkua, ja sama build käy molemmille sivustoille. Suositus: apiKeylle HTTP-referrer-rajaus Google Cloud Consolessa (prod, test, localhost).
- ~~**Ympäristöjuuri:**~~ (Korvattu K-P8:lla: config valitaan buildin `MODE`:n mukaan ja juuri on aina `users`.) Alkuperäinen: projekti on molemmille sivustoille sama, joten testisivuston ja esikatselun data menee juureen `test_users/{uid}` ja tuotannon data juureen `users/{uid}`. Valinta tehdään ajossa hostin mukaan (`cyberdeck-tcg.web.app` → `users`, muut → `test_users`). Säännöt ovat molemmille juurille samat.

**3. Tietomalli (Firestore)**
```
{root}/{uid}                      meta: { schemaVersion: 1, rev: number, updatedAt: timestamp }
{root}/{uid}/decks/{deckId}       { schemaVersion: 1, savedAt: string, data: { name, sections, createdAt, updatedAt } }
{root}/{uid}/collection/main      { schemaVersion: 1, savedAt: string, data: { entries: [{ card, count }] } }
```
- Envelope on sama kuin localStoragessa, mutta Firestore-mappina eikä JSON-merkkijonona. `envelope.ts` saa funktion `decodeEnvelopeValue(value: unknown, spec)`, ja nykyinen `decodeEnvelope(raw)` on JSON.parse + `decodeEnvelopeValue`. Molemmat käyttävät samaa validointia (`parseDeck`, `parseCollection`) ja samoja migraatioita. Jos pilvessä on uudempi skeemaversio, synkronointi lukittuu (ei kirjoituksia) kuten paikallisessa `newer-version`-tilassa.
- `deckId` on nykyinen UUID (`isDeckId`). Pakka on oma dokumenttinsa: enintään 500 riviä × noin 120 tavua ≈ 60 kt, kaukana 1 MiB:stä. Pakkoja on enintään 200 (MAX_DECKS).
- Kokoelma on yksi dokumentti: enintään 5000 riviä × (avain enintään 100 merkkiä + luku) ≈ 600 kt pahimmillaan, alle 1 MiB:n. Synkronointi tarkistaa koodatun koon (raja 900 000 tavua) ennen kirjoitusta ja ilmoittaa virheestä yrittämättä kirjoitusta. Pilkkominen useampaan dokumenttiin tehdään vasta, jos rajat nousevat (IDEAS.md).
- `meta.rev` kasvaa jokaisessa työnnössä. Sen ansiosta tavallinen synkronointi maksaa yhden luvun, kun mitään ei ole muuttunut.
- Indeksejä ei tarvita, koska ainoa kysely on `{root}/{uid}/decks`-kokoelman luku. `firestore.indexes.json` on repossa tyhjänä (`{"indexes": [], "fieldOverrides": []}`).

**4. Paikallinen tallennus kirjautuneena**
- Kirjautumattoman avaimet pysyvät ennallaan (`cyberdeck:decks`, `cyberdeck:collection`), joten nykyisiä tietoja ei migroida.
- Tilin paikallinen kopio: `cyberdeck:u:{uid}:decks`, `cyberdeck:u:{uid}:collection` sekä synkronoinnin pohja `cyberdeck:u:{uid}:sync` (`{ schemaVersion, rev, decks, collection }`, viimeksi synkronoitu tila). `uid` validoidaan (`^[A-Za-z0-9]{1,128}$`). Kahden tilin tiedot eivät sekoitu samassa selaimessa.
- `createRepositories` saa option `namespace` (oletus tyhjä = nykyiset avaimet). `App` avaa repositoriot `uid`:n mukaan ja vaihtaa näkymäpuun `key={uid ?? 'local'}`. Näin hookit (`useDecks`, `useCollection`) saavat uuden vakaan viitteen eivätkä itse muutu.
- Repositoriot saavat lisäksi samassa välilehdessä toimivan muutosilmoituksen (`notify`), jotta synkronoinnin kirjoitukset päivittävät näkymän. Nykyinen `subscribe` kuuntelee sekä storage-tapahtumaa että tätä ilmoitusta.

**5. Synkronointi**
- **Moottori** on `src/account/sync/syncEngine.ts` ja puhdas merge `src/account/sync/merge.ts`:
  - Pakat: kolmitiemerge pakoittain (pohja, paikallinen, pilvi). Jos vain toinen on muuttunut, se voittaa. Jos molemmat ovat muuttuneet, suurempi `updatedAt` voittaa (tasapelissä pilvi). Poisto: jos pakka puuttuu toiselta ja toinen on pohjan mukainen, pakka poistetaan. Jos toinen on poistanut ja toinen muokannut, muokattu säilyy. Firestoressa ei tarvita tombstoneja, koska pohja kertoo poistot.
  - Kokoelma: kolmitiemerge korteittain. Jos molemmat ovat muuttaneet saman kortin eri arvoon, paikallinen voittaa (tämän laitteen muutos on juuri tehty, toisen laitteen muutos on synkronoitu jo aiemmin).
- **Kierros:** Web Locks (`navigator.locks.request('cyberdeck-sync')`, ei riippuvuutta) varmistaa, että vain yksi välilehti synkronoi kerrallaan. 1) Lue meta (1 luku). 2) Jos `rev` on sama kuin pohjan `rev` ja paikallinen on sama kuin pohja, kierros on valmis. 3) Muuten lue pakat ja kokoelma, yhdistä ja kirjoita paikallinen tulos repositorion kautta (notify ja storage-tapahtuma muille välilehdille). 4) Työnnä muuttuneet dokumentit `runTransaction`illa, joka lukee metan uudelleen ja keskeytyy, jos `rev` on muuttunut välissä (toinen laite ehti ensin). Silloin kierros alkaa alusta, enintään 3 kertaa. Transaktiossa on enintään 200 pakkaa + kokoelma + meta, alle 500 kirjoitusta. 5) Tallenna uusi pohja.
- **Laukaisijat:** käynnistys kirjautuneena, paikallinen muutos (3 sekunnin viiveellä), `focus`, `visibilitychange` (näkyviin), `online` ja 5 minuutin välein, kun sivu on näkyvissä. Offline-tilassa näkyy "Ei yhteyttä, muutokset ovat tallessa tällä laitteella", ja yritys jatkuu `online`-tapahtumasta.
- **Kiintiöarvio:** tavallinen kierros maksaa 1 luvun, täysi veto enintään 202 lukua, ja työntö kirjoittaa vain muuttuneet dokumentit. Aktiivinen käyttäjä tekee noin 100 kierrosta päivässä eli muutama sata lukua. Spark riittää kymmenille aktiivisille käyttäjille. Jos käyttäjiä tulee paljon, käyttöä seurataan konsolista.
- **Tila UI:lle:** `idle | syncing | offline | error | locked` ja viimeisimmän onnistuneen synkronoinnin aika.
- **T-042 korjataan samalla:** `DeckRepository.update(id, content, options?: { expectedUpdatedAt?: string })`. Jos tallennetun pakan `updatedAt` ei ole odotettu, tulee `StorageError('conflict')`. Pakkaeditori kuuntelee `subscribe`a. Jos omia tallentamattomia muutoksia ei ole, se lataa uuden version. Jos on, se näyttää ilmoituksen, että pakkaa muutettiin toisaalla (Lataa uusin / Pidä omat muutokset, joka tallentaa ilman ehtoa). Sama mekanismi kattaa toisen välilehden ja synkronoinnin tuoman muutoksen. Parametri on valinnainen, joten nykyiset kutsut eivät rikkoudu.

**6. Ensimmäinen kirjautuminen ja yhdistäminen**
- Jos selaimen (kirjautumattoman) tiedot ovat tyhjät, tilin tiedot vedetään.
- Jos tili on tyhjä (metaa ei ole), selaimen tiedot työnnetään tilille. Onnistumisen jälkeen kirjautumattoman avaimet tyhjennetään (siirto, ei kopio) ja käyttäjälle kerrotaan, montako pakkaa ja kokoelma siirrettiin.
- Jos tietoja on molemmissa, näytetään dialogi: **Yhdistä** (oletus: pakat yhteen id:n mukaan, kokoelmasta suurempi määrä korteittain, rajat tarkistetaan), **Käytä vain tilin tietoja** (selaimen tiedot jäävät koskematta kirjautumattoman tilaan) tai **Peruuta** (kirjaudutaan ulos). Tilin tiedot korvaavaa vaihtoehtoa ei tehdä, koska se olisi peruuttamaton. Dialogin tekstit tekevät UX ja Sisällöntuottaja.
- Ennen siirtoa selaimen tiedoista otetaan varmuuskopio nykyisellä `backup`-mekanismilla.

**7. Uloskirjautuminen**
- Jos tilin paikallinen kopio poikkeaa pohjasta (synkronoimatta), näytetään varoitus, että osa muutoksista ei ole vielä tilillä (Yritä synkronoida / Kirjaudu ulos silti / Peruuta).
- ~~Sen jälkeen poistetaan `cyberdeck:u:{uid}:*`~~ **Muutettu käyttäjän valinnalla 2026-10-03 (SEC-029):** tilin avaimet `cyberdeck:u:{uid}:*` jäävät selaimeen. Vain `cyberdeck:account:last-uid` poistetaan, ja `signOut` poistaa Firebasen istunnon IndexedDB:stä. Uloskirjautuessa näytetään pakollinen ilmoitus (SR, SEC-011), ja Poista tilin tiedot tältä laitteelta -toiminto on tarjolla.
- Jos istunto katoaa ilman uloskirjautumista (esim. token mitätöity), tilin paikallista kopiota ei poisteta automaattisesti. Seuraava kirjautuminen samalla tilillä jatkaa siitä, ja eri tilin kohdalla kysytään.

**8. Rajapinnat ja testattavuus**
- Uusi kerros `src/account/` (ei Reactia):
  - `types.ts`: `AuthClient { available: boolean; current(): AccountUser | null; onChange(cb): () => void; signIn(): Promise<void>; signOut(): Promise<void> }`, `AccountUser { uid: string; email: string | null }` ja `CloudStore { readMeta(): Promise<CloudMeta | null>; readAll(): Promise<CloudSnapshot>; commit(change: CloudChange, expectedRev: number): Promise<number> }`. `commit` palauttaa uuden revin tai heittää `CloudError('conflict' | 'offline' | 'denied' | 'quota' | 'too-large' | 'unknown')`.
  - `firebase/loadFirebase.ts` on ainoa tiedosto, joka tuo `firebase/*`:n (dynaamisesti). Lisäksi `firebase/config.ts`, `firebase/firebaseAuthClient.ts` ja `firebase/firestoreCloudStore.ts`.
  - `memory.ts`: `createFakeAuth()` ja `createMemoryCloud()` testeille.
  - `sync/merge.ts` (puhdas), `sync/syncEngine.ts` ja `index.ts` (julkinen rajapinta).
- `App` saa propin `account?: AccountServices` (`{ auth, cloud(uid) }`). Oletuksena on laiska Firebase-toteutus, ja testit antavat valetoteutuksen.
- `src/test/setup.ts`: `vi.mock` `loadFirebase`ille niin, että se heittää virheen "Real Firebase is disabled in tests", samaan tapaan kuin `fetch` on estetty.
- ESLint: vain `src/account/firebase/**` saa tuoda `firebase/*`:n, ja UI tuo vain `../account`in. `src/account/**` saa tuoda `../storage`n julkisen rajapinnan ja `../domain`in.

**9. CSP ja otsakkeet (molemmilla sivustoilla identtiset, ARCH-003)**
- `script-src 'self' https://apis.google.com` (Auth-SDK lataa `https://apis.google.com/js/api.js`:n uudelleenohjauksen apuiframea varten).
- `connect-src 'self' https://api.netdeck.gg https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com`.
- `frame-src 'self'` (authDomain on oma origin, `/__/auth/iframe`). Nyt `default-src 'self'` kattaa sen, mutta se kirjoitetaan näkyviin.
- **Varmistettava T-054a:ssa testisivustolla:** koskevatko `X-Frame-Options: DENY` ja `frame-ancestors 'none'` myös Hostingin `/__/auth/*`-sivuja. Jos koskevat ja estävät oman originin iframen, arvot muutetaan muotoon `SAMEORIGIN` ja `frame-ancestors 'self'`. Selaimen konsolin CSP-virheet kirjataan korttiin, ja lisäorigineja (esim. `https://www.gstatic.com`) lisätään vain havaitun tarpeen mukaan.
- `src/firebaseConfig.test.ts` päivitetään: sallittujen originien lista on tarkka (yllä luetellut), ja `script-src` sisältää vain `'self'` ja `https://apis.google.com`.

**10. Säännöt ja deploy**
- Repoon tulevat `firestore.rules` ja `firestore.indexes.json`, ja `firebase.json`iin `"firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }`.
- Säännöt (Digiturva tarkentaa): vain omistaja (`request.auth.uid == uid`), vain juuret `users` ja `test_users`, vain polut meta, `decks/{deckId}` ja `collection/main`. Kenttien tyypit ja sallitut avaimet tarkistetaan, `schemaVersion` on kokonaisluku, ja pakkojen ja kokoelman kokorajat ovat voimassa (`sections.size() <= 20`, `entries.size() <= 5000`, nimi enintään 100 merkkiä, `deckId`-regex). Kaikki muu on kielletty.
- **Deployn ajaa käyttäjä käsin:** `firebase deploy --only firestore:rules,firestore:indexes` (hook kysyy luvan). Workflown palvelutilillä on Hosting-oikeudet. Sääntöjen deploy vaatisi lisäroolin (Firebase Rules Admin) ja laajentaisi CI:n oikeuksia, eikä sääntöjä muuteta usein. Säännöt koskevat molempia sivustoja heti, joten ne deployataan ennen kuin T-054b yhdistetään testiin.
- Sääntötestit emulaattorilla (`@firebase/rules-unit-testing` + Java) eivät kuulu tähän (raskas riippuvuus). Säännöt tarkistetaan Digiturvan katselmoinnissa ja käsin testisivustolla. Emulaattoritestit → IDEAS.md.

**Perustelu:** B säilyttää nykyisen tallennuskerroksen takuut (synkroninen luku, muutos ja kirjoitus, varmuuskopiot, validointi) ja pitää UI:n ennallaan. Se toimii offline ilman uutta välimuistimallia, maksaa 63 kt gzip vain kirjautuville ja on testattavissa puhtaina funktioina ilman verkkoa. A:n reaaliaikaisuus ei ole D-016:n vaatimus, ja sen offline-kirjoitusten semantiikka rikkoisi nykyisen tallennusmallin. C siirtäisi tietoturvakriittisen istuntokoodin meille.

**Seuraukset:**
- Uusi riippuvuus `firebase` (tarkka versio, nyt 12.19.0) → Digiturvan riippuvuuskatselmointi. Siitä tuodaan vain `app`, `auth` ja `firestore/lite`.
- CSP laajenee (kohta 9), ja `firebaseConfig.test.ts` päivitetään.
- PRIVACY.md: uusi käsittely (uid, pakat, kokoelma, Googlen kirjautumistiedot Firebase Authissa, sijainti EU), 16+ ja poisto-oikeus (käyttäjä päättää, tehdäänkö MVP:hen "Poista tilin tiedot" -toiminto vai pelkkä ohje, ks. kortti).
- Käyttäjän tehtävät Firebase- ja Google Cloud -konsolissa (lista T-054-kortissa) ennen T-054a:n testausta.
- Kokoelman pilkkominen, reaaliaikaisuus (`onSnapshot`) ja sääntöjen emulaattoritestit → IDEAS.md.

**D-017, käyttäjän hyväksyntä 2026-10-03:**
- Ratkaisu B hyväksytty.
- Firestoren sijainti: aluksi `europe-north1`; **käyttäjän lopullinen valinta 2026-10-03: tuotanto `eur3`, testi `europe-north1`** (kirjattu myös PRIVACY.md:hen).
- Poisto-oikeus toteutetaan "Poista tilin tiedot" -painikkeena, joka poistaa pilvidatan vahvistuksen jälkeen.
- Uloskirjautuminen ei poista tilin tietoja selaimesta. Uloskirjautuessa käyttäjälle kerrotaan, että tiedot jäävät tähän selaimeen. Digiturva arvioi jaetun koneen riskin ja antaa tarvittaessa ohjeen.

**D-017, käyttäjän lisäpäätökset 2026-10-03 (Digiturvan SEC-011:n jälkeen):**
- **K-P8 / R-18: erillinen Firebase-testiprojekti nyt.** Testisivuston kirjautuminen ja tietokanta eivät käytä tuotantoprojektia. Arkkitehti päivittää D-017:n (hosting, workflow, config per ympäristö, konsolitehtävät).
- **K-P5:** "Poista tilin tiedot" poistaa myös Firebase Auth -käyttäjän (`deleteUser`, tarvittaessa uudelleenkirjautuminen).
- **K-P7:** selosteeseen rekisterinpitäjän nimi ja Gmail-osoite. Käyttäjä antaa tarkan tekstin, ja siihen asti käytetään paikkamerkkiä. Kirjautumista ei avata muille ennen kuin teksti on lisätty.

**D-017, Muutos K-P8 · 2026-10-03 · Arkkitehti (ehdotus), käyttäjä hyväksyy konsolitehtävät:** erillinen Firebase-testiprojekti. Korvaa kohdan 1 testisivuston osalta, kohdan 2 ympäristöjuuren, kohdan 3 juuren `{root}` ja kohdan 10 deployn. Muut kohdat ennallaan.
- **Vaihtoehdot:**
  - **A) Testisivusto uuteen projektiin (valittu).** Uusi Spark-projekti `cyberdeck-tcg-dev` (projektin id on maailmanlaajuisesti yksilöllinen; jos se on varattu, käytetään vapaata nimeä ja korvataan se kaikkialla). Projektin oletussivusto `cyberdeck-tcg-dev.web.app` on uusi testisivusto, ja sillä on oma Auth ja oma Firestore. `deploy-test.yml` ja `preview.yml` deployaavat uuteen projektiin uudella palvelutilin salaisuudella. + Sama malli kuin tuotannossa: `authDomain` on sivuston oma host, ja `/__/auth/handler` palvelee saman projektin Authia, joten redirect toimii samassa originissa kolmannen osapuolen tallennuksen estosta huolimatta. Tuotannon deploy-salaisuus poistuu PR-workflowsta (PR-haarojen koodi ei enää aja tuotantoprojektin oikeuksilla). − **Testisivuston URL muuttuu**: Hostingin site id on maailmanlaajuisesti yksilöllinen, `cyberdeck-tcg-test` kuuluu tuotantoprojektiin, eikä poistettua site id:tä voi ottaa uudelleen käyttöön (Firebase-dokumentaatio, multisites, tarkistettu 2026-10-03). Siirtoa projektien välillä dokumentaatio ei tarjoa.
  - **B) Testisivusto jää `cyberdeck-tcg`-projektiin, config osoittaa uuteen projektiin, `authDomain` = `cyberdeck-tcg-dev.firebaseapp.com`.** Redirect-kirjautuminen tapahtuu silloin eri originissa, ja selainten kolmannen osapuolen tallennuksen esto (Chrome, Firefox, Safari) rikkoo sen. Firebasen ohjeen ("signInWithRedirect best practices") kiertotiet: popup (vaatii COOP:n löysentämisen `same-origin-allow-popups`, SR-24 vastaan), käänteinen välityspalvelin (Hosting ei välitä ulkoiseen domainiin) tai Authin apusivujen itse ylläpito (hauras, päivitettävä käsin). Lisäksi testin deploy ajaisi edelleen tuotantoprojektin oikeuksilla. Hylätään.
  - **C) URL säilyy uudelleenohjauksella:** vanha `cyberdeck-tcg-test.web.app` deployataan kerran 301-ohjaukseksi uuteen osoitteeseen. Vaatii erillisen hosting-configin vanhalle sivustolle ja käsin deployn tuotantoprojektiin. Hyöty on pieni, koska testisivustoa käyttävät vain kehittäjä ja testaajat. Ei tehdä; vanha sivusto poistetaan käytöstä (konsolitehtävä 13).
  - **D) Yksi projekti ja juuri `test_users` (alkuperäinen kohta 2).** Käyttäjä hylkäsi (K-P8, R-18).
- **Päätös: A.** Testisivusto `https://cyberdeck-tcg-dev.web.app`, esikatselut `cyberdeck-tcg-dev--pr-…web.app`. Tuotanto ennallaan.
- **`.firebaserc`:** aliakset `"default": "cyberdeck-tcg"` ja `"test": "cyberdeck-tcg-dev"`; targets: `cyberdeck-tcg` → `hosting.prod: ["cyberdeck-tcg"]`, `cyberdeck-tcg-dev` → `hosting.test: ["cyberdeck-tcg-dev"]`. Vanha `test`-kohde `cyberdeck-tcg`-projektista poistetaan. `firebase.json`:in hosting-kohteet `prod` ja `test` pysyvät ennallaan (target-nimi ratkaistaan projektin mukaan).
- **Workflowt:** `deploy-test.yml` ja `preview.yml`: `projectId: cyberdeck-tcg-dev`, `firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG_DEV }}`, build `npm run build:test`. `deploy-prod.yml`: ennallaan (`npm run build`, vanha salaisuus). Tuotannon salaisuutta ei enää käytetä PR- eikä test-workflowssa. **Digiturvan katselmointi pakollinen** (workflow ja firebase-config muuttuvat).
- **Config ympäristön mukaan (build + ajonaikainen tarkistus):**
  - `package.json`: `"build:test": "tsc --noEmit && vite build --mode test"`. `vite build` ilman `--mode`a on tuotanto. Viten dokumentaation mukaan (tarkistettu 2026-10-03) `--mode test` asettaa `import.meta.env.MODE = 'test'`, mutta `NODE_ENV` ja `import.meta.env.PROD` pysyvät tuotantoarvoissa, joten optimoinnit ovat samat. Valinta tehdään siksi **`MODE`:n** perusteella, ei `PROD`:n.
  - `src/account/firebase/config.ts`: kaksi erillistä vakio-oliota `PROD_ENV` ja `TEST_ENV` (`{ projectId, apiKey, appId, messagingSenderId, siteHost, authDomain }`) ja `export const FIREBASE_ENV = import.meta.env.MODE === 'production' ? PROD_ENV : TEST_ENV`. Vite korvaa `MODE`:n merkkijonolla, ja käyttämätön olio putoaa minifioinnissa pois. `.env`-tiedostoja ei käytetä (ne ovat `.gitignore`:ssa ja näyttäisivät salaisuuksilta). Dev-palvelin (`development`) ja Vitest (`test`) saavat `TEST_ENV`:n.
  - **Ajonaikainen tarkka host-tarkistus (SR-21 päivittyy):** kirjautuminen on käytössä vain, jos `location.host === FIREBASE_ENV.siteHost` (redirect, `authDomain` = `siteHost`) tai kyse on testi-configista ja host on `localhost:<portti>` tai `127.0.0.1:<portti>` (popup, `authDomain` = `cyberdeck-tcg-dev.firebaseapp.com`). Kaikki muu (esikatselut, `*.firebaseapp.com`, tuntemattomat, väärä build väärällä sivustolla) → kirjautuminen pois, SDK:ta ei ladata. Näin vahingossa tuotantoon deployattu test-build tai testiin deployattu prod-build ei yhdistä väärään projektiin vaan sulkeutuu.
  - **dist-tarkistus:** `scripts/check-dist-env.mjs <production|test>` ajetaan workflowssa buildin jälkeen. Se hylkää buildin, jos `dist/` sisältää toisen ympäristön `projectId`:n tai `apiKey`:n. Yksikkötestit `config.ts`:n valintalogiikalle (puhdas funktio `selectAuthMode(env, host)`), mukaan lukien `cyberdeck-tcg.web.app.evil.example`.
- **Juuri yksinkertaistuu:** `test_users` poistuu. Molemmissa projekteissa sama malli `users/{uid}`, `users/{uid}/decks/{deckId}`, `users/{uid}/collection/main`. Säännöt sallivat vain juuren `users`, ja sama `firestore.rules` deployataan molempiin projekteihin. `{root}`-parametri poistuu koodista.
- **Deploy (kohta 10 päivittyy):** käyttäjä ajaa säännöt kumpaankin projektiin erikseen: `firebase deploy --only firestore:rules,firestore:indexes --project test` ennen kuin T-054b yhdistetään testiin, ja `--project default` ennen kuin T-054b julkaistaan tuotantoon (`/julkaise`). Hook kysyy luvan.
- **Palvelutilin roolit (testiprojekti):** action-hosting-deployn ohje (docs/service-account.md, tarkistettu 2026-10-03) listaa Firebase Authentication Admin, Firebase Hosting Admin, Cloud Run Viewer ja API Keys Viewer. Vähimmät oikeudet: **Firebase Hosting Admin ja API Keys Viewer**. Cloud Run Viewer ei ole tarpeen (ei Cloud Run -rewritejä), eikä Authentication Admin (sitä käytetään vain esikatselujen domainien lisäämiseen, ja esikatseluissa kirjautuminen on pois). Jos deploy epäonnistuu oikeuksien takia, rooli lisätään ja kirjataan korttiin. Digiturva vahvistaa.
- **Kustannus ja lukitus:** uusi projekti on Spark-tasolla eikä maksa mitään. Ei uutta lukitusta, koska Firebaseen on jo sitouduttu (D-016).
- **Seuraukset:** testisivuston URL vaihtuu `CLAUDE.md`:hen, `README.md`:hen, `docs/STATUS.md`:hen ja `docs/SECURITY.md`:hen (PM tai Dokumentoija infratehtävässä; vanhat raportit jäävät ennalleen historiana). R-18 poistuu, kun infratehtävä on tehty. IDEAS.md:n "erillinen testiprojekti" merkitään toteutetuksi.

## D-018 · Want-lista omana kokoelman muotoisena aggregaattinaan, kokoelman vaihtojako URL-linkkinä · 2026-10-05 · Päättäjä: Arkkitehti (ehdotus), PM ja käyttäjä hyväksyvät
**Tila:** Hyväksytty (käyttäjä 2026-10-05): jaetaan koko kokoelma, puuttuvat lisätään wantiin suurimman määrän mukaan (max), want ei vähene automaattisesti. Tehtävä T-064 (osat T-064a, T-064b, T-061b, T-062, T-063). Digiturva katselmoi T-064a:n (tallennus, synkka, säännöt) ja T-062:n (URL-syöte).
**Konteksti:** Käyttäjä haluaa want-listan (kortti + haluttu määrä), "lisää puuttuvat wantiin" -napin pakkaeditoriin (`MissingCard`, `src/domain/deckExport.ts`) ja kokoelman jakolinkin, josta vastaanottaja näkee vaihtovertailun omaan kokoelmaansa. Nyt kokoelma on `Collection { entries: {card, count}[] }` (localStorage `cyberdeck:collection`, envelope v1, Firestore `users/{uid}/collection/main`, kolmitiemerge `mergeCollection`). Pakan jako on base64url-tekstiä URL-hashissa (`#/jaa/<data>`, D-017 ei koske). Korttidatassa on nyt 151 korttia, avaimen keskipituus 22 merkkiä (MAX_CARD_KEY_LENGTH 100).

**Vaihtoehdot, tietomalli:**
- **A) Want omana aggregaattinaan, sama tyyppi kuin kokoelma (valittu).** `WantList = Collection` (entries `{card, count}`, count 1–999, enintään 5000 riviä). Uusi localStorage-avain `cyberdeck:wants` (tilikohtaisesti `cyberdeck:u:{uid}:wants`), envelope v1, Firestore `users/{uid}/collection/want`. + Ei migraatiota (uusi avain, vanha data koskematon). `parseCollection`, `withCount`, `mergeCollection`, `encodeCollectionDoc` ja repositoriototeutus käyvät sellaisenaan avaimella parametrisoituina. Sääntömuutos on yksi rivi (`docId in ['main', 'want']`). Vanha sovellusversio ei näe want-dokumenttia eikä riko sitä. − Yksi luku ja kirjoitus lisää täydessä synkassa; `LocalData`, `SyncBase`, `CloudSnapshot` ja `CloudChange` saavat yhden kentän lisää.
- **B) Want kokoelman kenttänä** (`data: { entries, wants }`, skeema v2). + Yksi dokumentti, yksi avain. − Skeemamigraatio v1→v2 paikallisesti ja pilvessä; säännön `hasExactly(d.data, ['entries'])` muutos; vanhan version välilehdet ja laitteet näkevät v2:n ja lukitsevat synkan (SR-23), kunnes ne päivitetään; molempien listojen yhteinen 1 MiB:n raja. Isompi ja riskialttiimpi muutos. Hylätään.
- (C) Want kokoelmarivin kenttänä `{card, count, want}`: sama migraatio kuin B:ssä ja lisäksi rivi, jonka count on 0, rikkoisi nykyisen invariantin "count 0 = riviä ei ole". Hylätään.

**Vaihtoehdot, jakolinkki:**
- **1) URL-koodattu kuten pakka (valittu).** `#/vaihto/<data>`, data = base64url(UTF-8-teksti), ks. formaatti alla. + Ei palvelinta, ei kirjautumista, ei henkilötietoja palvelimella, ei Firestore-sääntöjä eikä kiintiöitä, sama validointimalli kuin T-056:ssa. Nykyisellä korttimäärällä koko kokoelma ja want ≈ 4–8 kt → 6–11 k merkkiä. − Linkki on tilannekuva (ei päivity), ja kasvava korttimäärä voi myöhemmin vaatia pakkauksen (`CompressionStream('deflate-raw')`, ei uutta riippuvuutta; selaintuki tarkistetaan dokumentaatiosta silloin) tai lyhyemmät tunnisteet. Kirjataan IDEAS.md:hen.
- **2) Julkinen Firestore-dokumentti** `shares/{shareId}`, linkissä vain tunniste. + Lyhyt linkki, voi päivittyä. − Vaatii kirjautumisen jakajalta, julkisen lukusäännön (luettelointi, arvaaminen, roskaposti), poisto- ja vanhenemislogiikan, PRIVACY.md-muutoksen (julkisesti luettavaa käyttäjädataa uid:hen sidottuna) ja Digiturvan uhkamallin. Spark-kiintiöt riittävät, ei maksua, mutta selvästi isompi pinta. Hylätään nyt, IDEAS.md:hen.

**Päätös:** A + 1.

**1. Want-tietomalli ja tallennus (T-064a)**
- `src/domain/wants.ts`: `export type WantList = Collection; export const EMPTY_WANTS = EMPTY_COLLECTION;` sekä `addMissingToWants(wants, missing: readonly MissingCard[]): WantList` (T-061b). Rajat: `MAX_COLLECTION_COUNT` ja `MAX_COLLECTION_ENTRIES` (SR-11) samat.
- Want-määrä tarkoittaa **montako kappaletta lisää haluan** (ei tavoitekokonaismäärää). Ei sidota kokoelmaan: kokoelman kasvu ei vähennä wantia automaattisesti (avoin tuotekysymys, ks. kortti).
- `keys.ts`: `WANTS_KEY = 'cyberdeck:wants'`, `WANTS_SCHEMA_VERSION = 1`; `migrations.ts`: `WANTS_MIGRATIONS = []`. Varmuuskopiot aggregaatilla `wants` (`cyberdeck:backup:wants:<ISO>`), enintään 3.
- `Repositories.wants: CollectionRepository` (sama rajapinta, sama toteutus avaimella parametrisoituna). `forAccount(uid)` → `cyberdeck:u:{uid}:wants`.

**2. Synkka (T-064a)**
- `LocalData.wants`, `SyncBase.wants` (tallennetussa pohjassa puuttuva `wants` = `EMPTY_COLLECTION`, ei pohjan versionnostoa), `CloudSnapshot.wants: CloudDoc<Collection>`, `CloudChange.wants?: Collection`.
- `mergeCollection` sellaisenaan wantille. `fullSync` tarkistaa myös `wants.entries.length <= MAX_COLLECTION_ENTRIES`. `push` vertaa `sameCollection(local.wants, base.wants)`.
- `firestoreCloudStore`: `readAll` lukee `collection/want`, `commit` kirjoittaa sen samaan transaktioon, **`deleteAll` poistaa sen** (tilin poisto, GDPR). `validateChange` laskee kirjoituksen ja kokorajan (900 000 t).
- `copySignedOutData` yhdistää myös wantit.
- `firestore.rules`: `match /collection/{docId}` -lohkossa `docId == 'main'` → `docId in ['main', 'want']` (get, create/update, delete). Muuta ei muuteta. Käyttäjä deployaa säännöt testiprojektiin ennen T-064a:n yhdistämistä testiin ja tuotantoon ennen julkaisua; muuten want-kirjoitus kaatuu ja synkka menee virhetilaan.

**3. Vaihtojakolinkin formaatti (T-062)**
- Reitti `#/vaihto/<data>`, `src/domain/tradeShare.ts`: `encodeTradeShare(have: Collection, want: WantList): string | null` (null = liian iso) ja `decodeTradeShare(data: string): { have: Collection; want: WantList; dropped: number } | null`.
- Teksti ennen base64url:ää, rivit `\n`-erotettuina:
  ```
  cyberdeck-vaihto 1
  h <määrä> <kortin avain>
  w <määrä> <kortin avain>
  ```
  Avaimet ovat sovelluksen `CardKey`-avaimia, ei nimiä (lyhyempi, ei jäsennysmonitulkintaisuutta).
- Rajat: data enintään `MAX_SHARE_DATA_LENGTH` (16 000 merkkiä) ja dekoodattuna enintään `MAX_IMPORT_BYTES`; rivejä enintään 2 × `MAX_COLLECTION_ENTRIES`; rivin muoto lineaarisella regexillä `^([hw]) ([1-9][0-9]{0,2}) ([a-z0-9-]{1,100})$` + `isCardKey`; tuntematon otsikko tai versio → koko linkki virheellinen; virheellinen rivi tai tuplasti esiintyvä avain samassa listassa → rivi hylätään ja lasketaan `dropped`-määrään. Avaimet `Map`iin (SR-11). Tuntemattomat kortit (ei korttidatassa) ohitetaan vertailussa ja näytetään määränä.
- Jakaja: jos koodattu data ylittää 16 000 merkkiä, nappi näyttää virheen ("Kokoelma on liian suuri linkkiin") eikä tuota katkaistua linkkiä.

**4. Vertailu ja vaihdettavuus (T-062, T-063)**
- `src/domain/tradeCompare.ts`, puhdas funktio: `compareTrade(mine: Collection, myWants: WantList, theirs: Collection, theirWants: WantList, cardsByKey)` → `{ iCanGive: {card, count}[], theyCanGive: {card, count}[] }`, jossa `count = min(halu, tarjolla)`.
- T-062: tarjolla = omistettu määrä. T-063: tarjolla = `max(0, omistettu − playsetSize(card))` (ylimäärä, `src/domain/card.ts`). Tuntematon kortti → ei tarjolla.

**Kustannus ja lukitus:** ei uusia palveluita, ei maksua, ei uusia riippuvuuksia. Firestoressa yksi dokumentti lisää per käyttäjä (Spark riittää).
**Seuraukset:** PRIVACY.md:n inventaarioon want-lista (SR-16), SECURITY.md:hen jakolinkin vaatimus (Digiturva), IDEAS.md:hen pakkaus ja Firestore-jako.

## D-019 · Englanninkielinen käyttöliittymä: kieli valitaan käynnistyksessä, vaihto lataa sivun uudelleen · 2026-10-05 · Päättäjä: PM, käyttäjä (oletuskieli ja valitsimen paikka)
**Tila:** Hyväksytty. Tehtävä T-068.
**Konteksti:** Käyttäjä haluaa koko sovelluksesta englanninkielisen version. Tekstit ovat keskitetysti tiedostoissa `texts.ts` ja `deckTexts.ts` (noin 640 riviä), ja 37 moduulia tuo ne staattisesti, osa jo moduulitasolla.
**Vaihtoehdot:** A) Kieli ratkaistaan kerran käynnistyksessä. Tekstiolio valitaan sen mukaan, ja vaihto tallentaa valinnan ja lataa sivun uudelleen (hash-reitti säilyy). + Pieni muutos, ei React-contextia eikä uutta riippuvuutta, moduulitason vakiot toimivat. − Vaihto lataa sivun uudelleen. B) React-context ja `useTexts()` kaikkiin komponentteihin. + Vaihto ilman uudelleenlatausta. − Koskee kaikkia 37 moduulia ja moduulitason vakioita, suuri diff. C) i18n-kirjasto. − Uusi riippuvuus ilman tarvetta.
**Päätös:** A. Ensimmäisellä käynnillä kieli määräytyy selaimen kielen mukaan (`fi*` → suomi, muuten englanti), ja valinta tallennetaan paikallisesti (ei henkilötieto, ei synkata). Valitsin FI/EN on yläpalkissa teemavalitsimen vieressä. `<html lang>` asetetaan kielen mukaan. Englanninkielisen tekstiolion tyyppi on sama kuin suomenkielisen, joten puuttuva käännös on käännösvirhe.
**Seuraukset:** Uudet tekstit lisätään molempiin kieliin. Korttien nimet ja pelitermit pysyvät englanniksi (`lang="en"`-merkinnät ovat tarpeettomia englanninkielisessä versiossa mutta eivät haitallisia). Dokumentit pysyvät suomeksi.

## D-020 · Korttien painokset kokoelmassa: korttikohtainen kokonaismäärä ja valinnainen erittely painoksittain · 2026-10-05 · Päättäjä: PM (käyttäjän pyyntö), Digiturva katselmoi
**Tila:** Hyväksytty. Tehtävä T-072. Täydentää D-007:n kohtaa 1 (valmius painoksille).
**Konteksti:** Netdeckin rajapinnassa on 151 korttia ja 717 painosta 17 setissä (Retail, Beta, FR, Edgerunner Open, starter- ja demopakat, promot). Visuaalisesti erilaisia englanninkielisiä versioita on 358. Käyttäjä haluaa kirjata kokoelmaan, mitä versioita hänellä on. Pakkasäännöt, puuttuvat kortit, want ja vaihto toimivat korttitasolla, eikä niitä haluta rikkoa.
**Vaihtoehdot:**
- A) Kokoelman rivi pysyy korttitasolla (`count` = kokonaismäärä), ja siihen lisätään valinnainen erittely `versions: { <painosavain>: määrä }`, jonka summa on ≤ count. Erotus on "versio ei tiedossa". + Kaikki nykyinen logiikka pysyy ennallaan, ja vanha data on kelvollista sellaisenaan. − Kokonaismäärän ja erittelyn pitää pysyä johdonmukaisina.
- B) Kokoelman rivit painostasolle. − Jokainen kokoelmaa lukeva kohta pitäisi muuttaa ja olemassa oleva data muuntaa.
**Päätös:** A.
- **Painosavain:** `<setin koodi>:<keräilynumero ilman β-merkkiä>`, esim. `welcometonightcitybeta:005a`. Se on luettava ja vakaa eikä riipu Netdeckin UUID:stä (D-008:n periaate). Validointi: `^[A-Za-z0-9-]{1,64}:[A-Za-z0-9]{1,12}$`, ja enintään 32 versiota per kortti.
- **Korttidata:** `Card.printings` (avain, setin koodi ja nimi, numero, rarity, kieli, taiteilija, kuva-avain) tulee mukaan `cards.json`:iin `npm run cards:update`:lla. Kuvien allekirjoitettuja URL-osoitteita ei tallenneta.
- **Kuva-avain:** `<slug>__<setin perhe>-<numero>`, jossa perhe = setin nimi ilman Retail-, Beta- ja FR-osaa. Kuvat tulevat polkuun `public/cards/variants/<kuva-avain>.webp` käyttäjän toimittamista tiedostoista (lista `docs/card-variant-images.md`). Jos kuvaa ei ole, käytetään kortin peruskuvaa ja versiomerkintää.
- **Tallennus:** kokoelman schemaVersion kasvaa, jotta vanha sovellusversio lukitsee synkan eikä kirjoita erittelyä pois. Määrän muutos versiolle muuttaa myös kokonaismäärää samassa muutoksessa. Kun kokonaismäärää pienennetään alle erittelyn summan, versioita ei poisteta automaattisesti: alentaminen estetään, ja käyttäjä ohjataan vähentämään versiota.
**Seuraukset:** Pakkojen, wantin ja vaihdon korttitaso ei muutu. Digiturva katselmoi tallennuksen, synkan ja mahdolliset sääntömuutokset. Julkaisu ensin deviin, ja käyttäjä testaa ennen tuotantoa.

## D-021 · Versiot kuvituksina: galleria tietonäkymässä, haku näyttää osuvan kuvituksen, "kaikki kuvitukset" -tila · 2026-10-05 · Päättäjä: PM (käyttäjän palaute)
**Tila:** Hyväksytty. Tehtävä T-077. Tarkentaa D-020:n käyttöliittymää; tietomalli (`versions` painoksittain) ei muutu.
**Konteksti:** T-072:n versiolista näytti jokaisen painoksen omana rivinään (Retail, Beta, FR ja turnausnumerot), joten sama kuva toistui monta kertaa ja kokonaisuus oli epäselvä. Käyttäjä haluaa myös, että esimerkiksi Nova Rare -haku näyttää tulokset Nova Rare -kuvalla.
**Vertailu:** Scryfall näyttää haussa oletuksena yhden tuloksen korttia kohden (`unique:cards`), mutta tarjoaa myös tilat `unique:art` (yksi tulos kuvitusta kohden) ja `unique:prints` (jokainen painos). Moxfieldissä painos vaihdetaan kuvagalleriasta (Switch Printing), ja oletuspainoksen voi valita (Preferred Printing).
**Päätös:**
1. **Kuvitus** = kortin visuaalinen versio: perus (kaikki tavalliset harvinaisuudet) sekä jokainen erikoisharvinaisuus (Iconic Legend, Iconic Other, Iconic Secret, Nova Rare), jolla on oma kuva. Kuvitus kokoaa painokset (Retail, Beta, FR ja turnausnumerot) yhteen.
2. **Tietonäkymän Versiot = galleria:** yksi ruutu kuvitusta kohden. Ruudussa on pikkukuva, nimi ("Perus", "Nova Rare"…), setit tiiviisti, omistettu määrä ja +/−-laskuri. Laskuri lisää kuvituksen oletuspainokseen (Retail EN tai ensimmäinen numero). Ruudun valinta vaihtaa ison kuvan. Painoskohtainen erittely (Retail/Beta/FR/numero) on ruudun "Erittely"-avattavassa. Erillinen "Peruskuva"-painike poistuu.
3. **"Versio ei tiedossa" lasketaan peruskuvitukseen:** peruskuvituksen määrä = kokonaismäärä − erikoiskuvitusten summa.
4. **Haku:** harvinaisuus- ja settisuodatin osuvat mihin tahansa kortin painokseen. Kun suodatin osuu erikoiskuvitukseen, tuloskortti näytetään sen kuvalla.
5. **"Kaikki kuvitukset" -valinta** Kortit-näkymän työkalurivillä (vastaa Scryfallin `unique:art`-tilaa) näyttää jokaisen kuvituksen omana ruutunaan. Oletuksena näkyy yksi ruutu korttia kohden, ja sen kulmassa on merkintä "N kuvitusta", kun kuvituksia on useampi. Näin esimerkiksi Johnny-haku näyttää oletuksena eri Johnny-kortit kerran ja kaikki kuvitukset yhdellä valinnalla.
**Seuraukset:** Pakat, want ja vaihto pysyvät korttitasolla. Kuvitusavain on `<cardKey>__<rarity-slug>` (T-076), ja peruskuvituksen avain on `<cardKey>`.

## D-022 · Setit ja muut tuotteet erikseen, Beta ja Retail kokoelmassa, olemassa olevat kortit Betaksi · 2026-10-06 · Päättäjä: käyttäjä, PM
**Tila:** Hyväksytty. Tehtävä T-083. Tarkentaa D-020:tä ja D-021:tä.
**Konteksti:** Käyttäjän mukaan varsinaiset setit ovat Welcome to Night City (Retail) ja Welcome to Night City (Beta). Starter- ja demopakat, promot, Box Toppers, Pre-Release ja turnauspalkinnot ovat sivutuotteita. Käyttäjä haluaa erottaa kokoelmassaan Beta- ja tavalliset kortit. Kaikki tähän mennessä kirjatut kortit ovat Betaa.
**Päätös:**
1. **Setti / Versio -suodatin:** kaksi ryhmää. "Setit" sisältää Welcome to Night City ja Welcome to Night City (Beta), joista FR kuuluu Retailiin. "Muut tuotteet" sisältää kaiken muun. Beta ja Retail ovat erillisiä suodatinarvoja.
2. **Oletuspainos:** Kortit-näkymän muokkaustilassa valitaan oletuspainos, Beta tai Retail (oletuksena Beta). Valinta tallennetaan paikallisesti kuten muut näkymäasetukset. Peruskuvituksen + lisää valittuun painokseen, ja − vähentää ensin siitä, sitten muista.
3. **Tietonäkymän perusversio:** perusversion ruudussa on WtNC-korteille suoraan erilliset laskurit Retail ja Beta. Muut painokset ovat Erittely-kohdassa.
4. **Kertaluonteinen muunnos:** kokoelman schemaVersion nousee 2 → 3. Muunnoksessa jokaisen kortin versioimaton osuus (count − versioiden summa) kirjataan kortin Beta-painokselle (`welcometonightcitybeta:<numero>`, perusharvinaisuus), jos sellainen on. Muuten osuus jää versioimattomaksi. Muunnos ei muuta kokonaismääriä, ja se tehdään sekä paikalliselle että pilvestä luetulle datalle. Want-lista ei muutu. Vanha sovellusversio lukitsee synkan (newer), eikä se kirjoita erittelyä pois.
**Seuraukset:** Pakat, want ja vaihto pysyvät korttitasolla. Digiturva katselmoi muunnoksen ennen tuotantoa.

## D-023 · Gitleaks pre-commit-hookina · 2026-10-06 · Päättäjä: käyttäjä, PM
**Tila:** Hyväksytty. Tehtävä T-085.
**Konteksti:** Käyttäjä haluaa gitleaksin käyttöön niin, että se ajetaan aina ennen committia. Sääntö "ei salaisuuksia repoon" oli tähän asti vain ohje.
**Päätös:**
1. **Hook ilman npm-riippuvuutta:** hook on repossa (`.githooks/pre-commit`), ja `npm install`/`npm ci` ottaa sen käyttöön `prepare`-skriptillä (`git config core.hooksPath .githooks`). Huskya ei otettu, koska se olisi uusi riippuvuus samaan tehtävään.
2. **Mitä hook tekee:** se ajaa `gitleaks git --pre-commit --staged` eli tarkistaa vain commitoitavat muutokset. Jos gitleaks puuttuu, commit estyy, joten tarkistus ei ohitu huomaamatta. Gitleaks asennetaan koneelle erikseen (winget tai brew), eikä sitä ole npm-paketeissa.
3. **Poikkeukset (`.gitleaks.toml`):** oletussäännöt ovat käytössä. Sallittuja ovat Firebasen web-API-avaimet, jotka ovat julkisia ja tuotantobundlessa (rajaus tehdään T-009:ssä), sekä `cards.json`:n `imageKey`-kentät, jotka ovat tunnisteita. Uusi poikkeus vaatii perustelun tiedostoon.
4. **Historia:** koko historia (327 committia) skannattiin käyttöönotossa. Löydetyt 24 osumaa olivat kaikki edellä mainittuja ei-salaisuuksia. Oikeita vuotoja ei löytynyt.
**Seuraukset:** `git commit --no-verify` ohittaa hookin. Jos tarvitaan pakottava tarkistus, gitleaks lisätään CI:hin (workflow-muutos, Digiturva).

## D-024 · Eddies-malli ja myytävien korttien suositus · 2026-10-06 · Päättäjä: käyttäjä (pyyntö), PM (malli)
**Tila:** Hyväksytty. Tehtävä T-096.
**Konteksti:** Käyttäjä halusi pakan tilastoihin visuaalisen näkymän Eddieiksi myytävistä korteista ja suositusmäärän pakan hintarakenteen mukaan.
**Säännöt (virallinen pelinohje, choombattler.com/how-to-play):**
- Eddies-alue on pelin alussa tyhjä.
- Kerran vuorossa saa myydä yhden €$-merkityn kortin, ja se on 1 Eddie loppupelin.
- Eddiet valmistuvat joka vuoro uudelleen.
- Legendin voi käyttää 1 Eddienä.
**Päätös:**
1. **Simulointi:** myytävät kortit (€$, `eddiable`) simuloidaan kiinteällä siemenellä. Malli myy kortin joka vuoro, kun kädessä on myytävä. Aloituskäsi on 6 korttia, ja kortti nostetaan joka vuoro, myös ensimmäisellä. Tuloksena saadaan Eddiet keskimäärin vuoroittain ja todennäköisyys myydä joka vuoro.
2. **Suositus:** pienin myytävien määrä, jolla kortin voi myydä joka vuoro tavoitevuoroon asti vähintään 80 %:ssa peleistä. Tavoitevuoro on pakan keskihinta ylöspäin pyöristettynä, 2–6.
3. **Legendit eivät ole mukana:** Legendien käyttöä Eddieinä ei lasketa. Suositus on siksi varovainen.
**Seuraukset:** Oletukset näkyvät käyttäjälle tilastokortin huomautuksessa. Jos sääntöihin tulee tarkennuksia, muutos tehdään yhteen paikkaan (`src/domain/eddies.ts`).
**Muutos T-103: käyttäjän tavoite 55–60 %.** Suositus ei enää perustu simulaatioon (kohta 2 korvattu). Tavoite on prosenttiosuus pääpakasta: keskikohta = clamp(0,575 + (keskihinta − 3) × 0,05; 0,45; 0,70), tavoiteväli = keskikohta ± 0,025 (keskihinnalla 3: 55–60 %, kalliimmalla enemmän, halvemmalla vähemmän). Näytetään kappaleina ja prosentteina, esim. "Suositus 23–25 (55–60 %)", ja arviona liian vähän / yli suosituksen / sopiva määrä. Eddiet vuoroittain -simulaatio ja todennäköisyys myydä joka vuoro jäävät näkyviin informaationa. Funktio `sellableTarget` (`src/domain/eddies.ts`).

## D-025 · Julkiset pakat · 2026-10-06 · Päättäjä: käyttäjä
**Tila:** Hyväksytty (tuotepäätökset). Tehtävä T-098. Tekniset yksityiskohdat vahvistetaan Digiturvan uhkamallissa ja Arkkitehdin katselmoinnissa ennen toteutusta.
**Konteksti:** Käyttäjät haluavat jakaa pakkojaan muille Pakat-osiossa, eivät vain linkillä (D-0xx jakolinkki).
**Päätös:**
1. Pakka on oletuksena yksityinen. Omistaja voi muuttaa sen julkiseksi.
2. Julkiset pakat näkyvät kaikille, myös kirjautumattomille. Julkaiseminen vaatii Google-kirjautumisen.
3. Julkaisijana näkyy käyttäjän itse kirjoittama nimimerkki, jos käyttäjä haluaa nimensä näkyviin. Muuten pakka näkyy nimettömänä. Google-tilin nimeä ei käytetä.
4. Julkinen versio päivittyy automaattisesti omistajan tallentaessa pakan. Kun pakka muutetaan yksityiseksi, poistetaan tai tili poistetaan, julkinen kopio poistetaan.
5. Tietomalliksi ehdotetaan `publicDecks/{deckId}`, ja kirjoitusoikeus on vain omistajalla. Firestore-sääntöjen muutos vaatii Digiturvan katselmoinnin ja käyttäjän tekemän sääntöjen deployn.
**Seuraukset:** PRIVACY.md päivitetään. Moderointi (ilmiantaminen) on avoin kysymys, ja ensimmäinen versio tehdään ilman sitä.
**D-025, käyttäjän päätökset SEC-098:n jälkeen (2026-10-06):**
- **K-P9:** julkaisijan uid ei näy. Julkisen pakan tunniste on sha256(uid:deckId) (SR-30).
- **K-P10:** ensimmäinen versio julkaistaan ilman ilmiantotoimintoa, ja riski on kirjattu.
- **K-P11:** riski R-21 hyväksytään nyt. Kuka tahansa voi kirjautumatta kuluttaa lukukiintiön, mutta rajaukset SR-33 ja SR-34 pienentävät riskiä. App Check otetaan käyttöön myöhemmin, jos ongelmia ilmenee.
- **K-P12:** hakukoneet eivät indeksoi julkisia pakkoja.

## D-026 · Vain kaksi valmista agenttiroolia · 2026-10-06 · Päättäjä: käyttäjä
**Tila:** Hyväksytty. Tehtävä T-100.
**Konteksti:** Promptiauditoinnissa käyttäjätason agenttimäärittelyt olivat ristiriidassa itsensä kanssa: D-014:n ohitusteksti kumosi saman tiedoston aloitus- ja lopetusohjeet. Lisäksi `/tehtava` kuvasi yhä täyden suunnittelu- ja katselmointiketjun. Käyttäjä halusi vähentää ennalta määrättyjä rooleja ja antaa PM:n päättää tarpeen mukaan.
**Päätös:**
1. Valmiita aliagentteja ovat `koodari` (Sonnet), joka toteuttaa omassa haarassaan, ja `digiturva` (Opus), joka tekee turvakatselmoinnin kiinteällä tarkistuslistalla ja veto-oikeudella.
2. Arkkitehti, UX Designer, Sisällöntuottaja, Testikäyttäjä ja Dokumentoija poistettiin agenttimäärittelyistä (`~/.claude/agents/`). PM tekee niiden työn itse tai antaa sen tilannekohtaisella tehtävänannolla yleisagentille. Malli valitaan työn mukaan.
3. agents.md:n roolikuvaukset ja tarkistuslistat säilyvät tehtävänantojen lähdemateriaalina.
**Seuraukset:** Katselmointien laajuus riippuu PM:n harkinnasta. Riskin mukaiset rajat ovat CLAUDE.md:ssä. Poistetut määrittelyt ovat varmuuskopiona kansiossa `~/.claude/backup/2026-10-06-prompt-audit/`.

## D-027 · Korttien skannaus laitteella ilman painoksen tunnistusta · 2026-10-08 · Päättäjä: käyttäjä
**Tila:** Hyväksytty. Tehtävä T-106.
**Konteksti:** T-106:n suunnitelmassa oli neljä käyttäjän päätöstä. Käyttäjällä ei ole nyt kortteja käsillä testikuvia varten.
**Päätös:**
1. Toteutetaan ratkaisu A: kuvan sormenjälki lasketaan ja verrataan laitteella, eikä uusia riippuvuuksia tai pilvipalveluita käytetä.
2. Kamera sallitaan: Permissions-Policy muutetaan muotoon `camera=(self)`, ja Digiturva katselmoi muutoksen.
3. Painosta (Beta/Retail) ei tunnisteta kuvasta. Käyttäjä valitsee sen skannauksen alussa. Vaihe 3:n β-tunnistus jätetään pois.
4. Vaihe 0 tehdään keinotekoisilla testikuvilla: korttikuvia vinoutetaan, rajataan, sumennetaan, valaistusta muutetaan ja kuviin lisätään kohinaa, heijastuksia ja JPEG-pakkausta. Oikeilla valokuvilla tarkkuus todennetaan myöhemmin, kun käyttäjä on kotona.
**Seuraukset:** Keinotekoinen testi voi yliarvioida tarkkuuden. Varmistusnäkymä, jossa on kolme vaihtoehtoa, suojaa virheiltä, ja oikeiden kuvien testi on avoin jatkotoimi.

## D-028 · Sivustorakenne: neljä päätason kohdetta · 2026-10-08 · Päättäjä: käyttäjä
**Tila:** Hyväksytty. Toteutus tehdään T-112:n arvion jälkeen omina kortteinaan.
**Konteksti:** T-112:n suunnitelmassa todettiin kaksi ongelmaa. Kokoelmaa muokataan Kortit-sivulla, mutta Kokoelma-sivulla on vain tilastot. Viisi päätason kohdetta on lisäksi liikaa puhelimelle.
**Päätös:** Vaihtoehto A otetaan käyttöön. Päänavigoinnissa ovat Kortit · Kokoelma · Pakat · Vaihto.
1. Kokoelma on "minun korttini": oma lista ja määrien muokkaus, skannaus, tilastot ja kansio.
2. Kortit on korttitietokanta, jossa on pikalisäys.
3. Proxy on toiminto pakan, puuttuvien korttien ja kortin tietojen sisällä. Proxy-jono näkyy yläpalkissa merkkinä, kun se ei ole tyhjä.
4. Vanhat reitit ohjataan uusiin.
**Seuraukset:** T-112:n UX-arvio tarkentaa yksityiskohdat ja pilkkoo toteutuksen. Kokoelman muokkauksen siirto koskee useita testejä.

**D-028:n muutos 2026-10-09 (käyttäjä):** Proxy pysyy toistaiseksi päänavigoinnissa omana osionaan. Proxy-tarjoukset lisätään lisäksi mietittyihin paikkoihin: pakka, kortin tiedot, jaettu ja julkinen pakka, puuttuvat ja Have/Want (T-116). Päänavigoinnissa on siis viisi kohdetta, kunnes asiasta päätetään toisin.

## D-029 · Suoraan tuotantoon, kunnes käyttäjiä kutsutaan · 2026-10-09 · Päättäjä: käyttäjä
**Tila:** Hyväksytty. Korvaa toistaiseksi D-001:n ja D-003:n PR-esikatseluputken.
**Konteksti:** Sivustolla on vain yksi käyttäjä. PR-esikatselun build (noin 6 min) ja sen odottaminen hidastavat jokaista muutosta.
**Päätös:**
1. Muutokset tehdään suoraan `test`-haaraan, ilman t-XXX-haaraa ja ilman PR:ää testiin. Testit, lint ja build ajetaan paikallisesti ennen pushia.
2. Julkaisu tehdään heti julkaisu-PR:llä `test → main` ilman erillistä käskyä. Suojaushook kysyy luvan edelleen.
3. Poikkeus: jos muutos on riskialtis (tietomalli, Firestore-säännöt, tallennus tai synkronointi, tunnistautuminen, firebase.json, workflowt tai riippuvuudet), se testataan ensin devissä. PM kertoo käyttäjälle, miksi.
4. PR-esikatseluputkeen palataan, kun käyttäjä kutsuu lisää käyttäjiä.
**Seuraukset:** Virhe päätyy tuotantoon nopeammin. Riskin pienentävät paikalliset testit, poikkeuslista ja se, että vain yksi käyttäjä on altistunut.

## D-030 · Pelitulokset omana aggregaattinaan, yksi dokumentti · 2026-10-10 · Päättäjä: käyttäjä (sisältö), PM (rakenne)
**Tila:** Hyväksytty sisällöltään (käyttäjä 2026-10-10). Rakenne: PM. Tehtävä T-122. Digiturva tekee uhkamallin ennen toteutusta ja katselmoi ennen yhdistämistä.
**Konteksti:** Käyttäjä haluaa kirjata pelien tulokset pakoille (vastustajan nimi ja Legendit, Voitto/Tappio/Tasapeli, muistiinpano, aloittaja, tapahtuma, sideboard) ja synkronoida ne tilille kuten pakat. Synkka (D-017) lukee jokaisella täydellä kierroksella kaikki dokumentit, ja Sparkin kiintiö on 50 000 lukua päivässä.
**Vaihtoehdot:**
- **A) Yksi dokumentti `users/{uid}/games/log`, rivit pelin id:n mukaan (valittu).** Toistaa want-listan mallin (D-018): yksi luku kierroksella, kolmitiemerge rivin id:n mukaan kuten `mergeCollection`, ja sääntömuutos on pieni. − Firestoren 1 MiB:n raja, joten enintään 1 000 peliä ja 900 000 tavua (asiakas valvoo).
- **B) Dokumentti per peli `users/{uid}/games/{id}`** kuten pakat. + Ei kokorajaa. − Lukumäärä kasvaa pelien mukana jokaisella täydellä synkalla, ja kiintiö voi täyttyä. Hylätään.
- **C) Tulokset pakkadokumentin kenttänä.** + Poistuu pakan mukana. − Jokainen kirjaus muuttaa pakan `updatedAt`:n ja voi riitauttaa pakan muokkauksen toisella laitteella (pakka voittaa kokonaisena), ja julkaisu- ja vientipolut pitäisi suodattaa. Hylätään.
**Päätös:** A. Pakan poisto poistaa sen tulokset. Tulokset eivät koskaan päädy julkiseen pakkaan, jakolinkkiin tai vientiin. Yksityiskohdat ovat T-122-kortissa.
**Seuraukset:** Vastustajan nimi ja muistiinpano voivat sisältää kolmannen osapuolen tietoja (kaverin nimi), joten PRIVACY.md päivitetään (Digiturva). Kun pelejä on yli 1 000, tarvitaan arkistointi tai B-malli (IDEAS).

## D-031 · Vaihtosääntö ja vaihtolinkin versio 2 · 2026-10-12 · Päättäjä: käyttäjä (suunta), PM (toteutus)
**Konteksti:** Have näytti aina täyden pelisarjan ylittävät kappaleet. Käyttäjä halusi valita, mitkä kappaleet ovat vaihdettavissa, kuten muiden korttipelien vaihtolistoissa (esim. pidä pelisarja tai yksi kappale ja suojaa pakoissa olevat kortit).
**Päätös:**
1. Vaihtosääntö: pidä pelisarja (oletus, T-063), pidä 1 kappale tai pidä ei mitään. Lisäksi valinta "Pidä pakoissa olevat": pidetään vähintään kaikkien pakkojen yhteenlaskettu määrä.
2. Sääntö tallennetaan laitteen asetuksiin (`cyberdeck:trade-rule`). Se ei synkronoidu eikä ole käyttäjäkohtainen samalla laitteella. Korttikohtaiset poikkeukset vaativat tietomallin muutoksen, ja ne ovat jatkoidea.
3. Vaihtolinkin versio 2 (`cyberdeck-vaihto 2`) kuljettaa lähettäjän vaihdettavat kappaleet t-riveinä. Vastaanottaja käyttää niitä. Version 1 linkeissä pätee pelisarjasääntö. Digiturva katselmoi: ei löydöksiä.

## D-032 · Oma Have-lista ja yksi korostusväri sivua kohden · 2026-10-12 · Päättäjä: käyttäjä (suunta), PM (toteutus)
**Konteksti:** Haven sai vain kokoelmasta, joten pelkkää vaihtolistaa ei voinut tehdä. Osioiden tunnusvärit (T-142) tekivät sivuista kirjavia: punainen välilehti, vihreä palkki ja keltainen painike yhtä aikaa, ja Have/Wantin linkit olivat keltaisella alleviivattuja.
**Päätös:**
1. Have-lähde: **oma lista** (käsin, kuten Want) tai **kokoelmasta** säännöllä (D-031). Oletus: oma lista, jos siinä on kortteja; muuten kokoelma, jos siinä on kortteja; muuten oma lista. Valinta tallentuu vaihtosääntöön.
2. Oma Have-lista synkataan tilille kuten want-lista: dokumentti `users/{uid}/collection/have`, sama muoto ja validointi (T-145). Säännöt deployattiin dev- ja tuotantoprojektiin ennen koodia, ja Digiturva katselmoi muutoksen ilman löydöksiä (Low: vanhalla välimuistiversiolla tehty tilin poisto voi jättää Have-dokumentin pilveen).
3. Omasta listasta jaettu linkki sisältää vain Have- ja Want-listan, ei kokoelmaa (v2-muoto, t = h).
4. **Yksi korostusväri sivua kohden:** osion väri (Kortit keltainen, Kokoelma vihreä, Pakat punainen, Have/Want sininen, Proxy neutraali) hoitaa kaiken korostuksen: otsikon viivan, navigaation, valitut vaihtoehdot (sävytetty tausta ja alaviiva, ei täyttä värilaattaa), pääpainikkeet, laskurien + ja linkkien alleviivaukset. Muut värit vain merkityksen mukaan (vihreä = laillinen tai valmis, oranssi = puuttuu, punainen = virhe) ja korttien pelivärit datana. Want- ja Have-laskurit erotetaan merkeillä (★, ⇄), ei värillä.
