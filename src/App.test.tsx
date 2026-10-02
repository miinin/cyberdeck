import { render, screen, within } from '@testing-library/react';
import { App } from './App';
import { CARDS } from './data/cards';
import type { Card } from './domain/card';
import { createMemoryRepositories } from './storage';
import { cardCount } from './ui/texts';

const cards: Card[] = [
  {
    id: 'id-1',
    slug: 'v-streetkid',
    name: 'V',
    subname: 'Streetkid',
    displayName: 'V — Streetkid',
    type: 'Legend',
    color: 'Red',
    cost: null,
    key: 'v-streetkid',
  },
];

describe('App', () => {
  it('has the landmarks and footer notices', () => {
    render(<App cards={cards} repositories={createMemoryRepositories()} />);

    expect(screen.getByRole('banner')).toHaveTextContent('Cyberdeck');
    expect(screen.getByRole('main')).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(
      'Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.',
    );
    expect(footer).toHaveTextContent('Korttitiedot: Netdeck.gg');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows the given cards on the first render', () => {
    render(<App cards={cards} repositories={createMemoryRepositories()} />);

    expect(screen.getByRole('rowheader')).toHaveTextContent('V, Streetkid');
    expect(screen.getByRole('status')).toHaveTextContent('1 kortti ladattu.');
  });

  it('shows the bundled cards on the first render without any request (D-013)', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { container } = render(<App repositories={createMemoryRepositories()} />);

    // Synchronous queries: no loading state, the list is there at once.
    expect(container.querySelector('#card-status')).toHaveTextContent(cardCount(CARDS.length));
    const rows = within(screen.getByRole('table', { name: 'Kaikki kortit' })).getAllByRole('rowheader');
    expect(rows).toHaveLength(CARDS.length);
    expect(screen.queryByText('Haetaan kortteja…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yritä uudelleen' })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never shows images (card images are out of scope, R-1)', () => {
    const { container } = render(<App cards={cards} repositories={createMemoryRepositories()} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
