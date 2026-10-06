# SEC-047: T-047 Netdeck-haun kovennus (SEC-023, SEC-024)

**Katselmoija:** Digiturva · **Päivä:** 2026-10-06 · **Haara:** t-047-netdeck-kovennus · **Diff:** `origin/test...origin/t-047-netdeck-kovennus`

## Muutos
- `src/netdeck/fetchNetdeckDeck.ts`: `response.text()` korvattu `readLimited`-funktiolla. Se lukee rungon `getReader()`-silmukassa ja `TextDecoder`-virtadekoodauksella. Kun 512 k merkin raja ylittyy, se peruuttaa lukijan (`reader.cancel()`) ja pyynnön (`controller.abort()`) ja heittää `too-large`.
- `src/domain/netdeckDeck.ts`: kun nimi puuttuu, tunnistamattoman rivin id näytetään muodossa `cleanText(row.id, 1, 64) ?? '?'`.
- Testit: päättymätön virta pysähtyy rajalle ja peruuntuu, ja bidi- ja ohjausmerkit siivotaan id:stä.

## Tulos: ei löydöksiä (Critical 0, High 0, Medium 0, Low 0). SEC-023 ja SEC-024 todettu korjatuiksi.

## Tarkistetut alueet
- **Dekoodaus:** `decode(value, { stream: true })` säilyttää palojen väliin katkenneet monitavuiset merkit. Viimeinen `decode()` (kun `done`) tyhjentää puskurin, ja raja tarkistetaan myös sen jälkeen. BOM:n ja virheellisen UTF-8:n käsittely on sama kuin `response.text()`:ssä.
- **Body null:** palataan `response.text()`:iin, joka antaa tyhjän merkkijonon. Raja tarkistetaan silti, ja tyhjä runko johtaa `invalid-response`-virheeseen.
- **Roikkuminen:** `reader.cancel()`:n hylkäys niellään (`void … .catch`), ja `controller.abort()` katkaisee taustalla olevan yhteyden. `too-large` on `NetdeckFetchError`, joten se ohittaa catch-haaran uudelleenluokittelun. Ajastin ja kuuntelija poistetaan `finally`:ssä kuten ennenkin.
- **Aikakatkaisu ja kutsujan abort:** sama `controller.signal` välitetään fetchille, joten oikea fetch hylkää myös kesken olevan `reader.read()`:n. Virhe ohjautuu ennallaan joko `timeout`-virheeksi tai kutsujan omaksi `reason`-arvoksi. Content-Length-esitarkistus on ennallaan.
- **SEC-024:** `cleanText` poistaa ohjaus- ja bidi-merkit ja normalisoi NFC:hen. Yli 64 merkin tai tyhjä id näytetään muodossa `?`. Renderöinti tapahtuu tekstinä, joten XSS-pintaa ei ole.
- **Riippuvuudet ja salaisuudet:** ei muutoksia riippuvuuksiin, joten `npm audit` ei ollut tarpeen. Diffissä ei ole salaisuuksia.
- **Testit:** `src/netdeck` ja `netdeckDeck.test.ts` menivät läpi (49/49).

## Huomiot (ei löydöksiä)
- Yksittäinen pala voi ylittää rajan ennen tarkistusta. Selaimen verkkopalat ovat kuitenkin kymmenien kilotavujen kokoisia, joten muistihuippu pysyy rajan luokassa.
- Testeissä ei ole tapausta, jossa monitavuinen merkki katkeaa palojen väliin tai aikakatkaisu laukeaa kesken rungon luvun. Toteutus on näiltä osin oikein. Testit voi halutessaan lisätä myöhemmin, mutta ne eivät ole vaatimus.

## Veto
Ei blokkaa Done-tilaa.
