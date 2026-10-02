# SEC-005 · T-026 Korttidata sovelluksen mukana · tietoturva- ja tietosuojakatselmointi

**Katselmoija:** Digiturva · **Päivä:** 2026-10-02 · **Haara:** `t-026-korttidata` (HEAD a844792), PR #8
**Katselmoitu:** `git diff origin/test...t-026-korttidata`: firebase.json, package.json, tsconfig.json, eslint.config.js, scripts/ (`cards:update`), src/data/, src/domain/cardFile.ts, src/App.tsx ja src/ui/ (tilojen poisto). Rakennettu `dist/`.

## Yhteenveto

| Vakavuus | Määrä |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 1 (SEC-016) |
| Low | 1 (SEC-017) |
| Info | 1 (SEC-018) |

**Veto:** ei. Done-tilaa ei estetä tietoturvalöydöksen perusteella. SEC-016 on todennusaukko eikä haavoittuvuus: hyväksymiskriteeri 5 ("CSP kiristetään") ja Arkkitehdin luovutuksen askel 6 ovat todentamatta Hostingissa, joten PM:n on varmistettava ne ennen Done-tilaa (rules.md 7.2: "todennettu, ei oletettu").

## Ajetut tarkistukset

| Tarkistus | Tulos |
|---|---|
| `npm test` | 19 tiedostoa, 437 testiä läpi |
| `npm run lint` | 0 varoitusta |
| `npm run build` | läpi (JS 285,8 kt, 90,1 kt gzip) |
| `grep -ri netdeck dist/` | vain alatunnisteen tekstit ("Korttitiedot: Netdeck.gg" ja epävirallisuusmerkintä), ei `api.netdeck.gg`-osoitetta eikä rajapintakoodia |
| `fetch(` bundlessa | vain Viten modulepreload-polyfill (`fetch(e.href, …)`, saman originin `<link rel=modulepreload>`) |
| `npm audit` (kaikki ja `--omit=dev`) | 0 haavoittuvuutta. `package-lock.json` ei muuttunut, ei uusia riippuvuuksia |
| Salaisuudet (diff ja `git log -p origin/test..HEAD`: `AIza`, `private_key`, `ghp_`, `BEGIN … PRIVATE`, `secret=`, `token=`) | 0 osumaa |
| Workflowt (`.github/`) | ei muutoksia |
| Esikatselu (`curl -sI`) | **ei tehty:** PR #8 on tilassa `CONFLICTING`, joten preview-workflow ei käynnistynyt (SEC-016) |
| Firebase Hosting -emulaattori (`firebase emulators:start --only hosting:test`, paikallinen) | ei sovellu: emulaattori ei palauttanut `firebase.json`:n otsakkeita lainkaan (ei CSP:tä edes `/`:lle), joten sillä ei voi todentaa sääntöjen yhdistymistä |

## Löydökset

### SEC-016 · CSP- ja Cache-Control-otsakkeita ei ole todennettu Hostingissa, koska esikatselu ei synny · Medium
**Sijainti:** PR #8, `firebase.json` (molemmat sivustot) · **Tehtävä:** T-026
**Toistaminen:** 1) `gh pr view 8 --json mergeable,mergeStateStatus` → `CONFLICTING`, `DIRTY`. 2) `gh run list --branch t-026-korttidata` → ei ajoja. 3) PR:ssä ei ole esikatselukommenttia. GitHub ei aja `pull_request`-workflowta PR:lle, jossa on yhdistämisristiriita. Ristiriidat johtuvat T-025:n yhdistämisestä testiin (mm. `eslint.config.js`, `docs/*`, `src/App.tsx`).
**Odotettu:** esikatselussa `curl -sI <URL>/` näyttää `connect-src 'self'`, ja `curl -sI <URL>/assets/<js>` näyttää `Cache-Control: public, max-age=31536000, immutable`. · **Havaittu:** ei esikatselua, joten ei todennettavissa. Testisivusto (vanha konfiguraatio) palauttaa `/assets/index-DCknDi6S.js`:lle CSP:n ja `Cache-Control: max-age=3600`.
**Vaikutus:** staattisesti `firebase.json` on oikein: molemmat sivustot ovat identtiset, `connect-src 'self'`, muut SR-2- ja SR-3-otsakkeet ennallaan, JSON kelpaa, ja `/assets/**`-sääntö koskee vain tiivisteellä nimettyjä Viten assetteja (ei `index.html`:ää eikä `public/theme-init.js`:ää). Firebase Hosting -sääntöjen yhdistymistä (`**` ja `/assets/**` samalle asset-pyynnölle) ei ole todennettu. **Epävarma, vaatii varmistuksen.** Kumpikaan epäonnistumistapa ei heikennä tietoturvaa: CSP vaikuttaa vain dokumentteihin, ja `index.html` osuu vain `**`-sääntöön, joten sen CSP säilyy joka tapauksessa. Jos `/assets/**` ei toimi, menetetään vain välimuistihyöty. Tästä syystä Medium eikä High.
**Korjausehdotus:** Koodari yhdistää `origin/test`:n haaraan (`git merge origin/test`, ei rebasea eikä force pushia) ja ratkaisee ristiriidat. `docs/SECURITY.md`:ssä ja `docs/PRIVACY.md`:ssä valitaan haaran versio (`git checkout --ours`), koska se sisältää jo T-025:n muutokset. `eslint.config.js`:ssä säilytetään sekä T-025:n `public/**/*.js`-lohkot että T-026:n `scripts/**`-lohkot. Pushin jälkeen PM tai Koodari ajaa esikatselu-URL:lle `curl -sI <URL>/` ja `curl -sI <URL>/assets/<index-*.js>` ja kirjaa tuloksen korttiin, sekä tarkistaa selaimen konsolin (ei CSP-virheitä) ja Network-välilehden (ei pyyntöjä `api.netdeck.gg`:hen). Jos asset-vastauksesta puuttuu CSP, se ei vaadi muutosta (ks. Vaikutus). Jos `Cache-Control` on yhä `max-age=3600`, Arkkitehti arvioi säännön.
**Tila:** Avoin → Todennettu (PM, PR #8:n esikatselu, T-026-kortin "Checkpoint 2026-10-02 · PM (esikatselu, SEC-016)") → **Varmistettu** (Digiturva 2026-10-02, SEC-006-t027: PR #9:n esikatselussa `/` → CSP `connect-src 'self'`, `/assets/index-g3JjC9EX.js` → sama CSP ja `Cache-Control: public, max-age=31536000, immutable`, bundlessa 0 osumaa `api.netdeck.gg`)

### SEC-017 · Korttidatan semanttinen validointi ei estä julkaisua · Low
**Sijainti:** `src/data/cards.ts:8`, `src/data/cards.test.ts`, `.github/workflows/*` (ajavat vain `npm ci && npm run build`) · **Tehtävä:** T-026
**Toistaminen:** 1) Muokkaa `src/data/cards.json`:ia käsin niin, että tyypit pysyvät oikeina, mutta `key` ei vastaa `cardKey(name, subname)`:ta tai teksti ylittää 200 merkkiä. 2) `npm run build` menee läpi, koska vain `tsc` tarkistaa JSONin muodon. 3) Vain `npm test` (`parseCardFile`) hylkää tiedoston, eikä sitä ajeta CI:ssä.
**Odotettu:** julkaistava data on aina validoitu. · **Havaittu:** validointi on päivityskomennossa ja yksikkötestissä, mutta ei julkaisuputkessa.
**Vaikutus:** ei XSS:ää, koska kaikki kentät renderöidään tekstinä (SR-1, `innerHTML`ia ei käytetä). Pahimmillaan väärä avain irrottaa kokoelman rivit korteista (D-008) tai pitkä teksti rikkoo asettelun. Edellyttää virheellistä käsin tehtyä muutosta, joka ohittaa PR-katselmoinnin ja paikallisen testiajon.
**Korjausehdotus:** ei uutta tehtävää. T-004 (testit ja lint CI:hin, prioriteetti jo nostettu Must) kattaa tämän. Arkkitehdin luovutus mainitsee saman rajoitteen.
**Tila:** Avoin (T-004)

### SEC-018 · `cards:update` hyväksyy rikkinäisen nykyisen tiedoston ja korvaa sen · Info
**Sijainti:** `scripts/cards/updateCards.ts:65-74` (`readPrevious`) · **Tehtävä:** T-026
**Havainto:** jos nykyinen `cards.json` ei läpäise validointia, komento kirjaa varoituksen ja kirjoittaa uuden tiedoston, eikä poistuneiden avainten vertailua tehdä (kaikki näkyvät lisättyinä). Tämä on tarkoituksellista (testi `replaces a broken current file with a warning`), ja tulos katselmoidaan PR-diffinä. Ei toimenpidettä. Kirjattu kattavuuden vuoksi: poistuneet avaimet (D-008) näkyvät tässä tapauksessa vain git-diffistä.
**Tila:** Info, ei korjausta

## Tarkistettu, ei löydöksiä

- **Netdeck-kutsut selaimessa (hyväksymiskriteeri 1):** `src/api` ei ole sovelluksen importeissa (ESLint `noApiInApp` sovelluskoodille ja `src/data/**`:lle), `dist/` ei sisällä rajapinnan osoitetta, `useCardCatalog` poistettu. Selaimen Network-tarkistus esikatselussa jää SEC-016:n varaan.
- **CSP (SR-2):** `connect-src 'self'` molemmilla sivustoilla. `'self'` on oikea valinta `'none'`n sijaan: Viten modulepreload-polyfill tekee saman originin `fetch`-kutsuja selaimissa, joissa modulepreloadia ei tueta. Muut direktiivit ennallaan, ei `unsafe-*`-lähteitä.
- **Välimuisti (`/assets/**`):** `immutable` ja vuosi on turvallinen, koska Viten tiedostonimissä on sisällön tiiviste. `index.html` (Firebasen oletus `max-age=3600`, oma tehtävä T-009) ja `public/theme-init.js` (SEC-014) eivät osu sääntöön, joten vanhentunutta sovelluskoodia ei lukita välimuistiin.
- **SR-5 päivityskomennossa:** sama `fetchAllCards` (aikakatkaisu, `MAX_PAGES = 20`, `MAX_CONCURRENT_REQUESTS = 3`, offset-tarkistus). Komento epäonnistuu ilman kirjoitusta, jos haku epäonnistuu, `skipped > 0`, määrä poikkeaa `total`ista, avain toistuu tai validointi hylkää datan. Kaikki polut testattu väärennetyllä `fetchFn`illä ilman verkkoa (10 testiä).
- **SR-7:** `cards:update` ei ole osa `build`-skriptiä eikä workflowta. Build ei hae verkosta. Viten `runnerImport` ladataan `configFile: false` -asetuksella, joten projektin Vite-konfiguraatio tai pluginit eivät aja komennossa.
- **SR-4 komennossa:** perus-URL vakio, ei käyttäjän syötettä. Tiedostopolku on vakio `src/data/cards.json`, ei polkujen ohitusta. Virheviestit eivät sisällä salaisuuksia.
- **Syötteen validointi (`parseCardFile`):** täsmälleen sallitut kentät (`Object.keys` ja `Object.hasOwn`, ylimääräinen tai puuttuva kenttä hylätään, joten `__proto__`-tyyppiset avaimet eivät pääse läpi), tyypit, tekstin enimmäispituus 200, äärellinen `cost`, `key === cardKey(name, subname)`, uniikit avaimet ja id:t, ei tyhjää listaa, `format` ja `version` tarkistetaan.
- **XSS (SR-1):** ei `innerHTML`ia eikä `dangerouslySetInnerHTML`ia sovelluskoodissa. Korttidata renderöidään Reactin tekstinä.
- **Kokoelman avaimet (D-008):** 151 korttia, 151 uniikkia avainta. `mapCard` ja `cardKey` eivät muuttuneet, ja `cards.test.ts` tarkistaa jokaisen avaimen.
- **Virheet ja lokit:** sovelluksessa ei enää verkkovirheitä. Komennon lokissa ei henkilötietoja.
- **Pääsynhallinta, autentikointi, CSRF, kryptografia, tiedostojen lataus:** ei koske muutosta (staattinen sivusto, ei palvelinta).
- **Riippuvuudet:** ei uusia. `vite` (jo devDependency) käytetään `runnerImport`illa, joka on merkitty kokeelliseksi. Rikkoutuminen näkyy vain kehittäjän komennossa (Arkkitehdin varapolku `tsx` vaatii SR-6:n mukaisen tarkistuksen).
- **Tietosuoja:** muutos parantaa tietosuojaa. Netdeck.gg ei enää näe käyttäjien IP-osoitteita, ja selaimeen ei tallenneta korttidataa (R-12 ja T-003:n välimuisti poistuivat). Ei uusia henkilötietoja, kenttiä, evästeitä tai kolmansia osapuolia. PRIVACY.md päivitetty (rivit 5 ja 9, luvut 1, 3, 4 ja 5, K-P1 ja K-P2).

## Dokumentit päivitetty

- `docs/SECURITY.md`: otsikon huomautus, SR-2 (`connect-src 'self'`), SR-4, SR-5 ja SR-7 (päivityskomento), luku 8, R-1 ja R-2 hyväksytty (D-012) ja luku 10, R-6 Medium → Low, R-7 ja R-12 poistuneet, uusi luku 14 (uhkamalli T-026), muutosloki.
- `docs/PRIVACY.md`: Netdeck-yhteydet poistuneet käyttäjiltä, välimuistirivi poistunut, K-P1 ja K-P2, muutosloki.
- SECURITY.md ja PRIVACY.md pohjautuvat `origin/test`:n versioihin (T-025:n muutokset mukana), jotta yhdistäminen on helppo: ristiriidoissa valitaan haaran versio.
