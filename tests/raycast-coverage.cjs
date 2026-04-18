// R4.1 — raycast coverage harness
//
// Programmatically constructs the same floor geometry as Room.tsx +
// Hallway.tsx, then casts 100 downward rays per room from FP eye height
// (y = 1.5) at sample points covering each room's footprint. Every ray
// must hit a floor mesh before y = -0.1.
//
// Output: per-room hit/miss + total coverage to
//   .harness/nodes/R4.1/run_1/raycast.txt

const fs = require('fs');
const path = require('path');
const THREE = require('three');

// Mirror constants from src/world3d/constants.ts and Room.tsx --------------
const ROOM = 5;
const GAP = 1.2;
const FLOOR_Y = 0.06;
const HALL_LEN = ROOM * 2 + GAP * 2 + 1;
const HALL_WIDTH = GAP * 2;
const HALF = ROOM / 2 + GAP;

const ROOMS = [
  { id: 'myroom',  cx: -HALF, cz: -HALF },
  { id: 'product', cx:  HALF, cz: -HALF },
  { id: 'book',    cx: -HALF, cz:  HALF },
  { id: 'idealab', cx:  HALF, cz:  HALF },
];

// Build a scene that contains ONLY floor meshes (room floors + hallway).
const scene = new THREE.Scene();

function addBox(w, h, d, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial(),
  );
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

// Per-room floor: ROOM × 0.12 × (ROOM + 0.2), shifted toward the corridor.
const FLOOR_EXTRA = 0.2;
for (const r of ROOMS) {
  const doorwayZSign = r.cz < 0 ? 1 : -1;
  const floorDepth = ROOM + FLOOR_EXTRA;
  const floorZ = r.cz + (doorwayZSign * FLOOR_EXTRA) / 2;
  addBox(ROOM, 0.12, floorDepth, r.cx, FLOOR_Y, floorZ);
}

// Hallway cross arms (FLOOR_Y - 0.02 center, 0.08 thick).
addBox(HALL_WIDTH, 0.08, HALL_LEN, 0, FLOOR_Y - 0.02, 0);
addBox(HALL_LEN, 0.08, HALL_WIDTH, 0, FLOOR_Y - 0.02, 0);

// Raycaster reads matrixWorld; force-update once after construction.
scene.updateMatrixWorld(true);

// Cast 100 downward rays per room over a 10×10 grid of the room footprint.
const raycaster = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
const EYE_Y = 1.5;
const FLOOR_Y_THRESH = -0.1;

const lines = [];
let grandHits = 0;
let grandTotal = 0;

for (const r of ROOMS) {
  const grid = 10; // 10×10 = 100 rays
  let hits = 0;
  let misses = 0;
  // Sample inside the room footprint (avoiding the wall thickness).
  // Slight inset so rays don't graze the exact wall boundary.
  const inset = 0.15;
  const half = ROOM / 2 - inset;
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const u = (i + 0.5) / grid; // 0.05 .. 0.95
      const v = (j + 0.5) / grid;
      const sx = r.cx - half + u * (2 * half);
      const sz = r.cz - half + v * (2 * half);
      raycaster.set(new THREE.Vector3(sx, EYE_Y, sz), DOWN);
      const intersects = raycaster.intersectObjects(scene.children, false);
      const hit = intersects.find((it) => it.point.y > FLOOR_Y_THRESH);
      if (hit) hits++;
      else misses++;
    }
  }
  grandHits += hits;
  grandTotal += hits + misses;
  const pct = ((hits / (hits + misses)) * 100).toFixed(2);
  lines.push(`room=${r.id.padEnd(8)} hits=${hits}/${hits + misses} (${pct}%)`);
}

const grandPct = ((grandHits / grandTotal) * 100).toFixed(2);
lines.push('');
lines.push(`TOTAL: ${grandHits}/${grandTotal} = ${grandPct}%`);

const out = lines.join('\n') + '\n';
const outDir = path.join(__dirname, '..', '.harness', 'nodes', 'R4.1', 'run_1');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'raycast.txt'), out);
process.stdout.write(out);

// Exit non-zero if any room < 100%.
const anyMiss = grandHits !== grandTotal;
process.exit(anyMiss ? 1 : 0);
