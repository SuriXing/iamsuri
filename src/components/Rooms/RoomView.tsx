import { useEffect, useState } from 'react';
import type { RoomConfig } from '../../data/rooms';
import './RoomView.css';

interface RoomViewProps {
  room: RoomConfig;
  onBack: () => void;
  children: React.ReactNode;
}

export default function RoomView({ room, onBack, children }: RoomViewProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.title = `${room.name} — Suri's Lab`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, [room.name]);

  const handleBack = () => {
    setVisible(false);
    setTimeout(onBack, 350);
  };

  return (
    <div className={`room-view room-view--${room.colorVar} ${visible ? 'room-view--visible' : ''}`}>
      {/* Back button */}
      <button className="room-view__back" onClick={handleBack} aria-label="Back to floor plan">
        ← Back to Lab
      </button>

      {/* Room header */}
      <div className="room-view__header">
        <span className="room-view__icon">{room.icon}</span>
        <h1 className="room-view__title">{room.name}</h1>
        <span className="room-view__label">{room.label}</span>
      </div>

      {/* Room content */}
      <div className="room-view__content">
        {children}
      </div>
    </div>
  );
}
