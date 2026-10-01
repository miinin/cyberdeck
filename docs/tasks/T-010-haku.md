# T-010 · Haku ja suodatus korttilistaan
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Suunnittelu:** UX ☑ · Sisällöntuottaja ☐ (tekstit)
**Katselmoinnit:** Koodikatselmointi ☐ · UX ☐ · Sisällöntuottaja ☐ · Testikäyttäjä ☐ · Dokumentoija ☐ (CHANGELOG)
**Riippuvuudet:** T-001 (Done). Ei riippuvuutta T-011:een (voidaan tehdä rinnakkain).
**Haara:** `t-010-haku`

## Tavoite
Pelaaja löytää haluamansa kortin 151 kortin listasta muutamassa sekunnissa. Tämä on pohja kokoelman merkinnälle (T-012) ja pakkojen kokoamiselle (T-013) sekä PROJECT.md:n mittarille "kortin sijainnin näkee yhdellä haulla".

## Hyväksymiskriteerit
- [ ] Hakukenttä suodattaa listaa kirjoitettaessa nimen ja alaotsikon perusteella. Kirjainkoolla ei ole väliä, ja haku löytää myös osan sanasta (esim. "silver" → Johnny Silverhand).
- [ ] Listaa voi suodattaa korttityypin (Legend, Unit, Gear, Program) ja värin perusteella. Suodattimet ja haku toimivat yhdessä.
- [ ] Näkyvien korttien määrä päivittyy ("12 / 151 korttia"), ja muutos ilmoitetaan ruudunlukijalle hillitysti (ei jokaisesta näppäilystä erikseen).
- [ ] Jos mikään kortti ei vastaa hakua, näkyy tyhjä tila ja tapa tyhjentää haku ja suodattimet.
- [ ] Haku ja suodattimet toimivat näppäimistöllä ja 320 px:n leveydellä. axe ei löydä virheitä.
- [ ] Hakulogiikalla on yksikkötestit (myös erikoismerkit ja XSS-merkkijono hakusanana, SR-1).

## Rajaukset (ei kuulu tähän)
- Hakutilan tallennus URL:iin tai selaimeen
- Lajittelu (rajapinnan järjestys riittää)
- Haku sääntöteksteistä (`rules_text`), koska se vaatii T-007:n

## Työloki
### Checkpoint 2026-10-01 · PM
- Kortti määritelty, tila Ready. Seuraava askel: UX suunnittelee hakunäkymän (UX.md:n laajennus).

### Checkpoint 2026-10-01 · Koodari
- Tehty: suunnitelman askeleet 1–6. Commitit 8b05752 (hakulogiikka), 485d925 (väri taulukkoon), 8f26d7c (lomake ja ilmoitusten hillintä), 5f00607 (dokumentit).
- Kesken: ei mitään.
- Seuraava askel: katselmoinnit (UX, Sisällöntuottaja), sitten Testikäyttäjä ja Dokumentoija.
- Avoimet kysymykset: K9 (UX:lle, ks. luovutus).
- Muutetut tiedostot: src/domain/cardSearch.ts (+test), src/ui/CardFilters.tsx, src/ui/CardColor.tsx, src/ui/useDelayedAnnouncement.ts, src/ui/CatalogView.tsx (+CatalogView.filters.test.tsx, CatalogView.test.tsx), src/ui/CardList.tsx, src/ui/texts.ts, src/styles.css, src/App.test.tsx, CHANGELOG.md, docs/ARCHITECTURE.md (toteutusosa), docs/LESSONS.md (L-002).

## Luovutukset
### Luovutus 2026-10-01 · UX Designer → Koodari
- Mitä tehtiin: UX.md v0.3, uusi luku 5 (haku ja suodatus): polku, suodatussäännöt (ryhmän sisällä TAI, ryhmät ja haku JA), HTML-rakenne (`form role="search"`, fieldset/legend, natiivit valintaruudut 44 × 44 px), rautalangat 320 px ja ≥ 640 px, kaikki tilat teksteineen, live-alueen hillintä (750 ms), fokus ja näppäimistö (Esc tyhjentää, ei automaattista fokusta) sekä tarkistuslista 5.10. Uudet korttivärien tokenit (3.1.1) ja komponentit (3.4).
- Rajapinnan arvot 2026-10-01: color Red 38, Yellow 37, Green 38, Blue 38. Väri näytetään tekstinä suomeksi ja koristeellisena näytteenä sarakkeessa "Tyyppi ja väri". Haku ohittaa kirjainkoon ja aksentit.
- Mitä pyydän: Toteutus luvun 5 mukaan. Sisällöntuottaja tarkistaa tekstit katselmoinnissa ja päivittää CONTENT.md:n sanaston.
- Mistä katsoa: docs/UX.md luvut 3.1.1, 3.4 ja 5, commit b87266c.
- Tunnetut rajoitteet ja riskit: Taulukon sarakeotsikko muuttuu, joten T-001:n testit päivitetään. Lomake vie 320 px:ssä noin 380 px korkeutta. Hakusanan enimmäispituus: ehdotus `maxlength="100"`.

### Checkpoint 2026-10-01 · PM
- K6 (värit suomeksi), K7 (label "Hae nimellä") ja K8 (yhdistetty sarake "Tyyppi ja väri"): UX:n oletukset hyväksytty. Ne ovat tekstivalintoja, jotka käyttäjä voi muuttaa myöhemmin.
- Hakusanan enimmäispituus: 100 merkkiä.
- Seuraava askel: Koodari toteuttaa worktreessä `.claude/worktrees/t-010`.

### Suunnitelma 2026-10-01 · Koodari
1. `src/domain/cardSearch.ts`: puhdas hakulogiikka (normalisointi, `filterCards`, vaihtoehtolistat) + yksikkötestit.
2. Taulukko: sarake "Tyyppi ja väri", värin teksti ja koristeellinen näyte (`CardColor`), caption propsina. T-001:n testit päivitetään sarakemuutoksen osalta.
3. Lomake `CardFilters` (search-maamerkki, hakukenttä, kaksi fieldsetiä) ja tyylit tokeneista (UX.md 3.1.1, 3.4).
4. `CatalogView`: suodatustila (säilyy uudelleenyrityksen yli), tilarivi, EI TULOKSIA -tila, tyhjennys ja fokus, Esc ja Enter.
5. Live-alueen hillintä 750 ms (dedupe, peruutus LATAUS-tilassa ja purussa, IME) + testit fake timereilla.
6. Koko sarja, lint, build, audit, koodikatselmointi, CHANGELOG, ARCHITECTURE-toteutusosa, luovutus ja PR.

### Luovutus 2026-10-01 · Koodari → UX Designer, Sisällöntuottaja (→ Testikäyttäjä, Dokumentoija)
- Mitä tehtiin: haku ja suodatus UX.md:n luvun 5 mukaan. Hakulogiikka puhtaana funktiona (`src/domain/cardSearch.ts`), lomake `CardFilters`, värisarake `CardColor`, live-alueen 750 ms:n hillintä `useDelayedAnnouncement`. Hakutila säilyy uudelleenyrityksen yli. `maxLength=100`. Tekstit sellaisinaan UX.md 5.4–5.6:sta (`src/ui/texts.ts`), K6–K8 PM:n hyväksymien oletusten mukaan.
- Hyväksymiskriteerit (todennettu):
  - K1 haku nimellä ja alaotsikolla, kirjainkoko ja aksentit ohitetaan, osa sanasta riittää: yksikkö- ja näkymätestit, Chrome ("viktor", "judy").
  - K2 tyyppi- ja värisuodattimet yhdessä haun kanssa (TAI ryhmän sisällä, JA ryhmien välillä): yksikkö- ja näkymätestit.
  - K3 määrä "n / kaikki korttia" päivittyy heti, live-alue 750 ms viimeisestä muutoksesta, ei toistoa samasta tuloksesta, Enter heti, peruutus LATAUS-tilassa ja purussa, IME: testit valeajastimilla. Chrome: live "Näytetään 3 / 151 korttia."
  - K4 EI TULOKSIA -tila ja `Tyhjennä haku ja suodattimet` (tyhjentää kaiken, fokus hakukenttään, ilmoitus heti): testit ja Chrome.
  - K5 näppäimistö (Esc tyhjentää, Enter ei lähetä, välilyönti valintaruutuihin, suodatus ei siirrä fokusta) ja 320 px: testit ja Chrome. axe-core 4.13 (wcag2a/aa, 21a/aa, 22aa, best-practice): **0 rikkomusta** tiloissa EI SUODATUSTA, SUODATETTU ja EI TULOKSIA, vaalea ja tumma teema, 320 ja 1024 px. Ei vaakavieritystä 320 px:ssä (kaikki 151 korttia näkyvissä, myös pisin nimi). Valintaruutujen label-alueet 57–112 × 44 px, hakukenttä 288 × 44 px. OSITTAINEN + SUODATETTU -tilaa ei voitu ajaa axella oikeaa rajapintaa vasten (rakenne katettu näkymätesteillä).
  - K6 yksikkötestit erikoismerkeille ja XSS-merkkijonolle (SR-1): `cardSearch.test.ts`, `CatalogView.filters.test.tsx`.
- Mitä pyydän: UX-katselmointi (käytettävyys ja saavutettavuus, tarkistuslista 5.10) ja Sisällöntuottajan kielentarkastus (tekstit `src/ui/texts.ts`, CONTENT.md:n sanasto: värit, "Hae nimellä", "Tyyppi ja väri").
- Mistä katsoa: haara `t-010-haku`, `git diff origin/test...t-010-haku`. PR https://github.com/miinin/cyberdeck/pull/3, esikatselu https://cyberdeck-tcg-test--pr3-t-010-haku-6ycx0rzm.web.app (Preview-workflow läpi). Esikatselussa (CSP käytössä) sovellus latasi 151 korttia ilman konsolivirheitä, ja axe antoi samat 0 rikkomusta kuin paikallisesti. Paikallisesti `npm ci && npm run dev`.
- Tunnetut rajoitteet ja riskit:
  - **K9 (UX:lle):** kun haku tai valinta on päällä ja käyttäjä painaa OSITTAINEN-tilassa `Yritä uudelleen`, latauksen jälkeinen live-ilmoitus on luvun 4.5 viesti ("151 korttia ladattu."), vaikka lista on suodatettu ja tilarivi näyttää suodatetun osuuden. Määrittely ei kerro tätä tapausta. Seuraava muutos ilmoittaa suodatetun tuloksen normaalisti.
  - OSITTAINEN-tila ilman yhtään saatua korttia: lomaketta ei näytetä (ei suodatettavaa). UX 5.8 sanoo OSITTAINEN = näytetään. Tulkinta kirjattu ARCHITECTURE.md:n toteutusosaan.
  - Tyhjennyspainike ilmoittaa aina heti, myös jos sama tulos on jo ilmoitettu (UX 5.6:n "ilmoittaa heti" on ensisijainen toistokieltoon nähden).
  - axe ajettiin Chrome-selaimessa paikallista `vite preview` -palvelinta vasten. Playwright-core ja axe-core asennettiin väliaikaisesti scratchpad-kansioon, ei projektin riippuvuuksiksi. Ei uusia riippuvuuksia projektiin.
- Testit: `npm test` 7 tiedostoa, 125 testiä läpi (T-001: 93 → T-010: 125). `npm run lint` 0 virhettä ja varoitusta. `npm run build` onnistui. `npm audit --audit-level=high` 0 haavoittuvuutta. T-001:n testeistä päivitettiin sarakeotsikko ("Tyyppi ja väri") ja rajattiin kolme tekstikyselyä taulukkoon (sama teksti on nyt myös suodatinvaihtoehtona). Mitään testiä ei poistettu eikä heikennetty. Mutaatiotarkistus: ajastimen peruutuksen ja IME-käsittelyn poisto kaatoi vastaavat testit.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (tyhjennyspainike ei ilmoittanut, jos tulos oli sama kuin latausviesti: korjattu `force`-lipulla ennen committia 8f26d7c) · Suosituksia 2 (K9 yllä UX:lle; user-event ja valeajastimet kirjattu LESSONS L-002:ksi)
- STATUS.md:tä ei päivitetty (rinnakkaisajo, PM päivittää).

### Luovutus 2026-10-01 · Sisällöntuottaja → PM
- Kielitarkastus tehty, CONTENT.md v0.2 (K6–K8 ja uudet termit). Raportti docs/reports/TXT-002-t010-tarkastus.md. Veto: ei. Low: TXT-008 ("Hakua vastaavia…" + testit + UX.md 5.6), TXT-009 (yksikkö "1 kortti"), TXT-010 (CHANGELOGin sanamuoto). Korjataan korjauskierroksella.

### Luovutus 2026-10-01 · UX Designer → PM
- UX-katselmointi esikatselussa: axe 0 rikkomusta 13 ajossa (myös OSITTAINEN + SUODATETTU), ei vaakavieritystä, näppäimistö ja live-alueen hillintä toimivat. UX.md v0.4. Raportti docs/reports/UX-002-t010-katselmointi.md. Veto: ei.
- UX-002 (Medium, K9): latausviesti uusintayrityksen jälkeen kertoo suodattamattoman määrän. Korjaus: yhdistetty viesti UX.md 5.6:n taulukon mukaan, baseline = suodatuksen tuloksen avain, näkymätesti. UX-003 ja UX-004 hyväksytty (ei koodimuutosta).

### Checkpoint 2026-10-01 · PM
- Ristiriita: UX-002:n n = 0 -viesti käyttää sanaa "Valintoja vastaavia", TXT-008 sanaa "Hakua vastaavia". Päätös: "Hakua vastaavia" (Sisällöntuottaja, CONTENT.md-sanasto). UX.md 5.6 päivitetään vastaavasti korjauskierroksella.
- Korjauskierros odottaa Testikäyttäjää: UX-002, TXT-008, TXT-009, TXT-010.

### Luovutus 2026-10-01 · Testikäyttäjä → PM
- Rikkomistestaus PR #3:n esikatselussa (HEAD 8d5f8f9), raportti docs/reports/BREAK-002-t010.md. Arvio: Kestää, veto: ei. B-011 (Medium: 320 × 568 px:ssä tulos jää näkymän alapuolelle), B-012–B-016 (Low).

### Checkpoint 2026-10-01 · PM (korjauskierroksen sisältö)
- Korjataan nyt: UX-002 (= B-015, yhdistetty latausviesti UX.md 5.6:n mukaan), TXT-008 ("Hakua vastaavia…"), TXT-009 ("1 kortti"), TXT-010 (CHANGELOG), B-013 (haku sanoittain: välimerkit välilyönneiksi, jokaisen sanan on löydyttävä) ja B-014 (`\p{Cf}`-merkit pois hakusanasta). PM osoittaa Koodarille luvan päivittää UX.md 5.6:n tekstin TXT-008:n mukaiseksi.
- Backlogiin: B-011 → T-018 (mobiilin kompakti suodatinlomake, MVP-2:n mobiilityö, yhdessä UX-003:n kanssa). B-016 → T-008. B-012 → IDEAS.md.
- D-009: korjausten varmistus Koodarin testeillä ja PM:n tarkistuksella. Erillistä uutta katselmointikierrosta ei tehdä, koska kaikki löydökset ovat Low tai Medium eikä blokkaavia ole.

### Checkpoint 2026-10-01 · Koodari (korjauskierros)
- Tehty: a6890e9 (koodi ja testit: UX-002/B-015, TXT-008, TXT-009, B-013, B-014), 74404fe (UX.md 5.6 "Hakua vastaavia", ARCHITECTURE.md toteutusosa, CHANGELOG TXT-010). Raportteihin merkitty Korjattu.
- Testit kirjoitettu ensin ja todettu epäonnistuviksi (13 kpl), sitten korjaus.
- Testimuutos: cardSearch.test.ts:n erikoismerkkitestistä siirrettiin .*, *, (, [, \ uuteen testiin, koska B-013:n mukaan välimerkit ovat sanaerottimia: pelkistä välimerkeistä koostuva hakusana = ei hakua (kuten B-014 c). Kirjaimellisuus testataan edelleen symboleilla $ ^ + |. "drops an earlier announcement" -testi tyhjentää haun ennen uutta dataa, koska K9:n mukaan aktiivisella haulla latausviesti on nyt yhdistetty.
- Avoin (PM/UX): UX.md 5.3:n suodatussäännöt kuvaavat vielä vanhaa sääntöä (yksi osamerkkijono; * ja ( haetaan kirjaimellisesti). Päivitys B-013:n ja B-014:n mukaiseksi kuuluu UX:lle (ei lupaa minulle).
- Muutetut tiedostot: src/domain/cardSearch.ts, src/domain/cardSearch.test.ts, src/ui/texts.ts, src/ui/CatalogView.tsx, src/ui/CatalogView.filters.test.tsx, docs/UX.md, docs/ARCHITECTURE.md, CHANGELOG.md, docs/reports/UX-002-*, TXT-002-*, BREAK-002-*.

### Luovutus 2026-10-01 · Koodari → PM
- Mitä tehtiin: korjauskierroksen löydökset UX-002 (= B-015), TXT-008, TXT-009, TXT-010, B-013, B-014.
- Mitä pyydän: D-009:n mukainen tarkistus ja Done-päätös. UX:lle UX.md 5.3:n päivitys (yllä).
- Mistä katsoa: commitit a6890e9 ja 74404fe, PR #3:n esikatselu.
- Tunnetut rajoitteet: sanahaku tekee yhdestä kirjaimesta laajan osuman (esim.  löytää kaikki kortit, joissa on v-kirjain), kuten ennenkin.
- Testit: `npx vitest run --dir src` 136/136 läpi, `npm run lint` ja `npm run build` läpi.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (testin tyyppivirhe buildissa) · Suosituksia 0