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
    expect(screen.getByText(/2 versiota|2 versions/)).toBeInTheDocument();
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
    expect(within(boxes[1] as HTMLElement).getAllByText('Nova Rare').length).toBeGreaterThan(0);
    await userEvent.click(within(boxes[1] as HTMLElement).getAllByRole('button').find((b) => b.classList.contains('step-plus')) as HTMLElement);
    expect(onArtChange).toHaveBeenCalledWith(card, arts[1], 2);
  });

  it('cycles the shown version with the arrows and opens it on click', async () => {
    const onOpenImage = vi.fn();
    render(
      <CardList cards={[card]} items={[{ card, art: null, imageUrl: null, artCount: 2, versionUrls: [null, '/nova.webp'], startVersion: 0 }]} onOpenImage={onOpenImage} />,
    );
    expect(screen.getByText(/^1.2 /)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Seuraava versio: V|Next version: V/ }));
    expect(screen.getByText(/^2.2 /)).toBeInTheDocument();
    expect(document.querySelector('img.card-image')?.getAttribute('src')).toBe('/nova.webp');
    await userEvent.click(screen.getByRole('button', { name: /Seuraava versio: V|Next version: V/ }));
    expect(screen.getByText(/^1.2 /)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Edellinen versio: V|Previous version: V/ }));
    await userEvent.click(document.querySelector('.card-image-button') as HTMLElement);
    expect(onOpenImage).toHaveBeenCalledWith(card, expect.anything(), '/nova.webp');
  });

  it('shows the rarity symbol of the shown version, and follows the arrows', async () => {
    const rarityOfBox = () => document.querySelector('.card-rarity .rarity-symbol')?.textContent;
    render(
      <CardList
        cards={[card]}
        items={[{ card, art: null, imageUrl: null, artCount: 2, versionUrls: [null, '/nova.webp'], versionRarities: ['Rare', 'Nova Rare'], startVersion: 0 }]}
        onOpenImage={vi.fn()}
      />,
    );
    expect(rarityOfBox()).toBe('Rare');
    await userEvent.click(screen.getByRole('button', { name: /Seuraava versio: V|Next version: V/ }));
    expect(rarityOfBox()).toBe('Nova Rare');
  });

  it('starts from the version a filter matches and labels an art box with its own rarity', () => {
    const { unmount } = render(
      <CardList
        cards={[card]}
        items={[{ card, art: null, imageUrl: '/nova.webp', artCount: 2, versionUrls: [null, '/nova.webp'], versionRarities: ['Rare', 'Nova Rare'], startVersion: 1 }]}
        onOpenImage={vi.fn()}
      />,
    );
    expect(document.querySelector('.card-rarity .rarity-symbol')?.textContent).toBe('Nova Rare');
    unmount();
    render(<CardList cards={[card]} items={[{ card, art: arts[1] ?? null, imageUrl: '/nova.webp', artCount: 2 }]} onOpenImage={vi.fn()} />);
    expect(document.querySelector('.card-rarity .rarity-symbol')?.textContent).toBe('Nova Rare');
  });

  it('shows no arrows for a single version', () => {
    render(<CardList cards={[card]} items={[{ card, art: null, imageUrl: null, artCount: 1, versionUrls: [null] }]} onOpenImage={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /versio|version/i })).toBeNull();
  });
});
