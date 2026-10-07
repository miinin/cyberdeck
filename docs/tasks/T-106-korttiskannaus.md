# T-106 · Korttien skannaus kameralla (selvitys ja suunnitelma)

**Tila:** Review (vaiheet 0–1 valmiit, odottaa Digiturvaa ja puhelinkokeilua; vaiheet 0–1, haara `t-106-skanneri`). Päätökset: D-027 (A, kamera sallittu, painos valitaan alussa, vaihe 0 keinotekoisilla kuvilla).

## Tavoite
Pelaaja lisää fyysiset korttinsa kokoelmaan näyttämällä ne puhelimen kameralle sen sijaan, että hakisi jokaisen nimeltä ja painaisi +. Kun kortteja on kymmeniä tai satoja, tämä on sovelluksen hitain työvaihe.

## Selvitys: miten muut tekevät
- **Kuvan sormenjälki:**
  - Tavallisin selainratkaisu on pHash tai dHash.
  - Kameran kuvasta lasketaan pieni tiiviste, jota verrataan valmiiksi laskettuihin tiivisteisiin.
  - Lähintä tiivistettä etsitään Hamming-etäisyydellä.
  - RGB-kanavat erikseen parantavat tarkkuutta (Moss Machine, Pokemon-TCGP-Card-Scanner).
- **Tekstintunnistus (OCR):** kortin nimi tai numero luetaan esimerkiksi Tesseract.js:llä. Raskas (useita megatavuja ja kielidata) ja herkkä valaistukselle.
- **Konenäkö:** OpenCV.js hakee kortin reunat kuvasta ja oikaisee perspektiivin. Noin 8 Mt WebAssemblyä ja CSP-muutos (`wasm-unsafe-eval`).
- **Pilvipalvelu** (esim. Azure tai Google Vision): kuvat lähtisivät laitteelta, hinta on käyttöön sidottu ja tietosuoja vaikeutuu. Ei sovi projektiin (D-016: vain Spark, ei maksullisia palveluita).

## Meidän tilanteemme
- **Pieni kuvitusmäärä:** tunnistettavia kuvituksia on vain noin 233: 151 korttia (`src/assets/cards/lg`) ja 82 versiokuvaa (`variants`). Isoissa peleissä niitä on kymmeniätuhansia. Pieneen joukkoon sormenjälkivertailu riittää ilman konenäkökirjastoa ja ilman OCR:ää.
- **Painos:** Beta ja Retail ovat kuvitukseltaan samat. Painosta ei siksi voi päätellä kuvasta luotettavasti, sillä β-merkki on pieni. Painos tulee valinnasta, kuten T-101:n varmistuksessa: skannaus alkaa kysymyksellä "Skannaatko Beta- vai Retail-kortteja?".

## Suositeltu ratkaisu (A): ohjattu kuvaus ja sormenjäljet laitteella
1. **Sormenjäljet buildissa:** skripti (`scripts/cards/`, sharp on jo devDependency) laskee jokaiselle kuvitukselle tiivisteet.
   - **Tiivisteet:** koko kortti ja kuvitusalue, molemmista dHash/pHash RGB-kanavittain.
   - **Tallennus:** tulos tallennetaan JSON:ksi, noin 233 × 3 × 32 tavua eli muutama kymmenen kilotavua.
   - **Lataus:** JSON ladataan vasta, kun skanneri avataan.
2. **Kamera:** `getUserMedia({ video: { facingMode: 'environment' } })`.
   - **Kehys:** kuvassa on kortin muotoinen kehys (63:88), johon kortti asetetaan.
   - **Kuvan ottaminen:** kehyksen alue kopioidaan canvasiin automaattisesti, kun kuva on pysynyt vakaana noin 300 ms. Vaihtoehtoisesti käyttäjä napauttaa.
3. **Tunnistus:** kuvasta lasketaan samat tiivisteet, ja niitä verrataan kaikkiin 233 kuvitukseen. Laskenta vie alle millisekunnin.
   - **Varma osuma:** jos lähimmän ero toiseksi lähimpään on selvä, sovellus tarjoaa kortin suoraan.
   - **Muuten:** näkyvissä on kolme vaihtoehtoa kuvina.
4. **Vahvistus:** kortti ja kuvitus näkyvät, ja määrää voi säätää (+1 / ±). "Lisää" vie kortin kokoelmaan valittuun painokseen ja kuvitukseen (D-020/D-021/D-022) ja palaa heti kameraan.
   - **Sarjatila:** skannatut kortit kertyvät listaksi, jossa on kumoa-toiminto.
   - **Kohde:** skannata voi myös want-listalle tai proxy-jonoon.
5. **Tietosuoja:**
   - Kuva käsitellään vain laitteella, eikä mitään lähetetä minnekään eikä kuvia tallenneta.
   - Kamera sammuu, kun skanneri suljetaan.
   - PRIVACY.md:hen lisätään lyhyt maininta.

**Miksi A eikä B tai C:** A ei tarvitse uusia riippuvuuksia eikä CSP-muutoksia, ja se toimii offline. Se on nopea myös halvoilla puhelimilla. Pienen kuvitusmäärän takia tarkkuus on luultavasti riittävä, mutta se pitää todentaa (vaihe 0). Jos tarkkuus ei riitä, varasuunnitelma on B: OpenCV.js oikaisee perspektiivin automaattisesti, ja se ladataan vain skannerissa.

## Tekniset muutokset
- **`firebase.json`:** Permissions-Policy on nyt `camera=()`, joka estää kameran kokonaan. Se muutetaan muotoon `camera=(self)`. Tämä vaatii Digiturvan katselmoinnin.
- **CSP:** ei muutoksia ratkaisussa A. Kaikki on omaa koodia ja omia tiedostoja, eikä wasmia tai ulkoisia osoitteita tarvita.
- **Uudet osat:**
  - `src/domain/cardFingerprint.ts`: tiivisteiden laskenta ja vertailu, puhtaat funktiot ja testit.
  - `scripts/cards/fingerprints.ts`: buildiaikainen skripti.
  - `src/ui/CardScanner.tsx`: kamera, kehys ja vahvistus.
- **Avaaminen:** skanneri avataan Kortit- ja Kokoelma-näkymän Skannaa-painikkeesta. Painike näkyy vain laitteilla, joilla on kamera.

## Vaiheet ja arvio
| Vaihe | Sisältö | Arvio |
|---|---|---|
| 0 Kokeilu | Sormenjälkiskripti ja testiohjelma, joka ajaa käyttäjän valokuvat (noin 20–30 kuvaa oikeista korteista eri valaistuksissa) tunnistuksen läpi. **Hyväksymisraja: oikea kortti ensimmäisenä ≥ 90 % ja kolmen joukossa ≥ 98 %.** | 2–3 h |
| 1 MVP | Kamera ja kehys, napautuskuvaus, kolme vaihtoehtoa, vahvistus ja lisäys kokoelmaan painoksen kanssa, Permissions-Policy-muutos (Digiturva) | 4–6 h |
| 2 Sujuvuus | Automaattinen kuvaus vakaasta kuvasta, sarjatila ja kumoa, skannaus want-listalle tai proxy-jonoon | 3–4 h |
| 3 (valinnainen) | β-merkin tunnistus kuvasta (OCR rajattuun alueeseen) tai B-varasuunnitelma (OpenCV.js), jos vaihe 0 ei saavuta rajaa | 4–8 h |

## Riskit
- **Foliot ja heijastukset:** Iconic- ja Nova-korttien heijastukset ja suojamuovit voivat heikentää tunnistusta. Tämä mitataan vaiheessa 0, ja kehyksen ohjeena on "kallista korttia, jos se heijastaa".
- **Samannäköiset kuvitukset:** perus- ja versiokuvitus voivat muistuttaa toisiaan. Varmistusnäkymä hoitaa nämä tapaukset, koska käyttäjä valitsee aina lopuksi itse.
- **Vanhat puhelimet:** getUserMedia vaatii HTTPS:n (Firebase Hosting täyttää vaatimuksen). iOS Safarissa video pitää käynnistää painalluksesta.
- **Tulevat setit:** kuvituksia tulee lisää uusien settien myötä. Sormenjäljet lasketaan buildissa samasta kuvalähteestä, joten ylläpitoa ei tarvita.

## Päätettävät (käyttäjä)
1. **Ratkaisu:** edetäänkö ratkaisulla A (laitteella, ei riippuvuuksia, kuvat eivät lähde laitteelta)? Suositus: kyllä.
2. **Testikuvat:** voitko ottaa 20–30 valokuvaa oikeista korteista vaihetta 0 varten, mielellään erilaisissa valoissa ja mukana muutama folio sekä suojamuovissa oleva kortti? Kuvat jäävät koneelle, eivät repoon.
3. **Painos:** valitaanko Beta tai Retail skannauksen alussa? Suositus: kyllä. Kuvasta tunnistus vasta valinnaisessa vaiheessa 3.
4. **Kameran salliminen:** sallitaanko kameran käyttö sovelluksessa? Tämä tarkoittaa Permissions-Policyn muutosta, jonka Digiturva katselmoi. Suositus: kyllä.

## Lähteet
- Pokemon-TCGP-Card-Scanner (perceptual hash, IndexedDB-välimuisti): https://github.com/1vcian/Pokemon-TCGP-Card-Scanner
- Moss Machine (MTG, 256-bittinen pHash RGB-kanavittain): https://kairicollections.github.io/Moss-Machines-Magic-the-Gathering-sorting/
- Card Recognition -suunnitelma (OpenCV.js, perspektiivin oikaisu, Tesseract.js): https://github.com/arthurb2l/japan-tcg-price-guide/issues/99
- MTG-tunnistus OCR:llä (Quentin Fortier): https://fortierq.github.io/mtgscan-ocr-azure-flask-celery-socketio/

## Vaihe 0: tulos (keinotekoinen testi, D-027)
Mittaus: `npm run cards:measure-scanner` (233 kuvitusta × 12 skenaariota × 2 toistoa = 5592 vääristettyä kuvaa, kehys 360×503). Tiiviste: dHash 16×16 RGB-kanavittain, koko kortti + kuvitusalue (`src/domain/cardFingerprint.ts`), haku Hamming-etäisyydellä. Kameran kuvasta lasketaan tiiviste 10 ikkunasta (koko kuva + 9 hieman pienempää, siirrettyä ikkunaa), ja etäisyys on pienin. Ilman ikkunoita epäkeskeisyys (±5 %) pudotti top-1:n 62 %:iin.

| Skenaario | top-1 | top-3 |
|---|---|---|
| puhdas | 99,6 | 100 |
| kierto ±8° | 97,9 | 100 |
| perspektiivi/vinous | 98,1 | 100 |
| rajaus 3–8 % | 93,3 | 99,1 |
| reunus 3–8 % | 98,7 | 100 |
| epäkeskisyys ±5 % | 97,4 | 100 |
| sumennus | 99,6 | 100 |
| kirkkaus/kontrasti/lämpötila | 99,6 | 100 |
| kohina | 99,6 | 100 |
| heijastusläiskä | 99,6 | 100 |
| JPEG 50 + pienennys | 99,4 | 100 |
| yhdistetty (realistinen sekoitus) | 95,1 | 99,6 |
| **Kaikki** | **98,1** | **99,9** |

**Raja (top-1 ≥ 90 %, top-3 ≥ 98 %) täyttyy.** Kun hyväksytään oikea kortti (eri kuvitus, sama kortti), top-1 on 99,6 %. Lähes kaikki virheet ovat saman kortin kuvitusten sekaannuksia (Nova Rare / Iconic Legend / perus; rebecca-having-a-moment nova-rare ja perus ovat käytännössä sama kuva), jotka varmistusnäkymä hoitaa, koska käyttäjä valitsee kuvituksen. "Varma osuma" -sääntö (etäisyys ≤ 240 ja ero toiseen ≥ 40 bittiä): 53 % skannauksista, joissa väärin 0 kpl (otoksessa). Loput näyttävät kolme vaihtoehtoa.
**Varaus:** keinotekoinen testi voi yliarvioida tarkkuuden (oikeat foliot, suojamuovi, taustat ja kameran käsittely). Oikeiden kuvien testi on avoin (D-027). Mittaus ei sisällä kortin tunnistusta taustasta: käyttäjä asettaa kortin kehykseen.

## Luovutus (vaiheet 0 ja 1)
Tehty: sormenjälkiskripti (`npm run cards:fingerprints` → `src/data/cardFingerprints.json`, 101 kt, 48 kt gzip, ladataan vasta skannerissa dynaamisella importilla), `cardFingerprint.ts` (+ testit), `fingerprintIndex.ts` (lataus ja validointi, testi varmistaa että JSON kattaa kaikki kuvitukset), `scanCrop.ts` (kehyksen alue videon pikseleinä, object-fit: cover), `CardScanner.tsx` (painosvalinta → kamera `facingMode: environment` painalluksesta → 63:88-kehys → napautus/Skannaa → varma osuma tai 3 vaihtoehtoa → määrä ± → lisäys → takaisin kameraan; stream pysäytetään suljettaessa ja unmountissa; lupa evätty / ei kameraa / muu virhe selkeällä tekstillä), `collectionEntry.ts` (CatalogView:n entryOf/writeEntry siirretty jaettuun tiedostoon, lisäys kulkee samaa D-020/21/22-polkua), Skannaa-painike Kortit- ja Kokoelma-näkymiin (vain jos `navigator.mediaDevices.getUserMedia` on), `firebase.json` `camera=(self)` molemmissa kohdissa, PRIVACY.md luku 12, SECURITY.md:n otsikkorivi. Ei uusia riippuvuuksia, ei CSP-muutoksia.
Ei tehty (vaihe 2): automaattikuvaus, sarjatila/kumoa, want-lista/proxy-kohde.
Testit: `npm test` 109 tiedostoa / 1471 testiä läpi, `npm run lint` ja `npm run build` läpi.
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 2 (velka): (1) kuvaus ei tunnista korttia taustasta eikä oikaise perspektiiviä, vain kehys ja 10 ikkunaa; jos oikeilla kuvilla tarkkuus jää alle rajan, varasuunnitelma B (OpenCV.js). (2) Skannerin käyttöliittymää ei ole kokeiltu oikealla puhelimella, ainoastaan jsdom-testit ja CSS-katselmointi.
Seuraavaksi: Digiturva (Permissions-Policy, dynaaminen JSON-lataus, kameran käyttö), sitten PM:n esikatselutarkistus puhelimella (kehyksen sijainti ja koko, iOS Safari).

### Luovutus · Digiturva · 2026-10-08
Katselmointi SEC-106 (`docs/reports/SEC-106-kameraskanneri.md`): Critical 0, High 0, Medium 1, Low 1, Info 2. **Veto: blokkaa Done-tilan, kunnes SEC-106-1 on korjattu.**
Pakolliset: **SEC-106-1** (`src/ui/CardScanner.tsx:123–174`) – kamera jää päälle, kun välilehti piilotetaan; lisää `visibilitychange`-käsittely, joka pysäyttää streamin ja palauttaa painosvalintaan (testi). Suositus samaan PR:ään: **SEC-106-2** (`CardScanner.tsx:193–196`) – virhetila ei pysäytä streamia.
Hyväksytty: `firebase.json` `camera=(self)` (ei muita muutoksia, CSP ennallaan), sormenjälki-JSONin lataus ja validointi, kuvadata ei tallennu eikä lähde laitteelta, kokoelmaan kirjoitus jaetun `collectionEntry.ts`:n kautta, PRIVACY.md 12 ja SECURITY.md.
Seuraavaksi: Koodari korjaa SEC-106-1 (ja -2), Digiturva varmistaa diffistä.
Varmistus (Digiturva, 2026-10-08): SEC-106-1 ja -2 korjattu commitissa 03cecd3 (`visibilitychange` pysäyttää streamin ja palaa painosvalintaan, `fail()` vapauttaa kameran kaikissa virhepoluissa, testi tarkistaa `stop()`-kutsun). **Veto poistettu, ja tietoturvan puolesta tehtävä on hyväksytty.**
