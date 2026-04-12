import './ViewSwitcher.css';

export default function ViewSwitcher() {
  return (
    <a
      className="view-switcher"
      href={`${import.meta.env.BASE_URL}3d-world.html`}
      title="Switch to 3D world"
      aria-label="Switch to 3D world"
    >
      3D
    </a>
  );
}
