/**
 * Italian Route Hooks - Utilities for managing Italian localization
 * Separated from components for Fast Refresh compatibility
 */

import { useLocation } from 'react-router-dom';
import { LEGACY_REDIRECTS } from '../config/routes';

/**
 * Hook to get current Italian route
 */
export const useItalianRoute = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // If it's already an Italian route, return as is
  if (!LEGACY_REDIRECTS[currentPath]) {
    return currentPath;
  }
  
  // Return the Italian equivalent
  return LEGACY_REDIRECTS[currentPath];
};

/**
 * Hook to check if current route is Italian
 */
export const useIsItalianRoute = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if this path exists in legacy redirects (meaning it's English)
  const isEnglishRoute = Object.keys(LEGACY_REDIRECTS).includes(currentPath);
  
  return !isEnglishRoute;
};

/**
 * Get Italian route for a given English path
 */
export const getItalianRoute = (englishPath: string): string => {
  return LEGACY_REDIRECTS[englishPath] || englishPath;
};

/**
 * Check if a path is a legacy English route
 */
export const isLegacyRoute = (path: string): boolean => {
  return Object.keys(LEGACY_REDIRECTS).includes(path);
};