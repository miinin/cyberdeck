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

  it('lists the problems as text without a "show row" button (T-103)', async () => {
    openEditor([['u0', 20], ['u1', 20], ['u2', 15]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(screen.getAllByRole('listitem').some((item) => item.textContent?.includes('Unit 0'))).toBe(true);
    expect(screen.queryByRole('button', { name: /^Näytä pakassa/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Näytä rivi')).not.toBeInTheDocument();
  });
});

describe('Legends as a section like the main deck (T-103)', () => {
  it('shows the Legends as deck rows with free slots as placeholder rows', async () => {
    openEditor([['l1', 1], ['l2', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const heading = within(deckRegion()).getByRole('heading', { level: 2, name: 'Legendit (2/3)' });
    const list = heading.closest('.deck-section')?.querySelector('ul.deck-tiles') as HTMLElement;
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveClass('deck-tile');
    expect(rows[0]).toHaveTextContent('L1');
    expect(rows[1]).toHaveTextContent('L2');
    expect(rows[2]).toHaveTextContent('Vapaa Legend-paikka');
    expect(deckRegion().querySelector('.legend-slots, .legend-names')).toBeNull();
  });

  it('shows the Legends as cards with their own controls in the stacks view', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(screen.getByRole('radio', { name: 'Pinot' }));
    const heading = within(deckRegion()).getByRole('heading', { level: 2, name: 'Legendit (1/3)' });
    const section = heading.closest('.deck-section') as HTMLElement;
    expect(within(section).getByRole('button', { name: 'Suurenna kuva: L1, 1 pakassa' })).toBeInTheDocument();
    expect(within(section).getAllByText('Vapaa Legend-paikka')).toHaveLength(2);
    await user.click(within(section).getByRole('button', { name: 'Poista pakasta: L1' }));
    expect(within(section).getAllByText('Vapaa Legend-paikka')).toHaveLength(3);
  });
});

describe('Stacks by colour and type (T-103)', () => {
  it('groups the stacks by colour, then type, and keeps the list by type', async () => {
    const user = userEvent.setup();
    openEditor([['u0', 3], ['u1', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(within(deckRegion()).getByRole('heading', { level: 3, name: 'Unit (4)' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Pinot' }));
    expect(within(deckRegion()).getByRole('heading', { level: 3, name: 'Red · Unit (4)' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('group', { name: 'Pakkanäkymä' })).getByRole('radio', { name: 'Lista' }));
    expect(within(deckRegion()).getByRole('heading', { level: 3, name: 'Unit (4)' })).toBeInTheDocument();
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
