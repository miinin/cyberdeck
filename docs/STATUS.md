# STATUS · päivitetty 2026-10-03 yöllä (PM, UX-uudistus PR #22 odottaa käyttäjää)

## Yhdellä lauseella
MVP-1 on pitkällä: korttidata ja kuvat sovelluksen mukana, ruudukko- ja taulukkonäkymä, kokoelma (want-lista, rarity) ja pakanrakennus säännöillä (T-013) ovat testisivustolla. Tuotannossa on yhä 0.1.0, ja seuraava /julkaise vie kaiken tämän sinne.

## MVP-taso
Työn alla: MVP-1 · Valmiina: kaikki MVP-1:n Must-tehtävät (T-004, T-010–T-015, T-021, T-025–T-027, T-033–T-040, T-045, T-046). Seuraavaksi MVP-1:n loppukatselmoinnit. MVP-1:n lopussa: UX-katselmointi ja saavutettavuusauditointi, Sisällöntuottaja (uudet tekstit), Testikäyttäjä ja Dokumentoija (D-014).

## Nyt työn alla
| Tehtävä | Agentti | Tila | Seuraava askel |
|---|---|---|---|
| T-050, T-051 | PM | Review, PR #22 | Käyttäjä katsoo esikatselun ja yhdistää PR #22:n testiin (yötyö 2026-10-03; PM ei yhdistänyt, koska se vaatii luvan). Sen jälkeen /julkaise. |

## Blokkerit
- Ei blokkereita. (gh: `"C:/Program Files/GitHub CLI/gh.exe"`.)
- Paikallinen: vanhat `vite preview` -prosessit lukitsevat node_modulesin ja `.claude/worktrees/t-026`-kansion (poisto epäonnistui). Käyttäjä sulkee prosessit, minkä jälkeen kansion voi poistaa. Worktree t-027 on vielä rekisteröity (valmis, voi poistaa: `git worktree remove .claude/worktrees/t-027`).
- PM:n kuvakaappausskripti (CDP, 320 px, localStorage) oli istunnon scratchpadissa. Jos sitä tarvitaan, kirjoita uudelleen `scripts/`-kansion ulkopuolelle.

## Kysymykset käyttäjälle (ei blokkaa, edetään oletuksella)
- R-4 Tuotantojulkaisun suojaus: katso PM:n ehdotus T-001-kortissa. Oletus: ei muutoksia ennen erillistä testiprojektia.
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
1. PR #22 (T-050 UX-uudistus + T-051 Pakat-sivu ja tuontiraportti) esikatselu → yhdistä testiin → /julkaise. Katselmoinnit: UX-007 (korjattu), BREAK-003 (korjattu), kielentarkastus tehty.
2. Käyttäjä 2026-10-02: MVP-1:n loppukatselmoinnit (UX, Sisällöntuottaja, Testikäyttäjä, Dokumentoija) eivät ole vielä ajankohtaisia, joten ne siirretään myöhemmäksi.
3. Velat: T-047, T-041 (DeckEditorin pilkkominen), T-042, T-043, T-030, T-031.
4. Backlogissa T-002–T-009 (velka ja parannukset). T-003 on peruttu (korvattu T-026:lla). T-004 on nostettu Must-tasolle (testit CI:hin).

**Tokenien säästö (käyttäjä 2026-10-02):** tokenit kuluvat nopeasti, ja käyttöraja katkaisi kaksi rinnakkaista Koodaria. Aja yksi agentti kerrallaan, pidä tehtävänannot lyhyinä ja tyhjennä istunto (`/clear`) tehtävien välissä.

## Julkaisuputki
- GitHub: https://github.com/miinin/cyberdeck
- Testisivusto: https://cyberdeck-tcg-test.web.app (test-haara)
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
