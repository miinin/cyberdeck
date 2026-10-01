import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CardCatalog } from '../api';
import type { Card } from '../domain/card';
import type { Collection } from '../domain/collection';
import { StorageError, createMemoryRepositories } from '../storage';
import type { CollectionRepository, LoadNotice, Repositories } from '../storage';
import { CatalogView } from './CatalogView';
import type { CatalogState } from './useCardCatalog';
import { COUNT_ANNOUNCE_DELAY_MS, NOTICE_ANNOUNCE_DELAY_MS } from './useCollectionAnnouncements';
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

/** Repositories whose collection reports `notices` on load (and saves in memory). */
function withNotices(notices: LoadNotice[], persistent = true): Repositories {
  const repositories = createMemoryRepositories();
  const collection: CollectionRepository = {
    ...repositories.collection,
    load: async () => ({ value: (await repositories.collection.load()).value, notices }),
  };
  return { ...repositories, collection, persistent };
}

interface PendingSave {
  count: number;
  finish: () => Promise<void>;
  fail: (error: unknown) => Promise<void>;
}

/** Each setCount waits until the test finishes or fails it. `trigger` = a change in another tab. */
function controlled(entries: { card: string; count: number }[] = []) {
  const base = withCollection(entries);
  const pending: PendingSave[] = [];
  const listeners = new Set<() => void>();
  const collection: CollectionRepository = {
    load: () => base.collection.load(),
    setCount: (card, count) =>
      new Promise<Collection>((resolve, reject) => {
        pending.push({
          count,
          finish: async () => {
            await act(async () => {
              await base.collection.setCount(card, count).then(resolve, reject);
            });
            await settle();
          },
          fail: async (error) => {
            reject(error);
            await settle();
          },
        });
      }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const repositories: Repositories = { ...base, collection, persistent: true };
  return {
    repositories,
    base,
    pending,
    trigger: () => act(() => listeners.forEach((listener) => listener())),
  };
}

const persistentMemory = (entries: { card: string; count: number }[] = []): Repositories => ({
  ...withCollection(entries),
  persistent: true,
});
const live = () => screen.getByRole('status');
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const heading2 = () => screen.queryAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

describe('CatalogView collection: notices', () => {
  it('in-memory storage (persistent: false) shows a warning and no browser reminder', async () => {
    await renderView(createMemoryRepositories());
    expect(heading2()).toEqual(['Tietoja ei voi tallentaa']);
    expect(screen.getByText(/^Selain ei salli tietojen tallentamista tälle sivustolle\. Voit merkitä/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sulje/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pyydä pysyvää tallennusta' })).toBeNull();
    expect(plus('V, Streetkid')).toBeInTheDocument(); // counts still work in memory
  });

  it('reset with a backup: a closable warning that never shows the backup key (SEC-007)', async () => {
    const user = userEvent.setup();
    const { container } = await renderView(
      withNotices([{ kind: 'reset', backupKey: 'cyberdeck:backup:collection:2026-10-01T10:00:00.000Z' }]),
    );
    const box = screen.getByRole('heading', { name: 'Vanhat kokoelmatiedot eivät olleet luettavissa' }).parentElement;
    expect(box).toHaveClass('notice-warning');
    expect(container.textContent).not.toMatch(/cyberdeck:|backup|2026/);

    await user.click(
      screen.getByRole('button', { name: 'Sulje ilmoitus: Vanhat kokoelmatiedot eivät olleet luettavissa' }),
    );
    expect(heading2()).toEqual([]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('reset without a backup: a danger box without "Sulje", and counts stay usable (A4)', async () => {
    await renderView(withNotices([{ kind: 'reset', backupKey: null }]));
    const box = screen.getByRole('heading', { name: 'Vanhoja kokoelmatietoja ei voitu käsitellä' }).parentElement;
    expect(box).toHaveClass('notice-danger');
    expect(within(box as HTMLElement).queryByRole('button')).toBeNull();
    expect(plus('V, Streetkid')).toBeInTheDocument();
  });

  it.each([
    [1, 'Yhtä merkintää ei voitu lukea, ja se jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.'],
    [3, '3 merkintää ei voitu lukea, ja ne jätettiin pois. Muut merkinnät ovat tallessa. Tarkista kokoelmasi.'],
  ])('repaired with %i dropped: a closable warning with the right text', async (dropped, text) => {
    await renderView(withNotices([{ kind: 'repaired', dropped }]));
    expect(heading2()).toEqual(['Osa kokoelman tiedoista oli vioittunut']);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sulje ilmoitus: Osa kokoelman tiedoista oli vioittunut' }),
    ).toBeInTheDocument();
  });

  it('never shows the migrated notice and orders several notices as in UX.md 6.8', async () => {
    await renderView(
      withNotices(
        [
          { kind: 'repaired', dropped: 1 },
          { kind: 'migrated', from: 1, to: 2 },
          { kind: 'reset', backupKey: 'x' },
        ],
        false,
      ),
    );
    expect(heading2()).toEqual([
      'Vanhat kokoelmatiedot eivät olleet luettavissa',
      'Osa kokoelman tiedoista oli vioittunut',
      'Tietoja ei voi tallentaa',
    ]);
  });

  it('newer-version: LOCKED with "–" instead of buttons, no summary and no "Vain omistetut"', async () => {
    const { container } = await renderView(
      createMemoryRepositories({ initial: { [COLLECTION_KEY]: stored([{ card: 'v-streetkid', count: 1 }], 99) } }),
    );
    expect(heading2()).toContain('Kokoelma on tallennettu uudemmalla versiolla');
    expect(within(row('V, Streetkid')).queryByRole('button')).toBeNull();
    expect(controlCell('V, Streetkid')).toHaveTextContent('–ei muokattavissa');
    expect(summary(container)).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Vain omistetut' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Sulje/ })).toBeNull();
  });

  it('a failed read: danger box, no "Omistan" column, and "Lue kokoelma uudelleen" recovers', async () => {
    const user = userEvent.setup();
    const repositories = persistentMemory([{ card: 'v-streetkid', count: 2 }]);
    const load = vi.spyOn(repositories.collection, 'load').mockRejectedValueOnce(new Error('SecurityError'));
    const { container } = await renderView(repositories);

    expect(heading2()).toEqual(['Kokoelmaa ei voitu lukea']);
    expect(container.textContent).not.toMatch(/SecurityError/);
    const headers = within(screen.getByRole('table'))
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual(['Nimi', 'Tyyppi ja väri', 'Hinta']);
    expect(screen.queryByRole('checkbox', { name: 'Vain omistetut' })).toBeNull();
    expect(summary(container)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Lue kokoelma uudelleen' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
    expect(heading2()).toEqual([]);
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 2 kappaletta');
  });

  it('announces the notices 1.5 s after the loaded message, in one message', async () => {
    vi.useFakeTimers();
    try {
      await renderView(withNotices([{ kind: 'repaired', dropped: 1 }], false));
      expect(live()).toHaveTextContent('3 korttia ladattu.');
      advance(NOTICE_ANNOUNCE_DELAY_MS - 1);
      expect(live()).toHaveTextContent('3 korttia ladattu.');
      advance(1);
      expect(live()).toHaveTextContent('Osa kokoelman tiedoista oli vioittunut. Tietoja ei voi tallentaa.');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('CatalogView collection: failed saves', () => {
  it.each([
    [
      'quota',
      'Muutosta ei voitu tallentaa',
      'Selaimen tallennustila on täynnä, joten kortin määrä ei muuttunut. Vapauta tilaa poistamalla selaimen tietoja muilta sivustoilta ja yritä uudelleen.',
    ],
    [
      'unavailable',
      'Muutosta ei voitu tallentaa',
      'Selain esti tallennuksen, joten kortin määrä ei muuttunut. Yritä uudelleen. Jos ongelma jatkuu, tarkista selaimen yksityisyysasetukset.',
    ],
    [
      'limit-reached',
      'Kokoelma on täynnä',
      'Kokoelmaan mahtuu enintään 5 000 eri korttia, joten uutta korttia ei voi lisätä. Voit poistaa kortteja, joita et enää tarvitse.',
    ],
    ['invalid-input', 'Muutosta ei voitu tallentaa', 'Jokin meni pieleen, ja kortin määrä ei muuttunut. Yritä uudelleen.'],
  ] as const)('%s: the count returns, a danger box tells why and the live region says it at once', async (kind, title, body) => {
    const user = userEvent.setup();
    const { repositories, pending } = controlled([{ card: 'v-streetkid', count: 2 }]);
    const { container } = await renderView(repositories);
    await user.click(plus('V, Streetkid'));
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 3 kappaletta');
    await pending[0]?.fail(new StorageError(kind, 'technical message'));

    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 2 kappaletta');
    const box = screen.getByRole('heading', { level: 2, name: title }).parentElement as HTMLElement;
    expect(box).toHaveClass('notice-danger');
    expect(within(box).getByText(body)).toBeInTheDocument();
    expect(within(box).getAllByRole('button').map((button) => button.textContent)).toEqual(['Sulje']);
    expect(live()).toHaveTextContent(`${title} Kortin määrä ei muuttunut.`);
    expect(container.textContent).not.toMatch(/technical message/);
    expect(plus('V, Streetkid')).toHaveFocus();
  });

  it('keeps one box, and the next successful save removes it', async () => {
    const user = userEvent.setup();
    const { repositories, pending } = controlled();
    await renderView(repositories);
    await user.click(plus('V, Streetkid'));
    await pending[0]?.fail(new StorageError('quota', 'x'));
    await user.click(plus('V, Streetkid'));
    await pending[1]?.fail(new StorageError('unavailable', 'x'));
    expect(heading2()).toEqual(['Muutosta ei voitu tallentaa']);
    expect(screen.getByText(/^Selain esti tallennuksen/)).toBeInTheDocument();

    await user.click(plus('V, Streetkid'));
    await pending[2]?.finish();
    expect(heading2()).toEqual([]);
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 1 kappale');
  });

  it('does not announce the same error kind again while its box is shown', async () => {
    vi.useFakeTimers();
    try {
      const { repositories, pending } = controlled();
      await renderView(repositories);
      fireEvent.click(plus('V, Streetkid'));
      await pending[0]?.fail(new StorageError('quota', 'x'));
      expect(live()).toHaveTextContent('Muutosta ei voitu tallentaa Kortin määrä ei muuttunut.');
      // Something else is said in between; a repeated quota error must not replace it.
      fireEvent.click(screen.getByRole('checkbox', { name: 'Legend' }));
      act(() => vi.advanceTimersByTime(ANNOUNCE_DELAY_MS));
      expect(live()).toHaveTextContent('Näytetään 1 / 3 korttia.');
      fireEvent.click(plus('V, Streetkid'));
      await pending[1]?.fail(new StorageError('quota', 'x'));
      expect(live()).toHaveTextContent('Näytetään 1 / 3 korttia.');
      // A different kind is announced.
      fireEvent.click(plus('V, Streetkid'));
      await pending[2]?.fail(new StorageError('unavailable', 'x'));
      expect(live()).toHaveTextContent('Muutosta ei voitu tallentaa Kortin määrä ei muuttunut.');
    } finally {
      vi.useRealTimers();
    }
  });

  it('"Sulje" removes the error box and moves focus to the heading', async () => {
    const user = userEvent.setup();
    const { repositories, pending } = controlled();
    await renderView(repositories);
    await user.click(plus('V, Streetkid'));
    await pending[0]?.fail(new StorageError('quota', 'x'));
    await user.click(screen.getByRole('button', { name: 'Sulje ilmoitus: Muutosta ei voitu tallentaa' }));
    expect(heading2()).toEqual([]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('newer-version on save: the view becomes LOCKED', async () => {
    const user = userEvent.setup();
    const { repositories, pending } = controlled([{ card: 'v-streetkid', count: 2 }]);
    await renderView(repositories);
    await user.click(plus('V, Streetkid'));
    await pending[0]?.fail(new StorageError('newer-version', 'x'));
    expect(heading2()).toEqual(['Kokoelma on tallennettu uudemmalla versiolla']);
    expect(controlCell('V, Streetkid')).toHaveTextContent('ei muokattavissa');
    expect(live()).toHaveTextContent('Kokoelma on tallennettu uudemmalla versiolla. Kortin määrä ei muuttunut.');
  });
});

describe('CatalogView collection: live announcements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fast presses: the screen shows the newest count, and one message tells start to end after saving', async () => {
    const { repositories, pending } = controlled();
    await renderView(repositories);
    for (let press = 0; press < 5; press += 1) fireEvent.click(plus('V, Streetkid'));
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 5 kappaletta');
    expect(pending).toHaveLength(1);

    await pending[0]?.finish(); // saves 1; the newest target 5 is saved next
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 5 kappaletta');
    advance(COUNT_ANNOUNCE_DELAY_MS);
    expect(live()).toHaveTextContent('3 korttia ladattu.'); // still saving: nothing yet

    await pending[1]?.finish();
    expect(pending.map((save) => save.count)).toEqual([1, 5]);
    advance(COUNT_ANNOUNCE_DELAY_MS - 1);
    expect(live()).toHaveTextContent('3 korttia ladattu.');
    advance(1);
    expect(live()).toHaveTextContent('V, Streetkid lisätty kokoelmaan: 5 kappaletta.');
  });

  it('a slow answer for an older count never shows on screen', async () => {
    const { repositories, pending } = controlled([{ card: 'v-streetkid', count: 3 }]);
    await renderView(repositories);
    fireEvent.click(minus('V, Streetkid') as HTMLElement);
    fireEvent.click(minus('V, Streetkid') as HTMLElement);
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 1 kappale');
    await pending[0]?.finish(); // the answer for 2 arrives
    expect(controlCell('V, Streetkid')).toHaveTextContent('Kokoelmassa 1 kappale');
    await pending[1]?.finish();
    advance(COUNT_ANNOUNCE_DELAY_MS);
    expect(live()).toHaveTextContent('V, Streetkid: 1 kappale kokoelmassa.');
  });

  it('removal is announced, and "+" then "−" back to the start is not', async () => {
    await renderView(persistentMemory([{ card: 'swordwise-huscle', count: 1 }]));
    fireEvent.click(plus('Swordwise Huscle'));
    await settle();
    fireEvent.click(minus('Swordwise Huscle') as HTMLElement);
    await settle();
    advance(COUNT_ANNOUNCE_DELAY_MS);
    expect(live()).toHaveTextContent('3 korttia ladattu.');

    fireEvent.click(minus('Swordwise Huscle') as HTMLElement);
    await settle();
    advance(COUNT_ANNOUNCE_DELAY_MS);
    expect(live()).toHaveTextContent('Swordwise Huscle poistettu kokoelmasta.');
  });

  it('presses on different cards announce only the card changed last', async () => {
    await renderView(persistentMemory());
    fireEvent.click(plus('V, Streetkid'));
    await settle();
    fireEvent.click(plus('Swordwise Huscle'));
    await settle();
    fireEvent.click(plus('Swordwise Huscle'));
    await settle();
    advance(COUNT_ANNOUNCE_DELAY_MS);
    expect(live()).toHaveTextContent('Swordwise Huscle lisätty kokoelmaan: 2 kappaletta.');
  });

  it('"+" at 999 is announced at once', async () => {
    await renderView(persistentMemory([{ card: 'v-streetkid', count: 999 }]));
    fireEvent.click(plus('V, Streetkid'));
    expect(live()).toHaveTextContent('Enimmäismäärä 999 on täynnä: V, Streetkid.');
  });

  it('a change in another tab updates the counts quietly and is announced after 750 ms', async () => {
    const { repositories, base, trigger } = controlled();
    await renderView(repositories);
    await act(async () => {
      await base.collection.setCount('viktor-vektor-pinch', 4);
    });
    trigger();
    await settle();
    expect(controlCell('Viktor Vektor, You Might Feel a Little Pinch')).toHaveTextContent('Kokoelmassa 4 kappaletta');
    advance(ANNOUNCE_DELAY_MS - 1);
    expect(live()).toHaveTextContent('3 korttia ladattu.');
    advance(1);
    expect(live()).toHaveTextContent('Kokoelma päivittyi toisessa välilehdessä.');
  });

  it('when "−" disappears in an update from another tab, focus moves to "+" of the row', async () => {
    const { repositories, base, trigger } = controlled([{ card: 'v-streetkid', count: 1 }]);
    await renderView(repositories);
    (minus('V, Streetkid') as HTMLElement).focus();
    await act(async () => {
      await base.collection.setCount('v-streetkid', 0);
    });
    trigger();
    await settle();
    expect(minus('V, Streetkid')).toBeNull();
    expect(plus('V, Streetkid')).toHaveFocus();
  });
});

describe('CatalogView collection: browser reminder and persistent storage', () => {
  function stubStorageManager(value: unknown) {
    Object.defineProperty(navigator, 'storage', { value, configurable: true });
  }

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'storage');
  });

  it('tells that data stays in this browser and never asks for persistence on load (SR-13)', async () => {
    const persist = vi.fn(async () => true);
    stubStorageManager({ persist, persisted: vi.fn(async () => false) });
    await renderView(persistentMemory());
    expect(
      screen.getByText(
        'Kokoelma tallentuu vain tähän selaimeen tällä laitteella. Se ei siirry toiselle laitteelle eikä toiseen selaimeen.',
      ),
    ).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Pyydä pysyvää tallennusta' });
    expect(button).toHaveAccessibleDescription(
      'Pysyvä tallennus pyytää selainta säilyttämään kokoelman, vaikka laitteen tallennustila vähenee. Selaimen tietojen tyhjennys poistaa kokoelman silti.',
    );
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([
    [true, 'Selain lupasi säilyttää kokoelmasi. Selaimen tietojen tyhjennys poistaa sen silti.'],
    [
      false,
      'Selain ei antanut lupaa pysyvään tallennukseen. Kokoelma tallentuu silti, mutta selain voi poistaa sen, jos laitteen tila loppuu. Älä tyhjennä selaimen tietoja.',
    ],
  ])('the button asks once (answer %s); the result replaces it, takes focus and is announced', async (answer, text) => {
    let resolve: (value: boolean) => void = () => {};
    const persist = vi.fn(() => new Promise<boolean>((done) => (resolve = done)));
    stubStorageManager({ persist, persisted: vi.fn(async () => false) });
    await renderView(persistentMemory());
    const button = screen.getByRole('button', { name: 'Pyydä pysyvää tallennusta' });

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveTextContent('Pyydä pysyvää tallennusta');
    fireEvent.click(button);
    expect(persist).toHaveBeenCalledTimes(1);

    await act(async () => resolve(answer));
    await settle();
    expect(screen.queryByRole('button', { name: 'Pyydä pysyvää tallennusta' })).toBeNull();
    expect(screen.getByText(text, { selector: 'p' })).toHaveFocus();
    expect(live()).toHaveTextContent(text);
  });

  it('shows only the promise when the browser already persists the data (A2)', async () => {
    const persist = vi.fn(async () => true);
    stubStorageManager({ persist, persisted: vi.fn(async () => true) });
    await renderView(persistentMemory());
    expect(
      screen.getByText('Selain on luvannut säilyttää kokoelmasi. Selaimen tietojen tyhjennys poistaa sen silti.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pyydä pysyvää tallennusta' })).toBeNull();
    expect(persist).not.toHaveBeenCalled();
  });
});
