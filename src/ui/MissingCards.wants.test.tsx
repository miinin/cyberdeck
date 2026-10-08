import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRepositories } from '../storage';
import { chooseImport, renderRoute, storedCollection, storedDecks } from './deckTestUtils';

const WANTS_KEY = 'cyberdeck:wants';

function storedWants(entries: [string, number][]): Record<string, string> {
  return {
    [WANTS_KEY]: JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-10-01T10:00:00.000Z',
      data: { entries: entries.map(([card, count]) => ({ card, count })) },
    }),
  };
}

const wantEntries = async (repositories: ReturnType<typeof renderRoute>) =>
  (await repositories.wants.load()).value.entries;

async function openEditor(extra: Record<string, string>) {
  const user = userEvent.setup();
  const repositories = renderRoute(
    '#/pakat/a',
    createMemoryRepositories({
      initial: { ...storedDecks([{ id: 'a', name: 'Oma pakka', cards: [['u0', 3], ['u1', 1]] }]), ...extra },
    }),
  );
  await screen.findByText('Kokoelmasta puuttuu 2 korttia.');
  await user.click(screen.getByText('Näytä puuttuvat kortit'));
  return { user, repositories };
}

describe('Add missing cards to wants (T-061b)', () => {
  it('adds the missing cards to the want list and tells the result in a live region', async () => {
    const { user, repositories } = await openEditor(storedCollection([['u0', 1], ['u1', 5]]));
    await user.click(screen.getByRole('button', { name: 'Lisää puuttuvat wantiin' }));
    expect(await screen.findByText('Lisätty 1 kortti wantiin.')).toHaveAttribute('aria-live', 'polite');
    await waitFor(async () => expect(await wantEntries(repositories)).toEqual([{ card: 'u0', count: 2 }]));
  });

  it('keeps a larger existing want and says everything is already wanted on a second press', async () => {
    const { user, repositories } = await openEditor({
      ...storedCollection([['u0', 1], ['u1', 5]]),
      ...storedWants([['u0', 5]]),
    });
    const button = screen.getByRole('button', { name: 'Lisää puuttuvat wantiin' });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    expect(await screen.findByText('Kaikki jo wantissa.')).toBeInTheDocument();
    expect(await wantEntries(repositories)).toEqual([{ card: 'u0', count: 5 }]);
  });

  it('does not count the same shortfall twice when pressed again', async () => {
    const { user } = await openEditor(storedCollection([['u0', 1], ['u1', 5]]));
    const button = screen.getByRole('button', { name: 'Lisää puuttuvat wantiin' });
    await user.click(button);
    await screen.findByText('Lisätty 1 kortti wantiin.');
    await user.click(button);
    expect(await screen.findByText('Kaikki jo wantissa.')).toBeInTheDocument();
  });

  it('is offered in the import report too', async () => {
    const user = userEvent.setup();
    const repositories = renderRoute('#/pakat', createMemoryRepositories({ initial: storedCollection([['u0', 1]]) }));
    await chooseImport(user, 'Tuo pakkalista');
    const field = screen.getByLabelText('Pakkalista');
    await user.click(field);
    await user.paste('3 Unit 0\n');
    await user.click(screen.getByRole('button', { name: 'Tarkista lista' }));
    const report = await screen.findByRole('region', { name: 'Tarkistuksen tulos' });
    await user.click(within(report).getByText('Näytä puuttuvat kortit'));
    await user.click(within(report).getByRole('button', { name: 'Lisää puuttuvat wantiin' }));
    expect(await within(report).findByText('Lisätty 1 kortti wantiin.')).toBeInTheDocument();
    await waitFor(async () => expect(await wantEntries(repositories)).toEqual([{ card: 'u0', count: 2 }]));
  });
});
