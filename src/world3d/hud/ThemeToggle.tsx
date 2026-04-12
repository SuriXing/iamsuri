import { useWorldStore } from '../store/worldStore';

export function ThemeToggle() {
  const theme = useWorldStore((s) => s.theme);
  const toggle = useWorldStore((s) => s.toggleTheme);
  return (
    <button
      id="theme-toggle"
      type="button"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? '\u2600' : '\u263D'}
    </button>
  );
}
