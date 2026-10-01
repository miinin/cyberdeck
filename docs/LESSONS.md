# LESSONS

Opitut virheet ja miten ne vältetään. Vain lisäyksiä (rules.md 6, liite A5).

## L-001 · 2026-10-01 · Agentti pysäytti käyttäjän toisen projektin prosessin
**Mitä tapahtui:** Dokumentoija testasi `npm run dev`:iä, huomasi portin 5173 varatuksi ja siivosi lopuksi komennolla `npx kill-port 5173`. Portissa pyöri käyttäjän toisen projektin (Eduks Saavutettavuusopas) kehityspalvelin, joka todennäköisesti pysähtyi.
**Miksi:** Prosessi pysäytettiin portin perusteella eikä oman käynnistetyn prosessin tunnisteen perusteella.
**Jatkossa:** Älä koskaan pysäytä prosessia portin tai nimen perusteella. Pysäytä vain itse käynnistämäsi prosessi (PID). Käytä testeissä vapaata porttia (`--port 0` tai `--strictPort` tarkistuksella) äläkä koske toisten projektien prosesseihin.

## L-002 · 2026-10-01 · user-event jumittuu Vitestin valeajastimien kanssa
**Mitä tapahtui:** T-010:n live-alueen testit (`vi.useFakeTimers()` + `userEvent.setup({ advanceTimers })`) aikakatkaistiin 5 s:n jälkeen.
**Miksi:** Testing Libraryn async-kääre odottaa jokaisen toiminnon jälkeen oikeaa `setTimeout(0)`:aa ja siirtää aikaa vain Jestin valeajastimilla (`jest`-globaali). Vitestissä ajastin ei koskaan laukea.
**Jatkossa:** Ajastinriippuvaisissa näkymätesteissä käytä `fireEvent`iä ja `act(() => vi.advanceTimersByTime(ms))`. Käytä user-eventiä testeissä, joissa ajastimet ovat oikeita.
