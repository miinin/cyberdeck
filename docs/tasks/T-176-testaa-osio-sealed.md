# T-176 · Testaa-osio yläpalkkiin, sealedin nopea avaus ja vienti omiin pakkoihin
**Tila:** In progress · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must · **Päätös:** D-036

## Määrittely
1. **Yläpalkki:** uusi linkki **Testaa** (en: Playtest) Proxyn edelle tai sopivaan kohtaan (App.tsx). Reitti `#/testaa` (alireitit esim. `#/testaa/sealed`, `#/testaa/boosterit`, `#/testaa/pelaa`). Osiossa on välilehdet Sealed, Boosterit ja Pelaa yksin. Pelaa yksin -välilehdellä listataan omat pakat, ja valinta avaa nykyisen goldfishin. Vanhat `#/pakat/sealed` ja `#/pakat/sealed/goldfish` ohjataan uusiin osoitteisiin. Sealed-välilehti poistuu Pakat-sivulta. Pakan sivun Pelaa yksin -linkki säilyy. Yläpalkin pitää mahtua 320 px:iin ilman ylivuotoa.
2. **Sealedin avaus:** yksi iso ensisijainen painike, joka pysyy samassa kohdassa koko avauksen ajan (ei pomppimista, mittaa `getBoundingClientRect`). Klikkaus (tai välilyönti/Enter, kohdistus pysyy painikkeessa) avaa pakkauksen ja kääntää kortit automaattisesti lyhyenä animaationa (`prefers-reduced-motion`: ei animaatiota). Seuraava klikkaus siirtää pakkauksen pooliin ja avaa seuraavan. Viimeisen jälkeen siirrytään rakentajaan. Lisäksi on toissijainen "Avaa kaikki loput", joka vie suoraan rakentajaan. BRK-04 säilyy: pooliin tallennetaan vain paljastettu pakkaus. Myös yksittäisten boosterien avaus (Boosterit-välilehti) toimii samalla yhden painikkeen mallilla.
3. **Vienti:** rakentajan yläosassa on aina näkyvä nimikenttä (oletus `Sealed <pvm>`, uniikki) ja painike "Tallenna omiin pakkoihin". Tallennuksen jälkeen viereen tulee "Avaa pakka", ja painikkeesta tulee "Tallenna muutokset", joka päivittää saman pakan (id tallennetaan sealed-ajoon). Jos pakka on poistettu, luodaan uusi. Sealed-ajon tietomuoto: lisää kenttä yhteensopivasti (vanha data latautuu, rikkinäinen id hylätään).

## Tarkistus
- Testit reiteille ja uudelleenohjaukselle, avauksen yhden painikkeen kululle (klikkausten määrä), "Avaa kaikki loput" -painikkeelle, tallennukselle ja uudelleentallennukselle sekä vanhan sealed-datan lataukselle.
- Kuvakaappaukset 320 ja 1280 px, vaalea ja tumma. Ei vaakaylivuotoa eikä sisäistä vieritystä.
- `npm test`, `npm run lint` ja `npm run build`. Riskialtis (tallennus): Digiturva katselmoi, ja muutos menee deviin ennen tuotantoa.

## Luovutus
