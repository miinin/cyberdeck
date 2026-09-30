# STATUS · päivitetty 2026-09-30 (PM)

## Yhdellä lauseella
Projekti on alustettu (repo, Firebase-projekti, julkaisuputki, agenttipohjat). Visiota ei ole vielä määritelty.

## MVP-taso
Työn alla: MVP-0 · Valmiina: 0/0 tehtävää

## Nyt työn alla
| Tehtävä | Agentti | Tila | Seuraava askel |
|---|---|---|---|
| – | PM | – | Haastattele käyttäjä ja kirjoita PROJECT.md |

## Blokkerit
- Ei blokkereita.

## Viimeksi valmistuneet
- T-000 Projektin alustus ja julkaisuputki (2026-09-30)

## Seuraavaksi (PM:n priorisointi)
1. PROJECT.md: visio, kohderyhmä ja MVP-tasot → käyttäjän hyväksyntä
2. T-001 Kävelevä luuranko haarassa `t-001-kaveleva-luuranko`. Julkaisuputken workflow-tiedostot ovat jo siinä haarassa. Ensimmäinen PR testaa koko putken (build → esikatselu-URL).

## Julkaisuputki
- GitHub: https://github.com/miinin/cyberdeck
- Testisivusto: https://cyberdeck-tcg-test.web.app (test-haara)
- Tuotanto: https://cyberdeck-tcg.web.app (main-haara, vain /julkaise)
- Kulku: t-XXX-haara → PR testiin (esikatselu-URL) → test → /julkaise → main (D-001, D-003)
- Workflowt ajavat `npm ci && npm run build` ja julkaisevat `dist/`-kansion.

## Ajo-ohje
Ei vielä sovelluskoodia. Koodari täydentää T-001:ssä.
