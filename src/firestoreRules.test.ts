/*
 * Static checks of the Firestore rules (T-054b, SR-22). They do not replace the manual checks on the test
 * site (SR-22 kohta 4); emulator tests are in IDEAS.md (D-017 kohta 10).
 */
import firebaseConfig from '../firebase.json';
import indexes from '../firestore.indexes.json';
import rules from '../firestore.rules?raw';

const code = rules
  .split('\n')
  .map((line) => line.replace(/\/\/.*$/, ''))
  .join('\n');

describe('firestore.rules', () => {
  it('is wired into firebase.json with an empty index file', () => {
    expect(firebaseConfig.firestore).toEqual({ rules: 'firestore.rules', indexes: 'firestore.indexes.json' });
    expect(indexes).toEqual({ indexes: [], fieldOverrides: [] });
  });

  it('never allows unconditionally and has only the users root (D-017 Muutos K-P8)', () => {
    expect(code).toMatch(/^rules_version = '2';/);
    expect(code).not.toMatch(/if\s+true/);
    // Only explicit operations (get, list, create, update, delete), never the broad read or write.
    expect(code).not.toMatch(/allow\s+(read|write)\b/);
    expect(code).not.toContain('test_users');
    expect(code).not.toContain('{document=**}');
    expect([...code.matchAll(/match\s+(\S+)\s*\{/g)].map((m) => m[1])).toEqual([
      '/databases/{database}/documents',
      '/users/{uid}',
      '/decks/{deckId}',
      '/collection/{docId}',
    ]);
  });

  it('requires a Google-signed-in owner in every allow rule', () => {
    const allows = [...code.matchAll(/allow\s+[^:]+:\s*if\s+([^;]+);/g)].map((m) => m[1] ?? '');
    expect(allows).toHaveLength(10);
    for (const condition of allows) expect(condition.trimStart()).toMatch(/^isOwner\(uid\)/);
    expect(code).toContain("request.auth.token.firebase.sign_in_provider == 'google.com'");
    expect(code).toContain('request.auth.uid == uid');
  });

  it('allows exactly the collection documents main and want, in get, write and delete (D-018)', () => {
    const block = code.slice(code.indexOf('match /collection/{docId}'));
    expect(block).toContain("allow get: if isOwner(uid) && docId in ['main', 'want'];");
    expect(block).toMatch(
      /allow create, update: if isOwner\(uid\)\s+&& docId in \['main', 'want'\]\s+&& isCollectionDoc\(request\.resource\.data\);/,
    );
    expect(block).toContain("allow delete: if isOwner(uid) && docId in ['main', 'want'];");
    // No other document id is named anywhere in the collection block, and no wildcard sibling.
    expect([...block.matchAll(/docId\s*(==|in)\s*([^;&)]+)/g)].map((m) => (m[2] ?? '').trim())).toEqual([
      "['main', 'want']",
      "['main', 'want']",
      "['main', 'want']",
    ]);
    expect(code).not.toMatch(/docId\s*==/);
  });
});
