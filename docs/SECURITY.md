# SECURITY · cyberdeck

> Omistaja: Digiturva. Päivitetty 2026-10-02 (T-026: korttidata buildissa, D-012 ja D-013).
> **T-026 (D-013) muuttaa luvun 1 mallia:** selain ei enää kutsu Netdeck.gg:tä. Korttidata (`src/data/cards.json`) on buildin mukana, ja kehittäjä päivittää sen käsin komennolla `npm run cards:update`, joka kutsuu rajapintaa Nodessa (luottamusraja 1 siirtyy kehittäjän koneelle, katso luku 14). Lukujen 1–8 Netdeck-kohdat koskevat siitä lähtien vain päivityskomentoa.
> Luvut 1–10 kattavat **MVP-0:n**: staattinen sivusto Firebase Hostingissa, selain hakee korttidatan suoraan Netdeck.gg:n julkisesta rajapinnasta, julkaisu GitHub Actionsilla. **Luku 11** laajentaa mallin MVP-1:een (kokoelma ja pakat selaimen tallennustilassa, .txt- ja .json-tuonti ja -vienti, SR-11–SR-19). **Luku 12** ennakoi MVP-2:n Firebase-kirjautumisen (avoimet vaatimukset). Tietosuoja: `docs/PRIVACY.md`.

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
- Firebase Hosting lähettää jo `Strict-Transport-Security: max-age=31556926; includeSubDomains; preload` (*.web.app on HSTS-preload-listalla). ~~Muita turvallisuusotsakkeita ei ole asetettu.~~ → T-001 lisäsi CSP:n ja SR-3:n otsakkeet `firebase.json`iin. Todennettu esikatselusta 2026-10-01 (SEC-001).

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
connect-src 'self';
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
- ~~`connect-src 'self' https://api.netdeck.gg`~~ → `connect-src 'self'` (T-026, D-013 osa 3, 2026-10-02). `'self'` valittu `'none'`n sijaan, koska Viten modulepreload-polyfill tekee saman originin `fetch`-kutsuja, ja se jättää tien auki MVP-2:lle. Uusi ulkoinen osoite `connect-src`iin vain SR-9:n katselmoinnilla.

**SR-3 · Muut turvallisuusotsakkeet firebase.jsonissa** (sama `headers`-lohko):
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer` (rajapinta ei tarvitse tietoa lähettäjästä; tietojen minimointi)
- `X-Frame-Options: DENY` (vanhojen selainten tuki, `frame-ancestors` kattaa uudet)
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`
- `Cross-Origin-Opener-Policy: same-origin`
- HSTS:ää ei tarvitse lisätä: Firebase Hosting asettaa sen jo *.web.app-osoitteissa (todennettu). Jos myöhemmin otetaan käyttöön oma verkkotunnus, HSTS tarkistetaan uudelleen.

**SR-4 · Rajapintakutsut vain yhdestä kerroksesta ja ilman tunnisteita.** (T-026: koskee vain `npm run cards:update` -komentoa. ESLint estää `src/api`:n importin sovelluskoodissa, eikä `dist/` sisällä Netdeck-osoitetta.)
- Perus-URL `https://api.netdeck.gg/api/cards/cyberpunk` on vakiona yhdessä paikassa rajapintakerroksessa. Ei käyttäjän syötteestä tai URL-parametreista koottua osoitetta.
- `fetch`-kutsuissa `credentials: 'omit'` (rajapinta sallii evästeet mille tahansa originille, joten niitä ei saa lähettää) ja `referrerPolicy: 'no-referrer'`.
- Ei API-avaimia tai muita salaisuuksia selainkoodissa. Jos rajapinta joskus vaatii avaimen, se ei kuulu staattiseen sivustoon (uusi arkkitehtuuripäätös).
- Vastauksen muoto tarkistetaan: `items` on taulukko, `total` on ei-negatiivinen kokonaisluku, ja jokainen käytetty kenttä on odotettua tyyppiä. Odottamaton kenttä tai tyyppi ei kaada sovellusta: kortti ohitetaan tai kenttä näytetään tyhjänä, ja virhe kirjataan konsoliin.

**SR-5 · Kestävyys ja virheet.** (T-026: koskee päivityskomentoa. Sama `fetchAllCards` aikakatkaisuineen, sivukattoineen ja rinnakkaisuusrajoineen; yksi ajo = 3 pyyntöä. Komento ei kirjoita tiedostoa, jos yksikin kortti hylätään tai määrä poikkeaa.)
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

**SR-7 · Ei tekstiä tai dataa ulkoisista palveluista buildissa.** Build ei hae mitään verkosta (ei rajapintakutsuja build-vaiheessa, ei etäfontteja). Näin buildi on toistettava eikä kolmas osapuoli pääse vaikuttamaan julkaistuun pakettiin. **T-026:** `npm run cards:update` on kehittäjän käsin ajama komento, ei osa `build`-skriptiä tai workflowta. Sen tulos (`src/data/cards.json`) validoidaan ennen kirjoitusta ja katselmoidaan PR:ssä diffinä, joten SR-7 säilyy.

**SR-8 · GitHub Actions: vähimmät oikeudet.**
- Jokaiseen workflowhun `permissions`-lohko. `deploy-prod.yml` ja `deploy-test.yml`: `contents: read` (lisäksi `checks: write` vain, jos `action-hosting-deploy` sitä live-kanavalle tarvitsee; muuten `repoToken` voi jäädä pois live-julkaisuista). `preview.yml`: nykyinen (`checks: write`, `contents: read`, `pull-requests: write`) on sopiva.
- `preview.yml`:n ehto `head.repo.full_name == github.repository` säilytetään (estää forkkien PR:iä käyttämästä salaisuuksia). Triggeriä ei vaihdeta `pull_request_target`iksi.
- Workflowissa ei käytetä PR:n otsikkoa, haaran nimeä tai muuta käyttäjän syötettä `run:`-komennoissa (script injection).
- Suositus (ei blokkaa T-001:tä): kolmannen osapuolen Actionit lukitaan commit-SHA:han tagin sijaan (`FirebaseExtended/action-hosting-deploy@<sha> # v0.x`). Dependabot pitää ne ajan tasalla. Kirjattu riskiksi R-3.

**SR-9 · Workflow- ja julkaisuasetusten muutokset katselmoidaan aina.** Jokainen muutos `.github/workflows/`-hakemistoon, `firebase.json`:iin tai `.firebaserc`:hen vaatii Digiturvan katselmoinnin, vaikka tehtävä ei muuten olisi riskialtis.

**Toteutuksen tila 2026-10-01:** SR-1–SR-10 täyttyvät T-001:n toteutuksessa (SEC-001). Avoimet puolustuksen syventämisen löydökset: SEC-002 (SR-1:n lint-kiertotiet, Low, R-8) ja SEC-003 (`persist-credentials`, Low, R-9).

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

MVP-0 **ei käsittele henkilötietoja**: ei kirjautumista, lomakkeita, evästeitä, analytiikkaa eikä selaimen tallennustilaa. ~~Siksi `docs/PRIVACY.md`:tä ei vielä luoda.~~ → `docs/PRIVACY.md` luotu 2026-10-01 (T-011), ja se kattaa myös alla olevat huomiot.

Huomiot:
- **T-026:sta alkaen (D-013) käyttäjän selain ei ota yhteyttä Netdeckiin**, vaan Netdeck näkee vain kehittäjän IP-osoitteen, kun `cards:update` ajetaan. Alkuperäinen huomio: ~~käyttäjän selain ottaa suoraan yhteyttä `api.netdeck.gg`:hen, jolloin Netdeck näkee käyttäjän IP-osoitteen ja selaimen tiedot.~~ Tämä on kolmannen osapuolen tiedonsaanti, joka kirjataan PRIVACY.md:hen, kun se luodaan. `Referrer-Policy: no-referrer` ja `credentials: 'omit'` minimoivat vuotavaa tietoa.
- Firebase Hosting kirjaa pyyntölokeja (IP-osoitteet) Googlen infrastruktuuriin. Kirjataan PRIVACY.md:hen.
- **PRIVACY.md luodaan viimeistään MVP-1:ssä**, kun kokoelma ja pakat tallennetaan (selaimen tallennustila tai tietokanta), ja ennen MVP-2:ta, jossa kirjautuminen ja kavereiden vaihtolistat tuovat henkilötiedot ja mahdollisesti alaikäiset käyttäjät (eskaloidaan silloin käyttäjälle).

## 9. Avoimet riskit

| ID | Riski | Vakavuus | Omistaja | Tila / torjunta |
|---|---|---|---|---|
| R-1 | Korttikuvien käyttöoikeus tuntematon | Medium (oikeudellinen/maine) | Käyttäjä päättää | ~~Avoin~~ → **Hyväksytty** (käyttäjä, D-012, 2026-10-02): kuvat omalla julkisella palvelimella. Katso luku 10. Tekninen toteutus T-027 (D-013 osa 4: kuvat Viten assetteina, `img-src 'self'` riittää, `image_url`ia ei käytetä). Aiempi tila: Käyttäjän päätös (D-006): kuvia ei näytetä T-001:ssä, vaan käyttäjä tuo kuvat käyttöön myöhemmin omana tehtävänään. Siihen asti kuvat pois (T-001 todennettu: `image_url` ei pääse malliin, CSP `img-src 'self' data:`). Kuvatehtävä vaatii Digiturvan suunnittelun: kuvien lähde ja käyttöoikeus, `img-src`-muutos (SR-2) ja ettei rajapinnan URL-kenttää käytetä tarkistamatta (SR-1). |
| R-2 | Korttidatan käyttöehdot epäselvät (cyberpunktcg.com kieltää scrapingin, Netdeckin ehtoja ei löydy) | Medium | Käyttäjä | ~~Avoin~~ → **Hyväksytty** (käyttäjä, D-006, 2026-09-30) → laajennettu (käyttäjä, D-012, 2026-10-02): data jaetaan omalta palvelimelta. Katso luku 10. |
| R-3 | Actionit tagilla (`@v4`, `@v0`), ei SHA-lukitusta | Low | Koodari (velka) | Avoin. Ehdotus: `[velka]`-tehtävä, Dependabot. |
| R-4 | ~~Palvelutilin avain on kaikkien workflowjen käytössä.~~ T-054a0:sta alkaen PR- ja test-workflowt käyttävät testiprojektin avainta, ja tuotannon avain on vain `deploy-prod.yml`:ssä. Se on kuitenkin yhä repotason salaisuus: tehtävähaaran PR voi muuttaa `preview.yml`:n viittaamaan siihen ja julkaista tuotantoon (SEC-035). | Low (oli Medium, SEC-012) | PM / käyttäjä | Avoin. Torjunta nyt: SR-9 (workflow-muutokset aina katselmointiin) ja suojaushook. Ehdotus: GitHub Environment `production` (vain main-haara, käyttäjän hyväksyntä) ja erillinen salaisuus prod-julkaisulle. Vaatii käyttäjän toimenpiteen GitHubin asetuksissa. |
| R-5 | Build-jobissa ajetaan npm-pakettien install-skriptejä samassa jobissa kuin julkaisusalaisuus | Low–Medium | Koodari / Arkkitehti | Avoin. Riippuvuuksien minimointi, `npm audit`, lukitus (SR-6). Myöhemmin mahdollisesti build ja julkaisu eri jobeihin (artefaktin välitys). |
| R-6 | Netdeck.gg-rajapinta muuttuu tai katoaa (PROJECT.md) | ~~Medium~~ → Low (saatavuus) | Arkkitehti | **Pienennetty (T-026, SEC-005-t026):** sovellus toimii ilman rajapintaa, koska data on buildissa. Rajapinnan muutos tai katoaminen estää vain datan päivityksen: `cards:update` epäonnistuu (exit 1) eikä koske tiedostoon. Jäännös: uusia kortteja ei saada ilman uutta lähdettä. Eristetty rajapintakerros ja skeemantarkistus (SR-4) säilyvät komennossa. |
| R-7 | Rajapinta sallii evästeet mille tahansa originille (`ACAO` heijastettu + `Allow-Credentials: true`). Koskee Netdeckin omia käyttäjiä, ei meitä, kunhan emme lähetä tunnisteita. | Info | – | T-026:sta alkaen ei koske sovellusta (ei selainkutsuja). Havainto. Ei testattu eikä hyödynnetty. SR-4 estää meidän osuutemme (T-001: `credentials: 'omit'` todennettu testillä). |
| R-8 | SR-1:n lint-säännöt eivät tunnista kaikkia HTML-nieluja (SEC-002). Ei hyödynnettävissä nykyisellä koodilla. | Low | Koodari (velka) | Avoin. Korjattava ennen tehtävää, joka muotoilee `rules_text`iä. |
| R-9 | `actions/checkout` jättää GITHUB_TOKENin `.git/config`iin npm-skriptien ajaksi (SEC-003) | Low | Koodari (velka) | ~~Avoin~~ → **Suljettu** (T-004, commit 380d25d: `persist-credentials: false` kaikissa kolmessa workflowssa; SEC-003 Varmistettu 2026-10-02, tarkistettu uudelleen SEC-008-t014:ssä). |
| R-10 | Paikallinen data katoaa ilman käyttäjän toimea: selaimen tietojen tyhjennys, yksityinen ikkuna, toinen laite tai selain sekä Safarin (WebKit ITP) käytäntö poistaa skriptin kirjoittaman tallennustilan, jos sivustolla ei ole käyty noin 7 vuorokauteen | Medium (tietojen menetys) | PM / UX | Avoin. Torjunta MVP-1:ssä: vienti varmuuskopioksi (T-015), käyttäjälle kerrotaan, että tiedot ovat vain tässä selaimessa (UX-mikrokopio), SR-13 (`navigator.storage.persist()` pyydetään, jos tuettu). Pysyvä ratkaisu: pilvitallennus MVP-2:ssa. **T-012 (SEC-003-t012):** muistutus "vain tähän selaimeen" ja pysyvän tallennuksen pyyntö painikkeesta toteutettu. Ilmoitustekstit eivät saa ohjata käyttäjää tyhjentämään selaimen tietoja (SEC-011, SEC-012). Jäljellä: vienti (T-015). |
| R-11 | Usean välilehden kilpailutilanne: kaksi välilehteä kirjoittaa saman avaimen, ja myöhempi kirjoitus hävittää ensimmäisen muutokset | Low–Medium (tietojen menetys) | Arkkitehti / Koodari | Avoin, minimoitu (T-011, SEC-002-katselmointi): tuore luku ennen jokaista kirjoitusta ilman awaitia välissä, muutokset kohdistuvat riviin tai yhteen pakkaan, `storage`-tapahtuman tilaus. Jäljelle jää: vanhentuneessa näkymässä oleva välilehti voi tallentaa pakan vanhan sisällön. T-012 ja T-013 lataavat näkymän uudelleen `subscribe`-kutsun kautta. **T-012 toteutettu (SEC-003-t012):** kokoelma luetaan uudelleen toisen välilehden muutoksesta, omat tallennukset ovat peräkkäisiä, ja vanhat vastaukset hylätään. Jäännös: absoluuttinen määrä vanhentuneesta näkymästä millisekuntien ikkunassa (SEC-013, Info). |
| R-12 | Korttidatan välimuisti (T-003) ja käyttäjän data jakavat saman origin-kohtaisen kiintiön (localStorage noin 5 Mt). Välimuisti voi täyttää tilan, jolloin kokoelman tallennus epäonnistuu. | Low–Medium | Arkkitehti | ~~Avoin~~ → **Poistunut** (T-026, D-013: T-003 korvattu, korttidataa ei tallenneta selaimeen). Aiempi torjunta: Torjunta SR-13: käyttäjän data ensin, välimuisti poistetaan ensimmäisenä kiintiövirheessä, eri avaimet. |
| R-13 | Kaverilta saatu .json- tai .txt-tiedosto on epäluotettava syöte (XSS, jättitiedosto, prototyypin saastutus, olemassa olevan pakan ylikirjoitus) | Medium (ennen torjuntaa) | Koodari | ~~Avoin~~ → **Suljettu** 2026-10-02 (T-015, SEC-010-t015: SR-18 ja SR-19 toteutettu ja todennettu). Torjunta SR-17–SR-19 (T-014, T-015). **T-014 (SEC-008-t014):** teksti- ja .txt-tuonnin torjunta SR-17, SR-14 ja SR-15 toteutettu ja todennettu (kokoraja ennen lukemista, rivi- ja pituusrajat, lineaariset regexit, `Map`-haut, tallennus aina uudeksi pakaksi). Jäljellä: .json-tuonti ja vienti (T-015, SR-18, SR-19). |
| R-14 | Firebase-projektin web-konfiguraatio on luettavissa osoitteesta `/__/firebase/init.json` (B-010). API-avainta ei ole rajattu. | Low nyt, High jos Auth tai Firestore otetaan käyttöön ilman rajauksia | Käyttäjä / Koodari (T-009) | Avoin. **T-054 (SEC-011):** torjunta SR-22 (säännöt ennen dataa, production mode) ja SR-25 (API restrictions, authorized domains); ennakkoehdot MVP2-2 ja MVP2-3 korvattu näillä. Ei hyödynnettävissä MVP-1:ssä, koska sovellus ei käytä Firebase-palveluita Hostingin lisäksi. Ehto ennen MVP-2:ta: luvun 12 vaatimukset MVP2-1–MVP2-3. Polkua ei voi poistaa Hostingista, joten tieto hyväksytään julkiseksi; suojaus perustuu rajauksiin ja sääntöihin. |
| R-15 | Nimistä jää poistamatta LRM, RLM, ALM, U+2028, U+2029 ja U+FEFF (SEC-005, raportti SEC-002-t011) | Low | Koodari | ~~Avoin~~ → **Korjattu** (commit 15812ba, todennettu SEC-003-t012:ssa: `UNSAFE_CHARACTERS` kattaa merkit). |
| R-16 | Kiintiövirhe koetallennuksessa vaihtaa sovelluksen muistinvaraiseen tilaan ja piilottaa tallennetun datan (SEC-006, raportti SEC-002-t011) | Low (kasvaa T-003:n myötä, R-12) | Koodari | ~~Avoin~~ → **Korjattu** (commit 7dc05c5, todennettu SEC-003-t012:ssa: kiintiövirhe koetallennuksessa palauttaa oikean tallennustilan, testi). |
| R-17 | Linkkihaku (T-046, D-015): selain hakee käyttäjän pyynnöstä epäluotettavan JSON-vastauksen osoitteesta `api.netdeck.gg`. Haitallinen tai rikkinäinen vastaus, rajapinnan muutos tai katoaminen, Netdeck näkee käyttäjän IP-osoitteen ja Originin. | Low | Koodari / PM | Avoin, torjuttu SR-20:llä (SEC-009-t046). Jäännös: vastauksen runko luetaan kokonaan ennen kokorajaa, jos Content-Length puuttuu (SEC-023), Netdeckin tietosuojaehtoja ei löydy (PRIVACY.md rivi 9). Linkkihaun katoaminen ei estä tekstituontia (T-014). |
| R-18 | Testi- ja tuotantosivusto käyttävät samaa Firebase-projektia (D-017). Testisivuston koodi (mikä tahansa testiin yhdistetty PR) voi testisivustolle kirjautuneen käyttäjän tokenilla lukea, muuttaa tai poistaa saman käyttäjän tuotantodatan `users/{uid}`, koska säännöt eivät näe pyynnön sivustoa (SEC-030). | Medium | PM / käyttäjä | Avoin, **vaatii käyttäjän hyväksynnän** (PRIVACY K-P8). Torjunta: SR-21 kohta 2 (juuri ei oletuksena `users`), vain kehittäjä ja testaajat kirjautuvat testisivustolle, PR-katselmointi. Pysyvä korjaus: erillinen testiprojekti (MVP2-1, D-017 vaihtoehto D). |
| R-19 | Kuka tahansa Google-käyttäjä voi omalla uid:llään kuluttaa Sparkin päiväkiintiön tai 1 GiB:n, koska säännöt eivät rajaa dokumenttien määrää (SEC-032) | Low | PM / käyttäjä | Avoin. Paikallinen ensin: sovellus toimii, vain synkronointi katkeaa päiväksi. Ei kustannuksia (Spark). Kokorajat SR-22. App Check myöhemmin, jos väärinkäyttöä havaitaan. |
| R-20 | Jaettu tietokone: tilin pakat ja kokoelma jäävät selaimeen uloskirjautuessa (käyttäjän valinta D-017), ja Google-istunto voi jäädä selaimeen | Low | PM / UX | Avoin. Torjunta SR-26 (ilmoitus, `last-uid` poistetaan, `prompt: 'select_account'`, tilin data ei näy uloskirjautuneena, suositus poistopainikkeesta). PRIVACY.md 10.6. |

## 10. Hyväksytyt riskit

Vain käyttäjä voi hyväksyä riskin (rules.md 8).

| ID | Riski | Hyväksyjä ja päivä | Peruste | Ehdot, joiden on pysyttävä voimassa |
|---|---|---|---|---|
| R-1 | Korttikuvat näytetään omalta julkiselta palvelimelta (Firebase Hosting), vaikka käyttöoikeutta ei löytynyt (luku 7) | Käyttäjä, 2026-10-02 (D-012) | Käyttäjän päätös, ei-kaupallinen fanityökalu | Ei kaupallisuutta eikä mainoksia. Epävirallisuusmerkintä näkyvissä. Ei virallisia logoja. Hyväksyntä arvioidaan uudelleen, jos oikeudenhaltija pyytää poistamaan kuvat. Tekniset ehdot tarkistetaan T-027:n katselmoinnissa. |
| R-2 | ~~Korttidata haetaan Netdeck.gg:n julkisesta rajapinnasta käyttäjän selaimessa~~ → korttidata (151 korttia, pelimekaaninen tieto) jaetaan omalta palvelimelta osana sovelluspakettia, ja kehittäjä hakee sen Netdeck.gg:stä käsin ajettavalla komennolla, vaikka käyttöehdot ovat epäselvät | Käyttäjä, 2026-09-30 (D-006); laajennettu 2026-10-02 (D-012) | Sovellus on ei-kaupallinen, siinä on epävirallisuusmerkintä, ja rajapintaa kutsutaan maltillisesti | Ei kaupallisuutta eikä mainoksia. Epävirallisuusmerkintä ja lähdemaininta näkyvissä. Kutsumäärä maltillinen (SR-5: sivukatto, rinnakkaisuus enintään 3, ei automaattisia uusintayrityksiä; T-026:sta alkaen 3 pyyntöä per kehittäjän ajo, ei käyttäjien pyyntöjä). ~~Dataa ei kopioida omaan Hostingiin.~~ → kumottu D-012:lla: data on buildissa, mutta vain `Card`-mallin kentät (ei sääntötekstejä, kuvia eikä `image_url`ia). Hyväksyntä arvioidaan uudelleen, jos WeirdCo tai Netdeck.gg julkaisee ehdot tai pyytää lopettamaan, tai kun välimuisti (T-003) muuttaa datan tallennusta. |

## 11. MVP-1: paikallinen tallennus ja tiedostot (T-011, T-014, T-015)

### 11.1 Järjestelmän muutos

```
 Käyttäjän selain (origin esim. https://cyberdeck-tcg.web.app)
   ├─ UI ──► tallennuskerros (src/storage, repository-rajapinta, T-011)
   │            └─► localStorage tai IndexedDB (Arkkitehdin ADR)   ← pysyvä, salaamaton, origin-kohtainen
   ├─ Tuonti: tekstikenttä tai .txt-tiedosto (T-014) ──► jäsennin ──► validointi ──► tallennuskerros
   ├─ Tuonti: .json- tai .txt-tiedosto kaverilta (T-015) ──► validointi ──► esikatselu ──► tallennuskerros
   └─ Vienti: tallennuskerros ──► Blob ──► ladattava tiedosto (.json/.txt) ──► käyttäjä jakaa sen itse
```

Ei palvelinta, ei kirjautumista, ei verkkoliikennettä tallennukseen liittyen. Tuotanto (`cyberdeck-tcg.web.app`), testi (`cyberdeck-tcg-dev.web.app`) ja jokainen esikatselukanava ovat eri origineja, joten niiden tallennustilat ovat automaattisesti erillään (testidata ei sekoitu tuotantodataan MVP-1:ssä).

### 11.2 Uudet suojattavat asiat

| Asia | Miksi tärkeä | Missä |
|---|---|---|
| Käyttäjän kokoelma ja pakat | Käyttäjän tekemä työ. Menetys tai muuttuminen on käyttäjälle vakavin haitta (ei luottamuksellista, mutta eheys ja saatavuus tärkeitä). | Selaimen tallennustila |
| Sovelluksen toimintakyky | Rikkinäinen tallennettu data ei saa estää sovelluksen käynnistymistä pysyvästi (käyttäjä ei osaa tyhjentää tallennustilaa) | Selain |

### 11.3 Uudet luottamusrajat

5. **Selaimen tallennustila → sovellus.** Tallennettu data on omaa, mutta sitä on pidettävä **epäluotettavana luettaessa**: vanha skeemaversio, keskeytynyt kirjoitus, käyttäjän tai selainlaajennuksen muokkaus, aiempi bugi tai XSS-hyökkäyksen jättämä sisältö (pysyvä XSS-vektori, jos SR-1 pettää).
6. **Tiedosto tai liitetty teksti → sovellus.** Käyttäjän liittämä teksti, valitsema tiedosto ja erityisesti kaverilta saatu tiedosto ovat **täysin epäluotettavia**. Käyttäjä ei tarkista tiedoston sisältöä ennen tuontia.

### 11.4 Uudet hyökkääjäprofiilit

- **Ilkeä tai kepposteleva kaveri:** lähettää muokatun .json- tai .txt-tiedoston (HTML nimissä, jättimäiset luvut, 100 000 pakkaa, `__proto__`-avaimet, pakan id, joka osuu vastaanottajan olemassa olevaan pakkaan).
- **Jaettu tietokone:** seuraava käyttäjä näkee edellisen käyttäjän kokoelman ja pakat (data on salaamatonta ja origin-kohtaista, ei käyttäjäkohtaista).

### 11.5 STRIDE MVP-1:n lisäykset

| Luokka | Uhka | Todennäköisyys / vaikutus | Torjunta |
|---|---|---|---|
| **S** | Tuotu tiedosto esittää kortin nimeä, jota ei ole, tai väärää nimeä tunnetulle id:lle | Keskisuuri / Pieni | Kortin nimi näytetään aina omasta korttidatasta id:n perusteella, ei tiedostosta (SR-18) |
| **T** | Tallennettu tai tuotu pakan nimi sisältää HTML:ää → pysyvä XSS | Pieni (SR-1 voimassa) / Suuri | SR-1 koskee myös käyttäjän dataa (SR-14), validointi luettaessa (SR-11) |
| **T** | Prototyypin saastutus: tiedoston tai tallennetun datan avain `__proto__`, `constructor` tai `prototype` päätyy objektiin, jota käytetään hakutauluna | Pieni / Keskisuuri | Avainten muototarkistus, `Map` tai `Object.create(null)`, ei `Object.assign`/spread-yhdistämistä jäsennettyyn dataan (SR-11, SR-18) |
| **T** | Pakan nimi sisältää rivinvaihdon ja osio-otsikon (esim. `\n// Units (99)`) → .txt-vienti tuottaa muun pakan kuin näytetty | Keskisuuri / Pieni | Ohjausmerkit pois nimistä (SR-11), viennin muotoilu (SR-19) |
| **T** | Tuonti ylikirjoittaa olemassa olevan pakan tai kokoelman hiljaa (id-törmäys) | Keskisuuri / Keskisuuri (tietojen menetys) | Tuonti luo aina uuden pakan omalla id:llä, korvaaminen vain vahvistuksella (SR-18) |
| **R** | – | – | Ei relevantti: data on vain käyttäjän omassa selaimessa |
| **I** | Jaettu tietokone, selainlaajennus tai XSS lukee kokoelman | Pieni / Pieni | Ei henkilötietoja eikä salaisuuksia tallennustilaan (SR-16). PRIVACY.md kertoo, että data on salaamatonta ja laitteella. |
| **I** | Viety tiedosto sisältää enemmän kuin pakan (laite- tai käyttäjätietoja, koko kokoelman) | Pieni / Pieni | Vienti sisältää vain valitun pakan sallitut kentät (SR-19) |
| **D** | Rikkinäinen tai tuntemattoman version tallennettu data kaataa sovelluksen joka käynnistyksellä | Keskisuuri / Suuri (käyttäjä ei pääse eteenpäin) | SR-11 |
| **D** | Kiintiö täynnä, tallennus estetty (Safari yksityinen tila, selainasetus, `SecurityError`) | Keskisuuri / Keskisuuri | SR-13 |
| **D** | Jättitiedosto, miljoona riviä, katastrofaalinen regex (ReDoS) jäädyttää välilehden | Pieni / Keskisuuri | Koko-, rivi- ja pituusrajat ennen jäsennystä, lineaariset regexit (SR-17, SR-18) |
| **D** | Data katoaa (selaimen siivous, ITP, toinen laite) tai välilehtien kilpailutilanne | Keskisuuri / Keskisuuri | R-10, R-11, SR-13, vienti (T-015) |
| **E** | XSS tallennetusta tai tuodusta datasta → kaikki sivun oikeudet | Pieni / Suuri | SR-1, SR-2, SR-14 |

### 11.6 Turvavaatimukset MVP-1 (SR-11–SR-19)

Kohdetehtävä on merkitty jokaiseen vaatimukseen. Rajat ovat Digiturvan ehdotuksia: Arkkitehti voi muuttaa lukuja tietomallin perusteella, kunhan jokaisella listalla ja merkkijonolla on yläraja.

**SR-11 · Tallennettu data validoidaan luettaessa, eikä rikkinäinen data kaada sovellusta eikä katoa (T-011).**
- Tallennettu dokumentti sisältää skeemaversion (esim. `schemaVersion: 1`). Luettaessa: tunnettu vanhempi versio → migraatio; tuntematon tai uudempi versio → sovellus ei kirjoita dataa yli (käyttäjä voi palata uudempaan versioon) ja näyttää yleisen ilmoituksen.
- Validointi tehdään ajonaikaisesti (ei pelkkä TypeScript-tyyppi tai `as`-muunnos): tyyppi, pakolliset kentät, sallitut arvot ja rajat. Hyväksytty data rakennetaan **uudeksi olioksi sallituista kentistä** (whitelist). Tuntemattomat kentät hylätään. Jäsennettyä dataa ei yhdistetä tilaan `Object.assign`illa, spreadilla tai syväyhdistämisellä.
- Ehdotetut rajat: määrä kokonaisluku 0–999 (kokoelma) ja 1–99 (pakka); pakkoja enintään 200; eri kortteja enintään 500 per pakka ja 5 000 kokoelmassa; pakan nimi 1–100 merkkiä trimmauksen jälkeen; kortin avain tiukalla muodolla (esim. `^[A-Za-z0-9_-]{1,64}$` tai UUID, Arkkitehdin avainpäätöksen mukaan).
- Merkkijonoista poistetaan tai hylätään ohjausmerkit (C0 ja C1, myös rivinvaihdot nimistä) ja suunnanohjausmerkit (U+202A–U+202E, U+2066–U+2069), jotta nimi ei voi huijata näytössä tai rikkoa .txt-vientiä. Unicode normalisoidaan NFC-muotoon.
- Kortin avaimilla indeksoidut hakutaulut ovat `Map`eja (tai `Object.create(null)`-olioita), ja avaimet `__proto__`, `constructor` ja `prototype` hylätään erikseen. Pelkkä avaimen muototarkistus ei riitä, koska esim. `constructor` täyttää muodon `^[A-Za-z0-9_-]+$`.
- Rikkinäinen kohta käsitellään mahdollisimman pienenä: virheellinen rivi tai pakka ohitetaan ja kirjataan `console.warn`iin, muu data säilyy. Jos koko dokumentti on lukukelvoton (virheellinen JSON), **alkuperäistä raakadataa ei poisteta eikä ylikirjoiteta automaattisesti**: se siirretään varakopioavaimeen (esim. `cyberdeck:backup:<aikaleima>`) ennen kuin tyhjä tila otetaan käyttöön, ja käyttäjälle näytetään yleinen ilmoitus.
- Sama validointifunktio käytetään tallennetun datan lukemiseen ja tiedostotuontiin (T-015), jotta tarkistuksia ei ole kahta eri tasoista versiota.
- Yksikkötestit: virheellinen JSON, väärä tyyppi joka kentässä, negatiivinen, desimaali-, `NaN`- ja ylisuuri määrä, ylipitkä nimi, ohjausmerkit, `__proto__`- ja `constructor`-avaimet (testi todentaa, ettei `({}).polluted` synny), tuntematon skeemaversio (data ei muutu), osittain rikkinäinen data (ehjä osa säilyy).

**SR-12 · Tallennus vain tallennuskerroksen kautta (T-011).**
- Vain `src/storage/` käyttää `localStorage`a, `sessionStorage`a tai `indexedDB`:tä. Lint-sääntö (`no-restricted-globals` ja `no-restricted-properties` muualla kuin tallennuskerroksessa) estää suoran käytön.
- Avaimet nimiavaruudessa ja versioituna (esim. `cyberdeck:v1:collection`, `cyberdeck:v1:decks`), jotta välimuisti (T-003) ja käyttäjän data eivät sekoitu.
  - **Päivitys 2026-10-01 (T-011, katselmointi SEC-002-t011):** Toteutuksessa avaimet ovat `cyberdeck:collection`, `cyberdeck:decks` ja `cyberdeck:backup:<kokonaisuus>:<aika>`, ja versio on kääreen `schemaVersion`-kentässä (D-008). Digiturva hyväksyy poikkeaman, koska nimiavaruus säilyy ja kääreessä oleva versio estää vanhaa sovellusversiota ylikirjoittamasta uudemman version dataa. Jos versio olisi avaimen nimessä, vanha koodi kirjoittaisi rinnakkaiseen avaimeen hiljaa. T-003:n välimuisti saa oman etuliitteensä (esim. `cyberdeck:cache:`).
  - **Hyväksytty poikkeus 2026-10-02 (T-025 A1, SEC-004-t025):** `public/theme-init.js` saa lukea selaimen tallennustilasta ennen sovelluspakettia **vain** avaimen `cyberdeck:theme` (`try/catch`, vertailu `=== 'light'`, ei muuta käsittelyä, ei kirjoitusta), jotta tallennettu teema on voimassa ennen ensimmäistä piirtoa. Kirjoitus tapahtuu vain tallennuskerroksen `PreferencesRepository.saveTheme`:lla. Lint-sääntö koskee myös `public/**/*.js`-tiedostoja, ja poikkeus on rajattu tähän tiedostoon ja sen testiin (`src/storage/themeInit.test.ts`), joka valvoo avainta ja vain-luku-ehtoa. Uusi avain tai kirjoitus skriptissä vaatii uuden Digiturvan katselmoinnin.
- Ei evästeitä. `sessionStorage`a ei tarvita.

**SR-13 · Tallennusvirheet ja tietojen menetyksen torjunta (T-011).**
- Jokainen tallennustilan kutsu on `try/catch`-lohkossa, myös pelkkä `window.localStorage`-ominaisuuden lukeminen (heittää `SecurityError`in, kun tallennus on estetty). Tallennustilan puuttuessa sovellus toimii muistinvaraisesti ja näyttää yleisen ilmoituksen ("Tiedot eivät tallennu tässä selaimessa", UX:n mikrokopio). Ei stack tracea käyttäjälle.
- `QuotaExceededError`: tallennus epäonnistuu hallitusti, käyttäjälle kerrotaan, eikä edellinen tallennettu tila katoa. Jos välimuisti (T-003) on samassa tallennustilassa, se poistetaan ensin ja käyttäjän dataa ei koskaan poisteta tilan vapauttamiseksi (R-12).
- Kirjoitus on atominen: yksi looginen muutos on yksi `setItem` tai yksi IndexedDB-transaktio, jotta keskeytys ei jätä puolikasta tilaa.
- Usean välilehden kilpailutilanne (R-11): kerros kuuntelee `storage`-tapahtumaa (localStorage) tai `BroadcastChannel`ia (IndexedDB) ja lukee tilan uudelleen, tai vähintään lukee tuoreen tilan ennen jokaista kirjoitusta. Arkkitehti valitsee keinon ADR:ssä.
- Suositus (ei blokkaa): `navigator.storage.persist()` pyydetään, jos tuettu, jotta selain ei siivoa dataa tilan loppuessa (R-10). Pyyntö ei saa näyttää lupakyselyä ilman käyttäjän toimea.
  - **Päivitys 2026-10-01 (T-012, SEC-003-t012):** Toteutettu. `requestPersistentStorage()` (`persist()`) kutsutaan vain painikkeesta. Vain-luku-tarkistus `isStoragePersisted()` (`persisted()`) saa ajaa käynnistyksessä, koska se ei näytä lupakyselyä. Molemmat ovat tallennuskerroksen julkisessa rajapinnassa (SR-12).
- **Ilmoitustekstit (lisätty 2026-10-01, T-012):** Virhe- ja ohjetekstit eivät saa ohjata käyttäjää tyhjentämään selaimen tietoja, välimuistia tai tämän sivuston tallennustilaa, koska se poistaa kokoelman ja pakat. Tilaa vapautetaan muilta sivustoilta (SEC-011, SEC-012).

**SR-14 · SR-1 koskee myös käyttäjän dataa (T-011–T-015).** Pakan nimi, tuodut rivit, tunnistamattomat korttinimet ja kaikki tallennettu tai tuotu teksti renderöidään vain tekstinä. Yksikkötesti: pakan nimi `<img src=x onerror=alert(1)>` näkyy kirjaimellisena tekstinä (testi kuuluu ensimmäiseen tehtävään, joka näyttää pakan nimen, T-013).

**SR-15 · Ei verkkoliikennettä tallennetusta tai tuodusta datasta (T-011–T-015).** Tallennettu tai tuotu data ei koskaan päädy URL:iin, fetch-kutsuun, `href`- tai `src`-attribuuttiin. Tiedostojen sisältöä ei lähetetä minnekään. CSP:n `connect-src` pysyy ennallaan.

**SR-16 · Ei henkilötietoja eikä salaisuuksia selaimen tallennustilaan (T-011).** Tallennetaan vain kortin avaimet, määrät, pakkojen nimet ja tietomallin tarvitsemat tekniset kentät (id, skeemaversio, tarvittaessa muokkausaika). Ei käyttäjätunnisteita, laitetunnisteita, sähköposteja eikä tokeneita. Uusi kenttä tietomalliin = PRIVACY.md:n inventaarion päivitys (Digiturva katselmoi).

**SR-17 · Tekstin ja .txt-tiedoston tuonti (T-014).**
- Tiedoston koko tarkistetaan `File.size`:sta **ennen lukemista**: enintään 64 kt. Liitetylle tekstille sama raja merkkimääränä koodissa (`maxlength` ei riitä, koska sen voi ohittaa).
- Rivejä enintään 300 ja rivin pituus enintään 300 merkkiä. Yli menevä tuonti keskeytetään yleisellä virheilmoituksella, ei osittain.
- Tiedosto luetaan tekstinä (`file.text()`, UTF-8). BOM poistetaan, rivinvaihdot normalisoidaan (`\r\n`, `\r`), NFC-normalisointi ja SR-11:n ohjausmerkkien käsittely.
- Tiedoston tyyppi ei ole turvaraja: `accept=".txt,text/plain"` on vain käytettävyyttä. Jäsennin hyväksyy vain viitemuodon (D-007) ja hylkää muun rivikohtaisesti.
- Määrä: `^\d{1,2}$` ja arvo 1–99. Jäsennyksen regexit ankkuroidaan (`^…$`) eikä niissä ole sisäkkäisiä toistoja (ReDoS). Testi: 10 000 merkin rivi ja 300 riviä jäsentyvät alle 100 ms:ssa.
- Korttinimet täsmätään korttidataan normalisoidulla merkkijonovertailulla. **Käyttäjän syötteestä ei rakenneta regexiä** (`new RegExp(userInput)` kielletty).
- Pakan nimi `# `-riviltä käsitellään SR-11:n nimisääntöjen mukaan.
- Virheilmoitus ei toista koko syötettä. Tunnistamattomat rivit voidaan näyttää käyttäjälle tekstinä (SR-14) katkaistuna 100 merkkiin.
- Raahaa ja pudota -tuonti (jos toteutetaan) käyttää samaa polkua ja samoja rajoja.

**SR-18 · .json-tuonti on epäluotettava syöte (T-015).**
- Koko tarkistetaan ennen lukemista (enintään 256 kt). `JSON.parse` `try/catch`-lohkossa, ilman `reviver`-funktiota, joka tekisi muuta kuin hylkäisi avaimia.
- Tiedostossa on muodon tunniste ja versio (esim. `{"format": "cyberdeck-deck", "version": 1, …}`). Väärä tai puuttuva tunniste → yleinen virhe "Tiedosto ei ole cyberdeckin pakka".
- Validointi SR-11:n samalla funktiolla ja samoilla rajoilla. Uusi olio rakennetaan sallituista kentistä. `__proto__`-, `constructor`- ja `prototype`-avaimet eivät vaikuta mihinkään (testi).
- **Tiedoston id:tä ei käytetä:** tuotu pakka saa aina uuden, sovelluksen luoman id:n. Tuonti ei koskaan ylikirjoita olemassa olevaa pakkaa tai kokoelmaa ilman käyttäjän erillistä vahvistusta. Pakkatuonti ei muuta kokoelmaa.
- Kortin nimi näytetään omasta korttidatasta kortin avaimen perusteella. Tiedostossa mahdollisesti oleva nimi on vain varateksti tunnistamattomalle kortille (SR-14).
- Tiedoston URL-kenttiä, HTML:ää tai muita ylimääräisiä kenttiä ei käytetä mihinkään (SR-15).
- Ennen tallennusta näytetään esikatselu (pakan nimi, korttimäärä, tunnistamattomat kortit), ja käyttäjä vahvistaa (UX suunnittelee).
- .txt-tuonti T-015:ssä käyttää T-014:n jäsennintä ja SR-17:n rajoja.
- Ei allekirjoitusta eikä eheystarkistetta: tiedostoa voi muokata vapaasti. Tämä on hyväksyttävää, koska tiedosto sisältää vain pakkalistan ja se validoidaan kuten mikä tahansa syöte.

**SR-19 · Vienti (T-015).**
- .json-vienti sisältää vain muodon tunnisteen, version ja valitun pakan sallitut kentät (nimi, kortin avaimet, määrät; korttinimet saa lisätä luettavuuden vuoksi). Ei koko kokoelmaa ilman, että käyttäjä valitsee sen erikseen, ei laite- tai selaintietoja eikä sisäisiä aikaleimoja ilman tarvetta.
- .txt-vienti tuottaa viitemuodon (D-007). Pakan nimestä on poistettu rivinvaihdot ja ohjausmerkit (SR-11), joten nimi ei voi lisätä rivejä tai osio-otsikoita. Testi: vienti → tuonti palauttaa saman pakan (round trip), myös nimellä, joka sisältää `//`, `#` ja erikoismerkkejä.
- Tiedostonimi muodostetaan pakan nimestä turvallisesti: poistetaan `/ \ : * ? " < > |`, ohjausmerkit ja suunnanohjausmerkit, pituus enintään 60 merkkiä, tyhjälle oletusnimi (esim. `pakka.json`).
- Lataus tehdään `Blob`illa ja `a[download]`-linkillä (`application/json` tai `text/plain;charset=utf-8`), ja `URL.revokeObjectURL` kutsutaan latauksen jälkeen. Jos CSP estää latauksen, CSP:tä ei laajenneta ilman Digiturvan katselmointia (SR-9).

### 11.7 Tehtäväkohtainen yhteenveto

| Tehtävä | Sitovat vaatimukset |
|---|---|
| T-011 | SR-11, SR-12, SR-13, SR-16 (SR-14 ja SR-15 periaatteina) |
| T-012, T-013 | SR-14 (pakan nimi tekstinä, testi), SR-1 |
| T-014 | SR-17, SR-14, SR-15 |
| T-015 | SR-18, SR-19, SR-17 (.txt), SR-14, SR-15 |

## 12. MVP-2: ennakoidut vaatimukset Firebase-kirjautumiselle (kirjautuminen ja pilvitallennus tarkennettu luvussa 17)

Nämä eivät koske MVP-1:tä. Ne kirjataan nyt, jotta T-011:n rajapinta ja MVP-2:n suunnittelu ottavat ne huomioon. Digiturva tekee MVP-2:n uhkamallin ja tarkentaa nämä ennen ensimmäistä MVP-2-tehtävää. Tila kaikilla: **Avoin**.

- **MVP2-1 · Erillinen testiprojekti (D-003, CLAUDE.md).** Testisivusto ja esikatselut käyttävät omaa Firebase-projektia (oma Auth, Firestore ja API-avain) ennen kuin mitään dataa tallennetaan pilveen. Tuotannon dataan ei pääse testi- tai esikatselukoodista. Palvelutilit erikseen kummallekin projektille (liittyy R-4:ään).
- **MVP2-2 · API-avaimen rajaus (B-010, R-14, T-009).** Google Cloud Consolessa kummankin projektin selainavain rajataan HTTP-referreriin (oman projektin `*.web.app`- ja `*.firebaseapp.com`-osoitteet, testiprojektissa myös esikatselukanavat) ja vain tarvittaviin rajapintoihin (esim. Identity Toolkit, Token Service, Cloud Firestore). Auth-palvelun valtuutetut verkkotunnukset (Authorized domains) vain omat osoitteet; `localhost` vain testiprojektiin. App Checkin käyttöönotto arvioidaan.
- **MVP2-3 · Firestore-säännöt oletuksena kiinni.** Ei koskaan `allow read, write: if true`, ei edes väliaikaisesti. Käyttäjän data polussa `users/{uid}/…`, ehto `request.auth.uid == uid`. Säännöt validoivat kenttien tyypit, koot ja sallitut avaimet (samat rajat kuin SR-11). Sääntötestit Firebase-emulaattorilla (`@firebase/rules-unit-testing`) ajetaan CI:ssä, ja sääntömuutokset kuuluvat SR-9:n piiriin.
- **MVP2-4 · Jaetut vaihtolistat (ominaisuus 3).** Jakolinkin tunniste on arvaamaton (vähintään 128 bittiä satunnaisuutta), linkillä saa lukea vain jaetun listan, ei kokoelmaa eikä käyttäjän tietoja. Jaon voi perua. Ei sähköpostia tai oikeaa nimeä julkisessa dokumentissa. `Referrer-Policy: no-referrer` säilyy (SR-3).
- **MVP2-5 · CSP ja COOP Firebase Authille.** `connect-src`iin tarvittavat Googlen osoitteet ja kirjautumistavasta riippuen `frame-src` authDomainille. **Epävarma, vaatii varmistuksen:** nykyinen `Cross-Origin-Opener-Policy: same-origin` (SR-3) estää todennäköisesti `signInWithPopup`-kirjautumisen; vaihtoehdot ovat uudelleenohjauskirjautuminen tai `same-origin-allow-popups`. Muutos katselmoidaan (SR-9).
- **MVP2-6 · Kirjautumistapa ja tunnisteet.** Ei omia salasanoja (Firebase Auth hoitaa). Tokeneita ei tallenneta itse `localStorage`en (SDK hallitsee istunnon). Uloskirjautuminen tyhjentää välimuistit, joissa on käyttäjän pilvidataa, erityisesti jaetulla tietokoneella.
- **MVP2-7 · Paikallisen datan siirto pilveen.** Ensimmäisellä kirjautumisella paikallinen data validoidaan (SR-11) ennen lähetystä, ja ristiriita pilvidatan kanssa ratkaistaan käyttäjän vahvistuksella, ei hiljaa ylikirjoittamalla.
- **MVP2-8 · Kustannus ja palvelunesto.** Firestoren luku- ja kirjoitusmäärät rajataan säännöillä ja sivutuksella. Jos Blaze-plan otetaan käyttöön, budjettihälytys on pakollinen (käyttäjän päätös, maksullinen palvelu).
- **MVP2-9 · Tietosuoja.** Kirjautuminen tuo henkilötiedot (sähköposti tai Google-tili, uid) ja mahdollisesti alaikäiset käyttäjät (pelikaverit). Firestoren sijainti EU:ssa (valitaan projektin luonnissa, ei muutettavissa). Tilin ja datan poisto käyttäjän pyynnöstä. Katso PRIVACY.md luku 7.

## 13. Muutosloki

| Päivä | Muutos | Tehtävä |
|---|---|---|
| 2026-09-30 | Ensimmäinen versio: MVP-0:n uhkamalli, turvavaatimukset SR-1–SR-10, korttikuvien ja -datan käyttöoikeusarvio, avoimet riskit R-1–R-7 | T-001 |
| 2026-10-01 | Katselmointi SEC-001: SR-1–SR-10 täyttyvät. R-2 hyväksytty (D-006) ja kirjattu lukuun 10. R-1 päivitetty: käyttäjä tuo kuvat myöhemmin. Uudet riskit R-8 (SEC-002) ja R-9 (SEC-003). Luvun 1 otsakehavainto päivitetty. | T-001 |
| 2026-10-01 | MVP-1:n uhkamalli (luku 11): paikallinen tallennus, .txt- ja .json-tuonti ja vienti. Turvavaatimukset SR-11–SR-19. Uudet riskit R-10–R-14 (B-010 → R-14). MVP-2:n ennakoidut vaatimukset MVP2-1–MVP2-9 (luku 12, avoimet). PRIVACY.md luotu. Muutosloki siirretty lukuun 13. | T-011 |
| 2026-10-01 | Katselmointi `reports/SEC-002-t011-katselmointi.md`: SR-11, SR-12, SR-13 ja SR-16 täyttyvät. SR-12:n avainmuodon poikkeama (versio kääreessä) hyväksytty. Löydökset SEC-005 ja SEC-006 (Low, riskit R-15 ja R-16) sekä SEC-007–SEC-010 (Info). R-11:n tila päivitetty. | T-011 |
| 2026-10-01 | Katselmointi `reports/SEC-003-t012-katselmointi.md`: SR-12–SR-16 täyttyvät T-012:ssa. SR-13:n `persist()`-suositus toteutettu, ja SR-13:een lisätty ilmoitustekstien vaatimus. Löydökset SEC-011 ja SEC-012 (Low, ohjetekstit voivat johtaa tietojen poistoon) ja SEC-013 (Info, R-11:n jäännös). R-10:n ja R-11:n tila päivitetty, R-15 ja R-16 korjattu. SEC-007 varmistettu. | T-012 |
| 2026-10-02 | Katselmointi `reports/SEC-004-t025-teemavalitsin.md`: A1-poikkeus (`public/theme-init.js`) hyväksytty ja kirjattu SR-12:een. SR-12, SR-13 ja SR-16 täyttyvät, CSP esikatselussa ilman rikkomuksia. Löydökset SEC-014 ja SEC-015 (Info). | T-025 |
| 2026-10-02 | Katselmointi `reports/SEC-005-t026-korttidata.md`: SR-2 (`connect-src 'self'`), SR-4, SR-5 ja SR-7 täyttyvät. R-1 ja R-2 hyväksytty (D-012) ja luku 10 päivitetty, R-6 pienennetty, R-7 ja R-12 poistuneet. Uusi luku 14. Löydökset SEC-016 (Medium, otsakkeiden todennus esikatselussa tekemättä), SEC-017 (Low) ja SEC-018 (Info). | T-026 |
| 2026-10-02 | Katselmointi `reports/SEC-006-t027-korttikuvat.md`: sharp hyväksyttävissä, R-1:n tekniset ehdot ja SR-1/SR-2 täyttyvät kuvissa. Uusi luku 15. SEC-016 varmistettu. Löydökset SEC-019 (Low) ja SEC-020 (Info). | T-027 |
| 2026-10-02 | Katselmointi `reports/SEC-008-t014-tuonti.md`: SR-17, SR-14 ja SR-15 täyttyvät T-014:ssä. R-9 suljettu (T-004), R-13 päivitetty tuonnin osalta. Löydökset SEC-021 (Low, nimen katkaisu surrogaattiparin kohdalta) ja SEC-022 (Info). | T-014 |
| 2026-10-02 | Katselmointi `reports/SEC-009-t046-netdeck-linkki.md`: linkkihaku Netdeckistä (D-015). Uusi SR-20 ja riski R-17, luku 16. CSP `connect-src 'self' https://api.netdeck.gg` todennettu esikatselussa. Löydökset SEC-023 ja SEC-024 (Low) ja SEC-025 (Info). | T-046 |
| 2026-10-02 | Katselmointi `reports/SEC-010-t015-vienti-tuonti.md`: SR-18 ja SR-19 täyttyvät (kokoraja ennen lukemista, JSON.parse ilman reviveriä, format/version, `__proto__`-testi, uusi id, tiedostonimen suodatus, .txt-injektio estetty, Blob + revoke). CSP ei muuttunut. R-13 suljettu, SEC-021 varmistettu. Löydökset SEC-026 (Low) ja SEC-027 (Info). | T-015 |
| 2026-10-03 | Uhkamalli `reports/SEC-011-t054-uhkamalli.md` (T-054, D-016, D-017): luku 17, turvavaatimukset SR-21–SR-29, sääntöluonnos liitteenä, riskit R-18–R-20, R-14 päivitetty. Löydökset SEC-028 ja SEC-030 (Medium), SEC-029, SEC-031, SEC-032 (Low), SEC-033, SEC-034 (Info). | T-054 |
| 2026-10-03 | Katselmointi `reports/SEC-012-t054a0-testiprojekti.md`: testisivusto projektiin `cyberdeck-tcg-dev`, tuotannon salaisuus pois PR- ja test-workflowista, oikeudet ja `persist-credentials: false` ennallaan, palvelutilin roolit (Hosting Admin + API Keys Viewer) vahvistettu. R-4 laskettu Low:ksi. R-18 poistuu, kun uusi testisivusto toimii. Löydökset SEC-035 (Low), SEC-036 ja SEC-037 (Info). | T-054a0 |

## 14. T-026: korttidata buildissa (D-013)

- **Järjestelmä:** `src/data/cards.json` importataan buildiin. Selain ei tee yhtään ulkoista pyyntöä (CSP `connect-src 'self'`). `src/api/` on vain `scripts/cards/updateCards.ts`:n käytössä (ESLint estää sovelluskoodissa).
- **Luottamusraja 1 siirtyy:** Netdeck.gg → kehittäjän kone (`npm run cards:update`) → git (PR-katselmointi) → build. Rajapinnan data on yhä epäluotettavaa: `mapCard` (SR-4) ja `parseCardFile` (täsmälleen `Card`-mallin kentät, teksti enintään 200 merkkiä, `key === cardKey(name, subname)`, ei toistuvia avaimia tai id:itä) ennen kirjoitusta, ja `cards.test.ts` samalla validoinnilla. Renderöinti tekstinä (SR-1).
- **STRIDE-muutokset:** T (haitallinen data lähteestä) → validointi ja PR-diff ennen buildia; jäännös: validointi ei ole CI:ssä (T-004), mutta `tsc` on (SEC-017). D (rajapinta kaatuu) → ei vaikuta käyttäjiin (R-6 pienenee). I (käyttäjän IP Netdeckille) → poistunut.
- **firebase.json:** `/assets/**` → `Cache-Control: public, max-age=31536000, immutable`. Turvallinen, koska Viten assetit nimetään sisältötiivisteellä. `index.html` ja `public/`-tiedostot (esim. `theme-init.js`) eivät osu sääntöön. Todennettu esikatselussa (SEC-016 Varmistettu, SEC-006-t027).

## 15. T-027: korttikuvat omalta originilta (D-012, D-013 osa 4)

- **Järjestelmä:** 151 kortin kuvat ovat Viten assetteina `src/assets/cards/{sm,lg}/<key>.webp` (sm 160 px, lg 720 px). Selain lataa ne vain omalta originilta `/assets/<key>-<hash>.webp` (CSP `img-src 'self' data:`, ei muutosta). Rajapinnan `image_url`ia ei käytetä missään (SR-1). Kuvat lisää kehittäjä komennolla `npm run cards:images -- <kansio>` (sharp, devDependency), ja tulos tarkistetaan PR:ssä.
- **Luottamusraja:** käyttäjän kuvapaketti (epäluotettava tiedosto) → kehittäjän kone (`cards:images`) → git → build. Torjunta: lähdetiedostot luetaan vain annetusta kansiosta (`readdir` + `isFile`), tulospolku muodostetaan vain validoidusta kortin avaimesta (`isCardKey`, ei tiedostonimestä), map-tiedoston avaimet ovat pelkkiä tiedostonimiä ja arvot olemassa olevia avaimia, kokoraja 25 Mt, formaatti tarkistetaan sisällöstä (PNG, JPEG, WebP), sharpin pikselikatto päällä, metatiedot (EXIF, GPS, XMP, ICC) poistetaan. Alkuperäiset eivät mene gittiin (`.gitignore`: `card-images-src/`, `public/cards/`).
- **STRIDE-muutokset:** T (haitallinen kuvatiedosto) → libvips-jäsennys vain kehittäjän koneella, ei käyttäjän syötettä selaimessa. I (metatiedot kuvissa) → poistettu, tarkistettu. D (Sparkin 10 Gt/kk siirtokiintiö) → laiska lataus, sm noin 11 kt, lg vasta dialogissa, vuoden välimuisti. Riippuvuus sharp@0.35.5: Apache-2.0, libvips LGPL-3.0-or-later, ei install-skriptejä, `npm audit` 0, ei päädy `dist/`iin.
- **R-1:n tekniset ehdot (luku 10) todennettu SEC-006-t027:ssä:** kuvat omalta palvelimelta, ei `image_url`ia, epävirallisuusmerkintä alatunnisteessa, ei mainoksia, analytiikkaa tai virallisia logoja.

## 16. T-046: pakan haku Netdeck-linkistä (D-015)

- **Järjestelmä:** tuontinäkymän lomake "Hae pakka Netdeck-linkistä". `parseNetdeckUrl` (src/domain/netdeckDeck.ts) poimii linkistä UUID:n, ja `fetchNetdeckDeck` (src/netdeck/) hakee `https://api.netdeck.gg/api/cyberpunk/decks/<uuid>`. Kiinteä host: linkin hostia ei koskaan käytetä pyynnön osoitteena. CSP `connect-src 'self' https://api.netdeck.gg` (molemmat sivustot, firebaseConfig-testi).
- **Luottamusraja:** Netdeck.gg (kolmas osapuoli) → käyttäjän selain, vain käyttäjän painalluksesta. Vastaus on epäluotettava syöte (SR-11).
- **STRIDE:** S (väärä host linkissä) → ankkuroitu regex, vain https, (www.)netdeck.gg, tasan yksi UUID. T (haitallinen JSON) → SR-20. I (IP ja Origin Netdeckille, tunnisteiden vuoto) → vain pyynnöstä, huomautus näkymässä, `credentials: 'omit'`, `no-referrer` (R-7 ei koske). D (jättivastaus, jumittuva yhteys) → 10 s aikakatkaisu, 512 kt raja, 300 riviä, ei uudelleenyrityksiä. E → ei uusia oikeuksia; sideboardia ei tallenneta, pakka tallennetaan aina uutena (SR-17).

#### SR-20 · Linkkihaku Netdeckistä (T-046)
1. Linkki hyväksytään vain muodossa `https://(www.)netdeck.gg/(decks/cyberpunk|cyberpunk/decks)/<UUID>`, enintään 300 merkkiä. Muuten ei pyyntöä.
2. Pyynnön osoite on kiinteä `https://api.netdeck.gg/api/cyberpunk/decks/` + UUID. `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, aikakatkaisu 10 s, ei uudelleenyrityksiä.
3. Vastauksen koko enintään 512 kt (Content-Length ja luettu teksti) ennen `JSON.parse`a.
4. Vain `name`, `owner.display_name`, `zones[].zone_code` (legends/deck/sideboard), `cards[].quantity` (1–99), `card.id` (≤64), `card.name`/`subname`. Tekstit `cleanText`illä, enintään 3 vyöhykettä ja 300 riviä, mikä tahansa rakennevirhe hylkää koko vastauksen. `image_url`ia ja muita kenttiä ei käytetä (SR-1).
5. Kaikki vastauksesta peräisin oleva renderöidään tekstinä. Virheviestit ovat kiinteitä, eivätkä ne sisällä vastauksen tai virheen sisältöä.

## 17. T-054: Google-kirjautuminen ja pilvitallennus (D-016, D-017)

Korvaa luvun 12 ennakoidut vaatimukset MVP2-2, MVP2-3, MVP2-5–MVP2-9 kirjautumisen ja pilvitallennuksen osalta. MVP2-1 (erillinen testiprojekti) jää toteuttamatta D-017:n mukaisesti, jäännösriski R-18. MVP2-4 (vaihtolistat) on yhä avoin.

- **Järjestelmä:** Firebase Auth (vain Google, uudelleenohjaus sivuston omassa domainissa, popup vain localhostissa), Firestore Lite (`europe-north1`), paikallinen ensin -synkronointi. Data `users/{uid}` (tuotanto) ja `test_users/{uid}` (testi, localhost) samassa projektissa. SDK ladataan vain kirjautuville.
- **Uhkamalli (STRIDE), vaatimukset ja löydökset:** `reports/SEC-011-t054-uhkamalli.md`. Sääntöluonnos: `reports/SEC-011-t054-liite-firestore.rules`. Tietosuoja: PRIVACY.md luku 10.
- **Turvavaatimukset (tila: Avoin, ehdotettu hyväksymiskriteereiksi):**
  - **SR-21** Kirjautuminen: vain Google, `select_account`, tarkka host-lista (tuntematon host → kirjautuminen pois, juuri ei koskaan oletuksena `users`), ei omaa tokenien käsittelyä, vain `firebase/app`, `firebase/auth`, `firebase/firestore/lite`.
  - **SR-22** Firestore-säännöt: vain omistaja ja Google, vain sallitut juuret, polut ja avaimet, kokorajat, meta `rev` +1 ja palvelimen aika, kaikki muu kielletty. Production mode ennen deployta, käsin todennus testisivustolla. SR-9 laajenee sääntöihin ja konsoliasetuksiin.
  - **SR-23** Pilvidata epäluotettavaa: sama validointi kuin paikallisesti, ei mappien levitystä, virheellinen dokumentti ei ole poisto, uudempi versio lukitsee, poistettu tili ei palaudu toiselta laitteelta automaattisesti.
  - **SR-24** CSP ja otsakkeet: D-017 kohta 9 tarkkana, ei jokerimerkkejä. `frame-ancestors 'none'`, `X-Frame-Options: DENY`, COOP `same-origin` ja `no-referrer` säilyvät. Todennettu: `/__/auth/*` ei saa `firebase.json`in otsakkeita.
  - **SR-25** Konsoli: API restrictions pakollinen, referrer-rajaus vain tarkoilla osoitteilla (ei `*.web.app`), authorized domains vain omat, vain Google-kirjautuminen, Data Access -lokit pois.
  - **SR-26** Uloskirjautuminen, jaettu kone ja "Poista tilin tiedot" (GDPR 17).
  - **SR-27** Lokit: ei uid:tä, sähköpostia, tokeneita eikä pilvidataa konsoliin, `no-console` hakemistoon `src/account/**`, ei analytiikkaa.
  - **SR-28** Riippuvuus `firebase@12.19.0` tarkalla versiolla, `@grpc/grpc-js`-override (SEC-031), build-tarkistus.
  - **SR-29** Tietosuoja: Firestoreen vain uid, pakat, kokoelma ja meta. 16+ ja tietosuojateksti kirjautumisdialogissa, seloste ennen avaamista muille.
- **Riskit:** R-14 (torjutaan SR-22:lla ja SR-25:llä), uudet R-18, R-19, R-20.
