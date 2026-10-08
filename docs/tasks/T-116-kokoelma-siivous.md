# T-116 · Kokoelman siivous, otsikoiden fokusreunus pois, glitch kaikille sivuille, Have/Want-tekstit (i)-vihjeisiin, proxy-tarjoukset

**Tila:** Done. **Haara:** `t-116-kokoelma-siivous` (testistä). **Päättäjä:** käyttäjä (palaute 2026-10-09: "julkaise kun valmista"), PM (ratkaisut).

Tee kaikki yhteen PR:ään. Korjaa matkalla havaitsemasi ilmeiset ulkoasuviat (päällekkäisyydet, vaakavieritys, tasausviat) kysymättä ja listaa ne luovutukseen.

## 1. Kokoelma-sivu (CollectionView, CollectionBinder, CardScanner)
- **Turhat isot laatikot pois.** Sivun alussa ei saa olla 2–3 isoa laatikkoa ennen sisältöä.
  - **Näkymävalitsin** "Näkymä: Yleiskuva | Kansio" on nyt iso fieldset. Siitä tulee pieni, tuttu segmenttikytkin (sama tyyli kuin T-115:n Kuvat/Lista ja pakkaeditorin välilehdet), ja se on otsikkorivillä tai heti sen alla. Näkyvä legend "Näkymä" poistetaan (visually-hidden).
- **Skannaa kortteja tyylikkäämmin.** Otsikon vieressä on nyt iso keltainen primääripainike. Siitä tulee kompakti painike (kameraikoni ja "Skannaa"), joka on tasattu otsikkorivin oikeaan reunaan samalle korkeudelle kuin T-115:n Skannaa-painike. Tyhjän kokoelman iso kehotus (ScanPrompt) saa jäädä, koska se on tyhjän tilan pääkehotus. Mobiilin kelluva kamerapainike pysyy.
- **Keräilykansio:**
  - "Setti"-valinta poistetaan. Kansio näyttää **yhden yhtenäisen setin**: kaikki kortit numerojärjestyksessä. Kortit, joista omistat vain Beta-painoksen, merkitään hillityllä **"Beta"-merkillä** (pieni himmeä teksti tai merkki kortin kulmassa, ei kirkas). Jos omistat molempia, merkkiä ei tarvita. Ratkaise tarkka logiikka järkevästi ja kirjaa se luovutukseen.
  - "Kuvitus: Perus | Omistamasi kuvitus" -valinta poistetaan. Kuvitus on aina se, jonka omistat (jos useita, ensimmäinen omistettu), ja muuten peruskuvitus.
  - "Näytä puuttuvat" jää kytkimeksi samaan yhtenäiseen kytkintyyliin (edit-switch).
  - Poistetut asetukset siivotaan myös `CollectionPrefs`ista siten, että vanhat tallennetut arvot eivät riko mitään (parse ohittaa tuntemattomat kentät).

## 2. Ohjelmallisesti fokusoidun otsikon paksu sininen reunus pois
- Sivua avattaessa fokus siirretään otsikkoon (`tabIndex={-1}`), ja otsikkoon tulee paksu sininen reunus. Se poistetaan kaikilta sivuilta: `[tabindex="-1"]:focus { outline: none; }` tai vastaava yhteinen sääntö. Fokuksen siirto säilyy ruudunlukijoita varten.
- Tarkista, ettei muuallekaan jää tällaista reunusta ei-interaktiivisiin elementteihin. Painikkeiden ja linkkien näppäimistöfokus (`:focus-visible`) **säilyy**.

## 3. Otsikon glitch-värähdys kaikille sivuille
- Pakat-sivun h1 värähtää avattaessa (`@keyframes glitch`, selektori `main > h1`). Muilla sivuilla h1 on `.page-head`-kääreessä, joten valitsin ei osu niihin.
- Laajenna sääntö koskemaan jokaisen sivun pääotsikkoa (esimerkiksi `main h1:first-of-type` tai yhteinen luokka). Säilytä `prefers-reduced-motion`-ehto.

## 4. Have/Want-sivu: vähemmän tekstiä
- Intro- ja ohjetekstit (`haveWantIntro`, `wantIntro`, `haveIntro` ja vastaavat) eivät näy pysyvinä kappaleina. Tilalle tulee otsikon viereen pieni **(i)**-painike, joka avaa ohjeen popoverina (napautus, Esc sulkee, `aria-expanded`, toimii myös hoverilla tai fokuksella työpöydällä). Tee siitä uudelleenkäytettävä `InfoTip`-komponentti.
- Näkyviin jää vain se, mikä on välttämätöntä toiminnalle. Tyhjän listan tila saa yhden lyhyen lauseen.

## 5. Proxyt tarjolle mietittyihin paikkoihin (Proxy pysyy omana osionaan)
- **D-028:n muutos:** Proxy pysyy päänavigoinnissa (käyttäjän päätös 2026-10-09). Kirjaa tämä D-028:n alle.
- **Nykyiset paikat:** `SendToProxyButton` on jo pakkaeditorissa, Kokoelman puuttuvissa ja Have/Wantissa. Tarkista, että niissä toiminto on selkeä ja oikeassa kohdassa: pakkaeditorissa "Tulosta puuttuvat proxyiksi" näkyy pakan otsikossa, kun pakasta puuttuu omistamattomia kortteja, ei vain listan lopussa.
- **Lisää:**
  - **a)** Kortin tietonäkymä (Kortit-sivu): "Lisää proxy-jonoon" kortin toimintoihin.
  - **b)** Jaettu tai julkinen pakka (SharedDeckView ja PublicDeckView): "Tulosta puuttuvat proxyiksi", jos käyttäjällä on kokoelma.
- **Palaute:** lisäyksestä tulee lyhyt ilmoitus, jossa on linkki Proxy-sivulle ("3 korttia proxy-jonossa · Avaa").
- **Merkki navigoinnissa:** päänavigoinnin Proxy-kohtaan tulee pieni lukumäärämerkki, kun jonossa on kortteja. Merkki ei saa rikkoa mobiilin yhden rivin navigointia 320 px:llä.

## Hyväksymiskriteerit
- Kokoelma-sivulla sisältö alkaa heti otsikkorivin jälkeen ilman isoja asetuslaatikoita.
- Kansiossa on yksi setti, Beta-merkki ja aina omistettu kuvitus.
- Missään ei näy sinistä otsikkoreunusta. Glitch toimii kaikilla sivuilla.
- Have/Want-sivun ohjeet ovat (i)-vihjeissä.
- Proxy-tarjoukset toimivat uusissa paikoissa, ja navigointimerkki näkyy.
- Testit päivitetään, eikä niitä heikennetä. Leveyksillä 320, 390 ja 1440 px ei ole vaakavieritystä (tarkista Chromella).
- `npm test` (ajetaan kerran), `npm run lint` ja `npm run build` menevät läpi.

## Luovutus

**Koodari, valmis katselmointiin.** Kaikki viisi kohtaa toteutettu.

1. **Kokoelma:** näkymävalitsin on T-115:n `view-select`-segmentti otsikkorivin oikealla puolella (legend piilotettu), Skannaa on kompakti `secondary`-painike samalla rivillä (puhelimessa piilossa, koska kelluva kamerapainike hoitaa; ScanPrompt säilyy). Kansio: Setti- ja Kuvitus-valinnat pois. `binderPockets(cards, collection, hasArt)` kokoaa Retail+Beta (FR lasketaan Retailiin kuten ennen) yhteen settiin. Numero = englanninkielisen, ensisijaisesti Retail-painoksen numero, muuten Beta-numero (`005β`). Kappaleet = molempien settien tallennetut versiot yhteensä (muiden tuotteiden versiot ohitetaan; jos versioita ei ole tallennettu, kokonaismäärä). **Beta-merkki** (kortin vasen alakulma, himmeä): omistat Beta-versioita eikä yhtään Retail-versiota. Kuvitus = ensimmäinen omistettu erikoiskuvitus (englanti ensin, Retail ennen Betaa), muuten peruskuva. "Näytä puuttuvat" on `edit-switch` (`SwitchButton` exportattu ListToolbarista). `CollectionPrefs`: `art` poistettu, vanhat tallennetut arvot ohitetaan (testi). Kansion h2 on visually-hidden, omistusmäärä ja kytkin samalla rivillä.
2. **Fokusreunus:** yhteinen sääntö `[tabindex='-1']:focus, :focus-visible { outline: none }`. Muut `tabIndex={-1}`-elementit ovat otsikoita ja yksi tulosteksti. `:focus-visible` säilyy painikkeilla ja linkeillä. Tarkistettu Chromella (outline none h1:llä).
3. **Glitch:** `main > h1` -> `main h1` (`prefers-reduced-motion`-ehto ennallaan). Headless-Chrome raportoi reduced-motionin, joten itse animaatiota ei nähty, vain että sääntö osuu.
4. **Have/Want:** uusi `InfoTip` (`src/ui/InfoTip.tsx`): (i)-painike, `aria-expanded`/`aria-controls`, napautus avaa, Esc ja ulkopuolinen napautus sulkee, hiiri-hover näyttää. Kolme vihjettä: sivun otsikko, Want, Have. Tyhjät tilat lyhyiksi ("Lista on tyhjä. Hae kortti alta.", "Ei vaihdettavia kortteja."), `wantSearchPrompt` poistettu, vaihdettavuuden selitys siirretty `haveIntro`-vihjeeseen. Popover on sijoitettu `.has-info-tip`-ylätason mukaan eikä aiheuta vaakavieritystä 320 px:llä.
5. **Proxy:** D-028:n muutos oli jo kirjattu. Pakkaeditorissa "Tulosta puuttuvat proxyiksi" on nyt otsikkorivin alla (ei listan lopussa); "Lähetä pakka" jäi paikalleen. Uudet paikat: kortin tietonäkymä ("Lisää proxy-jonoon"), jaettu/julkinen pakka ja tuonnin tarkistus (`DeckImport`, sama komponentti; näkyy kun kokoelma on luettu ja pakasta puuttuu kortteja). Palaute oli jo "Jonoon lisättiin N korttia. Avaa Proxy-osio" (linkki), jätetty sellaisenaan. Navigaatiomerkki: `useProxyCount` (App) lukee jonon, päivittyy tallennuksen jälkeen (`useProxyQueue` lähettää window-tapahtuman, kun tallennus on valmis), reitin vaihtuessa ja toisesta välilehdestä; yli 99 näytetään "99+". Ruudunlukijalle piilotettu teksti "jonossa N korttia". Tarkistettu 320 px: yksi rivi. `useProxyQueue` on nyt funktio (ei enää suora `useCollection`-alias).

**Muut korjaukset:** Beta-merkin ja ×N-merkin törmäys pienillä taskuilla ratkaistu pienentämällä merkki ja siirtämällä se vasempaan alakulmaan.
**Testit:** binder-domain-testit uusittu (yksi setti, Beta-logiikka, muiden tuotteiden ohitus), CollectionBinder-testeihin kytkin- ja Beta-merkkitestit, HaveWant-testeihin InfoTip-testi, ProxyView-testeihin merkki ja kolme uutta tarjouspaikkaa, repositories-testiin vanha `art`-kenttä. `npm test`: 1539 läpi. Lint ja build läpi. Chrome 320/390/1440: ei vaakavieritystä (Kokoelma yleiskuva ja kansio, Have/Want, Kortit-tiedot).
**Koodikatselmointi:** tehty · Pakollisia korjattu 0 · Suosituksia 1 (velka: kansion numerojärjestyksessä Beta-vain-kortit (`001β`) sekoittuvat Retail-numeroiden joukkoon samalla numerolla).
**Ei uutta riippuvuutta.**
