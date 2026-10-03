import { FIREBASE_ENV, PROD_ENV, TEST_ENV } from './config';
import { FIREBASE_SITE, PROD_SITE, selectAuthMode, TEST_SITE } from './sites';

// D-017 Muutos K-P8, SR-21 kohta 2: exact host comparison only; everything unknown disables sign-in.
describe('selectAuthMode', () => {
  it('uses a same-origin redirect on the env own site', () => {
    expect(selectAuthMode(PROD_SITE, 'cyberdeck-tcg.web.app')).toEqual({
      kind: 'redirect',
      authDomain: 'cyberdeck-tcg.web.app',
    });
    expect(selectAuthMode(TEST_SITE, 'cyberdeck-tcg-dev.web.app')).toEqual({
      kind: 'redirect',
      authDomain: 'cyberdeck-tcg-dev.web.app',
    });
  });

  it.each(['localhost:5173', 'localhost:4173', '127.0.0.1:5173', 'localhost'])(
    'uses a popup with the test project on %s',
    (host) => {
      expect(selectAuthMode(TEST_SITE, host)).toEqual({ kind: 'popup', authDomain: 'cyberdeck-tcg-dev.firebaseapp.com' });
    },
  );

  it.each([
    'cyberdeck-tcg.web.app.evil.example',
    'evil-cyberdeck-tcg.web.app',
    'cyberdeck-tcg.web.app:443',
    'CYBERDECK-TCG.WEB.APP',
    'cyberdeck-tcg.firebaseapp.com',
    'cyberdeck-tcg-test.web.app',
    'cyberdeck-tcg--pr-12-abc123.web.app',
    'localhost:5173',
    'localhost.evil.example',
    '',
  ])('disables sign-in with the production config on %j', (host) => {
    expect(selectAuthMode(PROD_SITE, host)).toEqual({ kind: 'disabled' });
  });

  it.each([
    // A build deployed to the wrong site never signs in to the other project.
    'cyberdeck-tcg.web.app',
    'cyberdeck-tcg-dev.web.app.evil.example',
    'cyberdeck-tcg-dev.firebaseapp.com',
    'cyberdeck-tcg-dev--pr-12-abc123.web.app',
    'localhost.evil.example:5173',
    '127.0.0.2:5173',
    'localhost:5173.evil.example',
  ])('disables sign-in with the test config on %j', (host) => {
    expect(selectAuthMode(TEST_SITE, host)).toEqual({ kind: 'disabled' });
  });
});

describe('Firebase configs', () => {
  it('uses the test project outside production builds (Vitest mode "test")', () => {
    expect(FIREBASE_ENV).toBe(TEST_ENV);
    expect(FIREBASE_SITE).toBe(TEST_SITE);
  });

  it('keeps the two projects fully apart', () => {
    for (const key of ['projectId', 'apiKey', 'appId', 'messagingSenderId'] as const) {
      expect(PROD_ENV[key]).not.toBe(TEST_ENV[key]);
    }
    expect(PROD_SITE.siteHost).not.toBe(TEST_SITE.siteHost);
    expect(PROD_SITE.authDomain).not.toBe(TEST_SITE.authDomain);
    // Production never signs in from localhost.
    expect(PROD_SITE.devAuthDomain).toBeNull();
  });
});
