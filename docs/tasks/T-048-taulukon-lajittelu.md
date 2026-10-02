# T-048 · Taulukkonäkymän lajittelu sarakkeittain
**Tila:** Ready · **Omistaja:** Koodari (Sonnet) · **MVP:** 1 · **Prioriteetti:** Should (STATUS, Seuraavaksi 1)
**Malli:** D-014, ei erillistä katselmointia (ei syötettä, tallennusta eikä riippuvuuksia). PM tarkistaa esikatselusta.
**Haara:** `t-048-taulukon-lajittelu`

## Hyväksymiskriteerit
1. `CardTable.tsx`:n sarakeotsikot Nimi, Tyyppi, Rarity, Hinta, Power ja RAM ovat lajittelupainikkeita (`<button>` `<th>`:n sisällä). Kuva- ja Kokoelma-sarakkeet eivät lajittele.
2. Ensimmäinen painallus lajittelee nousevaan järjestykseen, toinen laskevaan, kolmas palauttaa oletusjärjestyksen (suodatetun listan alkuperäinen järjestys).
3. Aktiivisessa `<th>`:ssä on `aria-sort="ascending|descending"`, muissa ei attribuuttia. Painikkeessa on näkyvä nuoli (▲/▼, `aria-hidden`).
4. Puuttuvat arvot (null) ovat aina viimeisinä suunnasta riippumatta. Tasatilanteessa järjestys säilyy (vakaa lajittelu, toissijaisesti nimi).
5. Lajittelulogiikka puhtaana funktiona (esim. `src/domain/cardSort.ts`) ja yksikkötesteinä. Komponenttitesti: painallus vaihtaa järjestyksen ja aria-sortin.
6. Lajittelutila on komponentin tilassa (ei tallenneta). Ruudukkonäkymä ei muutu.
7. Tekstit `texts.ts`:ään. `npm test`, lint ja build läpi. CHANGELOG `[Julkaisematon]`.

## Luovutukset
