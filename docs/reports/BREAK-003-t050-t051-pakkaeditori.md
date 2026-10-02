# BREAK-003 · T-050 / T-051 Pakkaeditori, Kortit-sivu, Pakat-sivu ja tuontiraportti: rikkomistestaus

**Testaaja:** Testikäyttäjä · **Päivä:** 2026-10-03 · **Tehtävä:** T-050, T-051 · **Haara:** `t-050-ux-uudistus` (HEAD 1849bce)
**Kohde:** paikallinen `npm run build` + `vite preview` (portti 4199). Ei tuotantoa. Netdeck.gg-hakua ei ajettu.
**Välineet:** headless Chrome CDP:llä (Node-skriptit scratchpadissa), 1280 / 375 / 320 px. Mustan laatikon testi, sen jälkeen `useDecks.ts` ja `DeckEditor.tsx` luettiin juurisyyn varmistamiseksi.

Löydöstunnisteet B-017...B-021. Tietoturvaepäilyjä ei löytynyt: HTML ja skripti nimessä ja tuonnissa renderöityvät tekstinä (`window.__xss` ei asetu), pitkät ja vioittuneet syötteet hylätään siististi.

---

## Löydökset

### B-017 · Editorista poistuminen alle noin sekunnin sisällä jättää Pakat-listan vanhentuneeksi, ja Kopioi kopioi vanhan version · Medium
**Sijainti:** `src/ui/DeckEditor.tsx` (rivit 189-211, unmount-tallennus), `src/ui/useDecks.ts` (lataus vain mountissa ja toisen välilehden tapahtumasta)
**Persoona:** Pertti Painaja · **Tyyppi:** Datan epäjohdonmukaisuus · **Toistuvuus:** aina
**Toistaminen:** 1) Uusi pakka, lisää Detonate, odota 1,5 s. 2) Lisää Detonate uudelleen ja paina heti "Takaisin pakkoihin". 3) Odota. 4) Paina "Kopioi".
**Odotettu:** Lista näyttää 2 korttia ja kopio sisältää 2 korttia.
**Havaittu:** Tallennus onnistuu (localStorage: 2 korttia), mutta lista näyttää "Pääpakka 1/40–50" myös odotuksen jälkeen, ja kopio saa 1 kortin. Sama nimelle: "Eka" -> "Toka" ja heti Takaisin, lista näyttää "Eka", tallennettu on "Toka". Lista päivittyy vasta sivun latauksella. Syy: unmountin tallennus on asynkroninen ja ketjutettu, mutta Pakat-näkymän `useDecks` lataa heti ennen sitä eikä saman välilehden kirjoitus laukaise `subscribe`-kutsua.
**Vaikutus:** Käyttäjä näkee väärän tilan ja kopio menettää viimeisen muutoksen. Alkuperäinen data ei katoa.
**Korjausehdotus:** `reload()` kun tallennus valmistuu, tai notify saman välilehden `update`-kirjoituksesta.
**Tila:** Avoin

### B-018 · Pitkä välilyönniton pakan nimi aiheuttaa vaakavierityksen editorissa · Medium
**Sijainti:** `src/ui/DeckEditor.tsx:355` (`.editor-title`, h1), `src/styles.css`
**Persoona:** Ilkka Ilkeä / Mikko Mobiili · **Tyyppi:** Ulkoasu · **Toistuvuus:** aina
**Toistaminen:** Anna nimeksi 100 kertaa "W" (sallittu raja) tai tuo pakka, jonka nimi on yhtä pitkä sana. Avaa editori.
**Havaittu:** `scrollWidth` 3209 px (375 px:n ikkuna): h1, `.editor-back` ja sen sisältö levenevät 3193 px:iin, koko sivu vaakavierii ja "Näytä pakka" / "Siirry pakkaan" -fokus (h2 pakkapalstalla) päätyy ruudun ulkopuolelle. Pakat-listassa sama nimi rivittyy oikein (sw 375).
**Korjausehdotus:** `overflow-wrap: anywhere; min-width: 0` otsikolle ja sen flex/grid-vanhemmalle.
**Tila:** Avoin

### B-019 · Tyhjän tai roskalistan tuonti sanoo "Kaikki pakan kortit ovat kokoelmassasi." ja Tallenna pakaksi on käytössä · Low
**Sijainti:** `src/ui/deckTexts.ts:97`, `src/ui/DeckImport.tsx`
**Persoona:** Eila Eksyjä / Ilkka Ilkeä · **Tyyppi:** Hämmennys · **Toistuvuus:** aina
**Toistaminen:** Tuo pakkalista -> liitä "asdf qwerty / ??? / 999 999 999" -> Tarkista lista.
**Havaittu:** Raportti kertoo 0 tunnistettua korttia, tunnistamattomat rivit oikein, mutta kokoelmarivi sanoo positiivisesti, että kaikki kortit ovat kokoelmassa, ja "Tallenna pakaksi" luo tyhjän pakan.
**Korjausehdotus:** kun tunnistettuja kortteja on 0, piilota kokoelmarivi ja kysy vahvistus tai estä tallennus.
**Tila:** Avoin

### B-020 · Ristiriitainen sääntöviesti, kun pakassa ei ole Legendiä · Low
**Sijainti:** `src/domain/deckRules.ts:155` (RAM-väriviesti), tuontiraportin Säännöt-lista
**Persoona:** Eila Eksyjä · **Tyyppi:** Hämmennys · **Toistuvuus:** aina
**Toistaminen:** Tuo "99999999999999999999 Detonate / 3x Detonate" (vain ei-Legend-kortteja).
**Havaittu:** Säännöt-listassa "Legendeillä ei ole väriä Red, mutta ylittää: Detonate." samalla kun tilastoissa lukee "Ei RAM-rajoja ennen kuin pakassa on Legend." Viesti on harhaanjohtava ja tuplaa "Legendejä on 0" -virheen.
**Korjausehdotus:** ohita värirajatarkistus, kun Legendejä on 0.
**Tila:** Avoin

### B-021 · Tuonti hyväksyy `3x Nimi` tuntemattomalta riviltä hiljaa ja luku 3 jää silti pois riviraportista · Info
**Sijainti:** `src/domain/deckText.ts`
**Havaittu:** "3x Detonate" tunnistetaan 3 kappaleena, mutta "1.5 Detonate", "-5 Detonate", "0 Detonate" ja liian suuri luku menevät tunnistamattomiin (oikein). Ei bugi, kirjataan ilman toimenpidettä; ehkä dokumentoi tuettu muoto.
**Tila:** Tiedoksi

---

## Mikä kesti (ei löydöksiä)
- **Pertti:** 8 nopeaa klikkausta samaan korttiin pysähtyy 3 kopioon ("Pakassa on jo 3 kopiota"), Legend 1 kpl ("Sama Legend" -ilmoitus). 604 klikkausta ~150 kortille: ei kaatumista, pääpakka 124/50 saa varoituksen. +/- ja oikea klikkaus ja Shift+klikkaus toimivat, fokus pysyy painikkeessa.
- **Ilkka:** nimi 300 / 120 merkkiä saa "Nimi on liian pitkä" eikä tallennu, tyhjä ja pelkkä välilyönti estetään, `<img onerror>`, RTL-ohjausmerkit, emoji ja lainausmerkit renderöityvät tekstinä. Rikkinäinen JSON, `{}`, `null`, `schemaVersion: 99`, tuntematon kortti ja rikkinäinen collection / view / theme -arvo: tyhjä tila tai selkeä ilmoitus, ei kaatumista. Tuonti: 40 000 riviä, 300 merkin rivi, 3000 riviä, binääriroska, JSON väärässä muodossa: kaikki saavat suomenkielisen rajaviestin. Tallennustila täynnä ja pakka poistettu toisessa välilehdessä: selkeä "Ei tallennettu" -viesti. Poikkeavat reitit (`%00`, `../`, 5000 merkin id, tuntematon UUID) johtavat Pakat-listaan tai "Pakkaa ei löytynyt" -viestiin.
- **Eila:** Pakat-sivulla näkyvät Keskeneräinen / Laillinen -tila, puuttuvat kortit, Avaa / Nimeä / Kopioi / Poista / Vie. Poistodialogi sulkeutuu Escapella ja fokus palaa painikkeeseen. Nimen kopiointi 100 merkin nimestä typistää nimen, ei ylitä rajaa. Tyhjän nimen uudelleennimeäminen estetään.
- **Mikko:** 375 ja 320 px: Pakat-lista ja tavallinen editori ilman vaakavieritystä, alapalkki "Pakka 37/40-50 · Legendit 3/3 · 1 ongelma" ja "Näytä pakka" (44 px korkea) toimivat, ei alle 24 px:n kohteita. Huomio: editorissa on samalla ruudulla kaksi vastaavaa kontrollia ("Siirry pakkaan" ja alapalkin "Näytä pakka"), ja pakkapalsta on 17 000 px sivun lopussa (151 kortin lista). Suunniteltu, mutta Eila voi hämmentyä.

## Ei ehditty
Oikea tiedostovalinta (.txt/.json upload), Netdeck-haku (ulkoinen), useamman välilehden samanaikainen muokkaus, Kortit-sivun kokoelman nopea +/-, kosketusliikkeet (pitkä painallus).

## Arvio: **Horjuu** (kevyesti)
Ei blokkaavia. B-017 ja B-018 korjattava ennen julkaisua. B-019 ja B-020 pieniä.
**Veto-päätös:** ei (ei vetoa).
