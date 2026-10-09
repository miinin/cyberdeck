import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SegmentedChoice } from './SegmentedChoice';

const OPTIONS = [
  ['grid', 'Kuvat'],
  ['table', 'Lista'],
] as const;

function Harness() {
  const [value, setValue] = useState<'grid' | 'table'>('grid');
  return <SegmentedChoice legend="Näkymä" name="view" value={value} options={OPTIONS} onChange={setValue} />;
}

describe('SegmentedChoice (T-118, UX-118-06)', () => {
  it('is one radio group drawn as a segmented bar, with the legend as its name', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = screen.getByRole('group', { name: 'Näkymä' });
    expect(group.querySelector('.segmented')).not.toBeNull();
    expect(within(group).getAllByRole('radio')).toHaveLength(2);
    expect(within(group).getByRole('radio', { name: 'Kuvat' })).toBeChecked();
    await user.click(within(group).getByRole('radio', { name: 'Lista' }));
    expect(within(group).getByRole('radio', { name: 'Lista' })).toBeChecked();
    expect(within(group).getByRole('radio', { name: 'Kuvat' })).not.toBeChecked();
  });

  it('wraps each radio in a .segmented-option label', () => {
    render(<Harness />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.closest('label')).toHaveClass('segmented-option');
    }
  });
});
