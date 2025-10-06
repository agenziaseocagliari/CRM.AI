// SuperAdmin AI Agent - Automated Customer Management System
// This agent handles all subscription lifecycle operations automatically

import { createClient } from '@supabase/supabase-js';

export interface SuperAdminAgent {
  id: 'super_admin';
  name: 'SuperAdmin AI';
  category: 'administration';
  capabilities: string[];
  permissions: 'system_admin';
}

export interface SubscriptionChangeRequest {
  userEmail: string;
  targetTier: 'freelancer' | 'startup' | 'business' | 'enterprise';
  reason: 'upgrade' | 'downgrade' | 'trial_conversion' | 'admin_override';
  effectiveDate?: string;
  promoCode?: string;
}

export interface UserState {
  id: string;
  email: string | undefined;
  currentTier: string;
  credits: number;
  organization: unknown;
  metadata?: Record<string, unknown>;
}

export interface TierChanges {
  newCredits: number;
  creditsDelta: number;
  featuresAdded: string[];
  featuresRemoved: string[];
  limitsChanged: Record<string, { before: number | string; after: number | string; }>;
}

export interface BillingResult {
  nextBillingDate: string;
  prorationAmount?: number;
  invoiceId?: string;
}

export interface SuperAdminResponse {
  success: boolean;
  operation: string;
  userEmail: string;
  previousTier: string;
  newTier: string;
  effectiveDate: string;
  changes: {
    credits: { before: number; after: number; };
    features: { added: string[]; removed: string[]; };
    limits: Record<string, { before: number | string; after: number | string; }>;
  };
  billingInfo?: BillingResult;
  error?: string;
}

export class SuperAdminAI {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * 🚀 AUTOMATED SUBSCRIPTION MANAGEMENT
   * Handles complete subscription lifecycle with zero manual intervention
   */
  async processSubscriptionChange(request: SubscriptionChangeRequest): Promise<SuperAdminResponse> {
    try {
      console.log(`🤖 SuperAdmin AI: Processing ${request.reason} for ${request.userEmail} to ${request.targetTier}`);

      // Step 1: Validate user exists and get current state
      const currentUser = await this.getUserCurrentState(request.userEmail);
      if (!currentUser) {
        throw new Error(`User ${request.userEmail} not found`);
      }

      // Step 2: Calculate tier changes and requirements  
      const tierChanges = this.calculateTierChanges(currentUser.currentTier, request.targetTier);

      // Step 3: Handle billing changes (Stripe integration)
      const billingResult = await this.processBillingChanges(currentUser, request, tierChanges);

      // Step 4: Update database with new subscription
      await this.updateUserSubscription(currentUser, request, tierChanges);

      // Step 5: Apply feature changes and limits
      await this.applyFeatureChanges(currentUser, request.targetTier);

      // Step 6: Send notifications and confirmations
      await this.sendNotifications(currentUser, request, tierChanges);

      // Step 7: Log audit trail
      await this.logSubscriptionChange(currentUser, request, tierChanges);

      return {
        success: true,
        operation: `${request.reason}_completed`,
        userEmail: request.userEmail,
        previousTier: currentUser.currentTier,
        newTier: request.targetTier,
        effectiveDate: request.effectiveDate || new Date().toISOString(),
        changes: {
          credits: {
            before: currentUser.credits,
            after: tierChanges.newCredits
          },
          features: {
            added: tierChanges.featuresAdded,
            removed: tierChanges.featuresRemoved
          },
          limits: tierChanges.limitsChanged
        },
        billingInfo: billingResult
      };

    } catch (error) {
      console.error('🚨 SuperAdmin AI Error:', error);

      return {
        success: false,
        operation: `${request.reason}_failed`,
        userEmail: request.userEmail,
        previousTier: 'unknown',
        newTier: request.targetTier,
        effectiveDate: new Date().toISOString(),
        changes: {
          credits: { before: 0, after: 0 },
          features: { added: [], removed: [] },
          limits: {}
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 🔍 GET USER CURRENT STATE
   */
  private async getUserCurrentState(email: string) {
    // Get user from auth
    const { data: authUsers } = await this.supabase.auth.admin.listUsers();
    const user = authUsers.users?.find(u => u.email === email);

    if (!user) return null;

    // Get current subscription and organization
    const { data: orgSub } = await this.supabase
      .from('organization_subscriptions')
      .select(`
        *,
        subscription_tiers (*)
      `)
      .eq('organization_id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      currentTier: user.user_metadata?.subscription_tier || 'freelancer',
      credits: user.user_metadata?.credits || 0,
      organization: orgSub,
      metadata: user.user_metadata
    };
  }

  /**
   * 📊 CALCULATE TIER CHANGES
   */
  private calculateTierChanges(fromTier: string, toTier: string) {
    const tierConfig = {
      freelancer: { credits: 100, features: ['basic_crm', 'email_basic'], limits: { contacts: 1000, campaigns: 5 } },
      startup: { credits: 500, features: ['basic_crm', 'email_basic', 'whatsapp_basic'], limits: { contacts: 5000, campaigns: 20 } },
      business: { credits: 2000, features: ['basic_crm', 'email_advanced', 'whatsapp_advanced', 'analytics'], limits: { contacts: 25000, campaigns: 100 } },
      enterprise: { credits: 10000, features: ['all_features', 'custom_integrations', 'priority_support'], limits: { contacts: -1, campaigns: -1 } }
    };

    const fromConfig = tierConfig[fromTier as keyof typeof tierConfig];
    const toConfig = tierConfig[toTier as keyof typeof tierConfig];

    return {
      newCredits: toConfig.credits,
      creditsDelta: toConfig.credits - fromConfig.credits,
      featuresAdded: toConfig.features.filter(f => !fromConfig.features.includes(f)),
      featuresRemoved: fromConfig.features.filter(f => !toConfig.features.includes(f)),
      limitsChanged: this.compareLimits(fromConfig.limits, toConfig.limits)
    };
  }

  private compareLimits(fromLimits: Record<string, number>, toLimits: Record<string, number>) {
    const changes: Record<string, { before: number | string; after: number | string }> = {};

    Object.keys(fromLimits).forEach(key => {
      if (fromLimits[key] !== toLimits[key]) {
        changes[key] = {
          before: fromLimits[key] === -1 ? 'unlimited' : fromLimits[key],
          after: toLimits[key] === -1 ? 'unlimited' : toLimits[key]
        };
      }
    });

    return changes;
  }

  /**
   * 💳 PROCESS BILLING CHANGES (Stripe Integration)
   */
  private async processBillingChanges(user: UserState, request: SubscriptionChangeRequest, changes: TierChanges): Promise<BillingResult> {
    // This would integrate with Stripe for real billing
    // For now, simulate the process

    console.log(`💳 Processing billing for ${user.email}: ${changes.creditsDelta} credits`);

    return {
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      prorationAmount: changes.creditsDelta > 0 ? changes.creditsDelta * 0.01 : 0,
      invoiceId: `inv_${Date.now()}`
    };
  }

  /**
   * 🗄️ UPDATE USER SUBSCRIPTION IN DATABASE
   */
  private async updateUserSubscription(user: UserState, request: SubscriptionChangeRequest, changes: TierChanges) {
    // Update auth user metadata
    const { error: authError } = await this.supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.metadata,
          subscription_tier: request.targetTier,
          credits: changes.newCredits,
          upgraded_at: new Date().toISOString(),
          upgraded_by: 'super_admin_ai'
        }
      }
    );

    if (authError) throw authError;

    // Update organization subscription
    const { error: orgError } = await this.supabase
      .from('organization_subscriptions')
      .upsert({
        organization_id: user.id,
        subscription_tier_id: await this.getTierIdByName(request.targetTier),
        status: 'active',
        updated_at: new Date().toISOString()
      });

    if (orgError) throw orgError;

    return { success: true };
  }

  /**
   * ⚡ APPLY FEATURE CHANGES
   */
  private async applyFeatureChanges(user: UserState, newTier: string) {
    // Apply feature flags and access controls based on new tier
    console.log(`⚡ Applying feature changes for ${user.email} to ${newTier} tier`);

    // Update user profile with new features
    const { error } = await this.supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        subscription_tier: newTier,
        features_enabled: this.getFeaturesForTier(newTier),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return { success: true };
  }

  /**
   * 📧 SEND NOTIFICATIONS
   */
  private async sendNotifications(user: UserState, request: SubscriptionChangeRequest, changes: TierChanges) {
    console.log(`📧 Sending notifications to ${user.email} about ${request.reason}`);

    // This would integrate with email service
    // For now, log the notification
    const notification = {
      to: user.email,
      subject: `Subscription ${request.reason} completed`,
      message: `Your subscription has been ${request.reason}d to ${request.targetTier}. New credits: ${changes.newCredits}`
    };

    console.log('📧 Notification:', notification);

    return { sent: true };
  }

  /**
   * 📝 LOG AUDIT TRAIL
   */
  private async logSubscriptionChange(user: UserState, request: SubscriptionChangeRequest, changes: TierChanges) {
    const auditLog = {
      user_id: user.id,
      action: `subscription_${request.reason}`,
      details: {
        fromTier: user.currentTier,
        toTier: request.targetTier,
        changes: changes,
        timestamp: new Date().toISOString(),
        automated: true,
        agent: 'super_admin_ai'
      }
    };

    console.log('📝 Audit Log:', auditLog);

    // Save to audit table
    const { error } = await this.supabase
      .from('audit_logs')
      .insert(auditLog);

    if (error) console.warn('Audit log failed:', error);

    return { logged: true };
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private async getTierIdByName(tierName: string): Promise<string> {
    const { data } = await this.supabase
      .from('subscription_tiers')
      .select('id')
      .eq('name', tierName)
      .single();

    return data?.id || '';
  }

  private getFeaturesForTier(tier: string): string[] {
    const tierFeatures = {
      freelancer: ['basic_crm', 'email_basic'],
      startup: ['basic_crm', 'email_basic', 'whatsapp_basic'],
      business: ['basic_crm', 'email_advanced', 'whatsapp_advanced', 'analytics'],
      enterprise: ['all_features', 'custom_integrations', 'priority_support', 'white_label']
    };

    return tierFeatures[tier as keyof typeof tierFeatures] || [];
  }

  /**
   * 🚀 PUBLIC API METHODS
   */

  // Upgrade user to higher tier
  async upgradeUser(email: string, targetTier: string, promoCode?: string): Promise<SuperAdminResponse> {
    return this.processSubscriptionChange({
      userEmail: email,
      targetTier: targetTier as 'freelancer' | 'startup' | 'business' | 'enterprise',
      reason: 'upgrade',
      promoCode
    });
  }

  // Downgrade user to lower tier
  async downgradeUser(email: string, targetTier: string): Promise<SuperAdminResponse> {
    return this.processSubscriptionChange({
      userEmail: email,
      targetTier: targetTier as 'freelancer' | 'startup' | 'business' | 'enterprise',
      reason: 'downgrade'
    });
  }

  // Convert trial to paid
  async convertTrial(email: string, targetTier: string): Promise<SuperAdminResponse> {
    return this.processSubscriptionChange({
      userEmail: email,
      targetTier: targetTier as 'freelancer' | 'startup' | 'business' | 'enterprise',
      reason: 'trial_conversion'
    });
  }

  // Admin override for special cases
  async adminOverride(email: string, targetTier: string): Promise<SuperAdminResponse> {
    return this.processSubscriptionChange({
      userEmail: email,
      targetTier: targetTier as 'freelancer' | 'startup' | 'business' | 'enterprise',
      reason: 'admin_override'
    });
  }
}

// Export singleton instance
export const superAdminAI = new SuperAdminAI();