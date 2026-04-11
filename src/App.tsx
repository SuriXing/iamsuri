import { useState } from 'react';
import ThemeToggle from './components/shared/ThemeToggle';

export default function App() {
  const [_activeRoom, _setActiveRoom] = useState<string | null>(null);

  return (
    <>
      <ThemeToggle />
      <div style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Theme system working — floor plan coming next</p>
      </div>
    </>
  );
}
