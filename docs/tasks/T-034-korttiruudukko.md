# T-034 · Korttiruudukko: iso kuva, pelin arvot (power, RAM) ja kokoelma samassa laatikossa
**Tila:** Review · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02, aikaraja 45 min)
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
### Luovutus 2026-10-02 · Koodari → PM
- Mitä tehtiin: taulukko korvattu ruudukolla (`ul.card-grid` > `li.card-box`: kuva, h3-nimi, tyyppi ja väri, `dl` hinta/Power/RAM, kokoelmakontrolli). `power` ja `ram` lisätty malliin, `mapCard`, `cardFile` (validointi) ja `cards.json` (haettu `cards:update`, 1 pyyntöjakso; API-kentät `power`, `ram`; ram 150/151 ja power 98/151 kortilla). Kuvakoko `sm` (160) korvattu `md`:llä (360), `src/assets/cards/md` luotu `cards:images`-komennolla (151/151, 4,8 Mt), `sm` poistettu. Vanhat taulukon CSS-säännöt poistettu, uusi ruudukko-CSS (auto-fill, minmax(min(14rem,100%),1fr)), vain olemassa olevia tokeneita.
- Tekstit: uudet `Power`, `RAM` (pelitermit sellaisenaan) ja ruudunlukijan "ei poweria", "ei RAMia" (texts.ts). CONTENT.md:n sanastoon ei lisätty, Sisällöntuottajan tarkistettava.
- Mitä pyydän: PM tarkistaa esikatselun (ei ajettu selaimessa, vain jsdom-testit). UX katselmoi MVP-1:n lopussa.
- Tunnetut rajoitteet: ei visuaalista tarkistusta selaimessa; 3–4 saraketta riippuu sisältöalueen leveydestä. Vanha UX.md 6.4 (taulukko) on vanhentunut, UX päivittää. ARCHITECTURE.md kuvaa vielä `sm`-koon.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 2 (ARCHITECTURE.md ja UX.md päivitettävä: sm→md, taulukko→ruudukko)
- Testit: vitest 73 tiedostoa / 1440 testiä läpi, lint ja build (tsc + vite) läpi. `npm ci` kaatui EPERM-lukkoon (vanhat `vite preview` -prosessit pääkansion node_modulesissa, PIDit 30764, 32436, 34448); `npm install` korjasi, package-lock ei muuttunut.

### PM 2026-10-02 · Done (D-014)
- Esikatselu PR #10 tarkistettu kuvakaappauksella (1280 px): ruudukossa 3 saraketta, laatikossa kuva, nimi, tyyppi ja väri, Hinta/Power/RAM ja +-kontrolli. 320 px:ää ei voitu luotettavasti kuvata headless-Chromella (ikkunan vähimmäisleveys). UX tarkistaa sen MVP-1:n lopussa.
- Jatkoon: ARCHITECTURE.md (sm→md) ja UX.md 6.4 (taulukko→ruudukko) päivitetään MVP-1:n lopun katselmoinneissa. Uudet termit Power ja RAM CONTENT.md:hen samalla.
