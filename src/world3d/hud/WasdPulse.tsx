import { useEffect, useState } from 'react';
import { useWorldStore } from '../store/worldStore';

const SS_KEY = 'suriworld:wasdPulseShown';

/**
 * P3 — first-load WASD onboarding. Pulses a centered keyboard diagram
 * for ~3.5s after the intro dialogue ends, then hides itself. Gated
 * by sessionStorage so it only ever fires once per browser tab.
 *
 * Pointer-events: none — never blocks input.
 */
export function WasdPulse() {
  const introPhase = useWorldStore((s) => s.introPhase);
  const fpActive = useWorldStore((s) => s.fpActive);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (introPhase !== 'follow') return;
    if (fpActive) return;
    try {
      if (sessionStorage.getItem(SS_KEY)) return;
    } catch {
      /* sessionStorage may be blocked — fall through and show anyway */
    }
    setVisible(true);
    try {
      sessionStorage.setItem(SS_KEY, '1');
    } catch {
      /* noop */
    }
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [introPhase, fpActive]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '38%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 50,
        animation: 'wasdPulse 1.0s ease-in-out infinite',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 44px)',
          gridTemplateRows: 'repeat(2, 44px)',
          gap: '4px',
          justifyContent: 'center',
        }}
      >
        <span />
        <Key letter="W" />
        <span />
        <Key letter="A" />
        <Key letter="S" />
        <Key letter="D" />
      </div>
      <div
        style={{
          marginTop: '12px',
          padding: '6px 14px',
          background: 'rgba(20, 14, 10, 0.85)',
          color: '#f5c678',
          border: '1px solid #b8873a',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          display: 'inline-block',
        }}
      >
        WASD or arrow keys to walk
      </div>
    </div>
  );
}

function Key({ letter }: { letter: string }) {
  return (
    <div
      style={{
        background: 'rgba(20, 14, 10, 0.9)',
        border: '2px solid #f5c678',
        borderRadius: '6px',
        color: '#f5c678',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '20px',
        boxShadow: '0 0 12px rgba(245, 198, 120, 0.55)',
      }}
    >
      {letter}
    </div>
  );
}
