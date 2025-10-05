/**
 * GUARDIAN AI CRM - ANALISI COSTI E MODULI PER VERTICALI
 * Analisi dettagliata costi infrastruttura e API per ogni settore
 * Data: 2025-10-05
 */

// ===================================================================
// MODULI RICHIESTI PER VERTICALE ASSICURAZIONI
// ===================================================================

export const INSURANCE_MODULES = {
  // MODULI CORE (obbligatori)
  core: [
    'contacts_management',
    'policies_management', 
    'renewals_tracking',
    'claims_management',
    'commission_tracking',
    'document_storage',
    'basic_reporting'
  ],
  
  // MODULI COMUNICAZIONE
  communication: [
    'email_marketing',
    'whatsapp_business',
    'sms_notifications',
    'automated_reminders',
    'client_portal'
  ],
  
  // MODULI AVANZATI
  advanced: [
    'ivass_compliance',
    'multi_carrier_integration',
    'advanced_analytics',
    'custom_reports',
    'api_integrations'
  ],
  
  // MODULI ENTERPRISE
  enterprise: [
    'white_label',
    'multi_agency',
    'custom_fields',
    'workflow_automation',
    'dedicated_support'
  ]
};

// ===================================================================
// MODULI RICHIESTI PER VERTICALE MARKETING
// ===================================================================

export const MARKETING_MODULES = {
  // MODULI CORE
  core: [
    'contacts_management',
    'campaign_management',
    'lead_generation',
    'project_tracking',
    'basic_reporting',
    'client_management'
  ],
  
  // MODULI COMUNICAZIONE  
  communication: [
    'email_marketing',
    'social_media_integration',
    'landing_pages',
    'automated_sequences',
    'client_reporting'
  ],
  
  // MODULI AVANZATI
  advanced: [
    'roi_tracking',
    'multi_channel_campaigns',
    'advanced_analytics',
    'conversion_tracking',
    'a_b_testing'
  ],
  
  // MODULI ENTERPRISE
  enterprise: [
    'white_label',
    'multi_client',
    'custom_dashboards',
    'api_integrations',
    'team_collaboration'
  ]
};

// ===================================================================
// COSTI API ESTERNE MENSILI (in EUR)
// ===================================================================

export const API_COSTS = {
  // EMAIL SERVICES
  email: {
    provider: 'SendGrid/Mailgun',
    cost_per_1000: 0.80, // €0.80 per 1000 email
    monthly_base: 15, // costo base mensile
    included_emails: 10000
  },
  
  // WHATSAPP BUSINESS
  whatsapp: {
    provider: 'Meta Business API',
    cost_per_message: 0.05, // €0.05 per messaggio
    monthly_base: 25, // costo setup e mantenimento
    included_messages: 100
  },
  
  // SMS NOTIFICATIONS
  sms: {
    provider: 'Twilio',
    cost_per_sms: 0.08, // €0.08 per SMS
    monthly_base: 10,
    included_sms: 50
  },
  
  // DOCUMENT STORAGE
  storage: {
    provider: 'AWS S3',
    cost_per_gb: 0.023, // €0.023 per GB
    cost_per_1000_requests: 0.0004,
    monthly_base: 5
  },
  
  // AI FEATURES
  ai_services: {
    provider: 'OpenAI',
    cost_per_1000_tokens: 0.002, // €0.002 per 1000 token
    monthly_base: 20, // per features AI base
    average_tokens_per_action: 500
  },
  
  // INTEGRAZIONE API ESTERNE
  integrations: {
    insurance_carriers: 15, // €15/mese per integrazioni assicurative
    social_media_apis: 25, // €25/mese per API social
    analytics_tools: 30, // €30/mese per analytics avanzate
    payment_processing: 0.029 // 2.9% + €0.30 per transazione
  },
  
  // INFRASTRUTTURA
  infrastructure: {
    database_hosting: 50, // €50/mese per database enterprise
    cdn_bandwidth: 0.08, // €0.08 per GB trasferito
    backup_storage: 15, // €15/mese per backup automatici
    monitoring: 20 // €20/mese per monitoring
  }
};

// ===================================================================
// CALCOLO COSTI PER TIER ASSICURAZIONI
// ===================================================================

export const INSURANCE_COST_ANALYSIS = {
  starter: {
    clients_limit: 500,
    policies_limit: 100,
    estimated_monthly_usage: {
      emails: 2000, // 4 email per cliente al mese
      whatsapp: 200, // comunicazioni urgenti
      sms: 50, // reminder critici
      storage_gb: 2, // documenti base
      ai_tokens: 10000, // automazioni base
      api_calls: 1000
    },
    monthly_costs: {
      email: 0.80 * 2 + 15, // €16.60
      whatsapp: 0.05 * 200 + 25, // €35.00
      sms: 0.08 * 50 + 10, // €14.00
      storage: 0.023 * 2 + 5, // €5.05
      ai: 0.002 * 10 + 20, // €20.02
      infrastructure: 15, // quota base
      integrations: 15 // API assicurative
    },
    total_cost: 120.67, // costo totale mensile
    markup: 1.8, // 80% markup
    suggested_price: 39 // prezzo competitivo lancio
  },
  
  professional: {
    clients_limit: 2000,
    policies_limit: 500,
    estimated_monthly_usage: {
      emails: 8000,
      whatsapp: 800,
      sms: 200,
      storage_gb: 8,
      ai_tokens: 40000,
      api_calls: 5000
    },
    monthly_costs: {
      email: 0.80 * 8 + 15, // €21.40
      whatsapp: 0.05 * 800 + 25, // €65.00
      sms: 0.08 * 200 + 10, // €26.00
      storage: 0.023 * 8 + 5, // €5.18
      ai: 0.002 * 40 + 20, // €20.08
      infrastructure: 25,
      integrations: 40 // più integrazioni
    },
    total_cost: 202.66,
    markup: 1.5, // 50% markup
    suggested_price: 79 // prezzo lancio competitivo
  },
  
  business: {
    clients_limit: 10000,
    policies_limit: 2000,
    estimated_monthly_usage: {
      emails: 30000,
      whatsapp: 3000,
      sms: 800,
      storage_gb: 25,
      ai_tokens: 100000,
      api_calls: 15000
    },
    monthly_costs: {
      email: 0.80 * 30 + 15, // €39.00
      whatsapp: 0.05 * 3000 + 25, // €175.00
      sms: 0.08 * 800 + 10, // €74.00
      storage: 0.023 * 25 + 5, // €5.58
      ai: 0.002 * 100 + 20, // €20.20
      infrastructure: 50,
      integrations: 70
    },
    total_cost: 433.78,
    markup: 1.3, // 30% markup
    suggested_price: 149 // prezzo lancio
  },
  
  premium: {
    clients_limit: 50000,
    policies_limit: 10000,
    estimated_monthly_usage: {
      emails: 100000,
      whatsapp: 10000,
      sms: 3000,
      storage_gb: 100,
      ai_tokens: 300000,
      api_calls: 50000
    },
    monthly_costs: {
      email: 0.80 * 100 + 15, // €95.00
      whatsapp: 0.05 * 10000 + 25, // €525.00
      sms: 0.08 * 3000 + 10, // €250.00
      storage: 0.023 * 100 + 5, // €7.30
      ai: 0.002 * 300 + 20, // €20.60
      infrastructure: 100,
      integrations: 150
    },
    total_cost: 1152.90,
    markup: 1.2, // 20% markup
    suggested_price: 299 // prezzo lancio
  },
  
  enterprise: {
    clients_limit: -1, // illimitato
    policies_limit: -1,
    estimated_monthly_usage: {
      emails: 500000,
      whatsapp: 50000,
      sms: 15000,
      storage_gb: 500,
      ai_tokens: 1000000,
      api_calls: 200000
    },
    monthly_costs: {
      email: 0.80 * 500 + 15, // €415.00
      whatsapp: 0.05 * 50000 + 25, // €2525.00
      sms: 0.08 * 15000 + 10, // €1210.00
      storage: 0.023 * 500 + 5, // €16.50
      ai: 0.002 * 1000 + 20, // €22.00
      infrastructure: 300,
      integrations: 500
    },
    total_cost: 4993.50,
    markup: 1.15, // 15% markup
    suggested_price: 799 // prezzo enterprise
  }
};

// ===================================================================
// CALCOLO COSTI PER TIER MARKETING
// ===================================================================

export const MARKETING_COST_ANALYSIS = {
  freelancer: {
    clients_limit: 100,
    projects_limit: 25,
    campaigns_limit: 5,
    estimated_monthly_usage: {
      emails: 5000,
      social_api_calls: 1000,
      landing_pages: 5,
      storage_gb: 1,
      ai_tokens: 15000,
      analytics_requests: 2000
    },
    monthly_costs: {
      email: 0.80 * 5 + 15, // €19.00
      social_apis: 25, // costo base
      storage: 0.023 * 1 + 5, // €5.02
      ai: 0.002 * 15 + 20, // €20.03
      infrastructure: 10,
      integrations: 25
    },
    total_cost: 104.05,
    markup: 1.5,
    suggested_price: 29 // prezzo lancio molto competitivo
  },
  
  agency: {
    clients_limit: 500,
    projects_limit: 100,
    campaigns_limit: 20,
    estimated_monthly_usage: {
      emails: 15000,
      social_api_calls: 5000,
      landing_pages: 20,
      storage_gb: 5,
      ai_tokens: 50000,
      analytics_requests: 10000
    },
    monthly_costs: {
      email: 0.80 * 15 + 15, // €27.00
      social_apis: 25,
      storage: 0.023 * 5 + 5, // €5.12
      ai: 0.002 * 50 + 20, // €20.10
      infrastructure: 20,
      integrations: 50
    },
    total_cost: 147.22,
    markup: 1.4,
    suggested_price: 59 // prezzo lancio
  },
  
  studio: {
    clients_limit: 2000,
    projects_limit: 500,
    campaigns_limit: 50,
    estimated_monthly_usage: {
      emails: 50000,
      social_api_calls: 20000,
      landing_pages: 50,
      storage_gb: 20,
      ai_tokens: 150000,
      analytics_requests: 30000
    },
    monthly_costs: {
      email: 0.80 * 50 + 15, // €55.00
      social_apis: 25,
      storage: 0.023 * 20 + 5, // €5.46
      ai: 0.002 * 150 + 20, // €20.30
      infrastructure: 40,
      integrations: 100
    },
    total_cost: 245.76,
    markup: 1.3,
    suggested_price: 99 // prezzo lancio
  },
  
  network: {
    clients_limit: 10000,
    projects_limit: 2000,
    campaigns_limit: 200,
    estimated_monthly_usage: {
      emails: 200000,
      social_api_calls: 80000,
      landing_pages: 200,
      storage_gb: 100,
      ai_tokens: 500000,
      analytics_requests: 100000
    },
    monthly_costs: {
      email: 0.80 * 200 + 15, // €175.00
      social_apis: 25,
      storage: 0.023 * 100 + 5, // €7.30
      ai: 0.002 * 500 + 20, // €21.00
      infrastructure: 80,
      integrations: 200
    },
    total_cost: 508.30,
    markup: 1.2,
    suggested_price: 199 // prezzo lancio
  },
  
  enterprise: {
    clients_limit: -1,
    projects_limit: -1,
    campaigns_limit: -1,
    estimated_monthly_usage: {
      emails: 1000000,
      social_api_calls: 500000,
      landing_pages: 1000,
      storage_gb: 1000,
      ai_tokens: 2000000,
      analytics_requests: 500000
    },
    monthly_costs: {
      email: 0.80 * 1000 + 15, // €815.00
      social_apis: 25,
      storage: 0.023 * 1000 + 5, // €28.00
      ai: 0.002 * 2000 + 20, // €24.00
      infrastructure: 200,
      integrations: 500
    },
    total_cost: 1592.00,
    markup: 1.15,
    suggested_price: 399 // prezzo enterprise
  }
};

// ===================================================================
// SISTEMA CREDITI
// ===================================================================

export const CREDIT_SYSTEM = {
  email_credit: 0.001, // €0.001 per email
  whatsapp_credit: 0.05, // €0.05 per WhatsApp
  sms_credit: 0.08, // €0.08 per SMS
  storage_credit: 0.02, // €0.02 per GB/mese
  ai_credit: 0.000002, // €0.000002 per token AI
  api_credit: 0.0001, // €0.0001 per chiamata API
  
  // PACCHETTI CREDITI
  credit_packages: {
    small: {
      credits: 1000,
      price: 9,
      bonus: 0
    },
    medium: {
      credits: 5000,
      price: 39,
      bonus: 500 // 10% bonus
    },
    large: {
      credits: 15000,
      price: 99,
      bonus: 2000 // 13% bonus
    },
    enterprise: {
      credits: 50000,
      price: 299,
      bonus: 10000 // 20% bonus
    }
  }
};

// ===================================================================
// PREZZI PROMOZIONALI PRIMI 6 MESI
// ===================================================================

export const LAUNCH_PRICING = {
  insurance_agency: {
    starter: {
      regular_price: 69,
      launch_price: 39,
      discount: '44%',
      duration_months: 6
    },
    professional: {
      regular_price: 129,
      launch_price: 79,
      discount: '39%',
      duration_months: 6
    },
    business: {
      regular_price: 229,
      launch_price: 149,
      discount: '35%',
      duration_months: 6
    },
    premium: {
      regular_price: 449,
      launch_price: 299,
      discount: '33%',
      duration_months: 6
    },
    enterprise: {
      regular_price: 899,
      launch_price: 799,
      discount: '11%',
      duration_months: 6
    }
  },
  
  marketing_agency: {
    freelancer: {
      regular_price: 49,
      launch_price: 29,
      discount: '41%',
      duration_months: 6
    },
    agency: {
      regular_price: 89,
      launch_price: 59,
      discount: '34%',
      duration_months: 6
    },
    studio: {
      regular_price: 149,
      launch_price: 99,
      discount: '34%',
      duration_months: 6
    },
    network: {
      regular_price: 299,
      launch_price: 199,
      discount: '33%',
      duration_months: 6
    },
    enterprise: {
      regular_price: 499,
      launch_price: 399,
      discount: '20%',
      duration_months: 6
    }
  }
};

export default {
  INSURANCE_MODULES,
  MARKETING_MODULES,
  API_COSTS,
  INSURANCE_COST_ANALYSIS,
  MARKETING_COST_ANALYSIS,
  CREDIT_SYSTEM,
  LAUNCH_PRICING
};