import './ViewSwitcher.css';

interface Props {
  onClick: () => void;
}

/**
 * Top-right button on the 2D landing page. Clicking flips the top-level
 * `view` state to `'3d'`, which lazy-loads the R3F world.
 */
export default function ViewSwitcher({ onClick }: Props) {
  return (
    <button
      type="button"
      className="view-switcher"
      onClick={onClick}
      title="Switch to 3D world"
      aria-label="Switch to 3D world"
    >
      3D
    </button>
  );
}
