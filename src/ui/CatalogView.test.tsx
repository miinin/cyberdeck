import { render, screen, within } from '@testing-library/react';
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
function textWithoutSeparators(cell: HTMLElement | undefined): string | undefined {
  if (cell === undefined) return undefined;
  const copy = cell.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('.separator').forEach((separator) => {
    expect(separator).toHaveAttribute('aria-hidden', 'true');
    separator.remove();
  });
  return copy.textContent?.replace(/\s+/g, ' ');
}

describe('CatalogView', () => {
  it('shows every card with name, type and cost at once', () => {
    const { container } = renderView([
      card(1, { name: 'V', subname: 'Streetkid', type: 'Legend', cost: null }),
      card(2, { name: 'Swordwise Huscle', cost: 3 }),
      card(3, { cost: 0 }),
    ]);

    const table = screen.getByRole('table', { name: 'Kaikki kortit' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(headers).toEqual(['Kuva', 'Nimi', 'Tyyppi ja väri', 'Hinta', 'Omistan']);

    const rows = within(table).getAllByRole('row').slice(1) as HTMLElement[];
    expect(rows).toHaveLength(3);
    const [first, second, third] = rows as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(first).getByRole('rowheader')).toHaveTextContent('V, Streetkid');
    expect(within(first).getAllByRole('cell')[1]).toHaveTextContent('Legend');
    expect(within(first).getAllByRole('cell')[2]).toHaveTextContent('ei hintaa');
    expect(within(second).getByRole('rowheader')).toHaveTextContent('Swordwise Huscle');
    expect(within(second).getAllByRole('cell')[2]).toHaveTextContent(/^3$/);
    expect(within(third).getAllByRole('cell')[2]).toHaveTextContent(/^0$/);

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

    const table = screen.getByRole('table');
    expect(within(table).getByText('V')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Streetkid')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Legend')).toHaveAttribute('lang', 'en');
  });

  it('shows the color in Finnish under the type, with a decorative swatch (UX.md 5.5)', () => {
    const { container } = renderView([
      card(1, { type: 'Unit', color: 'Red' }),
      card(2, { type: 'Gear', color: 'Yellow' }),
      card(3, { type: 'Legend', color: 'Green' }),
      card(4, { type: 'Program', color: 'Blue' }),
      card(5, { type: 'Unit', color: 'Purple' }),
      card(6, { type: 'Unit', color: null }),
    ]);

    const typeCells = within(screen.getByRole('table'))
      .getAllByRole('row')
      .slice(1)
      .map((row) => textWithoutSeparators(within(row).getAllByRole('cell')[1]));
    expect(typeCells).toEqual([
      'Unit, Punainen',
      'Gear, Keltainen',
      'Legend, Vihreä',
      'Program, Sininen',
      'Unit, Purple',
      'Unit, –ei väriä',
    ]);

    const swatches = Array.from(container.querySelectorAll('.card-table .color-swatch'));
    expect(swatches.map((swatch) => swatch.className)).toEqual([
      'color-swatch color-swatch-red',
      'color-swatch color-swatch-yellow',
      'color-swatch color-swatch-green',
      'color-swatch color-swatch-blue',
      'color-swatch color-swatch-unknown',
    ]);
    swatches.forEach((swatch) => expect(swatch).toHaveAttribute('aria-hidden', 'true'));
    const table = screen.getByRole('table');
    expect(within(table).getByText('Purple')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Punainen')).not.toHaveAttribute('lang');
  });

  it('renders HTML in card data as literal text (SR-1)', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { container } = renderView([
      card(1, { name: payload, subname: '<b>x</b>', type: '<script>1</script>', color: '<i>y</i>' }),
    ]);

    const table = screen.getByRole('table');
    expect(within(table).getByText(payload)).toBeInTheDocument();
    expect(within(table).getByText('<b>x</b>')).toBeInTheDocument();
    expect(within(table).getByText('<script>1</script>')).toBeInTheDocument();
    expect(within(table).getByText('<i>y</i>')).toBeInTheDocument();
    expect(container.querySelector('i')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('formats large counts the Finnish way', () => {
    const cards = Array.from({ length: 1024 }, (_, index) => card(index));
    const { container } = renderView(cards);

    expect(statusLine(container).textContent).toBe('1 024 korttia');
  });
});
