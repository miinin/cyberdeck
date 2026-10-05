import { act, renderHook, waitFor } from '@testing-library/react';
import { createMemoryRepositories } from '../storage';
import { useWants } from './useWants';

describe('useWants', () => {
  it('loads the want list, saves a count and keeps it apart from the collection', async () => {
    const repositories = createMemoryRepositories();
    const { result } = renderHook(() => useWants(repositories.wants));
    await waitFor(() => expect(result.current.snapshot.phase).toBe('ready'));
    expect(result.current.snapshot.saved.entries).toEqual([]);

    act(() => result.current.store.setCount('detonate', 3));
    await waitFor(() => expect(result.current.snapshot.saved.entries).toEqual([{ card: 'detonate', count: 3 }]));
    expect((await repositories.wants.load()).value.entries).toEqual([{ card: 'detonate', count: 3 }]);
    expect((await repositories.collection.load()).value.entries).toEqual([]);
  });

  it('shows a want list from a newer version as locked', async () => {
    const repositories = createMemoryRepositories({
      initial: { 'cyberdeck:wants': JSON.stringify({ schemaVersion: 2, savedAt: '2026-10-01T00:00:00.000Z', data: {} }) },
    });
    const { result } = renderHook(() => useWants(repositories.wants));
    await waitFor(() => expect(result.current.snapshot.phase).toBe('locked'));
  });
});
