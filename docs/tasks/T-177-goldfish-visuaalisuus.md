# T-177 · Goldfish-näkymän visuaalinen uudistus
**Tila:** Ready · **Omistaja:** Koodari · **MVP:** 1 · **Prioriteetti:** Must · **Päätös:** D-036
Käyttäjä: "Kortit näkyvät liian pienellä ja visuaalisuus esim. noppien osalta puuttuu kokonaan." Tavoite UX 5/5 ja koko näytön leveys.

## Määrittely
- **Kortit isommiksi:** käden ja kentän korttien on oltava luettavia ilman avaamista (työpöydällä n. 180–220 px leveitä, puhelimella 2 per rivi). Pelialue käyttää koko leveyden: kenttä ja Legendit ylhäällä pelipöytänä, käsi alhaalla. Valittu kortti nousee esiin.
- **Nopat visuaalisiksi:** Gig-nopat piirretään muotoinaan (d4 kolmio, d6 neliö, d8, d10, d12 ja d20 omina SVG-muotoinaan) arvo keskellä. Heitossa on lyhyt pyörimisanimaatio (`prefers-reduced-motion`: ei animaatiota). Varastetut ja käytetyt nopat erottuvat selvästi.
- **Tila näkyviin:** Eddiet, vuoro (x/7) ja varastetut Gigit selkeänä tulostauluna.
- Saavutettavuus säilyy (aria-labelit, live-alueet, kohdistus). Ei sisäistä vieritystä, ei pomppimista.

## Tarkistus
Kuvakaappaukset ennen ja jälkeen (320, 768 ja 1440 px, vaalea ja tumma). `npm test`, `npm run lint` ja `npm run build`.

## Luovutus
