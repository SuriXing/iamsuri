import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, type ViewMode } from '../store/worldStore';
import { ROOM_BY_ID } from '../data/rooms';
import { FP, ROOM, CAMERA, FOLLOW, INTRO } from '../constants';
import {
  followCamYawRef,
  followCamPitchRef,
  targetCamYawRef,
  targetCamPitchRef,
} from './cameraRefs';
import { listColliders } from './colliders';

// Room-entry / room-exit tween duration.
const ROOM_TWEEN_DURATION = 1.0;

// Camera wall-clip pushback: minimum distance the camera must stand in
// front of the character. If a wall would put the camera further than
// this, pull the camera to max-out here instead.
const CAMERA_MIN_DIST = 1.6;
// Radius of the camera "puck" used to push it off wall surfaces so the
// near plane doesn't slice into the wall geometry.
const CAMERA_PUSHBACK = 0.35;

// Shared scratch vectors — avoid per-frame allocation in useFrame.
const scratchPos = new THREE.Vector3();
const scratchLook = new THREE.Vector3();

/**
 * Swept XZ test from the character origin toward a target camera
 * position. Returns a clamped distance (0..requestedDist) — whatever
 * part of the sweep is free of wall colliders. Zero per-frame alloc.
 *
 * Uses the same AABB collider registry that PlayerController sweeps
 * against, so camera + character share a single source of truth for
 * "wall" geometry. Character is at (cx, cz), camera's raw placement is
 * (tx, tz) at `dist` units out along the sweep direction.
 */
function sweepCamera(
  cx: number,
  cz: number,
  tx: number,
  tz: number,
  dist: number,
): number {
  const dx = tx - cx;
  const dz = tz - cz;
  const len = Math.hypot(dx, dz);
  if (len < 1e-4) return dist;
  const nx = dx / len;
  const nz = dz / len;
  // March in small steps from character to target, stopping at the
  // first collider hit. Step size ~0.2m is finer than any wall width.
  const step = 0.2;
  let traveled = 0;
  while (traveled < dist) {
    const px = cx + nx * traveled;
    const pz = cz + nz * traveled;
    for (const box of listColliders()) {
      const ddx = Math.abs(px - box.x) - (box.hx + CAMERA_PUSHBACK);
      const ddz = Math.abs(pz - box.z) - (box.hz + CAMERA_PUSHBACK);
      if (ddx < 0 && ddz < 0) {
        // Hit — return the distance just before the collider.
        return Math.max(CAMERA_MIN_DIST, traveled - step);
      }
    }
    traveled += step;
  }
  return dist;
}

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
        // Target: behind the (centered) character at the current orbit
        // yaw/pitch (so resuming after a room visit doesn't jolt the
        // camera back to a default angle).
        const yaw = followCamYawRef.current;
        const pitch = followCamPitchRef.current;
        const cosP = Math.cos(pitch);
        tw.targetPos.set(
          -Math.sin(yaw) * cosP * FOLLOW.distance,
          Math.sin(pitch) * FOLLOW.distance,
          -Math.cos(yaw) * cosP * FOLLOW.distance,
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
        const { charPos } = s;
        // Tween into the default orbit pose (yaw=0, pitch=π/4, dist=6).
        const yaw = followCamYawRef.current;
        const pitch = followCamPitchRef.current;
        const cosP = Math.cos(pitch);
        tw.targetPos.set(
          charPos.x - Math.sin(yaw) * cosP * FOLLOW.distance,
          Math.sin(pitch) * FOLLOW.distance,
          charPos.z - Math.cos(yaw) * cosP * FOLLOW.distance,
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
      const { charPos } = s;
      // Stationary shot at the default orbit pose. Mouse drag is gated
      // off during dialogue (see MouseOrbitController), so yaw/pitch
      // refs stay at their post-zoom values.
      const yaw = followCamYawRef.current;
      const pitch = followCamPitchRef.current;
      const cosP = Math.cos(pitch);
      camera.position.set(
        charPos.x - Math.sin(yaw) * cosP * (FOLLOW.distance * 0.9),
        Math.sin(pitch) * (FOLLOW.distance * 0.9),
        charPos.z - Math.cos(yaw) * cosP * (FOLLOW.distance * 0.9),
      );
      scratchLook.set(charPos.x, FOLLOW.lookHeight + 0.1, charPos.z);
      camera.lookAt(scratchLook);
      tw.currentLook.copy(scratchLook);
      return;
    }

    // ── Follow: third-person orbit camera ────────────────────
    //
    // Mouse drag steers `targetCamYawRef` / `targetCamPitchRef` (handled
    // by MouseOrbitController). This branch lerps the "current" refs
    // toward the targets each frame and recomputes the camera position
    // from spherical coords around the character.
    //
    //   pos = char + (
    //     -sin(yaw) * cos(pitch) * dist,
    //      sin(pitch) * dist,
    //     -cos(yaw) * cos(pitch) * dist,
    //   )
    //
    // PlayerController reads followCamYawRef.current to compute
    // camera-relative WASD movement, so the controls always feel right
    // relative to the current view.
    {
      const { charPos } = s;
      // Smooth lerp toward the mouse-driven targets.
      const factor = 1 - Math.exp(-FOLLOW.yawLerp * delta);
      followCamYawRef.current = lerpAngle(
        followCamYawRef.current,
        targetCamYawRef.current,
        factor,
      );
      followCamPitchRef.current +=
        (targetCamPitchRef.current - followCamPitchRef.current) * factor;

      const yaw = followCamYawRef.current;
      const pitch = followCamPitchRef.current;
      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      const sinP = Math.sin(pitch);
      const cosP = Math.cos(pitch);

      // Wall-clip pushback: sweep from character to the ideal camera
      // position in XZ against the same collider registry the player
      // uses. If a wall would push the camera through it, clamp the
      // camera distance so it sits in front of the wall instead. Fixes
      // the 穿模 on perspective change when orbiting into a wall.
      const rawTx = charPos.x - sinY * cosP * FOLLOW.distance;
      const rawTz = charPos.z - cosY * cosP * FOLLOW.distance;
      const freeDist = sweepCamera(
        charPos.x,
        charPos.z,
        rawTx,
        rawTz,
        FOLLOW.distance,
      );
      scratchPos.set(
        charPos.x - sinY * cosP * freeDist,
        FOLLOW.lookHeight + sinP * freeDist,
        charPos.z - cosY * cosP * freeDist,
      );
      const posFactor = 1 - Math.exp(-FOLLOW.lerp * delta);
      camera.position.lerp(scratchPos, posFactor);
      scratchLook.set(
        charPos.x + sinY * FOLLOW.lookAhead,
        FOLLOW.lookHeight,
        charPos.z + cosY * FOLLOW.lookAhead,
      );
      camera.lookAt(scratchLook);
      tw.currentLook.copy(scratchLook);
    }
  });

  return null;
}
