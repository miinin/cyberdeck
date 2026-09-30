# Tutkimus: Cyberpunk TCG:n korttidata ja pakkalistat · 2026-09-30

## Korttidata (todennettu)
- Virallinen tietokanta cyberpunktcg.com/cards käyttää Netdeck.gg:n julkista JSON-rajapintaa:
  `GET https://api.netdeck.gg/api/cards/cyberpunk`
  - Ei vaadi avainta. CORS on auki (Vary: Origin). Vastaus on muotoa `{items, total, limit, offset}` ja sivutettu (limit 60).
  - Todennettu 2026-09-30: HTTP 200, 60 korttia per sivu. Virallinen sivusto näyttää yhteensä 151 korttia.
  - Kentät: id, name, subname, display_name, canonical_name ("V — Streetkid"), card_type (Legend/Unit/Gear/Program), color, cost, power, ram, rarity, set {code,name}, print_number, rules_text, keywords, classifications, legalities, image_url.
  - `printings[]`: saman kortin eri painokset, esim. collector_number `005a`, `005b`, `144`, `β005a`, promot (`Edgerunner Open S 1`) ja ranskankieliset (`-fr`-setit, `localized_name`).
- **Kuvat:** `image_url` on aikarajattu allekirjoitettu CloudFront-linkki (Expires/Signature). Sitä ei voi tallentaa pysyvästi, vaan se haetaan tarvittaessa uudelleen rajapinnasta. Kuvien käyttöoikeusehtoja ei löytynyt, joten Digiturva ja Arkkitehti tarkistavat ne (varavaihtoehto on tekstipohjainen näkymä).
- Pakkarajapinta `api.netdeck.gg/api/cyberpunk/decks` vaatii kirjautumisen (HTTP 401). Pakkoja **ei voi hakea suoraan linkistä**, joten tuonti tehdään tekstinä.
- Muita yhteisön palveluita: ExBurst, Cyberpunk TCG Meta, ripperdeck (kokoelma, trade & wants, skannaus), CHOOMDEX, Cyberdeck Tools, CyberDecks, Cyberpunk TCG Sim.

## Pakkarakenne (Cyberdeck Tools -palvelun mukaan)
- 3 Legendia, pääpakka 40–50 korttia, sivupakka 0–7 (ei Legendejä sivupakassa).

## Pakkalistojen tekstimuodot
1. **Otsikkomuoto** (yhteisön simulaattori, github.com/marcuserlandsson/cyberpunk_tcg_simulator):
   ```
   # Pakan nimi
   ## Legends
   Goro Takemura — Hands Unclean
   ## Cards
   2x Swordwise Huscle
   ```
   Nimi ja alaotsikko erotetaan merkillä "—", kun nimi ei yksin riitä yksilöimään korttia.
2. **Keräilynumeromuoto** (Cyberdeck Tools): `3x A027`, `1x MS01-131A`
3. **Virallisen pakkarakentajan tekstivienti:** Cyberdeck Tools tukee sitä, mutta tarkkaa muotoa ei voitu todentaa (sivu toimii selaimessa ajettavana sovelluksena).

**Johtopäätös:** tuonti tehdään sallivana jäsentimenä, joka tunnistaa määrät (`3x`, `3`), nimet (myös "Nimi — Alaotsikko"), keräilynumerot ja osio-otsikot (Legends, Cards, Sideboard). Tunnistamattomat rivit näytetään käyttäjälle eikä niitä ohiteta hiljaa. Testiaineistoksi pyydetään käyttäjältä yksi oikea vienti siitä palvelusta, jota hän käyttää.

## Lähteet
- https://cyberpunktcg.com/cards · https://cyberpunktcg.com/blog/deckbuilder-live
- https://cyberdecktools.com/deck-builder/
- https://github.com/marcuserlandsson/cyberpunk_tcg_simulator
- https://ripperdeck.gg/
- https://exburst.dev/cyberpunk/cardlist
