// Applies the saved light theme before the first paint (UX.md 8.7, T-025 A1).
// Reads one key and writes nothing: saving happens only in the storage layer (src/storage, SR-12).
// The key must match THEME_KEY in src/storage/keys.ts (checked by src/storage/themeInit.test.ts).
try {
  if (window.localStorage.getItem('cyberdeck:theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
} catch {
  // Storage is blocked: stay on the dark default.
}
