# T-104 · Proxy-näkymän uudelleensuunnittelu

**Tila:** Katselmoitavana (PR testiin). **Haara:** `t-104-proxy-ui`. **Päättäjä:** käyttäjä (palaute T-102:sta).

## Palaute
"UI sekoittaa liikaa Kortit-osioon. Käyttäjän pitää nähdä heti lisätyt kortit tulostusarkilla. Ylälaidan osio on epäselvä: kerro tiiviisti miten homma toimii."

## Määrittely
1. Leveä (≥ 64 rem): vasemmalla valinta (haku, suodattimet koottuna yhden painikkeen taakse, pienet kortit; kuvan klikkaus tai + lisää), oikealla sticky-tulostusarkki (A4 3 × 3, sivutus, yhteenveto, × poistaa kopion, Tulosta, asetukset popoverina, huomautus pienenä). Arkin koko mitoitetaan `100dvh`:n mukaan, ei sisäisiä vieritysalueita.
2. Lisäyksen palaute: kuva lentää arkin uuteen paikkaan (350 ms, Web Animations), paikka ja laskurit välähtävät, arkki siirtyy kyseiselle sivulle. `prefers-reduced-motion: reduce`: ei lentoa, vain värivälähdys.
3. Kapea: valinta ylhäällä, arkki alla, kiinteä palkki "Arkki: n korttia · m arkkia [Näytä arkki]" (kuten "Näytä pakka"), piiloutuu kun arkki on näkyvissä.
4. Ohje: otsikko "Proxy" ja kolmen askeleen rivi. Pitkä intro, hyppypainikkeet, jonolista ja esikatseluosio poistettu.
5. Tulostus (@page proxy, 63 × 88 mm, kaikki arkit), jonon tallennus ja rajat (SEC-102) ennallaan.

## Luovutus
- Koodi: `ProxyView.tsx`, `ProxySheets.tsx`, `proxyTexts.*`, `styles.css`; pieni `imageLabel`-läpivienti `CardList`/`CardImage`-komponentteihin (kuvapainikkeen puhuttu teksti "Lisää arkille: …", ei dialogivihjettä).
- Poistunut: kuvan suurennus Proxy-osiossa (kuvan klikkaus lisää), kuvakokovalitsin, erillinen jonolista (arkki on jono).
- Testit: 1421 läpi (uusina sivutus, × poisto, mobiilipalkki, askelrivi), lint ja build läpi. Ei uusia riippuvuuksia.
- Rajoite: lento- ja välähdysanimaatiota ei voi testata jsdomissa (Web Animations puuttuu), joten ne tarkistetaan esikatselusta. Arkin korkeuden varaus (`--proxy-reserve`) on arvioitu rem-arvoilla; tarkista esikatselusta eri korkeuksilla.
