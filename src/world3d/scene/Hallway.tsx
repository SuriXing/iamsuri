import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { ROOM, GAP, FLOOR_Y } from '../constants';
import { useWorldStore } from '../store/worldStore';
import { makeRng } from '../util/rand';

const HALL_COLOR = '#1e2233';
const HALL_LEN = ROOM * 2 + GAP * 2 + 1;
const HALL_WIDTH = GAP * 2;

// Ceiling beam positions along the hallway Z axis (main axis).
const BEAM_Z: ReadonlyArray<number> = [-4.5, -2.5, -0.5, 1.5, 3.5];
// Crosshatch beams along X axis (cross-corridor).
const BEAM_X: ReadonlyArray<number> = [-4.5, -2.5, 2.5, 4.5];

// F3.21: per-beam color tint pool — mulberry32-seeded ±3% lightness jitter
// breaks the "all 9 beams identical" silhouette. Hoisted to module scope so
// tints are baked once and never re-allocate.
const BEAM_BASE_HEX = '#3a2510';

function buildBeamTints(count: number, seed: number): string[] {
  const rng = makeRng(seed);
  const base = new THREE.Color(BEAM_BASE_HEX);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  const out: string[] = new Array(count);
  for (let i = 0; i < count; i++) {
    // ±0.03 lightness delta = ~±3%
    const dl = (rng() - 0.5) * 0.06;
    const c = new THREE.Color();
    c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + dl)));
    out[i] = `#${c.getHexString()}`;
  }
  return out;
}

const BEAM_Z_TINTS: ReadonlyArray<string> = buildBeamTints(BEAM_Z.length, 0xb3a17);
const BEAM_X_TINTS: ReadonlyArray<string> = buildBeamTints(BEAM_X.length, 0xb3a18);

interface PlantProps {
  x: number;
  z: number;
  groupRef?: (el: THREE.Group | null) => void;
}

function Plant({ x, z, groupRef }: PlantProps) {
  return (
    <group position={[x, 0, z]}>
      {/* Pot (static, anchored) */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.25, 8]} />
        <meshPhongMaterial color="#cc7744" flatShading />
      </mesh>
      <mesh position={[0, 0.38, 0]} receiveShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.03, 8]} />
        <meshPhongMaterial color="#4a3520" flatShading />
      </mesh>
      {/* Foliage group — F3.21: refs the sway pivot. Pivots at top of pot
          (y=0.4) so the foliage rocks like a real stem instead of orbiting. */}
      <group ref={groupRef} position={[0, 0.4, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.22, 6, 6]} />
          <meshPhongMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.15} flatShading />
        </mesh>
        <mesh position={[0.08, 0.38, 0]} castShadow>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshPhongMaterial color="#16a34a" emissive="#22c55e" emissiveIntensity={0.1} flatShading />
        </mesh>
        <mesh position={[-0.05, 0.45, 0.05]} castShadow>
          <coneGeometry args={[0.12, 0.25, 6]} />
          <meshPhongMaterial color="#15803d" flatShading />
        </mesh>
      </group>
    </group>
  );
}

const STEAM_OFFSETS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.05, 0.85, 0],
  [0.03, 0.95, 0],
  [-0.02, 1.05, 0],
];

// Per-plant sway phase offsets (module scope = baked once, no useMemo needed).
const PLANT_PHASES: ReadonlyArray<number> = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

export function Hallway() {
  const steamRef = useRef<THREE.Group>(null);
  // F3.21 idle loops: plant sway groups (4 plants) + beam-dust mote refs.
  const plantRefs = useRef<Array<THREE.Group | null>>([null, null, null, null]);
  const dustMoteRef = useRef<THREE.Mesh>(null);
  const runnerRefs = useRef<Array<THREE.Mesh | null>>([null, null]);
  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // ----- Steam (existing) — refactored to indexed for-loop, zero closure alloc -----
    const g = steamRef.current;
    if (g) {
      const children = g.children;
      const n = children.length;
      for (let i = 0; i < n; i++) {
        const child = children[i];
        child.position.y = STEAM_OFFSETS[i][1] + Math.sin(t * 2 + i) * 0.05;
        const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
        mat.opacity = 0.2 + 0.15 * Math.sin(t * 2 + i);
      }
    }

    // ----- Plant sway (idle loop #2) — gentle ±0.02 rad rotation per plant -----
    const plants = plantRefs.current;
    for (let i = 0; i < 4; i++) {
      const p = plants[i];
      if (!p) continue;
      p.rotation.z = Math.sin(t * 0.4 + PLANT_PHASES[i]) * 0.02;
    }

    // ----- Beam dust drift (idle loop #3) — single emissive mote bobbing
    //       under the central beam crossroads. Scalar Y + opacity only. -----
    const dust = dustMoteRef.current;
    if (dust) {
      dust.position.y = 2.55 + Math.sin(t * 0.7) * 0.08;
      const dmat = dust.material as THREE.MeshPhongMaterial;
      dmat.opacity = 0.35 + 0.15 * Math.sin(t * 1.1);
    }

    // ----- Runner rug pulse (idle loop #4) — subtle ±1% scale breathing.
    //       Uses scale.x only (scalar write, zero alloc). -----
    const runners = runnerRefs.current;
    const pulse = 1 + Math.sin(t * 0.6) * 0.01;
    for (let i = 0; i < 2; i++) {
      const r = runners[i];
      if (!r) continue;
      r.scale.x = pulse;
    }
  });

  return (
    <group>
      {/* Hallway floor cross — F3.19: de-emissived to restore lantern visual authority */}
      <mesh position={[0, FLOOR_Y - 0.02, 0]} receiveShadow>
        <boxGeometry args={[HALL_WIDTH, 0.08, HALL_LEN]} />
        <meshPhongMaterial color={HALL_COLOR} flatShading />
      </mesh>
      <mesh position={[0, FLOOR_Y - 0.02, 0]} receiveShadow>
        <boxGeometry args={[HALL_LEN, 0.08, HALL_WIDTH]} />
        <meshPhongMaterial color={HALL_COLOR} flatShading />
      </mesh>

      {/* Coffee machine */}
      <mesh position={[-1.5, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.6, 0.35]} />
        <meshPhongMaterial color="#222222" flatShading />
      </mesh>
      <mesh position={[-1.5, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.1, 0.33]} />
        <meshPhongMaterial color="#333333" flatShading />
      </mesh>
      <mesh position={[-1.5, 0.55, 0.18]}>
        <boxGeometry args={[0.06, 0.06, 0.01]} />
        <meshPhongMaterial color="#e94560" emissive="#e94560" emissiveIntensity={3.0} flatShading />
      </mesh>

      {/* Steam */}
      <group ref={steamRef} position={[-1.5, 0, 0]}>
        {STEAM_OFFSETS.map((p, i) => (
          <mesh key={i} position={[...p]}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
            <meshPhongMaterial color="#ffffff" transparent opacity={0.3} flatShading />
          </mesh>
        ))}
      </group>

      {/* Plants — intersection corners (2x2). F3.21: each foliage group is
          ref'd into plantRefs so useFrame can sway it ±0.02 rad. */}
      <Plant x={1.3} z={-0.5} groupRef={(el) => { plantRefs.current[0] = el; }} />
      <Plant x={1.5} z={0.6} groupRef={(el) => { plantRefs.current[1] = el; }} />
      <Plant x={-1.35} z={0.6} groupRef={(el) => { plantRefs.current[2] = el; }} />
      <Plant x={-1.35} z={-0.55} groupRef={(el) => { plantRefs.current[3] = el; }} />

      {/* Runner strip (long narrow rug between corridor doors) — F3.19: de-emissived.
          F3.21: ref'd for ±1% scale.x pulse idle-loop. */}
      <mesh
        ref={(el) => { runnerRefs.current[0] = el; }}
        position={[0, FLOOR_Y + 0.005, 2.2]}
        receiveShadow
      >
        <boxGeometry args={[0.55, 0.01, 3.0]} />
        <meshPhongMaterial color="#6b3216" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh
        ref={(el) => { runnerRefs.current[1] = el; }}
        position={[0, FLOOR_Y + 0.005, -2.2]}
        receiveShadow
      >
        <boxGeometry args={[0.55, 0.01, 3.0]} />
        <meshPhongMaterial color="#6b3216" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- CEILING BEAM TRIM (crosshatch planks along hallway axes) -----
          F3.21: each beam pulls a per-instance tint from the mulberry32 pool
          (BEAM_Z_TINTS / BEAM_X_TINTS) so the 9 beams no longer share one
          identical color slab. ±3% lightness jitter, deterministic. */}
      {/* Main beams along Z — span hallway width */}
      {BEAM_Z.map((z, i) => (
        <mesh key={`beamZ-${z}`} position={[0, 2.92, z]} castShadow>
          <boxGeometry args={[HALL_WIDTH + 0.1, 0.1, 0.12]} />
          <meshPhongMaterial color={BEAM_Z_TINTS[i]} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {/* Cross beams along X — span cross-corridor width */}
      {BEAM_X.map((x, i) => (
        <mesh key={`beamX-${x}`} position={[x, 2.92, 0]} castShadow>
          <boxGeometry args={[0.12, 0.1, HALL_WIDTH + 0.1]} />
          <meshPhongMaterial color={BEAM_X_TINTS[i]} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {/* Center cross-join cap (darker hub) */}
      <mesh position={[0, 2.96, 0]}>
        <boxGeometry args={[0.28, 0.04, 0.28]} />
        <meshPhongMaterial color="#241608" flatShading />
      </mesh>

      {/* F3.21: beam-dust mote — single tiny emissive cube floating below
          the cross-hub. Drifts on Y + opacity for a "shaft of dusty light"
          read. One mesh, one ref, scalar mutations only. */}
      <mesh ref={dustMoteRef} position={[0, 2.55, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshPhongMaterial
          color="#ffd9a8"
          emissive="#ffb060"
          emissiveIntensity={1.4}
          transparent
          opacity={0.4}
          flatShading
        />
      </mesh>

      {/* Rug — F3.19/F3.21: both layers neutral to let lanterns own the warm glow band */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.02, 1.0]} />
        <meshPhongMaterial color="#8B4513" flatShading />
      </mesh>
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.01, 0.6]} />
        <meshPhongMaterial color="#a0522d" flatShading />
      </mesh>

      {/* Ceiling light strips (cross pattern) */}
      {[-3, 0, 3].map((z) => (
        <mesh key={`hz-${z}`} position={[0, 2.8, z]}>
          <boxGeometry args={[0.6, 0.04, 0.1]} />
          <meshPhongMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} flatShading />
        </mesh>
      ))}
      {[-3, 0, 3].map((x) => (
        <mesh key={`vx-${x}`} position={[x, 2.8, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.6]} />
          <meshPhongMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}
