# TASKS

Tilat: Backlog → Ready → In Progress → Review → Testing → Done (rules.md 7). Blocked merkitään erikseen.

| ID | Otsikko | MVP | Prioriteetti | Omistaja | Tila | Katselmoinnit |
|---|---|---|---|---|---|---|
| T-000 | Projektin alustus ja julkaisuputki | 0 | Must | PM | Done | – |
| T-001 | Kävelevä luuranko: korttilista rajapinnasta näytölle | 0 | Must | Koodari | Done | Arkkitehti, Digiturva, UX, Testikäyttäjä, Dokumentoija |
| T-002 | [velka] GitHub Actionit lukittu commit-tunnisteeseen ja Dependabot käyttöön (R-3) | 1 | Could | Koodari | Backlog | Digiturva |
| T-003 | ~~Korttidatan välimuisti (vaatii ADR:n)~~ → korvattu, katso T-026 (D-012) | 1 | Should | Arkkitehti → Koodari | Peruttu | – |
| T-004 | [velka] `npm test` ja `npm run lint` PR-workflowhun, firebase.json-otsakkeiden ja CSP:n yhdenmukaisuustesti (ARCH-003) ja `persist-credentials: false` (SEC-003) | 1 | Must | Koodari | Backlog | Digiturva (SR-9) |
| T-005 | [velka] ESLintin saavutettavuusliitännäinen, kun ESLint 10 -yhteensopiva versio on saatavilla | 2 | Could | Koodari | Backlog | UX |
| T-006 | [velka] Keskeneräisten pyyntöjen peruutus epäonnistumisen jälkeen ja testityyppien erottaminen sovelluksen tsconfigista | 1 | Could | Koodari | Backlog | – |
| T-007 | [velka] SR-1:n lint-säännön kiertotiet suljettava (SEC-002) ennen rules_text-muotoilua | 1 | Should | Koodari | Backlog | Digiturva |
| T-008 | Virhe- ja osittaisen tilan parannukset: kortit säilyvät uusintayrityksessä (B-001), fokus tuplaklikkauksessa (B-016), skipped-laskenta (B-003), virheteksti lajin mukaan (B-006), hinnan järkevyystarkistus (B-009) | 1 | Should | Koodari | Backlog | UX, Sisällöntuottaja, Testikäyttäjä |
| T-009 | Hostingin kovennus: noscript, välimuistiotsakkeet (myös `index.html` `Cache-Control: no-cache`, SEC-011) ja puuttuvien assettien 404 (B-004), Firebase-API-avaimen rajaus (B-010) ennen datatallennusta | 1 | Should | Koodari | Backlog | Digiturva (SR-9) |
| T-010 | Haku ja suodatus korttilistaan (nimi, tyyppi, väri) | 1 | Must | Koodari | Done | UX, Sisällöntuottaja, Testikäyttäjä |
| T-011 | Tietomalli ja paikallinen tallennuskerros (kokoelma, pakat), valmius Firebaseen ja painoksiin (D-007) | 1 | Must | Arkkitehti → Koodari | Done | Arkkitehti, Digiturva |
| T-012 | Kokoelma: omistettujen korttien ja määrien merkintä helposti, ilmoitus "tiedot vain tässä selaimessa" (R-10) sekä newer-version-, reset- ja kirjoitus estetty -ilmoitukset (SEC-007) | 1 | Must | Koodari | Done | UX, Digiturva (Testikäyttäjä ja Dokumentoija MVP-1:n lopussa, D-009) |
| T-013 | Pakanrakennus: luonti, nimeäminen, muokkaus, poisto, laillisuussäännöt ja kortin pakat | 1 | Must | Koodari | Done | UX, Sisällöntuottaja, Testikäyttäjä |
| T-014 | Pakkalistan tuonti (teksti ja .txt) ja raportti: puuttuvat kortit ja missä pakoissa tarvittavat kortit ovat (SR-17) | 1 | Must | Koodari | Backlog (T-013) | UX, Digiturva, Sisällöntuottaja, Testikäyttäjä |
| T-015 | Pakan vienti ja tuonti .json- ja .txt-muodossa (varmuuskopio ja jakaminen, SR-18–SR-19) | 1 | Must | Koodari | Backlog (T-013, T-014) | Arkkitehti, Digiturva, UX, Testikäyttäjä |
| T-016 | [velka] `.claude/**` pois Vitestin ja ESLintin piiristä, valinnaisesti SEC-009 ja SEC-010 (document.cookie lintiin) | 1 | Should | Koodari | Backlog | – |
| T-017 | [velka] `api/mapCard.ts`:n apufunktiot `domain/validate.ts`:stä (T-011:n koodikatselmoinnin suositus) | 1 | Could | Koodari | Backlog | – |
| T-018 | Mobiilin kompakti suodatinlomake: tulos näkyviin pienellä näytöllä (B-011, UX-006), sarakkeiden rivitys (UX-003, B-002) | 2 | Should | Koodari | Backlog | UX |
| T-019 | [velka] Kokoelman määrämuutos renderöi koko taulukon: mittaa ja tarvittaessa `memo` (T-012:n koodikatselmoinnin suositus) | 1 | Could | Koodari | Backlog | – |
| T-020 | [velka] Painallussarjan osittain onnistunut tallennus kerrotaan ruudunlukijalle virheen lisäksi (T-012:n koodikatselmoinnin suositus) | 2 | Could | Koodari | Backlog | UX |
| T-021 | Ulkoasu: Cyberpunk 2077 -henkinen visuaalinen ilme, käytettävyys ensin (D-010) | 1 | Must | UX → Koodari | Done | UX (Digiturva vain firebase.jsonin tai riippuvuuksien muuttuessa) |
| T-022 | [velka] Hakukentän tyhjennyspainikkeen (selaimen oma ×) koko ja teemoitus (UX-010) | 2 | Could | Koodari | Backlog | UX |
| T-023 | Leveä asettelu suurella tekstillä: 640 px + teksti 200 % vierittyy vaakasuunnassa 224 px (UX-008:n jatko, esim. container query) | 2 | Should | Koodari | Backlog | UX |
| T-024 | [velka] Satunnaisesti aikakatkaistuva testi "formats large counts the Finnish way" (1 024 riviä) koko sarjan kuormassa | 1 | Should | Koodari | Backlog | – |
| T-025 | Teemavalitsin: tumma oletuksena, käyttäjä voi vaihtaa (D-012) | 1 | Must | UX → Koodari | Done | UX, Digiturva (kevyt) |
| T-026 | Korttidata sovelluksen mukana, ei hakua joka käynnillä (D-012, korvaa T-003:n) | 1 | Must | Arkkitehti → Koodari | Done | Digiturva, UX tarvittaessa |
| T-027 | Korttikuvat näkyviin käyttäjän 151 kuvan paketista (D-012) | 1 | Must | Arkkitehti → UX → Koodari | Done | UX, Digiturva |
| T-028 | [velka] Teeman vaihdon siirtymät ja reduced-motion-sääntö: `transition: none` reduce-tilassa ja ei 0,12 s:n siirtymiä teeman vaihdossa (UX-005-2, UX-005-3) | 2 | Could | Koodari | Backlog | UX |
| T-029 | [velka] `.claude/` pois ESLintin ja Vitestin piiristä, jotta worktreet eivät riko `npm run lint`/`npm test`:iä pääkansiossa (T-025:n koodikatselmointi). Tehdään T-026:n jälkeen (sama konfiguraatio). | 1 | Should | Koodari | Backlog (T-026) | – |
| T-030 | [velka] Sivun hyppy, kun korttidialogi avautuu: `html { scrollbar-gutter: stable }` (UX-040) | 2 | Could | Koodari | Backlog | UX |
| T-031 | [velka] Ison korttikuvan latausvirhe nollataan dialogin sulkeutuessa, jotta uusi yritys on mahdollinen (UX-041) | 2 | Could | Koodari | Backlog | – |
| T-032 | [velka] `/public/*.webp` .gitignoreen, jotta alkuperäiset kuvat eivät päädy repoon tai paikalliseen buildiin (SEC-019, L-005) | 1 | Should | Koodari | Backlog | – |
| T-033 | Kevyt toimintamalli tokenien säästämiseksi (D-014) | – | Must | PM | Done | – |
| T-034 | Korttiruudukko: iso kuva, nimi, tyyppi, hinta, power, RAM ja kokoelma samassa laatikossa | 1 | Must | Koodari | Done | PM tarkistaa esikatselun (D-014) |
| T-035 | Hienosäätö: +/−-kontrolli, hillitty kokoelmatila (playset), dialogin × | 1 | Must | Koodari | Done | PM esikatselu (D-014) |
| T-036 | Englanninkieliset pelitermit, värillinen tyyppimerkki, keskitetty kokoelmakontrolli, hillitympi reuna | 1 | Must | PM (pieni, D-014) | Done | – |
| T-037 | Keltainen omistusreuna, want-lista (Puuttuvat), rarity korttiin ja suodattimiin | 1 | Must | Koodari (D-014) | Done | Sisällöntuottaja: tyhjän kokoelman ohjeteksti MVP-1:n lopussa |
| T-038 | Tiivis yläosa: pysyvä tallennus ikonina yläpalkissa, tiiviit suodatinchipit | 1 | Must | Koodari (D-014) | Done | UX MVP-1:n lopussa |
| T-039 | Teemavalitsin pelkkänä aurinko- ja kuu-ikonina | 1 | Must | PM (pieni, D-014) | Done | – |
| T-040 | Selaus ja muokkaus erilleen (Muokkaa kokoelmaa -kytkin), kompakti taulukkonäkymä | 1 | Must | Koodari (D-014) | Done | UX ja Sisällöntuottaja MVP-1:n lopussa (uudet tekstit) |
| T-041 | [velka] Pakkaeditorin rivit tiiviimmiksi (nyt noin 130 px per kortti) ja DeckEditor.tsx:n pilkkominen | 1 | Should | Koodari | Backlog | UX |
| T-042 | [velka] Pakkaeditori kahdessa välilehdessä: viimeinen tallennus voittaa (storage-tapahtuma tai versiotarkistus) | 2 | Could | Koodari | Backlog | – |
| T-043 | [velka] Pakan nimikenttiin maxLength=100 (SEC-007 Low) | 2 | Could | Koodari | Backlog | – |
