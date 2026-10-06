import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { legalCards, renderRoute, storedCollection, storedDecks } from './deckTestUtils';

function card(slug: string, name: string): Card {
  return { id: `id-${slug}`, key: slug, slug, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 2, power: null, ram: null, rarity: null };
}
const cards = [card('alpha', 'Alpha'), card('beta', 'Beta'), card('gamma', 'Gamma Ray')];

const stored = (key: string, entries: [string, number][]) => ({
  [key]: JSON.stringify({
    schemaVersion: 1,
    savedAt: '2026-10-01T10:00:00.000Z',
    data: { entries: entries.map(([entryCard, count]) => ({ card: entryCard, count })) },
  }),
});
const storedProxy = (entries: [string, number][]) => stored('cyberdeck:proxy', entries);
const queueRows = async (repositories: Repositories) => (await repositories.proxy.load()).value.entries;

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

async function renderProxy(initial: Record<string, string> = {}, hash = '#/proxy') {
  const repositories = createMemoryRepositories({ initial });
  window.location.hash = hash;
  render(<App cards={cards} repositories={repositories} />);
  await settle();
  return repositories;
}

const add = (name: string) =>
  within(screen.getByRole('list', { name: 'Lisättävät kortit' })).getByRole('button', { name: `Lisää jonoon yksi kappale: ${name}` });

describe('Proxy section (T-102)', () => {
  afterEach(() => {
    document.body.classList.remove('is-proxy-view');
  });

  it('shows the heading, the disclaimer, the empty queue and the nav link as the current page', async () => {
    await renderProxy();
    expect(screen.getByRole('heading', { level: 1, name: 'Proxy-tulostus' })).toBeInTheDocument();
    expect(screen.getByText('Vain henkilökohtaiseen testikäyttöön, ei myyntiin eikä turnauksiin.')).toBeInTheDocument();
    expect(screen.getByText(/Jono on tyhjä/)).toBeInTheDocument();
    expect(screen.getByText('0 korttia · 0 arkkia')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /päävalikko|sivut|valikko/i });
    expect(within(nav).getByRole('link', { name: 'Proxy' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Kortit' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Tulosta' })).toBeDisabled();
  });

  it('adds a card to the queue with the plus button, saves it and shows it in the summary and the preview', async () => {
    const user = userEvent.setup();
    const repositories = await renderProxy();
    await user.click(add('Alpha'));
    await user.click(add('Alpha'));
    await waitFor(async () => expect(await queueRows(repositories)).toEqual([{ card: 'alpha', count: 2 }]));
    expect(screen.getByText('2 korttia · 1 arkki')).toBeInTheDocument();
    const sheet = screen.getByRole('region', { name: 'Arkki 1/1' });
    expect(within(sheet).getAllByText('Alpha')).toHaveLength(2);
    expect(screen.getByRole('list', { name: 'Tulostusjonon kortit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tulosta' })).toBeEnabled();
    // The collection and the want list are not touched.
    expect((await repositories.collection.load()).value.entries).toEqual([]);
    expect((await repositories.wants.load()).value.entries).toEqual([]);
  });

  it('removes a card from the queue with minus', async () => {
    const user = userEvent.setup();
    const repositories = await renderProxy(storedProxy([['alpha', 1]]));
    expect(screen.getByText('1 kortti · 1 arkki')).toBeInTheDocument();
    const queued = screen.getByRole('list', { name: 'Tulostusjonon kortit' });
    await user.click(within(queued).getByRole('button', { name: 'Poista jonosta yksi kappale: Alpha' }));
    await waitFor(async () => expect(await queueRows(repositories)).toEqual([]));
    expect(screen.getByText('0 korttia · 0 arkkia')).toBeInTheDocument();
  });

  it('keeps the queue over a reload (new view, same storage) and starts a new sheet after nine cards', async () => {
    const first = await renderProxy(storedProxy([['alpha', 9], ['beta', 1]]));
    expect(screen.getByText('10 korttia · 2 arkkia')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Arkki 2/2' })).toBeInTheDocument();
    expect(await queueRows(first)).toHaveLength(2);
  });

  it('stops at 200 cards and says so', async () => {
    const user = userEvent.setup();
    const repositories = await renderProxy(storedProxy([['alpha', 199]]));
    await user.click(add('Beta'));
    await waitFor(async () => expect(await queueRows(repositories)).toContainEqual({ card: 'beta', count: 1 }));
    expect(screen.getByText('200 korttia · 23 arkkia')).toBeInTheDocument();
    expect(screen.getByText(/Jono on täynnä: siihen mahtuu enintään 200 korttia/)).toBeInTheDocument();
    await user.click(add('Gamma Ray'));
    expect(screen.getByRole('status')).toHaveTextContent('Jono on täynnä');
    expect(await queueRows(repositories)).not.toContainEqual(expect.objectContaining({ card: 'gamma' }));
  });

  it('has the print settings: gap, cut marks, the small PROXY mark and the calibration sheet', async () => {
    const user = userEvent.setup();
    await renderProxy(storedProxy([['alpha', 2]]));
    const firstCard = () => document.querySelector<HTMLElement>('.proxy-card');
    const secondCard = () => document.querySelectorAll<HTMLElement>('.proxy-card')[1];
    // Defaults: marks on, PROXY mark on, no gap, no calibration sheet.
    expect(document.querySelectorAll('.proxy-cut').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.proxy-mark')).toHaveLength(2);
    expect(screen.queryByRole('region', { name: 'Kalibrointiarkki' })).not.toBeInTheDocument();
    expect(firstCard()?.style.left).toContain('10.5');
    expect(secondCard()?.style.left).toContain('73.5');

    await user.click(screen.getByRole('radio', { name: '2 mm' }));
    expect(secondCard()?.style.left).toContain('73.5');
    await user.click(screen.getByRole('checkbox', { name: 'Leikkausmerkit arkin reunoilla' }));
    expect(document.querySelectorAll('.proxy-cut')).toHaveLength(0);
    await user.click(screen.getByRole('checkbox', { name: 'Pieni PROXY-merkintä korttien alareunaan' }));
    expect(document.querySelectorAll('.proxy-mark')).toHaveLength(0);
    await user.click(screen.getByRole('checkbox', { name: /Tulosta ensin kalibrointiarkki/ }));
    expect(screen.getByRole('region', { name: 'Kalibrointiarkki' })).toBeInTheDocument();
  });

  it('prints, then asks whether to clear the queue, and clears or keeps it', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const repositories = await renderProxy(storedProxy([['alpha', 2]]));
    await user.click(screen.getByRole('button', { name: 'Tulosta' }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    const dialog = await screen.findByRole('dialog', { name: 'Tyhjennetäänkö jono?' });
    expect(dialog).toHaveTextContent('Jonossa on 2 korttia');
    await user.click(within(dialog).getByRole('button', { name: 'Säilytä jono' }));
    expect(await queueRows(repositories)).toEqual([{ card: 'alpha', count: 2 }]);

    await user.click(screen.getByRole('button', { name: 'Tulosta' }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(2));
    await user.click(within(await screen.findByRole('dialog', { name: 'Tyhjennetäänkö jono?' })).getByRole('button', { name: 'Tyhjennä jono' }));
    await waitFor(async () => expect(await queueRows(repositories)).toEqual([]));
    expect(screen.getByText('0 korttia · 0 arkkia')).toBeInTheDocument();
    print.mockRestore();
  });

  it('marks the page for the print rules only while the view is open', async () => {
    await renderProxy();
    expect(document.body.classList.contains('is-proxy-view')).toBe(true);
    window.location.hash = '#/vaihto';
    await waitFor(() => expect(document.body.classList.contains('is-proxy-view')).toBe(false));
  });

  it('filters the search like the Cards section', async () => {
    const user = userEvent.setup();
    await renderProxy();
    await user.type(screen.getByLabelText('Hae nimellä'), 'gamma');
    expect(screen.getByRole('list', { name: 'Lisättävät kortit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Lisää jonoon yksi kappale: Alpha/ })).not.toBeInTheDocument();
    expect(add('Gamma Ray')).toBeInTheDocument();
  });
});

describe('Sending cards to the proxy queue (T-102)', () => {
  it('sends the single want and all wants from Have/Want', async () => {
    const user = userEvent.setup();
    const repositories = await renderProxy(stored('cyberdeck:wants', [['alpha', 2], ['beta', 1]]), '#/vaihto');
    await user.click(screen.getByRole('button', { name: 'Lähetä proxy-jonoon: Alpha' }));
    await waitFor(async () => expect(await queueRows(repositories)).toEqual([{ card: 'alpha', count: 2 }]));
    expect(screen.getByText('Jonoon lisättiin 2 korttia.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Avaa Proxy-osio' })).toHaveAttribute('href', '#/proxy');

    await user.click(screen.getByRole('button', { name: 'Lähetä kaikki want-kortit proxy-jonoon' }));
    await waitFor(async () =>
      expect(await queueRows(repositories)).toEqual([
        { card: 'alpha', count: 4 },
        { card: 'beta', count: 1 },
      ]),
    );
    // The want list itself does not change.
    expect((await repositories.wants.load()).value.entries).toEqual([
      { card: 'alpha', count: 2 },
      { card: 'beta', count: 1 },
    ]);
  });

  it('sends a whole deck or only its missing cards from the deck editor', async () => {
    const user = userEvent.setup();
    const initial = {
      ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: legalCards() }]),
      ...storedCollection([['u0', 3], ['u1', 1], ['l1', 1]]),
    };
    const repositories = renderRoute('#/pakat/a', createMemoryRepositories({ initial }));
    await user.click(await screen.findByRole('button', { name: 'Lähetä puuttuvat proxy-jonoon' }));
    await waitFor(async () => expect((await queueRows(repositories)).length).toBeGreaterThan(0));
    const missing = await queueRows(repositories);
    expect(missing.find((row) => row.card === 'u0')).toBeUndefined();
    expect(missing.find((row) => row.card === 'u1')).toEqual({ card: 'u1', count: 2 });
    expect(missing.find((row) => row.card === 'l1')).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'Lähetä pakka proxy-jonoon' }));
    await waitFor(async () => expect((await queueRows(repositories)).find((row) => row.card === 'u0')).toEqual({ card: 'u0', count: 3 }));
    expect((await queueRows(repositories)).find((row) => row.card === 'u1')).toEqual({ card: 'u1', count: 5 });
  });

  it('says when the queue is full and nothing fits', async () => {
    const user = userEvent.setup();
    await renderProxy({ ...stored('cyberdeck:wants', [['alpha', 5]]), ...storedProxy([['beta', 200]]) }, '#/vaihto');
    await user.click(screen.getByRole('button', { name: 'Lähetä kaikki want-kortit proxy-jonoon' }));
    expect(await screen.findByText(/Jono on täynnä \(enintään 200 korttia\), mitään ei lisätty/)).toBeInTheDocument();
  });
});
