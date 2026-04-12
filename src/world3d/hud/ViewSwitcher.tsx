import { useExitTo2D } from '../exitContext';

export function ViewSwitcher() {
  const exit = useExitTo2D();
  return (
    <button
      type="button"
      id="view-switcher"
      onClick={() => exit?.()}
      title="Switch to 2D world"
      aria-label="Switch to 2D world"
    >
      2D
    </button>
  );
}
