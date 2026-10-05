import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readStoredLocale } from '../storage';
import { LanguageSwitch, languageActions } from './LanguageSwitch';

// The test setup runs the app in Finnish, so FI is the active language here.
describe('LanguageSwitch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a labelled group with FI pressed and a lang on each option', () => {
    render(<LanguageSwitch />);
    expect(screen.getByRole('group', { name: 'Kieli' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FI' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'FI' })).toHaveAttribute('lang', 'fi');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('lang', 'en');
  });

  it('saves the other language and reloads', async () => {
    const reload = vi.spyOn(languageActions, 'reload').mockImplementation(() => {});
    render(<LanguageSwitch />);
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(readStoredLocale()).toBe('en');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the active language is chosen', async () => {
    const reload = vi.spyOn(languageActions, 'reload').mockImplementation(() => {});
    render(<LanguageSwitch />);
    await userEvent.click(screen.getByRole('button', { name: 'FI' }));
    expect(readStoredLocale()).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload when saving fails', async () => {
    const reload = vi.spyOn(languageActions, 'reload').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    render(<LanguageSwitch />);
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(reload).not.toHaveBeenCalled();
  });
});
