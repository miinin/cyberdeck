import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { chooseImport, renderRoute, storedCollection, storedDecks } from './deckTestUtils';

const LIST = '# Tuotu testi\n// Legends (3)\n1 L1\n1 L2\n1 L3\n3 Unit 0\n2 Unit 1\n1 Nonexistent Card\n';

async function openImport(initial: Record<string, string> = {}) {
  const user = userEvent.setup();
  const repositories = renderRoute('#/pakat', createMemoryRepositories({ initial }));
  await chooseImport(user, 'Tuo pakkalista');
  return { user, repositories };
}

async function check(user: ReturnType<typeof userEvent.setup>, text: string) {
  const field = screen.getByLabelText('Pakkalista');
  await user.clear(field);
  if (text !== '') await user.click(field);
  if (text !== '') await user.paste(text);
  await user.click(screen.getByRole('button', { name: 'Tarkista lista' }));
}

describe('Deck list import', () => {
  it('shows the report: owned/needed, missing, other decks, unrecognized lines and legality', async () => {
    const { user } = await openImport({
      ...storedCollection([['u0', 1]]),
      ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: [['u0', 1]] }]),
    });
    await check(user, LIST);
    const report = await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(within(report).getByText('Kokoelmasta puuttuu 7 korttia.')).toBeInTheDocument();
    const unit0 = within(report).getByText('3 × Unit 0').closest('li') as HTMLElement;
    expect(unit0).toHaveTextContent('omistat 1/3 · puuttuu');
    expect(unit0).toHaveTextContent('Myös pakoissa: Oma pakka');
    expect(within(report).getByText('Unit 0: 2 puuttuu')).toBeInTheDocument();
    expect(within(report).getByText('Tunnistamattomat rivit (1)')).toBeInTheDocument();
    expect(within(report).getByText('1 Nonexistent Card')).toBeInTheDocument();
    expect(within(report).getByText(/Pääpakassa on 5 korttia, vähintään 40/)).toBeInTheDocument();
  });

  it('shows the report like the deck column: progress, Legends, rows by type and stats (T-051)', async () => {
    const { user } = await openImport(storedCollection([['u0', 1]]));
    await check(user, LIST);
    const report = await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(within(report).getByText('Pääpakka 5/40–50')).toBeInTheDocument();
    expect(within(report).getByRole('heading', { name: 'Legendit (3/3)' })).toBeInTheDocument();
    expect(within(report).getByRole('heading', { name: 'Unit (5)' })).toBeInTheDocument();
    expect(within(report).getByText('3 × Unit 0').closest('li')).toHaveTextContent('omistat 1/3 · puuttuu 2');
    expect(within(report).getByRole('heading', { name: 'Tilastot' })).toBeInTheDocument();
  });

  it('says nothing was recognized instead of "all cards owned" and cannot save an empty deck (B-019)', async () => {
    const { user } = await openImport(storedCollection([['u0', 1]]));
    await check(user, 'asdf qwerty\n999 999 999');
    const report = await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(within(report).getByText(/Yhtään korttia ei tunnistettu/)).toBeInTheDocument();
    expect(within(report).queryByText('Kaikki pakan kortit ovat kokoelmassasi.')).toBeNull();
    expect(within(report).getByRole('button', { name: 'Tallenna pakaksi' })).toBeDisabled();
  });

  it('renders imported text as text, not markup (SR-14)', async () => {
    const { user } = await openImport();
    await check(user, '1 L1\n3 <img src=x onerror=alert(1)>');
    const report = await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(within(report).getByText('3 <img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(report.querySelector('img')).toBeNull();
  });

  it('shows a plain error and no report when a limit is exceeded', async () => {
    const { user } = await openImport();
    await check(user, '1 L1\n'.repeat(301));
    expect(await screen.findByRole('alert')).toHaveTextContent('liian monta riviä');
    expect(screen.queryByRole('region', { name: 'Tarkistuksen tulos' })).toBeNull();
  });

  it('rejects a file over 64 kB without reading it', async () => {
    const { user } = await openImport();
    const file = new File(['x'], 'big.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 64 * 1024 + 1 });
    const read = vi.spyOn(file, 'text');
    await user.upload(screen.getByLabelText('Tai valitse .txt- tai .json-tiedosto'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent('Tiedosto on liian suuri');
    expect(read).not.toHaveBeenCalled();
  });

  it('reads a small file into the text field', async () => {
    const { user } = await openImport();
    await user.upload(screen.getByLabelText('Tai valitse .txt- tai .json-tiedosto'), new File(['1 L1'], 'a.txt', { type: 'text/plain' }));
    await waitFor(() => expect(screen.getByLabelText('Pakkalista')).toHaveValue('1 L1'));
  });

  it('saves nothing until "Tallenna pakaksi", then creates a new deck with the editable name and opens it', async () => {
    const { user, repositories } = await openImport(storedDecks([{ id: 'a', name: 'Tuotu testi', cards: [] }]));
    await check(user, LIST);
    await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect((await repositories.decks.list()).value).toHaveLength(1);

    const name = screen.getByLabelText('Pakan nimi');
    expect(name).toHaveValue('Tuotu testi');
    await user.clear(name);
    await user.type(name, '  Oma versio ');
    await user.click(screen.getByRole('button', { name: 'Tallenna pakaksi' }));

    await waitFor(() => expect(window.location.hash).toMatch(/^#\/pakat\/.+/));
    const { value } = await repositories.decks.list();
    expect(value.map((deck) => deck.name)).toEqual(['Tuotu testi', 'Oma versio']);
    expect(value[0]?.sections[0]?.cards).toEqual([]);
    expect(value[1]?.sections[0]?.cards).toEqual([
      { card: 'l1', count: 1 },
      { card: 'l2', count: 1 },
      { card: 'l3', count: 1 },
      { card: 'u0', count: 3 },
      { card: 'u1', count: 2 },
    ]);
  });

  it('uses "Tuotu pakka" without a # line and validates the name before saving', async () => {
    const { user, repositories } = await openImport();
    await check(user, '1 L1');
    const name = await screen.findByLabelText('Pakan nimi');
    expect(name).toHaveValue('Tuotu pakka');
    await user.clear(name);
    await user.click(screen.getByRole('button', { name: 'Tallenna pakaksi' }));
    expect(await screen.findByText('Anna pakalle nimi.')).toBeInTheDocument();
    expect((await repositories.decks.list()).value).toEqual([]);
  });

  it('explains a failed save in plain language and keeps the report', async () => {
    const { user, repositories } = await openImport();
    vi.spyOn(repositories.decks, 'create').mockRejectedValueOnce(new Error('boom'));
    await check(user, '1 L1');
    await user.click(await screen.findByRole('button', { name: 'Tallenna pakaksi' }));
    expect(await screen.findByText(/Jokin meni pieleen/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tarkistuksen tulos' })).toBeInTheDocument();
  });

  it('returns to the list with the import menu button focused', async () => {
    const { user } = await openImport();
    await user.click(screen.getByRole('button', { name: 'Takaisin pakkoihin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tuo' })).toHaveFocus());
  });
});

describe('Deck import from a Netdeck link (T-046)', () => {
  const UUID = '40502c1f-1111-4222-8333-444455556666';
  const URL = `https://netdeck.gg/decks/cyberpunk/${UUID}`;
  const response = {
    name: 'Linkkipakka',
    owner: { display_name: 'Tekijä' },
    zones: [
      { zone_code: 'legends', cards: [1, 2, 3].map((n) => ({ quantity: 1, card: { id: `id-l${n}` } })) },
      { zone_code: 'deck', cards: [{ quantity: 3, card: { id: 'id-u0' } }, { quantity: 1, card: { id: 'unknown-id' } }] },
      { zone_code: 'sideboard', cards: [{ quantity: 2, card: { id: 'id-u1' } }] },
    ],
  };

  async function fetchLink(url: string, fetchImpl: typeof fetch) {
    const { user, repositories } = await openImport();
    globalThis.fetch = fetchImpl;
    await user.click(screen.getByLabelText('Netdeck-linkki'));
    await user.paste(url);
    await user.click(screen.getByRole('button', { name: 'Hae pakka' }));
    return { user, repositories };
  }

  it('shows the privacy notice before the search', async () => {
    await openImport();
    expect(screen.getByText(/Haku lähettää pyynnön Netdeck\.gg-palveluun\./)).toBeInTheDocument();
  });

  it('shows source, a separate sideboard and unknown cards, and saves under the Netdeck name', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(response)));
    const { user, repositories } = await fetchLink(URL, fetchMock);
    const report = await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(within(report).getByText('Netdeck: Linkkipakka, tekijä Tekijä')).toBeInTheDocument();
    expect(within(report).getByRole('heading', { level: 3, name: 'Sideboard' })).toBeInTheDocument();
    expect(within(report).getByText(/2 × Unit 1/)).toBeInTheDocument();
    expect(within(report).getByText('1 unknown-id')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`https://api.netdeck.gg/api/cyberpunk/decks/${UUID}`, expect.anything());

    expect(screen.getByLabelText('Pakan nimi')).toHaveValue('Linkkipakka');
    await user.click(screen.getByRole('button', { name: 'Tallenna pakaksi' }));
    await waitFor(async () => {
      const saved = (await repositories.decks.list()).value;
      expect(saved).toHaveLength(1);
      const keys = (saved[0]?.sections ?? []).flatMap((section) => section.cards.map((row) => row.card));
      expect(keys).toContain('u0');
      // The Netdeck sideboard is saved as the deck's sideboard section (T-058), apart from the main deck.
      const main = (saved[0]?.sections ?? []).filter((s) => s.name !== 'Sideboard').flatMap((s) => s.cards.map((r) => r.card));
      expect(main).not.toContain('u1');
      expect(keys).toContain('u1');
    });
  });

  it('rejects a foreign address without making a request', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    await fetchLink(`https://netdeck.gg.evil.com/decks/cyberpunk/${UUID}`, fetchMock);
    expect(await screen.findByText(/Linkki ei kelpaa/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains a missing deck', async () => {
    await fetchLink(URL, async () => new Response('{}', { status: 404 }));
    expect(await screen.findByText(/Pakkaa ei löytynyt/)).toBeInTheDocument();
  });

  it('explains an unreadable response', async () => {
    await fetchLink(URL, async () => new Response('{"name":5}'));
    expect(await screen.findByText(/vastausta ei voitu lukea/)).toBeInTheDocument();
  });
});
