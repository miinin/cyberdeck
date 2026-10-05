import { readStoredLocale, saveStoredLocale } from './locale';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('stored locale', () => {
  it('reads nothing when nothing is saved', () => {
    expect(readStoredLocale()).toBeNull();
  });

  it('saves and reads the choice', () => {
    expect(saveStoredLocale('en')).toBe(true);
    expect(readStoredLocale()).toBe('en');
    expect(saveStoredLocale('fi')).toBe(true);
    expect(readStoredLocale()).toBe('fi');
  });

  it.each(['de', 'EN', '', '<script>'])('ignores the unknown saved value %j', (raw) => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(raw);
    expect(readStoredLocale()).toBeNull();
  });

  it('treats a blocked storage as nothing saved', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(readStoredLocale()).toBeNull();
    expect(saveStoredLocale('en')).toBe(false);
  });

  it('reports a refused save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(saveStoredLocale('en')).toBe(false);
  });
});
