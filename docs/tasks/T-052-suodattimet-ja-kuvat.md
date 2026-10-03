# T-052 · Hover-esikatselun korvaus, isommat kuvat, Cost/Power/RAM-suodattimet, värilaattojen korjaus
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-03)
**Malli:** D-014. Käyttäjä on poissa ja kielsi luvan kysymisen. PM yhdistää testiin, kun PR:n tarkistukset ovat vihreät.
**Haara:** `t-052-suodattimet-ja-kuvat`

## Palaute (käyttäjä 2026-10-03)
1. Ei pidä tyhjästä kaistaleesta poimijataulukon ja pakkasarakkeen välissä, johon hover-kuva ilmestyy. Tilalle halutaan parempi ratkaisu.
2. Selatessa kuvien pitää olla isompia: nykyisen "Iso"-koon pitää olla uusi "Normaali", ja uuden "Ison" vielä isompi.
3. Suodattimiin lisätään ainakin hinta (Cost) ja Power sekä RAM.
4. Värisuodattimen värisymbolit vuotavat laatikon yli.
5. (PM havaitsi) Tyhjässä pakassa Unit-riveillä näkyy "Ylittää rajan", vaikka määrä on 0. Estomerkki on väärä (todennäköisesti RAM-raja ilman Legendiä, vrt. B-020).

## Hyväksymiskriteerit
1. **Kaistale pois:** poimijataulukko täyttää leveyden sarakkeessaan (72rem:n raja poistetaan tai sitä kasvatetaan niin, ettei näkyvää tyhjää kaistaletta jää). Nimi-sarake saa tilan, eikä sarakkeiden väliin jää isoja aukkoja.
2. **Parempi esikatselu:**
   - Hover-esikatselu on kelluva kuva kursorin tai rivin vieressä. Se sijoittuu näkymän sisään (flip, jos ei mahdu) eikä peitä riviä, jota osoitetaan.
   - Vaihtoehtoisesti tai lisäksi pikkukuvan klikkaus avaa ison kuvadialogin kuten nyt.
   - Esc ja vieritys sulkevat esikatselun, ja vain hiiri avaa sen (WCAG 1.4.13 kuten ennen).
   - Kortit-sivun taulukkonäkymään sama esikatselu.
3. **Kuvakoot** (Kortit-sivu ja editorin Kuvat-näkymä): Pieni = nykyinen Normaali, Normaali = nykyinen Iso, Iso = selvästi isompi (noin 24–26rem leveä). Oletus on Normaali.
4. **Suodattimet Cost, Power ja RAM** sekä Kortit-sivulle että editoriin (CardFilters ja cardSearch.ts):
   - valintanapit arvoista (esim. Cost 0–9+, Power 0–10+, RAM 1–4+) monivalintana samalla tyylillä kuin Harvinaisuus, tai min–max
   - kortti, jolla ei ole arvoa (null), ei osu, kun suodatin on päällä
   - aktiiviset suodattimet näkyvät poistettavina merkkeinä ("Cost 3")
   - puhtaat funktiot ja yksikkötestit
5. **Värisuodatin:** laatat ja symbolit pysyvät laatikkonsa sisällä kaikilla leveyksillä ja kummallakin teemalla.
6. **Bugi:** estomerkki näkyy vain, kun lisääminen todella ylittää säännön. Testi: tyhjässä pakassa ei ole estomerkkejä Unit-, Gear- tai Program-riveillä.
7. Kuvakaappaukset 375, 1920 ja 2850 px kummallakin teemalla, ei vaakavieritystä. `npm test`, lint ja build läpi, testejä ei heikennetä. CHANGELOG.

## Luovutukset
