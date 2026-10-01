# T-010 · Haku ja suodatus korttilistaan
**Tila:** In Progress · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Suunnittelu:** UX ☑ · Sisällöntuottaja ☐ (tekstit)
**Katselmoinnit:** Koodikatselmointi ☐ · UX ☐ · Sisällöntuottaja ☐ · Testikäyttäjä ☐ · Dokumentoija ☐ (CHANGELOG)
**Riippuvuudet:** T-001 (Done). Ei riippuvuutta T-011:een (voidaan tehdä rinnakkain).
**Haara:** `t-010-haku`

## Tavoite
Pelaaja löytää haluamansa kortin 151 kortin listasta muutamassa sekunnissa. Tämä on pohja kokoelman merkinnälle (T-012) ja pakkojen kokoamiselle (T-013) sekä PROJECT.md:n mittarille "kortin sijainnin näkee yhdellä haulla".

## Hyväksymiskriteerit
- [ ] Hakukenttä suodattaa listaa kirjoitettaessa nimen ja alaotsikon perusteella. Kirjainkoolla ei ole väliä, ja haku löytää myös osan sanasta (esim. "silver" → Johnny Silverhand).
- [ ] Listaa voi suodattaa korttityypin (Legend, Unit, Gear, Program) ja värin perusteella. Suodattimet ja haku toimivat yhdessä.
- [ ] Näkyvien korttien määrä päivittyy ("12 / 151 korttia"), ja muutos ilmoitetaan ruudunlukijalle hillitysti (ei jokaisesta näppäilystä erikseen).
- [ ] Jos mikään kortti ei vastaa hakua, näkyy tyhjä tila ja tapa tyhjentää haku ja suodattimet.
- [ ] Haku ja suodattimet toimivat näppäimistöllä ja 320 px:n leveydellä. axe ei löydä virheitä.
- [ ] Hakulogiikalla on yksikkötestit (myös erikoismerkit ja XSS-merkkijono hakusanana, SR-1).

## Rajaukset (ei kuulu tähän)
- Hakutilan tallennus URL:iin tai selaimeen
- Lajittelu (rajapinnan järjestys riittää)
- Haku sääntöteksteistä (`rules_text`), koska se vaatii T-007:n

## Työloki
### Checkpoint 2026-10-01 · PM
- Kortti määritelty, tila Ready. Seuraava askel: UX suunnittelee hakunäkymän (UX.md:n laajennus).

## Luovutukset
### Luovutus 2026-10-01 · UX Designer → Koodari
- Mitä tehtiin: UX.md v0.3, uusi luku 5 (haku ja suodatus): polku, suodatussäännöt (ryhmän sisällä TAI, ryhmät ja haku JA), HTML-rakenne (`form role="search"`, fieldset/legend, natiivit valintaruudut 44 × 44 px), rautalangat 320 px ja ≥ 640 px, kaikki tilat teksteineen, live-alueen hillintä (750 ms), fokus ja näppäimistö (Esc tyhjentää, ei automaattista fokusta) sekä tarkistuslista 5.10. Uudet korttivärien tokenit (3.1.1) ja komponentit (3.4).
- Rajapinnan arvot 2026-10-01: color Red 38, Yellow 37, Green 38, Blue 38. Väri näytetään tekstinä suomeksi ja koristeellisena näytteenä sarakkeessa "Tyyppi ja väri". Haku ohittaa kirjainkoon ja aksentit.
- Mitä pyydän: Toteutus luvun 5 mukaan. Sisällöntuottaja tarkistaa tekstit katselmoinnissa ja päivittää CONTENT.md:n sanaston.
- Mistä katsoa: docs/UX.md luvut 3.1.1, 3.4 ja 5, commit b87266c.
- Tunnetut rajoitteet ja riskit: Taulukon sarakeotsikko muuttuu, joten T-001:n testit päivitetään. Lomake vie 320 px:ssä noin 380 px korkeutta. Hakusanan enimmäispituus: ehdotus `maxlength="100"`.

### Checkpoint 2026-10-01 · PM
- K6 (värit suomeksi), K7 (label "Hae nimellä") ja K8 (yhdistetty sarake "Tyyppi ja väri"): UX:n oletukset hyväksytty. Ne ovat tekstivalintoja, jotka käyttäjä voi muuttaa myöhemmin.
- Hakusanan enimmäispituus: 100 merkkiä.
- Seuraava askel: Koodari toteuttaa worktreessä `.claude/worktrees/t-010`.
