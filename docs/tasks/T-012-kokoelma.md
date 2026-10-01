# T-012 · Kokoelma: omistettujen korttien merkintä
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Suunnittelu:** UX ☑ (docs/UX.md luku 6, 2026-10-01) (näkymä, tilat, mikrokopio, saavutettavuus)
**Katselmoinnit (D-009):** Koodikatselmointi ☐ · UX ☐ (käytettävyys, saavutettavuus, mikrokopio) · Digiturva ☐ (tallennettu data, syöte, SEC-007) · Testikäyttäjä: MVP-1:n lopussa · Dokumentoija: MVP-1:n lopussa
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
