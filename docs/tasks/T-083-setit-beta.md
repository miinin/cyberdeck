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
