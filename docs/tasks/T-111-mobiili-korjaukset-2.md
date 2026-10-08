# T-111 · Mobiilikorjaukset 2: navigointi ylös yhdelle riville, yksi "Lisää kortteja", näkyvyyskytkin

**Tila:** Ready. **Haara:** `t-111-mobiili-2` (testistä). **Päättäjä:** käyttäjä (palaute 2026-10-08 tuotannon kuvakaappauksesta; navigoinnin sijainti valittu: "ylös, yksi rivi").

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
