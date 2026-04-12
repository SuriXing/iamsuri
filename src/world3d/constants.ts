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
  wood:     '#6b4423',
  panelBg:  '#141722',
} as const;

export const SPEEDS = {
  walk: 4.5,
  cameraLerp: 0.08,
} as const;
