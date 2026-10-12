import { act, fireEvent, render, screen } from '@testing-library/react';
import { CARDS } from '../data/cards';
import { variantImageUrl } from '../data/variantImages';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

/** T-147: the set is above "Kaikki versiot": with a set chosen, the switch shows every version of that set only. */
async function renderView() {
  const repositories = createMemoryRepositories();
  await repositories.preferences.saveEditMode(false);
  render(<CatalogView cards={CARDS} repositories={repositories} />);
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

const novaUrls = new Set(CARDS.map((card) => variantImageUrl(card.key, 'Nova Rare')).filter((url): url is string => url !== null));
const shownSources = () => [...document.querySelectorAll('.card-grid img')].map((img) => img.getAttribute('src') ?? '');

describe('Kaikki versiot under a set filter (T-147)', () => {
  it('shows every version of the chosen set only, and every version of all sets without one', { timeout: 30000 }, async () => {
    await renderView();
    const allArts = screen.getByRole('switch', { name: 'Kaikki versiot', hidden: true });
    act(() => allArts.click());
    // No set: the Edgerunner Open Nova Rare arts are among the versions.
    expect(shownSources().some((src) => novaUrls.has(src))).toBe(true);

    const set = screen.getByRole('combobox', { name: 'Setti / versio', hidden: true });
    act(() => {
      fireEvent.change(set, { target: { value: 'welcome-to-night-city' } });
    });
    // Welcome to Night City has no Nova Rare printing: none of those arts is shown.
    expect(shownSources().length).toBeGreaterThan(0);
    expect(shownSources().filter((src) => novaUrls.has(src))).toEqual([]);
  });
});
