# UX · cyberdeck

> Omistaja: UX Designer. Versio 0.5 · 2026-10-01 (T-012). Alkuperäinen versio 0.2 (T-001, MVP-0). Muutos 0.2: katselmoinnin UX-001 tarkennukset lukuihin 4.3, 4.4 ja 4.9 (raportti `docs/reports/UX-001-t001-katselmointi.md`).
> Muutos 0.3 · 2026-10-01 (T-010, MVP-1): uusi luku 5 (haku ja suodatus), korttien väritokenit (3.1.1) sekä tekstikenttä ja valintaruutu (3.4). Luvun 4 kohtiin, joita luku 5 muuttaa, on lisätty viittaus.
> Muutos 0.4 · 2026-10-01 (T-010, katselmointi UX-002): K9 ratkaistu (latausviesti suodatettuna, 5.6), tyhjennyspainikkeen ilmoitus ja toistokielto (5.6), OSITTAINEN ilman kortteja (5.8). Raportti `docs/reports/UX-002-t010-katselmointi.md`.
> Muutos 0.5 · 2026-10-01 (T-012, MVP-1): uusi luku 6 (kokoelma): määräkontrolli korttirivillä, korttimainen rivi alle 40 rem:ssä, "Vain omistetut" -suodatin, kokoelman yhteenveto, selainmuistutus ja pysyvän tallennuksen pyyntö, tallennuskerroksen ilmoitukset ja virheet, ruudunlukijailmoitukset ja tarkistuslista. Uudet komponentit: määräpainike ja toissijainen painike (6.4.3).
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
| **EI TULOKSIA** | haku tai valinta käytössä, n = 0 | `0 / {kaikki} korttia` | `Hakua vastaavia kortteja ei löytynyt.` | tyhjä tila (alla), ei taulukkoa |

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
│ Hakua vastaavia kortteja ei    │ p (tyhjä tila, ei laatikkoa)
│ löytynyt. Tarkista hakusana    │
│ tai poista valintoja           │
│ suodattimista.                 │
│ [ Tyhjennä haku ja           ] │ ensisijainen painike
│ [ suodattimet                ] │
└────────────────────────────────┘
```

- Kappale: `Hakua vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista.`
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
  | ONNISTUMINEN | `{kaikki} korttia ladattu. Näytetään {n} / {kaikki} korttia.` | `{kaikki} korttia ladattu. Hakua vastaavia kortteja ei löytynyt.` |
  | OSITTAINEN | `Näytetään {n} / {kaikki} korttia. Osa korteista puuttuu listasta.` | `Hakua vastaavia kortteja ei löytynyt. Osa korteista puuttuu listasta.` |

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

---

## 6. Kokoelma (T-012, MVP-1)

### 6.1 Käyttäjä ja tavoite

Pelaaja istuu pelipöydän ääressä puhelimen kanssa ja käy korttilistaa läpi. Hän haluaa merkitä omistamansa kortit ja niiden määrät **muutamalla painalluksella** ja nähdä myöhemmin, mitä hänellä on. Yhden kortin merkitseminen omistetuksi on **yksi painallus** hakutuloksesta. Tieto säilyy selaimessa (D-008). Pakat (T-013), puuttuvien korttien raportti (T-014), vienti ja tuonti (T-015), painokset (D-007) ja mobiilin kompakti lomake (T-018) eivät kuulu tähän.

Termit (Sisällöntuottaja lisää CONTENT.md:n sanastoon, katso 6.14): **kokoelma** (omat kortit), **omistetut** (kortit, joita on vähintään yksi), **kappale** (yksi fyysinen kortti). Käyttäjälle ei puhuta "tallennuskerroksesta", "avaimista", "skeemasta" eikä "localStoragesta".

### 6.2 Polku

```
ONNISTUMINEN tai OSITTAINEN (4.5), vähintään yksi kortti
  │
  ├─ Kokoelma luetaan selaimesta (nopea, paikallinen)
  │    ├─ onnistui                      → KOKOELMA VALMIS (6.5)
  │    ├─ onnistui + ilmoituksia        → VALMIS + ilmoituslaatikot (6.8)
  │    ├─ newer-version                 → LUKITTU (6.8, ei muokattavissa)
  │    └─ lukeminen epäonnistui         → EI SAATAVILLA (6.8)
  │
  ├─ Käyttäjä painaa [+] kortin rivillä      → määrä 0 → 1 (omistettu), yksi painallus
  │  Käyttäjä painaa [+] / [−] uudelleen     → määrä muuttuu 1 kerrallaan (0–999)
  │  [−] kun määrä on 1                      → määrä 0 = kortti poistuu kokoelmasta
  │        │
  │        ├─ tallennus onnistui    → ilmoitus ruudunlukijalle (6.9), yhteenveto päivittyy
  │        └─ tallennus epäonnistui → rivin määrä palaa viimeksi tallennettuun,
  │                                   virheilmoitus (6.8) + ilmoitus ruudunlukijalle
  │
  ├─ Käyttäjä valitsee "Vain omistetut"      → lista rajautuu (JA muiden suodattimien kanssa, 6.6)
  ├─ Käyttäjä painaa "Pyydä pysyvää tallennusta" → selaimen lupapyyntö (6.7)
  └─ Muutos toisessa välilehdessä            → määrät päivittyvät itsestään (6.9)
```

- Kokoelmaa ei näytetä, kun lista on LATAUS-, VIRHE- tai TYHJÄ-tilassa (ei kortteja, joihin merkitä). Pysyvän tallennuksen pyyntö (`requestPersistentStorage`) käynnistyy **vain painikkeesta**, ei koskaan sivun latautuessa (SR-13).

### 6.3 Sivun rakenne

DOM-järjestys `main`:ssa (uudet osat merkitty UUSI):

```html
<main>
  <h1 tabindex="-1">Kortit</h1>
  <p id="card-status">…</p>                                  <!-- 5.6 -->
  <p id="collection-summary" class="status-line">…</p>        <!-- UUSI: yhteenveto, 6.5 -->
  <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">…</div>  <!-- sama alue kuin 4.3 -->
  <!-- OSITTAINEN-varoituslaatikko (4.5) -->
  <!-- UUSI: kokoelman ilmoituslaatikot (6.8): newer-version, reset, repaired, persistent:false, tallennusvirhe -->
  <!-- UUSI: selainmuistutus ja pysyvän tallennuksen painike (6.7) -->
  <form role="search" aria-label="Hae ja suodata kortteja">
    <!-- Hae nimellä (5.4) -->
    <!-- UUSI: valintaruutu "Vain omistetut" (6.6) -->
    <!-- Tyyppi, Väri (5.4) -->
  </form>
  <!-- taulukko (6.4) tai EI TULOKSIA -tila (6.6) -->
</main>
```

- Otsikot: ei uusia tasoja. Kokoelman ilmoituslaatikoiden otsikko on `h2` kuten muissakin ilmoituslaatikoissa (3.4). Selainmuistutus ja yhteenveto ovat kappaleita.
- Maamerkit ja `<title>` ennallaan. Samaa `role="status"`-aluetta käytetään kaikkiin ilmoituksiin. Toista live-aluetta ei lisätä eikä `assertive` ole sallittu (5.6).

### 6.4 Korttirivin määräkontrolli

#### 6.4.1 Taulukon rakenne

Taulukkoon tulee **neljäs sarake `Omistan`** (`th scope="col"`, `col-fit`, tasattu oikealle). Muut sarakkeet, niiden sisältö ja tekstit pysyvät ennallaan (4.4, 5.5).

```html
<th scope="col" class="col-fit col-control">Omistan</th>
…
<td class="col-fit col-control">
  <div class="count-control">
    <button type="button" class="step step-minus">   <!-- renderöidään vain, kun määrä ≥ 1 -->
      <span class="visually-hidden">Vähennä yksi kappale: <span lang="en">V</span>, <span lang="en">Streetkid</span></span>
      <span aria-hidden="true">−</span>              <!-- U+2212 -->
    </button>
    <span class="count">                             <!-- renderöidään vain, kun määrä ≥ 1 -->
      <span class="visually-hidden">Kokoelmassa </span>2<span class="visually-hidden"> kappaletta</span>
    </span>
    <span class="visually-hidden">Ei kokoelmassa</span>   <!-- vain kun määrä 0 -->
    <button type="button" class="step step-plus">
      <span class="visually-hidden">Lisää yksi kappale: <span lang="en">V</span>, <span lang="en">Streetkid</span></span>
      <span aria-hidden="true">+</span>
    </button>
  </div>
</td>
```

Ruudunlukija lukee rivin: "V, Streetkid · Legend, Punainen · 5 · Vähennä yksi kappale: V, Streetkid, painike · Kokoelmassa 2 kappaletta · Lisää yksi kappale: V, Streetkid, painike". Määrällä 0: "Ei kokoelmassa · Lisää yksi kappale: V, Streetkid, painike".

#### 6.4.2 Käyttäytyminen

| Tila | Näkyvä | Kontrolli |
|---|---|---|
| Määrä 0 | vain `[ + ]` | Yksi painallus → määrä 1 (kortti omistetuksi). |
| Määrä 1–998 | `[ − ]  n  [ + ]` | `+` lisää 1, `−` vähentää 1. |
| Määrä 1 ja `−` | | Määrä 0: kortti poistuu kokoelmasta. Ei vahvistuskyselyä (yhden kappaleen merkintä palautuu yhdellä `+`-painalluksella, ja kysely hidastaisi). |
| Määrä 999 | `[ − ]  999  [ + ]` | `+` on `aria-disabled="true"` (ei `disabled`, jotta fokus ei katoa) ja himmennetty. Painallus ei tee mitään, ja live-alue ilmoittaa `Enimmäismäärä 999 on täynnä: {nimi}.` |

- **Sijainti ei hyppää.** Kontrolli on tasattu oikealle, ja `+` on aina oikeanpuoleisin. Kun `−` ja määrä ilmestyvät `+`:n vasemmalle puolelle, `+` pysyy paikallaan ja on sama DOM-elementti (vakaa React-avain). Peräkkäiset painallukset osuvat samaan kohtaan, ja fokus säilyy.
- **Fokus, kun `−` katoaa.** Jos `−` poistuu DOM:ista (määrä 1 → 0), fokus siirretään saman rivin `+`-painikkeeseen ennen poistamista.
- **Määrä vain painikkeilla.** Suoraa numerosyöttöä, pitkää painallusta tai kiihtyvää toistoa ei tässä tehtävässä (IDEAS.md). Enter pohjassa selaimen oma toisto on sallittu.
- **Nopeat peräkkäiset painallukset.** Näytöllä oleva määrä päivittyy heti jokaisella painalluksella (tavoitemäärä). Tallennukset suoritetaan **yksi kerrallaan**: kun edellinen `setCount` on kesken, uusin tavoitemäärä odottaa ja tallennetaan heti sen jälkeen (välissä olevia arvoja ei tarvitse tallentaa). Vanhempi vastaus ei saa ylikirjoittaa uudempaa tavoitemäärää näytöllä.
- **Epäonnistunut tallennus.** Rivin määrä palaa viimeksi **onnistuneesti tallennettuun** arvoon (tallennettu `Collection` tulee edellisestä `setCount`-vastauksesta tai `load()`:sta), mikä täyttää ehdon "näytöllä ei ole määrää, jota ei tallennettu". Odottavat tavoitemäärät hylätään. Virheilmoitus: 6.8.
- **Yhteenveto ja määrät luetaan tallennetusta `Collection`:ista**, ei lasketa erikseen.
- **Tuntemattomat avaimet** (kokoelmassa on avain, jota korttiluettelossa ei ole, esim. nimen errata): niitä **ei näytetä, ei lasketa yhteenvetoon eikä poisteta**. Katso A3.

#### 6.4.3 Visuaalinen määrittely

Uusi komponentti **määräpainike** (`.step`), käyttää vain olemassa olevia tokeneita:

- Koko vähintään `--target-min` × `--target-min` (44 × 44 px), `border-radius: var(--radius)`, fonttikoko `--font-size-lg`, `line-height: 1`. Painikkeiden väli `--space-2`.
- `+`: tausta `--color-accent`, teksti `--color-on-accent` (kuten ensisijainen painike, 3.4).
- `−`: tausta `--color-bg`, teksti `--color-text`, reuna 1 px `--color-border-strong`.
- Hover: `+`: 2 px:n sisäreuna `--color-on-accent`. `−`: tausta `--color-surface`. Kursori `pointer`. (Alleviivaus ei toimi symbolissa.)
- Fokus: `:focus-visible { outline: var(--focus-ring); }`. Ei `overflow: hidden` vanhemmissa, jotta rengas ei leikkaudu.
- Määrä (`.count`): `--font-weight-bold`, `font-variant-numeric: tabular-nums`, `min-width: 2.5ch`, keskitetty.
- Himmennetty `+` (999): `opacity: 0.5` ja katkoviivareuna, jotta tila ei välity pelkällä himmennyksellä.
- Ei animaatioita eikä siirtymiä. Jos Koodari lisää, ne poistetaan `prefers-reduced-motion: reduce` -tilassa.

Uusi **toissijainen painike** (`.button-secondary`, käytössä 6.7 ja 6.8): vähimmäiskoko `--target-min`, tausta `--color-bg`, teksti `--color-text`, reuna 1 px `--color-border-strong`, lihavoitu, `--radius`, sisäväli `--space-2` `--space-4`, hover alleviivaus, fokus `--focus-ring`.

#### 6.4.4 Rautalanka, 320 px

Neljä saraketta ja kaksi 44 px:n painiketta eivät mahdu 288 px:iin. Siksi alle 40 rem:n leveydellä taulukon rivi esitetään **korttimaisena ruudukkona**. Taulukon semantiikka säilytetään: `table`, `thead`, `tbody`, `tr`, `th` ja `td` saavat **eksplisiittiset ARIA-roolit** (`table`, `rowgroup`, `row`, `columnheader`, `rowheader`, `cell`), koska `display: grid` poistaa natiivin taulukkosemantiikan Chromessa ja Safarissa. `thead` piilotetaan `.visually-hidden`-tyylillä (ei `display: none`), jotta sarakeotsikot säilyvät ruudunlukijalle.

```
┌────────────────────────────────┐
│ Kortit                         │ h1
│ 151 korttia                    │ tilarivi
│ Kokoelmassa 3 eri korttia,     │ yhteenveto (sm, muted)
│ yhteensä 5 kappaletta.         │
│                                │
│ Kokoelma tallentuu vain tähän  │ selainmuistutus (sm, muted)
│ selaimeen tällä laitteella. …  │
│ [ Pyydä pysyvää tallennusta ]  │ toissijainen painike
│                                │
│ Hae nimellä …                  │ (5.4)
│ [☐ Vain omistetut]             │ UUSI, 44 px
│ Tyyppi / Väri …                │ (5.4)
│                                │ --space-6
│ ┌────────────────────────────┐ │
│ │ V                [−]  2 [+]│ │ nimi (rivittyy) | kontrolli, keskitetty pystysuunnassa
│ │ Streetkid                  │ │ subname
│ │ Legend · ■ Punainen · Hinta 5││ tyyppi + väri, hinta
│ ├────────────────────────────┤ │
│ │ Swordwise Huscle       [+] │ │ määrä 0: vain [+]
│ │ Unit · ■ Sininen · Hinta 3 │ │
│ ├────────────────────────────┤ │
│ │ Viktor Vektor    [−]  1 [+]│ │
│ │ You Might Feel a Little    │ │ pitkä alaotsikko rivittyy
│ │ Pinch                      │ │
│ │ Program · ■ Keltainen · Hinta – │ hinta puuttuu: "–" kuten 4.4
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

- Ruudukko `< 40rem`: `grid-template-columns: auto auto 1fr auto; grid-template-areas: "name name name control" "type cost . control"`. Kontrollin leveys on vakio `calc(3 * var(--target-min) + 2 * var(--space-2))` (132 px), jotta nimen leveys ei vaihtele rivien välillä. Kontrolli on pystysuunnassa keskitetty.
- Hinta-solun eteen tulee **näkyvä** teksti `Hinta ` (CSS `::before`, koska otsikkorivi on piilotettu). Ruudunlukija voi lukea sen sarakeotsikon lisäksi, mikä on hyväksytty.
- Tyyppi ja väri -solun sisältö ja tekstit ennallaan (5.5). Tyypin, värin ja hinnan välinen erotin `·` on koriste (`aria-hidden`).
- Rivien erotus 1 px `--color-border`, rivin pystysisäväli `--space-2`.
- 320 px:ssä nimelle jää noin 144 px. Nimi rivittyy (`overflow-wrap: anywhere`, kuten 4.4). Ei vaakavieritystä 400 % zoomilla eikä pisimmällä nimellä.

#### 6.4.5 Rautalanka, ≥ 640 px (40 rem)

```
┌──────────────────────────────────────────────────────────────┐
│ Kortit                                                       │
│ 151 korttia                                                  │
│ Kokoelmassa 3 eri korttia, yhteensä 5 kappaletta.            │
│ Kokoelma tallentuu vain tähän selaimeen tällä laitteella.    │
│ Se ei siirry toiselle laitteelle eikä toiseen selaimeen.     │
│ [ Pyydä pysyvää tallennusta ]                                │
│ …lomake (Hae nimellä, Vain omistetut, Tyyppi, Väri)…         │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Nimi        Tyyppi ja väri   Hinta      Omistan        │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ V           Legend              5     [−]  2  [+]      │   │
│ │ Streetkid   ■ Punainen                                 │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ Swordwise…  Unit                3            [+]       │   │
│ │             ■ Sininen                                  │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- Sama taulukko kuin 4.4 ja 5.5 plus sarake `Omistan` (`col-fit`, oikealle tasattu). Solujen sisäväli kuten 4.4. Eksplisiittiset roolit saa jättää päälle myös tällä leveydellä.

### 6.5 Kokoelman yhteenveto

`<p id="collection-summary" class="status-line">` tilarivin alla (`--font-size-sm`, `--color-text-muted`). Se kertoo **koko kokoelman**, ei suodatuksen tulosta, ja päivittyy heti jokaisella tallennetulla muutoksella. Se ei ole live-alueessa: määrän muutos ilmoitetaan 6.9:n mukaan.

| Tilanne | Teksti |
|---|---|
| Kokoelma luetaan | `Haetaan kokoelmaa…` |
| Tyhjä kokoelma | `Kokoelmassa ei ole vielä kortteja.` |
| 1 eri kortti, 1 kappale | `Kokoelmassa 1 eri kortti, yhteensä 1 kappale.` |
| 3 eri korttia, 5 kappaletta | `Kokoelmassa 3 eri korttia, yhteensä 5 kappaletta.` |
| 1 eri kortti, 12 kappaletta | `Kokoelmassa 1 eri kortti, yhteensä 12 kappaletta.` |
| Kappaleita yli 999 | `Intl.NumberFormat('fi-FI')`, esim. `yhteensä 1 024 kappaletta` |
| LUKITTU tai EI SAATAVILLA (6.8) | kappale ei renderöidy |

"Eri korttia" = ladatun korttiluettelon korttien määrä, joilla kokoelmassa on määrä ≥ 1. "Kappaletta" = niiden määrien summa. Sanat taipuvat: yksikkö vain luvulle 1.

### 6.6 "Vain omistetut" -suodatin

Uusi valintaruutu T-010:n lomakkeeseen (`form role="search"`), **hakukentän jälkeen ja ennen ryhmäohjetta** `Valitse yksi tai useampi…`. Oma `.field`-kääre, ei `<fieldset>`:ia, koska se ei kuulu Tyyppi- eikä Väri-ryhmään.

```
Hae nimellä                         (5.4)
Kortin nimi tai alaotsikko. …
[ silver                        ✕ ]
[☐ Vain omistetut]                  UUSI
Valitse yksi tai useampi. …         (5.4, koskee vain Tyyppi ja Väri)
Tyyppi …
Väri …
```

- Label `Vain omistetut`. Natiivi `<input type="checkbox">`, 3.4:n mukainen (koko label vähintään 44 px korkea).
- Logiikka: JA-ehto muiden kanssa. Kortti näkyy, kun sen määrä on ≥ 1 **ja** haku, tyyppi ja väri täyttyvät. Suodatin ei tallennu eikä säily sivun uudelleenlatauksessa, mutta säilyy `Yritä uudelleen` -painalluksen yli kuten muut (5.8).
- Se on aktiivinen suodatin (`isFilterActive`): caption `Hakua vastaavat kortit`, tilarivi `{n} / {kaikki} korttia`, live-alue 5.6:n mukaan (750 ms, toistokielto).
- Valintaruutu **ei renderöidy**, jos kokoelma ei ole valmis (luetaan, LUKITTU, EI SAATAVILLA). Jos suodatin on päällä ja kokoelma muuttuu LUKITUKSI, suodatin nollataan.
- **Rivi ei katoa käsistä.** Kun "Vain omistetut" on päällä ja käyttäjä painaa `−` määrään 0, rivi **jää näkyviin** (määrä 0, vain `+`), kunnes hakuehdot (haku, tyyppi, väri tai "Vain omistetut") muuttuvat. Fokus ei katoa, ja painalluksen voi perua `+`:lla (WCAG 3.2.2, 2.4.3). Tilarivin `{n}` = näkyvien rivien määrä. Yhteenveto lasketaan todellisesta kokoelmasta.

**EI TULOKSIA, kun "Vain omistetut" on päällä:**

| Tilanne | Teksti | Painike |
|---|---|---|
| Koko kokoelma on tyhjä eikä muita suodattimia tai hakua ole | `Kokoelmassa ei ole vielä kortteja. Poista "Vain omistetut" -valinta ja merkitse omistamasi kortit listasta.` | `Näytä kaikki kortit` |
| Muuten ei osumia | `Hakua vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista.` (5.6, ennallaan) | `Tyhjennä haku ja suodattimet` (tyhjentää myös "Vain omistetut") |

- `Näytä kaikki kortit` poistaa vain "Vain omistetut" -valinnan ja siirtää fokuksen sen valintaruutuun. Live-alue ilmoittaa heti `Näytetään kaikki {kaikki} korttia.` (5.6). Tyhjä tila kuten 5.6: ei ilmoituslaatikkoa eikä `h2`:ta.
- Live-alueen EI TULOKSIA -teksti ennallaan: `Hakua vastaavia kortteja ei löytynyt.`

### 6.7 Selainmuistutus ja pysyvä tallennus

Näytetään, kun kokoelma on valmis (6.5) ja `repositories.persistent` on `true`. Jos `persistent` on `false`, näytetään vain varoitus (6.8): pysyvä tallennus ei auttaisi.

```
Kokoelma tallentuu vain tähän selaimeen tällä laitteella. Se ei siirry
toiselle laitteelle eikä toiseen selaimeen.
[ Pyydä pysyvää tallennusta ]
Pysyvä tallennus pyytää selainta säilyttämään kokoelman, vaikka laitteen
tallennustila vähenee. Selaimen tietojen tyhjennys poistaa kokoelman silti.
```

- Kappale (aina näkyvissä, `--font-size-sm`, `--color-text-muted`, ei suljettavissa): `Kokoelma tallentuu vain tähän selaimeen tällä laitteella. Se ei siirry toiselle laitteelle eikä toiseen selaimeen.`
- Painike (`.button-secondary`, `<button type="button">`): `Pyydä pysyvää tallennusta`.
- Ohje painikkeen alla (liitetty `aria-describedby`:llä, sm, muted): `Pysyvä tallennus pyytää selainta säilyttämään kokoelman, vaikka laitteen tallennustila vähenee. Selaimen tietojen tyhjennys poistaa kokoelman silti.`
- Pyyntö käynnistyy vain painikkeen painalluksesta (SR-13). Pyynnön ajan painike on `aria-disabled="true"` ja `aria-busy="true"` (selain voi näyttää lupakyselyn, eikä kaksoispainallus saa käynnistää toista pyyntöä). Teksti ei muutu.
- **Tulos** korvaa painikkeen ja ohjeen kappaleella, joka saa fokuksen (`tabindex="-1"`, jotta fokus ei katoa), ja sama teksti ilmoitetaan heti live-alueella:

| Tulos | Kappale ja live-teksti |
|---|---|
| `true` | `Selain lupasi säilyttää kokoelmasi. Selaimen tietojen tyhjennys poistaa sen silti.` |
| `false` (kielto tai ei tuettu) | `Selain ei antanut lupaa pysyvään tallennukseen. Kokoelma tallentuu silti, mutta selain voi poistaa sen, jos laitteen tila loppuu. Älä tyhjennä selaimen tietoja.` |

- Tulos pysyy näkyvissä, kunnes sivu ladataan uudelleen. Vaihtoehto A2: jos vain-luku-tarkistus `navigator.storage.persisted()` palauttaa `true`, painiketta ei näytetä vaan pelkkä kappale `Selain on luvannut säilyttää kokoelmasi. Selaimen tietojen tyhjennys poistaa sen silti.`

### 6.8 Ilmoitukset ja virheet (tilat)

Ilmoituslaatikko = 3.4:n malli: `h2` + kappale + tarvittaessa painike. Tekstit eivät sisällä avaimia, versionumeroita, varmuuskopion nimeä (SEC-007) eikä virheolion viestiä. Tekniset tiedot menevät vain konsoliin.

#### Latauksen tilat

| Tila | Näkyvä | Käyttäytyminen |
|---|---|---|
| **LATAUS (kokoelma)** | Yhteenvetorivi `Haetaan kokoelmaa…`. Kontrollialue varataan (132 px), mutta painikkeita ei ole. Kontrollisolussa piilotettu teksti `ladataan`. | "Vain omistetut" ei renderöidy. Ei live-ilmoitusta (lataus on nopea ja paikallinen). |
| **TYHJÄ kokoelma** | `Kokoelmassa ei ole vielä kortteja.` Kaikilla riveillä vain `[+]`. | Ei ilmoituslaatikkoa, ei virhe. |
| **OSITTAINEN data** | OSITTAINEN-varoitus (4.5) näkyy normaalisti, ja kokoelmakontrollit toimivat näkyville korteille. Yhteenveto laskee vain näkyvät kortit. | Ei erillistä tekstiä. |
| **EI SAATAVILLA** (`collection.load()` hylkää) | Danger-laatikko, katso alla. Kontrollisarake ja "Vain omistetut" eivät renderöidy, korttilista toimii ilman niitä. | `Lue kokoelma uudelleen` kutsuu `load()`:ia uudelleen, ja fokus siirretään `h1`:een. |

**EI SAATAVILLA:** `h2` `Kokoelmaa ei voitu lukea` · kappale `Selain ei antanut lukea tallennettuja tietoja. Korttilista toimii, mutta omistettuja kortteja ei voi nyt merkitä. Voit yrittää uudelleen tai tarkistaa selaimen yksityisyysasetukset.` · painike `Lue kokoelma uudelleen` · live `Kokoelmaa ei voitu lukea.`

#### Latauksen ilmoitukset (`load().notices`)

Useampi ilmoitus samaan aikaan: allekkain järjestyksessä newer-version, reset, repaired, persistent:false. `migrated`-ilmoitusta ei näytetä käyttäjälle.

| Lähde | Tyyli | `h2` | Kappale | `Sulje` | Live |
|---|---|---|---|---|---|
| `persistent: false` | warning | `Tietoja ei voi tallentaa` | `Selain ei salli tietojen tallentamista tälle sivustolle. Voit merkitä kortteja, mutta merkinnät häviävät, kun suljet tai päivität sivun. Tarkista selaimen yksityisyysasetukset tai avaa sivu tavallisessa selausikkunassa.` | ei | `Tietoja ei voi tallentaa.` |
| `reset`, `backupKey` on merkkijono | warning | `Vanhat kokoelmatiedot eivät olleet luettavissa` | `Tallennetut kokoelmatiedot olivat vioittuneet, joten kokoelma aloitettiin tyhjänä. Vanhoista tiedoista on otettu kopio selaimeen, mutta sovellus ei vielä osaa palauttaa sitä.` | kyllä | `Vanhat kokoelmatiedot eivät olleet luettavissa.` |
| `reset`, `backupKey: null` (SEC-007) | danger | `Vanhoja kokoelmatietoja ei voitu käsitellä` | `Tallennetut kokoelmatiedot olivat vioittuneet, eikä niistä saatu kopiota. Vanhoja tietoja ei ole poistettu, joten uusia merkintöjä ei voi tallentaa, ennen kuin selain sallii tallennuksen. Vapauta selaimen tallennustilaa ja päivitä sivu.` | ei | `Vanhoja kokoelmatietoja ei voitu käsitellä.` |
| `repaired`, `dropped` = 1 | warning | `Osa kokoelman tiedoista oli vioittunut` | `Yhtä merkintää ei voitu lukea, ja se jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.` | kyllä | `Osa kokoelman tiedoista oli vioittunut.` |
| `repaired`, `dropped` = n > 1 | warning | sama | `{n} merkintää ei voitu lukea, ja ne jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.` | kyllä | sama |
| `newer-version` | warning | `Kokoelma on tallennettu uudemmalla versiolla` | `Selaimeen tallennetut tiedot ovat peräisin sovelluksen uudemmasta versiosta. Kokoelmaa ei näytetä eikä sitä voi muokata, jotta tiedot eivät vioitu. Päivitä sivu. Jos tämä ei auta, tyhjennä selaimen välimuisti ja yritä uudelleen.` | ei | `Kokoelma on tallennettu uudemmalla versiolla.` |

- **LUKITTU (newer-version):** kokoelma näytetään tyhjänä, ja kirjoitus on estetty. Kontrollisarakkeessa **ei ole painikkeita**: solussa `<span aria-hidden="true">–</span><span class="visually-hidden">ei muokattavissa</span>`. Yhteenveto ja "Vain omistetut" eivät renderöidy. Sama tila syntyy, jos `setCount` heittää `StorageError('newer-version')` (toinen välilehti on päivittänyt tiedot uudempaan versioon): rivin määrä palaa viimeksi tallennettuun ja näkymä siirtyy LUKITTU-tilaan.
- `backupKey: null` -tilassa painikkeet pysyvät käytössä, ja tallennus epäonnistuu tallennusvirheenä (alla). Katso A4.
- **`Sulje`** (`.button-secondary`): saavutettava nimi `Sulje ilmoitus: {h2-teksti}`. Sulkeminen poistaa laatikon ja siirtää fokuksen `h1`:een (4.6). Suljettu ilmoitus ei palaa ennen seuraavaa sivun latausta.
- **Live-ilmoitukset latauksessa:** ensin normaali latausviesti (`151 korttia ladattu.`). **1,5 s sen jälkeen** ilmoitetaan kaikkien yhtä aikaa näkyvien warning- ja danger-ilmoitusten live-tekstit yhdessä viestissä välilyönnillä erotettuna, jotta ensimmäinen ei ylikirjoita jälkimmäistä.

#### Tallennusvirheet muutoksen yhteydessä (`StorageError`)

Danger-laatikko (`h2` + kappale + `Sulje`) ennen lomaketta, **ilman toimintopainiketta** (käyttäjä yrittää uudelleen painamalla `+` tai `−`). Laatikko poistuu, kun seuraava tallennus onnistuu tai käyttäjä sulkee sen. Rivin määrä palaa viimeksi tallennettuun (6.4.2). Live-alue ilmoittaa heti `h2`-tekstin ja `Kortin määrä ei muuttunut.`

| `kind` | `h2` | Kappale |
|---|---|---|
| `quota` | `Muutosta ei voitu tallentaa` | `Selaimen tallennustila on täynnä, joten kortin määrä ei muuttunut. Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta ja yritä uudelleen.` |
| `unavailable` | `Muutosta ei voitu tallentaa` | `Selain esti tallennuksen, joten kortin määrä ei muuttunut. Yritä uudelleen. Jos ongelma jatkuu, tarkista selaimen yksityisyysasetukset.` |
| `newer-version` | LUKITTU-tila (yllä) | (yllä) |
| `limit-reached` | `Kokoelma on täynnä` | `Kokoelmaan mahtuu enintään 5 000 eri korttia, joten uutta korttia ei voi lisätä. Voit poistaa kortteja, joita et enää tarvitse.` (käytännössä tavoittamaton, koska korttiluettelossa on alle 200 korttia) |
| muu (`invalid-input`, `not-found`, tuntematon) | `Muutosta ei voitu tallentaa` | `Jokin meni pieleen, ja kortin määrä ei muuttunut. Yritä uudelleen.` |

- Peräkkäiset virheet eivät kasaa laatikoita: yksi laatikko, teksti päivittyy. Live-ilmoitus annetaan vain, kun virhelaji muuttuu tai laatikko on ollut poissa.
- `Sulje`-nimi: `Sulje ilmoitus: Muutosta ei voitu tallentaa`. Fokus `h1`:een.

### 6.9 Ruudunlukijailmoitukset

Käytetään olemassa olevaa `role="status"`-aluetta (4.3). **Tallentamattomasta määrästä ei ilmoiteta.**

| Tapahtuma | Viive | Teksti |
|---|---|---|
| Määrä `0 → n` | 500 ms viimeisen **tallennetun** muutoksen jälkeen | `{nimi} lisätty kokoelmaan: {n} kappaletta.` (n = 1: `1 kappale`) |
| Määrä `n → m`, `m ≥ 1` | 500 ms | `{nimi}: {m} kappaletta kokoelmassa.` (m = 1: `1 kappale`) |
| Määrä `n → 0` | 500 ms | `{nimi} poistettu kokoelmasta.` |
| `+` painettu, kun määrä on 999 | heti | `Enimmäismäärä 999 on täynnä: {nimi}.` |
| Tallennus epäonnistui | heti | 6.8:n teksti |
| Muutos toisessa välilehdessä (`subscribe`) | 750 ms (5.6) | `Kokoelma päivittyi toisessa välilehdessä.` |

- `{nimi}` = `{name}` tai `{name}, {subname}` kuten rivin nimi (esim. `V, Streetkid`).
- **Hillintä nopeissa painalluksissa.** Yksi ajastin koko näkymälle. Ajastin käynnistyy vasta, kun mikään tallennus ei ole kesken, ja jokainen uusi onnistunut tallennus nollaa sen. Viesti kuvaa **alkutilasta lopputilaan** (jos käyttäjä painaa `+` viisi kertaa nopeasti, ruudunlukija kuulee yhden viestin: `{nimi} lisätty kokoelmaan: 5 kappaletta.`). Jos painallukset kohdistuvat eri riveihin, ilmoitetaan vain viimeksi muutettu kortti.
- Jos alku- ja lopputila ovat samat (`+` ja `−`), ilmoitusta ei anneta (toistokielto kuten 5.6).
- Kokoelman ilmoitus ja suodatuksen tulosilmoitus (5.6) jakavat saman viivästetyn tekstin: myöhempi korvaa aiemman.
- Taulukon, yhteenvedon ja tilarivin visuaalinen päivitys tapahtuu heti. Vain live-teksti viivästyy.
- Toisen välilehden muutos (`subscribe`) päivittää rivit hiljaa **vasta, kun omat käynnissä olevat tallennukset ovat valmistuneet**. Fokus pysyy paikallaan. Jos fokusoitu `−` katoaa päivityksessä, fokus siirtyy saman rivin `+`:aan.

### 6.10 Fokus ja näppäimistö

DOM-järjestys ONNISTUMINEN-tilassa (laajentaa 5.7:ää):

1. (OSITTAINEN: `Yritä uudelleen`)
2. Kokoelman ilmoituslaatikoiden painikkeet (`Sulje`, `Lue kokoelma uudelleen`)
3. `Pyydä pysyvää tallennusta`
4. Hakukenttä → **`Vain omistetut`** → Tyyppi-ruudut → Väri-ruudut
5. EI TULOKSIA: `Tyhjennä haku ja suodattimet` tai `Näytä kaikki kortit`
6. Taulukossa riveittäin: `−` (jos määrä ≥ 1) → `+`
7. Alatunnisteen linkit

- Kaikki painikkeet toimivat Enterillä ja välilyönnillä (natiivit `<button>`).
- **Fokus ei siirry itsestään** määrän muutoksen, suodatuksen tai tallennusvirheen vuoksi. Ainoat ohjelmalliset fokussiirrot: (a) `−` katoaa → saman rivin `+`, (b) `Sulje` ja `Lue kokoelma uudelleen` → `h1`, (c) pysyvän tallennuksen tulos → tulos-kappale (`tabindex="-1"`), (d) `Näytä kaikki kortit` → "Vain omistetut" -valintaruutu, (e) `Tyhjennä haku ja suodattimet` → hakukenttä (5.7).
- Sarkainpysähdyksiä on enintään kaksi per rivi (noin 300 koko listalla). Ohituskeinoa ei tässä tehtävässä (IDEAS.md). "Vain omistetut" lyhentää listan tarvittaessa.
- Sticky-elementtejä ei ole, joten mikään ei peitä fokusta (2.4.11).

### 6.11 Responsiivisuus ja zoom

| Leveys | Muutokset |
|---|---|
| 320–639 px | Korttimainen rivi (6.4.4). Kontrolli rivin oikeassa reunassa, 132 px leveä. Nimi rivittyy. Hinta-solun eteen `Hinta `. |
| ≥ 640 px | Neljä saraketta (6.4.5). Sisältö enintään 48 rem. |

- Ei vaakavieritystä 320 px:ssä eikä 400 % zoomilla (1280 px:n ikkunassa) pisimmällä nimellä ja värillä `Keltainen`.
- 200 % tekstin suurennus ja WCAG 1.4.12 -välistys: rivit kasvavat sisällön mukaan (ei kiinteitä korkeuksia), painikkeet pysyvät vähintään 44 × 44 px. WCAG 2.5.8 vaatii vain 24 px.
- Pysty- ja vaakasuunta toimivat samalla asettelulla.

### 6.12 Tilat yhteenvetona

| Tila | Yhteenvetorivi | Kontrollit | Muuta |
|---|---|---|---|
| Lista LATAUS / VIRHE / TYHJÄ | ei | ei | ei kokoelmaa eikä lupapyyntöä |
| Kokoelma luetaan | `Haetaan kokoelmaa…` | ei (tila varattu) | – |
| Kokoelma tyhjä | `Kokoelmassa ei ole vielä kortteja.` | `[+]` | selainmuistutus + painike |
| Kokoelmassa kortteja | `Kokoelmassa 3 eri korttia, yhteensä 5 kappaletta.` | `[−] n [+]` | selainmuistutus + painike |
| OSITTAINEN lista | vain näkyvät kortit | toimii | OSITTAINEN-varoitus (4.5) |
| `persistent: false` | normaali (muistissa) | toimii | warning-laatikko, ei pysyvän tallennuksen painiketta |
| `reset` / `repaired` | normaali | toimii | ilmoituslaatikko + `Sulje` |
| `reset`, `backupKey: null` | normaali (tyhjä) | toimii, tallennus epäonnistuu | danger-laatikko |
| `newer-version` (LUKITTU) | ei | ei painikkeita, `–` | warning-laatikko |
| Lukeminen epäonnistui | ei | ei saraketta | danger-laatikko + `Lue kokoelma uudelleen` |
| Tallennus epäonnistui | normaali | määrä palautuu | danger-laatikko, ei toimintopainiketta |
| "Vain omistetut", tyhjä kokoelma | – | – | tyhjä tila + `Näytä kaikki kortit` |
| "Vain omistetut" ja `−` nollaan | – | – | rivi jää, kunnes hakuehdot muuttuvat |

### 6.13 Saavutettavuusvaatimukset (tarkistuslista Koodarille)

- [ ] Uusi sarake `Omistan` (`th scope="col"`). Rivin otsikko on edelleen kortin nimi (`th scope="row"`).
- [ ] Alle 40 rem:n korttiasettelu säilyttää taulukkosemantiikan eksplisiittisillä rooleilla (`table`, `rowgroup`, `row`, `columnheader`, `rowheader`, `cell`). `thead` on visuaalisesti piilotettu, ei `display: none`. Tarkista saavutettavuuspuusta.
- [ ] `+` ja `−` ovat `<button type="button">`, nimi `Lisää yksi kappale: {nimi}` / `Vähennä yksi kappale: {nimi}` (korttinimet `lang="en"`). Symboli `aria-hidden`.
- [ ] Määrä luetaan tekstinä (`Kokoelmassa 2 kappaletta`). Määrällä 0 piilotettu `Ei kokoelmassa`.
- [ ] Painikkeet vähintään 44 × 44 px, väli 8 px, fokusrengas `--focus-ring` ei leikkaudu.
- [ ] `+` pysyy samana DOM-elementtinä, kun `−` ilmestyy ja katoaa. Kun `−` katoaa, fokus siirtyy `+`:aan.
- [ ] Raja 999: `aria-disabled="true"` (ei `disabled`), ilmoitus `Enimmäismäärä 999 on täynnä: {nimi}.`
- [ ] Näytetty määrä on aina uusin tavoitemäärä. Tallennukset ovat peräkkäisiä, vanhempi vastaus ei ylikirjoita uudempaa, ja epäonnistuessa määrä palaa viimeksi tallennettuun. Testit (`createMemoryRepositories`): nopeat peräkkäiset painallukset, viiveellä vastaava `setCount`, `quota`, `unavailable`, `newer-version`.
- [ ] Määrän live-ilmoitus tulee **tallennuksen jälkeen**, 500 ms:n hillinnällä, kuvaa alku- ja lopputilan eikä toista samaa. Sama `role="status"`-alue, ei `assertive`.
- [ ] `#collection-summary` on tavallinen kappale (ei live-alueessa), taivutus oikein (`1 kortti`, `1 kappale`, `0`).
- [ ] `Vain omistetut`: natiivi valintaruutu `<label>`:in sisällä, vähintään 44 px korkea, `form role="search"`:n sisällä hakukentän jälkeen, ei `fieldset`:ia. Aktiivisena caption `Hakua vastaavat kortit`.
- [ ] Tyhjä kokoelma + "Vain omistetut": oma teksti ja `Näytä kaikki kortit` (fokus valintaruutuun). Muuten `Tyhjennä haku ja suodattimet` tyhjentää myös "Vain omistetut".
- [ ] "Vain omistetut" + `−` nollaan: rivi jää näkyviin, eikä fokus katoa.
- [ ] `requestPersistentStorage` kutsutaan **vain painikkeesta** (testi: ei kutsuta renderöinnissä eikä latauksessa). Painike `aria-busy` pyynnön ajan, tulos ilmoitetaan live-alueella ja tulos-kappale saa fokuksen.
- [ ] Jokaiselle `LoadNotice`-lajille (`persistent: false`, `reset` kummallakin `backupKey`-arvolla, `repaired` n = 1 ja n > 1, `newer-version`) on oma ilmoituslaatikko, `h2` ja teksti 6.8:n mukaan. Ei teknisiä tietoja, ei `backupKey`:n arvoa (SEC-007).
- [ ] `StorageError`-laji `quota`, `unavailable`, `limit-reached`, `newer-version` ja muu: teksti valitaan `kind`-kentästä, `message`- ja `cause`-kenttää ei näytetä.
- [ ] `Sulje` ja `Lue kokoelma uudelleen` siirtävät fokuksen `h1`:een. `Sulje`-nimi `Sulje ilmoitus: {otsikko}`.
- [ ] Kaikki värit tokeneista (3.1). Ei uusia tokeneita. Ei animaatioita, tai ne poistetaan `prefers-reduced-motion: reduce` -tilassa.
- [ ] Ei vaakavieritystä 320 px:ssä eikä 400 % zoomilla pisimmällä nimellä (`Viktor Vektor` / `You Might Feel a Little Pinch`).
- [ ] axe-core: 0 rikkomusta tiloissa kokoelma tyhjä, kokoelmassa kortteja, jokainen ilmoituslaatikko, EI SAATAVILLA, LUKITTU, "Vain omistetut" EI TULOKSIA, 320 px ja ≥ 640 px. Lisäksi manuaalisesti näppäimistöpolku, saavutettavuuspuu sekä 200 % ja 400 % zoom.

### 6.14 Sisällöntuottajalle

Uudet termit CONTENT.md:n sanastoon (UX:n ehdotukset): **kokoelma** (omat kortit), **omistaa / omistetut** (`Omistan`, `Vain omistetut`), **kappale** (yksi fyysinen kortti, ei "kopio" eikä "kpl" käyttöliittymätekstissä), **eri kortti** (kokoelman yksittäinen kortti määrästä riippumatta), **pysyvä tallennus** (pyyntö selaimelle säilyttää tiedot). Otsikko `Kortit` pysyy ennallaan.

Tarkistettavat tekstit: kaikki 6.5–6.9. Erityisesti ilmoituslaatikoiden ytimekkyys ja se, ettei teksti lupaa liikaa (`backupKey: null`: "Vanhoja tietoja ei ole poistettu").

### 6.15 Avoimet kysymykset (PM ratkaisee, oletus valittu)

- **A1 · Korttimainen rivi alle 40 rem:ssä.** Oletus: kyllä (6.4.4), koska neljä saraketta ja kaksi 44 px:n painiketta eivät mahdu 288 px:iin. Vaihtoehdot: Hinta-sarakkeen piilotus kapeassa näkymässä (poistaa tietoa) tai vaakavieritys (rikkoo reflow-vaatimuksen). T-018 voi myöhemmin korvata ratkaisun.
- **A2 · `navigator.storage.persisted()`.** Oletus: Koodari saa kutsua sitä vain-luku-tarkistuksena ja piilottaa painikkeen, jos tallennus on jo pysyvä. Jos Arkkitehti haluaa kaiken tallennuksen tallennuskerroksen taakse, oletus on näyttää painike, kunnes käyttäjä on painanut sitä (SR-13 koskee pyyntöä, ei tarkistusta).
- **A3 · Tuntemattomat avaimet.** Oletus (kortin ehdotus): ei näytetä, ei lasketa yhteenvetoon, ei poisteta. Seuraus: yhteenveto voi olla pienempi kuin tallennettu kokoelma. Kirjataan T-014:n tai T-015:n yhteyteen.
- **A4 · `reset` ja `backupKey: null` (SEC-007).** Oletus: painikkeet pysyvät käytössä, ja tallennus epäonnistuu tallennusvirheenä, koska tallennuskerros estää kirjoituksen, kunnes varmuuskopio onnistuu. Vaihtoehto: kontrollit lukitaan kuten `newer-version`. Digiturvan tai Koodarin on vahvistettava, mikä `StorageError`-laji tässä tilanteessa heitetään (`unavailable` vai `quota`), koska virheteksti riippuu siitä.
- **A5 · Rivi jää näkyviin "Vain omistetut" -suodatuksessa, kun määrä nollataan (6.6).** Oletus: kyllä. Vaihtoehto: rivi poistuu heti ja fokus siirretään seuraavaan riviin. Oletus on turvallisempi (ei fokuksen katoamista eikä hyppäävää listaa).
- **A6 · Ilmoitusviiveet.** Oletus 500 ms tallennuksen jälkeen ja 750 ms suodatuksessa. Koodari voi säätää arvoja käytettävyystestin perusteella, mutta ilmoitus ei saa tulla ennen tallennuksen valmistumista.
- **A7 · Ilmoitusten sulkeminen.** Oletus: `reset` ja `repaired` ovat suljettavissa, muut eivät (ne kuvaavat jatkuvaa tilaa). Suljettu ei palaa ennen sivun uudelleenlatausta.
