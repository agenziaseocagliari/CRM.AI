/**
 * Route Redirect Handler - Legacy English → Italian URL Redirects
 * Ensures SEO-friendly redirects for backward compatibility
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LEGACY_REDIRECTS } from '../config/routes';

interface RedirectHandlerProps {
  children: React.ReactNode;
}

export const RedirectHandler: React.FC<RedirectHandlerProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if current path needs redirect to Italian version
  const redirectTo = LEGACY_REDIRECTS[currentPath];
  
  if (redirectTo) {
    // Preserve query parameters and hash
    const search = location.search;
    const hash = location.hash;
    const fullRedirectUrl = `${redirectTo}${search}${hash}`;
    
    return <Navigate to={fullRedirectUrl} replace />;
  }
  
  return <>{children}</>;
};