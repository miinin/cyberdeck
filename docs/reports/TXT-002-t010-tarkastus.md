# TXT-002 · T-010:n (haku ja suodatus) käyttöliittymätekstien sisältö- ja kielitarkastus

**Tehtävä:** T-010 · **Tarkastaja:** Sisällöntuottaja · **Päivä:** 2026-10-01
**Kohde:** haara `t-010-haku` (commit 8d5f8f9), `src/ui/texts.ts`, `CardFilters.tsx`, `CardColor.tsx`, `CardList.tsx`, `CatalogView.tsx`, `CHANGELOG.md` (`[Julkaisematon]`). Vertailu: `docs/UX.md` 5.2–5.12, `docs/CONTENT.md`.
**Konteksti:** tekstit luettiin renderöidystä sivusta esikatselussa (https://cyberdeck-tcg-test--pr3-t-010-haku-6ycx0rzm.web.app, headless Chrome `--dump-dom`, 151 korttia, tila EI SUODATUSTA). SUODATETTU- ja EI TULOKSIA -tilojen tekstit tarkistettiin lähdekoodista ja testeistä (`CatalogView.filters.test.tsx`), koska tila vaatii syötettä.

## Yhteenveto

- **Veto: ei.** Tekstit ovat oikein, ymmärrettäviä ja UX.md:n luvun 5 mukaisia. Ei asiavirheitä, ei Critical- tai High-löydöksiä.
- Löydökset: Critical 0 · High 0 · Medium 0 · Low 3 (TXT-008, TXT-009, TXT-010) · Info 1 (TXT-011).
- Kaikki käyttäjälle näkyvät tekstit tulevat `texts.ts`:stä. Komponenteissa ei ole kovakoodattua suomenkielistä tekstiä.
- CONTENT.md päivitetty versioon 0.2: värit suomeksi (K6), "haku"-sanan kaksi merkitystä (K7), sarake "Tyyppi ja väri" (K8) sekä termit alaotsikko, suodatin, valinta ja "hakua vastaavat kortit".

**Tarkistettu, ei löydöksiä:** oikeinkirjoitus ja välimerkit (kaikki uudet tekstit), osuusmuoto "n / kaikki korttia" (CONTENT.md 3), lukujen muotoilu `fi-FI`, värien nimet ja niiden pieni/iso alkukirjain (iso vain itsenäisenä vaihtoehtona tai solun rivinä), `lang="en"` tyypeissä ja tuntemattomissa väreissä, ruudunlukijan lukema solu "Unit, Punainen", maamerkin nimi "Hae ja suodata kortteja", label "Hae nimellä" ja ohje "Kortin nimi tai alaotsikko. Osa sanasta riittää.", painike "Tyhjennä haku ja suodattimet" (verbi, kertoo mitä tapahtuu), "haku"-sanan kaksi merkitystä eivät näy samaan aikaan (UX.md 5.8, todettu `CatalogView.tsx`: lomake vain, kun kortteja on ladattu).

**Asiasisältö:** värien arvot (Red, Yellow, Green, Blue) ja määrät perustuvat rajapinnan vastaukseen (UX.md 5.2, tarkistettu 2026-10-01). Suomennokset ovat yleiskieltä, eivät pelin virallisia termejä. Ei tarkistettavia asiasisältöjä.

---

### TXT-008 · Tyhjän tilan "Valintoja vastaavia" ei vastaa taulukon kuvatekstiä "Hakua vastaavat" · Low
**Sijainti:** `src/ui/texts.ts`: `noResultsLive`, `noResultsBody` (vrt. `tableCaptionFiltered`) · **Tehtävä:** T-010
**Toistaminen:** 1) Kirjoita hakukenttään "silverhandd". 2) Lue tyhjän tilan kappale.
**Nykyinen teksti:**
- `noResultsBody`: "Valintoja vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista."
- `noResultsLive`: "Valintoja vastaavia kortteja ei löytynyt."
**Ehdotettu teksti:**
- `noResultsBody`: "Hakua vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista."
- `noResultsLive`: "Hakua vastaavia kortteja ei löytynyt."
**Perustelu:** Tavallisin tapa päätyä tyhjään tilaan on pelkkä hakusana. Silloin käyttäjä ei ole valinnut mitään, joten "Valintoja vastaavia" on epätarkka. Lisäksi jokainen väri esiintyy jokaisessa tyypissä (UX.md 5.2), joten pelkillä valinnoilla tulos ei nykydatalla voi olla tyhjä. Sama tilanne kuvataan nyt kahdella eri sanalla: taulukon kuvateksti on "Hakua vastaavat kortit", tyhjä tila "Valintoja vastaavia kortteja". Yksi käsite = yksi termi (CONTENT.md 4). "Haku" kattaa tässä myös valinnat samoin kuin maamerkki "Hae ja suodata kortteja", ja jälkimmäinen lause neuvoo kummankin korjaamisen. Testit (`CatalogView.filters.test.tsx`) ja UX.md 5.6 päivitetään samalla tekstillä (UX:n omistama tiedosto, PM osoittaa).
**Tila:** Avoin → Korjattu (commit a6890e9), UX.md 5.6 (commit 74404fe)

### TXT-009 · "Näytetään kaikki 1 korttia" yhden kortin tapauksessa · Low
**Sijainti:** `src/ui/texts.ts`: `allShownLive` · **Tehtävä:** T-010
**Toistaminen:** OSITTAINEN-tila, jossa saatiin vain 1 kortti → hae jotain → tyhjennä haku. Live-alue: "Näytetään kaikki 1 korttia."
**Nykyinen teksti:** `` `Näytetään kaikki ${numberFormat.format(all)} korttia.` ``
**Ehdotettu teksti:** kun `all === 1`: "Näytetään 1 kortti." Muuten ennallaan. Esim. `all === 1 ? \`Näytetään ${cardCount(1)}.\` : \`Näytetään kaikki ${…} korttia.\``
**Perustelu:** CONTENT.md 3: lukumäärät taivutetaan ("1 kortti"). Osuusmuodon poikkeus ("1 / 151 korttia") ei koske tätä lausetta. Tapaus on harvinainen, joten Low.
**Tila:** Avoin → Korjattu (commit a6890e9)

### TXT-010 · CHANGELOG: "valinnat löysivät" ja sisäinen tehtävätunniste · Low (Dokumentoijalle)
**Sijainti:** `CHANGELOG.md`, `[Julkaisematon]` → Lisätty · **Tehtävä:** T-010
**Nykyinen teksti:**
- "Haku ja suodatus korttilistaan (T-010): voit hakea…"
- "Listan yläpuolella näkyy, montako korttia valinnat löysivät (esim. "2 / 151 korttia")."
**Ehdotettu teksti:**
- "Haku ja suodatus korttilistaan: voit hakea…"
- "Listan yläpuolella näkyy, montako korttia haku ja valinnat löysivät (esim. "2 / 151 korttia")."
**Perustelu:** Määrä päivittyy myös pelkällä hakusanalla. Tehtävätunniste ei kerro käyttäjälle mitään (CHANGELOG on "käyttäjälle näkyvät muutokset", 0.1.0-osiossa ei tunnisteita). Lisäksi 0.1.0-osio käyttää sanaa "haku" merkityksessä korttien lataus ("Haku kestää muutaman sekunnin"). Julkaistua osiota ei muuteta, mutta jatkossa merkitys (1) kirjoitetaan "korttien haku" (CONTENT.md 4). Dokumentoija päättää muotoilun julkaisun yhteydessä.
**Tila:** Avoin → Korjattu (commit 74404fe)

### TXT-011 · Suodatinohje "Valitse yksi tai useampi." · Info (ei muutosta)
**Sijainti:** `src/ui/texts.ts`: `filterHint`
**Nykyinen teksti:** "Valitse yksi tai useampi. Ilman valintaa näytetään kaikki."
**Arvio:** Käskymuoto voisi yksinään kuulostaa pakolliselta, mutta jälkimmäinen lause kertoo heti, että valinta on vapaaehtoinen. Lyhyt ja selkeä. Ei muutosta. Vaihtoehto, jos UX haluaa: "Voit valita yhden tai useamman. Ilman valintaa näytetään kaikki."
**Tila:** Suljettu (ei toimenpiteitä)

---

## Luovutus Koodarille (PM:n osoittamana)

Muutokset `src/ui/texts.ts`:hen: TXT-008 (kaksi tekstiä) ja TXT-009 (yksi ehto). Päivitä vastaavat testiodotukset. TXT-008:n vuoksi UX.md 5.6:n taulukon ja EI TULOKSIA -rautalangan teksti päivitetään (UX Designer). TXT-010 kuuluu Dokumentoijalle. Mikään löydös ei estä Done-tilaa.
