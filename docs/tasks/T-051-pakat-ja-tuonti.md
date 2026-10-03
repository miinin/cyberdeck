# T-051 · Pakat-sivu ja tuontiraportti T-050:n tyyliin (sisältää T-044:n)
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
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

### 2026-10-03 · Koodari → PM (luovutus)
- **Tehty:** Pakat-lista korttiruudukkona (DecksView: `DeckCardSummary`, Legend-banneri, värit CardColorilla, edistymispalkki, laillisuus, "Kokoelmasta puuttuu N" useCollectionin kautta, muokkausaika, kompaktit toiminnot). Yläpalkki ja tyhjä tila: Uusi pakka, Tuo pakkalista, Hae Netdeckistä (avaa tuonnin fokus linkkikentässä, paluu palauttaa fokuksen painikkeeseen). Tuontiraportti (DeckImport): lähteet rinnakkaisissa paneeleissa, yhteenveto deck-head-tyylillä, Tallenna pakaksi heti sen alla, Säännöt, tunnistamattomat rivit varoituslaatikossa, Legendit kuvina (legend-slots), pääpakka tyypeittäin deck-tile-tyylillä (Cost-jalokivi, omistat x/y · puuttuu N), DeckStats uudelleenkäytetty. Leveällä: kortit vasemmalla, yhteenveto/tallennus/säännöt/tilastot oikealla.
- **Uudelleenkäyttö:** DeckCardImage exportattu DeckLististä, CostGem, DeckStats, deck-head/deck-progress/legend-slots/deck-tile-CSS. DeckListiä ei käytetty sellaisenaan (siinä on −/+ ja poisto, raportti on vain luku).
- **Uudet tekstit (deckTexts, Sisällöntuottajan tarkistettava):** listEmptyTitle, listEmptyHint, fetchNetdeck, deckColors, textHeading.
- **Testit:** 2 uutta DecksView (puuttuu-määrä kortilla, tyhjän tilan toiminnot + Netdeck-fokus), 1 uusi DeckImport (raportin rakenne). Vanhoja ei muutettu. npm test 726/726, lint 0, build ok.
- **Tarkistus:** kuvat scratchpadissa e-decks-*, e-import-* (375, 1920, 2850, kumpikin teema). axe 0 rikkomusta (320 ja 1920, tumma ja vaalea, lista/tyhjä/raportti), ei vaakavieritystä 320 px:ssä.
- Koodikatselmointi: tehty · Pakollisia korjattu 1 (raportin yhteenveto ei ole sticky, WCAG 2.4.11) · Suosituksia 2: (1) "Myös pakoissa" -lista voi venyttää rivejä, kun pakkoja on paljon – harkitse lyhennystä; (2) jokainen pakkakortti laskee validoinnin ja ryhmittelyn joka renderöinnissä (200 pakan raja, ei mitattu ongelmaa).
- **Seuraavaksi:** PM esikatselu; UX-katselmointi MVP-tason lopussa.
