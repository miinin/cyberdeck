# T-185 · Korttiruutu inforuuduksi, isommat koot ja viisteet oikeaan yläkulmaan
**Tila:** In Progress · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-20 (kuvakaappaus Kortit-sivun Iso-koosta, T-184:n jälkeen)
**Katselmoinnit:** PM kuvakaappauksista. Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

## Määrittely (PM)
Käyttäjän palaute: koot ovat liian pieniä, alanimi puuttuu, nauhan merkit eivät muistuta korttia, kortti ja sen tiedot eivät erotu yhdeksi kokonaisuudeksi, ja viisteet ovat väärässä kulmassa ja näyttävät rikkinäisiltä.

1. **Korttikoot isommiksi.** Kortin teksti pitää pystyä lukemaan isolla näytöllä. Pieni noin 12rem, Normaali noin 16rem ja Iso noin 22rem. Lopulliset arvot valitaan kuvista (Iso: kortin sääntöteksti luettavissa 1280- ja 1920-näytöllä). Paketin 2 kriteeri "≥ 5 korttia rivillä 1280:ssa" kumotaan. Uusi kriteeri: Normaali 1280:ssa ≥ 3, 1920:ssa ≥ 5, ja 320:ssa 2 saraketta Pienessä ja Normaalissa (Iso saa olla 1 sarake). Ei vaakaylivuotoa.
2. **Alanimi takaisin nimilappuun.** "Adam Smasher" ja sen alla "Ender of Legends" (pienempi, muted mutta AA). Alanimi on pelissä tärkeä, joten sitä ei piiloteta millään koolla. Ellipsi ja `title` koko nimellä säilyvät.
3. **Merkit matkivat korttia.** Rarity-merkki säilyy ennallaan, koska se on hyvä.
   - **Cost:** samanlainen kuin kortin vasemman yläkulman kustannuslaatikko, eli tumma laatikko, kortin värinen kehys ja valkoiset lihavat numerot samassa muodossa. "Ei kustannusta" näkyy viivana samassa laatikossa.
   - **Tyyppi (Legend, Unit, Gear, Program):** kuten kortin oikean yläkulman tyyppitabi, eli kortin värillä täytetty, viistetty muoto, valkoinen versaali ja sama tyyli kaikille tyypeille.
   - **Power:** kuten kortin oikean alakulman power-laatikko (kortin värinen täyttö, valkoinen luku).
   - **RAM:** kuten kortin RAM-merkki (×2-tyylinen chip).
   - Jokaisella merkillä on saavutettava nimi ("Cost 5", "Power 6", "RAM 2"), ja nimi näkyy myös `title`-tekstinä. Jos merkistä ei muuten käy ilmi, mikä luku on kyseessä, sen viereen lisätään pieni näkyvä tunniste. Tavoite on, että käyttäjä tunnistaa luvun suoraan kortin merkistä.
   - Kortin värit: punainen, keltainen, vihreä ja sininen. Kontrasti AA molemmissa teemoissa (keltaisella taustalla tumma teksti).
4. **Inforuutu.** Kortti ja sen tiedot rajataan yhdeksi kokonaisuudeksi: kortin ympärillä on `.object`-tyylinen ruutu (pinta, ohut viiva, viiste oikeassa yläkulmassa), jonka yläosassa on iso kortti ja alla selkeästi nimilappu ja merkit. Ruutujen väli on selvä. Sama ruutu näkyy Kortit-, Kokoelma › Omat- ja Have/Want-ruudukoissa, ja merkintätilan − ja + ovat ruudun sisällä keskellä.
5. **Viisteet oikeaan yläkulmaan, koko sivustolla.** Design-järjestelmän viistetyt muodot (`--shape-chamfer*`, `--cut*` ja kaikki paikalliset `clip-path`-polygonit) viistävät nyt oikean alakulman. Niiden pitää viistää **oikea yläkulma**, myös esimerkiksi segmenteissä (Pieni, Normaali, Iso), lajittelun selectissä, värisuodattimen chipeissä, painikkeissa, kentissä ja objekteissa. Viisteessä pitää näkyä **viistoviiva**: kun reunaviiva leikkautuu `clip-path`illa, kulmaan piirretään viiva (esim. pseudo-elementin tai gradientin avulla, tai `inner`-varianttien avulla kuten painikkeissa), jotta laatikko ei näytä rikkinäiseltä. Tarkista kaikki näkymät (Kortit, Kokoelma, Pakat, editori, Testaa, Have/Want, Proxy, dialogit) molemmissa teemoissa.

**Rajoitteet:** ei uusia liikkuvia koristeita, ei sisäistä vieritystä, AA-kontrasti, reduced-motion, `forced-colors` toimii (viisteet saavat hävitä siellä).
**Testit:** päivitä vain muuttuneet kriteerit (esim. styles.t181cards.test.ts:n kortti- ja nauhakoot). Lisää testi, joka varmistaa, että `--shape-chamfer*` viistää oikean yläkulman.
Haara `t-185-korttiruutu` testistä.
