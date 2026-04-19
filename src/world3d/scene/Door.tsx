import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
// Named imports — namespace import defeats tree-shaking of three.
import { Color, DoubleSide, Group, Mesh } from 'three';
import { DOOR, DOOR_POLISH } from '../constants';
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
// Frame molding overlay — ~15% lighter than the frame for value separation.
const FRAME_MOLDING_COLOR = '#8a6732';
// F3.21: chunky dark jamb/header overlay — sits proud of the wall so the doorway
// reads as architectural framing, not a flat seam in a colored panel.
const JAMB_DARK_COLOR = '#2a1a0c';
// Door slab lives in a DIFFERENT hue family from walls (walls = neutral brown,
// door = deeper red-brown). Drives the designer's "value separation" ask.
const PANEL_BASE = '#5a2814';
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
// dL shifts lightness; dH rotates hue (in rad units, wraps 0-1).
function tintHex(hex: string, dL: number, dH = 0): string {
  const c = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + dL));
  // Hue is 0-1 in THREE; dH is in radians → convert by /(2π). Wrap with + 1 % 1.
  hsl.h = ((hsl.h + dH / (Math.PI * 2)) % 1 + 1) % 1;
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

export function Door({ x, z, horizontal, roomId, accentColor }: DoorProps) {
  const unlocked = useWorldStore((s) => s.unlockedDoors.has(roomId));
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? EDGE_DARK : EDGE_LIGHT;
  const hingeRef = useRef<Group>(null);
  const lockGroupRef = useRef<Group>(null);
  const lockRef = useRef<Mesh>(null);
  const lockShackleRef = useRef<Mesh>(null);
  const lanternGroupRef = useRef<Group>(null);
  const lanternBodyRef = useRef<Mesh>(null);
  const angleRef = useRef<number>(unlocked ? DOOR.openAngle : 0);

  // Per-door deterministic wood tones for the 3-strip panel.
  // F3.21: rails are guaranteed darker than the field by at least 0.15 L
  // (was a free ±0.10 jitter that allowed rails to land brighter than the
  // field). Field still gets a small jitter for per-door variation; rails
  // are derived as `field - 0.16 ± small`. Inset/mullion derive from field.
  const panelTints = useMemo(() => {
    const rng = makeRng(hashRoomId(roomId));
    const middle = tintHex(PANEL_BASE, (rng() - 0.5) * 0.06 + 0.04);
    const railJitter = () => (rng() - 0.5) * 0.04;
    return {
      // Rails: at least -0.16 L darker than the field, plus tiny jitter.
      top:    tintHex(middle, -0.16 + railJitter()),
      middle,
      bottom: tintHex(middle, -0.16 + railJitter()),
      // Inset panel sits another -0.10 L darker than the rails to read as a shadow drop.
      inset:  tintHex(middle, -0.26),
      // Center mullion: darker wood so it reads as an architectural divider.
      mullion: tintHex(middle, -0.20),
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

  useFrame((_state, delta) => {
    // Door hinge swing — position/rotation animation only. ALL emissive
    // and scale pulses removed in the zero-brightness-motion pass:
    // 4 doors × locks + lanterns all pulsing was contributing to user
    // perception of "flicker" even at ±5% slow. Now the door is a static
    // physical object that opens and closes — that's it.
    const target = unlocked ? DOOR.openAngle : 0;
    const factor = 1 - Math.exp(-DOOR.hingeLerp * 60 * delta);
    angleRef.current += (target - angleRef.current) * factor;
    if (hingeRef.current) hingeRef.current.rotation.y = angleRef.current;
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

  // F3.21: dark architectural jamb overlays — slightly wider than the base
  // posts, slightly proud of the wall, so the doorway reads as a real cut-in
  // frame instead of a colored seam. Three pieces: left jamb, right jamb,
  // top header. Width is base postW + 0.05; depth bumped 0.04 proud of the
  // existing 0.18 post to push them out of the wall plane.
  const jambW = DOOR.postW + 0.05;
  const jambDepth = 0.26;
  const jambArgs: [number, number, number] = horizontal
    ? [jambW, DOOR.frameHeight + 0.04, jambDepth]
    : [jambDepth, DOOR.frameHeight + 0.04, jambW];
  const headerArgs: [number, number, number] = horizontal
    ? [DOOR.width + jambW * 2, 0.22, jambDepth]
    : [jambDepth, 0.22, DOOR.width + jambW * 2];
  const headerPos: [number, number, number] = [x, DOOR.frameHeight + 0.05, z];

  // Thin trim board on top of the lintel (0.06 thick, wider overhang so it
  // overlaps the lintel top by 0.02 and kills the F3.6 "visible gap").
  const lintelTrimArgs: [number, number, number] = horizontal
    ? [DOOR.width + DOOR.postW * 2 + 0.08, 0.06, 0.30]
    : [0.30, 0.06, DOOR.width + DOOR.postW * 2 + 0.08];
  // Lintel top is at frameHeight + 0.11. Place trim so its bottom (center - 0.03)
  // is at +0.09 → overlaps lintel by 0.02. Center at +0.12.
  const lintelTrimPos: [number, number, number] = [x, DOOR.frameHeight + 0.12, z];

  // Frame molding overlay — thin contrasting strips hugging the outside of each post.
  // Lighter wood tone, taller than the post by a hair, sits slightly proud.
  const moldingPostArgs: [number, number, number] = horizontal
    ? [DOOR.postW * 0.4, DOOR.frameHeight + 0.02, 0.22]
    : [0.22, DOOR.frameHeight + 0.02, DOOR.postW * 0.4];
  const moldingLeftPos: [number, number, number] = horizontal
    ? [x - DOOR.width / 2 - DOOR.postW * 0.25, yMid + 0.01, z]
    : [x, yMid + 0.01, z - DOOR.width / 2 - DOOR.postW * 0.25];
  const moldingRightPos: [number, number, number] = horizontal
    ? [x + DOOR.width / 2 + DOOR.postW * 0.25, yMid + 0.01, z]
    : [x, yMid + 0.01, z + DOOR.width / 2 + DOOR.postW * 0.25];

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

  // Desaturated accent color for the per-door doormat (memoized, never per-frame).
  const matColor = useMemo(() => {
    const c = new Color(accentColor);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    // Low saturation (~25%) + mid lightness for a "rug weave" read.
    c.setHSL(hsl.h, Math.min(hsl.s, 0.25), 0.35);
    return `#${c.getHexString()}`;
  }, [accentColor]);

  // Doormat sits on the hallway side of the doorway.
  // Top rooms: door z = -1.25, hallway is at higher z → mat at z = -1.0.
  // Bottom rooms: door z = +1.25, hallway at lower z → mat at z = +1.0.
  const matPos: [number, number, number] = horizontal
    ? [x, 0.015, z < 0 ? -1.0 : 1.0]
    : [x < 0 ? -1.0 : 1.0, 0.015, z];
  const matArgs: [number, number, number] = horizontal
    ? [DOOR.width, 0.03, 0.6]
    : [0.6, 0.03, DOOR.width];

  // Warm spill light INSIDE the room opening. The inside direction is the
  // one AWAY from origin (doors always face the central hallway). For
  // horizontal doors (along x-walls at z = ±(GAP+0.05)), inside Z is -sign(z).
  // For vertical doors, inside X is -sign(x). Wait — door z = +1.25 (positive)
  // means room is at z = +half, so inside is further +z. So insideSign = sign(coord).
  const insideSignZ = horizontal ? Math.sign(z) : 0;
  const insideSignX = horizontal ? 0 : Math.sign(x);
  const spillLightPos: [number, number, number] = [
    x + insideSignX * DOOR_POLISH.spillLight.offset,
    DOOR_POLISH.spillLight.y,
    z + insideSignZ * DOOR_POLISH.spillLight.offset,
  ];

  return (
    <group>
      {/* F3.21 — chunky DARK jamb overlays. Three architectural pieces
          (left jamb, right jamb, top header) sit proud of the wall in a
          much darker wood tone so the doorway reads as cut-in framing. */}
      <mesh position={postLeft}>
        <boxGeometry args={jambArgs} />
        <meshPhongMaterial color={JAMB_DARK_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.18} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.4} />
      </mesh>
      <mesh position={postRight}>
        <boxGeometry args={jambArgs} />
        <meshPhongMaterial color={JAMB_DARK_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.18} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.4} />
      </mesh>
      <mesh position={headerPos}>
        <boxGeometry args={headerArgs} />
        <meshPhongMaterial color={JAMB_DARK_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.18} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.4} />
      </mesh>
      {/* Frame posts (lighter inner trim, tucked behind jambs) */}
      <mesh position={postLeft}>
        <boxGeometry args={postArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={postRight}>
        <boxGeometry args={postArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Contrasting frame moldings around the outside of each post */}
      <mesh position={moldingLeftPos}>
        <boxGeometry args={moldingPostArgs} />
        <meshPhongMaterial
          color={FRAME_MOLDING_COLOR}
          emissive={FRAME_EMISSIVE}
          emissiveIntensity={0.25}
          flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      <mesh position={moldingRightPos}>
        <boxGeometry args={moldingPostArgs} />
        <meshPhongMaterial
          color={FRAME_MOLDING_COLOR}
          emissive={FRAME_EMISSIVE}
          emissiveIntensity={0.25}
          flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      {/* Baseboards at bottom of each post */}
      <mesh position={baseboardLeftPos}>
        <boxGeometry args={baseboardArgs} />
        <meshPhongMaterial color={FRAME_TRIM_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.2} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      <mesh position={baseboardRightPos}>
        <boxGeometry args={baseboardArgs} />
        <meshPhongMaterial color={FRAME_TRIM_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.2} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>
      {/* Lintel */}
      <mesh position={lintelPos}>
        <boxGeometry args={lintelArgs} />
        <meshPhongMaterial color={FRAME_COLOR} emissive={FRAME_EMISSIVE} emissiveIntensity={0.3} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Lintel trim board — overlaps the lintel top (gap fix from F3.6 review) */}
      <mesh position={lintelTrimPos}>
        <boxGeometry args={lintelTrimArgs} />
        <meshPhongMaterial
          color={FRAME_MOLDING_COLOR}
          emissive={FRAME_EMISSIVE}
          emissiveIntensity={0.25}
          flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1.0} />
      </mesh>

      {/* Doormat — flat box at the doorway threshold, hallway side, accent-tinted */}
      <mesh position={matPos}>
        <boxGeometry args={matArgs} />
        <meshPhongMaterial color={matColor} flatShading side={DoubleSide} />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* Hinge group with door panel — 3 stacked strips */}
      <group ref={hingeRef} position={hingePos}>
        {/* Bottom rail */}
        <mesh position={stripPos(bottomRailY)} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[DOOR.width, RAIL_H, PANEL_THICK]} />
          <meshPhongMaterial
            color={panelTints.bottom}
            emissive={accentColor}
            emissiveIntensity={0.12}
            flatShading side={DoubleSide} />
          <Edges color={edgeColor} lineWidth={1.2} />
        </mesh>
        {/* Middle field */}
        <mesh position={stripPos(middleY)} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[DOOR.width, MID_H, PANEL_THICK]} />
          <meshPhongMaterial
            color={panelTints.middle}
            emissive={accentColor}
            emissiveIntensity={0.15}
            flatShading side={DoubleSide} />
          <Edges color={edgeColor} lineWidth={1.2} />
        </mesh>
        {/* Top rail */}
        <mesh position={stripPos(topRailY)} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[DOOR.width, RAIL_H, PANEL_THICK]} />
          <meshPhongMaterial
            color={panelTints.top}
            emissive={accentColor}
            emissiveIntensity={0.12}
            flatShading side={DoubleSide} />
          <Edges color={edgeColor} lineWidth={1.2} />
        </mesh>
        {/* Accent stripe — across the middle field */}
        <mesh position={stripPos(middleY)} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[DOOR.width * 0.8, 0.06, PANEL_THICK + 0.01]} />
          <meshPhongMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} flatShading side={DoubleSide} />
        </mesh>
        {/* Center mullion — thin vertical strip, full panel height, darker wood. */}
        <mesh position={stripPos(DOOR.height / 2)} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[0.04, DOOR.height, PANEL_THICK + 0.005]} />
          <meshPhongMaterial color={panelTints.mullion} flatShading side={DoubleSide} />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
        {/* Inset panel rectangle on the middle field — slightly darker, thin. */}
        <mesh position={stripPos(middleY)} rotation={[0, panelRotY, 0]}>
          <boxGeometry args={[DOOR.width * 0.6, MID_H * 0.7, 0.02]} />
          <meshPhongMaterial color={panelTints.inset} flatShading side={DoubleSide} />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
        {/* Knob assembly: escutcheon plate + knob sphere (1.5× the F3.5 sizing —
            designer explicitly called out the knob was too small at game distance) */}
        <group position={knobGroupPos}>
          {/* Escutcheon plate (flat box, sits flush against the door) */}
          <mesh rotation={[0, panelRotY, 0]}>
            <boxGeometry args={DOOR_POLISH.escutcheon as unknown as [number, number, number]} />
            <meshPhongMaterial color={knobColor} emissive={knobColor} emissiveIntensity={0.3} flatShading side={DoubleSide} />
            <Edges color={edgeColor} lineWidth={1.2} />
          </mesh>
          {/* Knob sphere — sits proud of the escutcheon */}
          <mesh position={horizontal ? [0, 0, 0.055] : [0.055, 0, 0]}>
            <sphereGeometry args={[DOOR_POLISH.knobRadius, 12, 10]} />
            <meshPhongMaterial color={knobColor} emissive={knobColor} emissiveIntensity={0.45} flatShading side={DoubleSide} />
            <Edges color={edgeColor} lineWidth={1.0} />
          </mesh>
        </group>
      </group>

      {/* Lock / unlock indicator above the door */}
      {!unlocked ? (
        <group ref={lockGroupRef} position={[x, DOOR.frameHeight + 0.48, z]}>
          {/* Lock body — larger, pulses with the shackle as a single group */}
          <mesh ref={lockRef} position={[0, 0, 0]}>
            <boxGeometry args={[0.28, 0.24, 0.1]} />
            <meshPhongMaterial color={LOCK_COLOR} emissive={LOCK_COLOR} emissiveIntensity={2.5} flatShading side={DoubleSide} />
            <Edges color={edgeColor} lineWidth={1.2} />
          </mesh>
          {/* Lock shackle (box on top of the body) */}
          <mesh ref={lockShackleRef} position={[0, 0.18, 0]}>
            <boxGeometry args={[0.16, 0.12, 0.07]} />
            <meshPhongMaterial color={LOCK_COLOR} emissive={LOCK_COLOR} emissiveIntensity={2.5} flatShading side={DoubleSide} />
            <Edges color={edgeColor} lineWidth={1.0} />
          </mesh>
        </group>
      ) : (
        <>
          {/* Green checkmark — two thin boxes forming an L (rotated 45deg). */}
          <mesh position={[x - 0.05, DOOR.frameHeight + 0.42, z]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.18, 0.04]} />
            <meshPhongMaterial color={CHECK_COLOR} emissive={CHECK_COLOR} emissiveIntensity={2.0} flatShading side={DoubleSide} />
          </mesh>
          <mesh position={[x + 0.03, DOOR.frameHeight + 0.48, z]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshPhongMaterial color={CHECK_COLOR} emissive={CHECK_COLOR} emissiveIntensity={2.0} flatShading side={DoubleSide} />
          </mesh>
        </>
      )}

      {/* Lantern — group-anchored at lantern body so a single scale pulse
          drives body + cap + chain together. Lock-state color wired in. */}
      <group ref={lanternGroupRef} position={[x, DOOR.frameHeight + 0.18, z]}>
        {/* Chain hanging from above (local +y) */}
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.02, 0.28, 0.02]} />
          <meshPhongMaterial color={CHAIN_COLOR} flatShading side={DoubleSide} />
        </mesh>
        {/* Metal cap on top of the lantern */}
        <mesh position={[0, 0.11, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.22]} />
          <meshPhongMaterial color={LANTERN_CAP_COLOR} flatShading side={DoubleSide} />
          <Edges color={edgeColor} lineWidth={1.0} />
        </mesh>
        {/* Lantern glow body — lock-state color, F3.7 slightly larger */}
        <mesh ref={lanternBodyRef} position={[0, 0, 0]}>
          <boxGeometry args={[0.2, 0.22, 0.2]} />
          <meshPhongMaterial
            color={lanternBodyColor}
            emissive={lanternBodyColor}
            emissiveIntensity={unlocked ? 2.8 : 1.6}
            flatShading side={DoubleSide} />
          <Edges color={edgeColor} lineWidth={1.0} />
        </mesh>
        {/* Bottom finial */}
        <mesh position={[0, -0.14, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshPhongMaterial color={LANTERN_CAP_COLOR} flatShading side={DoubleSide} />
        </mesh>
      </group>
      {/* Lantern point light — stays at fixed world position */}
      <pointLight
        position={[x, DOOR.frameHeight + 0.18, z]}
        color={lanternLightColor}
        intensity={unlocked ? 0.9 : 0.5}
        distance={5}
      />

      {/* F3.7: warm spill light INSIDE the room opening. Makes the arch glow
          into the hallway, addressing F3.6 flat-lighting finding. */}
      <pointLight
        position={spillLightPos}
        color={DOOR_POLISH.spillLight.color}
        intensity={DOOR_POLISH.spillLight.intensity}
        distance={DOOR_POLISH.spillLight.distance}
      />
    </group>
  );
}
