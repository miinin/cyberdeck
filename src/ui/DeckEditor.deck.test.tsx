import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { legalCards, renderRoute, storedCollection, storedDecks } from './deckTestUtils';

// T-050c: the deck column (sticky head, Legend slots, tiles, stacks, statistics) and the mobile bottom bar.

function openEditor(cardsInDeck: [string, number][], extra: Record<string, string> = {}) {
  return renderRoute(
    '#/pakat/a',
    createMemoryRepositories({ initial: { ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: cardsInDeck }]), ...extra } }),
  );
}

const deckRegion = () => screen.getByRole('region', { name: /pakan kortit/ });
const savedCards = async (repositories: ReturnType<typeof openEditor>) =>
  (await repositories.decks.get('a'))?.sections.flatMap((section) => section.cards);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Deck column', () => {
  it('shows the main deck as a progress bar and says the deck is legal', async () => {
    openEditor(legalCards());
    const progress = await screen.findByRole('progressbar', { name: 'Pääpakka 40/40–50' });
    expect(progress).toHaveAttribute('value', '40');
    expect(progress).toHaveClass('is-ok');
    expect(within(deckRegion()).getByText('Laillinen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ongelma/ })).not.toBeInTheDocument();
  });

  it('caps the bar at 50 and marks it over the limit', async () => {
    openEditor([['u0', 20], ['u1', 20], ['u2', 15]]);
    const progress = await screen.findByRole('progressbar', { name: 'Pääpakka 55/40–50' });
    expect(progress).toHaveAttribute('value', '50');
    expect(progress).toHaveAttribute('max', '50');
    expect(progress).toHaveClass('is-over');
  });

  it('the issue button moves focus to the "Ongelmat" heading', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1], ['u0', 4]]);
    const button = await screen.findByRole('button', { name: '3 ongelmaa' });
    await user.click(button);
    expect(screen.getByRole('heading', { level: 3, name: 'Ongelmat' })).toHaveFocus();
  });

  it('says "1 ongelma" for a single issue', async () => {
    openEditor([['l1', 1], ['l2', 1], ['l3', 1], ...legalCards().slice(3, 15)]);
    expect(await screen.findByRole('button', { name: '1 ongelma' })).toBeInTheDocument();
  });

  it('shows the Legends as image slots with the free slots, and removes a Legend', async () => {
    const user = userEvent.setup();
    const repositories = openEditor([['l1', 1]]);
    await screen.findByRole('heading', { level: 2, name: 'Legendit (1/3)' });
    const region = deckRegion();
    expect(within(region).getAllByText('Vapaa Legend-paikka')).toHaveLength(2);
    await user.click(within(region).getByRole('button', { name: 'Poista pakasta: L1' }));
    await waitFor(() => expect(within(region).getAllByText('Vapaa Legend-paikka')).toHaveLength(3));
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([]));
  });

  it('a click on a Legend picture opens the card dialog (T-188)', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1]]);
    await screen.findByRole('heading', { level: 2, name: 'Legendit (1/3)' });
    await user.click(within(deckRegion()).getByRole('button', { name: 'Suurenna kuva: L1' }));
    // The Cards view shows the dialog at #/kortti/<key>; it is not part of the editor.
    expect(window.location.hash).toBe('#/kortti/l1');
  });

  it('keeps the editor (search text, tab) and returns focus to the card when the card dialog is opened and closed (T-188)', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1]]);
    await screen.findByRole('heading', { level: 2, name: 'Legendit (1/3)' });
    await user.type(screen.getByRole('searchbox'), 'unit 1');
    const picture = within(deckRegion()).getByRole('button', { name: 'Suurenna kuva: L1' });
    await user.click(picture);
    // The dialog is on top; the editor behind is the same one, not a new copy.
    expect(window.location.hash).toBe('#/kortti/l1');
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByRole('searchbox', { hidden: true })).toHaveValue('unit 1');
    await user.click(within(dialog).getByRole('button', { name: 'Sulje' }));
    await waitFor(() => expect(window.location.hash).toBe('#/pakat/a'));
    expect(screen.getByRole('searchbox')).toHaveValue('unit 1');
    expect(picture.isConnected).toBe(true);
    expect(picture).toHaveFocus();
  });

  it('shows a main deck tile with copies, the stepper and the missing copies', async () => {
    const user = userEvent.setup();
    openEditor([['u0', 3]], storedCollection([['u0', 1]]));
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const name = within(deckRegion()).getByRole('button', { name: 'Suurenna kuva: Unit 0' });
    const tile = name.closest('li') as HTMLElement;
    expect(tile).toHaveTextContent('×3');
    expect(tile).toHaveTextContent('puuttuu 2');
    expect(tile).toHaveTextContent('omistat 1/3');
    expect(tile).toHaveClass('is-missing');
    await user.click(within(tile).getByRole('button', { name: 'Poista pakasta: Unit 0' }));
    expect(tile).toHaveTextContent('×2');
  });

  it('switches the main deck to stacks: each card a button with its copies', async () => {
    const user = userEvent.setup();
    openEditor([['u0', 3], ['u1', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(screen.getByRole('group', { name: 'Pakkanäkymä' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Pinot' }));
    const region = deckRegion();
    const stackCard = within(region).getByRole('button', { name: 'Suurenna kuva: Unit 0, 3 pakassa' });
    expect(within(region).queryByRole('button', { name: 'Poista pakasta: Unit 0' })).not.toBeInTheDocument();
    await user.pointer({ keys: '[MouseRight]', target: stackCard });
    expect(within(region).getByRole('button', { name: 'Suurenna kuva: Unit 0, 2 pakassa' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('group', { name: 'Pakkanäkymä' })).getByRole('radio', { name: 'Lista' }));
    expect(within(region).getByRole('button', { name: 'Poista pakasta: Unit 0' })).toBeInTheDocument();
  });

  it('has a "Kortit" view: whole cards with their copies and a stepper under each (T-115)', async () => {
    const user = userEvent.setup();
    openEditor([['u0', 3], ['u1', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    await user.click(screen.getByRole('radio', { name: 'Kortit' }));
    const region = deckRegion();
    const card = within(region).getByRole('button', { name: 'Suurenna kuva: Unit 0, 3 pakassa' });
    expect(card.closest('ul')).toHaveClass('stack-cards--cards');
    await user.click(within(region).getByRole('button', { name: 'Poista pakasta: Unit 0' }));
    expect(within(region).getByRole('button', { name: 'Suurenna kuva: Unit 0, 2 pakassa' })).toBeInTheDocument();
  });

  it('shows colours, types, RAM limits and missing cards under "Tilastot"', async () => {
    openEditor([['l1', 1], ['u0', 3], ['u1', 1]], storedCollection([]));
    const stats = await screen.findByRole('region', { name: 'Tilastot' });
    // T-093: colours with their RAM, types as a bar with a legend.
    const red = stats.querySelector('.color-ram-row') as HTMLElement;
    expect(red).toHaveTextContent('Red 4 · 100 %');
    expect(red).toHaveTextContent('Legendit antavat RAM 2');
    expect(stats.querySelector('.type-bar-wrap .chart-legend')).toHaveTextContent('Unit 4 · 100 %');
    expect(within(stats).getByText('Kokoelmasta puuttuu 5 korttia.')).toBeInTheDocument();
  });

  it('lists the missing cards with their counts (T-061)', async () => {
    openEditor([['l1', 1], ['u0', 3], ['u1', 1]], storedCollection([]));
    const stats = await screen.findByRole('region', { name: 'Tilastot' });
    expect(within(stats).getByText('Näytä puuttuvat kortit')).toBeInTheDocument();
    const list = stats.querySelector('.missing-cards') as HTMLElement;
    expect(within(list).getAllByRole('listitem', { hidden: true }).map((item) => item.textContent?.split(' puuttuu ')[1])).toEqual(['1', '3', '1']);
    expect(within(stats).getByRole('button', { name: 'Lataa puuttuvat (.txt)', hidden: true })).toBeInTheDocument();
  });
});

describe('Mobile deck bar', () => {
  it('"Näytä pakka" moves focus to the deck, "Takaisin hakuun" to the search field', async () => {
    const user = userEvent.setup();
    openEditor([['l1', 1], ['u0', 2]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(document.querySelector('.deck-bar-text')).toHaveTextContent(/^Pakka 2\/40–50·Legendit 1\/3/);
    await user.click(screen.getByRole('button', { name: 'Näytä pakka' }));
    expect(screen.getByRole('heading', { level: 2, name: /pakan kortit/ })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Takaisin hakuun' }));
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('hides the bar while the deck is on screen', async () => {
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    openEditor([['u0', 1]]);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    const bar = screen.getByRole('button', { name: 'Näytä pakka' }).parentElement as HTMLElement;
    expect(bar).toBeVisible();
    act(() => notify([{ isIntersecting: true }]));
    expect(bar).not.toBeVisible();
    act(() => notify([{ isIntersecting: false }]));
    expect(bar).toBeVisible();
  });
});
