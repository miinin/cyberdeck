# LESSONS

Opitut virheet ja miten ne vältetään. Vain lisäyksiä (rules.md 6, liite A5).

## L-001 · 2026-10-01 · Agentti pysäytti käyttäjän toisen projektin prosessin
**Mitä tapahtui:** Dokumentoija testasi `npm run dev`:iä, huomasi portin 5173 varatuksi ja siivosi lopuksi komennolla `npx kill-port 5173`. Portissa pyöri käyttäjän toisen projektin (Eduks Saavutettavuusopas) kehityspalvelin, joka todennäköisesti pysähtyi.
**Miksi:** Prosessi pysäytettiin portin perusteella eikä oman käynnistetyn prosessin tunnisteen perusteella.
**Jatkossa:** Älä koskaan pysäytä prosessia portin tai nimen perusteella. Pysäytä vain itse käynnistämäsi prosessi (PID). Käytä testeissä vapaata porttia (`--port 0` tai `--strictPort` tarkistuksella) äläkä koske toisten projektien prosesseihin.

## L-002 · 2026-10-01 · Unicode-escapet muuttuivat näkymättömiksi merkeiksi lähdekoodissa
**Mitä tapahtui:** Koodari (T-011) kirjoitti tiedostoon merkkijonoja ja regexin, joissa oli `\u`-escapeja (suunnanohjausmerkit U+202A–U+202E ja U+2066–U+2069 sekä yhdistyvä merkki U+0308). Työkaluketju muutti osan escapeista oikeiksi merkeiksi, joten lähdekoodiin päätyi näkymättömiä suunnanohjausmerkkejä (Trojan Source -riski). Testit menivät silti läpi, joten virhe ei näkynyt.
**Miksi:** Kirjoitustyökalun syöte tulkitsi `\uXXXX`-jaksot. Näkymättömiä merkkejä ei huomaa diffistä.
**Jatkossa:** Kun kirjoitat ohjaus-, suunnanohjaus- tai yhdistyviä merkkejä koodiin, tarkista tiedosto skriptillä, joka etsii merkit U+0080–U+009F, U+200B–U+200F, U+202A–U+202E, U+2066–U+2069 ja U+0300–U+036F, ja korjaa ne escapeiksi. Escapen voi tuottaa skriptissä esim. `String.fromCharCode(92) + 'u…'`.
