import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';
import { storedCollection, storedDecks } from './deckTestUtils';

// v-streetkid has an imported image, so the thumbnail opens the dialog.
const streetkid: Card = {
  id: 'id-v',
  slug: 'v-streetkid',
  name: 'V',
  subname: 'Streetkid',
  displayName: 'V — Streetkid',
  type: 'Legend',
  color: 'Red',
  cost: null,
  power: null,
  ram: null,
  rarity: null,
  key: 'v-streetkid',
};

describe('Catalog: card detail dialog (T-070)', () => {
  it('shows collection and want counters and links to the decks of the card', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories({
      initial: {
        ...storedDecks([{ id: 'a', name: 'Eka', cards: [['v-streetkid', 1]] }]),
        ...storedCollection([['v-streetkid', 1]]),
      },
    });
    render(<CatalogView cards={[streetkid]} repositories={repositories} />);
    await screen.findByText('Pakoissa: 1');
    await user.click(screen.getByRole('button', { name: /^Suurenna kuva: V/ }));
    const dialog = await screen.findByRole('dialog', { name: /Streetkid/ });
    expect(within(dialog).getByRole('heading', { level: 3, name: 'Kokoelmassa' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { level: 3, name: 'Want-listalla' })).toBeInTheDocument();
    expect(within(dialog).getByText('Pelisarja täynnä')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Eka' })).toHaveAttribute('href', '#/pakat/a');
  });
});
