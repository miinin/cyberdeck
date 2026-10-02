import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { renderRoute, storedCollection, storedDecks } from './deckTestUtils';

const LIST = '# Tuotu testi\n// Legends (3)\n1 L1\n1 L2\n1 L3\n3 Unit 0\n2 Unit 1\n1 Nonexistent Card\n';

async function openImport(initial: Record<string, string> = {}) {
  const user = userEvent.setup();
  const repositories = renderRoute('#/pakat', createMemoryRepositories({ initial }));
  await user.click(await screen.findByRole('button', { name: 'Tuo pakkalista' }));
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
    await user.upload(screen.getByLabelText('Tai valitse .txt-tiedosto'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent('Tiedosto on liian suuri');
    expect(read).not.toHaveBeenCalled();
  });

  it('reads a small file into the text field', async () => {
    const { user } = await openImport();
    await user.upload(screen.getByLabelText('Tai valitse .txt-tiedosto'), new File(['1 L1'], 'a.txt', { type: 'text/plain' }));
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

  it('returns to the list with the import button focused', async () => {
    const { user } = await openImport();
    await user.click(screen.getByRole('button', { name: 'Takaisin pakkoihin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tuo pakkalista' })).toHaveFocus());
  });
});
