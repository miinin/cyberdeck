# LESSONS

Opitut virheet ja miten ne vältetään. Vain lisäyksiä (rules.md 6, liite A5).

## L-001 · 2026-10-01 · Agentti pysäytti käyttäjän toisen projektin prosessin
**Mitä tapahtui:** Dokumentoija testasi `npm run dev`:iä, huomasi portin 5173 varatuksi ja siivosi lopuksi komennolla `npx kill-port 5173`. Portissa pyöri käyttäjän toisen projektin (Eduks Saavutettavuusopas) kehityspalvelin, joka todennäköisesti pysähtyi.
**Miksi:** Prosessi pysäytettiin portin perusteella eikä oman käynnistetyn prosessin tunnisteen perusteella.
**Jatkossa:** Älä koskaan pysäytä prosessia portin tai nimen perusteella. Pysäytä vain itse käynnistämäsi prosessi (PID). Käytä testeissä vapaata porttia (`--port 0` tai `--strictPort` tarkistuksella) äläkä koske toisten projektien prosesseihin.

## L-002 · 2026-10-01 · Unicode-escapet muuttuivat näkymättömiksi merkeiksi lähdekoodissa
**Mitä tapahtui:** Koodari (T-011) kirjoitti tiedostoon merkkijonoja ja regexin, joissa oli `\u`-escapeja (suunnanohjausmerkit U+202A–U+202E ja U+2066–U+2069 sekä yhdistyvä merkki U+0308). Työkaluketju muutti osan escapeista oikeiksi merkeiksi, joten lähdekoodiin päätyi näkymättömiä suunnanohjausmerkkejä (Trojan Source -riski). Testit menivät silti läpi, joten virhe ei näkynyt.
**Miksi:** Kirjoitustyökalun syöte tulkitsi `\uXXXX`-jaksot. Näkymättömiä merkkejä ei huomaa diffistä.
**Jatkossa:** Kun kirjoitat ohjaus-, suunnanohjaus- tai yhdistyviä merkkejä koodiin, tarkista tiedosto skriptillä, joka etsii merkit U+0080–U+009F, U+200B–U+200F, U+202A–U+202E, U+2066–U+2069 ja U+0300–U+036F, ja korjaa ne escapeiksi. Escapen voi tuottaa skriptissä esim. `String.fromCharCode(92) + 'u…'`.

## L-003 · 2026-10-01 · user-event jumittuu Vitestin valeajastimien kanssa
**Mitä tapahtui:** T-010:n live-alueen testit (`vi.useFakeTimers()` + `userEvent.setup({ advanceTimers })`) aikakatkaistiin 5 s:n jälkeen.
**Miksi:** Testing Libraryn async-kääre odottaa jokaisen toiminnon jälkeen oikeaa `setTimeout(0)`:aa ja siirtää aikaa vain Jestin valeajastimilla (`jest`-globaali). Vitestissä ajastin ei koskaan laukea.
**Jatkossa:** Ajastinriippuvaisissa näkymätesteissä käytä `fireEvent`iä ja `act(() => vi.advanceTimersByTime(ms))`. Käytä user-eventiä testeissä, joissa ajastimet ovat oikeita.

## L-004 · 2026-10-02 · L-001 toistui: agentti sulki kaikki selainprosessit nimen perusteella
**Mitä tapahtui:** UX Designer (T-021-katselmointi) siivosi omat headless-ajonsa komennolla `taskkill /F /IM msedge.exe`. Komento sulkee kaikki Edge-prosessit, myös käyttäjän avoimet selainikkunat.
**Miksi:** L-001 oli kirjattu, mutta aliagentti lukee LESSONS.md:stä vain tehtäväänsä koskevat kohdat, eikä PM:n tehtävänanto toistanut kieltoa selaintestauksen yhteydessä.
**Jatkossa:** Prosessia ei koskaan pysäytetä nimen, kuvan (`/IM`) tai portin perusteella, vain oman käynnistetyn prosessin PID:llä tai puppeteerin `browser.close()`-kutsulla. Headless-selain käynnistetään aina omalla väliaikaisella profiilillaan (`--user-data-dir` scratchpad-kansioon). PM toistaa tämän kiellon jokaisessa tehtävänannossa, jossa agentti ajaa selainta tai palvelinta.

## L-005 · 2026-10-02 · Koodari commitoi käyttäjän kuvat väärään tehtävähaaraan
**Mitä tapahtui:** Käyttäjä kopioi 151 korttikuvaa (14 Mt) pääkansion `public/cards/`-hakemistoon, kun T-025:n Koodari työskenteli samassa kansiossa. Koodari commitoi ne teemavalitsimen haaraan (c31f42c), luultavasti komennolla `git add -A`. PM poisti kuvat seurannasta uudella commitilla, mutta ne jäivät haaran historiaan.
**Miksi:** Commitoitiin kaikki muuttuneet tiedostot tarkistamatta, kuuluvatko ne tehtävään.
**Jatkossa:** Lisää commitiin vain tehtävän tiedostot nimeltä. Tarkista `git status` ennen jokaista committia. Jos työpuussa on tiedostoja, joita et itse luonut, älä commitoi niitä, vaan kerro niistä PM:lle.

## L-006 · 2026-10-02 · Test-haaraan päätyi kaatuva testi
**Mitä tapahtui:** T-013:n navigaatiolinkit muuttivat Tab-järjestystä, ja `App.theme.test.tsx` kaatui test-haarassa. Koodari ajoi vain osan testeistä (kevyt malli, aikaraja), eikä CI ajanut testejä.
**Miksi:** Kokonaista sarjaa ei ajettu ennen yhdistämistä, ja koko sarja kaatui muutenkin satunnaisesti (T-024), joten osittaisiin ajoihin oli totuttu.
**Jatkossa:** T-004 ajaa lintin ja testit jokaisessa PR:ssä ja ennen julkaisua. PM yhdistää testiin vasta, kun PR:n tarkistukset ovat vihreät.

## 2026-10-03 · Satunnaiset "Invalid Chai property: toBeInTheDocument" -kaatumiset
- Yötyössä `npm test` kaatui kahdesti 179 testillä (jest-dom-matcherit eivät latautuneet), ja heti perään kolme ajoa meni läpi 730/730 ilman koodimuutoksia. Taustalla oli noin 19 agenttien jättämää node-prosessia (`vite preview`).
- Opetus: jos jest-dom-matcherit katoavat yhtäkkiä, aja uudelleen ja sulje vanhat preview-prosessit ennen kuin epäilet koodia tai riippuvuuksia. Agentin pitää sulkea itse käynnistämänsä `vite preview`.

## 2026-10-03 · `firebase deploy --only firestore:rules` loi tietokannan väärään sijaintiin
- PM yritti ottaa Firestoren API:n käyttöön viemällä kaiken kieltävät säännöt. Deploy loi samalla `(default)`-tietokannan oletussijaintiin `nam5` (USA) molemmissa projekteissa, vaikka päätös oli `europe-north1` (D-017). Sijaintia ei voi muuttaa, ja poisto vaatii käyttäjän.
- Opetus: luo tietokanta aina ensin eksplisiittisellä sijainnilla (konsoli tai `firestore:databases:create --location`, kun API on päällä) ennen mitään firestore-deployta. API:n saa päälle ilman deployta konsolin API-sivulta.

## L-007 · 2026-10-10 · Esikatselu tehtiin liian kapeasti (T-123)
PM tarkisti vain 320 px:n ja tyhjän kokoelman, joten puhelimen (390 px) työkalurivin hajoaminen ja raskas merkintäpalkki menivät tuotantoon. Jatkossa UI-muutos tarkistetaan 390 px:llä oikean kaltaisella datalla (täysi kokoelma), kaikissa näkymätiloissa, joihin muutos vaikuttaa (Kuvat ja Lista, tila päällä ja pois), ja kuvaa arvioidaan käyttäjän silmin, ei vain päällekkäisyyksien osalta.

- **Korttidatan tarkistus (T-146, 2026-10-12):** choom.gg lataa korttinsa Supabasesta, ja datan saa headless-selaimen verkkovastauksista (cards, card_sets). Vertailu: settijäsenyys kortin perheittäin, WNC-painatukset print_number-kentällä, ominaisuudet ja peruskuvat dHash-tunnisteella (sharp). Choom.gg ei listaa myymälän pre-release-kittiä eikä demopakkoja, joten niiden puuttuminen siellä ei ole virhe meillä.

- **Korttidatan tarkistus skriptinä (T-149):** `node scripts/cards-check-grab.mjs "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" <kansio>` hakee choom.gg:n datan, ja `npm run cards:check -- <kansio>` tulostaa erot (setit, WNC-numerot, ominaisuudet, kuvat). Aja jokaisen `cards:update`-ajon jälkeen. Choom.gg kirjoittaa puuttuvan alanimen tyhjänä merkkijonona.

- **GitHub Actions ei käynnisty (2026-10-12):** Julkaisut T-151–T-154 jäivät tuotannosta pois, koska GitHub ei käynnistänyt ajoja ("recent account payments have failed or your spending limit needs to be increased"). Ajo kaatuu parissa sekunnissa ilman lokia. Tarkista `gh run view <id>` ANNOTATIONS. Hätäjulkaisu paikallisesti samoilla vaiheilla: `npm run lint`, `npm test`, `npm run build`, `node scripts/check-dist-env.mjs production`, `firebase deploy --only hosting:prod --project default` (testi: `build:test`, `check-dist-env test`, `hosting:test --project test`). PM tarkistaa jatkossa julkaisuajon tuloksen eikä vain PR:n yhdistämistä. **Ratkaistu 2026-10-13:** repo muutettiin julkiseksi, jolloin GitHub-hostatut ajot ovat ilmaisia eikä maksuesto koske niitä.
- **Raskaat UI-testit ja 5 s raja (2026-10-13):** Koko sarjan rinnakkaisajossa tällä koneella yksittäiset käyttöliittymätestit (DeckEditor.tabs, CatalogView.sellable) ylittävät välillä Vitestin 5 s oletusrajan, vaikka yksin ne vievät noin 1 s. Uusinta-ajo menee läpi. Jos tämä yleistyy, harkitse yhteistä `testTimeout`-arvoa vitest-asetuksiin tiedostokohtaisten 20 s rajojen sijaan.
