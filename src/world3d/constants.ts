export const ROOM = 5;       // room side length
export const GAP = 1.2;      // hallway half-width
export const FLOOR_Y = 0.06;

export const COLORS = {
  bg:       '#1a1a2e',
  gold:     '#ffd700',
  green:    '#22c55e',
  red:      '#e94560',
  purple:   '#64477d',
  pink:     '#f4a8b8',
} as const;

export const SPEEDS = {
  walk: 5.5,
  cameraLerp: 0.08,
} as const;

export const FP = {
  pitchMin: -1.3,
  pitchMax: 1.3,
  eyeHeight: 1.5,
  lookSensitivity: 0.003,
} as const;

export const CAMERA = {
  position: [14, 16, 14] as const,
  fov: 50,
  near: 0.1,
  far: 200,
} as const;

export const LIGHTS = {
  ambient:      { color: '#ffd8a8', intensity: 1.8 },
  directional:  { color: '#ffeab0', intensity: 1.0, position: [-10, 18, 8] as const },
  hemisphere:   { sky: '#ffc88a', ground: '#4a3020', intensity: 0.5 },
} as const;

export const GROUND = {
  size: 30,
  color: '#111827',
  y: -0.01,
} as const;

export const FOG_DENSITY = 0.002;
export const SHADOW_MAP_SIZE = 1024;

// World counts
export const STAR_COUNT = 500;
export const PARTICLE_COUNT = 150;

// Door geometry
export const DOOR = {
  width: 1.2,
  height: 1.75,
  frameHeight: 1.9,
  postW: 0.15,
  openAngle: -Math.PI * 0.55,
  hingeLerp: 0.12,
} as const;

// Character
export const CHARACTER = {
  scale: 0.9,
  bobAmp: 0.09,
  bobFreq: 3.14,
  swayAmp: 0.3,
  swayFreq: 0.5,
  shadowRadius: 0.28,
  // Collision radius (XZ, world units). Used by PlayerController sweep test.
  colliderRadius: 0.28,
} as const;

// Particle bounds
export const PARTICLES = {
  spread: 28,
  ceiling: 8,
  floorReset: -0.5,
} as const;

// Star bounds
export const STARS = {
  spreadXZ: 60,
  yMin: 5,
  ySpread: 25,
} as const;

export const STORAGE_KEYS = {
  unlocks: 'suri-3d-doors-unlocked-v2',
  theme:   'suri-theme',
} as const;
