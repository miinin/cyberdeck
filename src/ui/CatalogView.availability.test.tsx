import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CARDS } from '../data/cards';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

async function openDetails(key: string, name: RegExp) {
  const user = userEvent.setup();
  const card = CARDS.find((c) => c.key === key);
  if (card === undefined) throw new Error(`no card ${key}`);
  render(<CatalogView cards={[card]} repositories={createMemoryRepositories()} />);
  await user.click(await screen.findByRole('button', { name }));
  return screen.findByRole('dialog');
}

describe('Card availability in the detail dialog (T-166)', () => {
  it('a card outside the boosters gets a notice and its sources by group', async () => {
    const dialog = await openDetails('viktor-vektor-sit-down-and-relax', /^Suurenna kuva: Viktor/);
    const section = within(dialog).getByRole('region', { name: 'Saatavuus' });
    expect(within(section).getByText('Ei Welcome to Night City -boostereissa')).toBeInTheDocument();
    expect(within(section).getByText((_, el) => el?.tagName === 'LI' && el.textContent === 'Aloituspakat: The Heist Starter Deck')).toBeInTheDocument();
    expect(within(section).getByText((_, el) => el?.tagName === 'LI' && el.textContent === 'Demopakat: Merc Demo Deck')).toBeInTheDocument();
    expect(within(section).getByText((_, el) => el?.tagName === 'LI' && el.textContent === 'Promot: Box Toppers')).toBeInTheDocument();
    expect(within(section).getByText((_, el) => el?.tagName === 'LI' && el.textContent === 'Turnauspalkinnot: Edgerunner Open S 1')).toBeInTheDocument();
  });

  it('a booster card has no notice, and an art outside the boosters is marked', async () => {
    const dialog = await openDetails('royce-psycho-on-the-edge', /^Suurenna kuva: Royce/);
    const section = within(dialog).getByRole('region', { name: 'Saatavuus' });
    expect(within(section).getByText('Welcome to Night City -boosterit')).toBeInTheDocument();
    expect(within(section).queryByText('Ei Welcome to Night City -boostereissa')).not.toBeInTheDocument();
    expect(within(dialog).getAllByText('Ei boostereissa').length).toBeGreaterThan(0);
  });
});
