# T-107 · Mobiilinavigointi alapalkiksi

**Tila:** Review. **Haara:** `t-107-mobiilinav` (testistä). **Päättäjä:** käyttäjä (palaute 2026-10-08: "kaksikerroksinen navigointipalkki"), PM (ratkaisu).

## Ongelma
Puhelimessa yläpalkissa on logo- ja ikonirivi, jonka alla viisi navigointilinkkiä rivittyy kahdelle riville. Tuloksena on kolmikerroksinen ja sekava yläpalkki.

## Ratkaisu (PM)
- **Alle 40rem:** `.main-nav` on kiinteä alapalkki (`position: fixed; bottom: 0`), jossa on viisi tasaleveää kohdetta yhdellä rivillä. Mukana on `env(safe-area-inset-bottom)`, korkeus on vähintään `--target-min`, ja tausta on sama musta kuin yläpalkissa. Aktiivinen kohde merkitään keltaisella yläreunaviivalla (yläreunassa, koska palkki on alhaalla). Tekstit ovat lyhyitä ja eivät rivity (pienempi fonttikoko, kirjainväli tiiviimmäksi), ja niiden pitää mahtua 320 px:n leveydelle.
- **Yläpalkki:** puhelimessa vain yksi rivi, jossa ovat logo ja `header-tools`. Poista T-087:n `order/flex-basis: 100%` -sääntö.
- **Sisältö ei jää palkin alle:** `body` saa alapehmusteen palkin korkeuden verran, ja `scroll-padding-bottom` toimii samoin.
- **Muut kelluvat elementit nousevat palkin yläpuolelle:** `.scan-fab` ja pakkaeditorin `.deck-bar` (sticky bottom). Käytä yhteistä CSS-muuttujaa, esimerkiksi `--bottom-nav-height`, joka on 0 vähintään 40rem leveydellä.
- **Tulostus:** palkki on piilossa tulostettaessa (proxy).
- **Ei muutoksia** DOM-järjestykseen, linkkeihin tai `aria-current`-logiikkaan. Muutos on vain CSS:ää, ellei jokin ehdottomasti vaadi muuta.

## Hyväksymiskriteerit
- Puhelimessa (320–639 px) yläpalkki on yksi rivi ja navigointi yksi rivi alhaalla. Mikään sisältö, kelluva painike tai pakkapalkki ei jää alapalkin alle.
- Vähintään 40rem leveydellä näkymä ei muutu.
- Ei sisäisiä vieritysalueita eikä vaakavieritystä.
- `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus

**Koodari, 2026-10-08.** Toteutettu vain CSS:llä (`src/styles.css`, uusi T-107-lohko tiedoston lopussa; T-087:n `order/flex-basis`-sääntö poistettu). Alle 40rem: `.main-nav` on kiinteä alapalkki (5 tasaleveää kohdetta, `nowrap`, 0.6875rem, safe-area mukana, keltainen yläreunaviiva aktiivisella). Yhteinen muuttuja `--bottom-nav-height` (0px vähintään 40rem): käytössä `body`-alapehmusteessa, `scroll-padding-bottom`:ssa, `.scan-fab`:ssa, `.scan-fab-spacer`:ssa ja `.deck-bar`:in `bottom`-offsetissa. Matala ikkuna (alle 30rem korkea, 400 % zoom): palkki jää virtaan. Tulostuksessa palkki ja pehmuste pois. DOM, linkit ja aria-current koskemattomia.

Testit: `npm test` 1509/1509 läpi, lint ja build läpi. Selaimessa 320 px:n leveydellä ei ole tarkistettu (ei selainta ajossa): PM tarkistaa esikatselusta erityisesti "Have/Want"-tekstin mahtumisen 64 px:n kohteeseen.
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0
Seuraavaksi: PM esikatselu.
