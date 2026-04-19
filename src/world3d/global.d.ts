import type { useWorldStore } from './store/worldStore';
import type * as THREE from 'three';

declare global {
  interface Window {
    __worldStore?: typeof useWorldStore;
    __camera?: THREE.PerspectiveCamera;
    navigateToRoom?: (id: string) => void;
    navigateToOverview?: () => void;
  }
}

export {};
