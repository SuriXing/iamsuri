import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAR_COUNT, STARS } from '../constants';
import { makeRng } from '../util/rand';
import { useWorldStore } from '../store/worldStore';

interface StarBuffers {
  positions: Float32Array;
  colors: Float32Array;      // per-star RGB (0..1)
  baseOpacity: Float32Array; // per-star base shimmer alpha
  phase: Float32Array;       // per-star twinkle phase offset
  avgSize: number;
}

// Deterministic palette — cool white / warm white / pale cyan / pale rose.
// Picked subtly so the field still reads as "starry" rather than carnival.
const STAR_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [1.00, 1.00, 1.00], // cool white
  [1.00, 0.94, 0.82], // warm white
  [0.80, 0.92, 1.00], // pale cyan
  [1.00, 0.86, 0.90], // pale rose
];

function buildStarBuffers(): StarBuffers {
  const rng = makeRng(0xa11ce);
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const baseOpacity = new Float32Array(STAR_COUNT);
  const phase = new Float32Array(STAR_COUNT);
  let avgSize = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    positions[i * 3 + 0] = (rng() - 0.5) * STARS.spreadXZ;
    positions[i * 3 + 1] = STARS.yMin + rng() * STARS.ySpread;
    positions[i * 3 + 2] = (rng() - 0.5) * STARS.spreadXZ;
    baseOpacity[i] = 0.3 + rng() * 0.7;
    phase[i] = rng() * Math.PI * 2;
    avgSize += 0.03 + rng() * 0.08;
    const pick = STAR_PALETTE[Math.floor(rng() * STAR_PALETTE.length)];
    colors[i * 3 + 0] = pick[0];
    colors[i * 3 + 1] = pick[1];
    colors[i * 3 + 2] = pick[2];
  }
  return { positions, colors, baseOpacity, phase, avgSize: (avgSize / STAR_COUNT) * 6 };
}

const STAR_BUFFERS: StarBuffers = buildStarBuffers();

export function StarField() {
  const matRef = useRef<THREE.PointsMaterial>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute | null>(null);
  // One-shot bake flag — color attribute is written once at first frame
  // and never touched again. Per the zero-brightness-motion pass.
  const starsBakedRef = useRef(false);
  const theme = useWorldStore((s) => s.theme);

  // Single shared geometry — owned per-component to play nice with r3f reconciliation.
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(STAR_BUFFERS.positions, 3));
    // Clone base colors so useFrame can mutate without touching the source buffer.
    const colorBuf = new Float32Array(STAR_BUFFERS.colors);
    const colorAttr = new THREE.BufferAttribute(colorBuf, 3);
    g.setAttribute('color', colorAttr);
    return g;
  }, []);

  // Grab the color attribute into a ref in an effect — refs shouldn't be
  // mutated during render per react-hooks/refs.
  useEffect(() => {
    colorAttrRef.current = geometry.getAttribute('color') as THREE.BufferAttribute;
  }, [geometry]);

  // Per-star twinkle: each star has an independent phase offset so the field
  // shimmers organically instead of pulsing in unison. Writes directly into
  // the color attribute's underlying Float32Array — zero allocations.
  useFrame(() => {
    const m = matRef.current;
    if (!m) return;
    if (theme === 'light') {
      m.opacity = 0;
      return;
    }
    m.opacity = 1;
    const attr = colorAttrRef.current;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    const srcColors = STAR_BUFFERS.colors;
    const baseOp = STAR_BUFFERS.baseOpacity;
    // Zero-brightness-motion pass: per-star shimmer disabled. 500 stars
    // were the most-visible "flicker" source even at slow speeds. Stars
    // now render at their static base opacity. The color attribute is
    // initialized once on first frame and never updated again.
    if (!starsBakedRef.current) {
      for (let i = 0; i < STAR_COUNT; i++) {
        const op = baseOp[i];
        const i3 = i * 3;
        arr[i3 + 0] = srcColors[i3 + 0] * op;
        arr[i3 + 1] = srcColors[i3 + 1] * op;
        arr[i3 + 2] = srcColors[i3 + 2] * op;
      }
      attr.needsUpdate = true;
      starsBakedRef.current = true;
    }
  });

  // Skip rendering entirely in light mode — avoids the draw call too.
  if (theme === 'light') return null;

  return (
    <points geometry={geometry}>
      {/*
        Post-ship fix: pairing `transparent + depthWrite={false}` with the
        also-transparent Particles layer caused order-dependent alpha
        artifacts (whichever drew last in buffer order kept poking through
        the other). Additive blending makes stars pure add-on-top — they
        just brighten whatever's behind them, no sort needed.
      */}
      <pointsMaterial
        ref={matRef}
        vertexColors
        size={STAR_BUFFERS.avgSize}
        sizeAttenuation
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
