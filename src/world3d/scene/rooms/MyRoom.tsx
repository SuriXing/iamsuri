import { useEffect, useMemo, useRef } from 'react';
import { registerCollider, unregisterCollider } from '../colliders';
import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
// Named imports — namespace import defeats tree-shaking of three.
import { Mesh, PointLight } from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { Bookshelf } from '../parts/Bookshelf';
import { DeskLamp } from '../parts/DeskLamp';
import { MY_ROOM_CONTENT } from '../../../data/myRoom';
import { makeRng } from '../../util/rand';
import { useWorldStore } from '../../store/worldStore';
import type { InteractableData } from '../../store/worldStore';

const HEADBOARD_INTERACTABLE: InteractableData = MY_ROOM_CONTENT.dialogues.bed;
const MONITOR_INTERACTABLE: InteractableData = MY_ROOM_CONTENT.dialogues.monitor;

const PINK = '#f4a8b8';
const PINK_SOFT = '#f8c4d0';
const PINK_DARK = '#d87890';
const PINK_DUSTY = '#c87890';
const WHITE = '#f8f8f8';
const WHITE_OFF = '#e8e8e8';
const WOOD = '#6b4423';
const WOOD_DARK = '#4a3018';
const SHELF_BACK = '#4a3018';
const GOLD = '#c9a14a';
const EDGE_COLOR = '#0a0a14';
const FRAME_DARK = '#3a2a1a';

const BED_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.7, -0.95],
  [0.7, -0.95],
  [-0.7, 0.95],
  [0.7, 0.95],
];

// Tapered desk legs — dz tightened from ±0.7 to ±0.4 to match the
// shorter (depth=1.0, was 1.6) desk top.
const DESK_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.6, -0.4],
  [0.6, -0.4],
  [-0.6, 0.4],
  [0.6, 0.4],
];

const SHELF_BOOK_COLORS: ReadonlyArray<string> = MY_ROOM_CONTENT.shelfBookColors;

// Deterministic pillow tint seed for two pillows.
const PILLOW_SEED = 0x51f3a8;

// ---- Micro-animation constants (module-scope = zero per-frame alloc) ----
// Monitor scanline sweep: vertical oscillation across screen face.
const SCANLINE_BASE_Y = 1.25;
const SCANLINE_SWEEP_AMPLITUDE = 0.25; // ±0.25 fits within 0.58 screen half-height
const SCANLINE_SWEEP_SPEED = 2.0;
// Plant foliage breathing: ±3% scale pulse.
const PLANT_BREATH_AMPLITUDE = 0.03;
const PLANT_BREATH_SPEED = 0.8;
// Pink accent light breathing: base 0.3, ~5% at slow 0.6 Hz. Dampened
// from 10% post-ship when the combined 4-room pulse superposition read
// as flicker.
const ACCENT_LIGHT_BASE = 0.3;

// Folded clothes stack — small boxes in pink/white.
interface ClothesBoxSpec {
  readonly dy: number;
  readonly w: number;
  readonly h: number;
  readonly d: number;
  readonly color: string;
}
const CLOTHES_STACK: ReadonlyArray<ClothesBoxSpec> = [
  { dy: 0.0,  w: 0.42, h: 0.06, d: 0.28, color: PINK_SOFT },
  { dy: 0.065, w: 0.40, h: 0.05, d: 0.26, color: WHITE },
  { dy: 0.12, w: 0.38, h: 0.05, d: 0.25, color: PINK_DARK },
];

export function MyRoom() {
  const { center } = ROOM_BY_ID.myroom;
  const ox = center.x;
  const oz = center.z;
  // Bed pushed left, desk pushed right — wider gap between them
  // (was ±1.0, now ±1.5 → 3.0 units between centers, was 2.0).
  const bedX = ox - 1.5;
  const bedZ = oz - 0.3;
  const deskX = ox + 1.5;
  const deskZ = oz - 0.3;
  const shelfX = ox - 0.1;
  const shelfZ = oz - 1.7;

  // Furniture colliders (player-only — camera ignores).
  useEffect(() => {
    const items = [
      { id: 'mr-bed',   x: bedX,   z: bedZ,   hx: 0.78, hz: 1.05 },
      { id: 'mr-desk',  x: deskX,  z: deskZ,  hx: 0.7,  hz: 0.5  },
      { id: 'mr-shelf', x: shelfX, z: shelfZ, hx: 0.85, hz: 0.20 },
    ] as const;
    for (const it of items) registerCollider({ ...it, playerOnly: true });
    return () => { for (const it of items) unregisterCollider(it.id); };
  }, [bedX, bedZ, deskX, deskZ, shelfX, shelfZ]);

  // Deterministic pillow tints — subtle variation, stable per mount.
  const pillowTints = useMemo<readonly [string, string]>(() => {
    const rng = makeRng(PILLOW_SEED);
    // Two slightly different hues biased toward PINK_SOFT.
    const pool = [PINK_SOFT, '#fbd0da', '#f6bccc', '#ffd6e1'] as const;
    const a = pool[Math.floor(rng() * pool.length)];
    let b = pool[Math.floor(rng() * pool.length)];
    if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
    return [a, b];
  }, []);

  // Micro-animation refs (mirrors DeskLamp zero-alloc pattern).
  const scanlineRef = useRef<Mesh>(null);
  const plantLeavesRef = useRef<Mesh>(null);
  const accentLightRef = useRef<PointLight>(null);

  useFrame(({ clock }) => {
    const vm = useWorldStore.getState().viewMode;
    if (vm !== 'overview' && vm !== 'myroom') return;
    const t = clock.getElapsedTime();
    // Monitor scanline sweep — vertical oscillation across screen.
    const scan = scanlineRef.current;
    if (scan) {
      scan.position.y = SCANLINE_BASE_Y + Math.sin(t * SCANLINE_SWEEP_SPEED) * SCANLINE_SWEEP_AMPLITUDE;
    }
    // Plant foliage breathing — uniform scale pulse.
    const leaves = plantLeavesRef.current;
    if (leaves) {
      const s = 1 + Math.sin(t * PLANT_BREATH_SPEED) * PLANT_BREATH_AMPLITUDE;
      leaves.scale.setScalar(s);
    }
    // Pink accent point-light: zero-brightness-motion pass removed the
    // breathing intensity mutation. Light is now static at base value;
    // user reports ANY brightness motion as flicker so we keep all
    // intensity/emissive/opacity static and let physical motion (bob,
    // rotate, scale, position) carry all the life.
    // (intentionally empty)
  });

  return (
    <group>
      {/* ----- BED ----- */}
      {/* Base — thinner slab */}
      <mesh position={[bedX, 0.15, bedZ]}>
        <boxGeometry args={[1.5, 0.18, 2.1]} />
        <meshPhongMaterial color={WOOD} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Mattress — thicker slab */}
      <mesh position={[bedX, 0.38, bedZ]}>
        <boxGeometry args={[1.4, 0.28, 2.0]} />
        <meshPhongMaterial color={PINK} emissive={PINK} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Sheet fold — visible light/shadow edge */}
      <mesh position={[bedX, 0.545, bedZ + 0.25]}>
        <boxGeometry args={[1.42, 0.06, 1.4]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.08} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Pillow indent — two boxes with slightly different tints */}
      <mesh position={[bedX - 0.3, 0.59, bedZ - 0.75]} rotation={[0, 0.05, 0]}>
        <boxGeometry args={[0.55, 0.14, 0.35]} />
        <meshPhongMaterial color={pillowTints[0]} emissive={pillowTints[0]} emissiveIntensity={0.1} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      <mesh position={[bedX + 0.3, 0.59, bedZ - 0.75]} rotation={[0, -0.05, 0]}>
        <boxGeometry args={[0.55, 0.14, 0.35]} />
        <meshPhongMaterial color={pillowTints[1]} emissive={pillowTints[1]} emissiveIntensity={0.1} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Headboard (bed interactable) */}
      <mesh
        position={[bedX, 0.65, bedZ - 1.05]}
       
       
        onUpdate={(m) => {
          m.userData.interactable = HEADBOARD_INTERACTABLE;
        }}
      >
        <boxGeometry args={[1.5, 0.7, 0.12]} />
        <meshPhongMaterial color={WOOD} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Bed legs */}
      {BED_LEGS.map(([dx, dz], i) => (
        <mesh key={i} position={[bedX + dx, 0.05, bedZ + dz]}>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshPhongMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      {/* Folded clothes stacked at foot of bed */}
      {CLOTHES_STACK.map((c, i) => (
        <mesh
          key={`clothes-${i}`}
          position={[bedX + 0.35, 0.56 + c.dy, bedZ + 0.75]}
          rotation={[0, 0.12, 0]}
         
        >
          <boxGeometry args={[c.w, c.h, c.d]} />
          <meshPhongMaterial color={c.color} emissive={c.color} emissiveIntensity={0.08} flatShading />
        </mesh>
      ))}

      {/* ----- DESK ----- (depth shortened 1.6 → 1.0) */}
      {/* Desk top */}
      <mesh position={[deskX, 0.78, deskZ]}>
        <boxGeometry args={[1.4, 0.08, 1.0]} />
        <meshPhongMaterial color={WHITE} emissive={WHITE} emissiveIntensity={0.05} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Trim board under desk top edge */}
      <mesh position={[deskX, 0.72, deskZ]}>
        <boxGeometry args={[1.38, 0.02, 0.98]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Tapered desk legs — top chunk */}
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-top-${i}`} position={[deskX + dx, 0.55, deskZ + dz]}>
          <boxGeometry args={[0.09, 0.36, 0.09]} />
          <meshPhongMaterial color={WHITE_OFF} flatShading />
        </mesh>
      ))}
      {/* Tapered desk legs — bottom chunk (slimmer) */}
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-bot-${i}`} position={[deskX + dx, 0.19, deskZ + dz]}>
          <boxGeometry args={[0.06, 0.36, 0.06]} />
          <meshPhongMaterial color={WHITE_OFF} flatShading />
        </mesh>
      ))}
      {/* Drawer face — moved forward to match the shorter desk depth */}
      <mesh position={[deskX, 0.6, deskZ + 0.3]}>
        <boxGeometry args={[1.3, 0.22, 0.3]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Gold drawer handle — small sphere */}
      <mesh position={[deskX, 0.6, deskZ + 0.47]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshPhongMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} flatShading />
      </mesh>

      {/* Monitor frame — bumped 1.0x0.65 -> 1.2x0.72 for proper proportion */}
      <mesh position={[deskX, 1.25, deskZ - 0.5]}>
        <boxGeometry args={[1.2, 0.72, 0.06]} />
        <meshPhongMaterial color="#eeeeee" flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1.2} />
      </mesh>
      {/* Screen (monitor interactable) */}
      <mesh
        position={[deskX, 1.25, deskZ - 0.47]}
        onUpdate={(m) => {
          m.userData.interactable = MONITOR_INTERACTABLE;
        }}
      >
        <boxGeometry args={[1.02, 0.58, 0.02]} />
        <meshPhongMaterial color="#1a1a3e" emissive="#ffb6c1" emissiveIntensity={1.2} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Stand */}
      <mesh position={[deskX, 0.96, deskZ - 0.45]}>
        <boxGeometry args={[0.08, 0.32, 0.08]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Base */}
      <mesh position={[deskX, 0.82, deskZ - 0.45]}>
        <boxGeometry args={[0.32, 0.04, 0.18]} />
        <meshPhongMaterial color={WHITE_OFF} flatShading />
      </mesh>
      {/* Scanline — sweeps vertically via useFrame */}
      <mesh ref={scanlineRef} position={[deskX, SCANLINE_BASE_Y, deskZ - 0.45]}>
        <boxGeometry args={[0.95, 0.02, 0.01]} />
        <meshPhongMaterial color="#ffd0e0" emissive="#ffd0e0" emissiveIntensity={2.0} flatShading />
      </mesh>

      {/* Notebook + pen */}
      <mesh position={[deskX - 0.4, 0.82, deskZ + 0.1]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.3]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.1} flatShading />
      </mesh>
      <mesh position={[deskX - 0.1, 0.82, deskZ + 0.05]} rotation={[0, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
        <meshPhongMaterial color={GOLD} flatShading />
      </mesh>

      {/* Tiny potted plant on desk */}
      <mesh position={[deskX - 0.5, 0.87, deskZ - 0.3]}>
        <cylinderGeometry args={[0.07, 0.06, 0.1, 8]} />
        <meshPhongMaterial color="#c06850" flatShading />
      </mesh>
      <mesh ref={plantLeavesRef} position={[deskX - 0.5, 0.99, deskZ - 0.3]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshPhongMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.18} flatShading />
      </mesh>

      {/* Desk lamp with subtle pulsing glow */}
      <DeskLamp
        x={deskX + 0.5}
        y={0.82}
        z={deskZ - 0.3}
        color="#ffd700"
        lightColor="#ffd6a8"
        intensity={1.0}
        distance={6}
        bodyColor={WHITE_OFF}
        pulse
      />

      {/* ----- BOOKSHELF ----- */}
      <Bookshelf
        x={shelfX}
        z={shelfZ}
        rows={3}
        booksPerRow={4}
        width={1.2}
        depth={0.3}
        rowSpacing={0.5}
        baseY={0.45}
        backPanelColor={SHELF_BACK}
        plankColor={WOOD}
        bookColors={SHELF_BOOK_COLORS}
        seed={0xb00c5}
        heroBookCount={3}
        edgeColor={EDGE_COLOR}
      />

      {/* ----- TROPHY DISPLAY (top of bookshelf) -----
          4 NHSDLC debate trophies — 2 silver (Runners-up) + 2 gold
          (Champion). Top cap plank above the books, then trophies on
          top of the cap with hover-visible labels. */}
      {/* Top cap plank */}
      <mesh position={[shelfX, 1.85, shelfZ]}>
        <boxGeometry args={[1.25, 0.04, 0.32]} />
        <meshPhongMaterial color={WOOD} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {[
        {
          dx: -0.36,
          color: '#cbd5e1',
          short: 'Online2',
          title: 'NHSDLC Fall 2025 — Online 2 (Runners-up)',
          body:
            "🥈 Silver — Novice Division\n" +
            "Tournament: NHSDLC Fall Online 2\n" +
            "Format: Public Forum, two-person teams, 4 prelim rounds + elimination bracket.\n\n" +
            "First serious finish of the fall season. Made it to the grand final by out-prepping every team in the bracket on the second contention, then ran out of road in the last round when the opp side dropped a framework I hadn't seen before. Silver tasted like motivation, not consolation — knew exactly what to fix for the next one.",
        },
        {
          dx: -0.12,
          color: '#cbd5e1',
          short: 'Online4',
          title: 'NHSDLC 2025 — Online 4 (Runners-up)',
          body:
            "🥈 Silver — Novice Division\n" +
            "Tournament: NHSDLC Online 4\n" +
            "Format: Public Forum, two-person teams.\n\n" +
            "Back-to-back runners-up. Online 4 was a turnaround tournament — sharper case prep, faster rebuttals, finally felt comfortable in cross-fire. Lost the final on a single dropped link in summary that the other team weaponized in the last 30 seconds. Closer than the score suggests, and the prep work from this run carried straight into the BJ offline win.",
        },
        {
          dx: 0.12,
          color: '#fbbf24',
          short: 'BJ Offline',
          title: 'NHSDLC Fall 2025 — Beijing Offline (CHAMPION)',
          body:
            "🥇 Gold — Novice Division CHAMPION\n" +
            "Tournament: NHSDLC Fall Beijing Offline\n" +
            "Format: Public Forum, in-person, three days, six elimination rounds.\n\n" +
            "First in-person tournament. First in-person win. Different energy from online — judges in the room with you, real handshakes, the silence after a closing argument that lands. The semifinal was the hardest round of the season; the final felt almost calm by comparison because everything we'd practiced from the silver finishes was finally muscle memory. Walked out with the cup and the sense that I actually belonged here.",
        },
        {
          dx: 0.36,
          color: '#fbbf24',
          short: 'Online6',
          title: 'NHSDLC Fall 2025 — Online 6 (CHAMPION)',
          body:
            "🥇 Gold — Novice Division CHAMPION\n" +
            "Tournament: NHSDLC Online 6\n" +
            "Format: Public Forum, two-person teams.\n\n" +
            "Second championship of the fall season. Online 6 closed the run with another novice-division win — same partner, same prep system, but with a year's worth of confidence built up. The final round was the cleanest debate I've given so far: tight framework, three independent links, every rebuttal pre-flagged in case construction. This trophy is here because the fall season started with two losses in finals and ended with two wins — and the gap between those two pairs is the entire reason this room exists.",
        },
      ].map((t, i) => {
        const interactable = { title: t.title, body: t.body };
        const handleClick = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          useWorldStore.getState().openModal(interactable);
        };
        const handlePointerOver = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        };
        const handlePointerOut = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = '';
        };
        const attachInteractable = (m: Mesh | null) => {
          if (m) m.userData.interactable = interactable;
        };
        return (
          <group key={`trophy-${i}`} position={[shelfX + t.dx, 0, shelfZ + 0.05]}>
            {/* Dark wood base — clickable */}
            <mesh
              position={[0, 1.92, 0]}
             
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.085, 0.035, 0.07]} />
              <meshPhongMaterial color="#2a1810" flatShading />
              <Edges color={EDGE_COLOR} lineWidth={1} />
            </mesh>
            {/* Stem — clickable */}
            <mesh
              position={[0, 1.965, 0]}
             
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.022, 0.04, 0.022]} />
              <meshPhongMaterial color={t.color} emissive={t.color} emissiveIntensity={0.35} flatShading />
            </mesh>
            {/* Cup — primary click target */}
            <mesh
              position={[0, 2.025, 0]}
             
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.075, 0.06, 0.05]} />
              <meshPhongMaterial color={t.color} emissive={t.color} emissiveIntensity={0.4} flatShading />
              <Edges color={EDGE_COLOR} lineWidth={1.2} />
            </mesh>
            {/* Side handles — also clickable */}
            <mesh
              position={[-0.045, 2.025, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.012, 0.035, 0.012]} />
              <meshPhongMaterial color={t.color} emissive={t.color} emissiveIntensity={0.35} flatShading />
            </mesh>
            <mesh
              position={[0.045, 2.025, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.012, 0.035, 0.012]} />
              <meshPhongMaterial color={t.color} emissive={t.color} emissiveIntensity={0.35} flatShading />
            </mesh>
            {/* No floating labels — discoverability comes from:
                (a) the cursor changing to a pointer on hover, and
                (b) the existing InteractTooltip in the HUD that says
                "Click to read · or press E" when looking at any
                trophy in FP mode. Way less visually noisy than the
                always-visible labels and gold "click to read" pill. */}
          </group>
        );
      })}

      {/* ----- MEDAL DISPLAY (mounted on bookshelf back, BELOW trophies) -----
          3 NHSDLC speaker medals — pulled back onto the same bookshelf as
          the trophies per user request. They sit on a thin display ledge
          attached to the shelf back panel, stacked directly below the
          trophy cap so the visual hierarchy reads top→bottom: trophies,
          medals, photo frames. */}
      <mesh position={[shelfX, 1.45, shelfZ]}>
        <boxGeometry args={[1.20, 0.02, 0.30]} />
        <meshPhongMaterial color={WOOD} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {[
        {
          dx: -0.32,
          ribbon: '#3b82f6', // blue ribbon
          disc: '#cd7f32',   // bronze
          short: 'Online2 3rd Speaker',
          title: 'NHSDLC Fall 2025 — Online 2 · 3rd Speaker (Novice)',
          body:
            "🥉 3rd Speaker — Novice Division\n" +
            "Tournament: NHSDLC Fall Online 2\n\n" +
            "Individual speaker award alongside the team's Runners-up finish. Speaker points are scored round-by-round by judges across the prelims and the elimination bracket — being top-3 in a novice field of ~80 speakers means I was consistently the clearest, most well-organized speaker in the rooms I debated in. Cross-fire was the round I leveled up the most: stopped reading prepared questions and started actually responding to what the opp had just said.",
        },
        {
          dx: 0,
          ribbon: '#dc2626', // red ribbon
          disc: '#cd7f32',
          short: 'BJ Offline 4th Speaker',
          title: 'NHSDLC Fall 2025 — Beijing Offline · 4th Speaker (Novice)',
          body:
            "🏅 4th Speaker — Novice Division\n" +
            "Tournament: NHSDLC Fall Beijing Offline\n\n" +
            "Same tournament where my partner and I won Champion. The 4th speaker placement is the in-person speaker score — which, unlike online, includes presence: how you stand, how you make eye contact with the judge, whether your voice fills the room. Walking out with both the team gold AND a top-5 speaker award from an in-person field was the proudest moment of the season.",
        },
        {
          dx: 0.32,
          ribbon: '#16a34a', // green ribbon
          disc: '#cd7f32',
          short: 'Online6 6th Speaker',
          title: 'NHSDLC Fall 2025 — Online 6 · 6th Speaker (Novice)',
          body:
            "🏅 6th Speaker — Novice Division\n" +
            "Tournament: NHSDLC Fall Online 6\n\n" +
            "Individual award from the same Online 6 tournament where the team won Champion. By this point in the season, the speaker award almost felt secondary — the real signal was that the prep system was working: same partner, same prep workflow, two championships in three tournaments. 6th in a novice field of ~100 speakers is the kind of consistency I'm proud of.",
        },
      ].map((m, i) => {
        const interactable = { title: m.title, body: m.body };
        const handleClick = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          useWorldStore.getState().openModal(interactable);
        };
        const handlePointerOver = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        };
        const handlePointerOut = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = '';
        };
        const attachInteractable = (mesh: Mesh | null) => {
          if (mesh) mesh.userData.interactable = interactable;
        };
        return (
          <group key={`medal-${i}`} position={[shelfX + m.dx, 0, shelfZ + 0.05]}>
            {/* Ribbon — short colored bar above the disc */}
            <mesh
              position={[0, 1.56, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.05, 0.08, 0.012]} />
              <meshPhongMaterial color={m.ribbon} emissive={m.ribbon} emissiveIntensity={0.35} flatShading />
              <Edges color={EDGE_COLOR} lineWidth={1} />
            </mesh>
            {/* Disc — chunky cylinder body */}
            <mesh
              position={[0, 1.50, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <cylinderGeometry args={[0.05, 0.05, 0.018, 16]} />
              <meshPhongMaterial color={m.disc} emissive={m.disc} emissiveIntensity={0.4} flatShading />
              <Edges color={EDGE_COLOR} lineWidth={1.2} />
            </mesh>
            {/* Inner disc highlight — tiny gold star marker */}
            <mesh
              position={[0, 1.50, 0.012]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.022, 0.022, 0.005]} />
              <meshPhongMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.6} flatShading />
            </mesh>
          </group>
        );
      })}

      {/* ----- PHOTO FRAMES (mounted on bookshelf, lowest tier) -----
          Three empty wood-edged frames — pulled onto the same bookshelf as
          the trophies + medals so all three layers stack on the SAME unit.
          Order top→bottom: trophies (1.85), medals (1.50), frames (1.05). */}
      <mesh position={[shelfX, 1.00, shelfZ]}>
        <boxGeometry args={[1.20, 0.02, 0.30]} />
        <meshPhongMaterial color={WOOD} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {[
        {
          dx: -0.4,
          photoColor: '#f5d0c4',
          title: 'Photo Frame 1 (placeholder)',
          body:
            "📷 Photo coming soon.\n\n" +
            "Suri will fill this slot with a real photo. The frame is " +
            "already wired — drop in the image and a caption and it'll " +
            "render in this modal.",
        },
        {
          dx: 0,
          photoColor: '#d4e4f5',
          title: 'Photo Frame 2 (placeholder)',
          body:
            "📷 Photo coming soon.\n\n" +
            "Suri will fill this slot with a real photo. The frame is " +
            "already wired — drop in the image and a caption and it'll " +
            "render in this modal.",
        },
        {
          dx: 0.4,
          photoColor: '#dcecd4',
          title: 'Photo Frame 3 (placeholder)',
          body:
            "📷 Photo coming soon.\n\n" +
            "Suri will fill this slot with a real photo. The frame is " +
            "already wired — drop in the image and a caption and it'll " +
            "render in this modal.",
        },
      ].map((f, i) => {
        const interactable = { title: f.title, body: f.body };
        const handleClick = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          useWorldStore.getState().openModal(interactable);
        };
        const handlePointerOver = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        };
        const handlePointerOut = (e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = '';
        };
        const attachInteractable = (mesh: Mesh | null) => {
          if (mesh) mesh.userData.interactable = interactable;
        };
        return (
          <group key={`frame-${i}`} position={[shelfX + f.dx, 0, shelfZ + 0.05]}>
            {/* Outer dark wood frame */}
            <mesh
              position={[0, 1.20, 0]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.30, 0.30, 0.025]} />
              <meshPhongMaterial color={FRAME_DARK} flatShading />
              <Edges color={EDGE_COLOR} lineWidth={1.2} />
            </mesh>
            {/* Inner photo plate — pastel placeholder */}
            <mesh
              position={[0, 1.20, 0.014]}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
              ref={attachInteractable}
            >
              <boxGeometry args={[0.24, 0.24, 0.005]} />
              <meshPhongMaterial color={f.photoColor} emissive={f.photoColor} emissiveIntensity={0.25} flatShading />
            </mesh>
          </group>
        );
      })}

      {/* ----- RUG + INNER BORDER ----- */}
      <mesh position={[bedX, 0.075, bedZ + 0.7]}>
        <boxGeometry args={[1.8, 0.03, 1.2]} />
        <meshPhongMaterial color={PINK_DUSTY} emissive={PINK_DUSTY} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Rug inner border — 4 thin strips */}
      <mesh position={[bedX, 0.095, bedZ + 0.19]}>
        <boxGeometry args={[1.55, 0.005, 0.04]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>
      <mesh position={[bedX, 0.095, bedZ + 1.21]}>
        <boxGeometry args={[1.55, 0.005, 0.04]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>
      <mesh position={[bedX - 0.79, 0.095, bedZ + 0.7]}>
        <boxGeometry args={[0.04, 0.005, 1.06]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>
      <mesh position={[bedX + 0.79, 0.095, bedZ + 0.7]}>
        <boxGeometry args={[0.04, 0.005, 1.06]} />
        <meshPhongMaterial color={PINK_DARK} emissive={PINK_DARK} emissiveIntensity={0.25} flatShading />
      </mesh>

      {/* ----- FRAMED PICTURE ON WALL ----- */}
      {/* Frame — raised to decrowd shelf top */}
      <mesh position={[ox + 0.9, 1.85, oz - 1.92]}>
        <boxGeometry args={[0.5, 0.4, 0.04]} />
        <meshPhongMaterial color={FRAME_DARK} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Frame center — lighter */}
      <mesh position={[ox + 0.9, 1.85, oz - 1.9]}>
        <boxGeometry args={[0.4, 0.3, 0.02]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.2} flatShading />
      </mesh>

      {/* ----- CURTAINS ----- */}
      {/* Rod — pulled forward alongside panels to avoid back-wall clip */}
      <mesh position={[bedX, 2.1, oz - 1.89]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
        <meshPhongMaterial color={GOLD} flatShading />
      </mesh>
      {/* Left curtain panel — z shifted 0.05 forward from back wall */}
      <mesh position={[bedX - 0.45, 1.5, oz - 1.88]}>
        <boxGeometry args={[0.3, 1.1, 0.04]} />
        <meshPhongMaterial color={PINK_SOFT} emissive={PINK_SOFT} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>
      {/* Right curtain panel — slightly darker */}
      <mesh position={[bedX + 0.45, 1.5, oz - 1.88]}>
        <boxGeometry args={[0.3, 1.1, 0.04]} />
        <meshPhongMaterial color={PINK_DUSTY} emissive={PINK_DUSTY} emissiveIntensity={0.12} flatShading />
        <Edges color={EDGE_COLOR} lineWidth={1} />
      </mesh>

      {/* ----- PINK ACCENT POINT LIGHT ----- breathes base 0.3, ±10% @ 0.6 Hz */}
      <pointLight
        ref={accentLightRef}
        color="#f4a8b8"
        intensity={ACCENT_LIGHT_BASE}
        distance={3}
        position={[bedX, 0.9, bedZ]}
      />
    </group>
  );
}
