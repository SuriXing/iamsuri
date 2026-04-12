import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../store/worldStore';

const SPEECH_TEXT = "Welcome to Suri's Lab!";
const TYPE_DELAY_MS = 50;
const FADE_AFTER_MS = 3000;
const START_AFTER_MS = 800;

export function SpeechBubble3D() {
  const groupRef = useRef<THREE.Group>(null);
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(true);

  // Typewriter effect
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    let typeT: ReturnType<typeof setTimeout>;
    let fadeT: ReturnType<typeof setTimeout>;

    const startT = setTimeout(() => {
      const tick = () => {
        if (cancelled) return;
        setText(SPEECH_TEXT.slice(0, i));
        if (i < SPEECH_TEXT.length) {
          i += 1;
          typeT = setTimeout(tick, TYPE_DELAY_MS);
        } else {
          fadeT = setTimeout(() => {
            if (!cancelled) setVisible(false);
          }, FADE_AFTER_MS);
        }
      };
      tick();
    }, START_AFTER_MS);

    return () => {
      cancelled = true;
      clearTimeout(startT);
      clearTimeout(typeT);
      clearTimeout(fadeT);
    };
  }, []);

  useFrame(() => {
    const s = useWorldStore.getState();
    if (groupRef.current) {
      groupRef.current.position.set(s.charPos.x, 3.2, s.charPos.z);
    }
  });

  return (
    <group ref={groupRef}>
      <Html center zIndexRange={[20, 0]} pointerEvents="none">
        <div id="speech-bubble" className={visible ? 'visible' : ''}>
          {text}
        </div>
      </Html>
    </group>
  );
}
