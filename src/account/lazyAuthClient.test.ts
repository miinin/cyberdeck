import { createMemoryRepositories } from '../storage';
import { createLazyAuthClient } from './lazyAuthClient';
import { createFakeAuth, FAKE_USER } from './memory';

function setup(initial: Record<string, string> = {}, available = true) {
  const hints = createMemoryRepositories({ initial }).preferences;
  const inner = createFakeAuth();
  const loadClient = vi.fn(async () => inner);
  const client = createLazyAuthClient({ available, hints, loadClient });
  return { client, inner, loadClient };
}

// T-054a: the real client loads lazily, only when needed (SR-21 kohta 5).
describe('createLazyAuthClient', () => {
  it('loads nothing at startup without a hint', () => {
    const { client, loadClient } = setup();
    client.start();
    expect(loadClient).not.toHaveBeenCalled();
    expect(client.state().status).toBe('signed-out');
  });

  it('loads once at startup with a hint and starts the real client', async () => {
    const { client, inner, loadClient } = setup({ 'cyberdeck:account:last-uid': 'abc123' });
    const start = vi.spyOn(inner, 'start');
    client.start();
    client.start();
    expect(client.state().status).toBe('loading');
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1));
    expect(loadClient).toHaveBeenCalledTimes(1);
  });

  it('mirrors the real client after sign-in and sign-out', async () => {
    const { client, loadClient } = setup();
    const changes = vi.fn();
    client.onChange(changes);
    await client.signIn();
    expect(client.current()).toEqual(FAKE_USER);
    expect(client.state().status).toBe('signed-in');
    await client.signOut();
    expect(client.state()).toEqual({ status: 'signed-out', user: null, error: null });
    expect(loadClient).toHaveBeenCalledTimes(1);
    expect(changes).toHaveBeenCalled();
  });

  it('never loads where sign-in is off', async () => {
    const { client, loadClient } = setup({ 'cyberdeck:account:last-uid': 'abc123' }, false);
    client.start();
    await client.signIn();
    expect(client.available).toBe(false);
    expect(loadClient).not.toHaveBeenCalled();
  });

  it('shows a network error when the chunk does not load on sign-in, quietly at startup, and retries', async () => {
    const { client, loadClient } = setup({ 'cyberdeck:account:last-uid': 'abc123' });
    loadClient.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockRejectedValueOnce(new TypeError('x'));
    client.start();
    await vi.waitFor(() => expect(client.state().status).toBe('signed-out'));
    expect(client.state().error).toBeNull();

    await client.signIn();
    expect(client.state().error).toBe('network');
    await client.signIn();
    expect(client.state().status).toBe('signed-in');
    expect(loadClient).toHaveBeenCalledTimes(3);
  });
});
