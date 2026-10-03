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
      expect(site.headers.map((rule) => rule.source).filter((source) => source.startsWith('/__'))).toEqual([]);
    }
  });
});
