import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Keep all assets as separate files so the CSP (SR-2) needs no data: or inline sources for scripts.
    assetsInlineLimit: 0,
    // T-054a: no preload helper in the main bundle (+0.35 kB gzip); only the lazy Firebase chunk would use it.
    modulePreload: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // T-029: agent worktrees under .claude/ hold copies of the tests.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
