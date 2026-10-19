# T-184: Korttinauha, merkintätila ja suodatinjärjestys

Haara `t-184-korttinauha` (test-haarasta). Tausta: käyttäjän palaute T-181:n paketista 2.

## Määrittely

1. **Merkintätila:** työkalurivin "Merkitse omat korttisi" -painike ei katoa. Samassa paikassa ja samalla koolla on painike "Lopeta merkitseminen" (sama elementti, joten fokus säilyy; tilan vaihto näkyy tekstinä ja painettuna ulkoasuna). Alapalkin Lopeta-painike säilyy.
2. **− ja +** keskitetään kortin leveyteen merkintätilassa ja Have/Want-ruudukossa (`.card-foot`).
3. **Infonauha uusiksi** (CardList, cards.css): rivi 1 nimi (1 rem, lihavoitu) sekä omistus- ja pakkamäärä oikealla. Rivi 2 viistetty cost-neliö kortin värillä, tyyppi (sama ulkoasu kaikille tyypeille, ei Legend-chippiä) ja rarity omalla pohjalla oikealla. Rivi 3 "P 6" ja "RAM 2". Kaikki 0.8125 rem, AA. Rarityllä on pohja (`surface-raised`) ja 1 px `border-strong` -reunus (≥ 3:1 molemmissa teemoissa). Ei laatikkoa.
4. Rajoitteet: ei uutta liikettä, ei sisäistä vieritystä, ei vaakaylivuotoa, 320 px 2 saraketta, 1280 px ≥ 5 korttia rivillä.
5. **Suodatinjärjestys:** "Myytävyys / Vain myytävät" siirretty Värin jälkeen, ennen avattavia ryhmiä (Harvinaisuus, Cost, Power, RAM). Sama komponentti toimii sivupalkissa ja mobiilipaneelissa.

## Luovutus

Tehty. Muutokset: `MarkOwnBanner.tsx` (MarkOwnButton active/onToggle), `ListToolbar.tsx`, `CatalogView.tsx` (fokus aina työkalurivin painikkeeseen), `CardList.tsx`, `cards.css`, `CardFilters.tsx`. Testit päivitetty vain muuttuneen sisällön osalta (Legend-chip poistui, foot keskitetty, nauhan korkeus, Lopeta-painikkeita kaksi).

Huomio: `.cost-gem`-peruskäyttäytyminen ylikirjoitti kortin värin (`--badge-color`) muualla; nauhassa väri on korjattu erikseen. Pakkalistojen pyöreä gem ennallaan. Mahdollinen jatko: sama värikorjaus pakkalistoihin.

Mittaukset (1280×800, Normaali): ensimmäinen kortti y=197, rivi 1 loppuu y=534 (merkintätilassa 582), 5 korttia/rivi, ox=0, suodatinpalkki 755 px. 320 px: 2 saraketta, ei vaakaylivuotoa, kortti 284 px (merkintätilassa 332). Kuvat: scratchpad `ux/t184/`.

Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (sama gem-värikorjaus pakkalistoihin).

Testit: koko sarja läpi, lint ja build läpi (DeckEditor-testi ylitti kerran 5 s aikarajan täydessä ajossa ja meni läpi erillisajossa).
