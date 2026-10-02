# PRIVACY · cyberdeck

> Omistaja: Digiturva. Luotu 2026-10-01 (T-011, MVP-1:n suunnittelu).
> Kattaa MVP-0:n (julkaistu 0.1.0) ja MVP-1:n (kokoelma ja pakat paikallisesti selaimessa, tiedostojen tuonti ja vienti, D-007). MVP-2:n kirjautuminen ennakoidaan luvussa 7.
> **Digiturva ei anna oikeudellista neuvontaa.** Alla olevat arviot ovat ehdotuksia. Tulkinnanvaraiset kohdat on merkitty luvussa 8, ja niistä päättää käyttäjä.

## 1. Yhteenveto

- MVP-1 **ei kerää henkilötietoja kehittäjälle eikä omalle palvelimelle**. Sovelluksella ei ole palvelinta, kirjautumista, lomakkeita, evästeitä eikä analytiikkaa.
- Kokoelma ja pakat tallentuvat **vain käyttäjän omaan selaimeen** (selaimen tallennustila, origin-kohtainen). Ne eivät siirry verkkoon.
- Kolmannet osapuolet näkevät verkkoyhteyden tiedot (IP-osoite, selaimen tiedot): **Firebase Hosting (Google)**, joka toimittaa sivun, ja ~~**Netdeck.gg**, jolta selain hakee korttidatan~~ → T-026:sta alkaen (D-013) selain ei ota yhteyttä Netdeckiin, koska korttidata on sovelluksen mukana. Netdeck näkee vain kehittäjän IP-osoitteen, kun kehittäjä päivittää datan (`npm run cards:update`).
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
| Netdeck.gg:n lokit | Tuntematon | Ei kehittäjän hallinnassa. T-026:sta alkaen lokeissa on vain kehittäjän päivitysajot, ei käyttäjien IP-osoitteita. |

**Rekisteröidyn oikeudet MVP-1:ssä:** koska kehittäjällä ei ole käyttäjien selaindataa, pääsy-, siirto- ja poistopyynnöt toteutuvat käyttäjän omilla toimilla (vienti T-015, poistotoiminnot, selaimen asetukset).

**Jaettu tietokone:** seuraava käyttäjä näkee samassa selainprofiilissa edellisen käyttäjän kokoelman ja pakat. Tieto ei ole arkaluonteista, mutta asia mainitaan tietosuojailmoituksessa.

## 6. Evästeet ja seuranta

- Ei evästeitä. Ei analytiikkaa, mainoksia, seurantapikseleitä, upotuksia eikä ulkoisia fontteja.
- Selaimen tallennustilaa käytetään vain luvun 2 riveihin 1–5 ja 10 (SR-12, SR-16). Teemavalinta (rivi 10) on käyttäjän itse tekemä asetus, ei eväste eikä seurantaa.
- Jos analytiikkaa tai virheraportointia halutaan myöhemmin, se vaatii suostumuksen ennen latausta, PRIVACY.md:n päivityksen ja Digiturvan katselmoinnin.

## 7. MVP-2:n ennakointi (avoin)

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
| K-P3 | Ovatko MVP-2:n kirjautuvat käyttäjät mahdollisesti alaikäisiä? | Selvitettävä ennen MVP-2:n suunnittelua. Jos kyllä, DPIA-tarve arvioidaan. | Ei MVP-1:tä, blokkaa MVP-2:n |
| K-P4 | Hosting-lokien säilytysaika ja Cloud Logging -integraation tila Firebase-projektissa | Käyttäjä tai Koodari tarkistaa Firebase-konsolista (vain luku). Kirjataan lukuun 5. | Ei |

## 9. Muutosloki

| Päivä | Muutos | Tehtävä |
|---|---|---|
| 2026-10-01 | Ensimmäinen versio: MVP-0:n ja MVP-1:n tietoinventaario, sijainti, käsittelyperuste-ehdotus, säilytys ja poisto, evästeet, MVP-2:n ennakointi, avoimet kysymykset K-P1–K-P4 | T-011 |
| 2026-10-01 | Inventaario toteutuksen mukaiseksi (katselmointi SEC-002-t011): localStorage-avaimet, osion nimet, pakkojen `createdAt` ja `updatedAt`, kääreen `savedAt`, koetallennusavain ja enintään 3 varmuuskopiota tietokokonaisuutta kohden. SR-16 täyttyy: ei henkilö-, laite- tai käyttäjätunnisteita eikä tokeneita. | T-011 |
| 2026-10-01 | Katselmointi SEC-003-t012: kokoelman merkintä toteutettu (rivi 1), ei uusia tallennettavia kenttiä, evästeitä tai kolmansia osapuolia. Pysyvän tallennuksen pyyntö (luku 5) ja K-P2:n tila päivitetty. | T-012 |
| 2026-10-02 | Katselmointi SEC-004-t025: teemavalinta `cyberdeck:theme` lisätty inventaarioon (rivi 10), säilytykseen ja poistoon (luku 5) ja tallennustilan käyttöön (luku 6). Ei henkilötieto, SR-16 täyttyy. | T-025 |
| 2026-10-02 | Katselmointi SEC-005-t026: korttidata buildissa (D-013). Netdeck.gg ei enää näe käyttäjien IP-osoitteita (rivi 9, yhteenveto, luvut 3–5), välimuistirivi 5 poistunut, K-P1 ja K-P2 päivitetty. Ei uusia henkilötietoja, tallennettavia kenttiä, evästeitä tai kolmansia osapuolia. | T-026 |
