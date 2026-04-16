import { useEffect, useState } from 'react';
import { useWorldStore } from '../store/worldStore';

const SESSION_KEY = 'suri-room-toast-shown';
const VISIBLE_MS = 5500;

function readDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.sessionStorage?.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * One-shot toast that pops up the first time the user enters a room
 * (FP mode) per session. Tells them they can click on objects to read
 * more — solves the chicken-and-egg discoverability problem (the user
 * needs to know to click BEFORE clicking anything).
 *
 * Auto-dismisses after VISIBLE_MS, or immediately on click.
 */
export function RoomEntryToast() {
  const fpActive = useWorldStore((s) => s.fpActive);
  const [dismissed, setDismissed] = useState<boolean>(readDismissed);

  useEffect(() => {
    if (!fpActive || dismissed) return undefined;
    const t = setTimeout(() => {
      try {
        window.sessionStorage?.setItem(SESSION_KEY, '1');
      } catch {
        /* private mode — ignore */
      }
      setDismissed(true);
    }, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [fpActive, dismissed]);

  const handleDismiss = () => {
    try {
      window.sessionStorage?.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if (!fpActive || dismissed) return null;

  return (
    <div
      className="room-entry-toast active"
      role="status"
      aria-live="polite"
      onClick={handleDismiss}
    >
      <div className="toast-icon">💡</div>
      <div className="toast-body">
        <div className="toast-title">Click anything to read</div>
        <div className="toast-text">
          Trophies, books, posters — click on objects in the room to open their
          description. Drag to look around. <kbd>ESC</kbd> to leave the room.
        </div>
      </div>
      <div className="toast-dismiss">tap to dismiss</div>
    </div>
  );
}
