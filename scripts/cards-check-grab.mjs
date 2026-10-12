// Fetches choom.gg's card list for `npm run cards:check` (T-149). choom.gg loads its cards in the browser, so this opens
// the page in a headless Edge/Chrome over the DevTools protocol and saves the page's own card and set responses.
// Usage: node scripts/cards-check-grab.mjs <browser.exe> <out dir>. The data is untrusted: only read and compared.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [browser, outDir] = process.argv.slice(2);
if (!browser || !outDir) throw new Error('Usage: node scripts/cards-check-grab.mjs <browser.exe> <out dir>');
mkdirSync(outDir, { recursive: true });
const port = 9336;
const child = spawn(browser, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'cards-check-profile')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 60 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); }
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const hits = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    else if (d.method === 'Network.responseReceived' && /\/rest\/v1\/(cards|card_sets)\?/.test(d.params.response.url)) hits.push(d.params);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Network.enable', { maxResourceBufferSize: 100_000_000, maxTotalBufferSize: 200_000_000 });
  await send('Page.enable');
  await send('Page.navigate', { url: 'https://choom.gg/cards' });
  await sleep(15_000);
  for (const name of ['cards', 'card_sets']) {
    for (const hit of hits.filter((h) => h.response.url.includes(`/${name}?`))) {
      const body = (await send('Network.getResponseBody', { requestId: hit.requestId })).result?.body;
      if (body) { writeFileSync(join(outDir, `${name}.json`), body); break; }
    }
  }
  console.log(`Saved choom.gg cards and sets to ${outDir}`);
} finally {
  child.kill();
}
