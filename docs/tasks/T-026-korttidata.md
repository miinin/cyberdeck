# T-026 · Korttidata sovelluksen mukana (ei hakua joka käynnillä)
**Tila:** Ready · **Omistaja:** Arkkitehti → Koodari · **MVP:** 1 · **Prioriteetti:** Must (D-012)
**Suunnittelu:** Arkkitehti ☐ (ADR, kattaa myös T-027:n kuvat)
**Katselmoinnit:** Koodikatselmointi ☐ · Digiturva ☐ (data, CSP ja firebase.json, R-2) · UX ☐ (vain jos käyttäjälle näkyvät tilat muuttuvat)
**Riippuvuudet:** –. Korvaa T-003:n (välimuisti).
**Haara:** `t-026-korttidata`

## Tavoite
Kortit näkyvät heti ilman verkkohakua, eikä sovellus riipu Netdeckin rajapinnan saatavuudesta (D-012, PROJECT.md:n riski "rajapinta muuttuu tai sulkeutuu").

## Hyväksymiskriteerit
- [ ] Korttidata (151 korttia, `Card`-mallin kentät) on sovelluksessa staattisena datana, eikä sovellus kutsu Netdeckin rajapintaa käyttäjän selaimessa.
- [ ] Datan päivittämiseen on kehittäjän komento (esim. `npm run cards:update`). Se validoi datan samoilla säännöillä kuin nykyinen rajapintakerros (SR-1, SR-3 jne.) ja tuottaa deterministisen tiedoston. Ohje STATUS.md:n ajo-ohjeeseen.
- [ ] Kokoelman avaimet (`Card.key`, D-008) pysyvät samoina, eikä tallennettu data muutu.
- [ ] Lataus-, virhe- ja osittaisen datan tilat, jotka eivät enää ole mahdollisia, poistetaan tai sovitetaan Arkkitehdin linjauksen mukaan ilman, että mikään toimiva ominaisuus heikkenee.
- [ ] CSP:n `connect-src` kiristetään, jos rajapintaa ei enää tarvita (Digiturva). Testit, lint ja build menevät läpi.

## Rajaukset (ei kuulu tähän)
- Korttikuvat (T-027)
- Painokset (D-007)

## Työloki
### Checkpoint 2026-10-02 · PM
- Kortti määritelty (D-012), tila Ready. Seuraava askel: Arkkitehti tekee ADR:n (data ja kuvat), sitten Koodari.

## Luovutukset
