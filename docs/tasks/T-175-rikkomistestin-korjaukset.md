# T-175 · Rikkomistestauksen BREAK-T172-T173 korjaukset
**Tila:** Done · **Omistaja:** PM · **MVP:** 1 · **Prioriteetti:** Must
**Lähde:** `docs/reports/BREAK-T172-T173.md` (6 löydöstä: 1 pakollinen, 5 suositusta).

## Korjataan (kaikki kuusi, yksi julkaisu)
- BRK-01: Gear ilman mahdollista kohdetta → `no-target`, Pelaa pois käytöstä ja syy näkyy.
- BRK-02: Pidä käsi -teksti käyttää oikeaa kädenkokoa.
- BRK-03: kohdistus käteen (aloitus, Pelaa uudestaan) tai otsikkoon (Aloita alusta).
- BRK-04: pakkaus lisätään pooliin vasta paljastuksen jälkeen (ja vain, jos askel on yhä seuraava, joten toistettu klikkaus ei lisää sitä kahdesti).
- BRK-05: Tallenna pakaksi on pois käytöstä tallennuksen jälkeen, kunnes poolia tai pakkaa muutetaan.
- BRK-06: "Pakassa ei ole Legendejä" -viesti ja syy `no-legends`.

## Luovutus

### PM · 2026-10-17 · Tila: valmis
Toteutus suoraan `test`-haarassa (D-029). Koska BRK-04 muuttaa sealed-poolin tallennusta, muutos käy ensin devissä. Lisätty testit (`goldfish.test.ts`) BRK-01:lle ja BRK-06:lle.
`npm run lint` ja `npm run build` menevät läpi. `npm test`: 1963/1964 läpi. `CatalogView.wantCleanup` kaatui koko ajossa, mutta meni yksin ajettuna läpi, eli se on todennäköisesti kuormasta johtuva aikakatkaisu eikä liity tähän muutokseen.
