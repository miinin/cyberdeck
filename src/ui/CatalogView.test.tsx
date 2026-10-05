import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

/** In-memory storage that behaves like working browser storage (no "Tietoja ei voi tallentaa" box). */
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
    color: null,
    cost: index,
    power: null,
    ram: null,
    rarity: null,
    key: `card-${index}`,
    ...overrides,
  };
}

function renderView(cards: Card[]) {
  const { container } = render(<CatalogView cards={cards} repositories={browserLikeRepositories()} />);
  return { container };
}

function statusLine(container: HTMLElement): HTMLElement {
  const element = container.querySelector<HTMLElement>('#card-status');
  if (element === null) throw new Error('#card-status is missing');
  return element;
}

/** Cell text without the decorative "·" separators of the narrow layout (aria-hidden, UX.md 6.4.4). */
function textWithoutSeparators(cell: HTMLElement | null | undefined): string | undefined {
  if (cell === undefined || cell === null) return undefined;
  const copy = cell.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('.separator').forEach((separator) => {
    expect(separator).toHaveAttribute('aria-hidden', 'true');
    separator.remove();
  });
  return copy.textContent?.replace(/\s+/g, ' ');
}

/** Label and text of each game value in a box (dt and dd pairs). */
function stats(box: HTMLElement): Record<string, string | null> {
  return Object.fromEntries(
    Array.from(box.querySelectorAll('.card-stat')).map((stat) => [
      stat.querySelector('dt')?.textContent,
      stat.querySelector('dd')?.textContent ?? null,
    ]),
  );
}

describe('CatalogView', () => {
  it('shows the power and RAM of a card next to its cost', () => {
    renderView([card(1, { cost: 2, power: 3000, ram: 0 })]);

    expect(stats(screen.getByRole('listitem'))).toEqual({ Cost: '2', Power: '3000', RAM: '0', Rarity: '–ei harvinaisuutta' });
  });

  it('shows every card with name, type and cost at once', () => {
    const { container } = renderView([
      card(1, { name: 'V', subname: 'Streetkid', type: 'Legend', cost: null }),
      card(2, { name: 'Swordwise Huscle', cost: 3 }),
      card(3, { cost: 0 }),
    ]);

    const table = screen.getByRole('list', { name: 'Kaikki kortit' });
    const rows = within(table).getAllByRole('listitem') as HTMLElement[];
    expect(rows).toHaveLength(3);
    const [first, second, third] = rows as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(first).getByRole('heading', { level: 3 })).toHaveTextContent('V, Streetkid');
    expect(first.querySelector('.card-type')).toHaveTextContent('Legend');
    expect(stats(first)).toEqual({ Cost: '–ei hintaa', Power: '–ei poweria', RAM: '–ei RAMia', Rarity: '–ei harvinaisuutta' });
    expect(within(second).getByRole('heading', { level: 3 })).toHaveTextContent('Swordwise Huscle');
    expect(stats(second).Cost).toBe('3');
    expect(stats(third).Cost).toBe('0');

    expect(statusLine(container)).toHaveTextContent(/^3 korttia$/);
    expect(screen.getByRole('status')).toHaveTextContent('3 korttia ladattu.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the singular for one card', () => {
    const { container } = renderView([card(1)]);

    expect(statusLine(container)).toHaveTextContent(/^1 kortti$/);
    expect(screen.getByRole('status')).toHaveTextContent('1 kortti ladattu.');
  });

  it('marks English card names and types with lang="en"', () => {
    renderView([card(1, { name: 'V', subname: 'Streetkid', type: 'Legend' })]);

    const table = screen.getByRole('list');
    expect(within(table).getByText('V')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Streetkid')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Legend')).toHaveAttribute('lang', 'en');
  });

  it('shows the type as a badge coloured by the card colour, colour name in English for screen readers (T-036)', () => {
    const { container } = renderView([
      card(1, { type: 'Unit', color: 'Red' }),
      card(2, { type: 'Gear', color: 'Yellow' }),
      card(3, { type: 'Legend', color: 'Green' }),
      card(4, { type: 'Program', color: 'Blue' }),
      card(5, { type: 'Unit', color: 'Purple' }),
      card(6, { type: 'Unit', color: null }),
    ]);

    const typeCells = within(screen.getByRole('list'))
      .getAllByRole('listitem')
      .map((row) => textWithoutSeparators(row.querySelector('.card-type')));
    expect(typeCells).toEqual([
      'Unit, Red',
      'Gear, Yellow',
      'Legend, Green',
      'Program, Blue',
      'Unit, Purple',
      'Unit, –ei väriä',
    ]);

    const swatches = Array.from(container.querySelectorAll('.card-grid .color-swatch'));
    expect(swatches.map((swatch) => swatch.className)).toEqual([
      'color-swatch color-swatch-red',
      'color-swatch color-swatch-yellow',
      'color-swatch color-swatch-green',
      'color-swatch color-swatch-blue',
      'color-swatch color-swatch-unknown',
    ]);
    swatches.forEach((swatch) => expect(swatch).toHaveAttribute('aria-hidden', 'true'));
    const table = screen.getByRole('list');
    expect(within(table).getByText('Purple')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Red')).toHaveAttribute('lang', 'en');
    expect(Array.from(container.querySelectorAll('.type-badge')).map((b) => b.className)).toEqual([
      'type-badge type-badge-red',
      'type-badge type-badge-yellow',
      'type-badge type-badge-green',
      'type-badge type-badge-blue',
      'type-badge',
      'type-badge',
    ]);
  });

  it('renders HTML in card data as literal text (SR-1)', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { container } = renderView([
      card(1, { name: payload, subname: '<b>x</b>', type: '<script>1</script>', color: '<i>y</i>' }),
    ]);

    const table = screen.getByRole('list');
    expect(within(table).getByText(payload)).toBeInTheDocument();
    expect(within(table).getByText('<b>x</b>')).toBeInTheDocument();
    expect(within(table).getByText('<script>1</script>')).toBeInTheDocument();
    expect(within(table).getByText('<i>y</i>')).toBeInTheDocument();
    expect(container.querySelector('i')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });
});

describe('CatalogView card order (T-060)', () => {
  it('sorts the grid by the chosen key and direction', async () => {
    const user = userEvent.setup();
    const named = (i: number, name: string, cost: number) => card(i, { name, displayName: name, key: name.toLowerCase(), cost });
    renderView([named(1, 'Bee', 5), named(2, 'Ant', 1), named(3, 'Cat', 3)]);
    const headings = () =>
      within(screen.getByRole('list', { name: 'Kaikki kortit' }))
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent);
    expect(headings()).toEqual(['Bee', 'Ant', 'Cat']);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Järjestys' }), 'Nimi (A–Ö)');
    expect(headings()).toEqual(['Ant', 'Bee', 'Cat']);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Järjestys' }), 'Cost');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Suunta' }), 'Laskeva');
    expect(headings()).toEqual(['Bee', 'Cat', 'Ant']);
  });
});
