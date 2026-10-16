import { act, renderHook, waitFor } from '@testing-library/react';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { CollectionEvent, CollectionStore } from './collectionStore';
import { useWantCleanup } from './useWantCleanup';
import { useWants } from './useWants';

const card = (slug: string, name: string): Card => ({
  id: `id-${slug}`, key: slug, slug, name, subname: null, displayName: name, type: 'Unit', color: 'Red', cost: 2, power: null, ram: null, rarity: null,
});
const cards = [card('a', 'Alpha'), card('b', 'Beta'), card('c', 'Gamma')];

async function setup(wantEntries: Record<string, number>) {
  const repositories = createMemoryRepositories();
  let listener: (event: CollectionEvent) => void = () => {};
  const store = { onEvent: (fn: (event: CollectionEvent) => void) => ((listener = fn), () => {}) } as unknown as CollectionStore;
  const { result } = renderHook(() => {
    const wants = useWants(repositories.wants);
    return { wants, cleanup: useWantCleanup(store, wants, cards) };
  });
  await waitFor(() => expect(result.current.wants.snapshot.phase).toBe('ready'));
  for (const [key, n] of Object.entries(wantEntries)) act(() => result.current.wants.store.setCount(key, n));
  await waitFor(() => expect(result.current.wants.snapshot.saved.entries).toHaveLength(Object.keys(wantEntries).length));
  const emit = (event: CollectionEvent) => act(() => listener(event));
  return { result, emit };
}

describe('useWantCleanup', () => {
  it('sums added copies per card and ignores cards that are not wanted', async () => {
    const { result, emit } = await setup({ a: 3 });
    emit({ type: 'saved', card: 'a', from: 0, to: 1 });
    emit({ type: 'saved', card: 'a', from: 1, to: 2 });
    emit({ type: 'saved', card: 'b', from: 0, to: 1 });
    expect(result.current.cleanup.entries).toEqual([{ key: 'a', n: 2, name: 'Alpha' }]);
  });

  it('ignores decreases, external changes and keeps nothing after Keep', async () => {
    const { result, emit } = await setup({ a: 3 });
    emit({ type: 'saved', card: 'a', from: 2, to: 1 });
    emit({ type: 'external' });
    expect(result.current.cleanup.entries).toEqual([]);
    emit({ type: 'saved', card: 'a', from: 0, to: 1 });
    act(() => result.current.cleanup.keep());
    expect(result.current.cleanup.entries).toEqual([]);
    expect(result.current.wants.snapshot.saved.entries).toEqual([{ card: 'a', count: 3 }]);
  });

  it('reduces the want list, never below zero, and removes the row at zero', async () => {
    const { result, emit } = await setup({ a: 3, b: 1 });
    emit({ type: 'saved', card: 'a', from: 0, to: 2 });
    emit({ type: 'saved', card: 'b', from: 0, to: 4 });
    act(() => result.current.cleanup.remove());
    await waitFor(() => expect(result.current.wants.snapshot.saved.entries).toEqual([{ card: 'a', count: 1 }]));
    expect(result.current.cleanup.entries).toEqual([]);
  });
});
