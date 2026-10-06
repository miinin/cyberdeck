# T-103 · Pakkaeditori 2

**Tila:** Katselmoitavana (PR testiin). **Haara:** `t-103-pakkaeditori-2`. **Päättäjä:** käyttäjä.

## Määrittely
1. **Myytävien suositus (D-024):** tavoite on osuus pääpakasta. Keskikohta = clamp(0,575 + (keskihinta − 3) × 0,05; 0,45; 0,70), väli = keskikohta ± 0,025 (keskihinnalla 3: 55–60 %). Näkyy kappaleina ja prosentteina ("Suositus 23–25 (55–60 %)") ja arviona (liian vähän / yli suosituksen / sopiva määrä). Simulaatio jää informaatioksi.
2. Ongelmalistan "Näytä rivi" -painike poistettu. Rivimerkinnät jäävät.
3. Hakulistassa kortti, jonka lisääminen tekisi pakan laittomaksi (`addBlockerInfo`), on haalea, ja siinä on näkyvä "⚠ syy" (esim. "⚠ RAM 4 > Green 2") sekä rivi- että kuvanäkymässä. Lisääminen on silti mahdollista. Hakulistan yläpuolella aina näkyvä selite (myös kosketuslaitteilla), joten sivu ei hyppää.
4. Legendit ovat osio kuten Pääpakka ja Sideboard: otsikko "Legendit (n/3)", Lista = deck-tile-rivit, Pinot = kortit vierekkäin omilla säätimillä, vapaat paikat tyhjinä paikkariveinä.
5. Pinot-näkymä ryhmitelty värin ja tyypin mukaan ("Red · Unit (12)"), pinon otsikon reunassa kortin väri. Lista pysyy tyypin mukaan. Värinimet ovat API-arvoja (Red, Yellow…) kuten muuallakin (K6).

## Luovutus
- Koodi: `src/domain/eddies.ts` (`sellableTarget`), `deckRules.ts` (`addBlockerInfo`, `groupDeck().colorGroups`), `DeckCharts.tsx`, `DeckEditor.tsx`, `DeckList.tsx`, `DeckPickTable.tsx`, tyylit ja tekstit (fi+en).
- Testit: 1385 läpi, lint ja build läpi. T-057-säännön ("merkitään vasta ylityksen jälkeen") testit päivitettiin uuteen sääntöön (merkitään ennen lisäystä).
- Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 1 (käyttämätön CSS `.legend-names` voi poistaa).
- Ei uusia riippuvuuksia.
