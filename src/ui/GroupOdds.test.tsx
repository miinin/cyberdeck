import { fireEvent, render, screen, within } from '@testing-library/react';
import { toCardsByKey } from '../domain/deckRules';
import { card } from './deckTestUtils';
import { GroupOdds } from './GroupOdds';

describe('GroupOdds (T-075)', () => {
  const cards = [card('a', { cost: 1 }), card('b', { cost: 4, type: 'Gear' })];
  const deck = { name: 'x', sections: [{ name: '', cards: [{ card: 'a', count: 20 }, { card: 'b', count: 20 }] }] };

  it('shows copies and a six-turn table that follows the chosen group', () => {
    render(<GroupOdds deck={deck} cardsByKey={toCardsByKey(cards)} />);
    expect(screen.getByText('Ryhmässä on pakassa 20 korttia.')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7);
    fireEvent.change(screen.getByLabelText('Ryhmä'), { target: { value: 'cost:1' } });
    expect(screen.getByText('Ryhmässä on pakassa 20 korttia.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Ryhmä'), { target: { value: 'type:Program' } });
    expect(screen.getByText('Ryhmässä on pakassa 0 korttia.')).toBeInTheDocument();
  });
});
