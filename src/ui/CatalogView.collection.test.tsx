import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CardCatalog } from '../api';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { CatalogView } from './CatalogView';
import type { CatalogState } from './useCardCatalog';
import { ANNOUNCE_DELAY_MS } from './useDelayedAnnouncement';

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


const ownedOnlyBox = () => screen.getByRole('checkbox', { name: 'Vain omistetut' });
const rowNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent);
const statusText = (container: HTMLElement) => container.querySelector('#card-status')?.textContent;

describe('CatalogView collection: "Vain omistetut"', () => {
  it('sits in the search form right after the search field, unchecked', async () => {
    await renderView();
    const form = screen.getByRole('search');
    const box = within(form).getByRole('checkbox', { name: 'Vain omistetut' });
    expect(box).not.toBeChecked();
    expect(box.closest('fieldset')).toBeNull();
    const inputs = Array.from(form.querySelectorAll('input'));
    expect(inputs[0]).toHaveAttribute('type', 'search');
    expect(inputs[1]).toBe(box);
    expect(box.closest('label')).toHaveTextContent('Vain omistetut');
  });

  it('shows only owned cards together with the search and updates caption and status', async () => {
    const user = userEvent.setup();
    const { container } = await renderView(
      withCollection([
        { card: 'v-streetkid', count: 1 },
        { card: 'viktor-vektor-pinch', count: 2 },
      ]),
    );
    await user.click(ownedOnlyBox());
    expect(rowNames()).toEqual(['V, Streetkid', 'Viktor Vektor, You Might Feel a Little Pinch']);
    expect(screen.getByRole('table', { name: 'Hakua vastaavat kortit' })).toBeInTheDocument();
    expect(statusText(container)).toBe('2 / 3 korttia');

    await user.type(screen.getByRole('searchbox', { name: 'Hae nimellä' }), 'viktor');
    expect(rowNames()).toEqual(['Viktor Vektor, You Might Feel a Little Pinch']);
  });

  it('keeps a row whose count goes to 0 until the conditions change, and focus stays', async () => {
    const user = userEvent.setup();
    const { container } = await renderView(withCollection([{ card: 'v-streetkid', count: 1 }]));
    await user.click(ownedOnlyBox());
    await user.click(minus('V, Streetkid') as HTMLElement);
    await settle();

    expect(rowNames()).toEqual(['V, Streetkid']);
    expect(plus('V, Streetkid')).toHaveFocus();
    expect(statusText(container)).toBe('1 / 3 korttia');
    expect(container.querySelector('#collection-summary')).toHaveTextContent('Kokoelmassa ei ole vielä kortteja.');

    // Undo with "+", then remove again: still kept.
    await user.click(plus('V, Streetkid'));
    await settle();
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 1 kappale');

    await user.click(minus('V, Streetkid') as HTMLElement);
    await settle();
    await user.click(screen.getByRole('checkbox', { name: 'Legend' }));
    await user.click(screen.getByRole('checkbox', { name: 'Legend' }));
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('with an empty collection shows its own text and "Näytä kaikki kortit" moves focus to the checkbox', async () => {
    vi.useFakeTimers();
    try {
      await renderView();
      fireEvent.click(ownedOnlyBox());
      expect(screen.queryByRole('table')).toBeNull();
      expect(
        screen.getByText(
          'Kokoelmassa ei ole vielä kortteja. Poista "Vain omistetut" -valinta ja merkitse omistamasi kortit listasta.',
        ),
      ).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(ANNOUNCE_DELAY_MS));
      expect(screen.getByRole('status')).toHaveTextContent('Hakua vastaavia kortteja ei löytynyt.');

      fireEvent.click(screen.getByRole('button', { name: 'Näytä kaikki kortit' }));
      expect(ownedOnlyBox()).not.toBeChecked();
      expect(ownedOnlyBox()).toHaveFocus();
      expect(rowNames()).toHaveLength(3);
      expect(screen.getByRole('status')).toHaveTextContent('Näytetään kaikki 3 korttia.');
    } finally {
      vi.useRealTimers();
    }
  });

  it('with other conditions and no match, "Tyhjennä haku ja suodattimet" also clears "Vain omistetut"', async () => {
    const user = userEvent.setup();
    await renderView(withCollection([{ card: 'v-streetkid', count: 1 }]));
    await user.click(ownedOnlyBox());
    await user.type(screen.getByRole('searchbox', { name: 'Hae nimellä' }), 'swordwise');
    expect(
      screen.getByText('Hakua vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tyhjennä haku ja suodattimet' }));
    expect(ownedOnlyBox()).not.toBeChecked();
    expect(rowNames()).toHaveLength(3);
  });

  it('is not rendered while the collection loads or when it is locked', async () => {
    const loading = createMemoryRepositories();
    vi.spyOn(loading.collection, 'load').mockReturnValue(new Promise(() => {}));
    const { unmount } = await renderView(loading);
    expect(screen.queryByRole('checkbox', { name: 'Vain omistetut' })).toBeNull();
    unmount();

    await renderView(
      createMemoryRepositories({ initial: { [COLLECTION_KEY]: stored([{ card: 'v-streetkid', count: 1 }], 99) } }),
    );
    expect(screen.queryByRole('checkbox', { name: 'Vain omistetut' })).toBeNull();
  });
});
