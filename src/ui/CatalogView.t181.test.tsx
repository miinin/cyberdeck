import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

/** T-181 package 2: the markup of the new card grid, tool row and filter groups. */
function browserLikeRepositories() {
  return { ...createMemoryRepositories(), persistent: true };
}

function card(index: number, overrides: Partial<Card> = {}): Card {
  return {
    id: `id-${index}`,
    slug: `card-${index}`,
    name: `Card ${index}`,
    subname: null,
    displayName: `Card ${index}`,
    type: 'Unit',
    color: 'Red',
    cost: index,
    power: 3,
    ram: 1,
    rarity: null,
    key: `card-${index}`,
    ...overrides,
  };
}

describe('CatalogView grid box (T-181)', () => {
  it('has a data strip with the whole name in the title and the subname kept for screen readers', () => {
    render(<CatalogView cards={[card(1, { name: 'V', subname: 'Streetkid', displayName: 'V, Streetkid', type: 'Legend' })]} repositories={browserLikeRepositories()} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('V, Streetkid');
    expect(heading).toHaveAttribute('title', 'V, Streetkid');
    expect(heading.closest('.card-strip')).not.toBeNull();
    expect(heading.querySelector('.card-subname')).toHaveTextContent('Streetkid');
  });

  it('shows the type, Power and RAM on one line, each value with its spoken name', () => {
    render(<CatalogView cards={[card(1, { power: 6, ram: 2 })]} repositories={browserLikeRepositories()} />);
    const meta = document.querySelector('.card-meta') as HTMLElement;
    expect(meta.querySelector('.card-type')).toHaveTextContent('Unit');
    expect(meta.querySelector('.stat-power dt')).toHaveTextContent('Power');
    expect(meta.querySelector('.stat-power dd')).toHaveTextContent('6');
    expect(meta.querySelector('.stat-ram dd')).toHaveTextContent('2');
  });

  it('only a Legend gets the type chip', () => {
    render(<CatalogView cards={[card(1, { type: 'Legend' }), card(2)]} repositories={browserLikeRepositories()} />);
    const types = [...document.querySelectorAll('.card-type')];
    expect(types.map((type) => type.classList.contains('card-type--legend'))).toEqual([true, false]);
  });

  it('puts the collection count in the strip while browsing and the − and + in a row of their own while marking', async () => {
    const user = userEvent.setup();
    const repositories = browserLikeRepositories();
    await repositories.preferences.saveEditMode(false);
    render(<CatalogView cards={[card(1)]} repositories={repositories} />);
    await screen.findByRole('button', { name: 'Merkitse omat korttisi' });
    expect(document.querySelector('.card-strip .card-collection')).not.toBeNull();
    expect(document.querySelector('.card-foot')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Merkitse omat korttisi' }));
    expect(document.querySelector('.card-strip .card-collection')).toBeNull();
    expect(within(document.querySelector('.card-foot') as HTMLElement).getByRole('button', { name: /Lisää yksi kappale/ })).toBeInTheDocument();
  });
});

describe('CatalogView filter groups (T-181)', () => {
  const cards = [card(1, { cost: 1 }), card(2, { cost: 3 })];

  it('has Rarity, Cost, Power and RAM as closed disclosures and Type and Color in the open', () => {
    render(<CatalogView cards={cards} repositories={browserLikeRepositories()} />);
    const groups = [...document.querySelectorAll('details.filter-group')];
    expect(groups.map((group) => group.querySelector('summary')?.textContent)).toEqual(['Harvinaisuus', 'Cost', 'Power', 'RAM']);
    expect(groups.every((group) => !group.hasAttribute('open'))).toBe(true);
    expect(screen.getByRole('group', { name: 'Tyyppi' }).closest('details')).toBeNull();
    expect(screen.getByRole('group', { name: 'Väri' }).closest('details')).toBeNull();
  });

  it('opens a group that has a choice and counts the choices in its title', async () => {
    const user = userEvent.setup();
    render(<CatalogView cards={cards} repositories={browserLikeRepositories()} />);
    const cost = (document.querySelectorAll('details.filter-group')[1]) as HTMLDetailsElement;
    cost.open = true;
    await user.click(within(cost).getByRole('checkbox', { name: '1' }));
    await user.click(within(cost).getByRole('checkbox', { name: '3' }));
    expect(cost).toHaveAttribute('open');
    expect(cost.querySelector('summary')).toHaveTextContent('Cost · 2');
  });

  it('has a search icon in the field and the order as a select with a direction button in the tool row', () => {
    render(<CatalogView cards={cards} repositories={browserLikeRepositories()} />);
    expect(document.querySelector('.search-field .search-icon')).toHaveAttribute('aria-hidden', 'true');
    const toolbar = document.querySelector('.list-toolbar') as HTMLElement;
    expect(within(toolbar).getByRole('combobox', { name: 'Järjestys' })).toBeInTheDocument();
    expect(within(toolbar).getByRole('button', { name: 'Suunta: Nouseva' })).toBeInTheDocument();
  });
});
