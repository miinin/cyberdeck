import type { Card } from './card';

/** Small card set for export and import tests. */
function card(name: string, subname: string | null, type = 'Unit'): Card {
  const display = subname ? `${name} — ${subname}` : name;
  const key = `${name} ${subname ?? ''}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return { id: key, slug: key, name, subname, displayName: display, type, color: 'Red', cost: 1, power: 1, ram: 1, rarity: null, key };
}

export const CARDS: readonly Card[] = [
  card('V', 'Streetkid', 'Legend'),
  card('Panam Palmer', 'Nomad Cavalry', 'Legend'),
  card('Detonate', null, 'Program'),
  card('Chrome Fang', null),
];
