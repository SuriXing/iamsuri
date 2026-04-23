import { useEffect, useRef, useState } from 'react';
import { registerCollider, unregisterCollider } from '../colliders';
import { Edges, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
// Named imports — namespace import defeats tree-shaking of three.
import { Mesh } from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { ROOM } from '../../constants';
import { PRODUCT_ROOM_CONTENT, PROJECT_SHOWCASE_ENTRIES } from '../../../data/productRoom';
import { useWorldStore } from '../../store/worldStore';
import type { InteractableData } from '../../store/worldStore';

const PROBLEM_SOLVER: InteractableData = PRODUCT_ROOM_CONTENT.dialogues.problemSolver;
const MENTOR_TABLE: InteractableData = PRODUCT_ROOM_CONTENT.dialogues.mentorTable;

// --- Tech / startup-war-room palette (cool slate + cyan) ---
const SLATE_DEEP = '#1e293b';
const SLATE_MID = '#334155';
const SLATE_LIGHT = '#475569';
const METAL = '#8a93a0';
const METAL_LIGHT = '#b7c0cc';
const WHITE_COOL = '#e6ecf2';
const CYAN = '#22d3ee';
const CYAN_DIM = '#0ea5b7';
const CABLE_BLACK = '#0f172a';
const WOOD_WARM = '#8a6f4d';

// PR1.7: cool-palette overrides for warm data accents (D3). Data file
// stays canonical (brand truth); the room re-temperatures the warm
// accents toward the cool slate axis at render time.
const COOL_ACCENT_OVERRIDE: Record<string, string> = {
  '#facc15': '#5eead4', // saturated yellow → mint
  '#fb7185': '#c4b5fd', // coral pink → lavender
};

// ---- Micro-anim constants (module-scope = zero per-frame alloc) ----
// PR1.8 hero focal: rotating logo cube spin rate (rad/s, ≤0.5).
const HERO_CUBE_SPIN_SPEED = 0.4;

// PR1.4: 3 explicit slate plank tiers (BookRoom-style discrete pattern).
const PLANK_TIERS: ReadonlyArray<string> = ['#1e293b', '#334155', '#475569'];

// PR1.11 (D1): per-station silhouette variation — 4 stations now
// (one per PROJECT_SHOWCASE_ENTRIES entry, no duplicates).
interface StationVariant {
  plinthH: number;
  plinthW: number;
  monitorW: number;
  monitorH: number;
  top: 'slate' | 'wood' | 'metal';
  stacked?: boolean;
}
const STATION_VARIANTS: ReadonlyArray<StationVariant> = [
  { plinthH: 0.85, plinthW: 0.70, monitorW: 0.95, monitorH: 0.45, top: 'slate' },
  { plinthH: 0.95, plinthW: 0.62, monitorW: 0.55, monitorH: 0.70, top: 'wood' },
  { plinthH: 0.78, plinthW: 0.74, monitorW: 0.85, monitorH: 0.55, top: 'slate' },
  { plinthH: 0.92, plinthW: 0.70, monitorW: 0.85, monitorH: 0.40, top: 'metal', stacked: true },
];

// PR1.7: shallow V z-stagger (D4). Outer stations toward door (smaller z),
// center stations away (larger z). Returns ±0.15 m max around oz+1.55.
function stationDz(i: number, n: number): number {
  if (n <= 1) return 0;
  const half = (n - 1) / 2;
  const dist = Math.abs(i - half) / half; // 0 center, 1 edge
  return -0.15 + (1 - dist) * 0.30;
}

interface StationConfig {
  id: string;
  title: string;
  body: string;
  link?: string;
  accent: string;
}

// PR1.11 (PM-1 fix): STATIONS derives PURELY from PROJECT_SHOWCASE_ENTRIES
// (no prepended dialogue stations). For entries that match the legacy
// dialogue ids, hydrate body/link from the canonical
// PRODUCT_ROOM_CONTENT.dialogues so the rich pitch is preserved.
function buildStations(): ReadonlyArray<StationConfig> {
  return PROJECT_SHOWCASE_ENTRIES.map((e) => {
    if (e.id === 'problem-solver') {
      return {
        id: `station-${e.id}`,
        title: PROBLEM_SOLVER.title,
        body: PROBLEM_SOLVER.body,
        ...(PROBLEM_SOLVER.link ? { link: PROBLEM_SOLVER.link } : {}),
        accent: e.accent,
      };
    }
    if (e.id === 'mentor-table') {
      return {
        id: `station-${e.id}`,
        title: MENTOR_TABLE.title,
        body: MENTOR_TABLE.body,
        ...(MENTOR_TABLE.link ? { link: MENTOR_TABLE.link } : {}),
        accent: e.accent,
      };
    }
    return {
      id: `station-${e.id}`,
      title: e.title,
      body: e.pitch,
      ...(e.link ? { link: e.link } : {}),
      accent: COOL_ACCENT_OVERRIDE[e.accent] ?? e.accent,
    };
  });
}

const STATIONS: ReadonlyArray<StationConfig> = buildStations();
const STATION_SPAN = 4.2; // back-wall span used for x layout
const STATION_STRIDE =
  STATIONS.length > 1 ? STATION_SPAN / (STATIONS.length - 1) : 0;

function stationX(i: number, ox: number): number {
  return ox + (i - (STATIONS.length - 1) / 2) * STATION_STRIDE;
}

export function ProductRoom() {
  const { center } = ROOM_BY_ID.product;
  const ox = center.x;
  const oz = center.z;

  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  // PR1.8 hero focal: rotating logo cube inside glass display case.
  const heroCubeRef = useRef<Mesh>(null);

  // PR1.11 (F-R-4 fix): subscribe to prefers-reduced-motion changes
  // instead of reading once via useMemo. User toggling OS setting
  // mid-session now stops/resumes hero rotation without a remount.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useFrame(({ clock }) => {
    const vm = useWorldStore.getState().viewMode;
    if (vm !== 'overview' && vm !== 'product') return;
    // PR1.8 hero focal: Y-axis rotation only, gated on reduced-motion.
    // No emissiveIntensity / scale changes per spec.
    if (!prefersReducedMotion) {
      const cube = heroCubeRef.current;
      if (cube) cube.rotation.y = clock.getElapsedTime() * HERO_CUBE_SPIN_SPEED;
    }
  });

  // Furniture colliders (player-only). PR1.11: legacy desk/rack/crate
  // colliders deleted along with their geometry. Only station + hero
  // colliders remain.
  useEffect(() => {
    const stationItems = STATIONS.map((_, i) => ({
      id: `pr-station-${i}`,
      x: stationX(i, ox),
      z: oz + 1.55 + stationDz(i, STATIONS.length),
      hx: 0.45,
      hz: 0.3,
    }));
    const items = [
      // PR1.8: hero focal pedestal — playerOnly so avatar bounces
      // off the glass case but camera wall-clip ignores it.
      { id: 'pr-hero',  x: ox,     z: oz + 2.05, hx: 0.30, hz: 0.30 },
      ...stationItems,
    ];
    for (const it of items) registerCollider({ ...it, playerOnly: true });
    return () => { for (const it of items) unregisterCollider(it.id); };
  }, [ox, oz]);

  return (
    <group>
      {/* ----- FLOOR STAGE — base slab + 8 planks ----- */}
      <mesh position={[ox, 0.18, oz]}>
        <boxGeometry args={[ROOM, 0.02, ROOM]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const px = ox + (i - 3.5) * 0.6;
        const tint = PLANK_TIERS[i % 3];
        return (
          <mesh key={`plank-${i}`} position={[px, 0.225, oz]}>
            <boxGeometry args={[0.58, 0.04, ROOM - 0.04]} />
            <meshPhongMaterial color={tint} flatShading />
            <Edges color={edgeColor} lineWidth={1} />
          </mesh>
        );
      })}
      {/* Entry rug at door (-z side). PR1.11 (F-R-4 fix): borders lifted
          to y=0.27 (1cm above rug top 0.2575) to clear sub-cm overlap. */}
      <mesh position={[ox, 0.255, oz - 1.6]}>
        <boxGeometry args={[2.0, 0.005, 1.2]} />
        <meshPhongMaterial color={SLATE_LIGHT} flatShading />
      </mesh>
      <mesh position={[ox, 0.27, oz - 1.6 - 0.58]}>
        <boxGeometry args={[1.92, 0.006, 0.04]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[ox, 0.27, oz - 1.6 + 0.58]}>
        <boxGeometry args={[1.92, 0.006, 0.04]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[ox - 0.98, 0.27, oz - 1.6]}>
        <boxGeometry args={[0.04, 0.006, 1.12]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[ox + 0.98, 0.27, oz - 1.6]}>
        <boxGeometry args={[0.04, 0.006, 1.12]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>

      {/* ----- BASEBOARDS ----- */}
      <mesh position={[ox, 0.25, oz - 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox, 0.25, oz + 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox - 2.45, 0.25, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox + 2.45, 0.25, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- TOP TRIM / COVE ----- */}
      <mesh position={[ox, 2.85, oz - 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox, 2.85, oz + 2.45]}>
        <boxGeometry args={[ROOM, 0.12, 0.05]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox - 2.45, 2.85, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox + 2.45, 2.85, oz]}>
        <boxGeometry args={[0.05, 0.12, ROOM - 0.10]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- CEILING RECESSED LIGHT COVE PANEL ----- */}
      <mesh position={[ox, 2.92, oz]}>
        <boxGeometry args={[3.0, 0.04, 3.0]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cell = 0.86;
        const step = 0.92;
        const cx = ox + (col - 1) * step;
        const cz = oz + (row - 1) * step;
        return (
          <mesh key={`coffer-${i}`} position={[cx, 2.88, cz]}>
            <boxGeometry args={[cell, 0.02, cell]} />
            <meshPhongMaterial color={WHITE_COOL} emissive={WHITE_COOL} emissiveIntensity={0.4} flatShading />
          </mesh>
        );
      })}

      {/* ----- PROJECT STATIONS — unified row of 4 along back wall (+z).
          PR1.11 (PM-1 fix): now derives 1:1 from PROJECT_SHOWCASE_ENTRIES.
          No duplicates; PROBLEM_SOLVER + MENTOR_TABLE rich dialogues are
          mapped onto the matching entries by id. Legacy desk + dual
          monitors + server rack + crates + product cubes deleted (PM-2 /
          designer F-1) — the station row is the sole midground now. ----- */}
      {STATIONS.map((s, i) => {
        const v = STATION_VARIANTS[i] ?? STATION_VARIANTS[0];
        const sx = stationX(i, ox);
        const sz = oz + 1.55 + stationDz(i, STATIONS.length);
        const interactable: InteractableData = {
          title: s.title,
          body: s.body,
          ...(s.link ? { link: s.link } : {}),
        };
        // PR1.11 (F-R-1 fix): foot kick raised to y=0.305 (≥1cm above
        // plank top y=0.245 → 6cm clearance).
        const footY = 0.305;
        // Plinth body sits on top of foot kick (y=0.33).
        const plinthBaseY = 0.33;
        const plinthCenterY = plinthBaseY + v.plinthH / 2;
        const trimY = plinthBaseY + v.plinthH + 0.02;
        const monitorY = plinthBaseY + v.plinthH + 0.40;
        const topColor =
          v.top === 'wood' ? WOOD_WARM :
          v.top === 'metal' ? METAL_LIGHT :
          SLATE_LIGHT;

        return (
          <group key={s.id}>
            {/* Foot kick — y=0.305 (6cm above plank top 0.245), F-R-1 fix */}
            <mesh position={[sx, footY, sz]}>
              <boxGeometry args={[v.plinthW + 0.04, 0.05, 0.59]} />
              <meshPhongMaterial color={SLATE_DEEP} flatShading />
            </mesh>
            {/* Plinth body — varies in height + width per variant (D1) */}
            <mesh position={[sx, plinthCenterY, sz]}>
              <boxGeometry args={[v.plinthW, v.plinthH, 0.55]} />
              <meshPhongMaterial color={SLATE_MID} flatShading />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
            {/* Top trim band — material varies (slate / wood / metal, D1) */}
            <mesh position={[sx, trimY, sz]}>
              <boxGeometry args={[v.plinthW + 0.02, 0.04, 0.57]} />
              <meshPhongMaterial color={topColor} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Monitor neck */}
            <mesh position={[sx, monitorY - v.monitorH / 2 - 0.12, sz + 0.02]}>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshPhongMaterial color={METAL} flatShading />
            </mesh>
            {/* Monitor bezel — faces -z */}
            <mesh position={[sx, monitorY, sz]}>
              <boxGeometry args={[v.monitorW, v.monitorH, 0.06]} />
              <meshPhongMaterial color={SLATE_DEEP} flatShading />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
            {/* Screen face — interactable. F3: pushed 4cm in front of bezel
                front (bezel front at sz-0.03; screen at sz-0.07).
                PR1.11 (F-2 fix): emissive lowered 1.6 → 1.0 so hero
                cube (now 1.6) dominates the visual hierarchy. */}
            <mesh
              position={[sx, monitorY, sz - 0.07]}
              onUpdate={(m) => {
                m.userData.interactable = interactable;
              }}
            >
              <boxGeometry args={[v.monitorW - 0.11, v.monitorH - 0.11, 0.02]} />
              <meshPhongMaterial
                color="#0a1830"
                emissive={s.accent}
                emissiveIntensity={1.0}
                flatShading
              />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Optional stacked secondary screen (variant 3 only) */}
            {v.stacked && (
              <mesh position={[sx, monitorY + v.monitorH / 2 + 0.20, sz - 0.07]}>
                <boxGeometry args={[v.monitorW - 0.30, 0.22, 0.02]} />
                <meshPhongMaterial
                  color="#0a1830"
                  emissive={s.accent}
                  emissiveIntensity={0.9}
                  flatShading
                />
                <Edges color={edgeColor} lineWidth={1} />
              </mesh>
            )}
            {/* Readable project label — drei <Html transform> (D2).
                Faces -z (toward door). pointer-events: none. Sized to
                read from ~3m. */}
            <Html
              transform
              position={[sx, monitorY - v.monitorH / 2 - 0.18, sz - 0.08]}
              rotation={[0, Math.PI, 0]}
              distanceFactor={1}
              pointerEvents="none"
              zIndexRange={[10, 0]}
            >
              <div
                style={{
                  color: WHITE_COOL,
                  background: 'rgba(15, 23, 42, 0.88)',
                  border: `1px solid ${s.accent}`,
                  padding: '4px 14px',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '34px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  borderRadius: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {s.title}
              </div>
            </Html>

            {/* Cable coil under EVERY plinth (lived-in mess, D5). Slight
                size variation by index. */}
            <mesh position={[sx - 0.28, 0.265, sz + 0.18]}>
              <cylinderGeometry args={[0.05 + (i % 3) * 0.008, 0.05, 0.04, 10]} />
              <meshPhongMaterial color={CABLE_BLACK} flatShading />
            </mesh>

            {/* Lived-in props (D5) — sprinkled on selected stations.
                PR1.11 polish: stations 0 & 2 also get small props so all
                4 stations carry distinct silhouette detail. */}
            {i === 0 && (
              // small white coffee mug on plinth
              <group>
                <mesh position={[sx + 0.18, plinthBaseY + v.plinthH + 0.085, sz + 0.05]}>
                  <cylinderGeometry args={[0.05, 0.045, 0.10, 10]} />
                  <meshPhongMaterial color={WHITE_COOL} flatShading />
                  <Edges color={edgeColor} lineWidth={1} />
                </mesh>
              </group>
            )}
            {i === 1 && (
              // knocked-over mug coaster (flat disc, slightly rotated)
              <mesh
                position={[sx - 0.18, plinthBaseY + v.plinthH + 0.045, sz + 0.05]}
                rotation={[0, 0.3, 0]}
              >
                <cylinderGeometry args={[0.06, 0.06, 0.005, 12]} />
                <meshPhongMaterial color={SLATE_DEEP} flatShading />
              </mesh>
            )}
            {i === 2 && (
              // small gold trophy block
              <mesh
                position={[sx - 0.20, plinthBaseY + v.plinthH + 0.085, sz + 0.04]}
              >
                <boxGeometry args={[0.06, 0.12, 0.04]} />
                <meshPhongMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.25} flatShading />
                <Edges color={edgeColor} lineWidth={1} />
              </mesh>
            )}
            {i === 3 && (
              // pen on plinth edge
              <mesh
                position={[sx + 0.20, plinthBaseY + v.plinthH + 0.045, sz - 0.18]}
                rotation={[0, 0.4, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.008, 0.008, 0.13, 8]} />
                <meshPhongMaterial color={CYAN_DIM} flatShading />
              </mesh>
            )}
          </group>
        );
      })}

      {/* ----- PR1.8 HERO FOCAL — glass display case w/ rotating logo cube -----
          Anchors the back-wall composition behind the station row. Pedestal
          + brushed-metal cap + 4 thin transparent glass walls + glass top +
          floating cyan cube. Cube spins on Y only (≤0.5 rad/s), gated on
          prefers-reduced-motion. NO emissiveIntensity / scale changes per
          zero-brightness-motion rule. Collider registered above (pr-hero).
          PR1.11 (F-2 fix): cube emissive boosted 0.9 → 1.6 (still STATIC,
          no per-frame change) so the hero outranks the 4 station screens
          (now 1.0). */}
      {(() => {
        const hx = ox;
        const hz = oz + 2.05;
        // Pedestal y=0..0.6 ; cap at 0.62 ; glass case body 0.65..1.25
        const caseW = 0.45;
        const caseH = 0.6;
        const caseBaseY = 0.65;
        const caseTopY = caseBaseY + caseH;
        const wallT = 0.015;
        return (
          <group>
            {/* Pedestal block (slate) */}
            <mesh position={[hx, 0.30, hz]}>
              <boxGeometry args={[0.55, 0.6, 0.55]} />
              <meshPhongMaterial color={SLATE_DEEP} flatShading />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
            {/* Brushed-metal cap */}
            <mesh position={[hx, 0.62, hz]}>
              <boxGeometry args={[0.58, 0.04, 0.58]} />
              <meshPhongMaterial color={METAL_LIGHT} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Glass case — 4 thin transparent side walls + top */}
            {/* front (-z) */}
            <mesh position={[hx, caseBaseY + caseH / 2, hz - caseW / 2]}>
              <boxGeometry args={[caseW, caseH, wallT]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* back (+z) */}
            <mesh position={[hx, caseBaseY + caseH / 2, hz + caseW / 2]}>
              <boxGeometry args={[caseW, caseH, wallT]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* left (-x) */}
            <mesh position={[hx - caseW / 2, caseBaseY + caseH / 2, hz]}>
              <boxGeometry args={[wallT, caseH, caseW]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* right (+x) */}
            <mesh position={[hx + caseW / 2, caseBaseY + caseH / 2, hz]}>
              <boxGeometry args={[wallT, caseH, caseW]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.18} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* top */}
            <mesh position={[hx, caseTopY, hz]}>
              <boxGeometry args={[caseW + 0.01, wallT, caseW + 0.01]} />
              <meshPhongMaterial color={WHITE_COOL} transparent opacity={0.22} flatShading />
              <Edges color={edgeColor} lineWidth={1} />
            </mesh>
            {/* Logo cube — floats inside, spins on Y only. Static emissive
                (no per-frame brightness). PR1.11 (F-2 fix): 0.9 → 1.6. */}
            <mesh
              ref={heroCubeRef}
              position={[hx, caseBaseY + caseH / 2, hz]}
            >
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              <meshPhongMaterial
                color={CYAN}
                emissive={CYAN}
                emissiveIntensity={1.6}
                flatShading
              />
              <Edges color={edgeColor} lineWidth={1.2} />
            </mesh>
          </group>
        );
      })()}

      {/* ----- PR1.11 LAYERED LIGHTING (≤8 point lights; now 5) -----
          Stations went 6 → 4, so per-station accents shrink with them.
          Final budget: 1 key + 1 fill + 1 hero accent + 1 shared(0+1) +
          2 per-station(2,3) = 6 lights. PR1.11 (F-3 fix): key restored
          to cool white #e6ecf2 per design-note (was warm #ffd9b0). */}
      {/* 1. Key — top-down COOL white wash, centered on room */}
      <pointLight
        position={[ox, 2.7, oz]}
        color="#e6ecf2"
        intensity={0.9}
        distance={9}
      />
      {/* 2. Fill — soft cool lavender bounce on entry side (opposite key) */}
      <pointLight
        position={[ox, 2.4, oz - 1.6]}
        color="#93c5fd"
        intensity={0.4}
        distance={9}
      />
      {/* 3. Hero accent — cyan on the glass display case + logo cube */}
      <pointLight
        position={[ox, 1.5, oz + 1.7]}
        color={CYAN}
        intensity={0.7}
        distance={5}
      />
      {/* 4. Stations 0+1 shared accent (mint-cyan blend of cyan + green) */}
      <pointLight
        position={[stationX(0, ox) + STATION_STRIDE / 2, 2.0, oz + 1.4]}
        color="#5eead4"
        intensity={0.35}
        distance={3.5}
      />
      {/* 5–6. Per-station accents for stations 2 & 3 (within 1.5m each) */}
      {[2, 3].map((i) => (
        <pointLight
          key={`station-accent-${i}`}
          position={[stationX(i, ox), 2.0, oz + 1.4]}
          color={STATIONS[i]?.accent ?? CYAN}
          intensity={0.35}
          distance={3.5}
        />
      ))}
    </group>
  );
}
