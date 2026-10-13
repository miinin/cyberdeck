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
