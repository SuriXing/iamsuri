import { useMemo, useRef } from 'react';
import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_BY_ID } from '../../data/rooms';
import { Bookshelf } from '../parts/Bookshelf';
import { useWorldStore } from '../../store/worldStore';
import { makeRng } from '../../util/rand';
import { BOOK_ROOM_CONTENT } from '../../../data/bookRoom';
import type { InteractableData } from '../../store/worldStore';

const BLOG_INTERACTABLE: InteractableData = BOOK_ROOM_CONTENT.dialogues.blog;

// --- Cozy library palette (warm wood, deep brown, amber, forest, cream) ---
const WOOD_DEEP = '#4a2f1a';
const WOOD_MID = '#6b4423';
const WOOD_LIGHT = '#8b5e3c';
const CREAM = '#e8dcc4';
const CREAM_DARK = '#d4c4a4';
const AMBER = '#e8a860';
const AMBER_WARM = '#f5c678';
const FOREST = '#3c5a3c';
const FOREST_LIGHT = '#5a7a5a';
const CHAIR_GREEN = '#4a6b42';
const CHAIR_GREEN_DK = '#344d2e';
const GOLD = '#c9a14a';
const BRASS = '#b8873a';

// Dusty pastel book spines (per spec — overrides the loud data-file palette).
const DUSTY_SPINES: ReadonlyArray<string> = [
  '#dda0a0', // blush
  '#9bb58c', // sage
  '#e8dcc4', // cream
  '#8ba7b8', // dusty blue
  '#d4b48c', // tan
  '#b89d7a', // mushroom
  '#a8b59c', // olive sage
  '#c8a48c', // terracotta
];

// --- Micro-anim constants (module scope = zero per-frame alloc) ---
const LAMP_FLICKER_BASE = 1.5;
const LAMP_FLICKER_AMPLITUDE = 0.35;
const LAMP_FLICKER_SPEED_A = 7.3;
const LAMP_FLICKER_SPEED_B = 11.7;
const DUST_BASE_Y = 1.35;
const DUST_AMPLITUDE = 0.12;
const DUST_SPEED = 0.6;
const PAGE_BASE_ROT = 0.02;
const PAGE_AMPLITUDE = 0.04;
const PAGE_SPEED = 1.5;
const ACCENT_LIGHT_BASE = 0.8;
const ACCENT_LIGHT_AMPLITUDE = 0.12;
const ACCENT_LIGHT_SPEED = 1.9;

// Dust mote scatter (deterministic).
const DUST_SEED = 0xb00c2a;

export function BookRoom() {
  const { center } = ROOM_BY_ID.book;
  const ox = center.x;
  const oz = center.z;

  const theme = useWorldStore((s) => s.theme);
  const edgeColor = theme === 'dark' ? '#0a0a14' : '#5a4830';

  // Deterministic dust motes — 5 small floating cubes near the reading nook.
  const dustMotes = useMemo(() => {
    const rng = makeRng(DUST_SEED);
    const arr: Array<{ x: number; z: number; phase: number; size: number }> = [];
    for (let i = 0; i < 5; i++) {
      arr.push({
        x: (rng() - 0.5) * 1.2,
        z: (rng() - 0.5) * 0.8,
        phase: rng() * Math.PI * 2,
        size: 0.02 + rng() * 0.015,
      });
    }
    return arr;
  }, []);

  // Refs for micro-animations.
  const lampGlowRef = useRef<THREE.Mesh>(null);
  const accentLightRef = useRef<THREE.PointLight>(null);
  const pageRef = useRef<THREE.Mesh>(null);
  const dustRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Lamp flicker (two-wave noise combo → emissive intensity).
    const lamp = lampGlowRef.current;
    if (lamp) {
      const flick = Math.sin(t * LAMP_FLICKER_SPEED_A) * 0.6 + Math.sin(t * LAMP_FLICKER_SPEED_B) * 0.4;
      const mat = lamp.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = LAMP_FLICKER_BASE + flick * LAMP_FLICKER_AMPLITUDE;
    }

    // Amber accent light — breathing + flicker echo.
    const al = accentLightRef.current;
    if (al) {
      al.intensity = ACCENT_LIGHT_BASE + Math.sin(t * ACCENT_LIGHT_SPEED) * ACCENT_LIGHT_AMPLITUDE;
    }

    // Open-book page flutter.
    const page = pageRef.current;
    if (page) {
      page.rotation.x = PAGE_BASE_ROT + Math.sin(t * PAGE_SPEED) * PAGE_AMPLITUDE;
    }

    // Floating dust motes.
    const refs = dustRefs.current;
    for (let i = 0; i < refs.length; i++) {
      const m = refs[i];
      if (!m) continue;
      const spec = dustMotes[i];
      m.position.y = DUST_BASE_Y + Math.sin(t * DUST_SPEED + spec.phase) * DUST_AMPLITUDE;
    }
  });

  // Layout anchors.
  const shelfLX = ox - 1.1;
  const shelfRX = ox + 1.0;
  const chairX = ox - 0.2;
  const chairZ = oz + 0.9;
  const tableX = ox + 0.8;
  const tableZ = oz + 0.9;

  return (
    <group>
      {/* ----- FLOOR — two-tone wood planks + center rug ----- */}
      <mesh position={[ox, 0.11, oz]} receiveShadow>
        <boxGeometry args={[4.4, 0.02, 4.4]} />
        <meshPhongMaterial color={WOOD_DEEP} flatShading />
      </mesh>
      {/* Plank stripes */}
      {[-1.6, -0.8, 0.0, 0.8, 1.6].map((dx, i) => (
        <mesh key={`plank-${i}`} position={[ox + dx, 0.125, oz]} receiveShadow>
          <boxGeometry args={[0.72, 0.01, 4.3]} />
          <meshPhongMaterial color={i % 2 === 0 ? WOOD_MID : WOOD_LIGHT} flatShading />
        </mesh>
      ))}
      {/* Central amber rug */}
      <mesh position={[ox, 0.135, oz + 0.5]} receiveShadow>
        <boxGeometry args={[2.8, 0.02, 2.0]} />
        <meshPhongMaterial color="#8c5a3a" emissive="#8c5a3a" emissiveIntensity={0.2} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Rug border stripes */}
      <mesh position={[ox, 0.148, oz - 0.47]}>
        <boxGeometry args={[2.7, 0.005, 0.04]} />
        <meshPhongMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.5} flatShading />
      </mesh>
      <mesh position={[ox, 0.148, oz + 1.47]}>
        <boxGeometry args={[2.7, 0.005, 0.04]} />
        <meshPhongMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.5} flatShading />
      </mesh>

      {/* ----- BOOKSHELVES (with dusty pastel spines + edges on hero books) ----- */}
      <Bookshelf
        x={shelfLX}
        z={oz - 1.5}
        rows={4}
        booksPerRow={5}
        width={1.6}
        depth={0.38}
        rowSpacing={0.5}
        baseY={0.3}
        plankColor={WOOD_MID}
        bookColors={DUSTY_SPINES}
        backPanelColor={WOOD_DEEP}
        withFrameBox
        frameBoxColor={WOOD_DEEP}
        frameBoxHeight={2.2}
        frameBoxY={1.2}
        seed={0xb001a5}
        heroBookCount={4}
        edgeColor={edgeColor}
      />
      {/* Blog interactable plane */}
      <mesh
        position={[shelfLX, 1.2, oz - 1.29]}
        onUpdate={(m) => {
          m.userData.interactable = BLOG_INTERACTABLE;
        }}
      >
        <boxGeometry args={[1.7, 2.0, 0.02]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Bookshelf
        x={shelfRX}
        z={oz - 1.5}
        rows={4}
        booksPerRow={5}
        width={1.6}
        depth={0.38}
        rowSpacing={0.5}
        baseY={0.3}
        plankColor={WOOD_MID}
        bookColors={DUSTY_SPINES}
        backPanelColor={WOOD_DEEP}
        withFrameBox
        frameBoxColor={WOOD_DEEP}
        frameBoxHeight={2.2}
        frameBoxY={1.2}
        seed={0xb0012e}
        heroBookCount={4}
        edgeColor={edgeColor}
      />

      {/* ----- LIBRARY LADDER (leaning against left shelf) ----- */}
      <mesh position={[shelfLX - 0.75, 1.1, oz - 1.15]} rotation={[0, 0, -0.18]} castShadow>
        <boxGeometry args={[0.04, 2.0, 0.04]} />
        <meshPhongMaterial color={WOOD_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[shelfLX - 0.55, 1.1, oz - 1.15]} rotation={[0, 0, -0.18]} castShadow>
        <boxGeometry args={[0.04, 2.0, 0.04]} />
        <meshPhongMaterial color={WOOD_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Ladder rungs */}
      {[0.35, 0.75, 1.15, 1.55, 1.95].map((y, i) => (
        <mesh
          key={`rung-${i}`}
          position={[shelfLX - 0.65 + (y - 1.1) * 0.18, y, oz - 1.15]}
          rotation={[0, 0, -0.18]}
          castShadow
        >
          <boxGeometry args={[0.22, 0.03, 0.04]} />
          <meshPhongMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
      ))}

      {/* ----- READING CHAIR (hero — base + seat cushion + back + arms) ----- */}
      {/* Base block */}
      <mesh position={[chairX, 0.28, chairZ]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.32, 0.85]} />
        <meshPhongMaterial color={CHAIR_GREEN_DK} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[chairX, 0.49, chairZ + 0.02]} castShadow>
        <boxGeometry args={[0.82, 0.12, 0.72]} />
        <meshPhongMaterial color={CHAIR_GREEN} emissive={CHAIR_GREEN} emissiveIntensity={0.08} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Back rest */}
      <mesh position={[chairX, 0.82, chairZ + 0.42]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.9, 0.14]} />
        <meshPhongMaterial color={CHAIR_GREEN_DK} flatShading />
        <Edges color={edgeColor} lineWidth={1.2} />
      </mesh>
      {/* Back cushion */}
      <mesh position={[chairX, 0.82, chairZ + 0.33]}>
        <boxGeometry args={[0.8, 0.8, 0.08]} />
        <meshPhongMaterial color={CHAIR_GREEN} emissive={CHAIR_GREEN} emissiveIntensity={0.1} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Left arm */}
      <mesh position={[chairX - 0.48, 0.58, chairZ]} castShadow>
        <boxGeometry args={[0.12, 0.3, 0.78]} />
        <meshPhongMaterial color={CHAIR_GREEN_DK} flatShading />
      </mesh>
      {/* Right arm */}
      <mesh position={[chairX + 0.48, 0.58, chairZ]} castShadow>
        <boxGeometry args={[0.12, 0.3, 0.78]} />
        <meshPhongMaterial color={CHAIR_GREEN_DK} flatShading />
      </mesh>
      {/* Throw blanket draped over arm */}
      <mesh position={[chairX - 0.48, 0.73, chairZ - 0.1]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.2, 0.04, 0.5]} />
        <meshPhongMaterial color="#c47a5e" emissive="#c47a5e" emissiveIntensity={0.12} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Cushion on seat */}
      <mesh position={[chairX + 0.15, 0.6, chairZ + 0.15]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.35, 0.12, 0.32]} />
        <meshPhongMaterial color="#dda0a0" emissive="#dda0a0" emissiveIntensity={0.15} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- SIDE TABLE (top + pedestal + base) ----- */}
      <mesh position={[tableX, 0.58, tableZ]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.05, 0.55]} />
        <meshPhongMaterial color={WOOD_LIGHT} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[tableX, 0.3, tableZ]} castShadow>
        <boxGeometry args={[0.08, 0.5, 0.08]} />
        <meshPhongMaterial color={WOOD_MID} flatShading />
      </mesh>
      <mesh position={[tableX, 0.08, tableZ]} castShadow>
        <boxGeometry args={[0.28, 0.04, 0.28]} />
        <meshPhongMaterial color={WOOD_DEEP} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>

      {/* ----- READING LAMP (base + stem + shade + glow bulb) ----- */}
      <mesh position={[tableX - 0.15, 0.63, tableZ - 0.15]}>
        <boxGeometry args={[0.1, 0.04, 0.1]} />
        <meshPhongMaterial color={BRASS} flatShading />
      </mesh>
      <mesh position={[tableX - 0.15, 0.88, tableZ - 0.15]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
        <meshPhongMaterial color={BRASS} flatShading />
      </mesh>
      {/* Lamp shade */}
      <mesh position={[tableX - 0.15, 1.18, tableZ - 0.15]} castShadow>
        <cylinderGeometry args={[0.11, 0.18, 0.18, 10]} />
        <meshPhongMaterial color={CREAM} emissive={AMBER_WARM} emissiveIntensity={0.3} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Glowing bulb underside — flickers via ref */}
      <mesh ref={lampGlowRef} position={[tableX - 0.15, 1.06, tableZ - 0.15]}>
        <boxGeometry args={[0.2, 0.02, 0.2]} />
        <meshPhongMaterial color={AMBER_WARM} emissive={AMBER_WARM} emissiveIntensity={LAMP_FLICKER_BASE} flatShading />
      </mesh>

      {/* ----- OPEN BOOK ON TABLE (two halves forming a V) ----- */}
      <group ref={pageRef} position={[tableX + 0.08, 0.61, tableZ]}>
        <mesh rotation={[0, 0, 0.08]} castShadow>
          <boxGeometry args={[0.2, 0.02, 0.26]} />
          <meshPhongMaterial color={CREAM} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, -0.08]} castShadow>
          <boxGeometry args={[0.2, 0.02, 0.26]} />
          <meshPhongMaterial color={CREAM_DARK} flatShading />
          <Edges color={edgeColor} lineWidth={1} />
        </mesh>
      </group>

      {/* ----- TEA CUP + SAUCER ----- */}
      <mesh position={[tableX + 0.12, 0.61, tableZ + 0.2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.008, 10]} />
        <meshPhongMaterial color={CREAM} flatShading />
      </mesh>
      <mesh position={[tableX + 0.12, 0.66, tableZ + 0.2]} castShadow>
        <cylinderGeometry args={[0.05, 0.045, 0.08, 10]} />
        <meshPhongMaterial color={CREAM} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[tableX + 0.12, 0.69, tableZ + 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.005, 10]} />
        <meshPhongMaterial color="#6b3c1a" flatShading />
      </mesh>

      {/* ----- EYEGLASSES (two circular frames) ----- */}
      <mesh position={[tableX - 0.1, 0.62, tableZ + 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.045, 0.008, 6, 14]} />
        <meshPhongMaterial color={BRASS} flatShading />
      </mesh>
      <mesh position={[tableX + 0.0, 0.62, tableZ + 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.045, 0.008, 6, 14]} />
        <meshPhongMaterial color={BRASS} flatShading />
      </mesh>
      <mesh position={[tableX - 0.05, 0.62, tableZ + 0.18]}>
        <boxGeometry args={[0.02, 0.006, 0.006]} />
        <meshPhongMaterial color={BRASS} flatShading />
      </mesh>

      {/* ----- STACKED BOOKS ON FLOOR (3 books, varied rotation) ----- */}
      <mesh position={[chairX - 0.85, 0.18, chairZ - 0.25]} rotation={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.4, 0.08, 0.28]} />
        <meshPhongMaterial color="#9bb58c" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[chairX - 0.85, 0.26, chairZ - 0.25]} rotation={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.38, 0.07, 0.26]} />
        <meshPhongMaterial color="#8ba7b8" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[chairX - 0.85, 0.335, chairZ - 0.25]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.35, 0.06, 0.24]} />
        <meshPhongMaterial color="#d4b48c" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Bookmark sticking out */}
      <mesh position={[chairX - 0.85, 0.38, chairZ - 0.13]}>
        <boxGeometry args={[0.03, 0.01, 0.1]} />
        <meshPhongMaterial color="#dd5a5a" emissive="#dd5a5a" emissiveIntensity={0.4} flatShading />
      </mesh>

      {/* ----- POTTED FERN (cozy corner greenery) ----- */}
      <mesh position={[ox + 1.8, 0.22, oz + 1.5]} castShadow>
        <boxGeometry args={[0.28, 0.34, 0.28]} />
        <meshPhongMaterial color="#6b4423" flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[ox + 1.8, 0.52, oz + 1.5]} castShadow>
        <boxGeometry args={[0.36, 0.16, 0.36]} />
        <meshPhongMaterial color={FOREST} emissive={FOREST} emissiveIntensity={0.15} flatShading />
      </mesh>
      <mesh position={[ox + 1.72, 0.64, oz + 1.48]} castShadow>
        <boxGeometry args={[0.18, 0.2, 0.18]} />
        <meshPhongMaterial color={FOREST_LIGHT} emissive={FOREST_LIGHT} emissiveIntensity={0.15} flatShading />
      </mesh>
      <mesh position={[ox + 1.88, 0.7, oz + 1.52]} castShadow>
        <boxGeometry args={[0.16, 0.26, 0.16]} />
        <meshPhongMaterial color={FOREST_LIGHT} emissive={FOREST_LIGHT} emissiveIntensity={0.15} flatShading />
      </mesh>

      {/* ----- GLOBE ON LEFT CORNER ----- */}
      <mesh position={[ox - 1.85, 0.3, oz + 1.5]} castShadow>
        <boxGeometry args={[0.2, 0.06, 0.2]} />
        <meshPhongMaterial color={WOOD_DEEP} flatShading />
      </mesh>
      <mesh position={[ox - 1.85, 0.38, oz + 1.5]}>
        <boxGeometry args={[0.03, 0.2, 0.03]} />
        <meshPhongMaterial color={BRASS} flatShading />
      </mesh>
      <mesh position={[ox - 1.85, 0.56, oz + 1.5]} castShadow>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshPhongMaterial color="#8ba7b8" emissive="#8ba7b8" emissiveIntensity={0.15} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      {/* Brass globe ring */}
      <mesh position={[ox - 1.85, 0.56, oz + 1.5]} rotation={[0, 0, Math.PI / 8]}>
        <torusGeometry args={[0.17, 0.008, 6, 20]} />
        <meshPhongMaterial color={BRASS} flatShading />
      </mesh>

      {/* ----- FLOATING DUST MOTES ----- */}
      {dustMotes.map((m, i) => (
        <mesh
          key={`dust-${i}`}
          ref={(el) => {
            dustRefs.current[i] = el;
          }}
          position={[tableX + m.x, DUST_BASE_Y, tableZ + m.z]}
        >
          <boxGeometry args={[m.size, m.size, m.size]} />
          <meshPhongMaterial color={AMBER_WARM} emissive={AMBER_WARM} emissiveIntensity={0.7} flatShading transparent opacity={0.7} />
        </mesh>
      ))}

      {/* ----- WARM AMBER ACCENT LIGHT (reading nook) ----- */}
      <pointLight
        ref={accentLightRef}
        color="#f5c678"
        intensity={ACCENT_LIGHT_BASE}
        distance={7}
        position={[tableX - 0.15, 1.1, tableZ - 0.15]}
      />
      {/* Wide ambient lamp fill */}
      <pointLight position={[ox, 2.0, oz + 0.5]} color="#e8a860" intensity={0.4} distance={9} />

      {/* ----- FRAMED PICTURE ABOVE CHAIR (gold-frame) ----- */}
      <mesh position={[chairX, 1.85, chairZ + 0.55]} castShadow>
        <boxGeometry args={[0.6, 0.45, 0.04]} />
        <meshPhongMaterial color={GOLD} flatShading />
        <Edges color={edgeColor} lineWidth={1} />
      </mesh>
      <mesh position={[chairX, 1.85, chairZ + 0.57]}>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshPhongMaterial color="#6b4423" emissive="#6b4423" emissiveIntensity={0.1} flatShading />
      </mesh>
    </group>
  );
}
