# CONTENT · cyberdeck

> Omistaja: Sisällöntuottaja. Versio 0.2 · 2026-10-01 (0.1: T-001, MVP-0 · 0.2: T-010 haku ja suodatus, sanasto K6–K8).
> Kohderyhmä, kielitaso, äänensävy, sanasto, sisältöjen sijainti ja oikeudet. Mikrokopion rakenne ja tilakohtaiset tekstit ovat `docs/UX.md`:n luvuissa 2 ja 4.5. Tämä tiedosto määrää sanaston ja kielen.

---

## 1. Kohderyhmä ja kielitaso

- **Kuka:** aloitteleva Cyberpunk TCG -pelaaja (käyttäjä itse) ja hänen pelikaverinsa (PROJECT.md). Aikuisia tai nuoria aikuisia, jotka tuntevat pelin perusasiat mutta eivät välttämättä kaikkia sääntötermejä.
- **Missä:** usein puhelimella pelipöydän ääressä (UX.md 1). Tekstin pitää aueta yhdellä silmäyksellä.
- **Kielitaso:** selkeä yleiskieli. Lyhyet päälauseet, yksi asia per lause, ei teknistä jargonia (ei "rajapinta", "API", "HTTP", "palvelin" käyttäjälle näkyvässä tekstissä). Selkokieltä ei tarvita, mutta sen periaatteet (tuttu sana, lyhyt lause, aktiivi) ovat hyvä oletus.

## 2. Äänensävy

- Suomi, sinuttelu, asiallinen ja ystävällinen. Ei huutomerkkejä, ei leikkisyyttä virheissä.
- Painike on verbi, joka kertoo, mitä tapahtuu ("Yritä uudelleen").
- Virhe ja varoitus: **mitä tapahtui** + **mitä voit tehdä**. Ei syyllistetä käyttäjää.
- Teksti ei lupaa sitä, mitä toiminto ei tee (esim. "Yritä uudelleen" ei saa luvata kaikkia kortteja, jos uusi haku ei todennäköisesti auta).
- Cyberpunk-henki näkyy ulkoasussa, ei tekstien slangissa (UX.md luku 1, kohta 7).

## 3. Kirjoitusohjeet

- **Lukumäärät:** numeroina ja taivutettuina: "1 kortti", "2 korttia", "0 korttia". Yli 999: välilyönti tuhaterottimena (`Intl.NumberFormat('fi-FI')`): "1 024 korttia".
- **Osuus:** "120 / 151 korttia" (välilyönnit kauttaviivan ympärillä). Vältetään lukusanojen taivutusta ("151:stä"). Osuusmuodossa "korttia" ei taivu luvun mukaan: "1 / 151 korttia" (UX.md 5.6).
- **Puuttuva arvo:** ajatusviiva "–" (U+2013), ruudunlukijalle piilotettu sanallinen vastine ("ei hintaa").
- **Kolme pistettä:** yksi merkki "…" (U+2026), esim. "Haetaan kortteja…".
- **Sivun otsikko (title):** "Näkymä · Cyberdeck", välissä keskipiste (U+00B7) välilyöntien kanssa.
- **Vieraskieliset nimet:** korttien nimet ja korttityypit näytetään englanniksi sellaisinaan, `lang="en"`.
- **Taivutus vierasperäisissä nimissä:** jos taivutettu muoto näyttää toiselta nimeltä tai on vaikea lukea, rakenne muutetaan niin, että nimi jää perusmuotoon (esim. "WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole…", ei "WeirdCon"). Verkkotunnukset taivutetaan kaksoispisteellä: "Netdeck.gg:n".
- **Ei "klikkaa tästä" -linkkejä.** Linkkiteksti kertoo kohteen.

## 4. Sanasto

Yksi käsite = yksi termi. Uusi termi lisätään tähän heti, kun sitä käytetään.

| Termi (käyttöliittymässä) | Merkitys | Lähde / rajapinta | Huom. |
|---|---|---|---|
| **Cyberdeck** | Sovelluksen nimi | – | Ei taivuteta tarpeettomasti. Ei sisällä tavaramerkkiä "Cyberpunk" (SECURITY.md 7). |
| **kortti** | Yksi Cyberpunk TCG:n kortti (korttitaso, ei painos) | `slug`, `id` | Painokset (alt-art ym.) ovat MVP-1:n kysymys K5. |
| **Kortit** | Näkymän otsikko: kaikki pelin kortit | – | MVP-1:ssä erotetaan "kokoelma" (omat kortit) ja "pakat". |
| **nimi** | Kortin nimi ja mahdollinen alaotsikko | `name`, `subname` | Näytetään englanniksi. Ruudunlukija: "V, Streetkid". |
| **alaotsikko** | Nimen alla oleva tarkenne, joka erottaa saman hahmon kortit toisistaan (esim. Johnny Silverhand: Rocking Renegade) | `subname` | Hakukentän ohjeessa (T-010). Ei "alanimi" eikä "tarkenne". |
| **tyyppi** | Korttityyppi | `card_type` | Arvot englanniksi, katso alla. Suodattimen otsikko (legend) "Tyyppi". |
| **väri** | Kortin väri | `color` | Arvot **suomeksi** (K6, PM hyväksyi 2026-10-01), katso alla. Suodattimen otsikko (legend) "Väri". Väri näytetään aina tekstinä, värinäyte on vain koriste. |
| **Tyyppi ja väri** | Korttitaulukon sarakeotsikko: tyyppi ja sen alla väri | `card_type`, `color` | K8 (PM 2026-10-01). Ruudunlukija lukee solun "Unit, Punainen". Ei erillistä Väri-saraketta. |
| **hinta** | Kortin pelaamisen hinta pelin sisäisessä valuutassa (eddiet, €$) | `cost` | **Ei rahallinen arvo.** Sarakeotsikko "Hinta", puuttuva arvo "ei hintaa". Kaikilla Legendeillä ei ole hintaa, mutta osalla on (Go Solo). Ei käytetä "€"-merkkiä otsikossa (sekoittuu euroon). Päätös K1, katso TXT-001. |
| **Legend** | Korttityyppi: legenda | `card_type` | Englanniksi kuten fyysisissä korteissa (K2). |
| **Unit** | Korttityyppi: yksikkö | `card_type` | " |
| **Gear** | Korttityyppi: varuste | `card_type` | " |
| **Program** | Korttityyppi: ohjelma | `card_type` | " |
| **Punainen** | Väri | `color: "Red"` | Suomeksi (K6). Värejä ei ole painettu kortteihin sanoina, toisin kuin tyypit. Pieni alkukirjain juoksevassa tekstissä ("punainen Unit"). |
| **Keltainen** | Väri | `color: "Yellow"` | " |
| **Vihreä** | Väri | `color: "Green"` | " |
| **Sininen** | Väri | `color: "Blue"` | " |
| (tuntematon väri) | Rajapinnan uusi arvo | `color` | Näytetään sellaisenaan englanniksi (`lang="en"`). Puuttuva väri: "–" ja ruudunlukijalle "ei väriä". |
| **korttitiedot** | Korttien tiedot (nimi, tyyppi, hinta) ulkoisesta lähteestä | – | Käyttäjälle ei sanota "rajapinta" eikä "tietokanta". |
| **hakea / haku** (1) | Korttitietojen lataaminen lähteestä | – | "Haetaan kortteja…", "Korttien haku epäonnistui". Ei "ladata" ja "hakea" sekaisin samassa tilassa (poikkeus: live-alueen "ladattu", UX.md 4.5). |
| **hakea / haku** (2) | Kortin etsiminen listasta nimellä tai alaotsikolla | – | K7 (PM 2026-10-01): label "Hae nimellä", maamerkki "Hae ja suodata kortteja", painike "Tyhjennä haku ja suodattimet". Kenttään kirjoitettu teksti on **hakusana**. Merkitykset eivät näy samaan aikaan, koska hakukenttä on piilossa lataus- ja virhetilassa (UX.md 5.8). Uudessa tekstissä merkitys (1) kirjoitetaan aina muotoon "korttien haku" tai "haetaan kortteja" ja merkitys (2) muotoon "haku" tai "hakusana" vain hakukentän yhteydessä. |
| **suodattaa / suodatin** | Listan rajaaminen tyypin tai värin mukaan | – | "Hae ja suodata kortteja", "poista valintoja suodattimista". Ei "filtteri". |
| **valinta** | Suodattimessa valittu vaihtoehto (valintaruutu) | – | "Valitse yksi tai useampi", "poista valintoja". |
| **hakua vastaavat kortit** | Tulos, kun hakusana tai valinta on käytössä | – | Taulukon kuvateksti "Hakua vastaavat kortit" ja tyhjä tila "Hakua vastaavia kortteja ei löytynyt." (TXT-008). Tässä "haku" kattaa hakusanan ja valinnat, kuten maamerkki "Hae ja suodata kortteja". |
| **Yritä uudelleen** | Painike, joka hakee kaikki kortit alusta | – | Aina sama teksti. |

Suomenkieliset vastineet (legenda, yksikkö, varuste, ohjelma) ovat tässä vain selitykseksi. Käyttöliittymässä käytetään englanninkielisiä tyyppejä, kunnes käyttäjä päättää toisin (K2). Värit sen sijaan ovat suomeksi (K6). K6–K8 ovat tekstivalintoja, jotka käyttäjä voi muuttaa myöhemmin (T-010:n kortti, PM:n checkpoint 2026-10-01).

## 5. Sisältöjen sijainti

| Sisältö | Sijainti | Kuka muokkaa |
|---|---|---|
| Käyttöliittymätekstit (myös värien nimet `colorNames`) | `src/ui/texts.ts` | Koodari Sisällöntuottajan raportin (TXT-*) perusteella, tai Sisällöntuottaja, jos PM osoittaa tiedoston kortissa |
| Sivun otsikko ja kieli | `index.html` (`<title>`, `lang="fi"`) | Koodari |
| Korttien nimet, tyypit ja hinnat | Netdeck.gg:n rajapinta ajonaikaisesti, ei tallenneta repoon | – |
| Tilakohtaiset tekstit (määrittely) | `docs/UX.md` 4.5 ja 5.6 | UX Designer, kieli Sisällöntuottaja |

## 6. Sisältöjen oikeudet ja lähteet

| Aineisto | Lähde | Käyttö | Peruste |
|---|---|---|---|
| Korttitiedot (nimi, alaotsikko, tyyppi, hinta) | Netdeck.gg:n julkinen rajapinta `api.netdeck.gg` | Haetaan käyttäjän selaimessa, ei tallenneta eikä kopioida | D-006 (käyttäjä hyväksyi riskin R-2). Netdeck.gg:n käyttöehtoja ei löytynyt (SECURITY.md 7). |
| Korttikuvat | – | **Ei käytetä** | R-1, D-006: käyttäjä tuo kuvat myöhemmin, kun käyttöoikeus on selvä. |
| Pelin nimi "Cyberpunk TCG" ja tavaramerkit | WeirdCo / CD PROJEKT RED | Vain kuvailevassa merkityksessä tekstinä, ei logoja | SECURITY.md 7. Ei kaupallisuutta. |
| Epävirallisuusmerkintä ja lähdemaininta | Oma teksti | Sivun alatunniste | SECURITY.md 7, TXT-001. Tarkistettava: vaatiiko CD PROJEKT RED:n Fan Content Guidelines englanninkielisen merkinnän tälle sovellukselle. |

Lähteet: `docs/UX.md` 5.2 (värien arvot: Red 38, Yellow 37, Green 38, Blue 38, tarkistettu 2026-10-01), `docs/SECURITY.md` luku 7 (tarkistettu 2026-09-30), `docs/DECISIONS.md` D-006, Netdeck.gg:n rajapinnan vastaus 2026-10-01 (151 korttia, tyypit Legend 27, Unit 73, Gear 17, Program 34; sääntöteksteissä "Pay this Legend's cost", "costs -1 €$").
