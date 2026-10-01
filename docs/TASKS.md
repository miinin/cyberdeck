# TASKS

Tilat: Backlog → Ready → In Progress → Review → Testing → Done (rules.md 7). Blocked merkitään erikseen.

| ID | Otsikko | MVP | Prioriteetti | Omistaja | Tila | Katselmoinnit |
|---|---|---|---|---|---|---|
| T-000 | Projektin alustus ja julkaisuputki | 0 | Must | PM | Done | – |
| T-001 | Kävelevä luuranko: korttilista rajapinnasta näytölle | 0 | Must | Koodari | Done | Arkkitehti, Digiturva, UX, Testikäyttäjä, Dokumentoija |
| T-002 | [velka] GitHub Actionit lukittu commit-tunnisteeseen ja Dependabot käyttöön (R-3) | 1 | Could | Koodari | Backlog | Digiturva |
| T-003 | Korttidatan välimuisti (vaatii ADR:n) | 1 | Should | Arkkitehti → Koodari | Backlog | Arkkitehti, Digiturva |
| T-004 | [velka] `npm test` ja `npm run lint` PR-workflowhun, firebase.json-otsakkeiden ja CSP:n yhdenmukaisuustesti (ARCH-003) ja `persist-credentials: false` (SEC-003) | 1 | Should | Koodari | Backlog | Digiturva (SR-9) |
| T-005 | [velka] ESLintin saavutettavuusliitännäinen, kun ESLint 10 -yhteensopiva versio on saatavilla | 2 | Could | Koodari | Backlog | UX |
| T-006 | [velka] Keskeneräisten pyyntöjen peruutus epäonnistumisen jälkeen ja testityyppien erottaminen sovelluksen tsconfigista | 1 | Could | Koodari | Backlog | – |
| T-007 | [velka] SR-1:n lint-säännön kiertotiet suljettava (SEC-002) ennen rules_text-muotoilua | 1 | Should | Koodari | Backlog | Digiturva |
| T-008 | Virhe- ja osittaisen tilan parannukset: kortit säilyvät uusintayrityksessä (B-001), skipped-laskenta (B-003), virheteksti lajin mukaan (B-006), hinnan järkevyystarkistus (B-009) | 1 | Should | Koodari | Backlog | UX, Sisällöntuottaja, Testikäyttäjä |
| T-009 | Hostingin kovennus: noscript, välimuistiotsakkeet ja puuttuvien assettien 404 (B-004), Firebase-API-avaimen rajaus (B-010) ennen datatallennusta | 1 | Should | Koodari | Backlog | Digiturva (SR-9) |
| T-010 | Haku ja suodatus korttilistaan (nimi, tyyppi, väri) | 1 | Must | Koodari | In Progress | UX, Sisällöntuottaja, Testikäyttäjä |
| T-011 | Tietomalli ja paikallinen tallennuskerros (kokoelma, pakat), valmius Firebaseen ja painoksiin (D-007) | 1 | Must | Arkkitehti → Koodari | In Progress | Arkkitehti, Digiturva |
| T-012 | Kokoelma: omistettujen korttien ja määrien merkintä helposti sekä ilmoitus "tiedot vain tässä selaimessa" (R-10) | 1 | Must | Koodari | Backlog (T-011) | UX, Sisällöntuottaja, Testikäyttäjä, Digiturva |
| T-013 | Pakat: luonti, muokkaus, poisto ja kortin kohdalla näkyvät pakat | 1 | Must | Koodari | Backlog (T-011, T-012) | UX, Sisällöntuottaja, Testikäyttäjä |
| T-014 | Pakkalistan tuonti (teksti ja .txt) ja raportti: puuttuvat kortit ja missä pakoissa tarvittavat kortit ovat (SR-17) | 1 | Must | Koodari | Backlog (T-013) | UX, Digiturva, Sisällöntuottaja, Testikäyttäjä |
| T-015 | Pakan vienti ja tuonti .json- ja .txt-muodossa (varmuuskopio ja jakaminen, SR-18–SR-19) | 1 | Must | Koodari | Backlog (T-013, T-014) | Arkkitehti, Digiturva, UX, Testikäyttäjä |
