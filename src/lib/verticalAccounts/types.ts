/**
 * GUARDIAN AI CRM - VERTICAL ACCOUNT TYPES SYSTEM
 * Sistema per gestione Account Types specializzati per verticali
 * Data: 2025-10-05
 * Priority: Insurance Agency & Marketing Agency
 */

// ===================================================================
// TYPES & INTERFACES
// ===================================================================

export type AccountType = 
  | 'generic'
  | 'insurance_agency' 
  | 'marketing_agency'
  | 'fitness_center'
  | 'legal_practice'
  | 'real_estate_agency'
  | 'wellness_spa'
  | 'medical_practice'
  | 'restaurant'
  | 'seo_agency'
  | 'consulting_firm';

export interface PricingTier {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxContacts: number;
  maxDeals: number;
  features: string[];
  isPopular?: boolean;
  description: string;
  tier: 'starter' | 'professional' | 'business' | 'premium' | 'enterprise';
}

export interface VerticalAccountConfig {
  id: string;
  accountType: AccountType;
  displayName: string;
  description: string;
  colorScheme: ColorScheme;
  logoUrl?: string;
  themeConfig: ThemeConfig;
  enabledModules: string[];
  defaultDashboardLayout: DashboardLayout;
  emailTemplates: Record<string, any>;
  formTemplates: Record<string, any>;
  automationTemplates: Record<string, any>;
  terminologyMap: TerminologyMap;
  pricingTiers: PricingTier[];
  featuresIncluded: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent?: string;
  success?: string;
  warning?: string;
  error?: string;
}

export interface ThemeConfig {
  fontFamily?: string;
  borderRadius?: string;
  shadows?: boolean;
  animations?: boolean;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: Record<string, any>;
}

export interface TerminologyMap {
  contacts?: string;
  opportunities?: string;
  deals?: string;
  pipeline?: string;
  tasks?: string;
  meetings?: string;
  emails?: string;
  reports?: string;
  [key: string]: string | undefined;
}

export interface VerticalTemplate {
  id: string;
  accountType: AccountType;
  templateType: 'dashboard_widget' | 'email_template' | 'form_template' | 'automation_rule';
  templateName: string;
  templateCategory?: string;
  templateConfig: Record<string, any>;
  defaultSettings: Record<string, any>;
  description?: string;
  isSystemTemplate: boolean;
  isActive: boolean;
  version: number;
  parentTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerticalCustomField {
  id: string;
  accountType: AccountType;
  entityType: 'contact' | 'opportunity' | 'organization';
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'boolean';
  fieldConfig: Record<string, any>;
  isRequired: boolean;
  isSearchable: boolean;
  isReportable: boolean;
  defaultValue?: string;
  displayOrder: number;
  fieldGroup?: string;
  helpText?: string;
  isActive: boolean;
  createdAt: string;
}

export interface EnterpriseCustomization {
  id: string;
  organizationId: string;
  customizationType: 'template' | 'field' | 'module' | 'workflow';
  customizationName: string;
  baseTemplateId?: string;
  customizationConfig: Record<string, any>;
  isActive: boolean;
  approvedBy?: string;
  approvedAt?: string;
  description?: string;
  impactAssessment?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationVerticalConfig {
  accountType: AccountType;
  config: Record<string, any>;
  templates: VerticalTemplate[];
  customFields: VerticalCustomField[];
  enterpriseCustomizations?: EnterpriseCustomization[];
}

// ===================================================================
// ACCOUNT TYPE DEFINITIONS
// ===================================================================

export const ACCOUNT_TYPE_CONFIGS: Record<AccountType, {
  displayName: string;
  description: string;
  icon: string;
  colorScheme: ColorScheme;
  pricingTiers: PricingTier[];
  features: string[];
}> = {
  generic: {
    displayName: 'CRM Generico',
    description: 'CRM standard per tutti i settori',
    icon: '🏢',
    colorScheme: { primary: '#2563eb', secondary: '#64748b' },
    basePriceCents: 3900,
    features: ['contacts', 'opportunities', 'automations', 'reports']
  },
  
  insurance_agency: {
    displayName: 'Agenzia Assicurativa',
    description: 'CRM specializzato per agenzie assicurative',
    icon: '🛡️',
    colorScheme: { primary: '#1e40af', secondary: '#64748b', accent: '#dc2626' },
    basePriceCents: 14900,
    features: [
      'policy_management',
      'renewal_tracking', 
      'claims_management',
      'compliance_tools',
      'commission_tracking'
    ]
  },
  
  marketing_agency: {
    displayName: 'Agenzia Marketing',
    description: 'CRM ottimizzato per agenzie marketing e comunicazione',
    icon: '📈',
    colorScheme: { primary: '#7c3aed', secondary: '#64748b', accent: '#f59e0b' },
    basePriceCents: 11900,
    features: [
      'campaign_management',
      'client_reporting',
      'project_tracking', 
      'roi_analytics',
      'team_collaboration'
    ]
  },
  
  fitness_center: {
    displayName: 'Centro Fitness',
    description: 'CRM per palestre e centri fitness',
    icon: '🏋️',
    colorScheme: { primary: '#059669', secondary: '#64748b', accent: '#f97316' },
    basePriceCents: 8900,
    features: ['membership_management', 'class_scheduling', 'trainer_management']
  },
  
  legal_practice: {
    displayName: 'Studio Legale',
    description: 'CRM per studi legali e avvocati',
    icon: '⚖️',
    colorScheme: { primary: '#1f2937', secondary: '#64748b', accent: '#dc2626' },
    basePriceCents: 12900,
    features: ['case_management', 'time_tracking', 'document_management', 'compliance']
  },
  
  real_estate_agency: {
    displayName: 'Agenzia Immobiliare',
    description: 'CRM per agenti immobiliari',
    icon: '🏠',
    colorScheme: { primary: '#be123c', secondary: '#64748b', accent: '#16a34a' },
    basePriceCents: 9900,
    features: ['property_management', 'showing_management', 'market_intelligence']
  },
  
  wellness_spa: {
    displayName: 'Spa & Wellness',
    description: 'CRM per centri benessere e spa',
    icon: '💆',
    colorScheme: { primary: '#8b5cf6', secondary: '#64748b', accent: '#ec4899' },
    basePriceCents: 7900,
    features: ['appointment_booking', 'treatment_tracking', 'product_sales']
  },
  
  medical_practice: {
    displayName: 'Studio Medico',
    description: 'CRM per studi medici e cliniche',
    icon: '🏥',
    colorScheme: { primary: '#0ea5e9', secondary: '#64748b', accent: '#10b981' },
    basePriceCents: 15900,
    features: ['patient_management', 'appointment_scheduling', 'medical_records']
  },
  
  restaurant: {
    displayName: 'Ristorante',
    description: 'CRM per ristoranti e ristorazione',
    icon: '🍽️',
    colorScheme: { primary: '#ea580c', secondary: '#64748b', accent: '#fbbf24' },
    basePriceCents: 6900,
    features: ['reservation_management', 'customer_preferences', 'loyalty_programs']
  },
  
  seo_agency: {
    displayName: 'Agenzia SEO',
    description: 'CRM specializzato per agenzie SEO',
    icon: '🔍',
    colorScheme: { primary: '#16a34a', secondary: '#64748b', accent: '#2563eb' },
    basePriceCents: 11900,
    features: ['seo_tracking', 'keyword_monitoring', 'client_reporting', 'audit_management']
  },
  
  consulting_firm: {
    displayName: 'Società di Consulenza',
    description: 'CRM per società di consulenza',
    icon: '💼',
    colorScheme: { primary: '#374151', secondary: '#64748b', accent: '#7c3aed' },
    basePriceCents: 13900,
    features: ['project_management', 'time_tracking', 'expertise_management']
  }
};

// ===================================================================
// TERMINOLOGY MAPS PER VERTICAL
// ===================================================================

export const VERTICAL_TERMINOLOGY: Record<AccountType, TerminologyMap> = {
  generic: {
    contacts: 'Contatti',
    opportunities: 'Opportunità',
    deals: 'Trattative',
    pipeline: 'Pipeline',
    tasks: 'Attività',
    meetings: 'Riunioni',
    emails: 'Email',
    reports: 'Report'
  },
  
  insurance_agency: {
    contacts: 'Clienti',
    opportunities: 'Polizze',
    deals: 'Contratti',
    pipeline: 'Pipeline Vendite',
    tasks: 'Attività',
    meetings: 'Appuntamenti',
    emails: 'Comunicazioni',
    reports: 'Reports Agenzia'
  },
  
  marketing_agency: {
    contacts: 'Clienti',
    opportunities: 'Progetti',
    deals: 'Contratti',
    pipeline: 'Pipeline Progetti',
    tasks: 'Task Campagne',
    meetings: 'Brief Clienti',
    emails: 'Comunicazioni',
    reports: 'Reports Performance'
  },
  
  fitness_center: {
    contacts: 'Membri',
    opportunities: 'Abbonamenti',
    deals: 'Contratti Membership',
    pipeline: 'Pipeline Iscrizioni',
    tasks: 'Workout Sessions',
    meetings: 'PT Sessions',
    emails: 'Comunicazioni Membri',
    reports: 'Reports Palestra'
  },
  
  legal_practice: {
    contacts: 'Clienti',
    opportunities: 'Casi',
    deals: 'Incarichi',
    pipeline: 'Pipeline Casi',
    tasks: 'Attività Legali',
    meetings: 'Consultation',
    emails: 'Corrispondenza',
    reports: 'Reports Studio'
  },
  
  real_estate_agency: {
    contacts: 'Clienti',
    opportunities: 'Proprietà',
    deals: 'Trattative',
    pipeline: 'Pipeline Vendite',
    tasks: 'Attività Immobiliari',
    meetings: 'Viewing',
    emails: 'Comunicazioni',
    reports: 'Reports Agenzia'
  },
  
  wellness_spa: {
    contacts: 'Clienti',
    opportunities: 'Trattamenti',
    deals: 'Pacchetti',
    pipeline: 'Pipeline Benessere',
    tasks: 'Sessioni',
    meetings: 'Consulenze',
    emails: 'Comunicazioni',
    reports: 'Reports Spa'
  },
  
  medical_practice: {
    contacts: 'Pazienti',
    opportunities: 'Visite',
    deals: 'Piani Cura',
    pipeline: 'Pipeline Pazienti',
    tasks: 'Procedure',
    meetings: 'Visite',
    emails: 'Comunicazioni',
    reports: 'Reports Clinici'
  },
  
  restaurant: {
    contacts: 'Clienti',
    opportunities: 'Prenotazioni',
    deals: 'Eventi',
    pipeline: 'Pipeline Eventi',
    tasks: 'Preparazioni',
    meetings: 'Degustazioni',
    emails: 'Comunicazioni',
    reports: 'Reports Ristorante'
  },
  
  seo_agency: {
    contacts: 'Clienti',
    opportunities: 'Progetti SEO',
    deals: 'Contratti',
    pipeline: 'Audit Pipeline',
    tasks: 'SEO Tasks',
    meetings: 'Strategy Meetings',
    emails: 'Comunicazioni',
    reports: 'SEO Reports'
  },
  
  consulting_firm: {
    contacts: 'Clienti',
    opportunities: 'Progetti',
    deals: 'Contratti',
    pipeline: 'Pipeline Progetti',
    tasks: 'Deliverable',
    meetings: 'Workshop',
    emails: 'Comunicazioni',
    reports: 'Reports Consulenza'
  }
};

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Get account type configuration
 */
export function getAccountTypeConfig(accountType: AccountType) {
  return ACCOUNT_TYPE_CONFIGS[accountType];
}

/**
 * Get terminology for account type
 */
export function getAccountTypeTerminology(accountType: AccountType): TerminologyMap {
  return VERTICAL_TERMINOLOGY[accountType] || VERTICAL_TERMINOLOGY.generic;
}

/**
 * Format price from cents
 */
export function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(priceCents / 100);
}

/**
 * Get account type icon
 */
export function getAccountTypeIcon(accountType: AccountType): string {
  return ACCOUNT_TYPE_CONFIGS[accountType]?.icon || '🏢';
}

/**
 * Check if account type has feature
 */
export function hasFeature(accountType: AccountType, feature: string): boolean {
  return ACCOUNT_TYPE_CONFIGS[accountType]?.features.includes(feature) || false;
}

/**
 * Get all available account types for selection
 */
export function getAvailableAccountTypes(): Array<{
  value: AccountType;
  label: string;
  description: string;
  icon: string;
  price: string;
}> {
  return Object.entries(ACCOUNT_TYPE_CONFIGS)
    .filter(([key]) => key !== 'generic') // Hide generic from selection
    .map(([key, config]) => ({
      value: key as AccountType,
      label: config.displayName,
      description: config.description,
      icon: config.icon,
      price: formatPrice(config.basePriceCents)
    }));
}

/**
 * Generate account type color CSS variables
 */
export function generateAccountTypeCSS(accountType: AccountType): Record<string, string> {
  const colorScheme = ACCOUNT_TYPE_CONFIGS[accountType]?.colorScheme;
  if (!colorScheme) return {};
  
  return {
    '--color-primary': colorScheme.primary,
    '--color-secondary': colorScheme.secondary,
    '--color-accent': colorScheme.accent || colorScheme.primary,
    '--color-success': colorScheme.success || '#10b981',
    '--color-warning': colorScheme.warning || '#f59e0b', 
    '--color-error': colorScheme.error || '#ef4444'
  };
}

// ===================================================================
// CONSTANTS
// ===================================================================

export const DEFAULT_MODULES = [
  'contacts',
  'opportunities', 
  'tasks',
  'calendar',
  'emails',
  'reports'
];

export const PREMIUM_MODULES = [
  'automations',
  'advanced_reports',
  'api_access',
  'integrations',
  'white_label'
];

export const ENTERPRISE_MODULES = [
  'custom_fields',
  'workflows',
  'multi_user',
  'role_management',
  'audit_logs',
  'data_export'
];

// Template categories
export const TEMPLATE_CATEGORIES = {
  dashboard: ['overview', 'analytics', 'performance'],
  email: ['onboarding', 'follow_up', 'renewal', 'notification'],
  form: ['lead_generation', 'contact_update', 'feedback'],
  automation: ['nurturing', 'renewal', 'follow_up', 'scoring']
} as const;