import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { CardApiError } from './api';
import type { CardCatalog } from './api';

const catalog: CardCatalog = {
  cards: [
    {
      id: 'id-1',
      slug: 'v-streetkid',
      name: 'V',
      subname: 'Streetkid',
      displayName: 'V — Streetkid',
      type: 'Legend',
      color: 'Red',
      cost: null,
    },
  ],
  reportedTotal: 1,
  skipped: 0,
};

const loadCatalog = async () => catalog;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('App', () => {
  it('has the landmarks and footer notices', async () => {
    render(<App loadCatalog={loadCatalog} />);

    expect(screen.getByRole('banner')).toHaveTextContent('Cyberdeck');
    expect(screen.getByRole('main')).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('Epävirallinen fanityökalu');
    expect(footer).toHaveTextContent('Korttitiedot: Netdeck.gg');
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('loads cards and shows them', async () => {
    render(<App loadCatalog={loadCatalog} />);

    expect(await screen.findByRole('rowheader')).toHaveTextContent('V, Streetkid');
    expect(screen.getByRole('status')).toHaveTextContent('1 kortti ladattu.');
  });

  it('recovers from an error when the user retries', async () => {
    const load = vi
      .fn<(signal: AbortSignal) => Promise<CardCatalog>>()
      .mockRejectedValueOnce(new CardApiError('http', 'HTTP 500', { status: 500 }))
      .mockResolvedValueOnce(catalog);
    render(<App loadCatalog={load} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Yritä uudelleen' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Korttien haku epäonnistui' })).not.toBeInTheDocument();
  });

  it('never shows images (card images are out of scope, R-1)', async () => {
    const { container } = render(<App loadCatalog={loadCatalog} />);

    await screen.findByRole('table');
    expect(container.querySelector('img')).toBeNull();
  });
});
