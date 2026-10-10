import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';
import { BAR_IDLE_MS } from './useBarVisibility';

function card(slug: string, name: string, extra: Partial<Card> = {}): Card {
  return { id: `id-${slug}`, key: slug, slug, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 2, power: 3, ram: null, rarity: 'Common', ...extra };
}

const cards: Card[] = [
  card('alpha', 'Alpha'),
  card('beta', 'Beta', { type: 'Program', color: 'Blue' }),
  card('gamma', 'Gamma', { subname: 'Prime' }),
];

async function settle() {
  await act(async () => {
    for (let round = 0; round < 5; round += 1) await Promise.resolve();
  });
}

async function renderView(onGalleryChange?: (open: boolean) => void) {
  const repositories = createMemoryRepositories();
  await repositories.preferences.saveEditMode(false);
  render(<CatalogView cards={cards} repositories={repositories} onGalleryChange={onGalleryChange} />);
  await settle();
  return repositories;
}

const galleryButton = () => screen.getByRole('button', { name: 'Galleria' });
const grid = () => screen.queryByRole('list', { name: 'Galleria: korttien kuvitukset' });
const cardButtons = () => within(grid() as HTMLElement).getAllByRole('button');
/** The spoken names of the pictures, in order. */
const names = () => cardButtons().map((button) => button.querySelector('.visually-hidden')?.textContent);
const cardButton = (name: string) => within(grid() as HTMLElement).getByRole('button', { name });

async function openGallery(user: ReturnType<typeof userEvent.setup>) {
  await user.click(galleryButton());
  expect(grid()).toBeInTheDocument();
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Gallery (T-123): opening and closing', () => {
  it('opens from the toolbar button, shows only the pictures and moves focus to the bar', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    await renderView((open) => seen.push(open));
    expect(grid()).toBeNull();
    await openGallery(user);

    expect(names()).toEqual(['Alpha', 'Beta', 'Gamma, Prime']);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sulje galleria' })).toHaveFocus();
    expect(seen.at(-1)).toBe(true);
    expect(document.documentElement).toHaveAttribute('data-gallery', 'on');

    // Everything else of the page is gone: heading, toolbar, filters column, sort row, texts, counters and steps.
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Lista' })).toBeNull();
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.queryByText('Järjestys')).toBeNull();
    expect(screen.queryByRole('button', { name: /Lisää yksi kappale/ })).toBeNull();
    expect(screen.queryByText(/Kokoelmassa/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Galleria' })).toBeNull();
    // Cards have no visible texts, only their (spoken) names.
    expect(within(grid() as HTMLElement).queryByRole('heading')).toBeNull();
  });

  it('closes with the × button, and focus and the page return to the Galleria button', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    await renderView((open) => seen.push(open));
    await openGallery(user);
    await user.click(screen.getByRole('button', { name: 'Sulje galleria' }));
    await waitFor(() => expect(grid()).toBeNull());
    expect(galleryButton()).toHaveFocus();
    expect(seen.at(-1)).toBe(false);
    expect(document.documentElement).not.toHaveAttribute('data-gallery');
  });

  it('closes with Esc', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(grid()).toBeNull());
    expect(galleryButton()).toHaveFocus();
  });

  it('closes with the browser Back button and leaves the address alone', async () => {
    const user = userEvent.setup();
    await renderView();
    const before = window.location.href;
    await openGallery(user);
    expect(window.location.href).toBe(before);
    act(() => {
      window.history.back();
    });
    await waitFor(() => expect(grid()).toBeNull());
    expect(window.location.href).toBe(before);
  });

  it('gives the header back when the page is left with the gallery open', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    const repositories = createMemoryRepositories();
    const { unmount } = render(<CatalogView cards={cards} repositories={repositories} onGalleryChange={(open) => seen.push(open)} />);
    await settle();
    await user.click(galleryButton());
    unmount();
    expect(seen.at(-1)).toBe(false);
    expect(document.documentElement).not.toHaveAttribute('data-gallery');
  });
});

describe('Gallery (T-123): filters, search and order', () => {
  it('searches in the bar, and the search stays when the gallery closes', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.type(screen.getByRole('searchbox'), 'bet');
    expect(names()).toEqual(['Beta']);
    expect(screen.getByText('1 korttia')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sulje galleria' }));
    await waitFor(() => expect(grid()).toBeNull());
    expect(screen.getByRole('searchbox')).toHaveValue('bet');
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Beta']);
  });

  it('opens the filter panel in the page, counts the chosen filters and closes it with "Näytä N korttia"', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    await renderView();
    await openGallery(user);
    const toggle = screen.getByRole('button', { name: 'Suodattimet' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);

    // The panel is the existing filter form, without a second search field.
    const panel = screen.getByRole('search');
    expect(screen.getAllByRole('searchbox')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Piilota suodattimet' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(within(panel).getByRole('checkbox', { name: /Program/ }));
    expect(names()).toEqual(['Beta']);

    await user.click(screen.getByRole('button', { name: 'Näytä 1 kortti' }));
    expect(screen.queryByRole('search')).toBeNull();
    const closed = screen.getByRole('button', { name: 'Suodattimet (1)' });
    expect(closed).toHaveAttribute('aria-expanded', 'false');
    expect(closed).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });

  it('keeps the filters when the gallery closes', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.click(screen.getByRole('button', { name: 'Suodattimet' }));
    await user.click(within(screen.getByRole('search')).getByRole('checkbox', { name: /Program/ }));
    await user.click(screen.getByRole('button', { name: 'Sulje galleria' }));
    await waitFor(() => expect(grid()).toBeNull());
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Beta']);
  });

  it('follows the chosen order', async () => {
    const user = userEvent.setup();
    await renderView();
    await user.selectOptions(screen.getByRole('combobox', { name: /Järjestys/ }), screen.getAllByRole('option', { name: /Nimi/ })[0] as HTMLElement);
    const sortedNames = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    await openGallery(user);
    expect(names().map((name) => name?.split(',')[0])).toEqual(sortedNames.map((name) => name?.split(',')[0]));
  });

  it('says so and offers to clear the filters when nothing matches', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    expect(grid()).toBeNull();
    expect(screen.getByText('Yksikään kortti ei vastaa suodattimia.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tyhjennä suodattimet' }));
    expect(cardButtons()).toHaveLength(3);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('clears the search text with Esc before Esc closes the gallery', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.type(screen.getByRole('searchbox'), 'bet{Escape}');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(grid()).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(grid()).toBeNull());
  });

  it('has the "Kaikki versiot" switch in the filter panel and remembers the size while the page lives', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    expect(within(screen.getByRole('toolbar')).queryByRole('switch')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Suodattimet' }));
    expect(within(screen.getByRole('search')).getByRole('combobox', { name: 'Järjestys' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Kaikki versiot' })).toHaveAttribute('aria-checked', 'false');
    expect(grid()).toHaveAttribute('data-size', 'normal');
    await user.click(screen.getByRole('radio', { name: 'Valtava' }));
    expect(grid()).toHaveAttribute('data-size', 'huge');
    await user.click(screen.getByRole('button', { name: 'Sulje galleria' }));
    await waitFor(() => expect(grid()).toBeNull());
    await user.click(galleryButton());
    expect(grid()).toHaveAttribute('data-size', 'huge');
    expect(screen.getByRole('radio', { name: 'Valtava' })).toBeChecked();
  });
});

describe('Gallery (T-123): the viewer', () => {
  it('opens a card full screen with its position, steps with the buttons and the arrow keys', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.click(cardButton('Beta'));
    const viewer = screen.getByRole('dialog', { name: 'Beta' });
    expect(within(viewer).getByText(/^2 \/ 3/)).toBeInTheDocument();

    await user.click(within(viewer).getByRole('button', { name: 'Seuraava kortti' }));
    expect(screen.getByRole('dialog', { name: /Gamma/ })).toBeInTheDocument();
    expect(within(viewer).getByText(/^3 \/ 3/)).toBeInTheDocument();
    expect(within(viewer).getByRole('button', { name: 'Seuraava kortti' })).toBeDisabled();

    fireEvent.keyDown(viewer, { key: 'ArrowLeft' });
    fireEvent.keyDown(viewer, { key: 'ArrowLeft' });
    expect(within(viewer).getByText(/^1 \/ 3/)).toBeInTheDocument();
    expect(within(viewer).getByRole('button', { name: 'Edellinen kortti' })).toBeDisabled();
    fireEvent.keyDown(viewer, { key: 'ArrowLeft' });
    expect(within(viewer).getByText(/^1 \/ 3/)).toBeInTheDocument();
    fireEvent.keyDown(viewer, { key: 'ArrowRight' });
    expect(within(viewer).getByText(/^2 \/ 3/)).toBeInTheDocument();
  });

  it('steps with a swipe', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.click(cardButton('Beta'));
    const viewer = screen.getByRole('dialog', { name: 'Beta' });
    const stage = viewer.querySelector('.gallery-viewer-stage') as HTMLElement;
    fireEvent.pointerDown(stage, { clientX: 300 });
    fireEvent.pointerUp(stage, { clientX: 100 });
    expect(within(viewer).getByText(/^3 \/ 3/)).toBeInTheDocument();
    fireEvent.pointerDown(stage, { clientX: 100 });
    fireEvent.pointerUp(stage, { clientX: 110 });
    expect(within(viewer).getByText(/^3 \/ 3/)).toBeInTheDocument();
    fireEvent.pointerDown(stage, { clientX: 100 });
    fireEvent.pointerUp(stage, { clientX: 300 });
    expect(within(viewer).getByText(/^2 \/ 3/)).toBeInTheDocument();
  });

  it('closes with ×, and focus returns to the card that is shown', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.click(cardButton('Alpha'));
    const viewer = screen.getByRole('dialog', { name: 'Alpha' });
    await user.click(within(viewer).getByRole('button', { name: 'Seuraava kortti' }));
    await user.click(within(viewer).getByRole('button', { name: 'Sulje' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(cardButton('Beta')).toHaveFocus();
    // The gallery itself stays open.
    expect(grid()).toBeInTheDocument();
  });

  it('does not close the gallery with Esc while the viewer is open', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.click(cardButton('Alpha'));
    await user.keyboard('{Escape}');
    expect(grid()).toBeInTheDocument();
  });

  it('opens the card details from "Kortin tiedot" and returns to the card', async () => {
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    await user.click(cardButton('Beta'));
    await user.click(screen.getByRole('button', { name: 'Kortin tiedot' }));
    const details = await screen.findByRole('dialog', { name: 'Beta' });
    expect(within(details).getByRole('heading', { level: 3, name: /Kokoelma/ })).toBeInTheDocument();
    expect(details).not.toHaveClass('gallery-viewer');
    await user.click(within(details).getByRole('button', { name: 'Sulje' }));
    expect(cardButton('Beta')).toHaveFocus();
    expect(grid()).toBeInTheDocument();
  });
});

describe('Gallery (T-123): the floating bar', () => {
  const bar = () => screen.getByRole('toolbar');

  it('fades after 2.5 s without movement and returns on mouse movement', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderView();
    await openGallery(user);
    // Focus is in the bar at first, so it stays; moving focus out lets it fade.
    act(() => {
      (document.activeElement as HTMLElement).blur();
    });
    expect(bar()).not.toHaveClass('is-hidden');
    act(() => {
      vi.advanceTimersByTime(BAR_IDLE_MS + 100);
    });
    expect(bar()).toHaveClass('is-hidden');
    fireEvent.mouseMove(window);
    expect(bar()).not.toHaveClass('is-hidden');
  });

  it('stays while focus is in the bar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderView();
    await openGallery(user);
    expect(bar().contains(document.activeElement)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(BAR_IDLE_MS * 3);
    });
    expect(bar()).not.toHaveClass('is-hidden');
  });

  it('stays while the filter panel is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderView();
    await openGallery(user);
    await user.click(screen.getByRole('button', { name: 'Suodattimet' }));
    act(() => {
      (document.activeElement as HTMLElement).blur();
      vi.advanceTimersByTime(BAR_IDLE_MS * 3);
    });
    expect(bar()).not.toHaveClass('is-hidden');
  });

  it('returns when the page is scrolled up', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderView();
    await openGallery(user);
    act(() => {
      (document.activeElement as HTMLElement).blur();
      vi.advanceTimersByTime(BAR_IDLE_MS + 100);
    });
    expect(bar()).toHaveClass('is-hidden');
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
    fireEvent.scroll(window);
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });
    fireEvent.scroll(window);
    expect(bar()).not.toHaveClass('is-hidden');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });
});

describe('Gallery (T-123): in the app', () => {
  it('hides the header, the navigation and the footer, and gives them back on close', async () => {
    const user = userEvent.setup();
    render(<App cards={cards} repositories={createMemoryRepositories()} />);
    await settle();
    expect(screen.getByRole('banner')).toBeVisible();
    expect(screen.getByRole('navigation')).toBeVisible();
    await user.click(galleryButton());
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Sulje galleria' }));
    await waitFor(() => expect(screen.getByRole('banner')).toBeVisible());
    expect(screen.getByRole('navigation')).toBeVisible();
    expect(screen.getByRole('contentinfo')).toBeVisible();
  });
});

describe('Gallery (T-123): a phone', () => {
  afterEach(() => {
    // @ts-expect-error the test removes its own matchMedia stand-in
    delete window.matchMedia;
  });

  it('keeps only the close button, the search icon, the filters and the size in the bar', async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('37.4375rem'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
    const user = userEvent.setup();
    await renderView();
    await openGallery(user);
    const bar = screen.getByRole('toolbar');
    expect(within(bar).queryByRole('searchbox')).toBeNull();
    expect(within(bar).queryByRole('switch')).toBeNull();
    expect(within(bar).queryByText(/korttia/)).toBeNull();
    expect(within(bar).getByRole('button', { name: 'Sulje galleria' })).toBeInTheDocument();

    await user.click(within(bar).getByRole('button', { name: 'Haku' }));
    await user.type(within(bar).getByRole('searchbox'), 'bet');
    expect(names()).toEqual(['Beta']);

    // "Kaikki versiot" moves into the filter panel.
    await user.click(within(bar).getByRole('button', { name: 'Suodattimet' }));
    expect(screen.getByRole('switch', { name: 'Kaikki versiot' })).toBeInTheDocument();
    expect(within(bar).queryByRole('switch')).toBeNull();
  });
});
