# T-165 · QR-koodi jakolinkeille (I-6)
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Katselmoinnit:** Digiturva, koska mukana on uusi riippuvuus. Ennen main-julkaisua testataan devissä (D-029). PM tekee esikatselun (puhelin ja työpöytä, tumma ja vaalea).
**Riippuvuudet:** T-056 (pakan jakolinkki), T-062 ja T-129 (vaihtolinkki), T-098 (julkinen pakka).

**Päättäjä:** käyttäjä (2026-10-13). PM: määrittely ja riippuvuuden valinta.

## Riippuvuus
`uqr` (unjs, MIT, ei omia riippuvuuksia, ESM, noin 80 kt purettuna, SVG-ulostulo). Versio kiinnitetään tarkasti (`0.1.3`). Se ladataan dynaamisella `import()`:lla vasta, kun QR avataan, jotta pääpaketti ei kasva. Oma kooderi (Reed–Solomon, maskit, versiot 1–40) olisi noin 400 riviä ja vaatisi paljon testattavaa, joten kirjasto on perusteltu. Koodari tarkistaa `npm view uqr` ja `npm audit`. Jos paketissa on jotain epäilyttävää (install-skriptit tai riippuvuuksia), Koodari pysähtyy ja kertoo.

## Määrittely
1. **QR-painike** (ikoni ja teksti "QR-koodi" / "QR code") jokaisen jakolinkin viereen: pakan Vie ja jaa -valikko (DecksView ja DeckEditor), vaihtolinkki (`ShareTradeButton`) ja julkisen pakan linkki, jos sille on näkyvä linkki. Painike avaa dialogin.
2. **Dialogi** on koko ruudun kokoinen tai lähes (`<dialog>` ja showModal kuten ConfirmAddDialog). Siinä on otsikko (mitä jaetaan, esim. pakan nimi), suuri QR-koodi, joka mahtuu ruutuun (min(90vw, 70vh)) neliönä, linkki tekstinä ja Sulje-painike. Esc ja taustan napautus sulkevat, ja fokus palaa avaajaan. QR on **aina tumma vaalealla taustalla ja hiljaisella vyöhykkeellä** (4 moduulia) myös tummassa teemassa. SVG renderöidään reunat terävinä (`shape-rendering: crispEdges`).
3. **SVG turvallisesti:** älä käytä `dangerouslySetInnerHTML`:ää. Muodosta QR-matriisista (uqr `encode` → `data: boolean[][]`) React-`<path>`, tai `<rect>`it yhdeksi poluksi. Silloin syöte (linkki) ei koskaan päädy HTML:ksi.
4. **Kapasiteetti:** virheenkorjaus `M`, ja jos linkki ei mahdu, `L`. Jos linkki ei mahdu kumpaankaan (uqr heittää virheen tai pituus on yli 2 900 tavua), dialogi näyttää QR:n sijaan tekstin "Linkki on liian pitkä QR-koodiksi. Kopioi linkki ja lähetä se viestinä." Yli noin 1 200 merkin linkeissä näytetään vihje "Tiheä koodi: tuo puhelin lähelle." Lataus- ja virhetilat käsitellään (dynaaminen import voi epäonnistua, jolloin näytetään virheteksti).
5. **Tekstit** fi ja en. Painikkeen saavutettava nimi on esim. "QR-koodi: pakka X".
6. **Testit:** puhdas apufunktio matriisista polkuun (yksikkötesti), dialogin avaus ja sulku sekä liian pitkä linkki (UI-testi, uqr mockattuna tai oikeana). Jokaisessa kolmessa paikassa on painike.

## Hyväksyntä
- Testit, lint ja build läpi. Pääpaketin koko ei kasva merkittävästi (uqr omassa chunkissaan, tarkista build-tulosteesta).
- Puhelimella skannaus avaa oikean linkin (PM devissä).

## Luovutus
Koodari (2026-10-13): Toteutettu. `uqr@0.1.3` asennettu tarkalla versiolla (`npm view`: ei riippuvuuksia eikä install-skriptejä, `npm audit` 0 haavoittuvuutta). Ladataan dynaamisella `import()`:lla dialogin avautuessa, ja build tekee siitä oman chunkin (`dist-*.js`, 10 kt); pääpaketti kasvoi 0,04 kt. Uudet: `src/domain/qrPath.ts` (matriisi -> yksi SVG-polku, ei `dangerouslySetInnerHTML`:ää), `src/ui/QrDialog.tsx` (`QrDialog`, `QrButton`; ecc M, sitten L, yli 2 900 tavua = tekstivaroitus, yli 1 200 merkkiä = tiheä-vihje, latausvirhe käsitelty), tekstit `deckTexts.*` (fi/en), CSS `.qr-*` (aina tumma vaalealla, hiljainen vyöhyke 4). Painike on pakan Vie ja jaa -valikossa (DecksView ja DeckEditor) sekä vaihtolinkin vieressä (`ShareTradeButton`, rivi rivittyy kapealla). **Julkisen pakan linkkiä ei näy missään käyttöliittymässä** (DeckVisibility/PublicDeckView eivät näytä linkkiä), joten sille ei lisätty painiketta. Testit: `qrPath.test.ts`, `QrDialog.test.tsx` (avaus, sulku ja fokus, liian pitkä linkki, painike valikossa ja vaihtolinkissä). Testit 1826/1826, lint ja build läpi. Ei vielä tarkistettu silmällä eikä oikealla puhelimella (PM:n esikatselu). Koodikatselmointi: tehty · Pakollisia korjattu 1 (lint: setState effectissä) · Suosituksia 1 (pitkä linkkiteksti dialogissa leikataan 6 rem:iin).
Seuraavaksi: Digiturva (uusi riippuvuus), sitten PM:n esikatselu devissä.
