import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

function card(slug: string, name: string, type: string, color: string, rarity: string): Card {
  return { id: `id-${slug}`, key: `key-${slug}`, slug, name, subname: null, displayName: name, type, color, cost: 1, power: null, ram: null, rarity };
}

const cards: Card[] = [
  card('a', 'Alpha', 'Unit', 'Red', 'Rare'),
  card('b', 'Beta', 'Gear', 'Blue', 'Common'),
  card('c', 'Gamma', 'Unit', 'Blue', 'Rare'),
];

/** Pretends the window is narrow (< 64rem) or wide; jsdom has no matchMedia of its own. */
function stubWidth(wide: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: wide && query.includes('min-width: 64rem'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderView() {
  return render(<CatalogView cards={cards} repositories={{ ...createMemoryRepositories(), persistent: true }} />);
}

const searchBox = () => screen.getByRole('searchbox', { name: 'Hae nimellä' });

describe('CatalogView layout (T-050a)', () => {
  it('has the headings Kortit, Suodattimet and Tulokset in this order', () => {
    stubWidth(true);
    renderView();
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent).slice(0, 3)).toEqual([
      'Kortit',
      'Suodattimet',
      'Tulokset',
    ]);
    expect(screen.getByRole('region', { name: 'Suodattimet' })).toContainElement(searchBox());
    expect(screen.getByRole('region', { name: 'Tulokset' })).toContainElement(screen.getByRole('list'));
  });

  it('wide: no toggle button, the filters are always shown', () => {
    stubWidth(true);
    renderView();
    expect(screen.queryByRole('button', { name: /^Suodattimet/ })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tyyppi' })).toBeVisible();
  });

  it('narrow: the search stays, the other filters open with "Suodattimet" and the count follows the choices', async () => {
    stubWidth(false);
    const user = userEvent.setup();
    renderView();

    expect(searchBox()).toBeVisible();
    const toggle = screen.getByRole('button', { name: 'Suodattimet' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'filter-panel');
    expect(screen.queryByRole('group', { name: 'Tyyppi' })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveFocus();
    await user.click(screen.getByRole('checkbox', { name: 'Unit' }));
    await user.click(screen.getByRole('checkbox', { name: 'Rare' }));
    expect(toggle).toHaveAccessibleName('Suodattimet (2)');
    // "Kaikki" in "Kokoelma" is not counted; "Omistetut" is.
    await user.click(screen.getByRole('radio', { name: 'Omistetut' }));
    expect(toggle).toHaveAccessibleName('Suodattimet (3)');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Tyyppi' })).not.toBeInTheDocument();
  });

  it('shows a chip per selection; removing one moves focus to the next chip, the last one to the search field', async () => {
    stubWidth(true);
    const user = userEvent.setup();
    renderView();
    expect(screen.queryByRole('button', { name: /^Poista suodatin/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Unit' }));
    await user.click(screen.getByRole('checkbox', { name: 'Rare' }));
    const results = screen.getByRole('region', { name: 'Tulokset' });
    const unitChip = within(results).getByRole('button', { name: 'Poista suodatin: Unit' });
    expect(unitChip).toHaveTextContent('Unit×');
    expect(within(results).getByRole('button', { name: 'Tyhjennä haku ja suodattimet' })).toBeInTheDocument();

    await user.click(unitChip);
    expect(screen.getByRole('checkbox', { name: 'Unit' })).not.toBeChecked();
    expect(within(results).getByRole('button', { name: 'Poista suodatin: Rare' })).toHaveFocus();

    await user.click(within(results).getByRole('button', { name: 'Poista suodatin: Rare' }));
    expect(screen.getByRole('checkbox', { name: 'Rare' })).not.toBeChecked();
    expect(searchBox()).toHaveFocus();
    expect(within(results).queryByRole('button', { name: 'Tyhjennä haku ja suodattimet' })).not.toBeInTheDocument();
  });

  it('removing the last chip in the row moves focus to the previous chip', async () => {
    stubWidth(true);
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('checkbox', { name: 'Unit' }));
    await user.click(screen.getByRole('checkbox', { name: 'Rare' }));

    await user.click(screen.getByRole('button', { name: 'Poista suodatin: Rare' }));
    expect(screen.getByRole('button', { name: 'Poista suodatin: Unit' })).toHaveFocus();
  });

  it('offers the image size only in the grid view, Keski by default', async () => {
    stubWidth(true);
    const user = userEvent.setup();
    renderView();
    const sizes = screen.getByRole('group', { name: 'Kuvakoko' });
    expect(within(sizes).getByRole('radio', { name: 'Keski' })).toBeChecked();
    await user.click(within(sizes).getByRole('radio', { name: 'Iso' }));
    expect(screen.getByRole('region', { name: 'Tulokset' })).toHaveAttribute('data-image-size', 'large');

    await user.click(screen.getByRole('radio', { name: 'Taulukko' }));
    expect(screen.queryByRole('group', { name: 'Kuvakoko' })).not.toBeInTheDocument();
  });
});
