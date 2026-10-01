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
