# STATUS · päivitetty 2026-09-30 (PM)

## Yhdellä lauseella
Projekti on alustettu (repo, Firebase-projekti, julkaisuputki, agenttipohjat). PROJECT.md on hyväksytty (D-004). MVP-0:n T-001 (kävelevä luuranko) on toteutuksessa (suunnittelu valmis: D-005, UX.md, SECURITY.md).

## MVP-taso
Työn alla: MVP-0 · Valmiina: 1/2 tehtävää

## Nyt työn alla
| Tehtävä | Agentti | Tila | Seuraava askel |
|---|---|---|---|
| T-001 | Koodari | In Progress | Toteutus ARCHITECTURE.md:n, UX.md:n ja SR-vaatimusten mukaan, katso kortti |

## Blokkerit
- Ei blokkereita. (gh löytyy polusta `C:\Program Files\GitHub CLI\gh.exe`, jos komento `gh` ei toimi.)

## Kysymykset käyttäjälle (ei blokkaa, edetään oletuksella)
- R-4 Tuotantojulkaisun suojaus: katso PM:n ehdotus T-001-kortissa. Oletus: ei muutoksia ennen erillistä testiprojektia.
- K1 "Hinta"-sarakkeen nimi ja K2 korttityypit englanniksi. Oletus: UX.md:n mukaan.
- K5 (MVP-1, ei blokkaa T-001:tä): seurataanko kokoelmassa kortteja vai painoksia (alt-artit, beta, ranskankieliset)? Arkkitehdin alustava suositus: korttitaso (`slug`).

## Toimintatapa, kun käyttäjä on poissa (sovittu 2026-09-30)
- PM vie tehtävää eteenpäin agenttien työnkulun mukaan (suunnittelu → Koodari → katselmoinnit → testikäyttäjä → dokumentointi → PR testiin).
- Tekstit, nimet ja pienet käytettävyysvalinnat: valitaan suunnittelijan oletus, kirjataan tälle listalle, ja käyttäjä voi muuttaa ne myöhemmin.
- Tuotepäätös, riskin hyväksyntä, maksullinen palvelu tai peruuttamaton toimenpide: ei arvata. Kysymys kirjataan tälle listalle, kyseinen osa parkkeerataan, ja PM jatkaa muulla työllä.
- Ei koskaan ilman käyttäjää: main-haara, tuotantojulkaisu, `gh pr merge`, force push.
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
Ei vielä sovelluskoodia. Koodari täydentää T-001:ssä.
