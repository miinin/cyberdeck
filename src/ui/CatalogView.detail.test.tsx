import { fireEvent, render, screen, within } from '@testing-library/react';
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
    await user.click(await screen.findByRole('button', { name: /^Suurenna kuva: V/ }));
    const dialog = await screen.findByRole('dialog', { name: /Streetkid/ });
    expect(within(dialog).getByRole('heading', { level: 3, name: 'Kokoelmassa' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { level: 3, name: 'Want-listalla' })).toBeInTheDocument();
    expect(within(dialog).getByText('Pelisarja täynnä')).toBeInTheDocument();
    expect(await within(dialog).findByRole('link', { name: 'Eka' })).toHaveAttribute('href', '#/pakat/a');
  });
});

describe('Catalog: full-screen card image (T-091)', () => {
  it('opens the whole card on the whole screen; Esc and a tap return to the details', async () => {
    const user = userEvent.setup();
    render(<CatalogView cards={[streetkid]} repositories={createMemoryRepositories()} />);
    await user.click(await screen.findByRole('button', { name: /^Suurenna kuva: V/ }));
    const dialog = await screen.findByRole('dialog', { name: /Streetkid/ });

    const open = within(dialog).getByRole('button', { name: 'Näytä koko ruudulla' });
    await user.click(open);
    const close = within(dialog).getByRole('button', { name: 'Sulje koko ruudun kuva' });
    expect(close).toHaveFocus();
    await user.click(close);
    expect(within(dialog).queryByRole('button', { name: 'Sulje koko ruudun kuva' })).not.toBeInTheDocument();
    expect(open).toHaveFocus();

    await user.click(open);
    // Esc on a modal dialog is a cancel event (jsdom does not map the key itself).
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(within(dialog).queryByRole('button', { name: 'Sulje koko ruudun kuva' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /Streetkid/ })).toBeInTheDocument();
  });
});
