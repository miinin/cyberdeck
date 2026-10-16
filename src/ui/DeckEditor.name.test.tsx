import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { renderRoute, storedDecks } from './deckTestUtils';

describe('Deck editor: the name field (UX-21, T-174)', () => {
  it('is a growing multi-line field that keeps the name on one line', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories({
      initial: storedDecks([{ id: 'a', name: 'Vihreä-punainen turnauspakka jolla on pitkä nimi joka ei mahdu', cards: [['u0', 1]] }]),
    });
    renderRoute('#/pakat/a', repositories);
    const field = await screen.findByRole('textbox', { name: 'Pakan nimi' });
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveValue('Vihreä-punainen turnauspakka jolla on pitkä nimi joka ei mahdu');
    await user.click(field);
    await user.keyboard('{Enter}');
    expect(field).not.toHaveValue(expect.stringContaining('\n'));
    await user.clear(field);
    await user.paste('Rivi 1\nRivi 2');
    expect(field).toHaveValue('Rivi 1 Rivi 2');
  });
});
