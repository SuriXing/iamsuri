import { BackButton } from './BackButton';
import { BookRoomCornerHint } from './BookRoomCornerHint';
import { BottomHint } from './BottomHint';
import { Crosshair } from './Crosshair';
import { Dialogue } from './Dialogue';
import { ExitHint } from './ExitHint';
import { IntroHint } from './IntroHint';
import { InteractModal } from './InteractModal';
import { InteractTooltip } from './InteractTooltip';
import { PerspectiveTransition } from './PerspectiveTransition';
import { RoomEntryToast } from './RoomEntryToast';
import { RoomOverlays } from './RoomOverlays';
import { ThemeToggle } from './ThemeToggle';
import { ViewSwitcher } from './ViewSwitcher';
import { WasdPulse } from './WasdPulse';
import { PROJECT_LINKS } from '../../data/links';
import '../../components/shared/ProjectsDock.css';
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
      <PerspectiveTransition />
      <BookRoomCornerHint />
      <WasdPulse />
      {/* Project quick-access (BLOG / ANONCAFE / Mentor Table). Hidden
          while inside a room so it doesn't overlap EXIT ROOM + panels.
          Inlined here (instead of importing ProjectsDock) so the 3D
          chunk doesn't force its PROJECT_LINKS / CSS out into a shared
          2D-landing cold-path chunk. */}
      {!inRoom && !introActive && (
        <nav className="projects-dock" aria-label="External projects">
          <ul>
            {PROJECT_LINKS.map((p) => {
              const isExternal = /^https?:\/\//.test(p.href);
              return (
                <li key={p.id}>
                  <a
                    href={p.href}
                    {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    style={{ ['--hue' as string]: p.hue }}
                    title={p.description}
                  >
                    <span className="dot" aria-hidden />
                    <span className="label">{p.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
