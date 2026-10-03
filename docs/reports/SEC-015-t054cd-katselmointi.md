# SEC-015 · T-054c/d synkronointi, tilin poisto ja lokit · katselmointi

**Päivä:** 2026-10-03 · **Katselmoija:** Digiturva · **Malli:** D-014 (kevyt, vain diffit)
**Laajuus:** commitit ef98146, dcba021, 8a6e6f2 (haara `t-054-kirjautuminen-ja-pilvitallennus`; huom. ne eivät ole vielä `test`-haarassa). Tarkistettu SR-23.7, SR-26, SR-29 ja kirjautumattoman näkymän vuodot. Ei tarkistettu: selaimessa käsin ajettu todennus, deployatut säännöt, uusi `npm audit` (riippuvuudet eivät muuttuneet).

## Tulos
Ei Critical-, High- eikä Medium-löydöksiä. 1 Low (korjattu), 2 Info. **Veto: ei blokkaa Done-tilaa eikä tuotantojulkaisua** (T-054b:n ehto sääntöjen deployista ja käsin todennuksesta on edelleen voimassa). `npm test` 769/769 ja `npm run lint` 0 korjauksen jälkeen.

## Löydökset

### SEC-044 · Synkronointi ei jatku, kun Auth-käyttäjän poisto epäonnistuu · Low · korjattu
**Sijainti:** `src/account/sync/session.ts` `start()` / `deleteAccountData()`, `src/ui/AccountMenu.tsx` `deleteEverything`.
**Toistaminen:** "Poista tilin tiedot", pilvi ja selain tyhjenevät, `auth.deleteAccount()` palauttaa `failed` (esim. verkkovirhe). Valikko kutsuu `session.start()`, mutta se palasi heti (`removeRetry !== null`), kun `deleteAccountData` oli pysäyttänyt vain moottorin.
**Vaikutus:** Tili on olemassa mutta synkronointi on pysähtynyt kunnes sivu ladataan uudelleen, vaikka käyttöliittymä lupaa "synkronointi toimii". Uudet muutokset jäävät vain laitteelle, eikä tila kerro sitä.
**Korjaus (tehty):** `start()` käynnistää moottorin uudelleen, jos sessio on jo `running`. Kattaa myös K-P5:n `failed`-polun.

### SEC-045 · Toisella laitteella poistettu tili (SR-23.7) · Info
**Havainto:** Kun pilvi on tyhjä ja pohja (base) on olemassa, merge poistaa laitteelta muuttumattomat pakat ja kokoelmakortit, ja muuttuneet viedään uudelleen pilveen. Käyttäytyy johdonmukaisesti ("poisto on muutos") eikä palauta poistettua dataa automaattisesti, joten SR-23.7:n vaatimus (ei automaattista palautusta) täyttyy. `invalid`, `locked` ja `limitExceeded` eivät johda poistoon (tarkistettu `mergeDecks`, `fullSync`).
**Rajaus:** (a) Toinen laite, jonka Auth-token on yhä voimassa (enintään noin 1 h), voi kirjoittaa muuttuneet pakat takaisin poistetun uid:n alle. Tämä on käyttäjän omaa dataa ja jää orvoksi pilveen. (b) Poistetun tilin `cyberdeck:u:{uid}:`-avaimet jäävät toiselle laitteelle, kunnes sieltä kirjaudutaan ulos tai selaimen tiedot tyhjennetään. Molemmat ovat tietosuojatekstin kannalta ilmoitettavia rajoja. Ehdotus PM:lle: yksi lause PRIVACY.md:hen ja tietosuojatekstiin ("muilla laitteilla olevat kopiot poistetaan sieltä erikseen"). Tuotepäätös (poistetaanko muut laitteet automaattisesti) kuuluu käyttäjälle, ei estä julkaisua.

### SEC-046 · Poisto pilvestä on epäatominen · Info
**Sijainti:** `firestoreCloudStore.ts` `deleteAll`: pakat 400 kpl erissä (enintään 10 kierrosta, MAX_DECKS 200 riittää), sitten kokoelma ja meta transaktiossa. Katkeaminen kesken jättää osan dataa, mutta `deleteAccountData` palauttaa `false`, selainta ei tyhjennetä ja käyttäjä voi yrittää uudelleen. Hyväksytty.

## Tarkistettu, ei löydöksiä
| Alue | Tulos |
|---|---|
| SR-26.1 `last-uid` | Poistuu `showUser(null)`:ssa ja `deleteAccount`-polussa (testattu). |
| SR-26.4 selain | `eraseAccount` poistaa kaikki `cyberdeck:u:{uid}:`-avaimet (kokoelma, pakat, varmuuskopiot, base); asetukset eivät kuulu tiliin. Kirjautumattoman datan (`cyberdeck:*`) ei kosketa. |
| SR-26.5 deleteUser | Järjestys pilvi, selain, Auth-käyttäjä. `requires-recent-login` tekee uudelleenkirjautumisen, poisto jatkuu paluun jälkeen vain jos `delete-pending` ja redirect-tulos ovat olemassa; väärä Google-tili (`user-mismatch`) tai virhe tyhjentää lipun eikä poista mitään (testattu). Vanhentunut lippu ei poista mitään ilman redirectiä. |
| SR-29 lokit | Ei `console.*`-kutsuja eikä `eslint-disable`ia `src/account`- eikä UI-tiedostoissa. Virheet muunnetaan `AuthErrorKind`/`CloudError`-tyypeiksi, uid:tä tai tokenia ei kirjata. Tokeneita ei käsitellä koodissa. |
| Vuoto kirjautumattomaan näkymään | Kirjautumattomat repositoriot käyttävät vain `cyberdeck:`-avaimia; tilin data on nimiavaruudessa `u:{uid}`, ja `forAccount` validoi uid:n (`isUid`). Siirto kirjautumattomasta tiliin tyhjentää kirjautumattoman datan vasta onnistuneen synkronoinnin jälkeen, varmuuskopion kanssa. Ilmoitus poiston jälkeen näytetään vain kun `uid === null` eikä sisällä dataa. |
| Syöte | Pilven data validoidaan `cloudCodec`issa, base jäsennetään tiukasti ja virheellinen base tulkitaan puuttuvaksi (turvallinen: merge molempiin suuntiin). |
