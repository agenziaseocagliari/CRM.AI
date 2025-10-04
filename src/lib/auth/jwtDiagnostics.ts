/**
 * JWT Diagnostics Hook
 * Mock implementation for development
 */
import { useState, useCallback } from 'react';

interface TokenInfo {
  isExpired: boolean;
  expiryDate?: Date;
  expiresInMinutes?: number;
}

interface SessionHealth {
  isValid: boolean;
}

export const useJWTDiagnostics = () => {
  const [sessionHealth] = useState<SessionHealth>({ isValid: true });
  const [tokenInfo] = useState<TokenInfo>({ 
    isExpired: false, 
    expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    expiresInMinutes: 1440 
  });

  const performDiagnostics = useCallback(async () => {
    // Mock implementation
    return Promise.resolve({ success: true });
  }, []);

  return {
    sessionHealth,
    tokenInfo,
    performDiagnostics
  };
};