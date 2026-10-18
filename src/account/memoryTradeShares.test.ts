import { describe, expect, it } from 'vitest';
import { CloudError } from './cloudError';
import { createMemoryTradeShares } from './memory';

// BRK-06: the memory store follows the rules' gap (SR-52), so a test sees a share that comes too soon.
describe('memory trade shares: 10 s between writes of one link', () => {
  const UID = 'user123';

  function setup() {
    let time = Date.parse('2026-01-01T00:00:00Z');
    const memory = createMemoryTradeShares({ now: () => new Date(time) });
    return { store: memory.forUser(UID), advance: (ms: number) => (time += ms), docs: memory.docs };
  }

  it('refuses a second write less than 10 s after the first, and allows it after', async () => {
    const { store, advance } = setup();
    await store.publish('QQ');
    advance(9_999);
    await expect(store.publish('Qg')).rejects.toBeInstanceOf(CloudError);
    await expect(store.update('Qg')).rejects.toMatchObject({ kind: 'denied' });
    advance(1);
    await store.publish('Qg');
  });

  it('does not delay the first write or a delete', async () => {
    const { store, docs } = setup();
    await store.publish('QQ');
    await store.remove();
    expect(docs.size).toBe(0);
    await store.publish('Qg');
    expect(docs.size).toBe(1);
  });
});
