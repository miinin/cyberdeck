import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { renderRoute, storedCollection, storedDecks } from './deckTestUtils';

describe('Deck editor: a copy with own cards (T-121)', () => {
  it('shows the playability, makes a private copy with stand-ins and opens it, leaving the original alone', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories({
      initial: {
        ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: [['l1', 1], ['u0', 3]] }]),
        ...storedCollection([['l1', 1], ['u0', 1], ['u1', 3]]),
      },
    });
    renderRoute('#/pakat/a', repositories);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(await screen.findByRole('button', { name: 'Tilastot' }));
    expect(await screen.findByText('Omilla korteilla 1 / 3 · korvaajilla 3 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tee kopio omilla korteilla' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Oma pakka (omat kortit)' })).toBeInTheDocument();
    const decks = (await repositories.decks.list()).value;
    expect(decks).toHaveLength(2);
    const original = decks.find((deck) => deck.id === 'a');
    const copy = decks.find((deck) => deck.id !== 'a');
    expect(original?.sections.flatMap((s) => s.cards)).toEqual([{ card: 'l1', count: 1 }, { card: 'u0', count: 3 }]);
    await waitFor(() => expect(copy?.sections.flatMap((s) => s.cards)).toEqual(
      expect.arrayContaining([{ card: 'u0', count: 1 }, { card: 'u1', count: 2 }, { card: 'l1', count: 1 }]),
    ));
    expect(copy?.publish?.public ?? false).toBe(false);
  });

  it('has no copy button when nothing can be swapped', async () => {
    const repositories = createMemoryRepositories({
      initial: {
        ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: [['u0', 3]] }]),
        ...storedCollection([['u0', 1]]),
      },
    });
    renderRoute('#/pakat/a', repositories);
    await screen.findByText('Omilla korteilla 1 / 3');
    expect(screen.queryByRole('button', { name: 'Tee kopio omilla korteilla' })).toBeNull();
  });
});

describe('Deck editor: the collection filter of the results (UX-09, T-174)', () => {
  const setup = () =>
    createMemoryRepositories({
      initial: {
        ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: [['u0', 1]] }]),
        ...storedCollection([['u1', 2], ['u2', 1]]),
      },
    });

  it('stays on "Kaikki" by default and shows how many copies are owned on each result', async () => {
    renderRoute('#/pakat/a', setup());
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(await screen.findByRole('radio', { name: 'Kaikki' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Omistetut' })).not.toBeChecked();
    expect((await screen.findAllByText('Omistat 2')).length).toBeGreaterThan(0);
  });

  it('shows only the owned cards with "Omistetut" and clears the choice with its chip', async () => {
    const user = userEvent.setup();
    renderRoute('#/pakat/a', setup());
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const total = 3 + 14 + 1;
    expect(await screen.findByText(`${total} / ${total} korttia`)).toBeInTheDocument();
    await user.click(await screen.findByRole('radio', { name: 'Omistetut' }));
    expect(await screen.findByText(`2 / ${total} korttia`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tyhjennä haku ja suodattimet/ }));
    expect(await screen.findByText(`${total} / ${total} korttia`)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Kaikki' })).toBeChecked();
  });
});
