import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { renderRoute, storedDecks } from './deckTestUtils';

// A deck changed in another tab or by a sync while the editor is open (T-042, T-054d).

function openEditor() {
  return renderRoute(
    '#/pakat/a',
    createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards: [] }]) }),
  );
}

const content = (name: string) => ({ name, sections: [{ name: '', cards: [{ card: 'u3', count: 1 }] }] });
const searchList = () => screen.getByRole('table', { name: 'Hakutulokset' });

describe('Deck editor: the deck changes elsewhere', () => {
  it('shows the newest version when a sync changed the deck and there are no unsaved changes', async () => {
    const repositories = openEditor();
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });

    const local = repositories.sync.read();
    const deck = await repositories.decks.get('a');
    if (local === null || deck === null) throw new Error('test setup');
    repositories.sync.apply(local, {
      decks: [{ ...deck, ...content('Muualla muutettu'), updatedAt: '2030-01-01T00:00:00.000Z' }],
      collection: local.collection,
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Muualla muutettu' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers to load the newest version or to keep the own changes when there are unsaved changes', async () => {
    const user = userEvent.setup();
    const repositories = openEditor();
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: Unit 3' }));
    // Another tab saves before our autosave runs.
    await repositories.decks.update('a', content('Toisen välilehden pakka'));

    const alert = await screen.findByRole('alert', {}, { timeout: 3000 });
    expect(alert).toHaveTextContent('Pakkaa on muutettu toisessa välilehdessä tai toisella laitteella');
    // Nothing of ours was written over the other change.
    expect((await repositories.decks.get('a'))?.name).toBe('Toisen välilehden pakka');

    await user.click(within(alert).getByRole('button', { name: 'Pidä omat muutokset' }));
    await waitFor(async () => expect((await repositories.decks.get('a'))?.name).toBe('Oma pakka'));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('loads the newest version and drops the own changes on request', async () => {
    const user = userEvent.setup();
    const repositories = openEditor();
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: Unit 3' }));
    await repositories.decks.update('a', content('Toisen välilehden pakka'));

    const alert = await screen.findByRole('alert', {}, { timeout: 3000 });
    await user.click(within(alert).getByRole('button', { name: 'Lataa uusin' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Toisen välilehden pakka' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect((await repositories.decks.get('a'))?.name).toBe('Toisen välilehden pakka');
  });
});
