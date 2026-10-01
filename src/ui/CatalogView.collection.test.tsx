import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CardCatalog } from '../api';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { CatalogView } from './CatalogView';
import type { CatalogState } from './useCardCatalog';

const COLLECTION_KEY = 'cyberdeck:collection';

function card(slug: string, name: string, subname: string | null, type = 'Unit', color: string | null = 'Red'): Card {
  return { id: `id-${slug}`, key: slug, slug, name, subname, displayName: name, type, color, cost: 2 };
}

const cards: Card[] = [
  card('v-streetkid', 'V', 'Streetkid', 'Legend', 'Blue'),
  card('swordwise-huscle', 'Swordwise Huscle', null),
  card('viktor-vektor-pinch', 'Viktor Vektor', 'You Might Feel a Little Pinch', 'Program', 'Yellow'),
];

function ready(list: Card[] = cards, reportedTotal = list.length): CatalogState {
  const catalog: CardCatalog = { cards: list, reportedTotal, skipped: reportedTotal - list.length };
  return { status: 'ready', catalog };
}

function stored(entries: { card: string; count: number }[], schemaVersion = 1): string {
  return JSON.stringify({ schemaVersion, savedAt: '2026-10-01T10:00:00.000Z', data: { entries } });
}

function withCollection(entries: { card: string; count: number }[]): Repositories {
  return createMemoryRepositories({ initial: { [COLLECTION_KEY]: stored(entries) } });
}

/** Lets the in-memory repository's promises settle inside act(). */
async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

async function renderView(repositories: Repositories = createMemoryRepositories(), state: CatalogState = ready()) {
  const onRetry = vi.fn();
  const result = render(<CatalogView state={state} onRetry={onRetry} repositories={repositories} />);
  await settle();
  return { ...result, onRetry, repositories };
}

const row = (name: string) => {
  // By text: jsdom's name computation drops the space of the hidden ", " ("V,Streetkid").
  const header = within(screen.getByRole('table'))
    .getAllByRole('rowheader')
    .find((cell) => cell.textContent === name);
  const element = header?.closest('tr');
  if (element === null || element === undefined) throw new Error(`No row for ${name}`);
  return element;
};
const plus = (name: string) => within(row(name)).getByRole('button', { name: `Lisää yksi kappale: ${name}` });
const minus = (name: string) => within(row(name)).queryByRole('button', { name: `Vähennä yksi kappale: ${name}` });
const controlCell = (name: string) => within(row(name)).getAllByRole('cell')[2];
const summary = (container: HTMLElement) => container.querySelector('#collection-summary');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CatalogView collection: count control', () => {
  it('adds an "Omistan" column with only "+" for cards not in the collection', async () => {
    await renderView();
    const headers = within(screen.getByRole('table'))
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual(['Nimi', 'Tyyppi ja väri', 'Hinta', 'Omistan']);
    expect(plus('V, Streetkid')).toBeInTheDocument();
    expect(minus('V, Streetkid')).toBeNull();
    expect(controlCell('V, Streetkid')).toHaveTextContent('Ei kokoelmassa');
    within(plus('V, Streetkid'))
      .getAllByText('V')
      .forEach((name) => expect(name).toHaveAttribute('lang', 'en'));
    expect(within(plus('V, Streetkid')).getByText('+')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks a card owned with one press and keeps it in storage', async () => {
    const user = userEvent.setup();
    const { container, repositories } = await renderView();
    await user.click(plus('V, Streetkid'));
    await settle();

    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 1 kappale');
    expect(minus('V, Streetkid')).toBeInTheDocument();
    expect(summary(container)).toHaveTextContent('Kokoelmassa 1 eri kortti, yhteensä 1 kappale.');
    const saved = await repositories.collection.load();
    expect(saved.value.entries).toEqual([{ card: 'v-streetkid', count: 1 }]);
  });

  it('shows saved counts after a reload (a new view with the same storage)', async () => {
    const repositories = withCollection([
      { card: 'v-streetkid', count: 2 },
      { card: 'swordwise-huscle', count: 3 },
    ]);
    const { container } = await renderView(repositories);
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 2 kappaletta');
    expect(summary(container)).toHaveTextContent('Kokoelmassa 2 eri korttia, yhteensä 5 kappaletta.');
  });

  it('"−" at 1 removes the card and moves focus to "+" of the same row', async () => {
    const user = userEvent.setup();
    const { container, repositories } = await renderView(withCollection([{ card: 'v-streetkid', count: 1 }]));
    const plusButton = plus('V, Streetkid');
    const minusButton = minus('V, Streetkid');
    expect(minusButton).not.toBeNull();
    await user.click(minusButton as HTMLElement);
    await settle();

    expect(minus('V, Streetkid')).toBeNull();
    expect(plus('V, Streetkid')).toBe(plusButton); // the same element
    expect(plusButton).toHaveFocus();
    expect(summary(container)).toHaveTextContent('Kokoelmassa ei ole vielä kortteja.');
    expect((await repositories.collection.load()).value.entries).toEqual([]);
  });

  it('works with the keyboard and keeps the same "+" element when "−" appears', async () => {
    const user = userEvent.setup();
    await renderView();
    const plusButton = plus('Swordwise Huscle');
    plusButton.focus();
    await user.keyboard('{Enter}');
    await settle();
    await user.keyboard(' ');
    await settle();
    expect(plus('Swordwise Huscle')).toBe(plusButton);
    expect(plusButton).toHaveFocus();
    expect(controlCell('Swordwise Huscle')).toHaveTextContent('Kokoelmassa 2 kappaletta');
  });

  it('at 999 "+" is aria-disabled (not disabled) and does not change the count', async () => {
    const user = userEvent.setup();
    const repositories = withCollection([{ card: 'v-streetkid', count: 999 }]);
    const setCount = vi.spyOn(repositories.collection, 'setCount');
    await renderView(repositories);
    const plusButton = plus('V, Streetkid');
    expect(plusButton).toHaveAttribute('aria-disabled', 'true');
    expect(plusButton).toBeEnabled();
    await user.click(plusButton);
    await settle();
    expect(setCount).not.toHaveBeenCalled();
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 999 kappaletta');
    expect(plusButton).toHaveFocus();
  });

  it('keeps a stored key that is not in the card list and leaves it out of the summary (A3)', async () => {
    const user = userEvent.setup();
    const repositories = withCollection([
      { card: 'old-name', count: 4 },
      { card: 'v-streetkid', count: 1 },
    ]);
    const { container } = await renderView(repositories);
    expect(summary(container)).toHaveTextContent('Kokoelmassa 1 eri kortti, yhteensä 1 kappale.');
    await user.click(plus('V, Streetkid'));
    await settle();
    const saved = await repositories.collection.load();
    expect(saved.value.entries).toEqual([
      { card: 'old-name', count: 4 },
      { card: 'v-streetkid', count: 2 },
    ]);
  });
});

describe('CatalogView collection: loading states', () => {
  it('reserves the control while the collection loads and shows the summary text', async () => {
    const repositories = createMemoryRepositories();
    vi.spyOn(repositories.collection, 'load').mockReturnValue(new Promise(() => {}));
    const { container } = await renderView(repositories);
    expect(summary(container)).toHaveTextContent('Haetaan kokoelmaa…');
    expect(within(row('V, Streetkid')).queryByRole('button')).toBeNull();
    expect(controlCell('V, Streetkid')).toHaveTextContent('ladataan');
  });

  it.each([{ status: 'loading' } as const, { status: 'error', kind: 'network' } as const])(
    'shows nothing of the collection without a card list ($status)',
    async (state) => {
      const { container } = await renderView(createMemoryRepositories(), state);
      expect(summary(container)).toBeNull();
      expect(screen.queryByText(/Kokoelma/)).toBeNull();
    },
  );

  it('counts only the visible cards in the PARTIAL state', async () => {
    const repositories = withCollection([
      { card: 'v-streetkid', count: 2 },
      { card: 'swordwise-huscle', count: 1 },
    ]);
    const { container } = await renderView(repositories, ready([cards[0] as Card], 3));
    expect(summary(container)).toHaveTextContent('Kokoelmassa 1 eri kortti, yhteensä 2 kappaletta.');
  });

  it('formats large totals with a space as the thousands separator', async () => {
    const repositories = withCollection([
      { card: 'v-streetkid', count: 999 },
      { card: 'swordwise-huscle', count: 25 },
    ]);
    const { container } = await renderView(repositories);
    expect(summary(container)?.textContent).toBe('Kokoelmassa 2 eri korttia, yhteensä 1 024 kappaletta.');
  });
});

