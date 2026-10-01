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

export default defineConfig(
  globalIgnores(['dist', 'coverage', 'node_modules']),
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
      'no-restricted-imports': ['error', { patterns: [apiInternals] }],
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
            apiInternals,
            { group: ['**/api', '**/api/**', '**/ui', '**/ui/**'], message: 'The domain layer has no dependencies.' },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
);
