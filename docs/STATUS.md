# STATUS · päivitetty 2026-09-30 (PM)

## Yhdellä lauseella
Projekti on alustettu (repo, Firebase-projekti, julkaisuputki, agenttipohjat). PROJECT.md on hyväksytty (D-004). MVP-0:n T-001 (kävelevä luuranko) on suunnitteluvaiheessa.

## MVP-taso
Työn alla: MVP-0 · Valmiina: 1/2 tehtävää

## Nyt työn alla
| Tehtävä | Agentti | Tila | Seuraava askel |
|---|---|---|---|
| T-001 | Arkkitehti, UX, Digiturva | Ready (suunnittelu) | Teknologia-ADR, näkymämäärittely ja uhkamalli, katso kortti |

## Blokkerit
- `gh`-komentorivityökalua ei löydy PM:n ympäristöstä, joten PR:ien listaus ja luonti eivät onnistu. Käyttäjä (2026-09-30)

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
