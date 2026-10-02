import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

/** In-memory storage that behaves like working browser storage (no "Tietoja ei voi tallentaa" box). */
function browserLikeRepositories() {
  return { ...createMemoryRepositories(), persistent: true };
}
import { ANNOUNCE_DELAY_MS } from './useDelayedAnnouncement';

function card(slug: string, name: string, subname: string | null, type: string, color: string | null): Card {
  return { id: `id-${slug}`, key: `key-${slug}`, slug, name, subname, displayName: name, type, color, cost: 1, power: null, ram: null };
}

const cards: Card[] = [
  card('johnny-renegade', 'Johnny Silverhand', 'Rocking Renegade', 'Legend', 'Red'),
  card('johnny-fighting', 'Johnny Silverhand', 'Never Stop Fighting', 'Unit', 'Red'),
  card('v-streetkid', 'V', 'Streetkid', 'Legend', 'Blue'),
  card('judy', 'Judy Álvarez', 'Braindance Prodigy', 'Unit', 'Green'),
  card('sombreron', 'El Sombrerón', null, 'Gear', 'Yellow'),
  card('pinch', 'Viktor Vektor', 'You Might Feel a Little Pinch', 'Program', 'Blue'),
];

function renderView(list: Card[] = cards) {
  return render(<CatalogView cards={list} repositories={browserLikeRepositories()} />);
}

const searchBox = () => screen.getByRole('searchbox', { name: 'Hae nimellä' });
const liveRegion = () => screen.getByRole('status');
const statusText = (container: HTMLElement) => container.querySelector('#card-status')?.textContent;
const rowNames = () =>
  within(screen.getByRole('list'))
    .getAllByRole('heading', { level: 3 })
    .map((cell) => cell.textContent);

describe('CatalogView search and filters: structure', () => {
  it('has a named search landmark with a labelled search field and no autofocus', () => {
    renderView();

    expect(screen.getByRole('search', { name: 'Hae ja suodata kortteja' })).toBeInTheDocument();
    const input = searchBox();
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAccessibleDescription('Kortin nimi tai alaotsikko. Osa sanasta riittää.');
    expect(input).toHaveAttribute('maxlength', '100');
    expect(input).not.toHaveAttribute('placeholder');
    expect(input).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it('groups types and colors in named fieldsets, known values first in a fixed order', () => {
    renderView([...cards, card('odd', 'Odd', null, 'Token', 'Purple')]);

    const typeGroup = screen.getByRole('group', { name: 'Tyyppi' });
    const colorGroup = screen.getByRole('group', { name: 'Väri' });
    const hint = 'Valitse yksi tai useampi. Ilman valintaa näytetään kaikki.';
    expect(typeGroup).toHaveAccessibleDescription(hint);
    expect(colorGroup).toHaveAccessibleDescription(hint);

    const names = (group: HTMLElement) =>
      within(group)
        .getAllByRole('checkbox')
        .map((box) => box.closest('label')?.textContent?.trim());
    expect(names(typeGroup)).toEqual(['Legend', 'Unit', 'Gear', 'Program', 'Token']);
    expect(names(colorGroup)).toEqual(['Punainen', 'Keltainen', 'Vihreä', 'Sininen', 'Purple']);
    within(typeGroup)
      .getAllByRole('checkbox')
      .forEach((box) => expect(box).not.toBeChecked());

    expect(within(typeGroup).getByText('Legend')).toHaveAttribute('lang', 'en');
    expect(within(colorGroup).getByText('Purple')).toHaveAttribute('lang', 'en');
    within(colorGroup)
      .getAllByText('', { selector: '.color-swatch' })
      .forEach((swatch) => expect(swatch).toHaveAttribute('aria-hidden', 'true'));
  });
});

describe('CatalogView search and filters: filtering', () => {
  it('filters by part of the name while typing, regardless of case and accents', async () => {
    const { container } = renderView();

    await userEvent.type(searchBox(), 'SILVER');
    expect(rowNames()).toEqual(['Johnny Silverhand, Rocking Renegade', 'Johnny Silverhand, Never Stop Fighting']);
    expect(statusText(container)).toBe('2 / 6 korttia');
    expect(screen.getByRole('list', { name: 'Hakua vastaavat kortit' })).toBeInTheDocument();

    await userEvent.clear(searchBox());
    await userEvent.type(searchBox(), 'alvarez');
    expect(rowNames()).toEqual(['Judy Álvarez, Braindance Prodigy']);
  });

  it('shows all cards again with the original caption and count when the search is emptied', async () => {
    const { container } = renderView();

    await userEvent.type(searchBox(), 'v');
    await userEvent.clear(searchBox());

    expect(statusText(container)).toBe('6 korttia');
    expect(screen.getByRole('list', { name: 'Kaikki kortit' })).toBeInTheDocument();
    expect(rowNames()).toHaveLength(6);
  });

  it('combines types (OR), colors (OR) and the search text (AND) without moving focus', async () => {
    const { container } = renderView();

    const legend = screen.getByRole('checkbox', { name: 'Legend' });
    await userEvent.click(legend);
    expect(legend).toBeChecked();
    expect(legend).toHaveFocus();
    expect(rowNames()).toEqual(['Johnny Silverhand, Rocking Renegade', 'V, Streetkid']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Gear' }));
    expect(rowNames()).toEqual(['Johnny Silverhand, Rocking Renegade', 'V, Streetkid', 'El Sombrerón']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Sininen' }));
    expect(rowNames()).toEqual(['V, Streetkid']);
    expect(statusText(container)).toBe('1 / 6 korttia');

    await userEvent.type(searchBox(), 'johnny');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(statusText(container)).toBe('0 / 6 korttia');
  });

  it('toggles a checkbox with the space key', async () => {
    renderView();

    const unit = screen.getByRole('checkbox', { name: 'Unit' });
    unit.focus();
    await userEvent.keyboard(' ');
    expect(unit).toBeChecked();
    await userEvent.keyboard(' ');
    expect(unit).not.toBeChecked();
  });

  it('treats an XSS string as literal search text (SR-1)', async () => {
    const { container } = renderView();
    const payload = '<script>alert(1)</script><img src=x onerror=alert(1)>';

    fireEvent.change(searchBox(), { target: { value: payload } });

    expect(searchBox()).toHaveValue(payload);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('CatalogView search and filters: no results', () => {
  it('shows the empty result with a button that clears everything and focuses the search field', async () => {
    const { container } = renderView();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Gear' }));
    await userEvent.type(searchBox(), 'silverhandd');

    expect(
      screen.getByText(
        'Hakua vastaavia kortteja ei löytynyt. Tarkista hakusana tai poista valintoja suodattimista.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    // The search text stays so the user can see and fix it.
    expect(searchBox()).toHaveValue('silverhandd');

    await userEvent.click(screen.getByRole('button', { name: 'Tyhjennä haku ja suodattimet' }));

    expect(searchBox()).toHaveValue('');
    expect(searchBox()).toHaveFocus();
    expect(screen.getByRole('checkbox', { name: 'Gear' })).not.toBeChecked();
    expect(screen.queryByRole('button', { name: 'Tyhjennä haku ja suodattimet' })).not.toBeInTheDocument();
    expect(rowNames()).toHaveLength(6);
    expect(statusText(container)).toBe('6 korttia');
    // Announced at once, without the delay.
    expect(liveRegion()).toHaveTextContent('Näytetään kaikki 6 korttia.');
  });
});

describe('CatalogView search and filters: keyboard', () => {
  it('clears the search field with Esc and keeps focus there', async () => {
    renderView();

    await userEvent.type(searchBox(), 'silver');
    await userEvent.keyboard('{Escape}');

    expect(searchBox()).toHaveValue('');
    expect(searchBox()).toHaveFocus();
    expect(rowNames()).toHaveLength(6);
  });

  it('does not submit the form on Enter, and a submit never reloads the page', async () => {
    renderView();
    const submit = vi.fn();
    // React listens at the root container, so a document listener runs after React's handler.
    const listener = (event: Event) => submit(event.defaultPrevented);
    document.addEventListener('submit', listener);

    try {
      await userEvent.type(searchBox(), 'v{Enter}');
      expect(submit).not.toHaveBeenCalled();
      expect(searchBox()).toHaveValue('v');

      fireEvent.submit(screen.getByRole('search'));
      expect(submit).toHaveBeenCalledTimes(1);
      expect(submit).toHaveBeenCalledWith(true);
    } finally {
      document.removeEventListener('submit', listener);
    }
  });
});

describe('CatalogView search and filters: live region', () => {
  // fireEvent instead of user-event here: Testing Library's async wrapper waits for a real
  // setTimeout(0), which never fires under Vitest's fake timers.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const typeText = (value: string) => fireEvent.change(searchBox(), { target: { value } });
  const wait = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it('announces once, 750 ms after the last keystroke, while the status line updates at once', () => {
    const { container } = renderView();
    expect(liveRegion()).toHaveTextContent('6 korttia ladattu.');

    typeText('j');
    typeText('jo');
    typeText('joh');
    expect(statusText(container)).toBe('2 / 6 korttia');
    expect(liveRegion()).toHaveTextContent('6 korttia ladattu.');

    wait(ANNOUNCE_DELAY_MS - 1);
    expect(liveRegion()).toHaveTextContent('6 korttia ladattu.');
    wait(1);
    expect(liveRegion()).toHaveTextContent(/^Näytetään 2 \/ 6 korttia\.$/);
  });

  it('restarts the delay on every change', () => {
    renderView();

    typeText('v');
    wait(500);
    typeText('vi');
    wait(500);
    expect(liveRegion()).toHaveTextContent('6 korttia ladattu.');
    wait(250);
    expect(liveRegion()).toHaveTextContent(/^Näytetään 1 \/ 6 korttia\.$/);
  });

  it('announces checkbox changes with the same delay', () => {
    renderView();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Legend' }));
    expect(liveRegion()).toHaveTextContent('6 korttia ladattu.');
    wait(ANNOUNCE_DELAY_MS);
    expect(liveRegion()).toHaveTextContent(/^Näytetään 2 \/ 6 korttia\.$/);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Legend' }));
    wait(ANNOUNCE_DELAY_MS);
    expect(liveRegion()).toHaveTextContent(/^Näytetään kaikki 6 korttia\.$/);
  });

  it('announces the empty result and the return to all cards', () => {
    renderView();

    typeText('xyz');
    wait(ANNOUNCE_DELAY_MS);
    expect(liveRegion()).toHaveTextContent(/^Hakua vastaavia kortteja ei löytynyt\.$/);

    typeText('');
    wait(ANNOUNCE_DELAY_MS);
    expect(liveRegion()).toHaveTextContent(/^Näytetään kaikki 6 korttia\.$/);
  });

  it('announces the clear button at once', () => {
    renderView();

    typeText('xyz');
    fireEvent.click(screen.getByRole('button', { name: 'Tyhjennä haku ja suodattimet' }));

    expect(liveRegion()).toHaveTextContent(/^Näytetään kaikki 6 korttia\.$/);
    wait(ANNOUNCE_DELAY_MS * 2);
    expect(liveRegion()).toHaveTextContent(/^Näytetään kaikki 6 korttia\.$/);
  });

  it('does not repeat an announcement when the result stays the same', async () => {
    renderView();

    typeText('johnny');
    wait(ANNOUNCE_DELAY_MS);
    const region = liveRegion();
    expect(region).toHaveTextContent('Näytetään 2 / 6 korttia.');

    const changes: string[] = [];
    const observer = new MutationObserver(() => changes.push(region.textContent ?? ''));
    observer.observe(region, { childList: true, subtree: true, characterData: true });

    typeText('johnny silver');
    wait(ANNOUNCE_DELAY_MS);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Punainen' }));
    wait(ANNOUNCE_DELAY_MS);
    // Let the MutationObserver deliver its records.
    await Promise.resolve();
    observer.disconnect();

    expect(changes).toEqual([]);
    expect(region).toHaveTextContent('Näytetään 2 / 6 korttia.');
  });

  it('does not announce the unfiltered count again right after loading', () => {
    renderView();

    typeText('v');
    typeText('');
    wait(ANNOUNCE_DELAY_MS);

    expect(liveRegion()).toHaveTextContent(/^6 korttia ladattu\.$/);
  });

  it('announces at once on Enter and cancels the pending announcement', () => {
    renderView();

    typeText('judy');
    fireEvent.keyDown(searchBox(), { key: 'Enter' });

    expect(liveRegion()).toHaveTextContent(/^Näytetään 1 \/ 6 korttia\.$/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not announce on Esc in an empty field', () => {
    renderView();

    fireEvent.keyDown(searchBox(), { key: 'Escape' });

    expect(vi.getTimerCount()).toBe(0);
  });

  it('announces after Esc clears the field', () => {
    renderView();

    typeText('judy');
    wait(ANNOUNCE_DELAY_MS);
    fireEvent.keyDown(searchBox(), { key: 'Escape' });
    expect(searchBox()).toHaveValue('');
    wait(ANNOUNCE_DELAY_MS);

    expect(liveRegion()).toHaveTextContent(/^Näytetään kaikki 6 korttia\.$/);
  });

  it('says "1 kortti" when all of a single card is shown again (TXT-009)', () => {
    renderView(cards.slice(3, 4));

    typeText('xyz');
    wait(ANNOUNCE_DELAY_MS);
    typeText('');
    wait(ANNOUNCE_DELAY_MS);

    expect(liveRegion()).toHaveTextContent(/^Näytetään 1 kortti\.$/);
  });

  it('cancels a pending announcement on unmount', () => {
    const { unmount } = renderView();

    typeText('judy');
    expect(vi.getTimerCount()).toBe(1);
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits for an IME composition to end before announcing', () => {
    renderView();
    const input = searchBox();

    fireEvent.compositionStart(input);
    fireEvent.input(input, { target: { value: 'ju' }, isComposing: true });
    expect(rowNames()).toEqual(['Judy Álvarez, Braindance Prodigy']);
    expect(vi.getTimerCount()).toBe(0);
    wait(ANNOUNCE_DELAY_MS * 2);
    expect(liveRegion()).toHaveTextContent('6 korttia ladattu.');

    fireEvent.compositionEnd(input, { data: 'ju' });
    wait(ANNOUNCE_DELAY_MS);
    expect(liveRegion()).toHaveTextContent('Näytetään 1 / 6 korttia.');
  });

  it('never uses an assertive live region', () => {
    const { container } = renderView();

    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1);
    expect(container.querySelector('[aria-live="assertive"]')).toBeNull();
  });
});
