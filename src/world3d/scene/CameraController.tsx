import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, type ViewMode } from '../store/worldStore';
import { ROOM_BY_ID } from '../data/rooms';
import { FP, ROOM, CAMERA } from '../constants';
import {
  camAngleRef,
  camPitchRef,
  camDistRef,
  targetAngleRef,
  targetPitchRef,
  targetDistRef,
  resetOrbitTargets,
} from './cameraRefs';

const TWEEN_DURATION = 1.0; // seconds
const ORBIT_LERP_K = 8; // exponential lerp constant

interface TweenState {
  active: boolean;
  progress: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startLook: THREE.Vector3;
  targetLook: THREE.Vector3;
  currentLook: THREE.Vector3;
  lastViewMode: ViewMode;
  enteringRoom: boolean;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function CameraController(): null {
  const tweenRef = useRef<TweenState>({
    active: false,
    progress: 0,
    startPos: new THREE.Vector3(...CAMERA.position),
    targetPos: new THREE.Vector3(),
    startLook: new THREE.Vector3(0, 1, 0),
    targetLook: new THREE.Vector3(0, 1, 0),
    currentLook: new THREE.Vector3(0, 1, 0),
    lastViewMode: 'overview',
    enteringRoom: false,
  });

  useFrame((state, delta) => {
    const camera = state.camera;
    const s = useWorldStore.getState();
    const viewMode = s.viewMode;
    const tw = tweenRef.current;

    // ── Detect view mode change → start tween ─────────────
    if (tw.lastViewMode !== viewMode) {
      tw.startPos.copy(camera.position);
      tw.startLook.copy(tw.currentLook);
      tw.progress = 0;
      tw.active = true;
      // Reset per-tween flags so spam 1/2/3/4 can't leak enteringRoom
      // state from a previous tween into a new one.
      tw.enteringRoom = false;
      // Drive the transition state machine so PlayerController knows
      // to freeze. completed in the tween-end branch below.
      useWorldStore.setState({
        viewTransition: viewMode === 'overview' ? 'exiting' : 'entering',
      });

      if (viewMode === 'overview') {
        // Returning to overview: tween to orbit position around current char.
        resetOrbitTargets();
        const ca = camAngleRef.current;
        const cp = camPitchRef.current;
        const cd = camDistRef.current;
        // Snap character to origin to match legacy behaviour.
        s.setCharPos(0, 0);
        s.setFp(false);
        tw.targetPos.set(
          Math.cos(ca) * Math.cos(cp) * cd,
          Math.sin(cp) * cd,
          Math.sin(ca) * Math.cos(cp) * cd,
        );
        tw.targetLook.set(0, 1, 0);
      } else {
        // Entering a room: place char at FP spawn point at the doorway.
        const room = ROOM_BY_ID[viewMode];
        const isTop = room.center.z < 0;
        const cx = room.center.x;
        const cz = isTop
          ? room.center.z + ROOM / 2 - 0.8
          : room.center.z - ROOM / 2 + 0.8;
        s.setCharPos(cx, cz);
        // fpActive stays false during the tween — we flip it true at the end.
        s.setFp(false, isTop ? 0 : Math.PI, 0);
        tw.targetPos.set(cx, FP.eyeHeight, cz);
        tw.targetLook.set(room.center.x, 1.3, room.center.z);
        tw.enteringRoom = true;
      }

      tw.lastViewMode = viewMode;
    }

    // ── Advance tween ─────────────────────────────────────
    if (tw.active) {
      tw.progress += delta / TWEEN_DURATION;
      if (tw.progress >= 1) {
        tw.progress = 1;
        tw.active = false;
        if (tw.enteringRoom) {
          // Activate FP mode now that we're at the spawn point. Flip
          // the transition state machine to 'idle' so PlayerController
          // starts moving again on the next frame.
          s.completeRoomTransition();
        } else {
          // Exit tween done — return state machine to idle.
          if (useWorldStore.getState().viewTransition !== 'idle') {
            useWorldStore.setState({ viewTransition: 'idle' });
          }
        }
      }
      const ease = easeInOut(tw.progress);
      camera.position.lerpVectors(tw.startPos, tw.targetPos, ease);
      tw.currentLook.lerpVectors(tw.startLook, tw.targetLook, ease);
      camera.lookAt(tw.currentLook);
      return;
    }

    // ── Not tweening ──────────────────────────────────────
    if (s.fpActive) {
      // First-person: camera at character eye, mouse-look orientation.
      const { charPos, fpYaw, fpPitch } = s;
      camera.position.set(charPos.x, FP.eyeHeight, charPos.z);
      const cosP = Math.cos(fpPitch);
      const lookX = charPos.x - Math.sin(fpYaw) * cosP;
      const lookY = FP.eyeHeight + Math.sin(fpPitch);
      const lookZ = charPos.z - Math.cos(fpYaw) * cosP;
      tw.currentLook.set(lookX, lookY, lookZ);
      camera.lookAt(lookX, lookY, lookZ);
    } else {
      // Overview orbit camera. Smooth lerp toward target angle/pitch/dist.
      const factor = 1 - Math.exp(-ORBIT_LERP_K * delta);
      camAngleRef.current += (targetAngleRef.current - camAngleRef.current) * factor;
      camPitchRef.current += (targetPitchRef.current - camPitchRef.current) * factor;
      camDistRef.current += (targetDistRef.current - camDistRef.current) * factor;

      const charPos = s.charPos;
      const ca = camAngleRef.current;
      const cp = camPitchRef.current;
      const cd = camDistRef.current;
      const bob = Math.sin(performance.now() * 0.0005) * 0.05;
      camera.position.x = charPos.x + Math.cos(ca) * Math.cos(cp) * cd;
      camera.position.y = Math.sin(cp) * cd + bob;
      camera.position.z = charPos.z + Math.sin(ca) * Math.cos(cp) * cd;
      camera.lookAt(charPos.x, 1, charPos.z);
      tw.currentLook.set(charPos.x, 1, charPos.z);
    }
  });

  return null;
}
