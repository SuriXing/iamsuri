import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { DOOR } from '../constants';
import { useWorldStore } from '../store/worldStore';
import type { RoomId } from '../data/rooms';
import { registerCollider, unregisterCollider } from './colliders';
import { makeRng } from '../util/rand';

interface DoorProps {
  x: number;
  z: number;
  horizontal: boolean;
  roomId: RoomId;
  accentColor: string;
}

const FRAME_COLOR = '#6b4e1f';
const FRAME_EMISSIVE = '#4a2c0a';
const FRAME_TRIM_COLOR = '#3a2410'; // slightly darker than frame for trim/baseboard
const PANEL_BASE = '#4a2c0a';
const LOCK_COLOR = '#ff2244';
const CHECK_COLOR = '#22ff66';
const LANTERN_LOCKED_BODY = '#ff5544';
const LANTERN_UNLOCKED_BODY = '#ffd700';
const LANTERN_LOCKED_LIGHT = '#ff6644';
const LANTERN_UNLOCKED_LIGHT = '#ffb366';
const LANTERN_CAP_COLOR = '#666666';
const CHAIN_COLOR = '#555555';
// Outline colors — match Character.tsx convention.
const EDGE_DARK = '#0a0a14';
const EDGE_LIGHT = '#5a4830';

// Deterministic per-door seed from RoomId string.
function hashRoomId(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Small hex tint helper — deterministic, used once inside useMemo (not per-frame).
function tintHex(hex: string, delta: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + delta));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

export function Door({ x, z, horizontal, roomId, accentColor }: DoorProps) {
  const unlocked = useWorldStore((s) => s.unlockedDoors.has(roomId));
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? EDGE_DARK : EDGE_LIGHT;
  const hingeRef = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef<number>(unlocked ? DOOR.openAngle : 0);

  // Per-door deterministic wood tones for the 3-strip panel.
  const panelTints = useMemo(() => {
    const rng = makeRng(hashRoomId(roomId));
    // Three strips: top rail, middle field, bottom rail — each gets a small L delta.
    return {
      top:    tintHex(PANEL_BASE, (rng() - 0.5) * 0.08),
      middle: tintHex(PANEL_BASE, (rng() - 0.5) * 0.08),
      bottom: tintHex(PANEL_BASE, (rng() - 0.5) * 0.08),
    };
  }, [roomId]);

  // Door panel acts as a collider ONLY while locked. Once unlocked, the
  // panel swings out of the way and players can walk through the doorway.
  useEffect(() => {
    const colliderId = `door-${roomId}`;
    if (!unlocked) {
      registerCollider({
        id: colliderId,
        x,
        z,
        hx: horizontal ? DOOR.width / 2 : 0.09,
        hz: horizontal ? 0.09 : DOOR.width / 2,
      });
      return () => unregisterCollider(colliderId);
    }
    // Unlocked — ensure no stale collider remains.
    unregisterCollider(colliderId);
    return undefined;
  }, [unlocked, roomId, x, z, horizontal]);

  useFrame(({ clock }, delta) => {
    const target = unlocked ? DOOR.openAngle : 0;
    // Framerate-independent lerp: factor = 1 - exp(-k * delta) where k = hingeLerp * 60.
    const factor = 1 - Math.exp(-DOOR.hingeLerp * 60 * delta);
    angleRef.current += (target - angleRef.current) * factor;
    if (hingeRef.current) hingeRef.current.rotation.y = angleRef.current;
    if (!unlocked && lockRef.current) {
      const mat = lockRef.current.material as THREE.MeshPhongMaterial;
      // Pulse ±5% around 2.5 emissive base.
      mat.emissiveIntensity = 2.5 + Math.sin(clock.getElapsedTime() * 3) * 0.125;
    }
  });

  const yMid = DOOR.frameHeight / 2;
  const lanternBodyColor = unlocked ? LANTERN_UNLOCKED_BODY : LANTERN_LOCKED_BODY;
  const lanternLightColor = unlocked ? LANTERN_UNLOCKED_LIGHT : LANTERN_LOCKED_LIGHT;

  // Frame post + lintel positions depend on orientation
  const postLeft: [number, number, number] = horizontal
    ? [x - DOOR.width / 2, yMid, z]
    : [x, yMid, z - DOOR.width / 2];
  const postRight: [number, number, number] = horizontal
    ? [x + DOOR.width / 2, yMid, z]
    : [x, yMid, z + DOOR.width / 2];
  const lintelPos: [number, number, number] = [x, DOOR.frameHeight + 0.02, z];

  const postArgs: [number, number, number] = horizontal
    ? [DOOR.postW, DOOR.frameHeight, 0.18]
    : [0.18, DOOR.frameHeight, DOOR.postW];
  const lintelArgs: [number, number, number] = horizontal
    ? [DOOR.width + DOOR.postW * 2, 0.18, 0.22]
    : [0.22, 0.18, DOOR.width + DOOR.postW * 2];

  // Thin trim board on top of the lintel (0.04 thick).
  const lintelTrimArgs: [number, number, number] = horizontal
    ? [DOOR.width + DOOR.postW * 2 + 0.04, 0.04, 0.26]
    : [0.26, 0.04, DOOR.width + DOOR.postW * 2 + 0.04];
  const lintelTrimPos: [number, number, number] = [x, DOOR.frameHeight + 0.13, z];

  // Baseboard at the bottom of each post.
  const baseboardArgs: [number, number, number] = horizontal
    ? [DOOR.postW + 0.04, 0.05, 0.22]
    : [0.22, 0.05, DOOR.postW + 0.04];
  const baseboardLeftPos: [number, number, number] = horizontal
    ? [x - DOOR.width / 2, 0.025, z]
    : [x, 0.025, z - DOOR.width / 2];
  const baseboardRightPos: [number, number, number] = horizontal
    ? [x + DOOR.width / 2, 0.025, z]
    : [x, 0.025, z + DOOR.width / 2];

  // Hinge group anchored at left post
  const hingePos: [number, number, number] = horizontal
    ? [x - DOOR.width / 2, 0, z]
    : [x, 0, z - DOOR.width / 2];

  const panelRotY = horizontal ? 0 : Math.PI / 2;

  // 3-strip woodgrain panel — top rail / middle field / bottom rail.
  // Heights sum to DOOR.height. Rails are thin, middle is the bulk.
  const RAIL_H = 0.22;
  const MID_H = DOOR.height - RAIL_H * 2;
  const PANEL_THICK = 0.06;
  // Y centers within the hinge-group local space.
  const bottomRailY = RAIL_H / 2;
  const middleY = RAIL_H + MID_H / 2;
  const topRailY = RAIL_H + MID_H + RAIL_H / 2;
  // X-offset from hinge (half the door width toward the knob side).
  const panelXOffset = DOOR.width / 2;

  // Position helper for a strip at local y.
  const stripPos = (y: number): [number, number, number] =>
    horizontal ? [panelXOffset, y, 0] : [0, y, panelXOffset];

  // Knob group position — at middle field, near the free edge.
  const knobGroupPos: [number, number, number] = horizontal
    ? [DOOR.width * 0.85, DOOR.height / 2, PANEL_THICK / 2 + 0.02]
    : [PANEL_THICK / 2 + 0.02, DOOR.height / 2, DOOR.width * 0.85];

  const knobColor = theme === 'dark' ? '#c0b070' : '#998060';

  return (
    <group>
      {/* Frame posts */}
      <mesh position={postLeft} castShadow receiveShadow>
        <boxGeometry args={postArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={postRight} castShadow receiveShadow>
        <boxGeometry args={postArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Baseboards at bottom of each post */}
      <mesh position={baseboardLeftPos} receiveShadow>
        <boxGeometry args={baseboardArgs} />
        <meshPhongMaterial color={FRAME_TRIM_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.2} flatShading />
      </mesh>
      <mesh position={baseboardRightPos} receiveShadow>
        <boxGeometry args={baseboardArgs} />
        <meshPhongMaterial color={FRAME_TRIM_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.2} flatShading />
      </mesh>
      {/* Lintel */}
      <mesh position={lintelPos} castShadow receiveShadow>
        <boxGeometry args={lintelArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Lintel trim board (on top of the lintel) */}
      <mesh position={lintelTrimPos}>
        <boxGeometry args={lintelTrimArgs} />
        <meshPhongMaterial color={FRAME_TRIM_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.2} flatShading />
      </mesh>

      {/* Hinge group with door panel — 3 stacked strips */}
      <group ref={hingeRef} position={hingePos}>
        {/* Bottom rail */}
        <mesh position={stripPos(bottomRailY)} rotation={[0, panelRotY, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR.width, RAIL_H, PANEL_THICK]} />
          <meshPhongMaterial
            color={panelTints.bottom}
            emissive={accentColor}
            emissiveIntensity={0.12}
            flatShading
          />
          <Edges color={edgeColor} lineWidth={1.2} />
        </mesh>
        {/* Middle field */}
        <mesh position={stripPos(middleY)} rotation={[0, panelRotY, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR.width, MID_H, PANEL_THICK]} />
          <meshPhongMaterial
            color={panelTints.middle}
            emissive={accentColor}
            emissiveIntensity={0.15}
            flatShading
          />
          <Edges color={edgeColor} lineWidth={1.2} />
        </mesh>
        {/* Top rail */}
        <mesh position={stripPos(topRailY)} rotation={[0, panelRotY, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR.width, RAIL_H, PANEL_THICK]} />
          <meshPhongMaterial
            color={panelTints.top}
            emissive={accentColor}
            emissiveIntensity={0.12}
            flatShading
          />
          <Edges color={edgeColor} lineWidth={1.2} />
        </mesh>
        {/* Accent stripe — across the middle field */}
        <mesh position={stripPos(middleY)} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[DOOR.width * 0.8, 0.06, PANEL_THICK + 0.01]} />
          <meshPhongMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} flatShading />
        </mesh>
        {/* Knob assembly: escutcheon plate + knob sphere */}
        <group position={knobGroupPos}>
          {/* Escutcheon plate (flat box, sits flush against the door) */}
          <mesh rotation={[0, panelRotY, 0]}>
            <boxGeometry args={[0.14, 0.22, 0.02]} />
            <meshPhongMaterial color={knobColor} emissive={knobColor} emissiveIntensity={0.25} flatShading />
            <Edges color={edgeColor} lineWidth={1.2} />
          </mesh>
          {/* Knob sphere — sits proud of the escutcheon */}
          <mesh position={horizontal ? [0, 0, 0.04] : [0.04, 0, 0]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshPhongMaterial color={knobColor} emissive={knobColor} emissiveIntensity={0.4} flatShading />
          </mesh>
        </group>
      </group>

      {/* Lock / unlock indicator above the door */}
      {!unlocked ? (
        <>
          {/* Lock body — larger, pulsing */}
          <mesh ref={lockRef} position={[x, DOOR.frameHeight + 0.42, z]}>
            <boxGeometry args={[0.24, 0.22, 0.08]} />
            <meshPhongMaterial color={LOCK_COLOR} emissive={LOCK_COLOR} emissiveIntensity={2.5} flatShading />
            <Edges color={edgeColor} lineWidth={1.2} />
          </mesh>
          {/* Lock shackle (box on top of the body) */}
          <mesh position={[x, DOOR.frameHeight + 0.58, z]}>
            <boxGeometry args={[0.14, 0.1, 0.06]} />
            <meshPhongMaterial color={LOCK_COLOR} emissive={LOCK_COLOR} emissiveIntensity={2.2} flatShading />
          </mesh>
        </>
      ) : (
        <>
          {/* Green checkmark — two thin boxes forming an L (rotated 45deg). */}
          <mesh position={[x - 0.05, DOOR.frameHeight + 0.42, z]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.18, 0.04]} />
            <meshPhongMaterial color={CHECK_COLOR} emissive={CHECK_COLOR} emissiveIntensity={2.0} flatShading />
          </mesh>
          <mesh position={[x + 0.03, DOOR.frameHeight + 0.48, z]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshPhongMaterial color={CHECK_COLOR} emissive={CHECK_COLOR} emissiveIntensity={2.0} flatShading />
          </mesh>
        </>
      )}

      {/* Lantern — glow body + metal cap + chain */}
      {/* Chain hanging from above */}
      <mesh position={[x, DOOR.frameHeight + 0.42, z]}>
        <boxGeometry args={[0.015, 0.28, 0.015]} />
        <meshPhongMaterial color={CHAIN_COLOR} flatShading />
      </mesh>
      {/* Metal cap on top of the lantern */}
      <mesh position={[x, DOOR.frameHeight + 0.29, z]}>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
        <meshPhongMaterial color={LANTERN_CAP_COLOR} flatShading />
      </mesh>
      {/* Lantern glow body (1.2x original 0.15 = 0.18) */}
      <mesh position={[x, DOOR.frameHeight + 0.18, z]}>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshPhongMaterial
          color={lanternBodyColor}
          emissive={lanternBodyColor}
          emissiveIntensity={2.5}
          flatShading
        />
      </mesh>
      <pointLight
        position={[x, DOOR.frameHeight + 0.18, z]}
        color={lanternLightColor}
        intensity={0.7}
        distance={5}
      />
    </group>
  );
}
