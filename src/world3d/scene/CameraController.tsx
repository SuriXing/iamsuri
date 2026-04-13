import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, type ViewMode } from '../store/worldStore';
import { ROOM_BY_ID } from '../data/rooms';
import { FP, ROOM, CAMERA, FOLLOW, INTRO } from '../constants';
import { followCamYawRef } from './cameraRefs';

// Room-entry / room-exit tween duration.
const ROOM_TWEEN_DURATION = 1.0;

// Shared scratch vectors — avoid per-frame allocation in useFrame.
const scratchPos = new THREE.Vector3();
const scratchLook = new THREE.Vector3();

interface TweenState {
  active: boolean;
  progress: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startLook: THREE.Vector3;
  targetLook: THREE.Vector3;
  currentLook: THREE.Vector3;
  /** Room tween tracking: current viewMode the tween is driving toward. */
  lastViewMode: ViewMode;
  enteringRoom: boolean;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

/**
 * Single camera controller handling every phase of the 3D world:
 *
 *   intro-static  — fixed tilted top-down shot showing all rooms
 *   intro-zoom    — eased tween down to behind the character
 *   dialogue      — parked behind the character, text box visible
 *   follow        — default gameplay: third-person chase camera
 *   (fpActive)    — first-person mode inside a room (viewMode !== overview)
 *
 * All phases share the same THREE.PerspectiveCamera; we just set its
 * position / lookAt each frame.
 */
export function CameraController(): null {
  const tweenRef = useRef<TweenState>({
    active: false,
    progress: 0,
    duration: ROOM_TWEEN_DURATION,
    startPos: new THREE.Vector3(...CAMERA.position),
    targetPos: new THREE.Vector3(),
    startLook: new THREE.Vector3(...CAMERA.lookAt),
    targetLook: new THREE.Vector3(),
    currentLook: new THREE.Vector3(...CAMERA.lookAt),
    lastViewMode: 'overview',
    enteringRoom: false,
  });
  // Camera yaw is kept in a shared module ref (followCamYawRef) so the
  // PlayerController can read it for camera-relative walking without
  // crossing React boundaries.
  const staticHoldRef = useRef<number>(0);

  useFrame((state, delta) => {
    const camera = state.camera;
    const s = useWorldStore.getState();
    const tw = tweenRef.current;

    // ── Room enter / exit tweens ─────────────────────────────
    // These take precedence over intro phases — if the user somehow
    // triggered a room entry during intro (shouldn't happen, but...),
    // the tween logic wins.
    if (tw.lastViewMode !== s.viewMode) {
      tw.startPos.copy(camera.position);
      tw.startLook.copy(tw.currentLook);
      tw.progress = 0;
      tw.duration = ROOM_TWEEN_DURATION;
      tw.active = true;
      tw.enteringRoom = false;
      useWorldStore.setState({
        viewTransition: s.viewMode === 'overview' ? 'exiting' : 'entering',
      });

      if (s.viewMode === 'overview') {
        // Returning to overview: reset character and flip out of FP.
        s.setCharPos(0, 0);
        s.setFp(false);
        // Target: behind the (now-centered) character at follow distance.
        const f = s.charFacing;
        tw.targetPos.set(
          0 - Math.sin(f) * FOLLOW.distance,
          FOLLOW.height,
          0 - Math.cos(f) * FOLLOW.distance,
        );
        tw.targetLook.set(0, FOLLOW.lookHeight, 0);
      } else {
        const room = ROOM_BY_ID[s.viewMode];
        const isTop = room.center.z < 0;
        const cx = room.center.x;
        const cz = isTop
          ? room.center.z + ROOM / 2 - 0.8
          : room.center.z - ROOM / 2 + 0.8;
        s.setCharPos(cx, cz);
        s.setFp(false, isTop ? 0 : Math.PI, 0);
        tw.targetPos.set(cx, FP.eyeHeight, cz);
        tw.targetLook.set(room.center.x, 1.3, room.center.z);
        tw.enteringRoom = true;
      }
      tw.lastViewMode = s.viewMode;
    }

    if (tw.active) {
      tw.progress += delta / tw.duration;
      if (tw.progress >= 1) {
        tw.progress = 1;
        tw.active = false;
        if (tw.enteringRoom) {
          s.completeRoomTransition();
        } else if (useWorldStore.getState().viewTransition !== 'idle') {
          useWorldStore.setState({ viewTransition: 'idle' });
        }
      }
      const ease = easeInOut(tw.progress);
      camera.position.lerpVectors(tw.startPos, tw.targetPos, ease);
      tw.currentLook.lerpVectors(tw.startLook, tw.targetLook, ease);
      camera.lookAt(tw.currentLook);
      return;
    }

    // ── First-person inside a room ───────────────────────────
    if (s.fpActive) {
      const { charPos, fpYaw, fpPitch } = s;
      camera.position.set(charPos.x, FP.eyeHeight, charPos.z);
      const cosP = Math.cos(fpPitch);
      const lookX = charPos.x - Math.sin(fpYaw) * cosP;
      const lookY = FP.eyeHeight + Math.sin(fpPitch);
      const lookZ = charPos.z - Math.cos(fpYaw) * cosP;
      tw.currentLook.set(lookX, lookY, lookZ);
      camera.lookAt(lookX, lookY, lookZ);
      return;
    }

    // ── Intro: static establishing shot ─────────────────────
    if (s.introPhase === 'intro-static') {
      camera.position.set(CAMERA.position[0], CAMERA.position[1], CAMERA.position[2]);
      camera.lookAt(CAMERA.lookAt[0], CAMERA.lookAt[1], CAMERA.lookAt[2]);
      tw.currentLook.set(CAMERA.lookAt[0], CAMERA.lookAt[1], CAMERA.lookAt[2]);
      staticHoldRef.current += delta;
      if (staticHoldRef.current >= INTRO.staticHold) {
        // Kick off the zoom-in tween. Start from the current static pose.
        tw.startPos.copy(camera.position);
        tw.startLook.copy(tw.currentLook);
        const { charPos, charFacing } = s;
        tw.targetPos.set(
          charPos.x - Math.sin(charFacing) * FOLLOW.distance,
          FOLLOW.height,
          charPos.z - Math.cos(charFacing) * FOLLOW.distance,
        );
        tw.targetLook.set(charPos.x, FOLLOW.lookHeight, charPos.z);
        tw.progress = 0;
        tw.duration = INTRO.zoomDuration;
        tw.active = true;
        tw.lastViewMode = s.viewMode; // suppress spurious room-tween restart
        s.setIntroPhase('intro-zoom');
        // A one-shot trick: leverage the same tween machinery by
        // un-flagging enteringRoom so the end branch drops us into
        // dialogue mode rather than FP.
        tw.enteringRoom = false;
      }
      return;
    }

    if (s.introPhase === 'intro-zoom') {
      // The tween above is already driving the camera, but when it
      // completes it won't call setIntroPhase('dialogue') because the
      // room-tween logic only handles viewMode. We detect completion
      // here by checking tw.active (falls through to follow math once
      // the room-tween branch finishes). Since the tween-end code runs
      // in the room-tween branch at the top of useFrame, reaching here
      // means the zoom has ended.
      s.setIntroPhase('dialogue');
      followCamYawRef.current = s.charFacing;
      // Fall through to dialogue handling on the next frame.
      return;
    }

    // ── Dialogue: parked behind the character ───────────────
    if (s.introPhase === 'dialogue') {
      const { charPos, charFacing } = s;
      // Smoothly track the character's facing so the shot stays stable
      // but isn't jarring if charFacing changes (shouldn't normally).
      const factor = 1 - Math.exp(-FOLLOW.yawLerp * delta);
      followCamYawRef.current = lerpAngle(
        followCamYawRef.current,
        charFacing,
        factor,
      );
      const yaw = followCamYawRef.current;
      camera.position.set(
        charPos.x - Math.sin(yaw) * (FOLLOW.distance * 0.9),
        FOLLOW.height * 0.95,
        charPos.z - Math.cos(yaw) * (FOLLOW.distance * 0.9),
      );
      scratchLook.set(charPos.x, FOLLOW.lookHeight + 0.1, charPos.z);
      camera.lookAt(scratchLook);
      tw.currentLook.copy(scratchLook);
      return;
    }

    // ── Follow: third-person chase camera ───────────────────
    {
      const { charPos, charFacing } = s;
      // Smoothed camera yaw chases the character's facing so the shot
      // always sits behind them without snapping.
      const factor = 1 - Math.exp(-FOLLOW.yawLerp * delta);
      followCamYawRef.current = lerpAngle(
        followCamYawRef.current,
        charFacing,
        factor,
      );
      const yaw = followCamYawRef.current;
      scratchPos.set(
        charPos.x - Math.sin(yaw) * FOLLOW.distance,
        FOLLOW.height,
        charPos.z - Math.cos(yaw) * FOLLOW.distance,
      );
      // Smooth positional follow.
      const posFactor = 1 - Math.exp(-FOLLOW.lerp * delta);
      camera.position.lerp(scratchPos, posFactor);
      scratchLook.set(charPos.x, FOLLOW.lookHeight, charPos.z);
      camera.lookAt(scratchLook);
      tw.currentLook.copy(scratchLook);
    }
  });

  return null;
}
