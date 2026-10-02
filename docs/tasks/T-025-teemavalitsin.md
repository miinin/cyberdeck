# T-025 · Teemavalitsin: tumma oletuksena, käyttäjä voi vaihtaa
**Tila:** Ready · **Omistaja:** UX Designer → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-012)
**Suunnittelu:** UX ☐
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

## Luovutukset
