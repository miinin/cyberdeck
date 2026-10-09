# T-120 · Oma kansio ja kannet

**Tila:** Review. **Päättäjä:** käyttäjä (2026-10-09: "kustomoitava kokoelman kansio, nykyinen/omat valinnat, sijoittelu kuten oikeassa kansiossa, etu- ja takakansi"; valinnat alla), PM (määrittely).

## Tavoite
Kokoelman Kansio-näkymässä (`CollectionBinder`, T-109/T-116) voi valita, näytetäänkö nykyinen setin numerojärjestys vai oma kansio, jonka kortit käyttäjä sijoittaa itse taskuihin kuten oikeassa keräilykansiossa. Kansiossa on myös etukansi ja takakansi.

## Käyttäjän päätökset
1. **Tallennus tälle laitteelle** (selaimen tallennus kuten muut asetukset). Ei synkronointia eikä Firestore- tai tietomallimuutoksia. Synkronointi kirjataan IDEAS.md:hen.
2. **Omaan kansioon voi sijoittaa vain omistettuja kortteja.**
3. **Kannet tyyliteltyinä ilman kuvia:** etukannessa kansion nimi ("Welcome to Night City" valmiissa kansiossa, oma nimi omassa kansiossa), keräystilanne ja cyberpunk-tyylinen kuvio. Takakannessa sama tyyli ilman tekstiä. Kannet näkyvät molemmissa tiloissa.

## PM:n tarkennukset
- **Tilan valinta:** Kansio-näkymän ohjausriville `SegmentedChoice` (T-118): "Setti" / "Oma kansio" (en: "Set" / "My binder"). Valinta tallennetaan `CollectionPrefs`:iin (`binder: 'set' | 'custom'`, oletus `'set'`). Vanhat tallennetut asetukset toimivat edelleen. "Näytä puuttuvat" näkyy vain setti-tilassa.
- **Oman kansion tallennus:** oma avain (esim. `cyberdeck:binder-layout`, sama etuliitekäytäntö kuin muissa asetuksissa), muoto `{ v: 1, name: string, pockets: (string | null)[] }`. Taskuissa on korttiavaimet. Lukeminen on puolustavaa: tallennettua dataa ei luoteta. Nimi on enintään 40 merkkiä ja trimmataan. Taskuja on enintään 900 (100 sivua), ja korttiavaimen pituus ja muoto tarkistetaan. Kelvoton data korvataan oletuksella eikä kaada näkymää. Kirjoitus- tai lukuvirhe ei kaada näkymää, ja tallennusvirhe näytetään hillitysti.
- **Ensimmäinen avaus:** kun omaa kansiota ei vielä ole, se alustetaan omistetuista korteista setin järjestyksessä (sama kuin `binderPockets` ilman puuttuvia), yksi kortti per tasku, sivut täynnä. Oletusnimi on "Oma kansio".
- **Sijoittelu ("Muokkaa"-kytkin, `SwitchButton`, vain omassa kansiossa):**
  - Napautus valitsee taskun (selvä korostus). Toisen taskun napautus vaihtaa kortit keskenään, tai siirtää kortin, jos kohde on tyhjä. Toimii kosketuksella, hiirellä ja näppäimistöllä (taskut ovat painikkeita muokkaustilassa). Hiirellä raahaus on bonus, ei pakollinen.
  - Valitun taskun toiminnot: "Tyhjennä tasku" ja "Vaihda kortti". Tyhjän taskun valinta avaa kortinvalitsimen: dialogi, jossa on haku nimellä ja lista omistetuista korteista. Korttia voi sijoittaa enintään omistettujen kopioiden verran (laske kopiot kuten `copiesInMainSets`, tai jos kortilla ei ole pääsettiversioita, `countOf`). Jo täynnä olevat kortit näkyvät valitsimessa himmeinä ja estettyinä. Valitsimessa ei saa olla sisäistä vieritystä (D: no inner scroll): dialogi kasvaa sivun mukana, tai lista rajataan hakutulosten mukaan.
  - "Lisää sivu" (tyhjä sivu loppuun) ja "Poista sivu", joka on käytössä vain tyhjälle sivulle (ei vahingossa katoavia kortteja). "Nimeä kansio" (tekstikenttä muokkaustilassa).
  - Muokkaustilassa sivujen kääntäminen toimii kuten ennenkin. Pyyhkäisy ei saa laukaista taskun valintaa.
- **Kortti, jota ei enää omisteta** (määrä laskenut): tasku säilyttää paikkansa ja näkyy puuttuvana haamuna. Tieto ei katoa.
- **Kannet:** etukansi on kirjan ensimmäinen ja takakansi viimeinen "sivu". Ne näkyvät yksinään, myös leveällä näytöllä, ja ovat sivun kokoisia. Sisäsivut näkyvät kuten nyt (leveällä aukeama 1–2, 3–4 …). Kansio avautuu etukannesta. Sijaintiteksti näyttää "Etukansi" / "Takakansi" / "Sivu x / n". Nuolet, näppäimet ja pyyhkäisy kulkevat kansien läpi. Etukannen keräystilanne: setti-tilassa "x / y korttia", omassa kansiossa korttien määrä. Tyyli on teeman mukainen (kansio on tumma molemmissa teemoissa, T-109) ja tehdään CSS:llä ilman kuvatiedostoja.
- Domain-logiikka (asettelun muokkaus: vaihto, siirto, tyhjennys, sivun lisäys ja poisto, alustus, kopiorajat, kansien sivunumerointi) puhtaina funktioina `src/domain/binder.ts`:ssä tai uudessa `binderLayout.ts`:ssä, ja niille yksikkötestit.

## Hyväksymiskriteerit
- [ ] Setti ja Oma kansio -valinta toimii ja säilyy uudelleenlatauksessa. Setti-tila toimii kuten nyt, kansilla lisättynä.
- [ ] Oma kansio alustuu omistetuista korteista. Vaihto, siirto, tyhjennys, kortin valinta (vain omistetut, kopioraja), sivun lisäys ja tyhjän sivun poisto sekä nimeäminen toimivat ja säilyvät uudelleenlatauksessa.
- [ ] Kelvoton tai liian suuri tallennettu asettelu ei kaada näkymää (testi).
- [ ] Etu- ja takakansi molemmissa tiloissa. Navigointi ja sijaintiteksti ovat oikein kapealla ja leveällä näytöllä.
- [ ] Tekstit fi ja en (`collectionTexts.*`). Saavutettavuus: valittu tasku `aria-pressed`, ja muutokset ilmoitetaan `role="status"`-elementillä.
- [ ] Ei sisäistä vieritystä, ei päällekkäisyyksiä 320 px:llä. Leveällä näytöllä käytetään koko leveyttä kuten nyt.
- [ ] Testit domainille, repositorylle (tallennus ja puolustava luku) ja näkymälle (tilan vaihto, vaihto kahden taskun välillä, valitsin, kannet). `npm test`, `npm run lint`, `npm run build` läpi.

## Rajaukset
- Ei uusia riippuvuuksia, ei Firestore-, synkronointi- tai sääntömuutoksia.
- Riski: uusi paikallinen tallennusavain ja tallennetun datan jäsennys. Digiturva tekee kevyen katselmoinnin (D-029: testataan devissä ennen julkaisua).

## Luovutus

### Koodari (2026-10-09) · Review
Toteutettu suoraan `test`-haaraan (D-029). Muutokset:
- **Domain:** `binder.ts` (`placeableCopies`, `pocketFor`, kirjan näkymät `bookViews`/`viewIndexOfSheet`/`sheetOfView`/`turnBook`: etukansi = sheet 0, sivut 1..n, takakansi n+1) ja uusi `binderLayout.ts` (asettelun jäsennys `normalizeBinderLayout`, alustus, vaihto/siirto, `setPocket`, sivun lisäys ja poisto vain tyhjälle sivulle, kopiorajat, `pocketsBacked` = ylimääräiset tai omistamattomat taskut haamuina).
- **Tallennus:** `CollectionPrefs.binder: 'set' | 'custom'` (oletus `set`, vanhat asetukset toimivat), uusi avain `cyberdeck:binder-layout` ja `preferences.loadBinderLayout/saveBinderLayout`. Lukeminen puolustava: kaikki kelvoton (ei JSON, väärä versio, väärä korttiavain `isCardKey`, yli 900 taskua) palautuu `null`:ksi, ja näkymä alustaa uuden asettelun. Nimi trimmataan ja katkaistaan 40 merkkiin, taskut täytetään täysiksi sivuiksi. Ei Firestore-, sääntö- tai riippuvuusmuutoksia.
- **UI:** `CollectionBinder.tsx` (Setti / Oma kansio `SegmentedChoice`, Muokkaa-`SwitchButton`, taskut painikkeina muokkaustilassa `aria-pressed`, vaihto/siirto kahdella napautuksella, Tyhjennä tasku, Vaihda kortti, Lisää sivu, Poista sivu N, Kansion nimi, `role="status"`-ilmoitukset, `role="alert"` tallennusvirheelle, pyyhkäisyn jälkeinen napautus ohitetaan), uusi `BinderCardPicker.tsx` (natiivi `dialog`, haku nimellä, enintään 8 tulosta ja "Tarkenna hakua", täynnä olevat korttit `disabled`, ei sisäistä vieritystä), `useBinderLayout.ts`. Kannet CSS:llä (`.binder-cover*`), aina yksinään ja sivun kokoisia (`aspect-ratio: 2/3`). Kansio avautuu etukannesta, sijaintiteksti "Etukansi" / "Takakansi" / "Sivu x / n".
- **Tekstit:** fi ja en (`collectionTexts.*`). Kortti ei antanut UI-tekstejä, joten kirjoitin ne itse (esim. "Oma kansio", "Muokkaa", "Tyhjennä tasku", "Vaihda kortti", "Lisää sivu", "Poista sivu N", "Kansion nimi", kortinvalitsimen tekstit ja ilmoitukset). PM tarkistakoon sanamuodot.
- **Valinnat, jotka PM voi muuttaa:** (1) "Poista sivu" poistaa valitun taskun sivun tai muuten näkyvän (vasemman) sivun; (2) oletusnimi tallennetaan tyhjänä ja näytetään kielen oletusnimellä, joten se seuraa kieltä; (3) "Näytä puuttuvat" -vaihto vie ensimmäiselle sivulle; (4) hiirellä raahausta ei toteutettu (bonus); (5) oma kansio alustuu ja tallennetaan heti ensimmäisellä avauksella.
- **Testit:** `binderLayout.test.ts` (domain), repositorytestit (prefs.binder, layout-tallennus ja puolustava luku mm. 901 taskua, väärä avain), `CollectionBinderCustom.test.tsx` (tilan vaihto, kannet, alustus, vaihto/siirto, valitsin ja kopiorajat, sivun lisäys/poisto, nimeäminen, omistamaton kortti haamuna, kelvoton tallennettu data, tallennusvirhe), vanhat kansiotestit päivitetty avautumaan kannelta.
- **Tulokset:** `npm test` 119 tiedostoa / 1599 testiä läpi, `npm run lint` läpi, `npm run build` läpi.
- Visuaalista tarkistusta selaimessa 320 px:llä ja leveällä en tehnyt: PM katsokoon kannet ja muokkaustilan esikatselusta (ei päällekkäisyyksiä, ei sisäistä vieritystä oli suunnitteluperiaate).
- Koodikatselmointi: tehty · Pakollisia korjattu 2 (lint: ref renderöinnissä, impure Date.now käsittelijässä) · Suosituksia 2 (velka: oman kansion sisältö ei synkkaudu tilille, ks. IDEAS; raahaus hiirellä).
- Luovutus: PM (esikatselu), Digiturva (kevyt katselmointi: uusi paikallinen avain `cyberdeck:binder-layout` ja sen jäsennys `normalizeBinderLayout`).
