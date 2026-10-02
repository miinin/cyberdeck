# T-021 · Ulkoasu: Cyberpunk 2077 -henkinen visuaalinen ilme
**Tila:** Ready · **Omistaja:** UX Designer → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-010)
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

## Luovutukset
