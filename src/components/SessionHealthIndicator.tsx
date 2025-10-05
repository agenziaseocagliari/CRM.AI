/**
 * Session Health Indicator Component
 * Monitors JWT session health and provides real-time diagnostics
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useJWTDiagnostics } from '../lib/auth/jwtDiagnostics';
import { diagnosticLogger } from '../lib/mockDiagnosticLogger';

interface SessionHealthIndicatorProps {
  compact?: boolean;
  checkInterval?: number; // minutes, 0 = disabled
}

interface HealthStatus {
  isHealthy: boolean;
  hasValidSession: boolean;
  tokenExpiry?: Date;
  issues: string[];
  lastChecked?: Date;
}

export const SessionHealthIndicator: React.FC<SessionHealthIndicatorProps> = ({
  compact = false,
  checkInterval = 0
}) => {
  const { 
    sessionHealth, 
    tokenInfo, 
    performDiagnostics
  } = useJWTDiagnostics();
  
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: true,
    hasValidSession: false,
    issues: []
  });
  
  const [isChecking, setIsChecking] = useState(false);

  // Manual health check function
  const performHealthCheck = useCallback(async () => {
    setIsChecking(true);
    diagnosticLogger.info('🏥 [Session Health] Manual health check initiated...');
    
    try {
      await performDiagnostics();
      
      const issues: string[] = [];
      const hasValidSession = sessionHealth?.isValid || false;
      
      if (!hasValidSession) {
        issues.push('Session is invalid or expired');
      }
      
      if (tokenInfo?.isExpired) {
        issues.push('Token has expired');
      }
      
      if (tokenInfo?.expiresInMinutes && tokenInfo.expiresInMinutes < 5) {
        issues.push('Token expires in less than 5 minutes');
      }

      const newStatus: HealthStatus = {
        isHealthy: issues.length === 0,
        hasValidSession,
        tokenExpiry: tokenInfo?.expiryDate,
        issues,
        lastChecked: new Date()
      };
      
      setHealthStatus(newStatus);
      diagnosticLogger.info('🏥 [Session Health] Health check completed', { status: newStatus });
      
    } catch (error) {
      diagnosticLogger.error('❌ [Session Health] Health check failed', error);
      setHealthStatus({
        isHealthy: false,
        hasValidSession: false,
        issues: ['Health check failed'],
        lastChecked: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  }, [performDiagnostics, sessionHealth, tokenInfo]);

  const handleHealthCheck = () => {
    performHealthCheck();
  };

  // Periodic health check
  useEffect(() => {
    if (checkInterval > 0) {
      const intervalId = setInterval(() => {
        diagnosticLogger.info('🏥 [Session Health] Running periodic health check...');
        performHealthCheck();
      }, checkInterval * 60 * 1000);

      return () => clearInterval(intervalId);
    }
  }, [checkInterval, performHealthCheck]);

  // Initial health check
  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {healthStatus.isHealthy ? '✅' : '⚠️'}
          </span>
          <div className="text-sm">
            <div className="font-semibold">
              Session: {healthStatus.hasValidSession ? 'Active' : 'Invalid'}
            </div>
            {healthStatus.tokenExpiry && (
              <div className="text-xs text-gray-600">
                Expires: {healthStatus.tokenExpiry.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {healthStatus.issues.length > 0 && (
          <div className="mb-3 p-2 bg-red-50 rounded border border-red-200">
            <div className="text-xs font-semibold text-red-800 mb-1">Issues:</div>
            <ul className="text-xs text-red-700 space-y-1">
              {healthStatus.issues.slice(0, 3).map((issue, idx) => (
                <li key={idx}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleHealthCheck}
          disabled={isChecking}
          className="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm"
        >
          {isChecking ? 'Checking...' : '🔍 Run Health Check'}
        </button>
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Session Health Status</h3>
        <button
          onClick={handleHealthCheck}
          disabled={isChecking}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 text-sm"
        >
          {isChecking ? 'Checking...' : '🔍 Run Check'}
        </button>
      </div>

      {/* Overall Status */}
      <div className={`mb-4 p-4 rounded-lg border-2 ${
        healthStatus.isHealthy
          ? 'bg-green-50 border-green-500'
          : 'bg-red-50 border-red-500'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-3xl">
            {healthStatus.isHealthy ? '✅' : '⚠️'}
          </span>
          <div className="text-right">
            <div className="text-xl font-bold">
              {healthStatus.isHealthy ? 'Healthy' : 'Issues Detected'}
            </div>
            {healthStatus.lastChecked && (
              <div className="text-sm text-gray-600">
                Last checked: {healthStatus.lastChecked.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded border">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valid Session:</span>
              <span>{healthStatus.hasValidSession ? '✅' : '❌'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Token Status:</span>
              <span>{tokenInfo?.isExpired ? '❌ Expired' : '✅ Valid'}</span>
            </div>
            {healthStatus.tokenExpiry && (
              <div className="flex justify-between text-sm">
                <span>Expires:</span>
                <span className="text-xs">{healthStatus.tokenExpiry.toLocaleString()}</span>
              </div>
            )}
            {tokenInfo?.expiresInMinutes !== undefined && (
              <div className="flex justify-between text-sm">
                <span>Time Left:</span>
                <span className={tokenInfo.expiresInMinutes < 5 ? 'text-red-600 font-semibold' : ''}>
                  {tokenInfo.expiresInMinutes} min
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded border">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Health Status:</span>
              <span className={healthStatus.isHealthy ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.isHealthy ? 'Good' : `${healthStatus.issues.length} Issues`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Auto Check:</span>
              <span>{checkInterval > 0 ? `Every ${checkInterval}min` : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {healthStatus.issues.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-300">
          <h4 className="font-semibold text-red-800 mb-2">Issues Detected:</h4>
          <ul className="space-y-1">
            {healthStatus.issues.map((issue, idx) => (
              <li key={idx} className="text-sm text-red-700">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SessionHealthIndicator;
