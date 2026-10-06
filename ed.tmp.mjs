import fs from 'fs';
const p='docs/tasks/T-098-julkiset-pakat.md';
let s=fs.readFileSync(p,'utf8');
s=s.replace('**Tila:** Määritelty. Toteutus ei ole alkanut. Ennen toteutusta tarvitaan Digiturvan uhkamalli (SEC-098, säännöt ja henkilötiedot) ja Arkkitehdin katselmointi tietomallista.','**Tila:** Toteutettu, odottaa Digiturvan diff-katselmointia, sääntöjen deployta testiprojektiin ja PM:n katselmointia (PR testiin).');
for (const n of [30,31,32,33,34,35,36,37,38,39,40,41,42]) s=s.replace(new RegExp(`- \[ \] \*\*SR-${n}\*\*`),`- [x] **SR-${n}**`);
s=s.replace('- [x] **SR-40**','- [~] **SR-40** (säännöt kirjoitettu, EI deployattu: käyttäjä deployaa ensin testiprojektiin ja tekee SEC-098-7:n käsitestit)');
s+=`
## Luovutus · Koodari · 2026-10-06
Haara \`t-098-julkiset-pakat\`, PR testiin. Muutokset:
- **Domain:** \`src/domain/publicDeck.ts\` (pubId = sha256(uid:deckId) Web Cryptolla, \`buildPublicDeckInput\`, \`parsePublicDeck\`), \`Deck.publish?: { public, nickname }\` (\`deck.ts\`, \`validate.ts\`: \`parseDeckPublish\`, \`cleanNickname\` 1–30). Vanhat pakat = yksityisiä, skeemaversio ennallaan (kenttä valinnainen).
- **Tallennus:** \`DeckRepository.setPublish\` (päivittää updatedAt); \`update\` säilyttää asetukset. Pilvikoodekki tallentaa asetukset kenttinä \`visibility\` (private/public) ja \`nickname\` pakan dokumentissa. Poikkeama liitteestä: ei arvoa \`public-anonymous\`, koska nimettömyys on \`nickname == null\`.
- **Säännöt:** \`firestore.rules\` (isDeckDoc, publicKey, isPublicDeck, \`match /publicDecks/{pubId}\`) liitteen mukaan. Staattiset testit \`src/firestoreRules.test.ts\`. **Emulaattoritestejä ei ole** (ei emulaattoria projektissa): SEC-098-7:n käsitestit tehdään testiprojektissa deployn jälkeen.
- **Pilvi:** \`firebase/firestorePublicDecks.ts\` (luku nimetyllä appilla \`public-read\` ilman kirjautumista, kirjoitus oletusappilla, transaktio create/update, \`limit 24\`, \`orderBy updatedAt desc\`, \`startAfter\`, ei onSnapshot), \`publicPublisher.ts\` (15 s viive, väh. 10,5 s väli, flush editorista poistuttaessa), \`memory.ts\` (\`createMemoryPublicDecks\`). Tilin poisto: \`firestoreCloudStore.deleteAll\` poistaa pilven pakkojen julkiset kopiot ensin, \`session.deleteAccountData\` paikallisten pakkojen kopiot ensin (SR-36, testit).
- **UI:** Pakat-sivun välilehdet (\`#/pakat\`, \`#/pakat/julkiset\`), \`PublicDecksList\` (24/sivu, "Näytä lisää", istuntovälimuisti, "Päivitä lista"), \`PublicDeckView\` (\`#/pakat/julkinen/<pubId>\`, käyttää SharedDeckView/DeckImport-lukunäkymää, "Tallenna omaksi" luo uuden yksityisen pakan), \`DeckVisibility\` pakkaeditorissa (vahvistus, varoitus, nimimerkki oletuksena piilossa ja tyhjä, kirjautumaton: Julkinen pois käytöstä + kehotus), "Julkinen"-merkki omalla rivillä, noindex-meta julkisissa näkymissä. Tekstit fi+en (\`deckTexts\`), kirjoitettu Koodarin toimesta, **Sisällöntuottajan kielentarkistus puuttuu**.
- **PRIVACY.md:** luku 11 (11.1–11.7, mukana ylläpitäjän poistoreitti), luvun 10.1 korjaus, muutosloki.
- **Testit:** 1362 läpi (uusia noin 70: domain, repository, koodekki, store-sopimus muistilla ja Firestore-fakella, publisher, istunto/tilin poisto, reitit, UI). Lint ja build läpi.
- **Poikkeamat ja avoimet:**
  - SR-35: jos julkisen kopion poisto epäonnistuu, pakka pysyy julkisena ja sovellus sanoo sen (ei jonoa, ei "poistuu kun yhteys palaa").
  - R-22: toisella laitteella synkronoinnin kautta poistettu pakka jättää julkisen kopion (orpo). Korjaus vaatisi synkronointikerroksen kytkennän, ei tehty.
  - SR-41: noindex on dynaaminen meta (sovellus on yksi sivu hash-reiteillä), ei X-Robots-Tag-otsaketta.
  - SR-42: Tietoa-sivun ohjetta ei ole, vain PRIVACY.md 11.7.
  - Esikatselu (PR-esikatselun osoite): kirjautuminen ei ole käytössä esikatseluissa, joten julkaisua ei voi kokeilla siellä. Julkisten pakkojen luku toimii kaikkialla, mutta vasta kun säännöt on deployattu.
  - Rooli-ajot jäljellä: Digiturvan diff-katselmointi (veto: SR-30–36, SR-40), Sisällöntuottaja (tekstit), UX/Testikäyttäjä (uusi iso näkymä).
- **Käyttäjän pakolliset toimet:** (1) \`firebase deploy --only firestore:rules --project test\`, käsitestit (oma luonti, päivitys, poisto; toisen päivitys/poisto/valtaus hylätään; listaus ilman limitiä hylätään; <10 s päivitys hylätään), (2) sama tuotantoon ennen \`/julkaise\`:a.
Koodikatselmointi: tehty · Pakollisia korjattu 3 (useSyncExternalStore-silmukka, aria-live-valitsin, vanhan välimuistin lista julkaisun jälkeen) · Suosituksia 3 (R-22 orvot kopiot, Tietoa-sivun ohje, Sisällöntuottajan tarkistus)
`;
fs.writeFileSync(p,s);
