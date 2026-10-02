# SEC-007 · T-013 pakanrakennus · kevyt tietoturvakatselmointi

**Päivä:** 2026-10-02 · **Katselmoija:** Digiturva · **Malli:** D-014 (kevyt)
**Laajuus:** `git diff origin/test...origin/t-013-pakat -- src` (commit 580fd9f). Ei uusia riippuvuuksia (package.json ei muuttunut), joten `npm audit` ei ollut tarpeen.

## Tulos
Ei Critical-, High- eikä Medium-löydöksiä. Yksi Low-havainto. Ei estä Done-tilaa.

## Löydökset

### SEC-007 · Pakan nimen kentällä ei ole selainpuolen pituusrajaa · Low
**Sijainti:** src/ui/DecksView.tsx (nimeäminen, `<input type="text">`) ja src/ui/DeckEditor.tsx (nimen muokkaus) · **Tehtävä:** T-013
**Toistaminen:** 1) Avaa pakan nimeäminen. 2) Liitä kenttään hyvin pitkä merkkijono (esim. 1 Mt). 3) Tallenna.
**Odotettu:** kenttä rajaa syötteen tai hylkää sen. · **Havaittu:** `checkDeckName` (cleanText, 1–100 merkkiä) hylkää nimen ja näyttää virheen, eikä mitään tallennu. Pitkä merkkijono pysyy vain kentän muistissa.
**Vaikutus:** ei tietoturvavaikutusta, koska validointi tehdään ennen tallennusta ja repositorio validoi uudelleen. Pelkkä käytettävyys- ja kestävyyshuomio.
**Korjausehdotus:** halutessa `maxLength` noin 200 (yli 100, jotta trimmattavat välilyönnit eivät hylkää kelvollista nimeä). Ei pakollinen.
**Tila:** Avoin (backlog, PM päättää)

## Tarkistettu, ei löydöksiä
- **Pakan nimen syöte:** `checkDeckName` → `cleanText` (NFC-normalisointi, vaaralliset ohjausmerkit pois, trim, 1–`MAX_DECK_NAME_LENGTH` = 100). Kopion nimi lyhennetään rajan alle (`copyDeckName`). Repositorio validoi sisällön uudelleen.
- **XSS:** nimet renderöidään React-tekstinä (myös `title`, `aria-label`, live-ilmoitukset). Diffissä ei `innerHTML`, `dangerouslySetInnerHTML`, `eval` eikä dynaamisia `href`-arvoja (vain vakiot `#/` ja `#/pakat`).
- **Hash-reititys:** `parseHash` hyväksyy id:n vain `isDeckId`-tarkistuksella (`^[A-Za-z0-9_-]{1,64}$`) ja tarkalleen kahdella osalla; muuten oletusnäkymä. Id menee vain `repository.get/update`-avaimeksi, ei HTML:ään eikä kyselyyn. Olematon id → "Pakkaa ei löytynyt".
- **Tallennusrajat (SR-11):** `MAX_DECKS` (200) valvotaan repositorion `create`ssa (`limit-reached`), rivin määrä rajataan 0–99 (`withDeckCount`), eri kortteja enintään `MAX_DECK_DISTINCT_CARDS` (500) editorissa ja repositorion validoinnissa.
- **Virheenkäsittely:** tallennus- ja toimintovirheet näytetään `StorageError.kind`-kohtaisilla suomenkielisillä teksteillä, ei teknisiä viestejä tai stack tracea. Autosave jonottaa kirjoitukset, ja epäonnistuminen näkyy tilana. `useDecks` nielee listausvirheen hallitusti tilaan `unavailable`.
- **Henkilötiedot:** ei uusia henkilötietoja. Pakat ovat pelidataa selaimen localStorageen, ei ulkoisia kutsuja eikä seurantaa. PRIVACY.md ei vaadi muutoksia.
- **Riippuvuudet:** ei muutoksia.

## Huomio (ei tietoturvalöydös)
Koodarin kirjaama "viimeinen voittaa" -ylikirjoitus kahden välilehden välillä on eheys- ja käytettävyysasia omassa selaimessa, ei hyökkäyspinta. PM päättää, kirjataanko velaksi.
