/**
 * GUARDIAN AI CRM - VERTICAL ACCOUNT TYPES SYSTEM (UPDATED)
 * Sistema per gestione Account Types specializzati per verticali con pricing 5-tier
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
  emailTemplates: Record<string, unknown>;
  formTemplates: Record<string, unknown>;
  automationTemplates: Record<string, unknown>;
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
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily?: string;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  showSidebar: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, unknown>;
}

export interface TerminologyMap {
  [key: string]: string;
}

export interface VerticalTemplate {
  id: string;
  accountType: AccountType;
  templateName: string;
  templateType: 'dashboard' | 'form' | 'email' | 'automation' | 'report';
  templateData: Record<string, unknown>;
  isDefault: boolean;
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
  fieldConfig: Record<string, unknown>;
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
  customizationConfig: Record<string, unknown>;
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
  config: Record<string, unknown>;
  templates: VerticalTemplate[];
  customFields: VerticalCustomField[];
  enterpriseCustomizations?: EnterpriseCustomization[];
}

// ===================================================================
// STANDARD 5-TIER PRICING TEMPLATES
// ===================================================================

const createGenericPricingTiers = (basePrice: number, verticalName: string): PricingTier[] => [
  {
    name: `Starter ${verticalName}`,
    priceMonthly: Math.round(basePrice * 0.6),
    priceYearly: Math.round(basePrice * 0.6 * 10),
    maxUsers: 2,
    maxContacts: 500,
    maxDeals: 100,
    tier: 'starter',
    description: 'Perfetto per iniziare',
    features: ['Base features', 'Email support', 'Basic reporting']
  },
  {
    name: `Professional ${verticalName}`,
    priceMonthly: basePrice,
    priceYearly: Math.round(basePrice * 10),
    maxUsers: 5,
    maxContacts: 2000,
    maxDeals: 500,
    tier: 'professional',
    isPopular: true,
    description: 'Ideale per crescita',
    features: ['Advanced features', 'Priority support', 'Advanced reporting', 'Automations']
  },
  {
    name: `Business ${verticalName}`,
    priceMonthly: Math.round(basePrice * 1.8),
    priceYearly: Math.round(basePrice * 1.8 * 10),
    maxUsers: 15,
    maxContacts: 10000,
    maxDeals: 2000,
    tier: 'business',
    description: 'Per team strutturati',
    features: ['All Professional', 'Multi-location', 'Custom fields', 'API access']
  },
  {
    name: `Premium ${verticalName}`,
    priceMonthly: Math.round(basePrice * 3),
    priceYearly: Math.round(basePrice * 3 * 10),
    maxUsers: 50,
    maxContacts: 50000,
    maxDeals: 10000,
    tier: 'premium',
    description: 'Per organizzazioni enterprise',
    features: ['All Business', 'White label', 'Advanced integrations', 'Account manager']
  },
  {
    name: `Enterprise ${verticalName}`,
    priceMonthly: Math.round(basePrice * 5),
    priceYearly: Math.round(basePrice * 5 * 10),
    maxUsers: -1,
    maxContacts: -1,
    maxDeals: -1,
    tier: 'enterprise',
    description: 'Soluzione su misura',
    features: ['Unlimited everything', 'Custom development', 'Dedicated support', 'SLA guarantees']
  }
];

// ===================================================================
// ACCOUNT TYPE DEFINITIONS WITH 5-TIER PRICING
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
    pricingTiers: createGenericPricingTiers(39, 'CRM'),
    features: ['contacts', 'opportunities', 'automations', 'reports']
  },
  
  insurance_agency: {
    displayName: 'Agenzia Assicurazioni',
    description: 'CRM specializzato per agenti assicurativi',
    icon: '🛡️',
    colorScheme: { primary: '#2563eb', secondary: '#64748b', accent: '#dc2626' },
    pricingTiers: [
      {
        name: 'Starter Assicurazioni',
        priceMonthly: 89,
        priceYearly: 890,
        maxUsers: 2,
        maxContacts: 500,
        maxDeals: 100,
        tier: 'starter',
        description: 'Perfetto per agenti singoli',
        features: ['Gestione polizze base', 'Rinnovi automatici', 'Email marketing', 'Report basic']
      },
      {
        name: 'Professional Assicurazioni',
        priceMonthly: 149,
        priceYearly: 1490,
        maxUsers: 5,
        maxContacts: 2000,
        maxDeals: 500,
        tier: 'professional',
        isPopular: true,
        description: 'Ideale per agenzie in crescita',
        features: ['Gestione sinistri avanzata', 'WhatsApp Business', 'Dashboard avanzate', 'Automazioni', 'API base']
      },
      {
        name: 'Business Assicurazioni',
        priceMonthly: 249,
        priceYearly: 2490,
        maxUsers: 15,
        maxContacts: 10000,
        maxDeals: 2000,
        tier: 'business',
        description: 'Per agenzie consolidate',
        features: ['Multi-sede', 'Compliance IVASS', 'Integrazione compagnie', 'Report personalizzati', 'Priority support']
      },
      {
        name: 'Premium Assicurazioni',
        priceMonthly: 399,
        priceYearly: 3990,
        maxUsers: 50,
        maxContacts: 50000,
        maxDeals: 10000,
        tier: 'premium',
        description: 'Per grandi reti di agenti',
        features: ['White label', 'API complete', 'Customizzazioni', 'Analytics avanzate', 'Account manager']
      },
      {
        name: 'Enterprise Assicurazioni',
        priceMonthly: 799,
        priceYearly: 7990,
        maxUsers: -1,
        maxContacts: -1,
        maxDeals: -1,
        tier: 'enterprise',
        description: 'Soluzione completa per enterprise',
        features: ['Illimitato', 'On-premise option', 'Custom development', 'SLA garantito', '24/7 support', 'Training dedicato']
      }
    ],
    features: ['policy_management', 'renewal_tracking', 'claims_management', 'compliance_tools']
  },
  
  marketing_agency: {
    displayName: 'Agenzia Marketing',
    description: 'CRM per agenzie marketing e digital',
    icon: '🎯',
    colorScheme: { primary: '#7c3aed', secondary: '#64748b', accent: '#f59e0b' },
    pricingTiers: [
      {
        name: 'Freelancer Marketing',
        priceMonthly: 69,
        priceYearly: 690,
        maxUsers: 1,
        maxContacts: 250,
        maxDeals: 50,
        tier: 'starter',
        description: 'Per marketer indipendenti',
        features: ['5 campagne attive', 'Lead generation base', 'Template base', 'Report clienti']
      },
      {
        name: 'Agency Marketing',
        priceMonthly: 119,
        priceYearly: 1190,
        maxUsers: 5,
        maxContacts: 1000,
        maxDeals: 200,
        tier: 'professional',
        isPopular: true,
        description: 'Per piccole agenzie creative',
        features: ['Campagne illimitate', 'Team collaboration', 'White-label reports', 'Analytics avanzate', 'API integrations']
      },
      {
        name: 'Studio Marketing',
        priceMonthly: 199,
        priceYearly: 1990,
        maxUsers: 15,
        maxContacts: 5000,
        maxDeals: 1000,
        tier: 'business',
        description: 'Per studi strutturati',
        features: ['Multi-clienti', 'Campaign automation', 'ROI tracking', 'Custom dashboards', 'Priority support']
      },
      {
        name: 'Network Marketing',
        priceMonthly: 329,
        priceYearly: 3290,
        maxUsers: 50,
        maxContacts: 25000,
        maxDeals: 5000,
        tier: 'premium',
        description: 'Per network di agenzie',
        features: ['White label completo', 'API complete', 'Customizzazioni', 'Multi-brand', 'Account manager']
      },
      {
        name: 'Enterprise Marketing',
        priceMonthly: 599,
        priceYearly: 5990,
        maxUsers: -1,
        maxContacts: -1,
        maxDeals: -1,
        tier: 'enterprise',
        description: 'Soluzione enterprise completa',
        features: ['Illimitato', 'Custom development', 'Dedicated infrastructure', 'SLA garantito', '24/7 support', 'Training team']
      }
    ],
    features: ['campaign_management', 'client_reporting', 'lead_generation', 'creative_assets']
  },
  
  fitness_center: {
    displayName: 'Centro Fitness',
    description: 'CRM per palestre e centri fitness',
    icon: '🏋️',
    colorScheme: { primary: '#059669', secondary: '#64748b', accent: '#f97316' },
    pricingTiers: createGenericPricingTiers(89, 'Fitness'),
    features: ['membership_management', 'class_scheduling', 'trainer_management']
  },
  
  legal_practice: {
    displayName: 'Studio Legale',
    description: 'CRM per studi legali e avvocati',
    icon: '⚖️',
    colorScheme: { primary: '#1f2937', secondary: '#64748b', accent: '#dc2626' },
    pricingTiers: createGenericPricingTiers(129, 'Legale'),
    features: ['case_management', 'time_tracking', 'document_management', 'compliance']
  },
  
  real_estate_agency: {
    displayName: 'Agenzia Immobiliare',
    description: 'CRM per agenti immobiliari',
    icon: '🏠',
    colorScheme: { primary: '#be123c', secondary: '#64748b', accent: '#16a34a' },
    pricingTiers: createGenericPricingTiers(99, 'Immobiliare'),
    features: ['property_management', 'showing_management', 'market_intelligence']
  },
  
  wellness_spa: {
    displayName: 'Spa & Wellness',
    description: 'CRM per centri benessere e spa',
    icon: '💆',
    colorScheme: { primary: '#8b5cf6', secondary: '#64748b', accent: '#ec4899' },
    pricingTiers: createGenericPricingTiers(79, 'Wellness'),
    features: ['appointment_booking', 'treatment_tracking', 'product_sales']
  },
  
  medical_practice: {
    displayName: 'Studio Medico',
    description: 'CRM per studi medici e cliniche',
    icon: '🏥',
    colorScheme: { primary: '#0ea5e9', secondary: '#64748b', accent: '#10b981' },
    pricingTiers: createGenericPricingTiers(159, 'Medico'),
    features: ['patient_management', 'appointment_scheduling', 'medical_records']
  },
  
  restaurant: {
    displayName: 'Ristorante',
    description: 'CRM per ristoranti e ristorazione',
    icon: '🍽️',
    colorScheme: { primary: '#ea580c', secondary: '#64748b', accent: '#fbbf24' },
    pricingTiers: createGenericPricingTiers(69, 'Ristorante'),
    features: ['reservation_management', 'menu_optimization', 'customer_loyalty']
  },
  
  seo_agency: {
    displayName: 'Agenzia SEO',
    description: 'CRM per agenzie SEO e web marketing',
    icon: '🔍',
    colorScheme: { primary: '#16a34a', secondary: '#64748b', accent: '#2563eb' },
    pricingTiers: createGenericPricingTiers(119, 'SEO'),
    features: ['keyword_tracking', 'ranking_reports', 'client_portals', 'competitor_analysis']
  },
  
  consulting_firm: {
    displayName: 'Società di Consulenza',
    description: 'CRM per consulenti e società di consulenza',
    icon: '💼',
    colorScheme: { primary: '#374151', secondary: '#64748b', accent: '#06b6d4' },
    pricingTiers: createGenericPricingTiers(139, 'Consulenza'),
    features: ['project_management', 'time_billing', 'proposal_generation', 'expertise_tracking']
  }
};

// ===================================================================
// TERMINOLOGY OVERRIDES PER VERTICAL
// ===================================================================

export const TERMINOLOGY_OVERRIDES: Record<AccountType, TerminologyMap> = {
  generic: {},
  
  insurance_agency: {
    'contact': 'cliente',
    'opportunity': 'polizza',
    'deal': 'contratto',
    'lead': 'prospect',
    'campaign': 'campagna commerciale',
    'pipeline': 'portafoglio polizze',
    'revenue': 'commissioni',
    'forecast': 'previsioni rinnovi'
  },
  
  marketing_agency: {
    'contact': 'cliente',
    'opportunity': 'progetto',
    'deal': 'contratto',
    'lead': 'lead',
    'campaign': 'campagna',
    'pipeline': 'progetti attivi',
    'revenue': 'fatturato',
    'forecast': 'pipeline revenue'
  },
  
  fitness_center: {
    'contact': 'membro',
    'opportunity': 'abbonamento',
    'deal': 'iscrizione',
    'lead': 'prospect',
    'campaign': 'promozione',
    'pipeline': 'nuove iscrizioni',
    'revenue': 'incassi',
    'forecast': 'rinnovi abbonamenti'
  },
  
  legal_practice: {
    'contact': 'cliente',
    'opportunity': 'caso',
    'deal': 'incarico',
    'lead': 'consultazione',
    'campaign': 'iniziativa marketing',
    'pipeline': 'casi attivi',
    'revenue': 'parcelle',
    'forecast': 'fatturato stimato'
  },
  
  real_estate_agency: {
    'contact': 'cliente',
    'opportunity': 'immobile',
    'deal': 'compravendita',
    'lead': 'interessato',
    'campaign': 'campagna immobiliare',
    'pipeline': 'trattative',
    'revenue': 'commissioni',
    'forecast': 'chiusure previste'
  },
  
  wellness_spa: {
    'contact': 'cliente',
    'opportunity': 'trattamento',
    'deal': 'pacchetto',
    'lead': 'prospect',
    'campaign': 'promozione benessere',
    'pipeline': 'prenotazioni',
    'revenue': 'incassi',
    'forecast': 'prenotazioni future'
  },
  
  medical_practice: {
    'contact': 'paziente',
    'opportunity': 'trattamento',
    'deal': 'piano cura',
    'lead': 'nuovo paziente',
    'campaign': 'campagna prevenzione',
    'pipeline': 'visite programmate',
    'revenue': 'parcelle',
    'forecast': 'fatturato mensile'
  },
  
  restaurant: {
    'contact': 'cliente',
    'opportunity': 'prenotazione',
    'deal': 'evento',
    'lead': 'prospect',
    'campaign': 'promozione menu',
    'pipeline': 'prenotazioni',
    'revenue': 'incassi',
    'forecast': 'prenotazioni future'
  },
  
  seo_agency: {
    'contact': 'cliente',
    'opportunity': 'progetto SEO',
    'deal': 'contratto',
    'lead': 'prospect',
    'campaign': 'campagna SEO',
    'pipeline': 'progetti attivi',
    'revenue': 'fatturato',
    'forecast': 'pipeline revenue'
  },
  
  consulting_firm: {
    'contact': 'cliente',
    'opportunity': 'progetto',
    'deal': 'incarico',
    'lead': 'prospect',
    'campaign': 'business development',
    'pipeline': 'progetti attivi',
    'revenue': 'fatturato',
    'forecast': 'pipeline revenue'
  }
};

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

export function getAccountTypeConfig(accountType: AccountType) {
  return ACCOUNT_TYPE_CONFIGS[accountType];
}

export function getAccountTypeIcon(accountType: AccountType): string {
  return ACCOUNT_TYPE_CONFIGS[accountType]?.icon || '🏢';
}

export function getTerminologyOverride(accountType: AccountType, term: string): string {
  return TERMINOLOGY_OVERRIDES[accountType]?.[term] || term;
}

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

export function getAllAccountTypes(): AccountType[] {
  return Object.keys(ACCOUNT_TYPE_CONFIGS) as AccountType[];
}

export function getAccountTypesByCategory(_category?: string): AccountType[] {
  // Future enhancement: categorize account types
  return getAllAccountTypes();
}

export function getPricingTierByLevel(accountType: AccountType, tier: PricingTier['tier']): PricingTier | null {
  const config = getAccountTypeConfig(accountType);
  return config?.pricingTiers.find(t => t.tier === tier) || null;
}

export function getPopularPricingTier(accountType: AccountType): PricingTier | null {
  const config = getAccountTypeConfig(accountType);
  return config?.pricingTiers.find(t => t.isPopular) || null;
}

// ===================================================================
// ACCOUNT TYPE SELECTION HELPERS
// ===================================================================

export interface AccountTypeOption {
  value: AccountType;
  label: string;
  description: string;
  icon: string;
  color: string;
  price: string;
  features: string[];
  isRecommended?: boolean;
}

export function getAccountTypeSelectionOptions(): AccountTypeOption[] {
  return Object.entries(ACCOUNT_TYPE_CONFIGS).map(([type, config]) => {
    const popularTier = getPopularPricingTier(type as AccountType);
    
    return {
      value: type as AccountType,
      label: config.displayName,
      description: config.description,
      icon: config.icon,
      color: config.colorScheme.primary,
      price: popularTier ? `€${popularTier.priceMonthly}/mese` : 'Personalizzato',
      features: config.features,
      isRecommended: type === 'insurance_agency' || type === 'marketing_agency'
    };
  });
}

export const VERTICAL_ACCOUNT_CONSTANTS = {
  MAX_ENTERPRISE_USERS: -1,
  MAX_ENTERPRISE_CONTACTS: -1,
  MAX_ENTERPRISE_DEALS: -1,
  DEFAULT_TRIAL_DAYS: 30,
  POPULAR_TIER: 'professional' as const,
  MINIMUM_TIER: 'starter' as const,
  MAXIMUM_TIER: 'enterprise' as const
} as const;

export default ACCOUNT_TYPE_CONFIGS;