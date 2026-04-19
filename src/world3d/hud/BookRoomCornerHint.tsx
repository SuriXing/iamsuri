import { useWorldStore } from '../store/worldStore';

/**
 * Tiny always-visible corner hint shown only inside the book room (FP).
 * Sits in the top-right under the EXIT ROOM button area but offset so
 * nothing overlaps. Tells the user how to sit AND how to leave the seat
 * (just walk away — WASD).
 */
export function BookRoomCornerHint() {
  const viewMode = useWorldStore((s) => s.viewMode);
  const fpActive = useWorldStore((s) => s.fpActive);
  const introPhase = useWorldStore((s) => s.introPhase);
  const modal = useWorldStore((s) => s.modalInteractable);

  if (viewMode !== 'book' || !fpActive || introPhase !== 'follow' || modal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 30,
        background: 'rgba(15, 12, 10, 0.72)',
        color: '#f5c678',
        border: '1px solid #b8873a',
        borderRadius: 5,
        padding: '3px 7px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
        opacity: 0.85,
      }}
    >
      <kbd style={kbd}>F</kbd> sit · <kbd style={kbd}>WASD</kbd> walk away to leave
    </div>
  );
}

const kbd: React.CSSProperties = {
  background: '#f5c678',
  color: '#1a1208',
  padding: '0 4px',
  borderRadius: 2,
  fontWeight: 800,
  fontSize: 10,
};
