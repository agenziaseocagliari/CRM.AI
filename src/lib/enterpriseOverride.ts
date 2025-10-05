// Development override for enterprise access
// This file forces webproseoid@gmail.com to have enterprise tier access for testing

export const ENTERPRISE_OVERRIDE_EMAIL = 'webproseoid@gmail.com';

export const isDevelopmentEnterpriseUser = (email?: string): boolean => {
  return email === ENTERPRISE_OVERRIDE_EMAIL;
};

export const getEffectiveUserTier = (email?: string, originalTier?: string): string => {
  if (isDevelopmentEnterpriseUser(email)) {
    return 'enterprise';
  }
  return originalTier || 'freelancer';
};

export const getEnterpriseFeatures = () => ({
  ai_agents_unlimited: true,
  whatsapp_module: true,
  email_marketing: true,
  advanced_analytics: true,
  api_access: true,
  priority_support: true,
  custom_branding: true,
  advanced_automations: true,
  enterprise_integrations: true
});

export const getEnterpriseQuotas = () => ({
  ai_agents_quota: {
    daily: 1000,
    monthly: 30000
  },
  limits: {
    contacts: -1, // unlimited
    campaigns: -1, // unlimited
    templates: -1, // unlimited
    ai_requests_per_day: 1000,
    api_calls_per_month: 100000
  }
});