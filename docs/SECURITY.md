# SECURITY · cyberdeck

> Omistaja: Digiturva. Päivitetty 2026-09-30 (T-001, suunnittelu ennen toteutusta).
> Uhkamalli kattaa tällä hetkellä **MVP-0:n**: staattinen sivusto Firebase Hostingissa, selain hakee korttidatan suoraan Netdeck.gg:n julkisesta rajapinnasta, julkaisu GitHub Actionsilla. Malli päivitetään, kun mukaan tulee tallennus, kirjautuminen tai jaettavat linkit (MVP-1/MVP-2).

## 1. Järjestelmä MVP-0:ssa

```
 Käyttäjän selain ──HTTPS GET──► api.netdeck.gg/api/cards/cyberpunk   (kolmas osapuoli, epäluotettava data)
       ▲                        (myöhemmin mahdollisesti: dstcynss47vun.cloudfront.net, korttikuvat)
       │ HTTPS (staattiset tiedostot, dist/)
 Firebase Hosting (cyberdeck-tcg: sivustot prod ja test, esikatselukanavat)
       ▲
       │ firebase deploy (palvelutili github-deploy, avain GitHub-salaisuutena)
 GitHub Actions (deploy-prod.yml: main, deploy-test.yml: test, preview.yml: PR:t)
       ▲
       │ git push (käyttäjä ja agentit)
 GitHub-repo miinin/cyberdeck (npm-riippuvuudet npm-rekisteristä)
```

Todennettu 2026-09-30 (curl, vain luku):
- Rajapinta palauttaa `{items, total, limit, offset}`. `total` = 151. Sivun enimmäiskoko on 100 (pyyntö `limit=500` palautti `limit: 100`).
- CORS: rajapinta heijastaa minkä tahansa `Origin`-otsakkeen ja lähettää `Access-Control-Allow-Credentials: true`. Meidän kannaltamme tämä tarkoittaa, että kutsut toimivat, mutta **evästeitä tai tunnisteita ei saa lähettää** (katso SR-4).
- `Cache-Control: private, no-store` eli selain ei välimuistita vastausta.
- `rules_text` sisältää merkintöjä kuten `{Call}` ja `{Go Solo}` sekä rivinvaihtoja. Niitä on houkuttelevaa muuttaa HTML:ksi (ikonit, lihavoinnit), mikä on XSS-riskin tyypillinen syntykohta.
- `image_url` on allekirjoitettu, aikarajattu CloudFront-linkki (`dstcynss47vun.cloudfront.net`).
- Firebase Hosting lähettää jo `Strict-Transport-Security: max-age=31556926; includeSubDomains; preload` (*.web.app on HSTS-preload-listalla). Muita turvallisuusotsakkeita ei ole asetettu.

## 2. Suojattavat asiat

| Asia | Miksi tärkeä | Missä |
|---|---|---|
| Sivuston eheys (prod ja test) | Käyttäjät luottavat siihen, että sivu on meidän tekemämme. Kaapattu sivu voi levittää haittakoodia. | Firebase Hosting |
| Julkaisuoikeus: palvelutilin avain `FIREBASE_SERVICE_ACCOUNT_CYBERDECK_TCG` | Avaimella voi julkaista mitä tahansa tuotantoon ja testiin | GitHub Secrets, Actions-ajot |
| Repon eheys ja GitHub-token | Workflowt ajavat repon koodia salaisuuksien kanssa | GitHub |
| Toimitusketju (npm-paketit, Actions) | Paketin install- tai build-skripti ajetaan salaisuuksien kanssa samassa jobissa | npm, GitHub Actions |
| Käyttäjän selainistunto | Myöhemmin (MVP-1) selaimen tallennustilassa kokoelma ja pakat | Selain |
| Saatavuus | Ilman rajapintaa ei ole korttilistaa | Netdeck.gg |

## 3. Luottamusrajat

1. **Netdeck.gg → selain.** Kaikki rajapinnan data (nimet, `rules_text`, `keywords`, `classifications`, `set.name`, `image_url`, luvut) on **epäluotettavaa syötettä**. Rajapinta voi muuttua, rikkoutua tai kaapatuksi joutuessaan palauttaa haitallista sisältöä. Tätä ei validoida palvelimella, koska palvelinta ei ole, joten validointi ja turvallinen tulostus tehdään selaimessa rajapintakerroksessa.
2. **npm-rekisteri → build.** Riippuvuudet ajetaan CI:ssä samassa jobissa, jossa julkaisusalaisuus on saatavilla.
3. **Repon haarat → Actions.** Kuka tahansa, jolla on push-oikeus (käyttäjä ja agentit), voi muuttaa workflow-tiedostoa tehtävähaarassa, ja `preview.yml` ajaa sen salaisuuksien kanssa.
4. **Firebase Hosting → selain.** Hosting on luotettu, mutta sivun omat otsakkeet (CSP ym.) ovat viimeinen puolustuslinja, jos rajan 1 käsittely pettää.

## 4. Hyökkääjäprofiilit

- **Kaapattu tai virheellinen ulkoinen rajapinta:** palauttaa kentissä HTML:ää tai skriptiä, jättimäisiä vastauksia tai loputtoman sivutuksen.
- **Toimitusketjuhyökkääjä:** haitallinen versio npm-paketista tai Actionista (tag siirretään).
- **Harhautettu agentti (prompt injection):** agentti lukee verkosta tai rajapinnasta "ohjeita" ja muuttaa workflowta tai lisää riippuvuuden.
- **Satunnainen verkkokäyttäjä:** yrittää upottaa sivun (clickjacking) tai hyödyntää XSS:ää. MVP-0:ssa ei ole suojattavaa käyttäjädataa, mutta MVP-1:ssä on.

## 5. STRIDE MVP-0:lle

| Luokka | Uhka | Todennäköisyys / vaikutus | Torjunta (vaatimus) |
|---|---|---|---|
| **S** Spoofing | Väärennetty rajapinta (DNS/MITM) | Pieni / Keskisuuri | Vain `https://api.netdeck.gg`, kovakoodattu vakio yhdessä paikassa, CSP `connect-src` (SR-2, SR-4) |
| **S** | Joku julkaisee palvelutilin avaimella omaa sisältöään | Pieni / Suuri | Avain vain GitHub Secretsissa, suppeat roolit (D-001), tuotantoavain Environment-suojauksen taakse (SR-9, R-4) |
| **T** Tampering | XSS rajapinnan datasta (`rules_text`, nimet) → sivun sisällön muuttaminen, myöhemmin kokoelmadatan varastaminen tai muuttaminen | Pieni nyt, kasvaa / Suuri | Tulostus vain tekstinä, ei `innerHTML` (SR-1), CSP ilman `unsafe-inline` (SR-2) |
| **T** | Haitallinen npm-paketti tai Action muuttaa buildin tulosta tai varastaa avaimen | Pieni / Suuri | Lukittu `package-lock.json`, `npm ci`, `npm audit`, riippuvuuksien minimointi, Actions SHA-lukitus (SR-6, SR-7, SR-8) |
| **T** | Workflow-muutos tehtävähaarassa julkaisee tuotantoon PR-esikatselun kautta | Pieni / Suuri | Workflow-muutokset aina Digiturvan katselmointiin, tuotantosalaisuus Environmentiin (SR-9, R-4) |
| **R** Repudiation | Kuka julkaisi mitä? | Pieni / Pieni | Git-historia ja Actions-lokit riittävät MVP-0:ssa. Force push estetty hookilla (D-001). |
| **I** Information disclosure | Salaisuus repossa tai lokissa | Pieni / Suuri | Ei `.env`-tiedostoja repoon (`.gitignore` kunnossa), ei salaisuuksien tulostusta CI:ssä (SR-10) |
| **I** | Tekninen virheviesti (stack trace, rajapinnan URL tai vastaus) käyttäjälle | Keskisuuri / Pieni | Yleinen virheilmoitus, tekninen tieto vain `console.error`iin ilman henkilötietoja (SR-5) |
| **I** | Referer-otsake vuotaa sivun osoitteen (myöhemmin mahdollisesti jakolinkin tunnisteen) kolmansille osapuolille | Pieni / Pieni nyt | `Referrer-Policy` (SR-3) |
| **D** Denial of service | Rajapinta ei vastaa tai jumittaa → loputon lataus | Keskisuuri / Keskisuuri | Aikakatkaisu, virhetila (SR-5) |
| **D** | Virheellinen `total` tai sivutus → loputon silmukka, tuhansia pyyntöjä rajapintaan | Pieni / Keskisuuri (myös meidän maineemme rajapinnan ylläpitäjän silmissä) | Sivumäärän yläraja, keskeytys kun sivu on tyhjä (SR-5) |
| **E** Elevation of privilege | XSS antaa hyökkääjälle sivun oikeudet (MVP-1:ssä pääsy tallennettuun dataan) | Pieni / Suuri | SR-1, SR-2 |
| **E** | Workflown `GITHUB_TOKEN`illa on oletuksena laajat oikeudet (deploy-prod ja deploy-test eivät rajaa `permissions`-avainta) | Pieni / Keskisuuri | Vähimmät oikeudet jokaiseen workflowhun (SR-9) |

## 6. Turvavaatimukset (SR)

Nämä ovat T-001:n turvavaatimukset. PM kirjaa ne tehtäväkorttiin hyväksymiskriteereiksi. Niitä sovelletaan myös kaikkiin myöhempiin tehtäviin, ellei toisin päätetä.

**SR-1 · Ulkoinen data tulostetaan vain tekstinä.**
- Kaikki rajapinnan kentät renderöidään tekstisolmuina (`textContent`, tai kehyksen oletusarvoinen tekstin interpolointi, joka enkoodaa automaattisesti).
- Kiellettyä rajapinnan datalla: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `dangerouslySetInnerHTML`, `v-html`, `{@html}`, `eval`, `new Function`, merkkijono `setTimeout`/`setInterval`-kutsuissa.
- Jos `rules_text`:n merkinnät (`{Call}` ym.) halutaan myöhemmin muotoilla, se tehdään jäsentämällä teksti tokeneiksi ja rakentamalla elementit ohjelmallisesti (sallittujen merkintöjen lista), ei HTML-merkkijonolla.
- Rajapinnan URL-kenttiä (esim. `image_url`) ei käytetä `href`-attribuutissa. Jos niitä käytetään `src`-attribuutissa (vasta, kun kuvien käyttö on hyväksytty), protokollan on oltava `https:` ja isännän sallittujen listalla.
- Lint-sääntö estää kielletyt kutsut (esim. ESLintin `no-restricted-properties`/`no-restricted-syntax` innerHTML-sijoituksille ja kehyksen oma sääntö, kuten `react/no-danger` tai `vue/no-v-html`), ja yksikkötesti todentaa, että nimi `<img src=x onerror=alert(1)>` näkyy kirjaimellisena tekstinä.

**SR-2 · Content-Security-Policy firebase.jsonissa** (molemmat sivustot, `prod` ja `test`, `headers`-lohko lähteelle `**`):
```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self' https://api.netdeck.gg;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```
- Ei `'unsafe-inline'`- eikä `'unsafe-eval'`-lähteitä. Build ei saa tuottaa inline-skriptejä `index.html`:ään. (Vite ja vastaavat tuottavat oletuksena ulkoiset tiedostot. Jos kehys vaatii inline-tyylejä, Koodari pyytää poikkeusta Digiturvalta ennen käyttöä.)
- Ei ulkoisia fontteja, CDN-skriptejä eikä analytiikkaa (myös tietosuojasyy). Kaikki paketoidaan buildiin.
- Jos korttikuvat hyväksytään myöhemmin, `img-src`-listaan lisätään vain `https://dstcynss47vun.cloudfront.net` erillisellä päätöksellä.
- Todennus: esikatselu-URL:ssa selaimen konsolissa ei ole CSP-virheitä ja `curl -sI <esikatselu-URL>` näyttää otsakkeen.

**SR-3 · Muut turvallisuusotsakkeet firebase.jsonissa** (sama `headers`-lohko):
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer` (rajapinta ei tarvitse tietoa lähettäjästä; tietojen minimointi)
- `X-Frame-Options: DENY` (vanhojen selainten tuki, `frame-ancestors` kattaa uudet)
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`
- `Cross-Origin-Opener-Policy: same-origin`
- HSTS:ää ei tarvitse lisätä: Firebase Hosting asettaa sen jo *.web.app-osoitteissa (todennettu). Jos myöhemmin otetaan käyttöön oma verkkotunnus, HSTS tarkistetaan uudelleen.

**SR-4 · Rajapintakutsut vain yhdestä kerroksesta ja ilman tunnisteita.**
- Perus-URL `https://api.netdeck.gg/api/cards/cyberpunk` on vakiona yhdessä paikassa rajapintakerroksessa. Ei käyttäjän syötteestä tai URL-parametreista koottua osoitetta.
- `fetch`-kutsuissa `credentials: 'omit'` (rajapinta sallii evästeet mille tahansa originille, joten niitä ei saa lähettää) ja `referrerPolicy: 'no-referrer'`.
- Ei API-avaimia tai muita salaisuuksia selainkoodissa. Jos rajapinta joskus vaatii avaimen, se ei kuulu staattiseen sivustoon (uusi arkkitehtuuripäätös).
- Vastauksen muoto tarkistetaan: `items` on taulukko, `total` on ei-negatiivinen kokonaisluku, ja jokainen käytetty kenttä on odotettua tyyppiä. Odottamaton kenttä tai tyyppi ei kaada sovellusta: kortti ohitetaan tai kenttä näytetään tyhjänä, ja virhe kirjataan konsoliin.

**SR-5 · Kestävyys ja virheet.**
- Jokaisella pyynnöllä on aikakatkaisu (esim. `AbortController`, 10–15 s).
- Sivutussilmukalla on kova yläraja (esim. enintään 20 sivua tai `ceil(total/limit)+1`, kumpi pienempi) ja se pysähtyy, jos sivu on tyhjä tai `offset` ei kasva. Pyynnöt tehdään peräkkäin tai pienellä rinnakkaisuudella (enintään 2–3 kerrallaan), ei rajattomasti.
- Automaattisia uusintayrityksiä enintään yksi per pyyntö. Ei loputonta uudelleenyrittämistä.
- Käyttäjälle näytetään yleinen, ymmärrettävä virheilmoitus (UX:n mikrokopio). Ei stack tracea, HTTP-vastauksen runkoa eikä sisäisiä polkuja. Tekninen tieto `console.error`iin.
- Yksikkötestit kattavat: aikakatkaisu, HTTP 500, virheellinen JSON, `total` suurempi kuin todellinen datamäärä (silmukka pysähtyy rajaan).

**SR-6 · Riippuvuudet.**
- Jokainen uusi suora riippuvuus kirjataan tehtäväkorttiin: nimi, versio, lisenssi, ylläpidon tila (viimeisin julkaisu) ja perustelu. Mieluummin vähän riippuvuuksia: MVP-0 ei tarvitse esim. HTTP-kirjastoa (`fetch` riittää) eikä tilanhallintakirjastoa.
- `package-lock.json` commitoidaan, ja CI käyttää `npm ci`:tä (jo käytössä).
- `npm audit --audit-level=high` ei saa löytää High- tai Critical-haavoittuvuuksia tuotantoriippuvuuksista luovutushetkellä. Tulos kirjataan luovutukseen. Kehitysriippuvuuksien löydökset kirjataan ja arvioidaan erikseen.
- Ei riippuvuuksia, joilla on `postinstall`-skripti, ilman perustelua (tarkistus: `npm ci` -tuloste tai `npm query ':attr(scripts, [postinstall])'`).

**SR-7 · Ei tekstiä tai dataa ulkoisista palveluista buildissa.** Build ei hae mitään verkosta (ei rajapintakutsuja build-vaiheessa, ei etäfontteja). Näin buildi on toistettava eikä kolmas osapuoli pääse vaikuttamaan julkaistuun pakettiin.

**SR-8 · GitHub Actions: vähimmät oikeudet.**
- Jokaiseen workflowhun `permissions`-lohko. `deploy-prod.yml` ja `deploy-test.yml`: `contents: read` (lisäksi `checks: write` vain, jos `action-hosting-deploy` sitä live-kanavalle tarvitsee; muuten `repoToken` voi jäädä pois live-julkaisuista). `preview.yml`: nykyinen (`checks: write`, `contents: read`, `pull-requests: write`) on sopiva.
- `preview.yml`:n ehto `head.repo.full_name == github.repository` säilytetään (estää forkkien PR:iä käyttämästä salaisuuksia). Triggeriä ei vaihdeta `pull_request_target`iksi.
- Workflowissa ei käytetä PR:n otsikkoa, haaran nimeä tai muuta käyttäjän syötettä `run:`-komennoissa (script injection).
- Suositus (ei blokkaa T-001:tä): kolmannen osapuolen Actionit lukitaan commit-SHA:han tagin sijaan (`FirebaseExtended/action-hosting-deploy@<sha> # v0.x`). Dependabot pitää ne ajan tasalla. Kirjattu riskiksi R-3.

**SR-9 · Workflow- ja julkaisuasetusten muutokset katselmoidaan aina.** Jokainen muutos `.github/workflows/`-hakemistoon, `firebase.json`:iin tai `.firebaserc`:hen vaatii Digiturvan katselmoinnin, vaikka tehtävä ei muuten olisi riskialtis.

**SR-10 · Salaisuudet.** Ei salaisuuksia repoon, koodiin, lokeihin tai dokumentaatioon (rules.md 10). CI:ssä ei tulosteta ympäristömuuttujia (`env`, `printenv`, `set -x` salaisuuksien kanssa). Firebase-verkkosovelluksen konfiguraatio (apiKey ym.) ei ole salaisuus, mutta MVP-0 ei sitä tarvitse, eikä Firebase JS SDK:ta oteta käyttöön ennen kuin sille on tehtävä.

## 7. Korttidata ja korttikuvat: käyttöoikeus

Digiturva ei anna oikeudellista neuvontaa. Alla on se, mitä julkisista lähteistä löytyi 2026-09-30, ja johtopäätökset riskinä.

| Lähde | Havainto |
|---|---|
| cyberpunktcg.com/terms-of-service (WeirdCo) | Kaikki sisältö, mukaan lukien tavaramerkit ja logot, on "Cyberpunk TCG:n" omaisuutta. Kielletty toiminta: "bots or scraping tools to extract data". Rajapintaa, korttikuvia tai fanityökaluja ei mainita erikseen. |
| cyberpunktcg.com/creators | Fanituotoksia ei saa myydä, monetisoida, lisensoida eikä käyttää maksullisen pääsyn takana ilman WeirdCon kirjallista lupaa. Virallisia markkinointimateriaaleja (myös korttikuvia) kehotetaan käyttämään sisällöntuotannossa uusimpina versioina. Fanityökaluista (deckbuilderit, sovellukset) ei ole erillistä ohjetta. |
| CD PROJEKT RED Fan Content Guidelines | Ei-kaupallinen käyttö, vaatii tekstin "This is an unofficial fan work and is not approved/endorsed by CD PROJEKT RED". Kieltää mm. videopelin tai mobiilisovelluksen, joka perustuu CDPR:n peleihin, ja tavaramerkin verkkotunnuksessa. Ohje koskee CDPR:n omia pelejä; ei ole selvää, koskeeko se WeirdCon lisensoimaa korttipeliä. |
| netdeck.gg | Käyttöehtoja tai rajapinnan käyttöehtoja ei löytynyt (netdeck.gg/terms ei ole ehtosivu). Rajapinta on avoin, ilman avainta, CORS sallii kaikki originit. |
| cyberpunk-tcg-news.de (2026-04-17, ei lähdeviitteitä) | Kirjoittajan tulkinta: WeirdCo sietää verkossa toimivia deckbuildereita, jotka eivät jaa suojattuja kuvia; Steamin TTS-modi, jossa oli korttikuvat, poistettiin. Yksi palvelu kertoo saaneensa luvan CDPR:ltä ja WeirdCoilta. **Toissijainen lähde, ei virallinen kanta.** |

**Arvio (Epävarma, vaatii käyttäjän päätöksen):**
- **Korttikuvat:** käyttöoikeutta ei löytynyt. Kuvat ovat tekijänoikeudella suojattua taidetta, ja allekirjoitetut aikarajatut linkit viittaavat siihen, että kuvia ei ole tarkoitettu vapaasti upotettaviksi. **Suositus: MVP-0 ja MVP-1 ilman korttikuvia** (tekstipohjainen lista, kuten kortti jo rajaa). Kuvia ei ladata, välimuistiteta eikä kopioida omaan Hostingiin. Kuvat otetaan käyttöön vasta, jos WeirdCo tai Netdeck antaa luvan tai julkaisee fanityökaluille ehdot.
- **Korttidata (nimet, tyypit, hinnat, säännöt):** pelimekaaninen tieto on todennäköisesti pienempi riski kuin kuvat, ja moni fanityökalu käyttää sitä. Kuitenkin cyberpunktcg.com:n ehdot kieltävät datan keräämisen boteilla tai scrapingilla. On epäselvää, koskeeko ehto suoraa selainkutsua Netdeckin julkiseen rajapintaan (käyttäjän selain hakee datan samasta rajapinnasta kuin virallinen sivusto). Riski on sitä pienempi, mitä vähemmän dataa tallennamme ja mitä maltillisemmin kutsumme rajapintaa (SR-5).
- **Merkinnät:** suositellaan sivun alaosaan teksti tyyliin "Epävirallinen fanityö. Ei WeirdCon, Netdeck.gg:n eikä CD PROJEKT REDin hyväksymä tai tukema. Korttitiedot: Netdeck.gg." (Sisällöntuottaja muotoilee.) Ei virallisia logoja. Palvelun nimi tai verkkotunnus ei saa näyttää viralliselta (nykyinen `cyberdeck-tcg` ei sisällä tavaramerkkiä "Cyberpunk").
- **Ei kaupallisuutta:** ei mainoksia eikä maksullisia ominaisuuksia ilman WeirdCon kirjallista lupaa.

## 8. Tietosuoja MVP-0:ssa

MVP-0 **ei käsittele henkilötietoja**: ei kirjautumista, lomakkeita, evästeitä, analytiikkaa eikä selaimen tallennustilaa. Siksi `docs/PRIVACY.md`:tä ei vielä luoda.

Huomiot:
- Käyttäjän selain ottaa suoraan yhteyttä `api.netdeck.gg`:hen, jolloin Netdeck näkee käyttäjän IP-osoitteen ja selaimen tiedot. Tämä on kolmannen osapuolen tiedonsaanti, joka kirjataan PRIVACY.md:hen, kun se luodaan. `Referrer-Policy: no-referrer` ja `credentials: 'omit'` minimoivat vuotavaa tietoa.
- Firebase Hosting kirjaa pyyntölokeja (IP-osoitteet) Googlen infrastruktuuriin. Kirjataan PRIVACY.md:hen.
- **PRIVACY.md luodaan viimeistään MVP-1:ssä**, kun kokoelma ja pakat tallennetaan (selaimen tallennustila tai tietokanta), ja ennen MVP-2:ta, jossa kirjautuminen ja kavereiden vaihtolistat tuovat henkilötiedot ja mahdollisesti alaikäiset käyttäjät (eskaloidaan silloin käyttäjälle).

## 9. Avoimet riskit

| ID | Riski | Vakavuus | Omistaja | Tila / torjunta |
|---|---|---|---|---|
| R-1 | Korttikuvien käyttöoikeus tuntematon | Medium (oikeudellinen/maine) | Käyttäjä päättää | Avoin. Kuvat pois, kunnes lupa tai ehdot löytyvät (kohta 7). |
| R-2 | Korttidatan käyttöehdot epäselvät (cyberpunktcg.com kieltää scrapingin, Netdeckin ehtoja ei löydy) | Medium | Käyttäjä päättää | Avoin. Maltillinen kutsumäärä, merkinnät, ei kaupallisuutta. Kysymys käyttäjälle. |
| R-3 | Actionit tagilla (`@v4`, `@v0`), ei SHA-lukitusta | Low | Koodari (velka) | Avoin. Ehdotus: `[velka]`-tehtävä, Dependabot. |
| R-4 | Palvelutilin avain on kaikkien workflowjen käytössä. Tehtävähaaran PR voi muuttaa `preview.yml`:ää ja julkaista `channelId: live` tuotantoon. | Medium | PM / käyttäjä | Avoin. Torjunta nyt: SR-9 (workflow-muutokset aina katselmointiin) ja suojaushook. Ehdotus: GitHub Environment `production` (vain main-haara, käyttäjän hyväksyntä) ja erillinen salaisuus prod-julkaisulle. Vaatii käyttäjän toimenpiteen GitHubin asetuksissa. |
| R-5 | Build-jobissa ajetaan npm-pakettien install-skriptejä samassa jobissa kuin julkaisusalaisuus | Low–Medium | Koodari / Arkkitehti | Avoin. Riippuvuuksien minimointi, `npm audit`, lukitus (SR-6). Myöhemmin mahdollisesti build ja julkaisu eri jobeihin (artefaktin välitys). |
| R-6 | Netdeck.gg-rajapinta muuttuu tai katoaa (PROJECT.md) | Medium (saatavuus) | Arkkitehti | Avoin. Eristetty rajapintakerros ja skeemantarkistus (SR-4). |
| R-7 | Rajapinta sallii evästeet mille tahansa originille (`ACAO` heijastettu + `Allow-Credentials: true`). Koskee Netdeckin omia käyttäjiä, ei meitä, kunhan emme lähetä tunnisteita. | Info | – | Havainto. Ei testattu eikä hyödynnetty. SR-4 estää meidän osuutemme. |

## 10. Hyväksytyt riskit

Ei yhtään. Vain käyttäjä voi hyväksyä riskin (rules.md 8).

## 11. Muutosloki

| Päivä | Muutos | Tehtävä |
|---|---|---|
| 2026-09-30 | Ensimmäinen versio: MVP-0:n uhkamalli, turvavaatimukset SR-1–SR-10, korttikuvien ja -datan käyttöoikeusarvio, avoimet riskit R-1–R-7 | T-001 |
