# T-118 · Koko sivuston UI-yhtenäisyys ja viimeistely ennen julkaisua

**Tila:** In Progress. **Haara:** suoraan `test` (D-029). **Päättäjä:** käyttäjä (2026-10-09: "UX 5/5, ulkoasu autistisen tarkasti yhteneväinen ja viimeistelty; liukukytkimet ja painikkeet yhteneväisiä, ehyitä ja toimivia").

## Vaihe 1: auditointi (Opus, UX-rooli)
Tuotos on `docs/reports/UX-118-yhtenaisyys.md`. Koodia ei muuteta tässä vaiheessa.

**Kuvakaappaukset:** jokainen näkymä ja tila tuotantobuildista (`npm run build` ja `vite preview`, CDP/headless Chrome). Leveydet 390 × 844 ja 1440 × 900, tumma ja vaalea teema, fi (en tarkistetaan pistokokein).
- Kortit: lista, kuvat, suodattimet auki, kortin tiedot.
- Kokoelma: tyhjä tila, yleiskuva, kansio, skanneri auki ilman kameraa (virhetila).
- Pakat: tyhjä tila, lista, tuonti, Netdeck.
- Pakkaeditori: Pakka- ja Lisää-välilehti, näkymät Lista, Pinot ja Kortit, tilastot, testikäsi, näkyvyys ja vahvistuslomake.
- Julkiset pakat ja julkinen pakka, jaettu pakka, Have/Want ja vaihtolinkki, Proxy.
- Tilivalikko, ensikirjautumisen dialogi, painosvarmistus ja muut dialogit, alatunniste, 404 tai tuntematon reitti.

**Komponentti-inventaario:** jokaisesta komponenttityypistä kaikki variantit, joissa se esiintyy, sekä mitat (korkeus, reunus, viiste, fonttikoko, kirjainväli, kirjainkoko, välit) ja poikkeamat.
- Painikkeet: primääri, sekundääri, ikoni, linkkipainike, vaarallinen toiminto.
- Kytkimet, segmenttivalitsimet ja välilehdet.
- Valintaruudut ja radiot.
- Tekstikentät, haku ja select.
- Ilmoitukset, merkit ja tagit, (i)-vihjeet, popoverit ja valikot, dialogit.
- Otsikkotasot (h1, h2, h3), osiolaatikot ja kortit, tyhjät tilat, edistymispalkit, laskurit (×N).

**Löydökset vakavuusjärjestyksessä:** jokaisesta näkymä, kuvakaappaus, tarkka ongelma ja korjausohje (tiedosto, selektori tai komponentti sekä tavoitearvo). Etsi erityisesti:
- epäyhtenäiset muodot, korkeudet ja tyylit
- rikkinäiset tai leikkautuvat elementit, päällekkäisyydet ja vaakavieritys
- tasausviat ja epäjohdonmukaiset välit
- turha teksti ja toisteisuus, turhat laatikot
- epäselvät toiminnot ja fokus- tai hover-tilojen puutteet
- kontrastit molemmissa teemoissa
- kirjainkoon epäjohdonmukaisuus (VERSAALIT vs. normaali)
- kielivirheet ja sekakieli

**Yhtenäisyysstandardi:** kirjataan raportin alkuun ja tarvittaessa myös `docs/UX.md`:hen lyhyenä lukuna. Kullekin komponentille määritellään yksi tapa: korkeus, viiste, tyyli ja tilat.

## Vaihe 2: korjaukset (Koodari)
Kaikki raportin löydökset korjataan, ja standardi toteutetaan yhteisinä CSS-luokkina tai komponentteina päällekkäisten tyylien sijaan (kuollut CSS poistetaan). Lopuksi uudet kuvakaappaukset samoista näkymistä vahvistavat korjaukset.

## Hyväksymiskriteerit
- Jokaisella komponenttityypillä on yksi yhtenäinen ulkoasu koko sivustolla.
- Ei rikkinäisiä, leikkautuvia tai päällekkäisiä elementtejä, ei vaakavieritystä 320–1440 px:llä, eikä sisäisiä vieritysalueita.
- Testit päivitetään, eikä niitä heikennetä. `npm test`, `npm run lint` ja `npm run build` menevät läpi.

## Luovutus
