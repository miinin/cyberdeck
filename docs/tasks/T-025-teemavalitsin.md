# T-025 · Teemavalitsin: tumma oletuksena, käyttäjä voi vaihtaa
**Tila:** Ready · **Omistaja:** UX Designer → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-012)
**Suunnittelu:** UX ☑ (UX.md luku 8, v0.9)
**Katselmoinnit:** Koodikatselmointi ☐ · UX ☐ · Digiturva ☐ (kevyt: uusi tallennettava asetus, SR-12, SR-16)
**Riippuvuudet:** T-021 (Done)
**Haara:** `t-025-teemavalitsin`

## Tavoite
Käyttäjä valitsee väriteeman helposti. Tumma teema on oletus (D-012), koska se on Cyberpunk-ilmeen pääteema.

## Hyväksymiskriteerit
- [ ] Ensimmäisellä käynnillä teema on tumma laitteen asetuksesta riippumatta.
- [ ] Teeman voi vaihtaa (tumma / vaalea) yhdellä selkeästi löytyvällä kontrollilla, joka näkyy kaikilla leveyksillä (myös 320 px) ja toimii näppäimistöllä ja ruudunlukijalla (nimi ja valittu tila luetaan).
- [ ] Valinta säilyy sivun uudelleenlatauksessa. Se tallennetaan tallennuskerroksen kautta (`src/storage/index.ts`, SR-12). Jos tallennus ei ole käytettävissä, vaihto toimii silti istunnon ajan.
- [ ] Sivu ei välähdä väärässä teemassa latautuessaan: tumma alusta asti, ja tallennettu valinta otetaan käyttöön ennen ensimmäistä piirtoa, jos se on mahdollista CSP:n `script-src 'self'` puitteissa.
- [ ] Kontrastit ja axe kunnossa kummassakin teemassa (WCAG 2.2 AA). Testit kattavat oletuksen, vaihdon ja tallennuksen.

## Rajaukset (ei kuulu tähän)
- Kolmas vaihtoehto "laitteen mukaan" vain, jos UX perustelee sen tarpeelliseksi
- Uudet teemat tai värimuutokset (T-021:n tokenit pysyvät)

## Työloki
### Checkpoint 2026-10-02 · PM
- Kortti määritelty (D-012), tila Ready. Seuraava askel: UX suunnittelee kontrollin, sitten Koodari.

### Checkpoint 2026-10-02 · UX Designer
- Tehty: suunnittelu valmis, UX.md v0.9 luku 8 (teemavalitsin). Luvun 3 johdanto ja 7.3 päivitetty (yliviivaus ja viittaus). IDEAS.md: 2 riviä.
- Päätökset: tumma aina oletus (ei `prefers-color-scheme`), ei kolmatta vaihtoehtoa, yksi vaihtopainike `aria-pressed` otsikkopalkissa nimellä "Vaalea teema", ei live-aluetta, ei virheilmoitusta tallennuksen epäonnistuessa.
- Välähdyksen esto: `data-theme="dark"` HTML:ssä ja synkroninen ulkoinen `public/theme-init.js` (CSP ok). SR-12-poikkeama (vain luku) vaatii Digiturvan ja Arkkitehdin hyväksynnän, varavaihtoehto: ei skriptiä.
- Seuraava askel: PM ratkaisee avoimet kysymykset A1–A5 (UX.md 8.10), sitten Koodari toteuttaa.
- Muutetut tiedostot: docs/UX.md, docs/IDEAS.md, docs/tasks/T-025-teemavalitsin.md

## Luovutukset
### Luovutus 2026-10-02 · UX Designer → Koodari
- Mitä tehtiin: teemavalitsimen määrittely UX.md:n luvussa 8: kontrolli (8.1, 8.3, 8.4), ulkoasu ja kontrastit (8.5), toiminta (8.6), välähdyksen esto ja tallennus (8.7), CSS-rakenne (8.8), tarkistuslista ja testit (8.9).
- Mitä pyydän: toteutus määrittelyn mukaan. Rajapintalisäys tallennuskerrokseen: `PreferencesRepository` (`loadTheme`, `saveTheme`, 8.7), avain `cyberdeck:theme` (`src/storage/keys.ts`), uusi `public/theme-init.js`, `data-theme="dark"` `index.html`iin, tyylitiedoston teemalohkojen uudelleenjärjestely (arvot ennallaan), uudet tekstit `src/ui/texts.ts`iin.
- Mistä katsoa: docs/UX.md luku 8 (sekä luvun 3 johdanto ja 7.3). CSP: `firebase.json` (`script-src 'self'`, `style-src 'self'`): ei `style`-attribuutteja eikä inline-skriptiä.
- Tunnetut rajoitteet ja riskit: 320 px:n yksirivinen otsikkopalkki on erittäin tiukka (arvio 287 / 288 px), rivitys on sallittu. SR-12-poikkeama (A1) odottaa hyväksyntää. Kontrastit on laskettu, ei mitattu selaimessa (toteutusta ei vielä ole).
- Testit: ei koodia muutettu, ei ajettu.
- Avoimet kysymykset (oletus valittu): A1 Digiturva ja Arkkitehti hyväksyvät `theme-init.js`:n `localStorage`-luvun (oletus kyllä, varavaihtoehto ei skriptiä). A2 raakamerkkijono `light` tai `dark` ilman käärettä (oletus kyllä). A3 ei viestiä tallennuksen epäonnistuessa (oletus ei). A4 ei "laitteen mukaan" -vaihtoehtoa eikä välilehtien synkronointia (oletus ei, IDEAS.md). A5 ei `theme-color`-metaa (oletus ei, IDEAS.md).
- UX-katselmointi toteutuksesta pyydetään Review-vaiheessa (axe kummassakin teemassa, näppäimistö, 200 % ja 400 % zoom, 320 px).
