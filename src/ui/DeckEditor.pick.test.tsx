import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { createMemoryRepositories } from '../storage';
import { PREVIEW_DELAY_MS } from './CardHoverPreview';
import { CHANGE_ANNOUNCE_MS } from './DeckEditor';
import { card, storedDecks, testCards } from './deckTestUtils';

// T-050b: the result picker's gestures, the change announcement and the hover preview.

// "v-streetkid" has a real image, so the hover preview has something to show.
const withImage = card('v-streetkid', { name: 'V', subname: 'Streetkid', displayName: 'V — Streetkid' });

async function openEditor(cardsInDeck: [string, number][]) {
  window.location.hash = '#/pakat/a';
  const repositories = createMemoryRepositories({
    initial: storedDecks([{ id: 'a', name: 'Oma pakka', cards: cardsInDeck }]),
  });
  render(<App cards={[...testCards, withImage]} repositories={repositories} />);
  await screen.findByRole('heading', { level: 1, name: 'Oma pakka' });
  return repositories;
}

const table = () => screen.getByRole('table', { name: 'Hakutulokset' });
const rowOf = (name: string) => within(table()).getByText(name, { selector: '.pick-name' }).closest('tr') as HTMLElement;
const countIn = (row: HTMLElement) => within(row).getByText(/^Pakassa \d+$/).textContent;

afterEach(() => {
  vi.useRealTimers();
});

describe('Deck editor result picker', () => {
  it('shows the results as a table with one card per row and the game columns', async () => {
    await openEditor([]);
    const headers = within(table()).getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual(['Kuva', 'Cost', 'Nimi', 'Tyyppi', 'Power', 'RAM', 'Rarity', 'Pakassa']);
    expect(within(rowOf('Unit 3')).getByRole('rowheader')).toHaveTextContent('Unit 3');
    expect(screen.getByRole('radio', { name: 'Rivit' })).toBeChecked();
    expect(screen.getByText(/Oikea napsautus tai Shift\+napsautus poistaa/)).toBeInTheDocument();
  });

  it('adds with a click on the row, removes with Shift+click and right click', async () => {
    await openEditor([]);
    fireEvent.click(rowOf('Unit 3'));
    fireEvent.click(rowOf('Unit 3'));
    expect(countIn(rowOf('Unit 3'))).toBe('Pakassa 2');
    fireEvent.click(rowOf('Unit 3'), { shiftKey: true });
    expect(countIn(rowOf('Unit 3'))).toBe('Pakassa 1');
    // Right click removes and keeps the browser menu away only while there is something to remove.
    expect(fireEvent.contextMenu(rowOf('Unit 3'))).toBe(false);
    expect(countIn(rowOf('Unit 3'))).toBe('Pakassa 0');
    expect(fireEvent.contextMenu(rowOf('Unit 3'))).toBe(true);
    expect(countIn(rowOf('Unit 3'))).toBe('Pakassa 0');
  });

  it('a click on a button in the row does only what the button does', async () => {
    await openEditor([]);
    fireEvent.click(within(rowOf('V')).getByRole('button', { name: 'Lisää pakkaan: V — Streetkid' }));
    expect(countIn(rowOf('V'))).toBe('Pakassa 1');
    fireEvent.click(within(rowOf('V')).getByRole('button', { name: 'Suurenna kuva: V, Streetkid' }));
    expect(countIn(rowOf('V'))).toBe('Pakassa 1');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('adds with + or = and removes with - while focus is in the row', async () => {
    await openEditor([]);
    const plus = within(rowOf('Unit 3')).getByRole('button', { name: 'Lisää pakkaan: Unit 3' });
    expect(plus).toHaveAttribute('aria-keyshortcuts', '+');
    fireEvent.keyDown(plus, { key: '+' });
    fireEvent.keyDown(plus, { key: '=' });
    expect(countIn(rowOf('Unit 3'))).toBe('Pakassa 2');
    fireEvent.keyDown(plus, { key: '-' });
    expect(countIn(rowOf('Unit 3'))).toBe('Pakassa 1');
    // Other keys and shortcuts with Ctrl are left alone.
    fireEvent.keyDown(plus, { key: '+', ctrlKey: true });
    fireEvent.keyDown(plus, { key: 'a' });
    expect(countIn(rowOf('Unit 3'))).toBe('Pakassa 1');
  });

  it('marks a blocked row with a short label and keeps the full reason as the description', async () => {
    await openEditor([['l1', 1]]);
    const row = rowOf('L1');
    expect(row).toHaveTextContent('Sama Legend');
    const add = within(row).getByRole('button', { name: 'Lisää pakkaan: L1' });
    expect(add).toHaveAccessibleDescription('Pakassa on jo Legend L1.');
    expect(rowOf('Big')).toHaveTextContent('Ylittää rajan');
  });

  it('shows no block marks on the main deck rows of an empty deck (T-052)', async () => {
    await openEditor([]);
    for (const name of ['Unit 0', 'Unit 13', 'Big']) expect(rowOf(name)).not.toHaveTextContent('Ylittää rajan');
    expect(within(table()).queryByText('Ylittää rajan')).not.toBeInTheDocument();
  });

  it('filters by Cost, Power and RAM and shows the choices as removable chips (T-052)', async () => {
    await openEditor([]);
    const ramGroup = screen.getByRole('group', { name: 'RAM' });
    expect(within(ramGroup).getAllByRole('checkbox').map((box) => box.getAttribute('value'))).toEqual(['1', '2', '4+']);
    fireEvent.click(within(ramGroup).getByRole('checkbox', { name: '4+' }));
    expect(within(table()).getAllByRole('rowheader').map((th) => th.querySelector('.pick-name')?.textContent)).toEqual([
      'Big',
    ]);
    const chip = screen.getByRole('button', { name: 'Poista suodatin: RAM 4+' });
    fireEvent.click(chip);
    expect(within(ramGroup).getByRole('checkbox', { name: '4+' })).not.toBeChecked();
    expect(rowOf('Unit 3')).toBeInTheDocument();
  });

  it('gives a same-name Legend the same reason as its mark, also with three Legends (UX-045)', async () => {
    await openEditor([['l1', 1], ['l2', 1], ['l3', 1]]);
    const row = rowOf('L1');
    expect(row).toHaveTextContent('Sama Legend');
    expect(within(row).getByRole('button', { name: 'Lisää pakkaan: L1' })).toHaveAccessibleDescription(
      'Pakassa on jo Legend L1.',
    );
  });

  it('"Siirry pakkaan" skips from the results to the deck (UX-044)', async () => {
    await openEditor([]);
    fireEvent.click(screen.getByRole('button', { name: 'Siirry pakkaan' }));
    expect(screen.getByRole('heading', { level: 2, name: /pakan kortit/ })).toHaveFocus();
  });

  it('marks a row that is in the deck', async () => {
    await openEditor([['u3', 1]]);
    expect(rowOf('Unit 3')).toHaveClass('is-in-deck');
    expect(rowOf('Unit 4')).not.toHaveClass('is-in-deck');
  });

  it('announces the last change once after a short pause', async () => {
    await openEditor([]);
    vi.useFakeTimers();
    const live = document.querySelector('p[aria-live="polite"].visually-hidden') as HTMLElement;
    fireEvent.click(rowOf('Unit 3'));
    fireEvent.click(rowOf('Unit 3'));
    act(() => vi.advanceTimersByTime(CHANGE_ANNOUNCE_MS - 1));
    expect(live).toHaveTextContent('');
    act(() => vi.advanceTimersByTime(1));
    expect(live).toHaveTextContent('Unit 3: 2 pakassa. Pääpakka 2 korttia.');
    fireEvent.click(rowOf('L2'));
    act(() => vi.advanceTimersByTime(CHANGE_ANNOUNCE_MS));
    expect(live).toHaveTextContent('L2: 1 pakassa. Legendejä 1/3.');
  });

  it('shows "Tallennettu" in the status region but not the in-between save states', async () => {
    await openEditor([]);
    fireEvent.click(rowOf('Unit 3'));
    const pending = screen.getByText(/Muutokset tallennetaan/);
    expect(pending).toHaveAttribute('aria-hidden', 'true');
    expect(pending.closest('[role="status"]')).toBeNull();
    const saved = await screen.findByText('Tallennettu');
    expect(saved).toHaveAttribute('role', 'status');
  });

  it('shows a bigger image after the mouse rests on a row, and Esc closes it', async () => {
    await openEditor([]);
    vi.useFakeTimers();
    const row = rowOf('V');
    fireEvent.pointerEnter(row, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(PREVIEW_DELAY_MS - 1));
    expect(document.querySelector('.card-hover-preview')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    const image = document.querySelector('.card-hover-preview');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('aria-hidden', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.card-hover-preview')).toBeNull();
  });

  it('Kortit table: the same preview on a mouse hover (T-052)', async () => {
    window.location.hash = '#/';
    const repositories = createMemoryRepositories();
    render(<App cards={[...testCards, withImage]} repositories={repositories} />);
    fireEvent.click(await screen.findByRole('radio', { name: 'Taulukko' }));
    vi.useFakeTimers();
    const row = screen.getByText('Streetkid', { selector: '.card-subname' }).closest('tr') as HTMLElement;
    fireEvent.pointerEnter(row, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(PREVIEW_DELAY_MS));
    expect(document.querySelector('.card-hover-preview')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.card-hover-preview')).toBeNull();
  });

  it('hides the preview when the mouse leaves, and never opens it for touch', async () => {
    await openEditor([]);
    vi.useFakeTimers();
    const row = rowOf('V');
    fireEvent.pointerEnter(row, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(PREVIEW_DELAY_MS));
    expect(document.querySelector('.card-hover-preview')).not.toBeNull();
    fireEvent.pointerLeave(row, { pointerType: 'mouse' });
    expect(document.querySelector('.card-hover-preview')).toBeNull();
    fireEvent.pointerEnter(row, { pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(PREVIEW_DELAY_MS));
    expect(document.querySelector('.card-hover-preview')).toBeNull();
  });

  it('Kuvat: image size, Shift+click and right click on the card remove, and the preview only at Pieni', async () => {
    await openEditor([['v-streetkid', 2]]);
    fireEvent.click(screen.getByRole('radio', { name: 'Kuvat' }));
    expect(screen.getByRole('radio', { name: 'Normaali' })).toBeChecked();
    const list = screen.getByRole('list', { name: 'Lisää kortteja' });
    const image = within(list).getAllByRole('button', { name: 'Lisää pakkaan: V — Streetkid' })[0] as HTMLElement;
    const item = image.closest('li') as HTMLElement;
    fireEvent.click(image, { shiftKey: true });
    expect(within(item).getByText('Pakassa 1')).toBeInTheDocument();
    expect(fireEvent.contextMenu(item)).toBe(false);
    expect(within(item).getByText('Pakassa 0')).toBeInTheDocument();

    vi.useFakeTimers();
    fireEvent.pointerEnter(item, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(PREVIEW_DELAY_MS));
    expect(document.querySelector('.card-hover-preview')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Pieni' }));
    expect(list.closest('[data-image-size]')).toHaveAttribute('data-image-size', 'small');
    fireEvent.pointerEnter(item, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(PREVIEW_DELAY_MS));
    expect(document.querySelector('.card-hover-preview')).not.toBeNull();
  });

  it('shows the image size choice only in the Kuvat view', async () => {
    await openEditor([]);
    expect(screen.queryByRole('group', { name: 'Kuvakoko' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Kuvat' }));
    expect(screen.getByRole('group', { name: 'Kuvakoko' })).toBeInTheDocument();
  });
});
