import { BackButton } from './BackButton';
import { BottomHint } from './BottomHint';
import { Crosshair } from './Crosshair';
import { ExitHint } from './ExitHint';
import { IntroHint } from './IntroHint';
import { InteractModal } from './InteractModal';
import { InteractTooltip } from './InteractTooltip';
import { RoomOverlays } from './RoomOverlays';
import { ThemeToggle } from './ThemeToggle';
import { ViewSwitcher } from './ViewSwitcher';

export function Hud() {
  return (
    <>
      {/* Title — kept top-left like the legacy #overlay */}
      <div id="overlay">
        <h1>Suri's Lab</h1>
        <p>A 3D Explorable World</p>
      </div>

      <BottomHint />
      <RoomOverlays />
      <BackButton />
      <ExitHint />
      <Crosshair />
      <InteractTooltip />
      <InteractModal />
      <IntroHint />
      <ThemeToggle />
      <ViewSwitcher />
    </>
  );
}
