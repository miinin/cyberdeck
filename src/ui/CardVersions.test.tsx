import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import type { Printing } from '../domain/printing';
import { CardVersions } from './CardVersions';

function printing(setCode: string, setName: string, number: string, language = 'en', rarity: string | null = 'Rare'): Printing {
  return { key: `${setCode}:${number.replace('β', '')}`, setCode, setName, number, rarity, language, artist: null, imageKey: `v__${setCode}-${number}` };
}

const retail = printing('retail', 'Welcome to Night City — Retail', '005a');
const beta = printing('beta', 'Welcome to Night City — Beta', 'β005a');
const french = printing('retail-fr', 'Welcome to Night City — Retail — FR', '005a', 'fr');
const iconic = printing('retail', 'Welcome to Night City — Retail', '144', 'en', 'Iconic Legend');

const card: Card = {
  id: 'id-1', slug: 'v', name: 'V', subname: null, displayName: 'V', type: 'Legend', color: 'Red',
  cost: null, power: null, ram: null, rarity: null, key: 'v', printings: [retail, iconic, beta, french],
};

function setup(props: Partial<Parameters<typeof CardVersions>[0]> = {}) {
  const onChange = vi.fn();
  const onLimit = vi.fn();
  const counts: Record<string, number> = { [retail.key]: 2, [beta.key]: 0 };
  render(
    <CardVersions
      card={card}
      count={3}
      versionCount={(key) => counts[key] ?? 0}
      editable
      onChange={onChange}
      onLimit={onLimit}
      imageUrl={(key) => (key === retail.imageKey ? '/cards/variants/x.webp' : null)}
      {...props}
    />,
  );
  return { onChange, onLimit };
}

describe('CardVersions', () => {
  it('groups the printings by set with number, rarity and an FR mark', () => {
    setup();
    const groups = screen.getAllByRole('group');
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
      'Welcome to Night City — Retail',
      'Welcome to Night City — Beta',
      'Welcome to Night City — Retail — FR',
    ]);
    expect(within(groups[0]!).getAllByRole('listitem')).toHaveLength(2);
    expect(within(groups[0]!).getByText('Iconic Legend')).toBeInTheDocument();
    expect(within(groups[1]!).getByText('β005a')).toBeInTheDocument();
    expect(within(groups[2]!).getByText('FR')).toBeInTheDocument();
  });

  it('shows the unknown copies and a thumbnail only for printings with an image', () => {
    setup();
    expect(screen.getByText(/ei tiedossa: 1|unknown: 1/)).toBeInTheDocument();
    expect(document.querySelectorAll('img.version-thumb')).toHaveLength(1);
    expect(document.querySelector('img.version-thumb')?.getAttribute('src')).toBe('/cards/variants/x.webp');
  });

  it('changes one printing with its own buttons', async () => {
    const { onChange } = setup();
    const row = screen.getAllByRole('listitem')[0]!;
    await userEvent.click(within(row).getAllByRole('button')[1]!);
    expect(onChange).toHaveBeenCalledWith(retail.key, 3);
    await userEvent.click(within(row).getAllByRole('button')[0]!);
    expect(onChange).toHaveBeenCalledWith(retail.key, 1);
  });

  it('announces the limit instead of changing when the total is 999', async () => {
    const { onChange, onLimit } = setup({ count: 999 });
    const row = screen.getAllByRole('listitem')[0]!;
    await userEvent.click(within(row).getAllByRole('button')[1]!);
    expect(onLimit).toHaveBeenCalledWith(card);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('browsing shows only owned printings and no buttons', () => {
    setup({ editable: false });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('renders nothing for a card without printings', () => {
    const { container } = render(
      <CardVersions card={{ ...card, printings: [] }} count={0} versionCount={() => 0} editable onChange={vi.fn()} onLimit={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
