# SEC-006 · T-027 Korttikuvat · tietoturva- ja tietosuojakatselmointi

**Katselmoija:** Digiturva · **Päivä:** 2026-10-02 · **Haara:** `t-027-korttikuvat` (HEAD d2e2e0c), PR #9
**Katselmoitu:** `git diff a844792..HEAD` (T-027:n oma osuus): package.json ja package-lock.json (sharp), .gitignore, scripts/cards-images.mjs, scripts/cards/{importImages,matchImages}.ts, scripts/cards/convertImage.mjs, scripts/cards/card-images.map.json, src/data/cardImages.ts, src/domain/cardImage.ts, src/ui/{CardImage,CardImageDialog,CardList,CatalogView}.tsx, 302 WebP-tiedostoa. Esikatselu https://cyberdeck-tcg-test--pr9-t-027-korttikuvat-p3uj9kea.web.app.

## Yhteenveto

| Vakavuus | Määrä |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 1 (SEC-019) |
| Info | 1 (SEC-020) |

**Veto:** ei. Done-tilaa ei estetä tietoturvalöydöksen perusteella.
**sharp@0.35.5:** hyväksyttävissä (PM:n ehto täyttyy, katso alla).
**SEC-016 (T-026):** Varmistettu (SEC-005-raportti päivitetty).

## Ajetut tarkistukset

| Tarkistus | Tulos |
|---|---|
| `npm audit` ja `npm audit --omit=dev` | 0 haavoittuvuutta |
| sharp: `npm view sharp@0.35.5` | Apache-2.0, ylläpitäjä lovell (pitkäaikainen ylläpitäjä), ei `preinstall`/`install`/`postinstall`-skriptejä |
| package-lock.json:n uudet paketit | 31 pakettia (sharp, `@img/sharp-*` alustabinäärit, `@img/colour`, `@emnapi/runtime`, `tslib`, `semver`). Kaikki `registry.npmjs.org`:sta, kaikilla `integrity`-tiiviste, `hasInstallScript` 0 kpl. Lisenssit: Apache-2.0, LGPL-3.0-or-later (libvips), MIT, ISC, 0BSD. Ei copyleft-ongelmaa: devDependency, ei päädy `dist/`iin eikä jaeta |
| Tuontiskriptin polut | Lähdetiedostot vain `readdir(sourceDir)` + `isFile()` (ei alikansioita, ei symlinkkejä). Tulospolku `outputPath()` muodostetaan vain `isCardKey`-validoidusta avaimesta, ei tiedostonimestä. Kirjoitus vain `src/assets/cards/{sm,lg}/`. Orpoja ei poisteta, vain raportoidaan |
| Map-tiedoston validointi | JSON-objekti, arvot merkkijonoja, avaimissa ei `/` tai `\` eikä `.`/`..`. Arvo kelpaa vain, jos `isCardKey` ja avain on korttidatassa (muuten `invalid-map-entry`). `__proto__`-avain ei saastuta prototyyppiä (sijoitus merkkijonoon ohitetaan, `Object.hasOwn` estää osuman) |
| Tiedostosisällön tarkistus | Formaatti sharpin `metadata()`:sta (png, jpeg, webp), `failOn: 'error'`, kokoraja 25 Mt, sharpin oletuspikselikatto päällä (dekompressiopommi) |
| Metatiedot | Kaikki 302 commitoitua kuvaa: WebP, ei EXIF-, XMP- eikä IPTC-tietoja (tarkistettu sharpilla) |
| Alkuperäiset gitissä | `.gitignore`: `card-images-src/`, `public/cards/`. T-027:n diffissä ei alkuperäisiä. Katso SEC-019 ja SEC-020 |
| CSP ja kuvien origin (SR-1, SR-2) | Esikatselu: `img-src 'self' data:` ennallaan. Kuvat `/assets/<key>-<hash>.webp`, `Content-Type: image/webp`, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=31536000, immutable`. `image_url` ei esiinny `src/`:ssä (vain testifixtuurissa) eikä bundlessa. Pienin kuva 5,7 kt, joten Vite ei inlinaa (`data:`-URL:eja ei synny) |
| Alkuperäiset esikatselussa | `/6th_Street_Recruits.webp` ja `/cards/Corpo_Security.webp` → `text/html` (SPA-uudelleenohjaus), eli alkuperäisiä ei julkaista CI-buildissa |
| XSS ja `<dialog>` | Kortin nimi renderöidään Reactilla tekstinä (`CardName`, `cardNameText` alt-tekstissä), ei `innerHTML`ia. `src` tulee vain `import.meta.glob`-kartasta. Dialogi on natiivi `showModal()`, ei ulkoista dataa, ei uusia nieluja |
| R-1:n tekniset ehdot (SECURITY.md luku 10) | Kuvat omalta palvelimelta, ei `image_url`ia, epävirallisuusmerkintä alatunnisteessa (`texts.ts`), ei mainoksia, analytiikkaa, evästeitä eikä virallisia logoja. Täyttyvät |
| Palvelunesto / kustannus | `loading="lazy"` pikkukuvissa (sm noin 11 kt), lg ladataan vasta dialogissa, vuoden välimuisti. Sparkin siirtokiintiö ei ole realistinen riski nykyisellä käyttäjämäärällä |
| Salaisuudet | `git log -p --all` regex (`AKIA`, `AIza`, `BEGIN … PRIVATE KEY`, `ghp_`, `xox*`, `sk-`): 0 osumaa koodissa (vain aiempien raporttien kuvaukset hakusanoista) |
| Tietosuoja | Ei uusia henkilötietoja, tallennusavaimia, evästeitä eikä kolmansia osapuolia. PRIVACY.md:n muutoslokiin rivi |
| Testit | `npx vitest run`: 26 tiedostoa, 484 testiä läpi |

## Löydökset

### SEC-019 · Alkuperäiset kuvat worktreen `public/`-juuressa eivät ole `.gitignore`ssa · Low
**Sijainti:** worktree `.claude/worktrees/t-027/public/*.webp` (151 seuraamatonta tiedostoa), `.gitignore` · **Tehtävä:** T-027
**Toistaminen:** 1) `git status` worktreessä → `?? public/(Don't_Fear)_The_Reaper.webp` jne. 2) `.gitignore` sisältää vain `public/cards/`, ei `public/*.webp`. 3) `npm run build` tässä kansiossa kopioi `public/`-tiedostot `dist/`in juureen.
**Odotettu:** alkuperäiset ovat vain ignoroidussa kansiossa. · **Havaittu:** alkuperäiset ovat `public/`-juuressa, jota `.gitignore` ei kata.
**Vaikutus:** `git add -A` tai `git add public` commitoisi 14 Mt alkuperäisiä (sama virhe kuin L-005, c31f42c). Paikallinen `npm run build` + `firebase deploy` tästä kansiosta julkaisisi ne sivuston juureen alkuperäisillä nimillä. CI:n puhdas build ei ole altis (todennettu esikatselussa). Ei tietovuotoa: kuvat ovat jo julkisia R-1:n mukaisesti, ja alkuperäisissä ei ole EXIF- tai XMP-tietoja. Siksi Low.
**Korjausehdotus:** poista seuraamattomat `public/*.webp` worktreestä (ne eivät ole kenenkään työtä, Koodarin luovutus mainitsee saman). Lisäksi `.gitignore`en esim. `/public/*.webp`, jos `public/`iin ei ole tarkoitus lisätä kuvia käsin (nykyään siellä on vain `theme-init.js`).
**Tila:** Avoin

### SEC-020 · Alkuperäiset kuvat ovat `test`-haaran git-historiassa (c31f42c) · Info
**Sijainti:** commit c31f42c (T-025), poistettu seurannasta 988e48a; sisältyy `test`-haaraan · **Tehtävä:** T-025/T-027
**Toistaminen:** `git branch -a --contains c31f42c` → `test`, `t-026-korttidata`, `t-027-korttikuvat`.
**Vaikutus:** repo kasvaa noin 14 Mt pysyvästi. Kuvat eivät ole salaisuuksia eivätkä henkilötietoja, ja ne julkaistaan joka tapauksessa (R-1). Repo näyttää olevan yksityinen (GitHub API ilman tunnistautumista → 404; Epävarma, vaatii varmistuksen). Jos repo muutetaan julkiseksi, alkuperäiset täysikokoiset kuvat ovat ladattavissa historiasta, mikä laajentaa R-1:n jakelua hieman.
**Korjausehdotus:** ei toimenpidettä nyt. Historian uudelleenkirjoitus vaatisi force pushin ja käyttäjän luvan (rules.md 5.1), eikä hyöty ole sen arvoinen. Jos repo julkaistaan tai oikeudenhaltija pyytää poistoa, käyttäjä arvioi asian uudelleen R-1:n yhteydessä.
**Tila:** Avoin (hyväksyttävä sellaisenaan, ei blokkaa)

## Tarkistettu, ei löydöksiä

Pääsynhallinta (ei rajapintoja, ei uutta dataa) · autentikointi (ei käytössä) · injektiot (ei kyselyitä; polut vain validoidusta avaimesta) · path traversal (tuontiskripti, map-tiedosto) · XSS (dialogi, alt-tekstit, `src`) · CSRF (ei tilaa muuttavia pyyntöjä) · kryptografia (ei uutta) · tiedostot (sisältöpohjainen formaattitarkistus, koko- ja pikselirajat, metatietojen poisto) · virheet ja lokit (tuontiraportti ei sisällä salaisuuksia; selaimen latausvirhe näytetään yleisellä tekstillä) · palvelunesto (laiska lataus, välimuisti) · konfiguraatio (CSP ja otsakkeet esikatselussa ennallaan) · riippuvuudet (sharp ja 30 transitiivista, audit 0, ei install-skriptejä) · tietosuoja · tekoälyominaisuudet (ei käytössä).

## Huomio PM:lle (ei löydös)

- sharp lataa CI:n `npm ci`:ssä alustan binäärin (`@img/sharp-linux-x64` ja `@img/sharp-libvips-linux-x64`) npm-rekisteristä. Binäärit on lukittu tiivisteellä, eikä mikään paketti aja asennusskriptiä, joten toimitusketjun riski on sama kuin muilla npm-paketeilla. Toimenpiteitä ei tarvita.
