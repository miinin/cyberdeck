# SEC-178 · Lyhyt vaihtolinkki (T-178, D-037)
**Katselmoija:** Digiturva · **Päivä:** 2026-10-18 · **Kohde:** `git diff origin/test...origin/t-178-lyhyt-vaihtolinkki` (commitit 9f204bf, da7659c, 4a1c1e0)

## Yhteenveto
- **Löydökset:** Critical 0, High 0, Medium 0, Low 2, Info 3.
- **Veto:** ei. Saa mennä deviin. Done-tilan ehto: säännöt deployattu deviin ja SR-59:n käsitestit 1–7 tehty ennen testiin yhdistämistä, ja tuotannon säännöt deployataan ennen julkaisua.
- **Käyttäjän päätökset:** K-T178-1 (pysyvä tunnus, kerrotaan käyttäjälle, vaihto IDEAS.md:hen) ja K-T178-2 (ei vanhenemista) on hyväksytty. PM hyväksyi, että automaattinen päivitys toimii vain Have/Want-sivun ollessa auki.

## Vaatimusten tila
| SR | Tila | Havainto |
|---|---|---|
| SR-50 | Täyttyy | `tradeShareId` = sha256(uid + '#trade'), 16 ensimmäistä merkkiä, ja domain-testit ovat mukana. |
| SR-51 | Täyttyy | Toteutuksessa on regex-varavaihtoehto, ja muototarkistus on ennen regexiä (`&&` on lyhytpiirteinen). Sama `ownsTradeShare` on createssa, updatessa ja deletessa. Delete ei tarvitse `resource`-ehtoa, ja `isGoogleUser()` on kaikissa kirjoituksissa. Staattinen testi tarkistaa järjestyksen. |
| SR-52 | Täyttyy | Avaimet ovat tarkat, `data` on 1–16 000 merkkiä base64url-muodossa, `updatedAt == request.time`, ja päivitysten väli on vähintään 10 s. `list` puuttuu, ja `get: if true`. Muut säännöt ovat ennallaan. |
| SR-53 | Täyttyy | Tunnus tarkistetaan sekä `TradeLinkView`:ssä että `get`:ssä ennen `doc()`-kutsua. `parseTradeShareDoc` tarkistaa version ja datan, `decodeTradeShare` ajetaan `SharedTradeView`:ssä, renderöinti on React-tekstiä ja noindex on käytössä. |
| SR-54 | Täyttyy, ks. SEC-178-1 ja SEC-178-3 | Tieto on tilikohtaisessa avaimessa `cyberdeck:u:{uid}:trade-shared`. Päivitys on transaktio, joka lukee ensin eikä koskaan luo dokumenttia, ja puuttuva dokumentti poistaa paikallisen tiedon. Viive on 15 s. `<main key={uid}>` nollaa tilan tilin vaihtuessa, ja uloskirjautuneena store on `null`, joten päivitys pysähtyy. |
| SR-55 | Osittain, ks. SEC-178-2 | Poisto ja paikallisen tiedon poisto toimivat, ja virhe näytetään. Uudelleenjaon käytöstä ei kerrota. |
| SR-56 | Täyttyy | `tradeShares.remove()` ajetaan julkisten pakkojen jälkeen ja ennen `cloud.deleteAll()`:ia. Virhe keskeyttää poiston, ja teksti kertoo, että linkki voi yhä toimia. `eraseAccount` poistaa prefix-avaimet. |
| SR-57 | Täyttyy | `tradeShortWarning` ja `tradeShortWarningList` (fi/en). |
| SR-58 | Täyttyy | `package.json`, `firebase.json` ja CSP eivät muuttuneet. Uid:tä ei lokiteta, ja QR on nykyinen. |
| SR-59 | Avoin | Vaatii deployn deviin. Emulaattoritestejä ei ole. |
| SR-60 | Täyttyy | PRIVACY.md luku 14 ja selosteteksti-ehdotus. |

## Löydökset

### SEC-178-1 · Lähteen vaihto julkaisee koko kokoelman automaattisesti · Low
- **Sijainti:** `src/ui/HaveWantView.tsx` rivi 301 (sama `ShareTradeButton`-instanssi molemmissa haaroissa) ja `src/ui/ShareTradeButton.tsx`, automaattisen päivityksen effect.
- **Toistaminen:** kirjaudu sisään, valitse Have-lähteeksi oma lista ja paina Jaa. Linkki jakaa vain Have-listan. Vaihda lähteeksi kokoelma. Prop `have` muuttuu, joten `data` muuttuu, ja effect kirjoittaa 15 s kuluttua koko kokoelman ja säännön mukaiset vaihtokortit samaan linkkiin ilman Jaa-painallusta.
- **Vaikutus:** käyttäjä on rajannut jaon tarkoituksella omaan listaan, mutta kaikki linkin saaneet näkevät nyt koko kokoelman. Huomautusteksti vaihtuu näkyviin, mutta jakoa ei vahvisteta. Tieto ei ole arkaluonteista (kortit ja määrät), joten vakavuus on Low.
- **Korjausehdotus:** tallenna jaon yhteydessä lähde (`list` tai `collection`) samaan tilikohtaiseen tietoon. Automaattinen päivitys ajetaan vain, kun lähde on sama. Muuten näytetään "Jaettu sisältö on eri lähteestä. Päivitä painamalla Jaa." Lisäksi tarvitaan UI-testi.

### SEC-178-2 · Uudelleenjaon käytöstä ei kerrota · Low
- **Sijainti:** `src/ui/texts.fi.ts` ja `texts.en.ts`, `tradeSharingStopped`.
- **Toistaminen:** paina Lopeta jakaminen. Näkyviin tulee teksti "Jakaminen lopetettu." Kun käyttäjä painaa uudelleen Jaa, aiemmin levinnyt linkki toimii taas.
- **Vaikutus:** K-T178-1:n päätös "kerrotaan käyttäjälle" ei toteudu. Käyttäjä voi luulla, että vanha linkki on lopullisesti kuollut.
- **Korjausehdotus:** esim. "Jakaminen lopetettu. Jos jaat uudelleen, sama linkki toimii taas." / "Sharing stopped. If you share again, the same link works again." Sanamuodon hyväksyy PM.

### SEC-178-3 · Automaattinen päivitys ylikirjoittaa uudemman version dokumentin · Info
- **Sijainti:** `ShareTradeButton.tsx`, ensimmäinen tarkistus: `current.kind === 'newer'` jatkaa `update`-kutsuun.
- **Vaikutus:** vanha sovellusversio kirjoittaa version 1 dokumentin uudemman päälle. Tällä hetkellä versioita on vain yksi, joten haittaa ei synny.
- **Korjausehdotus:** kun `kind === 'newer'`, älä päivitä (vrt. SR-23 lukitus).

### SEC-178-4 · Linkin vaihto puuttuu IDEAS.md:stä · Info
- K-T178-1:n päätös edellyttää IDEAS.md-merkintää linkin vaihdosta (sukupolvilaskuri). Haarassa sitä ei ole. Kirjaus kuuluu PM:lle.

### SEC-178-5 · Säännöt on testattu vain staattisesti · Info
- Emulaattoritestejä ei ole, joten `hashing.sha256` ja dynaaminen regex varmistuvat vasta devissä. SR-59:n käsitestit 1–7 on tehtävä ennen testiin yhdistämistä. Testi 2 (toisen tilin kirjoitus) ja testi 5 (ylimääräinen kenttä) ovat tärkeimmät.

## Tarkistetut alueet, joista ei löytynyt mitään
- **Pääsynhallinta (OWASP A01, ASVS V4):** tunnus lasketaan `request.auth.uid`:sta, ja uid:tä ei ole dokumentissa. Listaus on estetty. Delete puuttuvalle dokumentille toimii vain omalla tunnuksella.
- **Injektio (A03, ASVS V5):** reitin tunnus validoidaan ennen polkua, joten `/`-polkuinjektio ei ole mahdollinen. Regexiin päätyy vain muototarkistettu tunnus. Data on base64url ja dekoodataan rajoin, eikä HTML:ää renderöidä.
- **Tietovuoto (A04):** dokumentissa ei ole uid:tä, nimeä eikä sähköpostia. Tunnus on domain-eroteltu julkisista pakoista. Lokeissa ei ole tunnistetietoja. Lukuistunto käyttää nimettyä sovellusta ilman authia.
- **Konfiguraatio (A05):** `firebase.json`, CSP ja otsakkeet ovat ennallaan. Indeksit ovat ennallaan (`firestore.indexes.json` testattu).
- **Riippuvuudet (A06):** `package.json` ja lukkotiedosto eivät muuttuneet, joten `npm audit` ei ollut tarpeen.
- **Salaisuudet:** diffissä ei ole avaimia, tokeneita eikä salasanoja. Git-historiasta ei löytynyt yksityisiä avaimia (`git log --all -S"BEGIN PRIVATE KEY"`).
- **Istunto ja tilin vaihto:** `<main key={uid}>` remountaa näkymän, joten toisen tilin jakotila ei periydy. Uloskirjautuneena päivitys ei käynnisty.
- **Tilin poisto:** järjestys ja virheenkäsittely vastaavat SR-36:ta.
- **Kiintiö ja roskaus:** dokumentteja on yksi per tili, koko on rajattu ja päivitystahti on 10 s. Poiston ja uuden luonnin ohitus on hyväksyttävä jäännösriski.
