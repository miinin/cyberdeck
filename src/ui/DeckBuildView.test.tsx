import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { renderRoute, storedCollection, storedDecks } from './deckTestUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubWidth(wide: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: wide ? query.includes('min-width') : query.includes('max-width'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

// Unit 0 = 'Unit 0'. Deck A and B share u0; the collection has 4 copies of u0.
const decks = [
  {
    id: 'a',
    name: 'Alfa',
    cards: [
      ['u0', 3],
      ['u1', 1],
    ] as [string, number][],
  },
  {
    id: 'b',
    name: 'Beeta',
    cards: [
      ['u0', 2],
      ['u2', 2],
    ] as [string, number][],
  },
  { id: 'c', name: 'Gamma', cards: [['u3', 1]] as [string, number][] },
];
const collection: [string, number][] = [
  ['u0', 4],
  ['u1', 1],
  ['u2', 2],
  ['u3', 1],
];

const open = (initial: Record<string, string>) => renderRoute('#/pakat/kokoaminen', createMemoryRepositories({ initial }));

describe('Kokoaminen tab (T-164)', () => {
  it('is a tab next to the own decks and marks itself current', async () => {
    open({ ...storedDecks(decks), ...storedCollection(collection) });
    const link = await screen.findByRole('link', { name: 'Kokoaminen' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('href', '#/pakat/kokoaminen');
    expect(screen.getByRole('link', { name: 'Omat pakat' })).not.toHaveAttribute('aria-current');
  });

  it('shows a hint when there are no decks', async () => {
    open({});
    expect(await screen.findByRole('heading', { name: 'Ei pakkoja koottavaksi' })).toBeInTheDocument();
  });

  it('shows the swap groups and counts for the chosen decks', async () => {
    const user = userEvent.setup();
    open({ ...storedDecks(decks), ...storedCollection(collection) });
    await user.selectOptions(await screen.findByLabelText('Pöydällä nyt'), 'Alfa');
    await user.selectOptions(screen.getByLabelText('Haluan pelata'), 'Beeta');
    expect(screen.getByRole('heading', { name: 'Pidä pakassa (2)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Palauta kansioon (2)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ota kansiosta (2)' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Puuttuu/ })).not.toBeInTheDocument();
    expect(screen.getByText('Voit koota pakan purkamatta muita')).toBeInTheDocument();
  });

  it('reports missing cards, names the kept deck and adds them to wants', async () => {
    const user = userEvent.setup();
    const repositories = open({
      ...storedDecks(decks),
      ...storedCollection([
        ['u0', 4],
        ['u1', 1],
        ['u2', 2],
        ['u3', 1],
      ]),
    });
    await user.selectOptions(await screen.findByLabelText('Haluan pelata'), 'Beeta');
    await user.click(screen.getByRole('checkbox', { name: 'Alfa' }));
    // u0: owned 4, kept Alfa uses 3, so 1 is free and Beeta lacks 1.
    expect(screen.getByRole('heading', { name: 'Puuttuu (1)' })).toBeInTheDocument();
    expect(screen.getByText(/on pakassa Alfa/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lisää puuttuvat wantiin: Beeta' }));
    expect(await screen.findByText('Lisätty 1 kortti wantiin.')).toBeInTheDocument();
    expect((await repositories.wants.load()).value.entries).toEqual([{ card: 'u0', count: 1 }]);
  });

  it('says so when the same deck is on the table', async () => {
    const user = userEvent.setup();
    open({ ...storedDecks(decks), ...storedCollection(collection) });
    await user.selectOptions(await screen.findByLabelText('Pöydällä nyt'), 'Alfa');
    await user.selectOptions(screen.getByLabelText('Haluan pelata'), 'Alfa');
    expect(screen.getByText(/Sama pakka on jo pöydällä/)).toBeInTheDocument();
  });

  it('shows the matrix when wide, with accessible cell names', async () => {
    stubWidth(true);
    open({ ...storedDecks(decks), ...storedCollection(collection) });
    const matrix = await screen.findByRole('table', {
      name: 'Pakkojen yhteensopivuus',
    });
    expect(within(matrix).getByText('Alfa ja Beeta yhtä aikaa: puuttuu 1')).toBeInTheDocument();
    expect(within(matrix).getByText('Alfa ja Gamma yhtä aikaa: onnistuu')).toBeInTheDocument();
    expect(within(matrix).getByText('Alfa: valmis')).toBeInTheDocument();
  });

  it('lists only competing pairs when narrow', async () => {
    stubWidth(false);
    open({ ...storedDecks(decks), ...storedCollection(collection) });
    expect(await screen.findByText('Alfa + Beeta: 1 kortti liian vähän')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Pakkojen yhteensopivuus' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Gamma/, { selector: 'li' })).not.toBeInTheDocument();
  });

  it('says all pairs work when nothing competes, and that all decks can be built', async () => {
    stubWidth(false);
    open({
      ...storedDecks(decks),
      ...storedCollection([
        ['u0', 5],
        ['u1', 1],
        ['u2', 2],
        ['u3', 1],
      ]),
    });
    expect(await screen.findByText('Kaikki pakat voivat olla koottuina pareittain')).toBeInTheDocument();
    expect(screen.getByText('Kaikki 3 pakkaa voivat olla koottuina yhtä aikaa')).toBeInTheDocument();
  });

  it('lists what building every deck at once lacks', async () => {
    open({ ...storedDecks(decks), ...storedCollection(collection) });
    expect(await screen.findByText('Jotta kaikki 3 pakkaa ovat koottuina yhtä aikaa, puuttuu 1 kortti (1 eri)')).toBeInTheDocument();
    const table = screen.getByRole('table', {
      name: 'Kaikkien pakkojen puuttuvat kortit',
    });
    const row = within(table).getByRole('row', { name: /Unit 0/ });
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['5', '4', '1']);
  });
});
