# SEC-086: T-086 hosting-siivous (firebase.json, index.html)

- **Katselmoija:** Digiturva · **Päivä:** 2026-10-06
- **Kohde:** haara `t-086-siivous-hosting`, PR #75, `git diff origin/test...t-086-siivous-hosting`
- **Muutokset:** SPA-rewrite `** → /index.html` poistettu molemmilta sivustoilta, otsakesääntö `regex ^/(index[.]html)?$ → Cache-Control: no-cache`, `<noscript>`-teksti, laajennetut testit `src/firebaseConfig.test.ts`.
- **Tulos:** Hyväksytty. Ei Critical-, High-, Medium- tai Low-löydöksiä. Yksi Info-huomio.

## Tarkistetut alueet (ei löydöksiä)

| Alue | Havainto |
|---|---|
| Firebase Auth `/__/auth/handler` | `/__/`-polut ovat Hostingin varattuja polkuja, ja ne palvellaan ennen `public`-tiedostoja ja rewritejä. Rewrite ei koskaan ohjannut niitä, joten poisto ei vaikuta redirect-kirjautumiseen (`sites.ts`: authDomain = sama sivusto). Uusi regex ei osu `/__/`-polkuihin, ja testi varmistaa sen. |
| Jaetut linkit | `ShareTradeButton` ja `ExportButtons` tuottavat muodon `${origin}/#/…`. Palvelin näkee vain polun `/`, joten `#/vaihto/…`, `#/jaa/…` ja `#/kortti/…` toimivat. Koodissa ei ole `BrowserRouter`- tai `pushState`-polkureititystä eikä service workeria. |
| Syvät polut | Esim. `/vaihto` palauttaa nyt 404:n (Firebasen oletussivu, koska `dist/404.html` puuttuu). Sovellus ei koskaan tuota polkulinkkejä, joten tämä on tarkoituksellista (B-004: puuttuva `/assets/`-tiedosto antaa 404:n eikä index.html:ää väärällä MIME-tyypillä). `**`-otsakkeet (CSP ym.) koskevat myös 404-vastausta. |
| Regex | `^/(index[.]html)?$` vastaa täsmälleen polkuja `/` ja `/index.html` (ankkuroitu, RE2-yhteensopiva). Kyselymerkkijono ei kuulu polkuun. Muut polut eivät osu. |
| CSP ja muut otsakkeet | `**`-sääntö (CSP, nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy, COOP) on ennallaan ja identtinen prod- ja test-sivustoilla (testi `toEqual`). `/assets/**`-sääntö immutable on ennallaan. Säännöt eivät ole päällekkäisiä samalla avaimella. |
| index.html `<noscript>` | Staattinen teksti, ei uutta skriptiä tai ulkoista resurssia. CSP ei muutu. |
| Riippuvuudet ja salaisuudet | Ei riippuvuusmuutoksia (npm audit ei tarpeen). Diffissä ei ole salaisuuksia. |
| Testit | Testit kattavat rewritejen puuttumisen, no-cache-säännön ja sen, ettei mikään sääntö osu `/__/`-polkuihin. Testejä ei ole heikennetty. |

## Info-1: välimuistiin jäävät hashaamattomat tiedostot

- **Sijainti:** `firebase.json` (ei sääntöä), `public/theme-init.js`, ikonit
- **Toistaminen:** `curl -I https://<sivusto>/theme-init.js` palauttaa Hostingin oletuksen `Cache-Control: max-age=3600`.
- **Vaikutus:** Muutos `theme-init.js`:ään voi näkyä avoimissa selaimissa enintään tunnin viiveellä. Ei turvavaikutusta.
- **Korjausehdotus:** Ei tarvita nyt. Jos tiedostoa muutetaan usein, sille voi lisätä `no-cache`-säännön.

## Veto
Ei blokkaa Done-tilaa.
