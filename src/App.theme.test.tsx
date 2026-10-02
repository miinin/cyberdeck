import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createMemoryRepositories, StorageError } from './storage';
import type { Repositories } from './storage';

// Theme toggle (T-025, UX.md 8.9).
const THEME_KEY = 'cyberdeck:theme';

function themeAttribute() {
  return document.documentElement.getAttribute('data-theme');
}

/** Renders the app and waits until the saved theme has been loaded. */
async function renderApp(repositories: Repositories) {
  render(<App cards={[]} repositories={repositories} />);
  await act(async () => {});
  return screen.getByRole('button', { name: 'Vaalea teema' });
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('theme toggle', () => {
  it('starts dark on the first visit even when the device prefers light', async () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query.includes('light'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMedia);
    document.documentElement.setAttribute('data-theme', 'dark');

    await renderApp(createMemoryRepositories());

    expect(screen.getByRole('button', { name: 'Vaalea teema', pressed: false })).toBeInTheDocument();
    expect(themeAttribute()).toBe('dark');
  });

  it('is in the header, is the first tab stop and toggles with the mouse, Enter and Space', async () => {
    const user = userEvent.setup();
    const repositories = createMemoryRepositories();
    const button = await renderApp(repositories);

    expect(screen.getByRole('banner')).toContainElement(button);
    expect(button).toHaveAttribute('type', 'button');
    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(themeAttribute()).toBe('light');

    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(themeAttribute()).toBe('dark');

    await user.click(button);
    // Same element, still focused, same name in both states (UX.md 8.4, T5).
    expect(screen.getByRole('button', { name: 'Vaalea teema', pressed: true })).toBe(button);
    expect(button).toHaveFocus();
    expect(themeAttribute()).toBe('light');
  });

  it('saves the choice so that a new page load starts light', async () => {
    const repositories = createMemoryRepositories();
    await userEvent.click(await renderApp(repositories));
    expect(await repositories.preferences.loadTheme()).toBe('light');

    // A new page load on the same storage, starting from the static dark default of index.html.
    cleanup();
    document.documentElement.setAttribute('data-theme', 'dark');
    await renderApp(repositories);

    expect(screen.getByRole('button', { name: 'Vaalea teema', pressed: true })).toBeInTheDocument();
    expect(themeAttribute()).toBe('light');
  });

  it('starts light from the saved value even without the init script', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    await renderApp(createMemoryRepositories({ initial: { [THEME_KEY]: 'light' } }));

    expect(screen.getByRole('button', { name: 'Vaalea teema', pressed: true })).toBeInTheDocument();
    expect(themeAttribute()).toBe('light');
  });

  it('shows the theme already painted by the init script on the first render', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    render(<App cards={[]} repositories={createMemoryRepositories()} />);

    // Synchronously, before the saved value is loaded: no flash of the wrong button state.
    expect(screen.getByRole('button', { name: 'Vaalea teema', pressed: true })).toBeInTheDocument();
  });

  it.each(['LIGHT', 'blue', '{"theme":"light"}'])('reads the unknown saved value %j as dark', async (raw) => {
    await renderApp(createMemoryRepositories({ initial: { [THEME_KEY]: raw } }));

    expect(screen.getByRole('button', { name: 'Vaalea teema', pressed: false })).toBeInTheDocument();
    expect(themeAttribute()).toBe('dark');
  });

  it('still changes the theme for the session when saving fails, without an error message', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const repositories = createMemoryRepositories();
    vi.spyOn(repositories.preferences, 'saveTheme').mockRejectedValue(new StorageError('quota', 'full'));
    const button = await renderApp(repositories);

    await userEvent.click(button);
    await act(async () => {});

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(themeAttribute()).toBe('light');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('Theme could not be saved (quota)');
  });

  it('keeps the choice when the saved value loads only after the user has clicked', async () => {
    const repositories = createMemoryRepositories({ initial: { [THEME_KEY]: 'light' } });
    let finishLoad: (theme: 'light') => void = () => {};
    vi.spyOn(repositories.preferences, 'loadTheme').mockReturnValue(
      new Promise((resolve) => {
        finishLoad = resolve;
      }),
    );
    render(<App cards={[]} repositories={repositories} />);
    const button = screen.getByRole('button', { name: 'Vaalea teema' });

    await userEvent.click(button); // dark → light
    await userEvent.click(button); // light → dark
    await act(async () => finishLoad('light'));

    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(themeAttribute()).toBe('dark');
  });
});
