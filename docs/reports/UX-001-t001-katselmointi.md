# UX-001 · T-001 korttilistan käytettävyys- ja saavutettavuuskatselmointi

**Katselmoija:** UX Designer · **Päivä:** 2026-10-01 · **Tehtävä:** T-001 · **PR:** https://github.com/miinin/cyberdeck/pull/1
**Kohde:** esikatselu https://cyberdeck-tcg-test--pr1-t-001-kaveleva-luura-wj9wvfxt.web.app (Firebase Hosting, CSP päällä) sekä lähdekoodi haarassa `t-001-kaveleva-luuranko` (`src/App.tsx`, `src/ui/*`, `src/styles.css`, `index.html`)
**Vertailukohta:** `docs/UX.md` luvut 3 ja 4 sekä PM:n päätös VIRHE- ja OSITTAINEN-tiloista (T-001-kortti, checkpoint 2026-09-30)

## Yhteenveto

Toteutus vastaa UX.md:n määrittelyä lähes täysin. Kaikki viisi tilaa (lataus, onnistuminen, tyhjä, virhe ja osittainen) näkyvät oikein ja oikeilla teksteillä. Ne toimivat näppäimistöllä ja ovat semanttisesti oikein. axe-core ei löytänyt yhtään rikkomusta neljästä lopputilasta kummassakaan teemassa. Blokkaavia löydöksiä ei ole. Löydöksiä on kolme, kaikki Low-tasoisia: yksi on hyväksytty poikkeama, yksi määrittelyn ja toteutuksen ero, jonka korjasin UX.md:hen, ja yksi WCAG-vaatimukset ylittävä havainto backlogiin.

**Veto: ei.** UX hyväksyy T-001:n Done-tilaan omalta osaltaan.

## Menetelmä

Työkaluna oli Chrome (headless, puppeteer-core 25.12.0 scratchpadissa, ei projektin riippuvuus) esikatselu-URL:ssa. Rajapinnan vastaukset pakotettiin pyyntöjen sieppauksella, jotta kaikki tilat saatiin näkyviin oikeassa julkaisussa:

| Tila | Miten pakotettiin |
|---|---|
| Onnistuminen | oikea rajapinta (151 / 151) |
| Virhe | HTTP 500 ensimmäiselle sivulle |
| Tyhjä | `{ items: [], total: 0 }` |
| Osittainen | oikea data, ensimmäisen sivun kahdelta kortilta poistettu `name` tai `card_type` (→ `skipped` 2, 149 / 151) |
| Pitkä nimi | 70 merkin välilyönnitön nimi ja pitkä alaotsikko ensimmäiselle kortille |

Automaattinen tarkistus: axe-core 4.13.0 (sama moottori kuin `@axe-core/cli`), tagit `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` ja `best-practice`. axe injektoitiin DevTools-protokollan kautta, koska sivun CSP estää (oikein) inline-skriptit ja -tyylit. Lighthousea ei ajettu, koska axe kattaa samat säännöt.

Manuaalinen tarkistus: näppäimistöpolku (Tab, Shift+Tab, Enter), saavutettavuuspuu (Chromen `Accessibility.getFullAXTree`), live-alueen sisällön aikajana (MutationObserver), 320 / 640 / 1280 px, tekstin välistys (WCAG 1.4.12), vaalea ja tumma teema, kontrastit laskettuna WCAG 2.x -kaavalla ja kuvakaappaukset visuaalista tarkistusta varten.

**Rajoite:** Oikealla ruudunlukijalla (NVDA, JAWS, VoiceOver) ei testattu, koska niitä ei ole tässä ympäristössä. Ruudunlukijan näkökulma on arvioitu saavutettavuuspuusta ja live-alueen aikajanasta.

## Automaattinen tarkistus (axe-core)

| Tila | Vaalea | Tumma | Läpäistyt säännöt |
|---|---|---|---|
| Onnistuminen | 0 rikkomusta, 0 epävarmaa | 0 / 0 | 36 |
| Virhe | 0 / 0 | 0 / 0 | 32 |
| Tyhjä | 0 / 0 | 0 / 0 | 32 |
| Osittainen | 0 / 0 | 0 / 0 | 39 |

Konsoli (Digiturvalle tiedoksi): CSP-virheitä ei ollut missään tilassa. Virhetilassa konsolissa näkyvät vain selaimen oma "Failed to load resource: 500" ja `Loading cards failed CardApiError: HTTP 500 for offset 0`, ja osittaisessa tilassa `Card count mismatch: received 149, API reported 151, skipped 2`. Tekninen tieto pysyy konsolissa eikä näy sivulla, kuten UX.md 4.5 vaatii.

## Manuaalinen tarkistus

### Rakenne ja semantiikka (UX.md 4.3, 4.4, 4.7)
- `lang="fi"` ja `<title>Kortit · Cyberdeck</title>` pysyvät samoina kaikissa tiloissa. ✔
- Maamerkit `banner`, `main` ja `contentinfo` ovat kukin kerran. Lisäksi on yksi `h1` ("Kortit"), ja virhe- ja varoituslaatikon otsikko on `h2`. ✔
- Saavutettavuuspuussa on `table "Kaikki kortit"`, 3 × `columnheader`, 151 × `rowheader` ja 302 × `cell`. Rivin nimi on esim. "V , Streetkid". ✔ (Ylimääräinen välilyönti ennen pilkkua ei vaikuta luentaan.)
- Englanninkielisillä nimillä, alaotsikoilla ja tyypeillä on `lang="en"`. Puuttuva hinta näkyy merkkinä "–" (`aria-hidden`), ja ruudunlukija lukee sen tilalla "ei hintaa". ✔
- Korttikuvia ei ole. ✔

### Tilat ja tekstit (UX.md 4.5)
| Tila | Tilarivi | Live-alue | Laatikko ja painike | Tulos |
|---|---|---|---|---|
| Lataus | Haetaan kortteja… | Haetaan kortteja… | ei | ✔ |
| Onnistuminen | 151 korttia | 151 korttia ladattu. | ei, taulukko 151 riviä | ✔ |
| Tyhjä | 0 korttia | Kortteja ei löytynyt. | kappale ja painike, ei laatikkoa | ✔ |
| Virhe | piilotettu (`hidden`) | Korttien haku epäonnistui. | danger, h2 ja painike | ✔ |
| Osittainen | 149 / 151 korttia | Näytetään 149 / 151 korttia. Osa korttitiedoista jäi hakematta. | warning ennen taulukkoa, taulukko 149 riviä | ✔ |

Tekstit ovat merkki merkiltä samat kuin UX.md 4.5:ssä (`src/ui/texts.ts`). Yksikkötestit kattavat yksikön (`1 kortti`) ja suomalaisen tuhaterottimen.

### Näppäimistö ja fokus (UX.md 4.6)
- Virhetilassa ensimmäinen Tab vie fokuksen `Yritä uudelleen` -painikkeeseen. Fokusrengas on 3 px `--color-accent`, ja sen ja painikkeen välissä on 2 px rako. Rengas on tarkistettu suurennetusta kuvakaappauksesta kummassakin teemassa. ✔
- Seuraava Tab vie fokuksen pois sivun sisällöstä selaimelle, koska muita fokusoitavia elementtejä ei ole. Tämä on odotettua. ✔
- Enter → fokus siirtyy `h1`:een (`tabindex="-1"`), live-alue vaihtuu tekstiin "Haetaan kortteja…" ja sitten tekstiin "151 korttia ladattu.", ja fokus pysyy `h1`:ssä. Fokus ei katoa `body`-elementtiin. ✔
- Hiirellä painettaessa fokus siirtyy samoin `h1`:een ilman näkyvää rengasta (`:focus-visible` ei täsmää), mikä on UX.md 4.6:n mukaan hyväksyttävää. ✔
- Painike on 145 × 44 px (≥ 44 × 44), natiivi `<button type="button">`, ja hover tuo alleviivauksen. ✔
- Sticky-elementtejä ei ole, joten 2.4.11 täyttyy. ✔

### Live-alue (Koodarin poikkeama, katso UX-001 alla)
Aikajana esikatselussa: alue tulee DOM:iin noin 40 ms kohdalla jo tekstin "Haetaan kortteja…" kanssa. Sama elementti säilyy kaikissa tiloissa, ja jokainen myöhempi muutos (tulos, virhe, uudelleenyrityksen lataus) on tekstimuutos olemassa olevassa alueessa. Teksti vaihtuu jokaisella siirtymällä, joten samaa viestiä ei jätetä ilmoittamatta toiston takia.

### Responsiivisuus, zoom ja tekstin välistys (UX.md 4.8)
| Tarkistus | Tulos |
|---|---|
| 320 px (= 1280 px 400 % zoomilla), kaikki tilat, vaalea ja tumma | `scrollWidth` 320, ei vaakavieritystä ✔ |
| 320 px, 70 merkin välilyönnitön nimi | nimi rivittyy (`overflow-wrap: anywhere`), taulukon oikea reuna 304 px ✔ |
| 640 px (= 200 % zoom) | ei vaakavieritystä ✔ |
| 1.4.12 tekstin välistys 320 px:ssä (rivikorkeus 1.5, kirjainväli 0.12em, sanaväli 0.16em, kappaleväli 2em) | ei leikkautuvaa tekstiä (0 elementtiä), ei vaakavieritystä ✔ |
| 640 px ja juuren fonttikoko 200 % | ei vaakavieritystä ✔ |
| 320 px ja juuren fonttikoko 200 % (vastaa 800 %:a, yli vaatimusten) | vaakavieritys 405 px → UX-003 |
| `meta viewport` ilman zoomin estoa | ✔ |

### Kontrastit (laskettu, WCAG 2.x)
Tokenit ovat UX.md 3.1:n mukaiset, eikä tyyleissä ole kovakoodattuja värejä. Lisäksi tarkistin kontrastit, joita 3.1 ei suoraan kattanut:

| Pari | Vaalea | Tumma | Vaatimus |
|---|---|---|---|
| Fokusrengas / painike `--color-accent` danger-laatikon taustalla | 6.89 | 6.19 | 3:1 ✔ |
| sama warning-laatikon taustalla | 7.29 | 5.45 | 3:1 ✔ |
| sama sivun taustalla (tyhjä tila) | 7.86 | 7.18 | 3:1 ✔ |
| Taulukon otsikkorivin teksti `--color-text` surface-taustalla | 16.1 | 14.1 | 4.5:1 ✔ |
| Alaotsikko `--color-text-muted` taustalla | 7.8 | 8.7 | 4.5:1 ✔ |

### Liike
Animaatioita ei ole. `prefers-reduced-motion: reduce` -sääntö on silti tyylitiedostossa varmuuden vuoksi. ✔

### Nielsenin heuristiikat
- **Tila näkyy:** lataus, määrä, virhe ja puutteellinen lista näkyvät tekstinä. ✔ Lataus kestää noin 2–6 s ilman edistymistietoa. Tämä on UX.md 4.5:n mukaista, ja välimuisti tulee tehtävässä T-003.
- **Käyttäjän kieli:** ei teknisiä termejä eikä virhekoodeja. ✔
- **Hallinta:** jokaisessa umpikujatilassa (virhe, tyhjä, osittainen) on `Yritä uudelleen`. ✔
- **Johdonmukaisuus:** sama painike, sama laatikkomalli ja samat sijainnit kaikissa tiloissa. ✔
- **Virheiden ehkäisy:** LATAUS-tilassa ei ole painiketta, joten rinnakkaisia hakuja ei voi käynnistää. ✔
- **Minimalismi:** ✔
- **Virheilmoitukset:** kertovat, mitä tapahtui ja mitä tehdä. ✔

### Visuaalinen
Hierarkia (otsikko → tilarivi → ilmoitus → taulukko) on selkeä. Välistys tulee tokeneista, ja tasaukset ovat johdonmukaiset. Hinta on tasattu oikealle `tabular-nums`-numeroin. Tarkistetut kuvakaappaukset: onnistuminen, virhe, tyhjä ja osittainen 320 px:ssä ja 1280 px:ssä kummassakin teemassa.

## Löydökset

### UX-001 · Live-alueessa on lataus­teksti heti ensimmäisestä renderöinnistä (Koodarin poikkeama) · Low
**Sijainti:** `src/ui/CatalogView.tsx` (live-alue), UX.md 4.3 · **Tehtävä:** T-001
**Toistaminen:** 1) Avaa esikatselu. 2) Tarkastele `[role="status"]`-elementtiä ensimmäisessä renderöinnissä.
**Odotettu (UX.md 4.3, v0.1):** alue on DOM:ssa aluksi tyhjänä, ja teksti vaihdetaan siihen. · **Havaittu:** alue tulee DOM:iin valmiiksi tekstin "Haetaan kortteja…" kanssa.
**Vaikutus:** Ruudunlukija ei välttämättä ilmoita lataustekstiä sivun avautuessa. Haittaa ei käytännössä ole: sama teksti on näkyvällä tilarivillä heti `h1`:n jälkeen, sivun avautuessa ruudunlukija aloittaa sivun luennan joka tapauksessa, ja ilmoitus lataustilasta olisi tässä kohdassa vain toisto. Tärkeät ilmoitukset (tulos, virhe ja uudelleenyrityksen lataus) syntyvät olemassa olevan alueen tekstimuutoksista, ja ne näkyvät aikajanassa. Tämä oli UX.md:n vaatimuksen varsinainen tarkoitus. Tyhjä alku vaatisi kaksivaiheisen renderöinnin (tyhjä → teksti) ilman käyttäjähyötyä.
**Korjausehdotus:** Ei koodimuutosta. Poikkeama hyväksytään, ja UX.md 4.3 on tarkennettu vastaamaan toteutusta: alue saa sisältää lataustekstin alusta asti, mutta sen on oltava sama elementti kaikissa tiloissa, ja kaikki myöhemmät muutokset on ilmoitettava.
**Tila:** Hyväksytty poikkeama · UX.md päivitetty v0.2 (UX Designer 2026-10-01)

### UX-002 · UX.md:n puuttuvan nimen ja tyypin varatekstejä ei käytetä · Low
**Sijainti:** UX.md 4.4 (taulukko "Kentät ja niiden lähteet") ja 4.9 · `src/api/mapCard.ts` · ARCHITECTURE.md 5.5
**Toistaminen:** 1) Pakota rajapinnasta kortti, jolta puuttuu `name` tai `card_type`. 2) Avaa sivu.
**Odotettu (UX.md 4.4, v0.1):** nimetön kortti näkyy tekstinä "Nimetön kortti", ja tyypittömän kortin tyyppisarakkeessa on "–" ja piilotettu teksti "ei tyyppiä". · **Havaittu:** `mapCard` hylkää kortin (ARCHITECTURE.md 5.5, `skipped += 1`), ja näkymä näyttää OSITTAINEN-tilan, esim. "149 / 151 korttia" ja varoituslaatikon.
**Vaikutus:** Ei haittaa käyttäjälle. Toteutus on Arkkitehdin päätöksen ja PM:n tilaratkaisun mukainen, ja käyttäjä saa tiedon puutteellisesta listasta. Ristiriita oli vain dokumenttien välillä, ja se olisi voinut hämmentää seuraavaa Koodaria.
**Korjausehdotus:** Päivitä UX.md 4.4 ja 4.9 vastaamaan ARCHITECTURE.md 5.5:tä. Ei koodimuutosta.
**Tila:** Korjattu (UX.md v0.2, UX Designer 2026-10-01, commitoimatta)

### UX-003 · Hyvin kapea näkymä ja kaksinkertainen tekstikoko yhdessä aiheuttavat vaakavierityksen · Low
**Sijainti:** `src/styles.css` (`.card-table .col-fit { white-space: nowrap }`) · **Tehtävä:** T-001 (ei vaatimusrikkomus)
**Toistaminen:** 1) Aseta näkymän leveydeksi 320 px. 2) Kasvata selaimen perusfonttikoko 32 px:iin (200 %). 3) Avaa korttilista.
**Odotettu:** ei vaakavieritystä. · **Havaittu:** sivun leveys on 405 px. Tyyppi- ja Hinta-sarakkeet eivät rivity, joten taulukko levenee näkymää leveämmäksi.
**Vaikutus:** WCAG 2.2 AA ei edellytä tätä yhdistelmää. Reflow (1.4.10) vaaditaan 320 px:ssä perustekstikoolla, ja tekstin suurennus (1.4.4) 200 %:iin normaalileveydellä. Molemmat täyttyvät. Yhdistelmä vastaa noin 800 %:n suurennusta. Heikkonäköisellä mobiilikäyttäjällä, jolla on suuri järjestelmäfontti, taulukkoa voi joutua vierittämään sivusuunnassa.
**Korjausehdotus:** Ei MVP-0:ssa. Ehdotus MVP-1:n tai MVP-3:n UX-tehtäväksi: alle noin 20 em:n leveydellä tyyppi ja hinta siirtyvät nimen alle (rivi kortin sisällä), tai `white-space: nowrap` sallitaan rivittyä. PM päättää, kirjataanko asia IDEAS.md:hen.
**Tila:** Avoin (backlog-ehdotus)

## Muut havainnot (ei UX-löydöksiä)
- **Sisällöntuottajalle (TXT):** alatunnisteen teksti "Ei WeirdCon, Netdeck.gg:n eikä CD PROJEKT REDin hyväksymä tai tukema." on taivutukseltaan epäjohdonmukainen ("WeirdCon" ilman genetiivin päätettä, vrt. "Netdeck.gg:n", "REDin"). Kielen tarkistus kuuluu Sisällöntuottajalle.
- **Työkaluhavainto:** Chromen `getComputedStyle` palautti painikkeen `outline-color`-arvoksi `currentColor`-värin ja `outline-offset`-arvoksi 0, vaikka renderöity rengas on `--color-accent` ja rako 2 px (tarkistettu 4× suurennetusta kuvakaappauksesta). Kyse on mittaustyökalun tulkinnasta, ei toteutuksen virheestä.

## Kattavuus
Tarkistettu: kaikki viisi tilaa (lataus aikajanasta, muut lopputiloina) kummassakin teemassa, axe, näppäimistö, fokuksen hallinta uudelleenyrityksessä, saavutettavuuspuu, live-alue, 320 / 640 / 1280 px, tekstin välistys, kontrastit ja tekstit UX.md 4.5:tä vasten.
Ei tarkistettu: oikea ruudunlukija (ei saatavilla), oikea mobiililaite ja kosketus, Windowsin suurikontrastitila (forced colors) ja Safari/Firefox.

## Veto-päätös
**Ei vetoa.** Ydinpolku toimii näppäimistöllä ja on saavutettavuuspuun perusteella ymmärrettävä. Kriittisiä, High- tai Medium-tason käytettävyys- tai saavutettavuusongelmia ei löytynyt.
