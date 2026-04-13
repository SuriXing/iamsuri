import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { CHARACTER, COLORS } from '../constants';
import { useWorldStore } from '../store/worldStore';
import { makeRng } from '../util/rand';

// Smoothly interpolates angle `a` toward `b` around the shorter arc.
// Prevents the "spin the long way around" issue near ±π boundaries.
function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

// Local palette (module-level, frozen). A couple of small hex offsets off
// COLORS.gold give the body a subtle top-light / waist-shadow gradient
// without pulling in new constants.
const BODY_TOP = '#ffe352';      // lighter shoulder
const BODY_BOTTOM = '#e6b800';   // darker waist
const HAIR_DARK = '#1e1a2e';
const HAIR_HILITE = '#3a2f52';   // bumped from 6% → 12% L delta for visibility
const SKIN = '#ffcc99';
const LEG = '#2f2f3a';
const TOE_CAP = '#b02940';       // darker red for shoe toe-cap contrast
// Hero signature: lab coat. White in dark theme, off-cream in light theme.
const LAB_COAT_DARK = '#f5f5f5';
const LAB_COAT_LIGHT = '#e8e3d5';
// Outline colors — much darker in dark theme so they separate from ambient.
const EDGE_DARK = '#0a0a14';
const EDGE_LIGHT = '#5a4830';

// Tiny helper: nudge an #rrggbb hex by a signed lightness delta (−0.05..+0.05).
// Used once per render inside useMemo to compute deterministic per-cube tints.
// Not called in useFrame, so the ephemeral Color allocation is fine.
function tintHex(hex: string, delta: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l + delta));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

export function Character() {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  // Smoothed facing (lerps toward store charFacing so turning is not jerky).
  const smoothFacingRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  // New refs for polish — NOT React state, mutated in useFrame.
  const blinkRef = useRef<THREE.Group>(null);
  const hairGroupRef = useRef<THREE.Group>(null);
  const hairSwayRef = useRef<number>(0);

  // No selectors — read store imperatively in useFrame to avoid re-renders.
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const { charPos, charFacing } = useWorldStore.getState();

    // Detect whether the character is actively moving this frame.
    const dx = charPos.x - lastPosRef.current.x;
    const dz = charPos.z - lastPosRef.current.z;
    const moving = (dx * dx + dz * dz) > 0.00002;
    lastPosRef.current.x = charPos.x;
    lastPosRef.current.z = charPos.z;

    // Smooth-turn: FPS-independent lerp. k=12 → ~120ms to settle.
    const k = 12;
    const tf = 1 - Math.exp(-k * delta);
    smoothFacingRef.current = lerpAngle(smoothFacingRef.current, charFacing, tf);

    const g = groupRef.current;
    if (g) {
      g.position.x = charPos.x;
      g.position.z = charPos.z;
      // Bob while walking, gentle hover when idle.
      g.position.y = moving
        ? Math.abs(Math.sin(t * 8)) * CHARACTER.bobAmp * 0.6
        : Math.sin(t * CHARACTER.bobFreq) * CHARACTER.bobAmp;
      // Idle sway disappears while walking so rotation feels decisive.
      const sway = moving ? 0 : Math.sin(t * CHARACTER.swayFreq) * CHARACTER.swayAmp;
      g.rotation.y = smoothFacingRef.current + sway;
    }
    if (shadowRef.current) {
      shadowRef.current.position.x = charPos.x;
      shadowRef.current.position.z = charPos.z;
    }
    // Idle arm sway
    const swing = Math.sin(t * 2) * 0.3;
    if (armLRef.current) armLRef.current.rotation.x = swing;
    if (armRRef.current) armRRef.current.rotation.x = -swing;
    if (headRef.current) headRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;

    // Blink — deterministic: a 4.0s period, 120ms closure starting at phase 0.
    // Scale eye-group y → 0.1 during the closure window, else 1.0.
    if (blinkRef.current) {
      const cycle = t % 4.0;
      const closed = cycle < 0.12;
      blinkRef.current.scale.y = closed ? 0.1 : 1.0;
    }

    // Hair sway — lerp hair group rotation.z toward lateral velocity
    // relative to the character's facing (not world-space), clamped to
    // ±0.06 rad. Project (dx, dz) onto the character right-vector so
    // strafing while facing any direction produces sway but pure forward
    // walking does not. Zero-alloc: pure scalar math.
    if (hairGroupRef.current) {
      const facing = smoothFacingRef.current;
      // right-vector when rotation.y = facing is (cos, -sin) in XZ.
      const lateral = dx * Math.cos(facing) - dz * Math.sin(facing);
      let target = -lateral * 6.0;
      if (target > 0.06) target = 0.06;
      else if (target < -0.06) target = -0.06;
      hairSwayRef.current += (target - hairSwayRef.current) * tf;
      hairGroupRef.current.rotation.z = hairSwayRef.current;
    }
  });

  // Subscribe to theme with a selector so edges recolor on theme toggle.
  // One re-render per theme flip — cheap, no per-frame cost.
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? EDGE_DARK : EDGE_LIGHT;
  const labCoatColor = theme === 'dark' ? LAB_COAT_DARK : LAB_COAT_LIGHT;

  // Deterministic per-instance tint table. mulberry32 seeded once; memoised
  // so we never recompute per frame or per re-render. Every cube on the
  // body reads a tiny ±5% lightness nudge keyed off the base palette, so
  // the avatar reads as crafted rather than stamped from uniform slabs.
  const tints = useMemo(() => {
    const rng = makeRng(0xC4A87EE); // "Suri" hex seed — stable across sessions
    const jitter = () => (rng() - 0.5) * 0.08; // ≈ ±4% L
    return {
      headTop:   tintHex(SKIN, jitter()),
      jaw:       tintHex(SKIN, jitter() - 0.02),
      bodyTop:   tintHex(BODY_TOP, jitter()),
      bodyMid:   tintHex(BODY_BOTTOM, jitter()),
      armL:      tintHex(BODY_BOTTOM, jitter()),
      armR:      tintHex(BODY_BOTTOM, jitter()),
      hairCap:   tintHex(HAIR_DARK, jitter()),
      hairTuft:  tintHex(HAIR_HILITE, jitter()),
      hairFringe:tintHex(HAIR_DARK, jitter() + 0.02),
      thighL:    tintHex(LEG, jitter()),
      thighR:    tintHex(LEG, jitter()),
      shinL:     tintHex(LEG, jitter() - 0.03),
      shinR:     tintHex(LEG, jitter() - 0.03),
      shoeL:     tintHex(COLORS.red, jitter()),
      shoeR:     tintHex(COLORS.red, jitter()),
    };
  }, []);

  return (
    <>
      {/* Shadow disc — separate ref, mutated in useFrame to track the body. */}
      <mesh
        ref={shadowRef}
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[CHARACTER.shadowRadius, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      <group ref={groupRef} scale={CHARACTER.scale}>
        {/* Head + face — widened in X for chibi proportions.
            Head upper 0.54 × 0.36 × 0.46, jaw 0.48 × 0.16 × 0.42.
            Head width (0.54) vs shoulder width (0.42) = 1.29× ratio, in
            the 1.2-1.4× chibi mascot sweet spot the designer asked for.
            Depth kept at 0.46 to preserve existing mouth/blush clearance. */}
        <group ref={headRef}>
          {/* Head upper — bigger + outlined for silhouette pop */}
          <mesh position={[0, 1.60, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.54, 0.36, 0.46]} />
            <meshPhongMaterial color={tints.headTop} flatShading />
            <Edges color={edgeColor} lineWidth={1.5} />
          </mesh>
          {/* Jaw — widened to match new head ratio */}
          <mesh position={[0, 1.34, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.48, 0.16, 0.42]} />
            <meshPhongMaterial color={tints.jaw} flatShading />
            <Edges color={edgeColor} lineWidth={1.5} />
          </mesh>

          {/* Eyes — wrapped in a group so we can scale Y for the blink.
              Scaled larger (0.10) and shifted up to land on the bigger face. */}
          <group ref={blinkRef}>
            <mesh position={[-0.10, 1.58, 0.23]}>
              <boxGeometry args={[0.10, 0.10, 0.02]} />
              <meshPhongMaterial color="#222222" flatShading />
            </mesh>
            <mesh position={[0.10, 1.58, 0.23]}>
              <boxGeometry args={[0.10, 0.10, 0.02]} />
              <meshPhongMaterial color="#222222" flatShading />
            </mesh>
          </group>

          {/* Mouth — pushed forward to z=0.225 so its front face (0.235)
              sits 0.005 proud of the head upper front face (0.23). Fixes
              the z-fight risk flagged by the craft review. */}
          <mesh position={[0, 1.42, 0.225]}>
            <boxGeometry args={[0.12, 0.035, 0.02]} />
            <meshPhongMaterial color={COLORS.red} flatShading />
          </mesh>
          {/* Blush — pushed forward to z=0.225, same clearance reason */}
          <mesh position={[-0.16, 1.47, 0.225]}>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshPhongMaterial color="#ffaaaa" emissive="#ffaaaa" emissiveIntensity={0.3} flatShading />
          </mesh>
          <mesh position={[0.16, 1.47, 0.225]}>
            <boxGeometry args={[0.08, 0.05, 0.02]} />
            <meshPhongMaterial color="#ffaaaa" emissive="#ffaaaa" emissiveIntensity={0.3} flatShading />
          </mesh>

          {/* Hair group — rotates as a whole for the sway animation.
              Wrapped to cover the bigger head. Matte shininess=8 on all
              hair meshes for a cloth/felt read (craft review). */}
          <group ref={hairGroupRef}>
            {/* Main hair cap — widened to 0.58 to wrap the 0.54-wide head */}
            <mesh position={[0, 1.86, 0]} castShadow>
              <boxGeometry args={[0.58, 0.16, 0.50]} />
              <meshPhongMaterial color={tints.hairCap} shininess={8} flatShading />
              <Edges color={edgeColor} lineWidth={1.5} />
            </mesh>
            {/* Top tuft — now tinted + outlined so it actually pops */}
            <mesh position={[0.06, 1.99, 0]} castShadow>
              <boxGeometry args={[0.20, 0.09, 0.22]} />
              <meshPhongMaterial color={tints.hairTuft} shininess={8} flatShading />
              <Edges color={edgeColor} lineWidth={1.5} />
            </mesh>
            {/* Front fringe / bang — sits just above the forehead, widened */}
            <mesh position={[-0.06, 1.72, 0.23]} castShadow>
              <boxGeometry args={[0.38, 0.11, 0.05]} />
              <meshPhongMaterial color={tints.hairFringe} shininess={8} flatShading />
              <Edges color={edgeColor} lineWidth={1.5} />
            </mesh>
            {/* SIGNATURE HAIR BOW — emissive pink ribbon on the left side
                of the head, riding the hair cap. Three small cubes
                (wing + knot + wing) commit to ONE bold readable detail
                visible at ~40px game distance, the designer review's #1
                ask. Matches scarf pink so the accent hue is consistent. */}
            <mesh position={[-0.27, 1.94, 0]} castShadow>
              <boxGeometry args={[0.09, 0.14, 0.06]} />
              <meshPhongMaterial color={COLORS.pink} emissive={COLORS.pink} emissiveIntensity={0.4} flatShading />
              <Edges color={edgeColor} lineWidth={1.5} />
            </mesh>
            <mesh position={[-0.34, 1.94, 0]} castShadow>
              <boxGeometry args={[0.06, 0.09, 0.05]} />
              <meshPhongMaterial color={COLORS.pink} emissive={COLORS.pink} emissiveIntensity={0.4} flatShading />
              <Edges color={edgeColor} lineWidth={1.5} />
            </mesh>
            <mesh position={[-0.27, 2.03, 0]} castShadow>
              <boxGeometry args={[0.05, 0.05, 0.05]} />
              <meshPhongMaterial color={COLORS.pink} emissive={COLORS.pink} emissiveIntensity={0.4} flatShading />
              <Edges color={edgeColor} lineWidth={1.5} />
            </mesh>
          </group>
        </group>

        {/* Body — stacked for a subtle shoulder→waist gradient and taper.
            Upper box is slightly wider; lower box slightly narrower. Emissive
            is kept low on the top block only so flatShading still reads as
            flat-faced voxel-art rather than a self-lit slab. */}
        <mesh position={[0, 1.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.22, 0.26]} />
          <meshPhongMaterial color={tints.bodyTop} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.32, 0.24]} />
          <meshPhongMaterial color={tints.bodyMid} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>

        {/* HERO ELEMENT — lab coat. F3.21: wraps the FULL torso (front + back)
            so it reads from the default follow-cam (which sees the back). The
            box now spans the body depth (0.30) instead of a thin front panel. */}
        <mesh position={[0, 1.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.44, 0.40, 0.30]} />
          <meshPhongMaterial color={labCoatColor} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        {/* Lab coat front placket — thin proud strip down center front for
            silhouette detail (keeps the front-cam read from F3.4 reviews). */}
        <mesh position={[0, 1.06, 0.155]}>
          <boxGeometry args={[0.06, 0.40, 0.02]} />
          <meshPhongMaterial color={COLORS.pink} emissive={COLORS.pink} emissiveIntensity={0.25} flatShading />
        </mesh>

        {/* Collar / scarf — thin pink band at the neckline. Slight emissive
            so the accent reads in the dim dark-theme ambient. Now outlined. */}
        <mesh position={[0, 1.32, 0]} castShadow>
          <boxGeometry args={[0.44, 0.05, 0.28]} />
          <meshPhongMaterial color={COLORS.pink} emissive={COLORS.pink} emissiveIntensity={0.2} shininess={8} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>

        {/* Arms — outlined for silhouette separation from body. Pulled
            outward to x=±0.32 so they visibly clear the body-top block
            (half-width 0.21) and the scarf (half-width 0.22) with a
            ~0.05 gap — prevents the "arms glued to torso" silhouette
            and kills any grazing z-fight risk flagged by motion review. */}
        <mesh ref={armLRef} position={[-0.32, 1.05, 0]} castShadow>
          <boxGeometry args={[0.1, 0.45, 0.1]} />
          <meshPhongMaterial color={tints.armL} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        <mesh ref={armRRef} position={[0.32, 1.05, 0]} castShadow>
          <boxGeometry args={[0.1, 0.45, 0.1]} />
          <meshPhongMaterial color={tints.armR} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>

        {/* Legs — restructured as thigh + tapered shin. The old 0.1-tall
            ankle block was invisible at follow-cam distance; now we have
            a meaningful width difference (0.14 thigh → 0.12 shin) that
            actually reads. Shin is also slightly darker to reinforce. */}
        {/* Thighs */}
        <mesh position={[-0.1, 0.71, 0]} castShadow>
          <boxGeometry args={[0.14, 0.30, 0.14]} />
          <meshPhongMaterial color={tints.thighL} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        <mesh position={[0.1, 0.71, 0]} castShadow>
          <boxGeometry args={[0.14, 0.30, 0.14]} />
          <meshPhongMaterial color={tints.thighR} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        {/* Shins — narrower, slightly darker */}
        <mesh position={[-0.1, 0.47, 0]} castShadow>
          <boxGeometry args={[0.12, 0.18, 0.12]} />
          <meshPhongMaterial color={tints.shinL} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        <mesh position={[0.1, 0.47, 0]} castShadow>
          <boxGeometry args={[0.12, 0.18, 0.12]} />
          <meshPhongMaterial color={tints.shinR} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>

        {/* Shoes — main sole. Positioned at the new shin bottom Y (~0.38).
            Glossy shininess=60 for a leather sheen (craft review #2). */}
        <mesh position={[-0.1, 0.35, 0.03]} castShadow>
          <boxGeometry args={[0.15, 0.06, 0.2]} />
          <meshPhongMaterial color={tints.shoeL} shininess={60} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        <mesh position={[0.1, 0.35, 0.03]} castShadow>
          <boxGeometry args={[0.15, 0.06, 0.2]} />
          <meshPhongMaterial color={tints.shoeR} shininess={60} flatShading />
          <Edges color={edgeColor} lineWidth={1.5} />
        </mesh>
        {/* Toe-caps — darker front block to read as a shoe with a tip */}
        <mesh position={[-0.1, 0.36, 0.14]} castShadow>
          <boxGeometry args={[0.16, 0.07, 0.06]} />
          <meshPhongMaterial color={TOE_CAP} shininess={60} flatShading />
        </mesh>
        <mesh position={[0.1, 0.36, 0.14]} castShadow>
          <boxGeometry args={[0.16, 0.07, 0.06]} />
          <meshPhongMaterial color={TOE_CAP} shininess={60} flatShading />
        </mesh>
      </group>
    </>
  );
}
