import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { cardFingerprint } from '../domain/cardFingerprint';
import type { IndexedFingerprint, PixelImage } from '../domain/cardFingerprint';
import { MAX_DECK_DISTINCT_CARDS } from '../domain/deck';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { resetEditionConfirmed } from './EditionConfirmDialog';
import { resetScanDebugSamples } from './ScanDebugPanel';
import { clearDeckScan } from './scanIntent';
import { storedDecks, testCards } from './deckTestUtils';

// T-119: the scanner fills a deck from the deck editor, by the editor's own rules.
// Whole-app renders are slow under a loaded full run (like the other editor tests).
vi.setConfig({ testTimeout: 20000 });

function art(seed: number, width = 120, height = 168): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        let h = (Math.floor(x / 6) * 73856093) ^ (Math.floor(y / 6) * 19349663) ^ (seed * 83492791) ^ (c * 2654435761);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        data[(y * width + x) * 4 + c] = (h >>> 0) % 256;
      }
      data[(y * width + x) * 4 + 3] = 255;
    }
  }
  return { data, width, height };
}

// The "camera" shows the picture of the card with the key in `shownKey`.
const KEYS = ['u0', 'u1', 'l1', 'l2'];
let shownKey = 'u0';
const seedOf = (key: string) => KEYS.indexOf(key) + 1;
const fingerprints: IndexedFingerprint[] = KEYS.map((key) => ({ id: key, ...cardFingerprint(art(seedOf(key))) }));
vi.mock('../data/fingerprintIndex', () => ({ loadFingerprintIndex: () => Promise.resolve(fingerprints) }));

const stopTrack = vi.fn();

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

beforeEach(() => {
  resetEditionConfirmed();
  resetScanDebugSamples();
  clearDeckScan();
  shownKey = 'u0';
  stopTrack.mockClear();
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) },
    configurable: true,
  });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { value: 640, configurable: true });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { value: 480, configurable: true });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0, toJSON: () => ({}) });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ({ drawImage: () => {}, getImageData: () => art(seedOf(shownKey)) }) as unknown as CanvasRenderingContext2D,
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

function repositoriesWith(cards: [string, number][]): Repositories {
  return createMemoryRepositories({ initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards }]) });
}

async function openScanner(repositories: Repositories) {
  window.location.hash = '#/pakat/a';
  render(<App cards={testCards} repositories={repositories} />);
  await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
  await settle();
  fireEvent.click(screen.getByRole('button', { name: 'Skannaa kortteja pakkaan' }));
  await settle();
}

async function startDeckScan(options: { both?: boolean; side?: boolean } = {}) {
  if (options.both) fireEvent.click(screen.getByRole('radio', { name: 'Pakkaan ja kokoelmaan' }));
  if (options.side) fireEvent.click(screen.getByRole('radio', { name: 'Sideboard' }));
  fireEvent.click(screen.getByRole('button', { name: options.both ? 'Skannaa Beta' : 'Aloita skannaus' }));
  await settle();
}

/** Scans the card on the "camera" and adds `copies` of it with the button named `label`. */
async function scanAndAdd(key: string, label: RegExp | string, extraCopies = 0) {
  shownKey = key;
  fireEvent.click(screen.getByRole('button', { name: 'Skannaa' }));
  for (let i = 0; i < extraCopies; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Lisää yksi' }));
  fireEvent.click(screen.getByRole('button', { name: label }));
  await settle();
}

const deckRows = async (repositories: Repositories) => {
  const deck = (await repositories.decks.list()).value[0];
  return {
    main: Object.fromEntries(deck?.sections.filter((s) => s.name !== 'Sideboard').flatMap((s) => s.cards).map((r) => [r.card, r.count]) ?? []),
    side: Object.fromEntries(deck?.sections.filter((s) => s.name === 'Sideboard').flatMap((s) => s.cards).map((r) => [r.card, r.count]) ?? []),
  };
};

describe('Scanning into a deck (T-119)', () => {
  it('offers the deck choices with the deck name, defaulting to the main deck and deck only', async () => {
    await openScanner(repositoriesWith([]));
    expect(screen.getByRole('heading', { name: 'Skannaa pakkaan: Oma pakka' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Vain pakkaan' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pääpakka' })).toBeChecked();
    expect(screen.queryByText('Skannaatko Beta- vai Retail-kortteja?')).not.toBeInTheDocument();
  });

  it('adds scanned copies to the main deck only, not to the collection', async () => {
    const repositories = repositoriesWith([]);
    await openScanner(repositories);
    await startDeckScan();
    await scanAndAdd('u0', 'Lisää 2 × pakkaan Oma pakka', 1);
    expect(screen.getByText('Lisätty 2 × Unit 0 pakkaan Oma pakka (Pääpakka).')).toBeInTheDocument();
    await waitFor(async () => expect((await deckRows(repositories)).main).toEqual({ u0: 2 }));
    expect((await repositories.collection.load()).value.entries).toEqual([]);
  });

  it('adds to the sideboard when that part is chosen', async () => {
    const repositories = repositoriesWith([]);
    await openScanner(repositories);
    await startDeckScan({ side: true });
    await scanAndAdd('u1', 'Lisää 1 × pakkaan Oma pakka');
    await waitFor(async () => expect(await deckRows(repositories)).toEqual({ main: {}, side: { u1: 1 } }));
  });

  it('puts a Legend in the Legend slot even when the sideboard is chosen', async () => {
    const repositories = repositoriesWith([]);
    await openScanner(repositories);
    await startDeckScan({ side: true });
    await scanAndAdd('l1', 'Lisää 1 × pakkaan Oma pakka');
    await waitFor(async () => expect(await deckRows(repositories)).toEqual({ main: { l1: 1 }, side: {} }));
  });

  it('shows the editor rule in the scanner when the add is blocked, and adds nothing', async () => {
    const repositories = repositoriesWith([['l2', 1]]);
    await openScanner(repositories);
    await startDeckScan();
    // Four copies do not fit under the three-copy limit: all or none are added.
    shownKey = 'u0';
    fireEvent.click(screen.getByRole('button', { name: 'Skannaa' }));
    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Lisää yksi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lisää 4 × pakkaan Oma pakka' }));
    await settle();
    expect(screen.getByRole('alert')).toHaveTextContent('Pääpakassa ja sideboardissa on yhteensä jo 3 kopiota.');
    expect(screen.getByRole('heading', { name: 'Onko tämä kortti?' })).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });
    expect((await deckRows(repositories)).main).toEqual({ l2: 1 });
  });

  it('refuses a fourth copy across main deck and sideboard', async () => {
    const repositories = repositoriesWith([['u0', 3]]);
    await openScanner(repositories);
    await startDeckScan({ side: true });
    await scanAndAdd('u0', 'Lisää 1 × pakkaan Oma pakka');
    expect(screen.getByRole('alert')).toHaveTextContent('yhteensä jo 3 kopiota');
    expect((await deckRows(repositories)).side).toEqual({});
  });

  it('refuses a new card beyond the distinct-card limit', async () => {
    const many: [string, number][] = Array.from({ length: MAX_DECK_DISTINCT_CARDS }, (_, i) => [`x${i}`, 1]);
    await openScanner(repositoriesWith(many));
    await startDeckScan();
    await scanAndAdd('u0', 'Lisää 1 × pakkaan Oma pakka');
    expect(screen.getByRole('alert')).toHaveTextContent('Pakkaan mahtuu enintään 500 eri korttia');
  });

  it('adds to both the deck and the collection when asked', async () => {
    const repositories = repositoriesWith([]);
    await openScanner(repositories);
    await startDeckScan({ both: true });
    await scanAndAdd('u0', 'Lisää 1 × pakkaan Oma pakka ja kokoelmaan (Beta)');
    await waitFor(async () => expect((await deckRows(repositories)).main).toEqual({ u0: 1 }));
    expect((await repositories.collection.load()).value.entries.map((e) => [e.card, e.count])).toEqual([['u0', 1]]);
  });

  it('does not touch the collection when the deck refuses the card', async () => {
    const repositories = repositoriesWith([['u0', 3]]);
    await openScanner(repositories);
    await startDeckScan({ both: true });
    await scanAndAdd('u0', /^Lisää 1 × pakkaan/);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect((await repositories.collection.load()).value.entries).toEqual([]);
  });

  it('hides the Scan button where there is no camera', async () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');
    window.location.hash = '#/pakat/a';
    render(<App cards={testCards} repositories={repositoriesWith([])} />);
    await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
    expect(screen.queryByRole('button', { name: 'Skannaa kortteja pakkaan' })).not.toBeInTheDocument();
  });
});

describe('Scanning into a deck, continuous mode (T-119)', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: false }));
  afterEach(() => vi.useRealTimers());

  it('adds recognised cards to the deck and Undo takes the copy back from the deck and the collection', async () => {
    const repositories = repositoriesWith([]);
    window.location.hash = '#/pakat/a';
    render(<App cards={testCards} repositories={repositories} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Skannaa kortteja pakkaan' }));
    await settle();
    fireEvent.click(screen.getByRole('radio', { name: 'Pakkaan ja kokoelmaan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Jatkuva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    shownKey = 'u1';
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByText('1 kortti lisätty')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect((await repositories.decks.list()).value[0]?.sections.flatMap((s) => s.cards)).toEqual([{ card: 'u1', count: 1 }]);
    expect((await repositories.collection.load()).value.entries.map((e) => e.card)).toEqual(['u1']);

    fireEvent.click(screen.getByRole('button', { name: 'Kumoa: Unit 1' }));
    await settle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(screen.queryByText('1 kortti lisätty')).not.toBeInTheDocument();
    expect((await repositories.decks.list()).value[0]?.sections.flatMap((s) => s.cards)).toEqual([]);
    expect((await repositories.collection.load()).value.entries).toEqual([]);
  });
});

describe('Scan a new deck (T-119)', () => {
  it('creates the deck, opens the editor and the scanner at once', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    window.location.hash = '#/pakat';
    render(<App cards={testCards} repositories={repositories} />);
    await user.click(await screen.findByRole('button', { name: 'Skannaa uusi pakka' }));
    expect(await screen.findByRole('heading', { name: 'Skannaa pakkaan: Uusi pakka' })).toBeInTheDocument();
    expect((await repositories.decks.list()).value).toHaveLength(1);
    expect(window.location.hash).toMatch(/^#\/pakat\/.+/);
  });

  it('is left out where there is no camera', async () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');
    window.location.hash = '#/pakat';
    render(<App cards={testCards} repositories={createMemoryRepositories()} />);
    await screen.findByRole('button', { name: 'Uusi pakka' });
    expect(screen.queryByRole('button', { name: 'Skannaa uusi pakka' })).not.toBeInTheDocument();
  });
});
