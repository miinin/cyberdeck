# T-172 · Goldfish-simulaattori: pelaa pakkaa yksin
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Päättäjä:** käyttäjä (2026-10-17): "Pelaat pakkaa yksin ruudulla: nostat kortteja, myyt niitä Eddieiksi ja pelaat kortteja RAMin ja kustannusten mukaan. Näet heti, takkuaako pakan alku. Testikäden seuraava taso."

## Säännöt (virallinen Printable Gameplay Guide, cyberpunktcg.com/docs/printable-gameplay-guide.pdf, 2026)
- **Valmistelu:** pakka sekoitetaan. Legendit (3) ovat kuvapuoli alaspäin satunnaisessa järjestyksessä. Ensin aloittava pelaaja käyttää (spend) kaksi vasemmanpuoleisinta Legendiään, eivätkä ne valmistu hänen ensimmäisellä vuorollaan. Aloituskäsi on 6 korttia, ja mulligan sallitaan kerran: käsi sekoitetaan takaisin ja nostetaan 6 uutta.
- **Aloitusvaihe:** (1) kaikki käytetyt kortit valmistuvat, (2) nostetaan 1 kortti, (3) Gig: valitaan yksi noppa fixer-alueelta (d4, d6, d8, d10, d12, d20, d20 aina viimeisenä), heitetään ja siirretään Gig-alueelle. Street Cred on Gig-noppien summa.
- **Päävaihe** (vapaassa järjestyksessä):
  - **Myy:** kerran vuorossa myydään kädestä kortti, jossa on myyntimerkki (`eddiable === true`). Kortti siirtyy Eddies-alueelle, ja siitä tulee pysyvästi 1 Eddie.
  - **Pelaa:** maksetaan kortin `cost` käyttämällä Eddiejä. Myös Legendejä voi käyttää, 1 $ kappaleelta, olivat ne kuvapuoli ylös- tai alaspäin. Unit menee kentälle Lag-tilassa, eikä se voi hyökätä samalla vuorolla. Program menee heti trashiin. Gear liitetään valittuun omaan Unitiin tai Legendiin; yksinkertaistus: valinta listasta, ja se näytetään Unitin alla.
  - **Kutsu Legendi:** kerran vuorossa maksetaan 1 $, ja satunnainen kuvapuoli alaspäin oleva Legendi käännetään ylöspäin.
  - **Hyökkää:** valmis Unit, joka ei ole Lag-tilassa, käytetään. Goldfishissa hyökkäys menee aina Gig-alueelle, ja laskuri näyttää varastetut Gigit: 1 + floor(power / 10), power 0 → 0.
  - Rival puuttuu, joten "Varastetut Gigit" on teoreettinen paine. Voittoehto: 7 Gigiä tai varastettua yhteensä, mikä on vain mittari. Deckout on tappio.
- RAM ei rajoita pelaamista (se on pakanrakennussääntö). Pakassa olevat kortit ovat jo valmiiksi RAM-rajojen mukaisia.
- Korttien omia tekstejä ei simuloida. Ohjeteksti: "Korttien tekstit eivät ole mukana: tee niiden vaikutukset itse."

## Määrittely
- **Pääsy:** pakan Tilastot-osiossa Testikäden viereen tulee painike **"Pelaa yksin"** (en "Goldfish"). Se avaa oman näkymän (reitti `#/pakat/<id>/goldfish` tai olemassa olevan reitityksen tapa), jossa on paluulinkki pakkaan. Näkymä ottaa vastaan `DeckContent`in, jotta T-173:n sealed-pakka voi käyttää sitä myöhemmin.
- **Aloitus:** valinta "Aloitan ensin / toisena", sitten käsi ja **Mulligan** (kerran) tai **Pidä**.
- **Pöytä (ruudulla ylhäältä alas):**
  1. Tilarivi: vuoro N/7, Eddies vapaana/yhteensä, Gigit (noppien arvot) ja Street Cred, pakassa X, trash Y sekä varastetut Gigit.
  2. Legendit (3 paikkaa: kuvapuoli alas, ylös tai käytetty).
  3. Kenttä (Unitit ja niihin liitetty Gear, Lag-, valmis- ja käytetty-tila näkyvät, Hyökkää-painike).
  4. Käsi korttikuvina (CardImage). Kortin napautus avaa toiminnot **Pelaa (cost)** ja **Myy**. Toiminto on harmaa ja syy kerrotaan ("Ei tarpeeksi Eddiejä", "Jo myyty tällä vuorolla", "Ei myyntimerkkiä").
  5. Toimintopainikkeet: **Kutsu Legendi (1 $)**, **Lopeta vuoro**, **Aloita alusta**.
  6. Vuoroloki ("V2: nosto X, myyty Y, pelattu Z (3 $)"). Loki kasvaa sivun mukana, ei sisäistä vieritystä.
- **Yhteenveto vuoron 7 jälkeen tai painikkeesta "Lopeta peli":** ensimmäinen Unit kentällä vuorolla N, pelaamatta jääneet Eddiet yhteensä (hukattu), pelatut kortit, varastetut Gigit yhteensä ja "Pelaa uudestaan".
- **Logiikka** on puhtaana tilakoneena `src/domain/goldfish.ts`: `start(deck, cardsByKey, rng, goFirst)` ja toimintofunktiot, jotka palauttavat uuden tilan tai virheen syyn. Satunnaisuus tulee injektoitavasta rng:stä (kuten testHand.ts). Yksikkötestit kattavat: valmistelun ja ensin aloittavan kaksi käytettyä Legendiä, mulliganin kerran, myynnin kerran vuorossa ja vain eddiable-kortille, maksun Eddieillä ja Legendeillä, Lagin, hyökkäyksen Gigit (power 0, 9, 10, 25), Legendin kutsun kerran vuorossa, d20:n viimeisenä, deckoutin ja vuoron vaihdon (valmistuminen ja nosto). UI-testi kattaa polun: aloitus → myy → pelaa → lopeta vuoro.
- **Ilme:** täysleveä, 320 px toimii ilman vaakavieritystä. Painikkeet eivät pompi tilan vaihtuessa: varaa tila ja käytä kiinteitä korkeuksia, koska käyttäjä vihaa pomppimista. Tila ei tallennu (istuntokohtainen). Ei uutta riippuvuutta. Tekstit fi ja en. Animaatiot vain, jos `prefers-reduced-motion: no-preference`.

## Luovutus

**Koodari (2026-10-17):** Valmis, committoitu suoraan test-haaraan (D-029), ei pushattu.
- Toteutus: `src/domain/goldfish.ts` (puhdas tilakone, 30 testiä), `src/ui/GoldfishView.tsx` (näkymä + `GoldfishDeckPage`), tekstit `goldfishTexts.{fi,en,}.ts`, reitti `#/pakat/<id>/goldfish`, painike "Pelaa yksin" DeckStatsissa (`goldfishHref`, vain DeckEditorissa), CSS `.gf-*` lopussa. Näkymä ottaa `DeckContent`in (T-173 voi käyttää).
- Tulkinnat: myyty kortti on heti valmis Eddie; maksu kuluttaa Eddiet ensin, sitten valmiit Legendit vasemmalta; Gig-noppa valitaan joka vuoro ennen päävaihetta (d20 vasta viimeisenä, 6 noppaa, joten vuorolla 7 ei Gigiä); nosto myös aloittajan vuorolla 1; hukattu = vuoron lopussa käyttämättä jääneet $ (Eddiet + valmiit Legendit); Gearin voi liittää Unitiin tai Legendiin; Unitin power ei sisällä Gearin vaikutusta.
- Käsikortit ovat oma `Picture`-painike (aria-pressed), ei `CardImage`, koska valinta tarvitsee valittu-tilan.
- Tarkistettu kuvakaappauksin 320 ja 1440 px: ei vaakavieritystä, noppapainikkeet 3 saraketta kapealla, varatut korkeudet syy-riveille.
- Testit: `npm test` 1881/1881, lint ja build läpi (yhdellä ajolla 8 tiedostoa aikakatkesi kuormituksen takia, uusinta puhdas).
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (refs renderissä, lint) · Suosituksia 1 (Gear-power ja korttitekstit eivät mukana; UI-testit kattavat vain suomen).
