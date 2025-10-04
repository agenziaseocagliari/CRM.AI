// src/components/TwoFactorAuth/TwoFactorSettings.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { supabase } from '../../lib/supabaseClient';
import { Modal } from '../ui/Modal';

import { TwoFactorSetup } from './TwoFactorSetup';


import { diagnosticLogger } from '../../lib/mockDiagnosticLogger';
interface TwoFactorSettingsProps {
  className?: string;
}

interface TwoFactorStatus {
  isEnabled: boolean;
  method: string;
  verifiedAt: string | null;
}

interface TrustedDevice {
  id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  last_used_at: string;
  trusted_at: string;
}

export const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      // Load 2FA status
      const { data: settings } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        setStatus({
          isEnabled: settings.is_enabled,
          method: settings.method,
          verifiedAt: settings.verified_at,
        });
      }

      // Load trusted devices
      const { data: devices } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (devices) {
        setTrustedDevices(devices);
      }
    } catch (error) {
      diagnosticLogger.error('Error loading 2FA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsDisabling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {return;}

      const { error } = await supabase
        .from('user_2fa_settings')
        .update({ is_enabled: false })
        .eq('user_id', user.id);

      if (error) {throw error;}

      toast.success('2FA has been disabled');
      setShowDisableConfirm(false);
      await loadStatus();
    } catch (error) {
      diagnosticLogger.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .update({ is_active: false })
        .eq('id', deviceId);

      if (error) {throw error;}

      toast.success('Device removed successfully');
      await loadStatus();
    } catch (error) {
      diagnosticLogger.error('Error removing device:', error);
      toast.error('Failed to remove device');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add an extra layer of security to your account
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* 2FA Status */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">Status</h3>
              {status?.isEnabled ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  "“ Enabled
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Disabled
                </span>
              )}
            </div>
            {status?.isEnabled && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Method: {status.method.toUpperCase()}</p>
                {status.verifiedAt && (
                  <p className="text-xs mt-1">
                    Enabled on {formatDate(status.verifiedAt)}
                  </p>
                )}
              </div>
            )}
            {!status?.isEnabled && (
              <p className="mt-2 text-sm text-gray-600">
                Two-factor authentication is not enabled. Enable it to add an extra layer of security.
              </p>
            )}
          </div>
          <div>
            {status?.isEnabled ? (
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => setShowSetupWizard(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-indigo-700"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </div>

        {/* Trusted Devices */}
        {status?.isEnabled && trustedDevices.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trusted Devices</h3>
            <div className="space-y-3">
              {trustedDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {device.device_name || 'Unknown Device'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                        {device.device_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {device.browser} on {device.os}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last used: {formatDate(device.last_used_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Remove this device from trusted devices?')) {
                        handleRemoveDevice(device.id);
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tips */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Use an authenticator app like Google Authenticator or Authy for the best security</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Save your backup codes in a secure location</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Review and remove trusted devices you no longer use</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Setup Wizard Modal */}
      <TwoFactorSetup
        isOpen={showSetupWizard}
        onClose={() => setShowSetupWizard(false)}
        onSetupComplete={loadStatus}
      />

      {/* Disable Confirmation Modal */}
      <Modal
        isOpen={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        title="Disable Two-Factor Authentication"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              "š ï¸ Disabling 2FA will make your account less secure. Are you sure you want to continue?
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDisableConfirm(false)}
              disabled={isDisabling}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDisable2FA}
              disabled={isDisabling}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isDisabling ? 'Disabling...' : 'Yes, Disable'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};



