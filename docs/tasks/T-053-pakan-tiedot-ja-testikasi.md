# T-053 · Lisää pakan tietoja ja testikäden nosto
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must (käyttäjä 2026-10-03)
**Malli:** D-014. Määrittely: UX Designer (tutkimus ja kortti). Ei uusia riippuvuuksia, ei tallennusta, ei tietomallimuutosta.
**Haara:** `t-053-pakan-tiedot-ja-testikasi`

## Pyyntö (käyttäjä 2026-10-03)
1. Pakasta halutaan enemmän tietoa. Selvitä muilta sivuilta, mitä tietoa niissä tarjotaan, ja lisää vastaavat.
2. Testikäden nosto: yhdellä napilla saa esimerkkikäden, joka pakasta voisi nousta.

## Tausta: säännöt (lähteet alla)
- **Legendit ovat erillään pakasta.** Kolme Legendiä sekoitetaan ja asetetaan kuvapuoli alaspäin Legend-alueelle satunnaiseen järjestykseen. Ne eivät ole pääpakassa, eikä niitä nosteta käteen.
- **Aloituskäsi on 6 korttia** pääpakasta.
- **Mulligan kerran, ilman rangaistusta:** koko käsi palautetaan pakkaan, pakka sekoitetaan ja nostetaan 6 uutta korttia. Aloittaja ilmoittaa mulliganista ensin.
- **Nosto vuorossa:** 1 kortti Start-vaiheessa joka vuoro. Kaikki lähteet sanovat "at the start of each turn", ja myös aloittaja nostaa ensimmäisellä vuorollaan (aloittajan haittana on, että sen kaksi vasemmanpuoleisinta Legendiä ovat jo käytettyjä). Käsikokoa ei ole rajoitettu.
- **Pakan loppuminen:** häviää, kun pitäisi nostaa tyhjästä pakasta.
- **Epävarmuus:** virallinen comprehensive rules -sivu (cyberpunktcg.com) ei auennut tekstinä. Tiedot ovat kolmesta yhtenevästä toissijaisesta lähteestä (ripperdeck.gg/rules, thegamer.com, collectorsedge.co.uk) ja beta-säännöistä, joiden mukaan pelin yksityiskohdat saattavat vielä muuttua. Siksi arvot ovat vakioina (`OPENING_HAND = 6`, `DRAWS_PER_TURN = 1`, `MULLIGANS = 1`) yhdessä paikassa, ja käyttöliittymässä kerrotaan, mitä oletetaan.

## Tausta: mitä muut työkalut näyttävät
| Työkalu | Tiedot |
|---|---|
| CyberdeckTools (Cyberpunk TCG) | keskihinta (Average Cost), käyrä, tyyppi- ja värijakauma, RAM-tarkistus, hypergeometrinen todennäköisyys nähdä ≥1 kopio: 6 aloituskorttia + 1 nosto joka vuoro *vuoro 1 mukaan lukien*, napautuksella kertymä vuoroittain, myytävien korttien määrä (Sell Tag) |
| ExBurst (Cyberpunk TCG) | testilistat, kokoelmasynkka, todennäköisyys saada vähintään yksi halpa Unit/Gear/Program aloituskäteen |
| Moxfield / Archidekt (MTG) | käyrä, väri- ja tyyppijakauma, keskiarvo, playtest: nosta 7, mulligan, nosta kortti, uusi käsi; omistetut ja puuttuvat, hinta |
| Hearthstone/Snap-deck trackerit | käyrä, tyypit, nostotodennäköisyydet, "seuraava nosto" -todennäköisyys |

**Valinta tähän tehtävään:** keskiarvot, Power-, RAM- ja harvinaisuusjakaumat, nostotodennäköisyydet korteittain ja yksi "halpa avaus" -todennäköisyys sekä testikäsi. Jo olemassa: käyrä, värit, tyypit, RAM-rajat ja puuttuvat.
**Ei tehdä (data puuttuu):** avainsanat, korttiteksti, Sell Tag ja hinta. `Card`-mallissa ei ole tekstiä eikä avainsanoja (`src/domain/card.ts`: id, slug, name, subname, displayName, type, color, cost, power, ram, rarity, key). Nämä kirjataan IDEAS.md:hen, jos data joskus saadaan.

## Hyväksymiskriteerit

### A. Uudet tilastot (Tilastot-osio, `DeckStats.tsx`, pakkasarake)
1. **Yhteenvetorivi** heti Tilastot-otsikon alle: `Keskihinta 3,2 · Keski-Power 4,1 · Kortteja 42`.
   - Keskihinta lasketaan pääpakan korteista, joilla on Cost (Legendit eivät ole mukana), kopioilla painotettuna, ja näytetään yhdellä desimaalilla suomalaisella pilkulla (`toLocaleString('fi-FI')`).
   - Keski-Power lasketaan pääpakan Uniteista, joilla on Power.
   - Kun kortteja ei ole, näytetään `Keskihinta –` (viiva, `aria-label`/visually-hidden "ei tietoa").
2. **Power-jakauma** (vain Unitit): pylväät samalla komponentilla ja tyylillä kuin `CostCurve` (yleistetään esim. `ValueCurve`-komponentiksi, jolla on otsikko ja viimeisen pylvään etiketti `8+`). Otsikko: `Power-jakauma (Unitit)`. Arvot 0–7 ja 8+. Tekstivastine on sama kuin Cost-käyrässä.
3. **RAM-jakauma** tekstirivinä: `RAM: 1 × 12 · 2 × 20 · 3 × 6` (kopiomäärät korteista, joilla on RAM, Legendit pois).
4. **Harvinaisuudet** tekstirivinä samaan tapaan kuin Tyypit: `Common 24 · Rare 12 · Epic 4` (järjestys: Common, Uncommon, Rare, Epic, Legendary, muut aakkosjärjestyksessä, tuntematon `Ei tietoa`).
5. **Halpa avaus:** `Vähintään yksi Cost ≤ 2 -kortti aloituskädessä: 87 %`. Laskettu hypergeometrisesti (kohta 6).
6. **Nostotodennäköisyydet**, `<details>`-elementti otsikolla `Nostotodennäköisyydet`, oletuksena kiinni:
   - Taulukko (`<table>`, `<caption>` visually-hidden: "Todennäköisyys nostaa vähintään yksi kopio"), rivi per pääpakan kortti (Legendit pois), lajittelu kopiomäärän ja nimen mukaan.
   - Sarakkeet: `Kortti` | `Kpl` | `Aloituskäsi` | `Vuoro 1` | `Vuoro 3` | `Vuoro 5`. Korttimäärät: 6, 7, 9 ja 11 (aloituskäsi + 1 nosto per vuoro vuorosta 1 alkaen). Prosentit kokonaislukuina (`39 %`).
   - Alle selite: `Oletus: 6 kortin aloituskäsi, ei mulligania, 1 nosto joka vuoro (myös aloittajan 1. vuorolla).`
   - Kapealla näytöllä taulukko on vierityssäiliössä (`.table-scroll`, `tabindex="0"`, `role="region"`, `aria-label="Nostotodennäköisyydet"`). Sivulle ei tule vaakavieritystä.
7. Puhtaat funktiot uuteen tiedostoon `src/domain/deckStats.ts`: `averageCost`, `averagePower`, `powerCurve`, `ramDistribution`, `rarityDistribution`, `atLeastOneProbability(deckSize, copies, drawn)` ja `drawProbabilities(deck, cardsByKey, drawCounts)`. Hypergeometrinen kaava `1 − C(N−K, n) / C(N, n)` lasketaan tulona (ei isoja binomikertoimia). Reunaehdot: n ≥ N → 1 (jos K > 0), K = 0 → 0, N = 0 → 0.
   - Yksikkötestit, esim. N = 40, K = 3, n = 6 → 0,3943 (±0,0001), N = 40, K = 3, n = 7 → 0,4478, sekä reunaehdot.
   - Tuntemattomat kortit (avain ei ole `cardsByKey`:ssä) lasketaan pakan kokoon N, mutta niillä ei ole riviä.

### B. Testikäsi
8. **Nappi `Nosta testikäsi`** Tilastot-osiossa yhteenvetorivin alla (toissijainen nappityyli). Kun pääpakka on tyhjä, nappi on `disabled`, ja sen alla on vihje `Lisää pakkaan kortteja, niin voit nostaa testikäden.`
9. Napista avautuu **modaalinen `<dialog>`** (`showModal`), otsikkona `<h2>Testikäsi</h2>`. Avautuessa nostetaan heti uusi käsi. Fokus siirtyy napille `Nosta kortti`. Sulkeminen (Esc, `Sulje`-nappi) palauttaa fokuksen `Nosta testikäsi` -nappiin. Tilaa ei tallenneta: suljettaessa käsi unohtuu.
10. **Rautalanka:**
```
┌ Testikäsi ─────────────────────────── [Sulje] ┐
│ Kädessä 6 · Pakassa 36 · Mulligan: käyttämättä  │
│ [Nosta kortti] [Mulligan] [Uusi käsi]           │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐                        │
│ │  ││  ││  ││  ││  ││  │  ← isot kortikuvat      │
│ └──┘└──┘└──┘└──┘└──┘└──┘                        │
│ Legendien järjestys: Royce · V · Adam Smasher   │
│ Oletus: 6 kortin aloituskäsi, yksi mulligan…    │
└─────────────────────────────────────────────────┘
```
    - Käsi on `<ul aria-label="Käsi, 6 korttia">`, ja jokainen kortti on `<li>` + olemassa oleva `CardImage` (alt = displayName). Kuvan leveys `clamp(9rem, 22vw, 16rem)`, grid `repeat(auto-fill, minmax(…))`. Kuvat rivittyvät, eikä tule vaakavieritystä. Uusin nostettu kortti on lopussa, ja sillä on visuaalinen korostus (reunus) ja visually-hidden-teksti `(uusin)`.
    - Tilarivi: `Kädessä N · Pakassa M · Mulligan: käyttämättä|käytetty`.
    - Legendit: rivi `Legendien järjestys: A · B · C` (satunnainen järjestys, sama RNG). Alla pieni vihje `Jos aloitat, kaksi ensimmäistä ovat käytettyjä.` Jos pakassa ei ole kolmea Legendiä, rivi näyttää ne, jotka on, tai sen puuttuessa `Ei Legendejä.`
    - Selite alla: `Oletus: 6 kortin aloituskäsi, yksi mulligan (koko käsi takaisin ja 6 uutta), 1 nosto vuorossa. Legendit ovat erillään pakasta.`
11. **Toiminnot:**
    - `Nosta kortti`: pakan päällimmäinen kortti käteen. Kun pakka on tyhjä, nappi on `disabled`, ja tilarivillä lukee `Pakka on tyhjä`.
    - `Mulligan`: koko käsi takaisin pakkaan, sekoitus ja 6 uutta korttia. Sallittu kerran per käsi, minkä jälkeen nappi on `disabled` ja tekstinä `Mulligan käytetty`. Nappi on `disabled` myös silloin, kun kortteja on jo nostettu aloituskäden jälkeen (mulligan tehdään ennen peliä).
    - `Uusi käsi`: koko pakka sekoitetaan, 6 uutta korttia ja mulligan nollautuu.
    - Jos pääpakassa on alle 6 korttia, nostetaan kaikki, ja tilarivillä on lisäksi `Pakassa on alle 6 korttia.`
12. **Ilmoitukset:** dialogin sisällä on `aria-live="polite"` `aria-atomic="true"` -alue (visually-hidden), johon tulee:
    - avattaessa ja Uusi käsi -napilla: `Uusi käsi: Kortti A, Kortti B, … .`
    - Nosta kortti -napilla: `Nostit: Kortti X. Kädessä 7 korttia.`
    - Mulliganilla: `Mulligan tehty. Uusi käsi: … .`
13. **Näppäimistö:** kaikki toiminnot napeilla, fokusjärjestys Sulje → Nosta kortti → Mulligan → Uusi käsi. Fokus pysyy dialogissa (natiivi `showModal`). Disabloidun napin fokus siirretään seuraavaan käytössä olevaan nappiin, ettei fokus katoa (esim. Mulliganin jälkeen Nosta kortti -napille).
14. **Mobiili:** 320 px:n leveydellä dialogi on koko näytön levyinen (`inline-size: min(100vw - 1rem, 72rem)`, `max-block-size: 100dvh`, sisältö vierii). Kortteja on 2 rinnakkain, napit rivittyvät, ja kosketusalue on vähintään 44 × 44 px. Ei vaakavieritystä 320, 375, 1920 ja 2850 px:n leveyksillä.
15. **Liike:** ei animaatioita, tai jos nostolle lisätään siirtymä, se poistetaan `prefers-reduced-motion: reduce` -tilassa.
16. **Domain:** `src/domain/testHand.ts`, puhtaat funktiot ja injektoitava RNG:
    - `type Rng = () => number` (0 ≤ x < 1), oletus `Math.random` vain UI-kerroksessa.
    - `shuffle<T>(items, rng)` (Fisher–Yates, ei mutatoi syötettä), `startHand(deck, cardsByKey, rng)` → `{ library: Card[]; hand: Card[]; legends: Card[]; mulliganUsed: boolean; drawnAfterOpening: number }`, `drawCard(state)`, `mulligan(state, rng)` ja vakiot `OPENING_HAND = 6`, `MULLIGANS = 1`.
    - Pääpakka laajennetaan kopiomäärien mukaan. Legendit menevät `legends`-listaan, eivät pakkaan. Tuntemattomat kortit jätetään pois.
    - Yksikkötestit deterministisellä RNG:llä (esim. siemenellinen LCG testissä): käden koko 6; kortteja yhteensä hand + library = pääpakan koko; Legendit eivät koskaan päädy käteen; mulligan toimii vain kerran; draw tyhjästä pakasta ei muuta tilaa; sama siemen → sama käsi; `shuffle` ei mutatoi syötettä.
17. **UI-testi** (RTL, RNG injektoidaan propsina tai kontekstina): nappi avaa dialogin, jossa on 6 kuvaa; Nosta kortti lisää yhden ja päivittää live-alueen; Mulligan disabloituu käytön jälkeen; tyhjällä pakalla avausnappi on disabled.

### C. Yleiset
18. Tekstit `deckTexts.ts`:ään (suomeksi, kuten yllä). Korttien nimet ja tyypit pidetään englanniksi `lang="en"` -merkinnällä kuten nyt.
19. Ei uusia riippuvuuksia, ei tallennusta, ei muutoksia tietomalliin.
20. `npm test`, `npm run lint` ja `npm run build` läpi, testejä ei heikennetä. CHANGELOG. Kuvakaappaukset 375 ja 1920 px (kummallakin teemalla) dialogista ja Tilastoista PR:ään.

## Lähteet
- Säännöt: https://ripperdeck.gg/rules · https://www.thegamer.com/cyberpunk-tcg-how-to-play-card-types-mechanics-explained/ · https://collectorsedge.co.uk/pages/how-to-play-cyberpunk-tcg · https://cyberpunktcgguide.com/how-to-play/ (beta, yksityiskohdat puuttuvat) · https://cyberpunktcg.com/comprehensive-rules (ei auennut tekstinä)
- Työkalut: https://cyberdecktools.com/deck-builder/ · https://exburst.dev/cyberpunk/deckbuilder · Moxfield ja Archidekt (playtest, tilastot; yleistieto)

## Luovutukset
