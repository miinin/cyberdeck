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

## Luovutukset
