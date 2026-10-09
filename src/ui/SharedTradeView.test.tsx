import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { createMemoryRepositories } from '../storage';
import { encodeTradeShare } from '../domain/tradeShare';
import { card, storedCollection, testCards } from './deckTestUtils';

// Trade links (T-062, T-063).

const col = (...rows: [string, number][]) => ({
  entries: rows.map(([c, count]) => ({ card: c, count })),
});
const storedWants = (entries: [string, number][]) => ({
  'cyberdeck:wants': JSON.stringify({
    schemaVersion: 1,
    savedAt: '2026-10-01T10:00:00.000Z',
    data: { entries: entries.map(([c, count]) => ({ card: c, count })) },
  }),
});
const cards = [...testCards, card('evil', { name: '<b>Evil</b>', displayName: '<b>Evil</b>' })];

/** The cell texts of the table row whose card name matches (the name is the row header; "–" stands for none). */
function row(scope: { queryAllByRole: typeof screen.queryAllByRole }, name: RegExp): string[] | null {
  const found = scope.queryAllByRole('row').find((tr) => name.test(tr.querySelector('th')?.textContent ?? ''));
  return found === undefined ? null : [...found.children].map((cell) => (cell.textContent ?? '').replace('ei yhtään', ''));
}
async function findRow(scope: { queryAllByRole: typeof screen.queryAllByRole }, name: RegExp) {
  return waitFor(() => {
    const found = row(scope, name);
    if (found === null) throw new Error('no row');
    return found;
  });
}

function open(data: string, initial: Record<string, string> = {}) {
  window.location.hash = `#/vaihto/${data}`;
  render(<App cards={cards} repositories={createMemoryRepositories({ initial })} />);
}

describe('Trade link route', () => {
  it('shows the sharer lists with tradeable counts as text and the comparison', async () => {
    // Sharer: 5 x Unit 0 (2 free), 1 x L1 (0 free), 4 x Unit 1 (1 free); wants Unit 5 x2 and L2.
    const data = encodeTradeShare(col(['u0', 5], ['l1', 1], ['u1', 4]), col(['u5', 2], ['l2', 1]));
    // Viewer: 4 x Unit 5 (1 free), wants Unit 0 x3 and L1.
    open(data ?? '', {
      ...storedCollection([
        ['u5', 4],
        ['l2', 1],
      ]),
      ...storedWants([
        ['u0', 3],
        ['l1', 1],
      ]),
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Vaihtolinkki' })).toBeInTheDocument();

    const haveSection = screen.getByRole('region', {
      name: 'Jakajan kokoelma',
    });
    expect(row(within(haveSection), /^Unit 0/)).toEqual(['Unit 0', '5', '2']);
    expect(row(within(haveSection), /^L1/)).toEqual(['L1', '1', '–']);
    const wantSection = screen.getByRole('region', { name: 'Jakajan want' });
    expect(row(within(wantSection), /^Unit 5/)).toEqual(['Unit 5', '2']);

    const compare = screen.getByRole('region', {
      name: 'Vertailu omaan kokoelmaasi',
    });
    await waitFor(() =>
      expect(
        within(compare).getByRole('heading', {
          name: 'Sinulla on, he haluavat',
        }),
      ).toBeInTheDocument(),
    );
    const tables = within(compare).getAllByRole('table');
    expect(row(within(tables[0] as HTMLElement), /^Unit 5/)).toEqual(['Unit 5', '1']);
    // They have 2 tradeable Unit 0 and I want 3 -> 2; L1 has no tradeable copy.
    expect(row(within(tables[1] as HTMLElement), /^Unit 0/)).toEqual(['Unit 0', '2']);
    expect(row(within(tables[1] as HTMLElement), /^L1/)).toBeNull();
  });

  it('shows only the sharer lists and an explanation when the own collection is locked', async () => {
    const newer = JSON.stringify({
      schemaVersion: 99,
      savedAt: '2026-10-01T10:00:00.000Z',
      data: {},
    });
    open(encodeTradeShare(col(['u0', 5]), col()) ?? '', {
      'cyberdeck:collection': newer,
    });
    expect(await screen.findByText(/vertailua ei voi näyttää/)).toBeInTheDocument();
    expect(row(screen, /^Unit 0/)).toEqual(['Unit 0', '5', '2']);
    expect(screen.queryByRole('heading', { name: 'Sinulla on, he haluavat' })).toBeNull();
  });

  it('shows names as text and reports unknown cards', async () => {
    const data = encodeTradeShare(col(['evil', 4], ['not-in-app', 2]), col());
    open(data ?? '');
    expect(await screen.findByText('<b>Evil</b>')).toBeInTheDocument();
    expect(document.querySelector('main b')).toBeNull();
    expect(screen.getByText(/1 korttia ei löydy/)).toBeInTheDocument();
  });

  it.each(['%%%', 'AAAA'])('shows a plain error for invalid data "%s"', async (bad) => {
    open(bad);
    expect(await screen.findByRole('heading', { name: 'Linkki ei toimi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Siirry Kortit-osioon' })).toHaveAttribute('href', '#/');
  });
});

describe('Share trade button', () => {
  it('copies a link that opens the same lists', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    window.location.hash = '#/vaihto';
    render(
      <App
        cards={cards}
        repositories={createMemoryRepositories({
          initial: {
            ...storedCollection([['u0', 4]]),
            ...storedWants([['u1', 2]]),
          },
        })}
      />,
    );
    await user.click(await screen.findByRole('button', { name: 'Jaa Have/Want' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    const url = String(writeText.mock.calls[0]?.[0]);
    expect(url).toMatch(/#\/vaihto\/[A-Za-z0-9_-]+$/);
    expect(screen.getByText('Linkki kopioitu leikepöydälle.')).toBeInTheDocument();
    expect(screen.getByLabelText('Vaihtolinkki')).toHaveValue(url);
    await act(async () => {
      window.location.hash = url.slice(url.indexOf('#'));
    });
    expect(await findRow(screen, /^Unit 0/)).toEqual(['Unit 0', '4', '1']);
  });

  it('shows the link in a field when copying fails', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('no')) },
      configurable: true,
    });
    window.location.hash = '#/vaihto';
    render(<App cards={cards} repositories={createMemoryRepositories()} />);
    await user.click(await screen.findByRole('button', { name: 'Jaa Have/Want' }));
    const field = await screen.findByLabelText('Vaihtolinkki');
    expect((field as HTMLInputElement).value).toContain('#/vaihto/');
  });
});
