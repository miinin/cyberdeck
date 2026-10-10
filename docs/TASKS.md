# TASKS

Tilat: Backlog → Ready → In Progress → Review → Testing → Done (rules.md 7). Blocked merkitään erikseen.

| ID | Otsikko | MVP | Prioriteetti | Omistaja | Tila | Katselmoinnit |
|---|---|---|---|---|---|---|
| T-000 | Projektin alustus ja julkaisuputki | 0 | Must | PM | Done | – |
| T-001 | Kävelevä luuranko: korttilista rajapinnasta näytölle | 0 | Must | Koodari | Done | Arkkitehti, Digiturva, UX, Testikäyttäjä, Dokumentoija |
| T-002 | [velka] GitHub Actionit lukittu commit-tunnisteeseen ja Dependabot käyttöön (R-3) | 1 | Could | Koodari | Backlog | Digiturva |
| T-003 | ~~Korttidatan välimuisti (vaatii ADR:n)~~ → korvattu, katso T-026 (D-012) | 1 | Should | Arkkitehti → Koodari | Peruttu | – |
| T-004 | [velka] `npm test` ja `npm run lint` PR-workflowhun, firebase.json-otsakkeiden ja CSP:n yhdenmukaisuustesti (ARCH-003) ja `persist-credentials: false` (SEC-003) | 1 | Must | Koodari | Done | Digiturva (SR-9) |
| T-005 | [velka] ESLintin saavutettavuusliitännäinen, kun ESLint 10 -yhteensopiva versio on saatavilla | 2 | Could | Koodari | Backlog | UX |
| T-006 | [velka] Keskeneräisten pyyntöjen peruutus epäonnistumisen jälkeen ja testityyppien erottaminen sovelluksen tsconfigista | 1 | Could | Koodari | Backlog | – |
| T-007 | [velka] SR-1:n lint-säännön kiertotiet suljettava (SEC-002) ennen rules_text-muotoilua | 1 | Should | Koodari | Backlog | Digiturva |
| T-008 | Virhe- ja osittaisen tilan parannukset: kortit säilyvät uusintayrityksessä (B-001), fokus tuplaklikkauksessa (B-016), skipped-laskenta (B-003), virheteksti lajin mukaan (B-006), hinnan järkevyystarkistus (B-009) | 1 | Should | Koodari | Done (B-003, B-009 korjattu; B-001, B-006, B-016 vanhentuneet D-012:n myötä) | UX, Sisällöntuottaja, Testikäyttäjä |
| T-009 | Hostingin kovennus: noscript, välimuistiotsakkeet (myös `index.html` `Cache-Control: no-cache`, SEC-011) ja puuttuvien assettien 404 (B-004), Firebase-API-avaimen rajaus (B-010) ennen datatallennusta | 1 | Should | Koodari | Done (T-086: noscript, index.html no-cache, 404; API-avaimen rajaus todennettu 2026-10-09, R-14) | Digiturva (SR-9) |
| T-010 | Haku ja suodatus korttilistaan (nimi, tyyppi, väri) | 1 | Must | Koodari | Done | UX, Sisällöntuottaja, Testikäyttäjä |
| T-011 | Tietomalli ja paikallinen tallennuskerros (kokoelma, pakat), valmius Firebaseen ja painoksiin (D-007) | 1 | Must | Arkkitehti → Koodari | Done | Arkkitehti, Digiturva |
| T-012 | Kokoelma: omistettujen korttien ja määrien merkintä helposti, ilmoitus "tiedot vain tässä selaimessa" (R-10) sekä newer-version-, reset- ja kirjoitus estetty -ilmoitukset (SEC-007) | 1 | Must | Koodari | Done | UX, Digiturva (Testikäyttäjä ja Dokumentoija MVP-1:n lopussa, D-009) |
| T-013 | Pakanrakennus: luonti, nimeäminen, muokkaus, poisto, laillisuussäännöt ja kortin pakat | 1 | Must | Koodari | Done | UX, Sisällöntuottaja, Testikäyttäjä |
| T-014 | Pakkalistan tuonti (teksti ja .txt) ja raportti: puuttuvat kortit ja missä pakoissa tarvittavat kortit ovat (SR-17) | 1 | Must | Koodari | Done | UX, Digiturva, Sisällöntuottaja, Testikäyttäjä |
| T-015 | Pakan vienti ja tuonti .json- ja .txt-muodossa (varmuuskopio ja jakaminen, SR-18–SR-19) | 1 | Must | Koodari | Done | Arkkitehti, Digiturva, UX, Testikäyttäjä |
| T-016 | [velka] `.claude/**` pois Vitestin ja ESLintin piiristä, valinnaisesti SEC-009 ja SEC-010 (document.cookie lintiin) | 1 | Should | Koodari | Backlog | – |
| T-017 | [velka] `api/mapCard.ts`:n apufunktiot `domain/validate.ts`:stä (T-011:n koodikatselmoinnin suositus) | 1 | Could | Koodari | Backlog | – |
| T-018 | Mobiilin kompakti suodatinlomake: tulos näkyviin pienellä näytöllä (B-011, UX-006), sarakkeiden rivitys (UX-003, B-002) | 2 | Should | Koodari | Done (T-050, T-087) | UX |
| T-019 | [velka] Kokoelman määrämuutos renderöi koko taulukon: mittaa ja tarvittaessa `memo` (T-012:n koodikatselmoinnin suositus) | 1 | Could | Koodari | Backlog | – |
| T-020 | [velka] Painallussarjan osittain onnistunut tallennus kerrotaan ruudunlukijalle virheen lisäksi (T-012:n koodikatselmoinnin suositus) | 2 | Could | Koodari | Backlog | UX |
| T-021 | Ulkoasu: Cyberpunk 2077 -henkinen visuaalinen ilme, käytettävyys ensin (D-010) | 1 | Must | UX → Koodari | Done | UX (Digiturva vain firebase.jsonin tai riippuvuuksien muuttuessa) |
| T-022 | [velka] Hakukentän tyhjennyspainikkeen (selaimen oma ×) koko ja teemoitus (UX-010) | 2 | Could | Koodari | Backlog | UX |
| T-023 | Leveä asettelu suurella tekstillä: 640 px + teksti 200 % vierittyy vaakasuunnassa 224 px (UX-008:n jatko, esim. container query) | 2 | Should | Koodari | Done (T-023: puhelimen listarivi rivittyy, pakkaeditorin + SB rivittyy kapealla; 640 px + teksti 200 % ei vaakavieritystä missään näkymässä) | UX |
| T-024 | [velka] Satunnaisesti aikakatkaistuva testi "formats large counts the Finnish way" (1 024 riviä) koko sarjan kuormassa | 1 | Should | Koodari | Done (T-004) | – |
| T-025 | Teemavalitsin: tumma oletuksena, käyttäjä voi vaihtaa (D-012) | 1 | Must | UX → Koodari | Done | UX, Digiturva (kevyt) |
| T-026 | Korttidata sovelluksen mukana, ei hakua joka käynnillä (D-012, korvaa T-003:n) | 1 | Must | Arkkitehti → Koodari | Done | Digiturva, UX tarvittaessa |
| T-027 | Korttikuvat näkyviin käyttäjän 151 kuvan paketista (D-012) | 1 | Must | Arkkitehti → UX → Koodari | Done | UX, Digiturva |
| T-028 | [velka] Teeman vaihdon siirtymät ja reduced-motion-sääntö: `transition: none` reduce-tilassa ja ei 0,12 s:n siirtymiä teeman vaihdossa (UX-005-2, UX-005-3) | 2 | Could | Koodari | Backlog | UX |
| T-029 | [velka] `.claude/` pois ESLintin ja Vitestin piiristä, jotta worktreet eivät riko `npm run lint`/`npm test`:iä pääkansiossa (T-025:n koodikatselmointi). Tehdään T-026:n jälkeen (sama konfiguraatio). | 1 | Should | Koodari | Done (T-004) | – |
| T-030 | [velka] Sivun hyppy, kun korttidialogi avautuu: `html { scrollbar-gutter: stable }` (UX-040) | 2 | Could | Koodari | Done (T-084) | UX |
| T-031 | [velka] Ison korttikuvan latausvirhe nollataan dialogin sulkeutuessa, jotta uusi yritys on mahdollinen (UX-041) | 2 | Could | Koodari | Backlog | – |
| T-032 | [velka] `/public/*.webp` .gitignoreen, jotta alkuperäiset kuvat eivät päädy repoon tai paikalliseen buildiin (SEC-019, L-005) | 1 | Should | Koodari | Done (T-004) | – |
| T-033 | Kevyt toimintamalli tokenien säästämiseksi (D-014) | – | Must | PM | Done | – |
| T-034 | Korttiruudukko: iso kuva, nimi, tyyppi, hinta, power, RAM ja kokoelma samassa laatikossa | 1 | Must | Koodari | Done | PM tarkistaa esikatselun (D-014) |
| T-035 | Hienosäätö: +/−-kontrolli, hillitty kokoelmatila (playset), dialogin × | 1 | Must | Koodari | Done | PM esikatselu (D-014) |
| T-036 | Englanninkieliset pelitermit, värillinen tyyppimerkki, keskitetty kokoelmakontrolli, hillitympi reuna | 1 | Must | PM (pieni, D-014) | Done | – |
| T-037 | Keltainen omistusreuna, want-lista (Puuttuvat), rarity korttiin ja suodattimiin | 1 | Must | Koodari (D-014) | Done | Sisällöntuottaja: tyhjän kokoelman ohjeteksti MVP-1:n lopussa |
| T-038 | Tiivis yläosa: pysyvä tallennus ikonina yläpalkissa, tiiviit suodatinchipit | 1 | Must | Koodari (D-014) | Done | UX MVP-1:n lopussa |
| T-039 | Teemavalitsin pelkkänä aurinko- ja kuu-ikonina | 1 | Must | PM (pieni, D-014) | Done | – |
| T-040 | Selaus ja muokkaus erilleen (Muokkaa kokoelmaa -kytkin), kompakti taulukkonäkymä | 1 | Must | Koodari (D-014) | Done | UX ja Sisällöntuottaja MVP-1:n lopussa (uudet tekstit) |
| T-041 | [velka] Pakkaeditorin rivit tiiviimmiksi (nyt noin 130 px per kortti) ja DeckEditor.tsx:n pilkkominen | 1 | Should | Koodari | Done (rivit T-045:ssä; DeckEditorin pilkkominen jäljellä) | UX |
| T-042 | [velka] Pakkaeditori kahdessa välilehdessä: viimeinen tallennus voittaa (storage-tapahtuma tai versiotarkistus) | 2 | Could | Koodari | Done (T-054d) | – |
| T-043 | [velka] Pakan nimikenttiin maxLength=100 (SEC-007 Low) | 2 | Could | Koodari | Done | – |
| T-044 | Tuontiraportin ulkoasu ja Netdeck-linkkikentän tyyli: tiivis taulukko tai kuvat pelkän listan sijaan, toimintojen korostus | 2 | Should | Koodari | Yhdistetty T-051:een | UX |
| T-045 | Hiominen: tyyppimerkin kulma, värisuodatin palloina, Legend-nimen esto, yhtenäiset rivit, Power, kuvanäkymä pakkaeditoriin (sisältää T-041:n rivien tiivistyksen) | 1 | Must | Koodari | Done | PM esikatselu |
| T-046 | Pakan haku Netdeck-linkistä ja vertailu kokoelmaan (D-015) | 1 | Must | Koodari | Done | Digiturva SEC-009 |
| T-047 | [velka] Netdeck-vastauksen runko luetaan paloittain 512 kt:n rajaan asti (SEC-023), tunnistamattoman card.id:n siivous (SEC-024) | 2 | Should | Koodari | Done | Digiturva |
| T-048 | Taulukkonäkymän lajittelu sarakkeittain | 1 | Should | Koodari | Done | PM esikatselu |
| T-049 | Pakkaeditorin asettelu ja pakkalistan ulkoasu (leveä asettelu, tiivis lista, kustannuskäyrä) | 1 | Must | Koodari | Done | PM kuvakaappaukset |
| T-050 | UX-uudistus: koko leveys, korttipoimija, pakkasarake (a–c), UX-007 | 1 | Must | Koodari | Done (PR #22) | UX-007, BREAK-003, kielentarkastus |
| T-051 | Pakat-sivu ja tuontiraportti T-050:n tyyliin (sis. T-044) | 1 | Should | Koodari | Done (PR #22) | PM kuvakaappaukset, BREAK-003 |
| T-052 | Hover-esikatselun korvaus, isommat kuvat, Cost/Power/RAM-suodattimet, värilaatat, estomerkkibugi | 1 | Must | Koodari | Done | PM kuvakaappaukset |
| T-053 | Pakan tilastot (keskiarvot, Power-, RAM- ja harvinaisuusjakauma, nostotodennäköisyydet) ja testikäsi | 1 | Must | Koodari | Done | PM kuvakaappaukset, axe |
| T-054 | Google-kirjautuminen ja pakkojen ja kokoelman pilvitallennus (D-016, D-017; vaiheet a–d) | 2 | Must | Koodari (vaiheittain) | Done | Digiturva, Arkkitehti, UX, Sisällöntuottaja, Testikäyttäjä |
| T-055 | Yläpalkin järjestys (tili oikeaan ylänurkkaan) ja pysyvän selaintallennuksen napin poisto | 1 | Should | PM | Done | – |
| T-056 | Pakan jakaminen linkillä (#/jaa/<data>) | 1 | Should | Koodari | Done | Digiturva (syöte URLista) |
| T-057 | "Ylittää rajan" -merkintä vasta, kun raja on ylitetty | 1 | Must | PM | Done | – |
| T-058 | Sideboard pakkaan (tietomalli, Firestore-säännöt, editori, jako ja vienti) | 1 | Should | Koodari | Done | – (ei sääntömuutosta) |
| T-059 | RAM-suodattimeen 4 ja 5+ (4+ pois) | 1 | Must | PM | Done | – |
| T-060 | Korttien järjestysvalitsin (numero, nimi, cost, power, RAM, tyyppi, rarity; nouseva/laskeva) | 1 | Must | PM | Done | – |
| T-061 | Pakasta puuttuvat kortit listana ja .txt-latauksena (editori ja tuonti); want-liitos T-061b (PR #42) | 1 | Must | PM | Done | – |
| T-062 | Kokoelman jako linkkinä: have, want ja vertailu toisen käyttäjän kanssa | 1 | Should | PM | Done | Digiturva ✓ |
| T-063 | Jakonäkymässä tradeable, kun määrä ylittää pelisarjan | 1 | Should | PM | Done | – |
| T-064 | Want-listan tietomalli (tallennus, synkka, Firestore-säännöt) ja kokoelman jakolinkin ADR – käyttäjä päätti 2026-10-05: suunnitellaan ensin | 1 | Must | Arkkitehti | Done | Digiturva ✓ |
| T-065 | Have/Want omaksi osioksi, Kortit-näkymään yksi laskuri | 1 | Must | PM | Done | – |
| T-066 | Puuttuvien massalisäys wantiin (Kortit, Pakat, editori), select- ja suodatinpainikkeiden viimeistely | 1 | Must | PM | Done | – |
| T-067 | Have/Want kuvaruudukkona, järjestys ja kuvakoko | 1 | Must | PM | Done | – |
| T-068 | Englanninkielinen käyttöliittymä, FI/EN-valitsin (D-019) | 1 | Must | PM | Done | – |
| T-069 | Järjestysvalitsimen hillitty fokustyyli | 1 | Must | PM | Done | – |
| T-070 | Kortin klikkaus avaa tietonäkymän: kokoelma, want ja pakat | 1 | Must | PM | Done | – |
| T-071 | Pienet korjaukset: liput, suodatinsirun kulma, Jaa Have/Want, Vie ja jaa -valikko, roskakori- ja kynäikonit, laskurin keskitys | 1 | Must | PM | Done | – |
| T-072 | Korttien painokset kokoelmaan (D-020): versiot kortin tietonäkymässä, painosdata, kuvien tuonti | 1 | Must | PM | Done | Digiturva ✓ |
| T-074 | Sideboard hakulistasta ja Pinoista, setti/versio-suodatin ja yhteenveto, UX-katselmoinnin korjaukset (M1–M5, M11) | 1 | Must | PM | Done | UX ✓ |
| T-075 | Pakka-analyysi: korttiryhmän todennäköisyys vuoroittain, korvaajaehdotus puuttuville korteille | 1 | Should | PM | Done | – |
| T-076 | Viralliset versiokuvat (82 kpl, Iconic ja Nova Rare) kortin tietonäkymään, kuva-avain kortti×harvinaisuus | 1 | Must | PM | Done | – |
| T-077 | Versiot kuvituksina (D-021): galleria tietonäkymässä, haku näyttää osuvan kuvituksen, Kaikki kuvitukset -tila | 1 | Must | PM | Done | – |
| T-078 | Viralliset harvinaisuudet (Epic Rare, Secret Rare, Iconic Rare…), kielivalitsin pelkkinä lippuina | 1 | Must | PM | Done | – |
| T-079 | Viralliset harvinaisuussymbolit hover-selityksin, ylläpalkin kevyet ikonit (teema, liput, tili) | 1 | Must | PM | Done | – |
| T-080 | Logo ylänurkkaan ja faviconiksi, ei sisäisiä vieritysalueita (suodatinpaneelit, dialogit) | 1 | Must | PM | Done | – |
| T-081 | "N versiota", versioiden selausnuolet korttiruudussa, tietonäkymä mahtuu ruutuun ja tasatut laskurit, reitti #/kortti/<avain> | 1 | Must | PM | Done | – |
| T-082 | Versiokorjaukset (symboli seuraa versiota, kaikki versiot näkyvät, Rebecca), settikyltit, Kuvat/Lista, puuttuvien lisäys varmistuksella, uudet harvinaisuussymbolit, favicon-kulma, Myytävä-suodatin, harvinaisuudet 2 sarakkeessa | 1 | Must | PM | Done | – |
| T-083 | Setit ja muut tuotteet erikseen, Beta/Retail-painos kokoelmassa, olemassa olevat kortit Betaksi (D-022), versionimi pois kuvan alta | 1 | Must | PM | Done | Digiturva ✓ |
| T-084 | Ei nykimistä: vierityspalkin tila varattu, valittujen suodattimien rivi pitää korkeutensa, korttilaatikoiden tyyppirivi samalla korkeudella | 1 | Should | PM | Done | PM esikatselu ✓ |
| T-085 | Gitleaks käyttöön: pre-commit-hook (`.githooks/`, `prepare`-skripti), `.gitleaks.toml`-poikkeukset, historian skannaus (D-023) | 1 | Must | PM | Done | PM testi: estää vuotavan commitin ✓ |
| T-086 | Siivous ja hostingin kovennus (T-009:stä): TASKS-tilat ajan tasalle, `index.html` `Cache-Control: no-cache`, SPA-rewrite pois (puuttuva asset = 404, B-004), noscript | 1 | Should | PM | Done | Digiturva |
| T-087 | Mobiili: yläpalkki kahdelle riville, suodatinpaneelin loppuun "Näytä N korttia" (sulkee paneelin ja vie tuloksiin), työkalurivin kytkin vasempaan reunaan | 1 | Should | PM | Done | PM mobiilikuvat ✓ |
| T-088 | Mobiili 2: tietonäkymän versioruudut kuva vasemmalla ja laskurit samassa linjassa, Kuvakoko piiloon puhelimessa (ei vaikutusta), jakolinkin ohje painikkeen alle | 1 | Should | PM | Done | PM mobiilikuvat ✓ |
| T-089 | Esikatselukanavien kiintiö: kanavat vanhenevat 3 päivässä (oli 14 pv), 50 yhdistettyjen PR:ien vanhaa kanavaa poistettu | 1 | Must | PM | Done | Digiturva |
| T-090 | Mobiili 3: kortin tietonäkymä koko ruudun näkymänä (kiinteä otsikkorivi, kuva max 46 % korkeudesta, osiot rivinä: nimi vasemmalla, laskuri oikealla, versiot yhtenä sarakkeena); Lista-näkymä korttiriveinä ilman vaakavieritystä | 1 | Must | PM | Done | PM mobiilikuvat ✓ |
| T-091 | Mobiili 4: tietonäkymän alussa kuva ja laskurit rinnakkain, kuva koko ruudulle napautuksella ("Näytä koko ruudulla", Esc/napautus palaa); versioissa oletuksena vain varsinaiset setit, muut tuotteet "+N muuta tuotetta" -avattavana (näkyvät suoraan, jos versio ei ole setissä) | 1 | Must | PM | Done | PM mobiilikuvat ✓ |
| T-092 | Pakkaeditori ja sideboard: sideboard-rivit samanlaisiksi kuin pääpakan (yksi rivi), pienet "→ SB" / "→ Pää" / "+ SB" -painikkeet, ei sideboard-painiketta Legendeille, sääntöilmoitus kelluvana (ei sivun hyppyä) | 1 | Must | PM | Done | PM kuvat ✓ |
| T-093 | Pakan tilastot uudelleen: yleiskuva renkain (pääpakka, Legendit, sideboard, omistus) ja avainluvuin, testikäsi esiin; Cost-käyrä tyypeittäin (pylväs näyttää kortit, keskiarvomerkki); värit donitsina ja RAM väreittäin; tyyppipalkki; nostotodennäköisyydet palkkeina hetki kerrallaan; ryhmälaskuri palkein | 1 | Must | PM | Done | PM kuvat ✓ |
| T-094 | Dokumentaatio: CHANGELOG-versio ja STATUS.md ajan tasalle | 1 | Should | Dokumentoija | Done | – |
| T-096 | Pakan tilastot: Program ja Gear omilla väreillä, Eddies-kortti (myytävät vs. suositus hintarakenteen mukaan, Eddiet vuoroittain, myynti joka vuoro -todennäköisyys) (D-024) | 1 | Must | PM | Done | PM kuvat ✓ |
| T-097 | Kortit-otsikon alta pois "Kirjatut versiot" -rivi, kokoelman koko pienenä himmeänä tekstinä | 1 | Should | PM | Done | – |
| T-098 | Julkiset pakat (D-025): näkyvyys yksityinen/julkinen, oma nimimerkki, Julkiset pakat -välilehti, Firestore publicDecks | 1 | Must | PM → Koodari | Done | Digiturva SEC-098 + SEC-098b ✓, säännöt deployattu |
| T-099 | [velka] R-22: toisella laitteella poistetun tai yksityiseksi muutetun pakan julkinen kopio poistuu vasta, kun julkaissut laite avaa sovelluksen (SEC-098b-2 jäännösriski) | 2 | Could | Koodari | Backlog | Digiturva |
| T-100 | Agenttiroolien karsinta (D-026) ja promptiauditoinnin korjaukset | 1 | Should | PM | Done | – |
| T-101 | Painoksen varmistus kokoelmaan lisätessä, pakkaeditorin ongelmamerkinnät, Legend-tekstit, Sideboard Pinot-näkymään, hillitympi Gear-väri | 1 | Should | PM → Koodari | Done | PM esikatselu |
| T-102 | Proxy-tulostus: valitut kortit A4-arkeille oikeassa koossa (63 × 88 mm, 3 × 3), tulostus selaimesta | 1 | Should | PM → Koodari | Done | – |
| T-103 | Pakkaeditori 2: myytävien suositus 55–60 %, laittomaksi tekevät kortit näkyviin, Legendit osioksi, pinot värin ja tyypin mukaan | 1 | Should | PM → Koodari | Done | – |
| T-104 | Proxy-näkymän uudelleensuunnittelu: valinta vasemmalla, sticky-tulostusarkki oikealla, lento-animaatio, tiivis ohje | 1 | Should | Koodari | Done | PM esikatselu |
| T-105 | Kokoelman edistymisnäkymä: yleiskuva, setit, harvinaisuudet, värit ja tyypit, puuttuvat kortit want-listalle ja proxy-jonoon | 1 | Should | Koodari | Done | PM esikatselu |
| T-106 | Korttien skannaus kameralla: selvitys ja suunnitelma (sormenjälkitunnistus laitteella, vaiheet 0–3) | 1 | Should | Koodari | Done | Digiturva (Permissions-Policy) |
| T-107 | Mobiilinavigointi alapalkiksi: yksi rivi ylhäällä, kiinteä välilehtipalkki alhaalla | 1 | Should | Koodari | Done | PM esikatselu |
| T-108 | Skannerin näkyvyys (Kokoelma-painike, tyhjän tilan kehotus, mobiilin kelluva painike) ja jatkuva skannaus automaattisella lisäyksellä | 1 | Should | Koodari | Done | PM esikatselu |
| T-109 | Kokoelma: Myytävät-tilasto pois, näkymävalitsin ja kansionäkymä (3 × 3 -taskusivut, aukeama) | 1 | Should | Koodari | Done | PM esikatselu |
| T-110 | Pakkaeditori mobiilissa: välilehdet Pakka / Lisää kortteja, pakka näkyy ensin | 1 | Should | Koodari | Done | PM esikatselu |
| T-111 | Mobiilikorjaukset 2: navigointi ylös yhdelle riville, yksi "Lisää kortteja", näkyvyyskytkin Yksityinen ⇄ Julkinen | 1 | Should | Koodari | Done | PM esikatselu |
| T-112 | Sivustorakenne (D-028): Kokoelma = "Omat kortit" (lista ja määrien muokkaus Kokoelma-sivulla) | 1 | Should | Koodari | Done | PM esikatselu |
| T-113 | Jatkuva skannaus toimimaan: mittaus, usean kuvan varmuus, elävä palaute ja "Lisää"-ehdotus, parempi kamerakuva | 1 | Should | Koodari | Done | Digiturva (kamera) |
| T-114 | Pakkaeditorin karsinta: määrä kerran, tallennus ja vienti nimen riville, näkyvyys yhdelle riville, koristeviiva pois | 1 | Should | Koodari | Done | PM esikatselu |
| T-115 | UI-siistiminen: Kortit-sivun työkalurivi, pakkaeditorin otsikko ja yhtenäinen kytkin, korttinäkymä pakkaan, sideboardin vaakavieritys | 1 | Should | Koodari | Done | PM esikatselu |
| T-116 | Kokoelman siivous (pieni näkymäkytkin, yksi kansiosetti Beta-merkillä, omistettu kuvitus), otsikkoreunus pois, glitch kaikille sivuille, Have/Want (i)-vihjeet, proxy-tarjoukset | 1 | Should | Koodari | Done | PM esikatselu |
| T-117 | Pakat-sivun uudistus: otsikkorivi ja "+ Uusi pakka", "Tuo ▾" -valikko, kompakti Omat/Julkiset, yhtenäiset muodot, tiiviit pakkakortit | 1 | Should | Koodari | Done | – |
| T-118 | Koko sivuston UI-yhtenäisyys ja viimeistely: auditointi (UX-118) ja korjaukset | 1 | Must | UX (Opus) → Koodari | Done | PM esikatselu |
| T-119 | Skannaa suoraan pakkaan: skanneri pakkaeditorista ja Pakat-listalta, valinnat pakkaan / pakkaan ja kokoelmaan sekä pääpakka / sideboard | 1 | Should | Koodari | Done | PM esikatselu |
| T-120 | Oma kansio: Setti / Oma kansio -valinta, omistettujen korttien vapaa sijoittelu taskuihin (tallennus laitteelle), etu- ja takakansi | 1 | Should | Koodari | Done | Digiturva (tallennus) |
| T-121 | Pakka omilla korteilla: kaikkien puuttuvien kopioiden korvaajat, pelattavuusluku ja "Tee kopio omilla korteilla" | 1 | Should | Koodari | Ready | PM |
