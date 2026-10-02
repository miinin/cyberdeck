# T-027 · Korttikuvat näkyviin (151 kuvan paketti käyttäjältä)
**Tila:** Ready (rakennetaan T-026:n päälle) · **Omistaja:** Arkkitehti (osa T-026:n ADR:ää) → UX → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-012)
**Suunnittelu:** Arkkitehti ☐ (tiedostomuoto, nimeäminen, sijainti, koot, tuontikomento) · UX ☐ (missä ja miten kuva näkyy)
**Katselmoinnit:** Koodikatselmointi ☐ · UX ☐ · Digiturva ☑ (SEC-006-t027: ei Critical-, High- eikä Medium-löydöksiä; sharp hyväksyttävissä; SEC-019 Low, SEC-020 Info)
**Riippuvuudet:** T-026. Toteutus voidaan tehdä valmiiksi paikkamerkkikuvilla ennen kuin paketti saapuu.
**Haara:** `t-027-korttikuvat`

## Tavoite
Pelaaja tunnistaa kortin kuvasta (D-012). Kun käyttäjän kuvapaketti saapuu, kuvat tulevat näkyviin yhdellä komennolla ilman koodimuutoksia.

## Hyväksymiskriteerit
- [ ] Kuvien tuonti: komento ottaa käyttäjän kansion (151 kuvaa), yhdistää kuvat kortteihin (`Card.key` tai Arkkitehdin päättämä sääntö) ja optimoi ne verkkoon. Se raportoi kuvat, joille ei löydy korttia, ja kortit, joilta puuttuu kuva.
- [ ] Kortin kuva näkyy UX:n suunnittelemassa paikassa. Kuvalla on vaihtoehtoinen teksti, ja kuvat latautuvat laiskasti, jotta lista pysyy nopeana.
- [ ] Puuttuva kuva ei riko näkymää (paikkamerkki).
- [ ] Kuvat ovat omalla originilla (CSP `img-src 'self'`), eikä rajapinnan `image_url`ia käytetä (SR-1).
- [ ] Testit, lint ja build menevät läpi. axe 0 rikkomusta.

## Rajaukset (ei kuulu tähän)
- Painoskohtaiset kuvat (alt-artit, D-007)

## Työloki
### Checkpoint 2026-10-02 · PM
- Kortti määritelty (D-012). Odottaa T-026:n ADR:ää ja käyttäjän kuvapakettia (toteutus voi alkaa paikkamerkeillä).

### Checkpoint 2026-10-02 · Arkkitehti
- Tehty: kuvien rakenne D-013:n osassa 4 ja ARCHITECTURE.md:n luvussa 13.8 (sijainti, muoto, koot, tuontikomento, yhdistämissääntö, raportti ja välimuisti).
- Kesken: –
- Seuraava askel: PM hyväksyttää sharpin (PM ja Digiturva) ja kysyy käyttäjältä kuvapaketin muodon (K-I1–K-I4). UX suunnittelee kuvan paikan ja alt-tekstin. Sen jälkeen Koodari.
- Avoimet kysymykset: alla (K-I1–K-I4 käyttäjälle, A4 PM:lle).
- Muutetut tiedostot: docs/DECISIONS.md, docs/ARCHITECTURE.md, docs/tasks/T-027-korttikuvat.md

## Luovutukset

### Luovutus 2026-10-02 · Arkkitehti → PM → UX → Koodari
- **Mitä tehtiin:** D-013 osa 4 ja ARCHITECTURE.md 13.8. Kuvat ovat Viten assetteina `src/assets/cards/{sm,lg}/<key>.webp` (tiivisteelliset URL:t, vuoden välimuisti) ja `getCardImage(key)` `import.meta.glob`illa. WebP: `sm` 240 px ja `lg` 720 px leveä, laatu 80, metatiedot poistetaan. Tuonti `npm run cards:images -- <kansio>`: yhdistäminen järjestyksessä map-tiedosto → `normalizeCardName` = `key` → Netdeckin slug → yksiselitteinen pelkkä nimi. Raportissa ovat yhdistetyt, kortittomat tiedostot, kuvattomat kortit, hylätyt, ohitetut ja orvot. Alkuperäisiä ei commitoida. Arvio: optimoidut kuvat noin 9–15 Mt gitissä.
- **Mitä pyydän:**
  - PM ja Digiturva: hyväksyntä devDependencylle `sharp@0.35.5` (Apache-2.0; libvips-binäärit LGPL-3.0-or-later; ei install-skriptejä; CI:n `npm ci` lataa noin 38 Mt binäärejä, jotka eivät päädy `dist/`iin). Jos ei hyväksytä, varapolku on käsin muunnetut WebP-kuvat (D-013 osa 4, B).
  - UX: kuvan paikka (lista, yksityiskohta vai molemmat), näyttökoot (`CARD_IMAGE_WIDTH`), alt-teksti ja paikkamerkin ulkoasu.
  - Koodari: toteutus luvun 13.8 mukaan. Askeleet: (1) `matchImages.ts` + testit nimilistoilla (ei kuvia), (2) `convertImage.ts` ja `importImages.ts` + testi sharpilla luodulla pienellä kuvalla väliaikaiskansiossa, (3) `src/domain/cardImage.ts`, `src/data/cardImages.ts` ja `CardImage.tsx` paikkamerkillä, (4) `.gitignore`: `card-images-src/`. Kun paketti saapuu: aja tuonti, lue raportti, ratkaise poikkeamat map-tiedostolla, commitoi tulosteet ja kirjaa raportin luvut korttiin.
- **Mistä katsoa:** D-013 osa 4 ja osa 5, ARCHITECTURE.md 13.2, 13.7 ja 13.8.
- **Tunnetut rajoitteet ja riskit:** Kuvapaketin muoto on tuntematon, joten yhdistämissäännöt 2–4 ovat arvaus ja map-tiedosto on varapolku. Spark-tason siirtokiintiö on 10 Gt/kk (ylitys poistaa sivustot käytöstä kuukauden loppuun), ja sitä torjuvat laiska lataus, pienet pikkukuvat ja vuoden välimuisti. Kuvasuhde 63 × 88 mm on oletus, joka tarkistetaan paketista. Riski R-1 on hyväksytty (D-012), mutta kuvia ei saa käyttää kaupallisesti (SECURITY.md luku 7).
- **Kysymykset käyttäjälle (PM välittää):**
  - K-I1: Miten kuvatiedostot on nimetty? Esim. kortin nimellä ("V - Streetkid.png"), keräilynumerolla ("A027.jpg") vai muuten? Yksi esimerkkinimi riittää.
  - K-I2: Missä muodossa ja kuinka suuria kuvat ovat (PNG, JPG vai WebP, noin montako Mt yhteensä)?
  - K-I3: Onko paketissa yksi kuva per kortti (151), vai myös painosversioita (alt-art) tai kortin takapuoli? Painokset on rajattu pois (D-007), joten niistä käytetään vain yhtä.
  - K-I4: Saako alkuperäiset kuvat jättää pois gitistä (repoon tulevat vain sovelluksen pienennetyt versiot)? Ehdotus: kyllä.
  - Lisäksi suositus käyttäjälle (ei blokkaa): aseta Firebase-konsolissa säilytettävien julkaisujen määräksi esim. 10 per sivusto (D-013 osa 5).
- **Avoin PM:lle:** A4: T-027:n tila voi olla Ready heti, kun sharp on hyväksytty ja UX-suunnittelu on tehty. Kuvapaketti tarvitaan vasta viimeiseen askeleeseen.
- **Testit:** Ei koodia. `npm view` -tarkistukset (sharp-versio, lisenssit ja skriptit) 2026-10-02.

### Checkpoint 2026-10-02 · PM (käyttäjän vastaukset K-I1–K-I4)
- Kuvat ovat pääkansion `public/cards/`-hakemistossa: 151 tiedostoa, valmiiksi .webp-muodossa, yhteensä 14 Mt. Kansio on `.gitignore`ssa (T-025-haarassa, commit "Untrack card images"). Huom: T-025:n Koodari commitoi kuvat vahingossa (c31f42c), ja PM poisti ne seurannasta. Kuvat ovat T-025-haaran historiassa, mutta niitä ei ole enää työpuussa (L-005).
- K-I1 nimeäminen: kortin nimi alaviivoin, esim. `Corpo_Security.webp`, `6th_Street_Recruits.webp`, `(Don't_Fear)_The_Reaper.webp`, `Adam_Smasher_Ender_of_Legends.webp`. Alaotsikko voi olla mukana ilman erotinta, joten yhdistämiseen sopii `normalizeCardName` (alaviiva = välilyönti) → `Card.key`, ja varapolkuna pelkkä nimi.
- K-I2 muoto: .webp. Tarkistettava: sharpia ei ehkä tarvita, jos koot ovat jo sopivat. Arkkitehti tai Koodari mittaa kuvien mitat ja päättää, riittääkö kopiointi ja uudelleennimeäminen (`src/assets/cards/<key>.webp`) ilman muuntoa. Jos riittää, D-013:n osan 4 sharp-riippuvuus jätetään pois (kirjataan D-013:een).
- K-I3: vain perusversiot. Erikoisversiot (alt-art) lisätään myöhemmin, matala prioriteetti (D-007, painokset).
- K-I4 (alkuperäiset pois gitistä): käyttäjä ei vastannut erikseen. Oletus: kyllä, kuten D-013.
- Seuraava askel: T-026 valmiiksi, sitten UX suunnittelee kuvan paikan ja Koodari toteuttaa T-027:n.

### Luovutus 2026-10-02 · UX → PM → Koodari (suunnitelma)
- **Ratkaisu:** listan jokaisella rivillä pikkukuva (`sm`), jonka painallus avaa natiivin `<dialog>`in isolla kuvalla (`lg`). Yksityiskohtanäkymää ei tehdä.
- **Lista (`CardList.tsx`):** uusi ensimmäinen sarake `Kuva` (`th scope="col" class="col-fit col-image"`). Solussa `<CardImage card size="sm" onOpen>`. Nimisolu pysyy `<th scope="row">`. Pikkukuvan kuvasuhde on 63/88, leveys desktopilla 3.5rem ja mobiilissa 3rem. Reuna 1 px `--color-border`, tausta `--color-surface`. `<img width=160 height=224 alt="" loading="lazy" decoding="async">` napin sisällä: `<button type="button" class="card-image-button" aria-haspopup="dialog">`. Napin nimi on visually-hidden "Suurenna kuva: <CardName lang=en>". Fokus `--focus-ring`/`--focus-offset`, hover reuna `--color-info`.
- **Mobiili (< 40 rem):** kuvasolu riville 2 (`order: 3; flex: none`), ja rivi 1 (nimi ja määrä) pysyy ennallaan. Tarkista 320 px:ssä, 360 px:ssä ja 400 % zoomilla. Jos asettelu ei toimi, palauta PM:lle.
- **Puuttuva kuva:** `getCardImage(key) === null` tai `onError` → `<span class="card-image card-image--missing" aria-hidden="true">` (katkoviivareuna `--color-border-strong`), ei nappia, ei tekstiä.
- **Dialogi:** yksi `<dialog class="card-dialog" aria-labelledby="card-dialog-title">` `CatalogView`issa, tila `openCard: Card | null`, `showModal()`. Ylärivillä `h2#card-dialog-title lang=en` (CardName) ja `Sulje`-nappi (ensimmäinen fokusoitava). Alla `<img width=720 height=1006 alt="{nimi}" lang=en loading="eager">`. Sulkeminen: Esc, Sulje ja klikkaus taustaan. Fokus palaa avanneeseen nappiin, tai hakukenttään, jos rivi on poistunut. Leveys `min(30rem, 100vw - 2*space-3)`, `max-height: calc(100dvh - 2*space-3)`, `overflow: auto`, img `max-width: 100%; height: auto`. Tausta `--color-bg`, reuna `--color-border-strong`, sisäväli `--space-4`. `::backdrop` tokenista. `body:has(dialog[open]) { overflow: hidden }`. Ei animaatioita. Latausvirhe: `<p role="alert">Kuvaa ei voitu ladata.</p>`.
- **Koot:** `CARD_IMAGE_WIDTH = { sm: 160, lg: 720 }` (ARCHITECTURE.md 13.8: 240 → 160). Lähdekuvat ovat 733×1024, joten kuvasuhde täsmää. `sm` vaatii pienennyksen → sharp.
- **Tekstit (`texts.ts`):** `columnImage = 'Kuva'`, `enlargeImage = 'Suurenna kuva: '`, `closeDialog = 'Sulje'`, `imageLoadError = 'Kuvaa ei voitu ladata.'`.
- **Testit:** jsdomin `showModal`/`close` stubataan. Testaa nappi vs. paikkamerkki, `onError`, napin nimi ja puuttuvan kuvan polku. axe 0 sekä listassa että dialogissa.
- **Ideat → IDEAS.md:** nuolinäppäinselaus dialogissa, ruudukkonäkymä, `srcset`.

### Checkpoint 2026-10-02 · PM
- UX:n dialogiratkaisu hyväksytty (`CardImageDialog`). sharp hyväksytty sm-kuviin (D-013 osa 4), ja Digiturva tarkistaa sen katselmoinnissa. Käyttäjä nosti T-027:n kaiken muun edelle (2026-10-02). Tila Ready, kun T-026 on Done.

### Checkpoint 2026-10-02 · Koodari
- Suunnitelma (toteutettu): (1) `matchImages` + testit, (2) `importImages` + sharp-muunnin + `cards:images` + map-tiedosto, (3) tuonti ja optimoidut kuvat, (4) `cardImages`, `CardImage`, `CardImageDialog`, lista ja CSS, (5) dokumentit.
- Tehty: commitit 071b4a0 (tuonti), a42ed2d (kuvat), 49f69b6 (käyttöliittymä) ja dokumentticommit.
- Kesken: –
- Seuraava askel: katselmoinnit (UX ja Digiturva).
- Avoimet kysymykset: ei blokkaavia (katso luovutus).
- Muutetut tiedostot: package.json, package-lock.json, .gitignore, scripts/cards-images.mjs, scripts/cards/{matchImages,importImages}.ts (+ testit), scripts/cards/convertImage.mjs (+ testi), scripts/cards/card-images.map.json, src/domain/cardImage.ts, src/data/cardImages.ts (+ testi), src/assets/cards/{sm,lg}/*.webp (302), src/ui/{CardImage,CardImageDialog}.tsx (+ testi), src/ui/{CardList,CatalogView,texts}.ts(x), src/styles.css, src/test/setup.ts, src/App.test.tsx, src/ui/CatalogView*.test.tsx, docs/ARCHITECTURE.md, CHANGELOG.md.

**Tuontiraportti** (`npm run cards:images -- <pääkansio>/public/cards`, 2026-10-02, noin 17 s):
- Lähde: 151 WebP-tiedostoa, 733 × 1024 px, yhteensä 14 Mt. Alkuperäisiä ei commitoitu.
- Muunnettu 151 / yhdistetty 151. Säännöt: `key` 130, `slug` 9, `map` 12. Kortittomia tiedostoja 0, hylättyjä 0, ohitettuja 0, kuvattomia kortteja 0, orpoja 0.
- Tulosteet: `sm` 160 × 224 px, yhteensä 1,7 Mt (noin 11 kt/kuva). `lg` 720 × 1006 px, yhteensä 11 Mt (noin 73 kt/kuva). Metatiedot poistettu (tarkistettu sharpilla).
- **Kaksi paketin tiedostoa oli nimetty väärin** (tarkistettu katsomalla kuvat): `Modded_Muramasa.webp` on oikeasti *Bootleg Black Sapphire Show* ja `Panam_Palmer_Nomad_Cavalry_ri17.webp` on *Panam Palmer — Strength Through Family*. Oikea Modded Muramasa on `Modded_Muramasa_lwjp.webp`. Korjattu map-tiedostolla. Kaikkien 151 kuvan nimialue käytiin läpi kontaktiarkeilla, ja muut nimet täsmäsivät. Osalla Legend-korteista nimi on kuvan yläosassa rajauksen ulkopuolella, joten ne tarkistettiin vain tiedostonimen perusteella.
- Map-tiedoston 12 riviä: 6 tiedostoa, joista aksenttikirjain puuttuu (`Gilded_Mat_n`, `Judy_lvarez` ×2, `Les_l_mens`, `El_Sombrer_n`, `Muamar_Reyes_El_Capit_n`), 3 satunnaisella päätteellä (`_v7sd`, `_vleh`, `_bxcf`) ja edellä mainitut 3.

## Luovutukset (Koodari)

### Luovutus 2026-10-02 · Koodari → PM → UX ja Digiturva
- **Mitä tehtiin:** `npm run cards:images -- <kansio>` (sharp, yhdistäminen map → avain → slug → nimi, raportti). 151 kortin kuvat `src/assets/cards/{sm,lg}/<key>.webp` (12,7 Mt). Listan ensimmäinen sarake "Kuva": pikkukuva napissa, joka avaa natiivin modaalidialogin isolla kuvalla. Puuttuva kuva tai latausvirhe → katkoviivakehys. Toteutuksen poikkeamat suunnitelmasta: ARCHITECTURE.md "T-027 · Koodari".
- **Mitä pyydän:**
  - UX: katselmointi (lista, mobiilin rivi 2, dialogi, fokus, axe). Tarkista erityisesti: dialogin avaus piilottaa sivun vierityspalkin (`body:has(dialog[open]) { overflow: hidden }`), jolloin sisältö hyppää desktopilla noin 15 px sivulle. Korjaus olisi esim. `scrollbar-gutter: stable`, jos UX haluaa.
  - Digiturva: sharp-riippuvuus (`npm audit`: 0 haavoittuvuutta asennuksen jälkeen), tuontiskriptin polut ja map-tiedoston validointi, `img-src 'self' data:` riittää (kuvat ovat `/assets/`-polussa).
- **Mistä katsoa:** commitit 071b4a0, a42ed2d, 49f69b6 ja dokumentticommit haarassa `t-027-korttikuvat`. Ajo: `npm ci`, `npm run dev`. Tuonti uudelleen: `npm run cards:images -- <kansio>`.
- **Tunnetut rajoitteet ja riskit:**
  - Haara on tehty `t-026-korttidata`-haarasta, joten diff `origin/test...HEAD` sisältää myös T-026:n. T-027:n oma diff: `git diff a844792..HEAD`.
  - Repo kasvaa 12,7 Mt (302 binääriä), kuten D-013 arvioi.
  - Isoon kuvaan ei ole uudelleenyritystä: jos `lg` epäonnistuu kerran, saman kortin dialogi näyttää virheen, kunnes sivu ladataan uudelleen.
  - Selaintarkistus tehtiin paikallisesti headless-Chromella (`vite preview`): 320 px (tumma teema) ja 1280 px (vaalea). Ei vaakavieritystä 320 px:ssä, laiska lataus toimii (17 / 151 kuvaa ladattu 320 px:ssä, 38 / 151 desktopilla), dialogi aukeaa, fokus menee Sulje-nappiin, Esc sulkee ja fokus palaa pikkukuvaan. 400 % zoomia, ruudunlukijaa ja axea ei ajettu (UX).
  - Pääkansion `public/cards` ja tämän worktreen seuraamaton `public/` (151 alkuperäistä kuvaa, ei minun tekemäni) eivät ole gitissä. Worktreen `public/` päätyy paikalliseen `dist/`iin, jos buildaa tässä kansiossa, mutta CI:n puhtaaseen buildiin se ei vaikuta. Sen voi poistaa.
- **Testit:** `npm test` 24 tiedostoa, 455 testiä läpi. `npm run lint` 0 virhettä ja varoitusta. `npm run build` (sis. `tsc --noEmit`) läpi.
- **Uusi riippuvuus:** `sharp@0.35.5` (devDependency, tarkka versio). Apache-2.0, libvips-binäärit LGPL-3.0-or-later, ei install-skriptejä (Arkkitehdin tarkistus 2026-10-02).
- Koodikatselmointi: tehty · Pakollisia korjattu 2 (raportin järjestys riippui `localeCompare`n lokaalista → koodiyksikköjärjestys; muuntamatta jääneen kuvan kortti puuttui kuvattomien listasta väärässä järjestyksessä → lasketaan korttien järjestyksessä) · Suosituksia 2 (vierityspalkin hyppy dialogissa UX:lle; ison kuvan uudelleenyritys, ei velkatehtävää ennen UX:n kantaa)

### Luovutus 2026-10-02 · UX → PM (katselmointi, UX-006)
- **Mitä tehtiin:** T-027:n UX-katselmointi ja T-026:n kevyt katselmointi esikatselussa (PR #9). Raportti `docs/reports/UX-006-t027-korttikuvat.md`. UX.md päivitetty (v0.10): poistuneet tilat ja latauspalkki merkitty vanhentuneiksi (4, 4.5, 7.5, 7.7, 7.9, 7.10), uusi luku 9 (korttikuvat).
- **Tulos:** axe 0 rikkomusta listassa ja dialogissa (320 ja 1280 px). Näppäimistö, fokus (Sulje, Esc → takaisin nappiin), taustan inertti, tausta-klikkaus, paikkamerkki, 320 px sekä 200 ja 400 % zoom OK, ei vaakavieritystä. Critical 0, High 0, Medium 0, Low 3 (UX-040 scrollbar-gutter, UX-041 ison kuvan uudelleenyritys, UX-042 Info). **Veto: ei, ei blokkaavia.**
- **Suositukset:** UX-040 (`html { scrollbar-gutter: stable }`, yksi rivi) korjattavaksi, jos Koodari koskee CSS:ää muutenkin, muuten velka. UX-041 velka (kiertotie: sivun päivitys, harvinainen).
- **Rajoitteet:** ruudunlukijaa ei ajettu. Vierityspalkin hyppyä ei voitu mitata headless-selaimessa.

### Luovutus 2026-10-02 · Digiturva → PM
- **Mitä tehtiin:** tietoturva- ja tietosuojakatselmointi `git diff a844792..HEAD` ja esikatselu PR #9. Raportti `docs/reports/SEC-006-t027-korttikuvat.md`. SECURITY.md luku 15 (kuvien uhkamalli, R-1:n tekniset ehdot todennettu) ja muutosloki, PRIVACY.md muutosloki. SEC-016 (T-026) merkitty Varmistetuksi SEC-005-raporttiin (PR #9:n esikatselun `curl -sI`: CSP `connect-src 'self'`, `/assets/**` vuoden välimuisti).
- **sharp@0.35.5:** hyväksyttävissä. Apache-2.0 (libvips LGPL-3.0-or-later, devDependency, ei `dist/`issä), ei install-skriptejä (lockfilessa `hasInstallScript` 0), 31 uutta pakettia kaikki npm-rekisteristä tiivisteineen, `npm audit` 0.
- **Hyväksymiskriteeri "omalla originilla, ei `image_url`ia":** todennettu esikatselussa (`/assets/<key>-<hash>.webp`, `image/webp`, `nosniff`, CSP ennallaan; `image_url` ei bundlessa).
- **Löydökset:** Critical 0 · High 0 · Medium 0 · Low 1 (SEC-019: worktreen `public/*.webp`-alkuperäiset eivät ole `.gitignore`ssa; poista ne ja harkitse `/public/*.webp` ignoreen) · Info 1 (SEC-020: alkuperäiset `test`-historiassa c31f42c, ei toimenpidettä).
- **Veto:** ei. Done-tilaa ei estetä tietoturvan perusteella.
- **Testit:** `npx vitest run` 26 tiedostoa, 484 testiä läpi. Metatiedot tarkistettu kaikista 302 kuvasta.
