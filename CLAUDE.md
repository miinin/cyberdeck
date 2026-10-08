# cyberdeck

Säännöt: `rules.md`, roolit: `agents.md`. **Niitä ei ladata automaattisesti (D-014, tokenien säästö).** Lue niistä vain se luku, jota tarvitset (`grep -n "^## " rules.md`).

## Tärkeimmät säännöt (tiivistelmä rules.md:stä)
- Jos asia ei ole tiedostossa, sitä ei ole. Päätökset `docs/DECISIONS.md`:hen, ideat `docs/IDEAS.md`:hen, opit `docs/LESSONS.md`:hen.
- Yksi tehtävä kerrallaan, pienet commitit `T-XXX: …` (englanniksi). Dokumentit suomeksi, koodi englanniksi.
- Ei regressioita: `npm test`, `npm run lint` ja `npm run build` läpi ennen luovutusta. Testejä ei heikennetä.
- Ei salaisuuksia repoon. Ulkoinen syöte on epäluotettavaa. Uusi riippuvuus vain perustellusti.
- Kysy käyttäjältä: tuotepäätökset, maksulliset palvelut, peruuttamattomat toimet, riskien hyväksyntä. Kun jokin käyttäytyy odottamattomasti, kysy äläkä arvaa.
- Kielletty ilman lupaa: force push, `reset --hard`, `clean -f`, historian uudelleenkirjoitus, massapoistot.

## Kevyt malli (D-014, D-026)
- **Pääistunto on PM.** Pienen ja selkeän tehtävän (alle noin 150 riviä, ei uutta riippuvuutta, ei tietomallia) PM määrittelee lyhyesti korttiin ja antaa **yhdelle Koodarille**. Erillistä suunnitteluvaihetta ei ole.
- **Kaksi valmista agenttia:** `koodari` (Sonnet) toteuttaa ja `digiturva` (Opus) katselmoi turvallisuuden. Muun työn (rakennepäätös, UX, tekstit, rikkomistestaus, dokumentointi) PM tekee itse tai antaa tilannekohtaisella tehtävänannolla yleisagentille ja valitsee mallin työn mukaan: rutiini Sonnetilla, vaativa harkinta Opuksella. agents.md:n roolikuvaukset ja tarkistuslistat ovat tehtävänantojen lähdemateriaalia. Yksi agentti kerrallaan.
- **Katselmoinnit vain riskin mukaan:** Digiturva, kun muuttuvat riippuvuudet, firebase.json, workflowt, tiedostojen tai syötteen käsittely tai tallennus. Rakennearvio tietomallin tai uuden teknologian kohdalla. UX-katselmointi ja rikkomistestaus MVP-tason lopussa yhdellä kertaa tai uuden ison näkymän jälkeen. PM tarkistaa muut esikatselusta itse.
- **Kevyt kirjaus:** kortissa on määrittely ja yksi luovutus. Väli-checkpoint kirjataan vain, jos työ keskeytyy. STATUS.md ja TASKS.md päivitetään tehtävän lopussa.
- **Lue vähän:** älä lue kokonaan `docs/UX.md`:tä (170 kt), `docs/ARCHITECTURE.md`:tä (85 kt), `rules.md`:tä tai `agents.md`:tä. Hae tarvittava kohta grepillä ja lue vain se.
- **Lyhyet tehtävänannot ja vastaukset.** Aliagentin paluuviesti kertoo vain tuloksen, avoimet kysymykset ja seuraavan askeleen, koska yksityiskohdat ovat kortissa.

## Git ja julkaisu (D-001, D-003, D-029)
**Nyt voimassa D-029:** työ tehdään suoraan `test`-haaraan (paikalliset testit, lint ja build ensin), ja julkaisu-PR `test → main` tehdään heti ilman erillistä käskyä. Riskialttiit muutokset (tietomalli, säännöt, tallennus tai synkronointi, auth, firebase.json, workflowt, riippuvuudet) testataan ensin devissä, ja syy kerrotaan käyttäjälle. Alla oleva putki palaa käyttöön, kun käyttäjiä kutsutaan.

```
t-XXX-haara → PR testiin (esikatselu) → PM yhdistää testiin → /julkaise → main
```
- Haarat `t-XXX-nimi` tehdään `test`-haarasta. PR: `gh pr create --base test` (gh: `"C:\Program Files\GitHub CLI\gh.exe"`).
- `main` = tuotanto, vain käyttäjän `/julkaise`-komennolla. Hook kysyy luvan main-pushiin, `gh pr merge`:en ja `firebase deploy`:hin.
- GitHub: https://github.com/miinin/cyberdeck · Testi: https://cyberdeck-tcg-dev.web.app · Tuotanto: https://cyberdeck-tcg.web.app

## Pikakomennot
`/tilanne` · `/jatka` · `/tehtava T-XXX` · `/julkaise` (`/rinnakkain` vain erikseen pyydettäessä, koska se kuluttaa paljon)
