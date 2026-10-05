import type { Card } from '../../src/domain/card';
import { CARD_IMAGES_DIR, CARD_IMAGES_MAP_PATH, MAX_SOURCE_BYTES, VARIANT_MAP_PATH, importImages, outputPath } from './importImages';
import type { ImportImagesDeps } from './importImages';

function card(key: string, name: string): Card {
  return { id: `id-${key}`, slug: key, name, subname: null, displayName: name, type: 'Unit', color: null, cost: 1, power: null, ram: null, rarity: null, key };
}

const cards = [card('corpo-security', 'Corpo Security'), card('gilded-maton', 'Gilded Matón'), card('octant', 'Octant')];

/** In-memory folders: path → file names, plus sizes and texts. */
function fakeDeps(folders: Record<string, readonly string[]>, options: { sizes?: Record<string, number>; map?: string } = {}) {
  const lines: string[] = [];
  const convert = vi.fn<ImportImagesDeps['convert']>(async (source) => {
    if (source.endsWith('.png')) throw new Error('Unsupported image format: svg');
  });
  const deps: ImportImagesDeps = {
    listFiles: async (dir) => (folders[dir] ? [...folders[dir]] : null),
    fileSize: async (path) => options.sizes?.[path] ?? 1000,
    readText: async (path) => (path === CARD_IMAGES_MAP_PATH ? (options.map ?? null) : null),
    convert,
    log: (line) => lines.push(line),
  };
  return { deps, convert, lines };
}

describe('importImages', () => {
  it('converts each matched image to both sizes under the card key and reports the rest', async () => {
    const { deps, convert, lines } = fakeDeps(
      {
        src: ['Corpo_Security.webp', 'Gilded_Mat_n.webp', 'Unknown.webp', 'Thumbs.db'],
        [`${CARD_IMAGES_DIR}/md`]: ['corpo-security.webp', 'old-card.webp'],
      },
      { map: JSON.stringify({ 'Gilded_Mat_n.webp': 'gilded-maton' }) },
    );
    const result = await importImages('src', cards, deps);

    expect(result.exitCode).toBe(0);
    expect(convert).toHaveBeenCalledWith('src/Corpo_Security.webp', [
      { path: 'src/assets/cards/md/corpo-security.webp', width: 360 },
      { path: 'src/assets/cards/lg/corpo-security.webp', width: 720 },
    ]);
    expect(convert).toHaveBeenCalledWith('src/Gilded_Mat_n.webp', [
      { path: 'src/assets/cards/md/gilded-maton.webp', width: 360 },
      { path: 'src/assets/cards/lg/gilded-maton.webp', width: 720 },
    ]);
    expect(result.report?.converted).toBe(2);
    expect(result.report?.unmatched).toEqual([{ file: 'Unknown.webp', reason: 'no-match' }]);
    expect(result.report?.ignored).toEqual(['Thumbs.db']);
    expect(result.report?.missingCards).toEqual([{ key: 'octant', displayName: 'Octant' }]);
    expect(result.report?.orphans).toEqual(['old-card']);
    expect(lines).toContain('Converted: 2 / matched 2');
    expect(lines).toContain('  octant (Octant)');
  });

  it('rejects too large files and files that are not images, and lists their cards as missing', async () => {
    const { deps, convert } = fakeDeps(
      { src: ['Corpo_Security.webp', 'Octant.png'] },
      { sizes: { 'src/Corpo_Security.webp': MAX_SOURCE_BYTES + 1 } },
    );
    const result = await importImages('src', cards, deps);

    expect(convert).toHaveBeenCalledTimes(1);
    expect(result.report?.rejected).toEqual([
      { file: 'Corpo_Security.webp', reason: 'too-large' },
      { file: 'Octant.png', reason: 'not-image' },
    ]);
    expect(result.report?.missingCards.map((entry) => entry.key)).toEqual(['corpo-security', 'gilded-maton', 'octant']);
    expect(result.exitCode).toBe(1);
  });

  it('fails without touching anything when the folder is missing or the map file is invalid', async () => {
    for (const [folders, map] of [
      [{}, undefined],
      [{ src: ['Octant.webp'] }, '[]'],
      [{ src: ['Octant.webp'] }, '{"../x.webp": "octant"}'],
      [{ src: ['Octant.webp'] }, '{"Octant.webp": 1}'],
      [{ src: ['Octant.webp'] }, 'not json'],
    ] as const) {
      const { deps, convert } = fakeDeps({ ...folders }, { map });
      expect(await importImages('src', cards, deps)).toEqual({ exitCode: 1, report: null });
      expect(convert).not.toHaveBeenCalled();
    }
  });

  it('builds output paths only from valid card keys', () => {
    expect(outputPath('lg', 'octant')).toBe('src/assets/cards/lg/octant.webp');
    expect(() => outputPath('md', '../../evil')).toThrow();
  });
});

describe('importImages: variant art (T-076)', () => {
  const variantMap = JSON.stringify([{ source: 'public/cards/variants/Nova/octant.webp', artId: 'octant__nova-rare' }]);

  it('converts the files of the variant map and files named by an art id to src/assets/cards/variants', async () => {
    const { deps, convert } = fakeDeps({ src: ['octant__iconic-legend.PNG', 'octant.webp'] });
    deps.readText = async (path) => (path === VARIANT_MAP_PATH ? variantMap : null);
    convert.mockImplementation(async () => {});
    const result = await importImages('src', cards, deps);

    expect(convert).toHaveBeenCalledWith('public/cards/variants/Nova/octant.webp', [{ path: 'src/assets/cards/variants/octant__nova-rare.webp', width: 720 }]);
    expect(convert).toHaveBeenCalledWith('src/octant__iconic-legend.PNG', [{ path: 'src/assets/cards/variants/octant__iconic-legend.webp', width: 720 }]);
    expect(result.report?.variantsConverted).toBe(2);
    expect(result.report?.converted).toBe(1);
  });

  it('reports a missing source file instead of stopping', async () => {
    const { deps } = fakeDeps({ src: ['octant.webp'] });
    deps.readText = async (path) => (path === VARIANT_MAP_PATH ? variantMap : null);
    deps.fileSize = async (path) => {
      if (path.startsWith('public/')) throw new Error('ENOENT');
      return 1000;
    };
    const result = await importImages('src', cards, deps);
    expect(result.report?.rejected).toEqual([{ file: 'public/cards/variants/Nova/octant.webp', reason: 'not-image' }]);
  });

  it('rejects a malformed variant map and a path that leaves the repository', async () => {
    for (const text of ['{}', JSON.stringify([{ source: '../x.png', artId: 'a__b' }]), JSON.stringify([{ source: 'x.png', artId: '../a' }])]) {
      const { deps } = fakeDeps({ src: ['octant.webp'] });
      deps.readText = async (path) => (path === VARIANT_MAP_PATH ? text : null);
      expect((await importImages('src', cards, deps)).exitCode).toBe(1);
    }
  });
});
