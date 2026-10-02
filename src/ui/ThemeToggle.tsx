import { useEffect, useRef, useState } from "react";
import { StorageError } from "../storage";
import type { PreferencesRepository, Theme } from "../storage";
import { texts } from "./texts";

/** What is already painted: public/theme-init.js may have set the saved light theme before React (UX.md 8.7). */
function paintedTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Theme toggle in the header (UX.md 8). One toggle button named "Vaalea teema": pressed = light theme.
 * The device's prefers-color-scheme is ignored; dark is the default (D-012).
 */
export function ThemeToggle({
  preferences,
}: {
  preferences: PreferencesRepository;
}) {
  const [theme, setTheme] = useState<Theme>(paintedTheme);
  // A slow load must not undo a choice the user already made.
  const userChose = useRef(false);

  useEffect(() => {
    let active = true;
    // Covers pages without the init script (tests, script blocked); loadTheme never rejects.
    void preferences.loadTheme().then((saved) => {
      if (!active || userChose.current) return;
      applyTheme(saved);
      setTheme(saved);
    });
    return () => {
      active = false;
    };
  }, [preferences]);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    userChose.current = true;
    // Synchronously and before saving: a failed save keeps the theme for this session (UX.md 8.6).
    applyTheme(next);
    setTheme(next);
    preferences.saveTheme(next).catch((error: unknown) => {
      // No message to the user (T-025 A3); only the error kind, no data.
      console.warn(
        `Theme could not be saved (${error instanceof StorageError ? error.kind : "unknown"})`,
      );
    });
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={theme === "light"}
      title={
        theme === "light"
          ? texts.themeToggleTitleDark
          : texts.themeToggleTitleLight
      }
      onClick={toggle}
    >
      {/* Icon only (T-039): sun offers the light theme, moon the dark one. The name stays "Vaalea teema"
          with aria-pressed (UX.md 8.4), so screen readers hear the same toggle as before. */}
      {theme === "light" ? (
        <svg
          className="theme-toggle-icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          className="theme-toggle-icon"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="12"
            cy="12"
            r="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            fill="none"
          />
        </svg>
      )}
      <span className="visually-hidden">
        <span>{texts.themeToggleLabel}</span>{" "}
        <span>{texts.themeToggleSuffix}</span>
      </span>
    </button>
  );
}
