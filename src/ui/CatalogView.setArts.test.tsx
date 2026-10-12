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

describe('tag filter (T-151)', () => {
  it('shows the cards of the chosen tag and a chip that removes it', { timeout: 30000 }, async () => {
    await renderView();
    const tag = screen.getByRole('combobox', { name: 'Tagi', hidden: true });
    act(() => {
      fireEvent.change(tag, { target: { value: 'Arasaka' } });
    });
    const arasaka = CARDS.filter((card) => (card.tags ?? []).includes('Arasaka')).length;
    expect(arasaka).toBeGreaterThan(0);
    expect(document.querySelectorAll('.card-grid > li')).toHaveLength(arasaka);
    expect(screen.getByRole('button', { name: /Tagi: Arasaka/ })).toBeInTheDocument();
  });

  it('a tag in the card details shows every card with it (T-152)', { timeout: 30000 }, async () => {
    await renderView();
    const v = CARDS.find((card) => card.key === 'v-streetkid');
    const tag = v?.tags?.[0];
    if (tag === undefined) throw new Error('V has no tag in the data');
    act(() => screen.getAllByRole('button', { name: /V, Streetkid|V — Streetkid|Streetkid/, hidden: true })[0]?.click());
    act(() => screen.getByRole('button', { name: `Näytä kaikki ${tag}-kortit`, hidden: true }).click());
    const count = CARDS.filter((card) => (card.tags ?? []).includes(tag)).length;
    expect(document.querySelectorAll('.card-grid > li')).toHaveLength(count);
    expect(screen.getByRole('button', { name: new RegExp(`Tagi: ${tag}`) })).toBeInTheDocument();
  });
});
