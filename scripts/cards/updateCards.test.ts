import { page, rawCard } from '../../src/api/__fixtures__/netdeckPages';
import { diffCardFiles } from './cardFileDiff';
import { CARDS_JSON_PATH, updateCards } from './updateCards';
import type { UpdateCardsDeps } from './updateCards';

/** A fake fetch that serves the given single page for offset 0. No network (src/test/setup.ts). */
function fakeFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
}

function onePage(items: unknown[], total = items.length) {
  return page(items, total, 60, 0);
}

/** In-memory file system and log. */
function memoryDeps(fetchFn: typeof fetch, initial: string | null = null) {
  const files = new Map<string, string>();
  if (initial !== null) files.set(CARDS_JSON_PATH, initial);
  const lines: string[] = [];
  const writeText = vi.fn<UpdateCardsDeps['writeText']>(async (path, text) => {
    files.set(path, text);
  });
  const deps: UpdateCardsDeps = {
    fetchFn,
    readText: async (path) => files.get(path) ?? null,
    writeText,
    log: (line) => lines.push(line),
  };
  return { deps, files, lines, writeText };
}

const threeCards = [
  rawCard(1),
  rawCard(2, { name: 'V', subname: 'Streetkid', canonical_name: 'V — Streetkid', cost: null, color: null }),
  rawCard(3),
];

describe('updateCards', () => {
  it('writes a validated file in the fixed format and API order when none exists', async () => {
    const { deps, files, lines } = memoryDeps(fakeFetch(onePage(threeCards)));
    const result = await updateCards(deps);

    expect(result).toEqual({
      status: 'written',
      count: 3,
      diff: { added: ['card-1', 'v-streetkid', 'card-3'], removed: [], changed: [] },
    });
    const text = files.get(CARDS_JSON_PATH) ?? '';
    expect(text.endsWith('}\n')).toBe(true);
    expect(text).not.toContain('\r');
    const json = JSON.parse(text);
    expect(Object.keys(json)).toEqual(['format', 'version', 'cards']);
    expect(json.format).toBe('cyberdeck.cards');
    expect(json.version).toBe(1);
    expect(json.cards.map((card: { key: string }) => card.key)).toEqual(['card-1', 'v-streetkid', 'card-3']);
    expect(json.cards[1]).toEqual({
      id: 'id-2',
      slug: 'card-2',
      name: 'V',
      subname: 'Streetkid',
      displayName: 'V — Streetkid',
      type: 'Unit',
      color: null,
      cost: null,
      key: 'v-streetkid',
    });
    expect(lines).toContain('Cards: 3');
    expect(lines).toContain(`Wrote ${CARDS_JSON_PATH}`);
  });

  it('does not write when a second run produces the same bytes', async () => {
    const first = memoryDeps(fakeFetch(onePage(threeCards)));
    await updateCards(first.deps);
    const written = first.files.get(CARDS_JSON_PATH) ?? null;

    const second = memoryDeps(fakeFetch(onePage(threeCards)), written);
    const result = await updateCards(second.deps);

    expect(result).toEqual({ status: 'unchanged', count: 3 });
    expect(second.writeText).not.toHaveBeenCalled();
    expect(second.lines).toContain('No changes');
  });

  it('fails without writing when mapCard rejected a card', async () => {
    const { deps, writeText, lines } = memoryDeps(fakeFetch(onePage([rawCard(1), { id: 'broken' }, rawCard(3)])));
    const result = await updateCards(deps);

    expect(result).toEqual({ status: 'failed', reason: '1 card(s) were rejected by mapCard' });
    expect(writeText).not.toHaveBeenCalled();
    expect(lines.at(-1)).toMatch(/^FAILED: .* was not changed\.$/);
  });

  it('fails without writing when the count differs from the reported total', async () => {
    // total 3, but the API returns an empty second page: two cards arrive.
    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      const offset = new URL(String(input)).searchParams.get('offset');
      const body = offset === '0' ? page([rawCard(1), rawCard(2)], 3, 2, 0) : page([], 3, 2, 2);
      return new Response(JSON.stringify(body));
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { deps, writeText } = memoryDeps(fetchFn);

    expect(await updateCards(deps)).toEqual({ status: 'failed', reason: 'Received 2 cards, API reported 3' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('fails without writing when two cards give the same key', async () => {
    const twins = [rawCard(1, { name: 'Solo' }), rawCard(2, { name: 'Solo' })];
    const { deps, writeText } = memoryDeps(fakeFetch(onePage(twins)));

    expect(await updateCards(deps)).toEqual({ status: 'failed', reason: 'Duplicate card key "solo"' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('fails without writing when a card does not pass the file validation', async () => {
    const tooLong = [rawCard(1, { canonical_name: 'x'.repeat(201) })];
    const { deps, writeText } = memoryDeps(fakeFetch(onePage(tooLong)));

    const result = await updateCards(deps);
    expect(result.status).toBe('failed');
    expect(result.status === 'failed' && result.reason).toMatch(/^Validation failed: .*longer than 200/);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('fails without writing when the fetch fails', async () => {
    const { deps, writeText } = memoryDeps(fakeFetch({}, 503));

    expect(await updateCards(deps)).toEqual({ status: 'failed', reason: 'Fetching cards failed: HTTP 503 for offset 0' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('fails when the current file cannot be read or the new one cannot be written', async () => {
    const unreadable = memoryDeps(fakeFetch(onePage(threeCards)));
    unreadable.deps.readText = async () => {
      throw new Error('EACCES');
    };
    expect(await updateCards(unreadable.deps)).toEqual({
      status: 'failed',
      reason: `Reading ${CARDS_JSON_PATH} failed: EACCES`,
    });
    expect(unreadable.writeText).not.toHaveBeenCalled();

    const unwritable = memoryDeps(fakeFetch(onePage(threeCards)));
    unwritable.deps.writeText = async () => {
      throw new Error('EROFS');
    };
    expect(await updateCards(unwritable.deps)).toEqual({
      status: 'failed',
      reason: `Writing ${CARDS_JSON_PATH} failed: EROFS`,
    });
  });

  it('reports added, removed and changed keys and warns about removed keys', async () => {
    const before = memoryDeps(fakeFetch(onePage(threeCards)));
    await updateCards(before.deps);

    const next = [rawCard(1, { cost: 9 }), rawCard(3), rawCard(4)];
    const after = memoryDeps(fakeFetch(onePage(next)), before.files.get(CARDS_JSON_PATH) ?? null);
    const result = await updateCards(after.deps);

    expect(result).toEqual({
      status: 'written',
      count: 3,
      diff: { added: ['card-4'], removed: ['v-streetkid'], changed: [{ key: 'card-1', fields: ['cost'] }] },
    });
    expect(after.lines).toContain('Added (1): card-4');
    expect(after.lines).toContain('Removed (1): v-streetkid  WARNING: saved collections may refer to these keys');
    expect(after.lines).toContain('Changed (1): card-1 (cost)');
  });

  it('replaces a broken current file with a warning', async () => {
    const { deps, files, lines } = memoryDeps(fakeFetch(onePage(threeCards)), '{ not json');
    const result = await updateCards(deps);

    expect(result.status).toBe('written');
    expect(lines.some((line) => line.startsWith(`WARNING: the current ${CARDS_JSON_PATH} is not valid`))).toBe(true);
    expect(JSON.parse(files.get(CARDS_JSON_PATH) ?? '').cards).toHaveLength(3);
  });
});

describe('diffCardFiles', () => {
  it('returns no differences for the same cards', () => {
    const card = {
      id: 'a',
      slug: 'a',
      name: 'A',
      subname: null,
      displayName: 'A',
      type: 'Unit',
      color: null,
      cost: null,
      key: 'a',
    };
    expect(diffCardFiles([card], [{ ...card }])).toEqual({ added: [], removed: [], changed: [] });
    expect(diffCardFiles([card], [{ ...card, id: 'b', cost: 0 }]).changed).toEqual([
      { key: 'a', fields: ['id', 'cost'] },
    ]);
  });
});
