import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createFakeAuth, createMemoryCloud, FAKE_USER } from './account';
import type { MemoryCloud } from './account';
import { createMemoryRepositories } from './storage';
import type { Repositories } from './storage';

// Account data in the app (T-054c): sign-in flows, sign-out and the sync status in the menu.
// The cloud is the in-memory one; nothing touches the network.

const CONTENT = { name: 'Pakka', sections: [{ name: '', cards: [{ card: 'detonate', count: 2 }] }] };

async function renderApp(options: { repositories: Repositories; cloud: MemoryCloud; signedIn?: boolean }) {
  const auth = createFakeAuth(options.signedIn === false ? {} : { user: FAKE_USER });
  window.location.hash = '#/pakat';
  render(
    <App cards={[]} repositories={options.repositories} account={{ auth, cloud: () => options.cloud }} />,
  );
  await act(async () => {});
  return auth;
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Tili' }));
}

afterEach(() => {
  window.location.hash = '';
});

describe('account data in the app', () => {
  it('shows the sync status in the account menu after the first sync', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await repositories.forAccount(FAKE_USER.uid).decks.create(CONTENT);
    const cloud = createMemoryCloud({ uid: FAKE_USER.uid });
    await renderApp({ repositories, cloud });
    await vi.waitFor(() => expect(cloud.paths()).toContain('meta'));
    await openMenu(user);
    expect(await screen.findByText(/Tallennettu tilille klo/)).toBeInTheDocument();
  });

  it('tells when there is no connection and that the changes are kept on the device', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    const cloud = createMemoryCloud({ uid: FAKE_USER.uid });
    cloud.failNext('offline');
    await renderApp({ repositories, cloud });
    await openMenu(user);
    expect(await screen.findByText('Ei yhteyttä, muutokset tallessa tällä laitteella.')).toBeInTheDocument();
  });

  it('keeps the account data in the browser on sign-out, shows a notice and hides it from the signed-out view', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    const account = repositories.forAccount(FAKE_USER.uid);
    await account.decks.create(CONTENT);
    const cloud = createMemoryCloud({ uid: FAKE_USER.uid });
    await renderApp({ repositories, cloud });
    expect(await screen.findByText('Pakka')).toBeInTheDocument();
    await vi.waitFor(() => expect(cloud.paths()).toContain('meta'));
    await screen.findByRole('button', { name: 'Tili' });

    await openMenu(user);
    await user.click(await screen.findByRole('button', { name: 'Kirjaudu ulos' }));

    expect(screen.getByRole('button', { name: 'Kirjaudu' })).toBeInTheDocument();
    expect(screen.getByText(/Tilisi tiedot jäävät tähän selaimeen/)).toBeInTheDocument();
    expect(screen.queryByText('Pakka')).not.toBeInTheDocument();
    expect((await account.decks.list()).value).toHaveLength(1);
    expect((await repositories.decks.list()).value).toEqual([]);
    expect(repositories.preferences.loadLastUid()).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Sulje ilmoitus' }));
    expect(screen.queryByText(/Tilisi tiedot jäävät/)).not.toBeInTheDocument();
  });

  it('warns before signing out with unsynced changes', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await repositories.forAccount(FAKE_USER.uid).decks.create(CONTENT);
    const cloud = createMemoryCloud({ uid: FAKE_USER.uid });
    cloud.failNext('offline');
    const auth = await renderApp({ repositories, cloud });
    await openMenu(user);
    await screen.findByText('Ei yhteyttä, muutokset tallessa tällä laitteella.');

    await user.click(screen.getByRole('button', { name: 'Kirjaudu ulos' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Kaikkia muutoksia ei ole tallennettu tilille');
    expect(auth.state().status).toBe('signed-in');
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Peruuta' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Kirjaudu ulos' }));
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Kirjaudu silti ulos' }));
    expect(auth.state().status).toBe('signed-out');
  });

  it('asks what to do when the browser and the account both have data, and merges on request', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await repositories.decks.create({ ...CONTENT, name: 'Selaimen pakka' });
    const cloud = createMemoryCloud({ uid: FAKE_USER.uid });
    const other = createMemoryRepositories().forAccount(FAKE_USER.uid);
    await other.decks.create({ ...CONTENT, name: 'Tilin pakka' });
    const { createAccountSession } = await import('./account');
    const seed = createAccountSession({
      uid: FAKE_USER.uid,
      anonymous: createMemoryRepositories(),
      account: other,
      cloud,
      locks: null,
    });
    seed.start();
    await vi.waitFor(() => expect(seed.status().sync.lastSyncedAt).not.toBeNull());
    seed.dispose();

    await renderApp({ repositories, cloud });
    const dialog = await screen.findByRole('dialog', { name: 'Tässä selaimessa ja tilillä on tietoja' });
    await user.click(within(dialog).getByRole('button', { name: 'Yhdistä' }));
    expect(await screen.findByText('Selaimen pakka')).toBeInTheDocument();
    expect(await screen.findByText('Tilin pakka')).toBeInTheDocument();
    await vi.waitFor(async () => expect((await repositories.decks.list()).value).toEqual([]));
  });

  it('signs out when the user cancels the first sign-in dialog and leaves the browser data alone', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    await repositories.decks.create({ ...CONTENT, name: 'Selaimen pakka' });
    const cloud = createMemoryCloud({ uid: FAKE_USER.uid });
    const other = createMemoryRepositories().forAccount(FAKE_USER.uid);
    await other.decks.create({ ...CONTENT, name: 'Tilin pakka' });
    const { createAccountSession } = await import('./account');
    const seed = createAccountSession({ uid: FAKE_USER.uid, anonymous: createMemoryRepositories(), account: other, cloud, locks: null });
    seed.start();
    await vi.waitFor(() => expect(seed.status().sync.lastSyncedAt).not.toBeNull());
    seed.dispose();

    const auth = await renderApp({ repositories, cloud });
    const dialog = await screen.findByRole('dialog', { name: 'Tässä selaimessa ja tilillä on tietoja' });
    await user.click(within(dialog).getByRole('button', { name: 'Peruuta' }));
    expect(auth.state().status).toBe('signed-out');
    expect((await repositories.decks.list()).value).toHaveLength(1);
  });
});
