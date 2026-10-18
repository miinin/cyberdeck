import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { createFakeAuth, createMemoryCloud, createMemoryPublicDecks, createMemoryTradeShares, FAKE_USER } from '../account';
import type { MemoryTradeShares, TradeShareStore } from '../account';
import { tradeShareId } from '../domain/tradeLink';
import { encodeTradeShare } from '../domain/tradeShare';
import { EMPTY_WANTS } from '../domain/wants';
import { createMemoryRepositories } from '../storage';
import { testCards } from './deckTestUtils';
import { PublicDecksContext } from './PublicDecksContext';
import { ShareTradeButton } from './ShareTradeButton';
import { TRADE_SHARE_UPDATE_DELAY_MS } from '../domain/tradeLink';

// Short trade links (T-178, D-037): opening one, sharing, stopping and the automatic refresh.

const HAVE_ONE = { entries: [{ card: 'u0', count: 2 }] };
const HAVE_TWO = { entries: [{ card: 'u0', count: 3 }] };
const dataOne = encodeTradeShare(HAVE_ONE, EMPTY_WANTS) ?? '';
const dataTwo = encodeTradeShare(HAVE_TWO, EMPTY_WANTS) ?? '';

function renderApp(options: { shares: MemoryTradeShares; hash: string }) {
  window.location.hash = options.hash;
  const auth = createFakeAuth({ user: null });
  render(
    <App
      cards={testCards}
      repositories={createMemoryRepositories()}
      account={{
        auth,
        cloud: () => createMemoryCloud({ uid: FAKE_USER.uid }),
        publicDecks: createMemoryPublicDecks().forUser,
        tradeShares: options.shares.forUser,
      }}
    />,
  );
}

describe('opening a short trade link (SR-53)', () => {
  it('shows the shared lists without signing in, and the long link route still works', async () => {
    const shares = createMemoryTradeShares();
    await shares.forUser(FAKE_USER.uid).publish(dataOne);
    const id = await tradeShareId(FAKE_USER.uid);
    renderApp({ shares, hash: `#/v/${id}` });
    expect(await screen.findByText(/sellaisena kuin hän on sen jakanut/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vaihtolinkki' })).toBeInTheDocument();
  });

  it('shows "not found" for a missing link', async () => {
    renderApp({ shares: createMemoryTradeShares(), hash: '#/v/0123456789abcdef' });
    expect(await screen.findByText('Linkkiä ei löytynyt. Jakaja on ehkä lopettanut jakamisen.')).toBeInTheDocument();
  });

  it('shows "not found" without any request for a malformed id', async () => {
    const shares = createMemoryTradeShares();
    renderApp({ shares, hash: '#/v/..%2Fusers' });
    expect(await screen.findByText('Linkkiä ei löytynyt. Jakaja on ehkä lopettanut jakamisen.')).toBeInTheDocument();
    expect(shares.reads).toBe(0);
  });

  it('shows "not found" for an invalid document and asks for a reload for a newer one, without crashing', async () => {
    const shares = createMemoryTradeShares();
    shares.docs.set('1'.repeat(16), { schemaVersion: 1, data: '<script>alert(1)</script>', updatedAt: 'x' });
    shares.docs.set('2'.repeat(16), { schemaVersion: 9, data: dataOne, updatedAt: 'x' });
    renderApp({ shares, hash: `#/v/${'1'.repeat(16)}` });
    expect(await screen.findByText(/Linkkiä ei löytynyt/)).toBeInTheDocument();
    act(() => {
      window.location.hash = `#/v/${'2'.repeat(16)}`;
    });
    expect(await screen.findByText(/uudemmalla sovellusversiolla/)).toBeInTheDocument();
  });

  it('shows a retry when reading fails', async () => {
    const shares = createMemoryTradeShares();
    shares.failNext('offline');
    renderApp({ shares, hash: '#/v/0123456789abcdef' });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Yritä uudelleen' }));
    expect(await screen.findByText(/Linkkiä ei löytynyt/)).toBeInTheDocument();
  });
});

describe('ShareTradeButton with an account (SR-54, SR-55, SR-57)', () => {
  let shares: MemoryTradeShares;
  let store: TradeShareStore;

  function setup(props: { have?: typeof HAVE_ONE; tradeShared?: boolean } = {}) {
    const repositories = createMemoryRepositories().forAccount(FAKE_USER.uid);
    if (props.tradeShared === true) repositories.preferences.saveTradeShared('collection');
    const view = (have: typeof HAVE_ONE, source: 'list' | 'collection' = 'collection') => (
      <PublicDecksContext.Provider value={{ store: null, publisher: null, ownTradeShares: store, tradeShares: store, signInAvailable: true }}>
        <ShareTradeButton have={have} want={EMPTY_WANTS} source={source} preferences={repositories.preferences} />
      </PublicDecksContext.Provider>
    );
    const result = render(view(props.have ?? HAVE_ONE));
    return { repositories, rerender: (have: typeof HAVE_ONE, source?: 'list' | 'collection') => result.rerender(view(have, source)) };
  }

  beforeEach(() => {
    shares = createMemoryTradeShares();
    store = shares.forUser(FAKE_USER.uid);
  });

  it('writes the short link, shows and copies it, remembers it per account and warns about live changes', async () => {
    const user = userEvent.setup();
    const { repositories } = setup();
    expect(screen.queryByLabelText('Vaihtolinkki')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
    const id = await tradeShareId(FAKE_USER.uid);
    const field = (await screen.findByLabelText('Vaihtolinkki')) as HTMLInputElement;
    expect(field.value).toBe(`${window.location.origin}/#/v/${id}`);
    expect(field.value.length).toBeLessThan(60);
    expect(await navigator.clipboard.readText()).toBe(field.value);
    expect(shares.docs.get(id)?.data).toBe(dataOne);
    expect(repositories.preferences.loadTradeShared()).toBe('collection');
    expect(screen.getByText(/myös myöhemmät muutokset, kunnes lopetat jakamisen/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lopeta jakaminen' })).toBeInTheDocument();
  });

  it('stops sharing: deletes the document, forgets the flag and hides the link', async () => {
    const user = userEvent.setup();
    const { repositories } = setup();
    await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
    await screen.findByLabelText('Vaihtolinkki');
    await user.click(screen.getByRole('button', { name: 'Lopeta jakaminen' }));
    expect(await screen.findByText('Jakaminen lopetettu. Jos jaat uudelleen, sama linkki toimii taas.')).toBeInTheDocument();
    expect(shares.docs.size).toBe(0);
    expect(repositories.preferences.loadTradeShared()).toBeNull();
    expect(screen.queryByLabelText('Vaihtolinkki')).toBeNull();
    // Sharing again restores the same link.
    await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
    expect(((await screen.findByLabelText('Vaihtolinkki')) as HTMLInputElement).value).toContain(await tradeShareId(FAKE_USER.uid));
  });

  it('shows a failed stop and keeps sharing on', async () => {
    const user = userEvent.setup();
    const { repositories } = setup();
    await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
    await screen.findByLabelText('Vaihtolinkki');
    shares.failNext('offline');
    await user.click(screen.getByRole('button', { name: 'Lopeta jakaminen' }));
    expect(await screen.findByText('Jakaminen ei onnistunut. Yritä uudelleen.')).toBeInTheDocument();
    expect(shares.docs.size).toBe(1);
    expect(repositories.preferences.loadTradeShared()).toBe('collection');
  });

  it('shows a failed share and does not remember it', async () => {
    const user = userEvent.setup();
    const { repositories } = setup();
    shares.failNext('denied');
    await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
    expect(await screen.findByText('Jakaminen ei onnistunut. Yritä uudelleen.')).toBeInTheDocument();
    expect(repositories.preferences.loadTradeShared()).toBeNull();
    expect(screen.queryByLabelText('Vaihtolinkki')).toBeNull();
  });

  describe('automatic refresh', () => {
    const fakeTimers = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('updates the shared document after the delay when the content changes', async () => {
      const user = userEvent.setup();
      const { rerender } = setup();
      await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
      await screen.findByLabelText('Vaihtolinkki');
      fakeTimers();
      const id = await tradeShareId(FAKE_USER.uid);
      const writesBefore = shares.writes;
      rerender(HAVE_TWO);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TRADE_SHARE_UPDATE_DELAY_MS - 1);
      });
      expect(shares.writes).toBe(writesBefore);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2);
      });
      // The id comes from crypto.subtle, which real timers resolve; wait for it.
      await vi.waitFor(() => expect(shares.docs.get(id)?.data).toBe(dataTwo));
    });

    it('BRK-06: Share within 10 s of the last write copies the link now and writes again when the gap has passed', async () => {
      const user = userEvent.setup();
      const { rerender } = setup();
      await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
      await screen.findByLabelText('Vaihtolinkki');
      const id = await tradeShareId(FAKE_USER.uid);
      fakeTimers();
      rerender(HAVE_TWO);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
        await vi.advanceTimersByTimeAsync(0);
      });
      await vi.waitFor(() => expect(screen.getByText('Päivitetään hetken kuluttua.')).toBeInTheDocument());
      expect(screen.queryByText('Jakaminen ei onnistunut. Yritä uudelleen.')).toBeNull();
      expect(await navigator.clipboard.readText()).toContain(`/#/v/${id}`);
      expect(shares.docs.get(id)?.data).toBe(dataOne);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(11_500);
      });
      await vi.waitFor(() => expect(shares.docs.get(id)?.data).toBe(dataTwo));
      expect(screen.queryByText('Päivitetään hetken kuluttua.')).toBeNull();
    });

    it('never creates the document: if sharing was stopped elsewhere, the flag is dropped (SR-54)', async () => {
      fakeTimers();
      const { repositories, rerender } = setup({ tradeShared: true });
      expect(shares.docs.size).toBe(0);
      rerender(HAVE_TWO);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TRADE_SHARE_UPDATE_DELAY_MS + 10);
      });
      await vi.waitFor(() => expect(repositories.preferences.loadTradeShared()).toBeNull());
      expect(shares.docs.size).toBe(0);
      expect(shares.writes).toBe(0);
    });

    it('does not write when the shared document already holds the content', async () => {
      fakeTimers();
      await store.publish(dataOne);
      const writesBefore = shares.writes;
      setup({ tradeShared: true });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TRADE_SHARE_UPDATE_DELAY_MS + 10);
      });
      // The check reads the document (its id is computed asynchronously), finds the same content and writes nothing.
      await vi.waitFor(() => expect(shares.reads).toBe(1));
      expect(shares.writes).toBe(writesBefore);
    });

    it('writes nothing when the source changed since sharing, until Share is pressed (SEC-178-1)', async () => {
      const user = userEvent.setup();
      const { repositories, rerender } = setup();
      await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
      await screen.findByLabelText('Vaihtolinkki');
      const id = await tradeShareId(FAKE_USER.uid);
      fakeTimers();
      const writesBefore = shares.writes;
      rerender(HAVE_TWO, 'list');
      expect(screen.getByText('Jaettu sisältö on eri lähteestä. Päivitä painamalla Jaa.')).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TRADE_SHARE_UPDATE_DELAY_MS * 2);
      });
      expect(shares.writes).toBe(writesBefore);
      expect(shares.docs.get(id)?.data).toBe(dataOne);
      expect(repositories.preferences.loadTradeShared()).toBe('collection');
      // Pressing Share is the user's confirmation: the new source is shared and remembered.
      vi.useRealTimers();
      // The memory store now refuses a rewrite within 10 s like the rules do (BRK-06): let the first write be old.
      shares.docs.set(id, { ...shares.docs.get(id), updatedAt: '2000-01-01T00:00:00.000Z' });
      await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
      await vi.waitFor(() => expect(shares.docs.get(id)?.data).toBe(dataTwo));
      expect(repositories.preferences.loadTradeShared()).toBe('list');
      expect(screen.queryByText('Jaettu sisältö on eri lähteestä. Päivitä painamalla Jaa.')).toBeNull();
    });

    it('never overwrites a document from a newer app version (SEC-178-3)', async () => {
      fakeTimers();
      shares.docs.set(await tradeShareId(FAKE_USER.uid), { schemaVersion: 9, data: dataOne, updatedAt: 'x' });
      const { repositories, rerender } = setup({ tradeShared: true });
      rerender(HAVE_TWO);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TRADE_SHARE_UPDATE_DELAY_MS + 10);
      });
      await vi.waitFor(() => expect(shares.reads).toBe(1));
      expect(shares.writes).toBe(0);
      expect(shares.docs.get(await tradeShareId(FAKE_USER.uid))?.schemaVersion).toBe(9);
      expect(repositories.preferences.loadTradeShared()).toBe('collection');
    });

    it('does nothing for an account that has not shared from this device', async () => {
      fakeTimers();
      const { rerender } = setup();
      rerender(HAVE_TWO);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(TRADE_SHARE_UPDATE_DELAY_MS * 2);
      });
      expect(shares.writes).toBe(0);
      expect(shares.docs.size).toBe(0);
    });
  });
});

describe('ShareTradeButton signed out', () => {
  it('keeps the long link and hints at signing in only where sign-in exists', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    const { rerender } = render(
      <PublicDecksContext.Provider value={{ store: null, publisher: null, signInAvailable: true }}>
        <ShareTradeButton have={HAVE_ONE} want={EMPTY_WANTS} />
      </PublicDecksContext.Provider>,
    );
    expect(screen.getByText('Kirjaudu, niin saat lyhyen linkin.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
    await waitFor(() => expect((screen.getByLabelText('Vaihtolinkki') as HTMLInputElement).value).toContain('#/vaihto/'));
    expect(screen.queryByRole('button', { name: 'Lopeta jakaminen' })).toBeNull();
    rerender(
      <PublicDecksContext.Provider value={{ store: null, publisher: null, signInAvailable: false }}>
        <ShareTradeButton have={HAVE_ONE} want={EMPTY_WANTS} />
      </PublicDecksContext.Provider>,
    );
    expect(screen.queryByText('Kirjaudu, niin saat lyhyen linkin.')).toBeNull();
  });
});
