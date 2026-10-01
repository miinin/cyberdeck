# LESSONS

Opitut virheet ja miten ne vältetään. Vain lisäyksiä (rules.md 6, liite A5).

## L-001 · 2026-10-01 · Agentti pysäytti käyttäjän toisen projektin prosessin
**Mitä tapahtui:** Dokumentoija testasi `npm run dev`:iä, huomasi portin 5173 varatuksi ja siivosi lopuksi komennolla `npx kill-port 5173`. Portissa pyöri käyttäjän toisen projektin (Eduks Saavutettavuusopas) kehityspalvelin, joka todennäköisesti pysähtyi.
**Miksi:** Prosessi pysäytettiin portin perusteella eikä oman käynnistetyn prosessin tunnisteen perusteella.
**Jatkossa:** Älä koskaan pysäytä prosessia portin tai nimen perusteella. Pysäytä vain itse käynnistämäsi prosessi (PID). Käytä testeissä vapaata porttia (`--port 0` tai `--strictPort` tarkistuksella) äläkä koske toisten projektien prosesseihin.
