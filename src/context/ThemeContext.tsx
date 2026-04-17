import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useWorldStore } from '../world3d/store/worldStore';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('suri-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('suri-theme', theme);
    // Keep the 3D world store in sync so `body.world3d-light-theme` and
    // the 3D scene colors follow the 2D toggle without a reload. The
    // two systems previously drifted within a single session even though
    // they read the same localStorage key on cold boot.
    if (useWorldStore.getState().theme !== theme) {
      useWorldStore.getState().toggleTheme();
    }
  }, [theme]);

  // Reverse direction: when the 3D HUD ThemeToggle flips the world store,
  // mirror the change back into the 2D context (and therefore <html>).
  useEffect(() => {
    const unsub = useWorldStore.subscribe((s, prev) => {
      if (s.theme !== prev.theme && s.theme !== theme) {
        setTheme(s.theme);
      }
    });
    return unsub;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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
