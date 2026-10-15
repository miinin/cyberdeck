# T-167 · Kortin tietolaatikko luettavaksi isolla näytöllä
**Tila:** Done · **Omistaja:** PM · **MVP:** 1 · **Prioriteetti:** Must
**Päättäjä:** käyttäjä (2026-10-15): läppärillä (2866 × 1612) kortin kuva oli valtava ja tiedot sen vieressä liian pieniä luettaviksi.

## Toteutus
- Vähintään 100 rem leveällä näytöllä dialogi käyttää koko leveyden (aiemmin enintään 100 rem). Otsikkoa, tageja ja tietosaraketta suurennetaan `zoom`illa: 1,2 (≥ 100 rem), 1,4 (≥ 125 rem) ja 1,6 (≥ 160 rem). Versioiden pikkukuvat ovat 8 rem korkeita.
- Saatavuus-huomautus on vain tekstinsä levyinen, ja lähdelista on `--font-size-sm`.

## Luovutus
PM (2026-10-15): Tarkistettu kuvakaappauksista 2866 × 1612, 1600 × 900 ja 320 px. Testit, lint ja build läpi.
