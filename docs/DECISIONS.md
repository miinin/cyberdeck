# DECISIONS

Päätösloki. Vain lisäyksiä, ei poistoja (rules.md 5.2).

## D-001 · Haaramalli ja julkaisu · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** GitHub Actions julkaisee jokaisen main-haaraan tulevan muutoksen Firebase Hostingiin. rules.md 11 vaatii käyttäjän luvan ennen julkaisua.
**Vaihtoehdot:** A) Agentit työskentelevät haaroissa ja käyttäjä julkaisee /julkaise-komennolla. B) PM mergeää ja julkaisee automaattisesti, kun tehtävä on Done.
**Päätös:** A
**Perustelu:** Tuotanto muuttuu vain käyttäjän luvalla. PR:n esikatselu-URL:lla muutoksen voi tarkistaa ennen julkaisua.
**Seuraukset:** Yksi tehtävä = yksi haara `t-XXX-nimi` = yksi PR. Täydennetty päätöksellä D-003 (test-haara). GitHub Actions julkaisee palvelutilillä `github-deploy`, jolla on vain Hostingin julkaisuoikeudet (firebasehosting.admin, serviceUsageConsumer, apiKeysViewer, run.viewer). Avain on GitHubin salaisuutena. Suojaushook (`~/.claude/hooks/suojaa-julkaisu.js`) kysyy luvan main-pushiin, `gh pr merge`:en ja `firebase deploy`:hin ja estää force pushin.

## D-002 · Pääistunto toimii PM:nä, muut roolit aliagentteina · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** Käyttäjä haluaa antaa tehtäviä mahdollisimman helposti. Claude Coden aliagentit eivät voi kysyä käyttäjältä kesken työn.
**Päätös:** Käyttäjä keskustelee PM:n kanssa. PM delegoi muille rooleille aliagentteina (`~/.claude/agents/`): Arkkitehti, UX Designer, Sisällöntuottaja, Koodari, Digiturva, Testikäyttäjä ja Dokumentoija (agents.md v1.2).
**Seuraukset:** Aliagentit palauttavat avoimet kysymykset PM:lle, joka ratkaisee ne tai kysyy käyttäjältä.

## D-003 · Pysyvä testihaara ja testisivusto · 2026-09-30 · Päättäjä: käyttäjä
**Tila:** Voimassa
**Konteksti:** PR-esikatselut ovat tehtäväkohtaisia ja vanhenevat. Käyttäjä haluaa kokeilla kaikkia julkaisemattomia muutoksia yhdessä pysyvässä osoitteessa ennen tuotantoa.
**Vaihtoehdot:** A) Pelkät PR-esikatselut. B) Pysyvä `test`-haara ja oma testisivusto samassa Firebase-projektissa. C) Pysyvä `test`-haara ja erillinen Firebase-projekti testille.
**Päätös:** B nyt. C:hen siirrytään, kun sovellus tallentaa dataa.
**Perustelu:** Staattisella sivustolla toinen Hosting-sivusto riittää ja on yksinkertaisin. Kun mukana on dataa, testin ja tuotannon data on erotettava kokonaan.
**Seuraukset:** Tehtävähaarat tehdään testistä, ja PR:t kohdistuvat testiin (GitHubin oletushaara = `test`). PM yhdistää Done-tehtävät testiin. `/julkaise` vie testin mainiin julkaisu-PR:llä. PR-esikatselut julkaistaan testisivustolle. Rinnakkaiset tehtävät tehdään omissa git worktreeissään (`/rinnakkain`).
