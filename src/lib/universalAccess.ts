// Universal Credit System - All modules available for all tiers with credit limits
// This replaces tier-based restrictions with usage-based monetization

export interface UniversalCreditSystem {
  userId: string;
  currentTier: 'freelancer' | 'startup' | 'business' | 'enterprise';
  credits: {
    ai_requests: { used: number; limit: number; resetDate: string; };
    whatsapp_messages: { used: number; limit: number; resetDate: string; };
    email_campaigns: { used: number; limit: number; resetDate: string; };
    form_submissions: { used: number; limit: number; resetDate: string; };
    calendar_bookings: { used: number; limit: number; resetDate: string; };
    storage_gb: { used: number; limit: number; };
  };
  modules: {
    all_available: true; // ✅ ALL MODULES ALWAYS AVAILABLE
    restrictions: 'credit_based_only'; // Only credits limit usage, not access
  };
}

export const UNIVERSAL_TIER_CONFIGS = {
  freelancer: {
    displayName: 'Freelancer',
    price: 29,
    modules: {
      opportunities: { available: true, credit_limits: { daily: 50, monthly: 1000 } },
      contacts: { available: true, credit_limits: { daily: 100, monthly: 2000 } },
      email_marketing: { available: true, credit_limits: { daily: 20, monthly: 500 } },
      whatsapp: { available: true, credit_limits: { daily: 30, monthly: 600 } },
      forms: { available: true, credit_limits: { daily: 25, monthly: 500 } },
      calendar: { available: true, credit_limits: { daily: 15, monthly: 300 } },
      automations: { available: true, credit_limits: { daily: 10, monthly: 200 } }
    },
    ai_agents: {
      all_available: true, // ✅ ALL AI AGENTS AVAILABLE
      quotas: {
        FormMaster: { daily: 10, monthly: 200 },
        EmailGenius: { daily: 15, monthly: 300 },
        WhatsAppButler: { daily: 20, monthly: 400 },
        CalendarWizard: { daily: 10, monthly: 200 },
        AnalyticsOracle: { daily: 5, monthly: 100 },
        LeadScorer: { daily: 25, monthly: 500 }
      }
    }
  },
  
  startup: {
    displayName: 'Startup',
    price: 79,
    modules: {
      opportunities: { available: true, credit_limits: { daily: 200, monthly: 5000 } },
      contacts: { available: true, credit_limits: { daily: 500, monthly: 10000 } },
      email_marketing: { available: true, credit_limits: { daily: 100, monthly: 2500 } },
      whatsapp: { available: true, credit_limits: { daily: 150, monthly: 3000 } },
      forms: { available: true, credit_limits: { daily: 100, monthly: 2000 } },
      calendar: { available: true, credit_limits: { daily: 75, monthly: 1500 } },
      automations: { available: true, credit_limits: { daily: 50, monthly: 1000 } }
    },
    ai_agents: {
      all_available: true,
      quotas: {
        FormMaster: { daily: 50, monthly: 1000 },
        EmailGenius: { daily: 75, monthly: 1500 },
        WhatsAppButler: { daily: 100, monthly: 2000 },
        CalendarWizard: { daily: 50, monthly: 1000 },
        AnalyticsOracle: { daily: 25, monthly: 500 },
        LeadScorer: { daily: 125, monthly: 2500 }
      }
    }
  },
  
  business: {
    displayName: 'Business',
    price: 199,
    modules: {
      opportunities: { available: true, credit_limits: { daily: 800, monthly: 20000 } },
      contacts: { available: true, credit_limits: { daily: 2000, monthly: 40000 } },
      email_marketing: { available: true, credit_limits: { daily: 500, monthly: 12000 } },
      whatsapp: { available: true, credit_limits: { daily: 600, monthly: 15000 } },
      forms: { available: true, credit_limits: { daily: 400, monthly: 8000 } },
      calendar: { available: true, credit_limits: { daily: 300, monthly: 6000 } },
      automations: { available: true, credit_limits: { daily: 200, monthly: 4000 } }
    },
    ai_agents: {
      all_available: true,
      quotas: {
        FormMaster: { daily: 200, monthly: 4000 },
        EmailGenius: { daily: 300, monthly: 6000 },
        WhatsAppButler: { daily: 400, monthly: 8000 },
        CalendarWizard: { daily: 200, monthly: 4000 },
        AnalyticsOracle: { daily: 100, monthly: 2000 },
        LeadScorer: { daily: 500, monthly: 10000 }
      }
    }
  },
  
  enterprise: {
    displayName: 'Enterprise',
    price: 499,
    modules: {
      opportunities: { available: true, credit_limits: { daily: -1, monthly: -1 } }, // Unlimited
      contacts: { available: true, credit_limits: { daily: -1, monthly: -1 } },
      email_marketing: { available: true, credit_limits: { daily: -1, monthly: -1 } },
      whatsapp: { available: true, credit_limits: { daily: -1, monthly: -1 } },
      forms: { available: true, credit_limits: { daily: -1, monthly: -1 } },
      calendar: { available: true, credit_limits: { daily: -1, monthly: -1 } },
      automations: { available: true, credit_limits: { daily: -1, monthly: -1 } }
    },
    ai_agents: {
      all_available: true,
      quotas: {
        FormMaster: { daily: -1, monthly: -1 },
        EmailGenius: { daily: -1, monthly: -1 },
        WhatsAppButler: { daily: -1, monthly: -1 },
        CalendarWizard: { daily: -1, monthly: -1 },
        AnalyticsOracle: { daily: -1, monthly: -1 },
        LeadScorer: { daily: -1, monthly: -1 }
      }
    }
  }
};

export class UniversalAccessManager {
  
  /**
   * 🌍 UNIVERSAL ACCESS: All modules available for all tiers
   */
  static getAvailableModules(_userTier: string): string[] {
    // ✅ ALL MODULES ALWAYS AVAILABLE regardless of tier
    return [
      'opportunities',
      'contacts', 
      'email_marketing',
      'whatsapp',
      'forms',
      'calendar',
      'automations'
    ];
  }
  
  /**
   * 🤖 UNIVERSAL AI AGENTS: All agents available for all tiers
   */
  static getAvailableAIAgents(_userTier: string): string[] {
    // ✅ ALL AI AGENTS ALWAYS AVAILABLE regardless of tier
    return [
      'FormMaster',
      'EmailGenius', 
      'WhatsAppButler',
      'CalendarWizard',
      'AnalyticsOracle',
      'LeadScorer'
    ];
  }
  
  /**
   * 📊 CREDIT LIMITS: Only difference between tiers
   */
  static getCreditLimits(userTier: string, module: string) {
    const config = UNIVERSAL_TIER_CONFIGS[userTier as keyof typeof UNIVERSAL_TIER_CONFIGS];
    return config?.modules[module as keyof typeof config.modules]?.credit_limits || { daily: 10, monthly: 100 };
  }
  
  /**
   * ⚡ AI AGENT QUOTAS: Based on tier but all available
   */
  static getAIAgentQuota(userTier: string, agentId: string) {
    const config = UNIVERSAL_TIER_CONFIGS[userTier as keyof typeof UNIVERSAL_TIER_CONFIGS];
    return config?.ai_agents.quotas[agentId as keyof typeof config.ai_agents.quotas] || { daily: 5, monthly: 50 };
  }
  
  /**
   * ✅ ACCESS CHECK: Always true for modules, only credits matter
   */
  static hasModuleAccess(_userTier: string, _module: string): boolean {
    // ✅ UNIVERSAL ACCESS: Everyone gets everything
    return true;
  }
  
  /**
   * ✅ AI AGENT ACCESS: Always true, only quotas matter
   */
  static hasAIAgentAccess(_userTier: string, _agentId: string): boolean {
    // ✅ UNIVERSAL ACCESS: Everyone gets all AI agents
    return true;
  }
  
  /**
   * 🚨 CREDIT CHECK: The only restriction mechanism
   */
  static async checkCreditAvailability(userId: string, _module: string, _operation: string): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    resetDate: string;
  }> {
    // This would integrate with real credit tracking system
    // For now, simulate based on enterprise override
    
    const isEnterpriseUser = userId === 'webproseoid@gmail.com'; // Your override
    
    if (isEnterpriseUser) {
      return {
        allowed: true,
        remaining: -1, // Unlimited
        limit: -1,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    
    // For other users, simulate credit check
    return {
      allowed: true,
      remaining: 100,
      limit: 200,
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

/**
 * 🎯 UNIVERSAL NAVIGATION: All modules always visible
 */
export const UNIVERSAL_NAVIGATION = [
  { id: 'opportunities', label: 'Opportunities', icon: 'Target', available: true },
  { id: 'contacts', label: 'Contacts', icon: 'Users', available: true },
  { id: 'email-marketing', label: 'Email Marketing', icon: 'Mail', available: true },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', available: true },
  { id: 'forms', label: 'Forms', icon: 'FileText', available: true },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar', available: true },
  { id: 'automations', label: 'Automations', icon: 'Zap', available: true }
];

/**
 * 🏷️ TIER BADGES: Visual differentiation for UI
 */
export const TIER_DISPLAY_CONFIG = {
  freelancer: { 
    badge: 'Freelancer', 
    color: 'bg-green-100 text-green-700',
    description: 'Perfect for solo professionals'
  },
  startup: { 
    badge: 'Startup', 
    color: 'bg-blue-100 text-blue-700',
    description: 'Ideal for growing teams'
  },
  business: { 
    badge: 'Business', 
    color: 'bg-purple-100 text-purple-700',
    description: 'Advanced features for scale'
  },
  enterprise: { 
    badge: 'Enterprise', 
    color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700',
    description: 'Unlimited everything'
  }
};