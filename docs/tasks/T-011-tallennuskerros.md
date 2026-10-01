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

### Turvavaatimukset (Digiturva, tarkemmin SECURITY.md luku 11)
- [ ] **SR-11:** Tallennettu data validoidaan ajonaikaisesti luettaessa, ja mukana on skeemaversio. Hyväksytty data rakennetaan uudeksi olioksi vain sallituista kentistä (ei spreadia eikä Object.assignia jäsennettyyn dataan). Raja-arvot: määrä 0–999 kokoelmassa ja 1–99 pakassa, enintään 200 pakkaa, 500 eri korttia pakassa ja 5 000 kokoelmassa, nimi 1–100 merkkiä. Nimistä poistetaan ohjaus- ja suunnanohjausmerkit, ja ne normalisoidaan NFC-muotoon. Hakutaulut ovat Map-olioita, ja avaimet `__proto__`, `constructor` ja `prototype` hylätään. Arkkitehti saa muuttaa lukuja, kunhan jokaisella listalla ja merkkijonolla on yläraja.
- [ ] **SR-11:** Tuntematonta tai uudempaa skeemaversiota ei ylikirjoiteta. Lukukelvoton raakadata siirretään varakopioavaimeen ennen tyhjää tilaa, ja osittain rikkinäisestä datasta ehjä osa säilyy. Sama validointifunktio palvelee myöhemmin T-015:n tuontia.
- [ ] **SR-12:** Vain `src/storage/` käyttää localStoragea tai IndexedDB:tä, ja lint-sääntö estää suoran käytön muualla. Avaimet ovat nimiavaruudessa ja versioituja (`cyberdeck:v1:…`). Ei evästeitä.
- [ ] **SR-13:** Jokainen tallennustilan kutsu on try/catchissa (SecurityError ja QuotaExceededError). Ilman tallennustilaa sovellus toimii muistinvaraisesti ja näyttää yleisen ilmoituksen. Kirjoitukset ovat atomisia, ja usean välilehden kilpailutilanne hoidetaan (Arkkitehti valitsee tavan). Kiintiövirheessä poistetaan vain välimuisti, ei koskaan käyttäjän dataa.
- [ ] **SR-16:** Tallennustilaan ei tallenneta henkilö-, laite- tai käyttäjätunnisteita eikä tokeneita. Uudet kentät päivitetään PRIVACY.md:n inventaarioon.
- [ ] Yksikkötestit: virheellinen JSON, väärät tyypit, negatiiviset, desimaali-, NaN- ja ylisuuret määrät, ylipitkä nimi, ohjausmerkit, `__proto__`- ja `constructor`-avaimet (prototyyppiin ei synny ominaisuutta), tuntematon skeemaversio (data säilyy muuttumattomana), osittain rikkinäinen data, kiintiövirhe ja estetty tallennustila.

## Rajaukset (ei kuulu tähän)
- Kokoelman ja pakkojen käyttöliittymä (T-012, T-013)
- Firebase-toteutus ja kirjautuminen (MVP-2)
- Vienti ja tuonti tiedostoihin (T-015)
- Korttidatan välimuisti (T-003, oma ADR)

## Työloki
### Checkpoint 2026-10-01 · PM
- Kortti määritelty, tila Ready. Seuraava askel: Arkkitehti tekee ADR:n ja tietomallin, Digiturva arvioi tallennuksen rinnakkain.

## Luovutukset
### Luovutus 2026-10-01 · Digiturva → PM, Arkkitehti, Koodari
- Mitä tehtiin: MVP-1:n uhkamalli ja STRIDE (SECURITY.md luku 11), turvavaatimukset SR-11–SR-19, riskit R-10–R-14, MVP-2:n ennakoidut vaatimukset MVP2-1–MVP2-9 (luku 12) ja uusi docs/PRIVACY.md.
- Mitä pyydän: SR-11, SR-12, SR-13 ja SR-16 T-011:n kriteereiksi (tehty). SR-17 kuuluu T-014:ään ja SR-18–SR-19 T-015:een. Arkkitehti huomioi ADR:ssä skeemaversion ja varakopion, avainten nimiavaruuden, välilehtien synkronoinnin, kiintiön jakamisen T-003:n kanssa ja raja-arvot.
- Mistä katsoa: docs/SECURITY.md luvut 11–12, docs/PRIVACY.md.
- Tunnetut rajoitteet ja riskit: R-10 (Safari voi poistaa datan noin 7 vrk:n käyttämättömyyden jälkeen, ja selaimen tyhjennys poistaa datan). Torjuntana ovat T-015:n vienti ja ilmoitus siitä, että tiedot ovat vain tässä selaimessa. MVP2-5:n COOP-vaikutus kirjautumiseen on epävarma.
- Testit: ei ajettu (suunnittelu).

### Checkpoint 2026-10-01 · PM (Digiturvan ehdotukset)
- Tietosuojailmoitus ("tiedot vain tässä selaimessa", R-10:n torjunta) liitetään T-012:een (UX ja Sisällöntuottaja).
- "Poista kaikki tiedot tästä selaimesta" → IDEAS.md.
- K-P1–K-P4 kirjattu STATUS.md:hen käyttäjälle (eivät blokkaa).
