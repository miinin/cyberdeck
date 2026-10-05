import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RARITY_KEYS, RaritySymbol } from './RaritySymbol';

describe('RaritySymbol', () => {
  it('has all seven official rarities', () => {
    expect(RARITY_KEYS).toEqual(['Common', 'Uncommon', 'Rare', 'Epic Rare', 'Secret Rare', 'Iconic Rare', 'Nova Rare']);
  });

  it.each(RARITY_KEYS)('draws %s with a tooltip and its name for screen readers', (rarity) => {
    const { container } = render(<RaritySymbol rarity={rarity} />);
    expect(container.querySelector('svg[aria-hidden="true"] path')).not.toBeNull();
    expect(screen.getByText(rarity)).toHaveClass('visually-hidden');
    expect(container.querySelector('.rarity-symbol')?.getAttribute('title')).toMatch(new RegExp(`^${rarity} – .+`));
  });

  it('maps raw names and shows the name beside the symbol on request', () => {
    render(<RaritySymbol rarity="Iconic Legend" showName />);
    expect(screen.getByText('Iconic Rare')).not.toHaveClass('visually-hidden');
  });

  it('falls back to the plain name for an unknown rarity', () => {
    const { container } = render(<RaritySymbol rarity="Mythic" />);
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByText('Mythic')).toBeInTheDocument();
  });
});
