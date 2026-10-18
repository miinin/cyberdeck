# T-178 · Lyhyt Have/Want-linkki palvelimen kautta
**Tila:** Done (SR-59 käsitestit ohitettu käyttäjän päätöksellä 2026-10-18) · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must · **Päätös:** D-037
**Katselmoinnit:** Digiturva ☑ (SEC-178, ei vetoa, Low-löydökset korjattu) · dev ensin (tietomalli, säännöt)

## Tavoite
Nykyinen vaihtolinkki (`#/vaihto/<base64>`) kantaa koko kokoelman ja voi olla 16 000 merkkiä, eikä se mahdu pikaviesteihin. Uusi linkki on lyhyt: `https://cyberdeck-tcg.web.app/#/v/<tunnus>`, alle 60 merkkiä.

## Määrittely (PM)
1. **Tietomalli:** `tradeShares/{shareId}` = `{ schemaVersion, data, updatedAt }`. `data` on nykyinen `encodeTradeShare`-tuloste (enintään `MAX_SHARE_DATA_LENGTH`, base64url). Ei uid:tä eikä nimimerkkiä.
2. **Tunnus:** `shareId` = sha256(uid + '#trade') pieninä hex-merkkeinä, sen 16 ensimmäistä merkkiä (64 bittiä). Erotin on `#`, koska julkisten pakkojen `publicKey` on sha256(uid + ':' + deckId) ja deckId `trade` on sallittu: `:trade` tuottaisi saman tiivisteen (Digiturva, SR-50). Yksi linkki per käyttäjä, joten linkki pysyy samana ja sisältö päivittyy. Säännöt todistavat omistajuuden laskemalla tiivisteen itse (SR-51). Tilin poisto poistaa dokumentin (lasketaan sama tunnus).
3. **Säännöt:** `get` kaikille (myös kirjautumattomille), `list` kielletty, create/update/delete vain Google-käyttäjälle omaan tunnukseen (tunnus lasketaan `request.auth.uid`:sta, ei dokumentista), tarkat avaimet, `data`:n koko- ja muotoraja, `updatedAt == request.time`, päivitys enintään 10 s välein (SR-51, SR-52).
4. **Jakaminen (ShareTradeButton):** kirjautunut käyttäjä painaa **Jaa Have/Want** → kirjoitetaan dokumentti ja näytetään sekä kopioidaan lyhyt linkki (myös QR). Jos jaettu sisältö muuttuu, linkki päivitetään seuraavalla Jaa-painalluksella. Lisäksi on automaattinen päivitys (viive kuten julkisilla pakoilla, PUBLIC_UPDATE_DELAY_MS), jos linkki on jaettu tällä laitteella. Painike **Lopeta jakaminen** poistaa dokumentin, minkä jälkeen linkki ei enää toimi. Uusi Jaa-painallus palauttaa saman linkin toimivaksi (SR-55, avoin kysymys K-T178-1). Kirjautumaton käyttäjä saa vanhan pitkän linkin ja vihjeen "Kirjaudu, niin saat lyhyen linkin."
5. **Vastaanotto:** `#/v/<tunnus>` lukee dokumentin ilman kirjautumista, validoi sen (`decodeTradeShare`) ja näyttää saman SharedTradeView-näkymän kuin nyt. Puuttuva tai poistettu linkki näyttää tekstin "Linkkiä ei löytynyt. Jakaja on ehkä lopettanut jakamisen." Vanhat `#/vaihto/<data>`-linkit toimivat edelleen.
6. **Tekstit (fi/en):** Jaa Have/Want / Share Have/Want · Lopeta jakaminen / Stop sharing · Linkkiä ei löytynyt. Jakaja on ehkä lopettanut jakamisen. / Link not found. The sender may have stopped sharing. · Kirjaudu, niin saat lyhyen linkin. / Sign in to get a short link. · Jakaminen ei onnistunut. Yritä uudelleen. / Sharing failed. Try again.

## Tarkistus
- Domain-testit (tunnus, validointi), store-testit fake-moduuleilla, UI-testit (kirjautunut ja kirjautumaton jakaminen, lopetus, puuttuva linkki, vanha linkki), sääntötestit, jos emulaattoritestit ovat käytössä.
- `npm test`, `npm run lint` ja `npm run build`. Säännöt deployataan deviin ennen testiin yhdistämistä.

## Rajaukset
- Useampi rinnakkainen linkki per käyttäjä tai vanhenemisaika.

## Turvavaatimukset (Digiturva)
Uhkamalli: SECURITY.md luku 21. Tietosuoja: PRIVACY.md luku 14 (LUONNOS). Nämä ovat ehdotuksia hyväksymiskriteereiksi, ja PM hyväksyy ne.

- [ ] **SR-50 Tunnus.** `shareId` = sha256(uid + '#trade') pieninä hex-merkkeinä, 16 ensimmäistä merkkiä, samalla `crypto.subtle`-toteutuksella kuin `publicDeckId`. Erotin `#` ei kuulu deckId:n merkistöön (`^[A-Za-z0-9_-]{1,64}$`), joten tunnus ei voi olla julkisen pakan pubId:n alkuosa. 64 bittiä riittää, koska `list` on kielletty ja jokainen arvaus on erillinen verkkopyyntö (avaruus 2^64). Tunnus ei paljasta uid:tä, eikä sitä voi laskea ilman uid:tä. Domain-testi: tunnettu uid antaa tunnetun tunnuksen, tunnus vastaa muotoa `^[0-9a-f]{16}$`, ja tunnus eroaa `publicDeckId(uid, 'trade')`:n alusta.
- [ ] **SR-51 Omistajuus säännöissä.** Funktio esim. `tradeKey() = hashing.sha256(request.auth.uid + '#trade').toHexString().lower()`. Ensisijaisesti verrataan tarkasti: `shareId == tradeKey()[0:16]`. Jos merkkijonon viipalointi ei käänny tai toimi, varavaihtoehto on `shareId.matches('^[0-9a-f]{16}$') && tradeKey().matches('^' + shareId + '[0-9a-f]{48}$')`, jossa muototarkistus on **aina ennen** regexin rakentamista. Ilman sitä tunnus `.*` tai `0.*` täsmäisi kenen tahansa tiivisteeseen, jolloin yksi käyttäjä voisi luoda rajattomasti dokumentteja. Sama vertailu koskee createa, updatea ja deletea. Delete ei tarvitse `resource`-ehtoa, koska tunnus lasketaan pelkästä uid:stä, joten puuttuvan dokumentin poisto onnistuu tilin poistossa (vrt. SR-36). `isGoogleUser()` kaikissa kirjoituksissa.
- [ ] **SR-52 Dokumentin rajat.** `hasExactly(d, ['schemaVersion', 'data', 'updatedAt'])`, `isVersion(d.schemaVersion)`, `isText(d.data, 1, 16000) && d.data.matches('^[A-Za-z0-9_-]+$')` ja `d.updatedAt == request.time`. Update vaatii lisäksi `request.time > resource.data.updatedAt + duration.value(10, 's')`. Ei uid:tä, nimimerkkiä, nimeä eikä vapaata tekstiä. `allow list` puuttuu (kielletty), `allow get: if true`. Uusi `match /tradeShares/{shareId}` juuritasolla, muut säännöt ennallaan.
- [ ] **SR-53 Vastaanotto on epäluotettavaa syötettä.** Reitin `#/v/<tunnus>` tunnus tarkistetaan muotoon `^[0-9a-f]{16}$` **ennen** Firestore-kutsua, koska muuten `doc()`-polkuun voi päätyä `/` ja luku kohdistuu eri polkuun. Väärä muoto näyttää "Linkkiä ei löytynyt" ilman verkkopyyntöä. Luettu dokumentti validoidaan: `data` on merkkijono ja `schemaVersion` kokonaisluku 1–1000 (uudempi versio saa oman viestin kuten SR-23), sitten `decodeTradeShare` (koko- ja muotorajat). Virheellinen dokumentti näyttää saman "ei löytynyt" -tilan eikä kaada näkymää. Näkymä on sama React-tekstinä renderöity SharedTradeView ilman `dangerouslySetInnerHTML`:ia. Avattua linkkiä ei tallenneta mihinkään (kuten PRIVACY.md rivi 6b).
- [ ] **SR-54 Automaattinen päivitys.** Tieto "jaettu tällä laitteella" tallennetaan tilikohtaiseen avaimeen (`cyberdeck:u:{uid}:…`), ei globaaliin avaimeen, jotta toinen samalla laitteella kirjautuva käyttäjä ei ala jakaa kokoelmaansa huomaamattaan. Automaattinen päivitys tekee vain **updaten** (esim. `updateDoc` tai transaktio, joka lukee ensin) eikä koskaan luo dokumenttia. Jos dokumenttia ei ole (jakaminen lopetettu toisella laitteella), paikallinen tieto poistetaan eikä dokumenttia luoda uudelleen. Vain käyttäjän Jaa-painallus luo dokumentin. Viive on vähintään `PUBLIC_UPDATE_DELAY_MS`. Jos data ylittää rajan (`encodeTradeShare` palauttaa null), katkaistua dataa ei kirjoiteta, vaan näytetään virhe.
- [ ] **SR-55 Lopetus ja elinkaari.** Lopeta jakaminen poistaa dokumentin ja paikallisen tiedon. Epäonnistuminen näytetään eikä ohiteta hiljaa. Käyttöliittymä ei lupaa, että linkki lakkaa toimimasta pysyvästi, koska uusi jakaminen palauttaa saman linkin (K-T178-1). Uloskirjautuminen ei poista jakoa, mutta pysäyttää automaattisen päivityksen.
- [ ] **SR-56 Tilin poisto.** "Poista tilin tiedot" poistaa `tradeShares/{shareId}`:n ennen yksityisiä tietoja ja ennen kuin kirjautuminen päättyy, samassa järjestyksessä ja samalla virheenkäsittelyllä kuin julkiset pakat (SR-36). Jos poisto epäonnistuu, käyttäjälle kerrotaan, että linkki voi yhä toimia. Paikallinen jakotieto poistuu `eraseAccount`:lla. Testi fake-moduulilla: poisto kohdistuu oikeaan tunnukseen myös silloin, kun dokumenttia ei ole.
- [ ] **SR-57 Ilmoitus jakajalle.** Jaa-näkymässä linkin vieressä on teksti tyyliin "Linkin saaja näkee kokoelmasi, want-listasi ja vaihtoon merkityt kortit, myös myöhemmät muutokset, kunnes lopetat jakamisen." (fi/en, PM hyväksyy sanamuodon). Ero vanhaan linkkiin: vanha oli tilannekuva, uusi päivittyy ja on tallessa palvelimella.
- [ ] **SR-58 Ei uusia riippuvuuksia eikä CSP- tai hosting-muutoksia.** QR tehdään nykyisellä toteutuksella. Firestore ladataan vastaanottajalle laiskasti kuten julkisissa pakoissa. Konsoliin tai virheviesteihin ei kirjata uid:tä yhdessä tunnuksen kanssa.
- [ ] **SR-59 Deploy ja käsitestit (dev).** Säännöt deployataan deviin ennen testiin yhdistämistä ja tuotantoon ennen julkaisua, koska vanhoilla säännöillä jako ja tilin poisto epäonnistuvat. Käsitestit devissä: (1) jaa ja tarkista konsolista, että id on sama kuin selaimen laskema 16 merkkiä; (2) toisella Google-tilillä kirjoitus samaan id:hen hylätään; (3) kirjautumaton `get` toimii ja `list` hylätään; (4) kahdesta alle 10 s:n välein tehdystä päivityksestä jälkimmäinen hylätään; (5) ylimääräinen kenttä tai yli 16 000 merkin data hylätään; (6) jakaminen lopetetaan toisella laitteella, eikä ensimmäisen laitteen automaattinen päivitys luo dokumenttia uudelleen; (7) tilin poisto poistaa dokumentin.
- [ ] **SR-60 Tietosuoja.** PRIVACY.md luku 14 (rivi 23) päivitetään toteutuksen mukaiseksi, ja tietosuojaselosteeseen lisätään kappale: mitä linkki näyttää, että se päivittyy, että se säilyy kunnes jakaminen lopetetaan tai tilin tiedot poistetaan, ja ettei vastaanottajan tekemiä kopioita voi poistaa.

**Hyväksyttävät jäännösriskit (ehdotus):** poisto ja uusi luonti ohittavat 10 s:n rajan, mutta koskevat vain omaa dokumenttia ja kirjoituskustannus on pieni, kuten julkisissa pakoissa. Lukujen kiintiö on yhteinen (R-21). Linkin saaja voi tallentaa sisällön itse.

**Avoimet kysymykset käyttäjälle (PM:n kautta):**
- **K-T178-1:** Tunnus on pysyvä. Jos linkki leviää esimerkiksi julkiselle Discord-kanavalle, käyttäjä ei voi jakaa uudelleen niin, että vanha linkki lakkaisi toimimasta. Riittääkö MVP:ssä, että tämä kerrotaan (SR-55), vai tehdäänkö linkin vaihto (sukupolvilaskuri yksityiseen dokumenttiin, tietomallimuutos)? Digiturvan suositus: kerrotaan nyt, ja vaihto kirjataan `IDEAS.md`:hen.
- **K-T178-2:** Linkillä ei ole vanhenemisaikaa (Rajaukset), joten unohtunut jako on voimassa toistaiseksi. Hyväksytäänkö tämä, kun jako näkyy Jaa-näkymässä ja sen voi lopettaa?

## Luovutus (Digiturva, 2026-10-18)
Uhkamalli ja vaatimukset SR-50–SR-60 valmiit (SECURITY.md luku 21, PRIVACY.md luku 14 LUONNOS). Määrittelyn kohdat 2–4 tarkennettu (erotin `#`, tunnus säännöissä uid:stä, lopetuksen ja uudelleenjaon käytös). Seuraavaksi PM hyväksyy SR:t ja vie K-T178-1 ja K-T178-2 käyttäjälle. Toteutuksen jälkeen Digiturva katselmoi diffin ja säännöt.


## Luovutus (Koodari, 2026-10-18)
Haara `t-178-lyhyt-vaihtolinkki` (test-haarasta). Ei pushattu testiin, säännöt eivät ole deployattuina.

**Toteutus**
- Domain: `src/domain/tradeLink.ts` (tunnus SR-50, `parseTradeShareDoc` SR-53). Store: `firestoreTradeShares.ts`, muistitoteutus `createMemoryTradeShares`, laiska lataus `AccountServices.tradeShares?` (valinnainen, vanhat fake-palvelut toimivat).
- Säännöt: `match /tradeShares/{shareId}` SR-51/52 mukaan. SR-51:ssä käytetty suoraan regex-varavaihtoehtoa (muototarkistus `^[0-9a-f]{16}$` ensin), ei merkkijonoviipalointia. Staattiset sääntötestit lisätty.
- Reitti `#/v/<tunnus>` (`TradeLinkView`, tunnus tarkistetaan ennen pyyntöä, noindex). Vanha `#/vaihto/<data>` ennallaan.
- `ShareTradeButton`: kirjautuneena Jaa kirjoittaa dokumentin ja kopioi lyhyen linkin (+QR), Lopeta jakaminen poistaa. Automaattinen päivitys 15 s viiveellä, vain update (transaktio lukee ensin), ei koskaan luo. Puuttuva dokumentti pudottaa paikallisen merkinnän. Merkintä `cyberdeck:u:{uid}:trade-shared` (PreferencesRepository.loadTradeShared/saveTradeShared) poistuu `eraseAccount`:lla. Kirjautumaton: vanha linkki ja vihje (vain jos kirjautuminen on käytössä).
- Tilin poisto: `tradeShares.remove()` julkisten pakkojen jälkeen ja ennen yksityisiä tietoja (SR-56). Epäonnistumisteksti `accountDeleteFailedCloud` kertoo nyt, että jaettu linkki voi yhä toimia.
- PRIVACY.md luku 14 päivitetty toteutuksen mukaiseksi ja selosteteksti-ehdotus lisätty (SR-60). Kirjautumisdialogin tekstiä ei muutettu.

**Huomioita**
- Automaattinen päivitys toimii vain, kun Have/Want-sivu on auki. Jos kokoelmaa muutetaan muualla, linkki päivittyy seuraavalla Have/Want-käynnillä (tarkistus lukee dokumentin ja kirjoittaa vain, jos sisältö eroaa).
- Uusi Jaa-painallus samalla sisällöllä alle 20 s kirjoituksesta vain kopioi (sääntöjen 10 s:n raja).
- Uudet käyttäjälle näkyvät tekstit PM:n hyväksyttäväksi: tradeShortWarningList (Have/want-listavariantti SR-57:stä), tradeLinkNewer, tradeLinkError, tradeLinkLoading, tradeSharingStopped, tradeIntroShort ja lisälause accountDeleteFailedCloud. SR-57:n sanamuoto (tradeShortWarning) on kortin mukainen.
- Ei uusia riippuvuuksia eikä CSP- tai hosting-muutoksia.

**Ei tehty:** SR-59 (dev-käsitestit) vaatii sääntöjen deployn deviin. Emulaattoritestejä ei ole, joten säännöt on katettu vain staattisesti.

Koodikatselmointi: tehty · Pakollisia korjattu 1 (lint: setState effectissä TradeLinkViewissä, tila johdetaan ja näkymä avainnetaan id:llä) · Suosituksia 2 (velaksi: firestoreTradeShares ja lazy-kääre toistavat firestorePublicDecksin sdk/readSession-koodin, yhteinen apufunktio; ShareTradeButtonin päivityslogiikka omaan hookiin).
Testit: npm test läpi, lint ja build läpi.

Seuraavaksi: PM tarkistaa tekstit, sitten Digiturva katselmoi diffin ja säännöt, säännöt deviin ja SR-59-käsitestit.

## Digiturva · Katselmointi (2026-10-18)
Raportti `reports/SEC-178-lyhyt-vaihtolinkki.md`. SR-50–SR-54 ja SR-56–SR-58 sekä SR-60 täyttyvät. SR-55 täyttyy osittain (SEC-178-2), ja SR-59 on avoin (dev-käsitestit). Löydökset: Low 2 (SEC-178-1: lähteen vaihto oma lista -> kokoelma julkaisee automaattisesti koko kokoelman; SEC-178-2: uudelleenjaon käytöstä ei kerrota), Info 3 (SEC-178-3 uudemman version ylikirjoitus, SEC-178-4 IDEAS.md-merkintä puuttuu, SEC-178-5 säännöt testattu vain staattisesti). Ei vetoa: saa mennä deviin. Done edellyttää SR-59:n käsitestejä 1–7 devissä.
