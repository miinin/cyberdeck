import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { renderRoute, storedDecks } from './deckTestUtils';

// Export and import of deck files (T-015, SR-18, SR-19).

const NAME = '// Tulta # 🔥 <b>x</b>';
const DECKS = storedDecks([{ id: 'a', name: NAME, cards: [['l1', 1], ['u0', 3]] }]);

interface Download {
  fileName: string;
  blob: Blob;
}

function captureDownloads() {
  const downloads: Download[] = [];
  const blobs: Blob[] = [];
  const revoked: string[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob);
    return `blob:test/${blobs.length}`;
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
    revoked.push(url);
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ fileName: this.download, blob: blobs[blobs.length - 1] as Blob });
  });
  return { downloads, revoked };
}

async function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsText(blob);
  });
}

afterEach(() => vi.restoreAllMocks());

describe('Deck export', () => {
  it('downloads a .json file from the deck list with a safe file name', async () => {
    const { downloads, revoked } = captureDownloads();
    const user = userEvent.setup();
    renderRoute('#/pakat', createMemoryRepositories({ initial: DECKS }));
    await user.click(await screen.findByRole('button', { name: `Vie .json: ${NAME}` }));
    expect(downloads).toHaveLength(1);
    expect(downloads[0]?.fileName).toBe('Tulta # 🔥 bxb.json');
    expect(downloads[0]?.blob.type).toBe('application/json');
    const file = JSON.parse(await readBlob(downloads[0]?.blob as Blob)) as { format: string; deck: { name: string } };
    expect(file.format).toBe('cyberdeck.deck');
    expect(file.deck.name).toBe(NAME);
    await waitFor(() => expect(revoked).toEqual(['blob:test/1']));
  });

  it('downloads a .txt file from the editor', async () => {
    const { downloads } = captureDownloads();
    const user = userEvent.setup();
    renderRoute('#/pakat/a', createMemoryRepositories({ initial: DECKS }));
    await user.click(await screen.findByRole('button', { name: `Vie .txt: ${NAME}` }));
    expect(downloads[0]?.blob.type).toBe('text/plain;charset=utf-8');
    expect(await readBlob(downloads[0]?.blob as Blob)).toBe(`# ${NAME}\n// Legends (1)\n1 L1\n// Main deck (3)\n3 Unit 0\n`);
  });
});

describe('Deck file import', () => {
  async function openImport(initial: Record<string, string> = {}) {
    const user = userEvent.setup();
    const repositories = renderRoute('#/pakat', createMemoryRepositories({ initial }));
    await user.click(await screen.findByRole('button', { name: 'Tuo pakkalista' }));
    return { user, repositories };
  }
  const picker = () => screen.getByLabelText('Tai valitse .txt- tai .json-tiedosto');

  it('accepts .json and .txt in the file picker', async () => {
    await openImport();
    expect(picker()).toHaveAttribute('accept', '.txt,.json,text/plain,application/json');
  });

  it('imports a .json file as a new deck with a new id, ignoring the id in the file', async () => {
    const { user, repositories } = await openImport();
    const text = JSON.stringify({
      format: 'cyberdeck.deck',
      version: 1,
      id: 'file-id',
      deck: { name: NAME, sections: [{ name: '', cards: [{ card: 'l1', name: 'x', count: 1 }, { card: 'u0', name: 'y', count: 3 }] }] },
    });
    await user.upload(picker(), new File([text], 'pakka.json', { type: 'application/json' }));
    await user.click(screen.getByRole('button', { name: 'Tarkista lista' }));
    const report = await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(within(report).getByText('3 × Unit 0')).toBeInTheDocument();
    expect(within(report).getByLabelText('Pakan nimi')).toHaveValue(NAME);
    await user.click(within(report).getByRole('button', { name: 'Tallenna pakaksi' }));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/pakat\/.+/));
    const { value } = await repositories.decks.list();
    expect(value).toHaveLength(1);
    expect(value[0]?.id).not.toBe('file-id');
    expect(value[0]?.name).toBe(NAME);
    expect(value[0]?.sections[0]?.cards).toEqual([
      { card: 'l1', count: 1 },
      { card: 'u0', count: 3 },
    ]);
  });

  it('shows a generic error for a file that is not a cyberdeck deck', async () => {
    const { user } = await openImport();
    await user.upload(picker(), new File(['{"hello":1}'], 'x.json', { type: 'application/json' }));
    await user.click(screen.getByRole('button', { name: 'Tarkista lista' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tiedosto ei ole cyberdeckin pakka.');
    expect(screen.queryByRole('region', { name: 'Tarkistuksen tulos' })).toBeNull();
  });

  it('shows an error for broken json', async () => {
    const { user } = await openImport();
    await user.upload(picker(), new File(['{"format":'], 'x.json', { type: 'application/json' }));
    await user.click(screen.getByRole('button', { name: 'Tarkista lista' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tiedostoa ei voitu lukea');
  });

  it('rejects a .json file over 256 kB without reading it, but allows more than the 64 kB of a .txt', async () => {
    const { user } = await openImport();
    const big = new File(['x'], 'big.json', { type: 'application/json' });
    Object.defineProperty(big, 'size', { value: 256 * 1024 + 1 });
    const read = vi.spyOn(big, 'text');
    await user.upload(picker(), big);
    expect(await screen.findByRole('alert')).toHaveTextContent('Enintään 256 kt');
    expect(read).not.toHaveBeenCalled();

    const medium = new File(['{}'], 'medium.json', { type: 'application/json' });
    Object.defineProperty(medium, 'size', { value: 100 * 1024 });
    await user.upload(picker(), medium);
    await waitFor(() => expect(screen.getByLabelText('Pakkalista')).toHaveValue('{}'));
  });
});
