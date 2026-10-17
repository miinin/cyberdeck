import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_WANTS } from '../domain/wants';
import { ShareTradeButton } from './ShareTradeButton';

describe('ShareTradeButton (UX-18, T-174)', () => {
  it('shows the link field only after "Jaa Have/Want" is pressed', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    render(<ShareTradeButton have={{ entries: [{ card: 'u0', count: 2 }] }} want={EMPTY_WANTS} />);
    expect(screen.queryByLabelText('Vaihtolinkki')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Jaa Have/Want' }));
    expect((screen.getByLabelText('Vaihtolinkki') as HTMLInputElement).value).toContain('#/vaihto/');
  });
});
