# UX · cyberdeck

> Omistaja: UX Designer. Versio 0.2 · 2026-10-01 (T-001, MVP-0). Muutos 0.2: katselmoinnin UX-001 tarkennukset lukuihin 4.3, 4.4 ja 4.9 (raportti `docs/reports/UX-001-t001-katselmointi.md`).
> Muutos 0.3 · 2026-10-01 (T-010, MVP-1): uusi luku 5 (haku ja suodatus), korttien väritokenit (3.1.1) sekä tekstikenttä ja valintaruutu (3.4). Luvun 4 kohtiin, joita luku 5 muuttaa, on lisätty viittaus.
> Muutos 0.4 · 2026-10-01 (T-010, katselmointi UX-002): K9 ratkaistu (latausviesti suodatettuna, 5.6), tyhjennyspainikkeen ilmoitus ja toistokielto (5.6), OSITTAINEN ilman kortteja (5.8). Raportti `docs/reports/UX-002-t010-katselmointi.md`.
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

#### 3.1.1 Korttien värit (T-010)

Pelin neljä väriä (rajapinnan `color`, katso 5.2). Niitä käytetään **vain** koristeellisessa värinäytteessä (`.color-swatch`), joka on aina värin nimen vieressä ja `aria-hidden="true"`. Tieto välittyy tekstinä, joten näyte ei ole informatiivinen grafiikka. Näytteellä on silti 1 px:n reuna `--color-border-strong` (4.1 / 5.0 taustaa vasten), jotta vaalea keltainen erottuu valkoisesta taustasta.

| Token | Vaalea | Tumma | Kontrasti taustaa vasten (vaalea / tumma), tiedoksi |
|---|---|---|---|
| `--color-card-red` | `#c62828` | `#ff6b6b` | 5.6 / 6.8 |
| `--color-card-yellow` | `#e0b000` | `#f2c94c` | 2.0 / 11.9 (reuna erottaa näytteen) |
| `--color-card-green` | `#2e7d32` | `#5ccf6a` | 5.1 / 9.5 |
| `--color-card-blue` | `#1565c0` | `#64a8ff` | 5.7 / 7.7 |
| `--color-card-unknown` | `transparent` | `transparent` | Tuntematon väri: pelkkä reuna |

Näitä tokeneita ei käytetä tekstin värinä eikä tekstin taustana.

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

**Tekstikenttä** (T-010)
- Näkyvä `<label>` kentän yläpuolella (`--font-weight-bold`). Placeholderia ei käytetä labelin tai ohjeen korvikkeena.
- Ohjeteksti labelin ja kentän välissä (`--font-size-sm`, `--color-text-muted`), liitetty kenttään `aria-describedby`-attribuutilla.
- Kenttä: korkeus vähintään `--target-min`, leveys 100 % (enintään `24rem`, kun leveys on ≥ 640 px), tausta `--color-bg`, teksti `--color-text`, reuna 1 px `--color-border-strong`, `--radius`, sisäväli `--space-2` `--space-3`, fonttikoko `--font-size-base` (16 px estää iOS:n automaattisen zoomauksen).
- Fokus: `--focus-ring`.

**Valintaruutu ja valintaryhmä** (T-010)
- Natiivi `<input type="checkbox">` labelin sisällä yhdessä tekstin kanssa. Koko label on klikattava alue: vähintään `--target-min` korkea ja vähintään 44 px leveä. Ruudun koko `1.25rem`, `accent-color: var(--color-accent)`.
- Valittu tila näkyy natiivina ruksina, ei pelkkänä värinä. Hover: labelin teksti alleviivataan.
- Fokus: `--focus-ring` ruudussa (`input:focus-visible`). Fokusrengas ei saa leikkautua (ei `overflow: hidden` vanhemmissa).
- Ryhmä on `<fieldset>`, jonka nimi on `<legend>` (`--font-weight-bold`). Fieldsetin oletusreuna poistetaan, ja sisäväli on 0.
- Vaihtoehdot rivitetään: `display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-4)`.

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
    <p>Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.</p>
    <p>Korttitiedot: Netdeck.gg</p>
  </footer>
</body>
</html>
```

- ~~Alatunnisteessa vain `Korttitiedot: Netdeck.gg`.~~ → 2026-10-01 (TXT-002, commit 6667d77): alatunnisteessa on kaksi kappaletta (`--font-size-sm`, `--color-text-muted`) tässä järjestyksessä: epävirallisuusmerkintä `Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.` ja lähdemaininta `Korttitiedot: Netdeck.gg`. Merkinnän perusta: SECURITY.md luku 7. Englanninkielinen lisämerkintä odottaa PM:n päätöstä (TXT-003).

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
│ │ V             Legend     5 │ │
│ │ Streetkid                  │ │ subname, sm + muted
│ ├────────────────────────────┤ │
│ │ Swordwise     Unit       3 │ │
│ │ Huscle                     │ │ pitkä nimi rivittyy
│ ├────────────────────────────┤ │
│ │ (kortti ilman Legend     – │ │ cost = null → "–"
│ │  hintaa)                   │ │
│ ├────────────────────────────┤ │
│ │ …                          │ │
│ └────────────────────────────┘ │
│                                │
│ Cyberdeck on epävirallinen     │ footer (sm, muted)
│ Cyberpunk TCG -fanityökalu.    │
│ WeirdCo, Netdeck.gg ja CD      │
│ PROJEKT RED eivät ole          │
│ hyväksyneet tai tukeneet sitä. │
│ Korttitiedot: Netdeck.gg       │
└────────────────────────────────┘
```

~~Rautalangan rivi `V · Legend · –`~~ → 2026-10-01 (TXT-007): rajapinnassa V Streetkidillä on hinta 5. Osalla Legendeistä on hinta (8 / 27 tarkastushetkellä), osalla ei. Puuttuva hinta on esitetty yleisenä esimerkkirivinä. ~~Alatunnisteessa vain lähdemaininta~~ → TXT-002, katso 4.3.

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
      <td>5</td>
    </tr>
    <tr>
      <th scope="row"><span lang="en">Swordwise Huscle</span></th>
      <td lang="en">Unit</td>
      <td>3</td>
    </tr>
    <tr>
      <th scope="row"><span lang="en">{kortti, jolla cost = null}</span></th>
      <td lang="en">Legend</td>
      <td><span aria-hidden="true">–</span><span class="visually-hidden">ei hintaa</span></td>
    </tr>
  </tbody>
</table>
```

~~Esimerkissä V Streetkidin hinta-solu oli "–" + "ei hintaa".~~ → 2026-10-01 (TXT-007): V Streetkidillä on hinta 5. Puuttuvan hinnan merkintätapa on esitetty erillisellä esimerkkirivillä. Merkintätapa ei muuttunut.

**Kentät ja niiden lähteet (TUTKIMUS.md):**

| Sarake | Rajapinnan kenttä | Esitys | Puuttuva arvo |
|---|---|---|---|
| Nimi | `name` + `subname` | `name` lihavoituna. Jos `subname` on olemassa, se näkyy omalla rivillään (`--font-size-sm`, `--color-text-muted`, normaali paino). Ruudunlukija lukee "V, Streetkid". | ~~`name` puuttuu → "Nimetön kortti".~~ → 2026-10-01 (UX-001): kortti, jolta puuttuu `name`, jätetään pois (ARCHITECTURE.md 5.5, `skipped`), ja näkymä näyttää OSITTAINEN-tilan. `subname` puuttuu → rivi jätetään pois. |
| Tyyppi | `card_type` | Sellaisenaan (Legend, Unit, Gear, Program), `lang="en"`. | ~~"–" + piilotettu "ei tyyppiä"~~ → 2026-10-01 (UX-001): kortti, jolta puuttuu tyyppi, jätetään pois kuten nimetön kortti (OSITTAINEN-tila). |
| Hinta | `cost` | Kokonaisluku, `tabular-nums`, tasattu oikealle. Pelin sisäinen hinta, ei rahallinen arvo. | `null`/puuttuu ~~(esim. Legend)~~ → "–" + piilotettu "ei hintaa". Arvo 0 näytetään "0". 2026-10-01 (TXT-007): hinta voi puuttua minkä tahansa tyyppiseltä kortilta. Osalla Legendeistä on hinta (esim. V Streetkid 5), joten tyyppi ei ratkaise esitystä, vaan `cost`-kentän arvo. |

- Rivin otsikko (`th scope="row"`) on kortin nimi, jotta ruudunlukija kertoo taulukossa liikuttaessa, minkä kortin tietoja luetaan.
- Järjestys: rajapinnan palauttama järjestys. Järjestäminen ja haku ovat MVP-1:tä. → 2026-10-01: haku ja suodatus luvussa 5 (T-010). Järjestäminen ei kuulu T-010:een.
- 2026-10-01 (T-010): Tyyppi-sarake muuttuu sarakkeeksi "Tyyppi ja väri", ja taulukon kuvateksti (caption) vaihtuu suodatettaessa. Katso 5.5.
- Rivien erotus: 1 px `--color-border` -viiva rivien välissä. Vuorottelevat taustavärit eivät ole pakollisia.
- Solujen sisäväli: `--space-2` pystysuunnassa, `--space-2` vaakasuunnassa (320 px:ssä), `--space-3` ≥ 640 px.
- Sarakeleveydet: Nimi vie jäljelle jäävän tilan. Tyyppi ja Hinta mitoittuvat sisältönsä mukaan (`width: 1%; white-space: nowrap`). Nimi rivittyy (`overflow-wrap: anywhere`), jotta pitkä nimi ei aiheuta vaakavieritystä.
- Taulukon otsikkorivi ei ole sticky MVP-0:ssa.
- Taulukko ei ole fokusoitava eikä rivit ole interaktiivisia. ~~Näppäimistön käyttäjälle sivulla on MVP-0:ssa fokusoitavaa vain virhe- ja osittaisessa tilassa (painike).~~ → 2026-10-01 (T-010): fokusjärjestys luvussa 5.7.
- Kaikki kortit näytetään yhdellä sivulla (151 riviä). Sivutusta tai virtualisointia ei tehdä MVP-0:ssa.

### 4.5 Tilat ja tarkat tekstit

Tekstit ovat lopullisia MVP-0:aan. ~~Sisällöntuottaja voi tarkistaa ne katselmoinnissa.~~ → 2026-10-01: Sisällöntuottaja tarkisti tekstit (`docs/reports/TXT-001-t001-tarkastus.md`). TYHJÄ-, OSITTAINEN- ja alatunnistetekstit päivitettiin raportin mukaisiksi (commit 6667d77). Toteutuksen lähde on `src/ui/texts.ts`.

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

Kortteja ei löytynyt. Korttitietojen lähde ei
juuri nyt palauttanut yhtään korttia. Yritä
hetken päästä uudelleen.
[ Yritä uudelleen ]
```

- Tilarivi: `0 korttia`
- Kappale: ~~`Kortteja ei löytynyt. Korttitietokanta on juuri nyt tyhjä. Yritä myöhemmin uudelleen.`~~ → 2026-10-01 (TXT-004, commit 6667d77): `Kortteja ei löytynyt. Korttitietojen lähde ei juuri nyt palauttanut yhtään korttia. Yritä hetken päästä uudelleen.` (Ei viittausta tietokantaan, jota käyttäjä ei tunne, eikä ristiriitaa välittömän uudelleenyrityspainikkeen kanssa.)
- Painike: `Yritä uudelleen`
- Live-alue: `Kortteja ei löytynyt.`
- Ei ilmoituslaatikkoa (tämä ei ole virhe). Taulukkoa ei näytetä.

#### VIRHE (~~ensimmäinen sivu epäonnistui~~ → 2026-10-01, PM:n ratkaisu T-001-kortissa: mikä tahansa sivu epäonnistui; verkkovirhe, aikakatkaisu, ei-2xx-vastaus tai jäsentämätön vastaus)

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

#### OSITTAINEN (~~osa sivuista saatiin, mutta vähintään yksi sivu epäonnistui, tai saatujen korttien määrä < `total`~~ → 2026-10-01, PM:n ratkaisu T-001-kortissa: kaikki sivut saatiin, mutta näytettävien korttien määrä < `total`)

```
Kortit
120 / 151 korttia

┌ Kaikkia kortteja ei saatu ─────┐   ← h2, warning-laatikko
│ näkyviin                       │     (otsikko rivittyy 320 px:ssä)
│ Osa korteista puuttuu          │
│ listasta, koska niiden         │
│ tietoja ei saatu tai ne olivat │
│ puutteellisia. Voit yrittää    │
│ hakea kortit uudelleen.        │
│ [ Yritä uudelleen ]            │
└────────────────────────────────┘

┌ taulukko (120 riviä) ──────────┐
```

- Tilarivi: `{saatu} / {total} korttia` (esim. `120 / 151 korttia`). Välilyönnit kauttaviivan ympärillä.
- h2: ~~`Kaikkia kortteja ei saatu`~~ → 2026-10-01 (TXT-001, commit 6667d77): `Kaikkia kortteja ei saatu näkyviin`
- Kappale: ~~`Osa korttitiedoista jäi hakematta. Lista on puutteellinen. Yritä uudelleen hakeaksesi kaikki kortit.`~~ → 2026-10-01 (TXT-001): `Osa korteista puuttuu listasta, koska niiden tietoja ei saatu tai ne olivat puutteellisia. Voit yrittää hakea kortit uudelleen.`
- Painike: `Yritä uudelleen`
- Live-alue: ~~`Näytetään {saatu} / {total} korttia. Osa korttitiedoista jäi hakematta.`~~ → 2026-10-01 (TXT-001): `Näytetään {saatu} / {total} korttia. Osa korteista puuttuu listasta.` (Kauttaviivamuoto välttää lukusanan taivutuksen, esim. "151:stä".)
- Perustelu muutokselle (TXT-001): PM:n ratkaisun jälkeen yksikin epäonnistunut sivu on VIRHE. OSITTAINEN syntyy käytännössä, kun kaikki sivut saatiin mutta osa korteista ohitettiin puutteellisina (ARCHITECTURE.md 5.5, `skipped`) tai lähde palautti vähemmän kortteja kuin `total`. Uusi haku ei siksi välttämättä tuo puuttuvia kortteja, eikä teksti saa luvata sitä.
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
6. rivit: ~~"V, Streetkid" · "Legend" · "ei hintaa"~~ → 2026-10-01 (TXT-007): "V, Streetkid" · "Legend" · "5" … (kortti, jolla ei ole hintaa: "{nimi}" · "{tyyppi}" · "ei hintaa")
7. contentinfo: ~~"Korttitiedot: Netdeck.gg"~~ → 2026-10-01 (TXT-002): "Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä." · "Korttitiedot: Netdeck.gg"

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
- ~~Haku, suodatus,~~ järjestäminen, kortin yksityiskohtanäkymä (haku ja suodatus → luku 5, T-010)
- Muut kentät (~~väri,~~ teho, RAM, harvinaisuus, setti). Lisätään MVP-1:ssä tarpeen mukaan. (Väri → luku 5.5, T-010)
- Teemavalitsin, ohituslinkki, sticky-otsikkorivi

---

## 5. Haku ja suodatus korttilistassa (T-010, MVP-1)

### 5.1 Käyttäjä ja tavoite

Pelaaja etsii pelipöydän ääressä tiettyä korttia, yleensä puhelimella. Hän muistaa nimen tai osan siitä ("silver") tai haluaa nähdä esimerkiksi kaikki punaiset Unitit. Tavoite: oikea kortti näkyy muutamassa sekunnissa ilman 151 rivin vierittämistä.

Rajaukset (T-010-kortin mukaan): hakutilaa ei tallenneta URL:iin eikä selaimeen, listaa ei järjestetä, eikä sääntötekstejä (`rules_text`) haeta. Lisäksi tästä määrittelystä on jätetty pois vaihtoehtokohtaiset lukumäärät ("Legend (27)"), lomakkeen oma tyhjennyspainike ja suodattimien piilottaminen (`<details>`). Ne kirjataan tarvittaessa IDEAS.md:hen.

### 5.2 Rajapinnan `color`- ja `card_type`-arvot (tarkistettu 2026-10-01)

Haettu `https://api.netdeck.gg/api/cards/cyberpunk?limit=100&offset=0|100|200`: `total` = 151, saatu 151.

| `color` | Kortteja | | `card_type` | Kortteja |
|---|---|---|---|---|
| `"Red"` | 38 | | `"Legend"` | 27 |
| `"Yellow"` | 37 | | `"Unit"` | 73 |
| `"Green"` | 38 | | `"Gear"` | 17 |
| `"Blue"` | 38 | | `"Program"` | 34 |

- Jokaisella kortilla on väri. `null`-arvoa ei esiintynyt, mutta sovellusmalli sallii sen (`Card.color: string | null`, `src/domain/card.ts`), joten se määritellään alla.
- Jokainen väri esiintyy jokaisessa tyypissä, joten mikään tyyppi + väri -yhdistelmä ei ole valmiiksi tyhjä.
- Nimissä on aksentteja ja erikoismerkkejä: `Judy Álvarez`, `El Sombrerón`, `Les Élémens`, heittomerkki, väliviiva ja sulkeet. Pisin nimi + alaotsikko: `Viktor Vektor` / `You Might Feel a Little Pinch`.

**Värin esitys.** Värin nimi näytetään aina **tekstinä** suomeksi, ja sen vieressä on koristeellinen värinäyte (3.1.1). Väri ei siis koskaan välity pelkällä värillä (WCAG 1.4.1). Tieto säilyy myös värisokealle, harmaasävynäytöllä ja Windowsin suuren kontrastin tilassa (näyte voi kadota, teksti jää).

| `color` | Teksti käyttöliittymässä | Näytteen token |
|---|---|---|
| `Red` | Punainen | `--color-card-red` |
| `Yellow` | Keltainen | `--color-card-yellow` |
| `Green` | Vihreä | `--color-card-green` |
| `Blue` | Sininen | `--color-card-blue` |
| muu merkkijono (uusi väri) | rajapinnan arvo sellaisenaan, `lang="en"` | `--color-card-unknown` |
| `null` | "–" (`aria-hidden`) + piilotettu `ei väriä` | ei näytettä |

Perustelu suomenkielisille nimille: korttityypit näytetään englanniksi, koska ne on painettu kortteihin (K2). Värejä ei ole painettu kortteihin sanoina, vaan ne ovat yleiskieltä. Katso avoin kysymys K6 (5.12).

### 5.3 Polku

```
ONNISTUMINEN tai OSITTAINEN (4.5): lista, haku ja suodattimet näkyvät
  │
  ├─ Käyttäjä kirjoittaa hakukenttään ─┐
  ├─ Käyttäjä valitsee tai poistaa      ├─→ lista suodattuu heti (jokaisella näppäilyllä)
  │  tyypin tai värin                   │   tilarivi päivittyy heti: "{n} / {kaikki} korttia"
  │                                     │   live-alue ilmoittaa 750 ms:n viiveellä (5.6)
  │                                     │
  │                                     ├─ n ≥ 1 → SUODATETTU (taulukossa n riviä)
  │                                     └─ n = 0 → EI TULOKSIA
  │                                          → [Tyhjennä haku ja suodattimet]
  │                                          → kaikki kortit, fokus hakukenttään
  │
  └─ Käyttäjä tyhjentää haun ja poistaa valinnat itse → koko lista (EI SUODATUSTA)

LATAUS, VIRHE, TYHJÄ (4.5): hakua ja suodattimia ei näytetä (5.8)
```

**Suodatussäännöt (odotettu toiminta, Koodari toteuttaa):**

- Haku kohdistuu kortin nimeen ja alaotsikkoon. Kortti vastaa hakua, jos hakusana löytyy osana jostakin merkkijonoista `name`, `subname` tai `"{name} {subname}"`. Esimerkit: `silver` → molemmat Johnny Silverhand -kortit, `v streetkid` → V Streetkid, `renegade` → Johnny Silverhand Rocking Renegade.
- Kirjainkoolla ei ole väliä. Aksenteilla ei ole väliä: `alvarez` löytää `Judy Álvarez` (Unicode-normalisointi NFD ja yhdistävien merkkien poisto molemmista puolista).
- Hakusanan alusta ja lopusta poistetaan välilyönnit, ja peräkkäiset välilyönnit tiivistetään yhdeksi. Pelkistä välilyönneistä koostuva hakusana = ei hakua.
- Kaikki merkit ovat tavallista tekstiä (ei säännöllisiä lausekkeita eikä jokerimerkkejä). `*`, `(` ja `<script>` haetaan kirjaimellisesti, ja ne johtavat yleensä EI TULOKSIA -tilaan.
- Tyypit: yksi tai useampi valittu → näytetään kortit, joiden tyyppi on jokin valituista (TAI). Ei valintoja → kaikki tyypit.
- Värit: sama logiikka kuin tyypeissä.
- Haku, tyypit ja värit yhdistetään JA-ehdolla.
- Vaihtoehdot: neljä tunnettua tyyppiä ja väriä aina tässä järjestyksessä (Legend, Unit, Gear, Program · Punainen, Keltainen, Vihreä, Sininen). Jos ladatuissa korteissa on tuntematon tyyppi tai väri, se lisätään vaihtoehdoksi tunnettujen perään rajapinnan arvolla (`lang="en"`). Kortti, jonka väri on `null`, näkyy vain, kun yhtään väriä ei ole valittu.
- Hakusanan enimmäispituus on Koodarin ja Digiturvan päätös. UX ehdottaa `maxlength="100"`. Rajasta ei tarvitse näyttää ilmoitusta.

### 5.4 Sivun rakenne

Luvun 4.3 rakenne säilyy. Uusi lomake tulee tilarivin, live-alueen ja OSITTAINEN-tilan varoituslaatikon jälkeen ja ennen taulukkoa:

```html
<main>
  <h1 tabindex="-1">Kortit</h1>
  <p id="card-status">2 / 151 korttia</p>                     <!-- tilarivi, päivittyy heti -->
  <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>
  <!-- OSITTAINEN: varoituslaatikko (4.5) tähän -->

  <form role="search" aria-label="Hae ja suodata kortteja" class="card-filters">
    <div class="field">
      <label for="card-search">Hae nimellä</label>
      <p id="card-search-hint" class="hint">Kortin nimi tai alaotsikko. Osa sanasta riittää.</p>
      <input id="card-search" type="search" aria-describedby="card-search-hint"
             autocomplete="off" spellcheck="false" autocapitalize="none" enterkeyhint="search">
    </div>

    <p id="filter-hint" class="hint">Valitse yksi tai useampi. Ilman valintaa näytetään kaikki.</p>

    <fieldset aria-describedby="filter-hint">
      <legend>Tyyppi</legend>
      <div class="options">
        <label><input type="checkbox" name="type" value="Legend"> <span lang="en">Legend</span></label>
        <label><input type="checkbox" name="type" value="Unit"> <span lang="en">Unit</span></label>
        <label><input type="checkbox" name="type" value="Gear"> <span lang="en">Gear</span></label>
        <label><input type="checkbox" name="type" value="Program"> <span lang="en">Program</span></label>
      </div>
    </fieldset>

    <fieldset aria-describedby="filter-hint">
      <legend>Väri</legend>
      <div class="options">
        <label><input type="checkbox" name="color" value="Red">
          <span class="color-swatch color-swatch-red" aria-hidden="true"></span> Punainen</label>
        <label><input type="checkbox" name="color" value="Yellow">
          <span class="color-swatch color-swatch-yellow" aria-hidden="true"></span> Keltainen</label>
        <label><input type="checkbox" name="color" value="Green">
          <span class="color-swatch color-swatch-green" aria-hidden="true"></span> Vihreä</label>
        <label><input type="checkbox" name="color" value="Blue">
          <span class="color-swatch color-swatch-blue" aria-hidden="true"></span> Sininen</label>
      </div>
    </fieldset>
  </form>

  <!-- EI SUODATUSTA / SUODATETTU: taulukko (5.5) · EI TULOKSIA: tyhjä tila (5.6) -->
</main>
```

- Maamerkki: `form role="search"` (search-maamerkki), nimi `Hae ja suodata kortteja`. Muita maamerkkejä ei lisätä.
- Otsikot: lomakkeelle ei lisätä otsikkoa. Otsikkorakenne säilyy: `h1` + tarvittaessa ilmoituslaatikon `h2`.
- Lomake ei lähetä mitään: `onSubmit` estää oletustoiminnon (Enter ei lataa sivua uudelleen, katso 5.7).
- Hakukenttä on `type="search"`, ei `type="text"`. Selaimen oma tyhjennysruksi saa näkyä.
- Värinäyte `.color-swatch`: `display: inline-block; inline-size: 0.875rem; block-size: 0.875rem; border: 1px solid var(--color-border-strong); border-radius: 2px; vertical-align: middle;`, taustana värin token. Aina `aria-hidden="true"`.
- Valintaruutujen järjestys DOM:ssa on sama kuin näkyvä järjestys.

### 5.5 Taulukko suodatettuna

Taulukon rakenne (4.4) säilyy, mutta kolme asiaa muuttuu:

1. **Sarake "Tyyppi" → "Tyyppi ja väri".** Väri näytetään tyypin alla omalla rivillään samaan tapaan kuin alaotsikko nimen alla (`--font-size-sm`, `--color-text-muted`), värinäytteen kanssa. Erillistä neljättä saraketta ei tehdä, koska se ei mahdu 320 px:iin kaventamatta nimisaraketta liikaa. Ilman värisaraketta käyttäjä ei näkisi, miksi kortti on suodatuksen tuloksessa.

```html
<th scope="col" class="col-fit col-wrap-header">Tyyppi ja väri</th>
…
<td class="col-fit">
  <span lang="en">Unit</span>
  <span class="visually-hidden">, </span>
  <span class="card-color">
    <span class="color-swatch color-swatch-red" aria-hidden="true"></span> Punainen
  </span>
</td>
```

   - Ruudunlukija lukee solun "Unit, Punainen".
   - Otsikkosolu saa rivittyä (`white-space: normal`), jotta sarakkeen leveys määräytyy solujen sisällöstä ("Program", "Keltainen" + näyte), ei otsikosta. 320 px:ssä otsikko on kahdella rivillä.
   - Väri `null`: `<span aria-hidden="true">–</span><span class="visually-hidden">ei väriä</span>`.
   - Väri näkyy kaikissa tiloissa, myös ilman suodatusta.
2. **Taulukon piilotettu kuvateksti (caption)** vaihtuu: ei hakua eikä valintoja → `Kaikki kortit`. Haku tai valinta käytössä → `Hakua vastaavat kortit`.
3. **Rivien määrä** on suodatuksen tulos. Rivit näytetään rajapinnan järjestyksessä.

### 5.6 Tilat ja tarkat tekstit

`{n}` = näkyvien korttien määrä. `{kaikki}` = ladattujen korttien määrä (ONNISTUMINEN-tilassa sama kuin `total`, OSITTAINEN-tilassa saatujen korttien määrä). Luvut muotoillaan `Intl.NumberFormat('fi-FI')`:lla kuten 4.5:ssä.

| Tila | Milloin | Tilarivi (näkyvä, päivittyy heti) | Live-alue (viiveellä, ks. alla) | Muu sisältö |
|---|---|---|---|---|
| **EI SUODATUSTA** | haku tyhjä, ei valintoja | `{kaikki} korttia` (kuten 4.5) | latauksen jälkeen `{kaikki} korttia ladattu.` (4.5), suodatuksen poiston jälkeen `Näytetään kaikki {kaikki} korttia.` | taulukko, caption `Kaikki kortit` |
| **SUODATETTU** | haku tai valinta käytössä, n ≥ 1 | `{n} / {kaikki} korttia` (esim. `2 / 151 korttia`) | `Näytetään {n} / {kaikki} korttia.` | taulukko, caption `Hakua vastaavat kortit` |
| **EI TULOKSIA** | haku tai valinta käytössä, n = 0 | `0 / {kaikki} korttia` | `Valintoja vastaavia kortteja ei löytynyt.` | tyhjä tila (alla), ei taulukkoa |

- Osuusmuodossa `korttia` ei taivu luvun mukaan (`1 / 151 korttia`), kuten CONTENT.md:n luvussa 3.
- OSITTAINEN-tilassa varoituslaatikko pysyy näkyvissä suodatuksen aikana, ja tilarivin osuus lasketaan saaduista korteista (esim. `12 / 120 korttia`). Varoitus kertoo, että kortteja puuttuu.

**EI TULOKSIA, rautalanka 320 px**

```
┌────────────────────────────────┐
│ Kortit                         │ h1
│ 0 / 151 korttia                │ tilarivi
│                                │
│ Hae nimellä                    │ label
│ Kortin nimi tai alaotsikko.    │ ohje (sm, muted)
│ Osa sanasta riittää.           │
│ ┌────────────────────────────┐ │
│ │ silverhandd             ✕ │ │ input type=search
│ └────────────────────────────┘ │
│ …suodattimet (5.9)…            │
│                                │
│ Valintoja vastaavia kortteja   │ p (tyhjä tila, ei laatikkoa)
│ ei löytynyt. Tarkista          │
│ hakusana tai poista valintoja  │
│ suodattimista.                 │
│ [ Tyhjennä haku ja           ] │ ensisijainen painike
│ [ suodattimet                ] │
└────────────────────────────────┘
```

- Kappale: `Valintoja vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista.`
- Painike: `Tyhjennä haku ja suodattimet` (ensisijainen painike, 3.4). Se tyhjentää hakukentän, poistaa kaikki valinnat ja siirtää fokuksen hakukenttään. Live-alue ilmoittaa heti (ilman viivettä) `Näytetään kaikki {kaikki} korttia.`
- Tyhjä tila ei ole virhe: ei ilmoituslaatikkoa eikä `h2`:ta. Sama tyyli kuin TYHJÄ-tilassa (4.5, luokka `empty`).
- Hakusana jää kenttään, jotta käyttäjä näkee, mitä kirjoitti, ja voi korjata sen.

**Live-ilmoitusten hillintä (debounce)**

- Taulukko ja tilarivi päivittyvät heti jokaisella muutoksella. Vain live-alueen teksti päivitetään viiveellä.
- Viive: **750 ms viimeisestä muutoksesta** (näppäily, valinta, valinnan poisto, selaimen tyhjennysruksi, Esc). Jokainen uusi muutos nollaa ajastimen. Nopea kirjoittaja kuulee yhden ilmoituksen, kun hän pysähtyy, eikä ilmoitusta jokaisesta merkistä.
- Enter hakukentässä antaa ilmoituksen heti (ajastin puretaan) eikä tee muuta.
- Ilmoitusta ei anneta, jos tulos (tila ja n) on sama kuin edellisessä ilmoituksessa. Esimerkki: käyttäjä lisää merkin, eikä korttien määrä muutu → ei uutta ilmoitusta.
- Toistokielto koskee viiveellisiä ja Enterin ilmoituksia. `Tyhjennä haku ja suodattimet` ilmoittaa aina heti, koska se on käyttäjän nimenomainen toiminto ja painike katoaa painettaessa (UX-004).
- **Lataus, kun haku tai valinta on käytössä (K9, UX-002).** Hakutila säilyy uudelleenyrityksen yli (5.8), joten latauksen päättyessä lista voi olla suodatettu. Silloin live-alueen latausviesti yhdistää latauksen ja suodatuksen tuloksen, jotta ruudunlukija kuulee saman kuin tilarivillä näkyy:

  | Tila latauksen jälkeen | n ≥ 1 | n = 0 |
  |---|---|---|
  | ONNISTUMINEN | `{kaikki} korttia ladattu. Näytetään {n} / {kaikki} korttia.` | `{kaikki} korttia ladattu. Valintoja vastaavia kortteja ei löytynyt.` |
  | OSITTAINEN | `Näytetään {n} / {kaikki} korttia. Osa korteista puuttuu listasta.` | `Valintoja vastaavia kortteja ei löytynyt. Osa korteista puuttuu listasta.` |

  `{kaikki}` = saatujen korttien määrä kuten tilarivillä. Ilman hakua ja valintoja latausviestit ovat ennallaan (4.5). Tämä viesti on toistokiellon lähtökohta: jos seuraavan muutoksen tulos on sama, siitä ei ilmoiteta uudelleen.
- Ajastin perutaan, jos näkymä siirtyy LATAUS-tilaan (uudelleenyritys) tai komponentti poistuu. Vanhentunut ilmoitus ei saa ylikirjoittaa latausilmoitusta.
- Kun kirjoitetaan syöttömenetelmällä (IME-koostaminen kesken), ilmoitusta ei anneta ennen kuin koostaminen päättyy.
- Käytetään olemassa olevaa `role="status"`-aluetta (4.3). Toista live-aluetta ei lisätä, eikä `aria-live="assertive"` ole sallittu.
- Hakukenttää ei liitetä tilariviin `aria-describedby`-attribuutilla (ruudunlukija lukisi luvun aina, kun kenttä saa fokuksen). Live-alue riittää.

### 5.7 Fokus ja näppäimistö

Sarkainjärjestys (DOM-järjestys) ONNISTUMINEN-tilassa:

1. Hakukenttä `Hae nimellä`
2. Valintaruudut `Legend` → `Unit` → `Gear` → `Program` (jokainen oma sarkainpysähdys, natiivit valintaruudut)
3. Valintaruudut `Punainen` → `Keltainen` → `Vihreä` → `Sininen`
4. EI TULOKSIA -tilassa: `Tyhjennä haku ja suodattimet`
5. Alatunnisteen linkit (jos on)

OSITTAINEN-tilassa `Yritä uudelleen` (varoituslaatikossa) on ennen hakukenttää.

- Välilyönti valitsee valintaruudun ja poistaa valinnan (natiivi toiminta). Nuolinäppäimiä ei tarvita.
- Esc hakukentässä tyhjentää kentän, jos siinä on tekstiä. Tämä toteutetaan itse, jotta toiminta on sama kaikissa selaimissa (Firefox ei tee sitä itse). Fokus pysyy kentässä.
- Enter hakukentässä ei lähetä lomaketta eikä lataa sivua (katso 5.6).
- Suodatus ei koskaan siirrä fokusta. Ainoa ohjelmallinen fokussiirto on `Tyhjennä haku ja suodattimet` → hakukenttä, koska painike katoaa painettaessa.
- Uudelleenyritys (4.6) siirtää fokuksen edelleen `h1`:een.
- Hakukenttää ei fokusoida automaattisesti sivun latautuessa (ei `autofocus`): mobiilissa se avaisi näppäimistön, joka peittäisi listan, ja ruudunlukija ohittaisi otsikon.
- Sticky-elementtejä ei käytetä, joten mikään ei peitä fokusta (2.4.11).

### 5.8 Haku muissa tiloissa

| Tila (4.5) | Haku ja suodattimet |
|---|---|
| LATAUS | **Ei näytetä** (ei renderöidä). Ei `disabled`-kenttiä: käytöstä poistetut kentät hämmentävät ruudunlukijan ja näppäimistön käyttäjää, eikä suodatettavaa ole. |
| VIRHE | Ei näytetä. |
| TYHJÄ (`total` = 0) | Ei näytetä. |
| OSITTAINEN | Näytetään, jos saatuja kortteja on vähintään yksi. Suodattaa saatuja kortteja. Jos yhtään korttia ei saatu, lomaketta ei näytetä (ei suodatettavaa), mutta hakutila säilyy taustalla (UX-003). |
| ONNISTUMINEN | Näytetään. |

- **Hakutila säilyy uudelleenyrityksen yli:** jos käyttäjä on OSITTAINEN-tilassa kirjoittanut hakusanan tai valinnut suodattimia ja painaa `Yritä uudelleen`, hakusana ja valinnat ovat samat, kun lista on taas ladattu (WCAG 3.3.7, tietoa ei pyydetä uudelleen). Tila säilytetään siis lomaketta ylemmällä tasolla. Sivun uudelleenlataus tyhjentää sen (rajaus: ei tallennusta).
- Sana "haku" tarkoittaa nyt kahta asiaa: korttien hakemista lähteestä (`Haetaan kortteja…`, `Korttien haku epäonnistui`) ja nimellä hakemista. Ne eivät näy samaan aikaan, koska hakukenttä on piilossa LATAUS- ja VIRHE-tiloissa. Katso K7.

### 5.9 Rautalanka ja responsiivisuus

**320 px (ja 400 % zoom 1280 px:n ikkunassa), SUODATETTU**

```
┌────────────────────────────────┐
│ Cyberdeck                      │ header
├────────────────────────────────┤
│ Kortit                         │ h1
│ 2 / 151 korttia                │ tilarivi
│                                │
│ Hae nimellä                    │ label (bold)
│ Kortin nimi tai alaotsikko.    │ ohje (sm, muted)
│ Osa sanasta riittää.           │
│ ┌────────────────────────────┐ │
│ │ silver                  ✕ │ │ vähintään 44 px korkea
│ └────────────────────────────┘ │
│                                │ --space-4
│ Valitse yksi tai useampi.      │ ohje (sm, muted)
│ Ilman valintaa näytetään       │
│ kaikki.                        │
│ Tyyppi                         │ legend (bold)
│ [☐ Legend]  [☐ Unit]           │ 44 px rivit, rivittyy
│ [☐ Gear]    [☐ Program]        │
│ Väri                           │ legend
│ [☑ ■ Punainen] [☐ ■ Keltainen] │
│ [☐ ■ Vihreä]   [☐ ■ Sininen]   │
│                                │ --space-6
│ ┌────────────────────────────┐ │
│ │ Nimi        Tyyppi    Hinta│ │ thead
│ │             ja väri        │ │
│ ├────────────────────────────┤ │
│ │ Johnny      Legend       – │ │
│ │ Silverhand  ■ Punainen     │ │
│ │ Rocking                    │ │ subname
│ │ Renegade                   │ │
│ ├────────────────────────────┤ │
│ │ Johnny      Unit         6 │ │
│ │ Silverhand  ■ Punainen     │ │
│ │ Never Stop                 │ │
│ │ Fighting                   │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

- Lomake vie 320 px:ssä noin 380 px korkeutta. Taulukko jää puhelimessa osin näkymän alle, mutta tilarivi kertoo tulosten määrän heti otsikon alla. Tämä on hyväksytty kompromissi (suodattimien piilotus olisi lisäominaisuus, katso 5.1).
- Valintaruudut rivittyvät vapaasti: 320 px:ssä yleensä kaksi riville, 400 % zoomilla tai suurella tekstillä yksi riville. Ei vaakavieritystä.
- Välistys: label → ohje `--space-1`, ohje → kenttä `--space-2`, kenttä → suodatinohje `--space-4`, legend → vaihtoehdot `--space-1`, fieldset → fieldset `--space-3`, lomake → taulukko tai tyhjä tila `--space-6`.

**≥ 640 px (40 rem)**

```
┌──────────────────────────────────────────────────────────┐
│ Kortit                                                   │
│ 2 / 151 korttia                                          │
│                                                          │
│ Hae nimellä                                              │
│ Kortin nimi tai alaotsikko. Osa sanasta riittää.         │
│ ┌──────────────────────────────┐                         │ enintään 24 rem
│ │ silver                    ✕ │                         │
│ └──────────────────────────────┘                         │
│ Valitse yksi tai useampi. Ilman valintaa näytetään kaikki.│
│ Tyyppi                                                   │
│ [☐ Legend] [☐ Unit] [☐ Gear] [☐ Program]                 │
│ Väri                                                     │
│ [☑ ■ Punainen] [☐ ■ Keltainen] [☐ ■ Vihreä] [☐ ■ Sininen] │
│                                                          │
│ taulukko                                                 │
└──────────────────────────────────────────────────────────┘
```

- Fieldsetit pysyvät allekkain (ei kahta saraketta), jotta lukujärjestys ja visuaalinen järjestys ovat samat kaikilla leveyksillä.
- 200 % tekstin suurennus ja WCAG 1.4.12 -välistys: label- ja ohjetekstit rivittyvät. Kentällä ja valintaruuduilla ei ole kiinteää korkeutta (vain `min-height`).

### 5.10 Saavutettavuusvaatimukset (tarkistuslista Koodarille)

- [ ] Lomake `form role="search" aria-label="Hae ja suodata kortteja"`, `onSubmit` estää lähetyksen
- [ ] Hakukenttä `type="search"`, näkyvä `<label for>` `Hae nimellä`, ohje liitetty `aria-describedby`:llä, ei placeholderia labelina, ei `autofocus`
- [ ] Tyyppi ja väri omina `<fieldset>`-ryhminä, `<legend>` `Tyyppi` ja `Väri`, ryhmäohje `aria-describedby`:llä
- [ ] Natiivit valintaruudut labelin sisällä. Koko label vähintään 44 × 44 px (WCAG 2.5.8 vaatii 24 px, UX.md 44 px).
- [ ] Korttityypit `lang="en"`. Värit suomeksi tekstinä. Värinäyte `aria-hidden="true"`, reuna `--color-border-strong`.
- [ ] Taulukon sarake `Tyyppi ja väri`, solussa tyyppi + piilotettu `, ` + väri. Caption vaihtuu: `Kaikki kortit` ↔ `Hakua vastaavat kortit`.
- [ ] Tilarivi päivittyy heti. Live-alue (sama `role="status"` kuin 4.3) päivittyy 750 ms:n viiveellä, ei toista samaa tulosta ja perutaan LATAUS-tilassa.
- [ ] EI TULOKSIA: kappale + `Tyhjennä haku ja suodattimet`, joka tyhjentää kaiken ja siirtää fokuksen hakukenttään
- [ ] Esc tyhjentää hakukentän. Enter ei lähetä lomaketta.
- [ ] Suodatus ei siirrä fokusta
- [ ] Haku ja suodattimet eivät renderöidy LATAUS-, VIRHE- ja TYHJÄ-tiloissa. Hakutila säilyy uudelleenyrityksen yli.
- [ ] Haku ei riipu kirjainkoosta eikä aksenteista. Erikoismerkit ja `<script>alert(1)</script>` käsitellään tavallisena tekstinä, eikä hakusanaa renderöidä koskaan HTML:nä (SR-1).
- [ ] Kaikki värit tokeneista (3.1, 3.1.1). Ei uusia animaatioita eikä siirtymiä. Jos hover- tai fokussiirtymä lisätään, se poistetaan `prefers-reduced-motion: reduce` -tilassa.
- [ ] Ei vaakavieritystä 320 px:ssä eikä 400 % zoomilla pisimmällä nimellä (`Viktor Vektor` / `You Might Feel a Little Pinch`) ja pisimmällä värillä (`Keltainen`)
- [ ] axe-core: 0 rikkomusta tiloissa EI SUODATUSTA, SUODATETTU, EI TULOKSIA ja OSITTAINEN + SUODATETTU

### 5.11 Ruudunlukija: odotettu kulku

1. Sarkain hakukenttään: "Hae nimellä, hakukenttä, Kortin nimi tai alaotsikko. Osa sanasta riittää."
2. Käyttäjä kirjoittaa "silver" ja pysähtyy → 750 ms:n kuluttua: "Näytetään 2 / 151 korttia."
3. Sarkain: "Tyyppi, ryhmä, Valitse yksi tai useampi. Ilman valintaa näytetään kaikki. Legend, valintaruutu, ei valittu."
4. Sarkain neljä kertaa: "Väri, ryhmä … Punainen, valintaruutu, ei valittu." Välilyönti: "valittu", ja 750 ms:n kuluttua tulosilmoitus.
5. Taulukossa: "Hakua vastaavat kortit, taulukko, 3 saraketta …", rivi "Johnny Silverhand, Rocking Renegade" · "Legend, Punainen" · "ei hintaa".

### 5.12 Avoimet kysymykset

- **K6 · Värien kieli.** Oletus: värit suomeksi (Punainen, Keltainen, Vihreä, Sininen), koska niitä ei ole painettu kortteihin sanoina, toisin kuin tyypit (K2). Vaihtoehto: englanniksi kuten rajapinnassa (Red, Yellow, Green, Blue). Sisällöntuottaja lisää valitut termit CONTENT.md:n sanastoon. Muutos on pelkkä tekstimuutos `texts.ts`:ssä.
- **K7 · "Haku"-sanan kaksi merkitystä.** Oletus: hakukentän label on vakiintunut `Hae nimellä`, ja latausviestit säilyvät ennallaan, koska ne eivät näy samaan aikaan (5.8). Sisällöntuottaja päivittää CONTENT.md:n sanaston (rivi "hakea / haku").
- **K8 · Sarake "Tyyppi ja väri".** Oletus tämä. Vaihtoehto: erillinen Väri-sarake vain ≥ 640 px:ssä, mutta silloin eri leveydet olisivat epäjohdonmukaisia.
- **K9 · Latausviesti, kun lista on suodatettu.** Ratkaistu 2026-10-01 (UX-002): yhdistetty viesti, katso 5.6.
