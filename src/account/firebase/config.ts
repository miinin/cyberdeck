/*
 * Firebase web app configs (D-017 kohta 2 and Muutos K-P8). These values are not secrets: they identify
 * the project, and the Firestore rules protect the data (R-14). The build mode picks one; the other is
 * dropped from the bundle, which scripts/check-dist-env.mjs verifies. Hosts are in sites.ts.
 */

export interface FirebaseEnv {
  projectId: string;
  apiKey: string;
  appId: string;
  messagingSenderId: string;
}

export const PROD_ENV: FirebaseEnv = {
  projectId: 'cyberdeck-tcg',
  apiKey: 'AIzaSyDulWCXsbWoRQG58MaUqypk2Mycf6X7KN4',
  appId: '1:912904162092:web:e8349acff636cfab9a3a89',
  messagingSenderId: '912904162092',
};

export const TEST_ENV: FirebaseEnv = {
  projectId: 'cyberdeck-tcg-dev',
  apiKey: 'AIzaSyDyvDT1RKZy2QmRxKgCzk9Jm-y6aDunIVs',
  appId: '1:911337127286:web:d5ab822eea52f30ce20e57',
  messagingSenderId: '911337127286',
};

/** Same choice as FIREBASE_SITE in sites.ts: production builds only use the production project. */
export const FIREBASE_ENV: FirebaseEnv = import.meta.env.MODE === 'production' ? PROD_ENV : TEST_ENV;
