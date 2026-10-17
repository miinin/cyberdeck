# T-176 · Testaa-osio yläpalkkiin, sealedin nopea avaus ja vienti omiin pakkoihin
**Tila:** Review · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must · **Päätös:** D-036

## Määrittely
1. **Yläpalkki:** uusi linkki **Testaa** (en: Playtest) Proxyn edelle tai sopivaan kohtaan (App.tsx). Reitti `#/testaa` (alireitit esim. `#/testaa/sealed`, `#/testaa/boosterit`, `#/testaa/pelaa`). Osiossa on välilehdet Sealed, Boosterit ja Pelaa yksin. Pelaa yksin -välilehdellä listataan omat pakat, ja valinta avaa nykyisen goldfishin. Vanhat `#/pakat/sealed` ja `#/pakat/sealed/goldfish` ohjataan uusiin osoitteisiin. Sealed-välilehti poistuu Pakat-sivulta. Pakan sivun Pelaa yksin -linkki säilyy. Yläpalkin pitää mahtua 320 px:iin ilman ylivuotoa.
2. **Sealedin avaus:** yksi iso ensisijainen painike, joka pysyy samassa kohdassa koko avauksen ajan (ei pomppimista, mittaa `getBoundingClientRect`). Klikkaus (tai välilyönti/Enter, kohdistus pysyy painikkeessa) avaa pakkauksen ja kääntää kortit automaattisesti lyhyenä animaationa (`prefers-reduced-motion`: ei animaatiota). Seuraava klikkaus siirtää pakkauksen pooliin ja avaa seuraavan. Viimeisen jälkeen siirrytään rakentajaan. Lisäksi on toissijainen "Avaa kaikki loput", joka vie suoraan rakentajaan. BRK-04 säilyy: pooliin tallennetaan vain paljastettu pakkaus. Myös yksittäisten boosterien avaus (Boosterit-välilehti) toimii samalla yhden painikkeen mallilla.
3. **Vienti:** rakentajan yläosassa on aina näkyvä nimikenttä (oletus `Sealed <pvm>`, uniikki) ja painike "Tallenna omiin pakkoihin". Tallennuksen jälkeen viereen tulee "Avaa pakka", ja painikkeesta tulee "Tallenna muutokset", joka päivittää saman pakan (id tallennetaan sealed-ajoon). Jos pakka on poistettu, luodaan uusi. Sealed-ajon tietomuoto: lisää kenttä yhteensopivasti (vanha data latautuu, rikkinäinen id hylätään).

## Tarkistus
- Testit reiteille ja uudelleenohjaukselle, avauksen yhden painikkeen kululle (klikkausten määrä), "Avaa kaikki loput" -painikkeelle, tallennukselle ja uudelleentallennukselle sekä vanhan sealed-datan lataukselle.
- Kuvakaappaukset 320 ja 1280 px, vaalea ja tumma. Ei vaakaylivuotoa eikä sisäistä vieritystä.
- `npm test`, `npm run lint` ja `npm run build`. Riskialtis (tallennus): Digiturva katselmoi, ja muutos menee deviin ennen tuotantoa.

## Luovutus
Koodari, test-haara, ei pushattu. Testit 1991/1991, lint ja build läpi.

| Kohta | Tila | Mitattu |
|---|---|---|
| Yläpalkin Testaa-linkki, reitit `#/testaa/{sealed,boosterit,pelaa,sealed/pelaa}` | Valmis | 320 px: nav yhdellä rivillä, ei leikkautuneita tekstejä (fontti 9–10 px kapeilla); 1280 px nav 596 px |
| Vanhat osoitteet ohjataan (`location.replace`) | Valmis | Testit: `#/pakat/sealed` ja `/goldfish` sekä `#/testaa` korvautuvat |
| Sealed pois Pakat-sivulta, Pelaa yksin -lista omista pakoista | Valmis | Testit |
| Yhden painikkeen avaus, painike ei pompi | Valmis | getBoundingClientRect: sama x,y,leveys,korkeus ennen avausta, avauksen jälkeen, seuraavilla kierroksilla, Legend-pakkauksella ja Boosterit-välilehdellä (320: 16,319,288x64; 1280: 26,260,1035x64) |
| Klikkausmäärä | Valmis | 8 klikkausta (Avaa + 6 Seuraava + Siirry rakentamaan); sama elementti ja fokus säilyvät, välilyönti ja Enter testattu |
| Automaattinen käännös, reduced motion | Valmis | 70 ms/kortti; reduced motion kääntää kerralla (ei testattu jsdomissa) |
| Avaa kaikki loput, BRK-04 | Valmis | Testit: näytetty pakkaus mukaan, pooli 75; avaamaton pakkaus ei tallennu |
| Nimikenttä, Tallenna omiin pakkoihin / muutokset / Avaa pakka | Valmis | Testit: uniikki nimi, tyhjä nimi, sama pakka päivittyy, poistettu pakka luo uuden |
| Sealed-ajon `deckId` | Valmis | Valinnainen kenttä, vanha data latautuu, rikkinäinen id pudotetaan (ajo luetaan); schema ei muutu |
| Ylivuoto ja sisäinen vieritys | Ei löydöksiä | 320 ja 1280, vaalea ja tumma: scrollWidth = leveys, ei ylivuotavia elementtejä, ei sisäisiä vierityksiä |
Koodikatselmointi: tehty · Pakollisia korjattu 2 (ref renderöinnin aikana, painikkeen korkeus) · Suosituksia 2: käyttämättömät tekstit (revealAll, revealCard, stepOf) ja CSS (.sealed-start, pack-back--next) voi siivota. Tallennus on riskialtis: Digiturva katselmoi ja deviin ennen tuotantoa. Päivitys korvaa pakan sisällön (myös sivupakan), jos käyttäjä on muokannut sitä editorissa.
Kuvakaappaukset: scratchpad `out/`.

### Korjauskierros
| Kohta | Tila | Mitattu |
|---|---|---|
| Yläpalkki mobiilissa: 2 riviä (3+3), tasaleveät, 12 px | Valmis | 320, 375 ja 768 px, vaalea ja tumma: ei vaakavieritystä, ei leikkautuneita eikä päällekkäisiä linkkejä, linkin korkeus 44 px, fontti 12 px (768 px: yksi rivi, 18 px) |
| Tallenna muutokset: kysytään, jos pakkaa on muokattu muualla | Valmis | Tunniste: pakan `updatedAt` tallennetaan sealed-ajon kenttään `deckUpdatedAt` (valinnainen, enintään 40 merkkiä) jokaisen tallennuksen jälkeen. Eri arvo → kysely "Korvaa / Tallenna uutena / Peruuta", ennen vastausta ei kirjoiteta. Ilman leimaa (vanha ajo) tallennetaan suoraan. Päivitys käyttää lisäksi `expectedUpdatedAt`-suojaa. Testit: kysely, peruutus, uutena, korvaus, suora tallennus, kentän luku |
| Siivous | Valmis | Poistettu tekstit revealAll, revealCard, stepOf ja CSS .sealed-start, .sealed-step-of, .pack-back--next |
Testit 1994/1994 ovat läpi, lint ja build läpi. Kuvakaappaukset: scratchpad `out/nav-{320,375,768}-{light,dark}.png`.

### Digiturva-katselmointi
Digiturva 2026-10-17, `git diff 2796f9b..HEAD`. Raportti `docs/reports/SEC-T176.md`: Pakollinen 0, Suositus 1, Info 3. **Ei vetoa.** Suositus SEC-T176-1: jos ajossa on `deckId` mutta ei kelvollista `deckUpdatedAt`-leimaa (syntyy vain muokatusta tai rikkoutuneesta tallennuksesta), tallennus ylikirjoittaa pakan kysymättä ja ilman `expectedUpdatedAt`-suojaa. Korjaus: pudota id, jos leimaa ei ole, tai kysy aina. Riippuvuudet, firebase.json ja workflowt eivät muuttuneet, eikä salaisuuksia löytynyt. SECURITY.md:n luku 20 ja PRIVACY.md:n rivi 1f on päivitetty.

### PM · 2026-10-17 · Tila: valmis, dev
SEC-T176-1 korjattu: `parseSealedRun` säilyttää `deckId`:n vain yhdessä kelvollisen `deckUpdatedAt`-leiman kanssa, joten ajo ei voi ylikirjoittaa pakkaa ohi tarkistuksen. Testi lisätty. `npm test` 1994/1994, lint ja build läpi.
