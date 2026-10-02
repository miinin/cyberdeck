# CHANGELOG

Käyttäjälle näkyvät muutokset versioittain.

## [Julkaisematon]

- Pakkaeditorin korttihaku on uudistettu. Rivit-näkymässä on yksi kortti riviä kohti, ja rivillä ovat pikkukuva, Cost-jalokivi, nimi ja alaotsikko, tyyppi ja väri, Power, RAM, Rarity sekä −/+. Kapealla näytöllä arvot näkyvät nimen alla. Kuvat-näkymässä kuvakoon voi valita (Pieni, Keski tai Iso). Korttia napsauttamalla se lisätään pakkaan, ja oikea napsautus tai Shift+napsautus poistaa sen. Näppäimistöllä + lisää ja − poistaa. Kun hiiri pysähtyy rivin tai pakkalistan kortin päälle, kortista näytetään iso kuva. Leveällä näytöllä suodattimet ovat vasemmalla omassa sarakkeessaan, ja kapeammalla ne avautuvat Suodattimet-painikkeesta. Rajan ylittävässä kortissa näkyy merkintä Raja täynnä tai Sama Legend.

- Kaikki näkymät käyttävät nyt ruudun leveyden (enintään 2560 px), ja reunoille jää kapeat kaistat. Kortit-sivulla suodattimet ovat leveällä ruudulla vasemmalla omassa, mukana vierivässä paneelissaan ja kortit ruudukossa sen oikealla puolella. Ruudukon kuvakoon voi valita (Pieni, Keski tai Iso). Valitut suodattimet näkyvät tulosten yläpuolella siruina, joista suodattimen voi poistaa yhdellä painalluksella. Kapealla ruudulla hakukenttä on aina näkyvissä ja muut suodattimet avautuvat Suodattimet-painikkeesta, joka kertoo valintojen määrän.

- Pakkaeditori käyttää koko leveyden: leveällä ruudulla haku ja tulokset ovat vasemmalla ja pakka omassa, mukana vierivässä sarakkeessa oikealla. Yhteenveto on tiivis ja siinä on kustannuskäyrä (korttien määrä Costin mukaan). Pakkalistan rivi on yksi tiivis rivi: väriraita, määrä, nimi (kuva aukeaa nimeä painamalla), puuttuu-merkki, Cost ja pienet −/+. Kuvat-näkymässä kortin päällä lukee, montako kopiota pakassa on.

- Taulukko-näkymän sarakeotsikoista (Nimi, Tyyppi, Rarity, Cost, Power, RAM) voi lajitella: ensimmäinen painallus nousevaan, toinen laskevaan ja kolmas palauttaa alkuperäisen järjestyksen. Puuttuvat arvot ovat aina viimeisinä. Lajittelua ei tallenneta.
- Pakan vienti ja tuonti tiedostona: pakkalistassa ja pakkaeditorissa on painikkeet Vie .json ja Vie .txt. Tuo pakkalista -näkymä hyväksyy nyt myös viedyn .json-tiedoston (enintään 256 kt). Tuotu pakka tallennetaan aina uutena pakkana, eikä se ylikirjoita mitään. Pitkän pakan nimen katkaisu ei enää riko emojia.
- Pakan haku Netdeck-linkistä: Tuo pakkalista -näkymässä voi liittää netdeck.gg-pakan osoitteen ja painaa Hae pakka. Raportti näyttää, mitä kortteja kokoelmasta puuttuu. Sideboard näytetään erikseen, eikä sitä tallenneta pakkaan. Haku lähettää pyynnön Netdeck.gg-palveluun vain, kun painat Hae pakka.
- Pakkaeditorin hiominen: hakulistan rivit ovat tasaisia (−/määrä/+ aina oikealla) ja näyttävät myös Powerin ja Rarityn. Väri-suodatin on pelkkiä värejä (nimi näkyy kursorin alla). Samannimisen Legendin lisäys estetään ilmoituksella. Hakulistan voi vaihtaa Kuvat-näkymään, jossa kortin kuvaa painamalla kortti lisätään pakkaan, ja valinta säilyy. Tyyppimerkin viistetty kulma piirtyy reunan väreillä.

- Pakkalistan tuonti: Pakat-sivun Tuo pakkalista -painikkeella voi liittää netistä löytyneen pakkalistan tai valita .txt-tiedoston. Tarkistus näyttää, mitä kortteja kokoelmasta puuttuu, missä muissa pakoissasi kortit ovat, mitkä rivit jäivät tunnistamatta ja onko pakka laillinen. Listan voi sen jälkeen tallentaa uudeksi pakaksi nimeä muokaten. Mitään ei tallenneta ennen kuin painat Tallenna pakaksi.

- Pakanrakennus: yläpalkin Pakat-valinnasta voi luoda, nimetä, kopioida ja poistaa pakkoja (poisto kysyy varmistuksen). Pakkaeditorissa kortteja haetaan samoilla suodattimilla kuin Kortit-näkymässä ja lisätään −/+-painikkeilla. Yhteenveto näyttää Legend- ja pääpakkamäärät, värikohtaiset RAM-rajat, rikkeet selkokielellä ja kokoelmasta puuttuvat kortit. Muutokset tallentuvat itsestään. Kortit-näkymässä kortin alla lukee, monessako pakassa se on.

- Selaus ja muokkaus ovat nyt erillään. Listan yläpuolella oleva Muokkaa kokoelmaa -kytkin näyttää tai piilottaa −- ja +-painikkeet: kun se on pois päältä, kortissa näkyy vain määrä ja tila (harmaa, keltainen tai vihreä ✓). Tyhjällä kokoelmalla kytkin on aluksi päällä.

- Uusi kompakti Taulukko-näkymä (nimi, tyyppi, Rarity, Cost, Power, RAM ja kokoelma). Näkymän voi vaihtaa Ruudukko- ja Taulukko-valinnalla, ja valinta sekä kytkin säilyvät tässä selaimessa.

- Teemavalitsin on nyt pelkkä aurinko- tai kuu-ikoni. Vihje kertoo, mihin teemaan painike vaihtaa.

- Pysyvän tallennuksen pyyntö on nyt pieni tallennuskuvake yläpalkissa, ja hakukriteerien valinnat ovat tiiviimpiä.

- Korttilistassa näkyy harvinaisuus (Rarity), ja sen voi valita suodattimeksi. Kokoelma-valinnalla voi näyttää kaikki, omistetut tai puuttuvat kortit. Omistetun kortin reunus ja määrä ovat nyt keltaiset.

- Pelin termit englanniksi (Cost, Red, Yellow, Green, Blue). Kortin tyyppi näkyy merkkinä, jonka reunan väri kertoo kortin värin. Kokoelman painikkeet ovat kortin keskellä, ja omistuksen reunaväri on hillitympi.

### Muutettu
- Kokoelman −- ja +-painikkeet pysyvät aina samoilla paikoilla: määrä näkyy myös nollana, ja − on himmeä, kun kortteja ei ole. Keltainen palkki laatikon reunassa on poistettu: kokoelmassa olevan kortin reuna ja määrä värjäytyvät siniseksi, ja täysi pelisarja (Legend 1, muut 3) näkyy vihreänä ja ✓-merkkinä.
- Kortin suurennetun kuvan sulkupainike on nyt ruksi (×).

### Lisätty
- Korttilista on nyt ruudukko: jokaisessa laatikossa on iso kuva, nimi, tyyppi ja väri, kortin hinta, Power ja RAM sekä kokoelman +- ja −-painikkeet. Kuvaa painamalla se suurenee kuten ennenkin.
- Haku ja suodatus korttilistaan: voit hakea korttia nimen tai alaotsikon osalla, eikä kirjainkoolla tai aksenteilla ole väliä ("alvarez" löytää Judy Álvarezin). Listaa voi rajata korttityypin (Legend, Unit, Gear, Program) ja värin mukaan, ja haku ja valinnat toimivat yhdessä.
- Listan yläpuolella näkyy, montako korttia haku ja valinnat löysivät (esim. "2 / 151 korttia"). Jos mikään kortti ei vastaa, näet ohjeen ja painikkeen, joka tyhjentää haun ja valinnat.
- Taulukossa näkyy nyt myös kortin väri tekstinä ja pienenä värinäytteenä. Sarakkeen nimi on "Tyyppi ja väri".
- Haku toimii näppäimistöllä (Esc tyhjentää hakukentän) ja kapealla puhelimen näytöllä. Ruudunlukija kertoo tulosten määrän, kun lopetat kirjoittamisen, eikä jokaisesta näppäilystä erikseen.
- Kokoelma: merkitse omistamasi kortit listaan. Uusi sarake "Omistan": yksi painallus +-painikkeesta merkitsee kortin omistetuksi, ja määrää voi muuttaa +- ja −-painikkeilla (0–999). Listan yläpuolella näkyy, montako eri korttia ja kappaletta kokoelmassasi on.
- "Vain omistetut" -valinta näyttää vain kortit, joita sinulla on. Se toimii yhdessä haun ja muiden valintojen kanssa.
- Kokoelma tallentuu tähän selaimeen ja säilyy, kun avaat sivun uudelleen. Se ei siirry toiselle laitteelle. Voit pyytää selainta säilyttämään kokoelman pysyvästi. Jos tallennus ei onnistu, sivu kertoo sen, eikä näytä määrää, jota ei tallennettu.
- Puhelimen kapealla näytöllä jokainen kortti näkyy omana korttinaan, jotta painikkeet mahtuvat.
- Korttikuvat: jokaisella listan rivillä on kortin pikkukuva. Kuvaa painamalla kortti aukeaa isona, ja ikkunan saa kiinni Sulje-painikkeella, Esc-näppäimellä tai painamalla taustaa. Jos kuvaa ei ole, rivillä näkyy tyhjä kehys.
- Teeman valinta: sovellus on oletuksena tumma. Otsikkopalkin Vaalea teema -painikkeella voit vaihtaa vaaleaan teemaan, ja valinta säilyy tässä selaimessa.

### Muutettu
- Kortit näkyvät heti ilman latausta. Korttitiedot tulevat sovelluksen mukana, joten sivu ei enää hae niitä Netdeck.gg:stä joka käynnillä eikä näytä haku- tai virheilmoituksia.
- Uusi Cyberpunk 2077 -henkinen ulkoasu: keltainen ja syaani korostus, viistetyt painikkeet ja uudet fontit (Rajdhani ja numeroille Share Tech Mono). Toiminnot ja tekstit ovat ennallaan.
- Teksti on aiempaa suurempaa, ja omistamasi kortit erottuvat listassa korostettuna rivinä.
- Jos olet pyytänyt laitteelta vähemmän liikettä, sivulla ei ole animaatioita.

## [0.1.0] · 2026-10-01

Ensimmäinen versio.

### Lisätty
- Korttilista: näet kaikki Cyberpunk TCG:n kortit yhdessä taulukossa. Jokaisesta kortista näkyy nimi, tyyppi ja hinta. Hinta tarkoittaa pelin sisäistä kustannusta, ei rahaa.
- Korttitiedot haetaan Netdeck.gg:stä aina, kun avaat sivun. Haku kestää muutaman sekunnin.
- Sivu kertoo, mitä tapahtuu: haun aikana näkyy "Haetaan kortteja…", ja valmiina korttien määrä.
- Jos haku epäonnistuu, näet selkeän ilmoituksen ja Yritä uudelleen -painikkeen.
- Jos osa korteista puuttuu tai lähde ei palauta yhtään korttia, sivu kertoo sen, ja voit hakea kortit uudelleen.
- Sivun alaosassa kerrotaan, että Cyberdeck on epävirallinen fanityökalu ja että korttitiedot tulevat Netdeck.gg:stä.
- Sivua voi käyttää pelkällä näppäimistöllä ja kapealla puhelimen näytöllä. Ruudunlukija kertoo, kun haku valmistuu tai epäonnistuu. Sivu noudattaa laitteen vaaleaa tai tummaa teemaa.

Korttikuvia ei vielä näytetä.
