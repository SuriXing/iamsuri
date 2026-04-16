import { BackButton } from './BackButton';
import { BottomHint } from './BottomHint';
import { Crosshair } from './Crosshair';
import { Dialogue } from './Dialogue';
import { ExitHint } from './ExitHint';
import { IntroHint } from './IntroHint';
import { InteractModal } from './InteractModal';
import { InteractTooltip } from './InteractTooltip';
import { RoomEntryToast } from './RoomEntryToast';
import { RoomOverlays } from './RoomOverlays';
import { ThemeToggle } from './ThemeToggle';
import { ViewSwitcher } from './ViewSwitcher';
import { useWorldStore } from '../store/worldStore';

export function Hud() {
  const inRoom = useWorldStore((s) => s.viewMode !== 'overview');
  const introActive = useWorldStore((s) => s.introPhase !== 'follow');

  return (
    <>
      {/* Title — kept top-left like the legacy #overlay. Hidden in room
          view so it doesn't clip behind the EXIT ROOM button. */}
      {!inRoom && (
        <div id="overlay">
          <h1>Suri's Lab</h1>
          <p>A 3D Explorable World</p>
        </div>
      )}

      {!introActive && <BottomHint />}
      <RoomOverlays />
      <BackButton />
      <ExitHint />
      <Crosshair />
      <InteractTooltip />
      <InteractModal />
      <RoomEntryToast />
      <IntroHint />
      <Dialogue />
      <ThemeToggle />
      <ViewSwitcher />
    </>
  );
}
