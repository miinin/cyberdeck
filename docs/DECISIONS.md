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
