import { Canvas } from '@react-three/fiber';
import { World } from './scene/World';
import { Hud } from './hud/Hud';
import './world3d.css';

export default function App3D() {
  return (
    <div className="world3d-root">
      <Canvas
        shadows
        camera={{ position: [14, 16, 14], fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
      >
        <World />
      </Canvas>
      <Hud />
    </div>
  );
}
