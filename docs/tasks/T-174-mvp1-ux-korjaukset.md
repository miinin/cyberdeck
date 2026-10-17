# T-174 · MVP-1:n UX-loppukatselmoinnin korjaukset
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Lähde:** `docs/reports/MVP1-UX-2026-10-17.md` (32 löydöstä). Käyttäjän pysyvät toiveet: painikkeet eivät saa pompata, päällekkäisyydet ja ylivuodot korjataan aina, eikä sivulla ole sisäistä vieritystä.

## Korjataan (yksi kortti, yksi julkaisu)
- **Kaikki pakolliset UX-01–UX-13.** Huomio UX-09:ään: kytke pakkaeditorin hakutulosten valmis Omistetut-suodatin (`DeckEditor.tsx`, `onCollectionFilterChange` on nyt no-op) ja omistettujen määrä näkyviin. **Oletus pysyy Kaikki**, koska oletuksen muuttaminen on käyttäjän tuotepäätös (kirjattu STATUS.md:n kysymyksiin).
- **Suositukset, jotka ovat tyyli- tai asetteluvikoja:** UX-14 (toissijaisen painikkeen hover omassa sävyssään kuten T-170: ei syaania eikä alleviivausta, vaan reunan korostus ja 1 px nousu), UX-15, UX-16, UX-18, UX-19, UX-20, UX-21, UX-22, UX-23, UX-24 (varaa tila, jotta rivit eivät kasva), UX-25, UX-26, UX-27, UX-28, UX-29 ja UX-32a (tekstivirheet).
- **T-173:n suositus:** sealed-poolin ruudukko on 320 px:llä noin 10 000 px pitkä (2 saraketta). Tiivistä se esim. 3 sarakkeeseen ja ryhmittele tyypeittäin, jolloin tuplat näkyvät yhtenä ruutuna määrämerkillä.
- **Ei nyt:** UX-17 (dialogin sisäinen vieritys, käyttäjän päätös), UX-30 ja UX-31 (mikrokopio ja sisältö, PM käy läpi erikseen).

## Tarkistus
- Ennen ja jälkeen kuvakaappaukset jokaisesta löydöksestä raportin leveyksillä ja teemoissa (headless Chrome, skripti scratchpadiin). Mittaa pomppiminen elementin `getBoundingClientRect`-arvoilla ennen ja jälkeen tilan vaihdon (0 px).
- `npm test`, `npm run lint` ja `npm run build`. Jokaisesta pakollisesta korjauksesta, joka on testattavissa jsdomilla, kirjoitetaan testi (esim. UX-09-suodatin ja UX-11:n väri).

## Luovutus

### Koodari · 2026-10-17 · Tila: valmis katselmointiin (ei pushattu)
Toteutus suoraan `test`-haarassa (D-029), 6 committia `T-174: …`. Tarkistus: headless Chrome (CDP-skripti scratchpadissa, oma portti), mitat `getBoundingClientRect`-arvoilla ja kontrastit laskettuna computed-väreistä. Ennen/jälkeen-mittaukset ajettiin `git stash`illa vanhaa koodia vasten, kun löydös oli mitattavissa.
`npm test` 1962 läpi (151 tiedostoa, +14 uutta testiä), `npm run lint` ja `npm run build` läpi.
Koodikatselmointi: tehty · Pakollisia korjattu 2 (UX-13-muutos söi sivupaneelin suodatinryhmien venytyksen; `.deck-tile.is-empty` joutui puhelimen ruudukkosäännön alle) · Suosituksia 3 (ks. Velka).

| Löydös | Tila | Mitattu / huomio |
|---|---|---|
| UX-01 | korjattu | Kokovalitsin aina näkyvissä, Lista-tilassa himmennetty. Kuvat/Lista-valitsimen x oli 865 → 434 px, nyt 434 ennallaan (768 ja 1440 ja 1100). Testi päivitetty. |
| UX-02 | korjattu | Paneeli ankkuroitu oikeaan reunaan, `max-inline-size: calc(100vw - 2rem)`. Editori ja Pakat-lista 320/768/1440: paneeli viewportin sisällä, ei vaakaylivuotoa. |
| UX-03 | korjattu | Syy oli `main:has(.catalog-layout)`-padding (Omat kortit vs. muut). Korjautui UX-04:n yhteisellä alkukorkeudella: valitsin 0 px liikettä 320 px:llä (ennen 16 px). |
| UX-04 | korjattu | Kaikki sivut h1 y=129 px ja 28 px 320 px:llä (ennen 129/134/145 ja 28/36); 768 ja 1440 olivat jo tasan. Proxyn h1 pienennetty, Have/Wantin info-painike ei enää työnnä otsikkoa 5 px alas. |
| UX-05 | korjattu | Puhelimella nimi saa oman rivin, ohjaimet alle. Kuvakaappaus 320 px: kaikki nimet luettavissa (Legendit, "Goro Takemura, Losing His Way"). |
| UX-06 | korjattu | Alapalkin teksti rivittyy: tekstin oikea reuna 172 px < painikkeen vasen 184 px (ennen teksti meni painikkeen alle). |
| UX-07 | korjattu (jo T-173:n 2×2-asettelulla) | Neljä välilehteä on 2×2, "Julkiset pakat" mahtuu (scrollWidth = clientWidth, kuvakaappaus vaalea 320 px). Ei omaa muutosta. |
| UX-08 | korjattu | Alatunnisteen alle jätetään 6 rem merkintätilan ajaksi: alatunnisteen alareuna 804 px < palkin yläreuna 819/809 px (ennen alatunniste jäi 81–91 px palkin alle). |
| UX-09 | korjattu | Omistetut/Puuttuvat-suodatin kytketty editoriin, valintachip ja "Tyhjennä" nollaa sen, "Omistat N" riveillä ja kuvakorteissa. Oletus pysyy Kaikki (tuotepäätös). 2 uutta testiä. |
| UX-10 | korjattu | Vaalea teema: otsikko ja Avattu-leima tummennettu (`--badge-ink`, 40 % badge-väriä + musta). Kontrasti kaikilla väreillä ja tasoilla ≥ 6,67:1 (ennen 1,59 ja 3,27). Kirkas väri jää reunaan, hehkuun ja ikoniin. |
| UX-11 | korjattu | Vaalea teema: Yellow-palkki keltainen (rgb 242,194,0) ohuella tummalla reunalla. |
| UX-12 | korjattu | Kansion kansi oli 2 px kapeampi (1 px reunat) kuin sivu, joten pokkien korkeus erosi 5 px. Reuna → inset-varjo ja rivinkorkeus samaksi: painikkeet 0 px liike 320/1440. |
| UX-13 | korjattu | Alarivi on kaksisarakkeinen ruudukko, ohjain aina oikeassa sarakkeessa. Etäisyys ruudun oikeasta reunasta 13 px kaikissa ruuduissa (ennen 115–117 / 155–157 px), Kortit, Kokoelma ja Have/Want, 320/768/1440. |
| UX-14 | korjattu | Toissijainen: reuna osion värissä (keltainen/punainen/sininen/vihreä), 1 px nousu, ei alleviivausta eikä syaania. Sama `.tile-action`, linkit ja segmentit. |
| UX-15 | korjattu | Vaalea teema, primaarin hover: täyttö 62 % aksentti + musta (esim. 211,47,69 → 131,29,43) ja tumma alapalkki, nousu 1 px. |
| UX-16 | korjattu | Kaikki segmentit (myös `a.segmented-option`) saavat puolivahvan aksenttipalkin hoverissa. Mitattu Kortit, Pakat, Have/Want, Kokoelma. |
| UX-17 | jätetty | Käyttäjän päätös (kortissa "Ei nyt"). |
| UX-18 | korjattu | Linkkikenttä näkyy vasta "Jaa Have/Want" -painalluksen jälkeen, tyylitelty kentän tokeneilla. Testi. |
| UX-19 | korjattu | Want-listassa ja Lisää kortteja -välilehdellä ohjain 13 px oikeasta reunasta, linkki ennen sitä; sama fontti (Share Tech Mono). |
| UX-20 | korjattu | Gallerian koot Pieni/Normaali/Iso (avaimet ennallaan, englanniksi Small/Normal/Large), painikkeet isoin kirjaimin. Huomio: gallerian oletuskoko "normal" on nyt nimeltään "Pieni". |
| UX-21 | korjattu | Pakan nimi on automaattisesti kasvava yksirivinen textarea (Enter estetty, rivinvaihto → väli). 62 merkin nimi näkyy kokonaan 1440 ja 320 px. Testi. |
| UX-22 | korjattu | `align-items: flex-start`: Tyyppi/Väri/Harvinaisuus alkavat samalta riviltä (593 px, ennen 561/525). Sivupaneelissa (≥ 100 rem ja Kortit) säilytetty `stretch`. |
| UX-23 | korjattu | Tyyppimerkin kiinteä leveys: värisana alkaa samasta x:stä kaikilla riveillä (468 px; ennen 460/463). |
| UX-24 | korjattu | Hakurivillä varattu yksi huomautusrivi (Omistat/varoitus). Rivinkorkeudet ja listan paikka ennallaan lisäyksen jälkeen (1350 → 1350 px; ennen rivit 76,2 → 79,5 ja lista +19 px). Hälytysilmoitus on jo kiinteä (`position: fixed`), listan paikka 0 px. |
| UX-25 | korjattu | Pinot täyttävät sarakkeen (min 9 rem), otsikko yhdellä rivillä, → SB pinon kortin otsikkokaistalla (Pinot) tai ohjausrivillä (Kortit). Huomio: Pinot-näkymän nimi typistyy aiempaa lyhyemmäksi, koska → SB vie kaistasta tilaa. |
| UX-26 | korjattu | Proxy-valinta: ohjain pohjaan, rivit tasassa (32 epätasaista riviä → 0 1440 px:llä). |
| UX-27 | korjattu | Puhelimella Järjestys-otsikko omalla rivillään, selectit 140 + 140 px vierekkäin. |
| UX-28 | korjattu | Arkin otsikko "Turnauslista" / "Tournament list", riveillä riippuva sisennys (grid määrä / nimi). |
| UX-29 | korjattu | Kokoa kaikki -taulukko täysleveä (1367 px = matriisi), Kortti-otsikko vasemmalle. Matriisin sarakeotsikon 2 rivin leikkaus pitkällä pakan nimellä on tarkoituksellinen, ei muutettu. |
| UX-30, UX-31 | jätetty | Kortin mukaan PM käy läpi (mikrokopio ja sisältö). |
| UX-32a | korjattu | "Yksityinen/Julkinen-kytkimestä" (en: "Private/Public switch"). |
| UX-32b | korjattu (kortin ulkopuolella, kevyt) | Unit-väri kaavioissa: kirkas harmaanvalkoinen (tumma `#e8e8e2`, vaalea `#2f3440`) keltaisen sijaan. Kortti mainitsi vain 32a:n. Väri on helppo vaihtaa (`--seg-unit`), PM voi hylätä. |
| UX-32c | korjattu | `.deck-tile-name` min-height 24 px. |
| UX-32d | korjattu | Puhelimen korttilistassa alaotsikko nimen alle. |
| T-173:n sealed-pooli | korjattu | 3 saraketta puhelimella ja ryhmittely tyypeittäin (Unit/Gear/Program, otsikossa kappalemäärä). Tuplat olivat jo yhtenä ruutuna. 320 px:llä 62 eri kortin pooli: sivu 10954 → 6417 px, Unit-ryhmä noin 950 px. 1440 px:llä sivu 3734 → 4396 px, koska ryhmät katkaisevat 7 sarakkeen rivit. |

**Testit.** Uusia: UX-09-suodatin ja "Omistat N" (2), UX-01-päivitys, UX-18 (1), UX-21 (1), sealed-ryhmittely (1) ja `src/styles.ux174.test.ts` (11 tarkistusta CSS-säännöistä, joita jsdom ei mittaa: UX-02, 06, 10, 11, 12, 13, 14, 15, 16, 22, 24). Mittaukset itse ovat vain tässä korttitaulukossa ja scratchpad-skripteissä, eivät testeissä.

**Velka (suositukset).**
- Pinot-näkymän → SB peittää osan nimestä (UX-25); mahdollinen parannus: nimi toiselle kaistalle tai painike vasta hoverissa/fokuksessa.
- Hakutuloksen "Omistat N" -rivi lisää rivin korkeutta (varattu kaikille riveille); tiiviimpi UX-31-asettelu voisi yhdistää sen metarivin kanssa.
- UX-24: varattu rivi on yhden rivin korkuinen. Jos puhelimen kapealla sarakkeella huomautus rivittyy kahdelle riville, rivi voi silti kasvaa (UX-31-laajuus).

**Avoimet.** Ei tuotepäätöksiä. Huomioitavaa: UX-20:n "Pieni" on gallerian oletuskoko; Unit-väri (UX-32b) on kortin ulkopuolinen visuaalinen valinta. Ei pushattu. Riskialtista (tietomalli, säännöt, auth, firebase, riippuvuudet) ei ole, joten PM voi julkaista D-029:n mukaan.
