# T-188 · Korttidialogi ensin, merkkien tekstit, listan tyyppiväri, selectin viiste, välkyntä ja navin järjestys
**Tila:** In Progress · **Omistaja:** Koodari · **Lähde:** käyttäjän palaute 2026-10-20 T-187:n jälkeen (4 kuvaa)
**Katselmoinnit:** PM kuvakaappauksista. Ei tallennusta, riippuvuuksia eikä workflowta → ei Digiturvaa.

## Määrittely (PM)
1. **Selectin viiste:** "Numero"-lajitteluselectin oikeasta yläkulmasta puuttuu edelleen viistoviiva (muut kentät ovat kunnossa). Todennäköinen syy: selectin oma `background`-lyhenne (nuoli-ikoni) tai `appearance` kumoaa viistoviivan gradienttikerroksen. Korjaa kaikkiin selecteihin (lajittelu, setti, tagi ja muut), molemmissa teemoissa.
2. **Merkkien tekstit:** inforuudun merkit (cost, power, RAM) ovat käyttäjän mielestä lähellä hyvää, mutta jokaisen numeron merkitys pitää kertoa tekstillä. Lisää jokaisen merkin yhteyteen pieni tunniste (COST, POWER, RAM; label-tyyli, muted mutta AA) niin, että tunniste ja merkki muodostavat yhden tiiviin parin. Merkkien muodot säilyvät ennallaan.
3. **Listanäkymän tyyppi kortin värillä:** taulukon TYYPPI-sarakkeen teksti (LEGEND, UNIT …) näytetään kortin värillä (punainen, keltainen, vihreä tai sininen; AA molemmissa teemoissa, vaaleassa tummempi sävy), jotta väri erottuu yhdellä silmäyksellä.
4. **Korttidialogi ensin:** käyttäjä pitää korttidialogin ulkoasusta (kortti vasemmalla ja tiedot oikealla). Nyt kortin klikkaus avaa pelkän kallisteltavan kortin näkymän. Järjestys käännetään:
   - Kortin klikkaus ruudukossa (Kortit, Kokoelma › Omat ja Have/Want; myös galleria, jos sama reitti) avaa **korttidialogin** (`#/kortti/<key>`).
   - Korttidialogissa kortin kuvan klikkaus avaa **pelkän kallisteltavan kortin** näkymän (nykyinen iso näkymä). Sulkeminen palauttaa korttidialogiin ja fokukseen.
   - Näppäimistö ja ruudunlukija: kuvapainikkeen saavutettava nimi kertoo, mitä se avaa. Escape sulkee vain päällimmäisen.
   - Selvitä, mistä dialogi nyt avautuu (nimen klikkaus tms.), ja pidä se toiminnassa.
5. **Välkyntä:** korttidialogissa ruudun oikea yläneljännes välkkyy (glassmorphism, `backdrop-filter` dialogin taustakerroksessa, esim. `styles.css` noin rivit 1711 ja 7946). Selvitä syy (mittaa, missä tilanteessa välkyntä alkaa: hover, kallistus tai vieritys) ja korjaa se juurisyystä. Kirjoita luovutukseen kansantajuinen selitys syystä ja korjauksesta sekä yksi lause, jolla käyttäjä voi jatkossa pyytää samaa korjausta. Kirjaa oppi myös `docs/LESSONS.md`:hen.
6. **Navin järjestys:** pelin värit peräkkäin, sitten muut: Kortit (keltainen), Kokoelma (vihreä), Pakat (punainen), Have/Want (sininen), Testaa (violetti), Proxy (valkoinen). Sama järjestys desktopissa ja mobiilinavissa.

**Rajoitteet:** ei uusia liikkuvia koristeita, ei sisäistä vieritystä, ei vaakaylivuotoa, AA, reduced-motion, forced-colors.
Haara `t-188-korttidialogi` testistä.
