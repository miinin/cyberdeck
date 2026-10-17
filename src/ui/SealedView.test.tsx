import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import type { Card } from '../domain/card';
import type { Printing } from '../domain/printing';
import type { Rng } from '../domain/testHand';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { BoostersView, SealedView } from './SealedView';
import { card as baseCard } from './deckTestUtils';

afterEach(cleanup);
beforeEach(() => {
  window.location.hash = '';
});

function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

let number = 0;
function printing(rarity: string): Printing {
  number += 1;
  const code = String(number).padStart(3, '0');
  return {
    key: `welcometonightcityretail:${code}`,
    setCode: 'welcometonightcityretail',
    setName: 'Welcome to Night City — Retail',
    number: code,
    rarity,
    language: 'en',
    artist: null,
    imageKey: `x__welcome-to-night-city-${code}`,
  };
}

const COLORS = ['Red', 'Yellow', 'Green', 'Blue'];
function make(key: string, rarity: string, extra: Partial<Card> = {}): Card {
  return baseCard(key, { name: key, displayName: key, rarity, printings: [printing(rarity)], color: COLORS[number % 4] ?? 'Red', eddiable: true, ...extra });
}

/** A small set: enough different cards of each rarity for a pack of 12 with no repeats. */
const CARDS: Card[] = [
  ...Array.from({ length: 12 }, (_, i) => make(`com${i}`, 'Common')),
  ...Array.from({ length: 6 }, (_, i) => make(`unc${i}`, 'Uncommon')),
  ...Array.from({ length: 6 }, (_, i) => make(`rar${i}`, 'Rare', { type: 'Program' })),
  ...Array.from({ length: 4 }, (_, i) => make(`epi${i}`, 'Epic', { type: 'Gear' })),
  ...Array.from({ length: 6 }, (_, i) => make(`leg${i}`, 'Rare', { type: 'Legend', name: `Legend ${i}`, displayName: `Legend ${i}` })),
];

type User = ReturnType<typeof userEvent.setup>;

function renderView(repositories: Repositories = createMemoryRepositories(), seed = 11) {
  const user = userEvent.setup();
  render(<SealedView cards={CARDS} repositories={repositories} rng={lcg(seed)} now={() => new Date(2026, 9, 17)} />);
  return { user, repositories };
}

/** Time for the 12 cards of a pack to turn by themselves. */
const allTurned = { timeout: 3000 };

/** Starts a sealed and opens all seven packs with the one button; returns the number of clicks on it. */
async function openAllPacks(user: User): Promise<number> {
  await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
  let clicks = 0;
  const press = async (name: string) => {
    await user.click(await screen.findByRole('button', { name }));
    clicks += 1;
  };
  await press('Avaa pakkaus');
  for (let step = 1; step <= 5; step += 1) await press('Seuraava pakkaus');
  expect(screen.getByRole('heading', { name: 'Booster 6/6' })).toBeInTheDocument();
  await press('Seuraava pakkaus');
  expect(screen.getByRole('heading', { name: 'Legend-pakkaus 7/7' })).toBeInTheDocument();
  await press('Siirry rakentamaan pakkaa');
  expect(await screen.findByRole('heading', { name: 'Sealed-pakka' })).toBeInTheDocument();
  return clicks;
}

/** A finished stored run (the shape from before the export): 3 Legends and 12 commons in the main deck. */
function storedRun(extra: Record<string, unknown> = {}): string {
  const run = {
    set: 'welcome-to-night-city',
    opened: 7,
    pool: [
      ...['leg0', 'leg1', 'leg2'].map((card) => ({ card, printing: 'welcometonightcityretail:001', rarity: 'Rare' })),
      ...Array.from({ length: 12 }, (_, i) => ({ card: `com${i}`, printing: 'welcometonightcityretail:002', rarity: 'Common' })),
    ],
    main: Array.from({ length: 12 }, (_, i) => ({ card: `com${i}`, count: 1 })),
    legends: ['leg0', 'leg1', 'leg2'],
    ...extra,
  };
  return JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-01T10:00:00.000Z', data: { run } });
}

const addFirstCard = (user: User, index = 0) => user.click(screen.getAllByRole('button', { name: /^Lisää pakkaan:/ })[index] as HTMLElement);

describe('Sealed tab (T-173, T-176)', () => {
  it('offers the sets and starting a sealed, with the note that the rates are estimates', async () => {
    renderView();
    expect(await screen.findByRole('button', { name: 'Aloita sealed' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Welcome to Night City (Beta)' })).toBeInTheDocument();
    expect(screen.getByText('Jakaumat ovat yhteisön arvioita, ei julkaisijan virallisia lukuja.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Avaa booster' })).not.toBeInTheDocument();
  });

  it('opens a pack with one click and turns its 12 cards by itself, the rarest last', async () => {
    const { user } = renderView();
    await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
    // Before the opening the slots wait face down.
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: 'Avaa pakkaus' }));
    await waitFor(() => expect(document.querySelectorAll('.pack-face-name')).toHaveLength(12), allTurned);
    const slots = screen.getAllByRole('listitem');
    expect(within(slots[0] as HTMLElement).getByText('Common', { exact: false })).toBeInTheDocument();
  });

  it('opens all seven packs with eight clicks', async () => {
    const { user } = renderView();
    expect(await openAllPacks(user)).toBe(8);
  });

  it('keeps one and the same button, and the focus on it, through the whole opening', async () => {
    const { user } = renderView();
    await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
    const button = await screen.findByRole('button', { name: 'Avaa pakkaus' });
    await user.click(button);
    expect(screen.getByRole('button', { name: 'Seuraava pakkaus' })).toBe(button);
    expect(button).toHaveFocus();
    await user.click(button);
    expect(screen.getByRole('heading', { name: 'Booster 2/6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seuraava pakkaus' })).toBe(button);
    expect(button).toHaveFocus();
  });

  it('opens and moves on from the keyboard with the space bar and Enter', async () => {
    const { user } = renderView();
    await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
    const button = await screen.findByRole('button', { name: 'Avaa pakkaus' });
    button.focus();
    await user.keyboard(' ');
    expect(await screen.findByRole('button', { name: 'Seuraava pakkaus' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Booster 2/6' })).toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('stores only a pack that has been shown (BRK-04): a pack still on the table is gone after a reload', async () => {
    const repositories = createMemoryRepositories();
    const first = renderView(repositories);
    await first.user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
    await first.user.click(await screen.findByRole('button', { name: 'Avaa pakkaus' }));
    expect((await repositories.sealed.load()).value).toMatchObject({ opened: 0, pool: [] });
    await first.user.click(screen.getByRole('button', { name: 'Seuraava pakkaus' }));
    await waitFor(async () => expect((await repositories.sealed.load()).value).toMatchObject({ opened: 1 }));
    cleanup();
    renderView(repositories);
    expect(await screen.findByRole('heading', { name: 'Booster 2/6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avaa pakkaus' })).toBeInTheDocument();
  });

  it('"Avaa kaikki loput" takes the shown pack and opens the rest straight into the builder', async () => {
    const { user, repositories } = renderView();
    await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
    await user.click(await screen.findByRole('button', { name: 'Avaa pakkaus' }));
    await user.click(screen.getByRole('button', { name: 'Seuraava pakkaus' }));
    await user.click(screen.getByRole('button', { name: 'Avaa kaikki loput' }));
    expect(await screen.findByRole('heading', { name: 'Sealed-pakka' })).toBeInTheDocument();
    await waitFor(async () => {
      const run = (await repositories.sealed.load()).value;
      expect(run?.opened).toBe(7);
      // 6 boosters of 12 cards and the Legend pack of 3.
      expect(run?.pool).toHaveLength(75);
    });
  });

  it('"Avaa kaikki loput" works straight after starting', async () => {
    const { user, repositories } = renderView();
    await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
    await user.click(await screen.findByRole('button', { name: 'Avaa kaikki loput' }));
    expect(await screen.findByRole('heading', { name: 'Sealed-pakka' })).toBeInTheDocument();
    await waitFor(async () => expect((await repositories.sealed.load()).value?.pool).toHaveLength(75));
  });

  it('goes from the six boosters and the Legend pack to the builder, and builds the pool into a deck', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);

    expect(screen.getByText('Legendit 0/3')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /^Valitse Legendiksi:/ })[0] as HTMLElement);
    expect(await screen.findByText('Legendit 1/3')).toBeInTheDocument();

    await addFirstCard(user);
    expect(await screen.findByText('1/30+')).toBeInTheDocument();

    // The run is stored: pool of 6 x 12 + 3 cards, one main card and one Legend.
    await waitFor(async () => {
      const run = (await repositories.sealed.load()).value;
      expect(run?.opened).toBe(7);
      expect(run?.pool).toHaveLength(75);
      expect(run?.main).toHaveLength(1);
      expect(run?.legends).toHaveLength(1);
    });
  });

  it('groups the pool by type under a heading with the number of copies (T-174)', async () => {
    const { user } = renderView();
    await openAllPacks(user);
    const pool = screen.getByRole('region', { name: 'Pooli' });
    const headings = within(pool).getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent ?? '');
    expect(headings.length).toBeGreaterThan(0);
    expect(headings.every((text) => /^(Unit|Gear|Program) \(\d+\)$/.test(text))).toBe(true);
    const copies = headings.reduce((sum, text) => sum + Number(/\((\d+)\)/.exec(text)?.[1] ?? 0), 0);
    // 6 boosters of 12 cards; the Legends (also from boosters) have their own section.
    expect(copies).toBeGreaterThan(40);
    expect(copies).toBeLessThanOrEqual(72);
  });

  it('never moves more copies into the deck than the pool holds', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    const run = (await repositories.sealed.load()).value;
    const counts = new Map<string, number>();
    for (const entry of run?.pool ?? []) counts.set(entry.card, (counts.get(entry.card) ?? 0) + 1);
    const [key, copies] = [...counts].find(([k, n]) => n >= 2 && !k.startsWith('leg')) ?? [];
    expect(key).toBeDefined();
    const button = screen.getByRole('button', { name: new RegExp(`^Lisää pakkaan: ${key}$`) });
    for (let i = 0; i < (copies ?? 0); i += 1) await user.click(button);
    expect(button).toBeDisabled();
    await waitFor(async () => expect((await repositories.sealed.load()).value?.main).toEqual([{ card: key, count: copies }]));
  });

  it('keeps the sealed over a reload', async () => {
    const repositories = createMemoryRepositories();
    const first = renderView(repositories);
    await openAllPacks(first.user);
    cleanup();
    renderView(repositories);
    expect(await screen.findByRole('heading', { name: 'Sealed-pakka' })).toBeInTheDocument();
  });

  it('shows the name field with the default name and saves the deck among the own decks', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    expect(screen.getByLabelText('Pakan nimi')).toHaveValue('Sealed (17.10.2026)');
    expect(screen.queryByRole('link', { name: 'Avaa pakka' })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /^Valitse Legendiksi:/ })[0] as HTMLElement);
    await addFirstCard(user);
    await user.click(screen.getByRole('button', { name: 'Tallenna omiin pakkoihin' }));
    expect(await screen.findByText(/^Tallennettu pakaksi: Sealed \(17\.10\.2026\)\./)).toBeInTheDocument();
    const decks = (await repositories.decks.list()).value;
    expect(decks).toHaveLength(1);
    expect(decks[0]?.name).toBe('Sealed (17.10.2026)');
    expect(decks[0]?.sections[0]?.cards).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Avaa pakka' })).toHaveAttribute('href', `#/pakat/${decks[0]?.id}`);
    expect(screen.queryByRole('button', { name: 'Tallenna omiin pakkoihin' })).not.toBeInTheDocument();
    await waitFor(async () => expect((await repositories.sealed.load()).value?.deckId).toBe(decks[0]?.id));
  });

  it('gives a name that is already taken a number', async () => {
    const { user, repositories } = renderView();
    await repositories.decks.create({ name: 'Sealed (17.10.2026)', sections: [{ name: '', cards: [] }] });
    await openAllPacks(user);
    await addFirstCard(user);
    await user.click(screen.getByRole('button', { name: 'Tallenna omiin pakkoihin' }));
    expect(await screen.findByText(/^Tallennettu pakaksi: Sealed \(17\.10\.2026\) 2\./)).toBeInTheDocument();
  });

  it('refuses an empty name and saves nothing', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    await addFirstCard(user);
    await user.clear(screen.getByLabelText('Pakan nimi'));
    await user.click(screen.getByRole('button', { name: 'Tallenna omiin pakkoihin' }));
    expect(await screen.findByText('Anna pakalle nimi (1–100 merkkiä).')).toBeInTheDocument();
    expect((await repositories.decks.list()).value).toHaveLength(0);
  });

  it('saves changes to the same deck again, with the new name and cards', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    await addFirstCard(user);
    await user.click(screen.getByRole('button', { name: 'Tallenna omiin pakkoihin' }));
    await screen.findByRole('button', { name: 'Tallenna muutokset' });
    const [first] = (await repositories.decks.list()).value;

    await addFirstCard(user, 1);
    await user.clear(screen.getByLabelText('Pakan nimi'));
    await user.type(screen.getByLabelText('Pakan nimi'), 'Minun sealed');
    await user.click(screen.getByRole('button', { name: 'Tallenna muutokset' }));
    expect(await screen.findByText('Muutokset tallennettu pakkaan: Minun sealed.')).toBeInTheDocument();
    const decks = (await repositories.decks.list()).value;
    expect(decks).toHaveLength(1);
    expect(decks[0]?.id).toBe(first?.id);
    expect(decks[0]?.name).toBe('Minun sealed');
    expect(decks[0]?.sections[0]?.cards.reduce((sum, row) => sum + row.count, 0)).toBe(2);
  });

  it('asks before replacing a deck that was edited elsewhere, and replaces it or saves a new one', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    await addFirstCard(user);
    await user.click(screen.getByRole('button', { name: 'Tallenna omiin pakkoihin' }));
    await screen.findByRole('button', { name: 'Tallenna muutokset' });
    const [saved] = (await repositories.decks.list()).value;
    await new Promise((resolve) => setTimeout(resolve, 5));
    await repositories.decks.update(saved?.id ?? '', { name: 'Editorissa muokattu', sections: [{ name: '', cards: [] }] });

    await user.click(screen.getByRole('button', { name: 'Tallenna muutokset' }));
    expect(await screen.findByText('Pakkaa on muokattu editorissa. Korvataanko se sealed-pakalla?')).toBeInTheDocument();
    // Nothing is overwritten before the answer, and Cancel keeps it so.
    expect((await repositories.decks.list()).value[0]?.name).toBe('Editorissa muokattu');
    await user.click(screen.getByRole('button', { name: 'Peruuta' }));
    expect(screen.queryByText(/Pakkaa on muokattu editorissa/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tallenna muutokset' }));
    await user.click(await screen.findByRole('button', { name: 'Tallenna uutena' }));
    await waitFor(async () => expect((await repositories.decks.list()).value).toHaveLength(2));
    expect((await repositories.decks.get(saved?.id ?? ''))?.name).toBe('Editorissa muokattu');

    // The new deck is the saved one now; edit it and replace.
    const [, created] = (await repositories.decks.list()).value;
    await new Promise((resolve) => setTimeout(resolve, 5));
    await repositories.decks.update(created?.id ?? '', { name: 'Taas muokattu', sections: [{ name: '', cards: [] }] });
    await user.click(await screen.findByRole('button', { name: 'Tallenna muutokset' }));
    await user.click(await screen.findByRole('button', { name: 'Korvaa' }));
    await waitFor(async () => expect((await repositories.decks.get(created?.id ?? ''))?.sections[0]?.cards.length).toBeGreaterThan(0));
  });

  it('saves straight away when the deck was not edited elsewhere', async () => {
    const { user } = renderView();
    await openAllPacks(user);
    await addFirstCard(user);
    await user.click(screen.getByRole('button', { name: 'Tallenna omiin pakkoihin' }));
    await user.click(await screen.findByRole('button', { name: 'Tallenna muutokset' }));
    expect(await screen.findByText(/^Muutokset tallennettu pakkaan/)).toBeInTheDocument();
    expect(screen.queryByText(/Pakkaa on muokattu editorissa/)).not.toBeInTheDocument();
  });

  it('makes a new deck when the saved one has been removed', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    await addFirstCard(user);
    await user.click(screen.getByRole('button', { name: 'Tallenna omiin pakkoihin' }));
    await screen.findByRole('button', { name: 'Tallenna muutokset' });
    const [old] = (await repositories.decks.list()).value;
    await repositories.decks.remove(old?.id ?? '');
    await user.click(screen.getByRole('button', { name: 'Tallenna muutokset' }));
    await waitFor(async () => {
      const decks = (await repositories.decks.list()).value;
      expect(decks).toHaveLength(1);
      expect(decks[0]?.id).not.toBe(old?.id);
    });
  });

  it('offers a first save for a stored run from before the export (no deck id)', async () => {
    const repositories = createMemoryRepositories({ initial: { 'cyberdeck:sealed': storedRun() } });
    renderView(repositories);
    expect(await screen.findByRole('button', { name: 'Tallenna omiin pakkoihin' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Avaa pakka' })).not.toBeInTheDocument();
  });

  it('forgets the deck id of a run whose deck is gone', async () => {
    const repositories = createMemoryRepositories({ initial: { 'cyberdeck:sealed': storedRun({ deckId: 'gone-deck' }) } });
    renderView(repositories);
    await waitFor(async () => expect((await repositories.sealed.load()).value?.deckId).toBeUndefined());
    expect(await screen.findByRole('button', { name: 'Tallenna omiin pakkoihin' })).toBeInTheDocument();
  });

  it('opens the solo play with the sealed deck', async () => {
    const { user } = renderView();
    await openAllPacks(user);
    expect(screen.getByRole('button', { name: 'Pelaa yksin' })).toBeDisabled();
    await addFirstCard(user);
    await user.click(screen.getByRole('button', { name: 'Pelaa yksin' }));
    expect(window.location.hash).toBe('#/testaa/sealed/pelaa');
  });

  it('asks before starting a new sealed', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    await user.click(screen.getByRole('button', { name: 'Uusi sealed' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Peruuta' }));
    expect((await repositories.sealed.load()).value).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Uusi sealed' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Aloita uusi' }));
    expect(await screen.findByRole('button', { name: 'Aloita sealed' })).toBeInTheDocument();
    expect((await repositories.sealed.load()).value).toBeNull();
  });

  it('starts over with a notice when the stored sealed is not valid', async () => {
    const repositories = createMemoryRepositories({ initial: { 'cyberdeck:sealed': '{"schemaVersion":1,"savedAt":"2026-10-01T10:00:00.000Z","data":{"run":{"set":"x"}}}' } });
    renderView(repositories);
    expect(await screen.findByText('Tallennettu sealed oli lukukelvoton, joten aloitetaan alusta.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aloita sealed' })).toBeInTheDocument();
  });
});

describe('Boosters tab (T-176)', () => {
  it('opens a booster with one click, turns the cards by itself and opens the next with the same button', async () => {
    const user = userEvent.setup();
    render(<BoostersView cards={CARDS} rng={lcg(5)} />);
    expect(screen.getByText('Avattu 0 pakkausta')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Avaa booster' });
    await user.click(button);
    expect(await screen.findByText('Avattu 1 pakkaus')).toBeInTheDocument();
    await waitFor(() => expect(document.querySelectorAll('.pack-face-name')).toHaveLength(12), allTurned);
    expect(screen.getByRole('button', { name: 'Avaa seuraava booster' })).toBe(button);
    await user.click(button);
    expect(await screen.findByText('Avattu 2 pakkausta')).toBeInTheDocument();
  });
});

describe('Playtest routes (T-176)', () => {
  it('shows the Testaa link in the header and the three tabs, and no Sealed tab on the deck page', async () => {
    window.location.hash = '#/testaa/sealed';
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    expect(await screen.findByRole('button', { name: 'Aloita sealed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Testaa' })).toHaveAttribute('aria-current', 'page');
    const tabs = screen.getByRole('navigation', { name: 'Testaa-osion näkymä' });
    expect(within(tabs).getByRole('link', { name: 'Sealed' })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: 'Boosterit' })).toBeInTheDocument();
    expect(within(tabs).getByRole('link', { name: 'Pelaa yksin' })).toBeInTheDocument();
    cleanup();
    window.location.hash = '#/pakat';
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    const deckTabs = await screen.findByRole('navigation', { name: 'Pakkalistan näkymä' });
    expect(within(deckTabs).queryByRole('link', { name: 'Sealed' })).not.toBeInTheDocument();
  });

  it('shows the Boosters tab at #/testaa/boosterit', async () => {
    window.location.hash = '#/testaa/boosterit';
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    expect(await screen.findByRole('button', { name: 'Avaa booster' })).toBeInTheDocument();
  });

  it.each([
    ['#/pakat/sealed', '#/testaa/sealed'],
    ['#/pakat/sealed/goldfish', '#/testaa/sealed/pelaa'],
    ['#/testaa', '#/testaa/sealed'],
  ])('replaces %s by %s', async (from, to) => {
    window.location.hash = from;
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    await waitFor(() => expect(window.location.hash).toBe(to));
  });

  it('lists the own decks on the Play solo tab, and a choice opens the solo play of that deck', async () => {
    const repositories = createMemoryRepositories();
    const deck = await repositories.decks.create({ name: 'Punainen rush', sections: [{ name: '', cards: [{ card: 'com0', count: 3 }] }] });
    window.location.hash = '#/testaa/pelaa';
    render(<App cards={CARDS} repositories={repositories} />);
    const link = await screen.findByRole('link', { name: 'Pelaa yksin: Punainen rush' });
    expect(link).toHaveAttribute('href', `#/pakat/${deck.id}/goldfish`);
    expect(within(link).getByText('3 korttia')).toBeInTheDocument();
  });

  it('says so on the Play solo tab when there are no decks', async () => {
    window.location.hash = '#/testaa/pelaa';
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    expect(await screen.findByText(/Sinulla ei ole vielä pakkoja/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Siirry Pakat-sivulle' })).toHaveAttribute('href', '#/pakat');
  });

  it('plays the stored sealed deck alone', async () => {
    const repositories = createMemoryRepositories({ initial: { 'cyberdeck:sealed': storedRun() } });
    window.location.hash = '#/testaa/sealed/pelaa';
    render(<App cards={CARDS} repositories={repositories} />);
    expect(await screen.findByRole('button', { name: 'Aloitan ensin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Takaisin sealediin/ })).toBeInTheDocument();
  });

  it('says so when there is no sealed to play', async () => {
    window.location.hash = '#/testaa/sealed/pelaa';
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Ei käynnissä olevaa sealedia.'));
  });
});
