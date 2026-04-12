import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore, type InteractableData } from '../store/worldStore';

const RAY_LENGTH = 3;
const FORWARD = new THREE.Vector3(0, 0, -1);

function isInteractableData(value: unknown): value is InteractableData {
  if (!value || typeof value !== 'object') return false;
  const v = value as { title?: unknown; body?: unknown; link?: unknown };
  return typeof v.title === 'string' && typeof v.body === 'string';
}

/**
 * Each frame in FP mode, casts a forward ray from the camera and finds the
 * first mesh whose `userData.interactable` matches `InteractableData`.
 * Pushes the result to the store as `focusedInteractable`.
 */
export function InteractionRaycaster(): null {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const dir = useRef(new THREE.Vector3());

  useFrame(() => {
    const s = useWorldStore.getState();
    if (!s.fpActive) {
      if (s.focusedInteractable !== null) s.setFocusedInteractable(null);
      return;
    }

    dir.current.copy(FORWARD).applyQuaternion(camera.quaternion);
    raycaster.current.set(camera.position, dir.current);
    raycaster.current.far = RAY_LENGTH;

    // Recursive intersect against the whole scene; cheap enough for our scale.
    const hits = raycaster.current.intersectObjects(scene.children, true);
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        const data = obj.userData?.interactable;
        if (isInteractableData(data)) {
          if (s.focusedInteractable !== data) {
            s.setFocusedInteractable(data);
          }
          return;
        }
        obj = obj.parent;
      }
    }
    if (s.focusedInteractable !== null) s.setFocusedInteractable(null);
  });

  return null;
}
