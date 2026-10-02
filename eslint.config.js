import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// SR-1: external data is rendered as text only. These APIs turn strings into markup or code.
const unsafeHtmlSyntax = [
  {
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message: 'SR-1: render external data as text, never as HTML.',
  },
  {
    selector: "AssignmentExpression > MemberExpression.left[property.name=/^(innerHTML|outerHTML)$/]",
    message: 'SR-1: do not assign HTML strings; use text content.',
  },
  {
    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
    message: 'SR-1: insertAdjacentHTML is not allowed.',
  },
  {
    selector: "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
    message: 'SR-1: document.write is not allowed.',
  },
  {
    selector: "CallExpression[callee.name=/^(setTimeout|setInterval)$/] > Literal:first-child",
    message: 'SR-1: pass a function, not a string, to timers.',
  },
];

// ARCHITECTURE.md luku 4: only api/index.ts is the public API of the API layer.
const apiInternals = {
  group: ['**/api/netdeck*', '**/api/mapCard*', '**/api/errors*'],
  message: "Import the API layer only through its public index ('../api').",
};

// D-013, ARCHITECTURE.md 13.6: the app uses bundled card data; Netdeck code must not reach the bundle.
const noApiInApp = {
  group: ['**/api', '**/api/**'],
  message: 'The app uses bundled card data (src/data); src/api is only for scripts/ (D-013).',
};

// ARCHITECTURE.md luku 4 (T-011): only storage/index.ts is the public API of the storage layer.
const storageInternals = {
  group: ['**/storage/*'],
  message: "Import the storage layer only through its public index ('../storage').",
};

// SR-12, D-008: only storage/keyValueStore.ts may use browser storage, so nothing bypasses validation,
// backups and the in-memory fallback (ARCH-008).
const browserStorageApis = ['localStorage', 'sessionStorage', 'indexedDB'];
const browserStorageMessage = 'SR-12: use the storage layer (src/storage) instead of browser storage.';

export default defineConfig(
  globalIgnores(['dist', 'coverage', 'node_modules', '.claude/**']),
  js.configs.recommended,
  tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': ['error', ...unsafeHtmlSyntax],
    },
  },
  {
    files: ['src/ui/**', 'src/App.tsx', 'src/main.tsx'],
    rules: {
      // One block for both layers: a later no-restricted-imports block would replace this one, not merge.
      'no-restricted-imports': ['error', { patterns: [noApiInApp, storageInternals] }],
    },
  },
  {
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'react', message: 'The domain layer has no dependencies.' }],
          patterns: [
            {
              group: ['**/api', '**/api/**', '**/ui', '**/ui/**', '**/storage', '**/storage/**'],
              message: 'The domain layer has no dependencies.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/data/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'react', message: 'The data layer depends only on the domain layer.' }],
          patterns: [
            noApiInApp,
            {
              group: ['**/ui', '**/ui/**', '**/storage', '**/storage/**'],
              message: 'The data layer depends only on the domain layer.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/storage/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'react', message: 'The storage layer does not depend on the UI.' }],
          patterns: [
            {
              group: ['**/ui', '**/ui/**', '**/api', '**/api/**'],
              message: 'The storage layer depends only on the domain layer.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}', 'public/**/*.js'],
    ignores: [
      'src/storage/keyValueStore.ts',
      'src/storage/keyValueStore.test.ts',
      'src/test/**',
      // T-025 A1 (UX.md 8.7): reads only the theme key before the first paint and writes nothing.
      // It runs before the app bundle, so it cannot use the storage layer. Digiturva reviews it.
      'public/theme-init.js',
      'src/storage/themeInit.test.ts',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        ...browserStorageApis.map((name) => ({ name, message: browserStorageMessage })),
      ],
      'no-restricted-properties': [
        'error',
        ...['window', 'globalThis', 'self'].flatMap((object) =>
          browserStorageApis.map((property) => ({ object, property, message: browserStorageMessage })),
        ),
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    // ARCHITECTURE.md 13.6: developer scripts may use src/api, but only through its public index.
    files: ['scripts/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [apiInternals] }],
    },
  },
  {
    // Plain scripts copied to dist/ as they are (not bundled): classic scripts in the browser.
    files: ['public/**/*.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
  },
  {
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
