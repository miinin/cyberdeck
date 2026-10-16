import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import type { Card } from '../domain/card';
import type { Printing } from '../domain/printing';
import type { Rng } from '../domain/testHand';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { SealedView } from './SealedView';
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

function renderView(repositories: Repositories = createMemoryRepositories(), seed = 11) {
  const user = userEvent.setup();
  render(<SealedView cards={CARDS} repositories={repositories} rng={lcg(seed)} now={() => new Date(2026, 9, 17)} />);
  return { user, repositories };
}

/** Opens a pack and turns every card. */
async function openAndReveal(user: ReturnType<typeof userEvent.setup>, openLabel: string | null) {
  if (openLabel !== null) await user.click(await screen.findByRole('button', { name: openLabel }));
  await user.click(await screen.findByRole('button', { name: 'Paljasta kaikki' }));
}

async function openAllPacks(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
  for (let step = 1; step <= 6; step += 1) {
    expect(await screen.findByRole('heading', { name: new RegExp(`^Booster ${step}/6`) })).toBeInTheDocument();
    await openAndReveal(user, 'Avaa pakkaus');
    await user.click(screen.getByRole('button', { name: 'Seuraava pakkaus' }));
  }
  expect(await screen.findByRole('heading', { name: /^Legend-pakkaus/ })).toBeInTheDocument();
  await openAndReveal(user, 'Avaa pakkaus');
  await user.click(screen.getByRole('button', { name: 'Siirry rakentamaan pakkaa' }));
  expect(await screen.findByRole('heading', { name: 'Sealed-pakka' })).toBeInTheDocument();
}

describe('Sealed tab (T-173)', () => {
  it('offers the sets, sealed and single boosters, with the note that the rates are estimates', async () => {
    renderView();
    expect(await screen.findByRole('button', { name: 'Aloita sealed' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Welcome to Night City (Beta)' })).toBeInTheDocument();
    expect(screen.getByText('Jakaumat ovat yhteisön arvioita, ei julkaisijan virallisia lukuja.')).toBeInTheDocument();
  });

  it('opens single boosters one card at a time and counts them and the hits', async () => {
    const { user } = renderView();
    expect(await screen.findByText('Avattu 0 pakkausta')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Avaa booster' }));
    // The first card is face down; one tap turns one card.
    await user.click(screen.getByRole('button', { name: 'Paljasta kortti 1/12' }));
    expect(screen.getByText('Paljastettu 1/12', { selector: '[aria-hidden="true"]' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sulje booster' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Paljasta kaikki' }));
    expect(screen.getByRole('button', { name: 'Paljasta kaikki' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Sulje booster' }));
    expect(await screen.findByText('Avattu 1 pakkaus')).toBeInTheDocument();
  });

  it('shows 12 cards per booster with the rarest last', async () => {
    const { user } = renderView();
    await user.click(await screen.findByRole('button', { name: 'Aloita sealed' }));
    await openAndReveal(user, 'Avaa pakkaus');
    const slots = screen.getAllByRole('listitem');
    expect(slots).toHaveLength(12);
    expect(within(slots[0] as HTMLElement).getByText('Common', { exact: false })).toBeInTheDocument();
  });

  it('goes from the six boosters and the Legend pack to the builder, and builds the pool into a deck', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);

    expect(screen.getByText('Legendit 0/3')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /^Valitse Legendiksi:/ })[0] as HTMLElement);
    expect(await screen.findByText('Legendit 1/3')).toBeInTheDocument();

    const add = screen.getAllByRole('button', { name: /^Lisää pakkaan:/ })[0] as HTMLElement;
    await user.click(add);
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

  it('saves the deck as a normal deck named "Sealed (date)" and says how to open it', async () => {
    const { user, repositories } = renderView();
    await openAllPacks(user);
    await user.click(screen.getAllByRole('button', { name: /^Valitse Legendiksi:/ })[0] as HTMLElement);
    await user.click(screen.getAllByRole('button', { name: /^Lisää pakkaan:/ })[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Tallenna pakaksi' }));
    expect(await screen.findByText(/^Tallennettu pakaksi: Sealed \(17\.10\.2026\)\./)).toBeInTheDocument();
    const decks = (await repositories.decks.list()).value;
    expect(decks).toHaveLength(1);
    expect(decks[0]?.name).toBe('Sealed (17.10.2026)');
    expect(decks[0]?.sections[0]?.cards).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Avaa pakka' })).toHaveAttribute('href', `#/pakat/${decks[0]?.id}`);
  });

  it('opens the solo play with the sealed deck', async () => {
    const { user } = renderView();
    await openAllPacks(user);
    expect(screen.getByRole('button', { name: 'Pelaa yksin' })).toBeDisabled();
    await user.click(screen.getAllByRole('button', { name: /^Lisää pakkaan:/ })[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Pelaa yksin' }));
    expect(window.location.hash).toBe('#/pakat/sealed/goldfish');
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

describe('Sealed routes (T-173)', () => {
  it('shows the Sealed tab in the deck page tabs', async () => {
    window.location.hash = '#/pakat/sealed';
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    const tab = await screen.findByRole('link', { name: 'Sealed' });
    expect(tab).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByRole('button', { name: 'Aloita sealed' })).toBeInTheDocument();
  });

  it('plays the stored sealed deck alone', async () => {
    const run = {
      set: 'welcome-to-night-city',
      opened: 7,
      pool: [
        ...['leg0', 'leg1', 'leg2'].map((card) => ({ card, printing: 'welcometonightcityretail:001', rarity: 'Rare' })),
        ...Array.from({ length: 12 }, (_, i) => ({ card: `com${i}`, printing: 'welcometonightcityretail:002', rarity: 'Common' })),
      ],
      main: Array.from({ length: 12 }, (_, i) => ({ card: `com${i}`, count: 1 })),
      legends: ['leg0', 'leg1', 'leg2'],
    };
    const repositories = createMemoryRepositories({
      initial: { 'cyberdeck:sealed': JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-01T10:00:00.000Z', data: { run } }) },
    });
    window.location.hash = '#/pakat/sealed/goldfish';
    render(<App cards={CARDS} repositories={repositories} />);
    expect(await screen.findByRole('button', { name: 'Aloitan ensin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Takaisin sealediin/ })).toBeInTheDocument();
  });

  it('says so when there is no sealed to play', async () => {
    window.location.hash = '#/pakat/sealed/goldfish';
    render(<App cards={CARDS} repositories={createMemoryRepositories()} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Ei käynnissä olevaa sealedia.'));
  });
});
