import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { toCardsByKey } from '../domain/deckRules';
import { encodeDeckShare } from '../domain/deckShare';
import { renderRoute, storedDecks, testCards } from './deckTestUtils';

// Share links (T-056).

const deck = {
  name: 'Jaettu <b>pakka</b>',
  sections: [
    {
      name: '',
      cards: [
        { card: 'l1', count: 1 },
        { card: 'u0', count: 3 },
      ],
    },
  ],
};
const data = encodeDeckShare(deck, toCardsByKey(testCards));

describe('Shared deck route', () => {
  it('shows a valid link as a report and saves it as an own deck', async () => {
    const user = userEvent.setup();
    const repositories = renderRoute(`#/jaa/${data}`);
    const report = await screen.findByRole('region', {
      name: 'Tarkistuksen tulos',
    });
    expect(within(report).getByText('3 × Unit 0')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jaettu pakka' })).toBeInTheDocument();
    // The import forms are not rendered at all (T-118, UX-118-02), not only hidden.
    expect(screen.queryByLabelText('Pakkalista')).toBeNull();
    expect(screen.queryByLabelText('Netdeck-linkki')).toBeNull();
    expect(screen.queryByLabelText('Tai valitse .txt- tai .json-tiedosto')).toBeNull();
    expect(screen.getByLabelText('Pakan nimi')).toHaveValue('Jaettu <b>pakka</b>');
    expect(document.querySelector('main b')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Tallenna omaksi pakaksi' }));
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/pakat\/./));
    expect((await repositories.decks.list()).value).toHaveLength(1);
  });

  it.each(['%%%', 'AAAA', ''])(
    'shows a plain error and a link to the decks page for invalid data "%s"',
    async (bad) => {
      renderRoute(`#/jaa/${bad}`);
      expect(await screen.findByRole('heading', { name: 'Linkki ei toimi' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Siirry Pakat-osioon' })).toHaveAttribute('href', '#/pakat');
    },
  );
});

describe('Share link button', () => {
  it('copies the link and says so, and falls back to a text field when copying fails', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderRoute(
      '#/pakat',
      createMemoryRepositories({
        initial: storedDecks([
          {
            id: 'a',
            name: 'Oma',
            cards: [
              ['l1', 1],
              ['u0', 3],
            ],
          },
        ]),
      }),
    );
    await user.click(await screen.findByRole('button', { name: 'Vie ja jaa: Oma' }));
    await user.click(screen.getByRole('button', { name: 'Jaa linkki: Oma' }));
    expect(await screen.findByText('Linkki kopioitu')).toBeInTheDocument();
    const url = writeText.mock.calls[0]?.[0] as string;
    expect(url).toBe(
      `${window.location.origin}/#/jaa/${encodeDeckShare(
        {
          name: 'Oma',
          sections: [
            {
              name: '',
              cards: [
                { card: 'l1', count: 1 },
                { card: 'u0', count: 3 },
              ],
            },
          ],
        },
        toCardsByKey(testCards),
      )}`,
    );

    writeText.mockRejectedValue(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Vie ja jaa: Oma' }));
    await user.click(screen.getByRole('button', { name: 'Jaa linkki: Oma' }));
    expect(await screen.findByLabelText('Pakan linkki')).toHaveValue(url);
  });
});
