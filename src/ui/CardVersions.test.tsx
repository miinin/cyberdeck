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

function at<T>(list: readonly T[], index: number): T {
  const item = list[index];
  if (item === undefined) throw new Error(`No item ${index}`);
  return item;
}

function setup(props: Partial<Parameters<typeof CardVersions>[0]> = {}) {
  const onChange = vi.fn();
  const onArtChange = vi.fn();
  const onLimit = vi.fn();
  const counts: Record<string, number> = { [retail.key]: 2, [beta.key]: 0 };
  render(
    <CardVersions
      card={card}
      count={3}
      versionCount={(key) => counts[key] ?? 0}
      editable
      onChange={onChange}
      onArtChange={onArtChange}
      onLimit={onLimit}
      baseImage="/base.webp"
      imageUrl={(_key, rarity) => (rarity === 'Iconic Legend' ? '/cards/variants/legend.webp' : null)}
      {...props}
    />,
  );
  return { onChange, onArtChange, onLimit };
}

describe('CardVersions gallery', () => {
  it('has one tile per art with the sets in short and no repetition', () => {
    setup();
    const tiles = screen.getAllByRole('listitem').filter((li) => li.classList.contains('art-tile'));
    expect(tiles).toHaveLength(2);
    expect(within(at(tiles, 0)).getByText('Perus')).toBeInTheDocument();
    expect(within(at(tiles, 0)).getByText('Welcome to Night City · Retail, Beta, FR')).toBeInTheDocument();
    expect(within(at(tiles, 1)).getByText('Iconic Rare')).toBeInTheDocument();
    expect(document.querySelectorAll('img.art-thumb')).toHaveLength(2);
  });

  it('counts the copies without a version in the base art', () => {
    setup();
    const tiles = screen.getAllByRole('listitem').filter((li) => li.classList.contains('art-tile'));
    expect(within(at(tiles, 0)).getAllByText('3').length).toBeGreaterThan(0);
  });

  it('selects an art with aria-pressed and shows its picture', async () => {
    const onShowArt = vi.fn();
    setup({ onShowArt });
    const base = screen.getByRole('button', { name: /Näytä kuvitus: Perus|Show art: Base/ });
    expect(base).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Näytä kuvitus: Iconic Rare|Show art: Iconic Rare/ }));
    expect(onShowArt).toHaveBeenCalledWith('/cards/variants/legend.webp');
    await userEvent.click(base);
    expect(onShowArt).toHaveBeenCalledWith(null);
  });

  it('marks the shown special art as pressed', () => {
    setup({ onShowArt: vi.fn(), shownArt: '/cards/variants/legend.webp' });
    expect(screen.getByRole('button', { name: /Näytä kuvitus: Iconic Rare|Show art: Iconic Rare/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Näytä kuvitus: Perus|Show art: Base/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('changes an art with its counter', async () => {
    const { onArtChange } = setup();
    const tile = at(Array.from(document.querySelectorAll<HTMLElement>('li.art-tile')), 1);
    await userEvent.click(at(within(tile).getAllByRole('button').filter((b) => b.classList.contains('step-plus')), 0));
    expect(onArtChange).toHaveBeenCalledWith(expect.objectContaining({ rarity: 'Iconic Legend' }), 1);
  });

  it('changes one printing in the breakdown', async () => {
    const { onChange } = setup();
    const details = at(Array.from(document.querySelectorAll<HTMLElement>('details.art-breakdown')), 0);
    const plus = within(details).getAllByRole('button', { hidden: true }).filter((b) => b.classList.contains('step-plus'));
    await userEvent.click(at(plus, 0), { pointerEventsCheck: 0 });
    expect(onChange).toHaveBeenCalledWith(expect.any(String), expect.any(Number));
  });

  it('announces the limit instead of changing when the total is 999', async () => {
    const { onArtChange, onLimit } = setup({ count: 999 });
    const tile = at(Array.from(document.querySelectorAll<HTMLElement>('li.art-tile')), 1);
    await userEvent.click(at(within(tile).getAllByRole('button').filter((b) => b.classList.contains('step-plus')), 0));
    expect(onLimit).toHaveBeenCalledWith(card);
    expect(onArtChange).not.toHaveBeenCalled();
  });

  it('browsing shows only owned arts and no buttons', () => {
    setup({ editable: false });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(document.querySelectorAll('li.art-tile')).toHaveLength(1);
  });

  it('renders nothing for a card without printings', () => {
    const { container } = render(
      <CardVersions card={{ ...card, printings: [] }} count={0} versionCount={() => 0} editable onChange={vi.fn()} onLimit={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
