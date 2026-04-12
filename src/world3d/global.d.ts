import type { useWorldStore } from './store/worldStore';

declare global {
  interface Window {
    __worldStore?: typeof useWorldStore;
    navigateToRoom?: (id: string) => void;
    navigateToOverview?: () => void;
  }
}

export {};
