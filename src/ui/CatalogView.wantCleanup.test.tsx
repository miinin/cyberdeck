import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

const cards: Card[] = [
  { id: 'id-a', key: 'a', slug: 'a', name: 'Alpha', subname: null, displayName: 'Alpha', type: 'Unit', color: 'Red', cost: 2, power: null, ram: null, rarity: null },
];

async function settle() {
  await act(async () => {
    for (let round = 0; round < 8; round += 1) await Promise.resolve();
  });
}

describe('CatalogView: Want cleanup prompt', () => {
  it('asks after adding a wanted card and reduces the want list on "Vähennä Wantilta"', async () => {
    const repositories = createMemoryRepositories();
    await repositories.preferences.saveEditMode(true);
    await repositories.wants.setCount('a', 3);
    const slot = document.createElement('div');
    document.body.appendChild(slot);
    render(<CatalogView cards={cards} repositories={repositories} headerSlot={slot} />);
    await settle();

    await userEvent.click(within(screen.getByRole('list')).getByRole('button', { name: 'Lisää yksi kappale: Alpha' }));
    await settle();
    expect(await screen.findByText(/Lisäsit kokoelmaan Wantilla olevia kortteja: Alpha/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Vähennä Wantilta' }));
    await settle();
    expect((await repositories.wants.load()).value.entries).toEqual([{ card: 'a', count: 2 }]);
    expect(screen.queryByRole('button', { name: 'Vähennä Wantilta' })).toBeNull();
  });
});
