import { Canvas } from '@react-three/fiber';
import { World } from './scene/World';
import { Hud } from './hud/Hud';
import { CAMERA } from './constants';
import './world3d.css';

export default function App3D() {
  return (
    <div className="world3d-root">
      <Canvas
        shadows
        camera={{
          position: [...CAMERA.position],
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
        }}
        gl={{ antialias: true }}
      >
        <World />
      </Canvas>
      <Hud />
    </div>
  );
}
