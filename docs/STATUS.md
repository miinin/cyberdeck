# STATUS · päivitetty 2026-09-30 (PM)

## Yhdellä lauseella
Projekti on alustettu (repo, Firebase-projekti, julkaisuputki, agenttipohjat). PROJECT.md on hyväksytty (D-004). MVP-0:n T-001 (kävelevä luuranko) on toteutuksessa (suunnittelu valmis: D-005, UX.md, SECURITY.md).

## MVP-taso
Työn alla: MVP-0 · Valmiina: 1/2 tehtävää

## Nyt työn alla
| Tehtävä | Agentti | Tila | Seuraava askel |
|---|---|---|---|
| T-001 | Koodari → katselmoijat | Review | Toteutus valmis, PR testiin. Katselmoinnit: Digiturva, UX, Arkkitehti ja Sisällöntuottaja, sitten Testikäyttäjä (katso kortin luovutus 2026-09-30) |

## Blokkerit
- Ei blokkereita. (gh löytyy polusta `C:\Program Files\GitHub CLI\gh.exe`, jos komento `gh` ei toimi.)

## Kysymykset käyttäjälle (ei blokkaa, edetään oletuksella)
- R-4 Tuotantojulkaisun suojaus: katso PM:n ehdotus T-001-kortissa. Oletus: ei muutoksia ennen erillistä testiprojektia.
- K1 "Hinta"-sarakkeen nimi ja K2 korttityypit englanniksi: UX ja Sisällöntuottaja suosittelevat molemmat näitä, joten ne on toteutettu näin.
- TXT-003: tarvitaanko alatunnisteeseen myös englanninkielinen fanisisältömerkintä (CD PROJEKT RED:n ohje)? Oletus: ei MVP-0:ssa.
- K5 (MVP-1, ei blokkaa T-001:tä): seurataanko kokoelmassa kortteja vai painoksia (alt-artit, beta, ranskankieliset)? Arkkitehdin alustava suositus: korttitaso (`slug`).

## Toimintatapa, kun käyttäjä on poissa (sovittu 2026-09-30)
- PM vie tehtävää eteenpäin agenttien työnkulun mukaan (suunnittelu → Koodari → katselmoinnit → testikäyttäjä → dokumentointi → PR testiin).
- Tekstit, nimet ja pienet käytettävyysvalinnat: valitaan suunnittelijan oletus, kirjataan tälle listalle, ja käyttäjä voi muuttaa ne myöhemmin.
- Tuotepäätös, riskin hyväksyntä, maksullinen palvelu tai peruuttamaton toimenpide: ei arvata. Kysymys kirjataan tälle listalle, kyseinen osa parkkeerataan, ja PM jatkaa muulla työllä.
- Ei koskaan ilman käyttäjää: main-haara, tuotantojulkaisu, `gh pr merge`, force push.
- **Poikkeus 2026-09-30:** käyttäjä valtuutti julkaisemaan T-001:n tuotantoon (`/julkaise`), kun se on Done (Definition of Done täyttyy kokonaan). Valtuutus koskee vain T-001:tä. Suojaushook kysyy silti luvan main-mergeen, ja PM ei ohita sitä.
- Kone ei mene lepotilaan (käyttäjä muutti asetuksen 2026-09-30).
- Testisivustolle vienti on sallittu (D-003).

## Viimeksi valmistuneet
- T-000 Projektin alustus ja julkaisuputki (2026-09-30)

## Seuraavaksi (PM:n priorisointi)
1. T-001 suunnittelu (Arkkitehti, UX ja Digiturva rinnakkain), sitten toteutus (Koodari). Ensimmäinen PR testaa koko putken (build → esikatselu-URL).
2. MVP-1:n tehtävien pilkkominen T-001:n arkkitehtuurin pohjalta (PM)

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
```

- Sovellus hakee kortit selaimesta suoraan `https://api.netdeck.gg`:stä. Avaimia tai ympäristömuuttujia ei tarvita.
- CSP ja muut turvallisuusotsakkeet tulevat `firebase.json`ista, joten ne näkyvät vain Firebase Hostingissa (esikatselu ja testisivusto), ei `npm run dev`:ssä.
