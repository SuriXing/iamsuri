import { useState, useCallback } from 'react';
import { rooms } from './data/rooms';
import FloorPlan from './components/World/FloorPlan';
import RoomView from './components/Rooms/RoomView';
import MyRoom from './components/Rooms/MyRoom';
import ProductRoom from './components/Rooms/ProductRoom';
import BookRoom from './components/Rooms/BookRoom';
import IdeaLab from './components/Rooms/IdeaLab';
import ThemeToggle from './components/shared/ThemeToggle';

const roomComponents: Record<string, React.ComponentType> = {
  'my-room': MyRoom,
  'product-room': ProductRoom,
  'book-room': BookRoom,
  'idea-lab': IdeaLab,
};

export default function App() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const handleEnterRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveRoomId(null);
  }, []);

  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;
  const ActiveComponent = activeRoomId ? roomComponents[activeRoomId] : null;

  return (
    <>
      <ThemeToggle />
      {activeRoom && ActiveComponent ? (
        <RoomView room={activeRoom} onBack={handleBack}>
          <ActiveComponent />
        </RoomView>
      ) : (
        <FloorPlan onEnterRoom={handleEnterRoom} />
      )}
    </>
  );
}
