# SEC-004 · T-025 teemavalitsimen tietoturva- ja tietosuojakatselmointi (kevyt)

**Tehtävä:** T-025 (Teemavalitsin: tumma oletuksena, käyttäjä voi vaihtaa) · **Katselmoija:** Digiturva · **Päivä:** 2026-10-02
**Kohde:** `git diff origin/test...t-025-teemavalitsin` (commitit e6b5c15..94c4be6), PR #7, esikatselu https://cyberdeck-tcg-test--pr7-t-025-teemavalitsin-rpu6urub.web.app
**Pyyntö:** PM:n A1-ehdot (`public/theme-init.js`), ESLintin SR-12-poikkeus, SR-12, SR-16, PRIVACY.md:n inventaarion rivi `cyberdeck:theme`, CSP esikatselussa.

## Yhteenveto

| Vakavuus | Määrä |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Info | 2 (SEC-014, SEC-015) |

**Veto: ei.** Done-tila ei esty tietoturvan tai tietosuojan perusteella.
**A1: hyväksytty.** `public/theme-init.js` täyttää kaikki PM:n ehdot, ja poikkeus on kirjattu SECURITY.md:n SR-12:een.

## Ajetut tarkistukset

| Tarkistus | Tulos |
|---|---|
| `npx vitest run --exclude ".claude/**"` | 19 tiedostoa, 456/456 läpi |
| `npx eslint . --max-warnings 0 --ignore-pattern ".claude/**"` | OK |
| SR-12-säännön kattavuus: `localStorage.getItem` stdinissä nimillä `public/other.js` ja `src/ui/X.ts` | Molemmat kaatuvat `no-restricted-globals` (SR-12) -virheeseen. Poikkeus koskee vain nimettyjä tiedostoja, ei koko `public/`-kansiota. |
| `npm audit` | Ei ajettu: `package.json` ja `package-lock.json` eivät muuttuneet (diff-stat). Ei uusia riippuvuuksia. |
| Salaisuushaku: koko historia (`git log --all -p`: Googlen API-avaimet, GitHub-tokenit, yksityiset avaimet, `private_key`) ja seurattujen tiedostojen nimet (`.env`, serviceAccount, credentials, `.pem`, `.key`) | Ei osumia |
| Diffin nielut lisätyillä riveillä: `innerHTML`, `dangerouslySetInnerHTML`, `sessionStorage`, `indexedDB`, `document.cookie`, `fetch(`, `eval`, `new Function`, `RegExp(`, `postMessage`, `window.open` | Vain `new Function` testissä `src/storage/themeInit.test.ts` (ajaa repon oman tiedoston lähteen, ei ulkoista syötettä; rivikohtainen `eslint-disable`). Hyväksytty. |
| Esikatselun otsakkeet (`curl -I`, `/` ja `/theme-init.js`) | CSP ennallaan (`script-src 'self'`, `style-src 'self'`), `X-Content-Type-Options: nosniff`, `/theme-init.js` palautuu `text/javascript`-tyyppinä ja sisältö vastaa repoa. |
| Selain esikatselussa (Chrome headless, puppeteer-core scratchpadissa, oma `--user-data-dir`, suljettu `browser.close()`illa; laite emuloitu `prefers-color-scheme: light`) | Ks. alla |

**Selaintarkistus esikatselussa (oikeat Firebase-otsakkeet):**
- Ensimmäinen käynti: `data-theme=dark`, tausta #0b0c10, `aria-pressed=false`, tallennustila tyhjä.
- Painallus: `data-theme=light`, tallennettu `cyberdeck:theme = light`. Tallennustilassa ei muita avaimia.
- Uudelleenlataus: vaalea (tausta #f3f0e6), `aria-pressed=true`.
- Takaisin tummaan ja lataus: `dark`.
- Vihamielinen tallennettu arvo `"><img src=x onerror=alert(1)>`: tumma oletus, arvoa ei käsitellä eikä kirjoiteta uudelleen.
- `securitypolicyviolation`-tapahtumia 0, konsolivirheitä 0, sivuvirheitä 0 kaikissa vaiheissa.

## Vaatimusten täyttyminen

| Vaatimus | Tila | Peruste |
|---|---|---|
| A1: vain avain `cyberdeck:theme` | Täyttyy | Skriptissä yksi `getItem('cyberdeck:theme')`. Testi varmistaa, että tiedostossa on vain tämä `cyberdeck:`-avain ja että se on sama kuin `THEME_KEY`. |
| A1: `try/catch` | Täyttyy | Myös `window.localStorage`-ominaisuuden luku on lohkon sisällä (SR-13). Estetty tallennus jättää tumman oletuksen (testi + selain). |
| A1: vertailu `=== 'light'`, ei muuta käsittelyä | Täyttyy | Arvoa ei jäsennetä, tulosteta eikä käytetä DOMissa. Ainoa vaikutus on vakiomerkkijonon `light` asettaminen `data-theme`-attribuuttiin. |
| A1: ei kirjoitusta | Täyttyy | Ei `setItem`-, `removeItem`-, `clear`-, eväste- tai muita tallennuskutsuja (testi). |
| A1: kirjoitus vain tallennuskerroksen kautta | Täyttyy | `PreferencesRepository.saveTheme` (`src/storage/repositories.ts`) validoi arvon (`light`/`dark`, muuten `invalid-input`) ja kääntää virheet `StorageError`iksi. `ThemeToggle` ei käytä selaimen tallennustilaa suoraan. |
| SR-12 | Täyttyy (hyväksytty poikkeus) | Lint-sääntö laajennettu `public/**/*.js`-tiedostoihin, poikkeus rajattu kahteen nimettyyn tiedostoon perustelukommentilla. Poikkeus kirjattu SECURITY.md:n SR-12:een. |
| SR-13 | Täyttyy | `loadTheme` ei hylkää koskaan (palauttaa `dark`), `saveTheme` hylkää `quota`/`unavailable`-virheellä eikä muuta edellistä arvoa (testit). Käyttöliittymä vaihtaa teeman ennen tallennusta, joten epäonnistuminen ei estä vaihtoa. |
| SR-16 | Täyttyy | Tallennetaan vain `light` tai `dark`. Ei tunnisteita, aikaleimoja eikä henkilötietoja. `console.warn` kirjaa vain virhetyypin, ei dataa. |
| SR-1 / XSS | Täyttyy | Tallennettua arvoa ei renderöidä. Painikkeen tekstit ovat vakioita (`texts.ts`). |
| CSP (SR-2) | Täyttyy | Ulkoinen saman originin skripti, ei inline-skriptiä, ei `style`-attribuutteja. Esikatselussa 0 rikkomusta. |
| Tietosuoja | Täyttyy | PRIVACY.md:n inventaarioon lisätty rivi 10 (`cyberdeck:theme`), säilytys ja poisto (luku 5) ja tallennustilan käyttö (luku 6) päivitetty. Ei henkilötieto. |

## Löydökset

### SEC-014 · `theme-init.js` ei ole sisältötiivisteellä nimetty, ja se välimuistitetaan tunnin · Info
**Sijainti:** `public/theme-init.js`, `index.html` (`<script src="/theme-init.js">`), Firebase Hostingin oletus `Cache-Control: max-age=3600` · **Tehtävä:** T-025
**Toistaminen:** 1) `curl -sI <esikatselu>/theme-init.js`. 2) Tiedosto palvellaan vakionimellä, kun taas Viten paketit ovat tiivisteellä nimettyjä (`/assets/index-*.js`).
**Odotettu:** skriptin muutos näkyy heti uuden julkaisun jälkeen · **Havaittu:** selain voi käyttää vanhaa versiota enintään tunnin.
**Vaikutus:** ei tietoturvavaikutusta. Jos avain tai logiikka joskus muuttuu, pahimmillaan näkyy hetkellinen väärän teeman välähdys, kunnes React korjaa teeman tallennuskerroksesta. Sama välimuistikäytös koskee jo `index.html`:ää (SEC-011:n yhteydessä todettu).
**Korjausehdotus:** ei toimenpiteitä nyt. Jos skriptiä muutetaan myöhemmin, harkitaan versioparametria (`/theme-init.js?v=2`) tai `firebase.json`-otsaketta `Cache-Control: no-cache` tälle polulle.
**Tila:** Avoin (Info, ei vaadi korjausta)

### SEC-015 · Teema-avain pitää ottaa mukaan tulevaan "Poista kaikki tiedot" -toimintoon · Info
**Sijainti:** PRIVACY.md luku 5 (suositus "Poista kaikki tiedot tästä selaimesta") · **Tehtävä:** T-025
**Toistaminen:** 1) Valitse vaalea teema. 2) Poista sovelluksen omilla toiminnoilla kokoelma ja pakat. 3) `cyberdeck:theme` jää tallennustilaan.
**Odotettu:** kaikki sovelluksen avaimet poistuvat, kun käyttäjä tyhjentää tiedot · **Havaittu:** tällaista toimintoa ei vielä ole, joten kyse on vain tulevan toiminnon vaatimuksesta.
**Vaikutus:** vähäinen. Arvo `light`/`dark` ei ole henkilötieto, mutta "kaikki tiedot" -lupauksen pitää pitää paikkansa.
**Korjausehdotus:** kun toiminto toteutetaan, se poistaa kaikki `cyberdeck:`-etuliitteiset avaimet, myös `cyberdeck:theme`. Kirjattu PRIVACY.md:n lukuun 5.
**Tila:** Avoin (Info, ei koske T-025:tä)

## Tarkistettu, ei löydöksiä

- **Pääsynhallinta, autentikointi, CSRF:** ei sovellu (ei palvelinta, ei kirjautumista, ei lomakkeita).
- **Injektiot ja XSS:** tallennettua arvoa ei käytetä merkkijonona DOMissa, URL:ssa, regexissä eikä CSS:ssä. Vihamielinen arvo testattu yksikkötestissä (`<script>`) ja esikatselussa.
- **Prototype pollution / jäsennys:** arvoa ei jäsennetä (raakamerkkijono, A2).
- **Palvelunesto:** yksi lyhyt avain, kiinteä arvojoukko. Tuntematonta arvoa ei kirjoiteta uudelleen, joten silmukoita ei synny.
- **Konfiguraatio:** `firebase.json` ja CSP ennallaan. `index.html`:n kommentti ei paljasta mitään sisäistä.
- **Riippuvuudet ja salaisuudet:** ei muutoksia, ei osumia.
- **Tietosuoja ja seuranta:** ei evästeitä, ei uusia kolmansia osapuolia, ei verkkoliikennettä teemasta (SR-15). Teema ei ole laite- tai käyttäjätunniste.
- **Lokit:** vain virhetyyppi `console.warn`iin.
- **Tekoäly:** ei sovellu.

## Ei tarkistettu

- Vanhat selaimet ilman `catch {}`-syntaksin tukea (ES2019): skripti jäisi jäsennysvirheeseen ja tumma oletus säilyisi, joten vaikutus on vain välähdys. Ei testattu.
- Muut selaimet kuin Chrome (Firefox, Safari) esikatselussa.
