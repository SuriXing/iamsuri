import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../store/worldStore';
import { ROOM_BY_ID } from '../data/rooms';

/**
 * Floating door open/close hint anchored to the nearby door. Shows
 * "Press U to open <Room>" when the door is locked, and "Press U to
 * close <Room>" when the door is unlocked. NEVER shows the "Press E
 * to enter" message — per user request, the room-entry hint was
 * removed.
 *
 * The DOM is always mounted (drei `<Html>`) — the `.active` class is
 * toggled imperatively in `useFrame` to mirror legacy behaviour without
 * causing React re-renders every frame.
 */
export function EnterPrompt3D() {
  const groupRef = useRef<THREE.Group>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const verbRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    const s = useWorldStore.getState();
    const el = elRef.current;
    if (!el) return;

    // Show whenever the player is in the corridor (viewMode === 'overview')
    // and a door is nearby. The previous `!s.fpActive` guard hid the sign
    // the moment the player started walking — first WASD press flips fpActive
    // to true, so in practice the sign only appeared during the follow-cam
    // intro and never when the user actually approached a door on foot.
    const showable =
      s.viewMode === 'overview' && s.nearbyRoom !== null;
    if (!showable) {
      if (el.classList.contains('active')) {
        el.classList.remove('active');
        el.classList.remove('locked');
      }
      return;
    }

    const id = s.nearbyRoom;
    if (id === null) return;
    const room = ROOM_BY_ID[id];
    if (groupRef.current) {
      // Float well ABOVE the doorframe (doors are ~2m tall) so the sign
      // is never occluded by the door lintel. Was y=2.4 which sat right
      // on the frame and got hidden as the player walked up to the door.
      groupRef.current.position.set(room.door.x, 3.6, room.door.z);
    }

    const locked = !s.unlockedDoors.has(id);
    // Both states use the U key — toggle.
    if (verbRef.current) verbRef.current.textContent = locked ? 'open' : 'close';
    if (nameRef.current) nameRef.current.textContent = room.label;

    if (!el.classList.contains('active')) el.classList.add('active');
    if (locked) {
      el.classList.add('locked');
      el.classList.remove('unlocked');
    } else {
      el.classList.remove('locked');
      el.classList.add('unlocked');
    }
  });

  return (
    <group ref={groupRef} position={[0, 3, 0]}>
      <Html center zIndexRange={[55, 0]} pointerEvents="none">
        <div id="enter-prompt" ref={elRef} className="enter-prompt">
          Press <kbd>U</kbd> to{' '}
          <span id="enter-prompt-verb" ref={verbRef}>open</span>{' '}
          <span id="enter-prompt-name" ref={nameRef}>Room</span>
        </div>
      </Html>
    </group>
  );
}
