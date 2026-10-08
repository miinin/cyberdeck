import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { createFakeAuth, createMemoryCloud, createMemoryPublicDecks, FAKE_USER } from '../account';
import type { MemoryPublicDecks } from '../account';
import { toCardsByKey } from '../domain/deckRules';
import { buildPublicDeckInput, publicDeckId } from '../domain/publicDeck';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { DECKS_KEY, storedDecks, testCards } from './deckTestUtils';

// Public decks (T-098, D-025): the list, the read-only view, the visibility settings and deck removal.

const byKey = toCardsByKey(testCards);
const ACCOUNT_DECKS_KEY = `cyberdeck:u:${FAKE_USER.uid}:decks`;
const OTHER_UID = 'other456';
const DECK = { id: 'deck-1', name: 'Oma pakka', cards: [['l1', 1], ['u0', 3]] as [string, number][] };

function ownDecks(): Record<string, string> {
  const stored = storedDecks([DECK])[DECKS_KEY] ?? '';
  return { [ACCOUNT_DECKS_KEY]: stored };
}

/** Publishes `name` as another account would, with the real input builder. */
async function publishAs(memory: MemoryPublicDecks, deckId: string, name: string, nickname: string | null) {
  const built = buildPublicDeckInput(
    deckId,
    { name, sections: [{ name: '', cards: [{ card: 'l1', count: 1 }, { card: 'u0', count: 3 }] }] },
    byKey,
    nickname,
  );
  if (!built.ok) throw new Error('test deck must be publishable');
  await memory.forUser(OTHER_UID).publish(built.input);
  return publicDeckId(OTHER_UID, deckId);
}

function renderApp(options: { signedIn?: boolean; initial?: Record<string, string>; memory?: MemoryPublicDecks } = {}) {
  const { signedIn = false, initial = {}, memory = createMemoryPublicDecks() } = options;
  const auth = createFakeAuth({ user: signedIn ? FAKE_USER : null });
  const repositories: Repositories = createMemoryRepositories({ initial });
  const cloud = createMemoryCloud({ uid: FAKE_USER.uid });
  render(<App cards={testCards} repositories={repositories} account={{ auth, cloud: () => cloud, publicDecks: memory.forUser }} />);
  return { memory, repositories, auth };
}

beforeEach(() => {
  window.location.hash = '#/pakat/julkiset';
});

describe('public decks list', () => {
  it('shows public decks to a signed-out visitor with the nickname or "Nimetön" as plain text (SR-37)', async () => {
    const memory = createMemoryPublicDecks();
    await publishAs(memory, 'a1', 'Pakka <b>yksi</b>', 'Nick <i>x</i>');
    await publishAs(memory, 'a2', 'Pakka kaksi', null);
    renderApp({ memory });

    const list = await screen.findByRole('list', { name: 'Julkiset pakat' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(list).toHaveTextContent('Pakka <b>yksi</b>');
    expect(list).toHaveTextContent('Julkaisija: Nick <i>x</i>');
    expect(list).toHaveTextContent('Julkaisija: Nimetön');
    expect(list).toHaveTextContent('L1');
    expect(list).toHaveTextContent('4 korttia');
    // Nothing from the data became markup or a link (SR-37).
    expect(list.querySelector('b, i, a, [href]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Julkiset pakat' })).toHaveAttribute('aria-current', 'page');
  });

  it('is not indexed by search engines while shown (SR-41)', async () => {
    renderApp();
    await screen.findByRole('heading', { name: 'Ei vielä julkisia pakkoja' });
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', expect.stringContaining('noindex'));
    window.location.hash = '#/pakat';
    await screen.findByRole('link', { name: 'Omat pakat' });
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Ei vielä julkisia pakkoja' })).toBeNull());
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('shows an empty state and an error state with a retry', async () => {
    const memory = createMemoryPublicDecks();
    memory.failNext('offline');
    renderApp({ memory });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Julkisia pakkoja ei voitu hakea');
    await userEvent.setup().click(within(alert).getByRole('button', { name: 'Yritä uudelleen' }));
    expect(await screen.findByRole('heading', { name: 'Ei vielä julkisia pakkoja' })).toBeInTheDocument();
  });

  it('says the list is unavailable, not offline, when the error is not a lost connection', async () => {
    const memory = createMemoryPublicDecks();
    memory.failNext('denied');
    renderApp({ memory });
    expect(await screen.findByRole('alert')).toHaveTextContent('eivät ole juuri nyt saatavilla');
  });

  it('pages with "Näytä lisää pakkoja" and reads each page once (SR-33)', async () => {
    const memory = createMemoryPublicDecks({ now: (() => { let t = Date.parse('2026-10-06T10:00:00Z'); return () => new Date((t += 60_000)); })() });
    for (let i = 0; i < 26; i += 1) await publishAs(memory, `d${i}`, `Pakka ${i}`, null);
    renderApp({ memory });
    const user = userEvent.setup();
    const list = await screen.findByRole('list', { name: 'Julkiset pakat' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(24);
    expect(memory.lists).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Näytä lisää pakkoja' }));
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(26));
    expect(screen.queryByRole('button', { name: 'Näytä lisää pakkoja' })).toBeNull();
    expect(memory.lists).toBe(2);
  });

  it('shows the own decks tab with a "Julkinen" label on a public deck', async () => {
    const initial = {
      [ACCOUNT_DECKS_KEY]: (storedDecks([DECK])[DECKS_KEY] ?? '').replace('"sections"', '"publish":{"public":true,"nickname":"N"},"sections"'),
    };
    renderApp({ signedIn: true, initial });
    window.location.hash = '#/pakat';
    expect(await screen.findByText('Oma pakka')).toBeInTheDocument();
    expect(screen.getByText('Julkinen')).toBeInTheDocument();
  });
});

describe('public deck view', () => {
  it('opens a public deck read only and saves it as a new private deck (SR-39)', async () => {
    const memory = createMemoryPublicDecks();
    const pubId = await publishAs(memory, 'a1', 'Julkinen <b>pakka</b>', 'Pelaaja');
    const { repositories } = renderApp({ memory });
    const user = userEvent.setup();
    window.location.hash = `#/pakat/julkinen/${pubId}`;

    await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(screen.getByRole('heading', { name: 'Julkinen <b>pakka</b>' })).toBeInTheDocument();
    expect(screen.getByText(/Julkaisija: Pelaaja/)).toBeInTheDocument();
    expect(document.querySelector('main b')).toBeNull();
    expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull();
    expect(screen.getByLabelText('Pakan nimi')).toHaveValue('Julkinen <b>pakka</b>');

    await user.click(await screen.findByRole('button', { name: 'Tallenna omaksi pakaksi' }));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/pakat\/./));
    const saved = (await repositories.decks.list()).value;
    expect(saved).toHaveLength(1);
    expect(saved[0]?.publish).toBeUndefined();
    expect(saved[0]?.id).not.toBe('a1');
    // The public copy is untouched.
    expect(memory.docs.has(pubId)).toBe(true);
  });

  it('shows "Nimetön" for an anonymous deck', async () => {
    const memory = createMemoryPublicDecks();
    const pubId = await publishAs(memory, 'a1', 'Pakka', null);
    renderApp({ memory });
    window.location.hash = `#/pakat/julkinen/${pubId}`;
    await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    expect(screen.getByText(/Julkaisija: Nimetön/)).toBeInTheDocument();
  });

  it('says so when the deck no longer exists and links back to the list', async () => {
    renderApp();
    window.location.hash = `#/pakat/julkinen/${'c'.repeat(64)}`;
    expect(await screen.findByRole('heading', { name: 'Pakkaa ei löydy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Takaisin julkisiin pakkoihin' })).toHaveAttribute('href', '#/pakat/julkiset');
  });

  it('shows a plain error for a document whose deck data does not parse', async () => {
    const memory = createMemoryPublicDecks();
    const pubId = await publishAs(memory, 'a1', 'Pakka', null);
    const doc = memory.docs.get(pubId) ?? {};
    // Valid base64url, but not a deck list the card parser can read.
    memory.setRaw(pubId, { ...doc, deck: 'AAAA' });
    renderApp({ memory });
    window.location.hash = `#/pakat/julkinen/${pubId}`;
    expect(await screen.findByRole('heading', { name: 'Linkki ei toimi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Takaisin julkisiin pakkoihin' })).toBeInTheDocument();
  });
});

describe('visibility in the deck editor', () => {
  const open = async () => {
    window.location.hash = `#/pakat/${DECK.id}`;
    return screen.findByRole('switch', { name: 'Julkinen' });
  };

  it('is private by default and disables "Julkinen" with a sign-in hint when signed out', async () => {
    const memory = createMemoryPublicDecks();
    renderApp({ initial: storedDecks([DECK]), memory });
    await open();
    expect(screen.getByText('Vain sinä näet pakan.')).toBeInTheDocument();
    const publicSwitch = screen.getByRole('switch', { name: 'Julkinen' });
    expect(publicSwitch).toHaveAttribute('aria-checked', 'false');
    expect(publicSwitch).toBeDisabled();
    expect(screen.getByText('Kirjaudu sisään Googlella, jos haluat julkaista pakan.')).toBeInTheDocument();
    expect(memory.docs.size).toBe(0);
  });

  it('asks first, warns, hides the nickname by default and publishes anonymously (SR-38)', async () => {
    const user = userEvent.setup();
    const { memory, repositories } = renderApp({ signedIn: true, initial: ownDecks() });
    await open();
    await user.click(screen.getByRole('switch', { name: 'Julkinen' }));

    // Nothing is published before the confirmation.
    expect(memory.docs.size).toBe(0);
    expect(screen.getByText(/näkyvät kaikille/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Näytä nimimerkkini' })).not.toBeChecked();
    // No pre-filled name: the Google name and the e-mail never go into the field (SR-38).
    expect(screen.getByLabelText('Nimimerkki')).toHaveValue('');
    expect(screen.getByLabelText('Nimimerkki')).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Julkaise pakka' }));
    await waitFor(() => expect(memory.docs.size).toBe(1));
    const pubId = await publicDeckId(FAKE_USER.uid, DECK.id);
    expect(memory.docs.get(pubId)).toMatchObject({ deckId: DECK.id, name: 'Oma pakka', nickname: null });
    expect(JSON.stringify([...memory.docs.values()])).not.toContain(FAKE_USER.uid);
    expect((await repositories.forAccount(FAKE_USER.uid).decks.get(DECK.id))?.publish).toEqual({ public: true, nickname: null });
    expect(await screen.findByText(/Pakka on julkinen/)).toBeInTheDocument();
  });

  it('publishes with the typed nickname only when the box is ticked, and validates it', async () => {
    const user = userEvent.setup();
    const { memory } = renderApp({ signedIn: true, initial: ownDecks() });
    await open();
    await user.click(screen.getByRole('switch', { name: 'Julkinen' }));
    await user.click(screen.getByRole('checkbox', { name: 'Näytä nimimerkkini' }));
    await user.click(screen.getByRole('button', { name: 'Julkaise pakka' }));
    expect(screen.getByText('Kirjoita nimimerkki (1–30 merkkiä) tai poista ruksi.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nimimerkki')).toHaveFocus();
    expect(memory.docs.size).toBe(0);

    await user.type(screen.getByLabelText('Nimimerkki'), '  Kyber Kana  ');
    await user.click(screen.getByRole('button', { name: 'Julkaise pakka' }));
    await waitFor(() => expect(memory.docs.size).toBe(1));
    expect([...memory.docs.values()][0]).toMatchObject({ nickname: 'Kyber Kana' });
  });

  it('can go back to private before publishing without any write', async () => {
    const user = userEvent.setup();
    const { memory } = renderApp({ signedIn: true, initial: ownDecks() });
    await open();
    await user.click(screen.getByRole('switch', { name: 'Julkinen' }));
    await user.click(screen.getByRole('button', { name: 'Peruuta' }));
    expect(screen.queryByRole('button', { name: 'Julkaise pakka' })).toBeNull();
    expect(screen.getByRole('switch', { name: 'Julkinen' })).toHaveAttribute('aria-checked', 'false');
    expect(memory.writes).toBe(0);
  });

  it('the switch works with the keyboard and reports its state', async () => {
    const user = userEvent.setup();
    renderApp({ signedIn: true, initial: ownDecks() });
    await open();
    const sw = screen.getByRole('switch', { name: 'Julkinen' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    sw.focus();
    await user.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: 'Julkaise pakka' })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByRole('button', { name: 'Julkaise pakka' })).toBeNull();
  });

  it('keeps the deck private and says so when publishing fails', async () => {
    const user = userEvent.setup();
    const { memory, repositories } = renderApp({ signedIn: true, initial: ownDecks() });
    await open();
    await user.click(screen.getByRole('switch', { name: 'Julkinen' }));
    memory.failNext('offline');
    await user.click(screen.getByRole('button', { name: 'Julkaise pakka' }));
    expect(await screen.findByText('Julkaiseminen ei onnistunut. Tarkista verkkoyhteys ja yritä uudelleen.')).toBeInTheDocument();
    expect(memory.docs.size).toBe(0);
    await waitFor(async () =>
      expect((await repositories.forAccount(FAKE_USER.uid).decks.get(DECK.id))?.publish?.public).not.toBe(true),
    );
  });

  it('deletes the public copy first when going private and keeps the nickname for later (SR-35)', async () => {
    const user = userEvent.setup();
    const { memory, repositories } = renderApp({ signedIn: true, initial: ownDecks() });
    await open();
    await user.click(screen.getByRole('switch', { name: 'Julkinen' }));
    await user.click(screen.getByRole('checkbox', { name: 'Näytä nimimerkkini' }));
    await user.type(screen.getByLabelText('Nimimerkki'), 'Nick');
    await user.click(screen.getByRole('button', { name: 'Julkaise pakka' }));
    await waitFor(() => expect(memory.docs.size).toBe(1));

    // The deletion fails: the deck stays public and says so.
    memory.failNext('offline');
    await user.click(await screen.findByRole('button', { name: 'Tee pakasta yksityinen' }));
    expect(await screen.findByText(/Julkista kopiota ei voitu poistaa/)).toBeInTheDocument();
    expect(memory.docs.size).toBe(1);
    const decks = repositories.forAccount(FAKE_USER.uid).decks;
    expect((await decks.get(DECK.id))?.publish?.public).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Tee pakasta yksityinen' }));
    await waitFor(() => expect(memory.docs.size).toBe(0));
    await waitFor(async () => expect((await decks.get(DECK.id))?.publish).toEqual({ public: false, nickname: 'Nick' }));
    expect(screen.getByRole('switch', { name: 'Julkinen' })).toHaveAttribute('aria-checked', 'false');
  });
});

describe('removing a public deck from the list', () => {
  async function setupPublicDeck() {
    const memory = createMemoryPublicDecks();
    const pubId = await publicDeckId(FAKE_USER.uid, DECK.id);
    await memory.forUser(FAKE_USER.uid).publish({
      deckId: DECK.id,
      name: DECK.name,
      legends: 'L1',
      cardCount: 4,
      deck: 'QQ',
      nickname: null,
    });
    const initial = {
      [ACCOUNT_DECKS_KEY]: (storedDecks([DECK])[DECKS_KEY] ?? '').replace('"sections"', '"publish":{"public":true,"nickname":null},"sections"'),
    };
    return { memory, pubId, initial };
  }

  it('deletes the public copy before the deck, and keeps both when the copy cannot be deleted (SR-35)', async () => {
    const user = userEvent.setup();
    const { memory, pubId, initial } = await setupPublicDeck();
    const { repositories } = renderApp({ signedIn: true, initial, memory });
    window.location.hash = '#/pakat';
    await user.click(await screen.findByRole('button', { name: 'Poista pakka: Oma pakka' }));
    memory.failNext('offline');
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Poista pakka' }));
    expect(await screen.findByText(/Julkista kopiota ei voitu poistaa/)).toBeInTheDocument();
    expect(memory.docs.has(pubId)).toBe(true);
    expect((await repositories.forAccount(FAKE_USER.uid).decks.list()).value).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Poista pakka: Oma pakka' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Poista pakka' }));
    await waitFor(() => expect(memory.docs.has(pubId)).toBe(false));
    await waitFor(async () => expect((await repositories.forAccount(FAKE_USER.uid).decks.list()).value).toHaveLength(0));
  });
});

describe('public list after publishing', () => {
  it('shows a deck published in this session without a manual refresh', async () => {
    const user = userEvent.setup();
    renderApp({ signedIn: true, initial: ownDecks() });
    // The list is read (empty) and cached first.
    await screen.findByRole('heading', { name: 'Ei vielä julkisia pakkoja' });
    window.location.hash = `#/pakat/${DECK.id}`;
    await screen.findByRole('switch', { name: 'Julkinen' });
    await user.click(screen.getByRole('switch', { name: 'Julkinen' }));
    await user.click(screen.getByRole('button', { name: 'Julkaise pakka' }));
    await screen.findByText(/Pakka on julkinen/);
    window.location.hash = '#/pakat/julkiset';
    const list = await screen.findByRole('list', { name: 'Julkiset pakat' });
    expect(list).toHaveTextContent('Oma pakka');
    expect(list).toHaveTextContent('Julkaisija: Nimetön');
  });
});

describe('updating a public deck (SR-34)', () => {
  it('sends the edits of a public deck when the editor is left, not on every change', async () => {
    const user = userEvent.setup();
    const memory = createMemoryPublicDecks();
    const initial = {
      [ACCOUNT_DECKS_KEY]: (storedDecks([DECK])[DECKS_KEY] ?? '').replace('"sections"', '"publish":{"public":true,"nickname":null},"sections"'),
    };
    await memory.forUser(FAKE_USER.uid).publish({ deckId: DECK.id, name: DECK.name, legends: 'L1', cardCount: 4, deck: 'QQ', nickname: null });
    renderApp({ signedIn: true, initial, memory });
    window.location.hash = `#/pakat/${DECK.id}`;
    const table = await screen.findByRole('table', { name: 'Hakutulokset' });
    const row = within(table).getByText('Unit 5', { selector: '.pick-name' }).closest('tr') as HTMLElement;
    await user.click(row);
    await user.click(row);
    expect(await screen.findByText('Julkinen kopio päivittyy hetken kuluttua tai kun poistut pakasta.')).toBeInTheDocument();
    expect(memory.writes).toBe(1);

    window.location.hash = '#/pakat';
    await waitFor(() => expect(memory.writes).toBe(2));
    const doc = [...memory.docs.values()][0];
    expect(doc?.cardCount).toBe(6);
    expect(doc?.name).toBe('Oma pakka');
  });
});
