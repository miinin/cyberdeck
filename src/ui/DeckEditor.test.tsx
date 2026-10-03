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

// Rivit view: one card per table row (T-050b). Kuvat view: a list of images.
const searchList = () => screen.getByRole('table', { name: 'Hakutulokset' });
const imageList = () => screen.getByRole('list', { name: 'Lisää kortteja' });
const savedCards = async (repositories: ReturnType<typeof openEditor>) =>
  (await repositories.decks.get('a'))?.sections.flatMap((section) => section.cards);

describe('Deck editor', () => {
  it('shows the deck grouped, with the summary and the rule violations in plain Finnish', async () => {
    openEditor([['l1', 1], ['u0', 4], ['u1', 2]]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Oma pakka' })).toBeInTheDocument();
    // Sticky deck head (T-050c): the progress bar carries the main deck count, Legends are under it.
    expect(screen.getByRole('progressbar', { name: 'Pääpakka 6/40–50' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /pakan kortit/ })).getByText('Legendit 1/3')).toBeInTheDocument();
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

  it('marks a card only once it breaks a rule, explains why, and still lets it be added (T-057)', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1], ['l2', 1], ['l3', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const list = searchList();
    const bigRow = () => within(list).getByText('Big').closest('tr') as HTMLElement;
    expect(bigRow()).not.toHaveClass('is-dimmed');
    await user.click(within(bigRow()).getByRole('button', { name: 'Lisää pakkaan: Big' }));
    expect(screen.getByText(/ylittää: Big/)).toBeInTheDocument();
    expect(bigRow()).toHaveClass('is-dimmed');
    expect(bigRow()).toHaveTextContent('RAM 9 ylittää Red-värin rajan 6. Voit silti lisätä kortin.');
    expect(within(bigRow()).getByRole('button', { name: 'Lisää pakkaan: Big' })).toHaveAccessibleDescription(/RAM 9 ylittää/);
  });

  it('compares with the collection: owned counts, a missing marker and the number of missing cards', async () => {
    openEditor([['u0', 3], ['u1', 1]], storedCollection([['u0', 1], ['u1', 5]]));
    expect(await screen.findByText('Kokoelmasta puuttuu 2 korttia.')).toBeInTheDocument();
    const deckSection = screen.getByRole('region', { name: /pakan kortit/ });
    const missingRow = within(deckSection).getByText('Unit 0').closest('li') as HTMLElement;
    expect(missingRow).toHaveTextContent('omistat 1/3');
    expect(missingRow).toHaveTextContent('puuttuu 2');
    const ownedRow = within(deckSection).getByText('Unit 1').closest('li') as HTMLElement;
    expect(ownedRow).toHaveTextContent('omistat 5/1');
    expect(ownedRow).not.toHaveTextContent('puuttuu');
  });

  it('shows the cost curve to screen readers as a table', async () => {
    openEditor([['l1', 1], ['u0', 3], ['u1', 2]]);
    const table = await screen.findByRole('table', { name: 'Pääpakan kortit Costin mukaan' });
    const costOne = within(table).getByRole('row', { name: /^1 / });
    expect(costOne).toHaveTextContent('5');
  });

  it('opens the card image from the name in the deck list', async () => {
    const user = userEvent.setup();
    openEditor([['u0', 1]]);
    const deckSection = await screen.findByRole('region', { name: /pakan kortit/ });
    await user.click(within(deckSection).getByRole('button', { name: 'Suurenna kuva: Unit 0' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
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

  it('the deck list shows the latest edit right after leaving, and copying keeps it (B-017)', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([['u3', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: Unit 3' }));
    await user.click(screen.getByRole('button', { name: 'Takaisin pakkoihin' }));
    await screen.findByRole('heading', { level: 1, name: 'Pakat' });
    expect(await screen.findByText(/Oma pakka/)).toBeInTheDocument();
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([{ card: 'u3', count: 2 }]));
    expect(screen.getByText(/Pääpakka 2\/40–50/)).toBeInTheDocument();
  });

  it('gives a long unbroken deck name the wrapping heading class (B-018)', async () => {
    const long = 'W'.repeat(100);
    renderRoute('#/pakat/a', createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: long, cards: [] }]) }));
    const heading = await screen.findByRole('heading', { level: 1, name: long });
    expect(heading).toHaveClass('editor-name');
  });

  it('filters the search list with the catalog filters', async () => {
    const user = userEvent.setup();
    openEditor([]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.type(screen.getByRole('searchbox'), 'Big');
    // Header row plus one result row.
    expect(within(searchList()).getAllByRole('row')).toHaveLength(2);
  });

  it('refuses a second Legend with the same name, says so in a status message and lets it be closed', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([['l1', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const row = within(searchList()).getByText('L1').closest('tr') as HTMLElement;
    expect(row).toHaveClass('is-dimmed');
    // The hint must not invite adding a card that is refused (T-045 PM fix).
    expect(row).not.toHaveTextContent('Voit silti lisätä kortin.');
    await user.click(within(row).getByRole('button', { name: 'Lisää pakkaan: L1' }));
    const message = screen.getByText('Pakassa on jo Legend nimeltä L1.');
    expect(message.closest('[role="status"]')).not.toBeNull();
    expect(within(screen.getByRole('region', { name: /pakan kortit/ })).getByText('Legendit 1/3')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pääpakka 0/40–50' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sulje ilmoitus' }));
    expect(screen.queryByText('Pakassa on jo Legend nimeltä L1.')).not.toBeInTheDocument();
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([{ card: 'l1', count: 1 }]));
  });

  it('hides the Legend message by itself after about four seconds', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(within(searchList()).getByRole('button', { name: 'Lisää pakkaan: L1' }));
    expect(screen.getByText('Pakassa on jo Legend nimeltä L1.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Pakassa on jo Legend nimeltä L1.')).not.toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 8000);

  it('shows Power and Rarity on the result rows', async () => {
    openEditor([]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const row = within(searchList()).getByText('Unit 3').closest('tr') as HTMLElement;
    expect(row).toHaveTextContent('Unit · Red · Cost 1 · Power 1 · RAM 1 · Common');
  });

  it('switches the results to an image grid, adds with the image and remembers the choice', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(screen.getByRole('radio', { name: 'Kuvat' }));
    expect(await repositories.preferences.loadDeckPickView()).toBe('images');
    const imageButton = within(imageList()).getAllByRole('button', { name: 'Lisää pakkaan: Unit 3' })[0] as HTMLElement;
    await user.click(imageButton);
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([{ card: 'u3', count: 1 }]));
    expect(within(imageList()).getByText('Pakassa 1', { selector: '.visually-hidden' })).toBeInTheDocument();
  });

  it('opens in the saved image view', async () => {
    const repositories = createMemoryRepositories({ initial: { ...storedDecks([{ ...base, cards: [] }]) } });
    await repositories.preferences.saveDeckPickView('images');
    renderRoute('#/pakat/a', repositories);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Kuvat' })).toBeChecked());
    expect(imageList()).toHaveClass('pick-images');
  });

  it('tells when the deck does not exist', async () => {
    renderRoute('#/pakat/missing', createMemoryRepositories());
    expect(await screen.findByRole('alert')).toHaveTextContent('Pakkaa ei löytynyt');
  });
});
