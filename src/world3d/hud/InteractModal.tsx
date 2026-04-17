import { useWorldStore } from '../store/worldStore';

// Whitelist of acceptable link protocols. Anything else (javascript:,
// data:, vbscript:, ...) is dropped before render so a malformed data
// entry can't execute on click. Relative paths (starting with `/`) are
// allowed for on-site destinations.
const SAFE_LINK_RE = /^(https?:|mailto:|\/)/i;

function safeLink(raw: string | undefined): string | null {
  if (!raw) return null;
  if (!SAFE_LINK_RE.test(raw)) {
    console.warn(`[InteractModal] dropping unsafe link: ${raw}`);
    return null;
  }
  return raw;
}

export function InteractModal() {
  const modal = useWorldStore((s) => s.modalInteractable);
  const closeModal = useWorldStore((s) => s.closeModal);
  const active = modal !== null;
  const link = safeLink(modal?.link);

  return (
    <div id="interact-modal" className={'interact-modal' + (active ? ' active' : '')}>
      <button
        type="button"
        className="close-x"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          closeModal();
        }}
      >
        ✕
      </button>
      <h3 id="interact-title">{modal?.title ?? ''}</h3>
      <p id="interact-body">{modal?.body ?? ''}</p>
      {link ? (
        <a id="interact-link" href={link} target="_blank" rel="noopener noreferrer">
          Visit &rarr;
        </a>
      ) : (
        <a id="interact-link" href="#" style={{ display: 'none' }}>
          Visit &rarr;
        </a>
      )}
      <div className="close-hint">Press ESC, click ✕, or click anywhere to close</div>
    </div>
  );
}
