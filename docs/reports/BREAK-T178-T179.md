# BREAK-T178-T179: rikkomistestaus (lyhyt vaihtolinkki ja kansiosivun skannaus)

Tehtävä T-180. Testattu 2026-10-19:
- dev-palvelin (Vite, StrictMode, test-haara `4dd969b`) headless Chromella CDP:n kautta (valekamera ja `DOM.setFileInputFiles`),
- tuotanto https://cyberdeck-tcg.web.app kirjautumattomana (vain lyhyen linkin vastaanotto, vanha pitkä linkki ja offline).

Skriptit ja kuvat ovat scratchpadissa (`break/`), eivät repossa. Sovelluskoodia ei muutettu. Google-kirjautumista ei voi tehdä, joten kirjautuneen polut (jakaminen, lopetus, automaattinen päivitys, tilin poisto) on arvioitu koodista ja yksikkötesteistä (65/65 läpi: TradeLink, ShareTradeButton, tradeShares, binderPage, CardScanner.binder). Ne on merkitty "ei testattu selaimessa".

## Yhteenveto
Löydöksiä 10: keskitason 3, matalan 7, lisäksi 4 huomiota. Kaatumisia, konsolivirheitä tai vaakaylivuotoa ei löytynyt. Lyhyen linkin vastaanotto kestää kaiken vihamielisen syötteen ilman verkkopyyntöä. Kansiosivun riskit liittyvät siihen, mitä yksi painallus lisää kokoelmaan, ja Kumoa-toiminnon menettämiseen.

**Kokonaisarvio: Kestää** (ei vetoa). BRK-01–BRK-03 kannattaa korjata ennen kuin käyttäjiä kutsutaan.

## Löydökset

### BRK-01 Keskitaso: tuplaklikkaus "Lisää kokoelmaan" sulkee skannerin, eikä lisäystä voi enää kumota
- **Persoona:** Pertti Painaja · **Tyyppi:** Rikkoutuminen / tietojen menetys (Kumoa katoaa) · **Toistuvuus:** aina (1280 px ja 320 px)
- **Toisto:** Kansiosivu, Valitse kuva (3×3-sivu), Tunnista kortit ja tuplaklikkaa **Lisää kokoelmaan (8 korttia)**.
- **Havaittu:** ensimmäinen klikkaus lisää 8 korttia, ja näkymä vaihtuu lyhyeen "Lisätty 8 korttia" -näkymään, joten dialogi kutistuu. Toinen klikkaus osuu kohtaan, jossa on nyt dialogin tausta. `CardScanner`in `<dialog onClick>` sulkee dialogin, kun klikataan taustaa (`event.target === event.currentTarget`). Kortit jäävät kokoelmaan, eikä Kumoa-painiketta ole enää missään.
- **Odotettu:** lisäys tapahtuu kerran, ja Kumoa jää näkyviin.
- **Ehdotus:** älä sulje dialogia taustaklikkauksella skannerin tulos- ja "Lisätty"-vaiheissa (tai ollenkaan, kun `stage === 'binder'`). Vaihtoehtoisesti pidä painikkeet samalla paikalla, esimerkiksi niin, että "Lisätty"-tila näytetään tulosruudukon yläpuolella eikä ruudukko katoa.

### BRK-02 Keskitaso: "Tarkista"-taskut lisätään oletuksena, joten väärä kuva tuo yhdellä painalluksella monta väärää korttia
- **Persoona:** Eila Eksyjä, Pertti Painaja · **Tyyppi:** Tietojen eheys (väärät kortit kokoelmaan) · **Toistuvuus:** aina
- **Toisto:**
  (a) 3×4-sivun kuva 3×3-tilassa,
  (b) 3×3-sivun kuva 3×4-tilassa tai
  (c) 3×3-sivu vaakakuvana (90° käännetty).
- **Havaittu:** (a) 3 Varma (oikein) ja 5 Tarkista (väärin), painikkeessa "Lisää kokoelmaan (8 korttia)". (b) 3 Varma ja 7 Tarkista, joista suurin osa väärin, painikkeessa "(10 korttia)". (c) 8 Tarkista, kaikki väärin, painikkeessa "(8 korttia)". `BinderPageFlow` valitsee `check`-tilaan valmiiksi `options[0]`:n (`chosen: known ? options[0] : null`), ja se lasketaan lisättäviin. Jatkuvassa tilassa epävarma osuma on vain ehdotus, joka pitää napauttaa (`isConfident` ennen `autoAdd`ia), joten tilat käyttäytyvät eri tavoin. Tunnistus kestää lisäksi 19–27 s, kun oikealla kuvalla se kestää 0,5 s.
- **Odotettu:** epävarmaa korttia ei lisätä ilman vahvistusta, tai käyttäjälle kerrotaan selvästi, että se lisätään.
- **Ehdotus:** Tarkista-taskut eivät ole oletuksena mukana. Painikkeessa lukisi esimerkiksi "Lisää 3 varmaa", ja Tarkista-solun napautus vahvistaa ehdotuksen. Vaihtoehtona painikkeen viereen teksti "5 taskua tarkistamatta". Lisäksi varoitus, jos valitun kuvan tai rajauksen kuvasuhde poikkeaa paljon ruudukon kuvasuhteesta ("Kuva näyttää 3×4-sivulta"), ja mahdollisesti Käännä 90° -painike rajausvaiheeseen.

### BRK-03 Keskitaso: "Valitse kuva" ei ole käytettävissä ilman kameraa
- **Persoona:** Mikko Mobiili, Eila Eksyjä · **Tyyppi:** Ydinpolku estyy · **Toistuvuus:** aina
- **Toisto:** estä kameran käyttö tai käytä tietokonetta ilman kameraa. Valitse Skannaa, Kansiosivu ja Skannaa Retail. (Selaimessa `getUserMedia` korvattiin `NotAllowedError`-virheellä.)
- **Havaittu:** näkyviin tulee "Kameran käyttö estettiin…", Yritä uudelleen ja Sulje. Tiedostovalinta on vain kameravaiheessa (`stage === 'camera'`), joten puhelimella otettua tai galleriasta valittua kuvaa ei voi käyttää. Juuri tätä varten Valitse kuva tehtiin (määrittelyn kohta 3).
- **Odotettu:** kansiosivutilassa kuvan voi valita, vaikka kamera ei ole käytettävissä.
- **Ehdotus:** näytä Valitse kuva myös virhevaiheessa, kun tila on `binder`. Vielä parempi on, ettei kamerakuvaa vaadita ennen tiedostovalintaa (esimerkiksi niin, että Valitse kuva on jo tilan valintavaiheessa).

### BRK-04 Matala: tiedostovalinnalla ei ole saavutettavaa nimeä
- **Persoona:** ruudunlukijan käyttäjä · **Tyyppi:** Saavutettavuus · **Toistuvuus:** aina
- **Toisto:** avaa kansiosivun kameravaihe ja lue saavutettavuuspuu (CDP `Accessibility.getFullAXTree`).
- **Havaittu:** järjestyksessä `button: Vaihda`, `button: OTA KUVA`, `button: ` (nimetön) ja `button: SULJE`. Nimetön painike on piilotettu `<input type="file">`. Sen `<label>`issa on `aria-hidden="true"`, joten nimi jää tyhjäksi. Näppäimistöllä kohdistus näkyy oikein (label saa ääriviivan).
- **Ehdotus:** poista `aria-hidden` labelista tai anna inputille `aria-label={scannerTexts.chooseImage}`.

### BRK-05 Matala: kohdistus katoaa Lisää kokoelmaan- ja Kumoa-painalluksen jälkeen
- **Persoona:** näppäimistö- ja ruudunlukijakäyttäjä · **Tyyppi:** Eksyminen · **Toistuvuus:** aina
- **Havaittu:** "Lisää kokoelmaan" -painalluksen jälkeen `document.activeElement` on BODY, koska painike poistuu. Sama tapahtuu Kumoa-painalluksen jälkeen, kun näkymä palaa tulosruudukkoon. Tila ilmoitetaan `role=status`-alueella, mutta seuraava Tab alkaa sivun alusta, dialogin ulkopuolelta.
- **Ehdotus:** siirrä kohdistus Kumoa-painikkeeseen (tai "Lisätty"-tekstiin, jolla on `tabIndex=-1`) ja Kumoa-painalluksen jälkeen Lisää-painikkeeseen.

### BRK-06 Matala (ei testattu selaimessa): Jaa Have/Want epäonnistuu, jos sisältö muuttui ja edellisestä jaosta on alle 10 s
- **Persoona:** Pertti Painaja · **Tyyppi:** Rikkoutuminen (näennäinen) · **Toistuvuus:** aina sääntöjen mukaan (koodista päätelty)
- **Toisto:** kirjautuneena paina Jaa, muuta jotain Have/Want-sivulla (esimerkiksi vaihtosääntöä) ja paina Jaa uudelleen alle 10 sekunnin kuluessa.
- **Havaittu (koodi):** `share()` ohittaa kirjoituksen vain, jos sisältö on sama (`RECENT_WRITE_MS`). Muuttunut sisältö kutsuu `publish` (`setDoc`), joka olemassa olevaan dokumenttiin on update. Sääntö vaatii, että edellisestä päivityksestä on yli 10 s (`request.time > updatedAt + 10s`), joten kirjoitus hylätään ja käyttäjä näkee viestin "Jakaminen ei onnistunut. Yritä uudelleen." Linkkiä ei kopioida. Muistitoteutus ei emuloi sääntöä, joten yksikkötestit eivät huomaa tätä. Sama tapahtuu, jos automaattinen päivitys on juuri kirjoittanut.
- **Odotettu:** määrittelyn mukaan "linkki päivitetään seuraavalla Jaa-painalluksella".
- **Ehdotus:** kopioi linkki joka tapauksessa (tunnus on tiedossa) ja ajasta kirjoitus 10 s:n rajan jälkeen. Vaihtoehtona virheen sijaan teksti "Linkki kopioitu, sisältö päivittyy hetken päästä".

### BRK-07 Matala: lyhyt linkki isoilla kirjaimilla tai perässä olevalla merkillä näyttää "Linkkiä ei löytynyt"
- **Persoona:** Eila Eksyjä · **Tyyppi:** Eksyminen · **Toistuvuus:** aina
- **Toisto:** avaa `#/v/0123456789ABCDEF`, `#/v/<id>/`, `#/v/<id>.`, `#/v/<id>)`, `#/v/<id>%20` tai `#/v/<id>?x=1`.
- **Havaittu:** kaikki näyttävät tekstin "Linkkiä ei löytynyt. Jakaja on ehkä lopettanut jakamisen." Viesti ohjaa syyttämään jakajaa, vaikka vika on linkin kopioinnissa (pikaviestimet ja sähköposti lisäävät välimerkkejä, ja jotkin muuttavat kirjainkokoa). `#/V/<id>` vie Kortit-sivulle.
- **Ehdotus:** normalisoi ennen muototarkistusta niin, että tunnus muutetaan pieniksi kirjaimiksi ja perästä poistetaan yksi `/`. Tiukka `^[0-9a-f]{16}$` säilyy sen jälkeen (SR-53). Väärän muotoisen tunnuksen viesti voisi olla eri: "Linkki on vajaa tai virheellinen. Pyydä lähettäjältä linkki uudelleen."

### BRK-08 Matala: hyvin pieni tai äärimmäisen muotoinen kuva hyväksytään, ja tuloksena on vain tyhjiä taskuja
- **Persoona:** Ilkka Ilkeä · **Tyyppi:** Eksyminen · **Toistuvuus:** aina
- **Toisto:** Valitse kuva: 1×1 px PNG, 8×8 px PNG tai 30000×3 px PNG.
- **Havaittu:** kaikki menevät rajausvaiheeseen. 30000×3 skaalautuu kokoon 2400×1, jolloin rajauseditorin korkeus on 0 px ja kulmat ovat päällekkäin. Tunnistuksen tulos on 9/9 "Tyhjä" ja "Lisää kokoelmaan (0 korttia)" ilman selitystä. Ei kaatumista eikä konsolivirheitä.
- **Ehdotus:** hylkää kuva, jonka lyhyempi sivu on alle esimerkiksi 300 px, viestillä "Kuva on liian pieni." (fi/en).

### BRK-09 Matala: tuplaklikkaus Kumoa-painikkeeseen avaa taskun muokkaimen
- **Persoona:** Pertti Painaja · **Tyyppi:** Hämmennys · **Toistuvuus:** aina (1280 px)
- **Havaittu:** Kumoa toimii kerran (8 → 0, ei negatiivisia määriä). Näkymä palaa tulosruudukkoon, ja toinen klikkaus osuu Tasku 4 -soluun, joten sen muokkain aukeaa ja kohdistus siirtyy sinne.
- **Ehdotus:** sama kuin BRK-01, eli painikkeet pysyvät samassa kohdassa vaiheesta toiseen. Kevyempi vaihtoehto on ohittaa klikkaukset hetken (noin 300 ms) näkymän vaihdon jälkeen.

### BRK-10 Matala: "Lisää kokoelmaan (0 korttia)" on käytettävissä
- **Toisto:** tyhjä sivu tai läpinäkyvä PNG.
- **Havaittu:** painike on aktiivinen, ja painallus näyttää ohjeen "Yhtään korttia ei ole lisättävänä…". Toimii, mutta painike lupaa toimintoa, jota ei ole.
- **Ehdotus:** painike pois käytöstä, kun N = 0, ja ohje näkyy painikkeen vieressä valmiiksi.

## Huomiot (ei korjausta vaadita)
- **H-1:** Firestore Lite kirjoittaa verkkovirheessä konsoliin pyynnön, jossa on tunnus (`tradeShares/<id>`). Uid:tä ei kirjoiteta, joten SR-58 täyttyy. Mainitaan, koska tukipyyntöjen kuvakaappauksissa tunnus voi näkyä.
- **H-2:** sivun otsikko on aina "Kortit · Cyberdeck", myös lyhyen ja pitkän vaihtolinkin sivulla. Ominaisuus on vanha, mutta vaihtolinkin välilehti näyttää harhaanjohtavalta.
- **H-3:** sovelluksessa ei ole offline-tukea (ei service workeria), joten kylmä käynnistys ilman verkkoa näyttää selaimen virhesivun. Tämäkin on vanha ominaisuus.
- **H-4:** kansiosivun tunnistus kestää 19–27 s, kun kuva ei vastaa ruudukkoa (siirto- ja kiertohaku jokaiselle epävarmalle solulle). Edistyminen näkyy ja Keskeytä toimii, joten korjausta ei tarvita, jos BRK-02 korjataan.

## Testattu ilman löydöstä
**T-178, vastaanotto (dev ja tuotanto):**
- Kaikki seuraavat näyttävät tekstin "Linkki ei toimi / Linkkiä ei löytynyt…" ilman Firestore-pyyntöä (resurssiajoitusten mukaan): `#/v/`, `#/v`, `xyz`, 15 ja 17 merkkiä, 5000 merkkiä, `..`, `%2e%2e%2ftradeShares`, `../../etc/passwd`, `a/b`, `<script>`, `"><img onerror>`, täysleveät numerot, emojit, nollaleveä merkki ja `%ZZ`.
- Oikean muotoinen olematon tunnus tekee tuotannossa yhden `batchGet`-pyynnön ja näyttää "ei löytynyt".
- Kohdistus siirtyy otsikkoon, `noindex, nofollow` on asetettu, `role=alert` toimii, eikä 320 px:ssä (vaalea ja tumma) ole ylivuotoa.
- Vanha pitkä `#/vaihto/<data>` toimii tuotannossa (sovelluksen omalla kooderilla tehty linkki, 320 px). Rikkinäinen tai `%%%`-muotoinen data näyttää oman virheensä.
- Offline sovelluksen latauksen jälkeen: "Linkin lataus ei onnistunut…" ja Yritä uudelleen. Uusi yritys verkon ollessa yhä poissa näyttää saman viestin. Kun verkko palaa, uusi yritys näyttää "ei löytynyt".
- Hidas verkko (latenssi 4 s): "Ladataan linkkiä." näkyy, ja sen jälkeen tulee oikea tila. Nopea vaihto kahden tunnuksen välillä latauksen aikana näyttää viimeisimmän tilan.

**T-178, kirjautunut (ei testattu selaimessa, koodi ja yksikkötestit):**
- Tunnus lasketaan uid:stä, ja muoto tarkistetaan ennen `doc()`-kutsua.
- Automaattinen päivitys tekee vain updaten eikä luo dokumenttia. Uudempaa versiota ei ylikirjoiteta. Lähteen vaihto ei julkaise mitään.
- Lopetuksen epäonnistuminen näytetään. Tilin poisto poistaa jaon ennen yksityisiä tietoja.
- Näkymä avainnetaan uid:llä, joten toisen tilin merkintä ei vuoda.
- Sääntöjen REST-kokeilut (`list` tuotannossa ja kirjautumaton kirjoitus deviin) estettiin työkalun luvissa, joten niitä ei tehty. Säännöt on tarkistettu lukemalla.

**T-179:**
- Tavallinen 3×3-sivu: 8/8 Varma ja oikein, tyhjä tasku tunnistettu, 0,5 s. 3×4 3×4-tilassa 320 px:ssä: 10 Varma ja 1 Tarkista (oikein), 3,9 s.
- Saman kortin 9 kopiota: kaikki Varma, kokoelmaan 9 kappaletta, ja Kumoa vie määrän nollaan.
- Täysin tyhjä sivu ja läpinäkyvä PNG: kaikki taskut tyhjiä.
- 12000×16000 px PNG: luettu 1 s:ssa ja skaalattu 1800×2400:aan, ei jäätymistä.
- Hylätään viestillä "Kuvaa ei voitu lukea": tekstiä .jpg-päätteellä, 0 tavua, 26 Mt ja SVG, jossa on `<script>`.
- Nopea sarja Lisää, Kumoa, Lisää, Kumoa, Lisää, Kumoa (120 ms välein): määrät 8/0/8/0/8/0, ei kaksoislisäyksiä eikä negatiivisia määriä.
- Dialogin sulkeminen (Escape) kesken hitaan tunnistuksen: ei lisäyksiä, ei tulosruudukkoa jälkikäteen, sivu reagoi heti. Uudelleen avattaessa skanneri alkaa tilan valinnasta.
- Rajauseditorin kulmat:
  - Saavutettavat nimet: Vasen yläkulma, Oikea yläkulma, Vasen alakulma ja Oikea alakulma.
  - Nuolinäppäimet siirtävät kulmaa 1 %.
  - Shift+nuoli 40 kertaa pysähtyy minimileveyteen (2 %), eivätkä kulmat mene ristiin.
- Ei vaakaylivuotoa dialogissa eikä sivulla 320 px:ssä tai 1280 px:ssä (rajaus ja tulokset). Ei konsolivirheitä missään ajossa.

## Ei testattu
- Oikea kamera ja kosketus (vain valekamera ja hiiritapahtumat).
- iOS Safari ja HEIC-kuvat.
- Kirjautuneen jakamisen polut selaimessa.
- Firestore-sääntöjen ajonaikaiset kokeilut.
- Kahden välilehden kilpailutilanne lyhyen linkin päivityksessä.
