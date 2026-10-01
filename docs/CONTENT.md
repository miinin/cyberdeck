# CONTENT · cyberdeck

> Omistaja: Sisällöntuottaja. Versio 0.1 · 2026-10-01 (T-001, MVP-0).
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
- **Osuus:** "120 / 151 korttia" (välilyönnit kauttaviivan ympärillä). Vältetään lukusanojen taivutusta ("151:stä").
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
| **tyyppi** | Korttityyppi | `card_type` | Arvot englanniksi, katso alla. |
| **hinta** | Kortin pelaamisen hinta pelin sisäisessä valuutassa (eddiet, €$) | `cost` | **Ei rahallinen arvo.** Sarakeotsikko "Hinta", puuttuva arvo "ei hintaa". Kaikilla Legendeillä ei ole hintaa, mutta osalla on (Go Solo). Ei käytetä "€"-merkkiä otsikossa (sekoittuu euroon). Päätös K1, katso TXT-001. |
| **Legend** | Korttityyppi: legenda | `card_type` | Englanniksi kuten fyysisissä korteissa (K2). |
| **Unit** | Korttityyppi: yksikkö | `card_type` | " |
| **Gear** | Korttityyppi: varuste | `card_type` | " |
| **Program** | Korttityyppi: ohjelma | `card_type` | " |
| **korttitiedot** | Korttien tiedot (nimi, tyyppi, hinta) ulkoisesta lähteestä | – | Käyttäjälle ei sanota "rajapinta" eikä "tietokanta". |
| **hakea / haku** | Korttitietojen lataaminen lähteestä | – | "Haetaan kortteja…", "Korttien haku epäonnistui". Ei "ladata" ja "hakea" sekaisin samassa tilassa (poikkeus: live-alueen "ladattu", UX.md 4.5). |
| **Yritä uudelleen** | Painike, joka hakee kaikki kortit alusta | – | Aina sama teksti. |

Suomenkieliset vastineet (legenda, yksikkö, varuste, ohjelma) ovat tässä vain selitykseksi. Käyttöliittymässä käytetään englanninkielisiä tyyppejä, kunnes käyttäjä päättää toisin (K2).

## 5. Sisältöjen sijainti

| Sisältö | Sijainti | Kuka muokkaa |
|---|---|---|
| Käyttöliittymätekstit | `src/ui/texts.ts` | Koodari Sisällöntuottajan raportin (TXT-*) perusteella, tai Sisällöntuottaja, jos PM osoittaa tiedoston kortissa |
| Sivun otsikko ja kieli | `index.html` (`<title>`, `lang="fi"`) | Koodari |
| Korttien nimet, tyypit ja hinnat | Netdeck.gg:n rajapinta ajonaikaisesti, ei tallenneta repoon | – |
| Tilakohtaiset tekstit (määrittely) | `docs/UX.md` 4.5 | UX Designer, kieli Sisällöntuottaja |

## 6. Sisältöjen oikeudet ja lähteet

| Aineisto | Lähde | Käyttö | Peruste |
|---|---|---|---|
| Korttitiedot (nimi, alaotsikko, tyyppi, hinta) | Netdeck.gg:n julkinen rajapinta `api.netdeck.gg` | Haetaan käyttäjän selaimessa, ei tallenneta eikä kopioida | D-006 (käyttäjä hyväksyi riskin R-2). Netdeck.gg:n käyttöehtoja ei löytynyt (SECURITY.md 7). |
| Korttikuvat | – | **Ei käytetä** | R-1, D-006: käyttäjä tuo kuvat myöhemmin, kun käyttöoikeus on selvä. |
| Pelin nimi "Cyberpunk TCG" ja tavaramerkit | WeirdCo / CD PROJEKT RED | Vain kuvailevassa merkityksessä tekstinä, ei logoja | SECURITY.md 7. Ei kaupallisuutta. |
| Epävirallisuusmerkintä ja lähdemaininta | Oma teksti | Sivun alatunniste | SECURITY.md 7, TXT-001. Tarkistettava: vaatiiko CD PROJEKT RED:n Fan Content Guidelines englanninkielisen merkinnän tälle sovellukselle. |

Lähteet: `docs/SECURITY.md` luku 7 (tarkistettu 2026-09-30), `docs/DECISIONS.md` D-006, Netdeck.gg:n rajapinnan vastaus 2026-10-01 (151 korttia, tyypit Legend 27, Unit 73, Gear 17, Program 34; sääntöteksteissä "Pay this Legend's cost", "costs -1 €$").
