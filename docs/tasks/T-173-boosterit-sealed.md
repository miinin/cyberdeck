# T-173 · Virtuaaliboosterit ja sealed-harjoittelu
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Päättäjä:** käyttäjä (2026-10-17): avataan virtuaaliboostereita oikeilla harvinaisuusjakaumilla, rakennetaan niistä sealed-pakka ja harjoitellaan turnausta varten.
**Rajaus (PM):** Bonusta ("omat oikeat avauksesi odotusarvoon") ei tehdä, koska sovelluksessa ei ole oikeiden avausten historiaa (I-7 puuttuu). Se tehdään I-7:n yhteydessä.

## Lähteet
- **Pakkauksen sisältö** (yhteisön lähteet, ei virallista): 12 korttia, joista 7 Common, 3 Uncommon ja 2 Rare-or-better. Rare+-paikassa arviot pakkausta kohden ovat Epic 1/4, Iconic 1/18 ja Secret 1/24. Kahdessa paikassa per-paikka-todennäköisyydet ovat siis Epic 1/8, Iconic 1/36 ja Secret 1/48, ja muuten Rare. Nova Raret eivät tule boostereista (Box Topper tai promo). UI:ssa näytetään merkintä: "Jakaumat ovat yhteisön arvioita, ei julkaisijan virallisia lukuja."
- **Sealed** (julkaisijan sealed-primer, cyberpunktcg.com/blog/sealed-primer): kitissä on 6 boosteria ja pakkaus, jossa on 3 satunnaista lisä-Legendiä. Pakkaan valitaan 3 Legendiä joko lisäpakkauksesta tai boostereista, ja pääpakassa on vähintään 30 korttia ilman Legendejä. Värejä saa olla enintään 3, eivätkä Legendit rajoita värejä. **RAM ei vaikuta.** Suositus on 14 Unitia ja 16 myytävää.

## Määrittely
- **Pääsy:** Pakat-sivun välilehtiin (Omat / Kokoaminen / Julkiset) tulee uusi välilehti **"Sealed"** (en "Sealed").
- **Setin valinta:** Welcome to Night City (retail) tai Beta. Korttipooli on se setti, jonka `isMainSetPrinting`-painokset kuuluvat valittuun settiin. T-160:n poikkeukset jätetään pois samoin kuin `availability.ts`:ssä. Kortin harvinaisuus on setin painoksen `rarity`. Iconic-paikka arpoo kortin Iconic-harvinaisuuksista ja näyttää sen Iconic-kuvituksen, Secret-paikka vastaavasti.
- **Avaa boosteri:** arvotaan 12 korttia jakauman mukaan, eikä samassa pakkauksessa ole tuplia samassa harvinaisuuspaikassa. Kortit paljastuvat yksi kerrallaan napautuksella tai "Paljasta kaikki" -painikkeella, harvinaisimmat viimeisenä. Kortin taustaväri tai kehys kertoo harvinaisuuden, ja paljastus on lyhyt kääntöanimaatio, jos reduced-motion sen sallii. Ilman sealedia voi avata yksittäisiä boostereita huvikseen, jolloin näkyy "Avattu N pakkausta" ja osumat.
- **Aloita sealed:** avataan 6 boosteria ja Legend-pakkaus (3 satunnaista Legendiä setistä) yksi kerrallaan, jonka jälkeen siirrytään rakentajaan.
- **Rakentaja:** pooli näkyy korttiruudukkona (CardImage). Napautus siirtää kortin pakkaan, ja määrä on enintään poolin määrä. Valittavana on 3 Legendiä poolin Legendeistä. Tila näyttää: pääpakka X/30+, värit N/3 ja Unit- sekä myytävämäärät verrattuna suositukseen 14/16. Suodattimet: väri ja tyyppi.
- **Toiminnot:** **Pelaa yksin** avaa T-172:n goldfish-näkymän tällä pakalla. **Tallenna pakaksi** luo tavallisen pakan Pakat-listaan nimellä "Sealed (pvm)". Huomautus: tavallinen pakka tarkistetaan constructed-säännöillä, joten varoitukset ovat odotettuja. **Uusi sealed** kysyy vahvistuksen.
- **Tallennus:** käynnissä oleva sealed (setti, pooli, pakka ja Legendit) tallennetaan localStorageen omalla avaimella olemassa olevan envelope- ja validointimallin mukaan (`src/storage`, SR-23: kortti-avaimet ja määrät validoidaan luettaessa). Pilvisynkkaa ei tehdä. Tämän vuoksi Digiturva katselmoi muutoksen.
- **Logiikka** on puhtaana tiedostossa `src/domain/booster.ts`: `openBooster(cards, set, rng)`, `openLegendPack(cards, set, rng)` ja `sealedIssues(pool, deck)`. Testit kattavat: jakauman muodon (12 korttia, 7, 3 ja 2), tilastollisen testin kiinteällä siemenellä (10 000 pakkausta, Epic noin 25 % pakkauksista ±3 %), Nova Raret eivät tule, sealed-säännöt (30, 3 väriä ja Legendit) sekä pakka ei voi ylittää poolia. Lisäksi tallennuksen validoinnille ja UI-polulle (Sealed → aloita → paljasta → lisää kortti pakkaan) tehdään testit.
- **Ilme:** täysleveä, 320 px, ei sisäistä vieritystä eikä pomppivia painikkeita. Ei uutta riippuvuutta. Tekstit fi ja en.

## Luovutus
**Koodari, 2026-10-17 · valmis, ei pushattu (D-029, suoraan testiin)**
- Domain: `src/domain/booster.ts` (openBooster, openLegendPack, sealedIssues, sealedStats) ja `src/domain/sealed.ts` (ajon tila, muutokset, validointi luettaessa). `sealedIssues` ottaa lisäksi `cardsByKey`-parametrin (värit ja tyypit tarvitsevat korttitiedot). Iconic-ryhmä = Iconic Legend/Other, Secret-ryhmä = Secret ja Iconic Secret; FR-painokset jätetty pois (language en).
- Tallennus: `cyberdeck:sealed` (envelope v1, tili-avaimella `cyberdeck:u:{uid}:sealed`), `repositories.sealed` (load/save/clear/subscribe), ei synkkaa, `eraseAccount` poistaa. Luettaessa tiukka validointi (SR-23): joukko, avaimet, rarity, määrät ≤ poolin määrä, Legendit ≤ 3 eri; virheellinen ajo varmuuskopioidaan ja aloitetaan alusta.
- UI: Pakat-välilehti "Sealed" (`#/pakat/sealed`), Pelaa yksin `#/pakat/sealed/goldfish` (GoldfishSealedPage, GoldfishView sai `backLabel`), Tallenna pakaksi (nimi "Sealed (pvm)"), Uusi sealed vahvistuksella. Reveal: yksi kortti kerrallaan tai "Paljasta kaikki", kääntöanimaatio vain no-preference. Ei uutta riippuvuutta.
- Testit: booster (16), sealed domain (20), tallennus (9), UI-polku (13). Tilastotesti 10 000 pakkausta kiinteällä siemenellä.
- Ulkoasu: headless Chrome 320 ja 1440 px: ei vaakavieritystä eikä sisäistä vieritystä, painikkeiden paikat ennallaan paljastuksessa ja kortteja lisätessä. Korjattu samalla: Pakat-välilehdet (4 kpl) rivittyvät 2×2 puhelimella.
- Digiturva katselmoi: tallennus (uusi avain, validointi luettaessa).
- Huomio: kerran koko sarjassa vilkkui DeckEditor.conflict-testi (ei liity tähän), uusinta meni läpi.
Koodikatselmointi: tehty · Pakollisia korjattu 2 (deck-nimen rivitys, 320 px:n välilehtien ylivuoto) · Suosituksia 1 (pooli 320 px:llä pitkä, 2 saraketta)

## Digiturva · Katselmointi 2026-10-17
Raportti `docs/reports/SEC-T172-T173.md` (kattaa myös T-172). Critical 0, High 0, Medium 0, Low 0, Info 4. Ei vetoa, ei koodikorjauksia. PRIVACY.md rivi 1f ja SECURITY.md luku 20 päivitetty.
