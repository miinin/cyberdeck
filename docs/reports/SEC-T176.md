# SEC-T176: Testaa-osio, sealedin vienti omiin pakkoihin ja uudet reitit, diff-katselmointi

**Digiturva · 2026-10-17 · `test`-haara, `git diff 2796f9b..HEAD` (commitit e8a1c32, f368e02, 3df0a31)**

## Tulos
- **Löydökset:** Pakollinen 0, Suositus 1 (Low), Info 3.
- **Veto:** Ei blokkaa Done-tilaa. Src-koodia ei muutettu.
- Riippuvuudet (`package.json`, `package-lock.json`), `firebase.json` ja workflowt eivät muuttuneet, joten `npm audit` -ajoa ei tarvittu. Diffistä ja commitien historiasta ei löytynyt salaisuuksia (haettu `AIza`, `ghp_`, `sk-`, `PRIVATE KEY`, `secret`, `token`, `password`).
- SECURITY.md: luku 20, lisätty T-176:n rivi. PRIVACY.md: rivi 1f täydennetty (`deckId`, `deckUpdatedAt`) ja muutoslokin rivi. Ei henkilötietoa, ei eskaloitavaa.

## Tarkistetut alueet, joista ei löytynyt korjattavaa
- **`deckId` ja `deckUpdatedAt` lukuvaiheessa (SR-11, SR-23):** `parseSealedRun` lukee kentät eksplisiittisesti ja rakentaa uuden olion. `deckId` hyväksytään vain `isDeckId`:n läpi (ankkuroitu `^[A-Za-z0-9_-]{1,64}$`, `__proto__`, `constructor` ym. estetty). Virheellinen id pudotetaan, mutta ajo luetaan (vanha data ilman kenttää latautuu, testattu). `deckUpdatedAt` hyväksytään vain merkkijonona, enintään 40 merkkiä, ja vain kun id on kelvollinen. Kenttiä ei renderöidä HTML:ksi, ei käytetä olion avaimina eikä levitetä (`...raw`) mihinkään, joten prototyyppisaastetta ei synny. `save` validoi saman funktion läpi.
- **Tilin erottelu:** ajo on tilikohtaisessa avaimessa (`cyberdeck:u:{uid}:sealed`). Toisen tilin pakan id ei löydy nykyisen tilin `decks.get`:llä, joten efekti pudottaa id:n (`withoutDeckId`), eikä tallennus voi kohdistua toisen tilin pakkaan. Pakkojen haku ja päivitys menevät aina oman tilin repositoryn kautta.
- **Pakan päivitys, `expectedUpdatedAt`:** kun ajossa on leima, poikkeava `updatedAt` johtaa kysymykseen ("Korvaa / Tallenna uutena / Peruuta") ennen kirjoitusta, ja kirjoitus käyttää `expectedUpdatedAt`-suojaa, jonka repository tarkistaa saman `mutate`-transaktion sisällä (`conflict`). Korvaa-valinta ohittaa suojan vain käyttäjän nimenomaisella päätöksellä. Kaksoislähetys estetään `saving`-refillä. Päivitys säilyttää julkaisuasetukset (`publish`), ja sisältö kulkee `validContent`:n kautta (pakan normaalit rajat).
- **Nimikenttä:** `checkDeckName` ja repositoryn `validContent` validoivat nimen. `maxLength=100`. Nimi näytetään React-tekstinä.
- **"Avaa pakka" -linkki:** `routeHash({ name: 'deck', id })`, id on `isDeckId`-validoitu, joten `href` ei voi sisältää `javascript:`- tai muuta skeemaa.
- **Reitit ja uudelleenohjaus:** `parseHash` palauttaa `#/testaa/...` -osoitteille vain kiinteitä reittejä (tuntematon välilehti → Sealed). `location.replace` saa arvonsa `routeHash`:lta, joka palauttaa näille reiteille vain vakiomerkkijonoja, joten hash-syöte ei päädy kohdeosoitteeseen (ei avointa uudelleenohjausta). Kanoninen osoite jäsentyy takaisin samaan reittiin, joten silmukkaa ei synny (testattu: vanhat osoitteet, `#/testaa`). `replace` ei lisää historiamerkintää.
- **Pelaa yksin -lista:** pakan nimi React-tekstinä, linkki validoidusta id:stä.
- **Renderöinti (SR-1):** ei `dangerouslySetInnerHTML`:ia, `innerHTML`:ää, `eval`:ia eikä `window.open`:ia uusissa tai muuttuneissa tiedostoissa.

## Löydökset

### SEC-T176-1 · Ajo, jossa on `deckId` ilman leimaa, ylikirjoittaa pakan kysymättä · Suositus (Low) · Korjattu (PM, parseSealedRun pudottaa id:n ilman kelvollista leimaa, testi sealed.test.ts)
**Sijainti:** `src/ui/SealedView.tsx` `saveAsDeck` (ehto `run.deckUpdatedAt !== undefined` kysymyksessä ja `expectedUpdatedAt`:ssa), `src/domain/sealed.ts` `parseSealedRun` (id säilyy, vaikka leima pudotetaan) · **Tehtävä:** T-176
**Toistaminen:** Aseta localStorageen `cyberdeck:sealed` (tai tilin avaimeen) kelvollinen valmis ajo, jonka `deckId` on käyttäjän jonkin muun pakan id ja `deckUpdatedAt` puuttuu tai on yli 40 merkkiä. Avaa `#/testaa/sealed` ja paina "Tallenna muutokset".
**Vaikutus:** Kohdepakan sisältö (myös sivupakka ja muut osiot) korvataan sealed-pakalla ilman kysymystä ja ilman `expectedUpdatedAt`-suojaa. Jos pakka on julkaistu, julkinen sisältö muuttuu seuraavassa synkassa. Leimaton ajo, jossa on id, ei voi syntyä julkaistusta koodista, koska `deckId` ja `deckUpdatedAt` tulevat samassa julkaisemattomassa tehtävässä ja kirjoitetaan aina yhdessä. Tilanne syntyy siis vain muokatusta tai rikkoutuneesta tallennuksesta. Kirjoittaminen localStorageen vaatii saman originin oikeudet (esim. XSS tai pääsy laitteeseen), jotka antavat jo suoran pääsyn pakkoihin, joten kyse ei ole luottamusrajan ylityksestä vaan eheys- ja vikasietoisuusasiasta.
**Korjausehdotus:** Joko (a) `parseSealedRun` säilyttää `deckId`:n vain, kun mukana on kelvollinen leima (pudota molemmat, jos leima puuttuu tai on virheellinen; tiukenna leima ISO-aikamuotoon, esim. `Date.parse` ja pituus 24), tai (b) `saveAsDeck` kysyy aina, kun id on olemassa mutta leima puuttuu, ja käyttää `expectedUpdatedAt`:ia aina tilassa `check`. Testi: leimaton ajo, jossa on toisen pakan id, ei kirjoita ilman kysymystä.
**Tila:** Avoin (Suositus)

### SEC-T176-2 · "Tallenna muutokset" korvaa kaikki osiot · Info
**Sijainti:** `src/ui/SealedView.tsx` `saveAsDeck` (`sections` = yksi osio)
**Havainto:** Kun käyttäjä valitsee "Korvaa", pakkaan editorissa lisätty sivupakka ja muut osiot katoavat. Tämä on tarkoitettu käytös, ja kysymys ennen korvausta kertoo siitä. Vaikutus on vain käyttäjän omaan dataan hänen omalla valinnallaan.
**Korjausehdotus:** Ei tarvita turvallisuussyistä. UX voi harkita kysymystekstiin mainintaa sivupakasta.
**Tila:** Hyväksytty

### SEC-T176-3 · "Avaa pakka" näkyy ennen kuin pakan olemassaolo on tarkistettu · Info
**Sijainti:** `src/ui/SealedView.tsx`, `savedId`-efekti ja linkki `run.deckId !== undefined`
**Havainto:** Poistetun pakan id näkyy hetken linkkinä, kunnes efekti pudottaa sen. Linkki vie pakkasivun "ei löytynyt" -tilaan. Ei tietovuotoa, koska id on käyttäjän omassa selaimessa.
**Tila:** Hyväksytty

### SEC-T176-4 · Pakan id `sealed` jää edelleen reitin varjoon · Info
**Sijainti:** `src/ui/useHashRoute.ts` `parseHash` (`#/pakat/sealed` ohjataan Testaa-osioon)
**Havainto:** Jatkoa SEC-T173-4:lle. Generoidut id:t eivät osu tähän, ja vain tuotu tai käsin muokattu pakka voisi saada id:n `sealed`. Vaikutus on enintään se, ettei pakkaa voi avata osoitteella.
**Tila:** Hyväksytty
