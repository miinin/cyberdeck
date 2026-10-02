# SEC-001 · T-001 Kävelevä luuranko · tietoturvakatselmointi

**Katselmoija:** Digiturva · **Päivä:** 2026-10-01 · **Tehtävä:** T-001
**Kohde:** haara `t-001-kaveleva-luuranko` (HEAD `b0e1916`), `git diff origin/test...HEAD` (40 tiedostoa), PR https://github.com/miinin/cyberdeck/pull/1
**Esikatselu:** https://cyberdeck-tcg-test--pr1-t-001-kaveleva-luura-wj9wvfxt.web.app
**Vaatimukset:** `docs/SECURITY.md` luku 6 (SR-1–SR-10), tehtäväkortin turvavaatimukset

## Yhteenveto

| Vakavuus | Määrä |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 2 (SEC-002, SEC-003) |
| Info | 1 (SEC-004) |

**Veto:** ei blokkaa Done-tilaa. Kaikki SR-1–SR-10 täyttyvät. Low-löydökset ovat puolustuksen syventämistä, eivätkä ne ole nykyisellä koodilla hyödynnettävissä.

> Tunnisteet: tämän raportin tunniste on SEC-001, ja löydökset numeroidaan siitä eteenpäin (SEC-002 →).

## Mitä tehtiin ja miten

| Tarkistus | Komento tai menetelmä | Tulos |
|---|---|---|
| Testit | `npm test` | 71/71 läpi (5 tiedostoa) |
| Lint | `npm run lint` | 0 virhettä, 0 varoitusta |
| Build | `npm run build` | `dist/index.html` + 1 JS + 1 CSS. Sama tiedostotiiviste (`index-Cw6Q3nZd.js`) kuin esikatselussa, eli build on toistettava. |
| Riippuvuuksien haavoittuvuudet | `npm audit --audit-level=high`, `npm audit --omit=dev` | 0 haavoittuvuutta molemmissa |
| Install-skriptit | `npm query ':attr(scripts, [preinstall\|install\|postinstall])'` | ei yhtään pakettia |
| Lisenssit | `package-lock.json` läpikäynti | Tuotanto: react, react-dom, scheduler, kaikki MIT. Kehitys: MIT, ISC, Apache-2.0, BSD, BlueOak, CC0, MIT-0, CC-BY-4.0 ja MPL-2.0 (lightningcss, 12 alustakohtaista pakettia). Ei copyleft-lisenssiä tuotantopaketissa. |
| Pakettien lähde | `resolved`-kentät | Kaikki 256 `https://registry.npmjs.org`, ei git- tai tarball-lähteitä |
| Salaisuudet | `git log --all -p` regex-haku (yksityiset avaimet, `private_key`, `AIza`, `ghp_`, `github_pat_`, `sk-`, `AKIA`, `npm_`, `client_secret`, `password=`) ja tiedostonimihaku (`.env`, `.pem`, `.key`, service account) | 18 committia, ei osumia |
| Otsakkeet | `curl -sI` esikatselusta (juuri, syvä polku, JS-tiedosto) | CSP ja kaikki SR-3:n otsakkeet kaikissa, HSTS Firebaselta, HTTP → HTTPS 301 |
| CSP selaimessa | Chrome headless (`--enable-logging`, 20 s virtuaaliaika) esikatseluun. Mekanismi todennettiin ensin paikallisella sivulla, jonka inline-skripti CSP esti ja joka näkyi lokissa. | Ei yhtään CSP-virhettä. Sivu renderöi 151 korttiriviä ("151 korttia"), ja alatunniste näkyy. |
| SR-1-lint-säännöt | `eslint --stdin --stdin-filename src/ui/Probe.tsx` yhdeksällä koemuunnelmalla (ei tiedostoja levylle) | Suorat muodot estyvät, osa kiertoteistä ei (SEC-002) |
| Koodiluku | `src/api/*`, `src/ui/*`, `src/App.tsx`, `src/main.tsx`, `eslint.config.js`, `vite.config.ts`, `index.html`, `firebase.json`, `.firebaserc`, `.github/workflows/*`, `.npmrc`, `.gitignore`, `src/test/setup.ts` | katso alla |

Tuotantoon (`cyberdeck-tcg.web.app`) ei tehty pyyntöjä. Testisivusto `cyberdeck-tcg-test.web.app` palauttaa tällä hetkellä 404, koska test-haaraan ei ole vielä julkaistu mitään. Tämä on odotettua ennen yhdistämistä, ja PM todentaa hyväksymiskriteerin 6 yhdistämisen jälkeen.

## Turvavaatimukset SR-1–SR-10

| SR | Tulos | Näyttö |
|---|---|---|
| SR-1 Teksti, ei HTML | Täyttyy | Kaikki rajapinnan kentät renderöidään React-tekstisolmuina (`CardList.tsx`). Koodissa ei ole `innerHTML`-, `dangerouslySetInnerHTML`-, `eval`-, `href`- tai `style`-käyttöä. `mapCard` kopioi vain sallitut kentät, joten `image_url` ja `rules_text` eivät pääse malliin. Testi `CatalogView.test.tsx` "renders HTML in card data as literal text (SR-1)" todentaa, että `<img src=x onerror=alert(1)>`, `<b>` ja `<script>` näkyvät tekstinä eikä elementtejä synny. Lint estää suorat muodot. Kiertotiet ovat kohdassa SEC-002. |
| SR-2 CSP | Täyttyy | `firebase.json`: sama CSP molemmille kohteille (prod ja test), täsmälleen SECURITY.md:n mukainen, ei `unsafe-inline`- eikä `unsafe-eval`-lähdettä. Esikatselu lähettää sen. Selaimessa ei CSP-virheitä. `dist/index.html`:ssä ei inline-skriptiä eikä -tyyliä. `assetsInlineLimit: 0`. |
| SR-3 Otsakkeet | Täyttyy | `nosniff`, `no-referrer`, `DENY`, `Permissions-Policy` (camera, microphone, geolocation, payment, usb, interest-cohort) ja `COOP: same-origin`. Todennettu `curl -sI`:llä myös rewrite-polulta. |
| SR-4 Rajapintakerros | Täyttyy | `NETDECK_CARDS_URL` on vakiona vain `netdeckClient.ts`:ssä. URL kootaan `URL`-oliolla, ja vain `limit` ja `offset` ovat numeerisia omia arvoja, ei käyttäjän syötettä. `credentials: 'omit'` ja `referrerPolicy: 'no-referrer'` (testi "sends no credentials and no referrer"). `parsePage` tarkistaa `items`-, `total`-, `limit`- ja `offset`-kentät, ja `mapCard` ohittaa virheelliset kortit. Kerrosraja valvotaan `no-restricted-imports`-säännöllä. |
| SR-5 Kestävyys | Täyttyy | Aikakatkaisu 15 s per pyyntö omalla `AbortController`illa. Ei automaattisia uusintayrityksiä. `MAX_PAGES = 20` tarkistetaan ennen pyyntöjä. Pysähtyy tyhjään sivuun, ja väärä `offset` hylätään. Rinnakkaisuus on enintään 3, ja epäonnistumisen jälkeen uusia pyyntöjä ei aloiteta. Testit: aikakatkaisu, HTTP 500, virheellinen JSON, `total` > data, `total` > `MAX_PAGES`. Käyttäjälle näytetään vain `texts.ts`:n yleinen viesti, ja tekninen tieto menee `console.error`iin (ei henkilötietoja). |
| SR-6 Riippuvuudet | Täyttyy | 17 suoraa riippuvuutta kirjattu korttiin (versio, lisenssi, perustelu). Vain react ja react-dom ovat tuotantoriippuvuuksia. Tarkat versiot (`save-exact=true`), `package-lock.json` commitoitu, audit 0, ei install-skriptejä. |
| SR-7 Ei verkkoa buildissa | Täyttyy | Build ei tee verkkokutsuja (kehysriippuvuudet paikallisia). `dist/`-tiedostoissa ainoa ulkoinen osoite, johon otetaan yhteyttä, on `https://api.netdeck.gg/api/cards/cyberpunk`. Muut ovat XML-nimiavaruuksia ja Reactin virhelinkkipohja, joita ei haeta. CSS:ssä ei ole `url()`- eikä `@import`-viittauksia. Ei fontteja, CDN:ää eikä analytiikkaa. |
| SR-8 Actions | Täyttyy | Kaikissa kolmessa workflowssa on `permissions`. Deploy-workflowt: `contents: read`, ei `repoToken`ia. `preview.yml`: fork-ehto `head.repo.full_name == github.repository` säilyy, trigger on `pull_request` (ei `_target`), eikä `run:`-riveillä ole `${{ }}`-lausekkeita. Huomio: kohta SEC-003. |
| SR-9 Katselmointi | Täyttyy | Tämä raportti kattaa `.github/workflows/` (3 tiedostoa), `firebase.json`:n ja `.firebaserc`:n (ei muutettu tässä haarassa: prod → `cyberdeck-tcg`, test → `cyberdeck-tcg-test`). |
| SR-10 Salaisuudet | Täyttyy | Historiassa ei salaisuuksia. Julkaisuavain viitataan vain `secrets.`-lausekkeella `with:`-syötteenä, ei `env`iin eikä tulosteisiin. Firebase JS SDK:ta ei ole. `.gitignore` kattaa `.env`, `.env.*` ja `.firebase/`. |
| R-1 Ei korttikuvia | Täyttyy | `mapCard` ei kopioi `image_url`ia, ei `<img>`-elementtejä, ja CSP `img-src 'self' data:` estäisi CloudFront-kuvat. |
| Epävirallisuusmerkintä | Täyttyy (teksti Sisällöntuottajalla) | Alatunniste näkyy esikatselussa. |

## Löydökset

### SEC-002 · SR-1:n lint-säännöt eivät tunnista kaikkia HTML-kirjoitusmuotoja · Low
**Sijainti:** `eslint.config.js:8-29` (`unsafeHtmlSyntax`) · **Tehtävä:** T-001
**Toistaminen:**
1) `echo 'export const a = (el: HTMLElement, s: string) => { el["innerHTML"] = s; };' | npx eslint --stdin --stdin-filename src/ui/Probe.tsx`
2) Samoin muodoille `Object.assign(el, { innerHTML: s })`, `<div {...{ dangerouslySetInnerHTML: { __html: s } }} />` ja `range.createContextualFragment(s)`.
3) Vertaa muotoihin `el.innerHTML = s` ja `<div dangerouslySetInnerHTML={...} />`, jotka antavat SR-1-virheen.
**Odotettu:** kaikki muodot antavat SR-1-virheen. · **Havaittu:** neljä kiertotietä menee lintistä läpi ilman virhettä. (Myös `window.eval`-alias ohittaa `no-eval`-säännön, mikä on ESLintin tunnettu rajoitus.)
**Vaikutus:** Koodissa ei tällä hetkellä ole yhtään näistä muodoista, joten hyödynnettävää aukkoa ei ole. React enkoodaa tekstin, ja CSP estäisi inline-skriptin. Riski on, että myöhempi muutos (esim. `rules_text`-merkintöjen muotoilu MVP-1:ssä) tuo HTML-nielun lintin ohi ja katselmointi on ainoa este.
**Korjausehdotus:** Lisää `unsafeHtmlSyntax`-listaan:
- `MemberExpression[computed=true][property.value=/^(innerHTML|outerHTML|srcdoc)$/]` sijoituksen vasemmalla puolella
- `Property[key.name=/^(dangerouslySetInnerHTML|innerHTML|outerHTML|srcdoc)$/]` (kattaa spreadin ja `Object.assign`in)
- `CallExpression[callee.property.name=/^(createContextualFragment|parseFromString)$/]`
- Lisää jokaiselle negatiivinen koe samaan tapaan kuin Koodari teki väliaikaisella tiedostolla.
Ei uutta riippuvuutta. Voidaan tehdä T-006:n yhteydessä tai omana `[velka]`-tehtävänä ennen ensimmäistä tehtävää, joka muotoilee `rules_text`iä.
**Tila:** Avoin

### SEC-003 · `actions/checkout` jättää GITHUB_TOKENin `.git/config`iin npm-skriptien ajon ajaksi · Low
**Sijainti:** `.github/workflows/preview.yml:15`, `deploy-test.yml:16`, `deploy-prod.yml:16` (`uses: actions/checkout@v4` ilman `persist-credentials: false`) · **Tehtävä:** T-001
**Toistaminen:** 1) Lue workflowt: checkout käyttää oletusta `persist-credentials: true`. 2) Seuraava askel `npm ci && npm run build` ajaa npm-pakettien ja Vite-liitännäisten koodia samassa työtilassa. 3) Mikä tahansa näistä voi lukea tokenin `.git/config`-tiedostosta (`http.https://github.com/.extraheader`).
**Odotettu:** build-askel ei näe GitHub-tokenia. · **Havaittu:** token on luettavissa koko jobin ajan.
**Vaikutus:** Toimitusketjuhyökkäyksessä (haitallinen kehitysriippuvuus) token vuotaa. `preview.yml`:ssä tokenilla on `pull-requests: write` ja `checks: write`, deploy-workflowissa `contents: read`. Julkaisuavain ei vuoda tätä kautta, koska se annetaan vain deploy-actionin `with:`-syötteenä. Todennäköisyys on pieni: install-skriptejä ei ole, ja riippuvuudet ovat lukittuja ja auditoituja. Liittyy riskeihin R-3 ja R-5.
**Korjausehdotus:** Lisää kaikkiin kolmeen workflowhun:
```yaml
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
```
`action-hosting-deploy` saa tokenin `repoToken`-syötteenä, eikä se tarvitse gitin tunnuksia. Korjauksen voi tehdä T-004:n yhteydessä (sama tiedosto `preview.yml`). Muutos on SR-9:n mukaisesti Digiturvan katselmoitava.
**Tila:** Avoin → Korjattu (T-004, commit 380d25d: `persist-credentials: false` kaikissa kolmessa checkoutissa) → Varmistettu (Digiturva 2026-10-02: triggerit ja permissions ennallaan, ei `pull_request_target`ia eikä uusia salaisuuksia, lint ja test ajetaan ennen deployta)

### SEC-004 · Sivukatto ja vastauksen koko · Info
**Sijainti:** `src/api/netdeckClient.ts:8-11`, `remainingOffsets` · **Tehtävä:** T-001
**Havainto:** (a) `MAX_PAGES = 20` ja rajapinnan `limit` 60 tarkoittavat enintään 1 200 korttia. Jos pelin korttimäärä kasvaa yli tämän, koko lataus päätyy virhetilaan (saatavuus, ei tietoturva). Nyt kortteja on 151. (b) Vastauksen rungon kokoa ei rajata. Kaapattu rajapinta voisi lähettää jättimäisen JSONin, mutta se kaataisi vain käyttäjän oman välilehden, eikä se ole tietoturvaongelma staattisessa sovelluksessa.
**Vaikutus:** Ei tietoturvavaikutusta nyt.
**Korjausehdotus:** Ei toimenpidettä T-001:ssä. Arkkitehti voi huomioida katon välimuistitehtävässä (T-003), esim. `MAX_PAGES` suhteessa `total`iin tai lokimerkintä, kun lähestytään rajaa.
**Tila:** Havainto

## Tarkistettu, ei löydöksiä

- **Pääsynhallinta ja autentikointi:** ei sovellu MVP-0:aan (ei kirjautumista, ei palvelinrajapintoja, ei Firebase SDK:ta, ei Firestore- tai Storage-sääntöjä).
- **Injektiot:** ei SQL- tai NoSQL-kyselyitä, ei komentorivikutsuja. URL kootaan `URL`/`searchParams`-rajapinnalla vain numeerisista vakioista. Workflowjen `run:`-riveillä ei ole lausekkeita.
- **XSS:** React-tekstisolmut, ei HTML-nieluja, ei `href`- tai `src`-attribuutteja rajapinnan datasta, CSP ilman `unsafe-*`, testi kattaa hyötykuorman.
- **CSRF:** ei tilaa muuttavia pyyntöjä. Rajapintaan vain GET ilman evästeitä.
- **Clickjacking:** `frame-ancestors 'none'` ja `X-Frame-Options: DENY`.
- **Kryptografia ja kuljetus:** vain HTTPS, HSTS preload, `upgrade-insecure-requests`, HTTP ohjataan 301:llä HTTPS:ään.
- **Virheet ja lokit:** käyttäjälle vain yleinen teksti. `console.error` ja `console.warn` sisältävät vain virhetyypin, HTTP-tilan, offsetin ja määrät, eivät henkilötietoja tai salaisuuksia.
- **Palvelunesto (rajapinnan suuntaan):** sivukatto, rinnakkaisuusraja 3, aikakatkaisu, ei automaattisia uusintayrityksiä. Uudelleenyritys vain käyttäjän painalluksesta, ja React StrictModen tuplaajo perutaan `AbortController`illa.
- **Konfiguraatio:** ei lähdekarttoja `dist/`:ssä, ei kehitystilaa tuotantobuildissa. `firebase.json`, `.firebaserc` ja pistetiedostot eivät julkaistu (`ignore`). Pyyntö `/firebase.json` palauttaa rewriten kautta `index.html`:n, ei konfiguraatiota.
- **Riippuvuudet ja toimitusketju:** audit 0, ei install-skriptejä, kaikki rekisteristä, lukittu, vähän tuotantoriippuvuuksia.
- **Salaisuudet:** ei osumia historiassa (18 committia, kaikki haarat).
- **Tietosuoja:** sovellus ei käsittele henkilötietoja: ei lomakkeita, evästeitä, `localStorage`- tai `sessionStorage`-käyttöä, analytiikkaa eikä ulkoisia fontteja. Kolmansille osapuolille (Netdeck.gg ja Firebase Hostingin pyyntölokit) näkyy IP-osoite, kuten SECURITY.md 8 kuvaa. `Referrer-Policy: no-referrer` ja `credentials: 'omit'` minimoivat vuodon. PRIVACY.md:tä ei tarvita vielä (luodaan MVP-1:ssä).
- **Tekoälyominaisuudet:** ei käytössä.

## Avoimet riskit, joihin T-001 ei vaikuttanut

- **R-3** (Actionit tagilla, ei SHA-lukitusta) ja **R-4** (sama julkaisuavain kaikissa workflowissa, PR voi muuttaa `preview.yml`:ää) ovat ennallaan. Niitä ei ole korjattu tässä tehtävässä, eikä niitä vaadittu. Merkintä: T-001 lisää `deploy-test.yml`:n, joka julkaisee test-haaran pushista. Se ei muuta R-4:n luonnetta.

## Korjausten varmistus

| Löydös | Korjattu (commit) | Varmistettu |
|---|---|---|
| SEC-002 | – | – |
| SEC-003 | 380d25d (T-004) | Digiturva 2026-10-02 |
