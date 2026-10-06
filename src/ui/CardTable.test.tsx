import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Card } from '../domain/card';
import { CardTable } from './CardTable';

function c(name: string, power: number | null): Card {
  return {
    id: name, slug: name, name, subname: null, displayName: name, type: 'Unit', color: 'Red',
    cost: 1, power, ram: 1, rarity: null, key: name,
  };
}
const cards = [c('B', 2), c('A', 5), c('N', null)];

function rowNames(): string[] {
  const rows = screen.getAllByRole('row').slice(1);
  return rows.map((row) => within(row).getByRole('rowheader').textContent ?? '');
}

describe('CardTable sorting', () => {
  it('cycles ascending, descending, original and sets aria-sort', async () => {
    const user = userEvent.setup();
    render(<CardTable cards={cards} onOpenImage={() => {}} />);
    const header = () => screen.getByRole('columnheader', { name: /Power/ });
    expect(header()).not.toHaveAttribute('aria-sort');
    expect(rowNames()).toEqual(['B', 'A', 'N']);

    await user.click(within(header()).getByRole('button'));
    expect(header()).toHaveAttribute('aria-sort', 'ascending');
    expect(rowNames()).toEqual(['B', 'A', 'N']);

    await user.click(within(header()).getByRole('button'));
    expect(header()).toHaveAttribute('aria-sort', 'descending');
    expect(rowNames()).toEqual(['A', 'B', 'N']);

    await user.click(within(header()).getByRole('button'));
    expect(header()).not.toHaveAttribute('aria-sort');
    expect(rowNames()).toEqual(['B', 'A', 'N']);
  });

  it('moves aria-sort to the newly chosen column and leaves image column unsortable', async () => {
    const user = userEvent.setup();
    render(<CardTable cards={cards} onOpenImage={() => {}} />);
    await user.click(within(screen.getByRole('columnheader', { name: /Power/ })).getByRole('button'));
    await user.click(within(screen.getByRole('columnheader', { name: /Nimi/ })).getByRole('button'));
    expect(screen.getByRole('columnheader', { name: /Power/ })).not.toHaveAttribute('aria-sort');
    expect(screen.getByRole('columnheader', { name: /Nimi/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(rowNames()).toEqual(['A', 'B', 'N']);
    expect(within(screen.getByRole('columnheader', { name: 'Kuva' })).queryByRole('button')).toBeNull();
  });
});

// T-090: on phones the rows are restacked with CSS grid; explicit roles keep the table for screen readers,
// and every game value carries its name for the label shown beside it.
describe('CardTable phone layout hooks', () => {
  it('keeps explicit table roles and names the game values', () => {
    render(<CardTable cards={[c('A', 5)]} onOpenImage={() => {}} />);
    expect(screen.getByRole('table')).toHaveAttribute('role', 'table');
    const row = screen.getAllByRole('row')[1];
    expect(row).toHaveAttribute('role', 'row');
    const labels = within(row as HTMLElement)
      .getAllByRole('cell')
      .map((cell) => cell.getAttribute('data-label'))
      .filter((label) => label !== null);
    expect(labels).toEqual(['Cost', 'Power', 'RAM']);
  });
});
