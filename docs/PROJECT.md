# PROJECT · cyberdeck

> PM täyttää käyttäjän haastattelun perusteella. MVP-tasot vaativat käyttäjän hyväksynnän.
> **Luonnos 2026-09-30:** kohdat, joissa lukee "käyttäjä päätti", on sovittu käyttäjän kanssa projektin perustamiskeskustelussa. Merkityt avoimet kohdat PM tarkentaa käyttäjän kanssa.

## Ongelma
Cyberpunk TCG:n pelaajalla on useita pakkoja ja kasa kortteja. On vaikea pysyä perillä siitä, mitä kortteja omistaa, missä pakassa mikäkin kortti on ja voiko uuden pakan koota purkamatta toista. Olemassa olevat työkalut (ripperdeck, ExBurst ym., katso TUTKIMUS.md) seuraavat kokoelmaa ja pakkoja, mutta mikään ei kerro, **missä omassa pakassasi puuttuva kortti on**.

## Kohderyhmä
Käyttäjä itse (aloitteleva Cyberpunk TCG -pelaaja) ja hänen pelikaverinsa.

## Ominaisuudet (käyttäjä päätti)
1. **Kokoelma ja pakat:** korttilistaus, johon on äärimmäisen helppo merkitä omistetut kortit. Niistä muodostetaan pakkoja, ja jokaisen kortin kohdalla näkyy, missä pakassa se on.
2. **Pakkalistan tuonti:** käyttäjä liittää pakkalistan tekstinä, ja ohjelma näyttää puuttuvat kortit sekä sen, missä pakoissa muut tarvittavat kortit ovat.
3. **Vaihtolista kavereille:** tuplat vaihtoon ja etsityt kortit jaettavana linkkinä. Näkyy, mitä kaverilla on sinulle ja sinulla hänelle.
4. **Nostotodennäköisyydet:** pakkanäkymässä laskuri, esim. "todennäköisyys, että kortti X on kädessä vuorolla 3".

## Tavoitteet ja onnistumisen mittarit
_Avoin, PM tarkentaa._ Ehdotus: pakan lisääminen ja puuttuvien korttien raportti onnistuvat alle minuutissa ilman ohjeita. Kortin sijainnin näkee yhdellä haulla.

## Rajaukset (mitä emme tee)
_Avoin, PM tarkentaa._ Ehdotus: ei hintaseurantaa, ei korttiskannausta kameralla eikä pelisimulaattoria. Nämä menevät IDEAS.md:hen.

## Rajoitteet
- Korttidata haetaan Netdeck.gg:n julkisesta rajapinnasta (TUTKIMUS.md). Korttikuvien linkit ovat aikarajattuja, eikä kuvien käyttöehtoja ole vielä tarkistettu (Digiturva ja Arkkitehti).
- Pakkalistojen tuonti tapahtuu tekstinä, koska virallisen palvelun pakat vaativat kirjautumisen.
- Vaihtolista (ominaisuus 3) vaatii kirjautumisen ja tietokannan. Silloin testille tulee oma Firebase-projekti (D-003), ja kavereiden tiedot kuuluvat Digiturvan tietosuoja-arviointiin.
- Käyttäjä haluaa, että hänen ei tarvitse tehdä teknisiä toimenpiteitä, ja agentit hoitavat kaiken. Käyttäjältä kysytään vain tuotepäätökset ja hyväksynnät.

## MVP-tasot (ehdotus, vaatii käyttäjän hyväksynnän)
- **MVP-0 · Kävelevä luuranko:** build, testit, julkaisuputki ja korttilistan haku rajapinnasta näytölle.
- **MVP-1 · Ydinarvo:** ominaisuudet 1 ja 2 (kokoelma, pakat, kortin sijainti, pakkalistan tuonti ja puuttuvien korttien raportti).
- **MVP-2 · Käyttökelpoinen:** ominaisuudet 3 ja 4 (vaihtolista ja nostotodennäköisyydet), kirjautuminen, virheenkäsittely ja mobiilikäyttö.
- **MVP-3 · Viimeistelty:** _täytetään_

## Riskit
| Riski | Todennäköisyys | Vaikutus | Torjunta |
|---|---|---|---|
| Netdeck.gg-rajapinta muuttuu tai sulkeutuu | Keskisuuri | Suuri | Korttidatan välimuisti ja kerros, joka eristää rajapinnan muun sovelluksen muutoksilta (Arkkitehti) |
| Virallisen pakkarakentajan vientimuoto poikkeaa tunnetuista | Keskisuuri | Keskisuuri | Joustava jäsennin ja tunnistamattomien rivien näyttäminen käyttäjälle. Käyttäjältä pyydetään oikea esimerkkilista. |
| Korttikuvien käyttöoikeus epäselvä | Keskisuuri | Keskisuuri | Tarkistus ennen julkaisua, varalla tekstipohjainen näkymä |
