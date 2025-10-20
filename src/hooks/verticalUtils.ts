// Utility functions and hooks for vertical management
// Separated from useVertical.tsx to avoid React refresh warnings

// Re-export the main hook from useVertical.tsx
export { useVertical } from './useVertical';

// Import for utility hooks
import { useVertical as useVerticalHook } from './useVertical';

// Utility hooks
export function useIsInsurance() {
    const { vertical } = useVerticalHook();
    return vertical === 'insurance';
}

export function useIsStandard() {
    const { vertical } = useVerticalHook();
    return vertical === 'standard';
}

export function useHasModule(module: string) {
    const { hasModule } = useVerticalHook();
    return hasModule(module);
}