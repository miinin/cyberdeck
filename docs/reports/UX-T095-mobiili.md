# UX-T095: Mobiilin muutosten katselmointi (T-087–T-093)

- Kohde: https://cyberdeck-tcg-dev.web.app, 390 x 844 (mobiili-emulaatio, Edge headless). 1440 px ja 200/400 % zoom eivät mahtuneet aikarajaan.
- Menetelmä: kuvakaappaukset (Kortit, Suodattimet, Lista, kortin tietonäkymä ja koko ruudun kuva, pakkaeditori 42 + 6 SB -testipakalla, tilastokortit) sekä DOM-mittaukset (ylivuoto, kosketuskohteet, fokus). axe/Lighthouse ei ajettu tässä katselmoinnissa.
- Veto-päätös: **ei vetoa**, mutta löydös 1 korjataan ennen julkaisua.

## Löydökset (vakavuusjärjestyksessä)

| # | Vakavuus | Sijainti | Löydös | Korjausehdotus |
|---|---|---|---|---|
| 1 | Korkea | Pakkaeditori, "Lisää kortteja" -rivit (T-092) | Rivillä, jolla pakassa on jo 3 kappaletta, näkyy ylimääräinen "+ SB" -painike (x=370, leveys 42 px), joka ylittää 390 px:n näkymän (oikea reuna 412). Sivu saa 23 px vaakavierityksen (scrollWidth 413) ja painike leikkautuu. Rikkoo "ei sivuttaisvieritystä" -vaatimuksen ja WCAG 1.4.10:n (reflow). | Anna Pakassa-sarakkeen painikkeille rivitys (`flex-wrap`) tai pienennä sarakkeen täytettä. Vaihtoehto: siirrä "+ SB" omalle rivilleen kuvaustekstin alle alle 480 px leveydellä. Tarkista 320 px. |
| 2 | Keskitaso | Pakkaeditori, + SB / → SB / → Pää / − / + (T-092) | Painikkeiden korkeus 28 px ("+ SB", "→ SB", "→ Pää", ±). Täyttää WCAG 2.5.8 (24 px), mutta ei 44 px:n tavoitetta, ja painikkeet ovat tiiviisti vierekkäin (virhenapautusriski, erityisesti − ja + vierekkäin, joista toinen poistaa kortin). | Nosta korkeus 36–44 px:iin, kasvata väliä, tai korosta tuhoava − visuaalisesti. |
| 3 | Keskitaso | Suodattimet (T-087) | Avattu suodatinpaneeli on noin 1300 px korkea, ja "Näytä N korttia" on vasta sen lopussa (ei kiinnitetty). Ylhäällä oleva lukumäärä ("60 / 151 korttia") päivittyy, mutta tuloksia ei näe ennen sulkemista, joten ensimmäisten valintojen vaikutus on piilossa. | Kiinnitä "Näytä N korttia" -painike näkymän alareunaan (sticky) paneelin ollessa auki, kuten pakkaeditorin "Näytä pakka" -palkki. |
| 4 | Keskitaso | Suodatinchipit (Cost, Power, RAM, Harvinaisuus) | Chipit ovat noin 34 x 28 px, tiheästi. Toimivat, mutta kosketustarkkuus on heikko puhelimella. | Korkeus vähintään 36–40 px; chipeille rivinvaihto jo on, joten tila riittää. |
| 5 | Matala | Koko ruudun kuva (T-088) | Näkyvää sulkemispainiketta ei ole. Kuva itse on sulkupainike ("Sulje koko ruudun kuva"), mutta vihje puuttuu. Taustalla oleva tietonäkymän otsikko ja laskurit näkyvät himmeinä läpi (häiritsevä sisältö). | Lisää näkyvä "Sulje"-painike (X) kulmaan tai teksti "Napauta sulkeaksesi". Tummenna tausta täysin. |
| 6 | Matala | Nostotodennäköisyydet (T-093) | Korttinimet typistyvät ("El Sombrerón, La Veng…", "Meredith Stout, S…"); alaotsikko katoaa, joten saman nimisiä kortteja ei voi erottaa. Ei rivityksen vaihtoehtoa. | Anna alaotsikon rivittyä tai näytä se omalla rivillään. Lisää `title`/saavutettava nimi koko nimestä. |
| 7 | Matala | Kustannuskäyrä (T-093) | Valitun pylvään korostus on vain 2 px:n valkoinen kehys keltaisella pohjalla, sen alla avautuvat kortit työntävät sisältöä (sisältöhyppy ~110 px). Eri väristen tyyppien erottelu riippuu pelkästä värilegendasta, kun tyyppejä on useita. | Lisää valitulle pylväälle muu kuin värimerkki (esim. paksumpi kehys + alapalkki). Varaa korttilistalle kiinteä minimikorkeus tai animoi ilman hyppyä; kunnioita `prefers-reduced-motion`. |
| 8 | Matala | Sideboard-rivit (T-092) | Tyhjän/täyden sideboardin tila ("6/7") näkyy otsikossa ja renkaassa, mutta "+ SB" ei kerro, onko tila täynnä. Ei testattu 7/7-tilaa. | Poista käytöstä tai selitä ("Sideboard täynnä") kun 7/7. |

## Todettu hyväksi
- Mobiilin yläpalkki (T-087): logo, teema, kieli ja tili mahtuvat 390 px:iin, nav-välilehdet isoja ja selkeitä, yksi h1.
- Lista-näkymä (T-090): korttirivit rivittyvät hyvin, kuva + nimi + Cost/Power/RAM + laskuri luettavissa, ei vaakavieritystä.
- Kortin tietonäkymä (T-088): koko ruudun dialogi (390 x 844), kuva ja laskurit rinnakkain, fokus siirtyy "Sulje"-painikkeeseen, versiot ja pakkalista selkeät.
- Pakan tilastot (T-093): renkaat, donitsi ja palkit luettavia, ei sisäisiä vieritysalueita, napautettavat pylväät toimivat ja saavat kehyksen.
- Sideboard-ryhmän otsikot (Pääpakka (42), Sideboard (6/7)) ovat h2-otsikoita; "puuttu 3" -ilmaisu on selkeä.
- Kelluva "Näytä pakka" -palkki (Pakka 42/40-50, Legendit 3/3, 1 ongelma) on informatiivinen.

## Tarkistamatta
- 1440 px, 200 % ja 400 % zoom, 320 px, näppäimistöpolku ja ruudunlukijan puu sekä axe-ajo. Suositus: aja axe ja 320 px -tarkistus korjauksen (löydös 1) jälkeen.
