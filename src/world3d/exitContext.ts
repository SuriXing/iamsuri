import { createContext, useContext } from 'react';

// Context for child HUD components to reach the `onExitTo2D` callback
// without prop-drilling through every scene layer. Lives in its own file
// so the `App3D` component file can keep react-refresh clean.
export const ExitContext = createContext<(() => void) | null>(null);

export function useExitTo2D(): (() => void) | null {
  return useContext(ExitContext);
}
