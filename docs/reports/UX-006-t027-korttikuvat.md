# UX-006 · T-027 korttikuvat ja T-026 kevyt katselmointi · 2026-10-02

**Katselmoija:** UX Designer · **Esikatselu:** https://cyberdeck-tcg-test--pr9-t-027-korttikuvat-p3uj9kea.web.app (PR #9) · **Veto: ei**

## Yhteenveto
Critical 0, High 0, Medium 0, Low 3. Ei blokkaavia löydöksiä. Toteutus vastaa UX-määrittelyä.

## Menetelmä
- axe-core (`@axe-core/playwright`, tagit wcag2a/2aa/21aa/22aa) Chromella esikatselu-URL:ssa: **0 rikkomusta** listassa (320 px tumma, 1280 px vaalea) ja avoimessa dialogissa (molemmat). Lisäksi ilman tageja, kun kaikki kuvapyynnöt estetty: 0 rikkomusta.
- Manuaalinen skriptattu tarkistus: näppäimistö (Enter avaa), fokus, Esc, taustaklikkaus, taustan inertti, zoom 200 % (640 px) ja 400 % (320 × 256 px), 320 px, kuvien lataus, paikkamerkki. Ruudunlukijaa ei ajettu, semantiikka tarkistettu koodista ja DOM:sta.
- Rajoite: headless-Chromen vierityspalkki on peittävä, joten vierityspalkin hyppyä ei voitu mitata. Arvio perustuu CSS:ään.

## Tulokset (tarkistuslista)
| Kohta | Tulos |
|---|---|
| Lista 320 px | Ei vaakavieritystä. Kuva rivillä 2, nimi ja "+" rivillä 1, tyyppi ja hinta kuvan vieressä. Luettava. |
| Lista 200 % / 400 % | Ei vaakavieritystä (hscroll false kaikissa). |
| Laiska lataus | 0 – 7 / 151 kuvaa ladattu avauksessa, loput vierittäessä. Ei virhepyyntöjä. |
| Painikkeen koko | 48 × 67 px (mobiili), 56 × 78 px (desktop), yli 44 px. |
| Dialogi aukeaa | `open`, otsikko `V, Streetkid`, kuva 720 px, `alt` = kortin nimi. |
| Fokus | Menee `Sulje`-painikkeeseen. Esc sulkee, ja fokus palaa pikkukuvan nappiin. Taustan klikkaus sulkee. Tausta on inertti (`showModal`). |
| Dialogi 320 px | Leveys 296 px, ei ylivuotoa. |
| Dialogi 400 % | Dialogi vieritettävä (scrollHeight > clientHeight), `Sulje` näkyvissä ylhäällä, fokusrengas näkyy kokonaan. |
| Paikkamerkki | Kun kuvat estetty, `onError` vaihtaa katkoviivakehykseen (13 paikkamerkkiä, ei nappia), axe 0, ei näkymän rikkoutumista. |
| Kontrasti | `Sulje` ja otsikko käyttävät olemassa olevia tokeneita (UX.md 7.6), ei uusia värejä. Fokusrengas näkyy kuvankaappauksessa. |
| Liike | Ei animaatioita. |

## Löydökset

### UX-040 · Sivu hyppää dialogin avauksessa vierityspalkin kohdalla · Low
**Sijainti:** `src/styles.css` `body:has(dialog[open]) { overflow: hidden }` · **Tehtävä:** T-027
**Toistaminen:** 1) Desktop-selain, jossa on perinteinen vierityspalkki (Windows). 2) Avaa kuva. **Odotettu:** taustasivu pysyy paikallaan. **Havaittu (CSS-päättely, ei mitattu):** palkki katoaa ja sisältö siirtyy noin 15 px, mutta dialogi peittää taustan tummennuksella.
**Vaikutus:** kosmeettinen, taustan hyppy näkyy vain 75 % tummennuksen läpi. Ei vaikuta käyttöön.
**Korjausehdotus:** yksi rivi, `html { scrollbar-gutter: stable; }`. Hyväksytään, jos Koodari tekee sen saman tien (ei muuta sivun asettelua muuten), muuten velka. **Ei blokkaa.**
**Tila:** Avoin (suositus)

### UX-041 · Ison kuvan uudelleenyritystä ei ole · Low
**Sijainti:** `CardImageDialog.tsx` (`failedKey`) · **Toistaminen:** katkaise verkko dialogin avauksen aikana, sulje ja avaa sama kortti. **Havaittu:** virheteksti säilyy sivun uudelleenlataukseen asti.
**Vaikutus:** kuvat ovat omalla originilla, vuoden välimuisti ja tiivisteelliset URL:t, joten virhe on harvinainen (lähinnä katkennut mobiiliverkko). Kiertotie: päivitä sivu.
**Korjausehdotus:** velka, ei nyt. Jos tehdään: nollaa `failedKey` kun dialogi sulkeutuu (`onClose`), jolloin uusi avaus yrittää uudelleen (2 riviä, ei uutta painiketta). **Ei blokkaa.**
**Tila:** Avoin (velka, PM päättää)

### UX-042 · Sarkain ei kierrä dialogin sisällä (vain `Sulje` on fokusoitava) · Low (Info)
**Havaittu:** Tab dialogissa siirtyy selaimen käyttöliittymään ja takaisin `Sulje`-painikkeeseen. Tämä on natiivin modaalin normaali käytös ja WCAG-yhteensopiva. Ei toimenpiteitä.
**Tila:** Hyväksytty

## T-026 kevyt katselmointi (poistuneet tilat)
- Sovellus avautuu suoraan listaan ilman latausta (151 korttia näkyy heti), ei virheitä konsolissa, axe 0.
- Poistuneista tiloista ei ole jäänyt näkyviin tekstiä, painiketta tai kuollutta latauspalkkia käyttöliittymään (tarkistettu DOM:sta). Hakua ja suodatinta ei voi enää jättää piiloon lataustilan takia, joten kohta "Haku ja suodattimet" (UX.md 5.8) on aina näkyvissä.
- Ei ominaisuuden heikennystä: live-alueen tulosilmoitukset suodatukselle säilyvät.
- **Korjattu UX.md:ssä:** vanhentuneet kohdat (4.2, 4.5, 7.5, 7.7, 7.9, 7.10, johdannon liikeluettelo 3.x) merkitty vanhentuneiksi ja versiohistoria päivitetty (0.10). Uusi luku 9 kuvaa korttikuvat.
- Löydöksiä ei ole.

## Veto-päätös
**Ei veto-oikeuden käyttöä.** T-027 ja T-026 voidaan UX:n osalta merkitä katselmoiduiksi. Suositukset UX-040 ja UX-041 voivat edetä erikseen.
