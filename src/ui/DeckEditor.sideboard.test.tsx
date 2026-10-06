import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { createMemoryRepositories } from '../storage';
import { storedDecks, testCards } from './deckTestUtils';

// T-074: a card goes to the sideboard straight from the result picker.

async function openEditor(cardsInDeck: [string, number][]) {
  window.location.hash = '#/pakat/a';
  const repositories = createMemoryRepositories({
    initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards: cardsInDeck }]),
  });
  render(<App cards={testCards} repositories={repositories} />);
  await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
}

const table = () => screen.getByRole('table', { name: 'Hakutulokset' });

describe('Add to sideboard from the picker', () => {
  it('adds a copy to the sideboard and counts it toward the copy limit', async () => {
    await openEditor([['u3', 2]]);
    const add = () =>
      within(table()).getByRole('button', {
        name: 'Lisää sideboardiin: Unit 3',
      });
    fireEvent.click(add());
    expect(screen.getByRole('heading', { name: 'Sideboard (1/7)' })).toBeInTheDocument();
    fireEvent.click(add());
    expect(screen.getByRole('heading', { name: 'Sideboard (1/7)' })).toBeInTheDocument();
    expect(screen.getByText(/yhteensä jo 3 kopiota/)).toBeInTheDocument();
  }, 20000);

  // T-092: a Legend cannot go to the sideboard, so it gets no button that would only show a refusal.
  it('offers no sideboard button for a Legend, but does for a Unit', async () => {
    await openEditor([]);
    expect(within(table()).queryByRole('button', { name: 'Lisää sideboardiin: L1' })).not.toBeInTheDocument();
    expect(within(table()).getByRole('button', { name: 'Lisää sideboardiin: Unit 3' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sideboard (0/7)' })).toBeInTheDocument();
  }, 20000);

  it('shows the rule toast in a status region outside the result list (no jump)', async () => {
    await openEditor([['u3', 3]]);
    fireEvent.click(within(table()).getByRole('button', { name: 'Lisää sideboardiin: Unit 3' }));
    const toast = screen.getByText(/yhteensä jo 3 kopiota/);
    expect(toast.closest('[role="status"]')).toHaveClass('toast-slot');
    expect(table()).not.toContainElement(toast);
  }, 20000);

  it('labels the sideboard stepper as the sideboard and announces a move to the main deck', async () => {
    await openEditor([['u3', 1]]);
    fireEvent.click(within(table()).getByRole('button', { name: 'Lisää sideboardiin: Unit 3' }));
    expect(screen.getByRole('button', { name: 'Poista sideboardista: Unit 3' })).toBeInTheDocument();
    expect(screen.getByText('Sideboardissa 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Siirrä pääpakkaan/ }));
    expect(screen.getByText('Unit 3 siirretty pääpakkaan.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sideboard (0/7)' })).toHaveFocus();
  }, 20000);
});
