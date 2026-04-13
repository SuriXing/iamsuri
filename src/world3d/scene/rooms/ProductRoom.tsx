import { useMemo, useRef } from 'react';
import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { PRODUCT_ROOM_CONTENT } from '../../../data/productRoom';
import { useWorldStore } from '../../store/worldStore';
import { makeRng } from '../../util/rand';
import type { InteractableData } from '../../store/worldStore';

const PRODUCT_COLORS: ReadonlyArray<string> = PRODUCT_ROOM_CONTENT.showcaseCubeColors;

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
const RACK_BLACK = '#14181f';

// Desk leg positions (tapered via two stacked chunks).
const DESK_LEGS: ReadonlyArray<readonly [number, number]> = [
  [-0.9, -0.35],
  [0.9, -0.35],
  [-0.9, 0.35],
  [0.9, 0.35],
];

// ---- Micro-anim constants (module-scope = zero per-frame alloc) ----
const LED_BLINK_SPEED = 4.0;
const FAN_SPEED = 6.0;
const SCANLINE_BASE_Y = 1.88;
const SCANLINE_AMPLITUDE = 0.22;
const SCANLINE_SPEED = 2.3;
const ACCENT_LIGHT_BASE = 0.7;
const ACCENT_LIGHT_AMPLITUDE = 0.1;
const ACCENT_LIGHT_SPEED = 0.9;

// Deterministic seed for band tints.
const BAND_SEED = 0xc0de01;

// Server rack LED layout: [dy, dx, color] relative to rack top.
const RACK_LEDS: ReadonlyArray<readonly [number, number, string]> = [
  [0.0, 0.0, '#22d3ee'],
  [0.08, 0.0, '#22d3ee'],
  [0.0, -0.18, '#ef4444'],
  [0.08, -0.18, '#22c55e'],
  [0.0, -0.36, '#22c55e'],
  [0.08, -0.36, '#facc15'],
];

interface ScreenStandProps {
  x: number;
  oz: number;
  interactable: InteractableData;
  liveDotRef: React.RefObject<THREE.Mesh | null>;
  barRef: React.RefObject<THREE.Mesh | null>;
  edgeColor: string;
}

function ScreenStand({ x, oz, interactable, liveDotRef, barRef, edgeColor }: ScreenStandProps) {
  return (
    <group>
      {/* Stand post */}
      <mesh position={[x, 1.0, oz - 0.42]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshPhongMaterial color={METAL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Base plate */}
      <mesh position={[x, 0.73, oz - 0.42]} castShadow>
        <boxGeometry args={[0.38, 0.05, 0.26]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Monitor bezel */}
      <mesh position={[x, 1.55, oz - 0.42]} castShadow>
        <boxGeometry args={[1.1, 0.76, 0.08]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Screen (interactable) */}
      <mesh
        position={[x, 1.55, oz - 0.37]}
        onUpdate={(m) => {
          m.userData.interactable = interactable;
        }}
      >
        <boxGeometry args={[0.96, 0.62, 0.02]} />
        <meshPhongMaterial color="#0a1830" emissive={CYAN} emissiveIntensity={1.8} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Under-bezel brand bar */}
      <mesh position={[x, 1.14, oz - 0.37]}>
        <boxGeometry args={[0.6, 0.03, 0.01]} />
        <meshPhongMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.8} flatShading />
      </mesh>
      {/* Scanline bar — vertical sweep via useFrame */}
      <mesh ref={barRef} position={[x, SCANLINE_BASE_Y, oz - 0.36]}>
        <boxGeometry args={[0.9, 0.02, 0.01]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.2} flatShading />
      </mesh>
      {/* Power LED — blinks via ref */}
      <mesh ref={liveDotRef} position={[x + 0.46, 1.88, oz - 0.36]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={4.0} flatShading />
      </mesh>
    </group>
  );
}

export function ProductRoom() {
  const { center } = ROOM_BY_ID.product;
  const ox = center.x;
  const oz = center.z;

  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  // Deterministic floor-band tints (stable per-mount, no per-frame alloc).
  const bandTints = useMemo<ReadonlyArray<string>>(() => {
    const rng = makeRng(BAND_SEED);
    const base = new THREE.Color(SLATE_DEEP);
    const out: string[] = [];
    for (let i = 0; i < 3; i++) {
      const c = base.clone();
      const jitter = (rng() - 0.5) * 0.12;
      c.offsetHSL(0, 0, jitter);
      out.push('#' + c.getHexString());
    }
    return out;
  }, []);

  // All refs — declared in stable order, top of component.
  const dot1Ref = useRef<THREE.Mesh>(null);
  const dot2Ref = useRef<THREE.Mesh>(null);
  const bar1Ref = useRef<THREE.Mesh>(null);
  const bar2Ref = useRef<THREE.Mesh>(null);
  const fanRef = useRef<THREE.Mesh>(null);
  const rackLedRefs = useRef<Array<THREE.Mesh | null>>([]);
  const accentLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Power LED blink (discrete step).
    const blink = (Math.sin(t * LED_BLINK_SPEED) + 1) * 0.5 > 0.5 ? 1 : 0.2;
    const d1 = dot1Ref.current;
    if (d1) (d1.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.5 + blink * 3;
    const d2 = dot2Ref.current;
    if (d2) (d2.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.5 + blink * 3;

    // Server rack LEDs — phased blink.
    const leds = rackLedRefs.current;
    for (let i = 0; i < leds.length; i++) {
      const m = leds[i];
      if (!m) continue;
      const mat = m.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = 2.0 + Math.sin(t * 3 + i * 0.9) * 1.5;
    }

    // Fan rotation (spins around Z).
    const fan = fanRef.current;
    if (fan) fan.rotation.z = t * FAN_SPEED;

    // Monitor scanline bars — vertical sweep.
    const b1 = bar1Ref.current;
    if (b1) b1.position.y = SCANLINE_BASE_Y + Math.sin(t * SCANLINE_SPEED) * SCANLINE_AMPLITUDE;
    const b2 = bar2Ref.current;
    if (b2) b2.position.y = SCANLINE_BASE_Y + Math.sin(t * SCANLINE_SPEED + 1.3) * SCANLINE_AMPLITUDE;

    // Cyan accent point-light breathing.
    const al = accentLightRef.current;
    if (al) al.intensity = ACCENT_LIGHT_BASE + Math.sin(t * ACCENT_LIGHT_SPEED) * ACCENT_LIGHT_AMPLITUDE;
  });

  const leftX = ox - 0.95;
  const rightX = ox + 0.95;

  // Desk geometry.
  const deskX = ox;
  const deskZ = oz - 0.3;
  const deskY = 0.76;

  // Server rack location (left back).
  const rackX = ox - 1.55;
  const rackZ = oz + 0.9;

  // Crate stack location (right back).
  const crateX = ox + 1.55;
  const crateZ = oz - 1.55;

  return (
    <group>
      {/* ----- FLOOR STAGE — base slab + two tint bands ----- */}
      <mesh position={[ox, 0.15, oz - 0.3]} receiveShadow>
        <boxGeometry args={[3.8, 0.05, 2.6]} />
        <meshPhongMaterial color={bandTints[0]} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox - 1.0, 0.178, oz - 0.3]}>
        <boxGeometry args={[1.4, 0.02, 2.55]} />
        <meshPhongMaterial color={bandTints[1]} flatShading />
      </mesh>
      <mesh position={[ox + 1.0, 0.178, oz - 0.3]}>
        <boxGeometry args={[1.4, 0.02, 2.55]} />
        <meshPhongMaterial color={bandTints[2]} flatShading />
      </mesh>
      {/* Cyan accent floor stripe */}
      <mesh position={[ox, 0.185, oz + 0.6]}>
        <boxGeometry args={[3.5, 0.005, 0.08]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.9} flatShading />
      </mesh>
      {/* F3.21 two-tone lighting fake — cool floor band cooling toward the
          server rack (back-left). Thin overlay ~5% darker/cooler than the
          base slate, sized to cover the rack quadrant. */}
      <mesh position={[ox - 1.0, 0.184, oz + 0.6]} receiveShadow>
        <boxGeometry args={[1.6, 0.005, 1.3]} />
        <meshPhongMaterial color="#161e2f" flatShading />
      </mesh>

      {/* ----- DESK (top + trim + tapered legs) ----- */}
      <mesh position={[deskX, deskY, deskZ]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.08, 0.95]} />
        <meshPhongMaterial color={SLATE_MID} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={[deskX, deskY - 0.06, deskZ]} castShadow>
        <boxGeometry args={[2.18, 0.03, 0.93]} />
        <meshPhongMaterial color={SLATE_LIGHT} flatShading />
      </mesh>
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-top-${i}`} position={[deskX + dx, deskY - 0.25, deskZ + dz]} castShadow>
          <boxGeometry args={[0.08, 0.42, 0.08]} />
          <meshPhongMaterial color={METAL} flatShading />
        </mesh>
      ))}
      {DESK_LEGS.map(([dx, dz], i) => (
        <mesh key={`leg-bot-${i}`} position={[deskX + dx, deskY - 0.6, deskZ + dz]} castShadow>
          <boxGeometry args={[0.06, 0.28, 0.06]} />
          <meshPhongMaterial color={METAL_LIGHT} flatShading />
        </mesh>
      ))}
      {/* Cable tray under desk */}
      <mesh position={[deskX, deskY - 0.15, deskZ - 0.3]}>
        <boxGeometry args={[1.8, 0.04, 0.12]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>

      {/* ----- DUAL MONITORS ----- */}
      <ScreenStand
        x={leftX}
        oz={oz}
        interactable={PROBLEM_SOLVER}
        liveDotRef={dot1Ref}
        barRef={bar1Ref}
        edgeColor={edgeColor}
      />
      <ScreenStand
        x={rightX}
        oz={oz}
        interactable={MENTOR_TABLE}
        liveDotRef={dot2Ref}
        barRef={bar2Ref}
        edgeColor={edgeColor}
      />

      {/* ----- KEYBOARD + MOUSE + MOUSEPAD ON DESK ----- */}
      <mesh position={[deskX, deskY + 0.055, deskZ + 0.15]} castShadow>
        <boxGeometry args={[0.85, 0.03, 0.26]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX, deskY + 0.075, deskZ + 0.08]}>
        <boxGeometry args={[0.8, 0.01, 0.06]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[deskX, deskY + 0.075, deskZ + 0.16]}>
        <boxGeometry args={[0.8, 0.01, 0.06]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[deskX, deskY + 0.075, deskZ + 0.24]}>
        <boxGeometry args={[0.65, 0.01, 0.06]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[deskX + 0.6, deskY + 0.045, deskZ + 0.2]}>
        <boxGeometry args={[0.32, 0.01, 0.24]} />
        <meshPhongMaterial color={SLATE_LIGHT} flatShading />
      </mesh>
      <mesh position={[deskX + 0.6, deskY + 0.07, deskZ + 0.2]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.12]} />
        <meshPhongMaterial color={WHITE_COOL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- LAPTOP (closed) ----- */}
      <mesh position={[deskX - 0.75, deskY + 0.06, deskZ + 0.05]} rotation={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.42, 0.03, 0.3]} />
        <meshPhongMaterial color="#0f172a" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX - 0.75, deskY + 0.076, deskZ + 0.05]}>
        <boxGeometry args={[0.06, 0.002, 0.06]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} flatShading />
      </mesh>

      {/* ----- COFFEE MUG ----- */}
      <mesh position={[deskX + 0.9, deskY + 0.125, deskZ - 0.15]} castShadow>
        <cylinderGeometry args={[0.07, 0.065, 0.17, 10]} />
        <meshPhongMaterial color={WHITE_COOL} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX + 0.9, deskY + 0.205, deskZ - 0.15]}>
        <cylinderGeometry args={[0.06, 0.06, 0.01, 10]} />
        <meshPhongMaterial color="#5a3a1a" flatShading />
      </mesh>

      {/* ----- HEADPHONES (boxy) ----- */}
      <mesh position={[deskX - 0.9, deskY + 0.135, deskZ - 0.2]} castShadow>
        <boxGeometry args={[0.04, 0.16, 0.18]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[deskX - 0.78, deskY + 0.2, deskZ - 0.2]} castShadow>
        <boxGeometry args={[0.22, 0.02, 0.04]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>
      <mesh position={[deskX - 0.66, deskY + 0.135, deskZ - 0.2]} castShadow>
        <boxGeometry args={[0.04, 0.16, 0.18]} />
        <meshPhongMaterial color={SLATE_DEEP} flatShading />
      </mesh>

      {/* ----- STICKY NOTES ----- */}
      <mesh position={[deskX - 0.3, deskY + 0.051, deskZ - 0.3]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.005, 0.1]} />
        <meshPhongMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[deskX - 0.18, deskY + 0.053, deskZ - 0.28]} rotation={[0, -0.15, 0]}>
        <boxGeometry args={[0.09, 0.005, 0.09]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[deskX - 0.08, deskY + 0.052, deskZ - 0.31]}>
        <boxGeometry args={[0.09, 0.005, 0.09]} />
        <meshPhongMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={0.3} flatShading />
      </mesh>

      {/* ----- USB DRIVES ----- */}
      <mesh position={[deskX + 0.35, deskY + 0.07, deskZ - 0.32]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.1]} />
        <meshPhongMaterial color={METAL_LIGHT} flatShading />
      </mesh>
      <mesh position={[deskX + 0.43, deskY + 0.07, deskZ - 0.32]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.1]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.5} flatShading />
      </mesh>

      {/* ----- RUBBER DUCK (debug buddy) ----- */}
      <mesh position={[deskX + 0.15, deskY + 0.09, deskZ - 0.32]} castShadow>
        <boxGeometry args={[0.09, 0.08, 0.12]} />
        <meshPhongMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[deskX + 0.15, deskY + 0.15, deskZ - 0.34]} castShadow>
        <boxGeometry args={[0.07, 0.06, 0.08]} />
        <meshPhongMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} flatShading />
      </mesh>
      <mesh position={[deskX + 0.19, deskY + 0.15, deskZ - 0.39]}>
        <boxGeometry args={[0.04, 0.02, 0.03]} />
        <meshPhongMaterial color="#f97316" flatShading />
      </mesh>

      {/* ----- SERVER RACK (hero) ----- */}
      <mesh position={[rackX, 0.8, rackZ]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.5, 0.6]} />
        <meshPhongMaterial color={RACK_BLACK} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={[rackX, 0.8, rackZ + 0.305]} castShadow>
        <boxGeometry args={[0.7, 1.4, 0.02]} />
        <meshPhongMaterial color="#1a1f28" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[rackX, 1.56, rackZ]} castShadow>
        <boxGeometry args={[0.78, 0.04, 0.58]} />
        <meshPhongMaterial color={METAL} flatShading />
      </mesh>
      {/* Horizontal server slots */}
      {[0.2, 0.55, 0.9, 1.25].map((y, i) => (
        <mesh key={`slot-${i}`} position={[rackX, y, rackZ + 0.31]}>
          <boxGeometry args={[0.66, 0.24, 0.02]} />
          <meshPhongMaterial color={i % 2 === 0 ? '#242a34' : '#1b1f27'} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}
      {/* Rack LEDs — blink via refs */}
      {RACK_LEDS.map(([dy, dx, color], i) => (
        <mesh
          key={`led-${i}`}
          ref={(el) => {
            rackLedRefs.current[i] = el;
          }}
          position={[rackX + 0.26 + dx, 1.36 + dy, rackZ + 0.325]}
        >
          <boxGeometry args={[0.03, 0.03, 0.012]} />
          <meshPhongMaterial color={color} emissive={color} emissiveIntensity={2.5} flatShading />
        </mesh>
      ))}
      {/* Fan — side vent with spinning blade */}
      <mesh position={[rackX + 0.41, 0.7, rackZ]}>
        <boxGeometry args={[0.02, 0.28, 0.28]} />
        <meshPhongMaterial color="#14181f" flatShading />
      </mesh>
      <mesh ref={fanRef} position={[rackX + 0.422, 0.7, rackZ]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.04]} />
        <meshPhongMaterial color={METAL} flatShading />
      </mesh>
      {/* Cable coil on floor beside rack */}
      <mesh position={[rackX + 0.35, 0.18, rackZ + 0.35]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 10]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>
      <mesh position={[rackX + 0.35, 0.23, rackZ + 0.35]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 10]} />
        <meshPhongMaterial color={CABLE_BLACK} flatShading />
      </mesh>

      {/* ----- SHIPPING CRATES (stacked) ----- */}
      <mesh position={[crateX, 0.33, crateZ]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.48, 0.6]} />
        <meshPhongMaterial color="#6b5a42" flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      <mesh position={[crateX, 0.58, crateZ]}>
        <boxGeometry args={[0.73, 0.04, 0.61]} />
        <meshPhongMaterial color="#8a7354" flatShading />
      </mesh>
      <mesh position={[crateX - 0.1, 0.92, crateZ - 0.05]} rotation={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.4, 0.5]} />
        <meshPhongMaterial color="#7a6746" flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Crate label (cyan sticker) */}
      <mesh position={[crateX, 0.4, crateZ + 0.305]}>
        <boxGeometry args={[0.22, 0.12, 0.01]} />
        <meshPhongMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.7} flatShading />
      </mesh>

      {/* ----- PRODUCT CUBES ON DESK ----- */}
      {PRODUCT_COLORS.map((c, i) => (
        <mesh
          key={c}
          position={[deskX - 0.5 + i * 0.5, deskY + 0.13, deskZ - 0.05]}
          rotation={[0, (Math.PI / 6) * i, 0]}
          castShadow
        >
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshPhongMaterial color={c} emissive={c} emissiveIntensity={0.5} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      ))}

      {/* ----- CYAN ACCENT POINT LIGHT near server rack ----- */}
      <pointLight
        ref={accentLightRef}
        color={CYAN}
        intensity={ACCENT_LIGHT_BASE}
        distance={6}
        position={[rackX, 1.4, rackZ + 0.4]}
      />
      {/* Secondary stage light */}
      <pointLight position={[ox, 2.0, oz + 0.5]} color="#60a5fa" intensity={0.35} distance={8} />
    </group>
  );
}
