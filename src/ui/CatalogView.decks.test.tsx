import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { renderRoute, storedDecks } from './deckTestUtils';

const twoDecks = () =>
  createMemoryRepositories({
    initial: storedDecks([
      { id: 'a', name: 'Eka', cards: [['u0', 2], ['l1', 1]] },
      { id: 'b', name: 'Toka', cards: [['u0', 1]] },
    ]),
  });

describe('Catalog: decks of a card', () => {
  it('does not show the deck count on the card box (T-187); the table still does', async () => {
    const user = userEvent.setup();
    renderRoute('#/', twoDecks());
    await screen.findByRole('heading', { level: 3, name: 'Unit 0' });
    expect(screen.queryByText(/pakassa/)).not.toBeInTheDocument();
    const box = screen.getByRole('heading', { level: 3, name: 'Unit 0' }).closest('li') as HTMLElement;
    expect(box).not.toHaveTextContent('◧');
    await user.click(screen.getByRole('radio', { name: 'Lista' }));
    expect(await screen.findByText('2 pakassa: Eka, Toka')).toBeInTheDocument();
  });

  it('shows the mention in the table view too, in a column of its own', async () => {
    const user = userEvent.setup();
    renderRoute('#/', twoDecks());
    await user.click(screen.getByRole('radio', { name: 'Lista' }));
    const table = await screen.findByRole('table');
    await within(table).findByText('2 pakassa: Eka, Toka');
    expect(within(table).getByRole('columnheader', { name: 'Pakoissa' })).toBeInTheDocument();
    const row = within(table).getByRole('rowheader', { name: /Unit 0/ }).closest('tr') as HTMLElement;
    expect(row.querySelector('.cell-decks')).toHaveTextContent('2');
    expect(within(row).getByText('2 pakassa: Eka, Toka')).toBeInTheDocument();
  });
});
