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

type View = 'own' | 'overview' | 'binder';

/** The default view is "Omat kortit" (T-112); the older tests below look at the overview, so they save it as the choice. */
async function renderCollection(
  entries: [string, number][],
  repositories: Repositories = createMemoryRepositories({ initial: entries.length > 0 ? storedCollection(entries) : {} }),
  view: View = 'overview',
) {
  await repositories.preferences.saveCollectionPrefs({ view, showMissing: true, binder: 'set' });
  window.location.hash = '#/kokoelma';
  render(<App cards={cards} repositories={repositories} />);
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
  return repositories;
}

describe('CollectionView', () => {
  describe('on a phone and on a desktop alike (T-118, UX-118-09)', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: vi.fn() }, configurable: true });
    });
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'mediaDevices');
    });

    it('has the scan button in the title row and no floating camera button', async () => {
      await renderCollection([['alpha', 3]]);
      const head = (await screen.findByRole('heading', { level: 1 })).closest('.page-head') as HTMLElement;
      expect(within(head).getByRole('button', { name: /Skannaa kortteja|Scan cards/ })).toHaveClass('button-secondary');
      expect(screen.getAllByRole('button', { name: /Skannaa kortteja|Scan cards/ })).toHaveLength(1);
      expect(document.querySelector('.scan-fab, .scan-fab-spacer')).toBeNull();
    });

    it('shows the scan prompt once more in the empty state, left aligned in one box', async () => {
      await renderCollection([]);
      const empty = (await screen.findByRole('heading', { name: /kokoelmasi on vielä tyhjä|collection is still empty/i })).closest('.empty');
      expect(empty).not.toBeNull();
      expect(within(empty as HTMLElement).getByRole('button', { name: /Skannaa kortteja|Scan cards/ })).toHaveClass('button-primary');
    });
  });

  describe('Omat kortit (T-112)', () => {
    const own = (entries: [string, number][], repositories?: Repositories) => renderCollection(entries, repositories, 'own');
    const rows = () => within(screen.getByRole('list', { name: /^(Omat kortit|My cards)$/ })).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

    it('offers three views in the order Omat kortit, Yleiskuva, Kansio, and starts on the first for a new user', async () => {
      window.location.hash = '#/kokoelma';
      const repositories = createMemoryRepositories({ initial: storedCollection([['alpha', 1]]) });
      render(<App cards={cards} repositories={repositories} />);
      await act(async () => {
        for (let round = 0; round < 5; round += 1) await Promise.resolve();
      });
      const group = (await screen.findByRole('radio', { name: /^(Omat kortit|My cards)$/ })).closest('fieldset') as HTMLElement;
      const radios = within(group).getAllByRole('radio');
      expect(radios.map((radio) => radio.parentElement?.textContent)).toEqual(['Omat kortit', 'Yleiskuva', 'Kansio']);
      expect(radios[0]).toBeChecked();
    });

    it('lists only the owned cards, with the counts editable straight away and no edit switch', async () => {
      await own([['alpha', 2], ['gamma', 1]]);
      expect(await screen.findByRole('button', { name: /Lisää yksi kappale: alpha/ })).toBeInTheDocument();
      expect(rows().join(' ')).toMatch(/alpha/);
      expect(rows().join(' ')).toMatch(/gamma/);
      expect(rows().join(' ')).not.toMatch(/beta/);
      expect(screen.queryByRole('switch', { name: /Muokkaa kokoelmaa|Edit collection/ })).toBeNull();
      expect(screen.queryByRole('radio', { name: /^(Omistetut|Owned)$/ })).toBeNull();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });

    it('saves a count change and keeps the row visible after taking the last copy out', async () => {
      const repositories = await own([['alpha', 1], ['gamma', 1]]);
      await userEvent.click(await screen.findByRole('button', { name: /Lisää yksi kappale: alpha/ }));
      await waitFor(async () => {
        expect((await repositories.collection.load()).value.entries).toContainEqual({ card: 'alpha', count: 2 });
      });
      await userEvent.click(screen.getByRole('button', { name: /Vähennä yksi kappale: gamma/ }));
      await waitFor(async () => {
        expect((await repositories.collection.load()).value.entries.map((entry) => entry.card)).toEqual(['alpha']);
      });
      expect(rows().join(' ')).toMatch(/gamma/);
    });

    it('searches within the owned cards only', async () => {
      await own([['alpha', 1], ['gamma', 1]]);
      await userEvent.type(await screen.findByRole('searchbox'), 'beta');
      expect(await screen.findByText(/Hakua vastaavia kortteja ei löytynyt|No cards match/i)).toBeInTheDocument();
    });

    it('shows the scan prompt and the link to the cards when nothing is owned', async () => {
      await own([]);
      expect(await screen.findByRole('heading', { name: /kokoelmasi on vielä tyhjä|collection is still empty/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Selaa kortteja ja lisää|Browse cards and add/ })).toHaveAttribute('href', '#/');
    });
  });

  it('shows the nav item between Cards and Decks', async () => {
    await renderCollection([]);
    const links = within(screen.getByRole('navigation', { name: /päävalikko|main menu/i })).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#/', '#/kokoelma', '#/pakat', '#/vaihto', '#/proxy']);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
  });

  it('shows a friendly empty state with a link to the cards', async () => {
    await renderCollection([]);
    expect(await screen.findByRole('heading', { name: /kokoelmasi on vielä tyhjä|collection is still empty/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Selaa kortteja ja lisää|Browse cards and add/ })).toHaveAttribute('href', '#/');
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
