# STATUS · päivitetty 2026-10-19 (PM)

## Yhdellä lauseella
Kaikki T-179:ään asti on tuotannossa (https://cyberdeck-tcg.web.app): kokoelma, kansio ja skanneri (myös jatkuva ja kansiosivu), want-lista ja jakolinkit (lyhyt vaihtolinkki), pakkaeditori näkymineen ja tilastoineen, julkiset pakat, proxyt, fi/en sekä mobiilinäkymä.

## MVP-taso
Työn alla: MVP-1:n loppu. Loppukatselmoinnit tehty 2026-10-17: UX ja testikäyttäjä (docs/reports/MVP1-UX-2026-10-17.md, korjattu T-174), Digiturva (SEC-T172-T173) ja rikkomistestaus (BREAK-T172-T173). Avoinna: UX-17, UX-30 ja UX-31.

## Nyt työn alla
| Tehtävä | Agentti | Tila | Seuraava askel |
|---|---|---|---|
| T-181 visuaalinen uudistus | Koodari | Paketit 0 ja 1 (design-järjestelmä) testissä, T-183 tehty | Paketti 2 (Kortit) Koodarilla, FI/EN-lipputeksti oletuksella "Suomi (FI)" (käyttäjä voi muuttaa). Dependabot #192 ja #193 (firebase 13: dev ja Digiturva) |

## Avoimet
- `ubuntu-latest` siirtyy Ubuntu 26:een 2026-10-19 alkaen (GitHubin ilmoitus). Tarkista ensimmäinen ajo sen jälkeen.
- Preview-kanavien poisto PR:n sulkeutuessa (preview.yml, delete_preview): PR #135:n sulkeutumisajo epäonnistui ennen korjausta 433eb35 (checkout ja listausvirheen näyttö). Korjaus varmistetaan seuraavan PR:n sulkeutumisajosta.
- Skannerin tarkistus muilla kuin sinisillä korteilla oikeilla kuvilla (T-113, käyttäjä).
- TASKS.md:n Backlog-rivit (T-002–T-008 sekä velat T-030, T-031, T-041–T-043, T-047).
- 79 puuttuvaa versiokuvaa: käyttäjä etsii ne.
- Testikäyttäjän ja UX:n katselmointi mobiilista.

## Blokkerit
- Ei blokkereita. (gh: `"C:/Program Files/GitHub CLI/gh.exe"`.)
- Paikallinen: vanhat `vite preview` -prosessit lukitsevat node_modulesin ja `.claude/worktrees/t-026`-kansion (poisto epäonnistui). Käyttäjä sulkee prosessit, minkä jälkeen kansion voi poistaa. Worktree t-027 on vielä rekisteröity (valmis, voi poistaa: `git worktree remove .claude/worktrees/t-027`).
- PM:n kuvakaappausskripti (CDP, 320 px, localStorage) oli istunnon scratchpadissa. Jos sitä tarvitaan, kirjoita uudelleen `scripts/`-kansion ulkopuolelle.

## Kysymykset käyttäjälle (ei blokkaa, edetään oletuksella)
- **UX-09 oletus:** näytetäänkö pakkaeditorin haussa uudelle pakalle oletuksena vain omistetut kortit? Oletus: Kaikki (suodatin toimii, T-174).
- **UX-17:** korttidialogi ja mobiilin testikäsi- ja Turnauslista-dialogit vierivät omassa vierityksessään. Tehdäänkö korttidialogista oma reitti, vai kirjataanko poikkeus? Oletus: ei muutosta.
- **T-173 bonus:** omien oikeiden avausten vertailu odotusarvoon vaatii avaushistorian (I-7).
- R-4 Tuotantojulkaisun suojaus: katso PM:n ehdotus T-001-kortissa. Oletus: ei muutoksia ennen erillistä testiprojektia.
- T-181 B.9: lippupainikkeissa näkyvä "FI"/"EN", saavutettava nimi "Suomi (FI)" / "English (EN)". Oletus, voi muuttaa.
- K1 "Hinta"-sarakkeen nimi ja K2 korttityypit englanniksi: UX ja Sisällöntuottaja suosittelevat molemmat näitä, joten ne on toteutettu näin.
- TXT-003: tarvitaanko alatunnisteeseen myös englanninkielinen fanisisältömerkintä (CD PROJEKT RED:n ohje)? Oletus: ei MVP-0:ssa.
- ~~K5~~ → ratkaistu, D-007 (korttitaso, valmius painoksille).
- ~~T-014-kysymys~~ → ratkaistu 2026-10-02: raportti ensin ja "Tallenna pakaksi" -painike, ei Koottu/Suunnitelma-tilaa (T-014-kortti).
- K-P1–K-P4 (tietosuoja, ei blokkaa MVP-1:tä): rekisterinpitäjä ja käsittelyperuste IP-osoitteille (ehdotus: sinä, oikeutettu etu), riittääkö ilmoitus ilman suostumusbanneria (ehdotus: kyllä), voivatko MVP-2:n käyttäjät olla alaikäisiä (selvitettävä ennen MVP-2:ta) ja Hosting-lokien säilytysaika (Firebase-konsoli). Katso PRIVACY.md.

## Kulutus (D-014, 2026-10-02: kevyt malli, katso CLAUDE.md. D-009 alla vain niiltä osin kuin ei ristiriitaa)
- Katselmoinnit riskin mukaan (agents.md v1.3). Testikäyttäjä ja Dokumentoija MVP-tason lopussa.
- Sonnet: Koodari, UX, Sisällöntuottaja, Testikäyttäjä, Dokumentoija. Opus: Arkkitehti ja Digiturva (D-014, malli on agenttimäärittelyssä).
- Yksi agentti kerrallaan (D-014). PM tyhjentää istunnon (`/clear`) tehtävien välissä ja jatkaa komennolla `/jatka`.

## Toimintatapa, kun käyttäjä on poissa (sovittu 2026-09-30)
- PM vie tehtävää eteenpäin agenttien työnkulun mukaan (suunnittelu → Koodari → katselmoinnit → testikäyttäjä → dokumentointi → PR testiin).
- Tekstit, nimet ja pienet käytettävyysvalinnat: valitaan suunnittelijan oletus, kirjataan tälle listalle, ja käyttäjä voi muuttaa ne myöhemmin.
- Tuotepäätös, riskin hyväksyntä, maksullinen palvelu tai peruuttamaton toimenpide: ei arvata. Kysymys kirjataan tälle listalle, kyseinen osa parkkeerataan, ja PM jatkaa muulla työllä.
- Ei koskaan ilman käyttäjää: main-haara, tuotantojulkaisu, `gh pr merge`, force push.
- **Poikkeus 2026-09-30:** käyttäjä valtuutti julkaisemaan T-001:n tuotantoon (`/julkaise`), kun se on Done (Definition of Done täyttyy kokonaan). Valtuutus koskee vain T-001:tä. Suojaushook kysyy silti luvan main-mergeen, ja PM ei ohita sitä.
- Kone ei mene lepotilaan (käyttäjä muutti asetuksen 2026-09-30).
- Testisivustolle vienti on sallittu (D-003).

## Viimeksi valmistuneet
- T-171 näkymävalitsin ei pompi, T-172 Goldfish "Pelaa yksin", T-173 virtuaaliboosterit ja sealed, T-174 MVP-1:n UX-korjaukset (2026-10-17).
- T-168 Turnauksen pakkalista tulosteena, T-169 Want-kysymys kokoelmaan lisätessä (D-035), T-170 pääpainikkeen hover (2026-10-16).
- T-167 Kortin tietolaatikko luettavaksi isolla näytöllä (2026-10-15).
- T-166 Kortin saatavuus tietolaatikossa: boostereissa vai ei, muut lähteet ryhmittäin ja kuvituksen "Ei boostereissa" -merkki (2026-10-14).
- T-164 Pakkojen kokoaminen: pakanvaihto, yhteensopivuus ja Kokoa kaikki; T-165 QR-koodi jakolinkeille (2026-10-13).
- T-158 Dependabot, T-160 V:n Iconic-kuvitukset eivät kuulu WNC-setteihin (2026-10-13).
- T-123 Galleria ja Merkitse omat kortit (2026-10-10).
- T-125 Kevyempi Kortit-sivun yläosa (2026-10-10).
- T-126 Kortit-sivu ei pompi näkymää vaihtaessa, checkmark-ikoni (2026-10-11).
- T-127 Kevyt ja pieni ilme kaikille sivuille, tiiviimpi merkintäpalkki (2026-10-11).
- T-128 Mobiilin otsikkorivin tasapaino (2026-10-11).
- T-129 Have/Want-yläosa ja Kokoelman valitsin (2026-10-11).
- T-130 DeckEditor-autosave-testi vakaaksi (2026-10-11).
- T-131 Matalampi merkintäpalkki (2026-10-12).
- T-132 Saavutukset Kokoelman Yleiskuvassa (I-8, 2026-10-12).
- T-133 Otsikon glitch näkyväksi, T-134 Nova Rare -laskenta (2026-10-12).
- T-135 Have/Want-uudistus ja vaihtosääntö (D-031, 2026-10-12).
- T-136–T-142 glitch, Have/Want-asettelu, hover-esikatselu, erikoiskuvitukset, osioiden värit (2026-10-12).
- T-143 oma Have-lista ja T-144 värimaailma (D-032, 2026-10-12).
- T-145 Have-listan pilvisynkka (2026-10-12).
- T-146–T-148 korttidata: setin rajaus, Beta-Iconicit ja V 005b (D-033).
- T-149 laatukierros, T-150 saavutukset, T-151–T-152 tagit, T-153 kortin kallistus (2026-10-12).
- T-122 Pakan tulosseuranta (2026-10-10, PR #137, D-030): pelien kirjaus, tilastot ja synkka tilille. Velka T-124 (SEC-122-7).
- T-084–T-094 (2026-10-05–06): ei nykimistä, gitleaks (D-023), hostingin kovennus, mobiilikorjaukset 1–4 (tietonäkymä, Lista), esikatselukanavien kiintiö, sideboard-rivit ja kelluva sääntöilmoitus (T-092), pakan tilastot uusiksi (T-093), dokumentaatio (T-094).
- T-047 Netdeck-kovennus (oma PR, valmistuu rinnakkain)
- T-053 Pakan tilastot ja testikäsi (2026-10-03, PR #25)
- T-052 Kelluva esikatselu, isommat kuvat, Cost/Power/RAM-suodattimet (2026-10-03, PR #24)
- T-051 Pakat-sivu ja tuontiraportti (2026-10-03, PR #22)
- T-050 UX-uudistus: koko leveys, korttipoimija, pakkasarake (2026-10-03, PR #22)
- T-049 Pakkaeditorin leveä asettelu, tiivis pakkalista ja kustannuskäyrä (2026-10-03, PR #20)
- T-048 Taulukon lajittelu sarakkeittain (2026-10-02, PR #19)
- T-015 Pakan vienti ja tuonti tiedostona (2026-10-02, PR #18)
- T-046 Pakan haku Netdeck-linkistä (2026-10-02, PR #17)
- T-045 Pakkaeditorin hiominen ja kuvanäkymä (2026-10-02, PR #16)
- T-014 Pakkalistan tuonti ja raportti (2026-10-02, PR #15)
- T-004 Lint ja testit CI:hin, T-024, T-029, T-032 (2026-10-02, PR #14)
- T-013 Pakanrakennus ja laillisuussäännöt (2026-10-02, PR #13)
- T-040 Selaus- ja muokkaustila, taulukkonäkymä (2026-10-02, PR #12)
- T-039 Teemavalitsin ikonina (2026-10-02)
- T-038 Tiivis yläosa (2026-10-02)
- T-037 Want-lista ja rarity (2026-10-02)
- T-036 Tyyppimerkki ja englanninkieliset pelitermit (2026-10-02)
- T-035 Hienosäätö: määräkontrolli, playset-tila, dialogin × (2026-10-02, PR #11)
- T-034 Korttiruudukko: iso kuva, Power ja RAM (2026-10-02, PR #10)
- T-033 Kevyt toimintamalli D-014 (2026-10-02)
- T-027 Korttikuvat: pikkukuva listassa ja iso kuva dialogissa, 151/151 (2026-10-02, PR #9)
- T-026 Korttidata sovelluksen mukana (2026-10-02, PR #8)
- T-025 Teemavalitsin, tumma oletuksena (2026-10-02, PR #7)
- T-021 Ulkoasu: Cyberpunk 2077 -henkinen ilme (2026-10-02)
- T-012 Kokoelma (2026-10-01)
- T-010 Haku ja suodatus (2026-10-01)
- T-011 Tietomalli ja paikallinen tallennuskerros (2026-10-01)
- T-001 Kävelevä luuranko: korttilista rajapinnasta näytölle (2026-10-01)
- T-000 Projektin alustus ja julkaisuputki (2026-09-30)

## Seuraavaksi (PM:n priorisointi)
1. UX- ja Testikäyttäjä-katselmointi mobiilista.
2. T-008 virhetilanteet.
3. T-023 iso tekstikoko.
4. Firebase-API-avaimen rajaus Cloud Consolessa (käyttäjä).
5. Puuttuvat versiokuvat (79 kpl).

**Tokenien säästö (käyttäjä 2026-10-02):** tokenit kuluvat nopeasti, ja käyttöraja katkaisi kaksi rinnakkaista Koodaria. Aja yksi agentti kerrallaan, pidä tehtävänannot lyhyinä ja tyhjennä istunto (`/clear`) tehtävien välissä.

## Julkaisuputki
- GitHub: https://github.com/miinin/cyberdeck
- Testisivusto: https://cyberdeck-tcg-dev.web.app (test-haara)
- Tuotanto: https://cyberdeck-tcg.web.app (main-haara, vain /julkaise)
- Kulku: t-XXX-haara → PR testiin (esikatselu-URL) → test → /julkaise → main (D-001, D-003)
- Workflowt ajavat `npm ci && npm run build` ja julkaisevat `dist/`-kansion.

## Ajo-ohje
Vaatii Node 22.13:n tai uudemman (workflowt: Node 22, kehityskone: Node 24.14).

```
npm ci              # riippuvuudet package-lock.jsonin mukaan
npm run dev         # kehityspalvelin, http://localhost:5173
npm test            # kaikki yksikkötestit kerran (Vitest, ei verkkokutsuja)
npm run test:watch  # testit tarkkailutilassa
npm run lint        # ESLint, 0 varoitusta sallittu
npm run build       # tyyppitarkistus + tuotantobuild → dist/
npm run preview     # dist/ paikallisesti (ilman firebase.jsonin otsakkeita)
npm audit --audit-level=high
npm run cards:update # korttidatan päivitys Netdeck.gg:stä → src/data/cards.json (kehittäjä ajaa käsin)
```

- Korttidata on sovelluksen mukana (`src/data/cards.json`, D-013). Sovellus ei kutsu Netdeckiä selaimessa. Avaimia tai ympäristömuuttujia ei tarvita.
- `npm run cards:update` tekee 3 pyyntöä `https://api.netdeck.gg`:hen, validoi datan ja kirjoittaa tiedoston vain, jos sisältö muuttui (muuten `No changes`). Jos yksikin kortti hylätään tai määrä poikkeaa, tiedostoa ei muuteta, ja komento päättyy virheeseen. Poistuneet avaimet näkyvät varoituksena, koska tallennetut kokoelmat voivat viitata niihin. Tarkista muutos (`git diff src/data/cards.json`), aja `npm test` ja commitoi.
- CSP ja muut turvallisuusotsakkeet tulevat `firebase.json`ista, joten ne näkyvät vain Firebase Hostingissa (esikatselu ja testisivusto), ei `npm run dev`:ssä.
