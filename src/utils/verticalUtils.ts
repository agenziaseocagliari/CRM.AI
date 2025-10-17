import { useVertical } from '../hooks/verticalUtils';

// Utility hooks for vertical-specific functionality
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