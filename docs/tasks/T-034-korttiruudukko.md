# T-034 · Korttiruudukko: iso kuva, pelin arvot (power, RAM) ja kokoelma samassa laatikossa
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02, aikaraja 45 min)
**Malli:** D-014 (kevyt). Ei erillistä suunnittelua. PM tarkistaa esikatselun, ja UX katselmoi MVP-1:n lopussa.
**Haara:** `t-034-korttiruudukko` (test-haarasta)

## Tavoite
Pelaaja tunnistaa kortin isosta kuvasta ja näkee pelin arvot ja oman kokoelmansa samasta paikasta. Mallina on käyttäjän kuvakaappaus: laatikoiden ruudukko.

## Hyväksymiskriteerit
- [ ] Korttilista on ruudukko laatikoita (taulukko poistuu). Laatikon sisältö ylhäältä alas:
  1. Iso kuva, koko laatikon levyinen.
  2. Nimi ja alaotsikko.
  3. Tyyppi ja väri.
  4. Arvot: hinta (cost), power ja RAM.
  5. Kokoelma: omistettu määrä ja lisää- ja poista-kontrolli (nykyinen `CountControl`).
- [ ] Power ja RAM tulevat korttidataan: `mapCard`, `cardFile` ja `cards.json` päivitetään, ja data haetaan uudelleen komennolla `npm run cards:update` (enintään 3 pyyntöä, SR-5). Tarkista ensin rajapinnan kenttien nimet. Puuttuva arvo näytetään merkillä "–", tai arvo jätetään pois samalla tavalla kuin nykyinen hinta.
- [ ] Ruudukko: desktopilla 3–4 saraketta (`repeat(auto-fill, minmax(~14rem, 1fr))`) ja 320 px:ssä yksi sarake ilman vaakavieritystä. Käytä vain olemassa olevia tokeneita.
- [ ] Kuvan koko: laatikkoon tehdään uusi `md`-koko (noin 360 px leveä) komennolla `cards:images`, tai Koodari perustelee toisen ratkaisun. Kuvat latautuvat laiskasti. Kuvan painallus avaa nykyisen dialogin (säilytetään). Puuttuvan kuvan paikkamerkki säilyy.
- [ ] Saavutettavuus: laatikko on `<li>` listassa (`<ul>`), nimi on otsikko (h3 tai sopiva taso), ja kontrollien nimet säilyvät. Suodatus, haku ja kokoelman ilmoitukset toimivat kuten ennen.
- [ ] Testit päivitetään (taulukon solutestit → laatikon rakenne). `npm test`, lint ja build menevät läpi. CHANGELOG `[Julkaisematon]` päivitetty.

## Rajaukset
- Ei uutta suodatinta powerille tai RAMille (IDEAS.md, jos tarpeen).
- Ei korttitekstiä (kykyjä) laatikkoon.

## Luovutukset
