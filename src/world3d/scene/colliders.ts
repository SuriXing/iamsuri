// Shared mutable registry of AABB colliders for the player sweep test.
//
// This is a module-level mutable store on purpose: colliders are registered
// from deep in the scene tree (Walls, Doors) and read from PlayerController
// every frame. Threading this through props/context would be needless
// ceremony for what is fundamentally global game state.

interface Aabb {
  id: string;
  // Center XZ position
  x: number;
  z: number;
  // Half extents (XZ only — colliders are full height along Y)
  hx: number;
  hz: number;
  /** When true, the camera wall-clip sweep IGNORES this collider.
   *  Used for furniture (couches, desks, beds) — the player should
   *  collide against them but the camera doesn't need to dodge them
   *  because the camera is high up and far away in overview mode,
   *  and the player is in FP mode when actually inside a room. */
  playerOnly?: boolean;
}

const store: Map<string, Aabb> = new Map();

export function registerCollider(box: Aabb): void {
  store.set(box.id, box);
}

export function unregisterCollider(id: string): void {
  store.delete(id);
}

/**
 * Iterator over WALL-only colliders (excludes furniture flagged playerOnly).
 * Used by the camera wall-clip sweep so furniture doesn't crowd the camera
 * when the player is in the corridor near a room.
 */
export function listWallColliders(): Iterable<Aabb> {
  const out: Aabb[] = [];
  for (const box of store.values()) {
    if (!box.playerOnly) out.push(box);
  }
  return out;
}

/**
 * Test if a point `(px, pz)` with given `radius` overlaps any collider.
 * Returns the first overlapping collider, or `null`. Includes furniture.
 */
export function hitTest(px: number, pz: number, radius: number): Aabb | null {
  for (const box of store.values()) {
    const dx = Math.abs(px - box.x) - (box.hx + radius);
    const dz = Math.abs(pz - box.z) - (box.hz + radius);
    if (dx < 0 && dz < 0) return box;
  }
  return null;
}

/**
 * Dev hook — expose the registry to Playwright tests.
 */
if (typeof window !== 'undefined') {
  (window as unknown as { __colliders?: typeof store }).__colliders = store;
}
