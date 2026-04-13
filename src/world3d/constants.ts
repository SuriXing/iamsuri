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
  // Initial (intro) position — slightly tilted top-down establishing shot.
  position: [0, 20, 14] as const,
  lookAt: [0, 0, 0] as const,
  fov: 50,
  near: 0.1,
  far: 200,
} as const;

/** Third-person follow camera (orbit around character). */
export const FOLLOW = {
  /** Spherical distance from character — orbit radius. */
  distance: 6.0,
  /** Look target height on the character (slightly below head). */
  lookHeight: 0.8,
  /** How far forward of the character the camera aims. Positive values
   *  show more of the upcoming path. */
  lookAhead: 1.0,
  /** Softness of the camera follow position lerp (higher = snappier). */
  lerp: 6,
  /** Softness of the yaw / pitch lerp toward mouse drag targets. */
  yawLerp: 6,
} as const;

/** Duration of intro phases in seconds. */
export const INTRO = {
  staticHold: 1.6,
  zoomDuration: 2.4,
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

// F3.7 — door/wall polish tunables (additive, not in frozen blocks).
export const DOOR_POLISH = {
  /** Knob sphere radius, 1.5x the F3.5 value (0.055 → 0.0825). */
  knobRadius: 0.0825,
  /** Escutcheon plate (width, height, depth). */
  escutcheon: [0.18, 0.28, 0.025] as const,
  /** Warm spill light inside each door opening. */
  spillLight: {
    color: '#ffb060',
    intensity: 0.9,
    distance: 3.2,
    /** Offset from door center into the room, along inside normal. */
    offset: 0.9,
    /** Height above floor. */
    y: 1.1,
  },
  /** Doormat size (x, y, z) — thin, wider than door. */
  doormat: [1.5, 0.03, 0.55] as const,
  /** Doormat offset from door along the hallway side (opposite inside). */
  doormatOffset: 0.5,
  /** Lintel trim small z-nudge to kill the F3.6 visible gap. */
  lintelNudge: -0.02,
} as const;

// F3.7 — wall polish tunables.
export const WALL_POLISH = {
  /** Base neutral wall color (what F3.5 used). */
  baseColor: '#3d2817',
  /** Baseboard color — ~20% darker. */
  baseboard: '#211108',
  /** Top cap color — ~15% lighter. */
  topCap: '#5e3e22',
  /** How strongly to blend the room accent into the wall tint (0-1). */
  accentMix: 0.08,
  /** mulberry32 per-segment L jitter delta (±half of this range). */
  tintJitter: 0.24,
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
