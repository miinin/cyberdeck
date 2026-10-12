import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { CardImageDialog } from './CardImageDialog';

const card: Card = {
  id: 'id-h', key: 'hanako', slug: 'hanako', name: 'Hanako Arasaka', subname: null, displayName: 'Hanako Arasaka',
  type: 'Legend', color: 'Yellow', cost: null, power: null, ram: null, rarity: 'Rare', tags: ['Arasaka', 'Corpo'],
};

describe('card tags in the card details (T-152)', () => {
  it('shows the tags as buttons that show every card with the tag', async () => {
    const onTagClick = vi.fn();
    render(<CardImageDialog card={card} onClose={() => undefined} onTagClick={onTagClick} />);
    const tags = screen.getByRole('list', { name: 'Tagit', hidden: true });
    expect(within(tags).getAllByRole('listitem', { hidden: true }).map((item) => item.textContent)).toEqual(['Arasaka', 'Corpo']);
    await userEvent.click(within(tags).getByRole('button', { name: 'Näytä kaikki Arasaka-kortit', hidden: true }));
    expect(onTagClick).toHaveBeenCalledWith('Arasaka');
  });

  it('shows them as plain text without a handler, and nothing for a card without tags', () => {
    const { rerender } = render(<CardImageDialog card={card} onClose={() => undefined} />);
    const tags = screen.getByRole('list', { name: 'Tagit', hidden: true });
    expect(within(tags).queryByRole('button', { hidden: true })).toBeNull();
    rerender(<CardImageDialog card={{ ...card, tags: [] }} onClose={() => undefined} />);
    expect(screen.queryByRole('list', { name: 'Tagit', hidden: true })).toBeNull();
  });
});
