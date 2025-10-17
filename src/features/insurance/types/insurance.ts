/**
 * Insurance Policy Type Definitions
 * Complete TypeScript interfaces for insurance policies management
 * Following Italian localization patterns
 */

// ================================================
// Core Types and Enums
// ================================================

export type PolicyType = 'Auto' | 'Casa' | 'Vita' | 'Infortuni' | 'Salute';
export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'renewed';
export type PremiumFrequency = 'monthly' | 'quarterly' | 'annual';

// ================================================
// Main Insurance Policy Interface
// ================================================

export interface InsurancePolicy {
  id: string;
  organization_id: string;
  contact_id: string;
  
  // Policy Information
  policy_number: string;
  policy_type: PolicyType;
  status: PolicyStatus;
  insurance_company: string;
  
  // Financial Information
  premium_amount: number;
  premium_frequency: PremiumFrequency;
  coverage_amount?: number;
  deductible?: number;
  
  // Dates
  start_date: string;
  end_date: string;
  
  // Additional Info
  notes?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ================================================
// Extended Interfaces
// ================================================

export interface InsurancePolicyWithContact extends InsurancePolicy {
  contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
}

export interface PolicyFormData {
  contact_id: string;
  policy_number: string;
  policy_type: PolicyType;
  status: PolicyStatus;
  insurance_company: string;
  premium_amount: number;
  premium_frequency: PremiumFrequency;
  start_date: string;
  end_date: string;
  coverage_amount?: number;
  deductible?: number;
  notes?: string;
}

export interface PolicyFilters {
  search: string;
  policy_type: PolicyType | '';
  status: PolicyStatus | '';
  expiry_filter: 'all' | '30_days' | '60_days' | '90_days';
  insurance_company: string;
}

export interface PolicyTableColumn {
  key: keyof InsurancePolicyWithContact | 'actions';
  label: string;
  sortable: boolean;
}

// ================================================
// Constants and Arrays
// ================================================

export const POLICY_TYPES: PolicyType[] = [
  'Auto',
  'Casa', 
  'Vita',
  'Infortuni',
  'Salute'
];

export const POLICY_STATUSES: PolicyStatus[] = [
  'active',
  'expired',
  'cancelled',
  'renewed'
];

export const PREMIUM_FREQUENCIES: PremiumFrequency[] = [
  'monthly',
  'quarterly',
  'annual'
];

// ================================================
// Italian Labels and Translations
// ================================================

export const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  Auto: 'Assicurazione Auto',
  Casa: 'Assicurazione Casa',
  Vita: 'Assicurazione Vita',
  Infortuni: 'Assicurazione Infortuni',
  Salute: 'Assicurazione Salute',
};

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
  active: 'Attiva',
  expired: 'Scaduta',
  cancelled: 'Cancellata',
  renewed: 'Rinnovata',
};

export const PREMIUM_FREQUENCY_LABELS: Record<PremiumFrequency, string> = {
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  annual: 'Annuale',
};

export const POLICY_STATUS_COLORS: Record<PolicyStatus, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  renewed: 'bg-blue-100 text-blue-800',
};

// ================================================
// Table Column Definitions
// ================================================

export const POLICY_TABLE_COLUMNS: PolicyTableColumn[] = [
  { key: 'policy_number', label: 'Numero Polizza', sortable: true },
  { key: 'policy_type', label: 'Tipo', sortable: true },
  { key: 'status', label: 'Stato', sortable: true },
  { key: 'insurance_company', label: 'Compagnia', sortable: true },
  { key: 'premium_amount', label: 'Premio', sortable: true },
  { key: 'end_date', label: 'Scadenza', sortable: true },
  { key: 'actions', label: 'Azioni', sortable: false },
];

// ================================================
// Utility Functions
// ================================================

/**
 * Generate a policy number with format: POL-YYYY-NNNNNN
 */
export const generatePolicyNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `POL-${year}-${random}`;
};

/**
 * Calculate days until policy expiry
 */
export const getDaysUntilExpiry = (endDate: string): number => {
  const today = new Date();
  const expiry = new Date(endDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if policy is expiring soon (within 30 days)
 */
export const isPolicyExpiringSoon = (endDate: string): boolean => {
  return getDaysUntilExpiry(endDate) <= 30 && getDaysUntilExpiry(endDate) > 0;
};

/**
 * Check if policy is expired
 */
export const isPolicyExpired = (endDate: string): boolean => {
  return getDaysUntilExpiry(endDate) < 0;
};

/**
 * Format currency amount for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('it-IT');
};

/**
 * Validate policy form data
 */
export const validatePolicyForm = (data: Partial<PolicyFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.contact_id) {
    errors.contact_id = 'Cliente è obbligatorio';
  }

  if (!data.policy_number?.trim()) {
    errors.policy_number = 'Numero polizza è obbligatorio';
  }

  if (!data.policy_type) {
    errors.policy_type = 'Tipo polizza è obbligatorio';
  }

  if (!data.insurance_company?.trim()) {
    errors.insurance_company = 'Compagnia assicurativa è obbligatoria';
  }

  if (!data.premium_amount || data.premium_amount <= 0) {
    errors.premium_amount = 'Premio deve essere maggiore di zero';
  }

  if (!data.start_date) {
    errors.start_date = 'Data inizio è obbligatoria';
  }

  if (!data.end_date) {
    errors.end_date = 'Data fine è obbligatoria';
  }

  if (data.start_date && data.end_date && new Date(data.end_date) <= new Date(data.start_date)) {
    errors.end_date = 'Data fine deve essere successiva alla data inizio';
  }

  if (data.coverage_amount && data.coverage_amount <= 0) {
    errors.coverage_amount = 'Copertura deve essere maggiore di zero';
  }

  if (data.deductible && data.deductible < 0) {
    errors.deductible = 'Franchigia non può essere negativa';
  }

  return errors;
};

// ================================================
// Default Values
// ================================================

export const DEFAULT_POLICY_FORM: PolicyFormData = {
  contact_id: '',
  policy_number: '',
  policy_type: 'Auto',
  status: 'active',
  insurance_company: '',
  premium_amount: 0,
  premium_frequency: 'annual',
  start_date: '',
  end_date: '',
  coverage_amount: undefined,
  deductible: undefined,
  notes: '',
};

export const DEFAULT_POLICY_FILTERS: PolicyFilters = {
  search: '',
  policy_type: '',
  status: '',
  expiry_filter: 'all',
  insurance_company: '',
};