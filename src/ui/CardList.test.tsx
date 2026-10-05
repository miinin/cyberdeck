import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { artsOf } from '../domain/arts';
import type { Card } from '../domain/card';
import { CardList } from './CardList';

const card: Card = {
  id: 'v', slug: 'v', name: 'V', subname: null, displayName: 'V', type: 'Unit', color: 'Red',
  cost: 1, power: 1, ram: 1, rarity: null, key: 'v',
  printings: [
    { key: 'r:1', setCode: 'r', setName: 'S — Retail', number: '1', rarity: 'Rare', language: 'en', artist: null, imageKey: 'x' },
    { key: 'r:2', setCode: 'r', setName: 'S — Retail', number: '2', rarity: 'Nova Rare', language: 'en', artist: null, imageKey: 'x' },
  ],
};
const arts = artsOf(card);

describe('CardList arts', () => {
  it('marks a card with several arts with a count and gives the special art picture', () => {
    render(<CardList cards={[card]} items={[{ card, art: null, imageUrl: '/nova.webp', artCount: 2 }]} onOpenImage={vi.fn()} />);
    expect(screen.getByText(/2 kuvitusta|2 arts/)).toBeInTheDocument();
    expect(document.querySelector('img.card-image')?.getAttribute('src')).toBe('/nova.webp');
  });

  it('shows one box per art with its label and counts that art', async () => {
    const onArtChange = vi.fn();
    const items = arts.map((art) => ({ card, art, imageUrl: null, artCount: arts.length }));
    render(
      <CardList
        cards={[card]}
        items={items}
        owned={{ mode: 'ready', countOf: () => 5, onChange: vi.fn(), onLimit: vi.fn(), editable: true, artCountOf: (_c, art) => (art.rarity === null ? 4 : 1), onArtChange }}
        onOpenImage={vi.fn()}
      />,
    );
    const boxes = screen.getAllByRole('listitem');
    expect(boxes).toHaveLength(2);
    expect(within(boxes[1] as HTMLElement).getByText('Nova Rare')).toBeInTheDocument();
    await userEvent.click(within(boxes[1] as HTMLElement).getAllByRole('button').find((b) => b.classList.contains('step-plus')) as HTMLElement);
    expect(onArtChange).toHaveBeenCalledWith(card, arts[1], 2);
  });
});
