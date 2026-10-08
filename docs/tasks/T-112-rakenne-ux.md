# T-112 · Sivustorakenteen UX-arvio ja uusi rakenne (suunnitelma)

**Tila:** Backlog. Rakenne valittu: A (D-028). **Päättäjä:** käyttäjä (pyyntö 2026-10-08: "onko rakenne kärkevä, voiko jotain muuttaa? UX is the king"), PM (suunnitelma).

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
