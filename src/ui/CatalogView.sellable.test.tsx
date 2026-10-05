import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';


function card(slug: string, name: string, eddiable: boolean | null, rarity: string | null = 'Rare'): Card {
  return { id: `id-${slug}`, key: slug, slug, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 1, power: null, ram: null, rarity, eddiable };
}

const cards = [card('alpha', 'Alpha', true), card('bravo', 'Bravo', false), card('charlie', 'Charlie', null)];

const names = () => within(screen.getByRole('list', { name: /kortit/i })).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

function renderView() {
  return render(<CatalogView cards={cards} repositories={{ ...createMemoryRepositories(), persistent: true }} />);
}

describe('CatalogView sellable filter (T-082)', () => {
  it('shows only the cards marked sellable, as a removable chip, and clears with the other filters', async () => {
    const user = userEvent.setup();
    renderView();
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    await user.click(screen.getByRole('checkbox', { name: 'Vain myytävät (€$)' }));
    expect(names()).toEqual(['Alpha']);
    const chip = screen.getByRole('button', { name: /Myytävä \(€\$\)/ });
    await user.click(chip);
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    await user.click(screen.getByRole('checkbox', { name: 'Vain myytävät (€$)' }));
    await user.click(screen.getByRole('button', { name: /Tyhjennä haku ja suodattimet/ }));
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(screen.getByRole('checkbox', { name: 'Vain myytävät (€$)' })).not.toBeChecked();
  });
});

describe('CatalogView rarity filter (T-082)', () => {
  it('shows the short name, keeps the official name for screen readers and in the tooltip', () => {
    renderView();
    const group = screen.getByRole('group', { name: 'Harvinaisuus' });
    const secret = within(group).getByRole('checkbox', { name: /Secret Rare/ });
    const label = secret.closest('label');
    expect(label).toHaveAttribute('title', expect.stringContaining('Secret Rare'));
    expect(label?.querySelector('.option-rarity-name')).toHaveTextContent('Secret');
    expect(label?.querySelector('.option-rarity-name')).toHaveAttribute('aria-hidden', 'true');
    expect(within(group).getByRole('checkbox', { name: /Nova Rare/ }).closest('label')?.querySelector('.option-rarity-name')).toHaveTextContent('Nova');
  });
});
