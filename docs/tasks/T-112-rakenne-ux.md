# T-112 · Sivustorakenteen UX-arvio ja uusi rakenne (suunnitelma)

**Tila:** Done. Rakenne valittu: A (D-028). **Päättäjä:** käyttäjä (pyyntö 2026-10-08: "onko rakenne kärkevä, voiko jotain muuttaa? UX is the king"), PM (suunnitelma).

## Nykyinen rakenne
| Päänavigointi | Sisältö |
|---|---|
| Kortit (`#/`) | Korttitietokanta: suodattimet, haku, kortin tiedot. **Kokoelman määrien muokkaus** ("Muokkaa kokoelmaa" -kytkin), skannauspainike. |
| Kokoelma (`#/kokoelma`) | Edistymistilastot (yleiskuva, setit, harvinaisuudet, värit ja tyypit, puuttuvat), kansionäkymä, skanneri. |
| Pakat (`#/pakat`) | Omat ja julkiset pakat välilehtinä, pakkaeditori, jaetut pakat. |
| Have/Want (`#/vaihto`) | Have lasketaan kokoelmasta (yli pelisarjan menevät kortit), Want on oma lista, vaihtolinkki. |
| Proxy (`#/proxy`) | Proxy-jono ja tulostusarkki. |

## Hypoteesit (tarkistetaan arviossa)
1. **Kokoelma on jaettu kahteen paikkaan.** Määriä muokataan Kortit-sivulla, mutta Kokoelma-sivu näyttää vain tilastot ja kansion. Have-osion teksti jopa neuvoo: "Määrää muutat Kortit-sivulla." Käyttäjä etsii kokoelman muokkausta Kokoelma-sivulta.
2. **Viisi päätason kohdetta on liikaa puhelimelle**, ja kaksi niistä on johdannaisia tai työkaluja. Have/Want on kokoelman ja toivelistan näkymä. Proxy on tulostustyökalu, johon tullaan yleensä pakasta tai puuttuvista korteista.
3. **Sivun tehtävä ei näy heti.** Jokaisen näkymän ylälaidassa pitäisi olla yksi selvä pääkehotus (Kokoelma: "Skannaa / lisää kortteja", Pakat: "Uusi pakka").
4. **Aloitussivu:** Kortit-tietokanta sopii uudelle käyttäjälle, mutta palaava käyttäjä haluaa luultavasti pakkansa tai kokoelmansa. Tarkistetaan, tarvitaanko viimeksi käytetyn näkymän muistaminen.
5. **Toistuvat kuviot ovat epäyhtenäisiä.** Välilehdet (Pakat omat/julkiset, editorin Pakka/Lisää, Kokoelman Yleiskuva/Kansio), segmenttivalitsimet ja kytkimet näyttävät erilaisilta eri sivuilla.

## Menetelmä (1 istunto, Opus-yleisagentti UX-roolissa, PM tarkistaa)
1. **Käyttäjäpolut 375 px:n ja 1440 px:n leveydellä.** Jokaisesta kirjataan askelmäärä, kitkakohdat ja kuvakaappaukset.
   - a) Uusi käyttäjä selaa kortteja ja lisää 10 korttia kokoelmaan.
   - b) Skannaa pinon kortteja.
   - c) Rakentaa pakan ja näkee, mitä puuttuu.
   - d) Tulostaa puuttuvat proxyiksi.
   - e) Tekee vaihtolistan ja jakaa sen.
   - f) Julkaisee pakan.
   - g) Palaa sivulle seuraavana päivänä.
2. **Heuristinen arvio** (Nielsenin 10 heuristiikkaa ja WCAG 2.2 AA). Hypoteesit 1–5 vahvistetaan tai kumotaan.
3. **Kaksi rakennevaihtoehtoa** rautalankamalleina. Kummastakin kirjataan vaikutukset reitteihin, linkkeihin ja teksteihin.
   - **A (PM:n alustava suositus): neljä kohdetta, Kortit · Kokoelma · Pakat · Vaihto.**
     - Kokoelma on "minun korttini": oma lista ja määrien muokkaus, skannaus, tilastot ja kansio.
     - Kortit on puhdas tietokanta, jossa on pikalisäys.
     - Proxy on toiminto Pakan, Puuttuvien ja Kortin tietojen sisällä. Proxy-jono näkyy yläpalkissa merkkinä silloin, kun se ei ole tyhjä.
   - **B: kolme kohdetta, Kortit · Kokoelma · Pakat.** Have/Want on Kokoelman välilehti, ja Proxy on toiminto kuten A:ssa.
4. **Päätöksen kirjaus** (D-XXX) käyttäjän valinnan mukaan. Sen jälkeen toteutus pilkotaan 2–3 kortiksi. Vanhat `#/`-reitit ohjataan uusiin, jotta jaetut linkit eivät katkea.

## Tuotos
`docs/reports/UX-112-rakenne.md`: löydökset vakavuusjärjestyksessä, vaihtoehdot A ja B sekä suositus. Ei koodimuutoksia.

## Riskit
- Kokoelman muokkauksen siirto koskee monia testejä (`CatalogView.collection.test.tsx`). Arvioidaan toteutuskortissa.
- Reittien muutos rikkoo kirjanmerkit, ellei uudelleenohjausta tehdä.

## Toteutus 2026-10-09 (käyttäjä: "Tee T-112 ja julkaise")
**PM:n rajaus:** rakenne on jo päätetty (D-028 ja sen muutos: viisi kohdetta, Proxy pysyy). Täyttä käyttäjäpolkuarviota ei tehdä, koska se kuluttaisi paljon tokeneita eikä muuttaisi päätöstä. Jäljellä olevista D-028:n osista toteutetaan tärkein, hypoteesi 1: **Kokoelma on "minun korttini"**. Hypoteesi 3 on jo toteutettu (T-108, T-117). Hypoteesit 4 ja 5 (T-118) jäävät IDEAS-ehdokkaiksi.

### Hyväksymiskriteerit
- [ ] Kokoelma-sivun näkymävalitsimeen (`COLLECTION_VIEW_OPTIONS`, `SegmentedChoice`) tulee ensimmäiseksi **"Omat kortit"** / "My cards". Järjestys: Omat kortit · Yleiskuva · Kansio. Uuden käyttäjän oletus on Omat kortit (tallennettu `useCollectionPrefs`-valinta säilyy).
- [ ] Omat kortit -näkymässä on korttilista, jossa näkyvät vain omistetut kortit, **määrien muokkaus on suoraan päällä**, ja haku ja suodattimet toimivat kuten Kortit-sivulla. Toteutus käyttää CatalogViewin olemassa olevaa logiikkaa (suodatin `owned`, `editMode`, rivien pysyminen näkyvissä nollaan laskun jälkeen, T-074:n settisääntö) eikä kopioi sitä. Esimerkiksi CatalogView saa propsin (`mode: 'catalog' | 'collection'`), jossa omistus-suodatin on lukittu `owned`-arvoon ja muokkauskytkin on piilossa ja aina päällä. Otsikoita, `headerSlot`-painikkeita tai live-alueita ei tule tuplana.
- [ ] Tyhjässä kokoelmassa Omat kortit näyttää nykyisen skannauskehotuksen (`ScanPrompt`) ja linkin Kortit-sivulle ("Selaa kortteja ja lisää"). Lukittu tai ei saatavilla oleva kokoelma näyttää saman tilan kuin nykyään.
- [ ] Kortit-sivu säilyy ennallaan (pikalisäys ja kytkin "Muokkaa kokoelmaa" säilyvät). Tekstit, jotka ohjaavat muuttamaan määriä Kortit-sivulla, ohjaavat nyt Kokoelmaan (grep `Kortit-sivu`/`Cards page` src:stä, myös Have/Want). Reitit eivät muutu (näkymä on tallennettu valinta), joten uudelleenohjauksia ei tarvita. Kortin tietojen avaaminen Omat kortit -listasta toimii.
- [ ] fi ja en. Ei inner scrollia, ei päällekkäisyyksiä 320 px:llä, käytä T-118:n komponentteja.
- [ ] Testit: Kokoelman näkymävalitsin (3 vaihtoehtoa, oletus), Omat kortit näyttää vain omistetut, määrän muutos tallentuu, tyhjä tila, Kortit-sivun nykyiset testit läpi muuttumattomina. `npm test`, `npm run lint`, `npm run build`.

### Luovutus

**Koodari 2026-10-09:** Kokoelma-sivun näkymävalitsin on nyt Omat kortit · Yleiskuva · Kansio, uuden käyttäjän oletus on Omat kortit (`CollectionPrefs.view` hyväksyy `own`; vanhat `overview`/`binder` säilyvät, tuntematon arvo antaa oletuksen). `CatalogView` sai propsin `mode: 'collection'` (omistus-suodatin lukittu `owned`, muokkaus aina päällä, ei omaa otsikkoa, ei kytkintä eikä skannauspainiketta) ja `shared`-propsin, jolla Kokoelma antaa omat collection/wants/proxy-storensa listalle (ei kahta erillistä storea). Tyhjä kokoelma näyttää ScanPromptin ja linkin "Selaa kortteja ja lisää". Tekstit: emptyBody/emptyLink ja Have-ohje ("Kokoelma-osiossa"). Testit: 1568 läpi, lint ja build läpi.
Avoin: omat kortit -listan saavutettava nimi on edelleen "Kaikki kortit" (ei kortin tekstiä uudelle); Kokoelman skannauksen oletuspainos-tila (`useDefaultEdition`) on erillinen listan painostilasta, päivittyy vasta uudelleenlatauksessa.
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 2
- **PM 2026-10-09:** listan saavutettava nimi Omat kortit -näkymässä on "Omat kortit" / "My cards" (`tableCaptionOwn`), testi päivitetty. Avoin 2 (skannauksen oletuspainos päivittyy vasta uudelleenlatauksessa) jää pieneksi velaksi. `npm test` 1568/1568, lint ja build läpi.
