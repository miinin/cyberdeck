# SEC-179 · Kansiosivun skannaus (T-179)
**Katselmoija:** Digiturva · **Päivä:** 2026-10-18 · **Kohde:** `git diff origin/test...origin/t-179-kansiosivun-skannaus` (commit 417306b) · **Laajuus:** kevyt katselmointi, ei uhkamallia (ei merkittäviä löydöksiä)

## Yhteenveto
- **Löydökset:** Critical 0, High 0, Medium 0, Low 1, Info 3.
- **Veto:** ei. Saa julkaista. SEC-179-1 voidaan korjata tässä tai velkana.

## Tarkistetut alueet, joista ei löytynyt mitään
- **Tiedostosyöte** (`src/ui/binderImage.ts`, `src/domain/binderPage.ts`): tyyppi `image/*`, koko 1 tavu – 25 Mt tarkistetaan ennen dekoodausta (`acceptableImageFile`). Dekoodaus `createImageBitmap(file, { imageOrientation: 'from-image' })`, joten selain dekoodaa kuvan ilman DOMia eikä skriptiä ajeta (myös SVG:llä ei skriptejä). `bitmap.close()` on `finally`-lohkossa. Skaalaus pisin sivu enintään 2400 px (`limitedSize`, myös nollakoolla tulos ≥ 1 px). Kaikki virheet näyttävät yleisen tekstin "Kuvaa ei voitu lukea", eikä tiedoston nimeä tai virheen sisältöä näytetä. `input.value = ''` nollaa valinnan.
- **Objekti-URL:t:** `URL.createObjectURL`ia ei käytetä lainkaan. Solukuvat piirretään canvasille `putImageData`lla, ei `toDataURL`ia eikä `<img src>`:tä käyttäjän datasta.
- **Muisti:** sivukuva (enintään 2400 × 2400 × 4 ≈ 23 Mt) elää vain React-tilassa. Se tyhjennetään Seuraava sivu-, Takaisin- ja Peruuta-toiminnoissa sekä näkymän piilotuksessa (`visibilitychange`). Kuvaa ei tallenneta eikä lähetetä. Uusia `fetch`-kutsuja, verkkoyhteyksiä tai lokitusta ei ole.
- **Kameran kaappaus** (`takeBinderPhoto`): sama `coverCropSource`-rajaus kuin aiemmin, `grabPixels` rajaa koon. Virrankäsittely (sammutus sulkiessa ja piilotettaessa, SEC-106) on ennallaan. Jatkuvan tilan ajastin käyttää `active`-tilaa, joten se ei käy kansiosivutilassa.
- **Tallennus kokoelmaan:** lisäys kulkee olemassa olevan `addCopies`/`removeCopies`-polun kautta, joten MAX_COPIES-raja ja painoskäytäntö (D-035) pysyvät. Ylitys peruu jo lisätyt. Painike on `busy`-tilassa disabloitu, eikä lisäystä voi tehdä kahdesti (näkymä vaihtuu Kumoa-tilaan). Saman kortin eri taiteet odottavat tallennuksen (`whenSaved`).
- **Pakkaan skannaus:** `active` pakottaa tilan `single`, kun `deck` on annettu, joten kansiosivutila ei pääse pakan polkuun.
- **XSS:** korttien nimet ja tekstit renderöidään React-tekstinä. Ei `dangerouslySetInnerHTML`:ää.
- **Paikallinen avain `cyberdeck:scan-grid`:** sallitut arvot `3x3`/`3x4`, tuntematon arvo → `3x3`, kirjoitus hylkää muut arvot (`invalid-input`). `cyberdeck:scan-mode` hyväksyy `binder`, ja tuntematon arvo → `single`. Testit ovat mukana.
- **Riippuvuudet, konfiguraatio:** `package.json`, `package-lock.json`, `firebase.json`, `index.html` (CSP) ja workflowt eivät muuttuneet, joten `npm audit` ei ollut tarpeen. Lisätyissä riveissä ei ole salaisuuksia eikä URL-osoitteita.

## Löydökset

### SEC-179-1 · Osittain epäonnistunut Kumoa tai peruutus jättää kokoelman ristiriitaiseen tilaan · Low
- **Sijainti:** `src/ui/BinderScan.tsx`, `undo` (noin rivi 389) ja `addAll`:n peruutushaara (noin rivi 374).
- **Toistaminen:** lisää sivu, jossa on useita eri kortteja. Kumoa-painalluksen aikana kokoelman tila muuttuu muuksi kuin `ready` (esim. synkronoinnin uudelleenlataus tai tilin vaihto), jolloin `removeCopies` palauttaa `unavailable` kesken listan. Jo poistetut erät on poistettu, mutta `added` säilyy kokonaisena. Kun käyttäjä painaa Kumoa uudelleen, samat erät poistetaan toiseen kertaan, ja myös käyttäjän aiemmin omistamia kopioita poistuu. Vastaavasti `addAll`:n peruutus ei tarkista omaa tulostaan, joten epäonnistunut peruutus jättää osan sivusta kokoelmaan ilman ilmoitusta.
- **Vaikutus:** kokoelman eheys: väärät määrät, harvinainen ajoitus, käyttäjä voi korjata käsin. Tietoturvavaikutusta ei ole.
- **Korjausehdotus:** päivitä `undo`:ssa `added` jäljelle jääviin eriin (`added.filter(b => !result.done.includes(b))`) ennen virheilmoitusta, jotta uusi Kumoa poistaa vain jäljellä olevat. `addAll`:ssa tarkista peruutuksen `failed`, ja jos se ei onnistunut, näytä lisätyt erät Kumoa-tilassa (tai viesti "Osa korteista jäi kokoelmaan"). Lisää UI-testi, jossa store menee kesken tilaan, joka ei ole `ready`.

### SEC-179-2 · Pakkauspommi: pieni tiedosto, valtavat mitat · Info
- **Sijainti:** `src/ui/binderImage.ts`, `readImageFile`.
- **Havainto:** 25 Mt:n raja koskee tiedoston kokoa, ei pikselimittoja. Esimerkiksi PNG voi ilmoittaa mitoiksi 30 000 × 30 000, jolloin `createImageBitmap` varaa gigatavuja ennen skaalausta. Seurauksena selain hylkää kuvan (virheteksti) tai välilehti kaatuu.
- **Vaikutus:** vain paikallinen palvelunesto: käyttäjä valitsee tiedoston itse, eikä tietoa vuoda. Hyväksyttävä riski.
- **Ehdotus (valinnainen):** `createImageBitmap(file, { resizeWidth, resizeQuality })` ei estä täyttä dekoodausta kaikissa selaimissa, joten erillistä korjausta ei vaadita. Tarvittaessa PNG- tai JPEG-otsakkeen mitat voi lukea ennen dekoodausta ja hylätä kuvat, joiden koko ylittää esim. 50 Mpx.

### SEC-179-3 · Galleriakuvan metatiedot · Info
- Valitun kuvan EXIF-tietoja (esim. sijainti) ei lueta suuntaa lukuun ottamatta, ja ne häviävät dekoodauksessa. Kuvassa voi näkyä muutakin kuin kansiosivu (esim. ihmisiä), mutta se käsitellään vain muistissa. PRIVACY.md:n luvussa 12 on nyt maininta tästä.

### SEC-179-4 · PRIVACY.md luku 12 päivitetty · Info
- Luvussa luki "Uusia tallennusavaimia ei synny", vaikka T-108 lisäsi `cyberdeck:scan-mode`-avaimen ja T-179 lisää `cyberdeck:scan-grid`-avaimen. Kumpikin on asetus, ei henkilötieto. Digiturva lisäsi lukuun kansiosivun tiedostosyötteen ja avaimet sekä muutoshistoriarivin. Erillistä tietoinventaariorivia ei tarvita (vrt. teemavalinta, rivi 10). PM voi halutessaan siirtää ne inventaarioon.
