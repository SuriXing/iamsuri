import { useEffect, useState } from 'react';
import { useWorldStore } from '../store/worldStore';

const STORAGE_KEY = 'suri-interact-hint-shown';

function readShown(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeShown() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function InteractTooltip() {
  const focused = useWorldStore((s) => s.focusedInteractable);
  const modal = useWorldStore((s) => s.modalInteractable);
  const fpActive = useWorldStore((s) => s.fpActive);

  // Lazy init from sessionStorage; this state never causes re-renders after
  // the first set because subsequent focuses short-circuit on `shown`.
  const [shown, setShown] = useState<boolean>(readShown);
  const [hintVisible, setHintVisible] = useState(false);

  // Derive first-focus trigger during render (no effect, no ref).
  const shouldShow = fpActive && !!focused && !modal && !shown;
  if (shouldShow && !hintVisible) {
    writeShown();
    setShown(true);
    setHintVisible(true);
  }

  // Auto-dismiss after 2.5s once visible.
  useEffect(() => {
    if (!hintVisible) return;
    const t = window.setTimeout(() => setHintVisible(false), 2500);
    return () => window.clearTimeout(t);
  }, [hintVisible]);

  // Dismiss on first E press while visible.
  useEffect(() => {
    if (!hintVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e') setHintVisible(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hintVisible]);

  const active = fpActive && hintVisible && focused !== null && modal === null;

  return (
    <div id="interact-tooltip" className={'interact-tooltip' + (active ? ' active' : '')}>
      Press <kbd>E</kbd> to interact
    </div>
  );
}
