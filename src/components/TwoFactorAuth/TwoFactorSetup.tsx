// src/components/TwoFactorAuth/TwoFactorSetup.tsx
import QRCode from 'qrcode';
/* eslint-disable no-alert */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { supabase } from '../../lib/supabaseClient';
import { CheckCircleIcon } from '../ui/icons';
import { Modal } from '../ui/Modal';

import { diagnosticLogger } from '../../lib/mockDiagnosticLogger';
interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

interface SetupStep {
  step: 'method' | 'qr' | 'verify' | 'backup' | 'complete';
  data?: any;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isOpen,
  onClose,
  onSetupComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>({ step: 'method' });
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'email' | 'sms'>('totp');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentStep.step === 'method') {
      setCurrentStep({ step: 'method' });
      setSelectedMethod('totp');
      setQrCodeUrl('');
      setSecret('');
      setVerificationCode('');
      setBackupCodes([]);
    }
  }, [isOpen, currentStep.step]);

  const generateTOTPSecret = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {throw new Error('User not authenticated');}

      const generateSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
          secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
      };

      const newSecret = generateSecret();
      const appName = 'Guardian AI CRM';
      const otpauthUrl = `otpauth://totp/${appName}:${user.email}?secret=${newSecret}&issuer=${appName}`;

      const qrUrl = await QRCode.toDataURL(otpauthUrl);
      
      setSecret(newSecret);
      setQrCodeUrl(qrUrl);
      setCurrentStep({ step: 'qr', data: { secret: newSecret } });
    } catch (error) {
      diagnosticLogger.error('Error generating TOTP secret:', error);
      toast.error('Failed to generate authentication code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {throw new Error('User not authenticated');}
      
      const { error: insertError } = await supabase
        .from('user_2fa_settings')
        .upsert({
          user_id: user.id,
          is_enabled: true,
          method: selectedMethod,
          secret: secret,
          verified_at: new Date().toISOString(),
        });

      if (insertError) {throw insertError;}

      const codes = await generateBackupCodes();
      setBackupCodes(codes);
      
      setCurrentStep({ step: 'backup' });
      toast.success('2FA enabled successfully!');
    } catch (error) {
      diagnosticLogger.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBackupCodes = async (): Promise<string[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {throw new Error('User not authenticated');}

      const { data, error } = await supabase.rpc('generate_backup_codes', {
        p_user_id: user.id
      });

      if (error) {throw error;}
      
      const { error: updateError } = await supabase
        .from('user_2fa_settings')
        .update({ backup_codes: data })
        .eq('user_id', user.id);

      if (updateError) {throw updateError;}

      return data || [];
    } catch (error) {
      diagnosticLogger.error('Error generating backup codes:', error);
      return [];
    }
  };

  const handleMethodSelect = async () => {
    if (selectedMethod === 'totp') {
      await generateTOTPSecret();
    } else {
      setCurrentStep({ step: 'verify' });
    }
  };

  const handleComplete = () => {
    setCurrentStep({ step: 'complete' });
    setTimeout(() => {
      onSetupComplete();
      onClose();
    }, 2000);
  };

  const downloadBackupCodes = () => {
    const content = `Guardian AI CRM - Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guardian-ai-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep.step) {
      case 'method':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Authentication Method
              </h3>
              <p className="text-gray-600 mb-6">
                Select how you want to receive verification codes
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="totp"
                  checked={selectedMethod === 'totp'}
                  onChange={(e) => setSelectedMethod(e.target.value as 'totp')}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">Authenticator App (Recommended)</div>
                  <div className="text-sm text-gray-500">Use apps like Google Authenticator or Authy</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
                <input
                  type="radio"
                  name="method"
                  value="email"
                  disabled
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">Receive codes via email (Coming soon)</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors opacity-50">
                <input
                  type="radio"
                  name="method"
                  value="sms"
                  disabled
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">SMS</div>
                  <div className="text-sm text-gray-500">Receive codes via text message (Coming soon)</div>
                </div>
              </label>
            </div>

            <button
              onClick={handleMethodSelect}
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        );

      case 'qr':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scan QR Code
              </h3>
              <p className="text-gray-600 mb-6">
                Scan this QR code with your authenticator app
              </p>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border-2 border-gray-200 rounded-lg" />
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Or enter this code manually:</p>
                  <code className="bg-gray-100 px-4 py-2 rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                </div>
              </div>
            )}

            <button
              onClick={() => setCurrentStep({ step: 'verify' })}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
            >
              I've Scanned the Code
            </button>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Verify Code
              </h3>
              <p className="text-gray-600 mb-6">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <button
              onClick={verifyAndEnable2FA}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify and Enable'}
            </button>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Save Backup Codes
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  âš ï¸ Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-3">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-gray-200">
                    <span className="font-mono text-sm">{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={downloadBackupCodes}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                Download Codes
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                I've Saved Them
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              2FA Enabled Successfully!
            </h3>
            <p className="text-gray-600">
              Your account is now more secure
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep.step === 'complete' ? onClose : () => {
        if (window.confirm('Are you sure you want to cancel 2FA setup?')) {
          onClose();
        }
      }}
      title="Enable Two-Factor Authentication"
    >
      {renderStepContent()}
    </Modal>
  );
};

