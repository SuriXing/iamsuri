import { ROOM, GAP, COLORS } from '../constants';

export type RoomId = 'myroom' | 'product' | 'book' | 'idealab';

export interface RoomDef {
  id: RoomId;
  label: string;
  center: { x: number; z: number };
  /** Door position (hallway side) — used for proximity prompt. */
  door: { x: number; z: number };
  color: string;       // hex string
  accentColor: string; // for door + label
}

const half = ROOM / 2 + GAP; // distance from origin to room center
const doorEdge = GAP + 0.05; // horizontal wall z-offset from origin

export const ROOMS: readonly RoomDef[] = [
  { id: 'myroom',  label: 'My Room',      center: { x: -half, z: -half }, door: { x: -half, z: -doorEdge }, color: '#8B5A2B',    accentColor: COLORS.pink },
  { id: 'product', label: 'Product Room', center: { x:  half, z: -half }, door: { x:  half, z: -doorEdge }, color: '#3b82f6',    accentColor: '#60a5fa'   },
  { id: 'book',    label: 'Book Room',    center: { x: -half, z:  half }, door: { x: -half, z:  doorEdge }, color: COLORS.green, accentColor: '#4ade80'   },
  { id: 'idealab', label: 'Idea Lab',     center: { x:  half, z:  half }, door: { x:  half, z:  doorEdge }, color: COLORS.gold,  accentColor: '#fbbf24'   },
] as const;

export const ROOM_BY_ID: Record<RoomId, RoomDef> = Object.fromEntries(
  ROOMS.map((r) => [r.id, r]),
) as Record<RoomId, RoomDef>;
