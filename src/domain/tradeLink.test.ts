import { createHash } from 'node:crypto';
import { isTradeShareId, parseTradeShareDoc, tradeShareId } from './tradeLink';
import { publicDeckId } from './publicDeck';

describe('tradeShareId (SR-50)', () => {
  it('is the first 16 hex characters of sha256(uid + "#trade")', async () => {
    const id = await tradeShareId('user123');
    expect(id).toBe(createHash('sha256').update('user123#trade').digest('hex').slice(0, 16));
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(id).not.toContain('user123');
  });

  it('differs between users and from the public id of a deck called "trade"', async () => {
    expect(await tradeShareId('user123')).not.toBe(await tradeShareId('user124'));
    expect((await publicDeckId('user123', 'trade')).startsWith(await tradeShareId('user123'))).toBe(false);
  });
});

describe('isTradeShareId (SR-53)', () => {
  it('accepts only 16 lowercase hex characters', () => {
    expect(isTradeShareId('0123456789abcdef')).toBe(true);
    for (const bad of ['', '0123456789ABCDEF', '0123456789abcde', '0123456789abcdef0', '../abcdef01234', 'a/b/c', '.*', 12, null]) {
      expect(isTradeShareId(bad)).toBe(false);
    }
  });
});

describe('parseTradeShareDoc (SR-53)', () => {
  it('accepts a valid document', () => {
    expect(parseTradeShareDoc({ schemaVersion: 1, data: 'QQ', updatedAt: 'x' })).toEqual({ kind: 'ok', data: 'QQ' });
  });

  it('reports a newer schema version separately', () => {
    expect(parseTradeShareDoc({ schemaVersion: 2, data: 'QQ' })).toEqual({ kind: 'newer' });
  });

  it('rejects everything else', () => {
    for (const bad of [
      null,
      'x',
      [],
      {},
      { schemaVersion: 0, data: 'QQ' },
      { schemaVersion: 1001, data: 'QQ' },
      { schemaVersion: 1.5, data: 'QQ' },
      { schemaVersion: 1, data: 5 },
      { schemaVersion: 1, data: '' },
      { schemaVersion: 1, data: 'a b' },
      { schemaVersion: 1, data: 'a'.repeat(16001) },
    ]) {
      expect(parseTradeShareDoc(bad)).toBeNull();
    }
  });
});
