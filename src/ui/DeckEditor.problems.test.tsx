import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { legalCards, renderRoute, storedDecks } from './deckTestUtils';

// T-101: problem rows and sections are marked in the list, Legends are also text, the sideboard has the stacks view.

function openEditor(cardsInDeck: [string, number][]) {
  return renderRoute('#/pakat/a', createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards: cardsInDeck }]) }));
}

const deckRegion = () => screen.getByRole('region', { name: /pakan kortit/ });
const row = (key: string) => {
  const found = deckRegion().querySelector<HTMLElement>(`[data-deck-row="${key}"]`);
  if (found === null) throw new Error(`No row ${key}`);
  return found;
};

describe('Problem marks in the deck list (T-101)', () => {
  it('marks the rows over the copy limit and the main deck count, and leaves a legal deck clean', async () => {
    openEditor([['u0', 20], ['u1', 20], ['u2', 15]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(row('u0')).toHaveClass('is-problem');
    expect(within(row('u0')).getByText('Ongelma: liikaa kopioita')).toBeInTheDocument();
    expect(within(deckRegion()).getByText('⚠ yli 50')).toBeInTheDocument();
    // No Legends at all.
    expect(within(deckRegion()).getByText('⚠ ei 3')).toBeInTheDocument();
  });

  it('has no marks in a legal deck', async () => {
    openEditor(legalCards());
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(deckRegion().querySelector('.problem-flag')).toBeNull();
    expect(deckRegion().querySelector('.is-problem')).toBeNull();
  });

  it('marks a sideboard of the wrong size', async () => {
    openEditor([['u0', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(screen.queryByText('⚠ ei 0 eikä 7')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Lisää sideboardiin: Unit 3' }));
    expect(screen.getByText('⚠ ei 0 eikä 7')).toBeInTheDocument();
  });

  it('moves focus to the row from the issue list', async () => {
    const user = userEvent.setup();
    openEditor([['u0', 20], ['u1', 20], ['u2', 15]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(screen.getAllByRole('button', { name: /^Näytä pakassa: Unit/ })[0] as HTMLElement);
    const focused = document.activeElement as HTMLElement;
    expect(focused.closest('[data-deck-row]')).toBe(row('u0'));
  });
});

describe('Legend names as text (T-101)', () => {
  it('lists the Legends under the image slots', async () => {
    openEditor([['l1', 1], ['l2', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const names = within(deckRegion()).getByRole('list', { name: 'Legendit' });
    expect(within(names).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['L1', 'L2']);
  });
});

describe('Sideboard in the stacks view (T-101)', () => {
  it('shows the sideboard as stacks with the same controls', async () => {
    const user = userEvent.setup();
    openEditor([['u0', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    fireEvent.click(screen.getByRole('button', { name: 'Lisää sideboardiin: Unit 3' }));
    expect(row('u3').classList.contains('deck-tile')).toBe(true);
    await user.click(screen.getByRole('radio', { name: 'Pinot' }));
    expect(row('u3').classList.contains('stack-card')).toBe(true);
    expect(within(row('u3')).getByRole('button', { name: 'Suurenna kuva: Unit 3, 1 pakassa' })).toBeInTheDocument();
    await user.click(within(row('u3')).getByRole('button', { name: 'Lisää sideboardiin: Unit 3' }));
    expect(screen.getByRole('heading', { name: 'Sideboard (2/7)' })).toBeInTheDocument();
    await user.click(within(row('u3')).getByRole('button', { name: 'Siirrä pääpakkaan: Unit 3' }));
    expect(screen.getByRole('heading', { name: 'Sideboard (1/7)' })).toBeInTheDocument();
  });
});
