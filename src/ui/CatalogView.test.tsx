import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CardCatalog } from '../api';
import type { Card } from '../domain/card';
import { CatalogView } from './CatalogView';
import type { CatalogState } from './useCardCatalog';

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
    ...overrides,
  };
}

function ready(cards: Card[], reportedTotal = cards.length, skipped = 0): CatalogState {
  const catalog: CardCatalog = { cards, reportedTotal, skipped };
  return { status: 'ready', catalog };
}

function renderView(state: CatalogState) {
  const onRetry = vi.fn();
  const { container } = render(<CatalogView state={state} onRetry={onRetry} />);
  return { onRetry, container };
}

function statusLine(container: HTMLElement): HTMLElement {
  const element = container.querySelector<HTMLElement>('#card-status');
  if (element === null) throw new Error('#card-status is missing');
  return element;
}

describe('CatalogView', () => {
  it('shows the loading state without a table or a button', () => {
    const { container } = renderView({ status: 'loading' });

    expect(screen.getByRole('heading', { level: 1, name: 'Kortit' })).toBeInTheDocument();
    expect(statusLine(container)).toHaveTextContent('Haetaan kortteja…');
    expect(statusLine(container)).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Haetaan kortteja…');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows every card with name, type and cost on success', () => {
    const { container } = renderView(
      ready([
        card(1, { name: 'V', subname: 'Streetkid', type: 'Legend', cost: null }),
        card(2, { name: 'Swordwise Huscle', cost: 3 }),
        card(3, { cost: 0 }),
      ]),
    );

    const table = screen.getByRole('table', { name: 'Kaikki kortit' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(headers).toEqual(['Nimi', 'Tyyppi ja väri', 'Hinta']);

    const rows = within(table).getAllByRole('row').slice(1) as HTMLElement[];
    expect(rows).toHaveLength(3);
    const [first, second, third] = rows as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(first).getByRole('rowheader')).toHaveTextContent('V, Streetkid');
    expect(within(first).getAllByRole('cell')[0]).toHaveTextContent('Legend');
    expect(within(first).getAllByRole('cell')[1]).toHaveTextContent('ei hintaa');
    expect(within(second).getByRole('rowheader')).toHaveTextContent('Swordwise Huscle');
    expect(within(second).getAllByRole('cell')[1]).toHaveTextContent(/^3$/);
    expect(within(third).getAllByRole('cell')[1]).toHaveTextContent(/^0$/);

    expect(statusLine(container)).toHaveTextContent(/^3 korttia$/);
    expect(screen.getByRole('status')).toHaveTextContent('3 korttia ladattu.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the singular for one card', () => {
    const { container } = renderView(ready([card(1)]));

    expect(statusLine(container)).toHaveTextContent(/^1 kortti$/);
    expect(screen.getByRole('status')).toHaveTextContent('1 kortti ladattu.');
  });

  it('marks English card names and types with lang="en"', () => {
    renderView(ready([card(1, { name: 'V', subname: 'Streetkid', type: 'Legend' })]));

    const table = screen.getByRole('table');
    expect(within(table).getByText('V')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Streetkid')).toHaveAttribute('lang', 'en');
    expect(within(table).getByText('Legend')).toHaveAttribute('lang', 'en');
  });

  it('shows the color in Finnish under the type, with a decorative swatch (UX.md 5.5)', () => {
    const { container } = renderView(
      ready([
        card(1, { type: 'Unit', color: 'Red' }),
        card(2, { type: 'Gear', color: 'Yellow' }),
        card(3, { type: 'Legend', color: 'Green' }),
        card(4, { type: 'Program', color: 'Blue' }),
        card(5, { type: 'Unit', color: 'Purple' }),
        card(6, { type: 'Unit', color: null }),
      ]),
    );

    const typeCells = within(screen.getByRole('table'))
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0]?.textContent?.replace(/\s+/g, ' '));
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
    const { container } = renderView(
      ready([card(1, { name: payload, subname: '<b>x</b>', type: '<script>1</script>', color: '<i>y</i>' })]),
    );

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

  it('shows the empty state with a retry button when the API has no cards', async () => {
    const { container, onRetry } = renderView(ready([], 0));

    expect(statusLine(container)).toHaveTextContent(/^0 korttia$/);
    expect(
      screen.getByText(
        'Kortteja ei löytynyt. Korttitietojen lähde ei juuri nyt palauttanut yhtään korttia. Yritä hetken päästä uudelleen.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Kortteja ei löytynyt.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Yritä uudelleen' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(['network', 'timeout', 'http', 'invalid-response'] as const)(
    'shows the same understandable error for kind %s, without technical details',
    (kind) => {
      const { container } = renderView({ status: 'error', kind });

      expect(screen.getByRole('heading', { level: 2, name: 'Korttien haku epäonnistui' })).toBeInTheDocument();
      expect(
        screen.getByText('Korttitietoja ei saatu juuri nyt haettua. Tarkista verkkoyhteys ja yritä uudelleen.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Korttien haku epäonnistui.');
      expect(screen.getByRole('button', { name: 'Yritä uudelleen' })).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(statusLine(container)).not.toBeVisible();
      expect(container.textContent).not.toMatch(/netdeck\.gg\/api|http|timeout|invalid|500/i);
    },
  );

  it('moves focus to the heading when retrying so focus is not lost', async () => {
    const { onRetry } = renderView({ status: 'error', kind: 'network' });

    await userEvent.click(screen.getByRole('button', { name: 'Yritä uudelleen' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('shows the partial state with a warning before the table when cards are missing', () => {
    const { container } = renderView(ready([card(1), card(2)], 151, 149));

    expect(statusLine(container)).toHaveTextContent(/^2 \/ 151 korttia$/);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Kaikkia kortteja ei saatu näkyviin' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Osa korteista puuttuu listasta, koska niiden tietoja ei saatu tai ne olivat puutteellisia. Voit yrittää hakea kortit uudelleen.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      /^Näytetään 2 \/ 151 korttia\. Osa korteista puuttuu listasta\.$/,
    );
    expect(screen.getByRole('button', { name: 'Yritä uudelleen' })).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);

    const noticeAndTable = container.querySelectorAll('.notice-warning, table');
    expect(Array.from(noticeAndTable, (element) => element.tagName)).toEqual(['DIV', 'TABLE']);
  });

  it('shows the partial warning without an empty table when no usable cards were received', () => {
    renderView(ready([], 151, 151));

    expect(
      screen.getByRole('heading', { level: 2, name: 'Kaikkia kortteja ei saatu näkyviin' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows success with the visible count when the API returns more cards than total', () => {
    const { container } = renderView(ready([card(1), card(2), card(3)], 2));

    expect(statusLine(container)).toHaveTextContent(/^3 korttia$/);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('formats large counts the Finnish way', () => {
    const cards = Array.from({ length: 1024 }, (_, index) => card(index));
    const { container } = renderView(ready(cards));

    expect(statusLine(container).textContent).toBe('1 024 korttia');
  });
});
