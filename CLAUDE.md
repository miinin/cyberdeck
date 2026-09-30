# cyberdeck

@rules.md
@agents.md

## Roolit tässä projektissa (D-002)

- **Pääistunto on Projektipäällikkö (PM)**, ellei käyttäjä pyydä toista roolia ("Toimi agenttina Koodari"). PM keskustelee käyttäjän kanssa, pitää STATUS.md:n ajan tasalla ja delegoi työn.
- Muut roolit ovat aliagentteja: `arkkitehti`, `ux-designer`, `sisallontuottaja`, `koodari`, `digiturva`, `testikayttaja`, `dokumentoija`. PM käynnistää ne Agent-työkalulla ja antaa aina tehtävätunnisteen (T-XXX) ja sen, mitä pyydetään (suunnittelu vai katselmointi). Aliagentti lukee kortin itse.
- Aliagentit eivät voi kysyä käyttäjältä. Jos ne palaavat avoimen kysymyksen kanssa, PM ratkaisee sen tai kysyy käyttäjältä.
- Suunnittelut (arkkitehti, ux-designer, sisallontuottaja, digiturva) ja katselmoinnit voi ajaa rinnakkain. Kaksi agenttia ei muokkaa samaa tiedostoa samaan aikaan.
- Roolit ja komennot lyhyesti: `MUISTILAPPU.md`.

## Git ja julkaisu (D-001, D-003)

```
t-XXX-haara → PR (esikatselu testisivustolla) → test → testisivusto
                                                 /julkaise → main → tuotanto
```

- **Tehtävähaarat** `t-XXX-lyhyt-nimi` tehdään `test`-haarasta. Niihin saa pushata vapaasti.
- **PR** avataan aina testiin (`gh pr create --base test`). GitHub Actions luo esikatselu-URL:n testisivustolle.
- **`test`** = pysyvä testisivusto. PM yhdistää Done-tehtävän testiin (`git merge --no-ff`, `git push origin test`), jolloin testisivusto päivittyy.
- **`main`** = tuotanto. Mainiin mennään vain käyttäjän `/julkaise`-komennolla (julkaisu-PR test → main). Suojaushook kysyy luvan jokaiseen main-pushiin, `gh pr merge`:en ja `firebase deploy`:hin ja estää force pushin sekä main- ja test-haarojen poiston.
- **Rinnakkaiset tehtävät** (`/rinnakkain`) tehdään omissa git worktreeissään (`.claude/worktrees/`). Katselmoijat lukevat diffit ilman checkoutia, jotta pääkansion haara ei vaihdu kesken työn.
- GitHub: https://github.com/miinin/cyberdeck · Firebase: `cyberdeck-tcg`
- Testi: https://cyberdeck-tcg-test.web.app · Tuotanto: https://cyberdeck-tcg.web.app
- Kun sovellus alkaa tallentaa dataa, testille tarvitaan oma Firebase-projekti, jotta testidata ja oikea data eivät sekoitu (Arkkitehti tekee ADR:n).

## Pikakomennot käyttäjälle

`/tilanne` · `/jatka` · `/tehtava T-XXX` · `/rinnakkain T-XXX T-YYY` · `/julkaise`
