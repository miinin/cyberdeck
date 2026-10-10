import { useEffect, useRef, useState } from 'react';

/** Gallery card size (T-123): session state, never saved. */
export type GallerySize = 'normal' | 'large' | 'huge';

export const GALLERY_OPEN_ID = 'gallery-open';

/**
 * Open/closed state of the gallery (T-123). The gallery is session state and is not saved. Opening pushes one
 * history entry with the same URL, so the browser's Back button closes the gallery; every other way to close
 * goes through `history.back()` as well, so the entry is never left behind. The size is kept while the page lives.
 * While open, `<html data-gallery="on">` lets the stylesheet give the whole page the dark gallery ground, and
 * `onChange` lets the app hide its header and footer. On close the scroll position and the focus return.
 */
export function useGallery(onChange?: (open: boolean) => void) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<GallerySize>('normal');
  const pushed = useRef(false);
  const scrollY = useRef(0);
  const wasOpen = useRef(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      setOpen(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    onChangeRef.current?.(open);
    if (open) {
      document.documentElement.setAttribute('data-gallery', 'on');
      document.documentElement.scrollTop = 0;
    } else {
      document.documentElement.removeAttribute('data-gallery');
      if (wasOpen.current) {
        // The page is back: the same place, and the focus on the button that opened the gallery.
        document.documentElement.scrollTop = scrollY.current;
        document.getElementById(GALLERY_OPEN_ID)?.focus({ preventScroll: true });
      }
    }
    wasOpen.current = open;
  }, [open]);

  // Leaving the page with the gallery open must give the header back.
  useEffect(
    () => () => {
      document.documentElement.removeAttribute('data-gallery');
      onChangeRef.current?.(false);
    },
    [],
  );

  const openGallery = () => {
    scrollY.current = document.documentElement.scrollTop;
    try {
      window.history.pushState({ gallery: true }, '');
      pushed.current = true;
    } catch {
      pushed.current = false;
    }
    setOpen(true);
  };
  const closeGallery = () => {
    if (pushed.current) window.history.back();
    else setOpen(false);
  };

  return { open, size, setSize, openGallery, closeGallery };
}
