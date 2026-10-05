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
  it('mentions how many decks a card is in and names them for screen readers and the tooltip', async () => {
    renderRoute('#/', twoDecks());
    const mention = await screen.findAllByText('Pakoissa: 2');
    expect(mention).toHaveLength(1);
    const paragraph = mention[0]?.closest('p') as HTMLElement;
    expect(paragraph).toHaveAttribute('title', 'Pakoissa: Eka, Toka');
    expect(paragraph).toHaveTextContent('Pakoissa: Eka, Toka');
    expect(paragraph.closest('li')).toHaveTextContent('Unit 0');
    expect(screen.getByText('Pakoissa: 1')).toBeInTheDocument();
  });

  it('says nothing for a card that is in no deck', async () => {
    renderRoute('#/', twoDecks());
    await screen.findByText('Pakoissa: 2');
    const card = screen.getByRole('heading', { level: 3, name: 'Unit 5' }).closest('li') as HTMLElement;
    expect(card).not.toHaveTextContent('Pakoissa');
  });

  it('shows the mention in the table view too', async () => {
    const user = userEvent.setup();
    renderRoute('#/', twoDecks());
    await screen.findByText('Pakoissa: 2');
    await user.click(screen.getByRole('radio', { name: 'Lista' }));
    const row = within(await screen.findByRole('table')).getByRole('rowheader', { name: /Unit 0/ }).closest('tr') as HTMLElement;
    expect(row).toHaveTextContent('Pakoissa: 2');
  });
});
