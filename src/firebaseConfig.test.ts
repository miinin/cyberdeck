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

// T-046 (D-015): the only external origin the browser may call is the Netdeck deck API.
describe('firebase.json Content-Security-Policy connect-src', () => {
  it('allows connections only to self and api.netdeck.gg on both sites', () => {
    for (const site of firebaseConfig.hosting) {
      const csp = JSON.stringify(site.headers);
      expect(csp).toContain("connect-src 'self' https://api.netdeck.gg;");
      expect(csp.match(/https:\/\/[a-z.]+/g)).toEqual(['https://api.netdeck.gg']);
    }
  });
});
