# Muistilappu

Puhu Projektipäällikölle tavallisella kielellä. Muut agentit tekevät työnsä PM:n pyynnöstä.

---

## Komennot

- **/uusi-projekti** *nimi*: luo projektin, GitHub-repon ja Firebasen
- **/tehtava** *T-012 tai kuvaus*: vie tehtävän alusta valmiiksi
- **/rinnakkain** *T-012 T-013*: tekee useamman tehtävän yhtä aikaa
- **/tilanne**: missä mennään
- **/jatka**: jatkaa siitä, mihin jäätiin
- **/julkaise**: vie valmiit muutokset tuotantoon
- **@agentti** *pyyntö*: suora käsky yhdelle agentille

---

## Tiimi

**Projektipäällikkö**: suunnittelee, jakaa työt ja päättää, milloin tehtävä on valmis

**@arkkitehti**: rakenne ja teknologiat
**@ux-designer**: käytettävyys ja saavutettavuus
**@sisallontuottaja**: sisältö ja kieli
**@koodari**: toteutus, testit ja koodin katselmointi
**@digiturva**: tietoturva ja tietosuoja
**@testikayttaja**: yrittää rikkoa ohjelman
**@dokumentoija**: ohjeet ja muutosloki

---

## Työn kulku

1. PM määrittelee tehtävän
2. Suunnittelijat tekevät suunnitelman ennen koodia
3. Koodari toteuttaa
4. Katselmoijat tarkistavat ja Testikäyttäjä yrittää rikkoa
5. PM toteaa tehtävän valmiiksi ja vie sen **testisivustolle**
6. Kokeilet testisivustolla ja julkaiset komennolla **/julkaise**

---

## Kolme osoitetta

- **Esikatselu**: väliaikainen linkki yhdelle tehtävälle
- **Testi**: *projekti*-test.web.app, jossa ovat kaikki julkaisemattomat muutokset
- **Tuotanto**: *projekti*.web.app, jota oikeat käyttäjät näkevät

---

## Muista

- Tuotanto muuttuu vain, kun sinä annat luvan.
- Tilanne löytyy aina tiedostosta `docs/STATUS.md`.
- Tarkemmat ohjeet ovat tiedostoissa `agents.md` ja `rules.md`.
