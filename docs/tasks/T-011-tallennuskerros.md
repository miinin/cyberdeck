# T-011 · Tietomalli ja paikallinen tallennuskerros
**Tila:** Ready · **Omistaja:** Arkkitehti (suunnittelu) → Koodari · **MVP:** 1 · **Prioriteetti:** Must
**Suunnittelu:** Arkkitehti ☐ (ADR) · Digiturva ☐ (paikallinen tallennus, PRIVACY.md)
**Katselmoinnit:** Koodikatselmointi ☐ · Arkkitehti ☐ · Digiturva ☐ · Dokumentoija ☐ (ARCHITECTURE)
**Riippuvuudet:** T-001 (Done), D-007. Ei käyttöliittymää, joten UX ja Testikäyttäjä eivät katselmoi.
**Haara:** `t-011-tallennuskerros`

## Tavoite
Kokoelma (T-012) ja pakat (T-013) tarvitsevat tietomallin ja tallennuksen, joka säilyy selaimen sulkemisen yli. D-007:n mukaan tallennus on nyt paikallinen, mutta Firebase-kirjautuminen ja pilvitallennus sekä korttien painokset pitää voida lisätä myöhemmin ilman, että tietomalli tai sitä käyttävä koodi kirjoitetaan uudelleen.

## Hyväksymiskriteerit
- [ ] ADR DECISIONS.md:hen: tallennustekniikka (vähintään kaksi vaihtoehtoa, esim. localStorage ja IndexedDB), tietomalli (kokoelma, pakat), korttien yksilöivä avain (D-007: korttitaso, valmius painoksille) ja skeemaversio migraatioita varten.
- [ ] ARCHITECTURE.md: tallennuskerroksen rajapinta (repository-tyyppinen), jonka takana paikallinen toteutus voidaan myöhemmin vaihtaa tai täydentää Firebase-toteutuksella. Käyttöliittymä ei käytä selaimen tallennusta suoraan.
- [ ] Toteutus: kokoelman ja pakkojen luku, tallennus ja poisto paikalliseen tallennukseen. Tallennettu data validoidaan luettaessa, eikä rikkinäinen tai vanhan version data kaada sovellusta.
- [ ] Yksikkötestit: tallennus ja luku, rikkinäinen data, tyhjä tila, skeemaversio ja tallennustilan puuttuminen tai täyttyminen.
- [ ] Digiturva on arvioinut paikallisen tallennuksen (mitä tallennetaan, ei henkilötietoja) ja kirjannut sen PRIVACY.md:hen tai SECURITY.md:hen.

## Rajaukset (ei kuulu tähän)
- Kokoelman ja pakkojen käyttöliittymä (T-012, T-013)
- Firebase-toteutus ja kirjautuminen (MVP-2)
- Vienti ja tuonti tiedostoihin (T-015)
- Korttidatan välimuisti (T-003, oma ADR)

## Työloki
### Checkpoint 2026-10-01 · PM
- Kortti määritelty, tila Ready. Seuraava askel: Arkkitehti tekee ADR:n ja tietomallin, Digiturva arvioi tallennuksen rinnakkain.

## Luovutukset
