import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { legalCards, renderRoute, storedDecks } from './deckTestUtils';

// T-110: below 64rem the deck editor shows the deck or the card picker, one at a time.

/** Pretends the window is narrow (< 64rem) or wide; jsdom has no matchMedia of its own. */
function stubWidth(wide: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: wide ? query.includes('min-width') : query.includes('max-width: 63.999rem'),
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

function openEditor(cardsInDeck: [string, number][]) {
  return renderRoute(
    '#/pakat/a',
    createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards: cardsInDeck }]) }),
  );
}

const pickerSection = () => document.querySelector('.editor-search') as HTMLElement;
const filtersSection = () => document.querySelector('.editor-filters') as HTMLElement;
const deckSection = () => document.querySelector('.editor-side') as HTMLElement;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Deck editor tabs on a narrow screen', () => {
  it('opens a deck with cards on the deck tab and hides the picker', async () => {
    stubWidth(false);
    openEditor(legalCards());
    const deckTab = await screen.findByRole('button', { name: 'Pakka' });
    expect(deckTab).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Lisää kortteja' })).toHaveAttribute('aria-pressed', 'false');
    expect(deckSection()).toBeVisible();
    expect(pickerSection()).not.toBeVisible();
    expect(filtersSection()).not.toBeVisible();
    expect(screen.queryByRole('button', { name: '+ Lisää kortteja' })).not.toBeInTheDocument();
    expect(document.querySelector('.deck-bar')).toHaveAttribute('hidden');
  });

  it('opens an empty deck on the add tab', async () => {
    stubWidth(false);
    openEditor([]);
    const addTab = await screen.findByRole('button', { name: 'Lisää kortteja' });
    expect(addTab).toHaveAttribute('aria-pressed', 'true');
    expect(pickerSection()).toBeVisible();
    expect(filtersSection()).toBeVisible();
    expect(deckSection()).not.toBeVisible();
    expect(document.querySelector('.deck-bar')).not.toHaveAttribute('hidden');
  });

  it('switches both ways and keeps the search text', async () => {
    stubWidth(false);
    const user = userEvent.setup();
    openEditor(legalCards());
    await user.click(await screen.findByRole('button', { name: 'Lisää kortteja' }));
    expect(pickerSection()).toBeVisible();
    expect(deckSection()).not.toBeVisible();
    const search = screen.getByRole('searchbox');
    await user.type(search, 'unit 1');
    await user.click(screen.getByRole('button', { name: 'Pakka' }));
    expect(deckSection()).toBeVisible();
    expect(pickerSection()).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Lisää kortteja' }));
    expect(screen.getByRole('searchbox')).toHaveValue('unit 1');
  });

  it('the add tab and the bottom bar button change tabs (the bar button moves the focus)', async () => {
    stubWidth(false);
    const user = userEvent.setup();
    openEditor(legalCards());
    await user.click(await screen.findByRole('button', { name: 'Lisää kortteja' }));
    expect(pickerSection()).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Näytä pakka' }));
    expect(deckSection()).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: /Oma pakka/ })).toHaveFocus();
  });

  it('has no "Back to search" link in the deck, because the add tab does the same (T-114)', async () => {
    stubWidth(false);
    openEditor(legalCards());
    await screen.findByRole('button', { name: 'Pakka' });
    expect(screen.queryByRole('button', { name: 'Takaisin hakuun' })).not.toBeInTheDocument();
  });
});

describe('Deck editor on a wide screen', () => {
  it('shows every part and no tabs', async () => {
    stubWidth(true);
    openEditor(legalCards());
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(screen.queryByRole('button', { name: /^Pakka \(/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Lisää kortteja' })).not.toBeInTheDocument();
    expect(deckSection()).toBeVisible();
    expect(pickerSection()).toBeVisible();
    expect(filtersSection()).toBeVisible();
  });
});
