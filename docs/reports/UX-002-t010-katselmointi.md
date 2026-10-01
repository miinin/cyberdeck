# UX-002 · T-010 haun ja suodatuksen käytettävyys- ja saavutettavuuskatselmointi

**Katselmoija:** UX Designer · **Päivä:** 2026-10-01 · **Tehtävä:** T-010 · **PR:** https://github.com/miinin/cyberdeck/pull/3
**Kohde:** esikatselu https://cyberdeck-tcg-test--pr3-t-010-haku-6ycx0rzm.web.app sekä lähdekoodi haarassa `t-010-haku` (`src/ui/CatalogView.tsx`, `CardFilters.tsx`, `CardColor.tsx`, `CardList.tsx`, `useDelayedAnnouncement.ts`, `texts.ts`, `src/styles.css`)
**Vertailukohta:** `docs/UX.md` luku 5 (tarkistuslista 5.10) ja luvut 3.1.1 ja 3.4

## Yhteenveto

Toteutus vastaa luvun 5 määrittelyä. Haku, suodattimet, tilarivi, EI TULOKSIA -tila, tyhjennyspainike, Esc ja Enter toimivat määritellysti, ja live-alueen hillintä toimii esikatselussa (ei ilmoitusta kirjoittamisen aikana, yksi ilmoitus tauon jälkeen, ei toistoa samasta tuloksesta). axe-core ei löytänyt yhtään rikkomusta 13 tarkistetusta tilasta, joihin kuuluu nyt myös OSITTAINEN + SUODATETTU. Ei vaakavieritystä 320 px:ssä, 200 %:n ja 400 %:n zoomia vastaavilla leveyksillä eikä WCAG 1.4.12 -välistyksellä.

Löydöksiä on kolme. Yksi on Medium (K9: uudelleenyrityksen jälkeinen live-ilmoitus kertoo suodattamattoman määrän) ja kaksi Low (määrittelyn täsmennyksiä, jotka korjasin UX.md:hen, eivätkä ne vaadi koodimuutosta). Blokkaavia löydöksiä ei ole.

**Veto: ei.** UX hyväksyy T-010:n Done-tilaan omalta osaltaan. UX-002 (Medium) suositellaan korjattavaksi tässä tehtävässä, koska korjaus on pieni. Jos PM siirtää sen omaksi tehtäväkseen, se ei estä Done-tilaa.

## Menetelmä

Chrome (headless, playwright-core scratchpadissa, ei projektin riippuvuus) esikatselu-URL:ssa. axe-core 4.13 injektoitiin CSP:n ohituksella (`bypassCSP`), koska sivun CSP estää (oikein) inline-skriptit. Tagit `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`. Lighthousea ei ajettu, koska axe kattaa samat säännöt.

OSITTAINEN-tila pakotettiin sieppaamalla rajapintavastaus: ensimmäisen sivun kahdelta kortilta poistettiin `id` tai `name` (149 / 151). Uudelleenyritys ajettiin sekä niin, että tila jää osittaiseksi, että niin, että data on taas ehjä.

| Tarkistus | Tulos |
|---|---|
| axe: EI SUODATUSTA, SUODATETTU (`silver` + Punainen), EI TULOKSIA (`zzzz`) × vaalea/tumma × 320/1024 px | 0 rikkomusta, 0 keskeneräistä (12 ajoa) |
| axe: OSITTAINEN + SUODATETTU 320 px | 0 rikkomusta |
| Vaakavieritys 320, 640 ja 320 px × 256 px korkeus (400 % zoom 1280 × 1024 -ikkunassa), pisin nimi `Viktor Vektor` | 0 px |
| WCAG 1.4.12 -välistys 320 px | 0 px vaakavieritystä |
| Valintaruutujen kosketusalueet | 57–112 × 44 px (vaatimus 44 × 44 px täyttyy) |
| Fokusrengas valintaruudussa | 3 px yhtenäinen, `--color-focus` |
| Sarkainjärjestys OSITTAINEN-tilassa | Yritä uudelleen → Hae nimellä → Legend → Unit → Gear → Program → Punainen → Keltainen → Vihreä → Sininen (5.7 mukainen) |
| Live-alue kirjoitettaessa `silv` (alle 750 ms) | pysyy `151 korttia ladattu.` |
| Live-alue tauon jälkeen | `Näytetään 2 / 151 korttia.` |
| Lisää merkkejä samalla tuloksella (`silverhand`) | ei uutta ilmoitusta |
| Esc | kenttä tyhjenee, fokus pysyy, 750 ms:n jälkeen `Näytetään kaikki 151 korttia.` |
| Enter (`qqq`) | heti `Valintoja vastaavia kortteja ei löytynyt.`, ei sivun latausta, URL ennallaan |
| Tyhjennä haku ja suodattimet | fokus hakukenttään, heti `Näytetään kaikki 151 korttia.`, caption `Kaikki kortit` |
| Uudelleenyritys suodatettuna | hakusana ja valinnat säilyvät (3.3.7), fokus `h1`:ssä |

Koodista tarkistettu: `form role="search"` + `aria-label`, label `for`, ohje `aria-describedby`, ei `autofocus`, `maxLength=100`, fieldset/legend ja ryhmäohje, natiivit valintaruudut labelin sisällä, tyypit `lang="en"`, värinäyte `aria-hidden`, taulukon solu "tyyppi, väri" piilotetulla pilkulla, caption vaihtuu, ei uusia animaatioita, värit tokeneista, `color-scheme: light dark` (natiivit kontrollit tummassa teemassa oikein), IME-koostamisen aikana ei ilmoitusta.

**Rajoite:** oikealla ruudunlukijalla ei testattu (ei saatavilla ympäristössä). Ruudunlukijan näkökulma arvioitu rakenteesta ja live-alueen sisällön aikajanasta. 400 %:n zoom emuloitu leveydellä 320 CSS-px, ei selaimen zoomilla.

## Löydökset

### UX-002 · Uudelleenyrityksen jälkeinen live-ilmoitus kertoo suodattamattoman määrän, vaikka lista on suodatettu (K9) · Medium
**Sijainti:** `src/ui/CatalogView.tsx` (`toViewModel` live-teksti ja `useDelayedAnnouncement`-kutsun `baseline`) · **Tehtävä:** T-010
**Toistaminen:** 1) Pakota OSITTAINEN-tila (149 / 151). 2) Kirjoita hakukenttään `johnny` (tilarivi `2 / 149 korttia`). 3) Paina `Yritä uudelleen`.
**Havaittu:** a) Jos tila jää osittaiseksi, live-alue sanoo `Näytetään 149 / 151 korttia. Osa korteista puuttuu listasta.`, vaikka tilarivi ja taulukko näyttävät 2 korttia. b) Jos lataus onnistuu, live-alue sanoo `151 korttia ladattu.`, vaikka tilarivi on `2 / 151 korttia`.
**Odotettu:** Ruudunlukija kuulee saman asian kuin näkevä käyttäjä näkee tilarivillä.
**Vaikutus:** Ruudunlukijan käyttäjä luulee, että kaikki kortit ovat näkyvissä, ja voi selata taulukkoa etsien korttia, joka on suodatettu pois. Seuraava suodatusmuutos korjaa tilanteen, ja tilarivi on oikein, joten kiertotie on olemassa. Polku on harvinainen (OSITTAINEN + suodatus + uudelleenyritys).
**Korjausehdotus (päätös K9, kirjattu UX.md 5.6):** Kun haku tai valinta on käytössä latauksen päättyessä, live-alueen latausviesti yhdistää latauksen ja suodatuksen tuloksen:

| Tila latauksen jälkeen | n ≥ 1 | n = 0 |
|---|---|---|
| ONNISTUMINEN | `{kaikki} korttia ladattu. Näytetään {n} / {kaikki} korttia.` | `{kaikki} korttia ladattu. Valintoja vastaavia kortteja ei löytynyt.` |
| OSITTAINEN | `Näytetään {n} / {kaikki} korttia. Osa korteista puuttuu listasta.` | `Valintoja vastaavia kortteja ei löytynyt. Osa korteista puuttuu listasta.` |

`{kaikki}` = saatujen korttien määrä kuten tilarivillä. Ilman suodatusta viestit ennallaan (4.5). `useDelayedAnnouncement`-hookin `baseline`-avaimeksi annetaan suodatuksen tuloksen avain (`describeResult(...).key`), jotta sama tulos ei toistu heti seuraavalla muutoksella. Lisää näkymätesti molemmille tapauksille.
**Tila:** Avoin → Korjattu (commit a6890e9)

### UX-003 · OSITTAINEN-tila ilman yhtään saatua korttia: lomake piilossa · Low
**Sijainti:** `src/ui/CatalogView.tsx` (`showFilters = allCards.length > 0`) · **Tehtävä:** T-010
**Toistaminen:** Rajapinta palauttaa `total` > 0, mutta ei yhtään kelvollista korttia (esim. tyhjä ensimmäinen sivu).
**Odotettu (UX.md 5.8 ennen korjausta):** OSITTAINEN = lomake näytetään. **Havaittu:** lomaketta ei näytetä.
**Vaikutus:** Ei haittaa: suodatettavaa ei ole, ja tyhjä lomake olisi harhaanjohtava. Varoituslaatikko ja `Yritä uudelleen` näkyvät. Hakutila säilyy taustalla, joten se palaa, kun kortteja saadaan.
**Korjausehdotus:** Koodarin tulkinta hyväksytty. UX.md 5.8 täsmennetty: lomake näytetään vain, kun ladattuja kortteja on vähintään yksi. Ei koodimuutosta.
**Tila:** Korjattu määrittelyyn (UX.md 0.4) → Varmistettu (UX 2026-10-01)

### UX-004 · Tyhjennyspainike ilmoittaa aina, myös saman tuloksen uudelleen · Low
**Sijainti:** `src/ui/CatalogView.tsx` (`handleClearFilters`, `announceNow(..., true)`) · **Tehtävä:** T-010
**Havaittu:** `Tyhjennä haku ja suodattimet` ohittaa toistokiellon. Määrittely (5.6) ei sanonut, kumpi sääntö voittaa.
**Vaikutus:** Myönteinen: käyttäjän nimenomainen toiminto saa aina vahvistuksen, ja painike katoaa painettaessa, joten ilman ilmoitusta ruudunlukijan käyttäjä ei tietäisi, mitä tapahtui. Käytännössä toisto on harvinainen, koska painike näkyy vain EI TULOKSIA -tilassa.
**Korjausehdotus:** Koodarin tulkinta hyväksytty. UX.md 5.6 täsmennetty: toistokielto koskee viiveellisiä ilmoituksia, ei tyhjennyspainiketta. Ei koodimuutosta. Huom. aria-live ei toista täsmälleen samaa tekstiä, jos se ei muutu DOM:ssa. Tämä on hyväksyttävää, koska fokussiirto hakukenttään kertoo myös, että toiminto tehtiin.
**Tila:** Korjattu määrittelyyn (UX.md 0.4) → Varmistettu (UX 2026-10-01)

## Tarkistuslista

**Nielsen:** tila näkyy (tilarivi heti, live-alue hillitysti) ✓ · käyttäjän kieli ✓ · hallinta (Esc, ruksi, tyhjennyspainike, valinnan poisto) ✓ · johdonmukaisuus (painikkeet ja tyhjä tila kuten 4.5) ✓ · virheiden ehkäisy (ei lähetystä, ei sivun latausta Enterillä) ✓ · tunnistaminen (vaihtoehdot näkyvissä, väri tekstinä) ✓ · minimalismi ✓ · tyhjän tilan ohje ja korjauskeino ✓ · ohje kentän ja ryhmien alla ✓

**WCAG 2.2 AA:** axe 0 ✓ · kontrastit (axe, molemmat teemat) ✓ · näppäimistö ja fokus, ei sticky-elementtejä ✓ · maamerkit (search) ja otsikot ✓ · labelit ja ohjeet ✓ · 3.3.7 hakutila säilyy ✓ (live-viesti UX-002) · kosketusalueet 44 px ✓ · 320 px ja zoom ✓ · 1.4.1 väri myös tekstinä ✓ · ei animaatioita ✓ · 4.1.3 tilaviestit ✓ (paitsi UX-002)

**Visuaalinen:** tokenit ✓ · hierarkia (h1, tilarivi, lomake, taulukko) ✓ · välistys luvun 5.9 mukaan ✓

## Huomio PM:lle

- UX.md päivitetty versioon 0.4 (luvut 5.6, 5.8 ja 5.12). Ei muita tiedostoja muokattu.
