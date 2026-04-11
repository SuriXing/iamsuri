export interface RoomConfig {
  id: string;
  name: string;
  icon: string;
  label: string;
  colorVar: string; // CSS variable prefix, e.g. 'purple' maps to --room-purple-*
  position: { row: number; col: number };
}

export const rooms: RoomConfig[] = [
  {
    id: 'my-room',
    name: 'My Room',
    icon: '🛏️',
    label: 'About Me',
    colorVar: 'purple',
    position: { row: 0, col: 0 },
  },
  {
    id: 'product-room',
    name: 'Product Room',
    icon: '🚀',
    label: 'Shipped Apps',
    colorVar: 'blue',
    position: { row: 0, col: 1 },
  },
  {
    id: 'book-room',
    name: 'Book Room',
    icon: '📚',
    label: 'Blog',
    colorVar: 'green',
    position: { row: 1, col: 0 },
  },
  {
    id: 'idea-lab',
    name: 'Idea Lab',
    icon: '🧪',
    label: "What's Brewing",
    colorVar: 'yellow',
    position: { row: 1, col: 1 },
  },
];
