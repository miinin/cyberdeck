# T-116 · Kokoelman siivous, otsikoiden fokusreunus pois, glitch kaikille sivuille, Have/Want-tekstit (i)-vihjeisiin, proxy-tarjoukset

**Tila:** Ready. **Haara:** `t-116-kokoelma-siivous` (testistä). **Päättäjä:** käyttäjä (palaute 2026-10-09: "julkaise kun valmista"), PM (ratkaisut).

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
