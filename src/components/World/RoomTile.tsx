import type { RoomConfig } from '../../data/rooms';
import './RoomTile.css';

interface RoomTileProps {
  room: RoomConfig;
  onClick: (roomId: string) => void;
}

export default function RoomTile({ room, onClick }: RoomTileProps) {
  return (
    <button
      className={`room-tile room-tile--${room.colorVar}`}
      style={{
        gridRow: room.position.row + 1,
        gridColumn: room.position.col + 1,
      }}
      onClick={() => onClick(room.id)}
      aria-label={`Enter ${room.name}`}
    >
      {/* Room glow effect on hover */}
      <div className="room-tile__glow" />

      {/* Room header strip */}
      <div className="room-tile__header">
        <span className="room-tile__icon">{room.icon}</span>
        <span className="room-tile__name">{room.name}</span>
      </div>

      {/* Room interior preview */}
      <div className="room-tile__interior">
        <div className="room-tile__furniture">
          {room.id === 'my-room' && (
            <>
              <span className="furniture-item" style={{ top: '15%', left: '12%' }}>🖥️</span>
              <span className="furniture-item" style={{ bottom: '12%', left: '15%' }}>🛏️</span>
              <span className="furniture-item" style={{ top: '12%', right: '15%' }}>🎨</span>
              <span className="furniture-item" style={{ top: '12%', left: '48%' }}>🏆</span>
            </>
          )}
          {room.id === 'product-room' && (
            <>
              <span className="furniture-item" style={{ top: '20%', left: '20%' }}>💡</span>
              <span className="furniture-item" style={{ top: '20%', right: '20%' }}>⭐</span>
              <span className="furniture-item" style={{ bottom: '15%', left: '25%', opacity: 0.3 }}>📦</span>
              <span className="furniture-item" style={{ bottom: '15%', right: '25%', opacity: 0.3 }}>📦</span>
            </>
          )}
          {room.id === 'book-room' && (
            <>
              <span className="furniture-item" style={{ top: '10%', left: '35%', fontSize: '28px' }}>📚</span>
              <span className="furniture-item" style={{ bottom: '20%', right: '15%' }}>🪑</span>
              <span className="furniture-item" style={{ bottom: '10%', left: '10%' }}>📖</span>
            </>
          )}
          {room.id === 'idea-lab' && (
            <>
              <span className="furniture-item" style={{ top: '10%', left: '30%', fontSize: '24px' }}>📋</span>
              <span className="furniture-item" style={{ bottom: '15%', right: '15%' }}>🔬</span>
              <span className="furniture-item" style={{ bottom: '15%', left: '20%' }}>🧪</span>
            </>
          )}
        </div>
      </div>

      {/* Room label */}
      <div className="room-tile__label">{room.label}</div>

      {/* Door indicator */}
      <div className="room-tile__door" />
    </button>
  );
}
