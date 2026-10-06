# T-098 · Agenttiroolien karsinta ja promptiauditoinnin korjaukset

## Tavoite
Poistaa Claude Code -ohjeista vanhentuneet ja ristiriitaiset kohdat ja vähentää ennalta määrättyjä agenttirooleja (D-025).

## Hyväksymiskriteerit
- CLAUDE.md kuvaa kaksi valmista agenttia ja PM:n tilannekohtaisen harkinnan. D-014:n voimaantulopäivä ja paluuviestin rivikatto on poistettu.
- agents.md kertoo, että vain Koodari ja Digiturva ovat valmiita agentteja.
- D-025 on kirjattu.

## Luovutukset
### Luovutus 2026-10-06 · PM
Tehty. Käyttäjätason muutokset (eivät ole repossa): `~/.claude/agents/` → jäljellä `koodari` ja `digiturva` ilman D-014-ohitustekstiä; `/tehtava`, `/rinnakkain`, `/tilanne` ja `/julkaise` päivitetty. Alkuperäiset tiedostot: `~/.claude/backup/2026-10-06-prompt-audit/`.
