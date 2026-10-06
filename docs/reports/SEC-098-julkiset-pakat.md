# SEC-098: T-098 julkiset pakat, uhkamalli ja turvavaatimukset

**Digiturva · 2026-10-06 · Vaihe:** ennen toteutusta (suunnitelman katselmointi). **Lähteet:** D-025, `docs/tasks/T-098-julkiset-pakat.md`, `firestore.rules` (T-054b), `src/domain/deckShare.ts`, `src/domain/validate.ts`, `src/account/firebase/firestoreCloudStore.ts`, `src/account/firebase/firebaseAuthClient.ts`, PRIVACY.md luku 10.
**Liite:** `docs/reports/SEC-098-liite-firestore.rules` (ehdotus, ei deployattu, varsinaista `firestore.rules`-tiedostoa ei muutettu).

## Tulos
- **Suunnitelman löydökset:** Critical 0, High 1, Medium 3, Low 2, Info 1 (alla, SEC-098-1–SEC-098-7). Kaikki torjutaan vaatimuksilla SR-30–SR-42, jos ne hyväksytään hyväksymiskriteereiksi.
- **Veto:** T-098 ei saa siirtyä Doneksi ennen kuin SR-30–SR-36 ja SR-40 on toteutettu ja Digiturva on katselmoinut diffin ja säännöt. Ennen toteutusta käyttäjän on ratkaistava kohdat K-P9–K-P12.
- **Uusi luonne:** tähän asti Firestoressa ei ole ollut yhtään kaikille luettavaa dataa. T-098 avaa ensimmäisen julkisen luku- ja listausreitin, myös kirjautumattomille. Silloin jokainen kenttä on julkinen ja jokainen luku kuluttaa Sparkin yhteistä kiintiötä.

## Tietomalliehdotus (Arkkitehti vahvistaa)
`publicDecks/{pubId}`, jossa `pubId` = `sha256(uid + ":" + deckId)` heksana (64 merkkiä, pienet kirjaimet). Kentät (täsmälleen nämä):

| Kenttä | Tyyppi ja raja säännöissä | Huomio |
|---|---|---|
| `schemaVersion` | int 1–1000 | Kuten muissa dokumenteissa (SR-23). |
| `deckId` | merkkijono `^[A-Za-z0-9_-]{1,64}$` | Tarvitaan omistajatarkistukseen. `crypto.randomUUID()`, ei kerro käyttäjästä mitään. |
| `name` | merkkijono 1–200 | Asiakas 1–100 `cleanText`. |
| `legends` | merkkijono 0–300 | Rivin näyttöä varten. Lista ei kelpaa, koska säännöt eivät voi rajata listan alkioiden kokoa. |
| `cardCount` | int 0–49500 | 99 × 500. |
| `deck` | merkkijono 1–16000, `^[A-Za-z0-9_-]+$` | Sama koodaus kuin jakolinkissä (`encodeDeckShare`, `MAX_SHARE_DATA_LENGTH`). Luetaan samalla jäsentimellä kuin jakolinkki. |
| `nickname` | merkkijono 1–60 tai `null` | `null` = "Nimetön". Asiakas 1–30 `cleanText`. |
| `publishedAt` | timestamp, luonnissa `request.time`, ei muutu | |
| `updatedAt` | timestamp `== request.time` | Palvelimen aika. |

**Ei `ownerUid`-kenttää** (perustelu SEC-098-3). Omistajuus todetaan säännöissä laskemalla `pubId` kirjautuneen käyttäjän uid:stä. Kukaan muu ei voi laskea samaa `pubId`:tä, joten toisen pakan ylikirjoitus, poisto ja tunnisteen valtaus (squatting) on estetty ilman lisälukuja.

## Uhkamalli (STRIDE)

| # | Uhka | Kohde | Torjunta | Jäännös |
|---|---|---|---|---|
| S1 | Kirjautumaton tai anonyymi tunnus julkaisee | kirjoitus | `isGoogleUser()` (SR-21) | – |
| S2 | Julkaisija esiintyy toisena: nimimerkki "Cyberdeck", "ylläpito" tai toisen käyttäjän nimimerkki | `nickname` | Nimimerkkejä ei ole varattu eikä yksilöity. UI:ssa nimimerkki on aina selvästi käyttäjän oma teksti (SR-38). | Low, R-23 |
| T1 | Toisen käyttäjän julkisen pakan ylikirjoitus tai poisto | `publicDecks/*` | `pubId` sidottu uid:hen (SR-30) | – |
| T2 | Tunnisteen valtaus: hyökkääjä luo dokumentin uhrin tunnisteella ennen uhria tai uhrin poiston jälkeen | `publicDecks/{id}` | Kuten T1. Pelkkä `docId = deckId` + `ownerUid` jättäisi tämän auki (SEC-098-1). | – |
| T3 | Aikaleimojen väärennys, esimerkiksi aina listan kärkeen tulevalla tulevaisuuden ajalla | `updatedAt` | `== request.time` (SR-31) | – |
| T4 | Kenttien lisäys tai jättikentät | dokumentti | `hasOnly` ja kokorajat jokaiselle kentälle (SR-31) | – |
| R1 | Kuka julkaisi asiattoman pakan? | – | Firestore ei kirjaa kirjoittajaa ilman Data Access -lokeja (ei käytössä, SR-25). Ylläpitäjä voi poistaa dokumentin konsolista. | Low, R-23 |
| I1 | Kaikki käyttäjän julkiset pakat ja nimettömät pakat voidaan yhdistää samaan henkilöön `ownerUid`:n kautta | `ownerUid` | Ei uid:tä julkiseen dokumenttiin (SR-30, SEC-098-3) | – |
| I2 | Yksityistä tietoa vuotaa julkiseen kopioon: osioiden nimet, pakan nimessä oleva nimi tai muistiinpano | `name`, `deck` | Julkaisun esikatselu ja varoitusteksti (SR-38). Kopioon vain jakolinkin sisältö (SR-32). | Low |
| I3 | Julkinen kopio jää näkyviin, kun pakka on muutettu yksityiseksi tai poistettu offline-tilassa, tai tilin poiston jälkeen (orpo kopio) | synkronointi | SR-35, SR-36 | Low, R-22 |
| I4 | Kolmannet osapuolet (kaapijat, hakukoneet) tallentavat julkiset tiedot, eikä poisto ulotu niihin | – | Kerrotaan julkaisuhetkellä (SR-38). `noindex` julkisiin näkymiin (SR-41). | Low |
| D1 | Kirjautumaton kaapija listaa julkisia pakkoja silmukassa ja kuluttaa Sparkin 50 000 päivittäistä lukua. **Tämä katkaisee kaikkien käyttäjien synkronoinnin päiväksi.** | lukukiintiö | `limit ≤ 50` säännöissä, sivukoko 24, välimuisti istunnon ajan, ei reaaliaikakuuntelijaa (SR-33). App Check myöhemmin (K-P11). | **Medium, R-21** |
| D2 | Suuret dokumentit kuluttavat Sparkin 10 GiB:n kuukausittaisen siirtokiintiön (50 × 1 MiB = 50 MiB / listaus) | siirto | Koko pakka yhtenä ≤ 16 000 merkin merkkijonona, kaikki kentät rajattu, dokumentti ≤ noin 17 kt (SR-31, SEC-098-2) | – |
| D3 | Roskapostitus: yksi tai useampi Google-tili julkaisee satoja pakkoja ja peittää muiden pakat | listaus, kirjoituskiintiö | Säännöt eivät voi laskea käyttäjäkohtaisia määriä. Päivitysten tahti per dokumentti ≥ 10 s (SR-34). Ylläpitäjän poisto konsolista. | **Medium, R-21 / R-23** |
| D4 | Automaattitallennus kirjoittaa julkisen kopion jokaisella muutoksella ja kuluttaa 20 000 päivittäistä kirjoitusta | kirjoituskiintiö | Viivästetty julkinen kirjoitus (SR-34) | – |
| E1 | Julkisen pakan sisältö renderöidään HTML:nä tai linkkinä (XSS) | lukunäkymä, lista | React-escape, ei `dangerouslySetInnerHTML`, ei datasta muodostettuja `href`-arvoja, kaikki luettu data validoidaan (SR-37) | – |
| E2 | "Tallenna omaksi" kopioi julkisuustilan tai nimimerkin, tai ylikirjoittaa olemassa olevan pakan | tallennus | Aina uusi yksityinen pakka uudella id:llä (SR-39) | – |
| E3 | Säännöt avaavat vahingossa muitakin polkuja (esim. `match /{document=**}`) | säännöt | Vain `publicDecks/{pubId}`, ei rekursiivista osumaa, `users/*`-säännöt ennallaan (SR-40) | – |

## Löydökset (suunnitelma)

### SEC-098-1 · Tunnisteen valtaus ja toisen pakan estäminen, jos `docId = deckId` · High
**Sijainti:** T-098-kortin "Säännöt"-kohta, ehdotettu `publicDecks/{deckId}` + `ownerUid == auth.uid` · **Tehtävä:** T-098
**Toistaminen:** 1) Uhrin julkinen pakka näkyy listassa, ja sen `deckId` on dokumentin tunniste. 2) Uhri muuttaa pakan yksityiseksi, jolloin dokumentti poistetaan. 3) Hyökkääjä luo `publicDecks/{sama deckId}` omalla `ownerUid`:llään ja haluamallaan nimellä. 4) Uhri yrittää julkaista uudelleen: `update` hylätään, koska omistaja on eri.
**Odotettu:** jokainen käyttäjä hallitsee omien pakkojensa julkisia kopioita. · **Havaittu (suunnitelmassa):** tunnisteen voi vallata, ja hyökkääjän sisältö näkyy uhrin pakan paikalla, esimerkiksi aiemmin jaetussa osoitteessa.
**Vaikutus:** julkaisun esto (DoS) ja sisällön väärentäminen toisen pakan tunnisteella.
**Korjausehdotus:** SR-30: `pubId = sha256(uid + ":" + deckId)`, ja säännöt laskevat saman arvon `request.auth.uid`:sta (liite). Varavaihtoehto, jos `hashing` ei toimi: `pubId = uid + "_" + deckId`, ja sääntö vaatii, että tunniste alkaa `request.auth.uid + "_"`. Tämä kuitenkin julkaisee uid:n (SEC-098-3).
**Tila:** Avoin

### SEC-098-2 · Rajaamaton dokumentin koko kuluttaa siirtokiintiön · Medium
**Sijainti:** suunnitelma "pakan sisältö samoilla rajoilla kuin tallennuksessa". Nykyinen `isDeckDoc` rajaa vain `sections.size() <= 20`, ei osioiden sisältöä. · **Tehtävä:** T-098
**Toistaminen:** 1) Hyökkääjä kirjoittaa omalla tilillään julkisen pakan, jonka `sections`-listan alkiot ovat lähes 1 MiB:n karttoja. 2) Jokainen kirjautumaton listaus lataa 50 tällaista dokumenttia.
**Vaikutus:** Sparkin 10 GiB:n siirtokiintiö kuluu noin 200 sivunlatauksessa. Lista hidastuu kaikilla, ja mobiililla kuluu dataa.
**Korjausehdotus:** SR-31 ja SR-32: pakan sisältö yhtenä merkkijonona (jakolinkin koodaus, ≤ 16 000 merkkiä, regex), legendit merkkijonona ja kaikki kentät rajattu `hasOnly`:lla.
**Tila:** Avoin

### SEC-098-3 · Julkinen `ownerUid` yhdistää nimettömät pakat nimimerkkiin · Medium
**Sijainti:** T-098-kortti ("ownerUid == auth.uid"), PRIVACY-kohta "pseudonyyminen tunniste" · **Tehtävä:** T-098
**Toistaminen:** 1) Käyttäjä julkaisee pakan A nimimerkillä "Matti Meikäläinen" ja pakan B nimettömänä. 2) Kuka tahansa listaa julkiset pakat ja ryhmittelee ne `ownerUid`:n mukaan.
**Odotettu:** "Nimetön" tarkoittaa, ettei pakkaa voi yhdistää julkaisijaan. · **Havaittu (suunnitelmassa):** B yhdistyy Matti Meikäläiseen. Lisäksi uid on pysyvä tunniste, joka yhdistää kaikki käyttäjän julkaisut nyt ja myöhemmin.
**Vaikutus:** käyttäjän valinta "nimetön" pettää. GDPR:n minimoinnin vastainen (5(1)(c)): pseudonyymi tunniste julkaistaan ilman tarvetta.
**Korjausehdotus:** SR-30: julkiseen dokumenttiin ei uid:tä eikä muuta käyttäjäkohtaista vakiota (ei myöskään `sha256(uid)`), vain pakkakohtainen tiiviste. Jos käyttäjä silti haluaa uid:n näkyviin (esimerkiksi "kaikki tämän julkaisijan pakat"), se on tuotepäätös K-P9.
**Tila:** Avoin

### SEC-098-4 · Kirjautumaton listaus voi kuluttaa koko projektin lukukiintiön · Medium
**Sijainti:** suunnitelma "luku ja listaus kaikille" · **Tehtävä:** T-098
**Toistaminen:** 1) Skripti kutsuu Firestoren REST-rajapintaa julkisella API-avaimella: `runQuery` `publicDecks`, `limit 50`, silmukassa. 2) 1 000 kutsua = 50 000 lukua.
**Vaikutus:** Sparkin päiväkiintiö loppuu, ja kaikkien kirjautuneiden synkronointi ja julkiset pakat lakkaavat toimimasta seuraavaan vuorokauteen (paikalliset tiedot säilyvät). Ei laskua (Spark), mutta palvelu katkeaa. Laajentaa riskiä R-19 tunnistautumattomiin.
**Korjausehdotus:** SR-33 (sääntöjen `limit`, pieni sivukoko, välimuisti, ei `onSnapshot`), K-P11 (App Check). Säännöt eivät voi estää toistuvia kyselyjä.
**Tila:** Avoin, jäännösriski käyttäjän päätettäväksi (R-21)

### SEC-098-5 · Asiaton sisältö ilman moderointia · Low
**Sijainti:** T-098 avoin kysymys "Ilmiantaminen" · **Tehtävä:** T-098
**Toistaminen:** käyttäjä julkaisee pakan, jonka nimi tai nimimerkki on loukkaava, sisältää toisen ihmisen henkilötietoja tai mainostaa linkkiä.
**Vaikutus:** maineriski. Kolmannen osapuolen henkilötiedot julkisesti (GDPR). Ylläpitäjä huomaa sen vain, jos joku kertoo.
**Korjausehdotus:** SR-38 (julkaisun ehto ja varoitus), SR-42 (poistopyyntöjen yhteystieto ja ohje ylläpitäjälle). Linkit eivät ole klikattavia (SR-37). Ilmiantotoiminto on K-P10.
**Tila:** Avoin, jäännösriski R-23

### SEC-098-6 · Orvot julkiset kopiot · Low
**Sijainti:** synkronointi (`firestoreCloudStore.commit`, `deleteAll`) · **Tehtävä:** T-098
**Toistaminen:** 1) Pakka on julkinen. 2) Käyttäjä poistaa pakan offline-tilassa toisella laitteella tai sovellus kaatuu yksityisen ja julkisen poiston välissä. 3) Julkinen kopio jää, eikä sitä löydy enää pakkalistan kautta.
**Vaikutus:** käyttäjän poistama tieto jää julkiseksi, eikä käyttäjä voi poistaa sitä itse (GDPR 17).
**Korjausehdotus:** SR-35 ja SR-36: julkinen kopio poistetaan ennen yksityistä. Julkisuustila tallennetaan yksityiseen pakkaan, jotta synkronointi tietää, mikä on julkaistu. Tilin poisto poistaa ensin kaikki `pubId`:t kaikista tunnetuista `deckId`:istä. Jäännös: ylläpitäjä poistaa konsolista pyynnöstä (SR-42).
**Tila:** Avoin, jäännösriski R-22

### SEC-098-7 · `hashing.sha256` ja `toHexString` säännöissä on varmistettava · Info
**Sijainti:** liite `SEC-098-liite-firestore.rules` · **Tehtävä:** T-098
**Toistaminen:** repossa ei ole sääntöjen testejä eikä emulaattoria.
**Korjausehdotus:** Koodari laskee asiakkaalla `pubId`:n Web Cryptolla (`crypto.subtle.digest('SHA-256', …)`, pienet heksat). Käyttäjä deployaa säännöt testiprojektiin (`--project test`) ja testaa Rules Playgroundissa tai testisivustolla: oma luonti, päivitys ja poisto onnistuu, ja toisen tilin päivitys, poisto ja valtaus hylätään. Jos tiiviste ei toimi säännöissä, käytetään SEC-098-1:n varavaihtoehtoa ja päätetään K-P9:stä.
**Tila:** Avoin

## Turvavaatimukset SR-30–SR-42 (ehdotukset hyväksymiskriteereiksi, PM hyväksyy)
- **SR-30 Omistajuus ilman julkista uid:tä.** `pubId = hex(sha256(uid + ":" + deckId))`. Säännöt: luonti, päivitys ja poisto vain, kun `pubId` vastaa `request.auth.uid`:sta laskettua arvoa. Päivityksessä `deckId` ja `publishedAt` eivät muutu. Julkisessa dokumentissa ei ole uid:tä, sähköpostia, Google-nimeä eikä käyttäjäkohtaista vakiota.
- **SR-31 Kenttien muoto säännöissä.** `hasOnly` tarkalla avainjoukolla (taulukko yllä). Jokaiselle merkkijonolle pituusraja ja `deck`-kentälle regex. `updatedAt == request.time`, ja luonnissa `publishedAt == request.time`. Ei listoja eikä karttoja julkisessa dokumentissa.
- **SR-32 Julkinen sisältö = jakolinkin sisältö.** `deck` muodostetaan `encodeDeckShare`:lla. Kopioon ei mene `createdAt`, paikallisia muistiinpanoja, kokoelmatietoa eikä muuta tilitietoa. Lukunäkymä käyttää samaa `decodeDeckShare`-jäsennintä ja tekstijäsennintä kuin jakolinkki (SR-17).
- **SR-33 Listaus ja kiintiöt.** Säännöissä `allow list: if request.query.limit <= 50`. Sovelluksessa sivukoko on enintään 24, ja järjestys `orderBy('updatedAt', 'desc')` tehdään kursorisivutuksella (`startAfter`). Ei `onSnapshot`-kuuntelijaa. Tulos pidetään muistissa istunnon ajan (välilehden vaihto ei hae uudelleen), ja uudelleenhaku tapahtuu vain painikkeesta tai sivun uudelleenlatauksessa. Yksittäinen pakka haetaan `get`:llä.
- **SR-34 Kirjoitustahti.** Julkinen kopio kirjoitetaan viivästettynä: aikaisintaan 15 s viimeisen muutoksen jälkeen tai editorista poistuttaessa, ei jokaisella näppäilyllä. Säännöissä päivitys sallitaan aikaisintaan 10 s edellisestä (`request.time > resource.data.updatedAt + duration.value(10, 's')`). Asiakas yrittää hylätyn kirjoituksen uudelleen myöhemmin eikä ilmoita siitä virheenä.
- **SR-35 Yksityiseksi ja poisto.** Kun pakka muutetaan yksityiseksi tai poistetaan, julkinen kopio poistetaan ennen yksityistä pakkaa. Jos poisto epäonnistuu (offline), se jää jonoon, ja editori näyttää tilan "Julkaisu poistuu, kun yhteys palaa". Julkisuustila ja nimimerkkivalinta tallennetaan yksityiseen pakkaan, jotta ne synkronoituvat. Tämä vaatii myös `isDeckDoc`-säännön muutoksen (Arkkitehti, liite).
- **SR-36 Tilin poisto.** `deleteAll` poistaa ensin kaikkien pilven ja paikallisten pakkojen `pubId`:t (poisto olemattomasta dokumentista on sallittu ja ilmainen), sitten yksityiset tiedot ja lopuksi Auth-käyttäjän (nykyinen järjestys `AccountMenu`:ssa säilyy). Testi: tilin poiston jälkeen yhtään käyttäjän julkista pakkaa ei ole jäljellä.
- **SR-37 Turvallinen renderöinti.** Kaikki julkisen dokumentin kentät validoidaan luettaessa (`publicDeck.ts`: `cleanText`, pituudet ja tyypit). Virheellinen dokumentti ohitetaan, eikä koko lista kaadu. Teksti renderöidään vain React-tekstinä: ei `dangerouslySetInnerHTML`, ei datasta muodostettuja `href`-, `src`- tai `style`-arvoja. Nimimerkki ja nimi katkaistaan näkymässä (CSS `overflow-wrap`), jotta pitkä rivi ei riko asettelua. Korttiavaimet tarkistetaan korttidataa vasten, ja tuntemattomat kortit ohitetaan kuten jakolinkissä.
- **SR-38 Julkaisun käyttöliittymä.** Ennen ensimmäistä julkaisua näytetään vahvistus: "Pakan nimi, kortit ja nimimerkki näkyvät kaikille internetissä. Älä kirjoita niihin omia tai muiden henkilötietoja. Julkaisun voi perua, mutta muut ovat voineet jo tallentaa sen." Nimimerkkikentän ohje: "Älä käytä oikeaa nimeäsi, jos et halua." Nimimerkki ei ole oletuksena näkyvissä (ruksi pois päältä). Nimimerkkiä ei esitäytetä Google-nimellä. Rivillä nimimerkki näytetään selvästi käyttäjän tekstinä (esim. "Julkaisija: …"), ei virallisen näköisenä merkkinä.
- **SR-39 Tallenna omaksi.** Luo aina uuden yksityisen pakan uudella `crypto.randomUUID()`-tunnisteella. Ei koskaan ylikirjoita olemassa olevaa pakkaa, ei kopioi julkisuustilaa, nimimerkkiä, `pubId`:tä eikä `deckId`:tä. Pakkarajat (SR-11) pätevät.
- **SR-40 Sääntöjen rajaus ja deploy.** Uusi `match /publicDecks/{pubId}` on juuritasolla, ei `{document=**}`-osumaa. `users/*`-säännöt ennallaan (paitsi SR-35:n `isDeckDoc`-lisäys). Sama tiedosto kumpaankin projektiin (D-017). Käyttäjä deployaa testiprojektiin ennen testiin yhdistämistä ja tuotantoon ennen `/julkaise`:a, ja SEC-098-7:n käsitestit tehdään testiprojektissa. Koodi, joka kirjoittaa `publicDecks`-kokoelmaan, ei saa päätyä tuotantoon ennen tuotannon sääntöjen deployta.
- **SR-41 Hakukoneet ja jakaminen.** Julkisen pakan lukunäkymä ja lista saavat `<meta name="robots" content="noindex">` (tai vastaavan) dynaamisesti, ellei käyttäjä päätä toisin (K-P12). Lokeihin tai konsoliin ei kirjoiteta `pubId`:tä yhdessä uid:n kanssa (SR-27).
- **SR-42 Ylläpitäjän poistoreitti.** PRIVACY.md:hen ja Tietoa-sivulle ohje: asiattoman pakan tai omien tietojen poistopyyntö sähköpostilla rekisterinpitäjälle (K-P7). Ylläpitäjän ohje (docs/guides tai RUNBOOK): dokumentin poisto Firebase-konsolista molemmista projekteista.

## Jäännösriskit ja käyttäjän päätökset (PM:n kautta)
| ID | Kysymys | Digiturvan ehdotus | Blokkaako? |
|---|---|---|---|
| K-P9 | Saako julkisessa pakassa olla julkaisijan pysyvä tunniste (uid), jotta "saman julkaisijan pakat" voidaan näyttää? | Ei. Nimettömyys ja minimointi (SEC-098-3). Myöhemmin voi lisätä valinnaisen julkaisijaprofiilin, jos tarvitaan. | Kyllä, tietomalli |
| K-P10 | Julkaistaanko ilman ilmiantotoimintoa (R-23)? | Kyllä ensimmäisessä versiossa, kun SR-38 ja SR-42 ovat kunnossa. Ilmiantaminen IDEAS:iin. | Ei |
| K-P11 | Hyväksytäänkö R-21 (kuka tahansa voi kirjautumatta kuluttaa päivän lukukiintiön ja katkaista synkronoinnin päiväksi)? Vaihtoehto: App Check (reCAPTCHA v3, maksuton), joka on uusi palvelu ja konfiguraatio. | Hyväksytään ensimmäisessä versiossa, koska kustannuksia ei synny ja paikallinen data säilyy. App Check otetaan käyttöön, jos väärinkäyttöä havaitaan (Firebase-konsolin käyttökäyrä). | Ei |
| K-P12 | Saavatko hakukoneet indeksoida julkiset pakat? | Ei (SR-41), koska nimimerkki voi olla oikea nimi. | Ei |

**Uudet riskit SECURITY.md:hen:** R-21 (kiintiön kulutus kirjautumatta), R-22 (orvot julkiset kopiot), R-23 (asiaton sisältö ja esiintyminen ilman moderointia).

## PRIVACY.md-muutosehdotus (Digiturva ei muokannut tiedostoa)
Lisätään luku **11. Julkiset pakat (T-098, D-025)**:
- **11.1 Yhteenveto:** julkaiseminen on vapaaehtoista, pakkakohtaista ja vaatii Google-kirjautumisen. Julkaistu tieto näkyy kaikille internetissä ilman kirjautumista. Google-tilin nimeä, sähköpostia tai uid:tä ei julkaista.
- **11.2 Tietoinventaario (rivit 20–22):**

| # | Tieto | Lähde | Tarkoitus | Missä | Kuka pääsee | Henkilötieto? | Minimointi |
|---|---|---|---|---|---|---|---|
| 20 | Julkinen pakka: nimi, legendit, korttimäärä, kortit, julkaisu- ja päivitysaika | Käyttäjä julkaisee | Pakan jakaminen muille | Firestore `publicDecks/{pubId}` (tuotanto `eur3`, testi `europe-north1`) | **Kaikki internetissä**, projektin omistaja, Google käsittelijänä | Mahdollisesti (pakan nimi voi sisältää nimen) | Vain jakolinkin sisältö (SR-32), varoitus julkaistaessa (SR-38) |
| 21 | Nimimerkki | Käyttäjä kirjoittaa itse, valinnainen | Julkaisijan näyttäminen | Kuten 20 sekä yksityinen pakka `users/{uid}/decks` | Kaikki, jos "Näytä nimimerkkini" on valittu | **Kyllä**, jos käyttäjä kirjoittaa oikean nimensä | 1–30 merkkiä, oletuksena ei näkyvissä, ei esitäytetä Googlen nimellä |
| 22 | `pubId` (pakkakohtainen tiiviste uid:stä ja pakan tunnisteesta) ja `deckId` | Sovellus | Omistajan oikeuksien tarkistus | Kuten 20 | Kaikki | Pseudonyymi, mutta ei yhdistettävissä käyttäjään eikä saman käyttäjän muihin pakkoihin ilman uid:tä | Ei uid:tä eikä käyttäjäkohtaista vakiota (SR-30) |

- **11.3 Käsittelyperuste (ehdotus, ei oikeudellinen kannanotto):** käyttäjän oma pyyntö julkaista (palvelun tarjoaminen pyynnöstä). Kerrotaan selosteessa ja julkaisuvahvistuksessa. Ikäraja 16 vuotta pätee (D-016).
- **11.4 Säilytys ja poisto:** julkinen kopio säilyy, kunnes käyttäjä muuttaa pakan yksityiseksi, poistaa pakan tai poistaa tilin tiedot (SR-35, SR-36). Kolmansien osapuolten tallentamia kopioita ei voi poistaa (kerrotaan). Hakukoneindeksointi estetään (SR-41, K-P12). Orvot kopiot ja muiden julkaisemat omat tiedot poistetaan pyynnöstä rekisterinpitäjälle (SR-42).
- **11.5 Evästeet:** ei muutosta. Julkisten pakkojen lukeminen kirjautumatta lataa Firestore-SDK:n ja ottaa yhteyden `firestore.googleapis.com`:iin. **Huom.:** tämä muuttaa luvun 10.1 lupausta "ilman kirjautumista selain ei lataa Firebasen koodia eikä ota yhteyttä Googleen". Lause korjataan muotoon "…paitsi kun avaat Julkiset pakat -välilehden", ja rivin 19 (IP-osoite Googlelle) "Kuka pääsee" -sarakkeeseen lisätään myös kirjautumattomat julkisten pakkojen lukijat. Suositus: SDK ladataan vasta, kun Julkiset pakat -välilehti tai julkinen pakka avataan.
- **11.6 Seloste:** lisätään kappale julkisista pakoista (mitä näkyy, kenelle, miten poistetaan, ettei muiden kopioita voi poistaa).
- **Muutosloki:** "2026-10-06 Digiturva (SEC-098): luku 11 julkisista pakoista, luvun 10.1 lause Firebase-yhteydestä."

## Tarkistetut alueet, ei löydöksiä
- Nykyiset `users/*`-säännöt: listaus vain omistajalle, ei `{document=**}`-osumaa. T-098 ei avaa niitä.
- `cleanText` poistaa ohjausmerkit ja bidi- ja nollaleveysmerkit (`UNSAFE_CHARACTERS`). Riittää nimimerkille ja nimelle (näköiskirjaimet ovat S2:n jäännös).
- Jakolinkin koodaus (`deckShare.ts`): kokoraja ennen dekoodausta, base64url-regex, `fatal`-UTF-8. Sopii julkisen pakan sisällöksi sellaisenaan.
- `deckId` on `crypto.randomUUID()` ja säännöt hyväksyvät `^[A-Za-z0-9_-]{1,64}$`: ei arvattava eikä kerro käyttäjästä.
- `dangerouslySetInnerHTML` ja `innerHTML`: ei esiintymiä `src`:ssä.
- Riippuvuudet: suunnitelma ei vaadi uusia (`firebase@12.19.0` riittää). `npm audit` ajetaan katselmoinnissa, jos `package.json` muuttuu.
