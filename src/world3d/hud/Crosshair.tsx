import { useWorldStore } from '../store/worldStore';

export function Crosshair() {
  const fpActive = useWorldStore((s) => s.fpActive);
  return <div id="crosshair" className={'crosshair' + (fpActive ? ' active' : '')} />;
}
