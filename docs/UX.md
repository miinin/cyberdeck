# UX · cyberdeck

> Omistaja: UX Designer. Versio 0.9 · 2026-10-02 (T-025). Muutos 0.9: uusi luku 8 (teemavalitsin, D-012): tumma on oletus laitteen asetuksesta riippumatta, vaihtopainike otsikkopalkissa, välähdyksen esto ulkoisella skriptillä, tallennusrajapinnan lisäys. Luvun 3 johdanto ja luvun 7.3 teemapäätös merkitty päivitetyiksi. Alkuperäinen versio 0.2 (T-001, MVP-0). Muutos 0.2: katselmoinnin UX-001 tarkennukset lukuihin 4.3, 4.4 ja 4.9 (raportti `docs/reports/UX-001-t001-katselmointi.md`).
> Muutos 0.3 · 2026-10-01 (T-010, MVP-1): uusi luku 5 (haku ja suodatus), korttien väritokenit (3.1.1) sekä tekstikenttä ja valintaruutu (3.4). Luvun 4 kohtiin, joita luku 5 muuttaa, on lisätty viittaus.
> Muutos 0.4 · 2026-10-01 (T-010, katselmointi UX-002): K9 ratkaistu (latausviesti suodatettuna, 5.6), tyhjennyspainikkeen ilmoitus ja toistokielto (5.6), OSITTAINEN ilman kortteja (5.8). Raportti `docs/reports/UX-002-t010-katselmointi.md`.
> Muutos 0.5 · 2026-10-01 (T-012, MVP-1): uusi luku 6 (kokoelma): määräkontrolli korttirivillä, korttimainen rivi alle 40 rem:ssä, "Vain omistetut" -suodatin, kokoelman yhteenveto, selainmuistutus ja pysyvän tallennuksen pyyntö, tallennuskerroksen ilmoitukset ja virheet, ruudunlukijailmoitukset ja tarkistuslista. Uudet komponentit: määräpainike ja toissijainen painike (6.4.3).
> Muutos 0.6 · 2026-10-02 (T-021, D-010): periaate 7 päivitetty, luku 3 (tokenit ja komponentit) uusittu Cyberpunk 2077 -henkiseen ilmeeseen (vain tumma teema, Chakra Petch ja Share Tech Mono, viistetyt kulmat, keltainen ja syaani korostus) ja uusi luku 7 (tutkimus, päätökset, kontrastilaskelmat, liike, ohje Koodarille). Referenssi: `docs/design/t021-mallisivu.html`. Toiminta, rakenne ja tekstit lukuissa 4–6 eivät muutu. (Korvattu muutoksella 0.7: vaalea ja tumma teema, Rajdhani.)
> Muutos 0.7 · 2026-10-02 (T-021, D-011): suunta hyväksytty. Sovelluksessa on sekä vaalea että tumma Cyberpunk-teema (`prefers-color-scheme`), fontti on Rajdhani (500 ja 700, kokoja nostettu) ja Share Tech Mono säilyy luvuille ja tilariveille. Luvun 3 tokenit kahdelle teemalle, luvut 7.3, 7.4, 7.6 (kontrastit molemmille teemoille), 7.9 ja 7.10 päivitetty. Mallisivu näyttää molemmat teemat (teemapainikkeet ja rinnakkaisnäkymä).
> Muutos 0.8 · 2026-10-02 (T-021, katselmointi UX-004): Koodarin toteutuksessa lisäämät tokenit kirjattu lukuun 3 (3.1–3.3), 7.4/7.5-ristiriita kortin nimen koosta ratkaistu (1.25rem, `--font-size-card-name`), omistetun rivin kisko 4 px molemmissa asetteluissa (7.5), 7.9:n kohta 9 päivitetty (literaalit ovat nyt tokeneita) ja uusi 7.12 (katselmoinnin havainnot ja suositukset).
> Tämä oli alun perin minimitason design-järjestelmä, joka riittää MVP-0:aan. MVP-1 laajentaa sitä (lomakkeet, navigaatio, haku, kokoelman merkintä). Määrittely ei sido kehykseen: tokenit ovat CSS-muuttujia, ja rakenne kuvataan semanttisena HTML:nä.

---

## 1. Suunnitteluperiaatteet

1. **Tieto ensin.** Käyttäjä tulee katsomaan kortteja. Kortit näkyvät heti, ilman koristeita niiden edellä.
2. **Tila näkyy aina.** Käyttäjä tietää, haetaanko tietoja, onnistuiko haku ja kuinka monta korttia hän näkee.
3. **Virhe kertoo, mitä tehdä.** Jokaisessa virheessä on selitys selkokielellä ja keino jatkaa (yleensä "Yritä uudelleen"). Ei teknisiä tietoja, virhekoodeja eikä englanninkielisiä järjestelmäviestejä.
4. **Saavutettava oletuksena.** WCAG 2.2 AA koskee jokaista näkymää. Semanttinen HTML ensin, ARIA vain kun HTML ei riitä.
5. **Mobiili ensin.** Suunnitellaan 320 px:n leveydelle ja laajennetaan ylöspäin. Kaverit käyttävät sovellusta puhelimella pelipöydän ääressä.
6. **Johdonmukaisuus.** Sama asia näyttää ja toimii samalla tavalla kaikkialla. Kaikki värit, välit ja fonttikoot tulevat tokeneista, ei kovakoodattuna.
7. ~~**Ei kultausta.** Cyberpunk-henki näkyy korostusvärissä, ei animaatioissa tai efekteissä, jotka heikentävät luettavuutta.~~ → 2026-10-02 (D-010): **Käytettävyys ensin, Cyberpunk 2077 -henki toiseksi alusta loppuun.** Henki näkyy väreissä, muodoissa, typografiassa ja hillityssä liikkeessä koko palvelussa, mutta se ei saa heikentää luettavuutta, käytettävyyttä eikä saavutettavuutta. Ristiriidassa WCAG 2.2 AA ja käytettävyys voittavat aina. Ei pientä tai vaikealukuista tekstiä, ei versaaleja leipätekstissä, ei tekstin päälle piirrettäviä efektejä, ei vilkkumista. Katso luku 7.

## 2. Äänensävy ja mikrokopio

- Kieli on suomi, sinuttelu, lyhyet aktiiviset lauseet. Esim. "Yritä uudelleen", ei "Uudelleenyritys".
- Pelin omat termit (korttityypit, korttien nimet) näytetään rajapinnan englanninkielisessä muodossa, koska ne ovat samat kuin fyysisissä korteissa (katso avoin kysymys K2).
- Painikkeen teksti on verbi, joka kertoo, mitä tapahtuu.
- Virheilmoituksen rakenne: **mitä tapahtui** + **mitä voit tehdä**.
- Lukumäärät taivutetaan: "1 kortti", "2 korttia", "0 korttia".
- Laajempi sanasto ja kielitaso kuuluvat Sisällöntuottajalle (`docs/CONTENT.md`, kun se luodaan).

## 3. Design-tokenit

> **Päivitetty 2026-10-02 (T-021, D-010, D-011; versio 0.7).** Luvun 3 tokenit ja komponentit on uusittu Cyberpunk 2077 -henkiseen ilmeeseen. Sovelluksessa on **sekä vaalea että tumma teema**, ja ne seuraavat `prefers-color-scheme`-asetusta kuten ennenkin. Perustelut, tutkimus, kontrastilaskelmat ja komponenttien visuaaliset yksityiskohdat ovat luvussa 7. Kun lukujen 4–6 tekstit mainitsevat värin, reunan tai painikkeen ulkoasun, voimassa ovat tämän luvun ja luvun 7 arvot. Lukujen 4–6 toiminta, rakenne, tekstit ja saavutettavuusvaatimukset eivät muutu.

Tokenit määritellään CSS-muuttujina `:root`-tasolla. ~~Vaalea teema on oletus, ja tumma teema otetaan käyttöön `@media (prefers-color-scheme: dark)` -kyselyllä. Erillistä teemavalitsinta ei ole. `color-scheme: light dark` asetetaan `:root`iin.~~ → 2026-10-02 (T-025, D-012, luku 8): **tumma teema on oletus** laitteen asetuksesta riippumatta, ja vaalea otetaan käyttöön `:root[data-theme='light']`-valitsimella, kun käyttäjä valitsee sen teemapainikkeella. `prefers-color-scheme`-kyselyä ei käytetä. `color-scheme` (`dark` tai `light`) asetetaan teeman mukana, jotta selaimen omat osat (vierityspalkit, lomakekentät) seuraavat teemaa. Taulukon arvot ovat ennallaan. Teemakohtaiset arvot ovat vain tässä taulukossa, ja komponenttityylit käyttävät pelkästään tokeneita, joten komponentteihin ei tarvita erillisiä teemasääntöjä.

### 3.1 Värit

Kontrastit on laskettu WCAG 2.x -kaavalla 2026-10-02. Täydellinen parikohtainen taulukko (myös hover, fokus ja valittu, molemmat teemat): 7.6.

| Token | Vaalea | Tumma | Käyttö |
|---|---|---|---|
| `--color-bg` | `#f3f0e6` | `#0b0c10` | Sivun tausta (vaalea: kermanvalkoinen "paperi") |
| `--color-surface` | `#ebe7d9` | `#13151b` | Paneelit (hakulomake, selainmuistutus, tyhjä tila), taulukon otsikkorivi |
| `--color-surface-raised` | `#fbf9f1` | `#1b1e27` | Kentät, valintaruudut ja chipit, toissijaisen painikkeen täyttö, rivin hover |
| `--color-surface-hover` | `#ddd8c6` | `#262a36` | Hover-tausta toissijaisille painikkeille ja valinnoille, käytöstä poistetun + -painikkeen raidoitus |
| `--color-text` | `#0e0f14` | `#f1f1ec` | Leipäteksti, otsikot |
| `--color-text-muted` | `#4a4f5c` | `#a9afbd` | Toissijainen teksti (alaotsikko, ohje, alatunniste, taulukon otsikot) |
| `--color-border` | `#cfc9b5` | `#2b303b` | Koristeelliset erottimet (rivien viivat, paneelin reuna). Ei informatiivinen. |
| `--color-border-strong` | `#5f6676` | `#7b8396` | Reunat, jotka rajaavat käyttöliittymäkomponentin (kentät, valintaruudut, toissijainen painike) |
| `--color-accent` | `#fcee09` | `#fcee09` | Täyttöväri: ensisijaisen painikkeen ja + -painikkeen tausta, valitun valintaruudun tausta. **Ei koskaan tekstinä eikä ohuena viivana vaalealla taustalla** (kontrasti 1.06 : 1). |
| `--color-on-accent` | `#0e0f14` | `#0b0c10` | Teksti ja ruksi keltaisen täytön päällä |
| `--color-accent-edge` | `#0e0f14` | `#fcee09` | Keltaisen täytön reuna (painikkeet, valittu valintaruutu), omistetun rivin kisko, taulukon otsikkorivin yläviiva, alatunnisteen viiva. Vaalealla musta, jotta keltainen täyttö rajautuu (16.79 : 1). Tummalla sama kuin täyttö. |
| `--color-accent-2` | `#1fe0ff` | `#1fe0ff` | Hover-täyttö ensisijaiselle painikkeelle (musta tai tumma teksti päällä, 12.0 : 1). Ei tekstinä vaalealla. |
| `--color-info` | `#005f73` | `#1fe0ff` | Tieto, fokus ja hover-reunat: kokoelman yhteenveto, hover- ja valintareunat, selainmuistutuksen kisko, latauspalkki, toissijaisen painikkeen hover-reuna |
| `--color-focus` | `= --color-info` | `= --color-info` | Fokusrengas |
| `--color-selected-surface` | `#d4f3f8` | `#0c2a31` | Valitun suodatinvalinnan tausta |
| `--color-danger` | `#b00030` | `#ff5a73` | Virheilmoituksen reuna, raidoitus ja otsikko |
| `--color-danger-surface` | `#ffe3e8` | `#2a0d15` | Virheilmoituksen tausta |
| `--color-warning` | `#8a4b00` | `#ffa726` | Varoituksen reuna, raidoitus ja otsikko |
| `--color-warning-surface` | `#fff0d0` | `#2b1a05` | Varoituksen tausta |
| `--color-header-bg` | `#0e0f14` | `#000000` | Otsikkopalkin tausta (musta kummassakin teemassa) |
| `--color-header-text` | `#f1f1ec` | `#f1f1ec` | Otsikkopalkin teksti |
| `--color-bracket` | `#0e0f14` | `#fcee09` | Paneelin HUD-kulmasulut |
| `--color-count` | `#0e0f14` | `#fcee09` | Määrälukema korttirivillä |
| `--color-owned` | `rgba(252,238,9,.30)` | `rgba(252,238,9,.05)` | Omistetun rivin tausta |
| `--color-owned-hover` | `rgba(252,238,9,.45)` | `rgba(252,238,9,.09)` | Omistetun rivin tausta hoverissa tai fokuksessa |
| `--color-swatch-edge` | `#0e0f14` | `transparent` | Korttivärin näytteen 1 px:n reuna (vaalealla, jotta vaaleat värit erottuvat) |
| `--color-brand-yellow` | `#fcee09` | `#fcee09` | Koriste kummassakin teemassa: otsikkopalkin viiva ja merkki, alatunnisteen ja h1:n viivan keltainen osa. Ei tekstiä eikä tiedon kantajaa. (Koodari lisäsi, T-021.) |
| `--color-glitch-a`, `--color-glitch-b` | `#ff2a6d`, `#1fe0ff` | `#ff2a6d`, `#1fe0ff` | Otsikon glitchin kaksi tilapäistä varjoväriä (7.7). Vain `no-preference`-tilassa, 0,4 s. |
| `--heading-bar` | `linear-gradient(90deg, var(--color-text) 0 65%, var(--color-brand-yellow) 65%)` | `var(--color-brand-yellow)` | h1:n alaviiva (koriste) |
| `--glow-accent` | `none` | `0 0 .75rem rgba(252,238,9,.35)` | Hehku h1:n alaviivassa (vain tumma) |
| `--page-glow-a` | `rgba(31,224,255,.16)` | `rgba(31,224,255,.10)` | Taustan syaanihehku oikeassa yläkulmassa |
| `--page-glow-b` | `rgba(252,238,9,.22)` | `rgba(252,238,9,.06)` | Taustan keltainen hehku vasemmassa yläkulmassa |
| `--scanline` | `rgba(0,0,0,.03)` | `rgba(255,255,255,.022)` | Taustan vaakaviivapinta |

Säännöt:
- Tieto ei välity pelkällä värillä. Virhe- ja varoituslaatikoissa on aina otsikko tekstinä, omistettu kortti näkyy määränä ("2") ja valittu valinta ruksina. Raidoitus, kisko, hehku ja kulmasulut ovat koristeita.
- Keltainen on **täyttöväri** ("toiminto tai valittu"), syaani tai tummansyaani (`--color-info`) "tieto, fokus ja hover", punainen "virhe". Väreille ei anneta muita merkityksiä. Vaalealla teemalla keltainen täyttö on aina mustalla reunalla (`--color-accent-edge`), ja keltaista tekstiä ei ole.
- Otsikkopalkki on musta kummassakin teemassa (pelin musta HUD-kehys vaalean "paperin" päällä).
- Uusi väri lisätään tänne tokeniksi kontrastilaskelman kanssa ennen käyttöä.
- ~~Tokenit `--color-accent: #a3004f / #ff6bb0` ja muut vanhat arvot~~ → korvattu 2026-10-02 (D-010).

#### 3.1.1 Korttien värit (T-010, päivitetty T-021)

Pelin neljä väriä (rajapinnan `color`, katso 5.2). Niitä käytetään **vain** koristeellisessa värinäytteessä (`.color-swatch`), joka on aina värin nimen vieressä ja `aria-hidden="true"`. Tieto välittyy tekstinä. Näytteen muoto on viistetty neliö (`clip-path`, 7.3) ja 1 px:n reuna `--color-swatch-edge`.

| Token | Vaalea | Tumma | Kontrasti `--color-bg`-taustaa vasten (vaalea / tumma), tiedoksi |
|---|---|---|---|
| `--color-card-red` | `#d32f45` | `#ff4d5e` | 4.32 / 6.03 |
| `--color-card-yellow` | `#f2c200` | `#ffd400` | 1.47 (reuna erottaa) / 13.65 |
| `--color-card-green` | `#1b9e5a` | `#39e08a` | 3.03 / 11.36 |
| `--color-card-blue` | `#1f6fd1` | `#4d9dff` | 4.33 / 7.06 |
| `--color-card-unknown` | `transparent` | `transparent` | Tuntematon väri: ei näytettä, vain teksti |

Näitä tokeneita ei käytetä tekstin värinä eikä tekstin taustana.

### 3.2 Typografia

Fontti on Rajdhani (D-011), joka on kapea ja pienikokoisen näköinen. Siksi kaikki koot on nostettu ja leipätekstin paino on 500 (7.4).

| Token | Arvo | Käyttö |
|---|---|---|
| `--font-sans` | `'Rajdhani', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | Kaikki teksti: otsikot, leipäteksti, painikkeet, taulukko. Rajdhani isännöidään itse (7.4). |
| `--font-mono` | `'Share Tech Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace` | Luvut ja koneluonteinen tieto: tilarivit ("151 korttia"), hinta, määrälukema, alatunnisteen lähdemaininta. Ei pitkiä lauseita. |
| `--font-size-base` | `1.125rem` (18 px) | Leipäteksti, taulukko, kentät (~~1rem~~ → 1.125rem) |
| `--font-size-sm` | `1rem` (16 px) | Alaotsikko (subname), ohjetekstit, labelit, alatunniste, taulukon otsikot. **Ei pienempää tekstiä.** (~~0.875rem~~ → 1rem) |
| `--font-size-lg` | `1.375rem` | Sovelluksen nimi, h2, + ja − -merkit (~~1.25rem~~) |
| `--font-size-xl` | `2.25rem` | h1 (~~1.75rem~~) |
| `--font-size-card-name` | `1.25rem` | Kortin nimi taulukossa ja korttirivillä (ratkaisu 7.4/7.5-ristiriitaan: 7.4:n arvo on voimassa) |
| `--line-height-body` | `1.5` | Leipäteksti |
| `--line-height-heading` | `1.15` | Otsikot |
| `--line-height-tight` | `1.2` | Painikkeet ja kortin nimi (useampirivinen teksti, joka ei saa aueta liikaa) |
| `--letter-spacing-body` | `0.01em` | Leipäteksti (Rajdhanin tiivis kirjainväli avataan hieman) |
| `--letter-spacing-caps` | `0.08em` | Versaalit otsikot (h1), labelit ja legendit |
| `--letter-spacing-button` | `0.06em` | Painikkeet |
| `--letter-spacing-table-head` | `0.1em` | Taulukon otsikkorivi |
| `--letter-spacing-h2` | `0.05em` | h2 (ilmoituslaatikoiden otsikot) |
| `--letter-spacing-brand` | `0.2em` | Sovelluksen nimi otsikkopalkissa |
| `--font-weight-normal` | `500` | Leipäteksti (Rajdhani Medium). ~~400~~: Regular on pienikokoisena liian ohut. Share Tech Mono: 400 (ainoa paino). |
| `--font-weight-bold` | `700` | Otsikot, kortin nimi, painikkeet, labelit |
| `--font-weight-mono` | `400` | Share Tech Mono (ainoa paino) |

- Kaikki koot `rem`-yksiköissä, jotta selaimen tekstikokoasetus toimii. `html`-elementin fonttikokoa ei lukita pikseleihin.
- **Versaalit (`text-transform: uppercase`) vain lyhyissä teksteissä:** h1, h2, painikkeet, kenttien labelit ja legendit, taulukon otsikot, sovelluksen nimi. Leipäteksti, ohjeet, ilmoitusten tekstit, kortin nimet ja alaotsikot pysyvät sekakirjaimisina. Versaalit tehdään CSS:llä, jolloin ruudunlukija lukee tekstin normaalisti.
- Numerot: hinta, määrälukema ja tilarivit Share Tech Mono -fontilla (kiinteä leveys, `tabular-nums`), jotta sarake tasautuu. Perustelu: 7.4.
- Tekstin välistyksen muutokset (WCAG 1.4.12) eivät saa katkaista tekstiä: ei kiinteitä korkeuksia tekstiä sisältäville elementeille, ei `overflow: hidden` tekstissä.
- `font-display: swap`. Varafontit ovat järjestelmäfontteja, joten sisältö on luettavissa ennen fonttien latautumista.

### 3.3 Välistys, muodot ja asettelu

| Token | Arvo |
|---|---|
| `--space-1` … `--space-8` | ennallaan: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem` (4, 8, 12, 16, 24, 32 px) |
| `--content-max-width` | ~~`48rem`~~ → `56rem` (nelisarakkeinen taulukko ja hakupaneeli ovat väljemmät) |
| `--radius` | ~~`0.375rem`~~ → ei käytössä. Kulmat ovat suorat tai viistetyt (`--cut`). |
| `--cut` | `0.625rem` (10 px). Viistetyn kulman koko. Määräpainikkeilla `0.5rem`. |
| `--cut-inner`, `--cut-inner-2` | `calc(var(--cut) - 1px)` ja `calc(var(--cut) - 2px)`: sisäkerroksen viiste 1 px:n (toissijainen) ja 2 px:n (ensisijainen) reunalle |
| `--shape-chamfer` | `polygon(0 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%)` |
| `--shape-chamfer-inner`, `--shape-chamfer-inner-2` | sama monikulmio, mutta `--cut` korvattu `--cut-inner`- tai `--cut-inner-2`-arvolla |
| `--shape-swatch` | `polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)`: korttivärin näytteen muoto |
| `--shape-brand` | `polygon(0 0, 100% 0, 100% 55%, 55% 100%, 0 100%)`: otsikkopalkin merkin muoto |
| Huom. `.step` | Määräpainikkeiden `--cut: 0.5rem` ei muuta `--shape-*`-arvoja, koska ne lasketaan `:root`issa. Siksi `.step` määrittelee `--shape-chamfer`-muuttujat uudelleen itse (mallisivun virhe, korjattu toteutuksessa). |
| `--focus-ring` | `3px solid var(--color-focus)` |
| `--focus-offset` | `3px` |
| `--target-min` | `2.75rem` (44 px) |
| `--ease` | `0.12s ease-out`. Siirtymä värimuutoksille, vain `prefers-reduced-motion: no-preference` -tilassa. |

- Sivun reunaväli (gutter): `--space-4` alle 40 rem:n leveydellä, `--space-6` siitä ylöspäin.
- Sisältö keskitetään ja rajataan leveyteen `--content-max-width`.
- Breakpoint: yksi, `40rem` (640 px), kuten ennenkin. Mediakyselyt `rem`-yksiköissä.

### 3.4 Komponentit

Komponenttien toiminta ja rakenne ovat ennallaan. Tässä on ulkoasun muutos. Visuaaliset yksityiskohdat: 7.5. Referenssitoteutus kummallekin teemalle: `docs/design/t021-mallisivu.html`.

**Painike (ensisijainen)**
- Rakenne: painikkeen oma tausta on **reuna** (`--color-accent-edge`) ja `::before`-pseudoelementti (`inset: 2px`, `z-index: -1`, `isolation: isolate` painikkeessa) on **täyttö** (`--color-accent`), jolla on sisempi viistetty muoto (`--shape-chamfer-inner-2`). Tummalla teemalla reuna ja täyttö ovat samaa keltaista, vaalealla reuna on musta ja täyttö keltainen.
- Teksti `--color-on-accent`, lihavoitu, versaalit, painikkeen ulkomuoto viistetty oikea alakulma (`clip-path: var(--shape-chamfer)`).
- Vähimmäiskorkeus ja -leveys `--target-min`, sisäväli `--space-2` `--space-4`.
- Hover: täyttö `--color-accent-2` **ja** `text-decoration: underline` (ei pelkkää värimuutosta). Aktiivinen (painettu): siirtyy 1 px alas.
- Fokus: `:focus-visible` poistaa ulkomuodon viistoleikkauksen (`clip-path: none`) ja piirtää fokusrenkaan (`outline: var(--focus-ring); outline-offset: var(--focus-offset)`). Syy: `clip-path` leikkaisi renkaan.
- Aina `<button type="button">`, ei `div` tai linkki. Ei pyöristystä.

**Painike (toissijainen)** (`.button-secondary`, myös − -painike `.step-minus`): reuna `--color-border-strong` (painikkeen tausta) ja täyttö `--color-surface-raised` (`::before`, `inset: 1px`, `--shape-chamfer-inner`). Teksti `--color-text`. Hover: reuna `--color-info`, täyttö `--color-surface-hover` ja alleviivaus. Fokus kuten ensisijaisella.

**Ilmoituslaatikko (virhe / varoitus)**
- Tausta `--color-danger-surface` tai `--color-warning-surface`. 1 px:n reuna ja 4 px:n vasen reuna `--color-danger` tai `--color-warning`. Yläreunassa 6 px:n vinoraidoitus (`repeating-linear-gradient(135deg, …)`), koristeena.
- Otsikko (h2) saa saman värin kuin reuna (kontrasti ≥ 5.97 kummassakin teemassa, katso 7.6). Selitys (p) on `--color-text`.
- Sisältö: otsikko (h2), selitys (p), tarvittaessa painike. Ikonia ei tarvita.

**Fokus yleisesti**
- Selaimen oletusfokusta ei poisteta ilman korvaavaa `--focus-ring`-tyyliä.
- Fokusrengas on `--color-focus` (tumma teema syaani `#1fe0ff`, vaalea tummansyaani `#005f73`). Se piirretään elementin ulkopuolelle `--focus-offset`-välillä, joten sitä vasten ei tarvita kontrastia painikkeen väriin. Rengas erottuu taustasta ≥ 5.1 : 1 (7.6).
- Mikään kiinnitetty (sticky) elementti ei saa peittää fokusoitua elementtiä (2.4.11). Sticky-elementtejä ei käytetä.

**Tekstikenttä** (T-010)
- Näkyvä `<label>` kentän yläpuolella (`--font-weight-bold`, versaalit, `--font-size-sm`). Placeholderia ei käytetä labelin tai ohjeen korvikkeena.
- Ohjeteksti labelin ja kentän välissä (`--font-size-sm`, `--color-text-muted`), liitetty kenttään `aria-describedby`-attribuutilla.
- Kenttä: korkeus vähintään `--target-min`, leveys 100 % (enintään `24rem`, kun leveys on ≥ 640 px), tausta `--color-surface-raised`, teksti `--color-text` (paino 500), reuna 1 px `--color-border-strong` ja alareuna 2 px, suorat kulmat, sisäväli `--space-2` `--space-3`, fonttikoko `--font-size-base` (≥ 16 px estää iOS:n automaattisen zoomauksen).
- Hover: reuna `--color-info`. Fokus: reuna `--color-info` ja `--focus-ring` (`outline-offset: 2px`).

**Valintaruutu ja valintaryhmä** (T-010)
- Natiivi `<input type="checkbox">` labelin sisällä yhdessä tekstin kanssa, ulkoasu `appearance: none` -tyylillä (7.5). Koko label on klikattava alue: vähintään `--target-min` korkea. Ruudun koko `1.375rem`, 2 px:n reuna `--color-border-strong`, tausta `--color-surface-raised`, suorat kulmat.
- Valittu tila: tausta `--color-accent`, reuna `--color-accent-edge`, ruksi (`--color-on-accent`) piirretään `input::after`-pseudoelementillä (`clip-path`-monikulmio). Ei kuvia eikä data-URI-resursseja, koska CSP (`default-src 'self'`) estäisi ne. Ruksi on aina näkyvissä, joten tila ei välity pelkällä värillä. Koko label saa samalla `--color-selected-surface`-taustan ja `--color-info`-reunan (`:has(input:checked)`).
- Label on "chip": 1 px reuna `--color-border-strong`, tausta `--color-surface-raised`, sisäväli `0 --space-3`. Hover: reuna `--color-info`, tausta `--color-surface-hover`, teksti alleviivataan.
- Fokus: `--focus-ring` ruudussa (`input:focus-visible`, `outline-offset: 2px`). Fokusrengas ei saa leikkautua (ei `overflow: hidden` eikä `clip-path` vanhemmissa).
- Ryhmä on `<fieldset>`, jonka nimi on `<legend>` (`--font-weight-bold`, versaalit). Fieldsetin oletusreuna poistetaan, ja sisäväli on 0.
- Vaihtoehdot rivitetään: `display: flex; flex-wrap: wrap; gap: var(--space-2)`.

**Paneeli** (uusi, T-021): hakulomake (`.card-filters`). Tausta `--color-surface`, 1 px `--color-border` ja kaksi kulmasulkua (vasen yläkulma ja oikea alakulma, 16 px × 2 px `--color-bracket`, toteutus `background`-gradienteilla, ei `clip-path`). Selainmuistutuksella (`.storage-reminder`) on sen sijaan 3 px:n vasen kisko `--color-info` ja tausta `--color-surface`. Tyhjä tila (`.empty`): 1 px katkoviivareuna `--color-border-strong`, tausta `--color-surface`.

**Visuaalisesti piilotettu teksti** (`.visually-hidden`)
- Ruudunlukijalle tarkoitettu teksti, joka ei näy. Käytetään vakiintunutta clip-toteutusta (ei `display: none` eikä `visibility: hidden`, jotka piilottavat myös ruudunlukijalta).

### 3.5 Liike

- Kaikki liike (animaatiot, siirtymät) on kirjoitettu ehdon `@media (prefers-reduced-motion: no-preference)` sisään. Ilman ehtoa tai `reduce`-tilassa ei ole liikettä. Nykyinen `reduce`-ylikirjoitus (`animation-duration: 0.01ms`, `transition-duration: 0.01ms`) säilytetään turvaverkkona.
- Sallittu liike on lueteltu 7.7:ssä: otsikon yksi lyhyt glitch sivun avautuessa, latauspalkin pyyhkäisy ja värisiirtymät (0.12 s). Mikään ei vilku yli 3 kertaa sekunnissa.

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

> 2026-10-02 (T-021, UX-007): kapean rivin asettelu on päivitetty. Tyyppi, väri ja hinta ovat samalla rivittyvällä rivillä, rivi on `display: flex` eikä `grid`, ja kontrollille ei varata leveyttä. Voimassa oleva kuvaus on luvussa 7.5 ("Taulukko alle 40 rem"). Semantiikka ja ARIA-roolit ovat ennallaan.

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
│ │ Legend · ■ Punainen        │ │ tyyppi + väri
│ │ Hinta 5                    │ │ hinta omalla rivillään (UX-005)
│ ├────────────────────────────┤ │
│ │ Swordwise Huscle       [+] │ │ määrä 0: vain [+]
│ │ Unit · ■ Sininen           │ │
│ │ Hinta 3                    │ │
│ ├────────────────────────────┤ │
│ │ Viktor Vektor    [−]  1 [+]│ │
│ │ You Might Feel a Little    │ │ pitkä alaotsikko rivittyy
│ │ Pinch                      │ │
│ │ Program · ■ Keltainen      │ │
│ │ Hinta –                    │ │ hinta puuttuu: "–" kuten 4.4
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

- Ruudukko `< 40rem` (korjattu UX-005, 2026-10-01): `grid-template-columns: 1fr auto; grid-template-areas: "name control" "type control" "cost control"`, eli kolme riviä: nimi, tyyppi ja väri, hinta. Alkuperäinen kahden rivin malli (tyyppi, väri ja hinta samalla rivillä) ei mahtunut 320 px:iin. Kontrollin leveys on vakio `calc(3 * var(--target-min) + 2 * var(--space-2))` (132 px), jotta nimen leveys ei vaihtele rivien välillä. Kontrolli on pystysuunnassa keskitetty.
- Hinta-solun eteen tulee **näkyvä** teksti `Hinta ` (CSS `::before`, koska otsikkorivi on piilotettu). Ruudunlukija voi lukea sen sarakeotsikon lisäksi, mikä on hyväksytty.
- Tyyppi ja väri -solun sisältö ja tekstit ennallaan (5.5). Tyypin ja värin välinen erotin `·` on koriste (`aria-hidden`). Hinnan edessä ei ole erotinta, koska hinta on omalla rivillään.
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
| `reset`, `backupKey: null` (SEC-007) | danger | `Vanhoja kokoelmatietoja ei voitu käsitellä` | `Tallennetut kokoelmatiedot olivat vioittuneet, eikä niistä saatu kopiota. Vanhoja tietoja ei ole poistettu, joten uusia merkintöjä ei voi tallentaa, ennen kuin selain sallii tallennuksen. Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta ja päivitä sivu. (SEC-012)` | ei | `Vanhoja kokoelmatietoja ei voitu käsitellä.` |
| `repaired`, `dropped` = 1 | warning | `Osa kokoelman tiedoista oli vioittunut` | `Yhtä merkintää ei voitu lukea, ja se jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.` | kyllä | `Osa kokoelman tiedoista oli vioittunut.` |
| `repaired`, `dropped` = n > 1 | warning | sama | `{n} merkintää ei voitu lukea, ja ne jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.` | kyllä | sama |
| `newer-version` | warning | `Kokoelma on tallennettu uudemmalla versiolla` | `Selaimeen tallennetut tiedot ovat peräisin sovelluksen uudemmasta versiosta. Kokoelmaa ei näytetä eikä sitä voi muokata, jotta tiedot eivät vioitu. Päivitä sivu. Jos ilmoitus ei katoa, sulje kaikki tämän sivuston välilehdet ja avaa sivu uudelleen. Älä tyhjennä selaimen tietoja, koska kokoelma poistuisi. (SEC-011)` | ei | `Kokoelma on tallennettu uudemmalla versiolla.` |

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


---

## 7. Visuaalinen ilme: Cyberpunk 2077 -henki (T-021, D-010)

### 7.1 Tavoite ja prioriteetit

Käyttäjän ohje (D-010): sovelluksen ulkoasu on "ei minkään näköinen", ja sen pitää näyttää ja tuntua Cyberpunk 2077 -henkiseltä alusta loppuun. **1. prioriteetti on käytettävyys** (kaikki intuitiivista ja helppokäyttöistä), **2. prioriteetti tyyli.** Ristiriidassa käytettävyys ja WCAG 2.2 AA voittavat aina.

Periaate: tyyli tulee **väreistä, muodoista ja typografiasta**, ei efekteistä. Pelin henkeä ei kopioida, vaan tulkitaan omilla väreillä, muodoilla ja avoimen lisenssin fonteilla (D-010, SECURITY.md luku 7). Rakenne, tekstit ja toiminta eivät muutu.

### 7.2 Tutkimustiivistelmä

Lähteet haettu 2026-10-02. Lähteet ovat kolmannen osapuolen analyyseja ja yhteisön poimintoja, ei CD PROJEKT REDin julkaisemaa tyyliohjetta. Värit ovat siksi likiarvoja.

| Aihe | Löydös | Lähde |
|---|---|---|
| Värit | Pelin visuaalinen kieli rakentuu kirkkaan keltaisen, sähkösyaanin ja punaisen/magentan varaan lähes mustaa taustaa vasten. Yhteisön poimima keltainen on noin `#fcec0c`. Kansitaiteen neljä päävärin kuvaus: neonkeltainen, kirsikanpunainen, vaalea neonsininen, tumma ruskea. | [ColorsWall: Cyberpunk 2077 UI palette](https://colorswall.com/palette/66354), [Pageflows: Cyberpunk color palette](https://pageflows.com/resources/cyberpunk-color-palette/), [ChromaXP](https://chromaxp.com/games/cyberpunk-2077/) |
| Pelin käyttöliittymän fontti | Pelin käyttöliittymä on suurelta osin Rajdhani-fonttia (Regular–Bold). Toissijaisena Orbitron. Pelin verkkosivuilla käytetään Refinery- ja Blender-fontteja. | [Fonts In Use: Cyberpunk 2077 video game](https://fontsinuse.com/uses/60926/cyberpunk-2077-video-game) |
| Muodot | Paksut, neliömäiset kirjaimet ja 80-luvun piirilevymäiset muodot. HUD on pääosin tekstipohjainen, "off red, low-fi" -ilmeinen. Käyttöliittymä on utilitaristinen: toiminnallinen ja vailla koristeita ("ohjelmisto näyttää betavaiheelta"). | [HUDS+GUIS: Cyberpunk 2077](https://www.hudsandguis.com/home/2019/cyberpunk-2077) |
| Efektit | Skannausviivat, glitch-siirtymät, kromaattinen aberraatio ja haamukuva (kuin informaatio heijastettaisiin silmäimplantin linssiin). Yhteisön ohje: efekti on mauste, ei ateria, yksi glitch-efekti per näkymä. | [HUDS+GUIS](https://www.hudsandguis.com/home/2019/cyberpunk-2077), [DEV: CYBERCORE CSS](https://dev.to/sebyx07/introducing-cybercore-css-a-cyberpunk-design-framework-for-futuristic-uis-2e6c), [DESIGN.md: Cyberpunk UI](https://designmd.app/library/cyberpunk-ui/) |
| Fonttien lisenssi | Rajdhani ja Share Tech Mono ovat SIL OFL 1.1 -lisenssillä Google Fontsin repositoriossa (`OFL.txt` mukana). Tarkistettu 2026-10-02. | [google/fonts: ofl/rajdhani](https://github.com/google/fonts/tree/main/ofl/rajdhani), [OFL rajdhani](https://raw.githubusercontent.com/google/fonts/main/ofl/rajdhani/OFL.txt), [OFL sharetechmono](https://raw.githubusercontent.com/google/fonts/main/ofl/sharetechmono/OFL.txt) |

**Tutkimuksen tärkein johtopäätös käytettävyyden kannalta:** pelin oma käyttöliittymä on tarkoituksella pienikokoinen, hehkuva ja efektien peittämä, koska se on pelin sisäinen "näyttö". Verkkopalvelussa sama tekisi tekstistä vaikealukuista. Siksi otetaan väripaletti, muotokieli ja äänensävy, mutta ei pelin tekstiefektejä eikä pientä tekstiä.

### 7.3 Mitä otetaan ja mitä jätetään pois

**Otetaan:**

| Elementti | Toteutus | Miksi se toimii |
|---|---|---|
| Lähes musta tausta, keltainen pääkorostus, syaani toissijaisena, punainen virheille | Tokenit 3.1 | Tunnistettavin osa pelin ilmettä. Kontrastit ovat korkeat (keltainen mustalla 16.2 : 1). |
| Viistetyt kulmat | Painikkeiden oikea alakulma (`clip-path`), korttien värinäytteet | Edustaa HUD-kehysten kulmaleikkauksia. Pieni, ei vaikuta luettavuuteen. |
| HUD-kulmasulut | Hakupaneelin kaksi kulmaa (gradientit) | Jäsentää hakulomakkeen yhdeksi alueeksi. |
| Vinoraidat | Ilmoituslaatikoiden yläreuna | Varoitusmerkintöjen kieli. Koriste, otsikko kantaa tiedon. |
| Neliömäinen tekninen fontti, lyhyet versaalit | Rajdhani, versaalit vain otsikoissa, painikkeissa ja labeleissa | Pelin typografian henki. Leipäteksti sekakirjaimin. |
| Konetekstin tuntu | Share Tech Mono tilariveillä, hinnoilla ja määrillä | Luvut näyttävät HUD-lukemilta, ja `tabular-nums` pitää sarakkeet suorina. |
| Ohuet hehkuviivat | Otsikon ja otsikkopalkin keltainen viiva (`--glow-accent`) | Neon-vaikutelma ilman tekstin hehkua. |
| Hienovarainen skannausviivapinta | Vain sivun taustakuviossa (`background-image`, 2,2 % valkoista) | Tekstin päälle ei piirretä mitään. |
| Yksi lyhyt glitch | Otsikon "Kortit" siirtymä kerran sivun avautuessa | "Yksi efekti per näkymä" -periaate. Katso 7.7. |
| Terminaalimainen luku | Kokoelman yhteenveto ja tilarivi monospace-fontilla | Pelin tekstipohjainen HUD. |

**Jätetään pois ja miksi:**

| Pois | Syy |
|---|---|
| Pelin logot, kuvat, ääni, tavaramerkit, Blender- ja Refinery-fontit | Tekijänoikeus (D-010, SECURITY.md luku 7). |
| Orbitron (pelin toissijainen fontti) | Leveä ja pienellä koolla huonommin luettava. Rajdhani on sallittu (D-011), koska se on avoimen lisenssin fontti. |
| Koko ruudun skannausviivat tai kohinakerros tekstin päällä | Heikentää tekstin luettavuutta ja kontrastia (1.4.3). Pinta on vain taustakuvana. |
| Kromaattinen aberraatio ja haamukuva tekstissä | Heikentää luettavuutta, erityisesti lukivaikeuksisilla ja heikkonäköisillä. Sallittu vain otsikossa kerran 0,4 s. |
| Toistuva tai jatkuva glitch, vilkkuminen, kohina | WCAG 2.3.1 ja 2.2.2, häiritsee lukemista ja voi laukaista vestibulaarioireita. |
| Hehkuva teksti (`text-shadow`) leipätekstissä | Pehmentää reunat ja laskee tehollista kontrastia. |
| Läpikuultavat, sumennetut (`backdrop-filter`) hologrammipinnat | Kontrasti riippuu taustasta, ei ole laskettavissa. |
| Pieni, tiivis tai haalea teksti | Pelissä tavallista, mutta tässä vähimmäiskoko on 14 px ja leipäteksti 16 px. Haaleinta tekstiä (`--color-text-muted`) kontrasti on 7.6–8.9 : 1. |
| Pelkkä punertava yksivärinen "off red" -paletti | Vähäkontrastinen ja värisokeille vaikea. Käytetään kirkasta keltaista ja syaania. |
| Versaalit leipätekstissä ja pitkissä riveissä | Versaalit lukevat huonommin. Vain lyhyet otsikot ja labelit. |
| Vain väriin perustuva tila tai hover | Aina myös muoto, teksti tai alleviivaus (1.4.1). |
| Viistetyt (`clip-path`) kohteet, jotka saavat fokuksen, ilman varaa | `clip-path` leikkaisi fokusrenkaan. Fokuksessa leikkaus poistetaan (3.4). |
| Parallax, liikkuva tausta, äänet | Ei lisää käytettävyyttä, riski vestibulaarioireille. |

**Teemapäätös (D-011): sekä vaalea että tumma.** ~~Sovellus seuraa selaimen `prefers-color-scheme`-asetusta kuten ennenkin~~ → 2026-10-02 (D-012, luku 8): tumma on oletus ja käyttäjä vaihtaa teeman painikkeella. Molemmat teemat ovat selvästi Cyberpunk-henkisiä. ~~Aiempi ehdotus (v0.6): vain tumma.~~ → hylätty D-011:ssä.

- **Tumma teema:** lähes musta tausta, keltainen täyttö, syaani fokus ja hover. Tämä on pelin tunnistettavin ilme.
- **Vaalea teema:** kermanvalkoinen "paperi" (pelin käyttöliittymän beige pinta, HUDS+GUIS), musta teksti ja **musta reuna keltaisen täytön ympärillä**. Keltaisen tekstikontrasti vaalealla taustalla on vain 1.06 : 1, joten keltainen on vaalealla aina täyttöväri mustan reunan sisällä eikä koskaan teksti, viiva tai fokusrengas. Tiedon, hoverin ja fokuksen väri on tummansyaani `#005f73` (6.39 : 1). Otsikkopalkki on musta kummassakin teemassa, joten Cyberpunk-kehys ja keltainen merkki säilyvät. Muodot (viisteet, kulmasulut, raidoitukset) ovat samat, mutta kulmasulut ja otsikon alaviiva ovat vaalealla mustia.
- Molemmat teemat määritellään vain tokeneina (3.1), joten komponenttityylit ovat yhteiset. Tämä pitää ylläpidon ja kontrastitarkistukset hallittavina (7.6 kattaa molemmat).

### 7.4 Fontit

Fontit isännöidään itse, koska CSP on `font-src 'self'` (firebase.json). Ei kolmannen osapuolen pyyntöjä, ei Google Fonts -linkkiä. **Fonttivalinta on D-011:n mukainen: Rajdhani.** (~~Chakra Petch~~ → hylätty D-011:ssä.)

| Fontti | Käyttö | Painot | Lisenssi | Tekijänoikeusrivi (OFL.txt) | Latauslähde (latin-alijoukko, woff2) |
|---|---|---|---|---|---|
| **Rajdhani** | Kaikki teksti ja otsikot | 500 (leipäteksti), 700 (otsikot, painikkeet, labelit) | SIL OFL 1.1 | Copyright (c) 2014, Indian Type Foundry (info@indiantypefoundry.com) | 500: `https://fonts.gstatic.com/s/rajdhani/v17/LDI2apCSOBg7S-QT7pb0EPOreec.woff2` (15,1 kB)<br>700: `https://fonts.gstatic.com/s/rajdhani/v17/LDI2apCSOBg7S-QT7pa8FvOreec.woff2` (15,7 kB) |
| **Share Tech Mono** | Luvut, tilarivit, alatunnisteen lähde | 400 | SIL OFL 1.1 | Copyright (c) 2012, Carrois Type Design, Ralph du Carrois (post@carrois.com www.carrois.com), with Reserved Font Name 'Share' | `https://fonts.gstatic.com/s/sharetechmono/v16/J7aHnp1uDWRBEqV98dVQztYldFcLowEF.woff2` (13,5 kB) |

- Lisenssi tarkistettu 2026-10-02: Rajdhanin `OFL.txt` (SIL Open Font License 1.1) on Googlen fonttirepositoriossa (`https://github.com/google/fonts/tree/main/ofl/rajdhani`). OFL.txt-tiedostot: `https://raw.githubusercontent.com/google/fonts/main/ofl/rajdhani/OFL.txt` ja `https://raw.githubusercontent.com/google/fonts/main/ofl/sharetechmono/OFL.txt`. Ne tallennetaan fonttien viereen (`src/assets/fonts/`), ja lisenssit kirjataan `docs/CONTENT.md`:n sisältöjen oikeuksiin.
- **Latin-alijoukko riittää:** se kattaa U+0000–00FF eli ä, ö, å, é, á ja muut Latin-1-merkit (esim. "Judy Álvarez", "El Sombrerón", "Les Élémens"). Latin-ext-alijoukkoa ei tarvita nykyisillä korttinimillä. Jos rajapinta palauttaa nimen, jossa on merkki latin-alueen ulkopuolelta, selain käyttää varafonttia. Se on hyväksyttävä.
- **Share Tech Mono:n Reserved Font Name "Share":** fonttia ei saa muokata (esim. osajoukkoistaa itse tai nimetä uudelleen). Käytä Googlen toimittamia woff2-tiedostoja sellaisenaan. Rajdhanilla ei ole varattua fonttinimeä, mutta samat tiedostot käytetään silti sellaisenaan.
- Painoja 300, 400 ja 600 sekä kursiivia ei ladata (Rajdhanilla ei ole kursiivia). Yhteiskoko noin 44 kB.
- Latausjärjestys: `@font-face` `font-display: swap`. Preload-vihje (`<link rel="preload" as="font" type="font/woff2" crossorigin>` `index.html`:ssä Rajdhani 500:lle ja 700:lle) on valinnainen (Koodarin harkinta).
- **Vite-huomio (CSP):** varmista `npm run build` -jälkeen, että fontit ovat omina tiedostoinaan `dist/assets/` eikä data-URI:na (Viten `assetsInlineLimit` on oletuksena 4 kB, joten nämä tiedostot eivät inline-liity, mutta tarkista). `font-src 'self'` estäisi `data:`-fontit. Samasta syystä CSS:ssä ei käytetä data-URI-kuvia (`img-src` on `'self'`).
- Jos CSP:tä tai `firebase.json`ia muutetaan, Digiturva tekee kevyen tarkistuksen (D-010). Pelkkä fonttien lisäys omalle origin-osoitteelle ei vaadi CSP-muutosta.

**Rajdhanin luettavuus pienissä koissa (T-021, D-011).** Rajdhani on kapea ja sen x-korkeus on pieni, joten sama pikselikoko näyttää pienemmältä kuin järjestelmäfontilla. Mallisivulla (kuvakaappaukset 320 px ja 1100 px, molemmat teemat) tehtiin seuraavat ratkaisut:
- **Leipäteksti 18 px (`1.125rem`) ja paino 500 (Medium).** Regular (400) on pienikokoisena liian ohut, erityisesti vaalealla taustalla. `letter-spacing: 0.01em`.
- **Pienin teksti 16 px (`1rem`).** Aiempi 14 px:n vähimmäiskoko nostettiin 16 px:ään (alaotsikko, ohje, label, alatunniste, taulukon otsikko). Alle 16 px:n tekstiä ei ole.
- **Lihavat tekstit paino 700.** Labelit, painikkeet, kortin nimi (`1.25rem`), otsikot.
- **Versaalit vain lyhyissä teksteissä** (7.3), kirjainväli `0.06–0.1em`.
- **Kontrasti on lasketussa taulukossa (7.6) vähintään 5.10 : 1 tekstille**, mikä kompensoi ohuita vetoja.
- Arvio: leipäteksti ja ohjeet ovat luettavia 320 px:n ja 1100 px:n leveydellä. Nimet kuten "Johnny Silverhand" ja "Judy Álvarez" näkyvät selvästi. Rajdhanin ohuus näkyy lähinnä vaalealla teemalla pienessä tekstissä, ja siksi `--color-text-muted` on vaalealla tummennettu (7.18 : 1 taustaa vasten).
- Tarkistus jää toteutuksen UX-katselmointiin: 200 % ja 400 % zoom, tekstin välistys (1.4.12) ja lukuvaikeuksisen näkökulma.

**Numeroiden ja tilarivien fontti: Share Tech Mono säilyy.** Perustelut:
1. Kiinteä merkkileveys ja `tabular-nums` pitävät hinta- ja määräsarakkeet suorina ("5", "8", "999"). Rajdhanin numeroiden tasaleveyttä ei voitu varmistaa (fonttitiedostoa ei tarkasteltu OpenType-ominaisuuksien osalta), eikä sen tarvitse olla riski, kun mono-fontti hoitaa asian.
2. Numerot ovat Rajdhanilla kapeita, ja 1, 7 ja 0 ovat pienessä koossa vaikeampia erottaa. Mono-fontin numerot ovat väljemmät.
3. Mono-fontti erottaa luvut ja tilatiedon selitystekstistä HUD-lukemana ("151 korttia", "Kokoelmassa 2 eri korttia, …"). Se on Cyberpunk-ilmeen tunnistettavin yksityiskohta ja säilyy yhtenäisenä molemmissa teemoissa.
4. Kustannus: yksi 13,5 kB:n tiedosto.
Rajoitus: mono-fonttia ei käytetä pitkissä lauseissa. Kokoelman yhteenveto ("Kokoelmassa 2 eri korttia, yhteensä 3 kappaletta.") on yksi rivi, ja se pysyy monossa, koska se on tilarivi. Jos käyttäjäpalaute osoittaa, että tämä rivittyy huonosti kapealla näytöllä, rivin voi vaihtaa Rajdhaniin (IDEAS.md, ei erillistä päätöstä).

### 7.5 Komponenttien visuaalinen määrittely

Referenssi: `docs/design/t021-mallisivu.html` (CSS on kopioitavissa lähes sellaisenaan `src/styles.css`:ään, kun mallisivun `.spec*`-luokat jätetään pois). Alla on yhteenveto, joka selittää tarkoituksen.

**Otsikkopalkki (`.site-header`)**: tausta `--color-header-bg` ja teksti `--color-header-text` (musta palkki kummassakin teemassa), alareuna 1 px `--color-border`, vasemmassa alareunassa 7 rem leveä 3 px:n keltainen viiva (`#fcee09`). Sovelluksen nimi `Cyberdeck` (teksti, ei otsikkoelementti) versaaleilla (`text-transform`), `letter-spacing: 0.2em`, lihavoitu. Nimen edessä koristeellinen viistetty keltainen merkki (`::before`, 1.125 rem, ei tekstiä, ei logoa). Ei sticky.

**Sivun otsikko (h1 "Kortit")**: `--font-size-xl`, versaalit, `--letter-spacing-caps`. Alla 3.5 rem leveä 4 px viiva (`::after`, `--heading-bar`, `--glow-accent` tummalla). Glitch kerran, katso 7.7.

**Tilarivi ja yhteenveto (`.status-line`)**: Share Tech Mono, `--color-text-muted`. Kokoelman yhteenveto (`.is-summary`) `--color-info` (7.6). Tekstit ennallaan.

**Selainmuistutus (`.storage-reminder`)**: paneeli: `--color-surface`, 3 px vasen kisko `--color-info`, `--font-size-sm`, `--color-text-muted`. Sisällä toissijainen painike.

**Hakupaneeli (`form.card-filters.panel`)**: katso 3.4 "Paneeli". Labelit versaaleilla (`--font-size-sm`, lihavoitu). Hakukenttä ja "Vain omistetut" -chip pinottuna, suodatinryhmät (Tyyppi, Väri) allaan. Chipit rivittyvät (`flex-wrap`). Alle 40 rem:n leveydellä chipit voivat olla rivillä 2 kpl, ja ne rivittyvät automaattisesti.

**Taulukko (`.card-table`)**, ≥ 40 rem:
- Otsikkorivi: tausta `--color-surface`, ylä 3 px `--color-accent-edge`, ala 1 px `--color-border-strong`, teksti `--color-text-muted`, versaalit, `--font-size-sm`, `letter-spacing: 0.1em`.
- Rivi: alareuna 1 px `--color-border`, sisäväli `--space-3` pysty. Hover ja `:focus-within`: tausta `--color-surface-raised`. (Rivit eivät ole interaktiivisia. Korostus auttaa seuraamaan riviä leveällä näytöllä määräkontrolliin asti ja näyttää, missä fokus on.)
- **Omistettu rivi** (`.is-owned`, määrä > 0): tausta `--color-owned` (hover `--color-owned-hover`), nimisolun vasemmassa reunassa 4 px kisko `--color-accent-edge` (`box-shadow: inset`; keltainen tummalla, musta vaalealla). Tieto välittyy myös määrälukemasta ("2"), ei vain värillä.
- Kortin nimi: lihavoitu `--font-size-card-name` (`1.25rem`). ~~`1.0625rem`~~ → 2026-10-02 (UX-004): 7.4:n ja mallisivun arvo on voimassa, koska Rajdhani on kapea. Alaotsikko `--font-size-sm`, `--color-text-muted`.
- Hinta: Share Tech Mono `1.125rem`, oikealle tasattu. Puuttuva hinta "–" ennallaan.
- Värinäyte: 0.875 rem viistetty neliö (`clip-path: polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)`) värin nimen vieressä.

**Taulukko alle 40 rem** ~~(kortti-ruudukko, rakenne ennallaan luvun 6.4.4 mukaan): rivi on ruudukko (nimi / tyyppi ja väri / hinta vasemmalla, määräkontrolli oikealla)~~ → 2026-10-02 (UX-007, Koodari PM:n luvalla): rivi on kaksirivinen korttirivi (`display: flex; flex-wrap: wrap`). 1. rivi: nimi ja alaotsikko vasemmalla, määräkontrolli oikeassa reunassa. 2. rivi: tyyppi · väri ja hinta samalla rivittyvällä rivillä (`column-gap: --space-3`). Rivin sisäväli `--space-2` pysty, `--space-3` vaaka. Järjestys on vain visuaalinen (`order`): DOM- ja lukujärjestys on ennallaan (nimi, tyyppi, hinta, kontrolli), ja ainoa fokusoitava osa on kontrolli. Hyvin suurella tekstillä (200 %) kontrolli siirtyy omalle rivilleen nimen alle eikä levennä sivua (nimen `flex-basis: 6rem`). Mitattu 320 px:ssä: rivin keskikorkeus 85 px (aiemmin 140 px), sivun korkeus 14 386 px (aiemmin 23 901 px). Alareuna 1 px `--color-border`. Omistetun rivin kisko on rivin vasemmassa reunassa (`tr.is-owned::before`, 4 px, kuten leveässä asettelussa).

**Määräkontrolli (`.count-control`)**: ennallaan `[−] n [+]`, varattu leveys ennallaan leveässä taulukossa. ~~Varattu leveys myös alle 40 rem:ssä.~~ → 2026-10-02 (UX-007, UX-008): alle 40 rem:ssä leveyttä ei varata (`min-width: 0`, `flex-wrap: wrap`). Nimi saa tilan, ja `+` pysyy oikeassa reunassa, kun `−` ilmestyy, joten painettu painike ei siirry. `+`: keltainen täyttö, `--color-on-accent`, viistetty kulma (`--cut: 0.5rem`). `−`: toissijainen tyyli (1 px `--color-border-strong` -reuna sisäkerroksella, tausta `--color-surface-raised`). Määrälukema: Share Tech Mono `1.375rem`, `--color-count`. Hover: `+` ja `−` reunat/täyttö `--color-accent-2`. Fokus: leikkaus pois ja `--focus-ring`. Enimmäismäärä (`aria-disabled`): `+` raidoitettu tausta (`--color-surface-hover`/`--color-surface-raised` vinoraidat) ja `--color-text-muted`-merkki. Aria-disabled-nappi pysyy fokusoitavana, ja fokusrengas näkyy kuten muillakin.

**Painikkeet**: ensisijainen (keltainen), toissijainen (reunallinen), katso 3.4. Kokonaisuuden säännöt: yksi ensisijainen painike per ilmoitus tai tila. Toissijaista käytetään "Sulje", "Lue kokoelma uudelleen" ja "Pyydä pysyvää tallennusta" -toiminnoissa (kuten luvussa 6.4.3). Painikkeiden tekstit ennallaan, ja versaalit ovat vain CSS:ää.

**Ilmoituslaatikot**: katso 3.4. Kokoelman ilmoitukset (luku 6.8) käyttävät samaa komponenttia. "Sulje" on toissijainen painike.

**Tyhjä tila (`.empty`)**: katkoviivareuna, `--color-surface`, kappale ja ensisijainen painike. Ei uusia tekstejä.

**Lataustila**: tilarivi `Haetaan kortteja…`. Valinnainen koriste (V3): sen alle `span.loading-bar` (`aria-hidden="true"`, 4 px korkea `--color-border`-viiva, jossa 35 % leveä `--color-info`-pyyhkäisy). Pyyhkäisy liikkuu vain `no-preference`-tilassa, muuten palkki on paikallaan ja täyttää 35 % vasemmalta. Palkki ei ole edistymismittari eikä kanna tietoa (tila kerrotaan tekstinä ja live-alueella). Palkki näkyy vain LATAUS-tilassa.

**Alatunniste (`.site-footer`)**: yläreuna 1 px `--color-border` ja vasemmalla 3 rem leveä 2 px `--color-accent-edge` -viiva, `--font-size-sm`, `--color-text-muted` (7.18 : 1 tai parempi). Epävirallisuusmerkintä sekakirjaimin Rajdhani, lähdemaininta ("Korttitiedot: Netdeck.gg") Share Tech Mono. Tekstit ennallaan (TXT-002).

**Sivun tausta (`body`)**: `--color-bg` yhdistettynä kolmeen taustakuvaan: syaani hehku oikeassa yläkulmassa (`--page-glow-a`), keltainen hehku vasemmassa yläkulmassa (`--page-glow-b`), hienovarainen vaakaviivapinta (`repeating-linear-gradient`, `--scanline`, 4 px:n välein). `background-attachment: fixed`. Pinta on vain `background-image`, ei päällyskerros, eikä se saa vaikuttaa pointer-tapahtumiin. Kontrasti on laskettu pahimmalla taustavärillä (7.6).

### 7.6 Kontrastilaskelmat

Laskettu WCAG 2.x -suhteella (suhteellinen luminanssi, sRGB) 2026-10-02 molemmille teemoille. Tavoite: teksti ≥ 4.5 : 1, UI-komponentit, fokus ja tilaa kantavat reunat ≥ 3 : 1. "Omistettu" tarkoittaa omistetun rivin sekoitettua taustaa (`--color-owned` taustan päällä, hoverissa `--color-owned-hover`).

**Teksti**

| Väripari | Käyttö | Tumma | Vaalea |
|---|---|---|---|
| `--color-text` / `--color-bg` | Leipäteksti | 17.25 | 16.79 |
| `--color-text` / `--color-surface` | Paneelit | 16.11 | 15.46 |
| `--color-text` / `--color-surface-raised` | Rivin hover, kenttä, chip | 14.69 | 18.16 |
| `--color-text` / `--color-surface-hover` | Hover-tilat (toissijainen painike, chip, − -painike) | 12.63 | 13.41 |
| `--color-text` / omistettu | Omistettu rivi | 15.89 | 16.23 |
| `--color-text` / omistettu hover | Omistettu rivi, hover | 11.69 | 16.77 |
| `--color-text` / `--color-selected-surface` | Valittu chip | 13.32 | 16.38 |
| `--color-text-muted` / `--color-bg` | Alaotsikko, ohje, alatunniste | 8.89 | 7.18 |
| `--color-text-muted` / `--color-surface` | Ohje paneelissa | 8.30 | 6.62 |
| `--color-text-muted` / `--color-surface-raised` | Rivin hover | 7.57 | 7.77 |
| `--color-text-muted` / `--color-surface-hover` | Käytöstä poistettu +, hover | 6.51 | 5.74 |
| `--color-text-muted` / omistettu | Alaotsikko omistetulla rivillä | 8.19 | 6.94 |
| `--color-text-muted` / omistettu hover | Alaotsikko, omistettu hover | 6.03 | 7.18 |
| `--color-text-muted` / `--color-selected-surface` | Valittu chip | 6.87 | 7.01 |
| `--color-on-accent` / `--color-accent` | Ensisijainen painike, + | 16.17 | 15.84 |
| `--color-on-accent` / `--color-accent-2` | Ensisijainen painike, hover | 12.25 | 12.00 |
| `--color-count` / omistettu | Määrälukema omistetulla rivillä | 14.89 | 16.23 |
| `--color-count` / `--color-surface-raised` | Määrälukema rivin hoverissa (omistamaton) | 13.77 | 18.16 |
| `--color-info` / `--color-bg` | Kokoelman yhteenveto | 12.25 | 6.39 |
| `--color-info` / `--color-surface` | Yhteenveto, muistutus | 11.44 | 5.88 |
| `--color-info` / `--color-surface-raised` | | 10.43 | 6.91 |
| `--color-info` / `--color-surface-hover` | Toissijaisen painikkeen alleviivattu hover-reuna tekstinä (ei käytetä), tiedoksi | 8.97 | 5.10 |
| `--color-info` / `--color-selected-surface` | | 9.46 | 6.23 |
| `--color-danger` / `--color-danger-surface` | Virheilmoituksen otsikko | 5.97 | 6.03 |
| `--color-text` / `--color-danger-surface` | Virheilmoituksen teksti | 15.88 | 15.86 |
| `--color-warning` / `--color-warning-surface` | Varoituksen otsikko | 8.63 | 6.03 |
| `--color-text` / `--color-warning-surface` | Varoituksen teksti | 14.80 | 16.98 |
| `--color-header-text` / `--color-header-bg` | Otsikkopalkin teksti | 18.53 | 16.89 |

Taustakuvion pahin tapaus (keltainen hehku taustan päällä): `--color-text-muted` 7.98 : 1 tummalla ja 7.03 : 1 vaalealla. Syaanihehku: kokoelman yhteenveto (`--color-info`) 10.40 : 1 tummalla ja 5.90 : 1 vaalealla. Kaikki selvästi yli 4.5 : 1.

**UI-komponentit, reunat ja fokus (≥ 3 : 1)**

| Väripari | Käyttö | Tumma | Vaalea |
|---|---|---|---|
| `--color-border-strong` / `--color-bg` | Kentän reuna, valintaruudun reuna | 5.15 | 5.05 |
| `--color-border-strong` / `--color-surface` | Reuna paneelissa | 4.80 | 4.65 |
| `--color-border-strong` / `--color-surface-raised` | Chipin reuna | 4.38 | 5.46 |
| `--color-border-strong` / `--color-surface-hover` | Reuna hoverissa | 3.77 | 4.03 |
| `--color-border-strong` / `--color-selected-surface` | Valitun chipin sisällä oleva ruutu | 3.97 | 4.93 |
| `--color-border-strong` / omistettu | Painike omistetulla rivillä | 4.74 | 4.88 |
| `--color-border-strong` / `--color-danger-surface` | Painike virheilmoituksessa | 4.74 | 4.77 |
| `--color-accent-edge` / `--color-bg` | Painikkeen reuna ja valittu valintaruutu taustaa vasten | 16.17 | 16.79 |
| `--color-accent-edge` / `--color-surface` | Painike paneelissa | 15.10 | 15.46 |
| `--color-accent-edge` / `--color-surface-raised` | Painike rivin hoverissa | 13.77 | 18.16 |
| `--color-accent` / `--color-bg` | Keltainen täyttö taustaa vasten (ei tukeuduta vaalealla, reuna kantaa) | 16.17 | 1.06 |
| `--color-on-accent` / `--color-accent` | Ruksi valitussa valintaruudussa | 16.17 | 15.84 |
| `--color-accent-edge` / `--color-accent-2` | Hover-täyttö vasten reunaa | 1.32 | 12.00 |
| `--color-info` / `--color-bg` | Hover-reuna, valitun chipin reuna | 12.25 | 6.39 |
| `--color-focus` / `--color-bg` | **Fokusrengas** | **12.25** | **6.39** |
| `--color-focus` / `--color-surface` | Fokusrengas paneelissa | 11.44 | 5.88 |
| `--color-focus` / `--color-surface-raised` | Fokusrengas rivillä | 10.43 | 6.91 |
| `--color-focus` / omistettu | Fokusrengas omistetulla rivillä | 11.29 | 6.17 |
| `--color-focus` / `--color-danger-surface` | Fokusrengas virheilmoituksessa | 11.28 | 6.03 |
| `--color-focus` / `--color-warning-surface` | Fokusrengas varoituksessa | 10.51 | 6.46 |
| `--color-danger` / `--color-bg` | Virheilmoituksen reuna taustaa vasten | 6.48 | 6.38 |
| `--color-danger` / `--color-danger-surface` | Virheilmoituksen reuna | 5.97 | 6.03 |
| `--color-warning` / `--color-warning-surface` | Varoituksen reuna | 8.63 | 6.03 |

**Muut huomiot**
- **Vaalea teema ja keltainen:** keltainen on vaalealla taustalla vain täyttöväri, ja sen erottaa taustasta aina musta reuna (`--color-accent-edge`, 16.79 : 1). Keltaista tekstiä, ohutta keltaista viivaa tai keltaista fokusrengasta ei ole. Siksi vaalealla käytetään tekstinä, hover- ja valintareunoina ja fokuksena tummansyaania `#005f73` (6.39 : 1) eikä kirkasta syaania.
- Fokusrengas piirretään 3 px:n välin (`--focus-offset`) päähän elementistä, joten sitä vasten ei tarvita kontrastia painikkeen väriin. Rengas on 3 px leveä (WCAG 2.4.13).
- Keltaisen (`--color-accent`) ja syaanin (`--color-accent-2`) keskinäinen kontrasti on vain 1.32 : 1, eikä erottelu perustu siihen. Hover erottuu täyttömuutoksesta **ja** alleviivauksesta, fokus renkaasta.
- Koristeelliset viivat ja raidoitus (`--color-border` 1.48 : 1 tummalla ja 1.45 : 1 vaalealla, hehkut, kulmasulut) eivät kanna tietoa, eikä niille ole kontrastivaatimusta. Rivien erottelu perustuu myös sisäväleihin.
- Kortin värinäytteet (3.1.1): tiedoksi. Tieto on aina tekstinä. Vaalealla näytteellä on musta reuna.
- Käytöstä poistettu (`aria-disabled`) + -painike: raidoitettu tausta ja himmeä merkki, jonka kontrasti on ≥ 5.74 : 1. Painike on silti tunnistettavissa, ja sen selittävä ilmoitus tulee live-alueelle (luku 6.4).

### 7.7 Liike ja efektit

Kaikki liike on `@media (prefers-reduced-motion: no-preference)` -ehdon sisällä. Kun käyttäjä pyytää vähemmän liikettä (`reduce`), mitään animaatiota ei ole ja kaikki tila näkyy staattisesti.

| Liike | Määrittely | Rajoitteet |
|---|---|---|
| Värisiirtymät (hover, valinta) | `transition: background-color, color, border-color 0.12s ease-out` | Vain värit. Ei liikettä tai koon muutosta. Ehto: `no-preference`. |
| Painikkeen painallus | `:active { transform: translateY(1px) }` | 1 px, ei animoitu. Pois `reduce`-tilassa kuten kaikki `transform`-siirtymät, käytännössä vaikutus on olematon. |
| Otsikon glitch | `main > h1 { animation: glitch 0.4s steps(1, end) 1; }`. Kehykset: 0 % ei varjoa, 30 % `text-shadow: -2px 0 #ff2a6d, 2px 0 #1fe0ff` ja `translateX(1px)`, 60 % käänteinen ja `translateX(-1px)`, 100 % lepo. | **Kerran** sivun avautuessa (`1`-toisto). Kaksi siirtymää 0,4 s:ssa, ei vilkkumista (WCAG 2.3.1). Ei toistu uudelleenyrityksen tai tilanmuutoksen yhteydessä (animaatio ajetaan vain, kun elementti syntyy. Koodari varmistaa, ettei `h1` mountata uudestaan joka tilanvaihdolla; jos mountataan, glitch rajataan luokalla, joka lisätään vain ensimmäisellä renderöinnillä). Teksti on luettavissa koko ajan (offsetit 2 px). Glitchin varjoväri `#ff2a6d` on tilapäinen koriste. |
| Latauspalkin pyyhkäisy | `transform: translateX(-100% → 290%)`, 1.4 s lineaarinen, ääretön | Vain LATAUS-tilassa ja vain `no-preference`. Pienikokoinen (4 px korkea), ei vilku. Latausindikaattorina se täyttää WCAG 2.2.2:n poikkeuksen (olennainen), eikä kyse ole tiedosta. |

Ei muita animaatioita (ei parallaxia, ei jatkuvaa hehkun sykettä, ei kohinaa, ei siirtymiä sisällön näkyviin tuloon).

### 7.8 Saavutettavuus ja erityistilat

- **Rakenne ennallaan:** otsikkorakenne, maamerkit, fokusjärjestys, live-alueet ja saavutettavat nimet ovat samat kuin luvuissa 4–6. Ulkoasun muutokset eivät lisää tekstiä DOM:iin (koristeet ovat `::before`/`::after`-pseudoelementeissä ilman `content`-tekstiä) eivätkä muuta lukujärjestystä.
- **Versaalit CSS:llä:** `text-transform: uppercase` ei muuta ruudunlukijan lukemaa. Ruudunlukija ei lue versaalitekstiä kirjain kerrallaan.
- **Fokus:** `--color-focus`-rengas (syaani tummalla, tummansyaani vaalealla) 3 px, 3 px välillä, kaikissa interaktiivisissa elementeissä. Viistetyt painikkeet poistavat leikkauksen fokuksessa. Kenttien ja valintaruutujen fokus ei saa leikkautua (ei `clip-path`/`overflow: hidden` vanhemmissa).
- **Kosketuskohteet:** kaikki painikkeet, chipit ja määräpainikkeet vähintään 44 × 44 px.
- **Zoom ja reflow:** sisältö rivittyy kuten ennenkin. Ei kiinteitä leveyksiä tekstille. 320 px:ssä ei vaakavieritystä (varmistettu mallisivulla 320 px:n iframessa kummassakin teemassa), 400 % zoomilla sama asettelu kuin 320 px:ssä. Rajdhani on kapeampi kuin järjestelmäfontti, mutta koot on nostettu (7.4), joten rivitys ei lisäänny merkittävästi. `overflow-wrap: anywhere` säilyy nimisolussa.
- **Tekstin välistys (1.4.12):** ei kiinteitä korkeuksia tekstiä sisältäville elementeille. Painikkeiden korkeus on `min-height`.
- **Windowsin suuri kontrasti / `forced-colors: active`:** painikkeille 2 px `ButtonText`-reuna ja `clip-path: none`, paneeleille ja ilmoituksille 1 px `CanvasText`-reuna, valitun valintaruudun tausta `Highlight`. Taustakuviot, kulmasulut ja raidoitus voivat kadota, mikä on hyväksyttävää, koska ne ovat koristeita.
- **`prefers-contrast: more`:** ei erillistä tyyliä. Pienin tekstikontrasti on jo 5.10 : 1 (vaalea) ja 5.97 : 1 (tumma), UI-kontrasti 3.77 : 1. Jos halutaan, `--color-border-strong` nostetaan, esim. `#9aa1b3`. Kirjataan IDEAS.md:hen.
- **Teemat:** `color-scheme: light dark` pitää selaimen omat osat (vierityspalkit, lomakkeiden oletusosat) teeman mukaisina. Kummankin teeman kontrastit on laskettu (7.6), ja sama axe-ajo tehdään kummassakin teemassa (7.9).
- **Kieli:** `lang="en"` korttinimissä ja tyypeissä säilyy. Rajdhanin latin-alijoukko kattaa Latin-1-merkit (ä, ö, å, á, é, ó).
- **Tulostus:** ei erillistä tulostustyyliä (tulostus on selaimen asetusten varassa). Ei kuulu tähän tehtävään.

### 7.9 Ohje Koodarille

Pidä toiminta, DOM-rakenne ja tekstit ennallaan (`src/ui/texts.ts` ei muutu). Muutokset ovat pääosin `src/styles.css`:ssä ja fonttitiedostoissa. Tarvittavat pienet luokkalisäykset (ei toimintalogiikkaa):

1. **Tokenit ja perustyylit:** korvaa `:root`-lohko luvun 3 tokeneilla. **Vaalea teema on oletus `:root`-lohkossa, ja tumma teema tulee `@media (prefers-color-scheme: dark) { :root { … } }` -lohkoon** (kuten nykyisessä toteutuksessa). Aseta `color-scheme: light dark`. Mallisivun `:root:not([data-theme=light])`- ja `[data-theme=…]`-säännöt, teemapainikkeet ja skripti ovat vain mallisivua varten, **älä kopioi niitä**. Kopioi komponenttityylit mallisivulta (`.spec*`, `.frame`, `.chips`, `.chip`, `.row`, `.state-demo`, `.spec-bar`, `.type-sample`, `.sbs-view` ja `body.embedded`/`body.sbs` jäävät pois). Säilytä `@media (prefers-reduced-motion: reduce)` -turvaverkko.
2. **Fontit:** lataa kolme woff2-tiedostoa (7.4: Rajdhani 500, Rajdhani 700, Share Tech Mono 400) hakemistoon `src/assets/fonts/`, lisää `@font-face`-säännöt `styles.css`:n alkuun (suhteelliset `url(./assets/fonts/…)`), lisää OFL.txt-tiedostot samaan hakemistoon ja lisenssirivit CONTENT.md:hen (Rajdhani: Copyright (c) 2014, Indian Type Foundry; Share Tech Mono: Copyright (c) 2012, Carrois Type Design). Tarkista, ettei buildissa synny `data:`-fontteja.
3. **Otsikkopalkki (`App.tsx`):** kääri sovelluksen nimi `<span className="brand">`-elementtiin. Keltainen merkki on `.site-header .container::before`. Maamerkit ja teksti ennallaan. Otsikkopalkki on musta (`--color-header-bg`) kummassakin teemassa.
4. **Hakulomake (`CardFilters.tsx`):** lisää `<form>`-elementille luokka `panel` (`className="card-filters panel"`). Mallisivulla Tyyppi- ja Väri-ryhmät ovat `div.fieldsets`-käärössä, joka asettaa ne rinnakkain, kun tilaa on (≥ 40 rem). Kääre on valinnainen: ilman sitä ryhmät pinoutuvat. Valintaruutu-labelit ovat jo `.option`-luokassa. "Vain omistetut" -labelin (`.owned-only .option`) tyyli on mallisivulla.
5. **Omistettu rivi (`CardList.tsx`):** lisää `<tr>`-elementille luokka `is-owned`, kun rivillä on määrä > 0 ja kokoelma on `ready`-tilassa (tieto on jo saatavilla `owned.countOf(card)`-kutsulla). Pelkkä luokka, ei uutta logiikkaa.
6. **Latauspalkki (V3):** `<span className="loading-bar" aria-hidden="true" />` LATAUS-tilassa tilarivin jälkeen.
7. **Painikkeet:** `.button-primary`, `.step-plus`, `.button-secondary` ja `.step-minus` tarvitsevat `position: relative; isolation: isolate` ja `::before`-täytön (3.4). `:focus-visible`-tyyli (`clip-path: none`) pitää olla luettu **myöhemmin** kuin perustyyli. Tarkista fokus näppäimistöllä kaikissa painikkeissa (myös `aria-disabled` + -painike) kummassakin teemassa.
8. **Glitch:** älä anna `h1`:n mountautua uudelleen tilanvaihdoissa glitchin vuoksi (7.7). Nykyinen `CatalogView` pitää `h1`:n paikallaan, joten pelkkä `main > h1 { animation }` riittää. Ellei, rajaa luokkaan.
9. **Ei kovakoodattuja arvoja:** kaikki värit, välit ja koot tokeneista. ~~Poikkeukset: glitchin varjovärit ja koristeviivojen keltainen.~~ → 2026-10-02: nekin ovat tokeneita (`--color-glitch-a`, `--color-glitch-b`, `--color-brand-yellow`, 3.1). Poikkeuksia ei ole.
10. **Testit:** olemassa olevien testien pitää mennä läpi. Uusia toimintatestejä ei tarvita. Aja axe-core kummassakin teemassa (Playwrightin tai selaimen `prefers-color-scheme`-emulointi) ja tarkista käsin 320 px, 400 % zoom, näppäimistöpolku ja `prefers-reduced-motion: reduce`.

### 7.10 Päätökset ja avoimet kysymykset

**Päätetty (D-011, 2026-10-02):** V1 sovelluksessa on sekä vaalea että tumma teema, ja ne seuraavat `prefers-color-scheme`-asetusta. V2 fontti on Rajdhani. V3–V8 hyväksytty alla olevilla oletuksilla.

| # | Kysymys | Päätös |
|---|---|---|
| V1 | Teemat | Vaalea ja tumma (7.3). ~~Vain tumma~~ → hylätty D-011:ssä. |
| V2 | Fontit | Rajdhani (teksti), Share Tech Mono (luvut ja tilarivit) (7.4). |
| V3 | Latauspalkki (koriste) | Kyllä, voi jättää pois ilman muita muutoksia. |
| V4 | Sisältöleveys 48 rem → 56 rem | Kyllä. |
| V5 | Otsikon glitch kerran sivun avautuessa | Kyllä, `reduce`-tilassa ei animaatiota. |
| V6 | Kortin värinäyte viistettynä neliönä | Kyllä. |
| V7 | Omistettujen rivien korostus (kisko ja tausta) | Kyllä. |
| V8 | UX-006 (mobiilin suodattimien korkeus) | Ei muuteta, T-018 hoitaa. |

**Uudet avoimet kysymykset (PM ratkaisee, oletus valittu):**

| # | Kysymys | Oletus |
|---|---|---|
| V9 | Rajdhani Medium (500) leipätekstinä 18 px:n koossa ja 16 px:n vähimmäiskoko (aiemmin 14 px). Tämä kasvattaa tekstin tilantarvetta, ja pitkät nimet rivittyvät useammin 320 px:ssä. | **Kyllä.** Luettavuus voittaa tiiviyden. |
| V10 | Kokoelman yhteenveto ("Kokoelmassa 2 eri korttia, yhteensä 3 kappaletta.") on Share Tech Monolla, vaikka se on lause. | **Kyllä** (tilarivi). Voi vaihtaa Rajdhaniin ilman muita muutoksia. |
| V11 | Vaalealla teemalla otsikkopalkki on musta (ei vaalea). | **Kyllä**: sama tunnistettava kehys molemmissa teemoissa. |

### 7.11 Rajaukset

- Ei uusia toimintoja, näkymiä tai tekstejä.
- Ei pelin logoja, kuvia, ääntä, tavaramerkkejä eikä pelin omia fontteja.
- Ei uusia npm-riippuvuuksia. Fontit ovat staattisia tiedostoja.
- Jatkoideat (`prefers-contrast`-tuki, tulostustyyli, siirtymäanimaatiot, teemavalitsin) on kirjattu `docs/IDEAS.md`:hen.

### 7.12 Katselmoinnin havainnot ja suositukset (UX-004, 2026-10-02)

Raportti: `docs/reports/UX-004-t021-ulkoasu.md`. Toteutus vastaa tämän luvun ja luvun 3 määrittelyä. Ratkaisut, jotka kuuluvat määrittelyyn:
- **Siirtymät ja `:active`-siirtymä** ovat `prefers-reduced-motion: no-preference` -ehdon sisällä (3.3, 3.5, 7.7). Mallisivu oli tässä väljempi. Toteutus on oikein, ja mallisivu on vain havainnollistus.
- **Tyyppi- ja Väri-ryhmät** rivittyvät työpöydälläkin allekkain, koska 56 rem:n leveyteen ne eivät mahdu rinnakkain. Tämä on hyväksytty ratkaisu (rivien väli sama kuin pinottuna, 3.4).
- **Mobiilin rivikorkeus ja lista:** Rajdhanin korotetut koot (V9) kasvattivat kapean näkymän riviä 104 px:stä 140 px:iin ja korttilistan ensimmäisen rivin sijaintia 934 px:stä 1284 px:iin (320 px). Suositus UX-007: tiivistä kapean rivin tyyppi-, väri- ja hintarivit (esim. `display: flex; flex-wrap: wrap; column-gap: var(--space-2)` yhdelle riville) ja rivin pystysisäväli `--space-2`.
- **Tekstin suurennus (vain teksti) 200 % kapealla näytöllä:** vaakavieritystä syntyy 320 px:ssä (531 px, ennen T-021:tä 495 px). Suositus UX-008: `.count-control`in varattu `min-width` ei saa kasvaa `rem`-yksiköissä kapealla asettelulla, painikkeet `max-width: 100%` ja `white-space: normal`, chipit saavat rivittyä.

---

## 8. Teemavalitsin (T-025, D-012)

> Lisätty versiossa 0.9 · 2026-10-02. Tämä luku **korvaa** luvun 3 lauseen "vaalea teema on oletus ja tumma seuraa `prefers-color-scheme`-asetusta, erillistä teemavalitsinta ei ole" ja luvun 7.3 teemapäätöksen "seuraa selaimen asetusta" (D-012 kohta 4 muuttaa D-011:n kohtaa 2). Tokenien **arvot** eivät muutu, vain se, mikä teema on oletus ja miten toinen otetaan käyttöön. Lukujen 4–7 toiminta, rakenne ja tekstit säilyvät.

### 8.1 Tavoite ja päätökset

Käyttäjä näkee tumman Cyberpunk-teeman ensimmäisellä käynnillä laitteen asetuksesta riippumatta ja voi vaihtaa vaaleaan yhdellä näkyvällä painikkeella. Valinta säilyy.

| # | Päätös | Perustelu |
|---|---|---|
| T1 | **Oletus on tumma, aina.** `prefers-color-scheme` ei vaikuta mihinkään. | D-012 kohta 4 ja kortin ensimmäinen kriteeri. Tumma on pelin tunnistettavin ilme. |
| T2 | **Kolmatta vaihtoehtoa "laitteen mukaan" ei tehdä.** | (a) D-012 määrää oletuksen tummaksi laitteesta riippumatta, joten "laitteen mukaan" olisi toinen oletus. (b) Kolmitilainen kontrolli vaatii radioryhmän tai kiertävän painikkeen, jossa nykyinen ja seuraava tila sekoittuvat, ja se vie otsikkopalkista tilaa 320 px:ssä. (c) Vaaleaa haluava valitsee sen kerran, ja valinta säilyy. Ehdotus on kirjattu `docs/IDEAS.md`:hen. |
| T3 | **Kontrolli on yksi vaihtopainike** (`<button type="button" aria-pressed>`) otsikkopalkin oikeassa reunassa. Radioryhmää ja `role="switch"`-ratkaisua ei käytetä. | Kaksi tilaa, yksi painike: pienin kontrolli, joka mahtuu 320 px:iin. `aria-pressed` on vakiintunut kaksiasentoiselle vaihtopainikkeelle, ja nimi pysyy samana tilasta riippumatta (nimi, joka muuttuu `aria-pressed`-tilan mukana, sekoittaa ruudunlukijan). `role="switch"` vaatisi "päällä/pois"-ajattelun, joka ei sovi teemaan. |
| T4 | **Painikkeen nimi on "Vaalea teema".** Tila "painettu" tarkoittaa, että vaalea teema on käytössä, ja "ei painettu" että tumma (oletus) on käytössä. | Painike nimeää sen, minkä käyttäjä voi ottaa käyttöön. Oletus on tumma, joten poikkeama (vaalea) on se, mikä kytketään päälle. |
| T5 | **Ei live-ilmoitusta.** | Ruudunlukija ilmoittaa `aria-pressed`-muutoksen fokusoidusta painikkeesta itse ("Vaalea teema, vaihtopainike, painettu"). Erillinen `aria-live` antaisi tuplailmoituksen. Fokus pysyy painikkeessa, ja sama elementti säilyy (ei uudelleenmontausta). |
| T6 | **Ei välähdystä latauksessa:** staattinen `data-theme="dark"` HTML:ssä ja pieni ulkoinen skripti `<head>`issa, joka ottaa tallennetun vaalean valinnan käyttöön ennen ensimmäistä piirtoa (8.7). | CSP (`script-src 'self'`, `style-src 'self'`) kieltää inline-skriptit ja `style`-attribuutit, mutta saman originin tiedosto kelpaa. |

### 8.2 Polku

```
Ensimmäinen käynti
  → sivu piirtyy tummana (laitteen asetuksesta riippumatta)
  → painike [☼ Vaalea] "ei painettu"
      └─ käyttäjä painaa → vaalea teema heti, painike "painettu", valinta tallennetaan
Seuraava käynti tai sivun päivitys
  ├─ tallennettu "light"                          → sivu piirtyy heti vaaleana (ei tummaa välähdystä)
  ├─ tallennettu "dark", ei mitään tai tuntematon → tumma
  └─ tallennus ei käytössä (estetty tai epäonnistuu) → vaihto toimii istunnon ajan, uusi käynti alkaa tummana
```

### 8.3 Sijainti ja rautalanka

Painike on `<header>`in sisällä, `.container`-rivin viimeinen elementti (DOM-järjestys: koristemerkki → sovelluksen nimi → painike), tasattu oikealle (`margin-inline-start: auto`, `flex: none`). Se on ensimmäinen sarkainpysähdys sivulla. Ei omaa `<nav>`-elementtiä eikä otsikkoa. Otsikkopalkki on musta kummassakin teemassa, joten painikkeen värit eivät riipu teemasta (8.5).

```
320 px, yksi rivi (tavoite, jos mahtuu):
┌────────────────────────────────┐
│ ◢ CYBERDECK         [☼ VAALEA] │  musta otsikkopalkki, keltainen viiva alla
└────────────────────────────────┘
>= 640 px (40 rem):
┌──────────────────────────────────────────────────────┐
│ ◢ CYBERDECK                         [☼ VAALEA TEEMA] │
└──────────────────────────────────────────────────────┘
Jos ei mahdu (esim. 200 % tekstin suurennus tai 400 % zoom), rivitys sallittu:
┌────────────────────────────────┐
│ ◢ CYBERDECK                    │
│                    [☼ VAALEA]  │  painike omalle riville oikeaan reunaan
└────────────────────────────────┘
```

- `.site-header .container` saa `flex-wrap: wrap` ja `row-gap: var(--space-2)`. Vaakavieritystä ei saa syntyä missään leveydessä (320 px, 200 % ja 400 % zoom). Yhden rivin ei tarvitse säilyä, mutta Koodari mittaa 320 px:ssä ja kirjaa, mahtuuko se (arvio: merkki 18 px + väli 12 px + nimi noin 140 px + väli 12 px + painike noin 105 px = noin 287 px, käytettävissä 288 px, eli erittäin tiukka). Jos ei mahdu, rivitys on hyväksytty ratkaisu, eikä sisäväliä tai nimen kirjainväliä muuteta sen vuoksi.
- Korkeus: painikkeen vähimmäiskorkeus ja -leveys `--target-min` (44 px). Otsikkopalkin pystysisäväli `--space-3` säilyy, jolloin palkki kasvaa noin 57 px:stä noin 68 px:iin. Fokusrenkaalle (3 px + 3 px väli) jää 12 px tilaa ylä- ja alapuolelle, eikä mikään leikkaa sitä (`overflow` ei ole asetettu).

### 8.4 Painikkeen sisältö, tekstit ja ikoni

**DOM (tarkka rakenne):**

```html
<button type="button" class="theme-toggle" aria-pressed="false">
  <svg class="theme-toggle-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
          stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none" />
  </svg>
  <span><span>Vaalea</span> <span class="theme-toggle-suffix">teema</span></span>
</button>
```

> Päivitetty T-025:n katselmoinnissa (UX-005): toteutuksessa tekstit ovat yhden kääre-`span`in sisällä ja sanaväli on oma tekstisolmunsa. Alkuperäinen rakenne (välilyönti jälkiliitteen sisällä) antoi flex-`gap`in ja `dom-accessibility-api`n kanssa nimen "Vaaleateema". Toteutuksen rakenne on hyväksytty.

- **Saavutettava nimi** tulee sisällöstä: `Vaalea teema`. Ikoni on `aria-hidden`, eikä `aria-label`ia käytetä, jotta nimi sisältää näkyvän tekstin (WCAG 2.5.3). Tilan ilmoittaa vain `aria-pressed="true"` (vaalea käytössä) tai `"false"` (tumma käytössä). Attribuutti on aina olemassa. Ei `title`-attribuuttia (ei toimi kosketuksella eikä näppäimistöllä).
- **Teksti:** näkyvä `Vaalea` ja jälkiliite ` teema`. Jälkiliite näkyy vain ≥ 40 rem:n leveydellä. Alle 40 rem:n se piilotetaan visuaalisesti `.visually-hidden`-tyylillä (3.4), mutta se jää ruudunlukijalle, joten nimi on kaikilla leveyksillä `Vaalea teema`. Tekstit lisätään `src/ui/texts.ts`:ään: `themeToggleLabel: 'Vaalea'` ja `themeToggleSuffix: 'teema'` (välilyönti tuotetaan rakenteessa, ei merkkijonossa). Versaalit CSS:llä (`text-transform: uppercase`, kuten painikkeet), `--font-size-sm`, `--font-weight-bold`, `--letter-spacing-button`. Sana "teema" lisätään CONTENT.md:n sanastoon (Sisällöntuottaja).
- **Ikoni:** inline-SVG yllä, ei ulkoisia resursseja eikä kuvatiedostoa tai data-URI:a. Piirtovärinä `currentColor`. Koko 20 × 20 px, väli tekstiin `--space-2`. **Tilan erottelu ilman väriä:** `aria-pressed="false"` → ympyrä on ääriviiva (`fill: none`). `aria-pressed="true"` → ympyrä on täytetty (CSS: `.theme-toggle[aria-pressed='true'] .theme-toggle-icon circle { fill: currentColor; }`). CSP sallii tämän, koska täyttö tulee tyylitiedostosta eikä `style`-attribuutista.
- Ikoni on aurinko (vaalea teema). Kuuta ei tarvita, koska kontrolleja on yksi ja teksti kertoo, mitä se tekee.
- **CSP-huomio Koodarille:** `style-src 'self'` estää myös `style="…"`-attribuutit. Älä käytä Reactin `style`-propia painikkeessa tai muualla. Kaikki tyylit tyylitiedostossa.

### 8.5 Ulkoasu (tokenit, tilat, kontrastit)

Painike ei käytä teemakohtaisia sivupintoja, koska otsikkopalkki on musta kummassakin teemassa. **Uusia tokeneita ei tarvita:** painike käyttää olemassa olevia otsikkopalkin ja korostuksen tokeneita. Rakenne on sama kuin toissijaisella painikkeella (3.4): painikkeen tausta on reuna, `::before` (`inset: 2px`, `--shape-chamfer-inner-2`, `z-index: -1`, `isolation: isolate` painikkeessa) on täyttö, ulkomuoto `clip-path: var(--shape-chamfer)`. Paikalliset muuttujat `.theme-toggle`ssa: `--toggle-edge`, `--toggle-fill`, `--toggle-text`.

| Tila | `--toggle-edge` | `--toggle-fill` | `--toggle-text` | Muu |
|---|---|---|---|---|
| Ei painettu (tumma käytössä), lepo | `--color-header-text` | `--color-header-bg` | `--color-header-text` | Ikoni ääriviiva |
| Ei painettu, hover | `--color-accent-2` | `--color-header-bg` | `--color-accent-2` | `text-decoration: underline` |
| Painettu (vaalea käytössä), lepo | `--color-accent` | `--color-accent` | `--color-on-accent` | Ikoni täytetty |
| Painettu, hover | `--color-accent-2` | `--color-accent-2` | `--color-on-accent` | `text-decoration: underline` |
| Aktiivinen (painettu alas) | sama kuin tila | sama | sama | siirtyy 1 px alas (vain `no-preference`) |
| Fokus (`:focus-visible`) | sama kuin tila | sama | sama | `clip-path: none`, `outline: 3px solid var(--color-accent-2)`, `outline-offset: var(--focus-offset)` |

**Fokusrengas on tässä `--color-accent-2`, ei `--color-focus`**, koska rengas piirtyy mustaa otsikkopalkkia vasten, ja vaalean teeman `--color-focus` (`#005f73`) olisi mustaa vasten vain 2.63 : 1 (alle 3 : 1). Kaikki ratkaisut ovat samat kummassakin teemassa, koska otsikkopalkki on musta (`#000000` tummalla, `#0e0f14` vaalealla).

Kontrastit (laskettu WCAG 2.x -kaavalla 2026-10-02):

| Väripari | Käyttö | Tumma | Vaalea |
|---|---|---|---|
| `--color-header-text` / `--color-header-bg` | Teksti ja reuna, lepo | 18.53 | 16.89 |
| `--color-accent-2` / `--color-header-bg` | Hover-teksti ja -reuna, fokusrengas | 13.16 | 12.00 |
| `--color-on-accent` / `--color-accent` | Painettu, teksti ja ikoni | 16.17 | 15.84 |
| `--color-on-accent` / `--color-accent-2` | Painettu hover, teksti ja ikoni | 12.25 | 12.00 |
| `--color-accent` / `--color-header-bg` | Painetun täyttö otsikkopalkkia vasten | 17.37 | 15.84 |

Kaikki ≥ 3 : 1 (UI) ja ≥ 4.5 : 1 (teksti). Tila ei välity pelkällä värillä: painettu = täytetty ikoni ja täytetty tausta, ei painettu = ääriviivaikoni ja täyttämätön tausta. `forced-colors: active` -tilassa taustavärit ylikirjoittuvat, mutta ikonin täyttö (`currentColor`) erottaa tilat edelleen. Hover ei perustu pelkkään väriin (alleviivaus).

Siirtymät (`--ease`, 0.12 s) vain `prefers-reduced-motion: no-preference` -ehdon sisällä, kuten muissa painikkeissa (3.5). **Teeman vaihtoon ei lisätä omaa animaatiota** (ei häivytystä eikä pyyhkäisyä): teema vaihtuu heti. Mikään ei vilku.

### 8.6 Toiminta

- Painallus (Enter, väli, hiiri, kosketus) vaihtaa teeman: `aria-pressed` kääntyy ja `<html>`-elementin `data-theme` vaihtuu (`light` tai `dark`) **heti ja synkronisesti** painalluksen yhteydessä, ennen tallennusta. Tallennus tehdään sen jälkeen. Tallennuksen epäonnistuminen ei peruuta vaihtoa.
- **Tallennuksen epäonnistuessa** (SR-13: tallennus estetty, kiintiö täynnä, muistinvarainen tila) teema pysyy vaihdettuna istunnon ajan. **Erillistä virheilmoitusta ei näytetä**, koska menetys on vähäinen (teema palaa tummaksi) eikä ilmoitus palvele käyttäjää. Virhe kirjataan vain `console.warn`-kutsulla ilman tarpeettomia tietoja. Jos selainmuistutus (6.7) on muutenkin näkyvissä, se kattaa asian.
- Sovellus ei kuuntele laitteen `prefers-color-scheme`-asetusta.
- Tuntematon tai korruptoitunut tallennettu arvo → tumma. Arvoa ei kirjoiteta uudelleen ennen kuin käyttäjä vaihtaa teeman.
- Toinen välilehti: muutos näkyy toisessa välilehdessä vasta sivun päivityksessä (`storage`-tapahtuman kuuntelua ei vaadita). Idea kirjattu `docs/IDEAS.md`:hen.

### 8.7 Välähdyksen esto ja tallennus (Koodarille ja Arkkitehdille)

**Ratkaisu (suositus, tarkka):**

1. `index.html`: `<html lang="fi" data-theme="dark">`. Tumma on siis oletus ilman skriptiä, ja CSS:ssä `:root` on tumma (8.8).
2. Uusi tiedosto `public/theme-init.js` (Vite kopioi sellaisenaan `dist/`in juureen). Ladataan **`<head>`issa ennen tyylitiedostoa** tavallisena synkronisena skriptinä: `<script src="/theme-init.js"></script>` (ei `type="module"`, ei `defer`, ei `async`, koska muuten se ei ehdi ennen ensimmäistä piirtoa). Saman originin tiedostona se sopii CSP:hen `script-src 'self'`, eikä CSP:tä muuteta. Koodari tarkistaa, että Vite jättää viittauksen ennalleen (`dist/index.html`).
   ```js
   // Applies the saved light theme before the first paint (UX.md 8.7). Reads one key, writes nothing.
   try {
     if (window.localStorage.getItem('cyberdeck:theme') === 'light') {
       document.documentElement.setAttribute('data-theme', 'light');
     }
   } catch (error) {
     // Storage blocked: stay on the dark default.
   }
   ```
3. **Tallennusavain:** `cyberdeck:theme`, arvo raakamerkkijono `light` tai `dark` (ei versioitua JSON-käärettä, koska esilataus ei saa riippua kääreen jäsentämisestä). Avain ja arvot määritellään yhdessä paikassa tallennuskerroksessa (`src/storage/keys.ts`). Yksikkötesti lukee `public/theme-init.js`:n tekstin ja varmistaa, että siinä on sama avain ja arvo `light`, jotta kopiot eivät eriydy.
4. **SR-12-poikkeama (avoin kysymys A1):** `public/theme-init.js` lukee `localStorage`a tallennuskerroksen ulkopuolella (lint-sääntö ei koske `public/`-hakemistoa). Perustelu: vain luku, yksi avain, ei dataa eikä henkilötietoa (SR-16 täyttyy), ja ilman sitä vaalean valinnan tehnyt näkisi tumman välähdyksen jokaisella latauksella. Kaikki kirjoitus ja varsinainen asetuksen hallinta ovat tallennuskerroksessa. **Varavaihtoehto, jos poikkeamaa ei hyväksytä:** skripti jätetään pois. Silloin sivu piirtyy aina tummana ja React vaihtaa vaaleaan ensimmäisen renderöinnin jälkeen (tumma välähdys vaalean valinnan tehneille). Kortin kriteeri 4 sallii tämän ("jos se on mahdollista").
5. React alustaa tilan synkronisesti `document.documentElement.dataset.theme`-arvosta (`'light'` → vaalea, muu → tumma), jotta ensimmäinen renderöinti vastaa jo piirrettyä. Sen jälkeen se lukee tallennuskerroksesta (`preferences.loadTheme()`) ja korjaa tilan, jos arvo poikkeaa (kattaa tilanteet, joissa skripti puuttuu, kuten testit). `data-theme`-attribuutin asettaminen on DOM-toiminto, ei tallennusta, joten se saa olla UI-koodissa.

**Tallennuskerroksen rajapintalisäys (Koodarille, `src/storage/types.ts` ja `index.ts`; Arkkitehti saa tarkistaa):**

```ts
export type Theme = 'dark' | 'light';

export interface PreferencesRepository {
  /** Saved theme, or 'dark' when nothing valid is saved. Never rejects because of storage problems. */
  loadTheme(): Promise<Theme>;
  /** Resolves with the saved theme. Rejects with StorageError when saving fails (the UI keeps the theme for the session). */
  saveTheme(theme: Theme): Promise<Theme>;
}
// Repositories gets a new field: preferences: PreferencesRepository
```

- `openBrowserRepositories()` ja `createMemoryRepositories()` täydennetään, ja muistinvarainen toteutus palvelee testejä.
- Tuntematon arvo (muu kuin `light` tai `dark`) luetaan `'dark'`ksi eikä sitä korjata. Ei `sessionStorage`a eikä evästeitä.
- PRIVACY.md:n tietoinventaarioon uusi rivi: `cyberdeck:theme` (teemavalinta, ei henkilötieto). Digiturva päivittää.

### 8.8 CSS-rakenne (tokenit)

Tokenien arvot pysyvät täsmälleen entisinä, vain valinta muuttuu:

- `:root` sisältää yhteiset tokenit ja **tumman teeman arvot** (nykyisen `@media (prefers-color-scheme: dark)` -lohkon arvot), ja `color-scheme: dark`.
- `:root[data-theme='light']` ylikirjoittaa vaalean teeman arvot (nykyisen `:root`in vaaleat arvot) ja asettaa `color-scheme: light`. Täsmällisyys (0,2,0) voittaa `:root`in.
- `@media (prefers-color-scheme: dark)` -lohko **poistetaan kokonaan**. Tyylitiedoston alun kommentit päivitetään. Luvun 3 johdanto ja luvun 7.3 teemapäätös on merkitty tämän luvun mukaisesti (v0.9).
- Jos `data-theme`-attribuutti puuttuu tai on tuntematon (testit, virhe), käytössä on tumma.
- Komponenteilla ei saa olla omia teemasääntöjä, kuten tähänkin asti.

### 8.9 Saavutettavuusvaatimukset (tarkistuslista Koodarille)

- [ ] Painike on `<button type="button">` ja `<header>`in sisällä. Ei `div`- eikä `a`-elementtiä. Ei uutta otsikkoa eikä uutta maamerkkiä (`<nav>`ia ei lisätä).
- [ ] Saavutettava nimi `Vaalea teema` kaikilla leveyksillä (jälkiliite jää ruudunlukijalle alle 40 rem:n). `aria-pressed` on aina olemassa (`"true"` tai `"false"`). Nimi ei vaihdu tilan mukana. Ikoni `aria-hidden="true"` ja `focusable="false"`.
- [ ] Testi: `getByRole('button', { name: 'Vaalea teema', pressed: false })` löytyy ensimmäisellä käynnillä.
- [ ] Ei `aria-live`-aluetta eikä tilan ilmoitusta muuhun alueeseen (T5). Fokus pysyy painikkeessa painalluksen jälkeen, ja sama DOM-elementti säilyy (ei `key`-vaihtoa eikä ehdollista renderöintiä).
- [ ] Sarkaimella painike on ensimmäinen pysähdys. Enter ja väli vaihtavat. Fokusrengas näkyy (3 px, `--color-accent-2`) eikä leikkaudu (`clip-path: none` fokuksessa).
- [ ] Kosketusalue vähintään 44 × 44 px (`--target-min`) 320 px:ssä ja 200 % zoomilla.
- [ ] Ei vaakavieritystä 320 px:ssä, 200 % zoomilla eikä 400 % zoomilla. Rivitys sallittu (8.3). Tekstin välistyksen muutokset (1.4.12) eivät katkaise tekstiä.
- [ ] Hover ei perustu pelkkään väriin (alleviivaus). Tila näkyy ikonin ja painikkeen täytöstä (1.4.1).
- [ ] Kontrastit 8.5:n taulukon mukaiset. axe ajettu kummassakin teemassa (oletus ja `data-theme="light"`) ilman virheitä.
- [ ] `prefers-reduced-motion`: ei omaa teemanvaihtoanimaatiota. Siirtymät vain `no-preference`-ehdon sisällä.
- [ ] Ei `style`-attribuutteja eikä inline-skriptiä (CSP). Buildin jälkeen `dist/theme-init.js` on olemassa ja `dist/index.html` viittaa siihen ennen tyylitiedostoa.
- [ ] Tallennettu `light` → ensimmäinen piirto on vaalea (tarkista `npm run preview`issä tai esikatselussa: ei tummaa välähdystä, esim. Performance-paneelin kuvakaappauksilla).
- [ ] Testit: (1) oletus on tumma, vaikka `matchMedia('(prefers-color-scheme: light)')` palauttaa `matches: true`. (2) Painallus vaihtaa `data-theme`in ja `aria-pressed`in. (3) Valinta tallennetaan, ja uusi `App`-renderöinti tallennetuilla arvoilla alkaa vaaleana. (4) Tallennus epäonnistuu (`saveTheme` hylkää) → teema silti vaihtuu, ei virhenäkymää. (5) Tuntematon arvo → tumma. (6) `theme-init.js`:n avain vastaa `keys.ts`:ää. (7) axe molemmissa teemoissa.
- [ ] Koodikatselmoija varmistaa, että tokenien arvot ovat täsmälleen ennallaan (diff) ja että `@media (prefers-color-scheme: dark)` on poistettu.

### 8.10 Avoimet kysymykset (oletus valittu, PM ratkaisee)

| # | Kysymys | Oletus |
|---|---|---|
| A1 | Hyväksyvätkö Digiturva ja Arkkitehti sen, että `public/theme-init.js` lukee `localStorage`a tallennuskerroksen ulkopuolella (SR-12-poikkeama, 8.7 kohta 4)? | Kyllä: vain luku, yksi avain. Jos ei: varavaihtoehto (ei skriptiä, vaalean valinnan tehneille tumma välähdys). |
| A2 | Raakamerkkijono `light` tai `dark` avaimessa `cyberdeck:theme` (ei versioitua käärettä)? | Kyllä: esilataus ei saa riippua kääreen jäsentämisestä, eikä arvo ole data. Arkkitehti voi muuttaa. |
| A3 | Näytetäänkö viesti, kun teeman tallennus epäonnistuu? | Ei (8.6). Vaikutus on vähäinen. |
| A4 | "Laitteen mukaan" -vaihtoehto ja teeman synkronointi välilehtien välillä? | Ei (T2, 8.6). Kirjattu `IDEAS.md`:hen. |
| A5 | Lisätäänkö `<meta name="theme-color" content="#000000">` (otsikkopalkki on musta kummassakin teemassa)? | Ei tässä tehtävässä (laajuus). Kirjattu `IDEAS.md`:hen. |
