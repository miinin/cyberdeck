# T-108 · Skannerin näkyvyys ja jatkuva skannaus

**Tila:** In Progress. **Haara:** `t-108-skanneri-ux`, tehty T-106:n haarasta. PR:n kohdehaara on `t-106-skanneri`, kunnes PR #115 on yhdistetty. **Päättäjä:** käyttäjä (toive 2026-10-08), PM (sijoitus).

## Tavoite
Käyttäjän mukaan skanneri on hieno mutta jää huomaamatta. Sen pitää näkyä selvästi olematta kuitenkaan pääominaisuus. Lisäksi tarvitaan tila, jossa kamera skannaa jatkuvasti ja lisää tunnistetut kortit automaattisesti, jotta monta korttia saa lisättyä yhdellä kertaa.

## Sijoitus (PM:n päätös)
- **Ei omaa päävälilehteä:** skanneri ei ole pääjuttu, ja päänavigointi pysyy tiiviinä.
- **Kokoelma-näkymä:**
  - **Näkyvä painike:** otsikon vieressä on ensisijainen painike, jossa on kameraikoni ja teksti "Scan cards". Painike näkyy, jos laitteessa on kamera.
  - **Tyhjä kokoelma:** näkymässä on iso kehotus skannata kortit (kameraikoni, otsikko, yksi lause ja painike).
  - **Mobiili:** Kokoelma-näkymässä on kelluva kamerapainike oikeassa alakulmassa. Se ei peitä mobiilinavigointia.
- **Kortit-näkymä:** painike pysyy, mutta siinä on kameraikoni, jotta sen tunnistaa.

## Jatkuva skannaus
- **Tilan valinta:** painosvalinnan yhteydessä valitaan tila. "Yksi kerrallaan" on nykyinen tapa, jossa jokainen kortti vahvistetaan. "Jatkuva" lisää kortit automaattisesti. Valinta muistetaan laitteella (localStorage, try/catch).
- **Kuvien otto:** jatkuvassa tilassa kehyksen alueesta otetaan kuva noin 3–4 kertaa sekunnissa (`requestAnimationFrame` tai ajastin, joka pysähtyy, kun sivu ei ole näkyvissä).
- **Lisäys:** kortti lisätään, kun sama kuvitus on varma osuma (`isConfident`) kahdessa peräkkäisessä kuvassa. Tällöin lisätään 1 kappale valittuun painokseen.
- **Palaute:** kehys välähtää vihreänä, kortin nimi näkyy hetken, ja puhelin värähtää lyhyesti (`navigator.vibrate`), jos se on mahdollista.
- **Tuplien esto:** samaa korttia ei lisätä uudelleen, ennen kuin kehyksessä on käynyt jokin muu kortti tai tyhjä kehys (ei varmaa osumaa) noin 0,7 sekunnin ajan. Kaksi samaa korttia peräkkäin onnistuu siis viemällä kortti pois kehyksestä välissä.
- **Session lista:** kehyksen alla on tiivis lista lisätyistä korttia (pikkukuva, nimi, kuvitus ja kumoa). Kumoa poistaa juuri sen lisäyksen. Lopussa näkyy yhteenveto "N cards added".
- **Rajatapaukset:** jos kortti on jo kokoelman maksimimäärässä, sitä ei lisätä, ja tästä näytetään lyhyt ilmoitus.
- **Kamera:** kameran käsittely on sama kuin T-106:ssa. Kamera sammuu suljettaessa, välilehden piilotuksessa ja virheissä (SEC-106).

## Hiominen
- **Kehys:** kehyksen ympärillä on himmennys ja ohjeteksti "Fill the frame with the card".
- **Tilan näyttö:** kameranäkymän yläreunassa näkyvät tila ja painos sekä painike, jolla tilaa voi vaihtaa.

## Hyväksymiskriteerit
- Molemmat tilat toimivat, ja automaattinen lisäys ei tuplaa kortteja eikä lisää epävarmaa osumaa.
- Kumoa poistaa juuri tehdyn lisäyksen.
- Testit kattavat jatkuvan tilan logiikan puhtaina funktioina: kahden kuvan vahvistuksen, tuplien eston ja nollautumisen.
- Ei sisäisiä vieritysalueita, ja näkymä toimii 320 px:n leveydellä.
- `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus
