# T-111 · Mobiilikorjaukset 2: navigointi ylös yhdelle riville, yksi "Lisää kortteja", näkyvyyskytkin

**Tila:** Done. **Haara:** `t-111-mobiili-2` (testistä). **Päättäjä:** käyttäjä (palaute 2026-10-08 tuotannon kuvakaappauksesta; navigoinnin sijainti valittu: "ylös, yksi rivi").

## 1. Päänavigointi ylös yhdelle riville (korvaa T-107:n alapalkin)
- **Ongelma:** alapalkki sekoittui editorin välilehtiin, eikä sitä löytänyt.
- **Ratkaisu:** alle 40rem leveydellä yläpalkissa on kaksi riviä. Ensimmäisellä ovat logo ja `header-tools`. Toisella on `.main-nav` yhtenä rivinä, ja siinä on viisi tasaleveää kohdetta (`flex: 1 1 0`, `nowrap`, tiivis fontti kuten T-107:ssä). Aktiivinen kohde merkitään keltaisella **ala**viivalla kuten työpöydällä.
- **Rivitys:** navigointi ei saa rivittyä millään leveydellä 320 px:stä ylöspäin.
- **Poistettavat:** alapalkin `position: fixed`, `body`-alapehmuste ja `scroll-padding-bottom`. Aseta `--bottom-nav-height` nollaksi tai poista muuttuja kokonaan. `.scan-fab`, `.scan-fab-spacer` ja `.deck-bar` palaavat alareunaan.
- **Leveämmät näytöt:** vähintään 40rem leveydellä näkymä ei muutu.

## 2. Pakkaeditori: vain yksi "Lisää kortteja"
- **Ongelma:** välilehti "Lisää kortteja" ja keltainen iso painike "+ LISÄÄ KORTTEJA" ovat päällekkäin, samannimisinä ja eri värisinä.
- **Ratkaisu:** poista iso painike `.editor-add-cards`. Välilehdet riittävät.
- **Valittu välilehti:** sen pitää erottua selvästi segmenttivalitsimena (keltainen tausta) eikä näyttää päänavigoinnilta.
- **Tyhjä pakka:** jos Pakka-välilehden tyhjässä tilassa on kehotus, sen tekstilinkki tai painike saa viedä Lisää-välilehdelle.

## 3. Pakan näkyvyys: värillinen liukukytkin Yksityinen ⇄ Julkinen
- **Ongelma:** "Näkyvyys: Yksityinen" näyttää passiiviselta tekstiltä (`<details>`, kiinni oletuksena).
- **Ratkaisu:** `DeckVisibility.tsx` näyttää aina näkyvän kytkimen, jossa on tekstit "Yksityinen" ja "Julkinen", väri (yksityinen neutraali tai harmaa, julkinen vihreä tai brändiväri) ja `role="switch"` + `aria-checked`. Tämänhetkinen tila näkyy myös tekstinä.
- **Julkiseksi kytkeminen** avaa nykyisen vahvistuslomakkeen (varoitus, rasti ja nimimerkki) kytkimen alle, ja varsinainen julkaisu tapahtuu vasta lomakkeella kuten nyt.
- **Yksityiseksi kytkeminen** toimii kuten nykyinen "tee yksityiseksi".
- **Kirjautumaton käyttäjä:** kytkin on pois käytöstä, ja sen vieressä on nykyinen kirjautumisvihje.
- **Ennallaan:** julkaisulogiikka, tilat (pending, sending, error, public-aika) ja virheiden käsittely.
- **Tekstit:** fi ja en `deckTexts`-tiedostoissa.

## Hyväksymiskriteerit
- Puhelimessa yläpalkissa on logorivi ja yksi navigointirivi. Alapalkkia ei ole.
- Editorissa on vain yksi "Lisää kortteja".
- Näkyvyyskytkin on näppäimistöllä käytettävä (Space/Enter), ruudunlukija kertoo sen tilan, ja olemassa olevat DeckVisibility- tai PublicDecks-testit päivitetään eikä heikennetä.
- Ei sisäisiä vieritysalueita. Näkymä toimii 320 px:n leveydellä.
- `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus

**Luovutus (Koodari, 2026-10-08) · Tila: Review**
- Navigointi: T-107:n alapalkki poistettu (`--bottom-nav-height`, `position: fixed`, body-pehmuste, scroll-padding). Alle 40rem `.main-nav` on yläpalkin toisella rivillä (`order: 3`, `flex: 1 0 100%`, koko näytön leveys, viisi `flex: 1 1 0` -kohdetta, `nowrap`), aktiivinen keltainen alaviiva. Alle 24rem fontti 0.625rem, jotta "Collection" mahtuu 320 px:llä. Fokusjärjestys DOM:ssa on ennallaan (nav ennen työkaluja), vain visuaalinen järjestys vaihtuu.
- Editori: iso `.editor-add-cards`-painike ja teksti `editorAddCards` poistettu. Valittu välilehti oli jo keltainen segmenttivalitsin. Tyhjän pakan "Takaisin hakuun" vie jo Lisää-välilehdelle.
- Näkyvyys: `<details>` ja radiot korvattu `role="switch"`-painikkeella (`aria-checked`, nimi "Julkinen"), tekstit Yksityinen/Julkinen sen vieressä, julkinen vihreä (`--color-success`), tila myös tekstinä ("Näkyvyys: …"). Pois käytöstä kirjautumatta, kirjautumisvihje `aria-describedby`:ssä. Vahvistuslomake ja julkaisulogiikka ennallaan. Kytkin on `aria-checked=true` myös kun vahvistuslomake on auki (ennen julkaisua), Peruuta palauttaa. Teksti `visLabel` poistettu käytöstä.
- Testit: DeckEditor.tabs ja PublicDecks päivitetty (radio -> switch), uusi näppäimistötesti (Space/Enter). Ei uusia riippuvuuksia.
- Tulokset: `npm test` 1516/1516, lint ja build läpi.
- Ei tarkistettu selaimessa (ei esikatselua tässä ajossa): 320 px:n navigointirivin mahtuminen ja kytkimen ulkoasu kannattaa katsoa PR:n esikatselusta.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (kytkimen "odottaa vahvistusta" -tila voisi saada oman tekstin).
