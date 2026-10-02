# T-021 · Ulkoasu: Cyberpunk 2077 -henkinen visuaalinen ilme
**Tila:** Odottaa käyttäjän hyväksyntää mallisivulle (UX-suunnittelu valmis) · **Omistaja:** UX Designer → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-010)
**Suunnittelu:** UX ☐ (tutkimus, visuaalinen suunta, tokenit, komponentit, mallisivu)
**Katselmoinnit (D-010):** Koodikatselmointi ☐ · UX ☐ · Digiturva vain, jos `firebase.json` tai riippuvuudet muuttuvat
**Riippuvuudet:** T-010, T-012 (Done)
**Haara:** `t-021-ulkoasu`

## Tavoite
Palvelu on helppokäyttöinen ja näyttää ja tuntuu Cyberpunk 2077 -henkiseltä alusta loppuun (D-010). Käytettävyys on ensisijainen, tyyli toissijainen.

## Hyväksymiskriteerit
- [ ] UX on selvittänyt Cyberpunk 2077:n visuaalisen kielen (värit, typografia, muodot, käyttöliittymäelementit, liike) ja kirjannut tiivistelmän lähteineen UX.md:hen sekä sen, mitä siitä otetaan ja mitä jätetään pois käytettävyyden tai saavutettavuuden vuoksi.
- [ ] UX.md:n tokenit (värit, typografia, välit, reunat, varjot ja hehkut, liike) ja komponentit (painikkeet, kentät, valintaruudut, taulukko ja korttirivi, ilmoituslaatikot, otsake ja alatunniste) on päivitetty uuteen ilmeeseen. Käyttäjä on hyväksynyt suunnan mallisivusta ennen toteutusta.
- [ ] Koko nykyinen sovellus (otsake, haku ja suodattimet, korttilista, kokoelman kontrollit, kaikki tilat ja ilmoitukset, alatunniste) käyttää uutta ilmettä. Kovakoodattuja värejä tai välejä ei ole tokenien ulkopuolella.
- [ ] Käytettävyys ei heikkene: kaikki nykyiset toiminnot ja tekstit säilyvät, toiminnot löytyvät yhtä helposti tai helpommin, ja nykyiset testit menevät läpi.
- [ ] WCAG 2.2 AA: kontrastit (teksti 4.5:1, UI ja fokus 3:1, myös hover- ja fokustilat), fokus näkyy, 320 px ja 400 % zoom ilman vaakavieritystä, axe 0 rikkomusta. Animaatiot ja glitch-efektit kunnioittavat `prefers-reduced-motion`-asetusta, eikä mikään vilku yli 3 kertaa sekunnissa.

## Rajaukset (ei kuulu tähän)
- Uudet toiminnot tai näkymät (pakat ovat T-013)
- Pelin logot, kuvat, ääni, tavaramerkit tai pelin omat fontit (tekijänoikeus, D-010)
- Fontit tai muut resurssit kolmannen osapuolen palvelimilta (CSP sallii vain `'self'`). Fontit itse isännöitynä vain avoimella lisenssillä (esim. SIL OFL), ja lisenssi kirjataan CONTENT.md:n sisältöjen oikeuksiin.
- Uudet npm-riippuvuudet (jos välttämättömiä, PM päättää ja Digiturva tarkistaa)
- T-018:n mobiilin kompakti suodatinlomake. UX voi kuitenkin huomioida UX-006:n, jos se ratkeaa ilmeen yhteydessä ilman uutta toimintoa.

## Työloki
### Checkpoint 2026-10-02 · PM
- Kortti määritelty käyttäjän pyynnöstä (D-010), tila Ready, haara `t-021-ulkoasu` test-haarasta.
- Kulku: 1) UX tutkii ja suunnittelee ja tekee staattisen mallisivun `docs/design/t021-mallisivu.html`, 2) PM näyttää mallisivun käyttäjälle hyväksyttäväksi, 3) Koodari toteuttaa, 4) UX katselmoi.

### Checkpoint 2026-10-02 · UX Designer
- Tehty: tutkimus (lähteet UX.md 7.2), UX.md päivitetty versioon 0.6 (periaate 7, luku 3 tokenit ja komponentit, uusi luku 7), mallisivu `docs/design/t021-mallisivu.html` (itsenäinen, fontit upotettu vain mallia varten; tarkistettu Edge headlessilla 320 px (iframe) ja 1200 px). Lähdekoodia ei muutettu.
- Seuraava askel: PM näyttää mallisivun käyttäjälle hyväksyttäväksi. Hyväksynnän jälkeen Koodari toteuttaa UX.md 7.9:n mukaan, sitten UX katselmoi.
- Avoimet kysymykset: V1–V8 (UX.md 7.10), oletukset valittu.
- Muutetut tiedostot: `docs/UX.md`, `docs/design/t021-mallisivu.html`, `docs/IDEAS.md`, tämä kortti.

## Luovutukset
### Luovutus 2026-10-02 · UX Designer → PM (sitten Koodari)
- Mitä tehtiin: Cyberpunk 2077 -tutkimus ja visuaalinen suunta. Värit: lähes musta tausta (`#0b0c10`), keltainen pääkorostus (`#fcee09`), syaani toissijainen ja fokus (`#1fe0ff`), punainen virhe (`#ff5a73`), oranssi varoitus (`#ffa726`). Fontit: Chakra Petch (teksti) ja Share Tech Mono (luvut). Muodot: viistetty oikea alakulma painikkeissa, HUD-kulmasulut hakupaneelissa, vinoraidat ilmoituksissa. Vain tumma teema. Kaikki kontrastit laskettu (UX.md 7.6): teksti ≥ 5.97 : 1, UI ≥ 3.77 : 1, fokus 12.25 : 1. Liike vain `prefers-reduced-motion: no-preference` (yksi 0,4 s glitch otsikossa, latauspalkki).
- Mitä pyydän: 1) PM näyttää mallisivun käyttäjälle ja pyytää hyväksynnän suunnalle (avaa tiedosto selaimessa, kokeile 320 px ja työpöytä). 2) PM ratkaisee V1–V8 (UX.md 7.10), erityisesti V1: vaalean teeman poisto kirjataan päätökseksi (rules.md 5.3). 3) Hyväksynnän jälkeen Koodari toteuttaa UX.md 7.9:n mukaan.
- Mistä katsoa: `docs/design/t021-mallisivu.html` (avaa suoraan selaimessa, ei palvelinta), `docs/UX.md` luvut 1 (periaate 7), 3 ja 7.
- Fontit Koodarille (SIL OFL 1.1, Googlen woff2, latin-alijoukko, ladataan kerran repoon `src/assets/fonts/` ja isännöidään itse, CSP `font-src 'self'`):
  - Chakra Petch 400: https://fonts.gstatic.com/s/chakrapetch/v13/cIf6MapbsEk7TDLdtEz1BwkWn6pg.woff2
  - Chakra Petch 700: https://fonts.gstatic.com/s/chakrapetch/v13/cIflMapbsEk7TDLdtEz1BwkeJI91R5_F.woff2
  - Share Tech Mono 400: https://fonts.gstatic.com/s/sharetechmono/v16/J7aHnp1uDWRBEqV98dVQztYldFcLowEF.woff2
  - OFL.txt: https://raw.githubusercontent.com/google/fonts/main/ofl/chakrapetch/OFL.txt ja https://raw.githubusercontent.com/google/fonts/main/ofl/sharetechmono/OFL.txt. Lisenssit kirjataan CONTENT.md:n sisältöjen oikeuksiin. Share Tech Mono: varattu fonttinimi "Share", älä muokkaa tiedostoa.
- Tunnetut rajoitteet ja riskit: tutkimuslähteet ovat kolmannen osapuolen analyyseja (ei CDPR:n tyyliohjetta), joten värit ovat likiarvoja. Mallisivun korttitiedot ovat esimerkkejä. Mallisivun CSS käyttää `clip-path`-muotoja ja `:has()`-valitsinta (toimii nykyselaimissa, ilman `:has()`:ia valitun chipin tausta puuttuu mutta ruksi näkyy). Glitch-animaatio ja hover/fokus on tarkistettu vain ulkoasun osalta. Axe, näppäimistöpolku ja ruudunlukija ajetaan vasta toteutuksen katselmoinnissa. Vite ei saa inline-liittää fontteja `data:`-muotoon (CSP), tarkista build.
- Testit: ei koodimuutoksia, ei testejä ajettu. Mallisivu renderöity Edge headlessilla ja tarkistettu kuvakaappauksista (320 px iframe, 1200 px).
- Veto: ei.

### Checkpoint 2026-10-02 · PM (käyttäjän päätökset, D-011)
- Käyttäjä hyväksyi mallisivun suunnan. V1: myös vaalea teema (seuraa laitteen asetusta). V2: Rajdhani. V3–V8: UX:n oletukset hyväksytty.
- Seuraava askel: UX lisää vaalean teeman ja vaihtaa fontin (UX.md ja mallisivu). Sitten Koodari toteuttaa.

### Checkpoint 2026-10-02 · UX Designer (D-011)
- Tehty: UX.md versioon 0.7 (luku 3: tokenit vaalealle ja tummalle teemalle, Rajdhani, nostetut fonttikoot; luvut 7.3, 7.4, 7.6, 7.9, 7.10 päivitetty). Mallisivu `docs/design/t021-mallisivu.html` näyttää molemmat teemat: teemapainikkeet (automaattinen, vaalea, tumma) ja "Rinnakkain"-näkymä (kaksi iframea). Skripti vain mallisivulla. Tarkistettu Edge headlessilla: 1100 px ja 320 px (iframe), molemmat teemat. IDEAS.md: vaalea teema merkitty toteutetuksi.
- Seuraava askel: Koodari toteuttaa UX.md 7.9:n mukaan. Sen jälkeen UX katselmoi (axe kummassakin teemassa).
- Avoimet kysymykset: V9–V11 (UX.md 7.10), oletukset valittu.

### Luovutus 2026-10-02 · UX Designer → PM → Koodari (päivitys D-011:n jälkeen)
- Mitä tehtiin: vaalea teema (kermanvalkoinen `#f3f0e6`, teksti `#0e0f14`, keltainen täyttö mustalla reunalla, tummansyaani `#005f73` fokukselle ja tiedolle, otsikkopalkki musta) ja fontti Rajdhani. Kontrastit laskettu molemmille teemoille (UX.md 7.6): vaalea teksti ≥ 5.10 : 1, UI ≥ 4.03 : 1, fokus 6.39 : 1. Tumma ennallaan (teksti ≥ 5.97, UI ≥ 3.77, fokus 12.25).
- **Päivitetyt fonttitiedot Koodarille** (SIL OFL 1.1, Googlen woff2, latin-alijoukko; ladataan kerran repoon `src/assets/fonts/`, itse isännöity, CSP `font-src 'self'`; Chakra Petch on poistunut):
  - Rajdhani 500: https://fonts.gstatic.com/s/rajdhani/v17/LDI2apCSOBg7S-QT7pb0EPOreec.woff2
  - Rajdhani 700: https://fonts.gstatic.com/s/rajdhani/v17/LDI2apCSOBg7S-QT7pa8FvOreec.woff2
  - Share Tech Mono 400 (luvut, tilarivit; säilyy): https://fonts.gstatic.com/s/sharetechmono/v16/J7aHnp1uDWRBEqV98dVQztYldFcLowEF.woff2
  - OFL.txt: https://raw.githubusercontent.com/google/fonts/main/ofl/rajdhani/OFL.txt ja https://raw.githubusercontent.com/google/fonts/main/ofl/sharetechmono/OFL.txt. Tekijänoikeusrivit: Rajdhani "Copyright (c) 2014, Indian Type Foundry (info@indiantypefoundry.com)", Share Tech Mono "Copyright (c) 2012, Carrois Type Design, Ralph du Carrois, Reserved Font Name 'Share'" (älä muokkaa tiedostoa). Lisenssit CONTENT.md:n sisältöjen oikeuksiin. Yhteiskoko noin 44 kB.
  - Rajdhanin luettavuus: leipäteksti 18 px paino 500, pienin teksti 16 px (ennen 14 px), lihavat 700. Share Tech Mono säilyy luvuille ja tilariveille (kiinteä leveys, selkeämmät numerot, HUD-lukema).
- Mitä pyydän: Koodari toteuttaa UX.md 7.9:n mukaan. Vaalea teema on `:root`-oletus ja tumma `@media (prefers-color-scheme: dark)` -lohkossa. Mallisivun `[data-theme]`-säännöt ja skripti eivät kuulu sovellukseen.
- Mistä katsoa: `docs/design/t021-mallisivu.html` (avaa selaimessa, "Rinnakkain" näyttää molemmat teemat), UX.md luvut 3 ja 7.
- Tunnetut rajoitteet: Rajdhanin tasaleveitä numeroita ei varmistettu, siksi numerot jäävät monolle. Axe, ruudunlukija ja zoom ajetaan toteutuksen katselmoinnissa. Veto: ei.

### Checkpoint 2026-10-02 · PM
- UX.md v0.7 ja mallisivu (molemmat teemat) valmiit, commit 52a9c78. V9–V11: UX:n oletukset hyväksytty (käytettävyysvalintoja, käyttäjä voi muuttaa).
- Tila In Progress. Seuraava askel: Koodari toteuttaa UX.md:n luvun 7.9 mukaan.

### Suunnitelma 2026-10-02 · Koodari
1. Fontit ja OFL-lisenssit `src/assets/fonts/`, `@font-face` ja lisenssit CONTENT.md:hen. Build: fontit erillisinä tiedostoina.
2. `styles.css`: tokenit (vaalea `:root`, tumma `prefers-color-scheme: dark`) ja komponenttityylit mallisivulta UX.md 3 ja 7 mukaan. Kaikki siirtymät ja animaatiot `prefers-reduced-motion: no-preference` -ehtoon.
3. Luokkalisäykset (UX.md 7.9): `.brand` (App), `panel` ja `.fieldsets` (CardFilters), `is-owned` (CardList), `is-summary` ja `loading-bar` (CatalogView). Ei logiikkamuutoksia.
4. Selaintarkistus (axe, 320 px ja työpöytä, molemmat teemat, reduce) Edge headlessilla scratchpadista.
5. CHANGELOG, koodikatselmointi, checkpoint ja luovutus UX:lle.
