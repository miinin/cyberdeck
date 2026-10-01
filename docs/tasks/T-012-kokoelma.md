# T-012 · Kokoelma: omistettujen korttien merkintä
**Tila:** Review · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Suunnittelu:** UX ☑ (docs/UX.md luku 6, 2026-10-01) (näkymä, tilat, mikrokopio, saavutettavuus)
**Katselmoinnit (D-009):** Koodikatselmointi ☑ · UX ☐ (käytettävyys, saavutettavuus, mikrokopio) · Digiturva ☐ (tallennettu data, syöte, SEC-007) · Testikäyttäjä: MVP-1:n lopussa · Dokumentoija: MVP-1:n lopussa
**Riippuvuudet:** T-011 (Done), T-010 (Done)
**Haara:** `t-012-kokoelma`

## Tavoite
Pelaaja merkitsee omistamansa kortit ja niiden määrät korttilistaan muutamalla painalluksella, ja tieto säilyy selaimessa. Tämä on PROJECT.md:n ominaisuuden 1 ensimmäinen puolisko ("korttilistaus, johon on äärimmäisen helppo merkitä omistetut kortit") ja pohja pakoille (T-013) ja puuttuvien korttien raportille (T-014).

## Hyväksymiskriteerit
- [ ] Jokaisen kortin rivillä on omistettujen kappaleiden määrä ja tapa muuttaa sitä (+1 ja −1 tai vastaava UX:n määrittelemä kontrolli). Yhden kortin merkitseminen omistetuksi vaatii enintään yhden painalluksen hakutuloksesta. Määrä on 0–999 (D-008), ja 0 poistaa kortin kokoelmasta.
- [ ] Määrät tallentuvat `src/storage/index.ts`:n `CollectionRepository`n kautta (SR-12) ja säilyvät sivun uudelleenlatauksessa. Toisessa välilehdessä tehty muutos päivittyy näkymään (`subscribe`).
- [ ] Listaa voi suodattaa "Vain omistetut" -valinnalla, joka toimii yhdessä T-010:n haun ja suodattimien kanssa. Näkymässä näkyy kokoelman yhteenveto (esim. eri korttien ja kappaleiden määrä).
- [ ] Näkymässä kerrotaan, että tiedot ovat vain tässä selaimessa (R-10), ja käyttäjän toimesta pyydetään pysyvä tallennus (`requestPersistentStorage`, SR-13). Pyyntö ei käynnisty automaattisesti sivun latautuessa.
- [ ] Tallennuskerroksen ilmoitukset ja virheet näytetään ymmärrettävinä teksteinä ilman teknisiä tietoja: `persistent: false` (tiedot eivät tallennu), `notices`: `reset` (myös `backupKey: null`, SEC-007), `repaired`, `newer-version`, sekä `StorageError`-lajit `quota`, `unavailable` ja `newer-version` muutoksen yhteydessä. Epäonnistunut tallennus ei näytä näytöllä määrää, jota ei tallennettu.
- [ ] Määrän muutos ilmoitetaan ruudunlukijalle, kontrollit toimivat näppäimistöllä ja 320 px:n leveydellä (kosketusalue vähintään 24 × 24 px, tavoite 44 × 44 px), ja axe ei löydä virheitä. Yksikkö- ja näkymätestit kattavat tallennuksen, virhetilat (muistivarainen tallennus `createMemoryRepositories`) ja nopeat peräkkäiset painallukset.

## Rajaukset (ei kuulu tähän)
- Painokset (alt-artit, kieliversiot), D-007
- Pakat ja "missä pakoissa kortti on" (T-013)
- Kokoelman vienti ja tuonti sekä varmuuskopioiden palautus (T-015, IDEAS.md)
- Pilvitallennus ja kirjautuminen (MVP-2)
- Mobiilin kompakti suodatinlomake (T-018)

## Huomiot suunnittelijoille
- Rajapinta: `openBrowserRepositories()` → `{ collection, decks, persistent }`. `collection.load()` → `{ value, notices }`, `setCount(card, count)`, `subscribe(listener)`. Virheet ovat `StorageError`, ja laji on `kind`-kentässä (`src/storage/types.ts`, `errors.ts`).
- Kortin avain on `Card.key` (D-008, kohta 2). Kokoelmassa voi olla avaimia, joita korttiluettelossa ei ole (nimen errata). Niitä ei poisteta. UX päättää, näytetäänkö ne (ehdotus: ei tässä tehtävässä, kunhan niitä ei hävitetä).
- Nopeat peräkkäiset painallukset: `setCount` on asynkroninen. Toteutuksen on estettävä, ettei vanhempi vastaus ylikirjoita uudempaa tilaa näytöllä.

## Työloki
### Checkpoint 2026-10-01 · PM
- Kortti määritelty, tila Ready, haara `t-012-kokoelma` tehty test-haarasta.
- Seuraava askel: UX suunnittelee kokoelmanäkymän (UX.md:n uusi luku 6). Sen jälkeen Koodari toteuttaa.

### Checkpoint 2026-10-01 · PM (UX:n avoimet kysymykset ratkaistu)
- A1, A3, A5, A6 ja A7: UX:n oletukset hyväksytty. Ne ovat käytettävyysvalintoja, jotka käyttäjä voi muuttaa myöhemmin.
- A2: sallittu. `navigator.storage.persisted()` lisätään tallennuskerroksen julkiseen rajapintaan (`src/storage/keyValueStore.ts` + `index.ts`, kuten `requestPersistentStorage`), ei käyttöliittymään suoraan (SR-12). Pieni rajapintalisäys ilman rakennemuutosta, joten Arkkitehtia ei tarvita.
- A4: tarkistettu koodista (`repositories.ts`, `backup` → `toStorageError`). Kun varmuuskopio epäonnistuu, `setCount` heittää virheen `quota` tai `unavailable` alkuperäisen syyn mukaan. Käyttöliittymä valitsee tekstin `kind`-kentän perusteella (UX.md 6.8), eikä erillistä lajia tarvita.
- Sisällöntuottaja: ei erillistä katselmointia (D-009: mikrokopio kuuluu UX:lle). Koodari lisää UX.md 6.14:n termit CONTENT.md:n sanastoon (sovittu tässä kortissa).
- Seuraava askel: Koodari toteuttaa UX.md:n luvun 6 mukaan.

### Suunnitelma 2026-10-01 · Koodari
1. A2: `isStoragePersisted()` tallennuskerrokseen (`keyValueStore.ts` + `index.ts`) testeineen.
2. Kokoelman ohjain `src/ui/collectionStore.ts` (puhdas TS): lataus, peräkkäiset tallennukset, tavoitemäärät, palautus virheessä, `subscribe`. Yksikkötestit muistivaraisella ja viivästetyllä/virheellisellä repolla.
3. Määräkontrolli: sarake `Omistan`, `+`/`−`, ARIA-roolit ja korttimainen asettelu < 40 rem, yhteenveto, `App` → `CatalogView` repositories-propsi.
4. "Vain omistetut" -suodatin, rivin pysyvyys nollauksessa ja tyhjän kokoelman tila.
5. Ilmoituslaatikot (load notices, `persistent: false`, EI SAATAVILLA, LUKITTU, tallennusvirheet), selainmuistutus ja pysyvä tallennus, live-ilmoitukset (500 ms hillintä, 1,5 s ilmoitukset, toinen välilehti).
6. CONTENT.md-sanasto, CHANGELOG, ARCHITECTURE.md:n toteutusosa, koodikatselmointi, luovutus.

### Checkpoint 2026-10-01 · Koodari
- Tehty: suunnitelman askeleet 1–6. Commitit c50a02d (A2 `isStoragePersisted`), 968cca2 (kokoelman ohjain), 9ee1247 (määräkontrolli, yhteenveto, kapea asettelu), 21082c1 ("Vain omistetut"), 611af55 (ilmoitukset, tallennusvirheet, selainmuistutus, live-ilmoitukset), fd25234 (koodikatselmoinnin korjaus), d706bb0 (CONTENT.md, CHANGELOG, ARCHITECTURE.md).
- Kesken: ei mitään. Tila Review.
- Seuraava askel: UX katselmoi (selaimessa: 320 px, 400 % zoom, axe, saavutettavuuspuu, näppäimistöpolku) ja Digiturva katselmoi (tallennettu data, SEC-007).
- Avoimet kysymykset: ei blokkaavia. Velkaehdotukset PM:lle luovutuksessa.
- Muutetut tiedostot: `src/storage/keyValueStore.ts`, `index.ts`, `keyValueStore.test.ts`; `src/App.tsx`; `src/ui/` `CatalogView.tsx`, `CardList.tsx`, `CardFilters.tsx`, `texts.ts`, `useDelayedAnnouncement.ts`, uudet `collectionStore.ts` (+ testi), `useCollection.ts`, `useCollectionAnnouncements.ts`, `CountControl.tsx`, `CardName.tsx`, `CollectionNotices.tsx`, `StorageReminder.tsx`, `CatalogView.collection.test.tsx`; testien apufunktiot `CatalogView.test.tsx`, `CatalogView.filters.test.tsx`; `src/styles.css`; `docs/CONTENT.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`.

## Luovutukset

### Luovutus 2026-10-01 · UX Designer → Koodari
- Mitä tehtiin: kokoelmanäkymän suunnittelu `docs/UX.md` luvussa 6 (versio 0.5): polku (6.2), sivun rakenne (6.3), määräkontrolli ja korttimainen rivi 320 px:ssä (6.4), yhteenveto (6.5), "Vain omistetut" (6.6), selainmuistutus ja pysyvä tallennus (6.7), kaikki tilat ja tarkat tekstit (6.8: lataus, tyhjä, `persistent: false`, `reset` kummallakin `backupKey`-arvolla, `repaired`, `newer-version`, `StorageError` `quota`/`unavailable`/`newer-version`/`limit-reached`), ruudunlukijailmoitukset ja hillintä (6.9), fokus ja näppäimistö (6.10), responsiivisuus (6.11), tarkistuslista (6.13). Ideat: `docs/IDEAS.md`.
- Mitä pyydän: toteutus UX.md 6:n mukaan. Sisällöntuottaja tarkistaa uudet termit ja tekstit (6.14) ja lisää ne CONTENT.md:hen. Tekstit `src/ui/texts.ts`:iin.
- Mistä katsoa: `docs/UX.md` luku 6, `src/ui/CatalogView.tsx`, `CardList.tsx`, `CardFilters.tsx`, `texts.ts`, `src/storage/types.ts`, `errors.ts`.
- Keskeiset päätökset: neljäs sarake `Omistan` (`[+]` / `[−] n [+]`, yksi painallus omistetuksi, +-painike pysyy samana elementtinä). Alle 40 rem:ssä rivi on korttimainen ruudukko eksplisiittisillä ARIA-rooleilla. Näytetty määrä = uusin tavoitemäärä, tallennukset peräkkäin, epäonnistuessa palautus viimeksi tallennettuun. Live-ilmoitus vasta tallennuksen jälkeen, 500 ms hillintä. "Vain omistetut" -rivi jää näkyviin, kun määrä nollataan, kunnes hakuehdot muuttuvat. `newer-version` = LUKITTU-tila ilman painikkeita.
- Tunnetut rajoitteet ja riskit: tallennettu `Collection` voi sisältää avaimia, joita ei näytetä (A3). Yli 300 sarkainpysähdystä listalla (IDEAS.md). Korttimainen asettelu on uusi rakenne, joten Koodarin on tarkistettava saavutettavuuspuu.
- Testit: ei koodia eikä testejä tässä vaiheessa (vain määrittely).

**Avoimet kysymykset (PM ratkaisee, oletus voimassa kunnes toisin päätetään):**
1. A1 Korttimainen rivi alle 40 rem:ssä. Oletus: kyllä.
2. A2 `navigator.storage.persisted()` vain-luku-tarkistus painikkeen piilottamiseen. Oletus: sallittu (Arkkitehti voi kieltää).
3. A3 Tuntemattomat avaimet: ei näytetä, ei lasketa, ei poisteta. Oletus: kyllä.
4. A4 `reset` + `backupKey: null`: painikkeet käytössä, tallennus epäonnistuu virheenä. Digiturva/Koodari vahvistaa heitettävän `StorageError`-lajin.
5. A5 Rivi jää näkyviin "Vain omistetut" -suodatuksessa nollauksen jälkeen. Oletus: kyllä.
6. A6 Ilmoitusviiveet 500 ms / 750 ms. Oletus: kyllä.
7. A7 Vain `reset` ja `repaired` suljettavissa. Oletus: kyllä.

### Luovutus 2026-10-01 · Koodari → UX Designer ja Digiturva
- Mitä tehtiin: kokoelmanäkymä UX.md:n luvun 6 mukaan. Sarake `Omistan` (`+` / `− n +`, 0–999, 999:ssä `aria-disabled` + ilmoitus), yhteenveto, "Vain omistetut" (rivi jää näkyviin nollauksen jälkeen, oma tyhjä tila ja `Näytä kaikki kortit`), selainmuistutus ja `Pyydä pysyvää tallennusta` (vain painikkeesta; A2: `isStoragePersisted` piilottaa painikkeen, jos lupa on jo), kaikki 6.8:n ilmoituslaatikot ja tallennusvirheet, LUKITTU- ja EI SAATAVILLA -tilat, live-ilmoitukset (500 ms hillintä tallennuksen jälkeen, alku → loppu, 1,5 s latausilmoitukset, 750 ms toinen välilehti). Alle 40 rem:n korttimainen asettelu eksplisiittisillä ARIA-rooleilla. Peräkkäiset tallennukset: näytöllä uusin tavoitemäärä, vanhempi vastaus ei ylikirjoita, virheessä palautus viimeksi tallennettuun.
- Mitä pyydän: **UX:** käytettävyys-, saavutettavuus- ja mikrokopiokatselmointi esikatselussa (axe 6.13:n tiloissa, 320 px ja ≥ 640 px, 200 %/400 % zoom, saavutettavuuspuu korttiasettelussa, näppäimistöpolku, fokusrengas ei leikkaudu). **Digiturva:** tallennettu data ja syöte (määrät vain painikkeista, avaimet `Card.key`:stä), virheteksteissä ei teknisiä tietoja eikä `backupKey`:tä (SEC-007), `persist()` vain käyttäjän toimesta (SR-13), `persisted()`-lisäys tallennuskerrokseen.
- Mistä katsoa: `git diff origin/test...t-012-kokoelma`, erityisesti `src/ui/collectionStore.ts`, `CatalogView.tsx`, `CountControl.tsx`, `CollectionNotices.tsx`, `StorageReminder.tsx`, `useCollectionAnnouncements.ts`, `src/storage/keyValueStore.ts`, `src/styles.css`. Ajo: `npm run dev`. Toteutuksen yksityiskohdat: ARCHITECTURE.md "T-012 · Koodari".
- Tunnetut rajoitteet ja riskit:
  - Kapeaa korttiasettelua, zoomia, kosketusalueita ja axea **ei ole tarkistettu selaimessa** (vain jsdom, joka ei laske CSS-asettelua). Selainta tai axea ei ollut käytettävissä ilman uutta riippuvuutta.
  - jsdom laskee rivin otsikon nimeksi "V,Streetkid" (piilotetun ", ":n välilyönti katoaa). Oikeissa selaimissa nimi on "V, Streetkid". Testit hakevat rivit tekstisisällöllä. UX voi varmistaa saavutettavuuspuusta.
  - Uusia `+`/`−`-pysähdyksiä on noin 300 (IDEAS.md, UX:n tiedossa).
  - Tallennettuja tuntemattomia avaimia ei näytetä eikä poisteta (A3), joten yhteenveto voi olla pienempi kuin tallennettu kokoelma.
- Testit: `npm test` 17 tiedostoa, 424 testiä, kaikki läpi (uusia 67: `collectionStore.test.ts` 21, `CatalogView.collection.test.tsx` 46 (sis. nopeat painallukset, viiveellä vastaava `setCount`, `quota`, `unavailable`, `limit-reached`, `invalid-input`, `newer-version`, toinen välilehti), `isStoragePersisted` 4). `npm run lint` 0 virhettä ja 0 varoitusta. `npm run build` onnistui. Näkymättömien merkkien tarkistus (L-002) muutetuille tiedostoille: ei löydöksiä.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (kapean asettelun `.col-fit { width: 1% }` voitti solujen `width: auto`:n, commit fd25234) · Suosituksia 2 (ehdotus [velka]-tehtäviksi PM:lle): (1) jokainen määrän muutos renderöi koko taulukon, mittaa ja tarvittaessa `memo`; (2) jos painallussarjan myöhempi tallennus epäonnistuu, sarjan jo tallennettua osaa ei ilmoiteta ruudunlukijalle (vain virhe).
- Muutokset muiden tiedostoihin: `docs/CONTENT.md` sanastoon UX.md 6.14:n termit (PM:n lupa tässä kortissa), `CHANGELOG.md` `[Julkaisematon]`.
