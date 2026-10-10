# T-122 · Pakan tulosseuranta (ottelupäiväkirja)
**Tila:** Done · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Should
**Katselmoinnit:** Digiturva (uhkamalli ennen toteutusta, katselmointi ennen yhdistämistä) ✓ · PM esikatselu ✓ (320 px ja 1440 px, tumma ja vaalea teema)
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
- **Pakan poisto poistaa sen tulokset** samassa tallennuksessa. Vahvistusdialogissa lukee määrä (`deleteDeckGames`), jos tuloksia on. Toisella laitteella poistetun pakan tulokset (harvinainen kilpatilanne) jäävät lokiin, mutta niitä ei näytetä missään. Orpoja ei siivota (SEC-122-3): pakan poisto poistaa vain poistetun pakan rivit (`withoutDeck`), koska laite ei tiedä, onko toisen pakan puuttuminen poisto vai virheellinen pilvidokumentti.
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
| opponentPlaceholder | Esim. sininen aggro | E.g. blue aggro |
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
- [x] Pelin voi kirjata, muokata ja poistaa. Tulos on pakollinen, ja muut kentät ovat valinnaisia (testit).
- [x] Avainluvut, Vastustajat-, Värit- ja Tapahtumat-taulukot lasketaan oikein, myös ryhmittely (nimi ilman kirjainkoon eroa, Legend-varaluokka, "Tuntematon") (domain-testit).
- [x] Aiemmat vastustajat ja tapahtumat ehdotetaan, ja Legendit esitäytetään aiemman nimen mukaan (testi).
- [x] `parseGameLog` hylkää virheelliset rivit, rajat ja tuntemattomat kentät, ja teksteistä poistetaan ohjausmerkit (testit).
- [x] Synkka: `mergeGames`-testit (vain paikallinen muutos, vain pilven muutos, molemmat, poisto kummaltakin puolelta, virheellinen pilvi), `syncEngine`-testit sisältävät tulokset, siirto tilille, `deleteAll` poistaa `games/log`-dokumentin.
- [x] `firestore.rules` päivitetty ja `src/firestoreRules.test.ts` kattaa uuden polun. Säännöt viedään deviin ennen yhdistämistä testiin (käyttäjä tai PM luvalla).
- [x] Pakan poisto poistaa tulokset, ja vahvistus kertoo määrän (testi). Tulokset eivät näy jakolinkissä, viennissä eivätkä julkisessa pakassa (testi).
- [x] Pakat-sivulla näkyy ennätys (testi).
- [x] Tekstit fi ja en. Ei sisäistä vieritystä, ei päällekkäisyyksiä 320 px:llä, tumma ja vaalea teema.
- [x] Digiturvan vaatimukset (alla) täyttyvät.
- [x] `npm test`, `npm run lint`, `npm run build` läpi.

## Digiturvan vaatimukset
Digiturva 2026-10-10. Nämä ovat ehdotuksia hyväksymiskriteereiksi, ja PM hyväksyy ne. Uhkamalli on SECURITY.md:n luvussa 19 ja tietosuoja PRIVACY.md:n luvussa 13. Olemassa olevat SR-11, SR-22, SR-23, SR-26 ja SR-27 koskevat myös tuloksia.

**SR-43 · Firestore-säännöt `users/{uid}/games/log`**
Lisää `firestore.rules`iin seuraava täsmälleen tässä muodossa, ja lisää polku myös tiedoston alun datamallikommenttiin:
```
// users/{uid}/games/log      { schemaVersion, savedAt, data: { games } }: the game results (T-122, D-030)
function isGamesDoc(d) {
  return isEnvelope(d)
    && hasExactly(d.data, ['games'])
    && d.data.games is list
    && d.data.games.size() <= 1000;
}
// (inside match /users/{uid})
match /games/{docId} {
  allow get: if isOwner(uid) && docId == 'log';
  allow create, update: if isOwner(uid)
    && docId == 'log'
    && isGamesDoc(request.resource.data);
  allow delete: if isOwner(uid) && docId == 'log';
}
```
- [x] `src/firestoreRules.test.ts` todentaa, että omistaja voi lukea, luoda, päivittää ja poistaa `games/log`-dokumentin. Kaikki seuraavat kielletään: toinen uid, kirjautumaton käyttäjä, muu kuin Google-kirjautuminen, `games/other`, `list`-kysely kokoelmaan `games`, ylimääräinen avain kääreessä tai `data`ssa, `games` muuna kuin listana, 1 001 riviä ja virheellinen `schemaVersion`.
- [x] Deploy-järjestys: vanhat säännöt hylkäävät `games/log`-kirjoituksen, jolloin koko batch kaatuu ja myös pakkojen synkka pysähtyy. Siksi säännöt viedään deviin ennen yhdistämistä testiin ja tuotantoon ennen kuin sovelluskoodi julkaistaan (D-029). Kirjaa deploy luovutukseen.

**SR-44 · Luetun datan validointi (`parseGameLog`, SR-23)**
- [x] Sama jäsennin käsittelee localStoragen, varmuuskopion, synkan pohjan ja pilven datan. Oliot rakennetaan kenttä kerrallaan, eikä luettua oliota levitetä (`...`). Testi: rivi, jossa on avain `__proto__`, `constructor` tai jokin tuntematon kenttä, hylätään, eikä `Object.prototype` muutu.
- [x] `id` ja `deckId` täyttävät ehdon `^[A-Za-z0-9_-]{1,64}$`. `playedOn` on muotoa `^\d{4}-\d{2}-\d{2}$` ja on todellinen kalenteripäivä. `createdAt` on merkkijono, jonka pituus on 1–40 ja jonka voi jäsentää päiväksi. `result` ja `turn` ovat sallitusta joukosta. `sideboard` on boolean. `opponentLegends` on lista, jossa on 0–3 eri merkkijonoa, ja jokainen on kortin avaimen muotoinen ja enintään 64 merkkiä.
- [x] Tekstikentistä poistetaan ohjausmerkit C0 ja C1 (U+0000–U+001F ja U+007F–U+009F) sekä suunta- ja näkymättömät merkit (U+200E, U+200F, U+061C, U+202A–U+202E, U+2066–U+2069, U+2028, U+2029, U+FEFF) käyttäen olemassa olevaa `UNSAFE_CHARACTERS`-lauseketta (`src/domain/validate.ts`, R-15). Sen jälkeen teksti trimmataan, ja pituusraja tarkistetaan vasta siivouksen jälkeen. Tyhjä teksti muuttuu arvoksi `null`. Testi: RLO-merkki ja rivinvaihto vastustajan nimessä.
- [x] Saman `id`:n toistuessa säilytetään ensimmäinen rivi ja muut hylätään (testi). Muuten `mergeGames` ja poistojen tunnistus voisivat käyttäytyä väärin.
- [x] Virheellinen pilvidokumentti tai yli 1 000 riviä ei ole poisto, eikä sitä ylikirjoiteta automaattisesti (`null`, SR-23 kohta 3). Virheellinen paikallinen data varmuuskopioidaan ennen korjausta (SR-11).

**SR-45 · Kirjoituksen rajat**
- [x] Lomakkeen tallennus ja synkan push käyttävät samaa validointia kuin luku. Kentän `maxLength` on vain käyttöliittymän apu, eikä tarkistus luota siihen.
- [x] `MAX_GAMES = 1000` ja 900 000 tavun raja (UTF-8, `TextEncoder`) tarkistetaan domainissa ennen tallennusta ja synkassa ennen pushia. Ylitys estää lisäyksen (`logFull`) tai johtaa synkassa tilaan `Stop('error')`. Osittaista kirjoitusta ei tehdä (testi: 999 riviä, joissa on 500 merkin muistiinpano, ja tavuraja).
- [x] `games/log` kirjoitetaan samassa batchissa kuin meta (`rev` +1), ja batchin operaatiolaskuri sisältää sen (`cloudCodec`).

**SR-46 · Vapaan tekstin näyttäminen**
- [x] Vastustajan nimi, tapahtuma ja muistiinpano näytetään vain React-tekstinä tai propseina (`title`, `aria-label`, `<option value>`). `dangerouslySetInnerHTML`, `innerHTML`, linkitys, `href` ja markdown ovat kiellettyjä.
- [x] Ryhmittelyt (vastustajat, tapahtumat, värit, datalist) tehdään `Map`illa eikä tavallisen olion avaimilla. Testi: vastustajat nimeltä `__proto__`, `constructor` ja `toString` ryhmittyvät oikein.
- [x] Pitkä teksti ilman välilyöntejä rivittyy (`overflow-wrap: anywhere`), eikä se leviä 320 px:n näkymän yli.

**SR-47 · Tulokset eivät vuoda**
- [x] Tuloksia ei ole julkisessa pakassa (`publicDecks`), pakan jakolinkissä, vaihtolinkissä (`#/vaihto`), .txt- tai .json-viennissä, proxytulosteessa eikä leikepöydälle kopioitavassa tekstissä. Testi: kun pakalla on tuloksia, julkisen kopion, jakolinkin ja viennin tuloste on täsmälleen sama kuin ilman tuloksia.
- [x] Tulosten sisältöä ei kirjoiteta konsoliin (SR-27). `no-console` koskee myös uutta domain- ja tallennuskoodia.

**SR-48 · Elinkaari ja poisto (SR-26)**
- [x] Kirjautumattoman käyttäjän avain on `cyberdeck:games`, ja varmuuskopioita on enintään 3 (`cyberdeck:backup:games:<aika>`). Tilillä avain on `cyberdeck:u:{uid}:games`, ja tulokset ovat myös synkan pohjassa.
- [x] `backupAll` ja `clear()` (siirron jälkeen) käsittelevät myös tulokset. `eraseAccount` poistaa avaimen ja pohjan, koska se poistaa etuliitteen mukaan (testi).
- [x] `deleteAll` poistaa `games/log`-dokumentin. Onnistumisen tarkistus ja muistipilven testi kattavat myös sen.
- [x] Uloskirjautuneena tilin tulokset eivät näy (testi).
- [x] Siirto tilille säilyttää `deckId`-linkin, joten tulokset löytyvät siirretylle pakalle (testi).
- [x] Pakan poisto poistaa sen tulokset samassa tallennuksessa, ja vain sen rivit (ei orpoja, SEC-122-3).

**SR-49 · Tietosuoja ja minimointi (PRIVACY.md luku 13)**
- [x] Tallennetaan vain kortin `GameRecord`-kentät. Vastustajan tilitunnistetta, yhteystietoja tai kuvaa ei tallenneta, eikä vastustajan nimeä käytetä mihinkään muuhun kuin oman lokin ryhmittelyyn ja ehdotuksiin.
- [x] Lomakkeessa on vastustajan ja muistiinpanon kohdalla lyhyt vihje. Ehdotus: fi "Käytä lempinimeä tai pakan kuvausta. Älä kirjaa muiden henkilötietoja." / en "Use a nickname or describe the deck. Don't record other people's personal details." Lisäksi ehdotan, että placeholder ei sisältäisi etunimeä: fi "Esim. sininen aggro", en "E.g. blue aggro". Sisällön muotoilu ja lopullinen päätös kuuluvat PM:lle.
- [x] Kirjautumisdialogin tai selosteen tietosuojateksti mainitsee, että myös pelitulokset tallennetaan tilille (SR-29).

## Rajaukset
- Ei uusia riippuvuuksia. Ei kaavioita tuloksista (myöhemmin IDEAS). Ei matchup-tietoa julkisiin pakkoihin eikä vertailua muiden pelaajien tuloksiin.
- Ei tulosten vientiä tai tuontia tiedostona (myöhemmin, jos pyydetään).
- Ei pakan versioittaista tulosta (pakan versiohistoriaa ei ole).

## Luovutus

### Koodari (2026-10-10) · Review
Toteutettu haarassa `t-122-tulosseuranta` (commitit `T-122: …`, ei PR:ää). Rakenne D-030:n mukaan, want-listan (T-064a) malli toistettuna kaikkiin kohtiin.
- **Domain:** `src/domain/games.ts` (tyypit, rajat `MAX_GAMES` 1000 ja 900 000 tavua, `parseGameRecord`/`parseGameLog` kenttä kerrallaan ja kaikki kentät pakollisia, tuntematon kenttä, `__proto__`, väärä tyyppi, päivä, ≤3 eri Legendiä, ≤64 merkin avain ja ohjausmerkit pois ennen pituuden tarkistusta → rivi pois; sama `id` → ensimmäinen säilyy; yli 1 000 riviä → koko loki kelvoton; `gameLogFits`, `withGame`, `withoutDeck`, `sameGameLog`). `src/domain/gameStats.ts` (V–T–Ta, voitto-%, aloittaja/toinen, ryhmittely `Map`illa: vastustajat nimen/Legendien/tuntemattoman mukaan, värit, tapahtumat, ehdotukset, Legendien esitäyttö, pakkakohtainen ennätys).
- **Tallennus:** `cyberdeck:games` (tilillä `cyberdeck:u:{uid}:games`), envelope v1, varmuuskopio (max 3), `GameLogRepository` (`load`, `add`, `update`, `remove`, `subscribe`; kortin `load/save/subscribe`-luonnoksen sijaan muutokset ovat repositoriossa, koska SR-13 vaatii read-modify-write-mutaation eikä kahden välilehden lost update ole mahdollinen). `LocalData.games`, `SyncBase.games` (vanha pohja ilman `games` = tyhjä loki), `readLocal`/`apply`/`backupAll`/`clear`/`onChange`. Pakan poisto poistaa pakan tulokset ja kaikki orvot samalla kutsulla (`decks.remove`); jos loki on lukittu tai rikki, pakka poistuu silti.
- **Pilvi/synkka:** `users/{uid}/games/log`: `CloudSnapshot.games`, `CloudChange.games`, `encodeGamesDoc` (rivit rakennetaan kenttä kerrallaan), `checkChange` (rivi-, määrä- ja tavuraja ennen lähetystä; transaktiolaskuri), Firestore- ja muistitoteutus, `deleteAll` poistaa dokumentin. `mergeGames` (id:n mukaan, vain toinen muuttui → se, molemmat → paikallinen, poisto, kaikki kentät vertailussa, virheellinen pilvi → `null`, ei ylikirjoitusta), `syncEngine` (push ilman lukuja, fullSync, ylitys → `Stop('error')`), siirto tilille (`copySignedOutData`; jos yhdistetty loki ei mahtuisi rajoihin, mitään ei kopioida ja uloskirjautuneen data jää paikalleen).
- **Säännöt:** `firestore.rules` SR-43:n mukaan täsmälleen kortin muodossa + datamallikommentti; `src/firestoreRules.test.ts` (staattinen, kuten muutkin). Säännöt eivät ole viety (ei `firebase deploy`).
- **UI:** `DeckResults.tsx` (otsikko + **+ Kirjaa peli**, KPI-laatat, Vastustajat/Vastustajan värit/Tapahtumat-taulukot, pelilista 10 + Näytä kaikki, kynä/roskakori + vahvistus, tyhjä tila, lataus/lukitus/virhe, `saved`-ilmoitus), `GameDialog.tsx` (natiivi dialog, koko ruutu alle 40 rem, Tulos-segmentti ilman oletusta, Tallenna pois käytöstä kunnes tulos valittu, vastustaja + datalist, Legend-haku ≤3 ja sirut, Lisätiedot-disclosure, joka on auki muokatessa jos lisätietoja, SR-49-vihje vastustajan ja muistiinpanon kohdalla), `useGameLog.ts`, `ColorLetters.tsx` (värikoodikirjaimet), `icons.tsx` (kynä/roskakori siirretty DecksView:stä), `ConfirmDeleteDialog` yleistetty (otsikko/teksti/lisärivi). `DeckEditor.tsx` +3 riviä (osio `DeckStats`in jälkeen). Pakat-sivulla ennätys `5–3–1` (+ spoken `recordAria`) ja pakan poiston vahvistuksessa `deleteDeckGames(n)`. Tekstit `gameTexts.{fi,en,}.ts`; tilin tietosuojatekstit (`accountPrivacy*`, poisto ja yhdistämisvalinta) mainitsevat pelitulokset (SR-49 kohta 3). CSS-lohko tiedoston lopussa (`overflow-wrap: anywhere`, ei sisäisiä vieritysalueita, textarea `resize: none` + `field-sizing: content`).
- **Testit:** `games.test.ts`, `gameStats.test.ts` (domain), `storage/games.test.ts` (repositorio, raja, varmuuskopiot, kaksi välilehteä, pakan poisto ja orvot, sync-rajapinta, tilin poisto), `merge.test.ts` (`mergeGames`), `syncEngine.test.ts`, `session.test.ts`, `cloudStore.test.ts` (muisti ja Firestore-fake: kirjoitus, validointi, raja, deleteAll), `firestoreRules.test.ts`, `DeckResults.test.tsx` (lomake, tallennus, muokkaus, poisto, taulukot, lista, SR-46 `__proto__`/HTML-teksti, täysi loki, ennätys ja poistovahvistus), `gameResults.leak.test.ts` (SR-47: pakan dokumentti, vienti, jakolinkki, julkinen kopio ennallaan), `gameTexts.test.ts` (fi/en-avaimet).
- **Tulokset:** `npm test` 126 tiedostoa / 1734 testiä läpi (yksi ajoitusherkkä `DeckEditor.test` "saves automatically" kaatui kerran kuormassa ja meni läpi yksin ja uusintaajossa), `npm run lint` läpi, `npm run build` läpi.
- **Koodikatselmointi:** tehty · Pakollisia korjattu 3 (pilvikoodekin tavutarkistus oli ~100 tavua tiukempi kuin domainin raja: yhtenäistetty `gameLogFits`iin; Legend-avaimen 64 merkin raja puuttui; kaksi samassa millisekunnissa luotua peliä antoi epädeterminismiä testissä) · Suosituksia 4 (velka alla).
- **Velka / PM:n huomioitavaa:**
  1. Visuaalista tarkistusta selaimessa (320 px, tumma/vaalea, taulukot, dialogi koko ruutuna) en tehnyt: PM katsokoon esikatselusta. Taulukon neljä saraketta 320 px:llä on tiukka; ensimmäinen sarake rivittyy (`overflow-wrap: anywhere`), otsikot rivittyvät.
  2. Kortti ei antanut tekstejä seuraaville, jotka kirjoitin itse: `newGameTitle` (Kirjaa peli / Log a game), `turnNone` (Ei valintaa / Not set), `resultRequired`, `legendSearch/Add/Remove/NoResults/Full`, `deleteGameTitle/Confirm`, `savedEdit`, `deleted`, `showFewer`, `loading/unavailable/locked/repaired/reset`, `saveFailed/saveInvalid`, `colours`, `noteHint`. PM tarkistakoon sanamuodot.
  3. Rivinvaihto muistiinpanossa muutetaan välilyönniksi tallennuksessa (ohjausmerkit poistetaan SR-44:n mukaan, joten monirivistä muistiinpanoa ei ole).
  4. Legend-haku näyttää tuloksia vasta kirjoittaessa (≤6 kerrallaan), ei koko listaa (ei sisäistä vieritystä). Esitäyttö tapahtuu kun vastustajakentästä poistutaan (`onBlur`), ei kirjoittaessa.
  5. Samalla päivällä peli järjestyy `createdAt`in mukaan; muokattu peli säilyttää `createdAt`in.
  6. Pakan jakolinkin/viennin/julkisen kopion testi on rakenteellinen (funktiot saavat vain pakan sisällön; pakan dokumentti ei muutu pelin lisäyksestä).
- **Deploy-järjestys (SR-43):** säännöt on vietävä deviin ennen kuin tämä yhdistetään testiin, ja tuotantoon ennen sovelluskoodin julkaisua (vanhat säännöt hylkäisivät `games/log`-kirjoituksen, jolloin koko batch ja pakkojen synkka kaatuisi). Ei tehty.
- Luovutus: PM (esikatselu ja sääntöjen vienti deviin), sen jälkeen Digiturva (katselmointi ennen yhdistämistä: uusi pilvidokumentti ja sääntömuutos, vapaa teksti, tietosuoja).

### Digiturva (2026-10-10) · Katselmointi
Katselmoitu `git diff test...t-122-tulosseuranta` (5 commitia) SR-43–SR-49:ää vasten. Löydökset: Critical 0, High 0, Medium 1, Low 2, Info 3. **Veto: ei** (ei Critical- eikä High-löydöstä). Säännöt ovat valmiita vietäviksi deviin.

**Tarkistetut alueet, joista ei löytynyt mitään:**
- **SR-43:** `firestore.rules` vastaa korttia täsmälleen (datamallikommentti, `isGamesDoc`, get/create/update/delete vain `isOwner(uid) && docId == 'log'`, ei list-sääntöä). `isOwner` sisältää Google-ehdon ja `isEnvelope` tarkat avaimet ja `schemaVersion`in. Sääntötesti on staattinen kuten muutkin (SEC-122-6).
- **SR-44:** `parseGameRecord` rakentaa rivin kenttä kerrallaan, hylkää tuntemattoman avaimen (myös `__proto__` ja `constructor`), puuttuvan kentän ja väärän tyypin. Id-, päivä-, `createdAt`-, Legend- ja enum-ehdot täyttyvät. Ohjausmerkit poistetaan `UNSAFE_CHARACTERS`illa (g-lippu) ennen trimmausta ja pituusrajaa, ja tyhjä muuttuu `null`iksi. Toistuva id: ensimmäinen säilyy. Yli 1 000 riviä → `null`. Sama jäsennin palvelee localStoragea, varmuuskopiota, synkan pohjaa (`parseSyncBase` hylkää pohjan, jos rivejä pudotetaan) ja pilveä (`GAMES_ENVELOPE_SPEC`).
- **SR-45:** lomake (`validGame` → `parseGameRecord`), `checkedLog` (`gameLogFits`: rivit ja UTF-8-tavut), synkan push (`gameLogFits` → `Stop('error')`), fullSync ja `checkChange` (uudelleenjäsennys, `dropped > 0` hylätään, raja) käyttävät samaa validointia. `games/log` kirjoitetaan samassa transaktiossa kuin meta (`rev + 1`), ja se on mukana operaatiolaskurissa. `encodeGamesDoc` rakentaa rivit kenttä kerrallaan.
- **SR-46:** uusissa UI-tiedostoissa ei ole `dangerouslySetInnerHTML`ia, `innerHTML`ia, vapaasta tekstistä tehtyä `href`iä, linkitystä eikä markdownia. Ryhmittely ja ehdotukset tehdään `Map`illa (`gameStats.ts`).
- **SR-47:** tuloksia käytetään vain `DeckResults`issa (oma pakkaeditori), Pakat-sivun ennätyksessä ja poistovahvistuksessa. Jako-, vienti- ja julkisen kopion polut eivät viittaa lokiin (grep ja `gameResults.leak.test.ts`). Uudessa koodissa ei ole `console`-kutsuja.
- **SR-48:** avaimet ovat `cyberdeck:games` ja `cyberdeck:u:{uid}:games`, ja loki on mukana synkan pohjassa, `readLocal`issa, `apply`ssa, `backupAll`issa, `clear`issa, `onChange`ssa ja `eraseAccount`issa (etuliite). `deleteAll` poistaa `games/log`in samassa transaktiossa kuin kokoelman, want-listan ja metan (Firestore ja muisti). Siirto tilille säilyttää `deckId`n, eikä se kopioi mitään, jos yhdistetty loki ei mahdu rajoihin.
- **SR-49:** `GameRecord` sisältää vain kortin kentät. Vihje näkyy vastustajan ja muistiinpanon kohdalla, ja tilin tietosuojatekstit mainitsevat tulokset. K-P13:een on vastattu (PRIVACY.md luku 13).
- **Riippuvuudet, firebase.json ja workflowt:** ei muutoksia, joten `npm audit`ia ei tarvittu. **Salaisuudet:** haaran commitit käytiin läpi (API-avaimet, yksityiset avaimet, tokenit ja salasanat), eikä mitään löytynyt.
- **Testit:** T-122:n testitiedostot ja `src/account` ajettiin uudelleen (13 tiedostoa, 327 testiä läpi).

### SEC-122-1 · Virheellinen pilviloki ylikirjoitetaan seuraavassa pushissa · Medium
**Sijainti:** `src/account/sync/syncEngine.ts:121` (`push`) ja `:151` (`fullSync`, `baseOf(merged, rev)`) · **Tehtävä:** T-122
**Toistaminen:** 1) Laite synkkaa lokin. 2) Pilveen kirjoitetaan virheellinen `games/log` (esim. `{ garbage: true }` tai 1 001 riviä), ja metan `rev` muuttuu. 3) fullSync säilyttää pilven (testi "keeps the local log and the cloud document…" menee läpi), mutta tallentaa pohjaksi paikallisen lokin ja uuden `rev`in. 4) Käyttäjä kirjaa pelin. 5) Seuraavalla kierroksella `rev === base.rev`, joten tehdään `push`, joka kirjoittaa paikallisen lokin virheellisen dokumentin päälle. Todennettu väliaikaisella testillä (ei commitoitu): toisen synkan jälkeen `games/log` oli korvattu.
**Odotettu:** virheellistä pilvidokumenttia ei ylikirjoiteta automaattisesti (SR-44 viimeinen kohta, SR-23 kohta 3). · **Havaittu:** dokumentti säilyy vain siihen asti, kunnes paikallinen loki muuttuu.
**Vaikutus:** rivit, jotka toinen laite tai virheellinen versio kirjoitti ja joita tämä laite ei osaa lukea, katoavat pilvestä hiljaa. Hyökkääjää ei ole, koska vain omistaja voi kirjoittaa dokumenttiin. Riski on oman datan menetys bugin tai skeemavirheen seurauksena. Sama malli on käytössä jo kokoelmassa ja want-listassa (`cloudValue` → `null`), joten löydös ei ole T-122:n oma regressio. Tulosloki kuitenkin muuttuu useammin.
**Korjausehdotus:** kun pilven osa on `invalid`, älä tallenna sitä pohjaan synkattuna. Vaihtoehdot: (a) `fullSync` palauttaa tiedon, ja `push` ohittaa `games`-osan (sekä kokoelman ja want-listan), kunnes fullSync näkee kelvollisen dokumentin, tai (b) fullSync pakotetaan aina, kun edellinen kierros näki virheellisen osan (esim. lippu pohjassa). Lisää testi: virheellinen pilvi → paikallinen muutos → synkka → pilvi ennallaan. PM päättää, korjataanko nyt vai kirjataanko velaksi koko mallille.
**Tila:** Avoin → Korjattu (267aa66) → Varmistettu (Digiturva 2026-10-10). Jatkohavainto SEC-122-7.

### SEC-122-2 · Pilvilokin yksittäinen virheellinen rivi tulkitaan poistoksi · Low
**Sijainti:** `src/account/cloudCodec.ts` (`decodeGamesDoc`: `ok` + `dropped`) ja `src/account/sync/merge.ts:160` (`mergeGames`) · **Tehtävä:** T-122
**Toistaminen:** 1) Pohjassa ja paikallisesti on rivi X. 2) Pilven rivi X on vioittunut (esim. tuntematon kenttä), jolloin `parseGameLog` pudottaa sen ja dokumentti on `ok`. 3) `mergeGames`: paikallinen X on sama kuin pohjan, ja pilvestä X puuttuu, joten X poistetaan paikallisesti ja pilvi kirjoitetaan uudelleen ilman sitä.
**Odotettu:** virheellinen ≠ poistettu (SR-23 kohta 3). · **Havaittu:** pudotettu rivi käsitellään toisen laitteen poistona, ja käyttäjä näkee vain `dropped`-varoituksen.
**Vaikutus:** yksittäinen peli katoaa kaikilta laitteilta bugin tai skeemavirheen seurauksena. Sama käytös on kokoelman riveillä.
**Korjausehdotus:** jos pilvidokumentissa on `dropped > 0`, käsittele koko loki kuten `invalid` (`null`, ei ylikirjoitusta), tai välitä pudotettujen rivien id:t `mergeGames`ille samaan tapaan kuin `invalidDeckIds` pakoille (vaatii, että id luetaan myös virheellisestä rivistä).
**Tila:** Avoin → Korjattu (267aa66) → Varmistettu (Digiturva 2026-10-10)

### SEC-122-3 · Pakan poisto voi poistaa sellaisten pakkojen tuloksia, joita laitteella ei ole · Low
**Sijainti:** `src/storage/repositories.ts:560` (`decks.remove` → `withoutOrphans`) · **Tehtävä:** T-122
**Toistaminen:** 1) Pilvessä on pakka P, jonka dokumentti on virheellinen (`invalidDeckIds`), joten laite B ei saa sitä, mutta P:n pelit tulevat B:lle lokin mukana. 2) B:llä poistetaan jokin muu pakka. 3) `withoutOrphans` poistaa myös P:n pelit, ja synkka vie poiston pilveen.
**Vaikutus:** pakan P tulokset katoavat, vaikka P on yhä olemassa (rikkinäisenä) pilvessä. Tilanne on harvinainen ja koskee omaa dataa.
**Korjausehdotus:** siivoa vain poistetun pakan rivit (`withoutDeck`). Orvot kannattaa siivota vain silloin, kun synkka on juuri nähnyt koko pakkajoukon kelvollisena (ei `invalidDeckIds`ejä). Toinen vaihtoehto on jättää siivous kokonaan pois, koska orvot eivät näy missään.
**Tila:** Avoin → Korjattu (267aa66) → Varmistettu (Digiturva 2026-10-10)

### SEC-122-4 · Deploy-järjestys: vanhat säännöt kaatavat myös lukemisen ja tilin poiston · Info
**Sijainti:** `src/account/firebase/firestoreCloudStore.ts:90` (`readAll`), `:121` (`deleteAll`), `:143` (`commit`)
**Havainto:** SR-43:n riski on laajempi kuin pelkkä kirjoitus. Vanhat säännöt hylkäävät `getDoc(games/log)`-kutsun, joten `readAll` ja koko fullSync epäonnistuvat kaikilla kirjautuneilla, myös niillä, joilla ei ole tuloksia. Lisäksi `deleteAll`in viimeinen transaktio kaatuu, jolloin "Poista tilin tiedot" ei toimi (GDPR-poisto). D-029:n suoran julkaisun vuoksi säännöt on vietävä **deviin ennen testiin yhdistämistä ja tuotantoon ennen julkaisu-PR:n yhdistämistä**. Kirjaa deploy luovutukseen (komento ja aika).
**Tila:** Avoin (toimenpide, ei koodivirhe)

### SEC-122-5 · localStorage-kiintiö täysillä lokeilla · Info
**Havainto:** täysi loki on noin 900 kt, ja varmuuskopioita on enintään 3. Kirjautuneen käyttäjän selaimessa myös uloskirjautuneen nimiavaruudessa voi olla loki. Pahimmillaan pelkät tulokset vievät noin 4–7 Mt, mikä voi ylittää selaimen origin-kiintiön ja estää muiden tietojen tallennuksen. Tästä seuraa `write`-virhe mutta ei datan menetystä, koska mutaatio tehdään kokonaan tai ei ollenkaan. Täydentää R-24:ää.
**Ehdotus:** ei toimenpiteitä nyt. Arvioidaan uudelleen R-24:n yhteydessä (esim. varmuuskopioiden määrä suurille aggregaateille).
**Tila:** Avoin (seuranta)

### SEC-122-6 · Sääntötesti on staattinen · Info
**Havainto:** `src/firestoreRules.test.ts` todentaa sääntöjen tekstin mutta ei kortin listaamia kieltoja ajossa (toinen uid, kirjautumaton käyttäjä, 1 001 riviä jne.). Tämä noudattaa projektin nykyistä käytäntöä (ei emulaattoria). Testin `block` ulottuu lisäksi tiedoston loppuun asti (myös `publicDecks`), mutta se ei heikennä nykyisiä tarkistuksia.
**Ehdotus:** dev-viennin jälkeen PM tarkistaa käsin tai Rules Playgroundissa yhden kielletyn tapauksen (esim. `games/other`) ja yhden sallitun.
**Tila:** Avoin (seuranta)

### Koodari (2026-10-10) · Digiturva-korjaukset
- **SEC-122-1:** jos fullSyn lopussa jokin pilviaggregaatti (kokoelma, want-lista tai tulokset) on virheellinen, pohja tallennetaan rev-arvolla `Number.MAX_SAFE_INTEGER`, joka ei koskaan vastaa pilven revia. Seuraava kierros tekee aina fullSyncin eikä push-oikotietä, joten virheellinen dokumentti jää koskematta. Pohjan sisältö säilyy. Testit: virheellinen pilvi → paikallinen muutos → kaksi synkkaa → pilvi ennallaan (tulokset, want-lista, kokoelma).
- **SEC-122-2:** `decodeGamesDoc` tulkitsee koko lokin virheelliseksi, jos yksikin rivi pudotetaan (`dropped > 0`). Testit: cloudStore-sopimustesti ja syncEngine ("one row cannot be read").
- **SEC-122-3:** `decks.remove` poistaa vain poistetun pakan rivit (`withoutDeck`). `withoutOrphans` poistettu käyttämättömänä. Kortin rakennepäätös ja hyväksymiskriteeri päivitetty. Testi: tuntemattoman pakan pelit säilyvät.

### Digiturva (2026-10-10) · Korjausten varmistus
Tarkistettu `git diff 94483d6..df8e010` (commitit 267aa66 ja df8e010). SEC-122-1, SEC-122-2 ja SEC-122-3 ovat **varmistettuja**. Testit `src/account`, `src/storage`, `games.test.ts`, `DeckResults.test.tsx` ja `gameResults.leak.test.ts` menivät läpi (21 tiedostoa, 497 testiä). Veto: ei.
- **SEC-122-1:** fullSync tallentaa pohjan revillä `NEVER_IN_SYNC_REV = Number.MAX_SAFE_INTEGER`, jos kokoelma, want-lista tai tulokset ovat `invalid`. `parseSyncBase` hyväksyy arvon (`Number.isSafeInteger`, ≥ 0), ja se säilyy JSON-muunnoksessa tarkkana. Base.revia käytetään vain vertailussa `rev === base.rev` ja push-polun `expectedRev`inä (`syncEngine.ts:139/201`). Koska vertailu ei koskaan toteudu, push-polkua ei ajeta. Muualla arvoa ei käytetä (`session.ts:144` tarkistaa vain, onko pohja `null`). Väliaikainen todennustestini (virheellinen pilvi → uusi peli → synkka) menee nyt läpi, ja Koodarin testit kattavat kaikki kolme aggregaattia. Sivuvaikutus: niin kauan kuin pilvessä on virheellinen osa, jokainen kierros on fullSync (lisää lukuja, R-24). Tämä on hyväksyttävää.
- **SEC-122-2:** `decodeGamesDoc` palauttaa `invalid`, jos `dropped > 0`. Testit ovat cloudStore-sopimuksessa ja syncEnginessä.
- **SEC-122-3:** `decks.remove` käyttää `withoutDeck(current, id)`, ja `withoutOrphans` on poistettu.
- **df8e010** (PM): vain CSS-luokka `results-games` ja asettelu. Ei vaikutusta turvallisuuteen.

### SEC-122-7 · Virheellisen pilven aikana lisätty peli katoaa, kun pilvi taas kelpaa · Low
**Sijainti:** `src/account/sync/syncEngine.ts` (fullSync: `storage.saveBase(baseOf(merged, cloudInvalid ? NEVER_IN_SYNC_REV : rev))`) · **Tehtävä:** T-122
**Toistaminen:** 1) Laite synkkaa pelin A. 2) Pilven `games/log` muuttuu virheelliseksi. 3) Käyttäjä kirjaa pelin B, ja synkka säilyttää pilven (SEC-122-1 korjattu). Pohjaan tallentuu kuitenkin yhdistetty paikallinen loki eli A ja B. 4) Jokin asiakas kirjoittaa pilveen kelvollisen lokin, jossa on vain A. 5) fullSync: B on paikallisesti sama kuin pohjassa ja puuttuu pilvestä, joten `mergeGames` tulkitsee sen poistoksi ja B katoaa. Todennettu väliaikaisella testillä (ei commitoitu).
**Odotettu:** peli, jota pilvi ei koskaan nähnyt, säilyy. · **Havaittu:** se poistetaan.
**Vaikutus:** oman datan menetys harvinaisessa palautumistilanteessa. Tämän version asiakas ei kirjoita virheellisen dokumentin päälle, joten tilanne vaatii toisen version, korjatun bugin tai käsin tehdyn korjauksen. Sama koskee kokoelmaa ja want-listaa.
**Korjausehdotus:** kun osa on `invalid`, tallenna pohjaan sen osalta edellisen pohjan arvo (`base?.games ?? EMPTY_GAME_LOG` ja vastaavasti kokoelmalle ja want-listalle) eikä yhdistettyä paikallista arvoa. Silloin pilven näkemättömät muutokset pysyvät paikallisina muutoksina. Lisää testi yllä olevista vaiheista. Korjaus ei estä Done-tilaa, ja PM päättää, tehdäänkö se nyt vai velkana.
**Tila:** Avoin

### PM (2026-10-10)
- Esikatselu tarkistettu (PR #137): 320 px ja 1440 px, tumma ja vaalea teema, dialogi. Korjattu itse (df8e010): puhelimessa ryhmätaulukoista on jätetty pois Pelit-sarake, jotta nimet eivät katkea kesken sanan, ja Tulos-otsikko on samaa tyyliä kuin muut kentät. Lint-korjaus: ` `-escape.
- Säännöt viety dev-projektiin (`cyberdeck-tcg-dev`) 2026-10-10 ennen testiin yhdistämistä (SEC-122-4). Tuotantoon ennen julkaisu-PR:n yhdistämistä.
- SEC-122-7 (Low) kirjattu velaksi T-124:ään, koska se koskee myös kokoelmaa ja want-listaa ja on harvinainen.
- Kirjautuneen synkan käsintesti ei ole mahdollista PM:lle (Google-kirjautuminen). Synkka on katettu automaattitesteillä (syncEngine, cloudStore, säännöt).
