import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHARACTER, COLORS } from '../constants';
import { useWorldStore } from '../store/worldStore';

// Smoothly interpolates angle `a` toward `b` around the shorter arc.
// Prevents the "spin the long way around" issue near ±π boundaries.
function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export function Character() {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  // Smoothed facing (lerps toward store charFacing so turning is not jerky).
  const smoothFacingRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  // No selectors — read store imperatively in useFrame to avoid re-renders.
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const { charPos, charFacing } = useWorldStore.getState();

    // Detect whether the character is actively moving this frame.
    const dx = charPos.x - lastPosRef.current.x;
    const dz = charPos.z - lastPosRef.current.z;
    const moving = (dx * dx + dz * dz) > 0.00002;
    lastPosRef.current.x = charPos.x;
    lastPosRef.current.z = charPos.z;

    // Smooth-turn: FPS-independent lerp. k=12 → ~120ms to settle.
    const k = 12;
    const tf = 1 - Math.exp(-k * delta);
    smoothFacingRef.current = lerpAngle(smoothFacingRef.current, charFacing, tf);

    const g = groupRef.current;
    if (g) {
      g.position.x = charPos.x;
      g.position.z = charPos.z;
      // Bob while walking, gentle hover when idle.
      g.position.y = moving
        ? Math.abs(Math.sin(t * 8)) * CHARACTER.bobAmp * 0.6
        : Math.sin(t * CHARACTER.bobFreq) * CHARACTER.bobAmp;
      // Idle sway disappears while walking so rotation feels decisive.
      const sway = moving ? 0 : Math.sin(t * CHARACTER.swayFreq) * CHARACTER.swayAmp;
      g.rotation.y = smoothFacingRef.current + sway;
    }
    if (shadowRef.current) {
      shadowRef.current.position.x = charPos.x;
      shadowRef.current.position.z = charPos.z;
    }
    // Idle arm sway
    const swing = Math.sin(t * 2) * 0.3;
    if (armLRef.current) armLRef.current.rotation.x = swing;
    if (armRRef.current) armRRef.current.rotation.x = -swing;
    if (headRef.current) headRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
  });

  return (
    <>
      {/* Shadow disc — separate ref, mutated in useFrame to track the body. */}
      <mesh
        ref={shadowRef}
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[CHARACTER.shadowRadius, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      <group ref={groupRef} scale={CHARACTER.scale}>
        {/* Head + face */}
        <group ref={headRef}>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshPhongMaterial color="#ffcc99" flatShading />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.08, 1.48, 0.16]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshPhongMaterial color="#222222" flatShading />
          </mesh>
          <mesh position={[0.08, 1.48, 0.16]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshPhongMaterial color="#222222" flatShading />
          </mesh>
          {/* Mouth */}
          <mesh position={[0, 1.38, 0.16]}>
            <boxGeometry args={[0.1, 0.03, 0.02]} />
            <meshPhongMaterial color={COLORS.red} flatShading />
          </mesh>
          {/* Blush */}
          <mesh position={[-0.12, 1.4, 0.16]}>
            <boxGeometry args={[0.08, 0.04, 0.02]} />
            <meshPhongMaterial color="#ffaaaa" emissive="#ffaaaa" emissiveIntensity={0.3} flatShading />
          </mesh>
          <mesh position={[0.12, 1.4, 0.16]}>
            <boxGeometry args={[0.08, 0.04, 0.02]} />
            <meshPhongMaterial color="#ffaaaa" emissive="#ffaaaa" emissiveIntensity={0.3} flatShading />
          </mesh>
          {/* Hair */}
          <mesh position={[0, 1.74, 0]} castShadow>
            <boxGeometry args={[0.42, 0.14, 0.42]} />
            <meshPhongMaterial color="#222222" flatShading />
          </mesh>
        </group>

        {/* Body */}
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.5, 0.25]} />
          <meshPhongMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={0.1} flatShading />
        </mesh>

        {/* Arms */}
        <mesh ref={armLRef} position={[-0.3, 1.05, 0]} castShadow>
          <boxGeometry args={[0.12, 0.45, 0.12]} />
          <meshPhongMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={0.1} flatShading />
        </mesh>
        <mesh ref={armRRef} position={[0.3, 1.05, 0]} castShadow>
          <boxGeometry args={[0.12, 0.45, 0.12]} />
          <meshPhongMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={0.1} flatShading />
        </mesh>

        {/* Legs */}
        <mesh position={[-0.1, 0.6, 0]} castShadow>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshPhongMaterial color="#333333" flatShading />
        </mesh>
        <mesh position={[0.1, 0.6, 0]} castShadow>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshPhongMaterial color="#333333" flatShading />
        </mesh>

        {/* Shoes */}
        <mesh position={[-0.1, 0.4, 0.03]} castShadow>
          <boxGeometry args={[0.15, 0.06, 0.2]} />
          <meshPhongMaterial color={COLORS.red} flatShading />
        </mesh>
        <mesh position={[0.1, 0.4, 0.03]} castShadow>
          <boxGeometry args={[0.15, 0.06, 0.2]} />
          <meshPhongMaterial color={COLORS.red} flatShading />
        </mesh>
      </group>
    </>
  );
}
