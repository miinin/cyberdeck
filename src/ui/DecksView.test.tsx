import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { legalCards, renderRoute, storedCollection, storedDecks } from './deckTestUtils';

const renderDecks = (repositories = createMemoryRepositories()) => renderRoute('#/pakat', repositories);

describe('Pakat list', () => {
  it('shows an empty state and the navigation', async () => {
    renderDecks();
    expect(await screen.findByText(/ei ole vielä pakkoja/)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Päävalikko' });
    expect(within(nav).getByRole('link', { name: 'Pakat' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Kortit' })).not.toHaveAttribute('aria-current');
  });

  it('shows name, counts, legality and the modified time of each deck', async () => {
    renderDecks(
      createMemoryRepositories({
        initial: storedDecks([
          { id: 'a', name: 'Valmis', cards: legalCards() },
          { id: 'b', name: 'Kesken', cards: [['l1', 1], ['u0', 4]] },
        ]),
      }),
    );
    const [ready, unfinished] = await screen.findAllByRole('listitem');
    expect(ready).toHaveTextContent('Valmis');
    expect(ready).toHaveTextContent('Legendit 3/3 · Pääpakka 40/40–50');
    expect(ready).toHaveTextContent('Laillinen');
    expect(unfinished).toHaveTextContent('Legendit 1/3 · Pääpakka 4/40–50');
    // legend count, main size and the fourth copy
    expect(unfinished).toHaveTextContent('Keskeneräinen · 3 rikettä');
    expect(within(ready as HTMLElement).getByText(/Muokattu/)).toBeInTheDocument();
  });

  it('creates a deck with a numbered default name and opens it', async () => {
    const user = userEvent.setup();
    const repositories = renderDecks(
      createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Uusi pakka', cards: [] }]) }),
    );
    await user.click(await screen.findByRole('button', { name: 'Uusi pakka' }));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/pakat\/.+/));
    const { value } = await repositories.decks.list();
    expect(value.map((deck) => deck.name)).toEqual(['Uusi pakka', 'Uusi pakka 2']);
  });

  it('renames a deck, trims the name and rejects an empty or too long one', async () => {
    const user = userEvent.setup();
    const repositories = renderDecks(
      createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Vanha', cards: [] }]) }),
    );
    await user.click(await screen.findByRole('button', { name: 'Nimeä uudelleen: Vanha' }));
    const input = screen.getByLabelText('Pakan nimi');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Tallenna nimi' }));
    expect(input).toHaveAccessibleDescription('Anna pakalle nimi.');
    await user.type(input, 'x'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Tallenna nimi' }));
    expect(input).toHaveAccessibleDescription(/liian pitkä/);
    await user.clear(input);
    await user.type(input, '  Uusi nimi  ');
    await user.click(screen.getByRole('button', { name: 'Tallenna nimi' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Uusi nimi' })).toBeInTheDocument();
    expect((await repositories.decks.list()).value[0]?.name).toBe('Uusi nimi');
  });

  it('copies a deck with its cards under a new name', async () => {
    const user = userEvent.setup();
    const repositories = renderDecks(
      createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma', cards: [['l1', 1]] }]) }),
    );
    await user.click(await screen.findByRole('button', { name: 'Kopioi: Oma' }));
    await screen.findByRole('heading', { level: 2, name: 'Oma (kopio)' });
    const decks = (await repositories.decks.list()).value;
    expect(decks).toHaveLength(2);
    expect(decks[1]?.sections[0]?.cards).toEqual([{ card: 'l1', count: 1 }]);
    expect(decks[1]?.id).not.toBe('a');
  });

  it('asks before deleting: cancel keeps the deck, confirm removes it', async () => {
    const user = userEvent.setup();
    const repositories = renderDecks(
      createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma', cards: [] }]) }),
    );
    const opener = await screen.findByRole('button', { name: 'Poista: Oma' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Poistetaanko pakka?' });
    await user.click(within(dialog).getByRole('button', { name: 'Peruuta' }));
    expect((await repositories.decks.list()).value).toHaveLength(1);
    expect(opener).toHaveFocus();

    await user.click(opener);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Poista pakka' }));
    expect(await screen.findByText(/ei ole vielä pakkoja/)).toBeInTheDocument();
    expect((await repositories.decks.list()).value).toHaveLength(0);
  });

  it('shows an error when a change cannot be saved', async () => {
    const user = userEvent.setup();
    const repositories = renderDecks(
      createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma', cards: [] }]) }),
    );
    vi.spyOn(repositories.decks, 'create').mockRejectedValueOnce(new Error('boom'));
    await user.click(await screen.findByRole('button', { name: 'Uusi pakka' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Jokin meni pieleen');
  });

  it('shows on a deck card what the collection lacks (T-051)', async () => {
    renderDecks(
      createMemoryRepositories({
        initial: {
          ...storedDecks([{ id: 'b', name: 'Kesken', cards: [['l1', 1], ['u0', 4]] }]),
          ...storedCollection([['u0', 1]]),
        },
      }),
    );
    const [card] = await screen.findAllByRole('listitem');
    await waitFor(() => expect(card).toHaveTextContent('Kokoelmasta puuttuu 4 korttia.'));
  });

  it('offers new, import and Netdeck in the empty state; Netdeck starts in the link field (T-051)', async () => {
    const user = userEvent.setup();
    renderDecks();
    await screen.findByText(/ei ole vielä pakkoja/);
    expect(screen.getByRole('button', { name: 'Uusi pakka' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tuo pakkalista' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hae Netdeck.gg:stä' }));
    expect(screen.getByLabelText('Netdeck-linkki')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Takaisin pakkoihin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hae Netdeck.gg:stä' })).toHaveFocus());
  });
});

