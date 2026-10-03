/*
 * Where sign-in may run (D-017 Muutos K-P8, SR-21 kohta 2). Kept apart from the project keys in
 * config.ts, so the main bundle holds only these hosts and the keys load with the lazy Firebase chunk.
 */

export interface FirebaseSite {
  /** The published site where sign-in uses a same-origin redirect. */
  siteHost: string;
  /** authDomain on `siteHost` (same origin, /__/auth/handler of the same project). */
  authDomain: string;
  /** authDomain for popup sign-in on localhost (test project only). */
  devAuthDomain: string | null;
}

export const PROD_SITE: FirebaseSite = {
  siteHost: 'cyberdeck-tcg.web.app',
  authDomain: 'cyberdeck-tcg.web.app',
  devAuthDomain: null,
};

export const TEST_SITE: FirebaseSite = {
  siteHost: 'cyberdeck-tcg-dev.web.app',
  authDomain: 'cyberdeck-tcg-dev.web.app',
  devAuthDomain: 'cyberdeck-tcg-dev.firebaseapp.com',
};

/** `vite build` = production; `vite build --mode test`, the dev server and Vitest get the test project. */
export const FIREBASE_SITE: FirebaseSite = import.meta.env.MODE === 'production' ? PROD_SITE : TEST_SITE;

export type AuthMode =
  | { kind: 'redirect'; authDomain: string }
  | { kind: 'popup'; authDomain: string }
  | { kind: 'disabled' };

const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

/**
 * Picks how sign-in works on `host` (`location.host`), with exact comparison only (SR-21 kohta 2):
 * the site's own host → redirect; the test project on localhost → popup; anything else → disabled.
 * So a PR preview, `*.firebaseapp.com`, an unknown host or a build deployed to the wrong site never
 * signs in to the wrong project.
 */
export function selectAuthMode(site: FirebaseSite, host: string): AuthMode {
  if (host === site.siteHost) return { kind: 'redirect', authDomain: site.authDomain };
  if (site.devAuthDomain !== null && LOCAL_HOST.test(host)) return { kind: 'popup', authDomain: site.devAuthDomain };
  return { kind: 'disabled' };
}
