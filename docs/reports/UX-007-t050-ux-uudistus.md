# UX-007 · T-050 UX-uudistus (a, b, c) · 2026-10-03

**Katselmoija:** UX Designer · **Haara:** `t-050-ux-uudistus` (ceae516), paikallinen `vite preview` · **Veto: kyllä** (UX-043, korjaus muutama rivi CSS:ää)

## Yhteenveto
Critical 0, High 1, Medium 3, Low 5. Uudistus toimii hyvin: leveys on käytössä, rivinäkymä on selkeä, laillisuus näkyy aina ja näppäimistö, live-ilmoitukset ja mobiilin alapalkki toimivat. Yksi WCAG 2.2 AA -poikkeama on löytynyt: sticky-taulukko-otsake peittää fokuksen 200 %:n zoomilla (2.4.11). Tavoitteesta "UX 5/5" puuttuu eniten pakkasarakkeesta. Legend-kuvat vievät leveällä näytöllä koko näkyvän osan, joten pääpakka jää taitteen alle, ja laatat ovat ahtaita.

Arvio nyt: **ulkoasu 4/5, toiminnot 4/5**. Kun UX-043–UX-048 on korjattu, arvio on 5/5.

## Menetelmä
- `npm run build` ja `vite preview` (portti 4199). Headless Chrome ajettiin CDP:llä Noden omalla WebSocketilla, eikä uusia riippuvuuksia lisätty. Skriptit ja kuvat ovat scratchpadin `ux/`-kansiossa.
- **axe-core 4.10.2** (cdnjs, injektoitu `Runtime.evaluate`-kutsulla, tagit wcag2a/2aa/21aa/22aa ja best-practice) ajettiin pakkaeditorissa ja Kortit-sivulla, 1920 px ja 375 px, tumma ja vaalea teema: **0 rikkomusta** 8 ajossa. Kontrastin `incomplete`-tuloksia oli 11–713 per ajo, koska bodyn taustagradientin takia axe ei pysty laskemaan kontrastia.
- **Pikselikontrasti:** tekstit piilotettiin, tausta kuvattiin ja jokaiselle näkyvälle tekstisolmulle laskettiin kontrasti (efektiivinen opasiteetti mukana, tekstin varjo ei mukana). Mittaus kattoi editorin `main`-alueen ja Kortit-sivun molemmissa teemoissa, yhteensä 8 000 tekstisolmua. **0 alitusta.** Tiukimmat arvot: vaalea teema, "puuttuu N" kuvakaistaleen päällä p10 4.54 ja min 4.32 ilman varjoa, sekä estetyn rivin himmennetty nimi 4.68.
- **Näppäimistö:** Tab-polku (45 askelta editorissa ja 30 Kortit-sivulla), `+`/`=`/`-`, Esc esikatselussa, ongelmanappi, "Näytä pakka", "Takaisin hakuun", Pinot ja sirut. Fokusrengas (3px solid) näkyi kaikissa pysähdyksissä.
- **Hiiri:** napsautus, Shift+napsautus, oikea napsautus ja 250 ms:n hover-esikatselu.
- **Koot ja zoom:** 320, 375, 1280, 1920 ja 2850 px sekä 200 % (640×450 @2x) ja 400 % (320×225 @4x), molemmat teemat. Vaakavieritystä ei ollut missään (scrollWidth = innerWidth kaikissa 24 mittauksessa).
- **Fokus ei peity (2.4.11):** 60 Tab- ja Shift+Tab-askelta taulukossa 200 %:n ja 400 %:n zoomilla sekä 40 askelta 375 px:ssä alapalkin kanssa.
- Ruudunlukijaa ei ajettu. Semantiikka tarkistettiin DOMista: otsikot, maamerkit ja live-alueet.

## Tulokset (tarkistuslista)
| Kohta | Tulos |
|---|---|
| Leveys | 2850 px: sisältö 2560 px, kaistat reunoilla. Kortit Keski: 6 saraketta 1920 px:ssä. OK |
| Otsikot ja maamerkit | h1 → h2 Suodattimet / Lisää kortteja / "{pakka}: pakan kortit" → h3 Ongelmat, h2 Legendit, Pääpakka, Tilastot. OK |
| Tab-järjestys | Nimi → vienti → haku → suodattimet → näkymä → rivit (kuva, −, +). Järjestys vastaa visuaalista. Pakkaan pääsee vasta noin 450 askeleen jälkeen (UX-044). |
| `+` / `−` | Toimii fokusoidulla rivillä. Estetty Legend ei lisäänny, ja siitä tulee status-ilmoitus. OK |
| Live-ilmoitus | "Dum Dum, Maelstrom Triggerman: 1 pakassa. Legendejä 4/3." ja "Tallennettu". "Tallennetaan…" ei puhu. OK |
| Shift+napsautus / oikea napsautus | Poistaa yhden. Tekstiä ei valikoidu. OK |
| Hover-esikatselu | 288×402 px, `aria-hidden`, ei peitä riviä, Esc sulkee. OK |
| Ongelmanappi | Fokus siirtyy h3:een "Ongelmat". OK |
| Mobiili 375 px | Alapalkki ei peittänyt fokusta 0/40 askeleella. "Näytä pakka" vie fokuksen pakan otsikkoon ja "Takaisin hakuun" hakukenttään. OK |
| Pinot | Kortit ovat nappeja "Suurenna kuva: X, n pakassa", ja fokus nostaa kortin. Liike vain `no-preference`-tilassa. OK |
| Kohteiden koko | Rivin −/+ 32 px, laatan −/+ 28 px, Legendin × 24 px. ≥ 24 px. OK |
| 200 % / 400 % | Ei vaakavieritystä. Sticky-otsake peittää fokuksen 200 %:lla (UX-043). 400 %:lla sticky-elementit vievät 45 % näkymästä (UX-049). |

## Löydökset

### UX-043 · Sticky-taulukko-otsake peittää fokusoidun napin kokonaan · High
**Sijainti:** `src/styles.css:2367` (`.pick-table thead th { position: sticky; top: 0 }`) · **Tehtävä:** T-050b
**Toistaminen:** 1) Ikkuna 1280×900 ja zoom 200 % (640×450 CSS px). 2) Vie fokus taulukon 10. rivin +-nappiin. 3) Tab 30 kertaa eteenpäin ja sitten Shift+Tab 30 kertaa.
**Odotettu:** fokusoitu nappi näkyy aina. · **Havaittu:** 2/60 askeleella nappi on kokonaan otsakerivin (33 px) alla, koska Shift+Tab vierittää elementin ikkunan yläreunaan.
**Vaikutus:** WCAG 2.2 AA 2.4.11 (Focus Not Obscured) ei täyty. Näppäimistökäyttäjä ei näe, missä fokus on.
**Korjausehdotus:** `.pick-table :is(button, [tabindex]) { scroll-margin-top: 3rem; }` (otsakkeen korkeus ja väli). Lisäksi sticky-otsake samaan `@media (min-height: 40rem)` -ehtoon kuin muutkin sticky-elementit (määrittelyn sääntö).
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-044 · Hakutuloksista ei pääse näppäimistöllä pakkaan ilman satoja Tab-painalluksia · Medium
**Sijainti:** `src/ui/DeckEditor.tsx` (poimijan ja pakkasarakkeen välissä) · **Tehtävä:** T-050b/c
**Toistaminen:** L/XL-koko: aloita hakukentästä ja paina Tab, kunnes fokus on pakkasarakkeessa. · **Havaittu:** 151 riviä × 3 pysähdystä, eli noin 450 askelta. Ohitusreittiä ei ole (alapalkki on vain alle 64rem).
**Vaikutus:** Ruudunlukija pääsee pakkaan maamerkillä (2.4.1 täyttyy), mutta näkevälle näppäimistökäyttäjälle pakan tarkistaminen on käytännössä mahdotonta.
**Korjausehdotus:** Työkalurivin ("151 / 151 korttia") yhteyteen linkkinappi **"Siirry pakkaan"**, joka vie fokuksen pakan otsikkoon (sama toiminto kuin alapalkin "Näytä pakka"). Pakkasarakkeen sticky-otsakkeeseen **"Siirry hakuun"** (sama kuin "Takaisin hakuun"). Molemmat voivat näkyä vain fokuksessa (skip link -tyyli).
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-045 · Estetyn Legendin merkki ja ruudunlukijan teksti ovat ristiriidassa · Medium
**Sijainti:** `src/ui/DeckEditor.tsx:258–263` (`blockerOf`), `src/domain/deckRules.ts:181–190` · **Tehtävä:** T-050b
**Toistaminen:** 1) Lisää 3 Legendiä (esim. V). 2) Katso V:n riviä. · **Havaittu:** näkyvä merkki on "Sama Legend", mutta `aria-describedby` sanoo "Pakassa on jo 3 Legendiä.", koska `addBlocker` palauttaa ensin määräsäännön. Lisäksi "Raja täynnä" kuulostaa estolta, vaikka kortin voi lisätä (piilotettu teksti "Voit silti lisätä kortin." ei näy näkevälle).
**Vaikutus:** Näkevä ja ruudunlukijan käyttäjä saavat eri syyn. "Raja täynnä" saa käyttäjän luulemaan, ettei lisääminen onnistu.
**Korjausehdotus:** Kun `hasSameNameLegend` on tosi, syy on aina `Pakassa on jo Legend {nimi}.` Määräsäännön lyhyt merkki on **"Yli rajan"** ja `title` = koko syy (vaihtoehto: "Raja täynnä, voi lisätä"). Teksti `deckTexts.blockedLimit`.
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-046 · Legend-kuvat vievät pakkasarakkeen näkyvän osan, ja pääpakka jää taitteen alle · Medium
**Sijainti:** `src/ui/DeckList.tsx`, `src/styles.css` (`.legend-slot`) · **Tehtävä:** T-050c
**Toistaminen:** 1920×1080, pakassa 3 Legendiä. · **Havaittu:** kolme täysikokoista kortinkuvaa (noin 130×185 px) ja nimirivit. Pääpakan ensimmäinen laatta alkaa noin y=1050 eli ikkunan alareunasta. 2850 px:ssä kuvat ovat noin 190×270 px.
**Vaikutus:** Käyttäjän palautteen ydin ("oleellinen tieto on vaikea nähdä") toteutuu vain osittain, koska pakan sisältö pitää vierittää esiin.
**Korjausehdotus:** Legend-paikat matalammiksi. Kuva rajataan yläosaan (`aspect-ratio: 733/600; object-fit: cover; object-position: top`) ja korkeus on enintään 8rem, tai Legendit näytetään samana laattana kuin pääpakka ja kuva aukeaa hoverilla tai dialogilla. Tavoite: 1080 px:n korkeudessa näkyy otsake, Legendit ja vähintään 8 pääpakan laattaa.
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-047 · Pakkalaatat ovat ahtaita: nimi katkeaa ja kuvakaistale jää piiloon · Low
**Sijainti:** `src/styles.css:2982` (`.deck-tile`), pakkasarakkeen leveys `clamp(24rem, 22vw, 30rem)` / ≥ 140rem 38rem · **Tehtävä:** T-050c
**Havaittu:** 1920 px:ssä "Kerry Eurodyne, The Las…" ja "Meredith Stout, Stone C…". "puuttuu 2" vie noin 60 px jokaisella rivillä, ja kuvakaistale jää ×N:n ja Stepperin alle (opasiteetti 0.38). Samaan aikaan poimijan Nimi-sarakkeessa on 400–600 px tyhjää (UX-048).
**Korjausehdotus:** Pakkasarake leveämmäksi XL:ssä (esim. `clamp(26rem, 26vw, 40rem)`). "puuttuu N" nimen alle pienellä tai lyhyenä merkkinä, jonka koko teksti on visually-hidden. Kuvakaistale nimen ja määrän väliin, ei Stepperin alle.
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-048 · Poimijan Nimi-sarake venyy tyhjäksi leveällä näytöllä · Low
**Sijainti:** `src/styles.css` (`.pick-table`, max 110rem) · **Tehtävä:** T-050b
**Havaittu:** 1920 px:ssä Nimen ja Tyypin välissä on noin 380 px tyhjää ja 2850 px:ssä noin 570 px. Silmä joutuu hyppäämään rivin yli.
**Korjausehdotus:** Nimi-sarakkeelle `max-width: 22rem` ja ylimääräinen tila pakkasarakkeelle (UX-047), tai taulukon maksimileveydeksi noin 80rem.
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-049 · Alapalkin teksti katkeaa kesken lukuvälin, ja 400 %:lla sticky-elementit vievät 45 % näkymästä · Low
**Sijainti:** `src/ui/DeckEditor.tsx` / `deckTexts.mobileBar`, `src/styles.css:3254` (`.deck-bar`) · **Tehtävä:** T-050c
**Havaittu:** 320–375 px: "Pakka 36/40–" / "50 · Legendit 7/3". 400 % (320×225): alapalkki 68 px ja taulukko-otsake 33 px.
**Korjausehdotus:** Luvut `white-space: nowrap` -spaniin ("36/40–50" ja "Legendit 7/3"). `@media (max-height: 30rem)`: alapalkki `position: static` ja taulukko-otsake ei sticky (ks. UX-043).
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-050 · "Takaisin hakuun" näyttää tavalliselta tekstiltä · Low
**Sijainti:** pakkaosion alku mobiilissa (`DeckEditor.tsx`/`DeckList.tsx`, linkkinappi) · **Tehtävä:** T-050c
**Havaittu:** 320 px:ssä teksti on ilman alleviivausta tai nappikehystä, eikä sen toiminto erotu (Nielsen 6, tunnistettavuus).
**Korjausehdotus:** Linkkityyli (alleviivaus ja accent-väri) ja nuoli "← Takaisin hakuun", tai `button-secondary`.
**Tila:** Korjattu (T-050: Fix UX-007 findings)

### UX-051 · Vaalean teeman "puuttuu N" kuvakaistaleen päällä on kontrastirajalla · Low
**Sijainti:** `src/styles.css:3011` (`:root[data-theme='light'] .deck-tile-art { opacity: 0.28 }`) · **Tehtävä:** T-050c
**Havaittu:** pikselimittaus ilman tekstin varjoa: p10 4.54:1, pahin pikseli 4.32:1 (vaatimus 4.5). Varjon kanssa raja täyttyy, mutta marginaali on pieni ja riippuu kortin kuvasta. Tumma teema on reilusti yli.
**Korjausehdotus:** Opasiteetiksi 0.2 vaaleassa teemassa tai "puuttuu" pois kaistaleen päältä (UX-047).
**Tila:** Korjattu (T-050: Fix UX-007 findings)

## Huomio (ei T-050:n löydös)
- Väri-suodattimen vaihtoehdot ovat pelkkiä värilaattoja (T-045, `title`, saavutettava nimi kunnossa). Värisokealle Red- ja Green-laattojen ero on pieni. Arvioidaan MVP-tason saavutettavuusauditoinnissa.
  **Korjattu:** laatoissa näkyy nyt värin nimi (Red/Yellow/Green/Blue, lang="en") värilaatan vieressä.

## Korjausjärjestys
1. UX-043 (High, veto): `scroll-margin-top` ja sticky-otsake vain `min-height: 40rem`.
2. UX-045: syyteksti ja "Yli rajan".
3. UX-044: "Siirry pakkaan" / "Siirry hakuun".
4. UX-046: Legend-paikat matalammiksi.
5. UX-047 + UX-048 + UX-051: tila poimijalta pakkasarakkeelle, laatan uusi järjestys.
6. UX-049, UX-050: alapalkin rivitys, matala ikkuna ja linkkinapin tyyli.
