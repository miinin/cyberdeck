# T-190 · Mobiilin navigointi alapalkiksi
**Tila:** Review · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-21: kaksirivinen mobiilinavi ei näytä hyvältä, tilalle moderni ja tyylikäs ratkaisu.
**Katselmoinnit:** PM kuvakaappauksista. Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

## Määrittely (PM)
PM:n valinta: **kiinteä alapalkki (bottom tab bar)** alle 40rem:n leveydellä, nykysovellusten tapaan. Yläpalkista tulee yksi rivi (logo + teema, kieli, tili), noin 48–56 px.

1. **Alapalkki:** viisi paikkaa, ikoni + lyhyt teksti (label-tyyli, 0.6875–0.75rem, versaali tai normaali, kunhan mahtuu 320 px:iin):
   Kortit · Kokoelma · Pakat · Have/Want · **Lisää**.
   "Lisää" avaa alhaalta nousevan paneelin (bottom sheet, `dialog`), jossa Testaa ja Proxy (Proxyn jonomäärä badgena), isot 48 px rivit. Jos Testaa- tai Proxy-sivu on auki, Lisää-painike näkyy aktiivisena.
   - Aktiivinen kohde: osion värinen ikoni ja teksti sekä ohut osion värinen viiva palkin yläreunassa kohteen kohdalla (staattinen, ei animaatiota). Muut muted (AA).
   - Palkki: `--surface-3`-pinta, 1 px yläviiva, `padding-bottom: env(safe-area-inset-bottom)`, korkeus 56 px + safe area. Kosketusalue ≥ 44 × 44 px.
   - Ikonit: inline-SVG, 22–24 px, samaa viivatyyliä kuin muut sovelluksen ikonit (ei uutta riippuvuutta).
   - `nav aria-label`, `aria-current="page"`, Lisää-painikkeessa `aria-haspopup="dialog"` ja `aria-expanded`.
2. **Sivun sisältö ei jää palkin alle:** `body`/`main` saa alapehmusteen palkin korkeuden verran. Muut kiinteät alapalkit (merkintätilan palkki, pakkaeditorin alapalkki, sticky-palkit) nostetaan alapalkin yläpuolelle tai alapalkki piilotetaan niiden ajaksi. Valitse selkein ja kirjaa luovutukseen. Dialogit (korttidialogi, skanneri) peittävät alapalkin.
3. **Yläpalkki mobiilissa:** yksi rivi, ei navigaatiota. h1:n yläreuna siirtyy ylemmäs (mittaa ennen/jälkeen).
4. Työpöytä (≥ 40rem) säilyy ennallaan.
5. Reduced-motion: bottom sheet ilman liukuanimaatiota tai ≤ 150 ms. Forced-colors toimii.

**Hyväksymiskriteerit:** 320, 375 ja 390 px: kaikki viisi kohdetta yhdellä rivillä ilman katkeavaa tekstiä, ei vaakaylivuotoa, sisältöä ei jää palkin alle (viimeinen elementti näkyy kokonaan sivun lopussa). h1:n yläreuna ≤ 90 px. Testit navin järjestykselle, Lisää-paneelille ja aria-current-tilalle.
Haara `t-190-alapalkki` testistä.

## Luovutus (Koodari)
**Toteutus:** uusi `src/ui/MainNav.tsx` (App.tsx käyttää sitä), CSS `src/styles.css` (alle 40rem), `src/styles/cards.css` (merkintäpalkki), teksti `navMore` (Lisää / More) fi ja en. Sama DOM palvelee työpöytää: ikonit, Lisää-painike ja paneeli näkyvät vain alle 40rem, Testaa ja Proxy (`.nav-extra`) piilotetaan alapalkista ja ovat Lisää-paneelissa (`dialog.nav-sheet`, 48 px rivit, Proxyn jonomäärä badgena, sulkunappi, Esc ja taustan klikkaus sulkevat, sivunvaihto sulkee). Lisää on aktiivinen (`data-current`), kun Testaa tai Proxy on auki. Ei animaatioita (reduced-motion ok), forced-colors saa reunaviivat.
**Mittaukset (h1:n yläreuna, 320/375/390 px):** ennen 138 px (Kokoelma 141), jälkeen 57 px (Kokoelma 60). Yläpalkin korkeus 130 → 49 px. Kriteeri ≤ 90 px täyttyy. Alapalkki 57 px (56 + 1 px viiva), viisi kohdetta yhdellä rivillä, tekstit mahtuvat (myös englanniksi 320 px:ssä), vaakaylivuotoa ei.
**Muut alapalkit (valinta: nostetaan alapalkin yläpuolelle):** uusi muuttuja `--bottom-nav-h` (0 paitsi alle 40rem: 3.5rem + safe area). Merkintätilan palkki `bottom: var(--bottom-nav-h)` (safe-area-pehmuste pois, koska alapalkki kattaa sen), pakkaeditorin `.deck-bar` ja Goldfishin `.gf-bar` sticky `bottom: var(--bottom-nav-h)`, toast ja `scroll-padding-bottom` nostettu. Syy: navigointi pysyy aina tavoitettavana merkintätilassakin, eikä layout hypi piilotuksen takia. Dialogit (korttidialogi, skanneri, vahvistukset) ovat top layerissä ja peittävät alapalkin; korttikatselin ja zoom (z-index 20) peittävät sen (nav z-index 15); galleria piilottaa headerin ja samalla alapalkin sekä body-pehmusteen. `body` saa alapehmusteen `--bottom-nav-h`: sivun viimeinen elementti jää alapalkin yläpuolelle (mitattu Kortit, pakkaeditori, Goldfish, Testaa, Proxy: 320/375/390, tumma ja vaalea).
**UX.md:** luku 3, Yläpalkki (R4): puhelinkuvaus korvattu alapalkin kuvauksella (rakenne, värit, Lisää-paneeli, muiden palkkien sijoitus, h1 138 → 57 px) ja muutosrivi 0.12.
**Testit:** uusi `MainNav.test.tsx` (järjestys, aria-current, Lisää-aktiivisuus, paneeli ja sulkeminen, aria-haspopup ja aria-expanded). Päivitetty: `styles.t181.test.ts` (R4 viisi paikkaa), `App.theme.test.tsx` (Tab-järjestys: Lisää-painike DOMissa), `CollectionView.test.tsx` (vahvistusnappi haetaan dialogista, koska "Lisää" nimi törmäsi). npm test 2159/2159, lint ja build läpi.
**Huomio:** DOM-järjestys: nav on ennen työkaluja, joten puhelimella Tab-järjestys kulkee logo, alapalkin viisi kohdetta, työkalut (visuaalinen järjestys eroaa). Hyväksyttävä, mutta mainitaan; vaihtoehto olisi nav työkalujen jälkeen DOMissa ja työpöydän järjestys CSS:llä (muuttaisi desktopin Tab-järjestystä).
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (Tab-järjestys, yllä)
**Kuvat:** `C:/Users/miininmm/AppData/Local/Temp/claude/c--Users-miininmm-dev-cyberdeck/0e3c5532-fd13-44e9-8e82-81fb6bddf77c/scratchpad/ux/t190/` (`{dark|light}-w{320|375|390|1280}-{cards,marking,editor,goldfish,testaa,proxy}` ja `-end`, `more-open`, `more-open-proxy`, `card-dialog`, 390 px `crop-bar`, myös `dark-w320-en-*`).
