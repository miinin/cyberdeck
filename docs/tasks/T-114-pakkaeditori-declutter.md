# T-114 · Pakkaeditorin karsinta ja yläpalkin koristeviiva pois

**Tila:** Review. **Haara:** `t-113-skanneri-mittaus` (sama PR #124 käyttäjän pyynnöstä). **Päättäjä:** käyttäjä (palaute 2026-10-08: "poista toisteisuus, declutter the shit out of this"), PM (ratkaisut).

## Muutokset
1. **Yläpalkin koristeviiva pois:** `.site-header::after`, eli keltainen 7rem viiva yläpalkin alla vasemmalla, poistetaan kaikilta leveyksiltä. Se sekoittuu aktiivisen sivun keltaiseen alaviivaan. Keltainen tarkoittaa jatkossa vain "aktiivinen tai valittu".
2. **Pakkamäärä vain kerran:** välilehden teksti on pelkkä "Pakka" ilman lukua "(40/40)". Määrä, edistymispalkki ja laillisuus näkyvät pakan otsikossa ("Pääpakka 40/40–50 ✓ Laillinen").
3. **Tallennustila ja vienti samalle riville nimen kanssa:** laatikoitu "✓ Tallennettu" -merkki korvataan pienellä himmeällä tekstillä tai ikonilla nimen vieressä tai alla, ilman reunusta ja taustaa. Vienti-ikoni on samalla rivillä oikealla. Tallennusvirhe näkyy edelleen selvästi (nykyinen `notice-danger`). Saavutettavuus säilyy: "Tallennettu" ilmoitetaan `role="status"`-alueella kuten nyt.
4. **Näkyvyys yhdelle riville ilman laatikkoa:** poistetaan rivi "Näkyvyys: Yksityinen" ja reunuslaatikko. Jäljelle jää yksi rivi: "Yksityinen [kytkin] Julkinen" ja sen perässä tai alla pieni himmeä vihje ("Vain sinä näet pakan."). Kytkimen `role="switch"`, nimi ja kuvaus säilyvät ruudunlukijalle (esimerkiksi `aria-label` "Julkinen pakka" ja `aria-describedby` vihjeeseen). Vahvistuslomake avautuu kuten ennenkin.
5. **"← Takaisin hakuun" pois mobiilista:** kun välilehdet ovat käytössä (alle 64rem), pakan otsikon "← Takaisin hakuun" piilotetaan, koska "Lisää kortteja" -välilehti tekee saman. Työpöydällä linkki säilyy.
6. **Väljyys:** pienennetään marginaaleja niin, että otsikkorivi, välilehdet, näkyvyysrivi ja pakan otsikko mahtuvat 390 × 844 -näytöllä ensimmäiseen näkymään ja ensimmäiset pakan kortit näkyvät ilman vieritystä.

## Hyväksymiskriteerit
- Mikään tieto ei toistu (määrä, näkyvyystila, toiminto).
- Testit päivitetään vastaamaan uutta rakennetta, mutta niitä ei heikennetä.
- `npm test` (ajetaan kerran), `npm run lint` ja `npm run build` menevät läpi.

## Luovutus

- Tehty: koristeviiva (`.site-header::after`) pois; välilehti on pelkkä "Pakka"/"Deck"; tallennustila hiljaiseksi tekstiksi ilman reunusta (`role="status"` ja virhe-notice ennallaan); vienti pysyy nimirivillä; näkyvyys yhdelle riville ilman laatikkoa ja "Näkyvyys: ..." -riviä, vihje (`aria-describedby`) rivillä, kytkimen nimi ja vahvistuslomake ennallaan; "Takaisin hakuun" poistettu renderöinnistä alle 64 rem; marginaaleja pienennetty (editor-head, crumb, tabs, deck-visibility).
- Testit päivitetty: välilehden nimi, näkyvyysrivin haut, "Takaisin hakuun" -testi muutettu toteamaan, ettei linkkiä ole mobiilissa.
- npm test 1519 läpi (ajettu kerran), lint ja build läpi. Ei selaimella tarkistettua 390 × 844 -ensinäkymää: PM katsoo esikatselusta.
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0
