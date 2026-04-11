import { useEffect, useState } from 'react';
import { rooms } from '../../data/rooms';
import RoomTile from './RoomTile';
import Character from './Character';
import './FloorPlan.css';

interface FloorPlanProps {
  onEnterRoom: (roomId: string) => void;
}

export default function FloorPlan({ onEnterRoom }: FloorPlanProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.title = "Suri's Lab";
    let raf: number;
    raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Split rooms into top row and bottom row
  const topRooms = rooms.filter(r => r.position.row === 0);
  const bottomRooms = rooms.filter(r => r.position.row === 1);

  return (
    <div className={`floor-plan ${visible ? 'floor-plan--visible' : ''}`}>
      {/* Background grid */}
      <div className="floor-plan__grid" />

      <div className="floor-plan__content">
        {/* Title */}
        <div className="floor-plan__title">
          <span className="floor-plan__title-text">SURI'S LAB</span>
        </div>

        {/* Top rooms */}
        <div className="floor-plan__row">
          {topRooms.map(room => (
            <RoomTile key={room.id} room={room} onClick={onEnterRoom} />
          ))}
        </div>

        {/* Hallway with character */}
        <div className="floor-plan__hallway">
          <div className="floor-plan__hallway-floor" />
          <Character />
        </div>

        {/* Bottom rooms */}
        <div className="floor-plan__row">
          {bottomRooms.map(room => (
            <RoomTile key={room.id} room={room} onClick={onEnterRoom} />
          ))}
        </div>

        {/* Hint */}
        <div className="floor-plan__hint">
          Click a room to explore
        </div>
      </div>
    </div>
  );
}
