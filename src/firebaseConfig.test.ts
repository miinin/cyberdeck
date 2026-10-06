import firebaseConfig from '../firebase.json';

// ARCH-003: production and test must send identical security headers (CSP etc.), so a header change
// in one site cannot silently skip the other.
describe('firebase.json hosting headers', () => {
  const sites = firebaseConfig.hosting;

  it('has the prod and test sites', () => {
    expect(sites.map((site) => site.target).sort()).toEqual(['prod', 'test']);
  });

  it('sends identical headers on both sites', () => {
    const prod = sites.find((site) => site.target === 'prod');
    const test = sites.find((site) => site.target === 'test');
    expect(prod?.headers).toBeDefined();
    expect(test?.headers).toEqual(prod?.headers);
  });

  // B-004: no SPA rewrite (routes are hash routes), so a missing /assets/ file is a 404, not index.html.
  it('serves files only, no rewrites', () => {
    for (const site of sites) expect('rewrites' in site).toBe(false);
  });

  // SEC-011: index.html is revalidated on every load, so a deploy reaches open browsers on the next load.
  it('sends Cache-Control: no-cache for the page', () => {
    for (const site of sites) {
      const rule = site.headers.find((r) => r.regex !== undefined && new RegExp(r.regex).test('/') && new RegExp(r.regex).test('/index.html'));
      expect(rule?.headers).toEqual([{ key: 'Cache-Control', value: 'no-cache' }]);
    }
  });
});

/** Parses the CSP of a site into directive → sources. */
function cspOf(site: (typeof firebaseConfig.hosting)[number]): Map<string, string[]> {
  const header = site.headers
    .flatMap((rule) => rule.headers)
    .find((entry) => entry.key === 'Content-Security-Policy');
  expect(header).toBeDefined();
  return new Map(
    (header?.value ?? '')
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter((tokens) => tokens[0] !== '')
      .map(([name, ...sources]): [string, string[]] => [name ?? '', sources]),
  );
}

// T-046 (D-015), T-054a (D-017 kohta 9, SR-24): exact external origins, no wildcards or schemes.
describe('firebase.json Content-Security-Policy', () => {
  it.each(firebaseConfig.hosting.map((site) => [site.target, site] as const))(
    'allows exactly the expected external origins on %s',
    (_target, site) => {
      const csp = cspOf(site);
      expect(csp.get('script-src')).toEqual(["'self'", 'https://apis.google.com']);
      expect(csp.get('connect-src')).toEqual([
        "'self'",
        'https://api.netdeck.gg',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://firestore.googleapis.com',
      ]);
      expect(csp.get('frame-src')).toEqual(["'self'"]);
      expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
      expect(csp.get('default-src')).toEqual(["'self'"]);
    },
  );

  it('has no other external origin, wildcard, scheme source or unsafe keyword', () => {
    const allowed = [
      'https://api.netdeck.gg',
      'https://apis.google.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://firestore.googleapis.com',
    ];
    for (const site of firebaseConfig.hosting) {
      const sources = [...cspOf(site).values()].flat();
      const origins = sources.filter((source) => source.includes('://'));
      expect(origins.sort()).toEqual([...allowed].sort());
      expect(sources.filter((source) => /\*|^https?:$|unsafe/.test(source))).toEqual([]);
    }
  });

  it('keeps the other security headers (SR-24 kohdat 2–4)', () => {
    for (const site of firebaseConfig.hosting) {
      const headers = new Map(site.headers.flatMap((rule) => rule.headers).map((entry) => [entry.key, entry.value]));
      expect(headers.get('X-Frame-Options')).toBe('DENY');
      expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
      expect(headers.get('Referrer-Policy')).toBe('no-referrer');
    }
  });

  it('adds no header rules for the reserved /__/ paths', () => {
    for (const site of firebaseConfig.hosting) {
      const sources = site.headers.flatMap((rule) => (rule.source === undefined ? [] : [rule.source]));
      expect(sources.filter((source) => source.startsWith('/__'))).toEqual([]);
      // A regex rule must not reach them either (T-086: index.html no-cache).
      const regexes = site.headers.flatMap((rule) => (rule.regex === undefined ? [] : [new RegExp(rule.regex)]));
      expect(regexes.filter((regex) => regex.test('/__/auth/handler') || regex.test('/__/firebase/init.json'))).toEqual([]);
    }
  });
});
