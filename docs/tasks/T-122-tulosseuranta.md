# T-122 · Pakan tulosseuranta (ottelupäiväkirja)
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Katselmoinnit:** Digiturva (uhkamalli ennen toteutusta, katselmointi ennen yhdistämistä) ☐ · PM esikatselu ja testisivusto ☐
**Riippuvuudet:** T-054 (synkka), T-064a (want-aggregaatin malli, jota tämä toistaa). Päätös D-030.

**Päättäjä:** käyttäjä (2026-10-10, IDEAS I-3): vastustaja on vapaa nimi ja valinnaiset Legendit, tulos on Voitto/Tappio/Tasapeli ja yksi rivi on yksi peli, tulokset tallennetaan tilille kuten pakat, ja valinnaisina lisätietoina ovat muistiinpano, aloittaja, tapahtuma ja sideboard käytössä. PM: määrittely ja rakennepäätös (D-030).

## Tavoite
Pelaaja kirjaa pelin tuloksen pakalleen muutamalla napautuksella ja näkee, miten pakka pärjää: voitot ja tappiot, voittoprosentti, tulos aloittajana tai toisena sekä tulokset vastustajittain ja vastustajan väreittäin.

## Rakennepäätös (D-030, tiivistelmä)
Tulokset ovat **oma aggregaattinsa, yksi dokumentti**, samalla mallilla kuin want-lista (D-018, T-064a). Tee kaikki kohdat, joissa `wants` kulkee tallennuksen, synkan, siirron ja poiston läpi, myös tuloksille (`grep -rn "wants" src/storage src/account`).

- **Domain** `src/domain/games.ts`:
  ```ts
  type GameResult = 'win' | 'loss' | 'draw';
  interface GameRecord {
    id: string;              // [A-Za-z0-9_-]{1,64}, crypto.randomUUID ilman väliviivoja tai vastaava
    deckId: DeckId;
    playedOn: string;        // 'YYYY-MM-DD', oletuksena tänään (paikallinen päivä)
    createdAt: string;       // ISO, järjestys saman päivän sisällä
    result: GameResult;
    opponentName: string | null;      // 1–60 merkkiä trimmattuna, tyhjä → null
    opponentLegends: CardKey[];       // 0–3 Legend-korttia, ei tuplia
    turn: 'first' | 'second' | null;  // aloittaja
    event: string | null;             // 1–60 merkkiä, tyhjä → null
    sideboard: boolean;
    note: string | null;              // 1–500 merkkiä, tyhjä → null
  }
  interface GameLog { games: GameRecord[] }
  ```
  Rajat: `MAX_GAMES = 1000`. Lisäksi koodattu dokumentti saa olla enintään 900 000 tavua (UTF-8), koska Firestoren raja on 1 MiB. Jos lisäys ylittäisi rajan, lisäys estetään ja näytetään teksti `logFull`. `parseGameLog` validoi kaiken luetun (SR-23): tuntematon kenttä, väärä tyyppi tai rajan ylitys hylkää rivin, ja ohjausmerkit poistetaan teksteistä. Tuntemattomat Legend-avaimet säilytetään, mutta niitä ei näytetä.
- **Paikallinen tallennus:** avain `cyberdeck:games` (tilillä `cyberdeck:u:{uid}:games`), envelope v1, varmuuskopio ja kahden välilehden `subscribe` kuten wantissa. Repositorio `GameLogRepository` (load, save, subscribe).
- **Firestore:** `users/{uid}/games/log` = `{ schemaVersion, savedAt, data: { games } }`. Säännöt: `isEnvelope`, `hasExactly(d.data, ['games'])`, `games is list` ja `size() <= 1000`, omistaja lukee, kirjoittaa ja poistaa. Ei listausta muille. Tulokset eivät koskaan päädy julkiseen pakkaan (`publicDecks`), pakan jakolinkkiin tai vientitiedostoon.
- **Synkka:** `LocalData.games` ja `SyncBase.games`, `CloudChange.games`. `mergeGames(local, cloud, base)` toimii pelin `id`:n mukaan samalla säännöllä kuin `mergeCollection` kortin mukaan: jos vain toinen puoli muuttui, valitaan se; jos molemmat muuttuivat, valitaan paikallinen; jos rivi puuttuu toiselta puolelta ja oli pohjassa, se on poistettu. Rivien vertailu tehdään kaikkien kenttien mukaan. Pilven virheellinen dokumentti ei koskaan ylikirjoitu (`null` kuten `cloudValue`). Lajittelu: `playedOn` laskevasti, sitten `createdAt` laskevasti. `MAX_GAMES`-ylitys → `Stop('error')` kuten muissakin.
- **Siirto selaimesta tilille, uloskirjautuminen ja tilin poisto:** tulokset kulkevat samoin kuin want (siirto ensimmäisessä kirjautumisessa, `deleteAll` poistaa myös `games/log`-dokumentin).
- **Pakan poisto poistaa sen tulokset** samassa tallennuksessa. Vahvistusdialogissa lukee määrä (`deleteDeckGames`), jos tuloksia on. Toisella laitteella poistetun pakan tulokset (harvinainen kilpatilanne) jäävät lokiin, mutta niitä ei näytetä missään. Siivous tehdään seuraavan kerran, kun mikä tahansa pakka poistetaan: poista rivit, joiden `deckId` ei ole pakoissa.
- Vanha sovellusversio ei lue `games/log`-dokumenttia, joten se ei riko mitään. Se näkee vain `rev`-muutoksen ja tekee tyhjän fullSyncin.

## Näkymä
**Pakkaeditori, pakkasarake (`editor-side`), `DeckStats`-osion jälkeen** uusi osio `DeckResults` (`src/ui/DeckResults.tsx`). Mobiilissa osio näkyy Pakka-välilehdellä, koska se on pakkasarakkeessa. Osio näytetään vain tallennetulle pakalle.
1. Otsikko `h2.deck-section-title`: **Tulokset**. Otsikkorivillä on ensisijainen painike **+ Kirjaa peli**.
2. **Avainluvut** samoilla KPI-laatoilla kuin tilastoissa (T-093, T-118): Pelit · V–T–Ta (esim. `5–3–1`) · Voitto-% (voitot / pelit, kokonaisluku) · Aloittajana `x %` / Toisena `y %` (vain jos aloittaja on kirjattu vähintään yhteen peliin).
3. **Vastustajat-taulukko:** rivi vastustajaa kohden. Ryhmittely: nimi (kirjainkoko ja välilyönnit eivät erota), ja jos nimeä ei ole, Legendien nimet aakkosjärjestyksessä pilkuin eroteltuina, muuten "Tuntematon". Sarakkeet: Vastustaja · Pelit · V–T–Ta · Voitto-%. Järjestys: pelimäärä laskevasti.
4. **Värit-taulukko:** vain peleistä, joissa on vastustajan Legendejä. Ryhmä = Legendien värien joukko värimerkkeinä (sama esitys kuin pakan värikoodi T-117:ssä). Sarakkeet kuten edellä.
5. **Tapahtumat-taulukko** vain, jos jollain pelillä on tapahtuma.
6. **Pelilista,** uusin ensin: päivä · tulosmerkki (V/T/Ta värillisenä) · vastustaja · pienet merkit "Aloitti"/"Toinen", "SB" ja tapahtuma. Muistiinpano näkyy rivin alla himmeänä tekstinä. Rivillä on kynä- ja roskakori-ikonit (samat kuin muualla, T-071). Poisto kysyy vahvistuksen (`ConfirmDeleteDialog`). Lista näyttää 10 viimeisintä ja sitten painikkeen **Näytä kaikki (N)**. Ei sisäistä vieritystä.
7. **Tyhjä tila:** teksti `emptyResults` ja **+ Kirjaa peli** -painike.

**Kirjauslomake** dialogina (kuten muut dialogit, mobiilissa koko ruutu T-090:n tapaan):
- **Tulos** (pakollinen): kolmen painikkeen segmentti Voitto / Tappio / Tasapeli. Ei oletusta, ja Tallenna on pois käytöstä, kunnes tulos on valittu.
- **Vastustaja:** tekstikenttä (maxLength 60) ja `<datalist>`, jossa ovat aiemmat vastustajanimet kaikista pakoista (uusin ensin, enintään 50). Kun valittu nimi vastaa aiempaa, Legend-valinta täytetään sen viimeisimmän pelin Legendeillä, jos valinta on tyhjä.
- **Vastustajan Legendit:** enintään 3, valinta Legend-korttien listasta hakukentällä (sama hakutapa kuin pakkaeditorissa, ei uutta komponenttikirjastoa). Valitut näkyvät poistettavina siruina värimerkillä.
- **Lisätiedot**-osio (avautuva `disclosure`, T-118), oletuksena suljettu, mutta auki muokattaessa, jos jokin lisätieto on täytetty: Päivä (`<input type="date">`, oletuksena tänään) · Aloittaja (segmentti Aloitin / Toinen / ei valintaa) · Tapahtuma (tekstikenttä maxLength 60 ja datalist aiemmista) · Sideboard käytössä (kytkin) · Muistiinpano (textarea maxLength 500, ei sisäistä vieritystä: `rows` kasvaa tai sallitaan automaattinen korkeus).
- Painikkeet: **Tallenna** ja **Peruuta**. Tallennuksen jälkeen dialogi sulkeutuu ja ilmoitus `saved` näkyy olemassa olevalla toast-tavalla.

**Pakat-sivu (`DeckList`):** jokaisen pakkakortin metatietoriville lisätään ennätys `5–3–1`, kun pakalla on tuloksia (pieni himmeä teksti, `title`/aria: `recordAria`).

## Tekstit (fi / en)
| Avain | fi | en |
|---|---|---|
| resultsHeading | Tulokset | Results |
| logGame | + Kirjaa peli | + Log a game |
| editGame | Muokkaa peliä | Edit game |
| kpiGames | Pelit | Games |
| kpiRecord | V–T–Ta | W–L–D |
| kpiWinRate | Voitto-% | Win % |
| kpiFirst / kpiSecond | Aloittajana / Toisena | Going first / Going second |
| result | Tulos | Result |
| win / loss / draw | Voitto / Tappio / Tasapeli | Win / Loss / Draw |
| winShort / lossShort / drawShort | V / T / Ta | W / L / D |
| opponent | Vastustaja | Opponent |
| opponentPlaceholder | Esim. Villen sininen aggro | E.g. Alex's blue aggro |
| opponentLegends | Vastustajan Legendit | Opponent's Legends |
| legendsHint | Enintään 3. Värit päätellään Legendeistä. | Up to 3. Colours come from the Legends. |
| unknownOpponent | Tuntematon | Unknown |
| more | Lisätiedot | More details |
| playedOn | Päivä | Date |
| turn | Aloittaja | Who went first |
| wentFirst / wentSecond | Aloitin / Toinen | I went first / I went second |
| event | Tapahtuma | Event |
| eventPlaceholder | Esim. Kauppaturnaus tai kotipeli | E.g. store tournament or home game |
| sideboardUsed | Sideboard käytössä | Sideboard used |
| note | Muistiinpano | Note |
| save / cancel | Tallenna / Peruuta | Save / Cancel |
| saved | Peli kirjattu | Game logged |
| byOpponent | Vastustajat | Opponents |
| byColour | Vastustajan värit | Opponent colours |
| byEvent | Tapahtumat | Events |
| gamesList | Pelit | Games |
| showAll(n) | Näytä kaikki ({n}) | Show all ({n}) |
| badgeFirst / badgeSecond | Aloitti / Toinen | First / Second |
| emptyResults | Ei vielä kirjattuja pelejä. Kirjaa pelin tulos, niin näet, miten pakka pärjää. | No games logged yet. Log a result to see how the deck does. |
| deleteGame | Poistetaanko peli {päivä} vs. {vastustaja}? | Delete the game on {date} vs {opponent}? |
| deleteDeckGames(n) | Myös pakan {n} kirjattua peliä poistetaan. | The deck's {n} logged games are deleted too. |
| logFull | Tulosloki on täynnä (1 000 peliä). Poista vanhoja pelejä ennen uuden kirjaamista. | The results log is full (1,000 games). Delete old games before logging a new one. |
| recordAria(w,l,d) | {w} voittoa, {l} tappiota, {d} tasapeliä | {w} wins, {l} losses, {d} draws |

## Hyväksymiskriteerit
- [ ] Pelin voi kirjata, muokata ja poistaa. Tulos on pakollinen, ja muut kentät ovat valinnaisia (testit).
- [ ] Avainluvut, Vastustajat-, Värit- ja Tapahtumat-taulukot lasketaan oikein, myös ryhmittely (nimi ilman kirjainkoon eroa, Legend-varaluokka, "Tuntematon") (domain-testit).
- [ ] Aiemmat vastustajat ja tapahtumat ehdotetaan, ja Legendit esitäytetään aiemman nimen mukaan (testi).
- [ ] `parseGameLog` hylkää virheelliset rivit, rajat ja tuntemattomat kentät, ja teksteistä poistetaan ohjausmerkit (testit).
- [ ] Synkka: `mergeGames`-testit (vain paikallinen muutos, vain pilven muutos, molemmat, poisto kummaltakin puolelta, virheellinen pilvi), `syncEngine`-testit sisältävät tulokset, siirto tilille, `deleteAll` poistaa `games/log`-dokumentin.
- [ ] `firestore.rules` päivitetty ja `src/firestoreRules.test.ts` kattaa uuden polun. Säännöt viedään deviin ennen yhdistämistä testiin (käyttäjä tai PM luvalla).
- [ ] Pakan poisto poistaa tulokset, ja vahvistus kertoo määrän (testi). Tulokset eivät näy jakolinkissä, viennissä eivätkä julkisessa pakassa (testi).
- [ ] Pakat-sivulla näkyy ennätys (testi).
- [ ] Tekstit fi ja en. Ei sisäistä vieritystä, ei päällekkäisyyksiä 320 px:llä, tumma ja vaalea teema.
- [ ] Digiturvan vaatimukset (alla) täyttyvät.
- [ ] `npm test`, `npm run lint`, `npm run build` läpi.

## Digiturvan vaatimukset
_(lisätään uhkamallin jälkeen)_

## Rajaukset
- Ei uusia riippuvuuksia. Ei kaavioita tuloksista (myöhemmin IDEAS). Ei matchup-tietoa julkisiin pakkoihin eikä vertailua muiden pelaajien tuloksiin.
- Ei tulosten vientiä tai tuontia tiedostona (myöhemmin, jos pyydetään).
- Ei pakan versioittaista tulosta (pakan versiohistoriaa ei ole).

## Luovutus
