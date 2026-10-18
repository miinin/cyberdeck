# T-183 · Rikkomistestauksen löydösten korjaus (BRK-01–BRK-10)
**Tila:** Review · **Omistaja:** Koodari · **Lähde:** `docs/reports/BREAK-T178-T179.md` (T-180)
**Katselmoinnit:** PM (esikatselu). Digiturva-tarkistus ei pakollinen: ei uusia riippuvuuksia, sääntöjä tai tallennusta. Huomio: BRK-06 lisää uudelleenyrityksen Jaa-painikkeeseen (sama `publish`-kutsu kuin ennen).

## Määrittely (PM)
BRK-01 lukitus ja taustaklikkaus, BRK-02 Tarkista-taskut vain ehdotuksena + Hyväksy, BRK-03 Valitse kuva ilman kameraa, BRK-04 nimi, BRK-05 fokus, BRK-06 10 s:n raja + automaattinen uusinta, BRK-07 tunnuksen normalisointi, BRK-08 liian pieni tai kapea kuva, BRK-09 tuplaklikkaus Kumoa, BRK-10 0 korttia → painike pois, H-2 sivun otsikko reitin mukaan. CSS minimiin (toinen tiimi uudistaa styles.css:ää).

## Toteutus
- **BRK-01/09:** `BinderPageFlow` ohittaa klikkaukset 300 ms näkymän vaihdon jälkeen (Kumoa, Seuraava sivu, taskun avaus, Hyväksy) ja `addAll` ei käynnisty toista kertaa (`adding`-ref). Dialogin taustaklikkaus ei sulje skanneria `binder`-vaiheessa (`CardScanner.tsx`).
- **BRK-02/10:** `Pocket.suggestion`: Tarkista-tasku ei ole oletuksena valittu, solussa näkyy ehdotus ja viereinen "Hyväksy"/"Accept" (`aria-label` "Hyväksy tasku N: nimi"). Lisää-painikkeen yläpuolella "N tarkistettavaa" / "N to check" (Tarkista + Ei tunnistettu, joita ei ole käsitelty). Lisäys koskee vain varmoja ja hyväksyttyjä. Painike pois käytöstä, kun N = 0, ja syy näkyy valmiiksi.
- **BRK-03/04:** "Valitse kuva" näkyy aloitusvaiheessa (kansiosivutila) ja kameravirheen kohdalla (ei indeksivirheessä). Label ei ole enää `aria-hidden`. Ilman kameraa "Takaisin kameraan" palaa aloitukseen. Aloitusvaiheessa valittu kuva käyttää oletuseditiota (`edition`), joka tallennetaan kuten Aloita-painikkeella.
- **BRK-05:** fokus siirtyy "Lisätty"-tekstiin lisäyksen jälkeen ja Lisää-painikkeeseen Kumoa-painalluksen jälkeen.
- **BRK-06:** `ShareTradeButton`: jos `publish` hylätään `denied` ja linkki on jo jaettu, linkki kopioidaan heti, näytetään "Päivitetään hetken kuluttua." / "Updating in a moment." ja kirjoitus toistetaan 11 s edellisestä kirjoituksesta. Lopeta jakaminen ja poistuminen peruvat ajastuksen. Muistitoteutus noudattaa samaa 10 s:n sääntöä (`TRADE_SHARE_MIN_GAP_MS`).
- **BRK-07:** `normalizeTradeShareId` (decode, `?`-osan poisto, trim, pienet kirjaimet, perästä `/ . ) ,`) ennen muototarkistusta; tiukka `^[0-9a-f]{16}$` säilyy.
- **BRK-08:** `usablePictureSize`: lyhyempi sivu vähintään 300 px ja kuvasuhde enintään 4:1, muuten "Kuva on liian pieni tai kapea kansiosivuksi.".
- **H-2:** `document.title` reitin mukaan (Kortit, Kokoelma, Pakat, pakan nimi `DeckEditor`issa, Testaa, Have/Want, Proxy, Vaihtolinkki).
- CSS: yksi sääntö `.binder-accept`.

## Luovutus
Testit: binder-, TradeLink-, memory-, App-, useHashRoute- ja binderPage-testeihin lisätty testit jokaiselle korjaukselle. `npm run lint`, `tsc` ja `npm run build` läpi. Koko testisarja läpi; kerran `binderPage.test.ts` "does not call a picture of something else a sure card" epäonnistui koko sarjan kuormassa mutta läpäisi yksin kahdesti (koskematon koodi, todennäköisesti kuormaherkkä).
Koodikatselmointi: tehty · Pakollisia korjattu 0 · Suosituksia 2: (1) aloitusvaiheen Valitse kuva käyttää oletuseditiota ilman erillistä valintaa, (2) BRK-06 uusinta on yksi yritys: toinen hylkäys näyttää virheen.
Ei testattu selaimessa (jaon kirjautunut polku, kosketus).
