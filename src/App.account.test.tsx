import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createFakeAuth, FAKE_USER } from './account';
import type { FakeAuth } from './account';
import { loadFirebase } from './account/firebase/loadFirebase';
import { createMemoryRepositories } from './storage';

// Sign-in UI in the header (T-054a, D-017 kohta 1, SR-29 kohta 2). The real SDK is blocked in tests.

async function renderApp(auth?: FakeAuth, initial: Record<string, string> = {}) {
  render(
    <App cards={[]} repositories={createMemoryRepositories({ initial })} account={auth ? { auth } : undefined} />,
  );
  await act(async () => {});
}

function dialog() {
  return screen.getByRole('dialog');
}

describe('account: startup', () => {
  it('does not load Firebase for a user who never signed in', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: 'Kirjaudu' })).toBeInTheDocument();
    expect(vi.mocked(loadFirebase)).not.toHaveBeenCalled();
  });

  it('tries to restore the session when the last uid hint exists', async () => {
    // The real SDK is blocked, so restoring fails like a lost connection: quietly, the user stays signed out.
    await renderApp(undefined, { 'cyberdeck:account:last-uid': 'abc123' });
    await vi.waitFor(() => expect(vi.mocked(loadFirebase)).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: 'Kirjaudu' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a failed redirect sign-in in the dialog on return', async () => {
    await renderApp(undefined, { 'cyberdeck:account:redirect-pending': '1' });
    expect(await screen.findByRole('alert')).toHaveTextContent('yhteyttä ei saatu');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('account: signing in and out', () => {
  it('shows the age limit and privacy text before going to Google', async () => {
    const user = userEvent.setup();
    const auth = createFakeAuth();
    await renderApp(auth);

    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));
    expect(within(dialog()).getByRole('heading', { name: 'Kirjaudu Google-tilillä' })).toBeInTheDocument();
    expect(dialog()).toHaveTextContent('16 vuotta täyttäneille');
    expect(dialog()).toHaveTextContent('ei nimeäsi eikä sähköpostiasi');
    expect(auth.signInCalls).toBe(0);

    await user.click(within(dialog()).getByRole('button', { name: 'Peruuta' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(auth.signInCalls).toBe(0);
  });

  it('signs in, shows the email in the account menu and signs out', async () => {
    const user = userEvent.setup();
    const auth = createFakeAuth();
    await renderApp(auth);

    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));
    await user.click(within(dialog()).getByRole('button', { name: 'Jatka Googleen' }));
    expect(auth.signInCalls).toBe(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const menuButton = screen.getByRole('button', { name: 'Tili' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(`Kirjautuneena: ${FAKE_USER.email}`)).not.toBeVisible();
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(`Kirjautuneena: ${FAKE_USER.email}`)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Kirjaudu ulos' }));
    expect(screen.getByRole('button', { name: 'Kirjaudu' })).toBeInTheDocument();
    expect(screen.queryByText(/Kirjautuneena/)).not.toBeInTheDocument();
  });

  it('closes the account menu with Escape and returns focus to its button', async () => {
    const user = userEvent.setup();
    await renderApp(createFakeAuth({ user: { uid: 'abc123', email: null } }));

    const menuButton = screen.getByRole('button', { name: 'Tili' });
    await user.click(menuButton);
    expect(screen.getByText('Kirjautuneena Google-tilillä')).toBeVisible();
    await user.keyboard('{Escape}');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();
  });

  it('shows a fixed message when sign-in fails and lets the user retry', async () => {
    const user = userEvent.setup();
    const auth = createFakeAuth();
    auth.failNextSignIn('popup-blocked');
    await renderApp(auth);

    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));
    await user.click(within(dialog()).getByRole('button', { name: 'Jatka Googleen' }));
    expect(within(dialog()).getByRole('alert')).toHaveTextContent('Selain esti kirjautumisikkunan.');

    await user.click(within(dialog()).getByRole('button', { name: 'Jatka Googleen' }));
    expect(auth.signInCalls).toBe(2);
    expect(screen.getByRole('button', { name: 'Tili' })).toBeInTheDocument();
  });
});

describe('account: where sign-in is off (PR previews)', () => {
  it('tells that sign-in is not in use and never starts it', async () => {
    const user = userEvent.setup();
    const auth = createFakeAuth({ available: false });
    await renderApp(auth);

    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));
    expect(within(dialog()).getByRole('heading', { name: 'Kirjautuminen ei ole käytössä' })).toBeInTheDocument();
    expect(within(dialog()).queryByRole('button', { name: 'Jatka Googleen' })).not.toBeInTheDocument();
    await user.click(within(dialog()).getByRole('button', { name: 'Sulje' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(auth.signInCalls).toBe(0);
  });
});
