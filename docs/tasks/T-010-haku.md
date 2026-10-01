# T-010 · Haku ja suodatus korttilistaan
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Suunnittelu:** UX ☐ · Sisällöntuottaja ☐ (tekstit)
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
