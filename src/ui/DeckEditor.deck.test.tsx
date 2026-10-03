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
    await user.click(within(region).getByRole('button', { name: 'Suurenna kuva: L1' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(within(region).getByRole('button', { name: 'Poista pakasta: L1' }));
    expect(within(region).getAllByText('Vapaa Legend-paikka')).toHaveLength(3);
    await waitFor(async () => expect(await savedCards(repositories)).toEqual([]));
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
    await user.click(screen.getByRole('radio', { name: 'Lista' }));
    expect(within(region).getByRole('button', { name: 'Poista pakasta: Unit 0' })).toBeInTheDocument();
  });

  it('shows colours, types, RAM limits and missing cards under "Tilastot"', async () => {
    openEditor([['l1', 1], ['u0', 3], ['u1', 1]], storedCollection([]));
    const stats = await screen.findByRole('region', { name: 'Tilastot' });
    expect(within(stats).getByText('Red 4 (100 %)')).toBeInTheDocument();
    expect(within(stats).getByText('Unit 4')).toBeInTheDocument();
    expect(within(stats).getByText('RAM-rajat: Red 2')).toBeInTheDocument();
    expect(within(stats).getByText('Kokoelmasta puuttuu 5 korttia.')).toBeInTheDocument();
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
