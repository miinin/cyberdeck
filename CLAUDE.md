# cyberdeck

Säännöt: `rules.md`, roolit: `agents.md`. **Niitä ei ladata automaattisesti (D-014, tokenien säästö).** Lue niistä vain se luku, jota tarvitset (`grep -n "^## " rules.md`).

## Tärkeimmät säännöt (tiivistelmä rules.md:stä)
- Jos asia ei ole tiedostossa, sitä ei ole. Päätökset `docs/DECISIONS.md`:hen, ideat `docs/IDEAS.md`:hen, opit `docs/LESSONS.md`:hen.
- Yksi tehtävä kerrallaan, pienet commitit `T-XXX: …` (englanniksi). Dokumentit suomeksi, koodi englanniksi.
- Ei regressioita: `npm test`, `npm run lint` ja `npm run build` läpi ennen luovutusta. Testejä ei heikennetä.
- Ei salaisuuksia repoon. Ulkoinen syöte on epäluotettavaa. Uusi riippuvuus vain perustellusti.
- Kysy käyttäjältä: tuotepäätökset, maksulliset palvelut, peruuttamattomat toimet, riskien hyväksyntä. Kun jokin käyttäytyy odottamattomasti, kysy äläkä arvaa.
- Kielletty ilman lupaa: force push, `reset --hard`, `clean -f`, historian uudelleenkirjoitus, massapoistot.

## Kevyt malli (D-014, voimassa 2026-10-02 alkaen)
- **Pääistunto on PM.** Pienen ja selkeän tehtävän (alle noin 150 riviä, ei uutta riippuvuutta, ei tietomallia) PM määrittelee lyhyesti korttiin ja antaa **yhdelle Koodarille**. Erillistä suunnitteluvaihetta ei ole.
- **Yksi agentti kerrallaan.** Koodari, UX, Sisällöntuottaja, Testikäyttäjä ja Dokumentoija ajetaan Sonnetilla. Arkkitehti ja Digiturva ajetaan Opuksella, ja vain kun niitä tarvitaan.
- **Katselmoinnit vain riskin mukaan:** Digiturva, kun muuttuvat riippuvuudet, firebase.json, workflowt, tiedostojen tai syötteen käsittely tai tallennus. Arkkitehti tietomallin tai uuden teknologian kohdalla. UX ja Testikäyttäjä MVP-tason lopussa yhdellä kertaa, tai uuden ison näkymän jälkeen. PM tarkistaa muut esikatselusta itse.
- **Kevyt kirjaus:** kortissa on määrittely ja yksi luovutus. Väli-checkpoint kirjataan vain, jos työ keskeytyy. STATUS.md ja TASKS.md päivitetään tehtävän lopussa.
- **Lue vähän:** älä lue kokonaan `docs/UX.md`:tä (170 kt), `docs/ARCHITECTURE.md`:tä (85 kt), `rules.md`:tä tai `agents.md`:tä. Hae tarvittava kohta grepillä ja lue vain se.
- **Lyhyet tehtävänannot ja vastaukset.** Aliagentti palauttaa enintään noin 15 riviä.

## Git ja julkaisu (D-001, D-003)
```
t-XXX-haara → PR testiin (esikatselu) → PM yhdistää testiin → /julkaise → main
```
- Haarat `t-XXX-nimi` tehdään `test`-haarasta. PR: `gh pr create --base test` (gh: `"C:\Program Files\GitHub CLI\gh.exe"`).
- `main` = tuotanto, vain käyttäjän `/julkaise`-komennolla. Hook kysyy luvan main-pushiin, `gh pr merge`:en ja `firebase deploy`:hin.
- GitHub: https://github.com/miinin/cyberdeck · Testi: https://cyberdeck-tcg-dev.web.app · Tuotanto: https://cyberdeck-tcg.web.app

## Pikakomennot
`/tilanne` · `/jatka` · `/tehtava T-XXX` · `/julkaise` (`/rinnakkain` vain erikseen pyydettäessä, koska se kuluttaa paljon)
