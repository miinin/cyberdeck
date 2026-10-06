# T-105 · Kokoelman edistymisnäkymä

**Tila:** Katselmoitavana (PR testiin). **Haara:** `t-105-kokoelma`. **Päättäjä:** PM.

## Määrittely
Uusi yläpalkin osio "Kokoelma" (en "Collection"), reitti `#/kokoelma`, nav: Kortit, Kokoelma, Pakat, Have/Want, Proxy. Tilastonäkymän (T-093) ilme: kortit, rengas, palkit.
1. Yleiskuva: eri kortteja X/151 (rengas, %), kopioita, täysiä pelisarjoja (3, Legend 1), myytäviä (€$) kopioita.
2. Seteittäin (versions-avaimet, D-020/D-022), Muut tuotteet avattavana.
3. Harvinaisuuksittain (officialRarity-järjestys) ja erikoisversiot (Iconic, Nova, Secret) omilla riveillään.
4. Värit ja tyypit.
5. Puuttuvat kortit kuvina (rajaus pelisarja / harvinaisuus), "Lisää puuttuvat want-listalle" (varmistus, täysi pelisarja) ja "Lähetä puuttuvat proxy-jonoon" (1 kpl, 200 raja). Kortin klikkaus avaa `#/kortti/<key>`.
6. Tyhjä kokoelma: tyhjätila ja linkki Kortit-osioon.

## Luovutus
- Koodi: `domain/collectionProgress.ts` (+ testit), `ui/CollectionView.tsx` (+ testit), `ui/collectionTexts.*`, reitti `useHashRoute.ts`, `App.tsx`, `styles.css`.
- Seteittäin laskee vain kortit, joille on merkitty painos (D-020); ilman merkittyä painosta setit näyttävät nollaa, ja näkymä kertoo sen. Tämä on tietoinen rajaus.
- Mobiilissa nav-linkkien sivupadding pienennetty, jotta viisi kohtaa mahtuu kahteen riviin; tarkista esikatselusta 390 px.
- Ei uusia riippuvuuksia.
