import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { cardFingerprint } from '../domain/cardFingerprint';
import type { IndexedFingerprint, PixelImage } from '../domain/cardFingerprint';
import type { Printing } from '../domain/printing';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { ScanCardsButton } from './CardScanner';
import { resetEditionConfirmed } from './EditionConfirmDialog';
import { resetScanDebugSamples } from './ScanDebugPanel';
import { useCollection } from './useCollection';

/** A fixed random-looking picture per seed, so each "card" has its own fingerprint. */
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

const printing = (setCode: string, setName: string, number: string): Printing => ({
  key: `${setCode}:${number.replace('β', '')}`,
  setCode,
  setName,
  number,
  rarity: 'Rare',
  language: 'en',
  artist: null,
  imageKey: '',
});
const card = (key: string, name: string): Card => ({
  id: `id-${key}`,
  key,
  slug: key,
  name,
  subname: null,
  displayName: name,
  type: 'Unit',
  color: 'Red',
  cost: 2,
  power: null,
  ram: null,
  rarity: 'Rare',
  printings: [
    printing('welcometonightcityretail', 'Welcome to Night City — Retail', '005a'),
    printing('welcometonightcitybeta', 'Welcome to Night City — Beta', 'β005a'),
  ],
});
const cards = [card('alpha', 'Alpha'), card('bravo', 'Bravo'), card('charlie', 'Charlie')];

// What the "camera" shows: the index is made of these, and the canvas mock returns the current one.
let shown: PixelImage = art(1);
const fingerprints: IndexedFingerprint[] = [1, 2, 3].map((seed, i) => ({ id: cards[i]?.key ?? '', ...cardFingerprint(art(seed)) }));
vi.mock('../data/fingerprintIndex', () => ({ loadFingerprintIndex: () => Promise.resolve(fingerprints) }));

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

function Harness({ repositories, onEdition = () => {} }: { repositories: Repositories; onEdition?: (edition: string) => void }) {
  const { snapshot, store } = useCollection(repositories.collection);
  return <ScanCardsButton cards={cards} snapshot={snapshot} store={store} edition="beta" onEditionChange={onEdition} preferences={repositories.preferences} />;
}

async function openScanner(repositories: Repositories, onEdition?: (edition: string) => void) {
  const user = userEvent.setup();
  render(<Harness repositories={repositories} onEdition={onEdition} />);
  await settle();
  await user.click(screen.getByRole('button', { name: 'Skannaa kortteja' }));
  await settle();
  return user;
}

beforeEach(() => {
  resetEditionConfirmed();
  shown = art(1);
  stopTrack.mockClear();
  getUserMedia.mockReset().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { value: 640, configurable: true });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { value: 480, configurable: true });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0, toJSON: () => ({}) });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ({ drawImage: () => {}, getImageData: () => shown }) as unknown as CanvasRenderingContext2D,
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

describe('Scan button', () => {
  it('is left out when the browser has no camera API', async () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');
    render(<Harness repositories={createMemoryRepositories()} />);
    await settle();
    expect(screen.queryByRole('button', { name: 'Skannaa kortteja' })).not.toBeInTheDocument();
  });
});

describe('CardScanner', () => {
  it('asks for the edition first and opens the camera only after the choice', async () => {
    const onEdition = vi.fn();
    const user = await openScanner(createMemoryRepositories(), onEdition);
    expect(screen.getByText('Skannaatko Beta- vai Retail-kortteja?')).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Skannaa Retail' }));
    await settle();
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    expect(onEdition).toHaveBeenCalledWith('retail');
    expect(screen.getByRole('button', { name: 'Skannaa' })).toBeEnabled();
  });

  it('offers a sure match alone, adds it to the chosen edition and returns to the camera', async () => {
    const repositories = createMemoryRepositories();
    const user = await openScanner(repositories);
    await user.click(screen.getByRole('button', { name: 'Skannaa Retail' }));
    await settle();
    shown = art(2);
    await user.click(screen.getByRole('button', { name: 'Skannaa' }));
    expect(screen.getByRole('heading', { name: 'Onko tämä kortti?' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Bravo/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lisää yksi' }));
    await user.click(screen.getByRole('button', { name: 'Lisää 2 × Retail' }));
    await settle();
    expect(screen.getByRole('status')).toHaveTextContent('Lisätty 2 × Bravo (Retail).');
    expect(screen.getByRole('button', { name: 'Skannaa' })).toBeInTheDocument();
    const entries = (await repositories.collection.load()).value.entries;
    expect(entries).toEqual([{ card: 'bravo', count: 2, versions: { 'welcometonightcityretail:005a': 2 } }]);
  });

  it('shows three pictures when the match is not sure and adds nothing before a choice', async () => {
    const repositories = createMemoryRepositories();
    const user = await openScanner(repositories);
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    shown = art(99);
    await user.click(screen.getByRole('button', { name: 'Skannaa' }));
    expect(screen.getByRole('heading', { name: 'Mikä näistä on kortti?' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Alpha|Bravo|Charlie/ })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /^Lisää \d/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Charlie/ }));
    await user.click(screen.getByRole('button', { name: 'Lisää 1 × Beta' }));
    await settle();
    const entries = (await repositories.collection.load()).value.entries;
    expect(entries).toEqual([{ card: 'charlie', count: 1, versions: { 'welcometonightcitybeta:005a': 1 } }]);
  });

  it('lets the user ask for the other matches of a sure result', async () => {
    const user = await openScanner(createMemoryRepositories());
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    await user.click(screen.getByRole('button', { name: 'Skannaa' }));
    await user.click(screen.getByRole('button', { name: 'Näytä muut vaihtoehdot' }));
    expect(screen.getAllByRole('button', { name: /Alpha|Bravo|Charlie/ })).toHaveLength(3);
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
  });

  it('shows a clear text when the camera is denied or missing, and can go back to the edition', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'));
    const user = await openScanner(createMemoryRepositories());
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    expect(screen.getByRole('alert')).toHaveTextContent('Kameran käyttö estettiin.');
    getUserMedia.mockRejectedValueOnce(new DOMException('none', 'NotFoundError'));
    await user.click(screen.getByRole('button', { name: 'Yritä uudelleen' }));
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    expect(screen.getByRole('alert')).toHaveTextContent('ei löytynyt kameraa');
  });

  it('stops the camera when the scanner closes', async () => {
    const user = await openScanner(createMemoryRepositories());
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    expect(stopTrack).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Sulje' }));
    await settle();
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument();
  });

  it('stops the camera when the tab is hidden and asks for the edition again', async () => {
    const user = await openScanner(createMemoryRepositories());
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    expect(stopTrack).not.toHaveBeenCalled();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    try {
      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
    } finally {
      hidden.mockRestore();
    }
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Skannaa Beta' })).toBeInTheDocument();
  });

  it('stops a camera that arrives after the scanner was unmounted', async () => {
    let resolve: (stream: unknown) => void = () => {};
    getUserMedia.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    const view = render(<Harness repositories={createMemoryRepositories()} />);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Skannaa kortteja' }));
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    view.unmount();
    expect(stopTrack).not.toHaveBeenCalled();
    await act(async () => {
      resolve({ getTracks: () => [{ stop: stopTrack }] });
    });
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
});

describe('Continuous mode (T-108)', () => {
  // Fake timers do not mix with userEvent's own delays, so these tests click with fireEvent.
  const click = async (name: string) => {
    fireEvent.click(screen.getByRole('button', { name }));
    await settle();
  };
  async function startContinuous(repositories: Repositories, button = 'Skannaa Beta') {
    render(<Harness repositories={repositories} />);
    await settle();
    await click('Skannaa kortteja');
    await click('Jatkuva');
    await click(button);
  }
  const tick = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };
  const saved = async (repositories: Repositories) => (await repositories.collection.load()).value.entries;

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: false }));
  afterEach(() => vi.useRealTimers());

  it('adds a sure card once after two pictures, shows it in the list and does not double it', async () => {
    const repositories = createMemoryRepositories();
    await startContinuous(repositories);
    shown = art(2);
    await tick(280);
    expect(await saved(repositories)).toEqual([]);
    await tick(280 * 6);
    expect(await saved(repositories)).toEqual([{ card: 'bravo', count: 1, versions: { 'welcometonightcitybeta:005a': 1 } }]);
    expect(screen.getByText('1 kortti lisätty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kumoa: Bravo' })).toBeInTheDocument();
  });

  it('adds the same card again after the frame was out of use for a moment', async () => {
    const repositories = createMemoryRepositories();
    await startContinuous(repositories);
    shown = art(2);
    await tick(280 * 3);
    shown = art(99);
    await tick(280 * 4);
    shown = art(2);
    await tick(280 * 3);
    expect((await saved(repositories))[0]?.count).toBe(2);
    expect(screen.getByText('2 korttia lisätty')).toBeInTheDocument();
  });

  it('adds nothing for an unsure match', async () => {
    const repositories = createMemoryRepositories();
    await startContinuous(repositories);
    shown = art(99);
    await tick(280 * 8);
    expect(await saved(repositories)).toEqual([]);
  });

  it('undoes exactly the copy it added', async () => {
    const repositories = createMemoryRepositories();
    await startContinuous(repositories);
    shown = art(2);
    await tick(280 * 3);
    await click('Kumoa: Bravo');
    expect(await saved(repositories)).toEqual([]);
    expect(screen.queryByText('1 kortti lisätty')).not.toBeInTheDocument();
  });

  it('stops looking at the camera when the scanner closes', async () => {
    const repositories = createMemoryRepositories();
    await startContinuous(repositories);
    await click('Sulje');
    shown = art(2);
    await tick(280 * 8);
    expect(await saved(repositories)).toEqual([]);
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('remembers the mode on the device', async () => {
    const repositories = createMemoryRepositories();
    await startContinuous(repositories);
    expect(await repositories.preferences.loadScanMode()).toBe('continuous');
  });
});

describe('Scan diagnostics (T-113a)', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    resetScanDebugSamples();
  });

  it('shows no panel without ?scandebug=1', async () => {
    await openScanner(createMemoryRepositories());
    await userEvent.setup().click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    expect(screen.queryByRole('region', { name: 'Scan diagnostics' })).toBeNull();
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
  });

  it('shows the panel with ?scandebug=1 and saves a sample', async () => {
    window.history.replaceState(null, '', '/?scandebug=1');
    const user = await openScanner(createMemoryRepositories());
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    expect(screen.getByRole('region', { name: 'Scan diagnostics' })).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(screen.getByRole('status', { name: '' }).textContent).toMatch(/1\. Alpha 0 .*confident yes .*640x480/);
    await user.click(screen.getByRole('button', { name: 'Save sample' }));
    await user.click(screen.getByRole('button', { name: /^1\. Alpha/ }));
    expect(screen.getByText(/^1 samples/)).toBeTruthy();
    // A wrong tap is undone without losing the rest (T-113a fix).
    await user.click(screen.getByRole('button', { name: 'Undo last sample' }));
    expect(screen.getByText(/^0 samples/)).toBeTruthy();
  });

  it('keeps the samples when the scanner is closed and opened again', async () => {
    window.history.replaceState(null, '', '/?scandebug=1');
    const repositories = createMemoryRepositories();
    const user = await openScanner(repositories);
    await user.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    await user.click(screen.getByRole('button', { name: 'Save sample' }));
    await user.click(screen.getByRole('button', { name: /^1. Alpha/ }));
    cleanup();
    const again = await openScanner(repositories);
    await again.click(screen.getByRole('button', { name: 'Skannaa Beta' }));
    await settle();
    expect(screen.getByText(/^1 samples/)).toBeTruthy();
  });
});
