import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EMPTY_COLLECTION } from '../domain/collection';
import { EMPTY_WANTS } from '../domain/wants';
import userEvent from '@testing-library/user-event';
import { ExportButtons } from './ExportButtons';
import { QrButton } from './QrDialog';
import { ShareTradeButton } from './ShareTradeButton';

// T-165: QR code for share links.
describe('QrButton', () => {
  it('opens a dialog with the QR code and the link, and closes with focus back on the button', async () => {
    const user = userEvent.setup();
    render(<QrButton link="https://example.test/#/jaa/abc" title="QR-koodi: Oma" />);
    const button = screen.getByRole('button', { name: 'QR-koodi' });
    await user.click(button);
    expect(await screen.findByRole('img', { name: /QR-koodi/ })).toBeInTheDocument();
    expect(screen.getByText('https://example.test/#/jaa/abc')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sulje' }));
    await waitFor(() => expect(button).toHaveFocus());
    expect(screen.queryByRole('img', { name: /QR-koodi/ })).not.toBeInTheDocument();
  });

  it('shows a text instead of a code when the link is too long', async () => {
    const user = userEvent.setup();
    render(<QrButton link={`https://example.test/#/jaa/${'a'.repeat(3000)}`} title="QR-koodi: Oma" />);
    await user.click(screen.getByRole('button', { name: 'QR-koodi' }));
    expect(await screen.findByText(/liian pitkä QR-koodiksi/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /QR-koodi/ })).not.toBeInTheDocument();
  });
});

describe('QR button placement', () => {
  it('is in the deck share menu', async () => {
    const user = userEvent.setup();
    render(<ExportButtons deck={{ name: 'Oma', sections: [] }} cardsByKey={new Map()} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('button', { name: 'QR-koodi: Oma' }));
    expect(await screen.findByRole('img', { name: /QR-koodi/ })).toBeInTheDocument();
  });

  it('is next to the trade link', () => {
    render(<ShareTradeButton have={EMPTY_COLLECTION} want={EMPTY_WANTS} />);
    expect(screen.getByRole('button', { name: /QR-koodi/ })).toBeInTheDocument();
  });
});

// T-168: printable tournament list.
describe('Tournament list', () => {
  it('opens from the share menu and shows the groups and totals', async () => {
    const user = userEvent.setup();
    const cardsByKey = new Map([
      ['l1', { key: 'l1', name: 'V', subname: 'Streetkid', type: 'Legend' }],
      ['u1', { key: 'u1', name: 'Abe', subname: null, type: 'Unit' }],
    ]) as unknown as ComponentProps<typeof ExportButtons>['cardsByKey'];
    const deck = { name: 'Oma', sections: [{ name: 'Main', cards: [{ card: 'l1', count: 1 }, { card: 'u1', count: 3 }] }] };
    render(<ExportButtons deck={deck} cardsByKey={cardsByKey} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('button', { name: 'Turnauslista: Oma' }));
    expect(await screen.findByText('Legendit (1)')).toBeInTheDocument();
    expect(screen.getByText('Unit (3)')).toBeInTheDocument();
    expect(screen.getByText('V - Streetkid')).toBeInTheDocument();
    expect(screen.getByText('Yhteensä: pääpakka 3, Legendit 1, sideboard 0')).toBeInTheDocument();
    expect(screen.getByText(/Pakka ei ole turnauskelpoinen/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tulosta' })).toBeInTheDocument();
  });
});
