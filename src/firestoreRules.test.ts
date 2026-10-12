/*
 * Static checks of the Firestore rules (T-054b, SR-22, T-098). They do not replace the manual checks on the
 * test site (SR-22 kohta 4, SEC-098-7); emulator tests are in IDEAS.md (D-017 kohta 10).
 */
import firebaseConfig from '../firebase.json';
import indexes from '../firestore.indexes.json';
import rules from '../firestore.rules?raw';

const fullCode = rules
  .split('\n')
  .map((line) => line.replace(/\/\/.*$/, ''))
  .join('\n');

// The users part (functions and match /users) and the public decks match are checked separately (T-098).
const publicStart = fullCode.indexOf('match /publicDecks/{pubId}');
const code = fullCode.slice(0, publicStart);
const publicCode = fullCode.slice(publicStart);
const publicFields = code.slice(code.indexOf('function isPublicDeck'), code.indexOf('function isCollectionDoc'));

describe('firestore.rules', () => {
  it('is wired into firebase.json with an empty index file', () => {
    expect(firebaseConfig.firestore).toEqual({ rules: 'firestore.rules', indexes: 'firestore.indexes.json' });
    expect(indexes).toEqual({ indexes: [], fieldOverrides: [] });
  });

  it('allows unconditionally only the read of one public deck and has only the users and publicDecks roots', () => {
    expect(fullCode).toMatch(/^rules_version = '2';/);
    expect(code).not.toMatch(/if\s+true/);
    // The only `if true` in the file is the single-document read of a public deck (SR-33).
    expect([...fullCode.matchAll(/allow\s+([^:]+):\s*if\s+true\s*;/g)].map((m) => m[1])).toEqual(['get']);
    // Only explicit operations (get, list, create, update, delete), never the broad read or write.
    expect(fullCode).not.toMatch(/allow\s+(read|write)\b/);
    expect(fullCode).not.toContain('test_users');
    expect(fullCode).not.toContain('{document=**}');
    expect([...fullCode.matchAll(/match\s+(\S+)\s*\{/g)].map((m) => m[1])).toEqual([
      '/databases/{database}/documents',
      '/users/{uid}',
      '/decks/{deckId}',
      '/collection/{docId}',
      '/games/{docId}',
      '/publicDecks/{pubId}',
    ]);
  });

  it('requires a Google-signed-in owner in every allow rule under users', () => {
    const allows = [...code.matchAll(/allow\s+[^:]+:\s*if\s+([^;]+);/g)].map((m) => m[1] ?? '');
    expect(allows).toHaveLength(13);
    for (const condition of allows) expect(condition.trimStart()).toMatch(/^isOwner\(uid\)/);
    expect(fullCode).toContain("request.auth.token.firebase.sign_in_provider == 'google.com'");
    expect(code).toContain('request.auth.uid == uid');
  });

  it('allows exactly the collection documents main, want and have, in get, write and delete (D-018, T-145)', () => {
    const block = code.slice(code.indexOf('match /collection/{docId}'), code.indexOf('match /games/{docId}'));
    expect(block).toContain("allow get: if isOwner(uid) && docId in ['main', 'want', 'have'];");
    expect(block).toMatch(
      /allow create, update: if isOwner\(uid\)\s+&& docId in \['main', 'want', 'have'\]\s+&& isCollectionDoc\(request\.resource\.data\);/,
    );
    expect(block).toContain("allow delete: if isOwner(uid) && docId in ['main', 'want', 'have'];");
    // No other document id is named anywhere in the collection block, and no wildcard sibling.
    expect([...block.matchAll(/docId\s*(==|in)\s*([^;&)]+)/g)].map((m) => (m[2] ?? '').trim())).toEqual([
      "['main', 'want', 'have']",
      "['main', 'want', 'have']",
      "['main', 'want', 'have']",
    ]);
    expect(block.slice(0, block.indexOf('match /games/{docId}'))).not.toMatch(/docId\s*==/);
  });

  it('allows exactly the games/log document for the owner, with a bounded list (T-122, SR-43)', () => {
    const block = code.slice(code.indexOf('match /games/{docId}'));
    expect(block).toContain("allow get: if isOwner(uid) && docId == 'log';");
    expect(block).toMatch(
      /allow create, update: if isOwner\(uid\)\s+&& docId == 'log'\s+&& isGamesDoc\(request\.resource\.data\);/,
    );
    expect(block).toContain("allow delete: if isOwner(uid) && docId == 'log';");
    // No list rule and no other document id.
    expect(block).not.toMatch(/allow\s+(list|read|write)\b/);
    expect([...block.matchAll(/docId\s*(==|in)\s*([^;&)]+)/g)].map((m) => (m[2] ?? '').trim())).toEqual([
      "'log'",
      "'log'",
      "'log'",
    ]);
    const fn = code.slice(code.indexOf('function isGamesDoc'), code.indexOf('match /users/{uid}'));
    expect(fn).toContain('isEnvelope(d)');
    expect(fn).toContain("hasExactly(d.data, ['games'])");
    expect(fn).toContain('d.data.games is list');
    expect(fn).toContain('d.data.games.size() <= 1000');
  });

  it('lets deck documents carry only the optional visibility and nickname fields (SR-35)', () => {
    expect(code).toContain(
      "d.data.keys().hasOnly(['name', 'sections', 'createdAt', 'updatedAt', 'visibility', 'nickname'])",
    );
    expect(code).toContain("d.data.visibility in ['private', 'public']");
    expect(code).toContain('isText(d.data.nickname, 1, 60)');
  });

  describe('publicDecks (T-098, SEC-098)', () => {
    it('binds the document id to the signed-in user and stores no uid (SR-30)', () => {
      expect(code).toContain("hashing.sha256(request.auth.uid + ':' + deckId).toHexString().lower()");
      expect(publicCode).toContain('pubId == publicKey(request.resource.data.deckId)');
      expect(publicCode).toContain('pubId == publicKey(resource.data.deckId)');
      expect(publicFields).not.toMatch(/uid/i);
    });

    it('allows exactly the nine fields, bounded and without lists (SR-31, SR-32)', () => {
      expect(publicFields).toMatch(
        /hasExactly\(d, \['schemaVersion', 'deckId', 'name', 'legends', 'cardCount', 'deck',\s+'nickname', 'publishedAt', 'updatedAt'\]\)/,
      );
      expect(publicFields).toContain('isText(d.deck, 1, 16000)');
      expect(publicFields).toContain("d.deck.matches('^[A-Za-z0-9_-]+$')");
      expect(publicFields).toContain('d.cardCount <= 49500');
      expect(publicFields).toContain('d.updatedAt == request.time');
      expect(publicFields).not.toMatch(/ is list/);
    });

    it('limits listing, rate limits updates and keeps deckId and publishedAt fixed (SR-33, SR-34)', () => {
      expect(publicCode).toContain('allow list: if request.query.limit <= 50;');
      expect(publicCode).toContain("request.time > resource.data.updatedAt + duration.value(10, 's')");
      expect(publicCode).toContain('request.resource.data.deckId == resource.data.deckId');
      expect(publicCode).toContain('request.resource.data.publishedAt == resource.data.publishedAt');
    });

    it('lets only a Google user write, and delete also a missing document (SR-36)', () => {
      const writes = [...publicCode.matchAll(/allow\s+(create|update|delete):\s*if\s+([^;]+);/g)];
      expect(writes.map((m) => m[1])).toEqual(['create', 'update', 'delete']);
      for (const write of writes) expect((write[2] ?? '').trimStart()).toMatch(/^isGoogleUser\(\)/);
      expect(publicCode).toContain('(resource == null || pubId == publicKey(resource.data.deckId))');
    });
  });
});
