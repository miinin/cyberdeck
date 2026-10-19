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
  it('mentions how many decks a card is in as an icon and a number, and names them for screen readers and the tooltip', async () => {
    renderRoute('#/', twoDecks());
    const mention = await screen.findAllByText('2 pakassa: Eka, Toka');
    expect(mention).toHaveLength(1);
    const paragraph = mention[0]?.closest('p') as HTMLElement;
    expect(paragraph).toHaveAttribute('title', 'Pakoissa: Eka, Toka');
    expect(paragraph).toHaveTextContent('◧ 2');
    expect(paragraph.querySelector('[aria-hidden="true"]')).toHaveTextContent('◧ 2');
    expect(paragraph.closest('li')).toHaveTextContent('Unit 0');
    expect(screen.getByText('1 pakassa: Eka')).toBeInTheDocument();
  });

  it('says nothing for a card that is in no deck', async () => {
    renderRoute('#/', twoDecks());
    await screen.findByText('2 pakassa: Eka, Toka');
    const card = screen.getByRole('heading', { level: 3, name: 'Unit 5' }).closest('li') as HTMLElement;
    expect(card).not.toHaveTextContent('pakassa');
  });

  it('shows the mention in the table view too, in a column of its own', async () => {
    const user = userEvent.setup();
    renderRoute('#/', twoDecks());
    await screen.findByText('2 pakassa: Eka, Toka');
    await user.click(screen.getByRole('radio', { name: 'Lista' }));
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Pakoissa' })).toBeInTheDocument();
    const row = within(table).getByRole('rowheader', { name: /Unit 0/ }).closest('tr') as HTMLElement;
    expect(row.querySelector('.cell-decks')).toHaveTextContent('2');
    expect(within(row).getByText('2 pakassa: Eka, Toka')).toBeInTheDocument();
  });
});
