# T-001 · Kävelevä luuranko: korttilista rajapinnasta näytölle
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 0 · **Prioriteetti:** Must
**Suunnittelu:** Arkkitehti ☐ (teknologia ja rakenne, ADR) · Digiturva ☐ (ulkoinen rajapinta, korttikuvien käyttöoikeus) · UX ☐ (korttilistan näkymä ja tilat)
**Katselmoinnit:** Koodikatselmointi ☐ · Arkkitehti ☐ · Digiturva ☐ · UX ☐ · Testikäyttäjä ☐ · Dokumentoija ☐
**Riippuvuudet:** T-000 (Done). Julkaisuputken workflowt ovat jo haarassa `t-001-kaveleva-luuranko`.
**Haara:** `t-001-kaveleva-luuranko`

## Tavoite
Rakennetaan ohut päästä päähän toimiva versio: sovellus hakee Cyberpunk TCG:n kortit Netdeck.gg:n julkisesta rajapinnasta ja näyttää ne listana. Samalla todennetaan, että build, testit ja julkaisuputki (PR → esikatselu-URL → test) toimivat. Kaikki MVP-1:n työ rakentuu tämän päälle.

## Hyväksymiskriteerit
- [ ] Teknologia- ja rakennepäätös on kirjattu ADR:ksi DECISIONS.md:hen ja ARCHITECTURE.md:hen. Päätöksessä on vähintään kaksi vaihtoehtoa, ja build tuottaa `dist/`-kansion, jota workflowt odottavat.
- [ ] `npm ci`, `npm run build`, `npm test` ja `npm run lint` menevät läpi puhtaasta kloonista. Ajo-ohje on STATUS.md:ssä.
- [ ] Sovellus näyttää kaikki rajapinnan kortit (kaikki sivut, ei vain ensimmäiset 60) nimellä, tyypillä ja hinnalla. Korttimäärä vastaa rajapinnan `total`-kenttää.
- [ ] Näkymässä on lataus-, virhe- ja tyhjä tila. Kun rajapinta ei vastaa, käyttäjä näkee ymmärrettävän virheilmoituksen eikä teknistä tietoa.
- [ ] Rajapintakutsut on eristetty omaan kerrokseensa (PROJECT.md:n riski), ja kerroksella on yksikkötestit, jotka eivät kutsu oikeaa rajapintaa.
- [ ] PR testiin tuottaa toimivan esikatselu-URL:n, ja yhdistäminen testiin päivittää testisivuston https://cyberdeck-tcg-test.web.app.

## Rajaukset (ei kuulu tähän)
- Kokoelman merkintä, pakat ja haku (MVP-1)
- Pakkalistan tuonti (MVP-1)
- Korttikuvat, jos niiden käyttöoikeus ei ole selvillä. Tekstipohjainen lista riittää MVP-0:aan.
- Välimuisti tai offline-tila (Arkkitehti voi kirjata sen tulevaksi tehtäväksi)

## Työloki
### Checkpoint 2026-09-30 · PM
- Tehty: PROJECT.md hyväksytty (D-004), kortti määritelty, tila Ready.
- Seuraava askel: Arkkitehti tekee teknologia- ja rakennepäätöksen. UX ja Digiturva suunnittelevat rinnakkain.
- Avoimet kysymykset: `gh`-työkalu puuttuu PM:n ympäristöstä, mikä estää PR:n avaamisen (käyttäjä).

## Luovutukset
