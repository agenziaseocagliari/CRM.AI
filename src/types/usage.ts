// ===================================================================
// GUARDIAN AI CRM - USAGE TRACKING & BILLING TYPES
// File: src/types/usage.ts
// Definizione TypeScript per sistema crediti e tracking usage
// ===================================================================

export interface SubscriptionTier {
  id: string;
  name: 'starter' | 'professional' | 'enterprise';
  display_name: string;
  price_cents: number;
  currency: string;
  
  // Limits
  ai_requests_limit: number; // -1 = unlimited
  whatsapp_messages_limit: number;
  email_marketing_limit: number;
  contacts_limit: number;
  storage_limit_gb: number;
  
  // Features
  features: {
    super_admin?: boolean;
    advanced_ai?: boolean;
    priority_support?: boolean;
    automations?: boolean;
    white_label?: boolean;
  };
  
  // Overage pricing (cents)
  ai_overage_cents: number;
  whatsapp_overage_cents: number;
  email_overage_cents: number;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  subscription_tier_id: string;
  
  // Status
  status: 'trial' | 'active' | 'cancelled' | 'suspended' | 'past_due';
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  
  // Billing
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  last_payment_at?: string;
  next_billing_date?: string;
  
  // Custom limits (overrides)
  custom_limits?: {
    ai_requests_limit?: number;
    whatsapp_messages_limit?: number;
    email_marketing_limit?: number;
    contacts_limit?: number;
    storage_limit_gb?: number;
  };
  
  created_at: string;
  updated_at: string;
  
  // Relations
  subscription_tier?: SubscriptionTier;
}

export interface UsageTracking {
  id: string;
  organization_id: string;
  
  // Service info
  service_type: 'ai_request' | 'whatsapp_message' | 'email_marketing' | 'storage';
  service_action?: string; // 'lead_scoring', 'email_generation', etc.
  
  // Usage data
  usage_date: string;
  quantity: number;
  
  // Cost tracking
  cost_cents: number; // Real cost to us
  billable_cents: number; // Cost to customer
  
  // Metadata
  metadata?: {
    model?: string;
    tokens?: number;
    duration_ms?: number;
    success?: boolean;
    error_code?: string;
    [key: string]: unknown;
  };
  
  // References
  contact_id?: string;
  automation_id?: string;
  
  created_at: string;
}

export interface UsageQuota {
  id: string;
  organization_id: string;
  
  // Period
  period_start: string;
  period_end: string;
  
  // Current usage
  ai_requests_used: number;
  whatsapp_messages_used: number;
  email_marketing_used: number;
  storage_used_gb: number;
  
  // Overage
  ai_overage: number;
  whatsapp_overage: number;
  email_overage: number;
  
  // Alert flags
  ai_alert_80_sent: boolean;
  ai_alert_90_sent: boolean;
  whatsapp_alert_80_sent: boolean;
  whatsapp_alert_90_sent: boolean;
  email_alert_80_sent: boolean;
  email_alert_90_sent: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface BillingEvent {
  id: string;
  organization_id: string;
  
  // Event data
  event_type: 'subscription_created' | 'payment_succeeded' | 'quota_exceeded' | 'overage_charged' | 'subscription_cancelled';
  amount_cents: number;
  currency: string;
  
  // References
  stripe_event_id?: string;
  subscription_id?: string;
  
  // Metadata
  metadata?: {
    description?: string;
    service_type?: string;
    overage_quantity?: number;
    [key: string]: unknown;
  };
  
  created_at: string;
}

// Summary view interface
export interface OrganizationUsageSummary {
  organization_id: string;
  organization_name: string;
  tier_name: string;
  tier_display_name: string;
  price_cents: number;
  
  // Limits (converted from -1 to 999999 for unlimited)
  ai_limit: number;
  whatsapp_limit: number;
  email_limit: number;
  
  // Current usage
  ai_used: number;
  whatsapp_used: number;
  email_used: number;
  
  // Usage percentages
  ai_usage_percent: number;
  whatsapp_usage_percent: number;
  email_usage_percent: number;
  
  // Subscription info
  subscription_status: string;
  current_period_end: string;
  
  // Alert status
  ai_alert_80_sent: boolean;
  ai_alert_90_sent: boolean;
  whatsapp_alert_80_sent: boolean;
  whatsapp_alert_90_sent: boolean;
  email_alert_80_sent: boolean;
  email_alert_90_sent: boolean;
}

// Service type definition
export type ServiceType = 'ai_request' | 'whatsapp_message' | 'email_marketing' | 'storage';

// Usage tracking request interface
export interface TrackUsageRequest {
  organizationId: string;
  service_type: ServiceType;
  service_action?: string;
  quantity?: number;
  cost_cents?: number;
  metadata?: UsageTracking['metadata'];
  contact_id?: string;
  automation_id?: string;
}

// Usage limits interface
export interface UsageLimits {
  ai_requests: number;
  whatsapp_messages: number;
  email_marketing: number;
  contacts: number;
  storage_gb: number;
  
  // Computed fields
  is_unlimited: boolean;
  overage_pricing: {
    ai_requests: number; // cents per request
    whatsapp_messages: number; // cents per message
    email_marketing: number; // cents per email
  };
}

// Extended usage limits with extra credits
export interface UsageLimitsWithExtraCredits extends UsageLimits {
  extra_credits: {
    ai_credits: number;
    whatsapp_credits: number;
    email_credits: number;
  };
  total_limits: {
    ai_requests: number;
    whatsapp_messages: number;
    email_marketing: number;
  };
}

// Alert thresholds
export interface AlertThresholds {
  WARNING_THRESHOLD: 80; // 80%
  CRITICAL_THRESHOLD: 90; // 90%
  EXCEEDED_THRESHOLD: 100; // 100%
}

// Usage statistics
export interface UsageStatistics {
  current_period: {
    start: string;
    end: string;
    days_remaining: number;
  };
  
  usage: {
    ai_requests: {
      used: number;
      limit: number;
      percentage: number;
      overage: number;
    };
    whatsapp_messages: {
      used: number;
      limit: number;
      percentage: number;
      overage: number;
    };
    email_marketing: {
      used: number;
      limit: number;
      percentage: number;
      overage: number;
    };
  };
  
  costs: {
    current_period_cents: number;
    overage_cents: number;
    total_cents: number;
  };
  
  alerts: {
    ai_warning: boolean;
    ai_critical: boolean;
    whatsapp_warning: boolean;
    whatsapp_critical: boolean;
    email_warning: boolean;
    email_critical: boolean;
  };
}

// Pricing calculation interface
export interface PricingCalculation {
  base_price_cents: number;
  overage_charges: {
    ai_requests: number;
    whatsapp_messages: number;
    email_marketing: number;
    total: number;
  };
  total_price_cents: number;
  savings_vs_payg: number; // Risparmio vs pay-as-you-go
}

// Export constants
export const USAGE_ALERT_THRESHOLDS: AlertThresholds = {
  WARNING_THRESHOLD: 80,
  CRITICAL_THRESHOLD: 90,
  EXCEEDED_THRESHOLD: 100
};

export const DEFAULT_TIER_LIMITS: Record<SubscriptionTier['name'], Omit<UsageLimits, 'is_unlimited' | 'overage_pricing'>> = {
  starter: {
    ai_requests: 500,
    whatsapp_messages: 100,
    email_marketing: 2000,
    contacts: 1000,
    storage_gb: 5
  },
  professional: {
    ai_requests: 2000,
    whatsapp_messages: 500,
    email_marketing: 8000,
    contacts: 10000,
    storage_gb: 20
  },
  enterprise: {
    ai_requests: -1, // unlimited
    whatsapp_messages: -1,
    email_marketing: -1,
    contacts: -1,
    storage_gb: -1
  }
};

// Service cost mapping (our real costs)
export const SERVICE_COSTS = {
  ai_request: {
    'lead_scoring': 0.005, // $0.005 per request
    'email_generation': 0.008,
    'chatbot': 0.003,
    'automation': 0.007,
    'default': 0.005
  },
  whatsapp_message: 0.017, // $0.017 per message (Twilio + Meta)
  email_marketing: 0.0004, // $0.0004 per email (SendGrid)
  storage: 0.125 // $0.125 per GB per month
} as const;