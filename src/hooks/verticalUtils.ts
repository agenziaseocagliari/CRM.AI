// Utility functions and hooks for vertical management
// Separated from useVertical.tsx to avoid React refresh warnings

import { useContext } from 'react';
import { VerticalContext } from './useVertical';

// Main hook for consuming context
export function useVertical() {
    const context = useContext(VerticalContext);
    if (!context) {
        throw new Error('useVertical must be used within VerticalProvider');
    }
    return context;
}

// Utility hooks
export function useIsInsurance() {
    const { vertical } = useVertical();
    return vertical === 'insurance';
}

export function useIsStandard() {
    const { vertical } = useVertical();
    return vertical === 'standard';
}

export function useHasModule(module: string) {
    const { hasModule } = useVertical();
    return hasModule(module);
}