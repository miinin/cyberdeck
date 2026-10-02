import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import { CatalogView } from './CatalogView';

function card(name: string, subname: string | null, key: string): Card {
  return {
    id: `id-${key}`,
    slug: key,
    name,
    subname,
    displayName: subname ? `${name} — ${subname}` : name,
    type: 'Legend',
    color: 'Red',
    cost: null,
    key,
  };
}

// v-streetkid has an imported image; "no-image" has none (placeholder).
const withImage = card('V', 'Streetkid', 'v-streetkid');
const withoutImage = card('Missing', null, 'no-image');

function renderView() {
  return render(<CatalogView cards={[withImage, withoutImage]} repositories={createMemoryRepositories()} />);
}

const rowOf = (name: string) => screen.getByRole('rowheader', { name: new RegExp(`^${name}`) }).closest('tr') as HTMLElement;
const thumbnailButton = () => screen.getByRole('button', { name: /^Suurenna kuva: V/ });
const dialog = () => document.querySelector('dialog.card-dialog') as HTMLDialogElement;

describe('Card images (T-027)', () => {
  it('shows a lazy, decorative thumbnail inside a button named after the card', () => {
    renderView();
    const button = thumbnailButton();
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveTextContent('Suurenna kuva: V, Streetkid');
    const image = within(button).getByRole('presentation', { hidden: true }) as HTMLImageElement;
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('width', '160');
    expect(image).toHaveAttribute('height', '224');
    expect(image.getAttribute('src')).toMatch(/v-streetkid.*\.webp$/);
  });

  it('shows a hidden placeholder and no button for a card without an image or a failed load', () => {
    const { container } = renderView();
    const missingRow = rowOf('Missing');
    expect(within(missingRow).queryByRole('button', { name: /Suurenna/ })).toBeNull();
    expect(missingRow.querySelector('.card-image--missing')).toHaveAttribute('aria-hidden', 'true');

    const thumbnail = container.querySelector('img.card-image') as HTMLImageElement;
    fireEvent.error(thumbnail);
    expect(screen.queryByRole('button', { name: /Suurenna/ })).toBeNull();
    expect(rowOf('V').querySelector('.card-image--missing')).not.toBeNull();
  });

  it('opens the large image in a dialog and returns focus to the thumbnail on "Sulje"', async () => {
    const user = userEvent.setup();
    renderView();
    expect(dialog().open).toBe(false);

    await user.click(thumbnailButton());
    expect(dialog().open).toBe(true);
    expect(dialog()).toHaveAttribute('aria-labelledby', 'card-dialog-title');
    expect(within(dialog()).getByRole('heading', { level: 2 })).toHaveTextContent('V, Streetkid');
    const large = within(dialog()).getByRole('img', { name: 'V, Streetkid' });
    expect(large).toHaveAttribute('width', '720');
    expect(large.getAttribute('src')).toMatch(/v-streetkid.*\.webp$/);
    expect(large.getAttribute('src')).not.toBe(
      (thumbnailButton().querySelector('img') as HTMLImageElement).getAttribute('src'),
    );

    await user.click(within(dialog()).getByRole('button', { name: 'Sulje' }));
    expect(dialog().open).toBe(false);
    expect(within(dialog()).queryByRole('img')).toBeNull();
    expect(thumbnailButton()).toHaveFocus();
  });

  it('closes on a click on the backdrop but not on the content', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(thumbnailButton());

    await user.click(within(dialog()).getByRole('img'));
    expect(dialog().open).toBe(true);
    fireEvent.click(dialog());
    expect(dialog().open).toBe(false);
  });

  it('tells when the large image cannot be loaded', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(thumbnailButton());

    fireEvent.error(within(dialog()).getByRole('img'));
    expect(within(dialog()).getByRole('alert')).toHaveTextContent('Kuvaa ei voitu ladata.');
  });
});
