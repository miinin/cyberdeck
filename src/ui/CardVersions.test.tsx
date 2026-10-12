import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import type { Printing } from '../domain/printing';
import { CARDS } from '../data/cards';
import { variantImageUrl } from '../data/variantImages';
import { CardVersions, setAbbreviation, setChips } from './CardVersions';

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
    const sets = at(Array.from(at(tiles, 0).querySelectorAll('.art-sets .art-set')), 0);
    expect(sets.querySelector('.set-chip--family')).toHaveAttribute('title', 'Welcome to Night City');
    expect(within(sets as HTMLElement).getByText('WtNC')).toBeInTheDocument();
    expect(Array.from(sets.querySelectorAll('.set-chip:not(.set-chip--family)')).map((chip) => chip.textContent)).toEqual(['Retail', 'Beta', 'FR']);
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
    const base = screen.getByRole('button', { name: /Näytä versio: Perus|Show version: Base/ });
    expect(base).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Näytä versio: Iconic Rare|Show version: Iconic Rare/ }));
    expect(onShowArt).toHaveBeenCalledWith('/cards/variants/legend.webp');
    await userEvent.click(base);
    expect(onShowArt).toHaveBeenCalledWith(null);
  });

  it('marks the shown special art as pressed', () => {
    setup({ onShowArt: vi.fn(), shownArt: '/cards/variants/legend.webp' });
    expect(screen.getByRole('button', { name: /Näytä versio: Iconic Rare|Show version: Iconic Rare/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Näytä versio: Perus|Show version: Base/ })).toHaveAttribute('aria-pressed', 'false');
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

  it('browsing shows every art, the owned count as text, a dash for none, and no buttons', () => {
    setup({ editable: false });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    const tiles = Array.from(document.querySelectorAll<HTMLElement>('li.art-tile'));
    expect(tiles).toHaveLength(2);
    expect(at(tiles, 0).querySelector('.art-count')?.textContent).toContain('3');
    expect(at(tiles, 1).querySelector('.art-count')?.textContent).toContain('–');
  });

  it('renders nothing for a card without printings', () => {
    const { container } = render(
      <CardVersions card={{ ...card, printings: [] }} count={0} versionCount={() => 0} editable onChange={vi.fn()} onLimit={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('set chips', () => {
  it('abbreviates long set names and keeps short ones', () => {
    expect(setAbbreviation('Welcome to Night City')).toBe('WtNC');
    expect(setAbbreviation('Embracing Power Starter Deck')).toBe('EPSD');
    expect(setAbbreviation('Night City Showdown S1')).toBe('NCSS1');
    expect(setAbbreviation('Set 1 Promos')).toBe('Set 1 Promos');
  });

  it('gives promo and tournament printings their number as a tag', () => {
    const promo = printing('promo', 'Set 1 Promos', '005', 'en', 'Nova Rare');
    expect(setChips([promo, printing('promo', 'Set 1 Promos', '007', 'en', 'Nova Rare'), promo])).toEqual([
      { family: 'Set 1 Promos', short: 'Set 1 Promos', tags: ['#005', '#007'] },
    ]);
  });
});

describe('CardVersions with the bundled cards', () => {
  const byKey = (key: string): Card => {
    const found = CARDS.find((c) => c.key === key);
    if (found === undefined) throw new Error(key);
    return found;
  };
  const renderReal = (key: string, extra: Partial<Parameters<typeof CardVersions>[0]> = {}) => {
    const real = byKey(key);
    const onShowArt = vi.fn();
    render(
      <CardVersions card={real} count={0} versionCount={() => 0} editable={false} onChange={vi.fn()} onLimit={vi.fn()} baseImage="/base.webp" onShowArt={onShowArt} {...extra} />,
    );
    return { onShowArt, tiles: Array.from(document.querySelectorAll<HTMLElement>('li.art-tile')) };
  };

  it('shows Base and Iconic Rare for Johnny Rocking Renegade with nothing owned, and selects the picture', async () => {
    const { tiles, onShowArt } = renderReal('johnny-silverhand-rocking-renegade');
    expect(tiles).toHaveLength(2);
    expect(within(at(tiles, 0)).getByText('Perus')).toBeInTheDocument();
    expect(within(at(tiles, 1)).getByText('Iconic Rare')).toBeInTheDocument();
    const iconic = variantImageUrl('johnny-silverhand-rocking-renegade', 'Iconic Secret');
    expect(iconic).not.toBeNull();
    expect(at(tiles, 0).querySelector('img')).toHaveAttribute('src', '/base.webp');
    expect(at(tiles, 1).querySelector('img')).toHaveAttribute('src', iconic);
    const pick = within(at(tiles, 1)).getByRole('button', { name: /Iconic Rare/ });
    expect(pick).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(pick);
    expect(onShowArt).toHaveBeenCalledWith(iconic);
  });

  it.each([
    // Base, Iconic Rare (Retail), Iconic Rare (Beta, its own art since T-148), Nova Rare.
    ['adam-smasher-metal-over-meat', ['Perus', 'Iconic Rare', 'Iconic Rare (Beta)', 'Nova Rare']],
    // T-148: the 005b art of its own, and the Beta Iconic Rare apart from the Retail one.
    ['v-streetkid', ['Perus', 'Toinen kuvitus', 'Iconic Rare', 'Iconic Rare (Beta)', 'Nova Rare']],
  ])('shows the versions of %s', (key, names) => {
    const { tiles } = renderReal(key);
    expect(tiles.map((tile) => tile.querySelector('.art-name')?.textContent?.trim())).toEqual(names);
  });

  it('shows Rebecca Having a Moment as one Nova Rare version, not an empty Base plus Nova', () => {
    const { tiles } = renderReal('rebecca-having-a-moment');
    expect(tiles).toHaveLength(1);
    expect(within(at(tiles, 0)).getByText('Nova Rare')).toBeInTheDocument();
    expect(within(at(tiles, 0)).queryByText('Perus')).toBeNull();
  });
});

describe('CardVersions: Retail and Beta rows on the base tile (D-022)', () => {
  const wRetail = printing('welcometonightcityretail', 'Welcome to Night City — Retail', '005a');
  const wBeta = printing('welcometonightcitybeta', 'Welcome to Night City — Beta', 'β005a');
  const wBetaB = printing('welcometonightcitybeta', 'Welcome to Night City — Beta', 'β005b');
  const wFrench = printing('welcometonightcityretail-fr', 'Welcome to Night City — Retail — FR', '005a', 'fr');
  const wCard: Card = { ...card, printings: [wRetail, wBeta, wBetaB, wFrench] };
  const tile = () => at(screen.getAllByRole('listitem').filter((li) => li.classList.contains('art-tile')), 0);

  function setupW(counts: Record<string, number>, total: number, props: Partial<Parameters<typeof CardVersions>[0]> = {}) {
    const onChange = vi.fn();
    render(
      <CardVersions
        card={wCard}
        count={total}
        versionCount={(key) => counts[key] ?? 0}
        editable
        onChange={onChange}
        onLimit={vi.fn()}
        baseImage="/base.webp"
        imageUrl={() => null}
        {...props}
      />,
    );
    return { onChange };
  }

  it('shows a Retail and a Beta counter on the tile, the other printings in the breakdown', async () => {
    const user = userEvent.setup();
    const { onChange } = setupW({ [wRetail.key]: 1, [wBeta.key]: 2 }, 3);
    const rows = Array.from(tile().querySelectorAll('.edition-row'));
    expect(rows.map((r) => r.querySelector('.edition-label')?.textContent)).toEqual(['Retail', 'Beta']);
    await user.click(within(at(rows, 1) as HTMLElement).getByRole('button', { name: /Lisää yksi kappale/ }));
    expect(onChange).toHaveBeenCalledWith(wBeta.key, 3);
    await user.click(within(at(rows, 0) as HTMLElement).getByRole('button', { name: /Vähennä yksi kappale/ }));
    expect(onChange).toHaveBeenCalledWith(wRetail.key, 0);

    const breakdown = tile().querySelector('.art-breakdown') as HTMLElement;
    expect(breakdown.querySelectorAll('.version-row')).toHaveLength(2);
    expect(breakdown.textContent).toContain('β005b');
    expect(breakdown.textContent).toContain('FR');
  });

  it('browsing shows the amounts without buttons, and says how many copies have no edition', () => {
    setupW({ [wRetail.key]: 1, [wBeta.key]: 1 }, 4, { editable: false });
    expect(tile().querySelectorAll('.edition-row button')).toHaveLength(0);
    expect(tile().querySelector('.edition-unknown')).toHaveTextContent('Painos tuntematon: 2');
  });

  it('keeps the old single counter for a card without a Welcome to Night City printing', () => {
    render(
      <CardVersions
        card={card}
        count={1}
        versionCount={() => 0}
        editable
        onChange={vi.fn()}
        onLimit={vi.fn()}
        baseImage="/base.webp"
        imageUrl={() => null}
      />,
    );
    expect(document.querySelector('.edition-row')).toBeNull();
  });
});

// T-091: the actual sets first; other products only when the version is in no set, else behind "+N".
describe('CardVersions set chips', () => {
  const promo = printing('promo', 'Set 1 Promos', '005', 'en', 'Rare');
  const starter = printing('starter', 'Starter Deck Arasaka', '005', 'en', 'Rare');
  const sets = () => {
    const element = document.querySelector<HTMLElement>('li.art-tile > .art-sets');
    if (element === null) throw new Error('no set chips');
    return within(element);
  };

  it('shows the set and hides the other products behind "+N muuta tuotetta"', () => {
    render(<CardVersions card={{ ...card, printings: [retail, beta, promo, starter] }} count={0} versionCount={() => 0} editable={false} onChange={vi.fn()} onLimit={vi.fn()} />);
    const summary = screen.getByText('+2 muuta tuotetta');
    expect(summary.tagName).toBe('SUMMARY');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    expect(sets().getByText('Welcome to Night City')).toBeInTheDocument();
    expect(sets().getByText('Set 1 Promos').closest('details')).not.toBeNull();
  });

  it('shows the products directly when the version is in no set', () => {
    render(<CardVersions card={{ ...card, printings: [promo] }} count={0} versionCount={() => 0} editable={false} onChange={vi.fn()} onLimit={vi.fn()} />);
    expect(sets().getByText('Set 1 Promos').closest('details')).toBeNull();
    expect(sets().queryByText(/muu/)).toBeNull();
  });
});
