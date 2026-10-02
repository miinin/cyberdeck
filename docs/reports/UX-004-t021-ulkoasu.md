# UX-004 · T-021 ulkoasun käytettävyys-, saavutettavuus- ja ilmekatselmointi

**Katselmoija:** UX Designer · **Päivä:** 2026-10-02 · **Tehtävä:** T-021 · **PR:** #6 (haara `t-021-ulkoasu`, HEAD 1a944aa)
**Kohde:** esikatselu https://cyberdeck-tcg-test--pr6-t-021-ulkoasu-34z9gdo0.web.app sekä lähdekoodi (`src/styles.css`, `App.tsx`, `CardFilters.tsx`, `CardList.tsx`, `CatalogView.tsx`)
**Vertailukohta:** `docs/UX.md` luvut 3 ja 7 (versio 0.7), mallisivu `docs/design/t021-mallisivu.html`, D-010 ja D-011. Vertailu entiseen ulkoasuun: testisivusto https://cyberdeck-tcg-test.web.app (T-021 ei ole vielä siellä).

Huom. tunniste: raportin numero on UX-004 (raportit UX-001 … UX-003 ovat olemassa). Löydöstunnisteet UX-001 … UX-006 on käytetty, joten tämän raportin löydökset ovat **UX-007 … UX-010**.

## Yhteenveto

Toteutus vastaa määrittelyä ja mallisivua hyvin. Axe-core ei löytänyt yhtään rikkomusta 24 ajossa (kaksi teemaa, 320 px ja 1280 px, päänäkymä ja viisi tilaa). Kontrastit mitattiin renderöidyltä sivulta, ja ne vastaavat UX.md 7.6:n laskelmia (pienin teksti 5.97 : 1, pienin UI 3.77 : 1, fokus 5.88–11.44 : 1). Näppäimistöpolku, fokus, liikkeen vähentäminen, 400 %:n zoom, Windowsin suuri kontrasti ja kaikki tilat toimivat. Kovakoodattuja värejä tai välejä ei ole tokenien ulkopuolella. Ilme on tunnistettavasti Cyberpunk 2077 -henkinen molemmissa teemoissa, eikä käytettävyys ole heikentynyt toimintojen löytyvyyden osalta.

Löydöksiä on viisi: kaksi Medium ja kolme Low. Korjausten varmistuksen (luku "Korjausten varmistus") jälkeen UX-007, UX-008 ja UX-009 on Varmistettu. Medium-löydökset ovat Rajdhanin korotettujen kokojen sivuvaikutuksia kapealla näytöllä (pidempi lista, vaakavieritys vain tekstin 200 %:n suurennuksella). Molemmat ovat pieniä CSS-muutoksia.

**Veto: ei.** UX hyväksyy T-021:n Done-tilaan omalta osaltaan. UX-007 ja UX-008 suositellaan korjattavaksi tässä tehtävässä (pieni CSS-muutos). Jos PM siirtää ne omaksi tehtäväkseen, ne eivät estä Done-tilaa. Blokkaavia löydöksiä ei ole.

| Tunniste | Vakavuus | Aihe | Tila |
|---|---|---|---|
| UX-007 | Medium | Kapean näkymän rivit ovat korkeampia, ja lista on 43 % pidempi kuin ennen | Varmistettu (UX 2026-10-02) |
| UX-008 | Medium | Vaakavieritys 320 px:ssä, kun tekstiä suurennetaan 200 % (vain teksti) | Varmistettu (UX 2026-10-02) |
| UX-009 | Low | Omistetun rivin kisko 3 px kapealla ja 4 px leveällä asettelulla | Varmistettu (UX 2026-10-02) |
| UX-010 | Low | Selaimen oma haun tyhjennyspainike (×) on pieni eikä teemoitettu | Siirretty tehtävään T-022 |
| UX-011 | Low | Nimi rivittyy uudelleen, kun − ilmestyy (kapea rivi vaihtaa korkeutta) | Avoin, hyväksytty vaihtokauppa, ei vaadi korjausta |

## Menetelmä

- **Selain:** Chrome (`C:\Program Files\Google\Chrome`, headless) ohjattuna puppeteer-core-kirjastolla, joka asennettiin vain scratchpad-kansioon (ei projektin riippuvuus). axe-core 4.x injektoitiin `bypassCSP`:llä, koska sivun CSP estää oikein inline-skriptit. Tagit: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`.
- **Kokoonpanot:** `prefers-color-scheme` vaalea ja tumma × leveys 320 px ja 1280 px. Tilat: onnistuminen (omistettuja rivejä), LATAUS (pyyntö viivästetty), VIRHE (pyyntö estetty), TYHJÄ (`total: 0`), OSITTAINEN (`total` suurempi kuin saatu), EI TULOKSIA (hakusana "zzzzqq"). Pyynnöt `api.netdeck.gg`:lle katkaistiin tai korvattiin vain selaimessa. Oikeaan dataan ei koskettu (selaimen profiili oli tilapäinen).
- **Kontrastit:** axe merkitsee `color-contrast`-säännön keskeneräiseksi, koska bodyssa on taustakuvia. Siksi tekstin väri luettiin laskettuna tyylinä (`getComputedStyle`) ja taustaväri mitattiin renderöidystä sivusta: elementin teksti piilotettiin (`color: transparent`) ja kuvakaappauksen yleisin pikseli otettiin taustaksi. Suhde laskettiin WCAG 2.x -kaavalla. Painikkeiden täyttö mitattiin samoin (siirtymät pois päältä, koska väri-siirtymä vääristi ensimmäistä lukemaa).
- **Näppäimistö:** Tab-järjestys luettiin tuoreelta sivulta, ja fokusoitujen elementtien `outline`, `clip-path` ja rengas-kontrasti mitattiin.
- **Zoom:** 400 % vastaa 320 px:n leveyttä. Lisäksi 200 % zoom (640 px), tekstin 200 % suurennus (juuren fonttikoko 200 %) 1280 px, 640 px ja 320 px:ssä sekä tekstin välistys (WCAG 1.4.12) 320 px:ssä.
- **Liike:** `prefers-reduced-motion` `reduce` ja `no-preference`. Windowsin suuri kontrasti: `forced-colors: active` Chromen CDP:llä.
- **Ei tehty:** ruudunlukija (NVDA, VoiceOver, TalkBack), Firefox, Safari ja oikeat mobiililaitteet. Saavutettavuuspuun luenta ei kuulunut tähän katselmointiin. DOM-rakenne, lukujärjestys ja live-alueet ovat ennallaan (Koodarin luovutus ja testit), ja live-alueen tekstit tarkistettiin selaimessa kaikissa tiloissa.
- **Huomio menetelmästä:** katselmoinnin aikana sammutin Edge-selaimen prosessit (`taskkill /IM msedge.exe`) omien tilapäisten ajojeni siivoamiseksi. Se on voinut sulkea käyttäjän avoimet Edge-ikkunat. Ks. PM:lle menevä yhteenveto.

## Automaattinen tarkistus (axe)

| Kokoonpano | Rikkomuksia | Keskeneräistä |
|---|---|---|
| Päänäkymä, vaalea ja tumma, 320 px ja 1280 px (4 ajoa) | 0 | `color-contrast` (taustakuvio), ks. mitatut kontrastit |
| LATAUS, VIRHE, TYHJÄ, OSITTAINEN, EI TULOKSIA × 2 teemaa × 2 leveyttä (20 ajoa) | 0 | – |

Rakenne (sama kaikissa kokoonpanoissa): `lang="fi"`, `<title>Kortit · Cyberdeck</title>`, yksi `h1` ("Kortit"), ilmoituslaatikoissa `h2`, maamerkit `header`, `main`, `footer` ja `role="search"` kukin kerran. Vaakavieritys 0 px kaikissa 24 ajossa. Fontit (Rajdhani 500 ja 700, Share Tech Mono 400) latautuivat kaikissa.

## Mitatut kontrastit (renderöity sivu)

Mitatut arvot täsmäävät UX.md 7.6:n laskelmiin. Poikkeukset on selitetty taulukon alla.

| Pari | Vaalea | Tumma |
|---|---|---|
| Leipäteksti (`--color-text`) taustaa vasten | 16.79 | 17.25 |
| Haalea teksti (tilarivi, alatunniste) | 7.18 | 8.89 |
| Haalea teksti paneelissa / rivillä | 6.62 / 6.93 (omistettu rivi) | 8.30 / 8.19 (omistettu rivi) |
| Teksti omistetulla rivillä | 16.19 | 15.90 |
| Kokoelman yhteenveto (`--color-info`) | 6.39 | 12.25 |
| Otsikkopalkin teksti | 16.89 | 18.53 |
| Teksti ensisijaisella ja + -painikkeella | 15.84 | 16.17 |
| Teksti toissijaisella painikkeella (lepo / hover) | 18.16 / 13.41 | 14.69 / 12.63 |
| Ensisijaisen painikkeen hover (musta teksti syaanilla) | 12.00 | 12.25 |
| Virheilmoituksen otsikko | 6.03 | 5.97 |
| Varoituksen otsikko | 6.03 | 8.63 |
| Määrälukema omistetulla rivillä | 16.19 | 14.90 |
| **Fokusrengas** taustaa vasten (paneeli / rivi) | 5.88 / 6.91 | 11.44 / 10.43 |

- Fokusrengas on kaikissa mitatuissa elementeissä `3px solid` ja `outline-offset` 3 px (painikkeet) tai 2 px (kentät ja valintaruudut). Viistetyillä painikkeilla `clip-path` on fokuksessa `none`, joten rengas näkyy kokonaan (vaalea +-painike kuvakaappauksessa: tummansyaani rengas keltaisen täytön ympärillä).
- Vaalean teeman h1 mittautui 320 px:n ajossa virheellisesti (1.00). Syy on mittausmenetelmä (vierityksen jälkeinen leikkaus), koska sama h1 mittautui 1280 px:n ajossa 16.79 : 1 ja kuvakaappaus näyttää mustan otsikon kermanvalkoisella pohjalla. Ei löydös.
- Painikkeiden "#000000"-lukemat ensimmäisessä mittauksessa olivat siirtymän (`transition: color`) vääristymä. Uusintamittauksessa (siirtymät pois) arvot ovat yllä.
- Vaalean teeman tumma hover-pinta: `--color-info` / `--color-surface-hover` on 5.10 : 1, eli toissijaisen painikkeen hover-reuna (UI) ylittää 3 : 1 reilusti.

## Näppäimistö ja fokus

| Tarkistus | Tulos |
|---|---|
| Sarkainjärjestys | Pyydä pysyvää tallennusta → hakukenttä → Vain omistetut → Tyyppi (4) → Väri (4) → rivien − ja + -painikkeet. Looginen ja sama kuin DOM-järjestys. Ei ansoja. |
| Fokus näkyy | Kyllä, jokaisessa elementissä, molemmissa teemoissa (renderöidyt kuvat tarkistettu: painikkeet, valintaruutu, kenttä). |
| Fokus ei jää piiloon | Mikään elementti ei ole sticky. Fokusoitu rivi saa `:focus-within`-taustan, ja rengas on aina näkyvissä. |
| + painikkeen Enter | Fokus pysyy + -painikkeella, − ilmestyy viereen, rivi saa `is-owned`-luokan. − painikkeella 1 → 0: fokus siirtyy + -painikkeelle (UX.md 6.4.2), live-alue ilmoittaa "poistettu kokoelmasta". |
| Tab-pysähdyksiä | 151 riviä tuottaa noin 300 pysähdystä. Tunnettu, ei T-021:n muutos (IDEAS.md, 2026-10-01). |

## Liikkeen vähentäminen

| Asetus | Otsikon animaatio | Siirtymät (painike, valinta, rivi) |
|---|---|---|
| `no-preference` | `glitch`, 0,4 s, kerran | 0,12 s |
| `reduce` | ei animaatiota | 0,00001 s (turvaverkko) |

- Latauspalkki on `reduce`-tilassa paikallaan (tarkistettu CSS:stä, `animation` vain `no-preference`-lohkossa).
- Glitch on CSS-animaatio elementin syntyessä. Koodarin mukaan `h1` pysyy paikallaan tilanvaihdoissa, joten se ei toistu uudelleenyrityksessä (en testannut uudelleenyritystä erikseen).
- Koodarin tulkinta (siirtymät `no-preference`-ehdon sisään) noudattaa UX.md:n kohtia 3.3, 3.5 ja 7.7. Mallisivun siirtymät olivat ilman ehtoa, ja mallisivu on tässä väljempi kuin määrittely. Toteutus on oikein.

## Zoom, reflow ja tekstin välistys

| Kokoonpano | Vaakavieritys |
|---|---|
| 320 px (400 % zoom 1280 px:ssä) | 0 px, molemmat teemat |
| 480 px (267 %), 640 px (200 %) | 0 px |
| Teksti 200 % (juuren fontti), 1280 px | 0 px |
| Teksti 200 %, 320 px | **531 px (UX-008)**. Ennen T-021:tä 495 px. |
| Teksti 200 %, 640 px | 864 px. Ennen T-021:tä 842 px. |
| Tekstin välistys (WCAG 1.4.12), 320 px | 0 px, ei leikkautuvia elementtejä (`thead` on tarkoituksella visuaalisesti piilotettu) |

WCAG 1.4.10 (reflow) täyttyy. 1.4.4 (tekstin koon muutos) täyttyy sisällön osalta: kaikki on saavutettavissa, mutta vaakavieritys kapealla näytöllä on käytettävyyshaitta (UX-008).

## Windowsin suuri kontrasti (`forced-colors: active`)

Painikkeet, paneelit, chipit ja taulukon viivat näkyvät järjestelmän väreillä ja reunoilla. Valintaruudut ovat tunnistettavia. Koristeet (keltainen merkki, kulmasulut, raidoitus) häviävät, mikä on tarkoitus. Värinäytteet muuttuvat ääriviivoiksi, mutta värin nimi on aina tekstinä, joten tieto ei häviä.

## Vastaavuus määrittelyyn ja mallisivuun

| Kohta | Tulos |
|---|---|
| Tokenit (UX.md 3.1–3.3), molemmat teemat | Vastaavat. Ei kovakoodattuja värejä tai välejä tokenien ulkopuolella (`src/styles.css` tarkistettu: hex- ja rgba-arvoja vain `:root`-lohkoissa). |
| Typografia | Rajdhani 500/700 ja Share Tech Mono: leipäteksti 18 px / 500, pienin teksti 16 px (mitattu: `16 (P)`). Versaalit vain otsikoissa, painikkeissa, labeleissa ja taulukon otsikoissa. |
| Muodot | Viistetyt painikkeet, HUD-kulmasulut hakupaneelissa, vinoraidat ilmoituksissa, viistetty värinäyte, omistetun rivin kisko: kaikki toteutettu. |
| Painikkeet | Reuna + täyttö -rakenne toimii. Vaalealla musta reuna, tummalla keltainen. Hover (syaani täyttö + alleviivaus) ja fokus (rengas ilman leikkausta) toimivat. |
| Määräkontrolli | − / + / lukema. 0-rivillä vain +. Enimmäismäärän (999) tyyli on koodissa ja vastaa mallia (raidoitus, himmeä merkki). Tilaa ei testattu käsin (999 painallusta, ei arvoa). |
| Ilmoituslaatikot | VIRHE ja OSITTAINEN vastaavat mallia. Otsikon väri ja raidoitus näkyvät. |
| Latauspalkki | Näkyy vain LATAUS-tilassa, `aria-hidden`. |
| Tekstit | Ennallaan (`texts.ts` ei muutu). Live-alueen tekstit tarkistettu kaikissa tiloissa: "Haetaan kortteja…", "Korttien haku epäonnistui.", "Kortteja ei löytynyt.", "Näytetään 2 / 5 korttia. Osa korteista puuttuu listasta.", "Hakua vastaavia kortteja ei löytynyt." |
| Koodarin huomio 1: siirtymät | Hyväksytty (ks. Liikkeen vähentäminen). |
| Koodarin huomio 2: kortin nimen koko | UX.md oli ristiriidassa (7.4: 1.25rem, 7.5: 1.0625rem). Ratkaisu: 1.25rem on voimassa (`--font-size-card-name`). UX.md korjattu (versio 0.8). Mitattu nimi näyttää selvältä molemmilla leveyksillä. |
| Koodarin huomio 3: uudet tokenit | Hyväksytty ja kirjattu UX.md:n lukuun 3 (versio 0.8): `--color-brand-yellow`, `--color-glitch-a/b`, `--font-size-card-name`, `--line-height-tight`, `--letter-spacing-button/-table-head/-h2/-brand`, `--font-weight-mono`, `--shape-swatch`, `--shape-brand`. `--radius` poistettu (UX.md 3.3). |
| Koodarin huomio 4: Tyyppi ja Väri rivittyvät | Hyväksytty. Ryhmät ovat allekkain myös työpöydällä, ja väli on sama kuin pinottuna. Ratkaisu on selkeämpi kuin kapea, tiivis rinnakkainen asettelu. |
| Mallisivun `.step`-viistebugi | Koodari korjasi (`--cut` ei muuttanut muotoa, koska `--shape-chamfer` lasketaan `:root`issa). Määräpainikkeiden viiste on nyt 0.5 rem. UX.md 3.3:een lisätty huomautus. |

## Käytettävyys ja ilme (D-010: 1. käytettävyys, 2. Cyberpunk 2077 -henki)

**Käytettävyys: hyvä.** Hierarkia on selkeä: h1 ja tilarivi, kokoelman yhteenveto, hakupaneeli, lista. Painikkeet erottuvat (keltainen = tee jotain, reunallinen = toissijainen), ja valittu tila näkyy sekä värinä että ruksina. Omistetut rivit erottuvat keltaisella taustalla ja kiskolla, ja määrä näkyy myös numerona. Kaikki nykyiset toiminnot ja tekstit ovat tallella ja löytyvät samoista paikoista. Kosketuskohteet ovat vähintään 44 × 44 px (mitattu, ei yhtään pienempää). Pienin teksti on 16 px.

**Ilme: vahva molemmissa teemoissa.**
- Tumma: lähes musta tausta, keltainen täyttö, syaani fokus ja hover, mono-fontin HUD-lukemat ja kulmasulut. Tunnistettavin Cyberpunk-tulkinta, ja se toimii alusta (otsikkopalkki, h1:n alaviiva ja glitch) loppuun (alatunniste).
- Vaalea: kermanvalkoinen "paperi" mustalla tekstillä ja keltaisilla täytöillä mustalla reunalla, musta otsikkopalkki. Vähemmän neonia, mutta selvästi sama maailma ("poster"-tulkinta). Keltainen ei ole koskaan teksti, joten luettavuus ei kärsi. Omistetun rivin tausta (keltainen 30 %) on voimakas mutta kantaa merkityksen.
- Ilme ei haittaa lukemista: tekstin päällä ei ole efektejä (vain hienovarainen taustakuvio), glitch on yksi 0,4 s:n siirtymä, ja värit ovat tokeneina.

**Intuitiivisuus (Nielsen):** järjestelmän tila näkyy (tilarivi, yhteenveto, latauspalkki, ilmoitukset), käyttäjän kieli säilyy (tekstit ennallaan), peruutus ja kumoaminen ovat ennallaan (− -painike, tyhjennä haku), johdonmukaisuus on parantunut (yksi painiketyyli, yksi ilmoituslaatikko, samat tokenit), virheilmoitukset kertovat, mitä tehdä. Mikään ei vaadi opettelua.

## Löydökset

### UX-007 · Kapean näkymän rivit ovat korkeampia ja lista 43 % pidempi · Medium
**Sijainti:** `src/styles.css`, `.card-table` kapea asettelu (< 40 rem) · **Tehtävä:** T-021
**Toistaminen:** 1) Avaa esikatselu 320 px:n leveydellä. 2) Mittaa taulukon yläreunan sijainti ja yhden rivin korkeus. 3) Vertaa testisivustoon.
**Odotettu:** Rajdhanin korotetut koot (V9, hyväksytty) eivät saa pidentää listaa kohtuuttomasti.
**Havaittu:** taulukon yläreuna on 1284 px:ssä (ennen 934 px), rivin korkeus 140 px (ennen 104 px) ja koko sivun korkeus 23 901 px (ennen 16 683 px, +43 %). Rivissä on neljä tekstiriviä: nimi, alaotsikko, tyyppi ja väri sekä hinta. Useammin kuin ennen myös nimi rivittyy ("Johnny Silverhand" kahdelle riville), koska nimisarakkeen leveys on 320 px:ssä vain noin 130 px.
**Vaikutus:** pelaajan on vieritettävä enemmän löytääkseen kortin (noin 30 näytön lista). Tämä on V9:n tiedossa oleva seuraus, mutta sitä voi pienentää ilman luettavuuden menetystä. Liittyy avoimeen UX-006:een (suodattimien korkeus mobiilissa, T-018).
**Korjausehdotus:** 1) Kapean rivin tyyppi, väri ja hinta samalle (rivittyvälle) riville: `.col-type, .col-cost { display: inline }` tai flex `flex-wrap: wrap; column-gap: var(--space-2)` → rivi 3 tekstiriviä (noin 112 px). 2) Rivin pystysisäväli `--space-3` → `--space-2` (säästää 8 px × 151 = noin 1200 px). Lopputuloksena lista on noin 25 % lyhyempi kuin nyt.
**Tila:** Avoin → Korjattu (commit 0b6395c) → **Varmistettu (UX 2026-10-02)**, ks. luku "Korjausten varmistus". Kapea rivi on flex-rivi: 1. rivi nimi ja kontrolli, 2. rivi tyyppi · väri ja hinta (rivittyy). Sisäväli `--space-2` pysty. Kontrollille ei varata leveyttä kapealla (UX.md 7.5 päivitetty). Mitattu 320 px, molemmat teemat: rivin keskikorkeus 85 px (aiemmin 140 px), omistettu rivi 85–103 px, sivun korkeus 14 386 px (aiemmin 23 901 px, −40 %), vaakavieritys 0 px. Taulukon yläreuna on ennallaan 1284 px:ssä (suodattimet, UX-006/T-018).

### UX-008 · Vaakavieritys 320 px:ssä, kun tekstiä suurennetaan 200 % · Medium
**Sijainti:** `.brand`, `.button-secondary` (selainmuistutus), `.option`, `.count-control` ja kapea rivi · **Tehtävä:** T-021 (pohjana T-012:n `min-width`)
**Toistaminen:** 1) Aseta juurielementin fonttikoko 200 % (esim. Androidin suuri fontti tai Firefoxin "vain teksti" -zoom). 2) Avaa sivu 320 px:n leveydellä. 3) Havaitse vaakavieritys.
**Odotettu:** ei vaakavieritystä, kun tekstiä suurennetaan 200 %.
**Havaittu:** `scrollWidth` 531 px, kun `clientWidth` on 320 px (ennen T-021:tä 495 px). Ylittävät elementit: `.brand` (kirjainväli 0.2em), `.button-secondary` (pitkä versaaliteksti ei rivity), `.option`, `.col-control` / `.count-control` (`min-width: calc(3 * var(--target-min) + 2 * var(--space-2))` kasvaa rem-yksiköissä) ja rivi. Selaimen oikea zoom (400 %, 320 px) ja 200 % zoom (640 px) eivät aiheuta vieritystä.
**Vaikutus:** suurella järjestelmäfontilla puhelimessa on vieritettävä sivusuunnassa. Sisältö on kuitenkin saavutettavissa. Ennen T-021:tä ongelma oli jo olemassa (IDEAS.md 2026-10-01, UX-003), ja T-021 lisäsi siihen `.brand`- ja painikeylitykset.
**Korjausehdotus:** `.button-secondary, .button-primary { max-width: 100%; white-space: normal }`, `.brand { overflow-wrap: anywhere }` tai kirjainväli pienemmäksi kapealla, `.option { flex-wrap: wrap; max-width: 100% }`, ja `.count-control`in `min-width` kapealla asettelulla `auto` (tai `flex-wrap: wrap`), jolloin nimisarake ja kontrolli saavat jakaa leveyden. Tarkista uudelleen skriptillä: `html { font-size: 200% }` 320 px:ssä.
**Tila:** Avoin → Korjattu (commit 0b6395c) → **Varmistettu (UX 2026-10-02)** 320 px:ssä. 640 px + teksti 200 % siirretty tehtävään T-023. Painikkeet `max-width: 100%`, `white-space: normal`, `overflow-wrap: anywhere`; `.option` `max-width: 100%` ja `overflow-wrap: anywhere`; `.brand` `min-width: 0` ja `overflow-wrap: anywhere`; `.count-control` kapealla `min-width: 0` ja `flex-wrap: wrap`; nimen `flex-basis: 6rem` siirtää kontrollin omalle rivilleen suurella tekstillä. Mitattu (`html { font-size: 200% }`): 320 px vaakavieritys 0 px (aiemmin 531 px) molemmissa teemoissa, 1280 px 0 px. Huom. 640 px + teksti 200 %: leveä taulukko vierittää yhä 224 px (aiemmin 864 px), koska 40 rem:n mediakysely ei reagoi tekstikokoon. Ei kuulunut löydöksen 320 px:n rajaukseen.

### UX-009 · Omistetun rivin kisko 3 px kapealla ja 4 px leveällä asettelulla · Low
**Sijainti:** `src/styles.css` `tr.is-owned::before` (3 px) ja `tr.is-owned .card-name` (`inset 4px`) · **Tehtävä:** T-021
**Havaittu:** UX.md 7.5 sanoi kapealle asettelulle 3 px ja leveälle 4 px (mallisivu: 4 px kummassakin). Koodari noudatti UX.md:tä, joten tämä on määrittelyn epäjohdonmukaisuus.
**Vaikutus:** kosmeettinen. Johdonmukaisuus (Nielsen) edellyttäisi yhtä leveyttä.
**Korjausehdotus:** UX.md päivitetty (versio 0.8): kisko on 4 px kummassakin. Koodari muuttaa kapean asettelun `width: 3px` → `4px` (yksi rivi, voi tehdä UX-007:n yhteydessä).
**Tila:** Avoin → Korjattu (commit 0b6395c) → **Varmistettu (UX 2026-10-02)**. Kapean asettelun kisko 4 px (mitattu `::before` 4px).

### UX-010 · Selaimen oma haun tyhjennyspainike (×) on pieni eikä teemoitettu · Low
**Sijainti:** `#card-search` (`type="search"`) · **Tehtävä:** T-010 (ennallaan), näkyy T-021:n teemassa
**Havaittu:** Chromen oma × näkyy kentän oikeassa reunassa pienenä ja sinisenä (esim. kuvakaappaus EI TULOKSIA, vaalea). Painikkeen kokoa ei mitattu (selaimen sisäinen elementti). Tyhjennys on saatavilla myös Esc-näppäimellä ja "Tyhjennä haku ja suodattimet" -painikkeella.
**Vaikutus:** Low. Kosketuskohde on todennäköisesti alle 24 × 24 px (WCAG 2.5.8), mutta saman toiminnon tekevät isommat vaihtoehdot, joten ei estä käyttöä. Epävarma, vaatii mittauksen.
**Korjausehdotus:** joko piilota natiivi × (`::-webkit-search-cancel-button { appearance: none }`) ja pidä Esc ja tyhjennyspainike, tai tee oma 44 px:n tyhjennyspainike (uusi toiminto, kirjataan IDEAS.md:hen). Ei estä Done-tilaa.
**Tila:** Siirretty tehtävään T-022 (PM 2026-10-02)

## Tarkistettu, ei löydöksiä

Rakenne ja semantiikka (otsikot, maamerkit, `lang`, `title`), axe 0 rikkomusta, kontrastit (kaikki mitatut parit yli rajojen), fokus (näkyy, ei leikkaudu, looginen järjestys), kosketuskohteet (≥ 44 × 44 px), 320 px / 400 % zoom, tekstin välistys (1.4.12), liikkeen vähentäminen, Windowsin suuri kontrasti, tilat (LATAUS, VIRHE, TYHJÄ, OSITTAINEN, EI TULOKSIA kaikissa kokoonpanoissa), tieto ei välity pelkällä värillä, fontit latautuvat omalta originilta (CSP ok, `font-src 'self'`), ei kovakoodattuja arvoja, tekstit ennallaan.

## Rajaukset ja jatko

- Ruudunlukija, Firefox, Safari ja oikeat mobiililaitteet jäävät testaamatta. Ne kannattaa tehdä MVP-1:n lopun saavutettavuusauditoinnissa. Erityisesti `:has()`-tuen puuttuminen vanhoissa selaimissa (valitun chipin tausta puuttuu, ruksi näkyy).
- Enimmäismäärän (999) tilaa ei testattu käsin.
- Syvällinen WCAG 2.2 AA -auditointi kuuluu MVP-tason loppuun.

## Korjausten varmistus (UX 2026-10-02, commitit 0b6395c ja cfebf14)

**Menetelmä:** Chrome headless omalla väliaikaisella profiililla (`userDataDir` scratchpadissa, uusi profiili joka ajolle), suljettu vain `browser.close()`-kutsulla (L-004, ei `taskkill`ia). PR #6:n esikatselu, sama osoite kuin aiemmin. axe-core 4.x `bypassCSP`:llä, tagit kuten ensimmäisellä kierroksella. Kaksi teemaa (`prefers-color-scheme`). Kaksi riviä tehtiin omistetuiksi (+-painikkeella) ennen mittausta.

| Kokoonpano | Tulos | Vertailu (UX-004) |
|---|---|---|
| 320 px, rivin korkeus (ka / min–max) | vaalea 85 / 85–127 px, tumma 86 / 85–127 px | 140 px |
| 320 px, sivun korkeus | 14 410 px (vaalea), 14 433 px (tumma) | 23 901 px |
| 320 px, taulukon yläreuna | 1284 px (ennallaan, suodatinpaneeli, UX-006 / T-018) | 1284 px |
| 320 px, vaakavieritys | 0 px (`scrollWidth` 320) | 0 px |
| 320 px, axe | 0 rikkomusta (`color-contrast` keskeneräinen taustakuvion vuoksi, kontrastit kuten ensimmäisellä kierroksella) | 0 |
| 320 px, solujen päällekkäisyys tai ylivuoto | 0 | – |
| 320 px, kosketuskohteet `.step` | kaikki ≥ 44 × 44 px | ≥ 44 × 44 px |
| **320 px, teksti 200 %** | **`scrollWidth` 320, ei vaakavieritystä, axe 0 rikkomusta, molemmat teemat** | 531 px |
| 480 px, 640 px, 1280 px, 1280 px + teksti 200 % | 0 px vaakavieritystä, rivin korkeus 85 / 76 / 76 px | – |
| Omistetun rivin kisko 320 px | `::before` 4 px (laskettu tyyli) | 3 px |

Huomautus mittauksesta: ensimmäisellä ajolla `TR:573`-rivi 200 %:n tapauksessa oli piilotetun `thead`in otsikkorivi (visuaalisesti piilotettu, ei näkyvä sisältö). Erillinen tarkistus (kaikki `tbody tr` -rivit, 3 omistettua riviä, teksti 200 %, 320 px) ei löytänyt yhtään riviä, joka ylittäisi näkymän, ja sivun `scrollWidth` on 320.

**Uuden kaksirivisen korttirivin käytettävyys (UX.md 6.4.4 ja 7.5):** hyväksytty.
- Rivi on luettava ja jäsentynyt: 1. rivi nimi (lihavoitu) ja kontrolli oikeassa reunassa, alaotsikko nimen alla, 2. rivi "Legend · Punainen   Hinta 5" himmeämmällä värillä. Tieto on tiivis mutta ei ahdas, ja kuvakaappaukset (320 px, tumma ja vaalea) näyttävät selkeältä. Omistetut rivit erottuvat kiskosta, taustasta ja määrälukemasta.
- `+` pysyy samalla vaakapaikalla (x = 248 px ennen ja jälkeen sen, kun − ilmestyy). Ei tarvetta etsiä painiketta.
- 200 %:n tekstillä kontrolli siirtyy nimen alle omalle rivilleen ja rivi pysyy leveydessä. Kaikki sisältö on näkyvissä ja saavutettavissa (kuvakaappaus tarkistettu).
- **Järjestys visuaalisesti ja DOM:ssa eroaa** (visuaalisesti nimi, kontrolli, tyyppi ja hinta, DOM:ssa nimi, tyyppi, hinta, kontrolli). Se on hyväksyttävä, koska fokusoitava on vain kontrolli, jonka saavutettava nimi sisältää kortin nimen ("Lisää yksi kappale: V, Streetkid"), joten WCAG 1.3.2 ja 2.4.3 täyttyvät. Ruudunlukija lukee rivin loogisessa järjestyksessä. Sarkainjärjestys tarkistettu: Pyydä pysyvää tallennusta → haku → Vain omistetut → Tyyppi → Väri → rivien − ja + -painikkeet, `outline` 3 px, `clip-path` ei leikkaa fokusrengasta.
- Leveä taulukko (≥ 640 px) on ennallaan (rivin korkeus 76 px).

### UX-011 · Nimi rivittyy uudelleen, kun − ilmestyy · Low
**Sijainti:** kapea korttirivi (`.card-name`, `.col-control`) · **Tehtävä:** T-021 (UX-007:n korjauksen sivuvaikutus)
**Toistaminen:** 320 px, avaa lista, paina rivin + -painiketta (esim. "Dexter DeShawn").
**Odotettu:** rivin asettelu ei hypi.
**Havaittu:** kun − ja määrä ilmestyvät, nimi menettää leveyttä ja rivittyy kahdelle riville (nimen korkeus 43 → 67 px). Rivin korkeus kasvaa noin 24 px ja + -painike siirtyy pystysuunnassa. Painike pysyy samassa vaakapaikassa, ja sen kosketusalue (44 px) kattaa siirtymän, joten kaksoisnapautus ei todennäköisesti osu ohi.
**Vaikutus:** Low. Pieni asettelun hyppy, mutta se on suora seuraus UX-007:n korjauksesta (kontrollille ei varata leveyttä enää). Varattu leveys oli UX-008:n vaakavieritysongelman syy.
**Korjausehdotus:** ei vaadita. Jos halutaan rauhoittaa, kontrolli voi kasvaa nimen alle vain silloin, kun nimi on pitkä, tai nimen `flex-basis` voidaan kasvattaa. Kirjataan T-018:n (mobiilin muotoilu) mahdolliseksi jatkoksi.
**Tila:** Avoin, hyväksytty

## Lopputulos

UX-007, UX-008 ja UX-009: **Varmistettu (UX 2026-10-02)**. UX-010: siirretty tehtävään T-022. UX-011: Low, hyväksytty. 640 px + teksti 200 % -tapaus (vaakavieritys 224 px) siirretty tehtävään T-023 (PM). Veto: ei. Blokkaavia löydöksiä ei ole.
