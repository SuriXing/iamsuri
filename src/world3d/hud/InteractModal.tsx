import { useWorldStore } from '../store/worldStore';

export function InteractModal() {
  const modal = useWorldStore((s) => s.modalInteractable);
  const active = modal !== null;

  return (
    <div id="interact-modal" className={'interact-modal' + (active ? ' active' : '')}>
      <h3 id="interact-title">{modal?.title ?? ''}</h3>
      <p id="interact-body">{modal?.body ?? ''}</p>
      {modal?.link ? (
        <a id="interact-link" href={modal.link} target="_blank" rel="noopener noreferrer">
          Visit &rarr;
        </a>
      ) : (
        <a id="interact-link" href="#" style={{ display: 'none' }}>
          Visit &rarr;
        </a>
      )}
      <div className="close-hint">Press ESC or click anywhere to close</div>
    </div>
  );
}
