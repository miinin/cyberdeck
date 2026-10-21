import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainNav } from './MainNav';
import type { Route } from './useHashRoute';

// jsdom does not implement the modal dialog methods.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

const nav = () => screen.getByRole('navigation', { name: 'Päävalikko' });

describe('MainNav (T-190)', () => {
  it('lists Cards, Collection, Decks, Have/Want, Playtest and Proxy in order, then the phone-only More button', () => {
    render(<MainNav route={{ name: 'cards' }} proxyCount={0} />);
    const items = [...nav().querySelectorAll('.nav-item')].map((item) => item.querySelector('.nav-label')?.textContent);
    expect(items).toEqual(['Kortit', 'Kokoelma', 'Pakat', 'Have/Want', 'Testaa', 'Proxy', 'Lisää']);
    // Playtest and Proxy are the two that the phone bar moves into the sheet.
    expect([...nav().querySelectorAll('.nav-extra')].map((item) => item.textContent)).toEqual(['Testaa', 'Proxy']);
  });

  it('marks only the current section with aria-current and More is not current on the first four pages', () => {
    const { rerender } = render(<MainNav route={{ name: 'collection' }} proxyCount={0} />);
    expect(within(nav()).getAllByRole('link').filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.textContent)).toEqual(['Kokoelma']);
    expect(within(nav()).getByRole('button', { name: 'Lisää' })).not.toHaveAttribute('data-current');
    rerender(<MainNav route={{ name: 'havewant' }} proxyCount={0} />);
    expect(within(nav()).getByRole('link', { name: 'Have/Want' })).toHaveAttribute('aria-current', 'page');
  });

  it.each<[Route, string]>([
    [{ name: 'sealed' }, 'Testaa'],
    [{ name: 'proxy' }, 'Proxy'],
  ])('shows More as current while %j is open', (route, link) => {
    render(<MainNav route={route} proxyCount={0} />);
    expect(within(nav()).getByRole('link', { name: link })).toHaveAttribute('aria-current', 'page');
    expect(within(nav()).getByRole('button', { name: 'Lisää' })).toHaveAttribute('data-current', 'true');
  });

  it('opens the More sheet with Playtest and Proxy (and the queue badge), and closes it with the close button', async () => {
    const user = userEvent.setup();
    render(<MainNav route={{ name: 'cards' }} proxyCount={3} />);
    const more = within(nav()).getByRole('button', { name: 'Lisää' });
    expect(more).toHaveAttribute('aria-haspopup', 'dialog');
    expect(more).toHaveAttribute('aria-expanded', 'false');

    await user.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const sheet = screen.getByRole('dialog', { name: 'Lisää' });
    expect(within(sheet).getByRole('link', { name: 'Testaa' })).toHaveAttribute('href', '#/testaa');
    const proxy = within(sheet).getByRole('link', { name: 'Proxy, jonossa 3 korttia' });
    expect(proxy).toHaveAttribute('href', '#/proxy');
    expect(proxy.querySelector('.nav-badge')).toHaveTextContent('3');

    await user.click(within(sheet).getByRole('button', { name: 'Sulje' }));
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the sheet when a row is chosen and when the page changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MainNav route={{ name: 'cards' }} proxyCount={0} />);
    const more = within(nav()).getByRole('button', { name: 'Lisää' });
    await user.click(more);
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Testaa' }));
    expect(more).toHaveAttribute('aria-expanded', 'false');

    await user.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    rerender(<MainNav route={{ name: 'decks' }} proxyCount={0} />);
    expect(within(nav()).getByRole('button', { name: 'Lisää' })).toHaveAttribute('aria-expanded', 'false');
  });
});
