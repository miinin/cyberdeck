import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import type { GameInput } from '../domain/games';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { storedDecks, testCards } from './deckTestUtils';

// T-122: the results of a deck. Cards L1..L3 are the Legends of the test data (all Red).

function game(patch: Partial<GameInput> = {}): GameInput {
  return {
    deckId: 'a',
    playedOn: '2026-10-05',
    result: 'win',
    opponentName: null,
    opponentLegends: [],
    turn: null,
    event: null,
    sideboard: false,
    note: null,
    ...patch,
  };
}

function setup(games: GameInput[] = [], decks = [{ id: 'a', name: 'Oma pakka', cards: [] as [string, number][] }]) {
  const repositories = createMemoryRepositories({ initial: storedDecks(decks) });
  return { repositories, ready: seed(repositories, games) };
}

async function seed(repositories: Repositories, games: GameInput[]) {
  for (const input of games) await repositories.games.add(input);
}

async function openEditor(games: GameInput[] = []) {
  const { repositories, ready } = setup(games);
  await ready;
  window.location.hash = '#/pakat/a';
  render(<App cards={testCards} repositories={repositories} />);
  await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
  await screen.findByRole('heading', { level: 2, name: 'Tulokset' });
  return repositories;
}

const dialog = () => screen.getByRole('dialog', { name: /Kirjaa peli|Muokkaa peliä/ });

describe('Results section of the deck editor', () => {
  it('shows the empty state with the log button', async () => {
    await openEditor();
    expect(await screen.findByText(/Ei vielä kirjattuja pelejä/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Kirjaa peli' })).toBeInTheDocument();
  }, 20000);

  it('needs a result before it saves, and saves a game with just the result', async () => {
    const user = userEvent.setup();
    const repositories = await openEditor();
    await user.click(await screen.findByRole('button', { name: '+ Kirjaa peli' }));
    const form = within(dialog());
    const save = form.getByRole('button', { name: 'Tallenna' });
    expect(save).toBeDisabled();
    expect(form.getByText('Valitse ensin tulos.')).toBeInTheDocument();
    await user.click(form.getByRole('radio', { name: 'Tappio' }));
    expect(save).toBeEnabled();
    await user.click(save);

    expect(await screen.findByText('Peli kirjattu')).toBeInTheDocument();
    const stored = (await repositories.games.load()).value.games;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ deckId: 'a', result: 'loss', opponentName: null, opponentLegends: [], turn: null, sideboard: false });
    // The key numbers: 1 game, 0-1-0, 0 %.
    const tiles = screen.getByText('Pelit', { selector: 'dt' }).closest('dl');
    expect(tiles).toHaveTextContent('Pelit1');
    expect(tiles).toHaveTextContent('V–T–Ta0–1–0');
    expect(tiles).toHaveTextContent('Voitto-%0 %');
    expect(tiles).not.toHaveTextContent('Aloittajana');
  }, 20000);

  it('saves every field, picks Legends by search and keeps the extra details closed until needed', async () => {
    const user = userEvent.setup();
    const repositories = await openEditor();
    await user.click(await screen.findByRole('button', { name: '+ Kirjaa peli' }));
    const form = within(dialog());
    expect(form.getByText('Lisätiedot').closest('details')).not.toHaveAttribute('open');
    await user.click(form.getByRole('radio', { name: 'Voitto' }));
    await user.type(form.getByLabelText('Vastustaja'), 'Sininen aggro');
    await user.type(form.getByRole('searchbox', { name: 'Hae Legend' }), 'l');
    await user.click(form.getByRole('button', { name: 'Lisää Legend: L2' }));
    expect(form.getByRole('button', { name: 'Poista Legend: L2' })).toBeInTheDocument();

    await user.click(form.getByText('Lisätiedot'));
    await user.click(form.getByRole('radio', { name: 'Aloitin' }));
    await user.type(form.getByLabelText('Tapahtuma'), 'Kauppaturnaus');
    await user.click(form.getByRole('switch', { name: 'Sideboard käytössä' }));
    await user.type(form.getByLabelText('Muistiinpano'), 'Tiukka peli');
    await user.click(form.getByRole('button', { name: 'Tallenna' }));

    await screen.findByText('Peli kirjattu');
    expect((await repositories.games.load()).value.games[0]).toMatchObject({
      result: 'win',
      opponentName: 'Sininen aggro',
      opponentLegends: ['l2'],
      turn: 'first',
      event: 'Kauppaturnaus',
      sideboard: true,
      note: 'Tiukka peli',
    });
    expect(screen.getByText('Aloittajana', { selector: 'dt' })).toBeInTheDocument();
    expect(screen.getByText('Toisena', { selector: 'dt' }).nextElementSibling).toHaveTextContent('–');
  }, 30000);

  it('allows three Legends at most', async () => {
    const user = userEvent.setup();
    await openEditor();
    await user.click(await screen.findByRole('button', { name: '+ Kirjaa peli' }));
    const form = within(dialog());
    for (const name of ['L1', 'L2', 'L3']) {
      await user.type(form.getByRole('searchbox', { name: 'Hae Legend' }), name);
      await user.click(form.getByRole('button', { name: `Lisää Legend: ${name}` }));
    }
    expect(form.queryByRole('searchbox', { name: 'Hae Legend' })).not.toBeInTheDocument();
    expect(form.getByText(/Legendejä on jo 3/)).toBeInTheDocument();
  }, 20000);

  it('offers earlier opponents and events, and fills the Legends from the last game against the same name', async () => {
    const user = userEvent.setup();
    await openEditor([
      game({ opponentName: 'Sam', opponentLegends: ['l1'], event: 'Kotipeli', playedOn: '2026-10-01' }),
      game({ opponentName: 'Alex', playedOn: '2026-10-02' }),
    ]);
    await user.click(await screen.findByRole('button', { name: '+ Kirjaa peli' }));
    const form = within(dialog());
    const names = [...dialog().querySelectorAll('datalist option')].map((option) => option.getAttribute('value'));
    expect(names).toEqual(['Alex', 'Sam', 'Kotipeli']);
    await user.type(form.getByLabelText('Vastustaja'), 'sam');
    await user.tab();
    expect(form.getByRole('button', { name: 'Poista Legend: L1' })).toBeInTheDocument();
  }, 20000);

  it('shows the record, the opponent, colour and event tables and the list', async () => {
    await openEditor([
      game({ opponentName: 'Sam', opponentLegends: ['l1'], event: 'Kotipeli', turn: 'first', playedOn: '2026-10-05' }),
      game({ opponentName: 'sam', result: 'loss', opponentLegends: ['l2'], playedOn: '2026-10-04', note: 'Huono avaus' }),
      game({ result: 'draw', opponentLegends: ['l3'], sideboard: true, turn: 'second', playedOn: '2026-10-03' }),
      game({ playedOn: '2026-10-02' }),
    ]);
    const tiles = (await screen.findByText('Pelit', { selector: 'dt' })).closest('dl');
    expect(tiles).toHaveTextContent('Pelit4');
    expect(tiles).toHaveTextContent('V–T–Ta2–1–1');
    expect(tiles).toHaveTextContent('Voitto-%50 %');
    expect(tiles).toHaveTextContent('Aloittajana100 %');
    expect(tiles).toHaveTextContent('Toisena0 %');

    const opponents = screen.getByRole('heading', { name: 'Vastustajat' }).closest('.panel') as HTMLElement;
    const rows = within(opponents).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Sam21–1–050 %');
    expect(rows.map((row) => row.querySelector('th')?.textContent)).toEqual(['Sam', 'L3', 'Tuntematon']);

    const colours = screen.getByRole('heading', { name: 'Vastustajan värit' }).closest('.panel') as HTMLElement;
    expect(within(colours).getAllByRole('row')).toHaveLength(2);
    expect(colours).toHaveTextContent('R');
    expect(screen.getByRole('heading', { name: 'Tapahtumat' }).closest('.panel')).toHaveTextContent('Kotipeli');

    const list = document.querySelector('.game-list') as HTMLElement;
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Aloitti');
    expect(items[1]).toHaveTextContent('Huono avaus');
    expect(items[2]).toHaveTextContent('Toinen');
    expect(items[2]).toHaveTextContent('Sideboard käytössä');
  }, 30000);

  it('shows the colour and event tables only when there is something to show', async () => {
    await openEditor([game({ opponentName: 'Sam' })]);
    await screen.findByRole('heading', { name: 'Vastustajat' });
    expect(screen.queryByRole('heading', { name: 'Vastustajan värit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tapahtumat' })).not.toBeInTheDocument();
  }, 20000);

  it('lists the 10 newest games and the rest after "Näytä kaikki"', async () => {
    const user = userEvent.setup();
    await openEditor(Array.from({ length: 12 }, (_, i) => game({ opponentName: `Vastus ${i}`, playedOn: `2026-09-${String(i + 10)}` })));
    const button = await screen.findByRole('button', { name: 'Näytä kaikki (12)' });
    const list = () => screen.getAllByRole('list').find((item) => item.classList.contains('game-list')) as HTMLElement;
    expect(within(list()).getAllByRole('listitem')).toHaveLength(10);
    await user.click(button);
    expect(within(list()).getAllByRole('listitem')).toHaveLength(12);
  }, 30000);

  it('edits a game', async () => {
    const user = userEvent.setup();
    const repositories = await openEditor([game({ opponentName: 'Sam', note: 'Vanha' })]);
    await user.click(await screen.findByRole('button', { name: /^Muokkaa peliä: / }));
    const form = within(dialog());
    // The details are open because the game has a note.
    expect(form.getByText('Lisätiedot').closest('details')).toHaveAttribute('open');
    await user.click(form.getByRole('radio', { name: 'Tappio' }));
    await user.clear(form.getByLabelText('Muistiinpano'));
    await user.type(form.getByLabelText('Muistiinpano'), 'Uusi');
    await user.click(form.getByRole('button', { name: 'Tallenna' }));
    await screen.findByText('Peli päivitetty');
    const games = (await repositories.games.load()).value.games;
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({ result: 'loss', note: 'Uusi', opponentName: 'Sam' });
  }, 30000);

  it('asks before it deletes a game', async () => {
    const user = userEvent.setup();
    const repositories = await openEditor([game({ opponentName: 'Sam' })]);
    await user.click(await screen.findByRole('button', { name: /^Poista peli: / }));
    const confirm = screen.getByRole('dialog', { name: 'Poistetaanko peli?' });
    expect(confirm).toHaveTextContent('Poistetaanko peli 5.10.2026 vs. Sam?');
    await user.click(within(confirm).getByRole('button', { name: 'Peruuta' }));
    expect((await repositories.games.load()).value.games).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /^Poista peli: / }));
    await user.click(within(screen.getByRole('dialog', { name: 'Poistetaanko peli?' })).getByRole('button', { name: 'Poista peli' }));
    expect(await screen.findByText(/Ei vielä kirjattuja pelejä/)).toBeInTheDocument();
    expect((await repositories.games.load()).value.games).toEqual([]);
    expect(screen.getByRole('heading', { level: 2, name: 'Tulokset' })).toHaveFocus();
  }, 30000);

  it('shows other decks games nowhere in this deck', async () => {
    await openEditor([game({ deckId: 'other', opponentName: 'Piilossa' })]);
    await screen.findByText(/Ei vielä kirjattuja pelejä/);
    expect(screen.queryByText('Piilossa')).not.toBeInTheDocument();
  }, 20000);

  it('shows free text as plain text and groups opponents named like object keys (SR-46)', async () => {
    await openEditor([
      game({ opponentName: '<b>fet</b><img src=x onerror=alert(1)>', note: '<script>alert(1)</script>' }),
      game({ opponentName: '__proto__' }),
      game({ opponentName: 'constructor' }),
      game({ opponentName: 'toString' }),
      game({ opponentName: '__proto__' }),
    ]);
    const opponents = (await screen.findByRole('heading', { name: 'Vastustajat' })).closest('.panel') as HTMLElement;
    expect(within(opponents).getByRole('row', { name: /__proto__/ })).toHaveTextContent('2');
    expect(within(opponents).getByText('<b>fet</b><img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('.deck-results b, .deck-results img, .deck-results script')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  }, 30000);

  it('shows the Legend names, then unknown, when a game has no opponent name', async () => {
    await openEditor([game({ opponentLegends: ['l2', 'l1'], playedOn: '2026-10-01' }), game({ opponentLegends: ['gone'], playedOn: '2026-10-02' })]);
    const list = (await screen.findByRole('heading', { name: 'Pelit', level: 3 })).closest('.panel') as HTMLElement;
    expect(within(list).getAllByRole('listitem')[1]).toHaveTextContent('L1, L2');
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Tuntematon');
  }, 20000);

  it('stops with the log full message at 1000 games', async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 1000 }, (_, i) => ({
      ...game(),
      id: `g${i}`,
      createdAt: '2026-10-05T10:00:00.000Z',
    }));
    // A full log, as another tab or device could have left it.
    const store = createMemoryRepositories({
      initial: {
        ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: [] }]),
        'cyberdeck:games': JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-05T10:00:00.000Z', data: { games: rows } }),
      },
    });
    window.location.hash = '#/pakat/a';
    render(<App cards={testCards} repositories={store} />);
    await user.click(await screen.findByRole('button', { name: '+ Kirjaa peli' }));
    const form = within(dialog());
    await user.click(form.getByRole('radio', { name: 'Voitto' }));
    await user.click(form.getByRole('button', { name: 'Tallenna' }));
    expect(await form.findByRole('alert')).toHaveTextContent(/Tulosloki on täynnä/);
    expect((await store.games.load()).value.games).toHaveLength(1000);
  }, 30000);
});

describe('Results on the deck list', () => {
  it('shows the record of a deck that has games, and nothing for one without', async () => {
    const { repositories, ready } = setup(
      [game(), game(), game({ result: 'loss' }), game({ result: 'draw' })],
      [
        { id: 'a', name: 'Oma pakka', cards: [] },
        { id: 'b', name: 'Toinen pakka', cards: [] },
      ],
    );
    await ready;
    window.location.hash = '#/pakat';
    render(<App cards={testCards} repositories={repositories} />);
    const first = (await screen.findByRole('heading', { name: /Oma pakka/ })).closest('li') as HTMLElement;
    expect(first).toHaveTextContent('2–1–1');
    expect(within(first).getByText('2 voittoa, 1 tappiota, 1 tasapeliä')).toBeInTheDocument();
    const second = screen.getByRole('heading', { name: /Toinen pakka/ }).closest('li') as HTMLElement;
    expect(second).not.toHaveTextContent('–0–');
  }, 30000);

  it('tells how many games go with the deck, and deletes them with it', async () => {
    const user = userEvent.setup();
    const { repositories, ready } = setup(
      [game(), game(), game({ deckId: 'b' })],
      [
        { id: 'a', name: 'Oma pakka', cards: [] },
        { id: 'b', name: 'Toinen pakka', cards: [] },
      ],
    );
    await ready;
    window.location.hash = '#/pakat';
    render(<App cards={testCards} repositories={repositories} />);
    await user.click(await screen.findByRole('button', { name: 'Poista pakka: Oma pakka' }));
    const confirm = await screen.findByRole('dialog', { name: 'Poistetaanko pakka?' });
    expect(confirm).toHaveTextContent('Myös pakan 2 kirjattua peliä poistetaan.');
    await user.click(within(confirm).getByRole('button', { name: 'Poista pakka' }));
    await screen.findByText(/Toinen pakka/);
    const left = (await repositories.games.load()).value.games;
    expect(left.map((g) => g.deckId)).toEqual(['b']);
  }, 30000);
});
