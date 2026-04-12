import { useWorldStore } from '../store/worldStore';

export function InteractTooltip() {
  const focused = useWorldStore((s) => s.focusedInteractable);
  const modal = useWorldStore((s) => s.modalInteractable);
  const fpActive = useWorldStore((s) => s.fpActive);
  const active = fpActive && focused !== null && modal === null;

  return (
    <div id="interact-tooltip" className={'interact-tooltip' + (active ? ' active' : '')}>
      Press <kbd>E</kbd> to interact
    </div>
  );
}
