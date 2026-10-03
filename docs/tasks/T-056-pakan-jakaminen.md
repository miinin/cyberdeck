# T-056 · Pakan jakaminen linkillä
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Malli:** D-014
**Haara:** `t-056-pakan-jakaminen`

## Määrittely
- "Jaa linkki" -nappi pakkaeditorin ja Pakat-sivun Vie-nappien vieressä: kopioi `<origin>/#/jaa/<data>` leikepöydälle (varana valittava tekstikenttä) ja ilmoittaa "Linkki kopioitu".
- `<data>` = base64url(UTF-8) pakan tekstiviennistä ilman kommenttirivejä (`src/domain/deckShare.ts`, enintään 16 000 merkkiä).
- Reitti `#/jaa/<data>`: vain luku -näkymä DeckImportin raportilla, "Tallenna omaksi pakaksi" luo pakan ja avaa editorin. Virheellinen linkki: selkokielinen virhe ja linkki Pakat-sivulle.
- Syöte epäluotettava: sama `parseDeckText`-validointi ja rajat kuin tekstituonnissa, ei HTML:ää (SR-1).

## Luovutus
Toteutettu: deckShare.ts + testit, SharedDeckView, DeckImport `sharedText`-tila, ExportButtons-nappi, reitti, tekstit, CHANGELOG. Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 0. Digiturva-katselmointi suositeltava (ulkoinen syöte URLista).
