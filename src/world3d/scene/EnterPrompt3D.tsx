import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../store/worldStore';
import { ROOM_BY_ID } from '../data/rooms';

/**
 * The "Press U/E to unlock/enter" floating prompt. Lives inside the Canvas
 * because it's anchored to a world position via drei `<Html>`. The DOM is
 * always mounted (`<div id="enter-prompt">`) — the `.active` class is
 * toggled imperatively in `useFrame` to mirror the legacy behaviour without
 * causing React re-renders every frame.
 */
export function EnterPrompt3D() {
  const groupRef = useRef<THREE.Group>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLElement>(null);
  const verbRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    const s = useWorldStore.getState();
    const el = elRef.current;
    if (!el) return;

    const showable =
      s.viewMode === 'overview' && !s.fpActive && s.nearbyRoom !== null;
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
      // Anchor above the door so the prompt sits over the entrance, not the
      // back wall. Looks far more natural when approaching the room.
      groupRef.current.position.set(room.door.x, 2.4, room.door.z);
    }

    const locked = !s.unlockedDoors.has(id);
    if (keyRef.current) keyRef.current.textContent = locked ? 'U' : 'E';
    if (verbRef.current) verbRef.current.textContent = locked ? 'unlock' : 'enter';
    if (nameRef.current) nameRef.current.textContent = room.label;

    if (!el.classList.contains('active')) el.classList.add('active');
    if (locked) el.classList.add('locked');
    else el.classList.remove('locked');
  });

  return (
    <group ref={groupRef} position={[0, 3, 0]}>
      <Html center zIndexRange={[55, 0]} pointerEvents="none">
        <div id="enter-prompt" ref={elRef} className="enter-prompt">
          Press <kbd id="enter-prompt-key" ref={keyRef}>E</kbd> to{' '}
          <span id="enter-prompt-verb" ref={verbRef}>enter</span>{' '}
          <span id="enter-prompt-name" ref={nameRef}>Room</span>
        </div>
      </Html>
    </group>
  );
}
