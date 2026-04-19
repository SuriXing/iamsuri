import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, type ViewMode } from '../store/worldStore';
import { ROOM_BY_ID } from '../data/rooms';
import { FP, ROOM, CAMERA, FOLLOW, INTRO } from '../constants';
import {
  followCamYawRef,
  followCamPitchRef,
  targetCamYawRef,
  targetCamPitchRef,
  followCamYawHintRef,
  mouseDraggingRef,
} from './cameraRefs';
import { listWallColliders } from './colliders';

// Room-entry / room-exit tween duration.
const ROOM_TWEEN_DURATION = 1.0;

// Minimum camera distance from character. Low enough that the wall-
// clip can pull the camera into a 5×5 room footprint.
const CAMERA_MIN_DIST = 3.0;
// Wall pushback margin — must be SMALLER than the player collider
// radius (0.28) so the player can never stand inside the camera's
// expanded wall region (which would make the slab-method sweep skip
// the wall as "origin already inside" and let the camera through).
// 0.25 is just under the player radius so the slab math always sees
// the character as outside any expanded wall.
const CAMERA_PUSHBACK = 0.25;
// Auto-yaw-drift: speed at which the camera target yaw lerps toward
// the character's facing direction while walking. 0 disables. ~0.6
// rad/s makes the camera "follow your direction" over ~2s without
// fighting active mouse drag (drag updates targetCamYawRef directly,
// overriding this drift).
const AUTO_YAW_DRIFT = 0.6;
// Yaw-hint speed: when InteractionManager publishes a target yaw to
// face a "spotlight" room (book / idealab), we lerp the target yaw
// toward that hint at this rate. The follow→target lerp (FOLLOW.yawLerp
// = 3.5 rad/s) sits in series, so the EFFECTIVE yaw rate is the slower
// of the two stages. With both ~ 4 rad/s, a worst-case ≈3 rad gap
// converges to within 0.3 rad in well under 2 s.
const YAW_HINT_RATE = 5.0;

// Shared scratch vectors — avoid per-frame allocation in useFrame.
const scratchPos = new THREE.Vector3();
const scratchLook = new THREE.Vector3();

/**
 * Swept XZ test from the character origin toward a target camera
 * position. Returns a clamped distance (0..requestedDist) — whatever
 * part of the sweep is free of wall colliders. Zero per-frame alloc.
 *
 * Perf pass: previous implementation marched 0.2m steps and rescanned
 * every collider per step (O(steps × colliders) ≈ 65 × 12 = 780
 * checks/frame). Now uses the slab-method line-vs-AABB test for each
 * collider exactly once — O(colliders) ≈ 12 checks/frame, 65× faster.
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
  // For each AABB (expanded by CAMERA_PUSHBACK), find the parametric t
  // along the ray (cx+nx*t, cz+nz*t) where it enters the box. Take the
  // smallest valid t across all colliders.
  let nearest = dist;
  for (const box of listWallColliders()) {
    const minX = box.x - box.hx - CAMERA_PUSHBACK;
    const maxX = box.x + box.hx + CAMERA_PUSHBACK;
    const minZ = box.z - box.hz - CAMERA_PUSHBACK;
    const maxZ = box.z + box.hz + CAMERA_PUSHBACK;
    // Slab method: compute t-values for entering and exiting each axis.
    // If the ray is parallel to an axis (n* = 0), the origin must already
    // be inside that slab; otherwise the line never crosses it.
    let tEnter = 0;
    let tExit = nearest;
    if (Math.abs(nx) > 1e-6) {
      const t1 = (minX - cx) / nx;
      const t2 = (maxX - cx) / nx;
      const tMin = t1 < t2 ? t1 : t2;
      const tMax = t1 < t2 ? t2 : t1;
      if (tMin > tEnter) tEnter = tMin;
      if (tMax < tExit) tExit = tMax;
    } else if (cx < minX || cx > maxX) {
      continue; // ray parallel to X but origin outside slab → no hit
    }
    if (Math.abs(nz) > 1e-6) {
      const t1 = (minZ - cz) / nz;
      const t2 = (maxZ - cz) / nz;
      const tMin = t1 < t2 ? t1 : t2;
      const tMax = t1 < t2 ? t2 : t1;
      if (tMin > tEnter) tEnter = tMin;
      if (tMax < tExit) tExit = tMax;
    } else if (cz < minZ || cz > maxZ) {
      continue;
    }
    if (tEnter < tExit && tEnter > 0 && tEnter < nearest) {
      nearest = tEnter;
    }
  }
  // Belt-and-braces: walk back from the resolved distance toward the
  // character if the candidate camera position is still INSIDE any
  // expanded wall. Catches edge cases where slab math misses (e.g.
  // character glancing past a wall corner). Step back in 0.5m chunks
  // until the camera is in free space or we hit CAMERA_MIN_DIST.
  let safe = nearest;
  while (safe > CAMERA_MIN_DIST) {
    const px = cx + nx * safe;
    const pz = cz + nz * safe;
    let inside = false;
    for (const box of listWallColliders()) {
      const ddx = Math.abs(px - box.x) - (box.hx + CAMERA_PUSHBACK);
      const ddz = Math.abs(pz - box.z) - (box.hz + CAMERA_PUSHBACK);
      if (ddx < 0 && ddz < 0) {
        inside = true;
        break;
      }
    }
    if (!inside) break;
    safe -= 0.5;
  }
  return Math.max(CAMERA_MIN_DIST, safe);
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
  const { camera } = useThree();
  // DEV-only handle for E2E tests that need to manipulate camera rotation
  // directly (e.g. real PointerLock-pitch verification by setting
  // camera.rotation.x without going through the FP yaw/pitch store).
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__camera = camera as THREE.PerspectiveCamera;
      // Expose the follow-cam yaw / hint refs for E2E tests so they can
      // read the actual smoothed yaw without having to back-solve from
      // camera position (which lags behind the ref while the position
      // lerp is still converging).
      const w = window as unknown as Record<string, unknown>;
      w.__followCamYawRef = followCamYawRef;
      w.__followCamYawHintRef = followCamYawHintRef;
      w.__mouseDraggingRef = mouseDraggingRef;
      return () => {
        if (window.__camera === camera) window.__camera = undefined;
      };
    }
  }, [camera]);

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
        // Returning to overview: per user request, the post-intro
        // experience is ALWAYS first-person, so we don't pull the camera
        // back to a third-person orbit and we don't recenter the
        // character. The player keeps standing exactly where they
        // walked out of the room. No camera tween — we just clear the
        // viewTransition flag and let the FP block (below) drive the
        // camera from the player's current position next frame.
        tw.active = false;
        tw.enteringRoom = false;
        tw.lastViewMode = s.viewMode;
        useWorldStore.setState({ viewTransition: 'idle' });
        // Make sure FP stays on. fpYaw stays as-is so the player keeps
        // looking the same direction they were looking inside the room.
        if (!s.fpActive) s.setFp(true);
        return;
      } else {
        const room = ROOM_BY_ID[s.viewMode];
        const isTop = room.center.z < 0;
        if (s.enterReason === 'auto') {
          // Walk-through: player is already standing at/just past the
          // doorway in FP. There's no camera transition to do — the FP
          // block (below) already drives the camera from charPos every
          // frame. Just clear the tween, mark transition complete, and
          // let the FP camera continue seamlessly.
          tw.active = false;
          tw.enteringRoom = false;
          tw.lastViewMode = s.viewMode;
          // Make sure FP stays on (advanceDialogue + auto-exit both keep
          // it on, but be defensive). Preserve current fpYaw / fpPitch.
          if (!s.fpActive) s.setFp(true);
          // Skip the room-tween machinery entirely: just complete and go.
          s.completeRoomTransition();
          return;
        } else {
          const cx = room.center.x;
          const cz = isTop
            ? room.center.z + ROOM / 2 - 0.8
            : room.center.z - ROOM / 2 + 0.8;
          s.setCharPos(cx, cz);
          s.setFp(false, isTop ? 0 : Math.PI, 0);
          tw.targetPos.set(cx, FP.eyeHeight, cz);
          tw.targetLook.set(room.center.x, 1.3, room.center.z);
        }
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
      // Even wider FOV inside rooms — was 78°, still felt squashed.
      // 95° opens the room view considerably (typical "wide" FPS FOV).
      if (camera instanceof THREE.PerspectiveCamera && camera.fov !== 95) {
        camera.fov = 95;
        camera.updateProjectionMatrix();
      }
      // FP near-plane override. The overview near (CAMERA.near=0.5) sits
      // farther out than the player collider radius (0.28), so when the
      // player is against a wall the wall surface is INSIDE the near-clip
      // plane and gets culled — looks like the wall went transparent and
      // the skybox shows through. Use CAMERA.fpNear (0.05) in FP mode.
      if (camera instanceof THREE.PerspectiveCamera && camera.near !== CAMERA.fpNear) {
        camera.near = CAMERA.fpNear;
        camera.updateProjectionMatrix();
      }
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
    // Restore default FOV outside FP mode (so overview stays at 50°).
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== CAMERA.fov) {
      camera.fov = CAMERA.fov;
      camera.updateProjectionMatrix();
    }
    // Restore overview near plane.
    if (camera instanceof THREE.PerspectiveCamera && camera.near !== CAMERA.near) {
      camera.near = CAMERA.near;
      camera.updateProjectionMatrix();
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
      const { charPos, charFacing } = s;

      // Auto-yaw-drift: gently nudge the target camera yaw to put the
      // character's "back" facing the camera (camera looks the same way
      // the character is walking). Slow drift — won't fight active mouse
      // drag because the drift is applied to targetCamYawRef and a real
      // drag would have just updated targetCamYawRef to a higher rate.
      // Default DEFAULT_YAW=π puts the camera on the +Z side, so the
      // ideal yaw is `charFacing + π` (camera behind character relative
      // to its facing direction).
      //
      // OUT-4: when InteractionManager publishes a yaw hint (player is
      // approaching book / idealab), prefer the hint over the drift so
      // the spotlight room rotates into frame. Mouse-drag still wins —
      // we skip the hint entirely if a drag is in progress so the user
      // never feels the camera fighting their cursor.
      const hint = followCamYawHintRef.current;
      if (hint !== null && !mouseDraggingRef.current) {
        const hintFactor = 1 - Math.exp(-YAW_HINT_RATE * delta);
        targetCamYawRef.current = lerpAngle(
          targetCamYawRef.current,
          hint,
          hintFactor,
        );
      } else {
        const desiredYaw = charFacing + Math.PI;
        const driftFactor = 1 - Math.exp(-AUTO_YAW_DRIFT * delta);
        targetCamYawRef.current = lerpAngle(
          targetCamYawRef.current,
          desiredYaw,
          driftFactor,
        );
      }

      // Smooth lerp toward the (now drifted + possibly drag-updated) targets.
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
