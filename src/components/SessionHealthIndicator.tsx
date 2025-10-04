/**
 * Session Health Indicator Compon      const intervalId = setInterval(() =          <span className                <div className="flex items-center j                <button
          onClick={handleHealthCheck}
          disabled={isChecking}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 text-sm"
        >
          {isChecking ? 'Checking...' : '🔍 Run Check'}
        </button>
               <span className="text-3xl">
            {healthStatus.isHealthy ? '✅' : '⚠️'}
          </span>  onClick={handleHealthCheck}
          disabled={isChecking}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 text-sm"
        >
          {isChecking ? 'Checking...' : '🔍 Run Check'}
        </button>between text-sm">
                  <span>Valid Session:</span>
                  <span>{healthStatus.hasValidSession ? '✅' : '❌'}</span>
                </div>xt-lg">
            {healthStatus.isHealthy ? '✅' : '⚠️'}
          </span>
        diagnosticLogger.info('🏥 [Session Health] Running periodic health check...');
        performHealthCheck();
      }, checkInterval * 60 * 1000);
 * 
 * Displays real-time session health status and allows users to run health checks.
 * Can be integrated into dashboard, header, or as a floating widget.
 */

import React, { useEffect, useState } from 'react';

import { useJWTDiagnostics } from '../hooks/useJWTDiagnostics';
import { diagnosticLogger } from '../lib/mockDiagnosticLogger';

interface SessionHealthIndicatorProps {
  mode?: 'compact' | 'full';
  autoCheck?: boolean; // Auto-run health check on mount
  checkInterval?: number; // Auto-run interval in minutes (0 = disabled)
  onIssueDetected?: () => void;
}

export const SessionHealthIndicator: React.FC<SessionHealthIndicatorProps> = ({
  mode = 'compact',
  autoCheck = true,
  checkInterval = 5, // Check every 5 minutes by default
  onIssueDetected,
}) => {
  const { healthStatus, performHealthCheck } = useJWTDiagnostics();
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Run initial health check
  useEffect(() => {
    if (autoCheck) {
      performHealthCheck();
    }
  }, [autoCheck, performHealthCheck]);

  // Set up periodic health checks
  useEffect(() => {
    if (checkInterval > 0) {
      const intervalId = setInterval(() => {
        diagnosticLogger.info('ðŸ¥ [Session Health] Running periodic health check...');
        performHealthCheck();
      }, checkInterval * 60 * 1000);

      return () => clearInterval(intervalId);
    }
  }, [checkInterval, performHealthCheck]);

  // Trigger callback when issues detected
  useEffect(() => {
    if (!healthStatus.isHealthy && onIssueDetected) {
      onIssueDetected();
    }
  }, [healthStatus.isHealthy, onIssueDetected]);

  const handleHealthCheck = async () => {
    setIsChecking(true);
    try {
      await performHealthCheck();
      diagnosticLogger.info('healthcheck', 'Manual health check performed by user');
    } finally {
      setIsChecking(false);
    }
  };

  if (mode === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            healthStatus.isHealthy
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200 animate-pulse'
          }`}
          title="Session Health Status"
        >
          <span className="text-lg">
            {healthStatus.isHealthy ? '✅' : 'âš ï¸'}
          </span>
          <span className="text-sm font-semibold">
            {healthStatus.isHealthy ? 'Healthy' : 'Issues'}
          </span>
        </button>

        {/* Dropdown Details */}
        {showDetails && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Session Health</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Valid Session:</span>
                  <span>{healthStatus.hasValidSession ? '✅' : 'âŒ'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Has user_role:</span>
                  <span>{healthStatus.hasUserRoleClaim ? '✅' : 'âŒ'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Claims Match Storage:</span>
                  <span>{healthStatus.claimsMatchStorage ? '✅' : 'âŒ'}</span>
                </div>
              </div>

              {healthStatus.issues.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 rounded border border-red-200">
                  <div className="text-xs font-semibold text-red-800 mb-1">Issues:</div>
                  <ul className="text-xs text-red-700 space-y-1">
                    {healthStatus.issues.slice(0, 3).map((issue, idx) => (
                      <li key={idx}>â€¢ {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleHealthCheck}
                disabled={isChecking}
                className="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm"
              >
                {isChecking ? 'Checking...' : 'ðŸ” Run Health Check'}
              </button>

              <div className="mt-2 text-xs text-gray-500 text-center">
                Last checked: {new Date(healthStatus.lastChecked).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
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
          {isChecking ? 'Checking...' : 'ðŸ” Run Check'}
        </button>
      </div>

      {/* Overall Status */}
      <div className={`mb-4 p-4 rounded-lg border-2 ${
        healthStatus.isHealthy
          ? 'bg-green-50 border-green-500'
          : 'bg-red-50 border-red-500'
      }`}>
        <div className="flex items-center space-x-3">
          <span className="text-3xl">
            {healthStatus.isHealthy ? '✅' : 'âš ï¸'}
          </span>
          <div>
            <div className="text-lg font-bold">
              {healthStatus.isHealthy ? 'All Systems Operational' : 'Issues Detected'}
            </div>
            <div className="text-sm text-gray-600">
              Last checked: {new Date(healthStatus.lastChecked).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Checks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className={`p-4 rounded-lg border ${
          healthStatus.hasValidSession
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="text-center">
            <div className="text-2xl mb-1">
              {healthStatus.hasValidSession ? '✅' : 'âŒ'}
            </div>
            <div className="text-sm font-semibold">Valid Session</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          healthStatus.hasUserRoleClaim
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="text-center">
            <div className="text-2xl mb-1">
              {healthStatus.hasUserRoleClaim ? '✅' : 'âŒ'}
            </div>
            <div className="text-sm font-semibold">user_role Claim</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          healthStatus.claimsMatchStorage
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="text-center">
            <div className="text-2xl mb-1">
              {healthStatus.claimsMatchStorage ? '✅' : 'âŒ'}
            </div>
            <div className="text-sm font-semibold">Claims Match</div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {healthStatus.issues.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-300">
          <h4 className="font-bold text-red-800 mb-2">🚨 Issues Detected:</h4>
          <ul className="space-y-1">
            {healthStatus.issues.map((issue, idx) => (
              <li key={idx} className="text-sm text-red-700">
                â€¢ {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Automatic Check Info */}
      {checkInterval > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Automatic health checks every {checkInterval} minutes
        </div>
      )}
    </div>
  );
};

