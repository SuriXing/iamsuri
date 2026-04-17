import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Storage keys used by both halves of the app. The 3D world store reads
// the same key on boot; ThemeSync (mounted inside lazy App3D) mirrors
// changes in both directions. Keeping this file worldStore-free prevents
// the 2D landing chunk from pulling the 3D bundle.
const STORAGE_KEY = 'suri-theme';

// Simple cross-listener bus so ThemeSync can observe context changes
// without importing the context directly (would re-introduce the cycle).
const THEME_EVENT = 'suri-theme-change';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
  }, [theme]);

  // Accept external (3D-side) theme changes. ThemeSync dispatches the
  // same event when the world store flips so the two stay aligned.
  useEffect(() => {
    const onExternal = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail;
      if (next === 'dark' || next === 'light') {
        setTheme((prev) => (prev === next ? prev : next));
      }
    };
    window.addEventListener(THEME_EVENT, onExternal);
    return () => window.removeEventListener(THEME_EVENT, onExternal);
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Exported so the 3D side (lazy-loaded) can hook into the same event bus
// without importing the context itself.
export const THEME_CHANGE_EVENT = THEME_EVENT;
