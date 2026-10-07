import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { card, storedCollection } from './deckTestUtils';

const cards = [
  card('alpha', { eddiable: true }),
  card('beta', { rarity: 'Rare' }),
  card('gamma', { type: 'Legend', rarity: 'Rare' }),
];

async function renderCollection(entries: [string, number][], repositories: Repositories = createMemoryRepositories({ initial: entries.length > 0 ? storedCollection(entries) : {} })) {
  window.location.hash = '#/kokoelma';
  render(<App cards={cards} repositories={repositories} />);
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
  return repositories;
}

describe('CollectionView', () => {
  it('shows the nav item between Cards and Decks', async () => {
    await renderCollection([]);
    const links = within(screen.getByRole('navigation', { name: /päävalikko|main menu/i })).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#/', '#/kokoelma', '#/pakat', '#/vaihto', '#/proxy']);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
  });

  it('shows a friendly empty state with a link to the cards', async () => {
    await renderCollection([]);
    expect(await screen.findByRole('heading', { name: /kokoelmasi on vielä tyhjä|collection is still empty/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kortit-osioon|Go to Cards/ })).toHaveAttribute('href', '#/');
  });

  it('shows the overview numbers and the missing cards', async () => {
    await renderCollection([['alpha', 3], ['gamma', 1]]);
    expect(await screen.findByText(/2 \/ 3 eri korttia omistettu|2 of 3 distinct cards owned/)).toBeInTheDocument();
    const missing = screen.getByRole('list', { name: /1 kortti|1 card/ });
    expect(within(missing).getAllByRole('link')).toHaveLength(1);
    expect(within(missing).getByRole('link')).toHaveAttribute('href', '#/kortti/beta');
  });

  it('narrows the missing cards by rarity', async () => {
    await renderCollection([['alpha', 1]]);
    await screen.findByText(/2 korttia puuttuu|2 cards missing/);
    await userEvent.selectOptions(screen.getByLabelText(/Harvinaisuus|Rarity/), 'Common');
    expect(screen.getByText(/Ei puuttuvia kortteja tällä rajauksella|No missing cards with this filter/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText(/Harvinaisuus|Rarity/), 'Rare');
    expect(screen.getByText(/2 korttia puuttuu|2 cards missing/)).toBeInTheDocument();
  });

  it('adds the missing cards to the wants after confirming, as full playsets', async () => {
    const repositories = await renderCollection([['alpha', 1]]);
    await screen.findByText(/2 korttia puuttuu|2 cards missing/);
    await userEvent.click(screen.getByRole('button', { name: /Lisää puuttuvat want-listalle|Add missing to wants/ }));
    await userEvent.click(await screen.findByRole('button', { name: /^(Lisää|Add)$/ }));
    await waitFor(async () => {
      const wants = (await repositories.wants.load()).value.entries;
      expect(wants).toEqual([{ card: 'beta', count: 3 }, { card: 'gamma', count: 1 }]);
    });
  });

  it('sends one copy of each missing card to the proxy queue', async () => {
    const repositories = await renderCollection([['alpha', 1]]);
    await screen.findByText(/2 korttia puuttuu|2 cards missing/);
    await userEvent.click(screen.getByRole('button', { name: /Lähetä puuttuvat proxy-jonoon|Send missing to the proxy queue/ }));
    await waitFor(async () => {
      const queue = (await repositories.proxy.load()).value.entries;
      expect(queue).toEqual([{ card: 'beta', count: 1 }, { card: 'gamma', count: 1 }]);
    });
  });
});
