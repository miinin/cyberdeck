import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageError, createMemoryRepositories } from '../storage';
import { legalCards, renderRoute, storedCollection, storedDecks } from './deckTestUtils';

const base = { id: 'a', name: 'Oma pakka' };

function openEditor(cardsInDeck: [string, number][], extra: Record<string, string> = {}) {
  return renderRoute(
    '#/pakat/a',
    createMemoryRepositories({ initial: { ...storedDecks([{ ...base, cards: cardsInDeck }]), ...extra } }),
  );
}

const searchList = () => screen.getByRole('list', { name: 'Lisää kortteja' });
const savedCards = async (repositories: ReturnType<typeof openEditor>) =>
  (await repositories.decks.get('a'))?.sections.flatMap((section) => section.cards);

describe('Deck editor', () => {
  it('shows the deck grouped, with the summary and the rule violations in plain Finnish', async () => {
    openEditor([['l1', 1], ['u0', 4], ['u1', 2]]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Oma pakka' })).toBeInTheDocument();
    expect(screen.getByText('Legendit 1/3 · Pääpakka 6/40–50')).toBeInTheDocument();
    expect(screen.getByText(/RAM-rajat: Red 2/)).toBeInTheDocument();
    expect(screen.getByText('Legendejä on 1, pitää olla tasan 3.')).toBeInTheDocument();
    expect(screen.getByText('Pääpakassa on 6 korttia, vähintään 40.')).toBeInTheDocument();
    expect(screen.getByText('Unit 0: 4 kopiota, enintään 3.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Unit (6)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Legendit (1/3)' })).toBeInTheDocument();
  });

  it('puts the violations in a polite live region', async () => {
    openEditor([]);
    const message = await screen.findByText('Legendejä on 0, pitää olla tasan 3.');
    expect(message.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('says the deck is legal when no rule is broken', async () => {
    openEditor(legalCards());
    expect(await screen.findByText('Pakka on laillinen.')).toBeInTheDocument();
  });

  it('adds and removes cards, and saves automatically after a short pause', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: Unit 3' }));
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: Unit 3' }));
    expect(screen.getByText('Pääpakassa on 2 korttia, vähintään 40.')).toBeInTheDocument();
    expect(screen.getByText(/Muutokset tallennetaan/)).toBeInTheDocument();
    // Not saved yet, saved after the pause: one write for both clicks.
    expect(await savedCards(repositories)).toEqual([]);
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([{ card: 'u3', count: 2 }]));
    expect(await screen.findByText('Tallennettu')).toBeInTheDocument();

    await user.click(within(searchList()).getByRole('button', { name: 'Poista pakasta: Unit 3' }));
    await user.click(within(searchList()).getByRole('button', { name: 'Poista pakasta: Unit 3' }));
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([]));
    expect(screen.getByText('Pakka on tyhjä. Lisää kortteja hakulistasta.')).toBeInTheDocument();
  });

  it('dims a card that would break a rule, explains why, and still lets it be added', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1], ['l2', 1], ['l3', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const list = searchList();
    const bigRow = within(list).getByText('Big').closest('li') as HTMLElement;
    expect(bigRow).toHaveClass('is-dimmed');
    expect(bigRow).toHaveTextContent('RAM 9 ylittää Red-värin rajan 6. Voit silti lisätä kortin.');
    const add = within(bigRow).getByRole('button', { name: 'Lisää pakkaan: Big' });
    expect(add).toHaveAccessibleDescription(/RAM 9 ylittää/);
    await user.click(add);
    expect(screen.getByText(/ylittää: Big/)).toBeInTheDocument();
    // Legends are full, so another Legend is dimmed too (all three are in the deck already).
    expect(within(list).getByText('L1').closest('li')).toHaveClass('is-dimmed');
  });

  it('compares with the collection: owned counts, a missing marker and the number of missing cards', async () => {
    openEditor([['u0', 3], ['u1', 1]], storedCollection([['u0', 1], ['u1', 5]]));
    expect(await screen.findByText('Kokoelmasta puuttuu 2 korttia.')).toBeInTheDocument();
    const deckSection = screen.getByRole('region', { name: /pakan kortit/ });
    const missingRow = within(deckSection).getByText('Unit 0').closest('li') as HTMLElement;
    expect(missingRow).toHaveTextContent('omistat 1/3 · puuttuu');
    const ownedRow = within(deckSection).getByText('Unit 1').closest('li') as HTMLElement;
    expect(ownedRow).toHaveTextContent('omistat 5/1');
    expect(ownedRow).not.toHaveTextContent('puuttuu');
  });

  it('says so when nothing is missing from the collection', async () => {
    openEditor([['u0', 1]], storedCollection([['u0', 1]]));
    expect(await screen.findByText('Kaikki pakan kortit ovat kokoelmassasi.')).toBeInTheDocument();
  });

  it('renames the deck: trims it, saves it, and an empty name is rejected without saving', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([]);
    const input = await screen.findByLabelText('Pakan nimi');
    await user.clear(input);
    expect(input).toHaveAccessibleDescription('Anna pakalle nimi.');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Oma pakka');
    await user.type(input, '  Uusi nimi ');
    expect(screen.getByRole('heading', { level: 1, name: 'Uusi nimi' })).toBeInTheDocument();
    await waitFor(async () => expect((await repositories.decks.get('a'))?.name).toBe('Uusi nimi'));
  });

  it('shows a save error and retries', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const update = vi.spyOn(repositories.decks, 'update').mockRejectedValueOnce(new StorageError('quota', 'full'));
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: Unit 3' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Ei tallennettu. Selaimen tallennustila on täynnä');
    await user.click(within(alert).getByRole('button', { name: 'Yritä tallentaa uudelleen' }));
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([{ card: 'u3', count: 1 }]));
    expect(await screen.findByText('Tallennettu')).toBeInTheDocument();
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('saves a pending change at once when leaving the editor', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: Unit 3' }));
    await user.click(screen.getByRole('button', { name: 'Takaisin pakkoihin' }));
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([{ card: 'u3', count: 1 }]));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pakat' })).toBeInTheDocument();
  });

  it('filters the search list with the catalog filters', async () => {
    const user = userEvent.setup();
    openEditor([]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.type(screen.getByRole('searchbox'), 'Big');
    expect(within(searchList()).getAllByRole('listitem')).toHaveLength(1);
  });

  it('tells when the deck does not exist', async () => {
    renderRoute('#/pakat/missing', createMemoryRepositories());
    expect(await screen.findByRole('alert')).toHaveTextContent('Pakkaa ei löytynyt');
  });
});
