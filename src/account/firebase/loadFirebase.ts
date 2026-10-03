/*
 * The only module that imports the Firebase SDK (D-017 kohta 8, ESLint). Dynamic imports keep Firebase
 * in its own lazy chunk, loaded only on "Kirjaudu" or for a returning signed-in user (SR-21 kohta 5).
 * Tests replace this module (src/test/setup.ts).
 */
export async function loadFirebase() {
  const [app, auth] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
  return { app, auth };
}

export type FirebaseModules = Awaited<ReturnType<typeof loadFirebase>>;
