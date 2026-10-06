import { useEffect } from 'react';

/**
 * Asks search engines not to index the view while it is shown (T-098, SR-41, K-P12). The app is one page with
 * hash routes, so the tag is added on entering a public view and removed on leaving it.
 */
export function useNoIndex(): void {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}
