# SEC-102: T-102 proxy-tulostus, diff-katselmointi

**Digiturva · 2026-10-06 · PR #108 · `git diff origin/test...origin/t-102-proxy` (commitit 5e0aedd–e1cc66a)**

## Tulos
- **Löydökset:** Critical 0, High 0, Medium 0, Low 1, Info 3.
- **Veto:** Ei blokkaa Done-tilaa. SEC-102-1 kannattaa korjata samassa PR:ssä, koska korjaus on pieni, mutta se ei ole ehto.
- Riippuvuudet, `firebase.json` ja workflowt eivät muuttuneet, joten `npm audit` -ajoa ei tarvittu. Diffistä ei löytynyt salaisuuksia (haettu `AIza`, `secret`, `private_key`, `password` ja `token =`).
- PRIVACY.md päivitetty: inventaarion rivi 1c (proxy-jono) ja muutoslokin rivi. Jono ei ole henkilötieto, eikä sitä tarvitse eskaloida.

## Löydökset

### SEC-102-1 · 200 kopion raja ei koske tallennuskerrosta, ja `queueCopies` rakentaa rajattoman listan · Low
**Sijainti:** `src/storage/repositories.ts:183–189` (proxyAggregate käyttää `parseCollection`:ia, rajat 999 kopiota korttia kohden ja 5000 riviä), `src/domain/proxySheet.ts` `queueCopies` (ei rajaa) ja `src/ui/ProxyView.tsx` (`queueCopies(shown, …)` jokaisella renderöinnillä) · **Tehtävä:** T-102
**Toistaminen:** 1) Kirjoita DevToolsissa `cyberdeck:proxy`-avaimeen kelvollinen kääre, jossa jokaisen tunnetun kortin `count` on 999 (tai kutsu `repositories.proxy.setCount(key, 999)` monelle kortille, sillä repository hyväksyy sen). 2) Avaa `#/proxy`. 3) `queueCopies` luo kortti × 999 objektia jokaisella renderöinnillä, ennen kuin `layoutSheets` leikkaa listan 200:aan.
**Odotettu:** Jonossa on enintään 200 kopiota (kortin raja), ja lukiessa käsitellään enintään 200. · **Havaittu:** Raja on vain käyttöliittymässä (`addToQueue`, `handleCountChange` ja `handleArtChange`). Tallennus ja luku hyväksyvät jopa noin 5000 × 999 kopiota, ja `queueCopies` käy ne kaikki läpi. Sivu hidastuu tai jumittuu jokaisella renderöinnillä.
**Vaikutus:** Vain paikallinen palvelunesto omassa selaimessa. Sen aiheuttaminen vaatii pääsyn saman alkuperän localStorageen (DevTools, laajennus tai XSS). Jonoa ei synkronoida eikä jaeta, joten ulkoinen syöte ei pääse siihen. Siksi vakavuus on Low.
**Korjausehdotus:** Lisää `queueCopies`:iin rajaus (palauta, kun `copies.length >= MAX_PROXY_CARDS`), niin työ pysyy rajattuna riippumatta tallennetusta datasta. Testi: jono, jossa on 3 korttia × 999 kopiota, tuottaa `queueCopies(...).length === 200`. Valinnainen lisäys: proxy-repositoryn `setCount` ja `setVersionCount` hylkäävät muutoksen (`limit-reached`), jos jonon summa ylittäisi `MAX_PROXY_CARDS`:n. Silloin raja on myös tallennuskerroksessa, kuten SR-11 edellyttää muilta rajoilta.
**Tila:** Avoin

### SEC-102-2 · Proxy-kirjoitus herättää synkronoinnin muutoskuuntelijan · Info
**Sijainti:** `src/storage/repositories.ts` `mutate` → `callAll(changeListeners)`, `sync.onChange`
**Havainto:** Kun proxy-jonoon kirjoitetaan, synkronointimoottorin `onChange` kutsutaan, mutta `readLocal` ja `serialize` lukevat vain pakat, kokoelman ja want-listan. Jono ei siis päädy pilveen, eikä vertailu löydä muutosta. Tämä on ylimääräinen vertailu, ei vuoto. Varmistettu myös, että `backupAll`, `clear` ja `subscribeTo` eivät koske proxy-avainta. Tämä on tarkoituksenmukaista, koska jono on paikallinen.
**Korjausehdotus:** Ei pakollinen. Halutessa proxy-aggregaatti voi jättää `changeListeners`-kutsun pois.

### SEC-102-3 · Uloskirjautuneen jono jää laitteelle tilille kirjautumisen jälkeen · Info
**Sijainti:** `src/storage/repositories.ts` `sync.clear` (poistaa vain decks/collection/wants), `src/account/sync/session.ts:118`
**Havainto:** Kun uloskirjautuneen data siirretään tilille, proxy-jono jää avaimeen `cyberdeck:proxy`, eikä se näy kirjautuneena. Tämä on johdonmukaista paikallisen jonon kanssa, eikä jono ole henkilötieto. Kirjattu PRIVACY.md:n riville 1c. Tilin paikallinen jono `cyberdeck:u:{uid}:proxy` poistuu `eraseAccount`:lla (testattu `src/storage/proxy.test.ts`:ssä).

### SEC-102-4 · Tulostuksessa näkyy myös otsikkopalkin alla oleva ilmoitusrivi · Info
**Sijainti:** `src/styles.css:7149–7187`, `src/App.tsx:143–152`
**Havainto:** Print-CSS piilottaa `.site-header`- ja `.site-footer`-elementit sekä `.proxy-screen`-alueen. Tilivalikko (nimi ja sähköposti) on headerissa, joten se ei tulostu. `main`-elementin ulkopuolinen "kirjauduit ulos" / "tili poistettu" -ilmoitus (`.container > .notice`) tulostuisi, jos se on auki. Siinä ei ole henkilötietoa, joten tämä on vain kosmeettinen havainto.
**Korjausehdotus:** Valinnainen: lisää `body.is-proxy-view > .container` (tai `.notice`) print-piilotukseen.

## Tarkistetut alueet ilman löydöksiä
- **Tallennusavain ja repository:** `cyberdeck:proxy` ja tilikohtainen `cyberdeck:u:{uid}:proxy` käyttävät samaa kääre-, versio- ja validointiketjua kuin kokoelma (`specWith` + `parseCollection`, `PROXY_SCHEMA_VERSION = 1`, tyhjä migraatioketju). Rikkinäinen data varmuuskopioidaan (`cyberdeck:backup:proxy:`, enintään 3) ja nollataan, uudempi versio torjutaan, ja `setCount`/`setVersionCount` validoivat avaimet ja määrät (testit `proxy.test.ts`). Tilin poisto poistaa avaimen etuliitteellä.
- **Syötteen käsittely:** Tallennetut kortin avaimet ja versioavaimet validoidaan luettaessa (`parseCollection`). Näkymä käyttää vain avaimia, jotka löytyvät korttidatasta (`allCards.filter`, `entryOf` käy läpi vain `card.printings`-avaimet), eikä tuntematon versioavain vaikuta mihinkään. `addToQueue` hylkää virheelliset rivit. Lähetyspainikkeet ottavat rivit vain omasta pakasta tai want-listasta, eivät jaetuista linkeistä.
- **Renderöinti:** Kaikki kortti- ja käyttäjädata renderöidään React-tekstinä. Diffissä ei ole `dangerouslySetInnerHTML`-, `innerHTML`- tai `eval`-kutsuja. Kuvien `src` tulee vain staattisista karttahauista (`variantImageUrl` → `byArtId.get`, `getCardImage` → `images.get`), joten URL:eja ei muodosteta datasta. `style`-arvot ovat numeroita domainin asettelusta. Reitti `#/proxy` ei lue hash-dataa.
- **Tulostus:** `window.print()` kutsutaan vain käyttäjän painalluksesta. Tulostusalueella ovat vain korttikuvat, PROXY-merkki ja kalibrointisivu. Sovellus ei lähetä tulostuksessa mitään ulos. Teksti "ei myyntiin eikä turnauksiin" on mukana.
- **Riippuvuudet, konfiguraatio ja salaisuudet:** ei muutoksia eikä löydöksiä.
