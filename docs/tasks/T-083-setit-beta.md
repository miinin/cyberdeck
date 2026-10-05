# T-083 · Setit ja Beta/Retail kokoelmassa (D-022)

**Haara:** `t-083-setit-beta` · **Tila:** Koodari valmis, odottaa Digiturvan katselmointia ennen tuotantoa (muunnos koskee oikeaa dataa)

## Luovutus (Koodari)
- Suodatin: Setit (WtNC Retail+FR, WtNC Beta) ja Muut tuotteet (`setFilterId`, `setFilter.ts`, optgroupit).
- Oletuspainos Beta/Retail (preferences `cyberdeck:default-edition`), kortin +/− ja taulukko painoslogiikalla (`domain/edition.ts`), "Kaikki versiot" -tilan perusversio samoin. Erikoisversiot (Iconic/Nova) eivät vähene kortin −:sta.
- Tietonäkymän perusversion ruudussa Retail- ja Beta-laskurit; muut painokset Erittelyssä.
- Versionimi pois korttiruudun kuvan alta (säilyy otsikossa visually-hidden).
- Muunnos schemaVersion 2 → 3: `domain/betaMigration.ts` + `storage/migrations.ts` (lukee `src/data/cards.json`:n CARDS-listan suoraan; ajetaan envelope-ketjussa, joten paikallinen data, pilvidokumentti ja synkkapohja kulkevat saman koodin läpi). Want-lista (WANTS_SCHEMA_VERSION 1) ei muunnu. Synkkapohja `v:1` muunnetaan luettaessa, `v:2` kirjoitetaan. Firestore-säännöt (schemaVersion 1–1000) eivät muutu.
- Turvaverkko: paikallinen v2-data varmuuskopioidaan ensimmäisen kirjoituksen yhteydessä (mutate, `needsBackup`); muunnos ei muuta count-arvoa, summa ≤ count, max 32 versiota.
- Vanha sovellusversio näkee v3-datan `newer` ja lukitsee.

## Riskit
- Pilvidokumenttia ei varmuuskopioida muunnoksessa (v2 pysyy pilvessä kunnes jokin muuttuu ja kirjoitetaan v3:na).
- Kortti, jolla on vain Beta-painos mutta oletuksena Retail (tai päin vastoin), käyttää olemassa olevaa toista painosta.

## SEC-083 (Digiturva, 2026-10-06)
**Tulos: hyväksytty, ei blokkaavia löydöksiä (0 Critical, 0 High, 0 Medium, 1 Low, 2 Info). Ei koodimuutoksia.**
Tarkistettu `git diff test..HEAD -- src`; riippuvuudet, firebase.json, säännöt ja workflowt eivät muuttuneet (npm audit ei tarpeen).
- **L1 Rikkinäinen erittely korvautuu hiljaa.** `betaMigration.ts` `readVersions`: jos v2-erittely on yli countin tai yli 32 avainta, muunnos kirjoittaa `{beta: count}` ja `dropped`-ilmoitus jää näyttämättä. Toisto: v2-rivi `{count:2, versions:{a:1,b:5}}`. Vaikutus pieni: parseCollection hylkäisi erittelyn joka tapauksessa, count säilyy ja alkuperäinen raw varmuuskopioidaan (mutate/needsBackup). Ehdotus (valinnainen): palauta rivi muuttamatta, kun erittely on virheellinen.
- **I1 Paluu vanhaan versioon lukitsee.** Tuotannon rollback T-083:a edeltävään koodiin jättää v3-datan käyttäjät `newer`/locked-tilaan (ei datan menetystä, mutta vain eteenpäin-korjaus toimii).
- **I2 Pilven v2-dokumenttia ei varmuuskopioida** ennen v3-kirjoitusta (kortin riski). Hyväksyttävä: muunnos on häviötön, ja paikallinen v2 varmuuskopioidaan.
Kunnossa: count ei muutu, summa ≤ count, 32-raja, idempotenssi (ketju ajetaan vain v<3, ja funktio itse on idempotentti), want-lista ei muunnu (oma spec), deterministinen muunnos paikalliselle, pilvelle ja synkkapohjalle v1 (konvergoi), vanha client: `newer` → mutate heittää, pilvi `locked` ja rev-konflikti estää ylikirjoituksen, rikkinäinen syöte palautetaan parserille (corrupt/invalid, ei poistoa), varmuuskopio ennen ensimmäistä kirjoitusta (myös sync.apply kulkee mutaten kautta), prototype pollution (avaimet `PRINTING_KEY_PATTERN`, vaatii `:`; Map-haku), `cyberdeck:default-edition` validoidaan luettaessa ja kirjoitettaessa. Testit storage/account/betaMigration: 346/346 läpi.
