# T-072 Painokset (D-020)

## SEC-072 Digiturvakatselmointi (2026-10-05, Digiturva/Opus, pikakatselmointi)

Laajuus: `git diff test..HEAD -- src scripts firestore.rules` (cards.json vain formaatin ja validoinnin osalta).

**Tulos: hyväksytty, ei blokkaavia löydöksiä.** Critical 0 · High 0 · Medium 0 · Low 2 · Info 2.

Tarkistettu, ei löydöksiä:
- `versions`-validointi (`parseVersions`): avainregex `^[A-Za-z0-9-]{1,64}:[A-Za-z0-9]{1,12}$`, max 32/kortti, summa ≤ count, kokonaislukuarvot 1–999. `__proto__`/`constructor` hylätään regexillä (vaatii `:`), testattu. Merge ja UI lukevat vain validoituja avaimia.
- `setVersionCount`: invariantti summa ≤ count säilyy, count 0–999, 32 rajaa, repositorio muuntaa RangeErrorin StorageErroriksi.
- schemaVersion 1→2: identiteettimigraatio, v1-data kelpaa sellaisenaan; uudempi versio lukitsee (newer-version) olemassa olevan envelope-logiikan kautta, ei ylikirjoitusta.
- Pilvikoodekki ja merge: kirjoitus kopioi versions-olion, luku kulkee parseCollectionin kautta; merge rajaa summan countiin.
- mapCard: printings rajattu 100:aan, tekstit 200 merkkiin, kuva-URLit pudotetaan (R-1), virheellinen painos ohitetaan.
- cards.json v2 (`parsePrintings`): tarkat kentät, key ja imageKey johdetaan ja tarkistetaan, duplikaatit hylätään.
- Kuvaimport: tulospolku vain validoidusta imageKeystä (`^[a-z0-9-]{1,100}__[a-z0-9-]{1,100}$`) ja vain jos avain on korttidatassa; lähdetiedoston nimi ei päädy polkuun. Variant-URL vain manifestin avaimista.
- `npm audit --omit=dev`: 0 haavoittuvuutta. Ei uusia riippuvuuksia. firestore.rules ei muuttunut.

Löydökset:
- **L-1 (Low, korjattu):** `scripts/cards/importImages.ts` regexeissä `IMAGE_EXTENSION` ja stem-poiminta oli escapeamaton piste (`/.(png|…)$/`), joten esim. `fooxpng` tulkittiin kuvaksi. Ei polkuriskiä (imageKey-tarkistus), mutta korjattu `\.`:ksi.
- **L-2 (Low, ei korjattu):** 5000 riviä × 32 versiota voi ylittää Firestoren 1 MiB dokumenttirajan tai localStoragen kiintiön. Vain käyttäjän itse aiheuttama; kirjoitus epäonnistuu hallitusti. Ehdotus: harkitse kokonaisversiomäärän ylärajaa myöhemmin.
- **I-1:** Toivelista (wants, schemaVersion 1) käyttää samaa `parseCollection`ia, joten se hyväksyy myös `versions`-kentän. Harmiton (validoitu), mutta ehdotus: erottaa jos toivelistalle ei haluta painoksia.
- **I-2:** firestore.rules ei validoi entries-alkioiden sisältöä (vain listan koko); ennallaan, asiakas validoi luettaessa.

Luovutus: Digiturva → PM. Korjaus commitissa `T-072: Security review fixes`. npm test (1129), lint ja build läpi. Veto: ei.
