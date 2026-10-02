# T-013 · Pakanrakennus: luonti, nimeäminen, muokkaus, poisto ja laillisuustarkistus
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-02)
**Malli:** D-014. Tietomalli ja tallennus ovat valmiina (T-011: `src/domain/deck.ts`, decks-repositorio), joten Arkkitehtia ei tarvita. Digiturva tekee kevyen katselmoinnin, koska tehtävässä on käyttäjän syöte (pakan nimi) ja tallennus. UX katselmoi MVP-1:n lopussa.
**Haara:** `t-013-pakat` (test-haarasta T-040:n jälkeen)

## Tavoite
Pelaaja rakentaa omista korteistaan laillisen pakan, nimeää sen ja näkee heti, mikä pakassa on vielä vialla ja mitä kortteja kokoelmasta puuttuu.

## Pakkasäännöt (lähteet, tarkistettu 2026-10-02)
- Virallinen: https://cyberpunktcg.com/gameplay-guide
  - "Use exactly 3 Legend cards with unique names."
  - "Include no fewer than 40 and no more than 50 cards (not including your Legends)."
  - "Use no more than 3 copies of the same card."
  - "The RAM color values on each card in your deck must be less than or equal to your Legends' total RAM color values."
- Tarkennukset (yhteisö, https://ripperdeck.gg/rules):
  - Legendin nimi on uniikki pelkän nimen perusteella, alaotsikolla ei ole väliä (kaksi eri "V"-Legendiä ei sallittu).
  - 3 kopion raja koskee samaa nimeä ja alaotsikkoa, eli meidän `Card.key`.
  - RAM-raja värille X = pakan 3 Legendin RAM-arvojen summa niistä Legendeistä, joiden väri on X. Jokaisen pääpakan kortin, jonka väri on X, RAM on oltava ≤ tämä summa. Väri, jota yksikään Legend ei anna, ei ole pelattavissa.
- Oletus, joka on merkitty käyttöliittymään "Tarkistettava": korttidatassa on yksi `color` ja yksi `ram` per kortti, ja niitä käytetään sellaisenaan.

## Hyväksymiskriteerit
1. **Domain:** `src/domain/deckRules.ts`: `validateDeck(deck, cardsByKey)` palauttaa listan rikkeistä (tyyppi, ihmisluettava selitys, kortit). Säännöt:
   - Legend-määrä on tasan 3.
   - Legendien nimet ovat uniikkeja.
   - Pääpakassa (ei-Legendit) on 40–50 korttia.
   - Kopioita on enintään 3 per `key`.
   - RAM-raja on värikohtainen.
   - Tuntematon kortti (key puuttuu datasta) näytetään varoituksena.
   - Kattavat yksikkötestit jokaiselle säännölle ja rajoille (39/40/50/51, 3/4 kopiota, väri ilman Legendiä).
2. **Pakkalista:** uusi näkymä "Pakat" (yläpalkin navigaatio Kortit / Pakat, hash- tai tilapohjainen, ei uutta riippuvuutta). Listassa näkyvät pakan nimi, korttimäärä ("Legendit 3/3 · Pääpakka 42/40–50"), laillisuustila (Laillinen ✓ / Keskeneräinen + rikkeiden määrä) ja muokattu-aika. Toiminnot ovat Uusi pakka, Avaa, Nimeä uudelleen, Kopioi ja Poista. Poisto kysyy vahvistuksen natiivilla `<dialog>`illa, ei `confirm()`illa.
3. **Nimeäminen:** nimi on pakollinen ja enintään 100 merkkiä (`MAX_DECK_NAME_LENGTH`), ja reunavälilyönnit poistetaan. Uuden pakan oletusnimi on "Uusi pakka", ja samannimiset numeroidaan ("Uusi pakka 2"). Virhe ilmoitetaan kentän yhteydessä.
4. **Pakkaeditori:**
   - Vasemmalla (leveällä näytöllä) tai ylhäällä on korttihaku samoilla suodattimilla kuin katalogissa (käytä olemassa olevaa `CardFilters`/`cardSearch`). Jokaisella kortilla on "Lisää pakkaan" ja −/+.
   - Oikealla on pakka ryhmiteltynä: Legendit (3) ja pääpakka tyypeittäin (Unit, Gear, Program) Cost-järjestyksessä.
   - Yläosassa on yhteenveto: korttimäärät, RAM-rajat väreittäin Legendeistä ("Red 4 · Blue 2") ja rikkeiden lista selkokielellä, esim. "Pääpakassa on 38 korttia, vähintään 40." tai "Royce: 4 kopiota, enintään 3.". Rikkeet ovat `aria-live="polite"`-alueessa.
   - Kortti, joka rikkoisi RAM-rajan tai kopiorajan, näytetään hakulistassa himmennettynä ja selitys näkyy vihjeenä. Lisäys on silti sallittu, jotta keskeneräisen pakan voi rakentaa.
   - Kokoelmavertailu: pakan rivillä näkyy "omistat 2/3". Yhteenvedossa näkyy "Kokoelmasta puuttuu N korttia", ja puuttuvat on merkitty.
5. **Tallennus:** käytetään olemassa olevaa decks-repositoriota (rajat SR-11: `MAX_DECKS`, `MAX_DECK_CARD_COUNT` jne.). Tallennus tehdään automaattisesti muutoksen jälkeen (debounce noin 500 ms), ja tila näkyy ("Tallennettu"). Virheet näytetään kuten kokoelman tallennusvirheet. Pakka tallennetaan yhteen osioon (nimetön pääosio), ja Legendit erotellaan tyypin perusteella.
6. **Kortin pakat:** katalogin kortilla (ruudukko ja taulukko) näkyy pieni maininta "Pakoissa: 2", ja vihje kertoo pakkojen nimet (T-013:n alkuperäinen kriteeri).
7. Testit domainille, editorin päätoiminnoille (luo, nimeä, lisää, poista, laillisuusviestit) ja tallennukselle. `npx vitest run` (muutetut osat), lint ja build menevät läpi. CHANGELOG `[Julkaisematon]`.

## Rajaukset
- Pakkalistan tuonti tekstinä on T-014, vienti ja tuonti tiedostona T-015.
- Ei pakkatilaa "koottu / suunnitelma" (avoin kysymys käyttäjälle T-014:ssä).
- Ei sideboardia tai muita osioita.

## Luovutukset

### Luovutus 2026-10-02 · Koodari → PM (Digiturva-kevytkatselmointi, UX MVP-1:n lopussa)
- Mitä tehtiin (kaikki kriteerit 1–7): `src/domain/deckRules.ts` (validateDeck, addBlocker, ramLimits, groupDeck) ja `deckEdit.ts` (nimen tarkistus, numerointi, kopiointi, withDeckCount); hash-reititys `useHashRoute.ts` (#/, #/pakat, #/pakat/<id>) ja yläpalkin nav; `DecksView` (lista, uusi, nimeä, kopioi, poista natiivilla `<dialog>`illa); `DeckEditor` (haku `CardFilters`illa, pakka ryhmiteltynä, yhteenveto, rikkeet `aria-live`-alueessa, himmennys + selite, kokoelmavertailu, automaattitallennus 500 ms, virhe + "Yritä tallentaa uudelleen", tallennus poistuessa ja `pagehide`ssa); `CardDecks` ("Pakoissa: N" ruudukossa ja taulukossa, nimet vihjeessä ja ruudunlukijalle); CHANGELOG. Commitit: 8951daf (säännöt), navigaatio ja lista, editori ja autosave, katalogin maininta (viimeinen commit haarassa).
- Päätökset: virheilmoitukset (`message`) ovat suomeksi `deckRules.ts`:ssä, koska kriteeri vaati ihmisluettavan selityksen; muut tekstit `src/ui/deckTexts.ts`:ssä (Sisällöntuottajan/UX:n tarkistettavaksi, sisältö on omaa kirjoitustani). Editorin hakulistan "Lisää pakkaan" on −/+-stepper (+ on nimeltään "Lisää pakkaan: <kortti>"), ei erillistä tekstipainiketta, jotta fokus ei katoa. Kortti voi olla pakassa max 99 kpl (SR-11) ja 500 eri korttia, rajalla näytetään ilmoitus.
- Tunnetut rajoitteet: editori ei seuraa toisen välilehden muutoksia (vain lista ja katalogi seuraavat `subscribe`lla); useamman osion pakka (T-014/015 tuonti) näytetään yhdistettynä ja muokkaus kirjoittaa kortin sen ensimmäiseen osioon; `Tarkistettava`-huomautus RAM/väri-oletuksesta näkyy yhteenvedossa; ei visuaalista/selaintestausta (vain jsdom), joten tyylit (editorin kaksi saraketta, himmennys) kaipaavat UX-katselmoinnin.
- Tallennusrajapinta: riitti sellaisenaan, ei muutoksia tietomalliin. Havainto: `update` korvaa koko sisällön, joten kaksi välilehteä voi ylikirjoittaa toistensa muokkaukset (viimeinen voittaa).
- Digiturva: käyttäjän syöte on pakan nimi (cleanText + repositorion validointi, renderöinti React-tekstinä, ei innerHTML), ei uusia riippuvuuksia. Hash-reitin id validoidaan `isDeckId`llä.
- Testit: `npx vitest run src/domain src/ui src/storage src/App.test.tsx` 40 tiedostoa / 860 testiä läpi; lint 0 varoitusta; build ok. Uudet: deckRules.test.ts (säännöt rajoineen), DecksView.test.tsx, DeckEditor.test.tsx, CatalogView.decks.test.tsx. Testisetup nollaa `location.hash`in.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (poistuessa tehtävä tallennus ohitti käynnissä olevan tallennuksen -> nyt jonotetaan) · Suosituksia 2 (editorin ylikirjoitus toisesta välilehdestä; DeckEditor.tsx on pitkä, voisi pilkkoa DeckSummary/CardSearch-komponentteihin) -> ei vielä [velka]-tehtäviä, PM päättää.
