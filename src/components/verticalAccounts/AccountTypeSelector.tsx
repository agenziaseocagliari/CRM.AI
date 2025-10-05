/**
 * GUARDIAN AI CRM - ACCOUNT TYPE SELECTOR
 * Componente per selezione Account Type durante registrazione
 * Data: 2025-10-05
 */

import React, { useState, useEffect } from 'react';
import { 
  AccountType, 
  getAvailableAccountTypes, 
  getAccountTypeConfig, 
  formatPrice,
  getAccountTypeIcon,
  generateAccountTypeCSS,
  getAccountTypeTerminology
} from '../../lib/verticalAccounts/types';

interface AccountTypeSelectorProps {
  selectedAccountType?: AccountType;
  onAccountTypeSelect: (accountType: AccountType) => void;
  disabled?: boolean;
  showPricing?: boolean;
  className?: string;
}

interface AccountTypeOption {
  value: AccountType;
  label: string;
  description: string;
  icon: string;
  price: string;
  features: string[];
}

export const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({
  selectedAccountType,
  onAccountTypeSelect,
  disabled = false,
  showPricing = true,
  className = ''
}) => {
  const [accountTypes, setAccountTypes] = useState<AccountTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccountTypes();
  }, []);

  const loadAccountTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get available account types from config
      const availableTypes = getAvailableAccountTypes();
      
      // Enhanced with features from config
      const enhancedTypes = availableTypes.map(type => ({
        ...type,
        features: getAccountTypeConfig(type.value).features
      }));
      
      setAccountTypes(enhancedTypes);
    } catch (err) {
      console.error('Error loading account types:', err);
      setError('Errore nel caricamento dei tipi di account');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountTypeSelect = (accountType: AccountType) => {
    if (disabled) return;
    onAccountTypeSelect(accountType);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">⚠️ {error}</div>
        <button 
          onClick={loadAccountTypes}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Scegli il tuo settore di attività
        </h3>
        <p className="text-gray-600">
          Seleziona il settore che meglio descrive la tua attività per ricevere un CRM ottimizzato con funzionalità specifiche.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountTypes.map((accountType) => {
          const isSelected = selectedAccountType === accountType.value;
          const colorScheme = getAccountTypeConfig(accountType.value).colorScheme;
          
          return (
            <div
              key={accountType.value}
              className={`
                relative cursor-pointer transition-all duration-200 transform hover:scale-105
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSelected 
                  ? 'ring-2 ring-offset-2 shadow-lg' 
                  : 'ring-1 ring-gray-200 hover:ring-gray-300'
                }
                bg-white rounded-xl p-6 hover:shadow-md
              `}
              style={isSelected ? {
                ...generateAccountTypeCSS(accountType.value)
              } : {}}
              onClick={() => handleAccountTypeSelect(accountType.value)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{accountType.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {accountType.label}
                    </h4>
                    {showPricing && (
                      <div className="text-sm font-medium" style={{ color: colorScheme.primary }}>
                        {accountType.price}/mese
                      </div>
                    )}
                  </div>
                </div>
                
                {isSelected && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: colorScheme.primary }}
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {accountType.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Funzionalità incluse:
                </div>
                <div className="flex flex-wrap gap-1">
                  {accountType.features.slice(0, 3).map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {accountType.features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      +{accountType.features.length - 3} altre
                    </span>
                  )}
                </div>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div 
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: colorScheme.primary }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Preview Selected Account Type */}
      {selectedAccountType && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">{getAccountTypeIcon(selectedAccountType)}</div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Configurazione: {getAccountTypeConfig(selectedAccountType).displayName}
              </h4>
              <p className="text-sm text-gray-600">
                Il tuo CRM sarà ottimizzato per questo settore
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Terminology Preview */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Terminologia personalizzata:</h5>
              <div className="space-y-2">
                {Object.entries(getAccountTypeTerminology(selectedAccountType)).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key}:</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Preview */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Funzionalità principali:</h5>
              <div className="space-y-1">
                {getAccountTypeConfig(selectedAccountType).features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getAccountTypeConfig(selectedAccountType).colorScheme.primary }}
                    />
                    <span className="text-gray-700 capitalize">
                      {feature.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================================
// ACCOUNT TYPE PREVIEW COMPONENT
// ===================================================================

interface AccountTypePreviewProps {
  accountType: AccountType;
  className?: string;
}

export const AccountTypePreview: React.FC<AccountTypePreviewProps> = ({
  accountType,
  className = ''
}) => {
  const config = getAccountTypeConfig(accountType);
  const terminology = getAccountTypeTerminology(accountType);

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="text-3xl">{config.icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900 text-xl">
            {config.displayName}
          </h3>
          <p className="text-gray-600">
            {config.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Prezzo:</h4>
          <div 
            className="text-2xl font-bold mb-2"
            style={{ color: config.colorScheme.primary }}
          >
            {formatPrice(config.basePriceCents)}
            <span className="text-sm font-normal text-gray-500">/mese</span>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Funzionalità:</h4>
          <div className="space-y-1">
            {config.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.colorScheme.primary }}
                />
                <span className="text-gray-700 capitalize">
                  {feature.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminology */}
        <div className="md:col-span-2">
          <h4 className="font-medium text-gray-900 mb-3">Terminologia personalizzata:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(terminology).map(([key, value]) => (
              <div key={key} className="text-sm">
                <div className="text-gray-500 capitalize">{key}:</div>
                <div className="font-medium text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// ACCOUNT TYPE BADGE COMPONENT
// ===================================================================

interface AccountTypeBadgeProps {
  accountType: AccountType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const AccountTypeBadge: React.FC<AccountTypeBadgeProps> = ({
  accountType,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const config = getAccountTypeConfig(accountType);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm', 
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span 
      className={`
        inline-flex items-center space-x-1 rounded-full font-medium text-white
        ${sizeClasses[size]} ${className}
      `}
      style={{ backgroundColor: config.colorScheme.primary }}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.displayName}</span>
    </span>
  );
};

export default AccountTypeSelector;