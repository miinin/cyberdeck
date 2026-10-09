import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';
import { card, storedCollection } from './deckTestUtils';

/** The own binder, its covers and its editing (T-120). */
const RETAIL = 'Welcome to Night City — Retail';
const pad = (n: number) => String(n).padStart(3, '0');
const cards: Card[] = Array.from({ length: 11 }, (_, i) => i + 1).map((n) =>
  card(`c${n}`, {
    name: `Card ${n}`,
    displayName: `Card ${n}`,
    printings: [{ key: `wtnc:${pad(n)}`, setCode: 'wtnc', setName: RETAIL, number: pad(n), rarity: 'Common', language: 'en', artist: null, imageKey: `c${n}` }],
  }),
);

const NEXT = { name: /Seuraava sivu|Next page/ };
const PREV = { name: /Edellinen sivu|Previous page/ };
const position = () => document.querySelector('.binder-position');
const slot = (page: number, n: number, rest = '') => new RegExp(`(Sivu|Page) ${page}, (tasku|pocket) ${n}${rest}`);
const EMPTY = ', (tyhjä|empty)';
const pickerItems = (dialog: HTMLElement) =>
  within(dialog)
    .getAllByRole('button', { hidden: true })
    .filter((button) => button.classList.contains('binder-picker-item'));

async function settle() {
  await act(async () => {
    for (let round = 0; round < 8; round += 1) await Promise.resolve();
  });
}

async function renderCustom(
  entries: [string, number][] = [['c1', 2], ['c3', 1], ['c5', 1]],
  extra: Record<string, string> = {},
  repositories: Repositories = createMemoryRepositories({ initial: { ...storedCollection(entries), ...extra } }),
) {
  await repositories.preferences.saveCollectionPrefs({ view: 'binder', showMissing: true, binder: 'custom' });
  window.location.hash = '#/kokoelma';
  render(<App cards={cards} repositories={repositories} />);
  await settle();
  return repositories;
}

const openFirstPage = async () => userEvent.click(await screen.findByRole('button', NEXT));
const startEditing = async () => userEvent.click(await screen.findByRole('switch', { name: /^(Muokkaa|Edit)$/ }));

describe('CollectionBinder: mode and covers', () => {
  it('chooses between the set and the own binder, remembers it, and hides "show missing" in the own one', async () => {
    window.location.hash = '#/kokoelma';
    const repositories = createMemoryRepositories({ initial: storedCollection([['c1', 1]]) });
    await repositories.preferences.saveCollectionPrefs({ view: 'binder', showMissing: true, binder: 'set' });
    render(<App cards={cards} repositories={repositories} />);
    await settle();
    expect(screen.getByRole('radio', { name: /^(Setti|Set)$/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: /Näytä puuttuvat|Show missing/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /^(Oma kansio|My binder)$/ }));
    expect(screen.queryByRole('switch', { name: /Näytä puuttuvat|Show missing/ })).toBeNull();
    expect(screen.getByRole('switch', { name: /^(Muokkaa|Edit)$/ })).toBeInTheDocument();
    expect(await repositories.preferences.loadCollectionPrefs()).toEqual({ view: 'binder', showMissing: true, binder: 'custom' });
  });

  it('opens on the front cover with the name and status, and ends at the back cover without text', async () => {
    await renderCustom();
    expect(position()).toHaveTextContent(/Etukansi|Front cover/);
    const front = screen.getByRole('region', { name: /Etukansi|Front cover/ });
    expect(within(front).getByRole('heading', { name: /Oma kansio|My binder/ })).toBeInTheDocument();
    expect(front).toHaveTextContent(/3 (korttia|cards)/);
    await openFirstPage();
    expect(position()).toHaveTextContent(/(Sivu|Page) 1 \/ 1/);
    await userEvent.click(screen.getByRole('button', NEXT));
    expect(position()).toHaveTextContent(/Takakansi|Back cover/);
    const back = screen.getByRole('region', { name: /Takakansi|Back cover/ });
    expect(back.textContent).toBe('');
    expect(screen.getByRole('button', NEXT)).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('button', PREV));
    await userEvent.click(screen.getByRole('button', PREV));
    expect(position()).toHaveTextContent(/Etukansi|Front cover/);
  });

  it('has covers in the set binder too', async () => {
    window.location.hash = '#/kokoelma';
    const repositories = createMemoryRepositories({ initial: storedCollection([['c1', 1]]) });
    await repositories.preferences.saveCollectionPrefs({ view: 'binder', showMissing: true, binder: 'set' });
    render(<App cards={cards} repositories={repositories} />);
    await settle();
    const front = screen.getByRole('region', { name: /Etukansi|Front cover/ });
    expect(within(front).getByRole('heading', { name: 'Welcome to Night City' })).toBeInTheDocument();
    expect(front).toHaveTextContent(/1 \/ 11/);
  });
});

describe('CollectionBinder: the own binder', () => {
  it('starts from the owned cards in set order, one to a pocket, and saves that', async () => {
    const repositories = await renderCustom();
    await openFirstPage();
    expect(screen.getAllByRole('listitem').filter((item) => item.classList.contains('pocket'))).toHaveLength(9);
    expect(screen.getByRole('link', { name: /#001 Card 1, (omistettu|owned) 2/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /#003 Card 3/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: slot(1, 4, EMPTY) })).toBeInTheDocument();
    expect((await repositories.preferences.loadBinderLayout())?.pockets.slice(0, 4)).toEqual(['c1', 'c3', 'c5', null]);
  });

  it('swaps two cards and moves a card to an empty pocket, and saves both', async () => {
    const repositories = await renderCustom();
    await openFirstPage();
    await startEditing();
    const first = screen.getByRole('button', { name: slot(1, 1, ', Card 1') });
    expect(first).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: slot(1, 2, ', Card 3') }));
    expect(screen.getByRole('button', { name: slot(1, 1, ', Card 3') })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: slot(1, 2, ', Card 1') })).toBeInTheDocument();
    expect(screen.getAllByRole('status').some((item) => /(vaihdettu|swapped)/.test(item.textContent ?? ''))).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: slot(1, 2, ', Card 1') }));
    await userEvent.click(screen.getByRole('button', { name: slot(1, 5, EMPTY) }));
    expect(screen.getAllByRole('status').some((item) => /(siirretty|moved)/.test(item.textContent ?? ''))).toBe(true);
    expect((await repositories.preferences.loadBinderLayout())?.pockets.slice(0, 5)).toEqual(['c3', null, 'c5', null, 'c1']);
  });

  it('keeps the arrangement after the page is opened again', async () => {
    const repositories = await renderCustom();
    await openFirstPage();
    await startEditing();
    await userEvent.click(screen.getByRole('button', { name: slot(1, 1, ', Card 1') }));
    await userEvent.click(screen.getByRole('button', { name: slot(1, 3, ', Card 5') }));
    cleanup();
    render(<App cards={cards} repositories={repositories} />);
    await settle();
    await openFirstPage();
    const links = screen.getAllByRole('link').filter((link) => link.closest('.pocket') !== null);
    expect(links[0]).toHaveAccessibleName(/#005 Card 5/);
    expect(links[2]).toHaveAccessibleName(/#001 Card 1/);
  });

  it('empties a pocket and fills one with the picker: owned cards only, copy limits respected', async () => {
    const repositories = await renderCustom();
    await openFirstPage();
    await startEditing();
    expect(screen.getByRole('button', { name: /Tyhjennä tasku|Empty pocket/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: slot(1, 3, ', Card 5') }));
    await userEvent.click(screen.getByRole('button', { name: /Tyhjennä tasku|Empty pocket/ }));
    expect(screen.getByRole('button', { name: slot(1, 3, EMPTY) })).toBeInTheDocument();

    // An empty pocket opens the picker: only the three owned cards; a card with all copies placed is disabled.
    await userEvent.click(screen.getByRole('button', { name: slot(1, 3, EMPTY) }));
    const dialog = document.querySelector('dialog.binder-picker[open]') as HTMLElement;
    const items = pickerItems(dialog);
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Card 1');
    expect(items[0]).not.toBeDisabled(); // 1 of 2 copies placed
    expect(items[1]).toHaveTextContent('Card 3');
    expect(items[1]).toBeDisabled(); // its only copy is placed
    expect(items[2]).toHaveTextContent('Card 5');
    expect(items[2]).not.toBeDisabled(); // just emptied
    await userEvent.type(within(dialog).getByRole('searchbox', { hidden: true }), '5');
    expect(pickerItems(dialog)).toHaveLength(1);
    await userEvent.click(pickerItems(dialog)[0] as HTMLElement);
    expect(screen.getByRole('button', { name: slot(1, 3, ', Card 5') })).toBeInTheDocument();
    expect((await repositories.preferences.loadBinderLayout())?.pockets.slice(0, 4)).toEqual(['c1', 'c3', 'c5', null]);

    // "Change card" on a filled pocket: Card 1 has a second copy, Card 3 does not.
    await userEvent.click(screen.getByRole('button', { name: slot(1, 3, ', Card 5') }));
    await userEvent.click(screen.getByRole('button', { name: /Vaihda kortti|Change card/ }));
    const again = document.querySelector('dialog.binder-picker[open]') as HTMLElement;
    expect(pickerItems(again)[1]).toBeDisabled();
    await userEvent.click(pickerItems(again)[0] as HTMLElement);
    expect(screen.getByRole('button', { name: slot(1, 3, ', Card 1') })).toBeInTheDocument();
    expect((await repositories.preferences.loadBinderLayout())?.pockets.slice(0, 3)).toEqual(['c1', 'c3', 'c1']);
  });

  it('adds a page, removes only an empty page, and names the binder', async () => {
    const repositories = await renderCustom();
    await openFirstPage();
    await startEditing();
    const remove = () => screen.getByRole('button', { name: /(Poista sivu|Remove page) \d/ });
    expect(remove()).toBeDisabled(); // the one page, with cards
    await userEvent.click(screen.getByRole('button', { name: /Lisää sivu|Add page/ }));
    expect((await repositories.preferences.loadBinderLayout())?.pockets).toHaveLength(18);
    expect(position()).toHaveTextContent(/(Sivu|Page) 2 \/ 2/);
    expect(remove()).toBeEnabled();
    expect(remove()).toHaveTextContent('2');
    await userEvent.click(remove());
    expect((await repositories.preferences.loadBinderLayout())?.pockets).toHaveLength(9);

    await userEvent.type(screen.getByRole('textbox', { name: /Kansion nimi|Binder name/ }), '  Night binder  ');
    await userEvent.tab();
    expect((await repositories.preferences.loadBinderLayout())?.name).toBe('Night binder');
    await userEvent.click(screen.getByRole('switch', { name: /^(Muokkaa|Edit)$/ }));
    await userEvent.click(screen.getByRole('button', PREV));
    expect(screen.getByRole('heading', { name: 'Night binder' })).toBeInTheDocument();
  });

  it('keeps the pocket of a card that is no longer owned, as a ghost', async () => {
    const layout = JSON.stringify({ v: 1, name: 'Old', pockets: ['c2', 'c1', 'c1', 'c1', 'gone'] });
    await renderCustom([['c1', 2]], { 'cyberdeck:binder-layout': layout });
    await openFirstPage();
    expect(screen.getByRole('link', { name: /#002 Card 2, (puuttuu|missing)/ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /#001 Card 1, (omistettu|owned) 2/ })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /#001 Card 1, (puuttuu|missing)/ })).toBeInTheDocument(); // the third copy
    expect(screen.getByRole('img', { name: slot(1, 5, ', gone, (ei omistettu|not owned)') })).toBeInTheDocument();
  });

  it('does not break on a stored layout that is not valid', async () => {
    const tooLarge = `{"v":1,"name":"x","pockets":[${Array.from({ length: 901 }, () => 'null').join(',')}]}`;
    for (const raw of ['not json', '{"v":1,"name":"x","pockets":["NOT A KEY"]}', tooLarge]) {
      const repositories = await renderCustom([['c1', 1]], { 'cyberdeck:binder-layout': raw });
      await openFirstPage();
      expect(screen.getByRole('link', { name: /#001 Card 1/ })).toBeInTheDocument();
      expect((await repositories.preferences.loadBinderLayout())?.pockets.slice(0, 2)).toEqual(['c1', null]);
      cleanup();
    }
  });

  it('shows a quiet notice when the layout cannot be saved, and keeps working', async () => {
    const repositories = createMemoryRepositories({ initial: storedCollection([['c1', 1]]) });
    repositories.preferences.saveBinderLayout = () => Promise.reject(new Error('full'));
    await renderCustom([['c1', 1]], {}, repositories);
    expect(await screen.findByRole('alert')).toHaveTextContent(/(ei voitu tallentaa|could not be saved)/);
    await openFirstPage();
    expect(screen.getByRole('link', { name: /#001 Card 1/ })).toBeInTheDocument();
  });
});
