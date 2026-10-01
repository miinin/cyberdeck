# UX-003 · T-012 kokoelman käytettävyys-, saavutettavuus- ja mikrokopiokatselmointi

**Katselmoija:** UX Designer · **Päivä:** 2026-10-01 · **Tehtävä:** T-012 · **PR:** #5 (haara `t-012-kokoelma`, HEAD b732d1d)
**Kohde:** esikatselu https://cyberdeck-tcg-test--pr5-t-012-kokoelma-p0gxaskf.web.app sekä lähdekoodi (`CountControl.tsx`, `CardList.tsx`, `CardName.tsx`, `src/styles.css`, `texts.ts`)
**Vertailukohta:** `docs/UX.md` luku 6 (tarkistuslista 6.13), luvut 3.1.1, 3.4 ja 5

Huom. tunniste: raportin numero on UX-003 (raporttitiedostoja UX-001 ja UX-002 on olemassa). Löydöstunnisteet UX-001 ... UX-004 on jo käytetty aiemmissa raporteissa ja UX.md:ssä, joten tämän raportin löydökset ovat **UX-005 ja UX-006**.

## Yhteenveto

Toteutus vastaa luvun 6 määrittelyä lähes kaikilta osin. Selaintarkistus onnistui (Chrome headless, ks. Menetelmä), eli Koodarin avoimet kohdat saatiin tarkistettua: axe-core ei löytänyt yhtään rikkomusta 8 tilasta, ei vaakavieritystä 320 px:ssä, 400 %:n zoomia vastaavalla leveydellä eikä WCAG 1.4.12 -välistyksellä, painikkeet ovat 44 × 44 px ja saavutettavuuspuu säilyttää taulukkosemantiikan korttiasettelussa. Live-ilmoitukset, fokus, pysyvyys ja kaikki tarkistetut virhetilat toimivat määritellysti.

Löydöksiä on kaksi, molemmat visuaalisia tai kosmeettisia: yksi Medium (kapea rivin tyyppi-, väri- ja hintarivi rivittyy huonosti ja jättää orvon erottimen) ja yksi Low (ensimmäinen kortti on kapealla näytöllä kaukana ruudun alla). Rivin saavutettavuusnimen kysymys on ratkaistu: Chromessa nimi on "V , Streetkid", ei jsdomin "V,Streetkid" (ei löydös, ks. havainnot).

**Veto: ei.** UX hyväksyy T-012:n Done-tilaan omalta osaltaan. UX-005 (Medium) suositellaan korjattavaksi tässä tehtävässä, koska korjaus on pieni CSS-muutos. Jos PM siirtää sen omaksi tehtäväkseen, se ei estä Done-tilaa. Blokkaavia löydöksiä ei ole.

## Menetelmä

Chrome (`C:\Program Files\Google\Chrome`, headless) ohjattuna puppeteer-core-kirjastolla, joka asennettiin vain scratchpad-kansioon (ei projektin riippuvuus). axe-core 4.x injektoitiin `bypassCSP`:llä, koska sivun CSP estää oikein inline-skriptit. Tagit: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`. Saavutettavuuspuu luettiin Chromen CDP:llä (`Accessibility.getFullAXTree`). Lighthousea ei ajettu (axe kattaa samat säännöt). Virhetilat pakotettiin selaimessa: vioittunut `cyberdeck:collection`-arvo (`reset`), `schemaVersion: 99` (`newer-version`), `Storage.setItem` heittää `QuotaExceededError` (`quota`), `localStorage`-getter heittää (`persistent: false`). Jokainen skenaario ajettiin puhtaassa selainkontekstissa, joten oikeaan dataan ei koskettu.

### Automaattinen ja mitattu

| Tarkistus | Tulos |
|---|---|
| axe: oletustila 320 px, 1024 px, 320 × 256 px (400 %) | 0 rikkomusta, 0 keskeneräistä |
| axe: kokoelmassa kortteja + "Vain omistetut" päällä, 320 px | 0 rikkomusta |
| axe: tumma teema, kokoelmassa kortti | 0 rikkomusta |
| axe: `reset` (backupKey merkkijono), `newer-version` (LUKITTU), `quota`, `persistent: false` | 0 rikkomusta kussakin |
| Vaakavieritys | 320 px: 0 px · 320 × 256 px (400 %): 0 px · WCAG 1.4.12 -välistys 320 px: 0 px |
| Painikkeiden koko 320 px | `+` ja `−` 44 × 44 px |
| Rivin asettelu 320 px | `display: grid`, nimiruudukon leveys 132 px, 151 riviä |
| Leveys 1024 px | sarakkeet noin 383 / 99 / 65 / 172 px, sama taulukko neljällä sarakkeella |
| Dokumentti | `lang="fi"`, `<title>Kortit · Cyberdeck</title>`, otsikot `h1` → `h2`, ei hyppyjä |
| Sticky- tai fixed-elementtejä | ei (2.4.11 ei uhattuna) |
| Kontrasti | `+`-painike: valkoinen `#fff` / `#a3004f` noin 8,6:1 (vaalea). Tumma: `#0f1115` / `#ff6bb0` selvästi yli 4,5:1 (axe ei löytänyt kontrastivirheitä) |
| Fokusrengas | 3 px `--color-accent`, offset 2 px, ei leikkaudu; näkyy sekä vaalealla että tummalla (tarkistettu sarkaimella ja kuvakaappauksella) |
| Animaatiot | ei lisättyjä animaatioita, olemassa oleva `prefers-reduced-motion`-sääntö kattaa kaiken |

### Selaintoiminnot (320 px)

| Toiminto | Havaittu | Määrittely |
|---|---|---|
| `+` yhdellä painalluksella | määrä 1, `Vähennä`-painike ja määrä ilmestyvät, `+` pysyy paikallaan | 6.4.2 täyttyy |
| Live 1 painallus | `V, Streetkid lisätty kokoelmaan: 1 kappale.` | 6.9 |
| Kaksi nopeaa painallusta (100 ms) | yksi ilmoitus `V, Streetkid: 3 kappaletta kokoelmassa.` | 6.9 (alkutilasta lopputilaan, hillintä) |
| Yhteenveto | `Kokoelmassa 1 eri kortti, yhteensä 3 kappaletta.` (taivutus oikein) | 6.5 |
| `−` nollaan | fokus siirtyi `+`-painikkeeseen, live `V, Streetkid poistettu kokoelmasta.` | 6.4.2, 6.10 |
| Sivun lataus uudelleen | merkinnät säilyivät (`Kokoelmassa 2 eri korttia, yhteensä 2 kappaletta.`) | kriteeri 2 |
| "Vain omistetut" | 2 riviä, tilarivi `2 / 151 korttia`, live `Näytetään 2 / 151 korttia.` | 6.6 |
| "Vain omistetut" + `−` nollaan | rivi jäi näkyviin, live ilmoitti poiston | A5, 6.6 |
| `Pyydä pysyvää tallennusta` (headlessissa lupa evätty) | tulosteksti `Selain ei antanut lupaa pysyvään tallennukseen. …`, fokus `storage-result`-kappaleeseen | 6.7, 6.10 (c) |
| `quota`-virhe `+`:sta | rivin määrä palasi (`Ei kokoelmassa`), danger-laatikko `Muutosta ei voitu tallentaa`, live `Muutosta ei voitu tallentaa Kortin määrä ei muuttunut.` | 6.8 |
| `newer-version` | warning-laatikko, ei painikkeita, ei yhteenvetoa, live ilmoitti | 6.8 LUKITTU |
| `reset` (vioittunut) | warning-laatikko + `Sulje` (nimi `Sulje ilmoitus: …`), live 1,5 s latausilmoituksen jälkeen | 6.8 |
| `persistent: false` | warning-laatikko, ei pysyvän tallennuksen painiketta, `+` toimii | 6.8 |
| Sarkainjärjestys | `Pyydä pysyvää tallennusta` → hakukenttä → "Vain omistetut" → tyypit → värit → rivien painikkeet | 6.10 |

### Saavutettavuuspuu (Chrome)

- Taulukko: `table` nimellä `Kaikki kortit`, `columnheader`-solut `Nimi`, `Tyyppi ja väri`, `Hinta`, `Omistan`, `rowheader`-solut kortin nimellä. Eksplisiittiset ARIA-roolit säilyttävät taulukkosemantiikan korttiasettelussa (6.4.4 täyttyy).
- Painikkeet: `Lisää yksi kappale: V, Streetkid`, `Vähennä yksi kappale: V, Streetkid`. Symbolit `aria-hidden`.
- **Rivin otsikon saavutettava nimi** on Chromessa `V , Streetkid` (välilyönti ennen pilkkua), ei jsdomin `V,Streetkid`. Ruudunlukijat lukevat molemmat käytännössä "V, Streetkid" (pilkku tuottaa tauon). Ei löydös. Syy on sama piilotettu `, `-väli kuin T-010:n taulukossa.

## Myönteiset havainnot (tarkistettu, ei löydöksiä)

- Määräkontrolli: yksi painallus omistetuksi, `+` pysyy paikallaan, fokus ei katoa nollattaessa. Hyvä pelipöytäkäyttöön.
- Live-alueen hillintä ja tallennuksen jälkeinen ilmoitus toimivat; tallentamattomasta määrästä ei ilmoiteta, ja virheessä näytetty määrä palautuu.
- Kaikki neljä pakotettua virhe- ja ilmoitustilaa näyttävät oikean otsikon ja tekstin ilman teknisiä tietoja, avaimia tai `backupKey`:tä (SEC-007). Mikrokopio on selkeää, aktiivista ja kertoo korjausohjeen (esim. `quota`: "Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta").
- Selainmuistutus (R-10) ja pysyvän tallennuksen pyyntö vain painikkeesta (ei automaattisesti latautuessa).
- Ei vaakavieritystä, ei sticky-peittoa, kosketusalueet 44 × 44 px, kaikki värit tokeneista, tumma teema toimii.
- Tieto ei välity pelkällä värillä: tyyppi ja väri tekstinä, himmennetyssä `+`:ssa katkoviivareuna.

## Löydökset

### UX-005 · Kapean rivin tyyppi-, väri- ja hintarivi rivittyy huonosti, ja siihen jää orpo erotin · Medium
**Sijainti:** `src/styles.css` (`@media (max-width: 39.99rem)`, `.col-type`, `.col-cost`, ruudukkoalueet `type` ja `cost`) ja `src/ui/CardList.tsx` (`.separator`) · **Tehtävä:** T-012
**Toistaminen:** 1) Avaa esikatselu 320 px:n leveydellä. 2) Katso mitä tahansa korttiriviä, esim. V, Streetkid.
**Odotettu (UX.md 6.4.4):** `Legend · ■ Punainen · Hinta 5` yhdellä rivillä.
**Havaittu:** `Legend · ■ Hinta 5` ja sen alla `Punainen ·`. Värin neliö on erossa värin nimestä, hinta tulee ennen värin nimeä, ja rivin lopussa on orpo erotin `·`. Sama kaikilla rivityksillä, koska tyyppi/väri-solu ja hintasolu ovat omissa ruudukon sarakkeissaan, ja kontrolli (132 px) jättää niille vain noin 148 px.
**Vaikutus:** Tieto säilyy, ja ruudunlukija lukee oikein (erottimet ovat `aria-hidden`), mutta jokaisen rivin rakenne näyttää rikkinäiseltä ja selattavuus heikkenee juuri ensisijaisella mobiilinäkymällä. Rivi on myös tarpeettoman korkea (noin 104 px). Syy on määrittelyssäni: 6.4.4:n rautalanka oletti, että kolme tietoa mahtuu riville, mikä ei pidä 320 px:ssä.
**Korjausehdotus:** Älä jaa tyyppiä/väriä ja hintaa eri ruudukon sarakkeisiin. Vaihtoehto A: `grid-template-areas: 'name control' 'type control' 'cost control'` (kolme riviä: nimi, `Legend · ■ Punainen`, `Hinta 5`) ja poista erotin `type`-solun lopusta (`.separator:last-child { display: none }`). Vaihtoehto B: pidä `type` ja `cost` yhdessä flex-rivissä, jossa `.card-color { white-space: nowrap }` estää neliön ja nimen erottumisen. Poista joka tapauksessa solun jälkimmäinen `.separator`, jos hinta tulee uudelle riville. Päivitän UX.md 6.4.4:n rautalangan, kun valinta on tehty.
**Tila:** Avoin

### UX-006 · Ensimmäinen kortti on kapealla näytöllä kaukana ruudun alla · Low
**Sijainti:** `src/ui/CatalogView.tsx` (sivun rakenne, selainmuistutus ja suodattimet ennen taulukkoa) · **Tehtävä:** T-012
**Toistaminen:** 1) Avaa esikatselu 320 × 640 px:n ikkunassa. 2) Ensimmäinen näkymä sisältää otsikon, yhteenvedon, muistutuksen, painikkeen, hakukentän, "Vain omistetut" -valinnan ja osan suodattimista, mutta yhtään korttia ei näy. Ensimmäinen rivi tulee esiin noin 950 px:n vierityksen jälkeen.
**Odotettu:** Tavoite on, että käyttäjä merkitsee kortin muutamalla painalluksella.
**Havaittu:** Selainmuistutus ja pysyvän tallennuksen painike lisäsivät noin 230 px sisältöä ennen listaa. Valintaryhmät (T-018) vievät loput.
**Vaikutus:** Hidastaa ydintoimintoa puhelimessa, mutta kaikki on saavutettavissa. Ei estä käyttöä, ja asettelu vastaa määrittelyä (6.3).
**Korjausehdotus:** T-018 (mobiilin kompakti suodatinlomake) ratkaisee suurimman osan. Harkitse myös muistutuksen ja pysyvän tallennuksen painikkeen siirtämistä listan jälkeen tai taittuvaan `details`-osioon. Ideana IDEAS.md:ssä, ei tässä tehtävässä.
**Tila:** Avoin (suositus, ei vaadi korjausta T-012:ssa)

## Ei tarkistettu (rehellisesti)

- **Oikea ruudunlukija** (NVDA, VoiceOver, TalkBack): ei saatavilla. Arvio perustuu Chromen saavutettavuuspuuhun ja live-alueen sisältöön.
- **Lighthouse:** ei ajettu. axe kattaa samat säännöt.
- **400 %:n zoom** emuloitiin leveydellä 320 CSS-px (korkeus 256), ei selaimen zoomilla. 200 % katettu 640 px:n asettelulla ja tekstivälistystestillä.
- **Raja 999 selaimessa:** ei toistettu käyttöliittymän kautta (999 oikeaa painallusta ei ole realistinen testi, ja synteettinen 1000 `click()`-kutsun silmukka ohittaa Reactin renderöinnit eikä edusta käyttäjää). Kattavat Koodarin yksikkö- ja näkymätestit (46 + 21 testiä) ja koodi (`aria-disabled`, `onLimit`).
- **Toinen välilehti (`subscribe`)**, kosketuslaite, näytön kääntö ja `LUKITTU`-tilan siirtyminen kesken muutoksen: vain testien ja koodin varassa.
- **`repaired`-ilmoitus selaimessa:** ei pakotettu (vaatii rakenteeltaan oikean vioittuneen datan). Koodarin testit kattavat sen.
- Yli 300 sarkainpysähdystä listalla on tiedossa (IDEAS.md), ei uusi löydös.

## Veto-päätös

**Veto: ei.** Ydinpolku (kortin merkitseminen omistetuksi, määrän muutos, suodatus, pysyvyys) toimii näppäimistöllä, kosketuskoossa ja ilman saavutettavuusrikkomuksia. Löydökset UX-005 (Medium, kosmeettinen rivitys) ja UX-006 (Low) eivät estä Done-tilaa. Sisällön ja mikrokopion osalta UX ei löytänyt muutettavaa; Sisällöntuottajan erillistä katselmointia ei tarvita (D-009).
