# T-025 · Teemavalitsin: tumma oletuksena, käyttäjä voi vaihtaa
**Tila:** Review · **Omistaja:** Koodari → UX, Digiturva · **MVP:** 1 · **Prioriteetti:** Must (D-012)
**Suunnittelu:** UX ☑ (UX.md luku 8, v0.9)
**Katselmoinnit:** Koodikatselmointi ☑ · UX ☐ · Digiturva ☐ (kevyt: uusi tallennettava asetus, SR-12, SR-16)
**Riippuvuudet:** T-021 (Done)
**Haara:** `t-025-teemavalitsin`

## Tavoite
Käyttäjä valitsee väriteeman helposti. Tumma teema on oletus (D-012), koska se on Cyberpunk-ilmeen pääteema.

## Hyväksymiskriteerit
- [ ] Ensimmäisellä käynnillä teema on tumma laitteen asetuksesta riippumatta.
- [ ] Teeman voi vaihtaa (tumma / vaalea) yhdellä selkeästi löytyvällä kontrollilla, joka näkyy kaikilla leveyksillä (myös 320 px) ja toimii näppäimistöllä ja ruudunlukijalla (nimi ja valittu tila luetaan).
- [ ] Valinta säilyy sivun uudelleenlatauksessa. Se tallennetaan tallennuskerroksen kautta (`src/storage/index.ts`, SR-12). Jos tallennus ei ole käytettävissä, vaihto toimii silti istunnon ajan.
- [ ] Sivu ei välähdä väärässä teemassa latautuessaan: tumma alusta asti, ja tallennettu valinta otetaan käyttöön ennen ensimmäistä piirtoa, jos se on mahdollista CSP:n `script-src 'self'` puitteissa.
- [ ] Kontrastit ja axe kunnossa kummassakin teemassa (WCAG 2.2 AA). Testit kattavat oletuksen, vaihdon ja tallennuksen.

## Rajaukset (ei kuulu tähän)
- Kolmas vaihtoehto "laitteen mukaan" vain, jos UX perustelee sen tarpeelliseksi
- Uudet teemat tai värimuutokset (T-021:n tokenit pysyvät)

## Työloki
### Checkpoint 2026-10-02 · PM
- Kortti määritelty (D-012), tila Ready. Seuraava askel: UX suunnittelee kontrollin, sitten Koodari.

### Checkpoint 2026-10-02 · UX Designer
- Tehty: suunnittelu valmis, UX.md v0.9 luku 8 (teemavalitsin). Luvun 3 johdanto ja 7.3 päivitetty (yliviivaus ja viittaus). IDEAS.md: 2 riviä.
- Päätökset: tumma aina oletus (ei `prefers-color-scheme`), ei kolmatta vaihtoehtoa, yksi vaihtopainike `aria-pressed` otsikkopalkissa nimellä "Vaalea teema", ei live-aluetta, ei virheilmoitusta tallennuksen epäonnistuessa.
- Välähdyksen esto: `data-theme="dark"` HTML:ssä ja synkroninen ulkoinen `public/theme-init.js` (CSP ok). SR-12-poikkeama (vain luku) vaatii Digiturvan ja Arkkitehdin hyväksynnän, varavaihtoehto: ei skriptiä.
- Seuraava askel: PM ratkaisee avoimet kysymykset A1–A5 (UX.md 8.10), sitten Koodari toteuttaa.
- Muutetut tiedostot: docs/UX.md, docs/IDEAS.md, docs/tasks/T-025-teemavalitsin.md

### Checkpoint 2026-10-02 · PM (avoimet kysymykset)
- A1: hyväksytty ehdollisesti. `public/theme-init.js` saa lukea vain avaimen `cyberdeck:theme` (`try/catch`, vertailu `=== 'light'`, ei muuta käsittelyä, ei kirjoitusta). Kirjoitus vain tallennuskerroksen kautta. Digiturva varmistaa ratkaisun katselmoinnissa. Jos Digiturva hylkää, skripti poistetaan (kriteeri 4: "jos mahdollista").
- A2–A5: UX:n oletukset hyväksytty.
- Koodari lisää termin "teema" CONTENT.md:n sanastoon (D-009, ei erillistä Sisällöntuottajaa).
- Tila In Progress. Seuraava askel: Koodari toteuttaa UX.md:n luvun 8 mukaan.

### Suunnitelma 2026-10-02 · Koodari
1. Tallennuskerros: `Theme`, `PreferencesRepository` (`loadTheme`, `saveTheme`), avain `THEME_KEY` keys.ts:ään, testit.
2. Välähdyksen esto: tokenien uudelleenjärjestely (tumma `:root`issa, vaalea `:root[data-theme='light']`), `data-theme="dark"` index.html:ään, `public/theme-init.js` (A1-ehdot), ESLint-lohko, avaintesti.
3. Käyttöliittymä: `ThemeToggle`-painike otsikkopalkkiin, tekstit, tyylit (UX.md 8.3–8.6), App-testit (8.9).
4. Dokumentit: CONTENT.md-sanasto, CHANGELOG, ARCHITECTURE.md 12.2.
5. Selaintarkistus (build + preview): 320 px:n otsikkopalkki, axe kummassakin teemassa, ei välähdystä. Koodikatselmointi ja luovutus.

### Checkpoint 2026-10-02 · Koodari
- Tehty: askeleet 1–3 ja 5, askeleesta 4 ARCHITECTURE.md 12.2. Commitit e6b5c15, 50c5d83, f6b8a0e (PM:n WIP-checkpoint käyttörajan katkaisun jälkeen), f35f9ba, c31f42c.
- Kesken: CONTENT.md:n sanasto ("teema") ja CHANGELOGin `[Julkaisematon]`-merkintä. Tiedostojen luku estettiin (auto mode -luokitin, "Interfere With Workloads"), eikä niitä muokattu lukematta (rules.md 5.2).
- Seuraava askel: UX- ja Digiturva-katselmointi. PM lisää tai teettää sanastorivin ja CHANGELOG-merkinnän (ehdotukset alla).
- Avoimet kysymykset: PM: `npm run lint` ja `npm test` pääkansiossa käyvät läpi myös `.claude/worktrees/`-kansion (Arkkitehdin T-026-worktree). Lint kaatuu tiedostoon `.claude/worktrees/t-026/scripts/cards-update.mjs` (`console`/`process` no-undef), ja Vitest ajaa worktreen testit toiseen kertaan. Ei T-025:n vika. Ehdotus: `.claude` ESLintin `globalIgnores`iin ja Vitestin `exclude`en (oma velkatehtävä, ei koskettu, koska T-026 voi muokata samaa konfiguraatiota).
- Muutetut tiedostot: src/storage/{keys,types,index,repositories}.ts, src/storage/repositories.test.ts, src/storage/themeInit.test.ts, public/theme-init.js, index.html, eslint.config.js, src/styles.css, src/ui/ThemeToggle.tsx, src/ui/texts.ts, src/App.tsx, src/App.theme.test.tsx, src/test/setup.ts, docs/ARCHITECTURE.md, docs/STATUS.md, tämä kortti.

**Toteutuksen huomiot**
- Tokenien arvot ennallaan: skriptivertailu (kaikki 80 muuttujaa kummassakin teemassa identtiset ennen ja jälkeen). `@media (prefers-color-scheme: dark)` poistettu, `color-scheme` on nyt `dark` / `light`.
- DOM-poikkeama UX.md 8.4:stä: tekstit ovat yhden kääre-`span`in sisällä, ja välilyönti on oma tekstisolmunsa (`<span>Vaalea</span> <span class="theme-toggle-suffix">teema</span>`). Syy: painikkeen flex-`gap` olisi korvannut sanavälin, ja `dom-accessibility-api` antoi alkuperäisellä rakenteella nimen "Vaaleateema". Nimi on nyt "Vaalea teema" kaikilla leveyksillä.
- Painikkeen vaakasisäväli on `--space-3` (UX:n arvion 105 px mukainen), muu rakenne yhteinen muiden painikkeiden kanssa (perussääntö, fokus, forced-colors, siirtymät).
- ESLint: SR-12-sääntö koskee nyt myös `public/**/*.js`-tiedostoja, ja poikkeus on rajattu tiedostoihin `public/theme-init.js` ja sen testiin (kommentoitu perustelu). Testi ajaa skriptin `new Function`illa (rivikohtainen `eslint-disable`, lähde on repon oma tiedosto).
- Selaintarkistus (Chrome headless, puppeteer-core ja axe-core 4.x vain scratchpadissa, oma `--user-data-dir`, suljettu `browser.close()`illa, preview-palvelin pysäytetty oman PID:n puulla): ks. luovutus.

## Luovutukset
### Luovutus 2026-10-02 · UX Designer → Koodari
- Mitä tehtiin: teemavalitsimen määrittely UX.md:n luvussa 8: kontrolli (8.1, 8.3, 8.4), ulkoasu ja kontrastit (8.5), toiminta (8.6), välähdyksen esto ja tallennus (8.7), CSS-rakenne (8.8), tarkistuslista ja testit (8.9).
- Mitä pyydän: toteutus määrittelyn mukaan. Rajapintalisäys tallennuskerrokseen: `PreferencesRepository` (`loadTheme`, `saveTheme`, 8.7), avain `cyberdeck:theme` (`src/storage/keys.ts`), uusi `public/theme-init.js`, `data-theme="dark"` `index.html`iin, tyylitiedoston teemalohkojen uudelleenjärjestely (arvot ennallaan), uudet tekstit `src/ui/texts.ts`iin.
- Mistä katsoa: docs/UX.md luku 8 (sekä luvun 3 johdanto ja 7.3). CSP: `firebase.json` (`script-src 'self'`, `style-src 'self'`): ei `style`-attribuutteja eikä inline-skriptiä.
- Tunnetut rajoitteet ja riskit: 320 px:n yksirivinen otsikkopalkki on erittäin tiukka (arvio 287 / 288 px), rivitys on sallittu. SR-12-poikkeama (A1) odottaa hyväksyntää. Kontrastit on laskettu, ei mitattu selaimessa (toteutusta ei vielä ole).
- Testit: ei koodia muutettu, ei ajettu.
- Avoimet kysymykset (oletus valittu): A1 Digiturva ja Arkkitehti hyväksyvät `theme-init.js`:n `localStorage`-luvun (oletus kyllä, varavaihtoehto ei skriptiä). A2 raakamerkkijono `light` tai `dark` ilman käärettä (oletus kyllä). A3 ei viestiä tallennuksen epäonnistuessa (oletus ei). A4 ei "laitteen mukaan" -vaihtoehtoa eikä välilehtien synkronointia (oletus ei, IDEAS.md). A5 ei `theme-color`-metaa (oletus ei, IDEAS.md).
- UX-katselmointi toteutuksesta pyydetään Review-vaiheessa (axe kummassakin teemassa, näppäimistö, 200 % ja 400 % zoom, 320 px).

### Luovutus 2026-10-02 · Koodari → UX Designer ja Digiturva
- Mitä tehtiin: tumma teema on oletus laitteen asetuksesta riippumatta (`data-theme="dark"`, `:root` = tumma, vaalea `:root[data-theme='light']`). Otsikkopalkissa on vaihtopainike "Vaalea teema" (`aria-pressed`). Valinta tallennetaan `PreferencesRepository.saveTheme`:lla avaimeen `cyberdeck:theme`, ja `public/theme-init.js` ottaa tallennetun vaalean teeman käyttöön ennen ensimmäistä piirtoa (A1-ehdot: vain luku, yksi avain, `try/catch`, `=== 'light'`).
- Mitä pyydän: **UX:** käytettävyys- ja saavutettavuuskatselmointi (8.9), myös DOM-poikkeama (kääre-`span`, ks. checkpoint) ja 320 px:n rivitys. **Digiturva:** A1-poikkeaman varmistus (`public/theme-init.js`, ESLint-rajaus), uusi tallennettava asetus (SR-12, SR-16) ja PRIVACY.md:n tietoinventaarion rivi `cyberdeck:theme` (UX.md 8.7). Uusia riippuvuuksia ei ole.
- Mistä katsoa: `git diff origin/test...t-025-teemavalitsin` (T-025:n commitit e6b5c15..c31f42c). Päätiedostot: src/ui/ThemeToggle.tsx, src/storage/repositories.ts, public/theme-init.js, index.html, src/styles.css (tokenilohkot ja `.theme-toggle`), eslint.config.js. Ajo: `npm run build && npm run preview`. Avaa sivu, paina "Vaalea teema" ja päivitä sivu.
- Selaintarkistus (Chrome headless, `vite preview`, laite emuloitu `prefers-color-scheme: light`):
  - Ensimmäinen käynti on tumma (`data-theme=dark`, tausta #0b0c10) 320 ja 1280 px:ssä.
  - Saavutettava nimi "VAALEA TEEMA" (Chrome soveltaa nimeen `text-transform`ia), `pressed` false/true. Sarkaimella painike on ensimmäinen pysähdys, ja Enter ja väli vaihtavat teeman. Fokusrengas 3 px `#1fe0ff`, `clip-path: none`.
  - axe (wcag2a/aa, 21a/aa, 22aa, best-practice): 0 rikkomusta tummassa ja vaaleassa, 320 ja 1280 px. `incomplete: color-contrast` (taustakuvat ja `::before`-täytöt, axe ei pysty laskemaan; UX:n kontrastitaulukko 8.5 laskettu).
  - **320 px: otsikkopalkki ei mahdu yhdelle riville** (nimi 144,4 px + painike 107,7 px + merkki ja välit = 294 > 288 px). Painike rivittyy omalle rivilleen oikeaan reunaan, palkin korkeus on 110 px, eikä vaakavieritystä ole. UX.md 8.3 sallii tämän, eikä välejä muutettu. 640 px:stä alkaen yksi rivi (69 px) ja teksti "VAALEA TEEMA". 1.4.12-välistyksellä 320 px:ssä yksi rivi, ei vaakavieritystä.
  - 200 % juurifontti 320 px:ssä: ei vaakavieritystä (scrollWidth 320), painike 88 px korkea omalla rivillään. 400 %:n zoomin vastine (1280 px / 4 = 320 px) on sama kuin 320 px:n tulos.
  - Välähdys: kun `light` on tallennettu ja sovelluksen JS-paketin latausta viivästettiin 1,5 s, `data-theme=light` ja vaalea tausta (#f3f0e6) olivat voimassa ennen kuin React ajettiin. Tallennus säilyy uudelleenlatauksessa.
  - Ei tarkistettu selaimessa: oikea CSP (preview ei lähetä firebase.jsonin otsakkeita; tarkista esikatselu-URL:ssa), forced-colors, ruudunlukija ja 200 %:n selainzoom (vain juurifontin kasvatus).
- Tunnetut rajoitteet ja riskit: (1) CONTENT.md:n sanastorivi ja CHANGELOG-merkintä puuttuvat, koska tiedostojen luku estettiin. Ehdotukset PM:lle: sanasto "**teema**: sovelluksen väriteema, tumma (oletus) tai vaalea. Valitaan otsikkopalkin painikkeella Vaalea teema. Ei: tila, moodi, skin." CHANGELOG `[Julkaisematon]` → Lisätty: "Sovellus on nyt oletuksena tumma. Otsikkopalkin Vaalea teema -painikkeella voit vaihtaa vaaleaan teemaan, ja valinta säilyy tässä selaimessa." (2) Toisen välilehden muutos näkyy vasta päivityksessä (A4). (3) Tallennuksen epäonnistuminen kirjataan vain `console.warn`iin (A3).
- Testit: `npx vitest run --exclude ".claude/**"` 19 tiedostoa, 456 testiä läpi (uusia 25: repositories 11, themeInit 8, App.theme 10, joista osa parametrisoituja). Mutaatiotarkistus: ilman `userChose`-vahtia kilpailutilannetesti kaatuu, ja kun teema vaihdetaan vasta tallennuksen jälkeen, tallennusvirhetesti kaatuu. `npx eslint . --max-warnings 0 --ignore-pattern ".claude/**"` läpi. `npm run build` läpi, ja `dist/index.html` viittaa `/theme-init.js`:ään ennen JS-pakettia ja tyylitiedostoa. Pelkkä `npm run lint` ja `npm test` pääkansiossa poimivat T-026-worktreen tiedostot (ks. checkpoint).
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (themeInit-testi riippui siitä, että edellinen testi jätti `data-theme`-attribuutin paikalleen; nyt `beforeEach`) · Suosituksia 2 (`vi.unstubAllGlobals` siirretty `afterEach`iin, korjattu heti; `.claude` lint- ja testirajauksista, ehdotettu PM:lle [velka]).
