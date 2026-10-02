import type { Card } from '../../src/domain/card';
import { cardKey } from '../../src/domain/cardKey';
import { matchImages } from './matchImages';

function card(name: string, subname: string | null = null, slug?: string): Card {
  const key = cardKey(name, subname);
  return {
    id: `id-${key}`,
    slug: slug ?? key,
    name,
    subname,
    displayName: subname ? `${name} — ${subname}` : name,
    type: 'Unit',
    color: 'Red',
    cost: 1,
    power: null,
    ram: null, rarity: null,
    key,
  };
}

const streetkid = card('V', 'Streetkid');
const roamer = card('V', 'Roamer of the Badlands');
const royce = card('Royce', "Don't Call Me Simon", 'royce-don-t-call-me-simon');
const security = card('Corpo Security');
const judy = card('Judy Álvarez', 'Braindance Maestro', 'judy-a-lvarez-braindance-maestro');
const cards = [streetkid, roamer, royce, security, judy];

describe('matchImages', () => {
  it('matches by normalized name, slug and a unique name, and lists cards without an image', () => {
    const report = matchImages(
      ['V_Streetkid.webp', 'Royce_Don_t_Call_Me_Simon.webp', 'corpo security.PNG', 'Judy Álvarez — Braindance Maestro.jpg'],
      cards,
    );
    expect(report.matched).toEqual([
      { file: 'Judy Álvarez — Braindance Maestro.jpg', key: 'judy-alvarez-braindance-maestro', rule: 'key' },
      { file: 'Royce_Don_t_Call_Me_Simon.webp', key: 'royce-dont-call-me-simon', rule: 'slug' },
      { file: 'V_Streetkid.webp', key: 'v-streetkid', rule: 'key' },
      { file: 'corpo security.PNG', key: 'corpo-security', rule: 'key' },
    ]);
    expect(report.unmatched).toEqual([]);
    expect(report.missingCards).toEqual([{ key: 'v-roamer-of-the-badlands', displayName: 'V — Roamer of the Badlands' }]);
  });

  it('matches a name without subname only when exactly one card has that name', () => {
    const report = matchImages(['Royce.webp', 'V.webp'], cards);
    expect(report.matched).toEqual([{ file: 'Royce.webp', key: 'royce-dont-call-me-simon', rule: 'name' }]);
    expect(report.unmatched).toEqual([{ file: 'V.webp', reason: 'ambiguous' }]);
  });

  it('lets the map file win over the name, and rejects map entries that point to unknown keys', () => {
    // The user's pack has e.g. a file named after one card that shows another card.
    const report = matchImages(['Corpo_Security.webp', 'Gilded_Mat_n.webp', 'x.webp'], cards, {
      'Corpo_Security.webp': 'v-streetkid',
      'Gilded_Mat_n.webp': 'gilded-maton',
      'x.webp': '__proto__',
      'missing.webp': 'corpo-security',
    });
    expect(report.matched).toEqual([{ file: 'Corpo_Security.webp', key: 'v-streetkid', rule: 'map' }]);
    expect(report.unmatched).toEqual([
      { file: 'Gilded_Mat_n.webp', reason: 'invalid-map-entry' },
      { file: 'x.webp', reason: 'invalid-map-entry' },
    ]);
    expect(report.unusedMapEntries).toEqual(['missing.webp']);
  });

  it('uses neither file when two files match the same card', () => {
    const report = matchImages(['V_Streetkid.webp', 'v-streetkid.png'], cards);
    expect(report.matched).toEqual([]);
    expect(report.unmatched).toEqual([
      { file: 'V_Streetkid.webp', reason: 'conflict' },
      { file: 'v-streetkid.png', reason: 'conflict' },
    ]);
    expect(report.missingCards.map((entry) => entry.key)).toContain('v-streetkid');
  });

  it('ignores hidden files, system files and non-image extensions, and reports unknown names', () => {
    const report = matchImages(['.DS_Store', 'Thumbs.db', 'desktop.ini', 'notes.txt', 'Unknown_Card.webp'], cards);
    expect(report.ignored).toEqual(['.DS_Store', 'Thumbs.db', 'desktop.ini', 'notes.txt']);
    expect(report.unmatched).toEqual([{ file: 'Unknown_Card.webp', reason: 'no-match' }]);
    expect(report.matched).toEqual([]);
  });
});
