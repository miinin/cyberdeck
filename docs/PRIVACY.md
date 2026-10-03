# PRIVACY · cyberdeck

> Omistaja: Digiturva. Luotu 2026-10-01 (T-011, MVP-1:n suunnittelu).
> Kattaa MVP-0:n (julkaistu 0.1.0) ja MVP-1:n (kokoelma ja pakat paikallisesti selaimessa, tiedostojen tuonti ja vienti, D-007). MVP-2:n kirjautuminen ennakoidaan luvussa 7.
> **Digiturva ei anna oikeudellista neuvontaa.** Alla olevat arviot ovat ehdotuksia. Tulkinnanvaraiset kohdat on merkitty luvussa 8, ja niistä päättää käyttäjä.

## 1. Yhteenveto

- MVP-1 **ei kerää henkilötietoja kehittäjälle eikä omalle palvelimelle**. Sovelluksella ei ole palvelinta, kirjautumista, lomakkeita, evästeitä eikä analytiikkaa.
- Kokoelma ja pakat tallentuvat **vain käyttäjän omaan selaimeen** (selaimen tallennustila, origin-kohtainen). Ne eivät siirry verkkoon.
- Kolmannet osapuolet näkevät verkkoyhteyden tiedot (IP-osoite, selaimen tiedot): **Firebase Hosting (Google)**, joka toimittaa sivun, ja ~~**Netdeck.gg**, jolta selain hakee korttidatan~~ → T-026:sta alkaen (D-013) selain ei ota yhteyttä Netdeckiin, koska korttidata on sovelluksen mukana. Netdeck näkee vain kehittäjän IP-osoitteen, kun kehittäjä päivittää datan (`npm run cards:update`). **T-046 (D-015):** lisäksi Netdeck näkee käyttäjän IP-osoitteen, selaimen tiedot ja Originin silloin, kun käyttäjä itse hakee pakan Netdeck-linkistä. Näkymässä on huomautus ennen hakua.
- Ainoa vapaa tekstikenttä on pakan nimi. Se voi sisältää henkilötiedon (esim. "Mikan pakka"), mutta se pysyy käyttäjän laitteella ja käyttäjän itse jakamissa vientitiedostoissa.

## 2. Tietoinventaario

| # | Tieto | Lähde | Tarkoitus | Missä | Kuka pääsee | Henkilötieto? | Minimointi ja perustelu |
|---|---|---|---|---|---|---|---|
| 1 | Kokoelma: kortin avain ja omistettu määrä | Käyttäjä merkitsee +/−-painikkeilla (T-012, toteutettu; määrä 0–999, 0 poistaa rivin) | Kokoelman seuranta | Käyttäjän selain, localStorage-avain `cyberdeck:collection` (D-008, T-011) | Laitteen käyttäjät, selainlaajennukset | Ei sellaisenaan. Kertoo pelaajan korttivalikoiman, ei tunnista henkilöä. | Vain avain ja määrä. Ei aikaleimahistoriaa (vain kääreen viimeisin tallennusaika, rivi 3). |
| 2 | Pakat: id (sovelluksen luoma satunnainen), nimi, osioiden nimet, kortin avaimet ja määrät, luonti- ja muokkausaika | Käyttäjä (T-013), tuonti (T-014, T-015) | Pakkojen hallinta | localStorage-avain `cyberdeck:decks` | Kuten 1 | **Mahdollisesti:** pakan nimi (enintään 100 merkkiä) ja osion nimi (enintään 50 merkkiä) ovat vapaata tekstiä ja voivat sisältää nimen tai muun tunnisteen | Rajat SR-11:n mukaan. Id (`crypto.randomUUID`) on pakkokohtainen eikä laite- tai käyttäjätunniste. `createdAt` ja `updatedAt` (D-008:n tietomalli; tekninen kenttä, jota esim. järjestys ja MVP-2:n synkronointi voivat käyttää) kertovat, milloin pakkaa on käsitelty. Ne pysyvät laitteella, eikä niitä viedä (SR-19). |
| 3 | Skeemaversio ja viimeisin tallennusaika (`schemaVersion`, `savedAt` kääreessä) | Sovellus | Migraatiot (SR-11) | Kuten 1 | Kuten 1 | Ei | Yksi aikaleima tietokokonaisuutta kohden, ei historiaa. Lisäksi tallennustila kokeillaan käynnistyksessä hetkellisesti avaimella `cyberdeck:probe`, joka poistetaan heti. |
| 4 | Varakopio rikkinäisestä, vanhemmasta tai osittain korjatusta datasta (SR-11) | Sovellus | Tietojen menetyksen esto | `cyberdeck:backup:<collection\|decks>:<aika>` | Kuten 1 | Kuten 1–2 | Enintään 3 kustakin tietokokonaisuudesta, vanhimmat poistetaan automaattisesti (T-011). Poistetaan myös, kun käyttäjä tyhjentää tiedot (luku 5). Toteutus poikkeaa aiemmasta suosituksesta (enintään 1), mutta Digiturva hyväksyy sen: data ei ole arkaluonteista, ja useampi kopio suojaa tietojen menetykseltä paremmin. |
| 5 | ~~Korttidatan välimuisti (jos T-003 toteutetaan)~~ → poistunut: T-003 korvattu T-026:lla (D-013), korttidataa ei tallenneta selaimeen | Netdeck.gg | Nopeampi lataus | Kuten 1 | Kuten 1 | Ei | Vain julkista korttidataa |
| 6 | Viety tiedosto (.json, .txt) | Käyttäjä vie (T-015) | Varmuuskopio, jakaminen kaverille | Käyttäjän laite ja ne, joille käyttäjä sen lähettää | Käyttäjä päättää | Kuten 2 (pakan nimi) | Vain valittu pakka, ei laite- tai käyttäjätietoja (SR-19) |
| 7 | Tuotu tiedosto tai liitetty teksti | Käyttäjä tai kaveri (T-014, T-015) | Pakan tuonti | Luetaan muistiin, tallennetaan vain hyväksytty pakka | Kuten 1 | Kuten 2 | Tiedostoa ei tallenneta sellaisenaan eikä lähetetä minnekään (SR-15) |
| 8 | IP-osoite, selaimen tiedot (User-Agent), pyyntöjen ajankohdat ja polut | Selain automaattisesti | Sivun toimitus | **Firebase Hosting (Google)**, globaali CDN | Google; projektin omistaja Firebase-konsolin kautta, jos lokit tai Cloud Logging -integraatio on käytössä | **Kyllä** (IP-osoite) | Ei omaa lokitusta. `Referrer-Policy: no-referrer` (SR-3). Säilytysaika ja lokien saatavuus: **tarkistettava** Firebasen tietosuojadokumentaatiosta (firebase.google.com/support/privacy). |
| 9 | ~~IP-osoite, selaimen tiedot, Origin-otsake~~ → **Poistunut käyttäjiltä T-026:ssa** (D-013, CSP `connect-src 'self'`, `dist/` ei sisällä Netdeck-osoitetta). Jäljellä vain kehittäjän IP, kun `cards:update` ajetaan (Node, ei Origin-otsaketta). Aiempi kuvaus: | Selain automaattisesti, kun korttidata haetaan | Korttidatan haku | **Netdeck.gg** (sijainti ja säilytys tuntemattomia) | Netdeck.gg | **Kyllä** (IP-osoite) | `credentials: 'omit'` ja `referrerPolicy: 'no-referrer'` (SR-4). Origin paljastaa, että pyyntö tulee cyberdeckistä. Netdeckin tietosuojaehtoja ei löytynyt (SECURITY.md luku 7). Välimuisti (T-003) vähentäisi pyyntöjä. |
| 9b | IP-osoite, selaimen tiedot (User-Agent), Origin-otsake ja haetun pakan UUID (T-046, D-015) | Selain automaattisesti, **vain kun käyttäjä painaa "Hae pakka"** | Pakan haku Netdeck-linkistä | **Netdeck.gg** (sijainti ja säilytys tuntemattomia) | Netdeck.gg | **Kyllä** (IP-osoite) | Vain käyttäjän pyynnöstä, huomautus "Haku lähettää pyynnön Netdeck.gg-palveluun." `credentials: 'omit'`, `referrerPolicy: 'no-referrer'` (SR-20). Vastauksesta näytetään pakan tekijän julkinen nimimerkki (`owner.display_name`), mutta sitä ei tallenneta. Netdeckin tietosuojaehtoja ei löytynyt. |
| 10 | Teemavalinta: raakamerkkijono `light` tai `dark` | Käyttäjä painaa otsikkopalkin Vaalea teema -painiketta (T-025) | Valitun väriteeman muistaminen | localStorage-avain `cyberdeck:theme`. Kirjoitus vain tallennuskerroksen kautta, `public/theme-init.js` lukee sen ennen ensimmäistä piirtoa (A1, SR-12) | Kuten 1 | Ei. Kaksi mahdollista arvoa, ei tunnista henkilöä eikä laitetta. | Vain teema. Ei aikaleimaa eikä historiaa. Avainta ei luoda, ellei käyttäjä vaihda teemaa (tumma oletus ilman tallennusta). |

**Ei kerätä:** nimiä, sähköposteja, käyttäjätunnuksia, laite- tai mainostunnisteita, sijaintia, analytiikkaa, virheraportointia ulkoiseen palveluun, evästeitä. Ei ulkoisia fontteja eikä CDN-skriptejä (SR-2).

## 3. Datan sijainti

| Paikka | Sijainti | Huomio |
|---|---|---|
| Kokoelma ja pakat | Käyttäjän laite, selaimen profiilikansio | **Salaamaton.** Kuka tahansa, jolla on pääsy laitteeseen ja selainprofiiliin, voi lukea sen. Ei-arkaluonteista dataa, joten hyväksyttävää. |
| Firebase Hosting | Googlen globaali CDN | Hostingin sijaintia ei voi valita. Firebase-projekti `cyberdeck-tcg`. |
| Netdeck.gg | Tuntematon | Kolmas osapuoli, käyttäjä hyväksyi rajapinnan käytön (D-006, R-2). T-026:sta alkaen vain kehittäjän päivityskomento, ei käyttäjien yhteyksiä. |
| Vientitiedostot | Käyttäjän laite ja käyttäjän valitsemat vastaanottajat | Käyttäjän hallinnassa |

Tuotanto, testisivusto ja esikatselukanavat ovat eri origineja, joten niiden selaintallennus on erillään toisistaan.

## 4. Käsittelyperuste ja rekisterinpitäjä (ehdotus, käyttäjä päättää)

- **Selaimen tallennustila (rivit 1–7):** data ei poistu käyttäjän laitteelta, eikä kehittäjä saa sitä. Digiturvan arvio: kehittäjä ei käsittele näitä tietoja. Tämä on arvio, ei oikeudellinen kannanotto.
- **Selaimen tallennustilan käyttö ilman suostumusta:** tallennus on välttämätön käyttäjän nimenomaisesti pyytämän toiminnon (kokoelman ja pakkojen säilyminen) toteuttamiseksi, eikä sitä käytetä seurantaan. Arvio: suostumusbanneria ei tarvita. Vahvistettava käyttäjältä (luku 8, K-P2).
- **Hosting-lokit (rivi 8):** sivuston ylläpitäjä (Firebase-projektin omistaja, eli käyttäjä) on todennäköisesti rekisterinpitäjä ja Google käsittelijä Firebasen ehtojen mukaan. Peruste voisi olla oikeutettu etu (palvelun toimitus ja turvallisuus). Ehdotus, käyttäjä päättää (K-P1).
- **Netdeck.gg (rivi 9):** T-026:sta alkaen ei koske käyttäjiä (ei yhteyttä selaimesta). Aiempi arvio: Netdeck on oma, itsenäinen toimijansa. Meidän osuutemme on se, että sivu ohjaa käyttäjän selaimen ottamaan yhteyttä Netdeckiin. Tämä kerrotaan tietosuojailmoituksessa.

## 5. Säilytys ja poisto

| Tieto | Säilytys | Poisto |
|---|---|---|
| Kokoelma, pakat, varakopio, välimuisti, teemavalinta | Kunnes käyttäjä poistaa ne tai selain siivoaa ne | Sovelluksen poistotoiminnot (pakan poisto T-013). Teeman voi palauttaa tummaksi painikkeella, mutta avain jää arvolla `dark`. Selaimen asetus "Poista sivuston tiedot" poistaa kaiken. **Suositus:** sovellukseen "Poista kaikki tiedot tästä selaimesta" -toiminto vahvistuksella (ehdotus IDEAS.md:hen PM:lle). Toiminnon on poistettava kaikki `cyberdeck:`-etuliitteiset avaimet, myös `cyberdeck:theme` (SEC-015). |
| – | Selain voi poistaa datan ilman käyttäjän toimea: yksityinen ikkuna (suljettaessa), tallennustilan loppuminen, Safarin (WebKit ITP) noin 7 vuorokauden käyttämättömyysraja skriptin kirjoittamalle tallennustilalle | Riski R-10 (SECURITY.md). Käyttäjälle kerrotaan, että tiedot ovat vain tässä selaimessa ja että viennillä voi tehdä varmuuskopion. **T-012:** kokoelmanäkymä kertoo, että kokoelma tallentuu vain tähän selaimeen, ja käyttäjä voi painikkeesta pyytää pysyvää tallennusta (`navigator.storage.persist()`). Pyyntö ja vain-luku-tarkistus (`persisted()`) ovat selaimen sisäisiä eivätkä lähetä tietoja minnekään. Vienti (T-015) puuttuu vielä. |
| Vientitiedostot | Käyttäjän hallinnassa | Käyttäjä poistaa itse |
| Hosting-lokit (Google) | **Tarkistettava** (Firebasen dokumentaatio) | Ei kehittäjän hallinnassa |
| Netdeck.gg:n lokit | Tuntematon | Ei kehittäjän hallinnassa. T-026:sta alkaen lokeissa on vain kehittäjän päivitysajot, ei käyttäjien IP-osoitteita. T-046:sta alkaen lokeissa voi olla käyttäjän IP-osoite, jos hän hakee pakan linkistä. |

**Rekisteröidyn oikeudet MVP-1:ssä:** koska kehittäjällä ei ole käyttäjien selaindataa, pääsy-, siirto- ja poistopyynnöt toteutuvat käyttäjän omilla toimilla (vienti T-015, poistotoiminnot, selaimen asetukset).

**Jaettu tietokone:** seuraava käyttäjä näkee samassa selainprofiilissa edellisen käyttäjän kokoelman ja pakat. Tieto ei ole arkaluonteista, mutta asia mainitaan tietosuojailmoituksessa.

## 6. Evästeet ja seuranta

- Ei evästeitä. Ei analytiikkaa, mainoksia, seurantapikseleitä, upotuksia eikä ulkoisia fontteja.
- Selaimen tallennustilaa käytetään vain luvun 2 riveihin 1–5 ja 10 (SR-12, SR-16). Teemavalinta (rivi 10) on käyttäjän itse tekemä asetus, ei eväste eikä seurantaa.
- Jos analytiikkaa tai virheraportointia halutaan myöhemmin, se vaatii suostumuksen ennen latausta, PRIVACY.md:n päivityksen ja Digiturvan katselmoinnin.

## 7. MVP-2:n ennakointi (kirjautuminen ja pilvitallennus: katso luku 10)

Kirjautuminen ja pilvitallennus muuttavat tilanteen: kehittäjä (Firebase-projektin omistaja) alkaa käsitellä henkilötietoja. Ennen ensimmäistä MVP-2-tehtävää Digiturva päivittää tämän tiedoston. Tiedossa olevat kohdat (katso myös SECURITY.md luku 12):

- **Uudet tiedot:** Firebase Authin uid, sähköposti tai Google-tilin perustiedot (nimi, kuva kirjautumistavasta riippuen), kirjautumisajat, pilveen tallennettu kokoelma ja pakat, jaetut vaihtolistat ja tieto kavereista.
- **Minimointi:** kirjautumistapa, joka tuo vähiten tietoja. Google-kirjautumisesta ei tallenneta nimeä tai kuvaa omaan tietokantaan ilman tarvetta. Vaihtolistassa näytetään vain käyttäjän itse valitsema nimimerkki.
- **Sijainti:** Firestore EU-alueelle (esim. `europe-north1` tai `eur3`). Sijainti valitaan tietokannan luonnissa eikä sitä voi muuttaa jälkikäteen, joten käyttäjä päättää ennen luontia. Firebase Auth ei ole aluekohtainen.
- **Erillinen testiprojekti (D-003):** testisivustolla ei koskaan oikeaa käyttäjädataa, eikä testidatassa ole oikeita henkilötietoja (rules.md 10).
- **Alaikäiset:** pelikaverit voivat olla alaikäisiä. Tämä nostaa vaatimustasoa (esim. lasten suostumusikä tietoyhteiskuntapalveluissa) ja voi edellyttää vaikutustenarviota (DPIA). **Eskaloitava käyttäjälle ennen MVP-2:ta (K-P3).**
- **Säilytys ja poisto:** tilin poisto poistaa Firestore-datan ja Auth-käyttäjän. Käyttämättömien tilien säilytysaika päätetään.
- **Tietosuojaseloste:** pakollinen ennen kuin kirjautuminen avataan muille kuin kehittäjälle. Digiturva laatii luonnoksen, Sisällöntuottaja tarkistaa kielen, ja käyttäjä hyväksyy.

## 8. Avoimet kysymykset käyttäjälle (PM:n kautta)

| ID | Kysymys | Digiturvan ehdotus | Blokkaako? |
|---|---|---|---|
| K-P1 | Kuka on rekisterinpitäjä Firebase Hostingin ~~ja Netdeck-yhteyksien~~ IP-osoitteille, ja mikä on käsittelyperuste? (T-026: Netdeck-yhteydet poistuivat käyttäjiltä.) | Käyttäjä Firebase-projektin omistajana, peruste oikeutettu etu. Kerrotaan lyhyessä tietosuojailmoituksessa. | Ei MVP-1:tä |
| K-P2 | Riittääkö MVP-1:ssä lyhyt tietosuojailmoitus sivulla (esim. "Kokoelma ja pakat tallentuvat vain tähän selaimeen. ~~Sivu hakee korttitiedot Netdeck.gg:stä, joka näkee IP-osoitteesi.~~") ilman suostumusbanneria? | Kyllä. **T-026 (2026-10-02):** Netdeck-maininta ja IP-osoite eivät enää kuulu ilmoitukseen, koska selain ei ota yhteyttä Netdeckiin. Lähdemaininta "Korttitiedot: Netdeck.gg" säilyy (R-2:n ehto), mutta se ei ole tietosuojatieto. Teksti Sisällöntuottajalle ja UX:lle T-012:n tai T-013:n yhteyteen. **Tila 2026-10-01:** T-012 näyttää ensimmäisen puoliskon ("Kokoelma tallentuu vain tähän selaimeen…"). Maininta Netdeck.gg:stä ja IP-osoitteesta puuttuu edelleen ja odottaa käyttäjän vastausta. | Ei |
| K-P3 | Ovatko MVP-2:n kirjautuvat käyttäjät mahdollisesti alaikäisiä? | Selvitettävä ennen MVP-2:n suunnittelua. Jos kyllä, DPIA-tarve arvioidaan. | ~~Blokkaa MVP-2:n~~ → **Ratkaistu** (käyttäjä, D-016, 2026-10-03): ikäraja 16 vuotta, luku 10. |
| K-P4 | Hosting-lokien säilytysaika ja Cloud Logging -integraation tila Firebase-projektissa | Käyttäjä tai Koodari tarkistaa Firebase-konsolista (vain luku). Kirjataan lukuun 5. | Ei |

## 9. Muutosloki

| Päivä | Muutos | Tehtävä |
|---|---|---|
| 2026-10-01 | Ensimmäinen versio: MVP-0:n ja MVP-1:n tietoinventaario, sijainti, käsittelyperuste-ehdotus, säilytys ja poisto, evästeet, MVP-2:n ennakointi, avoimet kysymykset K-P1–K-P4 | T-011 |
| 2026-10-01 | Inventaario toteutuksen mukaiseksi (katselmointi SEC-002-t011): localStorage-avaimet, osion nimet, pakkojen `createdAt` ja `updatedAt`, kääreen `savedAt`, koetallennusavain ja enintään 3 varmuuskopiota tietokokonaisuutta kohden. SR-16 täyttyy: ei henkilö-, laite- tai käyttäjätunnisteita eikä tokeneita. | T-011 |
| 2026-10-01 | Katselmointi SEC-003-t012: kokoelman merkintä toteutettu (rivi 1), ei uusia tallennettavia kenttiä, evästeitä tai kolmansia osapuolia. Pysyvän tallennuksen pyyntö (luku 5) ja K-P2:n tila päivitetty. | T-012 |
| 2026-10-02 | Katselmointi SEC-004-t025: teemavalinta `cyberdeck:theme` lisätty inventaarioon (rivi 10), säilytykseen ja poistoon (luku 5) ja tallennustilan käyttöön (luku 6). Ei henkilötieto, SR-16 täyttyy. | T-025 |
| 2026-10-02 | Katselmointi SEC-005-t026: korttidata buildissa (D-013). Netdeck.gg ei enää näe käyttäjien IP-osoitteita (rivi 9, yhteenveto, luvut 3–5), välimuistirivi 5 poistunut, K-P1 ja K-P2 päivitetty. Ei uusia henkilötietoja, tallennettavia kenttiä, evästeitä tai kolmansia osapuolia. | T-026 |
| 2026-10-02 | Katselmointi SEC-006-t027: korttikuvat omalta originilta (`/assets/`). Ei uusia henkilötietoja, evästeitä, tallennusavaimia eikä kolmansia osapuolia. Kuvapyynnöt näkyvät vain Firebase Hostingin lokeissa kuten muutkin pyynnöt (rivi 8). Kuvien metatiedot (EXIF, GPS, XMP) poistetaan tuonnissa, joten kuvapaketin tekijän tietoja ei julkaista. | T-027 |
| 2026-10-02 | Katselmointi SEC-009-t046: linkkihaku Netdeckistä (D-015). Rivi 9b: Netdeck näkee käyttäjän IP-osoitteen vain käyttäjän pyytämässä linkkihaussa. Yhteenveto ja säilytys päivitetty. Ei uusia tallennettavia kenttiä eikä evästeitä. K-P1:n ja K-P2:n Netdeck-maininta tulee taas ajankohtaiseksi linkkihaun osalta (huomautus näkymässä riittää ehdotuksena). | T-046 |
| 2026-10-03 | Luku 10 (LUONNOS): T-054:n kirjautuminen ja pilvitallennus (D-016, D-017). Uusi inventaario (rivit 11–19), sijainti, peruste, säilytys ja poisto, evästeet, jaettu kone ja avoimet kysymykset K-P5–K-P8. Luku 7 korvattu kirjautumisen osalta luvulla 10, K-P3 ratkaistu (D-016: 16+). Raportti SEC-011-t054. | T-054 |
| 2026-10-03 | Katselmointi SEC-013-t054a: rivi 11 ja luku 10.3 päivitetty Muutos K-P8:n mukaiseksi (juuri `users` molemmissa projekteissa, `test_users` poistui). Firestoren sijainti on toistaiseksi `nam5`, mikä on korjattava ennen T-054b:tä. Uusi avain `cyberdeck:account:redirect-pending` (arvo `1`) hyväksytty, ei henkilötietoa. Dialogin tietosuojateksti tarkennettava ennen julkaisua (SEC-038). | T-054a |

## 10. MVP-2: kirjautuminen ja pilvitallennus (T-054, LUONNOS)

> **Luonnos 2026-10-03 (Digiturva, SEC-011).** Voimaan, kun T-054 on toteutettu. Korvaa luvun 7 kirjautumisen ja pilvitallennuksen osalta (jaetut vaihtolistat ja kaverit ovat yhä luvussa 7). Päätökset D-016 (käyttäjä) ja D-017. Turvavaatimukset SR-21–SR-29 raportissa `reports/SEC-011-t054-uhkamalli.md`. Ei oikeudellinen kannanotto.

### 10.1 Yhteenveto
- Kirjautuminen on **vapaaehtoinen** ja vain Google-tilillä. Ilman kirjautumista mikään luvuissa 1–6 ei muutu, eikä selain lataa Firebasen koodia eikä ota yhteyttä Googleen.
- Kirjautuneen käyttäjän pakat ja kokoelma tallentuvat Firestoreen (Google, EU: tuotanto `eur3`, testi `europe-north1`) ja selaimeen tilikohtaisesti. Googlen tilitiedot (nimi, sähköposti) ovat Firebase Authenticationissa, ei Firestoressa.
- Rekisterinpitäjä: Miika Miinin, miikamiinin@gmail.com (K-P7). Kirjautumista ei avata muille ennen kuin tämä teksti on lisätty.
- Firestoreen ei tallenneta sähköpostia, nimeä eikä kuvaa, vaan vain Googlen antama tunniste (uid) polussa sekä pakat ja kokoelma.
- **Ikäraja 16 vuotta** (D-016). Ikää ei voi tarkistaa teknisesti, vaan siitä kerrotaan kirjautumisdialogissa.
- **Rekisterinpitäjä** on käyttäjä Firebase-projektin `cyberdeck-tcg` omistajana (D-016). Google (Firebase) toimii käsittelijänä Firebasen ehtojen mukaan.

### 10.2 Tietoinventaario (lisäys lukuun 2)

| # | Tieto | Lähde | Tarkoitus | Missä | Kuka pääsee | Henkilötieto? | Minimointi ja perustelu |
|---|---|---|---|---|---|---|---|
| 11 | uid (Firebase Authin pseudonyymi tunniste) | Firebase Auth kirjautuessa | Datan kohdistaminen omistajalle, sääntöjen omistajatarkistus | Firestore-polku `users/{uid}` (tuotanto `cyberdeck-tcg`, testi `cyberdeck-tcg-dev`, D-017 Muutos K-P8), localStorage-avainten nimet `cyberdeck:u:{uid}:…` ja `cyberdeck:account:last-uid` | Käyttäjä; projektin omistaja konsolista; Google käsittelijänä | **Kyllä** (pseudonyymi tunniste) | Ei sähköpostia tunnisteena. `last-uid` poistetaan uloskirjautuessa (SR-26). SR-16:n poikkeus: uid vain avainten nimissä. Lisäksi T-054a: `cyberdeck:account:redirect-pending` (arvo `1`, ei henkilötietoa) asetetaan juuri ennen uudelleenohjausta Googleen ja poistetaan, kun tulos on luettu. |
| 12 | Pakat pilvessä (kuten rivi 2) | Käyttäjä, synkronointi | Laitteiden välinen tallennus | Firestore `…/{uid}/decks/{deckId}` | Kuten 11 | Mahdollisesti (pakan nimi, kuten rivi 2) | Samat kentät ja rajat kuin selaimessa (SR-11, SR-22). |
| 13 | Kokoelma pilvessä (kuten rivi 1) | Käyttäjä, synkronointi | Kuten 12 | Firestore `…/{uid}/collection/main` | Kuten 11 | Ei sellaisenaan, mutta liittyy uid:hen | Vain kortin avain ja määrä. |
| 14 | Synkronoinnin meta: skeemaversio, muutoslaskuri `rev`, palvelimen aika viimeisestä työnnöstä | Sovellus | Synkronointi ja ristiriitojen tunnistus | Firestore `…/{uid}` | Kuten 11 | Liittyy uid:hen (kertoo viimeisen käyttöhetken) | Vain viimeisin aika, ei historiaa. |
| 15 | Tilin paikallinen kopio ja synkronoinnin pohja | Sovellus | Offline-käyttö, kolmitiemerge | localStorage `cyberdeck:u:{uid}:decks`, `…:collection`, `…:sync` | Laitteen käyttäjät, selainlaajennukset | Kuten 12–14 | **Jää selaimeen uloskirjautuessa** (käyttäjän valinta, D-017). Ei näy uloskirjautuneena. Poisto: SR-26 kohdat 3–4. |
| 16 | Firebase Auth -istunto: refresh- ja ID-token sekä Googlen profiilin kopio (uid, sähköposti, nimi, kuvan URL) | Firebase Auth SDK | Kirjautumisen säilyminen | Selaimen IndexedDB `firebaseLocalStorageDb` | Laitteen käyttäjät, selainlaajennukset, XSS | **Kyllä** | SDK:n hallinnassa, sovellus ei lue tokeneita (SR-21). `signOut` poistaa. |
| 17 | Firebase Auth -käyttäjätietue: uid, sähköposti, nimi, kuvan URL, tunnistautumistapa, luonti- ja viimeinen kirjautumisaika | Google-kirjautuminen (oletusscopet `openid email profile`) | Tilin olemassaolo | Firebase Authentication (Googlen globaali palvelu, ei aluevalintaa) | Projektin omistaja konsolista, Google | **Kyllä** | Ei kopioida Firestoreen. Poisto: SR-26 kohta 5 (K-P5). |
| 18 | Firebase SDK:n heartbeat-tieto (SDK-versiot ja käyttöpäivät) | Firebase app SDK | Googlen SDK-käyttötilasto, lähetetään otsakkeena Firebase-pyyntöjen mukana | Selaimen IndexedDB `firebase-heartbeat-database` | Google | Ei tunnista henkilöä sellaisenaan | Vain kirjautuneilla (SDK ladataan vain heille). |
| 19 | IP-osoite, selaimen tiedot ja pyyntöjen ajankohdat Auth-, OAuth- ja Firestore-pyynnöissä | Selain automaattisesti | Palvelun toimitus | Google (accounts.google.com, identitytoolkit, securetoken, firestore.googleapis.com) | Google; projektin omistaja vain, jos Cloud Audit Logsin Data Access -lokit otetaan käyttöön (ei oteta, SR-25) | **Kyllä** (IP) | `Referrer-Policy: no-referrer`. Ei omaa lokitusta (SR-27). |

**Ei edelleenkään kerätä:** analytiikkaa, mainostunnisteita, virheraportointia, sijaintia. Sähköpostia ja nimeä ei tallenneta Firestoreen eikä localStorageen (sovellus näyttää sähköpostin vain muistista).

### 10.3 Sijainti
| Paikka | Sijainti | Huomio |
|---|---|---|
| Firestore | Tuotanto `eur3`, testi `europe-north1` (käyttäjän valinta 2026-10-03, pysyvä, D-017). **Tila 2026-10-03: molempien projektien tietokanta on `nam5` (USA)** ja luodaan uudelleen ennen T-054b:tä (SEC-013). | Juuri `users` molemmissa projekteissa: tuotanto `cyberdeck-tcg`, testisivusto ja kehitys `cyberdeck-tcg-dev` (D-017 Muutos K-P8, R-18 poistuu). |
| Firebase Authentication | Googlen globaali palvelu, ei aluevalintaa | Tietoja voidaan käsitellä EU:n ulkopuolella. Siirron peruste Googlen tietojenkäsittelyehdoissa: **tarkistettava** (firebase.google.com/support/privacy). |
| Selain | Käyttäjän laite | Kuten luku 3. Tilin kopio jää uloskirjautuessa. |

### 10.4 Käsittelyperuste (ehdotus, käyttäjä päättää)
- Pilvitallennus on käyttäjän itse pyytämä palvelu (kirjautuminen on vapaaehtoinen ja käyttäjän käynnistämä). Digiturvan ehdotus: peruste on palvelun tarjoaminen käyttäjän pyynnöstä, ja se kerrotaan selosteessa. Ei oikeudellinen kannanotto.
- Selaimen tallennustila ja IndexedDB (rivit 15, 16 ja 18) ovat välttämättömiä käyttäjän pyytämälle kirjautumiselle, eikä niitä käytetä seurantaan. Arvio: suostumusbanneria ei tarvita (vrt. K-P2).

### 10.5 Säilytys ja poisto
| Tieto | Säilytys | Poisto |
|---|---|---|
| Pilvidata (rivit 11–14) | Kunnes käyttäjä poistaa sen. Käyttämättömät tilit: **K-P6** | "Poista tilin tiedot" -painike vahvistuksella poistaa pakat, kokoelman ja metan pilvestä sekä tilin kopion tästä selaimesta (SR-26 kohta 4, GDPR 17). Toisten laitteiden kopiot eivät palaa pilveen automaattisesti (SR-23 kohta 7). |
| Firebase Auth -tietue (rivi 17) | Kunnes tili poistetaan | Suositus: sama painike poistaa Auth-käyttäjän (vaatii tuoreen kirjautumisen). Muuten poistopyyntö ylläpitäjälle (**K-P5**). |
| Tilin kopio selaimessa (rivi 15) | Jää uloskirjautuessa | Valinnainen "Poista tiedot tästä selaimesta" (SR-26 kohta 3), "Poista tilin tiedot", selaimen asetus "Poista sivuston tiedot". |
| Auth-istunto (rivi 16) | Kunnes käyttäjä kirjautuu ulos | `signOut`. |
| Googlen lokit (rivi 19) | Googlen käytännön mukaan | Ei ylläpitäjän hallinnassa. |
| Testisivuston data (`test_users`) | Kehittäjän ja testaajien testidata | Testisivuston "Poista tilin tiedot". Ei tarkoituksella oikeita henkilötietoja (rules.md 10). |

**Rekisteröidyn oikeudet:** pääsy ja siirto toteutuvat sovelluksessa (data näkyy, pakat voi viedä, T-015), poisto painikkeella, oikaisu muokkaamalla. Muut pyynnöt rekisterinpitäjälle (yhteystieto selosteessa, **K-P7**).

### 10.6 Jaettu tietokone (käyttäjän valinta: tiedot jäävät selaimeen)
- **Digiturvan arvio: Low (R-20).** Selaimeen jäävät pakat ja kokoelma eivät ole arkaluonteisia, mutta pakan nimi voi sisältää nimen. Uloskirjautumisen jälkeen ne eivät näy sovelluksessa, mutta ne voi lukea selaimen kehitystyökaluilla. Google-istunto (accounts.google.com) jää selaimeen, ellei käyttäjä kirjaudu ulos myös Googlesta.
- **Minimivaatimus (SR-26 kohta 2):** uloskirjautuessa ilmoitus, että tiedot jäivät tähän selaimeen, ja kehotus poistaa ne ja kirjautua ulos Google-tililtä yhteisellä koneella. Lisäksi `prompt: 'select_account'`, jotta seuraava käyttäjä ei kirjaudu huomaamattaan edellisen Google-tilillä. Suositus: poistopainike ilmoituksessa (SR-26 kohta 3).

### 10.7 Evästeet
Sovellus ei aseta evästeitä. Firebase Auth käyttää IndexedDB:tä (rivi 16). Kirjautumisen aikana Google asettaa omat evästeensä omaan verkkotunnukseensa (accounts.google.com), mikä kerrotaan selosteessa.

### 10.8 Tietosuojaseloste ja kirjautumisdialogi
- **Kirjautumisdialogi (T-054a), sisältöluonnos:** "Kirjautuminen on tarkoitettu 16 vuotta täyttäneille. Tilille tallennetaan vain pakkasi ja kokoelmasi sekä Googlen antama tunniste, ei nimeäsi eikä sähköpostiasi. Tiedot säilytetään Googlen palvelimilla EU:ssa, ja voit poistaa ne milloin tahansa." Lisäksi: "Googlen tilitietosi (nimi ja sähköpostiosoite) säilyvät Firebase Authenticationissa" ja rekisterinpitäjän paikkamerkki (toteutettu T-054c:ssä, SEC-038). + linkki selosteeseen. Sisällöntuottaja muotoilee.
- **Seloste (T-054d, ennen kirjautumisen avaamista muille):** SR-29 kohta 3. Digiturva laatii luonnoksen, käyttäjä hyväksyy.

### 10.9 Avoimet kysymykset käyttäjälle (PM:n kautta)
| ID | Kysymys | Digiturvan ehdotus | Blokkaako? |
|---|---|---|---|
| K-P5 | Poistaako "Poista tilin tiedot" myös Firebase Auth -käyttäjän (sähköposti, nimi ja kuva Googlen Authissa)? | Kyllä (`deleteUser`, tarvittaessa uudelleenkirjautuminen). Muuten selosteeseen ohje poistopyynnöstä. | Ratkaistu 2026-10-03: kyllä (D-017) |
| K-P6 | Poistetaanko käyttämättömät tilit automaattisesti (esim. 24 kk)? | Ei automaattista poistoa MVP:ssä (Spark ei tarjoa ajastettuja funktioita). Selosteessa: "säilytetään, kunnes poistat tiedot". | Selostetta |
| K-P7 | Rekisterinpitäjän nimi ja yhteystieto selosteeseen (esim. OAuth-näkymän tukisähköposti)? | Käyttäjä päättää. Ei kirjata repoon ennen päätöstä. | Ratkaistu 2026-10-03: Miika Miinin, miikamiinin@gmail.com |
| K-P8 | Hyväksyykö käyttäjä jäännösriskin R-18 (testisivuston koodi pääsee testisivustolle kirjautuneen käyttäjän tuotantodataan, koska projekti on yhteinen)? | Hyväksytään, kunhan testisivustolle kirjautuvat vain kehittäjä ja testaajat. Pysyvä korjaus: erillinen testiprojekti (IDEAS). | Ratkaistu 2026-10-03: erillinen testiprojekti (D-017) |
