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
    power: null,
    ram: null, rarity: null,
    key: 'v-streetkid',
  },
];

describe('App', () => {
  it('has the landmarks and footer notices', () => {
    render(<App cards={cards} repositories={createMemoryRepositories()} />);

    expect(within(screen.getByRole('banner')).getByRole('img', { name: 'Cyberdeck TCG' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(
      'Cyberdeck on epävirallinen Cyberpunk TCG -fanityökalu. WeirdCo, Netdeck.gg ja CD PROJEKT RED eivät ole hyväksyneet tai tukeneet sitä.',
    );
    expect(footer).toHaveTextContent('Korttitiedot: Netdeck.gg');
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('shows the given cards on the first render', () => {
    render(<App cards={cards} repositories={createMemoryRepositories()} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('V, Streetkid');
    expect(screen.getByRole('status')).toHaveTextContent('1 kortti ladattu.');
  });

  it('shows the bundled cards on the first render without any request (D-013)', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { container } = render(<App repositories={createMemoryRepositories()} />);

    // Synchronous queries: no loading state, the list is there at once.
    expect(container.querySelector('#card-status')).toHaveTextContent(cardCount(CARDS.length));
    const rows = within(screen.getByRole('list', { name: 'Kaikki kortit' })).getAllByRole('heading', { level: 3 });
    expect(rows).toHaveLength(CARDS.length);
    expect(screen.queryByText('Haetaan kortteja…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yritä uudelleen' })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  }, 20_000); // renders every card; slow when the whole suite runs in parallel

  // D-012 brought card images in scope (T-027); they must come from the app's own origin (SR-1, img-src 'self').
  it('shows card images only from the bundled assets, never from an external URL', () => {
    const { container } = render(<App cards={cards} repositories={createMemoryRepositories()} />);

    // The header logo is the second bundled image next to the card image.
    const images = [...container.querySelectorAll('img')];
    expect(images).toHaveLength(2);
    for (const image of images) expect(image.getAttribute('src')).not.toMatch(/^(https?:)?\/\//);
  });
});
