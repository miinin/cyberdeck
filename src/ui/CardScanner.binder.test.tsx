import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { cardFingerprint } from '../domain/cardFingerprint';
import type { IndexedFingerprint, PixelImage } from '../domain/cardFingerprint';
import type { Printing } from '../domain/printing';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { ScanCardsButton } from './CardScanner';
import { resetEditionConfirmed } from './EditionConfirmDialog';
import { useCollection } from './useCollection';

// T-179: a whole binder page from one picture. The camera and the file decoder are mocked; the recognition is real.
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
const cards = [card('alpha', 'Alpha'), card('bravo', 'Bravo'), card('charlie', 'Charlie'), card('delta', 'Delta')];
const fingerprints: IndexedFingerprint[] = [1, 2, 3].map((seed, i) => ({ id: cards[i]?.key ?? '', ...cardFingerprint(art(seed)) }));
vi.mock('../data/fingerprintIndex', () => ({ loadFingerprintIndex: () => Promise.resolve(fingerprints) }));

/** A page of pockets (67 x 92 units, the card 63 x 88 inside): `seeds` per pocket in reading order, 0 = an empty pocket. */
function makePage(columns: number, rows: number, seeds: readonly number[]): PixelImage {
  const unit = 2;
  const pocketW = 67 * unit;
  const pocketH = 92 * unit;
  const width = columns * pocketW;
  const height = rows * pocketH;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([205, 205, 210, 255], i * 4);
  const cardW = 63 * unit;
  const cardH = 88 * unit;
  seeds.forEach((seed, slot) => {
    if (seed === 0) return;
    const source = art(seed);
    const left = (slot % columns) * pocketW + (pocketW - cardW) / 2;
    const top = Math.floor(slot / columns) * pocketH + (pocketH - cardH) / 2;
    for (let y = 0; y < cardH; y++) {
      for (let x = 0; x < cardW; x++) {
        const from = (Math.floor((y * source.height) / cardH) * source.width + Math.floor((x * source.width) / cardW)) * 4;
        data.set(source.data.slice(from, from + 4), ((top + y) * width + left + x) * 4);
      }
    }
  });
  return { data, width, height };
}

// Reading order of the 3 x 3 page: Alpha, Bravo, Charlie, Alpha, Bravo, Charlie, empty, Alpha, Bravo.
const PAGE = makePage(3, 3, [1, 2, 3, 1, 2, 3, 0, 1, 2]);
let shown: PixelImage = PAGE;

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

function Harness({ repositories }: { repositories: Repositories }) {
  const { snapshot, store } = useCollection(repositories.collection);
  return <ScanCardsButton cards={cards} snapshot={snapshot} store={store} edition="beta" onEditionChange={() => {}} preferences={repositories.preferences} />;
}

async function openBinder(repositories: Repositories, grid?: '3x4') {
  const user = userEvent.setup();
  render(<Harness repositories={repositories} />);
  await settle();
  await user.click(screen.getByRole('button', { name: 'Skannaa kortteja' }));
  await settle();
  await user.click(screen.getByRole('button', { name: 'Kansiosivu' }));
  if (grid !== undefined) await user.click(screen.getByRole('radio', { name: '3×4' }));
  await user.click(screen.getByRole('button', { name: 'Skannaa Retail' }));
  await settle();
  return user;
}

async function takePhoto(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Ota kuva' }));
  await screen.findByRole('list', { name: 'Sivun taskut' }, { timeout: 15000 });
}

/** The view that replaced another one ignores clicks for a moment (BRK-01, BRK-09): a test waits it out. */
const afterSettling = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 350)));

const collectionEntries = async (repositories: Repositories) => (await repositories.collection.load()).value.entries;
const pocket = (n: number) => screen.getByRole('button', { name: new RegExp(`^Tasku ${n}:`) });

beforeEach(() => {
  resetEditionConfirmed();
  shown = PAGE;
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
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

describe('Binder page mode', () => {
  it('is a third mode that is remembered, with the instruction text and the 3x3 / 3x4 choice', async () => {
    const repositories = createMemoryRepositories();
    const user = userEvent.setup();
    render(<Harness repositories={repositories} />);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Skannaa kortteja' }));
    await settle();
    expect(screen.getByRole('button', { name: 'Yksi kerrallaan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jatkuva' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Kansiosivu' }));
    expect(screen.getByRole('button', { name: 'Kansiosivu' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('radio', { name: '3×3' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: '3×4' }));
    await settle();
    expect(await repositories.preferences.loadScanMode()).toBe('binder');
    expect(await repositories.preferences.loadScanGrid()).toBe('3x4');
    await user.click(screen.getByRole('button', { name: 'Skannaa Retail' }));
    await settle();
    expect(screen.getByText('Sovita kansiosivu kehykseen ja ota kuva.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ota kuva' })).toBeEnabled();
    // 3 x 4: two vertical and three horizontal grid lines over the frame.
    expect(document.querySelectorAll('.scanner-frame--binder .binder-line--column')).toHaveLength(2);
    expect(document.querySelectorAll('.scanner-frame--binder .binder-line--row')).toHaveLength(3);
    expect((document.querySelector('.scanner-viewport--binder') as HTMLElement).style.getPropertyValue('--binder-aspect')).toBe(String((3 * 67) / (4 * 92)));
  });

  it('reads the mode saved earlier', async () => {
    const repositories = createMemoryRepositories();
    await repositories.preferences.saveScanMode('binder');
    const user = userEvent.setup();
    render(<Harness repositories={repositories} />);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Skannaa kortteja' }));
    await settle();
    expect(screen.getByRole('button', { name: 'Kansiosivu' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Binder page scan', () => {
  it('recognises every pocket, marks the empty one and adds all with one press, then undoes', async () => {
    const repositories = createMemoryRepositories();
    const user = await openBinder(repositories);
    await takePhoto(user);
    const grid = screen.getByRole('list', { name: 'Sivun taskut' });
    expect(within(grid).getAllByRole('button')).toHaveLength(9);
    expect(pocket(1)).toHaveAccessibleName('Tasku 1: Alpha, Varma');
    expect(pocket(2)).toHaveAccessibleName('Tasku 2: Bravo, Varma');
    expect(pocket(3)).toHaveAccessibleName('Tasku 3: Charlie, Varma');
    expect(pocket(7)).toHaveAccessibleName('Tasku 7: Tyhjä');
    await user.click(screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' }));
    await settle();
    expect(screen.getByRole('status')).toHaveTextContent('Lisätty 8 korttia.');
    await afterSettling();
    expect(await collectionEntries(repositories)).toEqual([
      { card: 'alpha', count: 3, versions: { 'welcometonightcityretail:005a': 3 } },
      { card: 'bravo', count: 3, versions: { 'welcometonightcityretail:005a': 3 } },
      { card: 'charlie', count: 2, versions: { 'welcometonightcityretail:005a': 2 } },
    ]);
    await user.click(screen.getByRole('button', { name: 'Kumoa' }));
    await settle();
    expect(await collectionEntries(repositories)).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent('Lisäys kumottu.');
    expect(screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' })).toBeInTheDocument();
  });

  it('goes back to the camera with the same settings on Next page', async () => {
    const repositories = createMemoryRepositories();
    const user = await openBinder(repositories);
    await takePhoto(user);
    await user.click(screen.getByRole('button', { name: /^Lisää kokoelmaan/ }));
    await settle();
    await afterSettling();
    await user.click(screen.getByRole('button', { name: 'Seuraava sivu' }));
    await settle();
    expect(screen.getByText('Sovita kansiosivu kehykseen ja ota kuva.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ota kuva' })).toBeEnabled();
    expect(screen.getByText(/Kansiosivu · Retail/)).toBeInTheDocument();
  });

  it('reads a 3x4 page as twelve pockets', async () => {
    shown = makePage(3, 4, [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 0]);
    const user = await openBinder(createMemoryRepositories(), '3x4');
    await takePhoto(user);
    expect(within(screen.getByRole('list', { name: 'Sivun taskut' })).getAllByRole('button')).toHaveLength(12);
    expect(pocket(12)).toHaveAccessibleName('Tasku 12: Tyhjä');
    expect(screen.getByRole('button', { name: 'Lisää kokoelmaan (11 korttia)' })).toBeInTheDocument();
  });

  it('shows the progress while the pockets are read', async () => {
    const user = await openBinder(createMemoryRepositories());
    await user.click(await screen.findByRole('button', { name: 'Ota kuva' }));
    expect(screen.getByRole('status')).toHaveTextContent(/^Tunnistetaan \d\/9$/);
    await screen.findByRole('list', { name: 'Sivun taskut' }, { timeout: 15000 });
  });

  it('lets the user correct a pocket by search, mark a pocket empty, and adds the corrected page', async () => {
    const repositories = createMemoryRepositories();
    const user = await openBinder(repositories);
    await takePhoto(user);
    // The empty pocket gets a card from the search.
    await user.click(pocket(7));
    expect(screen.getByRole('button', { name: 'Tyhjä tasku' })).toHaveAttribute('aria-pressed', 'false');
    await user.type(screen.getByLabelText('Hae korttia nimellä'), 'delt');
    await user.click(screen.getByRole('button', { name: /Delta/ }));
    expect(pocket(7)).toHaveAccessibleName('Tasku 7: Delta, Varma');
    // A recognised pocket is marked empty.
    await user.click(pocket(1));
    await user.click(screen.getByRole('button', { name: 'Tyhjä tasku' }));
    expect(pocket(1)).toHaveAccessibleName('Tasku 1: Tyhjä');
    // A suggestion of the pocket can be taken instead.
    await user.click(pocket(2));
    await user.click(within(screen.getByRole('region', { name: 'Tasku 2' })).getAllByRole('button', { name: /Charlie/ })[0] as HTMLElement);
    expect(pocket(2)).toHaveAccessibleName('Tasku 2: Charlie, Varma');
    await user.click(screen.getByRole('button', { name: 'Valmis' }));
    // 8 recognised - 1 emptied + 1 searched = 8.
    await user.click(screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' }));
    await settle();
    expect(await collectionEntries(repositories)).toEqual([
      { card: 'alpha', count: 2, versions: { 'welcometonightcityretail:005a': 2 } },
      { card: 'bravo', count: 2, versions: { 'welcometonightcityretail:005a': 2 } },
      { card: 'charlie', count: 3, versions: { 'welcometonightcityretail:005a': 3 } },
      { card: 'delta', count: 1, versions: { 'welcometonightcityretail:005a': 1 } },
    ]);
  });

  it('does not add a pocket that was not recognised until the user chooses a card', async () => {
    shown = makePage(3, 3, [1, 2, 3, 1, 2, 3, 99, 1, 2]);
    const repositories = createMemoryRepositories();
    const user = await openBinder(repositories);
    await takePhoto(user);
    expect(pocket(7)).toHaveAccessibleName(/^Tasku 7: (Tarkista|Ei tunnistettu)|^Tasku 7: \w+, Tarkista$/);
    // BRK-02: the doubtful pocket is counted apart and left out of the addition.
    expect(screen.getByText('1 tarkistettavaa')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' }));
    await settle();
    const entries = await collectionEntries(repositories);
    expect(entries.reduce((sum, entry) => sum + entry.count, 0)).toBe(8);
  });

  it('adds nothing and says so when no pocket has a card', async () => {
    shown = makePage(3, 3, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const repositories = createMemoryRepositories();
    const user = await openBinder(repositories);
    await takePhoto(user);
    // BRK-10: the button is off and the reason is already beside it.
    expect(screen.getByRole('button', { name: 'Lisää kokoelmaan (0 korttia)' })).toBeDisabled();
    expect(screen.getByText(/Yhtään korttia ei ole lisättävänä/)).toBeInTheDocument();
    expect(await collectionEntries(repositories)).toEqual([]);
  });

  it('adds nothing when one card does not fit under the limit of 999', async () => {
    const repositories = createMemoryRepositories();
    await repositories.collection.setCount('alpha', 998);
    const user = await openBinder(repositories);
    await takePhoto(user);
    await user.click(screen.getByRole('button', { name: /^Lisää kokoelmaan/ }));
    await settle();
    expect(screen.getByText('Alpha: enimmäismäärä 999 ei riitä, mitään ei lisätty.')).toBeInTheDocument();
    expect(await collectionEntries(repositories)).toEqual([{ card: 'alpha', count: 998 }]);
    expect(screen.getByRole('button', { name: /^Lisää kokoelmaan/ })).toBeEnabled();
  });

  it('stops the camera when the scanner closes', async () => {
    const user = await openBinder(createMemoryRepositories());
    await takePhoto(user);
    cleanup();
    expect(stopTrack).toHaveBeenCalled();
  });
});

describe('A chosen picture file', () => {
  const bitmap = { width: PAGE.width, height: PAGE.height, close: vi.fn() };

  async function openFile(repositories = createMemoryRepositories()) {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const user = await openBinder(repositories);
    return { user, input: screen.getByLabelText('Valitse kuva') as HTMLInputElement };
  }

  it('opens the crop editor with four corners, then recognises the page', async () => {
    const repositories = createMemoryRepositories();
    const { user, input } = await openFile(repositories);
    expect(input).toHaveAttribute('accept', 'image/*');
    await user.upload(input, new File(['x'], 'page.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByRole('heading', { name: 'Rajaa kansiosivu' })).toBeInTheDocument();
    for (const name of ['Vasen yläkulma', 'Oikea yläkulma', 'Vasen alakulma', 'Oikea alakulma']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: 'Tunnista kortit' }));
    await screen.findByRole('list', { name: 'Sivun taskut' }, { timeout: 15000 });
    expect(pocket(1)).toHaveAccessibleName('Tasku 1: Alpha, Varma');
    expect(bitmap.close).toHaveBeenCalled();
  });

  it('moves a corner with the arrow keys', async () => {
    const { user, input } = await openFile();
    await user.upload(input, new File(['x'], 'page.jpg', { type: 'image/jpeg' }));
    const corner = await screen.findByRole('button', { name: 'Vasen yläkulma' });
    const rect = document.querySelector('.binder-crop-rect') as HTMLElement;
    expect(rect.style.left).toBe('0%');
    corner.focus();
    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(parseFloat(rect.style.left)).toBeGreaterThan(0);
    expect(parseFloat(rect.style.top)).toBeGreaterThan(0);
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowUp}{ArrowUp}');
    expect(rect.style.left).toBe('0%');
  });

  it('moves a corner by dragging it', async () => {
    const { user, input } = await openFile();
    await user.upload(input, new File(['x'], 'page.jpg', { type: 'image/jpeg' }));
    const corner = await screen.findByRole('button', { name: 'Oikea alakulma' });
    const rect = document.querySelector('.binder-crop-rect') as HTMLElement;
    Object.defineProperty(corner, 'setPointerCapture', { value: () => {}, configurable: true });
    fireEvent.pointerDown(corner, { pointerId: 1, clientX: 300, clientY: 400 });
    fireEvent.pointerMove(corner, { pointerId: 1, clientX: 270, clientY: 360 });
    expect(parseFloat(rect.style.width)).toBeCloseTo(90, 0);
    expect(parseFloat(rect.style.height)).toBeCloseTo(90, 0);
    fireEvent.pointerUp(corner, { pointerId: 1 });
    fireEvent.pointerMove(corner, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(parseFloat(rect.style.width)).toBeCloseTo(90, 0);
  });

  it('says the image could not be read for a file that is not an image', async () => {
    const { input } = await openFile();
    fireEvent.change(input, { target: { files: [new File(['hello'], 'notes.txt', { type: 'text/plain' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Kuvaa ei voitu lukea.');
  });

  it('says the image could not be read for a file over 25 MB, without decoding it', async () => {
    const { input } = await openFile();
    const big = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: 26 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [big] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Kuvaa ei voitu lukea.');
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('says the image could not be read when the browser cannot decode it', async () => {
    const { input } = await openFile();
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new DOMException('bad', 'InvalidStateError')));
    fireEvent.change(input, { target: { files: [new File(['broken'], 'broken.jpg', { type: 'image/jpeg' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Kuvaa ei voitu lukea.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ota kuva' })).toBeEnabled());
  });
});

describe('Doubtful pockets (BRK-02)', () => {
  it('shows a suggestion with Accept, and adds it only after Accept', async () => {
    shown = makePage(3, 3, [1, 2, 3, 1, 2, 3, 99, 1, 2]);
    const repositories = createMemoryRepositories();
    const user = await openBinder(repositories);
    await takePhoto(user);
    expect(pocket(7)).toHaveAccessibleName('Tasku 7: Bravo, Tarkista');
    expect(screen.getByText('1 tarkistettavaa')).toBeInTheDocument();
    // Not chosen by default: 8 of the 9 pockets are added.
    expect(screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hyväksy tasku 7: Bravo' }));
    expect(pocket(7)).toHaveAccessibleName('Tasku 7: Bravo, Varma');
    expect(screen.queryByText(/tarkistettavaa/)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Hyväksy/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Lisää kokoelmaan (9 korttia)' }));
    await settle();
    expect((await collectionEntries(repositories)).reduce((sum, entry) => sum + entry.count, 0)).toBe(9);
  });
});

describe('Break test fixes (T-183)', () => {
  const bitmap = { width: PAGE.width, height: PAGE.height, close: vi.fn() };
  const upload = (input: HTMLElement, user: ReturnType<typeof userEvent.setup>) => user.upload(input as HTMLInputElement, new File(['x'], 'page.jpg', { type: 'image/jpeg' }));

  it('BRK-01: a second click on Add adds once, and a click beside the dialog does not close the binder page', async () => {
    const repositories = createMemoryRepositories();
    const user = await openBinder(repositories);
    await takePhoto(user);
    const add = screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' });
    await user.dblClick(add);
    await settle();
    await screen.findByText('Lisätty 8 korttia.');
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    fireEvent.click(dialog);
    expect(dialog.open).toBe(true);
    // The second click of the double click was swallowed: the page is added once and Undo is still there.
    expect((await collectionEntries(repositories)).reduce((sum, entry) => sum + entry.count, 0)).toBe(8);
    expect(screen.getByRole('button', { name: 'Kumoa' })).toBeInTheDocument();
  });

  it('BRK-09 and BRK-05: Undo moves the focus to Add, and a click right after it does not open a pocket', async () => {
    const user = await openBinder(createMemoryRepositories());
    await takePhoto(user);
    await user.click(screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' }));
    await settle();
    // BRK-05: the focus is on the message, not lost to the page.
    await waitFor(() => expect(screen.getByRole('status')).toHaveFocus());
    await afterSettling();
    await user.click(screen.getByRole('button', { name: 'Kumoa' }));
    await settle();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lisää kokoelmaan (8 korttia)' })).toHaveFocus());
    await user.click(pocket(4));
    expect(screen.queryByRole('region', { name: 'Tasku 4' })).toBeNull();
    await afterSettling();
    await user.click(pocket(4));
    expect(screen.getByRole('region', { name: 'Tasku 4' })).toBeInTheDocument();
  });

  it('BRK-03: Choose image is there at the start and after a camera error, and a chosen file works without a camera', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    getUserMedia.mockRejectedValue(new DOMException('no', 'NotAllowedError'));
    const repositories = createMemoryRepositories();
    await repositories.preferences.saveScanMode('binder');
    const user = userEvent.setup();
    render(<Harness repositories={repositories} />);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Skannaa kortteja' }));
    await settle();
    expect(screen.getByLabelText('Valitse kuva')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skannaa Retail' }));
    await settle();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await upload(screen.getByLabelText('Valitse kuva'), user);
    expect(await screen.findByRole('heading', { name: 'Rajaa kansiosivu' })).toBeInTheDocument();
    // Without a camera there is no camera to go back to: the start view is shown.
    await user.click(screen.getByRole('button', { name: 'Takaisin kameraan' }));
    expect(screen.getByRole('button', { name: 'Skannaa Retail' })).toBeInTheDocument();
  });

  it('BRK-04: the file choice has an accessible name', async () => {
    const user = await openBinder(createMemoryRepositories());
    expect(user).toBeDefined();
    const label = screen.getByText('Valitse kuva');
    expect(label).not.toHaveAttribute('aria-hidden');
    expect(screen.getByLabelText('Valitse kuva')).toHaveAttribute('type', 'file');
  });

  it('BRK-08: a tiny or thin picture is turned down with its own message', async () => {
    const user = await openBinder(createMemoryRepositories());
    for (const [width, height] of [[8, 8], [30000, 3], [1300, 300]] as const) {
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width, height, close: vi.fn() }));
      await upload(screen.getByLabelText('Valitse kuva'), user);
      expect(await screen.findByRole('alert')).toHaveTextContent('Kuva on liian pieni tai kapea kansiosivuksi.');
    }
    expect(screen.queryByRole('heading', { name: 'Rajaa kansiosivu' })).toBeNull();
  });
});
