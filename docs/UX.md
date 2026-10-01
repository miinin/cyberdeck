# UX · cyberdeck

> Omistaja: UX Designer. Versio 0.2 · 2026-10-01 (T-001, MVP-0). Muutos 0.2: katselmoinnin UX-001 tarkennukset lukuihin 4.3, 4.4 ja 4.9 (raportti `docs/reports/UX-001-t001-katselmointi.md`).
> Tämä on minimitason design-järjestelmä, joka riittää MVP-0:aan. MVP-1 laajentaa sitä (lomakkeet, navigaatio, haku, kokoelman merkintä). Määrittely ei sido kehykseen: tokenit ovat CSS-muuttujia, ja rakenne kuvataan semanttisena HTML:nä.

---

## 1. Suunnitteluperiaatteet

1. **Tieto ensin.** Käyttäjä tulee katsomaan kortteja. Kortit näkyvät heti, ilman koristeita niiden edellä.
2. **Tila näkyy aina.** Käyttäjä tietää, haetaanko tietoja, onnistuiko haku ja kuinka monta korttia hän näkee.
3. **Virhe kertoo, mitä tehdä.** Jokaisessa virheessä on selitys selkokielellä ja keino jatkaa (yleensä "Yritä uudelleen"). Ei teknisiä tietoja, virhekoodeja eikä englanninkielisiä järjestelmäviestejä.
4. **Saavutettava oletuksena.** WCAG 2.2 AA koskee jokaista näkymää. Semanttinen HTML ensin, ARIA vain kun HTML ei riitä.
5. **Mobiili ensin.** Suunnitellaan 320 px:n leveydelle ja laajennetaan ylöspäin. Kaverit käyttävät sovellusta puhelimella pelipöydän ääressä.
6. **Johdonmukaisuus.** Sama asia näyttää ja toimii samalla tavalla kaikkialla. Kaikki värit, välit ja fonttikoot tulevat tokeneista, ei kovakoodattuna.
7. **Ei kultausta.** Cyberpunk-henki näkyy korostusvärissä, ei animaatioissa tai efekteissä, jotka heikentävät luettavuutta.

## 2. Äänensävy ja mikrokopio

- Kieli on suomi, sinuttelu, lyhyet aktiiviset lauseet. Esim. "Yritä uudelleen", ei "Uudelleenyritys".
- Pelin omat termit (korttityypit, korttien nimet) näytetään rajapinnan englanninkielisessä muodossa, koska ne ovat samat kuin fyysisissä korteissa (katso avoin kysymys K2).
- Painikkeen teksti on verbi, joka kertoo, mitä tapahtuu.
- Virheilmoituksen rakenne: **mitä tapahtui** + **mitä voit tehdä**.
- Lukumäärät taivutetaan: "1 kortti", "2 korttia", "0 korttia".
- Laajempi sanasto ja kielitaso kuuluvat Sisällöntuottajalle (`docs/CONTENT.md`, kun se luodaan).

## 3. Design-tokenit

Tokenit määritellään CSS-muuttujina `:root`-tasolla. Tumma tila otetaan käyttöön `@media (prefers-color-scheme: dark)` -kyselyllä. Erillistä teemavalitsinta ei MVP-0:ssa ole. `color-scheme: light dark` asetetaan `:root`iin, jotta selaimen omat osat (vierityspalkit, lomakekentät) seuraavat teemaa.

### 3.1 Värit

Kontrastit on laskettu WCAG 2.x -kaavalla 2026-09-30. Kaikki tekstiparit ylittävät 4.5:1 ja UI-reunat 3:1.

| Token | Vaalea | Tumma | Käyttö | Kontrasti (vaalea / tumma) |
|---|---|---|---|---|
| `--color-bg` | `#ffffff` | `#0f1115` | Sivun tausta | – |
| `--color-surface` | `#f3f4f6` | `#1a1d24` | Otsikkopalkki, taulukon otsikkorivi, parilliset rivit | – |
| `--color-text` | `#16181d` | `#e9ebf0` | Leipäteksti, otsikot | 17.8 / 15.8 (bg), 16.1 / 14.1 (surface) |
| `--color-text-muted` | `#4b5262` | `#a9b0bd` | Toissijainen teksti (alaotsikko, alatunniste) | 7.8 / 8.7 (bg), 7.1 / 7.7 (surface) |
| `--color-border` | `#d5d9e0` | `#2c313b` | Koristeelliset erottimet (taulukon rivit). Ei informatiivinen. | – |
| `--color-border-strong` | `#767d8c` | `#7d8494` | Reunat, jotka rajaavat käyttöliittymäkomponentin | 4.1 / 5.0 |
| `--color-accent` | `#a3004f` | `#ff6bb0` | Ensisijaisen painikkeen tausta, linkit, fokusrengas | 7.9 / 7.2 (bg) |
| `--color-on-accent` | `#ffffff` | `#0f1115` | Teksti korostusvärin päällä | 7.9 / 7.2 |
| `--color-danger` | `#b3261e` | `#ff8a80` | Virheilmoituksen reuna ja ikoni | 6.5 / 8.3 (bg), 5.7 / 7.1 (danger-surface) |
| `--color-danger-surface` | `#fdecec` | `#3a1414` | Virheilmoituksen tausta | teksti 15.6 / 13.7 |
| `--color-warning` | `#8a5a00` | `#f2c14e` | Varoituksen reuna | 5.5 / 8.5 (warning-surface) |
| `--color-warning-surface` | `#fff6db` | `#33290f` | Varoituksen tausta | teksti 16.5 / 12.0 |
| `--color-focus` | `= --color-accent` | `= --color-accent` | Fokusrengas | ks. yllä |

Säännöt:
- Tieto ei välity pelkällä värillä. Virhe- ja varoituslaatikoissa on aina otsikko tekstinä ("Korttien haku epäonnistui"), ei pelkkä punainen reuna.
- Uusi väri lisätään tänne tokeniksi kontrastilaskelman kanssa ennen käyttöä.

### 3.2 Typografia

| Token | Arvo | Käyttö |
|---|---|---|
| `--font-sans` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Kaikki teksti. Ei ulkoisia verkkofontteja (ei kolmannen osapuolen pyyntöjä, katso Digiturva). |
| `--font-size-base` | `1rem` (16 px) | Leipäteksti, taulukko |
| `--font-size-sm` | `0.875rem` (14 px) | Alaotsikko (subname), alatunniste. Ei pienempää tekstiä. |
| `--font-size-lg` | `1.25rem` | Otsikkopalkin sovelluksen nimi, h2 |
| `--font-size-xl` | `1.75rem` | h1 |
| `--line-height-body` | `1.5` | Leipäteksti |
| `--line-height-heading` | `1.2` | Otsikot |
| `--font-weight-normal` | `400` | |
| `--font-weight-bold` | `700` | Otsikot, kortin nimi, taulukon otsikot |

- Kaikki koot `rem`-yksiköissä, jotta selaimen tekstikokoasetus toimii. `html`-elementin fonttikokoa ei lukita pikseleihin.
- Numerot (hinta, lukumäärät): `font-variant-numeric: tabular-nums`, jotta sarake tasautuu.
- Tekstin välistyksen muutokset (WCAG 1.4.12) eivät saa katkaista tekstiä: ei kiinteitä korkeuksia tekstiä sisältäville elementeille, ei `overflow: hidden` tekstissä.

### 3.3 Välistys ja asettelu

| Token | Arvo |
|---|---|
| `--space-1` | `0.25rem` (4 px) |
| `--space-2` | `0.5rem` (8 px) |
| `--space-3` | `0.75rem` (12 px) |
| `--space-4` | `1rem` (16 px) |
| `--space-6` | `1.5rem` (24 px) |
| `--space-8` | `2rem` (32 px) |
| `--content-max-width` | `48rem` |
| `--radius` | `0.375rem` |
| `--focus-ring` | `3px solid var(--color-focus)`, `outline-offset: 2px` |
| `--target-min` | `2.75rem` (44 px) |

- Sivun reunaväli (gutter): `--space-4` alle 40 rem:n leveydellä, `--space-6` siitä ylöspäin.
- Sisältö keskitetään ja rajataan leveyteen `--content-max-width`.
- Breakpoint MVP-0:ssa: yksi, `40rem` (640 px). Mediakyselyt `em`/`rem`-yksiköissä, jotta ne reagoivat zoomiin.

### 3.4 Komponentit (MVP-0)

**Painike (ensisijainen)**
- Tausta `--color-accent`, teksti `--color-on-accent`, lihavoitu, `--radius`.
- Vähimmäiskorkeus ja -leveys `--target-min`, sisäväli `--space-2` `--space-4`.
- Hover: `text-decoration: underline` (ei pelkkää värimuutosta).
- Fokus: `:focus-visible { outline: var(--focus-ring); outline-offset: 2px; }`.
- Aina `<button type="button">`, ei `div` tai linkki.

**Ilmoituslaatikko (virhe / varoitus)**
- Tausta `--color-danger-surface` tai `--color-warning-surface`, vasen reuna 4 px `--color-danger` tai `--color-warning`, sisäväli `--space-4`, `--radius`.
- Sisältö: otsikko (h2), selitys (p), tarvittaessa painike.
- Ikonia ei MVP-0:ssa tarvita. Jos ikoni lisätään, se on `aria-hidden="true"`, koska otsikko kertoo saman.

**Fokus yleisesti**
- Selaimen oletusfokusta ei poisteta ilman korvaavaa `--focus-ring`-tyyliä.
- Mikään kiinnitetty (sticky) elementti ei saa peittää fokusoitua elementtiä (2.4.11). MVP-0:ssa ei käytetä sticky-elementtejä.

**Visuaalisesti piilotettu teksti** (`.visually-hidden`)
- Ruudunlukijalle tarkoitettu teksti, joka ei näy. Käytetään vakiintunutta clip-toteutusta (ei `display: none` eikä `visibility: hidden`, jotka piilottavat myös ruudunlukijalta).

### 3.5 Liike

- MVP-0:ssa ei animaatioita eikä pyörivää latausikonia. Lataustila on tekstiä.
- Yleissääntö kaikille myöhemmille animaatioille: `@media (prefers-reduced-motion: reduce)` poistaa siirtymät ja animaatiot (tai lyhentää ne alle 0.01 s:iin). Mikään ei vilku yli 3 kertaa sekunnissa.

---

## 4. Näkymä: Korttilista (T-001, MVP-0)

### 4.1 Käyttäjä ja tavoite

Pelaaja avaa sovelluksen nähdäkseen, mitä Cyberpunk TCG:n kortteja on olemassa. MVP-0:ssa näkymä on vain luettava lista: ei hakua, suodatusta, järjestämistä eikä kokoelman merkintää (MVP-1).

### 4.2 Polku

```
Käyttäjä avaa sivun
  → LATAUS: "Haetaan kortteja…"
      ├─ kaikki sivut haettu, total > 0, saatu = total  → ONNISTUMINEN (lista + "151 korttia")
      ├─ kaikki sivut haettu, total = 0                → TYHJÄ
      ├─ ensimmäinen sivu epäonnistui                  → VIRHE (ei listaa) → [Yritä uudelleen] → LATAUS
      └─ osa sivuista haettu, loput epäonnistuivat
         tai saatu < total                             → OSITTAINEN (lista + varoitus) → [Yritä uudelleen] → LATAUS
```

- Lista näytetään vasta, kun kaikki sivut on haettu tai haku on päättynyt virheeseen. Listaa ei rakenneta näkyviin sivu kerrallaan (vältetään hyppivä sisältö ja ruudunlukijan toistuvat ilmoitukset).
- Aikakatkaisu ja uudelleenyritysten määrä ovat Arkkitehdin/Koodarin päätöksiä. UX:n vaatimus: jos lataus kestää, käyttäjä ei jää ikuiseen lataustilaan, vaan haku päättyy lopulta VIRHE- tai OSITTAINEN-tilaan (ehdotus: aikakatkaisu 15 s per pyyntö).
- "Yritä uudelleen" hakee kaikki sivut alusta. Osittaisen haun korjaamista vain puuttuvien sivujen osalta ei tarvita MVP-0:ssa.

### 4.3 Sivun rakenne ja rautalanka

Yhteinen kaikille tiloille:

```html
<html lang="fi">
<head><title>Kortit · Cyberdeck</title></head>
<body>
  <header>                     <!-- banner -->
    Cyberdeck                  <!-- sovelluksen nimi tekstinä, EI otsikkoelementti -->
  </header>
  <main>                       <!-- main -->
    <h1>Kortit</h1>
    <p id="card-status">…</p> <!-- näkyvä tilarivi, vaihtuu tilan mukaan -->
    <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>
    …tilakohtainen sisältö…
  </main>
  <footer>                     <!-- contentinfo -->
    Korttitiedot: Netdeck.gg
  </footer>
</body>
</html>
```

- ~~`role="status"`-alue on DOM:ssa **heti sivun latautuessa tyhjänä**, ja siihen vaihdetaan vain teksti.~~ → tarkennettu 2026-10-01 (UX-001): `role="status"`-alue on DOM:ssa ensimmäisestä renderöinnistä asti, ja sama elementti säilyy kaikissa tiloissa. Siihen vaihdetaan vain teksti. Alue saa sisältää lataustekstin (`Haetaan kortteja…`) jo ensimmäisessä renderöinnissä. Silloin ruudunlukija ei välttämättä ilmoita lataustekstiä, mikä on hyväksyttävää, koska sama teksti on näkyvällä tilarivillä. Kaikki myöhemmät muutokset (tulos, virhe, uudelleenyrityksen lataus) on ilmoitettava. Aluetta ei saa lisätä DOM:iin vasta tilan vaihtuessa eikä vaihtaa toiseen elementtiin, koska silloin ruudunlukija ei välttämättä ilmoita muutosta.
- Otsikkorakenne: yksi `h1` ("Kortit"). Virhe- ja varoituslaatikon otsikko on `h2`. Ei muita otsikkotasoja.
- Maamerkit: `header` (banner), `main`, `footer` (contentinfo). Ei `nav`-elementtiä, koska navigaatiota ei MVP-0:ssa ole. Ohituslinkkiä ("Siirry sisältöön") ei MVP-0:ssa tarvita, koska mainia ennen on vain sovelluksen nimi. Se lisätään, kun navigaatio tulee (MVP-1).
- `<title>` pysyy samana kaikissa tiloissa: `Kortit · Cyberdeck`.

#### Rautalanka, onnistuminen, 320 px

```
┌────────────────────────────────┐
│ Cyberdeck                      │ header, surface-tausta
├────────────────────────────────┤
│                                │
│ Kortit                         │ h1
│ 151 korttia                    │ tilarivi (muted)
│                                │
│ ┌────────────────────────────┐ │
│ │ Nimi          Tyyppi  Hinta│ │ thead, surface-tausta
│ ├────────────────────────────┤ │
│ │ V             Legend     – │ │
│ │ Streetkid                  │ │ subname, sm + muted
│ ├────────────────────────────┤ │
│ │ Swordwise     Unit       3 │ │
│ │ Huscle                     │ │ pitkä nimi rivittyy
│ ├────────────────────────────┤ │
│ │ …                          │ │
│ └────────────────────────────┘ │
│                                │
│ Korttitiedot: Netdeck.gg       │ footer (sm, muted)
└────────────────────────────────┘
```

#### Rautalanka, onnistuminen, ≥ 640 px

Sama rakenne. Sisältö keskitetty, enintään 48 rem leveä, reunaväli 24 px. Kortin nimi ja alaotsikko pysyvät kahdella rivillä (johdonmukaisuus kapean näkymän kanssa).

### 4.4 Korttitaulukko

Kortit esitetään **semanttisena taulukkona** (`<table>`), koska jokaisella kortilla on samat vertailtavat kentät. Kolme saraketta mahtuu 320 px:iin ilman vaakavieritystä.

```html
<table>
  <caption class="visually-hidden">Kaikki kortit</caption>
  <thead>
    <tr>
      <th scope="col">Nimi</th>
      <th scope="col">Tyyppi</th>
      <th scope="col">Hinta</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">
        <span lang="en">V</span>
        <span class="visually-hidden">, </span>
        <span class="card-subname" lang="en">Streetkid</span>
      </th>
      <td lang="en">Legend</td>
      <td><span aria-hidden="true">–</span><span class="visually-hidden">ei hintaa</span></td>
    </tr>
    <tr>
      <th scope="row"><span lang="en">Swordwise Huscle</span></th>
      <td lang="en">Unit</td>
      <td>3</td>
    </tr>
  </tbody>
</table>
```

**Kentät ja niiden lähteet (TUTKIMUS.md):**

| Sarake | Rajapinnan kenttä | Esitys | Puuttuva arvo |
|---|---|---|---|
| Nimi | `name` + `subname` | `name` lihavoituna. Jos `subname` on olemassa, se näkyy omalla rivillään (`--font-size-sm`, `--color-text-muted`, normaali paino). Ruudunlukija lukee "V, Streetkid". | ~~`name` puuttuu → "Nimetön kortti".~~ → 2026-10-01 (UX-001): kortti, jolta puuttuu `name`, jätetään pois (ARCHITECTURE.md 5.5, `skipped`), ja näkymä näyttää OSITTAINEN-tilan. `subname` puuttuu → rivi jätetään pois. |
| Tyyppi | `card_type` | Sellaisenaan (Legend, Unit, Gear, Program), `lang="en"`. | ~~"–" + piilotettu "ei tyyppiä"~~ → 2026-10-01 (UX-001): kortti, jolta puuttuu tyyppi, jätetään pois kuten nimetön kortti (OSITTAINEN-tila). |
| Hinta | `cost` | Kokonaisluku, `tabular-nums`, tasattu oikealle. Pelin sisäinen hinta, ei rahallinen arvo. | `null`/puuttuu (esim. Legend) → "–" + piilotettu "ei hintaa". Arvo 0 näytetään "0". |

- Rivin otsikko (`th scope="row"`) on kortin nimi, jotta ruudunlukija kertoo taulukossa liikuttaessa, minkä kortin tietoja luetaan.
- Järjestys: rajapinnan palauttama järjestys. Järjestäminen ja haku ovat MVP-1:tä.
- Rivien erotus: 1 px `--color-border` -viiva rivien välissä. Vuorottelevat taustavärit eivät ole pakollisia.
- Solujen sisäväli: `--space-2` pystysuunnassa, `--space-2` vaakasuunnassa (320 px:ssä), `--space-3` ≥ 640 px.
- Sarakeleveydet: Nimi vie jäljelle jäävän tilan. Tyyppi ja Hinta mitoittuvat sisältönsä mukaan (`width: 1%; white-space: nowrap`). Nimi rivittyy (`overflow-wrap: anywhere`), jotta pitkä nimi ei aiheuta vaakavieritystä.
- Taulukon otsikkorivi ei ole sticky MVP-0:ssa.
- Taulukko ei ole fokusoitava eikä rivit ole interaktiivisia. Näppäimistön käyttäjälle sivulla on MVP-0:ssa fokusoitavaa vain virhe- ja osittaisessa tilassa (painike).
- Kaikki kortit näytetään yhdellä sivulla (151 riviä). Sivutusta tai virtualisointia ei tehdä MVP-0:ssa.

### 4.5 Tilat ja tarkat tekstit

Tekstit ovat lopullisia MVP-0:aan. Sisällöntuottaja voi tarkistaa ne katselmoinnissa.

#### LATAUS

```
Kortit
Haetaan kortteja…
```

- Tilarivi: `Haetaan kortteja…` (yksi merkki "…", U+2026).
- Live-alue: `Haetaan kortteja…`
- Taulukkoa ei näytetä. Ei pyörivää ikonia eikä luurankorivejä.
- Edistymistä (esim. "60/151") ei näytetä MVP-0:ssa.

#### ONNISTUMINEN

- Tilarivi: `{n} korttia` (n = saatujen korttien määrä, joka on sama kuin `total`). Yksikkö: `1 kortti`.
- Live-alue: `{n} korttia ladattu.` (yksikkö: `1 kortti ladattu.`)
- Taulukko näytetään.
- Lukumäärä muotoillaan suomalaisittain, jos se ylittää 999: `1 024 korttia` (sitova välilyönti, `Intl.NumberFormat('fi-FI')`).

#### TYHJÄ (rajapinta vastasi onnistuneesti, `total` = 0)

```
Kortit
0 korttia

Kortteja ei löytynyt. Korttitietokanta on juuri nyt tyhjä.
Yritä myöhemmin uudelleen.
[ Yritä uudelleen ]
```

- Tilarivi: `0 korttia`
- Kappale: `Kortteja ei löytynyt. Korttitietokanta on juuri nyt tyhjä. Yritä myöhemmin uudelleen.`
- Painike: `Yritä uudelleen`
- Live-alue: `Kortteja ei löytynyt.`
- Ei ilmoituslaatikkoa (tämä ei ole virhe). Taulukkoa ei näytetä.

#### VIRHE (ensimmäinen sivu epäonnistui, verkkovirhe, aikakatkaisu, ei-2xx-vastaus tai jäsentämätön vastaus)

```
Kortit

┌ Korttien haku epäonnistui ─────┐   ← h2, danger-laatikko
│ Korttitietoja ei saatu juuri   │
│ nyt haettua. Tarkista          │
│ verkkoyhteys ja yritä          │
│ uudelleen.                     │
│ [ Yritä uudelleen ]            │
└────────────────────────────────┘
```

- Tilarivi: piilotetaan (tyhjä).
- h2: `Korttien haku epäonnistui`
- Kappale: `Korttitietoja ei saatu juuri nyt haettua. Tarkista verkkoyhteys ja yritä uudelleen.`
- Painike: `Yritä uudelleen`
- Live-alue: `Korttien haku epäonnistui.`
- Sama teksti kaikille virhetyypeille. Käyttäjälle ei koskaan näytetä HTTP-koodia, virheolion viestiä, URL:ia eikä stack tracea. Tekninen tieto saa mennä selaimen konsoliin (Koodarin ja Digiturvan päätös).
- Selain on offline-tilassa (`navigator.onLine === false`): sama teksti riittää MVP-0:ssa.

#### OSITTAINEN (osa sivuista saatiin, mutta vähintään yksi sivu epäonnistui, tai saatujen korttien määrä < `total`)

```
Kortit
120 / 151 korttia

┌ Kaikkia kortteja ei saatu ─────┐   ← h2, warning-laatikko
│ Osa korttitiedoista jäi        │
│ hakematta. Lista on            │
│ puutteellinen. Yritä uudelleen │
│ hakeaksesi kaikki kortit.      │
│ [ Yritä uudelleen ]            │
└────────────────────────────────┘

┌ taulukko (120 riviä) ──────────┐
```

- Tilarivi: `{saatu} / {total} korttia` (esim. `120 / 151 korttia`). Välilyönnit kauttaviivan ympärillä.
- h2: `Kaikkia kortteja ei saatu`
- Kappale: `Osa korttitiedoista jäi hakematta. Lista on puutteellinen. Yritä uudelleen hakeaksesi kaikki kortit.`
- Painike: `Yritä uudelleen`
- Live-alue: `Näytetään {saatu} / {total} korttia. Osa korttitiedoista jäi hakematta.` (Kauttaviivamuoto välttää lukusanan taivutuksen, esim. "151:stä".)
- Varoituslaatikko on **ennen** taulukkoa, jotta käyttäjä näkee sen ennen kuin alkaa lukea listaa.
- Saadut kortit näytetään taulukossa normaalisti.
- Jos saatujen korttien määrä on **suurempi** kuin `total` (rajapinnan epäjohdonmukaisuus), näytetään ONNISTUMINEN saatujen korttien määrällä. Päällekkäiset kortit (sama `id` kahdesti sivujen rajalla) poistetaan ennen laskentaa, jos Arkkitehti niin päättää. UX:n vaatimus on vain, että näkyvä luku vastaa näkyvien rivien määrää.

### 4.6 Fokus ja näppäimistö

- Sivun latautuessa fokusta ei siirretä (selaimen oletus).
- Sarkainjärjestys: DOM-järjestys. Ainoa fokusoitava elementti MVP-0:ssa on `Yritä uudelleen` -painike (TYHJÄ, VIRHE, OSITTAINEN) sekä mahdolliset alatunnisteen linkit.
- **Uudelleenyritys:** kun käyttäjä painaa `Yritä uudelleen`, painike poistuu näkyvistä (LATAUS). Jotta fokus ei katoa `body`-elementtiin:
  - `h1` saa `tabindex="-1"` ja fokus siirretään siihen heti painalluksen jälkeen.
  - `h1`:n ohjelmallinen fokus ei näytä fokusrengasta (`h1:focus:not(:focus-visible) { outline: none; }`) tai näyttää sen, jos selain päättää `:focus-visible`-tilan niin. Kumpikin on hyväksyttävä.
  - Live-alue ilmoittaa `Haetaan kortteja…` ja tuloksen, kun haku päättyy.
- Painike toimii Enterillä ja välilyönnillä (natiivi `<button>`).
- Tuplaklikkaus tai toistuvat painallukset eivät saa käynnistää rinnakkaisia hakuja (painike ei ole näkyvissä LATAUS-tilassa, mikä riittää).

### 4.7 Ruudunlukija: odotettu lukujärjestys (onnistuminen)

1. Sivun nimi "Kortit · Cyberdeck"
2. banner: "Cyberdeck"
3. main, otsikko taso 1: "Kortit"
4. "151 korttia"
5. taulukko "Kaikki kortit", 3 saraketta, 152 riviä: Nimi, Tyyppi, Hinta
6. rivit: "V, Streetkid" · "Legend" · "ei hintaa" …
7. contentinfo: "Korttitiedot: Netdeck.gg"

Lisäksi live-alue ilmoittaa "151 korttia ladattu." kerran, kun haku valmistuu.

### 4.8 Responsiivisuus ja zoom

| Leveys | Muutokset |
|---|---|
| 320–639 px | Reunaväli 16 px. Solujen vaakasisäväli 8 px. Nimi rivittyy. |
| ≥ 640 px (40 rem) | Reunaväli 24 px. Solujen vaakasisäväli 12 px. Sisältö enintään 48 rem, keskitetty. |

- 320 px:n leveydellä (ja 1280 px 400 % zoomilla) **ei vaakavieritystä**. Testattava pisimmällä kortin nimellä.
- 200 % tekstin suurennus ei katkaise eikä peitä tekstiä.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`. Zoomia ei estetä (ei `maximum-scale`, ei `user-scalable=no`).
- Vaakasuuntainen puhelin toimii samalla asettelulla (ei orientaatiolukitusta).

### 4.9 Saavutettavuusvaatimukset (tarkistuslista Koodarille)

- [ ] `<html lang="fi">`, `<title>Kortit · Cyberdeck</title>`
- [ ] Maamerkit `header`, `main`, `footer`, kukin kerran
- [ ] Yksi `h1` ("Kortit"). Virhe- ja varoituslaatikon otsikko `h2`.
- [ ] Taulukko: `<caption>` (visuaalisesti piilotettu), `th scope="col"` sarakkeille, `th scope="row"` kortin nimelle
- [ ] Englanninkieliset korttinimet ja tyypit `lang="en"`
- [ ] Puuttuva arvo "–" on `aria-hidden`, ja sen tilalla on piilotettu teksti ("ei hintaa"; ~~"ei tyyppiä"~~ ei käytössä, katso 4.4)
- [ ] `role="status"`-alue on DOM:ssa alusta asti, ja siihen päivitetään tilan tekstit kohdan 4.5 mukaan
- [ ] Uudelleenyrityksen jälkeen fokus siirtyy `h1`:een (`tabindex="-1"`)
- [ ] Painike on `<button>`, vähintään 44×44 px, näkyvä fokusrengas (`--focus-ring`)
- [ ] Kaikki värit tokeneista. Kontrastit kohdan 3.1 mukaan kummassakin teemassa.
- [ ] Ei vaakavieritystä 320 px:ssä eikä 400 % zoomilla
- [ ] Ei animaatioita. Jos jokin siirtymä lisätään, se poistetaan `prefers-reduced-motion: reduce` -tilassa.
- [ ] Virheilmoituksessa ei teknistä tietoa
- [ ] axe-core: 0 rikkomusta kaikissa tiloissa (Koodari voi testata tilat pakottamalla rajapintakerroksen vastauksen)

### 4.10 Rajaukset (ei MVP-0:ssa)

- Korttikuvat (käyttöoikeus selvittämättä, T-001-rajaus)
- Haku, suodatus, järjestäminen, kortin yksityiskohtanäkymä
- Muut kentät (väri, teho, RAM, harvinaisuus, setti). Lisätään MVP-1:ssä tarpeen mukaan.
- Teemavalitsin, ohituslinkki, sticky-otsikkorivi
