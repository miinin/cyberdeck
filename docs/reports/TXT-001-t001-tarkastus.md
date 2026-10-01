# TXT-001 · T-001:n käyttöliittymätekstien sisältö- ja kielitarkastus

**Tehtävä:** T-001 · **Tarkastaja:** Sisällöntuottaja · **Päivä:** 2026-10-01
**Kohde:** haara `t-001-kaveleva-luuranko` (b0e1916), esikatselu https://cyberdeck-tcg-test--pr1-t-001-kaveleva-luura-wj9wvfxt.web.app
**Tarkastettu:** `src/ui/texts.ts`, `index.html` (`<title>`, `lang`), alatunniste (`src/App.tsx`), tekstien käyttö `src/ui/CatalogView.tsx` ja `src/ui/CardList.tsx`, sanasto UX.md:n lukuun 2 ja 4.5 verrattuna.

## Menetelmä ja rajoitteet

- Esikatselun HTML ja julkaistu JS-paketti haettiin `curl`illa: `lang="fi"`, `<title>Kortit · Cyberdeck</title>` ja kaikki texts.ts:n tekstit ovat paketissa sellaisinaan.
- Netdeck.gg:n rajapinta luettiin kerran (2 sivua, 151 korttia) asiasisällön tarkistamiseksi: korttityypit ja `cost`-kentän merkitys sääntöteksteissä.
- **Rajoite:** tässä ympäristössä ei ole selainta, joten tekstejä ei nähty renderöitynä näkymässä. Konteksti arvioitiin komponenttien rakenteesta (mikä teksti näkyy missä tilassa) ja UX.md:n rautalangoista. UX:n ja Testikäyttäjän selainkatselmointi kattaa visuaalisen kontekstin.

## Yhteenveto

| ID | Löydös | Vakavuus | Blokkaa |
|---|---|---|---|
| TXT-001 | OSITTAINEN-tilan teksti ei vastaa toteutusta: lupaa, että uusi haku tuo kaikki kortit | Medium | Ei |
| TXT-002 | Alatunnisteen epävirallisuusmerkintä: "WeirdCon" näyttää eri nimeltä, lausefragmentti, peli ei mainittu | Low | Ei |
| TXT-003 | Tarkistettava: CD PROJEKT RED:n fanisisältöohjeen englanninkielinen merkintä | Low | Ei |
| TXT-004 | TYHJÄ-tila: "Yritä myöhemmin" ja painike "Yritä uudelleen" ristiriidassa, "Korttitietokanta" epämääräinen | Low | Ei |
| TXT-005 | K1 "Hinta": suositus säilyttää, sanastomerkintä | Info | Ei |
| TXT-006 | K2 korttityypit englanniksi: suositus säilyttää | Info | Ei |
| TXT-007 | UX.md 4.4:n asiavirhe: "Legend ei ole hintaa" ei pidä paikkaansa kaikille Legendeille; puuttuvan nimen ja tyypin tekstejä ei käytetä | Info | Ei |

**Veto: ei.** Sisältö ei ole loukkaavaa, ja kohderyhmä pystyy käyttämään näkymää. TXT-001 on asiallisesti harhaanjohtava, mutta vain harvinaisessa tilassa, ja siinä on toimiva kiertotie (lista näkyy, varoitus kertoo puutteesta).

Tarkistettu, ei löydöksiä: `lang="fi"`, `<title>`, otsikko "Kortit", lataus ("Haetaan kortteja…", oikea U+2026), lukumäärien taivutus (`cardCount`, 0/1/2+ ja suomalainen tuhaterotin), VIRHE-tilan otsikko ja leipäteksti (mitä tapahtui + mitä voit tehdä, ei teknistä tietoa), live-alueen tekstit (paitsi OSITTAINEN, TXT-001), taulukon kuvateksti "Kaikki kortit", sarakeotsikot, puuttuvan arvon "–" (U+2013) ja piilotettu "ei hintaa", lähdemaininta "Korttitiedot: Netdeck.gg", painike "Yritä uudelleen" (verbi). Kovakoodattua käyttäjälle näkyvää tekstiä ei löytynyt texts.ts:n ulkopuolelta (`src/api/`:n englanninkieliset virheviestit menevät vain konsoliin/virheolioon, eivät käyttöliittymään).

---

### TXT-001 · OSITTAINEN-tilan teksti lupaa, että uusi haku tuo kaikki kortit · Medium
**Sijainti:** `src/ui/texts.ts` `partialTitle`, `partialBody`, `partialLive` · **Tehtävä:** T-001
**Toistaminen:** 1) Rajapinta palauttaa kortin ilman nimeä tai tyyppiä (mapCard ohittaa sen) tai sivu on tyhjä ennen `total`-määrää. 2) Näkyy OSITTAINEN-tila. 3) Paina "Yritä uudelleen".
**Odotettu:** Teksti kertoo syyn oikein eikä lupaa, mitä uusi haku ei tee.
**Havaittu:** PM:n ratkaisun (kortti, checkpoint 2026-09-30) jälkeen yksikin epäonnistunut sivu on VIRHE. OSITTAINEN tarkoittaa nyt, että kaikki sivut saatiin, mutta näytettäviä kortteja on vähemmän kuin `total` (virheelliset kortit ohitettu tai lähteessä vähemmän dataa kuin se ilmoittaa). Silloin "Osa korttitiedoista jäi hakematta" ei ole tarkka, ja "Yritä uudelleen hakeaksesi kaikki kortit" lupaa korjauksen, jota uusi haku todennäköisesti ei tuo (sama data tulee uudelleen). Lisäksi "Lista on puutteellinen" + "hakeaksesi" -rakenne on kankea.
**Vaikutus:** Käyttäjä painaa painiketta toistuvasti ja luulee vian olevan omassa yhteydessään.
**Korjausehdotus:**

| Avain | Nykyinen | Ehdotettu |
|---|---|---|
| `partialTitle` | Kaikkia kortteja ei saatu | Kaikkia kortteja ei saatu näkyviin |
| `partialBody` | Osa korttitiedoista jäi hakematta. Lista on puutteellinen. Yritä uudelleen hakeaksesi kaikki kortit. | Osa korteista puuttuu listasta, koska niiden tietoja ei saatu tai ne olivat puutteellisia. Voit yrittää hakea kortit uudelleen. |
| `partialLive(r, t)` | Näytetään {r} / {t} korttia. Osa korttitiedoista jäi hakematta. | Näytetään {r} / {t} korttia. Osa korteista puuttuu listasta. |
| `partialStatus` | {r} / {t} korttia | ei muutosta |

Perustelu: teksti on totta kummassakin OSITTAINEN-tilan syyssä, kertoo mitä tapahtui ja mitä voi tehdä, eikä lupaa varmaa korjausta. Testit (`CatalogView.test.tsx`), jotka hakevat tekstiä, päivitetään samalla. UX.md 4.5:n OSITTAINEN-tekstit on syytä päivittää vastaamaan (UX Designer).
**Tila:** Avoin

### TXT-002 · Epävirallisuusmerkintä: genetiivi "WeirdCon", lausefragmentti, peliä ei mainita · Low
**Sijainti:** `src/ui/texts.ts` `footerUnofficial` · **Tehtävä:** T-001
**Nykyinen:** "Epävirallinen fanityökalu. Ei WeirdCon, Netdeck.gg:n eikä CD PROJEKT REDin hyväksymä tai tukema."
**Havainnot:**
1. "WeirdCon" on kieliopillisesti mahdollinen WeirdCo-nimen genetiivi, mutta se näyttää toiselta nimeltä ("WeirdCon", kuin tapahtuma). Kaksoispistemuodon "WeirdCo:n" oikeellisuus riippuu ääntämisestä, joten turvallisin ratkaisu on pitää nimet perusmuodossa (CONTENT.md 3).
2. Toinen virke on subjektiton fragmentti ("Ei … hyväksymä"), mikä hidastaa lukemista.
3. Merkinnästä ei selviä, minkä pelin fanityökalusta on kyse. Pelin nimen mainitseminen kuvailevasti tekee merkinnästä yksiselitteisen.
**Ehdotettu:**
> Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.

Yhdysmerkki "Cyberpunk TCG -fanityökalu" on oikein (monisanainen nimi + yleissana, välilyönti ennen yhdysmerkkiä). Vaihtoehto ilman pelin nimeä, jos Digiturva tai PM haluaa välttää tavaramerkin mainitsemisen: "Cyberdeck on epävirallinen fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä."
`footerSource` "Korttitiedot: Netdeck.gg" on hyvä sellaisenaan.
Lähteet: SECURITY.md luku 7 (WeirdCo julkaisijana, cyberpunktcg.com:n ehdot; suositeltu merkintä). Lisäksi texts.ts:n kommentti "the Content Producer reviews it later" päivitetään muotoon, joka viittaa tähän raporttiin.
**Tila:** Avoin

### TXT-003 · Tarkistettava: CD PROJEKT RED:n fanisisältöohjeen englanninkielinen merkintä · Low
**Sijainti:** alatunniste · **Tehtävä:** T-001
**Havainto:** SECURITY.md:n luvun 7 mukaan CD PROJEKT RED:n Fan Content Guidelines vaatii tekstin "This is an unofficial fan work and is not approved/endorsed by CD PROJEKT RED". On epäselvää, koskeeko ohje WeirdCon lisensoimaa korttipeliä. Suomenkielinen merkintä välittää saman asian, mutta ei ole ohjeen sanamuoto.
**Tarkistettava:** koskeeko ohje tätä sovellusta, ja vaaditaanko englanninkielinen sanamuoto sellaisenaan (Digiturva / käyttäjä). En keksi oikeudellista tulkintaa.
**Ehdotus, jos vaaditaan:** lisätään alatunnisteeseen kolmas kappale `lang="en"`-attribuutilla: "This is an unofficial fan work and is not approved or endorsed by CD PROJEKT RED." (sanamuoto lähteestä, "approved/endorsed" kirjoitettu auki).
**Tila:** Avoin, PM:lle päätettäväksi

### TXT-004 · TYHJÄ-tila: kehotus odottaa ja painike yrittää heti · Low
**Sijainti:** `src/ui/texts.ts` `emptyBody` · **Tehtävä:** T-001
**Nykyinen:** "Kortteja ei löytynyt. Korttitietokanta on juuri nyt tyhjä. Yritä myöhemmin uudelleen." + painike "Yritä uudelleen"
**Havainto:** Teksti käskee yrittämään myöhemmin, mutta heti alla on painike "Yritä uudelleen". "Korttitietokanta" viittaa järjestelmään, jota käyttäjä ei tunne (sovelluksella ei ole omaa tietokantaa).
**Ehdotettu:** "Kortteja ei löytynyt. Korttitietojen lähde ei juuri nyt palauttanut yhtään korttia. Yritä hetken päästä uudelleen."
Perustelu: kertoo, mistä kortit tulevat, ja "hetken päästä" sopii yhteen painikkeen kanssa. `emptyStatus` ja `emptyLive` pysyvät ennallaan.
**Tila:** Avoin

### TXT-005 · K1: sarakeotsikko "Hinta" · Info (suositus)
**Sijainti:** `texts.columnCost`, `texts.noCost`
**Selvitys:** Rajapinnan sääntöteksteissä kortin `cost` maksetaan pelin sisäisellä valuutalla: "Pay this Legend's cost to play it as a ready Unit", "This effect costs -1 €$" (eddiet). Pelin "cost" on siis kirjaimellisesti hinta pelin rahassa.
**Suositus: säilytetään "Hinta" ja "ei hintaa".**
- Lyhyt ja mahtuu 320 px:n taulukkoon. "Kustannus" olisi lähes kaksi kertaa leveämpi ja kaventaisi nimisaraketta.
- Vastaa pelin logiikkaa (maksetaan eddieinä).
- Sekaannusriski oikeaan rahaan on pieni, koska hintaseuranta on rajattu pois (PROJECT.md). Jos rahallinen arvo joskus tulee, se nimetään eri termillä (esim. "markkina-arvo").
- Otsikkoon ei lisätä "€$"-merkkiä, koska se sekoittuu euroon.
Sanastomerkintä lisätty CONTENT.md:hen. Lopullinen päätös on käyttäjän (K1), mutta muutokselle ei ole kielellistä tarvetta.

### TXT-006 · K2: korttityypit englanniksi · Info (suositus)
**Selvitys:** Rajapinnassa on neljä tyyppiä: Legend (27), Unit (73), Gear (17), Program (34). Kaikki kortit ovat englanninkielisiä (`language: en`). Sääntötekstit käyttävät tyyppejä termeinä ("play it as a ready Unit", "Play a Gear with cost 2 or less").
**Suositus: säilytetään englanniksi, `lang="en"`** (toteutettu).
- Samat sanat kuin fyysisissä korteissa ja sääntöteksteissä. Käännös katkaisisi yhteyden korttiin kädessä.
- MVP-1:n pakkalistan tuonti ja haku käyttävät englanninkielisiä nimiä, joten sama kieli tyypeissä on johdonmukaista.
- Suomenkieliset selitykset (legenda, yksikkö, varuste, ohjelma) ovat CONTENT.md:n sanastossa. Niitä voi myöhemmin käyttää ohjeissa tai työkaluvihjeissä, jos tarvetta tulee (ei MVP-0:ssa).

### TXT-007 · UX.md 4.4: Legendin hinta ja käyttämättömät puuttuvan arvon tekstit · Info
**Sijainti:** `docs/UX.md` 4.4 (taulukko "Kentät ja niiden lähteet")
**Havainto:**
1. UX.md sanoo "`null`/puuttuu (esim. Legend)". Rajapinnassa 8 / 27 Legendiä sisältää hinnan (esim. V Streetkid 5, Adam Smasher Ender of Legends 9, Go Solo -mekaniikka). Toteutus näyttää ne oikein numeroina, joten tämä koskee vain määrittelyn esimerkkiä. UX:n rautalangassa "V Streetkid · Legend · –" ei vastaa nykyistä dataa.
2. UX.md määrittelee tekstit "Nimetön kortti" ja "ei tyyppiä", mutta toteutus (`mapCard`) ohittaa kortit, joilta puuttuu nimi tai tyyppi. Tekstejä ei siksi tarvita, ja ohitetut kortit näkyvät OSITTAINEN-tilana (TXT-001).
**Ehdotus:** UX Designer päivittää esimerkin ja merkitsee puuttuvan nimen ja tyypin käsittelyn toteutuksen mukaiseksi. Ei vaadi koodimuutosta.

---

## Koodarille: muutokset yhdellä silmäyksellä (`src/ui/texts.ts`)

```ts
emptyBody: 'Kortteja ei löytynyt. Korttitietojen lähde ei juuri nyt palauttanut yhtään korttia. Yritä hetken päästä uudelleen.',

partialTitle: 'Kaikkia kortteja ei saatu näkyviin',
partialBody: 'Osa korteista puuttuu listasta, koska niiden tietoja ei saatu tai ne olivat puutteellisia. Voit yrittää hakea kortit uudelleen.',
partialLive: (received: number, total: number) =>
  `Näytetään ${numberFormat.format(received)} / ${numberFormat.format(total)} korttia. Osa korteista puuttuu listasta.`,

footerUnofficial:
  'Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.',
```

Lisäksi tiedoston alun kommentti: viittaus "the Content Producer reviews it later" → "Reviewed in docs/reports/TXT-001-t001-tarkastus.md". TXT-003 odottaa PM:n päätöstä. Sisällöntuottaja varmistaa korjaukset esikatselusta (tai paketista) ja sulkee löydökset.
