import { useState, useEffect } from 'react';
import './Character.css';

interface CharacterProps {
  message?: string;
}

export default function Character({ message = "Welcome to my lab! 👋" }: CharacterProps) {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="character">
      {showBubble && (
        <div className="character-speech">
          <span>{message}</span>
        </div>
      )}
      <div className="character-avatar">
        <span className="character-emoji">👩‍💻</span>
      </div>
      <div className="character-name">Suri</div>
      <div className="character-shadow" />
    </div>
  );
}
