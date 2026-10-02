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
