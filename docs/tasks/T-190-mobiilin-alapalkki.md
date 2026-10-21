# T-190 · Mobiilin navigointi alapalkiksi
**Tila:** In Progress · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-21: kaksirivinen mobiilinavi ei näytä hyvältä, tilalle moderni ja tyylikäs ratkaisu.
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
