# T-051 · Pakat-sivu ja tuontiraportti T-050:n tyyliin (sisältää T-044:n)
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Malli:** D-014. PM käynnisti käyttäjän yöluvalla 2026-10-03 ("yllätä positiivisesti"). Ei uutta riippuvuutta eikä tietomallia.
**Haara:** `t-050-ux-uudistus` (sama yö-PR #22)

## Hyväksymiskriteerit
1. **Pakat-lista (DecksView):** pakat korttiruudukkona koko leveydellä (auto-fill, noin 20–24rem). Kortissa ovat:
   - Legendien kuvat rajattuna (yläosa) bannerina ja pakan nimi isona
   - värit pisteinä tai merkkeinä, pääpakan määrä m/40–50 pienenä edistymispalkkina ja laillisuus (✓ Laillinen / ⚠ n ongelmaa)
   - "puuttuu N" kokoelmasta ja päivitysaika
   - toiminnot (Avaa, Nimeä uudelleen, Poista jne.) säilyvät saavutettavina. Tyhjä tila on houkutteleva ja sisältää selkeät toimintakehotteet (Uusi pakka, Tuo lista, Hae Netdeckistä).
2. **Tuontiraportti (DeckImport, T-044):** raportti esitetään samalla tyylillä kuin pakkasarake:
   - Legendit kuvina, pääpakka riveinä Cost-jalokivellä ja "puuttuu N" -merkinnällä, yhteenveto edistymispalkilla
   - "Tallenna pakaksi" on selkeä ensisijainen toiminto
   - Netdeck-linkkikenttä ja tekstikenttä ovat siistejä ja yhtenäisiä, ja tunnistamattomat rivit näkyvät selkeästi
   Käytä T-050c:n komponentteja (DeckList, DeckStats) uudelleen, jos se onnistuu järkevästi.
3. Ei vaakavieritystä 320 px:ssä. axe 0 rikkomusta. Kumpikin teema.
4. `npm test`, lint ja build läpi, testejä ei heikennetä. CHANGELOG.

## Luovutukset
