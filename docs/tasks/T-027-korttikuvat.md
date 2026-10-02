# T-027 · Korttikuvat näkyviin (151 kuvan paketti käyttäjältä)
**Tila:** Backlog (T-026, kuvapaketti) · **Omistaja:** Arkkitehti (osa T-026:n ADR:ää) → UX → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-012)
**Suunnittelu:** Arkkitehti ☐ (tiedostomuoto, nimeäminen, sijainti, koot, tuontikomento) · UX ☐ (missä ja miten kuva näkyy)
**Katselmoinnit:** Koodikatselmointi ☐ · UX ☐ · Digiturva ☐ (tiedostot, `img-src`, R-1)
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
