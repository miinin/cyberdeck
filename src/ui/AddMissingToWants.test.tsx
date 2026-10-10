import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { CatalogView } from './CatalogView';
import { card, renderRoute, storedCollection, storedDecks } from './deckTestUtils';

const WANTS_KEY = 'cyberdeck:wants';

function storedWants(entries: [string, number][]): Record<string, string> {
  return {
    [WANTS_KEY]: JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-10-01T10:00:00.000Z',
      data: { entries: entries.map(([key, count]) => ({ card: key, count })) },
    }),
  };
}

const wantEntries = async (repositories: Repositories) => (await repositories.wants.load()).value.entries;

const cards = [
  card('l1', { name: 'L1', displayName: 'L1', type: 'Legend' }),
  card('u0', { name: 'Unit 0', displayName: 'Unit 0' }),
  card('u1', { name: 'Unit 1', displayName: 'Unit 1', color: 'Blue' }),
  card('u2', { name: 'Unit 2', displayName: 'Unit 2' }),
];

async function renderCatalog(initial: Record<string, string>) {
  const repositories = createMemoryRepositories({ initial });
  const slot = document.createElement('div');
  document.body.appendChild(slot);
  render(<CatalogView cards={cards} repositories={repositories} headerSlot={slot} />);
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
  return repositories;
}

/** Starts "Merkitse omat kortit" (the button is a tool of marking mode), presses the button and confirms in the dialog. */
async function addFromList(user: ReturnType<typeof userEvent.setup>) {
  const start = screen.queryByRole('button', { name: 'Merkitse omat korttisi' });
  if (start !== null) await user.click(start);
  await user.click(await screen.findByRole('button', { name: 'Lisää puuttuvat wantiin' }));
  const dialog = await screen.findByRole('dialog', { name: /Lisätäänkö/ });
  await user.click(within(dialog).getByRole('button', { name: 'Lisää' }));
}

describe('Add missing to wants in the card list (T-066)', () => {
  it('is only offered while editing the collection, and asks first what will happen', async () => {
    const user = userEvent.setup();
    const repositories = await renderCatalog(storedCollection([['l1', 1], ['u0', 1]]));
    const done = screen.queryByRole('button', { name: 'Lopeta merkitseminen' });
    if (done !== null) await user.click(done);
    expect(screen.queryByRole('button', { name: 'Lisää puuttuvat wantiin' })).toBeNull();
    await user.click(await screen.findByRole('button', { name: 'Merkitse omat korttisi' }));
    await user.click(await screen.findByRole('button', { name: 'Lisää puuttuvat wantiin' }));
    const dialog = await screen.findByRole('dialog', { name: 'Lisätäänkö 3 korttia want-listalle?' });
    expect(dialog).toHaveTextContent('Lisätään want-listalle 3 korttia (yhteensä 8 kappaletta)');
    expect(dialog).toHaveTextContent('Olemassa olevat want-määrät eivät pienene.');
    await user.click(within(dialog).getByRole('button', { name: 'Peruuta' }));
    expect(await wantEntries(repositories)).toEqual([]);
  });

  it('adds every shown card short of a playset up to the playset and tells the count', async () => {
    const user = userEvent.setup();
    const repositories = await renderCatalog({
      ...storedCollection([['l1', 1], ['u0', 1], ['u2', 3]]),
      ...storedWants([['u1', 5]]),
    });
    await addFromList(user);
    expect(await screen.findByText('Lisätty 1 kortti wantiin.')).toHaveAttribute('aria-live', 'polite');
    // l1 and u2 are complete, u1 keeps its larger want (max rule), only u0 changes (3 - 1).
    await waitFor(async () =>
      expect(await wantEntries(repositories)).toEqual([
        { card: 'u0', count: 2 },
        { card: 'u1', count: 5 },
      ]),
    );
    await addFromList(user);
    expect(await screen.findByText('Kaikki jo wantissa.')).toBeInTheDocument();
  });

  it('uses only the cards that match the filters', async () => {
    const user = userEvent.setup();
    const repositories = await renderCatalog(storedCollection([]));
    await user.click(screen.getByRole('checkbox', { name: /Blue/ }));
    await addFromList(user);
    expect(await screen.findByText('Lisätty 1 kortti wantiin.')).toBeInTheDocument();
    await waitFor(async () => expect(await wantEntries(repositories)).toEqual([{ card: 'u1', count: 3 }]));
  });
});

describe('Add missing to wants in the deck list (T-066)', () => {
  it('has a button per deck with the deck name, only for decks with missing cards', async () => {
    const user = userEvent.setup();
    const repositories = renderRoute(
      '#/pakat',
      createMemoryRepositories({
        initial: {
          ...storedDecks([
            { id: 'a', name: 'Puutteellinen', cards: [['u0', 3], ['u1', 1]] },
            { id: 'b', name: 'Valmis', cards: [['u0', 1]] },
          ]),
          ...storedCollection([['u0', 1], ['u1', 1]]),
        },
      }),
    );
    const items = await screen.findAllByRole('listitem');
    const first = items.find((item) => within(item).queryByText('Puutteellinen') !== null) as HTMLElement;
    await waitFor(() =>
      expect(within(first).getByRole('button', { name: 'Lisää puuttuvat wantiin: Puutteellinen' })).toBeEnabled(),
    );
    expect(screen.queryByRole('button', { name: 'Lisää puuttuvat wantiin: Valmis' })).toBeNull();
    await user.click(within(first).getByRole('button', { name: 'Lisää puuttuvat wantiin: Puutteellinen' }));
    expect(await within(first).findByText('Lisätty 1 kortti wantiin.')).toBeInTheDocument();
    await waitFor(async () => expect(await wantEntries(repositories)).toEqual([{ card: 'u0', count: 2 }]));
  });
});

describe('Add missing to wants in the editor (T-066)', () => {
  it('shows the button without opening the missing list', async () => {
    renderRoute(
      '#/pakat/a',
      createMemoryRepositories({
        initial: {
          ...storedDecks([{ id: 'a', name: 'Oma', cards: [['u0', 3]] }]),
          ...storedCollection([['u0', 1]]),
        },
      }),
    );
    await screen.findByText('Kokoelmasta puuttuu 2 korttia.');
    const button = screen.getByRole('button', { name: 'Lisää puuttuvat wantiin' });
    expect(button.closest('details')).toBeNull();
  });
});
