# UX-T181: Koko sivuston UX-katselmointi ja visuaalinen suunta

**Tekijä:** UX- ja visuaalinen suunnittelija (aliagentti, T-181a) · **Päivä:** 2026-10-19 · **Haara:** `test` (4dd969b, paikallinen `vite`)
**Tavoite (käyttäjä):** näkymät mahtuvat pääsääntöisesti yhdelle ruudulle (korttikuvat ja listat saavat vieriä), kaikki toimii sujuvasti, näyttää hyvältä ja tuntuu Cyberpunkilta. Isot ja kolhot laatikot pois. Ei uusia liikkuvia koriste-elementtejä, käytettävyys aina ensin.
**Pysyvät linjaukset:** koko leveys käyttöön, ei sisäisiä vieritysalueita, ei vaakaylivuotoa 320 px:ssä, kontrasti AA, fokus näkyy, näppäimistö toimii, `prefers-reduced-motion` kunnioitetaan, ei uusia riippuvuuksia.

> **Kiireellinen löydös (ei odota pakettia 1):** Skannerin dialogi on alle 640 px:n leveydellä vain **34 px leveä**, joten kortti- ja kansiosivuskannaus ei toimi puhelimessa ollenkaan (mitattu 320 ja 390 px, 640 px:ssä kunnossa). Syy on T-179:n `.scanner-body { container-type: inline-size; }` (styles.css r. ~12775). Inline-size-containment nollaa laatikon sisältöleveyden, ja dialogin `display: grid` -automaattisarake kutistuu sen mukaan (`grid-template-columns` = `34px`). **Korjaus:** `.scanner-dialog[open] { grid-template-columns: minmax(0, 1fr); }` ja `.scanner-body { inline-size: min(36rem, 100%); }`. Lisäksi tarvitaan regressiotesti `styles.ux174.test.ts`:n tapaan. Korjaus on tehty jo tuotantoon julkaistuun ominaisuuteen, joten se kannattaa viedä omana pikakorjauksenaan heti (T-181-0).

---

## 0. Menetelmä ja mittaukset

- **Kuvakaappaukset:** headless Chrome ja CDP. Tiloja on 36 kullakin leveydellä 320×640, 768×1024, 1280×800 ja 1920×1080, sekä tummalla että vaalealla teemalla. Kuvia on yhteensä 512, ja jokaisesta tilasta on sekä ensimmäinen ruutu että koko sivu (enintään 5000 px).
  Kuvat: `…\scratchpad\ux\before\<teema>-w<leveys>-<tila>(-full).png`, mittaukset `before\metrics.json`. Skripti on uudelleenajettava: `node …\scratchpad\ux\capture.mjs after`. Se vaatii, että `npx vite --port 5211` on käynnissä, ja kirjoittaa kansioon `after\`. Yhteenveto: `node summarize.mjs after`. Kopiot skripteistä ovat kansiossa `before\scripts\`.
- **Testidata** syötetään sovelluksen omien moduulien kautta (`/src/storage/index.ts`), joten muoto on aina validi. Kokoelmassa on 114 eri korttia ja 307 kappaletta (Red ja Yellow täynnä), want-listalla 9 korttia, Have-listalla 7, proxy-jonossa 12, lisäksi 3 pakkaa (laillinen, keskeneräinen ja pitkänniminen, jossa sideboard) ja 5 kirjattua peliä.
- **Tilat:** Kortit (ruudukko, lista, suodattimet, merkintätila, korttidialogi), Kokoelma (Omat, Yleiskuva, Kansio, skannerin valinta ja kamera), Pakat (Omat, Tuo-valikko, Kokoaminen, Julkiset), pakkaeditori (perus, Lisää kortteja, Vie-valikko, testikäsi, Kirjaa peli), Goldfish (aloitus ja aloituskäsi), Testaa (Sealed, sealedin avaus, Boosterit, avattu booster, Pelaa yksin), Have/Want (Want, Have) ja Proxy, sekä tyhjät tilat (Kortit, Kokoelma, Pakat, Have/Want ja Proxy).
- **Ei katettu kuvin:** jaetut näkymät (`#/jaa/…`, `#/vaihto/<data>`, `#/v/<id>`) ja julkinen pakka. Niissä käytetään samoja komponentteja (taulukot, paneelit), joten paketti 1 korjaa ne. Niille riittää paketin 5 lopputarkistus.

### 0.1 Mitattu nykytila (tumma teema; "ensisisältö" = ensimmäisen kortin tai rivin yläreuna px, "ruutuja" = sivun korkeus / näkymän korkeus)

| Näkymä | 320 | 768 | 1280×800 | 1920×1080 | Huomio |
|---|---|---|---|---|---|
| Kortit, ruudukko | 382 / 126 | 402 / 47 | 254 / 35 | 254 / 16 | 1280:ssa vain **3** korttia rivillä, 768:ssa 2 ja 320:ssa 1 |
| Kortit, lista | 382 / 36 | 436 / 10 | 288 / 13 | 288 / 9 | Rivi 65 px korkea |
| Kokoelma › Omat | 488 / 99 | 420 / 36 | 320 / 28 | 320 / 13 | |
| Kokoelma › Yleiskuva | 2317 / 14 | 1324 / 4.7 | 1093 / 3.9 | 1007 / 2.4 | Tulisi mahtua yhdelle ruudulle (1280, 1920) |
| Kokoelma › Kansio | 481 / 1.9 | 339 / 1.3 | 243 / 1.5 | 243 / 1.1 | Kansioaukeama ei mahdu 1280×800:aan |
| Pakat | 422 / 3.2 | 270 / 1.3 | 218 / 1.0 | 218 / 1.0 | |
| Pakat › Kokoaminen | 1336 / 4.6 | 726 / 2.0 | 647 / 2.5 | 620 / 1.8 | |
| Pakkaeditori | 782 / 11 | 674 / 5.5 | **550** / 19 | 550 / 12 | Pakan yläosa vie 300 px ennen hakua (yksityisyys ja kirjautumisvihje) |
| Have/Want | 696 / 9.3 | 626 / 3.9 | **526** / 3.0 | 526 / 1.7 | Kolme sisäkkäistä segmenttiriviä |
| Proxy | 504 / 206 | 424 / 25 | 372 / 31 | 372 / 13 | |
| Testaa › Boosterit, avattu | – / 4.2 | – / 1.8 | – / 1.8 | – / 1.3 | 12 kortin booster ei mahdu ruudulle |
| Testaa › Sealed, avaus | – / 3.9 | – / 1.6 | – / 1.6 | – / 1.2 | Paikanpitäjäruudut vievät tilaa |
| Goldfish, aloituskäsi | – / 2.3 | – / 1.05 | – / 1.05 | – / 1.0 | Lähes kunnossa |

- **Sisäinen vieritys:** korttidialogi (320 ja 1280×800), testikäsi (320) ja skanneri (320; dialogin kerros vierii). Malli "dialogikerros vierii kuin sivu" (T-118) on hyväksytty, mutta korttidialogin pitää mahtua 1280×800:aan kokonaan (luku B.2).
- **Vaakaylivuotoa** ei ole missään tilassa (320 px mukaan lukien). Hyvä.
- **Otsikon paikka** on yhtenäinen (h1:n yläreuna 173 px kohdassa 320 ja 93 px kohdassa 1280). Poikkeus on Goldfish (229 / 149), jossa ← Takaisin -linkki on otsikon yläpuolella.
- **Kontrollien korkeuksia on 7 eri kokoa** (1280, kaikki tilat): 44 px (3842 kpl), 32 (3035), 30 (304), 38 (241), 40 (196), 27 (102) ja 56 (151). Tavoite on kaksi kokoa.
- **Fonttikokoja on 13**, ja vaikka UX.md 3.2 sanoo "ei alle 16 px", käytössä on 12 px (4234 tekstisolmua), 13,33 px (8166, natiivit kontrollit ja kortin `select`-oletukset) ja 14 px (1698). Sääntö ja todellisuus eivät vastaa toisiaan, ks. ristiriita R2.
- **Laatikot:** 1280:n tiloissa on 1 500 taustallista tai reunallista vähintään 15 000 px²:n elementtiä. Niistä 400 käyttää 12 px:n paddingia (`.card-box`, `.panel`), ja sisäkkäisiä laatikoita on paljon: paneeli paneelissa (Yleiskuva → tilastolaatikot, pakan tilastot → sormukset → kortit) ja segmentti segmentin alla.
- **Mobiilin yläpalkki** on 165 px (logo- ja työkalurivi + navigaation 2 × 3 riviä × 44 px). Se on 26 % 640 px:n ruudusta ennen kuin mitään sisältöä näkyy.

### 0.2 Läpileikkaavat ongelmat (tärkeysjärjestys)

1. **Korttiruudut ovat liian isoja ja "laatikoituja".** `.card-box` on reunallinen ja taustallinen laatikko, jossa on 12 px:n padding. Kuvan alla on noin 130 px tekstiä (nimi, alanimi, tyyppi-, Power- ja RAM-chipit, Pakoissa ja määrä). Normaali-koko on `--card-min: 18rem`, joten 1280:ssa rivillä on 3 korttia ja 768:ssa 2. Keräilysovelluksessa kuvat ovat pääosassa. Tavoite: 5–6 korttia 1280:ssa ja 2 korttia 320:ssa.
2. **Sivujen yläosat kasvavat korkeiksi** vihjekappaleista ("Linkin saaja näkee…", "Kirjaudu, niin saat…", "Vain sinä näet pakan.", "Kirjaudu sisään Googlella…", "Napsauta korttia lisätäksesi…") ja sisäkkäisistä segmenttiriveistä (Have/Want: Want/Have → Kuvat/Lista + koko → Want-lista/Lisää kortteja). Vihjeet kuuluvat (i)-vihjeeseen tai tilariville.
3. **Paneelit ovat laatikoita laatikoissa.** `.panel` (padding 12/16/16, reuna ja keltainen tikku) kehystää koko osion, jonka sisällä on uusia laatikoita (tilastolaatikot, saavutuskortit). Lopputulos on "kolho". Osion pitäisi olla avoin, ja sen erottaisi **otsikkoviiva**. Laatikko varataan vain objekteille, joita käsitellään (kortti, pakka, dialogi).
4. **Kontrollit eivät ole yhtä kokoa** (7 korkeutta), ja segmenttien 2 px:n kehys on raskas. Toolbarin "Galleria", "Skannaa" ja "Merkitse omat korttisi" ovat isoja kehystettyjä painikkeita, vaikka ne ovat toissijaisia toimintoja.
5. **Pääpainikkeita on liikaa samassa paikassa:** Pakat-listalla jokaisessa kortissa on täysleveä punainen AVAA (3 punaista palkkia rinnakkain), Boosterit-näkymässä koko leveyden 64 px:n punainen palkki. Väri menettää merkityksensä.
6. **Vaalea teema** on samaa beigeä pinnasta toiseen (`--color-bg #f3f0e6`, `--color-surface #ebe7d9`). Pinnat erottuvat vain reunoista, joten hierarkia puuttuu ja paneelit näyttävät pahvilta.
7. **Omistusmerkinnät** (ohut keltainen tai vihreä reuna) ja want-tähti näyttävät halvoilta (käyttäjän palaute, luku E).
8. **Tyhjät ja odottavat tilat** vievät tilaa: Boosterit- ja Sealed-näkymien 12 raidallista paikanpitäjää (270 px korkeita) ennen avaamista, Goldfishin aloituspaneeli 1 920 px:n leveydellä.
9. **Mobiilin yläpalkki** 165 px (kohta 0.1).

### 0.3 Mikä toimii jo ja säilytetään

Glitch-otsikko (kerran, 0,24 s), osioväri (keltainen, vihreä, punainen ja sininen), viistetyt kulmat, Share Tech Mono -lukemat, mustat otsikko- ja navigaatiopalkit kummassakin teemassa, kortin kuvan hover-nosto (T-163: `translateY(-0.25rem)` ja varjo, joka korvasi sinisen reunan, joten se on mallina kaikelle hoverille), fokusrengas, ei vaakavieritystä, sivu vierii eikä laatikko, sekä kansion tumma "muovitasku" (8055–).

---

## A) Visuaalinen suunta: design-järjestelmä

**Periaate: "Night City HUD".** Tumma lasi ja ohuet neonviivat. Pinnat ovat litteitä ja kerroksellisia, reunat hiusviivoja, ja korostus on aina osion väri. Laatikko on vain objektilla (kortti, pakka, dialogi). Osiot ovat avoimia ja jäsennetään otsikkoviivalla. Kulmat viistetään (oikea alakulma; isoissa pinnoissa myös vasen yläkulma). Kaikki on staattista: ainoa liike on toiminnallinen palaute (≤ 150 ms) ja nykyinen kerran ajettava glitch.

### A.1 Tokenit (korvaavat `:root`:n r. 35–139 ja vaalean teeman r. 142–182; uudet nimet lisätään, vanhat jätetään aliaksiksi, jotta mikään ei hajoa kerralla)

```css
:root {
  /* Pinnat: 4 tasoa + hover. Taso nousee = vaaleampi (tumma) / valkoisempi (vaalea). */
  --color-bg: #090a0e;
  --surface-1: #0f1117;          /* avoin osio, sivupalkki */
  --surface-2: #151821;          /* objekti: korttiruutu, pakkakortti, kenttä */
  --surface-3: #1c202b;          /* dialogi, valikko, popover */
  --surface-hover: #232836;
  --color-surface: var(--surface-1);          /* alias */
  --color-surface-raised: var(--surface-2);   /* alias */
  --color-surface-hover: var(--surface-hover);/* alias */

  /* Viivat: hiusviiva tekstin väristä, ei omaa harmaata. */
  --line: rgb(241 241 236 / 0.09);
  --line-strong: rgb(241 241 236 / 0.22);
  --line-accent: color-mix(in srgb, var(--section-accent) 70%, transparent);
  --color-border: var(--line);                /* alias */
  --color-border-strong: #6f778a;             /* säilyy: kenttien ja painikkeiden 3:1-reuna (WCAG 1.4.11) */

  /* Teksti */
  --color-text: #f1f1ec;
  --color-text-muted: #a3aab9;   /* 7.9:1 surface-2:lla */
  --color-text-faint: #7d8597;   /* vain koriste-/metatekstille ≥ 4.5:1 bg:llä (4.7:1) */

  /* Välistys: 4 px:n asteikko, lisätty 5 ja 10 */
  --space-0: 2px;
  --space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;  --space-4: 1rem;
  --space-5: 1.25rem;  --space-6: 1.5rem;  --space-8: 2rem;     --space-10: 2.5rem;
  --gap-section: var(--space-6);      /* osioiden väli sivulla */
  --gap-stack: var(--space-3);        /* osion sisäinen väli */
  --pad-object: var(--space-3);       /* objektin (laatikko) sisäväli */
  --pad-dialog: var(--space-5);

  /* Kontrollien korkeus: kaksi kokoa */
  --control-h: 2.5rem;       /* 40 px hiirellä */
  --control-h-sm: 2rem;      /* 32 px: laskurit, chipit, rivien toiminnot */
  --target-min: 2.5rem;      /* ks. coarse-ylikirjoitus alla */

  /* Kulmat */
  --cut: 0.5rem;             /* painike, kenttä, segmentti (oli 0.625rem) */
  --cut-sm: 0.3125rem;       /* chip, laskuri */
  --cut-lg: 0.875rem;        /* objekti, dialogi: kaksi viistettyä kulmaa */
  --shape-chamfer: polygon(0 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%);
  --shape-object: polygon(var(--cut-lg) 0, 100% 0, 100% calc(100% - var(--cut-lg)), calc(100% - var(--cut-lg)) 100%, 0 100%, 0 var(--cut-lg));

  /* Syvyys: tumma käyttää valoa reunassa + pehmeää pudotusvarjoa, ei hehkua levossa */
  --shadow-object: inset 0 1px 0 rgb(255 255 255 / 0.04), 0 10px 24px -14px rgb(0 0 0 / 0.8);
  --shadow-pop: inset 0 1px 0 rgb(255 255 255 / 0.05), 0 24px 48px -16px rgb(0 0 0 / 0.85);
  --glow-select: 0 0 0 1px var(--section-accent), 0 0 14px -4px color-mix(in srgb, var(--section-accent) 60%, transparent);

  /* Typografia */
  --font-size-display: 2rem;        /* h1 (oli 2.25rem) */
  --font-size-lg: 1.25rem;          /* h2 (oli 1.375rem) */
  --font-size-base: 1.125rem;       /* leipäteksti ennallaan */
  --font-size-sm: 1rem;             /* ohjeet, alanimet ennallaan */
  --font-size-label: 0.875rem;      /* VERSAALI-labelit ja mono-lukemat, ks. R2 */
  --font-size-control: 1rem;        /* painikkeet ja segmentit (oli 1.125rem) */
  --letter-spacing-label: 0.12em;

  /* Liike: vain toiminnallinen */
  --ease: 0.12s cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-lift: 0.15s cubic-bezier(0.2, 0.7, 0.2, 1);

  /* Taustatekstuuri: staattinen HUD-ruudukko + nykyiset scanlinet */
  --grid-line: rgb(255 255 255 / 0.018);
}

/* Kosketus: 44 px säilyy (T-118-linja). */
@media (pointer: coarse) {
  :root { --control-h: 2.75rem; --target-min: 2.75rem; }
}

:root[data-theme='light'] {
  --color-bg: #efece3;
  --surface-1: #f6f4ee;
  --surface-2: #fffefb;          /* objekti nousee valkoisena beigeltä pohjalta */
  --surface-3: #ffffff;
  --surface-hover: #ebe7db;
  --line: rgb(14 15 20 / 0.10);
  --line-strong: rgb(14 15 20 / 0.24);
  --color-border-strong: #5f6676;
  --color-text: #0e0f14;
  --color-text-muted: #474c58;   /* 8.6:1 surface-2:lla */
  --color-text-faint: #5d6270;   /* 5.2:1 bg:llä */
  --shadow-object: 0 1px 2px rgb(14 15 20 / 0.06), 0 8px 20px -14px rgb(14 15 20 / 0.35);
  --shadow-pop: 0 2px 4px rgb(14 15 20 / 0.08), 0 24px 48px -20px rgb(14 15 20 / 0.45);
  --glow-select: 0 0 0 2px var(--color-accent-edge);  /* ei hehkua paperilla */
  --grid-line: rgb(14 15 20 / 0.035);
}
```

**Tausta (body, korvaa r. 214–219):** nykyiset kaksi valoläikkää ja scanlinet säilyvät. Lisätään staattinen HUD-ruudukko, joka tuo syvyyttä ilman liikettä:

```css
body {
  background-image:
    radial-gradient(48rem 20rem at 85% -8%, var(--page-glow-a), transparent 70%),
    radial-gradient(36rem 16rem at 0% 0%, var(--page-glow-b), transparent 70%),
    linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 100% 2rem,
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 2rem 100%,
    repeating-linear-gradient(0deg, var(--scanline) 0 1px, transparent 1px 4px);
  background-attachment: fixed;
}
@media (forced-colors: active) { body { background-image: none; } }
```

### A.2 Typografia-asteikko

| Rooli | Koko / paino | Muuta |
|---|---|---|
| h1 (sivun otsikko) | 2rem / 700, `letter-spacing: .08em`, versaali | Alle 40rem: 1.625rem. Alla oleva palkki 2.5rem × 3 px. Glitch säilyy. |
| h2 (osion otsikko) | 1.25rem / 700, `.06em`, versaali | Osion otsikkoviiva (A.4). |
| Label (h3, legend, taulukon otsikko, kentän label) | **0.875rem** / 700, `.12em`, versaali, `--color-text-muted` | R2: pienempi kuin nykyinen 16 px:n lattia. Rajdhani 700 -versaalit ovat 14 px:nä luettavia. |
| Leipäteksti | 1.125rem / 500 | Ennallaan. |
| Ohje, alanimi | 1rem / 500, muted | Ennallaan. |
| Mono-lukema (määrät, tilarivi, chipit) | Share Tech Mono 0.875–1rem, `tabular-nums`, `letter-spacing: .02em` | Isot luvut (tilastot): 1.75rem mono. |
| Painike ja segmentti | **1rem** / 700, `.08em`, versaali | Oli 1.125rem. Tiiviimpi, mutta ≥ 16 px. |

### A.3 Peruskomponentit

**Painikkeet** (korvaavat r. 440–600; reuna ja täyttö -tekniikka säilyy, koska se on hyvä viistettyjen kulmien reunaratkaisu):

```css
.button-primary, .button-secondary, .button-danger, .button-quiet {
  min-height: var(--control-h);
  padding: 0 var(--space-4);
  font-size: var(--font-size-control);
  letter-spacing: .08em;
  gap: var(--space-2);
}
@media (prefers-reduced-motion: no-preference) {
  .button-primary, .button-secondary, .button-danger, .button-quiet, .segmented-option, .chip, .step, .icon-button {
    transition: background-color var(--ease), color var(--ease), box-shadow var(--ease), transform var(--ease);
  }
}
/* Ensisijainen: täysi aksentti. Hover: kirkkaampi + 2 px alapalkki + nosto 1 px. Painettu: alas 1 px, tummempi. */
.button-primary:active { transform: translateY(1px); }
.button-primary:active::before { background: color-mix(in srgb, var(--color-accent) 82%, #000); }

/* Toissijainen: läpinäkyvä täyttö, hiusviiva → aksentti hoverissa (ei alleviivausta). */
.button-secondary { background: var(--line-strong); }
.button-secondary::before { background: var(--color-bg); }     /* "lasi" */
.button-secondary:hover { background: var(--line-accent); }
.button-secondary:hover::before { background: var(--surface-hover); }

/* UUSI hiljainen työkalupainike: ei reunaa, ikoni + teksti; toolbarit (Galleria, Skannaa, Merkitse). */
.button-quiet {
  position: relative; display: inline-flex; align-items: center;
  border: 0; background: transparent; color: var(--color-text);
  font: inherit; font-weight: 700; text-transform: uppercase; cursor: pointer;
  padding-inline: var(--space-3);
  box-shadow: inset 0 -1px 0 transparent;
}
.button-quiet:hover { background: var(--surface-hover); box-shadow: inset 0 -2px 0 var(--section-accent); }
.button-quiet[aria-pressed='true'] { box-shadow: inset 0 -2px 0 var(--section-accent); color: var(--color-text); }

/* UUSI ikonipainike: neliö, viiste, sama korkeus. */
.icon-button { inline-size: var(--control-h); block-size: var(--control-h); padding: 0; }
```

**Kentät** (`.field input`, `select`, r. 866–935 ja 10422–):

```css
input[type='search'], input[type='text'], select, textarea {
  block-size: var(--control-h);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-bottom-color: var(--color-text-muted);
  background: var(--surface-2);
  font-size: 1rem;          /* ≥ 16 px estää iOS-zoomin */
  clip-path: var(--shape-chamfer);
}
input:hover, select:hover { border-color: var(--line-accent); }
input:focus-visible, select:focus-visible { clip-path: none; outline: var(--focus-ring); outline-offset: 2px; border-bottom-color: var(--section-accent); }
```

Hakukenttään tulee luuppi-ikoni (`<svg>` TSX:ssä kentän edessä, `padding-inline-start: 2.25rem`). Data-URI-kuvia ei käytetä, koska CSP estää ne.

**Segmentit** (r. 1890–1975): ohuempi kehys, 1 px:n erottimet, valittu = alapalkki + sävy. Kaksi kokoa.

```css
.segmented { border: 1px solid var(--color-border-strong); background: var(--color-bg); clip-path: var(--shape-chamfer); }
.segmented-option { block-size: calc(var(--control-h) - 2px); padding: 0 var(--space-3); font-size: var(--font-size-control); background: transparent; }
.segmented-option + .segmented-option { border-inline-start: 1px solid var(--line-strong); }
.segmented-option:hover { background: var(--surface-hover); box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--section-accent) 55%, transparent); }
.segmented-option:has(input:checked), .segmented-option[aria-pressed='true'], .segmented-option[aria-current='page'] {
  background: color-mix(in srgb, var(--section-accent) 16%, transparent);
  box-shadow: inset 0 -2px 0 var(--section-accent);
}
.segmented--sm .segmented-option { block-size: calc(var(--control-h-sm) - 2px); font-size: .875rem; padding: 0 var(--space-2); }
```

**Chipit (suodatinvalinnat; korvaa valintaruutu-chipin r. 940–1037):** natiivi checkbox säilyy saavutettavuuden takia, mutta visuaalisesti se on 16 px:n neliö chipin vasemmassa reunassa, ja valittu tila on näkyvä ✓ (tilaa ei kerrota pelkällä värillä).

```css
.option { min-block-size: var(--control-h-sm); padding: 0 var(--space-2); gap: var(--space-2);
  border: 1px solid var(--line-strong); background: transparent; font-size: 1rem; clip-path: polygon(0 0,100% 0,100% calc(100% - var(--cut-sm)),calc(100% - var(--cut-sm)) 100%,0 100%); }
.option:has(input:checked) { background: color-mix(in srgb, var(--section-accent) 14%, transparent); border-color: var(--section-accent); }
.option input { inline-size: 1rem; block-size: 1rem; }
@media (pointer: coarse) { .option { min-block-size: var(--target-min); } }
```

**Osio (korvaa `.panel`-laatikon r. 406–436):** osio on avoin, ilman taustaa ja reunoja. Otsikon alla kulkee viiva, jonka vasemmassa päässä on osion värinen 2.5rem:n neonsegmentti. Laatikko (`.object`) on erikseen.

```css
.panel { padding: 0; border: 0; background: none; gap: var(--gap-stack); }
.panel::before { content: none; }
.panel-title {
  padding-block-end: var(--space-2);
  background: linear-gradient(90deg, var(--section-accent) 0 2.5rem, var(--line) 2.5rem) bottom / 100% 1px no-repeat;
  font-size: var(--font-size-label); letter-spacing: var(--letter-spacing-label);
}
/* Objekti: kortti, pakka, tilastolaatta, saavutus. */
.object {
  padding: var(--pad-object);
  background: var(--surface-2);
  box-shadow: var(--shadow-object);
  clip-path: var(--shape-object);
}
/* Reuna viisteen kanssa: 1 px:n reuna piirretään ::before-kerroksena (sama tekniikka kuin painikkeissa). */
```

**Dialogit** (r. 1312–1345, 2345–2360, 4257–, 9095–9130):

```css
.confirm-dialog-body, .card-dialog-body, .test-hand-body {
  padding: var(--pad-dialog);
  background: var(--surface-3);
  border: 0;
  box-shadow: var(--shadow-pop), inset 0 2px 0 var(--section-accent);  /* yläreunan neonviiva */
  clip-path: var(--shape-object);
}
.card-dialog::backdrop, .confirm-dialog::backdrop, .test-hand-dialog::backdrop {
  background: rgb(5 6 9 / 0.72);
  backdrop-filter: blur(3px) saturate(0.8);  /* staattinen */
}
.dialog-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-block-size: var(--control-h); }
/* Sulje-painike = .icon-button, ×-ikoni (SVG, 2 px viiva). */
```

**Taulukot** (`.card-table`, r. ~2040–2120, 5852–, 6708–): rivi 44 px (oli 65 px; listanäkymän toinen rivi poistuu, ks. B.1), otsikkorivi on label-tyyliä, rivien erotin `--line`, hover `--surface-hover`. Omistuksen tila näkyy datapalkkina (luku E), ei vasemman reunan kiskona.

**Korttiruudukko** (`.card-grid`, `.card-box`, r. 1519–1720): ks. B.1 ja E.1. Lyhyesti: ei laatikkoa vaan kuva + yksi datanauha.

```css
.card-grid { gap: var(--space-4) var(--space-3); }
.catalog-results[data-image-size='small'] .card-grid  { --card-min: 9.5rem; }
.catalog-results[data-image-size='medium'] .card-grid { --card-min: 12.5rem; }  /* oli 18rem */
.catalog-results[data-image-size='large'] .card-grid  { --card-min: 17rem; }   /* oli 25rem */
@media (max-width: 39.99rem) {   /* 320: kaksi saraketta Pienessä ja Normaalissa */
  .catalog-results:not([data-image-size='large']) .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3) var(--space-2); }
}
.card-box { padding: 0; border: 0; background: none; gap: var(--space-1); }
.card-box:hover, .card-box:focus-within { background: none; }
.card-image { border: 0; clip-path: inset(0 round 4.5% / 3.2%); }  /* kortin oma pyöristys, ei kehystä */
```

**Fokus:** nykyinen 3 px syaani rengas 3 px:n etäisyydellä säilyy (≥ 5:1, WCAG 2.4.11/2.4.13). Viistetyissä elementeissä `clip-path: none` fokuksessa kuten ennenkin. Lisätään vain `:focus-visible { outline-offset: 2px }` kentille ja segmenteille (`-4px` sisäpuolinen säilyy segmentissä).

**Liike:** vain hover, press ja focus (värit, varjo, 1 px:n nosto ja kuvan 4 px:n nosto) ≤ 150 ms, kaikki `prefers-reduced-motion: no-preference` -ehdon sisällä. Ei uusia animaatioita. Glitch (r. 1466) pysyy ennallaan.

### A.4 Sivun runko

- **Yläpalkki desktopilla** (r. 313–347): korkeus 64 px (oli 68). Navigaatiolinkin aktiivinen tila on 2 px:n osioväripalkki ja tekstin väri, ennallaan.
- **Mobiilin yläpalkki** (r. 9188–, 12756–): logo- ja työkalurivi 48 px (logo 1.75rem). Navigaatio on kaksi riviä × 3, rivin korkeus 40 px ja teksti 0.875rem versaalina → yhteensä noin **128 px** (oli 165). Vaihtoehto R4 (alapalkki) on PM:n päätös.
- **Sivun otsikkorivi `.page-head`** on yksi yhteinen rakenne kaikille sivuille: `h1` vasemmalla ja toiminnot oikealla samalla rivillä. Alle 40rem toiminnot ovat h1:n alla yhdellä rivillä ikonipainikkeina. Tilateksti ("151 korttia · 114 omistat") on mono-tilarivi h1:n alla, ei erillisenä kappaleena. `main { padding-block: var(--space-5) var(--space-8); gap: var(--space-5) }`.
- **Vihjekappaleet** (kaikki "Kirjaudu…", "Linkin saaja näkee…", "Napsauta korttia lisätäksesi…") siirretään `InfoTip`-vihjeeseen tai yhdelle `status-line`-riville. Sääntö: sivun yläosassa on enintään yksi tekstirivi ennen sisältöä.
- **Alatunniste:** `margin-block-start: var(--space-8); padding-block: var(--space-4)`. Kaksi riviä rinnakkain ≥ 64rem.

---

## B) Näkymäkohtaiset muutokset ja hyväksymiskriteerit

Kaikissa näkymissä on yhteiset kriteerit: ei vaakaylivuotoa 320 px:ssä, ei sisäistä vieritysaluetta (dialogin kerros on ainoa sallittu poikkeus, ja silloinkin vain 320 px:ssä), kontrastit ≥ 4.5:1 tekstille ja ≥ 3:1 reunoille ja ikoneille kummassakin teemassa, kaikki toimii näppäimistöllä ja fokus näkyy.

### B.1 Kortit (`#/`, CatalogView, CardList, CardTable, CardFilters, ListToolbar)

**Ongelmat:** 3 korttia rivillä 1280:ssa, laatikoitu ruutu ja 130 px tekstiä kuvan alla; työkalurivillä 5 isoa kehystettyä kontrollia; sivupalkin suodattimet noin 1 500 px pitkä lista; listanäkymän rivi on 65 px (kaksi riviä); 320:ssa yksi kortti rivillä.

**Muutokset:**
1. Ruutu ilman laatikkoa (A.3). Kuvan alle tulee **yksi datanauha** (32 px): kustannusjalokivi, nimi (yksi rivi, ellipsi, `title` ja saavutettava nimi koko nimellä) ja oikealla omistuslaskuri (E.1). Toinen rivi on muted mono: `UNIT · P6 · R2 · ◇` (tyyppimerkki chipinä vain Legendillä). "Pakoissa: 2" tulee ikonilla ja luvulla nauhan oikeaan päähän (◧ 2, saavutettava nimi "2 pakassa"). Alanimi kuuluu nimen `title`:en ja dialogiin, koska se näkyy jo kuvassa.
2. Koot: Pieni 9.5rem, Normaali 12.5rem ja Iso 17rem. 320:ssa 2 saraketta.
3. Työkalurivi: `Kuvat/Lista` ja `Pieni/Normaali/Iso` ovat `.segmented--sm`-segmenttejä. Galleria, Skannaa ja Merkitse ovat `.button-quiet`-painikkeita ikonin kanssa. Yhteensä 40 px:n rivi. Lajittelu (Numero ↑) siirtyy sivupalkista työkaluriville yhdeksi `select`iksi ja suunta ikonipainikkeeksi.
4. Sivupalkki 16rem: haku, Kokoelma-segmentti, Setti, Tagi, Tyyppi ja Väri (chipit 2 sarakkeessa, 32 px). **Harvinaisuus, Cost, Power ja RAM** ovat `<details class="disclosure">`-ryhmiä, jotka ovat oletuksena kiinni. Jos ryhmässä on valinta, se näkyy auki ja otsikossa on määrä ("COST · 2"). Kiinteä (sticky) sivupalkki ei ole sallittu (WCAG 2.4.11 -linja). Pituus lyhenee noin 1 500 px:stä noin 700 px:iin.
5. Listanäkymä: yksi rivi (44 px). Nimi ja alanimi ovat samalla rivillä (`Nimi Alanimi` muted), "Pakoissa" omassa kapeassa sarakkeessa ja pikkukuva 28 × 39 px.
6. Merkintätilan alapalkki: 56 px, `--surface-3`, yläreunassa 2 px:n osioviiva. Sisältö on yhdellä rivillä ≥ 40rem.

**Hyväksymiskriteerit:**
- 1280×800: ensimmäisen kortin yläreuna ≤ **200 px** (nyt 254). Normaalissa koossa rivillä on **≥ 5 korttia**, ja ensimmäinen rivi näkyy kokonaan datanauhoineen ilman vieritystä.
- 1920×1080: Normaalissa ≥ 7 korttia rivillä.
- 768: ≥ 3 korttia rivillä (nyt 2). 320×640: 2 korttia rivillä, ensimmäinen kortti alkaa ≤ 300 px (nyt 382).
- Listanäkymä: rivi ≤ 44 px, ja 1280×800:ssa näkyy ≥ 11 riviä.
- Suodatinpalkin korkeus kaikki ryhmät kiinni ≤ 760 px 1280:ssa.

### B.2 Korttidialogi (`#/kortti/<key>`, CardImageDialog, CardVersions, CardAvailability)

**Ongelmat:** 1280×800:ssa sisältö (1104 px) ei mahdu, ja dialogi vierii. Oikea sarake käyttää 30 % leveydestä, ja loput jäävät tyhjäksi. Want-laskuri on "★0", versiolaatikko on iso valkoreunainen laatikko, ja "Pakoissa" on pelkkä luettelo. Pakkaan ei voi lisätä (E.3).

**Muutokset:** dialogi on `min(72rem, 100%)` leveä ja kaksi saraketta: kuva `max-block-size: calc(100dvh - 4rem)` ja tiedot. Tiedot ovat kolmena lohkona: **Kokoelma** (määrä, datapalkki E.1 ja Want-laskuri samalla rivillä), **Pakat** (E.3) ja **Versiot** (kiinni oletuksena `disclosure`, jonka otsikossa "4 versiota · omistat 2"). Saatavuus ja tagit ovat yhdellä mono-rivillä otsikon alla. Proxy-jonoon lisääminen on `.button-quiet`-painike otsikkorivillä.

**Hyväksymiskriteerit:** 1280×800 ja 1920×1080: dialogi ei vieri (`dialog.scrollHeight ≤ innerHeight`), kun Versiot on kiinni. 320: koko näytön näkymä (T-118), dialogikerros vierii, ja ylin osa (nimi, kuva 60 % leveydestä, Kokoelma-laskuri) näkyy ensimmäisellä ruudulla.

### B.3 Kokoelma (`#/kokoelma`, CollectionView, AchievementsPanel, CollectionBinder, CardScanner, BinderScan)

**Omat kortit:** sama ruudukko ja datanauha kuin B.1. Otsikkorivi: h1, segmentti `Omat | Yleiskuva | Kansio` ja Skannaa samalla rivillä (≥ 40rem), tilarivi mono h1:n alla. Kriteeri: 1280×800 ensimmäinen kortti ≤ 220 px (nyt 320). 320: ≤ 330 px (nyt 488).

**Yleiskuva:** nyt 3.9 ruutua 1280:ssa; tavoite **1 ruutu 1920×1080:ssa ja ≤ 1.6 ruutua 1280×800:ssa**.
1. Yläkaista on yksi rivi ilman paneelia: rengas 96 px, KOPIOITA 307, TÄYSIÄ PELISARJOJA 98/151 ja SAAVUTUKSET 4/20 neljänä **mittarina** (mono 1.75rem, label 0.875rem). Erottimina pystyhiusviivat, ei laatikoita.
2. Seteittäin, Harvinaisuuksittain ja Värit ja tyypit kolmena sarakkeena heti yläkaistan alla (≥ 64rem). Rivit ovat 28 px korkeita: nimi, 6 px:n palkki ja `47/60` mono. Ei paneelikehystä, vain osio-otsikkoviiva.
3. Saavutukset: avatut ovat **chippeinä** yhdellä rivillä (ikoni, nimi ja ✓, 32 px, osion värinen viiste). "Seuraavat keikat" on kompakti 3–4-sarakkeinen lista (ikoni, nimi, edistymispalkki ja `15/18`), ilman katkoviivalaatikoita. "Lisää lukittuja (10)" on disclosure.
4. Puuttuvat kortit -osio pysyy ruudukkona (kuvat saavat vieriä) käyttäen Pientä kokoa.

**Kansio:** aukeama mahtuu ruudulle: `block-size: min(calc(100dvh - 15rem), …)` ja leveys aspektin mukaan. Sivunvaihto on näppäimillä ← → (on jo) ja reunojen nuolipainikkeilla. Kriteeri: 1280×800 koko aukeama ja sivunvaihtopainikkeet näkyvät ilman vieritystä (nyt 1.5 ruutua).

**Skanneri:** kiireellinen korjaus (alku). Visuaalisesti dialogi A.3:n mukaan. Tila "Yksi kerrallaan / Jatkuva / Kansiosivu" on `.segmented--fill`, ja Beta/Retail-valinta on kaksi isoa ensisijaista painiketta kuten nyt. Kriteeri: 320–1920 dialogin runko on ≥ min(36rem, 100 % − 16 px) leveä.

**Tyhjä tila:** yksi rivi ikoni, otsikko ja kaksi painiketta, `max-inline-size: 44rem`, ilman katkoviivakehystä (A.3 objekti).

### B.4 Pakat (`#/pakat`, `kokoaminen`, `julkiset`; DecksView, DeckList, DeckBuildView, PublicDecksList, DeckImportMenu)

**Ongelmat:** jokaisessa pakkakortissa on täysleveä punainen AVAA (kolme punaista palkkia), kortit ovat korkeita (450 px) ja niissä on tyhjää tilaa toimintojen yläpuolella. 320:ssa Omat/Kokoaminen/Julkiset rivittyy kahdelle riville ja otsikon toiminnot vievät kolme riviä.

**Muutokset:**
1. Pakkakortti on objekti (A.3). **Koko kortti on linkki pakkaan** (otsikko on `<a>`, ja `::after` venyttää klikattavan alueen; muut painikkeet ovat sen päällä `z-index: 1`). AVAA-painike poistuu. Toiminnot (Kopioi, Vie ja jaa, Poista) ovat yhdessä ikonirivissä kortin alareunassa (`.icon-button`, 32 px). Kuvakaista on 96 px korkea (nyt 120). Rivillä on: nimi, värikoodi, `40/40–50` mono, edistymispalkki 4 px ja tilarivi (✓ Laillinen · Kaikki kokoelmassa). Kortin korkeus ≤ 280 px.
2. Ruudukko `repeat(auto-fill, minmax(18rem, 1fr))`: 1280:ssa 3–4 ja 1920:ssa 5–6 korttia rivillä.
3. Otsikkorivi: `+ Uusi pakka` (ensisijainen) ja `Tuo ▾` -valikko, johon siirtyvät myös Skannaa uusi pakka, Tuo pakkalista ja Hae Netdeckistä. 320:ssa yksi rivi.
4. Välilehdet: lyhyet nimet `Omat | Kokoaminen | Julkiset` (mahtuvat 320:een, UX-07:n viimeinen ehdotus).
5. **Kokoaminen:** Pakanvaihto on yksi rivi (Pöydällä nyt ▾ → Haluan pelata ▾), ja kooste näkyy heti alla kolmena sarakkeena (Jää, Palautetaan, Otetaan). Yhteensopivuus on kompakti matriisi (32 px:n solut, värikoodattu ja luku). "Kokoa kaikki" -taulukko pysyy listana (saa vieriä). Kriteeri 1280×800: Pakanvaihto ja Yhteensopivuus näkyvät kokonaan ilman vieritystä.
6. **Julkiset:** tyhjä tila on yksi rivi ja Päivitä lista ikonipainike otsikkorivillä.

**Kriteerit:** 1280×800: kaikki kolme testipakkaa toimintoineen näkyvät ilman vieritystä (nyt juuri ja juuri, 1.03). 1920: rivillä ≥ 5 pakkaa. 320×640: ensimmäinen pakkakortti alkaa ≤ 260 px (nyt 422).

### B.5 Pakkaeditori (`#/pakat/<id>`; DeckEditor, Sideboard, DeckStats, DeckCharts, DeckResults, GroupOdds, TestHandDialog, GameDialog, ExportButtons)

**Ongelmat:** pakan yläosa vie 300 px (Takaisin, nimi ja viiva, Yksityinen/Julkinen + selite + kirjautumisvihje) ennen hakua. Haun tulokset ovat 65–84 px:n rivejä. Tilastosarake on noin 4 ruutua pitkä paneelien ketju. 320:ssa ensimmäinen pakkarivi on vasta 782 px:ssä.

**Muutokset:**
1. **Otsikkorivi yhdelle riville** (≤ 64 px): `← Pakat` (ikoni + teksti, ei alleviivattua linkkiä), pakan nimi h1-koossa (muokattava kuten nyt), ✓ Tallennettu (mono, muted) ja oikealla `Yksityinen/Julkinen`-kytkin, Vie ja jaa -valikko sekä Pelaa yksin (`.button-quiet`). Kirjautumisvihje siirtyy kytkimen `InfoTip`-vihjeeseen, ja kytkin on `aria-disabled` + selitys, kun käyttäjä ei ole kirjautunut.
2. **Kolme saraketta ≥ 90rem (1440 px)**: suodattimet 16rem | haku ja tulokset | pakka 24rem. 64–90rem: kaksi saraketta (suodattimet vedetään `Suodattimet ▾` -paneeliksi tulosten yläpuolelle kuten nyt). Tilastot eivät ole pakkasarakkeen alla vaan omana välilehtenään pakkasarakkeessa: segmentti `Pakka | Tilastot | Tulokset` (oletus Pakka). Näin pakkasarake mahtuu ruudulle, ja tilastot ovat yhdellä ruudulla omana näkymänään.
3. Tulosrivi on 44 px yhdellä rivillä: kuva 28 px, cost-jalokivi, nimi + alanimi, `Unit · P0 · R2` muted mono ja varoitukset ikonina (⚠ Sama Legend, tooltip ja saavutettava teksti), −/+ 32 px. "Omistat 1" on mono-luku ennen laskuria.
4. Pakkasarakkeen tilalaatikko on yksi rivi `PÄÄPAKKA 40/40–50 ✓ LAILLINEN · LEGENDIT 3/3` ja 4 px:n palkki, ilman laatikkoa.
5. Tilastot-välilehti: sormukset, kustannuskäyrä, eddit, värit ja tyypit sekä todennäköisyydet 2 × 3 -ruudukossa 1920:ssa ja 2 sarakkeessa 1280:ssa. Kaaviot pysyvät nykyisinä (DeckCharts), vain kehykset poistuvat.
6. Testikäsi ja Kirjaa peli: dialogit A.3:n mukaan. Testikäden kortit ovat yhdellä rivillä 1280:ssa (on jo), ja ohjeteksti on (i)-vihjeessä.

**Kriteerit:**
- 1280×800: hakukenttä ≤ 140 px ja ensimmäinen tulosrivi ≤ 260 px (nyt 550); pakan Legendit näkyvät ilman vieritystä.
- 1920×1080: koko 43 kortin pakkasarake (Lista-näkymä, rivit 36 px) mahtuu ruudulle.
- 320×640: Pakka-välilehden ensimmäinen pakkarivi ≤ 330 px (nyt 782).
- Tilastot-välilehti 1920×1080: kaikki kaaviot ilman vieritystä.

### B.6 Testaa: Sealed, Boosterit, Pelaa yksin, Goldfish (PlaytestView, SealedView, BoosterCards, GoldfishView)

**Ongelmat:** Boosterien ja sealedin 12 raidallista 270 px:n paikanpitäjää ennen avaamista; täysleveä 64 px:n punainen palkki; selitteet erillisinä kappaleina; avattu booster 1.8 ruutua; Goldfishin aloituspaneeli venyy 1920:ssa.

**Muutokset:**
1. Ohjausrivi: `Setti`-segmentti (`.segmented--sm`), `Avaa booster` (ensisijainen, normaali leveys) ja tilarivi `AVATTU 1 · EPIC 0 · ICONIC 0 · SECRET 0` mono samalla rivillä. Selite on (i)-vihjeessä.
2. Ennen avaamista ei näytetä paikanpitäjiä. Tilalla on yksi 1:1-kokoinen "suljettu pakkaus" -objekti: viistetty laatikko, setin nimi ja booster-numero. Avattaessa paikalle tulevat kortit (ei animaatiota).
3. Avattu booster: `grid-template-columns: repeat(auto-fill, minmax(min(9.5rem, 30%), 1fr))`, eli 1280:ssa 8 + 4 ja 1920:ssa 12 riviin. Harvinaiset (Epic, Iconic, Secret) saavat foil-kehyksen E.1:n tekniikalla (staattinen gradientti).
4. Pelaa yksin: pakat 4-sarakkeisena listana (nimi, värikoodi, korttimäärä ja ▶), objektityyli.
5. Goldfish: aloituspaneeli `max-inline-size: 48rem`. Pelinäkymässä (aloituskäsi ja vuorot) ei ole paneelikehystä, ja Pidä käsi ja Mulligan ovat käden alla keskitettyinä.

**Kriteerit:** 1280×800 ja 1920×1080: avattu booster (12 korttia) ja ohjausrivi mahtuvat yhdelle ruudulle. Sealedin avausnäkymä mahtuu ruudulle. 320: ohjausrivi on enintään 2 riviä.

### B.7 Have/Want (`#/vaihto`, HaveWantView, SharedTradeView, TradeLinkView, QrDialog)

**Ongelmat:** otsikon alla Jaa ja QR, kaksi vihjekappaletta ja kolme sisäkkäistä segmenttiriviä; ensimmäinen kortti 526 px:ssä (Have 610); want-tähti (E.2).

**Muutokset:**
1. Otsikkorivi: h1 ja (i), oikealla `Jaa ▾` -valikko (Kopioi linkki, QR-koodi). Vihjeet ovat valikossa ja (i)-vihjeessä.
2. **Yksi ohjausrivi:** `Want (9) | Have (7)` (pääsegmentti, normaalikoko) + erotin + `Lista | Lisää kortteja` (`.segmented--sm`) + oikealla `Kuvat/Lista` ja koko (`.segmented--sm`). Alle 64rem kaksi riviä. Toinen h2 "WANT" poistuu, koska pääsegmentti kertoo jo osion.
3. Want- ja Have-laskuri E.2:n mukaan. "Kaikki proxy-jonoon" on `.button-quiet`.
4. Jaetut näkymät (`#/vaihto/…`, `#/v/…`): vertailutaulukot A.3:n taulukkotyylillä. Otsikot muodossa "Voit antaa heille" / "He voivat antaa sinulle" (MVP1-katselmoinnin UX-M11).

**Kriteerit:** 1280×800: ensimmäinen kortti ≤ 230 px (nyt 526). 320×640: ≤ 360 px (nyt 696).

### B.8 Proxy (`#/proxy`, ProxyView, ProxySheets)

**Ongelmat:** valitsimen kortit ovat isoja laatikoita (−/+ 44 px), Järjestys on omalla rivillään, arkki ja painikkeet menevät 1280:ssa ruudun alareunan yli (Tulosta näkyy puoliksi).

**Muutokset:** valitsinruudukko käyttää Pientä korttikokoa (9.5rem) ja datanauhaa (nimi, versio muted, −/+ 32 px). Haku, Suodattimet ja Järjestys ovat yhdellä rivillä. Arkki-sarake: `Arkki 1/2` ‹ ›, arkin esikatselu `max-block-size: calc(100dvh - 12rem)` ja Tulosta + Tyhjennä jono heti esikatselun alla. Vaiheet (1 Valitse → 2 Tarkista → 3 Tulosta) ovat mono-tilarivi h1:n vieressä (on jo).

**Kriteerit:** 1280×800: arkin esikatselu, sivunvaihto ja Tulosta-painike näkyvät kokonaan ilman vieritystä. Valitsimessa rivillä ≥ 4 korttia.

### B.9 Yläpalkki, alatunniste ja tyhjät tilat (App.tsx, AccountMenu, LanguageSwitch, ThemeToggle, StorageReminder)

- Desktop 64 px. Mobiili ≈ 128 px (A.4). Kieli- ja teemavalitsin sekä tili ovat 40 px:n `.icon-button`-painikkeita. Lippu-painikkeisiin lisätään näkyvä "FI"/"EN" mono 0.75rem (MVP1 UX-M6).
- Tyhjät tilat (Kokoelma, Pakat, Have/Want, Proxy, Julkiset): ikoni 32 px, otsikko h2, yksi lause ja 1–2 painiketta. Objektityyli, ei katkoviivaa, `max-inline-size: 44rem`.
- **Kriteeri:** 320×640: h1:n yläreuna ≤ 150 px kaikilla sivuilla (nyt 173) ja sama joka sivulla, myös Goldfishissa (nyt 229).

---

## C) Työpaketit

**Rinnakkaistyön perusta (tehdään paketissa 1):** `styles.css` on kronologinen (tehtävä kerrallaan lisätty), joten saman näkymän säännöt ovat hajallaan. Sääntöjen siirtely rikkoisi cascaden järjestyksen ja aiheuttaisi regressioita. Siksi:
1. Paketti 1 luo kansioon `src/styles/` valmiiksi tyhjät tiedostot `cards.css`, `collection.css`, `decks.css`, `editor.css`, `playtest.css`, `havewant.css`, `proxy.css` ja `premium.css` ja tuo ne `main.tsx`:ssä **`styles.css`:n jälkeen** tässä järjestyksessä. Näkymäpaketit eivät koske `main.tsx`:ään.
2. Näkymäpaketti kirjoittaa **uudet ja korvaavat sääntönsä omaan tiedostoonsa**. Vanhaa `styles.css`:ää se muokkaa vain **poistamalla tai muuttamalla omia selektoreitaan** alla luetelluilla rivialueilla. Rivinumerot viittaavat versioon 4dd969b; paketin 1 jälkeen kohdat haetaan selektorin nimellä.
3. `src/styles.ux174.test.ts` lukee `styles.css`:ää ja tarkistaa 11 sääntöä (UX-02 ym.). Jos sääntö siirtyy omaan tiedostoonsa, testi päivitetään lukemaan sitä tiedostoa. Testiä ei heikennetä (rules.md).
4. Jokainen paketti ajaa lopuksi `node …\scratchpad\ux\capture.mjs after --states=<omat tilat>` ja liittää kriteerien mittaukset luovutukseen.

| # | Paketti | Koko | Riippuu | Tiedostot (TSX) | styles.css: omat selektorit ja rivialueet (4dd969b) |
|---|---|---|---|---|---|
| 0 | **Skannerin mobiilikorjaus** (kiireellinen) | XS (≈ 10 riviä + testi) | – | – | `.scanner-body` r. 7830, 12775; `.confirm-dialog[open]` r. 1333 |
| 1 | **Globaali design-järjestelmä**: tokenit, tausta, typografia, painikkeet (+ `.button-quiet`, `.icon-button`), kentät, segmentit (+ `--sm`), chipit, osio (`.panel`) ja `.object`, dialogit, taulukon perustyyli, linkit, yläpalkki ja mobiilinavi, alatunniste, `.page-head`, tyhjä tila ja notice, `src/styles/`-runko | L (≈ 500–700 riviä CSS, ≈ 60 riviä TSX) | 0 | App.tsx (header ja nav), SegmentedChoice.tsx (`size`-prop), InfoTip.tsx, ThemeToggle, LanguageSwitch, AccountMenu, main.tsx, uudet `src/styles/*.css` | 35–440 (tokenit, base, layout, header, footer, panel), 440–740 (painikkeet, step, theme-toggle), 742–800 (notice, empty), 866–1040 (field, valintaruutu), 1038–1240 (header-työkalut), 1312–1345, 2345–2360 (dialogit), 1406–1515 (forced-colors, glitch, reduced motion), 1779–1790 (`.dialog-close`), 1885–1975 (segmentit), 2120–2165 ja 10601–10620 (linkit), 2885–2905 (`.page-head`), 9095–9130 (mobiilidialogit), 9188–9300 (kapein header), 10536–10600 ja 11054–11066 (osiovärit, tyyppivärit), 12756–12772 (mobiilinavi) |
| 2 | **Kortit + yhteinen korttiruudukko** (Kortit, Kokoelma › Omat ja Have/Want käyttävät samaa CardListiä) + korttidialogin asettelu | L | 1 | CatalogView.tsx, CardList.tsx, CardTable.tsx, CardFilters.tsx, ListToolbar.tsx, ActiveFilters.tsx, SortSelect.tsx, MarkOwnBanner.tsx, CardImageDialog.tsx (vain asettelu), CardVersions.tsx, CardAvailability.tsx, GalleryViewer.tsx | 1515–1725 (`.card-grid`, `.card-box`, `.card-name`, chipit), 1723–1780 (`.card-image*`), 1788–1835 (`.type-badge`), 1835–1885 (list toolbar), 1980–2120 (`.card-table`), 2905–3075 (catalog-layout, image size), 5115–5300 (galleria), 5299–5600 (suodattimet, rarity), 5450–5600 (`.card-dialog*`), 5852–5870, 9975–10260 (Cards phone, mark banner), 10361–10460, 12543–12620 → `src/styles/cards.css` |
| 3 | **Kokoelma**: Yleiskuva, saavutukset, Kansio, skanneri- ja kansiosivudialogien visuaali, tyhjä tila | M | 1 (ja 2:n datanauha Omissa korteissa, mutta ei samoja tiedostoja) | CollectionView.tsx, AchievementsPanel.tsx, CollectionBinder.tsx, CollectionNotices.tsx, CardScanner.tsx (vain luokat), BinderScan.tsx (vain luokat), BinderCardPicker.tsx, ValueCurve.tsx | 7689–7870 (progress), 7871–7990 (skannerin kehys), 7981–8055 (empty actions), 8055–8600 (kansio, kannet), 8647–8760 (scan debug, frame state), 10461–10495 (achievements), 10700–11050 (tier, badge), 12552–12570, 12773–12933 (kansiosivuskannaus) → `src/styles/collection.css` |
| 4a | **Pakat-lista, Kokoaminen, Julkiset, tuonti** | M | 1 | DecksView.tsx, DeckList.tsx, DeckBuildView.tsx, PublicDecksList.tsx, PublicDeckView.tsx, SharedDeckView.tsx, DeckImport.tsx, DeckImportMenu.tsx, DeckVisibility.tsx, ConfirmDeleteDialog.tsx | 4473–4660 (deck tiles, actions), 4656–4810 (deck list head), 6899–6965 (public), 8984–9060 (Decks page head), 11066–11290 (build view) → `src/styles/decks.css` |
| 4b | **Pakkaeditori** (otsikkorivi, sarakkeet, tulosrivit, pakkasarake, Tilastot- ja Tulokset-välilehdet, testikäsi, Kirjaa peli) | L | 1 | DeckEditor.tsx, DeckPickTable.tsx, DeckPickImage.tsx, Sideboard.tsx, DeckStats.tsx, DeckCharts.tsx, DeckResults.tsx, GroupOdds.tsx, DeckProblems.tsx, MissingCards.tsx, TestHandDialog.tsx, GameDialog.tsx, TournamentListDialog.tsx, ExportButtons.tsx | 2360–2885 (editor layout, nimi, toast), 3075–4470 (picker, deck column, stacks, summary, test hand, bottom bar), 4807–4822, 4971–5115 (icon buttons, export menu), 5991–6900 (stats, rings, curves, types, group odds), 6965–7195 (visibility, sideboard stacks), 8595–8650 (editor tabs), 8759–8885, 9407–9640 (game form, sticky bar), 11426–11642 → `src/styles/editor.css` |
| 5 | **Testaa + Have/Want + Proxy** | L (jaettavissa 5a Testaa, 5b Have/Want + Proxy) | 1; Have/Want-ruudukko 2:n jälkeen | PlaytestView.tsx, SealedView.tsx, BoosterCards.tsx, GoldfishView.tsx, HaveWantView.tsx, SharedTradeView.tsx, TradeLinkView.tsx, ShareTradeButton.tsx, QrDialog.tsx, ProxyView.tsx, ProxySheets.tsx, SendToProxy.tsx | 4822–4970 (Have/Want), 7195–7690 (proxy), 9131–9188 (trade tables), 10493–10600 (Have/Want tabs), 11290–11426 (QR), 11642–12545 (goldfish, sealed, packs, builder) → `src/styles/playtest.css`, `havewant.css`, `proxy.css` |
| 6 | **Premium-merkinnät + pakkaan lisäys korttidialogissa** (luku E) | M–L (E.1 + E.2 ≈ 150 riviä; E.3 ≈ 250 riviä TSX + testit) | 1, 2 (CardList- ja CardImageDialog-asettelu ensin) | CountControl.tsx, CardList.tsx (tila-attribuutit), CardTable.tsx (Kokoelma-sarake), uusi `CardDeckAdd.tsx`, CatalogView.tsx (`details`-lohko), texts.fi/en.ts, deckTexts.fi/en.ts | 1544–1565 (`.is-owned`/`.is-playset` poistetaan), 2095–2120 (rivikiskot poistetaan), 10615– (`.count-want-mark`) → `src/styles/premium.css`. **Tallennus (pakan päivitys) → testaus devissä (D-029) ja Digiturvan kevyt katselmointi.** |

**Järjestys:** 0 heti → 1 → rinnakkain {2, 3, 4a, 4b, 5a} (5b, kun 2 on yhdistetty) → 6 → UX-loppukatselmointi ja rikkomistestaus kerralla (D-026). Paketit 2 ja 6 koskevat molemmat `CardList.tsx`:ää ja `CatalogView.tsx`:ää, joten ne ajetaan peräkkäin.

**Kokoarvio:** XS < 50 riviä, S < 150, M 150–400, L 400–900 (CSS + TSX, ilman testejä).

---

## D) Wow-lista: 10 suurinta vaikutusta

1. **Korttiruudukko ilman laatikoita ja datanauha** (B.1, E.1): 5–6 korttia rivillä 1280:ssa, kuvat hallitsevat, omistus näkyy HUD-palkkina. Suurin yksittäinen muutos, joka näkyy kolmella sivulla.
2. **Avoimet osiot otsikkoviivalla paneelien sijaan** (A.3 `.panel`): "kolhot laatikot" poistuvat koko sivustolta yhdellä komponenttimuutoksella.
3. **Pakkaeditorin yksirivinen otsikko ja Tilastot-välilehti** (B.5): haku 550 px:stä 140 px:iin, ja pakka mahtuu ruudulle.
4. **Kontrollit kahteen kokoon, ohuemmat segmentit ja hiljaiset työkalupainikkeet** (A.3): rauhoittaa jokaista työkaluriviä.
5. **Uudet pinnat ja syvyys kummassakin teemassa** (A.1): tumma "lasi" (`--surface-1…3` ja varjo) sekä vaalean teeman valkoiset objektit beigellä pohjalla. Vaalea teema saa ensimmäistä kertaa hierarkian.
6. **Kokoelman Yleiskuva yhdelle ruudulle** mittarikaistana (B.3): 3.9 ruutua → ≤ 1.6, ja 1920:ssa yksi ruutu.
7. **Pakkaan lisäys korttidialogista** (E.3): uusi sujuva kulku, joka puuttuu nyt kokonaan.
8. **Mobiilin yläpalkki 165 → 128 px ja 2 korttia rivillä** (A.4, B.1): puhelimella näkyy heti sisältöä.
9. **Staattinen HUD-ruudukko, neon-yläreunat dialogeissa ja viistetyt objektit** (A.1, A.3): Cyberpunk-tunnelma ilman yhtään liikkuvaa elementtiä.
10. **Testaa-näkymät ilman paikanpitäjiä**, ja koko booster mahtuu ruudulle foil-kehyksin (B.6).

---

## E) Premium-merkinnät (paketti 6)

Yhteinen periaate: **tieto on HUD-lukema, ei kehys.** Kortti itse pysyy koskemattomana, ja tila luetaan sen alla olevasta datanauhasta tai kulmatagista. Kaikki on staattista, ja kummassakin teemassa on omat sävyt. Tila ei välity pelkällä värillä (aina luku ja symboli), ja ruudunlukija kuulee saman asian tekstinä. Vertailukohta on T-163 (r. 1745–1770): paksu sininen reuna korvattiin kuvan noston ja varjon yhdistelmällä. Sama ajattelu viedään omistukseen.

### E.1 Omistus ja täysi pelisarja korttiruudukoissa

**Vaihtoehdot arvioitu:**

| Vaihtoehto | Plussat | Miinukset | Valinta |
|---|---|---|---|
| Kulmatagi (viistetty chip kuvan kulmassa, "2/3") | Näkyy heti | Peittää kortin omat kulmatiedot (kustannus vasen ylä, voima oikea ala, tyyppi oikea ylä) | Osittain: vain täysi sarja |
| Foil- tai holokiilto (staattinen gradientti kuvan päällä) | Premium-tuntu | Heikentää kuvan luettavuutta, ei kerro määrää, vaikea vaaleassa teemassa | Vain täyden sarjan korostukseen, hillitysti |
| **HUD-datapalkki** (segmentit 1/3, 2/3, 3/3 kuvan alareunan alla) | Luettava yhdellä silmäyksellä, kertoo määrän ja täyteyden, toimii 320:ssa, ei peitä kuvaa | Ei yksinään "syty" kaukaa | **Kyllä, pääratkaisu** |
| Omistamattomien himmennys ja desaturaatio | Omistetut "syttyvät", tunnelmallinen | Uudelle käyttäjälle kaikki on himmeää, ja selauksessa kuvat menettävät väriä | **Kyllä, mutta lievä, ja vain kun kokoelmassa on ≥ 1 kortti** |

**Valinta:** HUD-datapalkki ja lievä himmennys omistamattomille. Täysi pelisarja saa lisäksi pienen "SET ✓" -kulmatagin datanauhaan ja hillityn foil-viivan palkkiin. Perustelu: palkki kertoo kolme asiaa yhdellä silmäyksellä (omistatko, montako ja onko sarja täysi) ilman, että kortin kuvaan tai reunoihin kosketaan. Himmennys tekee kokoelmasta "valaistun" kokonaisuuden, ja palkki tekee siitä tarkan.

**Rakenne (CardList.tsx, CountControl.tsx):** korttiruudun `li` saa `data-owned="0|n"` ja `data-playset="true|false"` (luokat `is-owned` ja `is-playset` jäävät testejä varten, mutta niiden reunatyyli poistuu). Kuvan alle tulee `<div class="own-meter" aria-hidden="true">`, jossa on `playsetSize`-määrä `<i>`-segmenttiä (Legend 1, muut 3). Ylimääräiset kopiot (> 3) näkyvät luvussa (`4`), eivät segmentteinä. Ruudunlukija kuulee nykyisen CountValue-tekstin ("Kokoelmassa 2 kappaletta" / ". Pelisarja täynnä"), joka säilyy sellaisenaan.

```css
/* Poistetaan: .card-box.is-owned / .is-playset border-color (r. 1550–1563), .card-table tr.is-owned/is-playset > :first-child box-shadow (r. 2103, 2111). */
.card-box { --own: var(--color-text-faint); --own-fill: transparent; }
.card-box.is-owned  { --own: var(--color-accent-edge); --own-fill: var(--color-accent); }
.card-box.is-playset { --own: var(--color-success); --own-fill: var(--color-success); }

.own-meter {
  display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 3px;
  block-size: 4px; margin-block-start: var(--space-1);
}
.own-meter > i { background: var(--line-strong); clip-path: polygon(0 0, 100% 0, calc(100% - 3px) 100%, 0 100%); }
.own-meter > i.is-on { background: var(--own-fill); }
/* Täysi sarja: hillitty staattinen foil-viiva segmenttien päällä (ei liikettä). */
.card-box.is-playset .own-meter > i.is-on {
  background: linear-gradient(90deg, var(--color-success), color-mix(in srgb, var(--color-success) 55%, #1fe0ff) 50%, var(--color-success));
}

/* Laskuri datanauhassa: mono, "2/3", täysi = ✓ SET -tagi. */
.own-count { font-family: var(--font-mono); font-size: 1rem; color: var(--own); font-variant-numeric: tabular-nums; }
.own-count .of { color: var(--color-text-faint); }
.set-tag {
  padding: 0 var(--space-1); font: 700 .75rem/1.5 var(--font-sans); letter-spacing: .12em; text-transform: uppercase;
  color: var(--color-on-success, #06150d); background: var(--color-success);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%);
}

/* Omistamattomat himmeämpiä, kun kokoelmassa on jotain (luokka listan juuressa: .card-grid.has-collection). */
.card-grid.has-collection .card-box:not(.is-owned) .card-image { filter: saturate(0.45) brightness(0.78); }
.card-grid.has-collection .card-box:not(.is-owned):is(:hover, :focus-within) .card-image { filter: none; }
@media (prefers-reduced-motion: no-preference) { .card-grid .card-image { transition: filter var(--ease-lift), transform var(--ease-lift), box-shadow var(--ease-lift); } }

:root[data-theme='light'] .card-box.is-owned { --own: #0e0f14; --own-fill: #0e0f14; }   /* keltainen ei ole viiva paperilla (UX.md 3.1) */
:root[data-theme='light'] .card-box.is-playset { --own: #17713f; --own-fill: #17713f; }
:root[data-theme='light'] { --color-on-success: #ffffff; }
:root[data-theme='light'] .card-grid.has-collection .card-box:not(.is-owned) .card-image { filter: saturate(0.5) brightness(0.92) contrast(0.9); }
@media (forced-colors: active) { .own-meter > i.is-on { background: CanvasText; } .card-image { filter: none !important; } }
```

**Kontrastit:** palkin segmentit ≥ 3:1 taustaa vasten (tumma: keltainen 15:1 ja vihreä 10:1 `--color-bg`:llä; vaalea: musta 17:1 ja #17713f 4.9:1 `#efece3`:lla). Luku "2/3" ≥ 4.5:1 kummassakin teemassa. SET-tagi: tumma #06150d #39e08a:lla 11:1; vaalea #fff #17713f:llä 5.9:1.
**Listanäkymä:** Kokoelma-sarakkeessa sama `own-meter` (48 px leveä) ja luku. Rivin vasen kisko poistuu.
**Merkintätila:** palkki päivittyy heti; mitään ei liikuteta.
**Hyväksymiskriteerit:** 320 px (2 saraketta) palkki ja luku näkyvät jokaisessa ruudussa. Tila erottuu harmaasävykuvassa (segmenttien määrä ja ✓ SET). axe tai vastaava: ei uusia kontrastivirheitä. Kortin kuva ei saa omistuksen takia uutta reunaa tai kehystä.

### E.2 Want- ja Have-merkki tähden ja nuolen tilalle

**Nyt:** `CountValue` piirtää ★ (want) tai ⇄ (have) luvun eteen (CountControl.tsx r. 37–41, CSS r. 10615). Tähti näyttää arvostelutähdeltä, ei listalta.

**Ratkaisu: listatagi.** Luvun vasemmalle puolelle tulee lyhyt versaalinen mono-tagi viistetyssä ääriviivassa: `WANT` tai `HAVE`, tiiviissä tilassa (alle 40rem ja `.step--compact`-rivit) yksi kirjain `W` / `H`. Tagi on osion värinen (Have/Want-osiossa sininen; muualla, esimerkiksi korttidialogissa, `--color-text-muted`). Väri ei kanna merkitystä, teksti kantaa. Korttidialogissa, jossa otsikko "Want-listalla" jo kertoo asian, tagia ei näytetä (prop `mark={false}`).

```tsx
{(want || have) && mark && (
  <span className={`list-tag list-tag--${want ? 'want' : 'have'}`} aria-hidden="true">
    <span className="list-tag-long">{want ? 'WANT' : 'HAVE'}</span>
    <span className="list-tag-short">{want ? 'W' : 'H'}</span>
  </span>
)}
```

```css
.list-tag {
  display: inline-flex; align-items: center; block-size: 1.25rem; padding: 0 var(--space-1); margin-inline-end: var(--space-1);
  font: 400 .75rem/1 var(--font-mono); letter-spacing: .1em; color: var(--section-accent);
  box-shadow: inset 0 0 0 1px currentColor;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%);
}
:root[data-theme='light'] .list-tag { color: var(--color-accent-2); }   /* tummennettu osioväri, ≥ 4.5:1 */
.list-tag-short { display: none; }
@media (max-width: 39.99rem) { .list-tag-long { display: none; } .list-tag-short { display: inline; } }
.step--compact ~ .count .list-tag-long, .row-compact .list-tag-long { display: none; }
```

Saavutettavuus: ruudunlukijan tekstit (`texts.wantPrefix` ja `havePrefix`) säilyvät ennallaan. Tekstimuutos: `wantEditing` fi "WANT-laskurin + ja − muuttavat want-listaa, eivät kokoelmaa." / en "The WANT counter's + and − change the want list, not the collection." Kriteeri: ★ ja ⇄ eivät esiinny missään näkymässä (grep), ja tagin kontrasti on ≥ 4.5:1 kummassakin teemassa.

### E.3 Pakkaan lisääminen korttidialogissa

**Nyt:** dialogissa on vain luettelo "Pakoissa" (linkit). Pakkaan lisääminen vaatii editorin avaamisen ja kortin hakemisen uudelleen.

**Kulku "Lisää pakkaan" (uusi komponentti `CardDeckAdd`, dialogin Pakat-lohko, heti Kokoelma-lohkon alla):**

```
PAKAT ───────────────────────────────────────────── (osio-otsikkoviiva, punainen neonsegmentti)
[ Punainen aggro            ▾ ]   [ Pääpakka | Sideboard ]   [−] 3 [+]
PUNAINEN AGGRO · PÄÄPAKKA 41/40–50 · ✓ LAILLINEN               Avaa pakka →
Myös pakoissa: Vihreä-punainen turnaus… (3)
```

1. **Pakan valinta:** natiivi `<select>` (A.3-kenttä). Oletuksena on viimeksi tässä dialogissa käytetty pakka (istunnon tila) tai viimeksi muokattu pakka (`updatedAt`). Listan viimeinen vaihtoehto on "+ Uusi pakka tällä kortilla", joka luo pakan (`decks.create`) nimellä "Uusi pakka" ja valitsee sen. Pakkoja ei vielä ole → näytetään pelkkä painike "+ Uusi pakka tällä kortilla".
2. **Osa:** `SegmentedChoice` `Pääpakka | Sideboard` (`.segmented--sm`). **Legend-kortille osaa ei kysytä:** tilalla on lukittu teksti "LEGEND · pakan Legend-paikka (2/3)", koska Legendit kuuluvat pääosioon ja sideboardissa ei saa olla Legendejä (SIDEBOARD-sääntö).
3. **Määrä:** `Stepper` (32 px, sama kuin editorissa) näyttää kortin määrän valitussa pakassa ja osassa. Jokainen painallus tallentaa heti (`decks.update(id, content, { expectedUpdatedAt })`), kuten editori. Raja on 3 kopiota (Legend 1), ja `+` rajalla on `aria-disabled` + syy (nykyinen rajailmoitus). Sideboardin raja on 7 korttia yhteensä.
4. **Palaute:** HUD-tilarivi päivittyy (koko, laillisuus ja puutteet samoilla funktioilla kuin pakkakortissa), ja `aria-live="polite"` -alue kertoo: "Japantown Jonin: Punainen aggro, pääpakka 3." Visuaalisesti muuttunut luku saa saman värivälähdyksen kuin proxy-laskuri (r. 7402: vain väri, ei liikettä). Ristiriita (pakka muuttunut toisessa välilehdessä) → nykyinen konfliktiteksti ja "Lataa uudelleen".
5. **"Myös pakoissa"** korvaa nykyisen Pakoissa-luettelon: muut pakat linkkeinä ja määrä suluissa.
6. **Näppäimistö:** Tab-järjestys pakka → osa → − → + → Avaa pakka. Enter `+`:ssa lisää. Fokus pysyy `+`:ssa (sama ratkaisu kuin CountControlissa).

**Visuaali (Cyberpunk, staattinen):** lohko on avoin osio, jossa on osioväri (punainen, Pakat) neonsegmenttinä otsikkoviivassa, vaikka dialogi avataan Kortit-sivulta. Näin käyttäjä näkee, että toiminto kohdistuu Pakat-osioon. Tilarivi on mono-HUD-tekstiä. Ei animaatioita.

**Tekninen huomio:** tallennus kulkee nykyisen `DeckRepository.update`n ja synkronoinnin kautta, eikä uutta tietomallia tarvita. Muutos koskee kuitenkin tallennusta → D-029: testataan ensin devissä, ja Digiturva tekee kevyen katselmoinnin (syöte: pakan id valinnasta, ei ulkoista syötettä). Testit: lisäys pääpakkaan ja sideboardiin, Legend ilman osavalintaa, raja 3 ja 1, sideboardin raja 7, uusi pakka, konflikti ja live-ilmoitus.

**Hyväksymiskriteerit:** 1280×800: Pakat-lohko näkyy dialogissa ilman vieritystä (Versiot kiinni). 320: lohko on ensimmäisen ja toisen ruudun rajalla, ja kontrollit ovat 2 rivillä (valinta täysleveänä; osa ja määrä samalla rivillä). Kortin lisääminen pakkaan onnistuu dialogista kolmella toiminnolla (valitse pakka, valitse osa, +), ja oletuspakalla yhdellä painalluksella.

---

## Ristiriidat ja päätökset PM:lle

- **R1. Kosketuskohteen koko:** ehdotan hiirelle 40 px:n kontrolleja (`--control-h`), kosketukselle 44 px (`@media (pointer: coarse)`). Nykyinen linja (UX.md 3.3, T-118) on 44 px kaikkialla. 40 px täyttää WCAG 2.5.8:n (24 px) reilusti. Päätös: hyväksytäänkö kaksi tasoa?
- **R2. Pienin tekstikoko:** UX.md 3.2 sanoo "ei alle 16 px", mutta sovelluksessa on jo 12–14 px:n tekstiä (4 234 + 1 698 solmua 1280:ssa). Ehdotan virallisesti: leipäteksti ja ohjeet ≥ 16 px, **versaalilabelit ja mono-lukemat 14 px** ja tagit (SET, WANT) 12 px. UX.md 3.2 päivitetään.
- **R3. Omistamattomien himmennys** (E.1) on tuotepäätös: kortit näyttävät erilaisilta selaustilassa, kun kokoelmassa on jotain. Vaihtoehto: himmennys vain Kokoelma-suodattimen "Kaikki"-tilassa ja asetus pois päältä.
- **R4. Mobiilinavigaatio:** ehdotukseni on tiivistetty yläpalkki (128 px). Vaihtoehto on kiinteä alapalkki (56 px, 6 ikonia), joka säästäisi vielä noin 70 px, mutta se muuttaa navigaation rakennetta ja vaatii sivulle alapaddingin. Tuotepäätös.
- **R5. Pakkaeditorin tilastot omalle välilehdelleen** (B.5) muuttaa editorin rakennetta (nyt tilastot ovat pakan alla). Testit (`DeckEditor.tabs.test.tsx`) päivittyvät.
- **R6. Pakkakortin AVAA-painikkeen poisto** (B.4): koko kortti on linkki. Tämä muuttaa T-050:n toimintoruudukon ("Avaa omalla rivillään").
- **R7. Kortin alanimi poistuu ruudukon datanauhasta** (näkyy kuvassa, nimen `title`:ssa ja dialogissa). Jos alanimi halutaan pitää näkyvissä, ruutuun tulee toinen rivi ja tavoite "5 korttia rivillä 1280:ssa" pätee silti, mutta "ensimmäinen rivi kokonaan näkyvissä" ei välttämättä.
- **R8. UX.md 3.4:n "sticky-elementtejä ei käytetä"** on jo vanhentunut (merkintätilan ja pakkaeditorin alapalkit ovat sticky tai fixed). Lause päivitetään vastaamaan nykyistä linjaa ("ei peitä fokusoitua elementtiä").
- **R9. Paketti 0** (skannerin mobiilikorjaus) on tuotannossa näkyvä vika. Ehdotan, että se tehdään heti erillisenä pikakorjauksena ennen T-181:n muita paketteja.
