/** Small hand-made Netdeck.gg responses for tests. No real API data beyond the field shape. */

/** Shape of a real card from the API (shortened, no signed image URL). */
export const realShapeCard = {
  id: '6f1d2c1e-0000-4000-8000-000000000001',
  slug: 'v-streetkid',
  name: 'V',
  subname: 'Streetkid',
  canonical_name: 'V — Streetkid',
  card_type: 'Legend',
  color: 'Red',
  cost: null,
  power: null,
  rules_text: 'When you {Call} this Legend, draw a card.',
  keywords: [],
  image_url: 'https://images.example.invalid/v-streetkid.webp?Signature=abc',
  printings: [{ collector_number: '005a', set: { name: 'Alpha' } }],
};

export function rawCard(index: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `id-${index}`,
    slug: `card-${index}`,
    name: `Card ${index}`,
    subname: null,
    canonical_name: `Card ${index}`,
    card_type: 'Unit',
    color: 'Blue',
    cost: index,
    ...overrides,
  };
}

export function page(items: unknown[], total: number, limit: number, offset: number) {
  return { items, total, limit, offset };
}

/** total 5, limit 2 → pages at offsets 0, 2, 4. */
export const fivePages = {
  0: page([rawCard(1), rawCard(2)], 5, 2, 0),
  2: page([rawCard(3), rawCard(4)], 5, 2, 2),
  4: page([rawCard(5)], 5, 2, 4),
} as const;
