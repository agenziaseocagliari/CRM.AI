/**
 * GUARDIAN AI CRM - VERTICAL ACCOUNTS SERVICE
 * Service per gestione Account Types e configurazioni verticali
 * Data: 2025-10-05
 */

import { supabase } from '../supabaseClient';
import type {
  AccountType,
  VerticalAccountConfig,
  VerticalTemplate,
  VerticalCustomField,
  EnterpriseCustomization,
  OrganizationVerticalConfig
} from './types';

// ===================================================================
// VERTICAL ACCOUNT CONFIGS SERVICE
// ===================================================================

export class VerticalAccountService {
  
  /**
   * Get all available vertical account configurations
   */
  static async getVerticalConfigs(): Promise<VerticalAccountConfig[]> {
    const { data, error } = await supabase
      .from('vertical_account_configs')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) {
      console.error('Error fetching vertical configs:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Get specific vertical account configuration
   */
  static async getVerticalConfig(accountType: AccountType): Promise<VerticalAccountConfig | null> {
    const { data, error } = await supabase
      .from('vertical_account_configs')
      .select('*')
      .eq('account_type', accountType)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching vertical config:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Create new vertical account configuration (Admin only)
   */
  static async createVerticalConfig(config: Omit<VerticalAccountConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<VerticalAccountConfig> {
    const { data, error } = await supabase
      .from('vertical_account_configs')
      .insert(config)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating vertical config:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Update vertical account configuration (Admin only)
   */
  static async updateVerticalConfig(
    accountType: AccountType, 
    updates: Partial<VerticalAccountConfig>
  ): Promise<VerticalAccountConfig> {
    const { data, error } = await supabase
      .from('vertical_account_configs')
      .update(updates)
      .eq('account_type', accountType)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating vertical config:', error);
      throw error;
    }
    
    return data;
  }
}

// ===================================================================
// VERTICAL TEMPLATES SERVICE
// ===================================================================

export class VerticalTemplateService {
  
  /**
   * Get templates for specific account type
   */
  static async getTemplatesForAccountType(
    accountType: AccountType,
    templateType?: string
  ): Promise<VerticalTemplate[]> {
    let query = supabase
      .from('vertical_templates')
      .select('*')
      .eq('account_type', accountType)
      .eq('is_active', true);
    
    if (templateType) {
      query = query.eq('template_type', templateType);
    }
    
    const { data, error } = await query.order('template_name');
    
    if (error) {
      console.error('Error fetching vertical templates:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Get specific template
   */
  static async getTemplate(templateId: string): Promise<VerticalTemplate | null> {
    const { data, error } = await supabase
      .from('vertical_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching template:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Create new template
   */
  static async createTemplate(template: Omit<VerticalTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<VerticalTemplate> {
    const { data, error } = await supabase
      .from('vertical_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Clone template for customization
   */
  static async cloneTemplate(
    templateId: string,
    organizationId: string,
    customizations: Record<string, unknown>
  ): Promise<VerticalTemplate> {
    // Get original template
    const originalTemplate = await this.getTemplate(templateId);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }
    
    // Create customized version
    const customTemplate: Omit<VerticalTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      ...originalTemplate,
      templateName: `${originalTemplate.templateName}_custom_${organizationId}`,
      templateConfig: { ...originalTemplate.templateConfig, ...customizations },
      isSystemTemplate: false,
      parentTemplateId: templateId
    };
    
    return this.createTemplate(customTemplate);
  }
  
  /**
   * Get dashboard widgets for account type
   */
  static async getDashboardWidgets(accountType: AccountType): Promise<VerticalTemplate[]> {
    return this.getTemplatesForAccountType(accountType, 'dashboard_widget');
  }
  
  /**
   * Get email templates for account type
   */
  static async getEmailTemplates(accountType: AccountType): Promise<VerticalTemplate[]> {
    return this.getTemplatesForAccountType(accountType, 'email_template');
  }
  
  /**
   * Get form templates for account type
   */
  static async getFormTemplates(accountType: AccountType): Promise<VerticalTemplate[]> {
    return this.getTemplatesForAccountType(accountType, 'form_template');
  }
  
  /**
   * Get automation rules for account type
   */
  static async getAutomationRules(accountType: AccountType): Promise<VerticalTemplate[]> {
    return this.getTemplatesForAccountType(accountType, 'automation_rule');
  }
}

// ===================================================================
// VERTICAL CUSTOM FIELDS SERVICE
// ===================================================================

export class VerticalCustomFieldService {
  
  /**
   * Get custom fields for account type and entity
   */
  static async getCustomFields(
    accountType: AccountType,
    entityType?: 'contact' | 'opportunity' | 'organization'
  ): Promise<VerticalCustomField[]> {
    let query = supabase
      .from('vertical_custom_fields')
      .select('*')
      .eq('account_type', accountType)
      .eq('is_active', true);
    
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    
    const { data, error } = await query.order('display_order');
    
    if (error) {
      console.error('Error fetching custom fields:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Get contact custom fields
   */
  static async getContactCustomFields(accountType: AccountType): Promise<VerticalCustomField[]> {
    return this.getCustomFields(accountType, 'contact');
  }
  
  /**
   * Get opportunity custom fields  
   */
  static async getOpportunityCustomFields(accountType: AccountType): Promise<VerticalCustomField[]> {
    return this.getCustomFields(accountType, 'opportunity');
  }
  
  /**
   * Create custom field
   */
  static async createCustomField(field: Omit<VerticalCustomField, 'id' | 'createdAt'>): Promise<VerticalCustomField> {
    const { data, error } = await supabase
      .from('vertical_custom_fields')
      .insert(field)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating custom field:', error);
      throw error;
    }
    
    return data;
  }
}

// ===================================================================
// ENTERPRISE CUSTOMIZATION SERVICE
// ===================================================================

export class EnterpriseCustomizationService {
  
  /**
   * Get enterprise customizations for organization
   */
  static async getCustomizations(organizationId: string): Promise<EnterpriseCustomization[]> {
    const { data, error } = await supabase
      .from('enterprise_customizations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching enterprise customizations:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Create enterprise customization
   */
  static async createCustomization(
    customization: Omit<EnterpriseCustomization, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EnterpriseCustomization> {
    const { data, error } = await supabase
      .from('enterprise_customizations')
      .insert(customization)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating enterprise customization:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Approve enterprise customization
   */
  static async approveCustomization(
    customizationId: string,
    approvedBy: string
  ): Promise<EnterpriseCustomization> {
    const { data, error } = await supabase
      .from('enterprise_customizations')
      .update({
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', customizationId)
      .select()
      .single();
    
    if (error) {
      console.error('Error approving customization:', error);
      throw error;
    }
    
    return data;
  }
}

// ===================================================================
// ORGANIZATION VERTICAL SERVICE
// ===================================================================

export class OrganizationVerticalService {
  
  /**
   * Get complete vertical configuration for organization
   */
  static async getOrganizationVerticalConfig(organizationId: string): Promise<OrganizationVerticalConfig | null> {
    const { data, error } = await supabase
      .rpc('get_organization_vertical_config', {
        org_id: organizationId
      });
    
    if (error) {
      console.error('Error fetching organization vertical config:', error);
      throw error;
    }
    
    return data?.[0] || null;
  }
  
  /**
   * Set organization account type
   */
  static async setOrganizationAccountType(
    organizationId: string,
    accountType: AccountType,
    verticalConfig?: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({
        account_type: accountType,
        vertical_config: verticalConfig || {}
      })
      .eq('id', organizationId);
    
    if (error) {
      console.error('Error setting organization account type:', error);
      throw error;
    }
  }
  
  /**
   * Duplicate account setup for new organization
   */
  static async duplicateAccountSetup(
    sourceAccountType: AccountType,
    targetOrganizationId: string,
    customizations?: Record<string, unknown>
  ): Promise<void> {
    try {
      // 1. Set organization account type
      await this.setOrganizationAccountType(
        targetOrganizationId,
        sourceAccountType,
        customizations
      );
      
      // 2. Create organization-specific customizations if provided
      if (customizations && Object.keys(customizations).length > 0) {
        await EnterpriseCustomizationService.createCustomization({
          organizationId: targetOrganizationId,
          customizationType: 'template',
          customizationName: 'Initial Setup Customization',
          customizationConfig: customizations,
          isActive: true,
          createdBy: 'system', // Will be updated with actual user ID
          description: 'Initial account setup customizations'
        });
      }
      
      console.log(`Account setup duplicated for organization ${targetOrganizationId} with type ${sourceAccountType}`);
      
    } catch (error) {
      console.error('Error duplicating account setup:', error);
      throw error;
    }
  }
  
  /**
   * Get organization account type
   */
  static async getOrganizationAccountType(organizationId: string): Promise<AccountType | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('account_type')
      .eq('id', organizationId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching organization account type:', error);
      throw error;
    }
    
    return data?.account_type || null;
  }
  
  /**
   * Check if organization has enterprise customizations
   */
  static async hasEnterpriseCustomizations(organizationId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('enterprise_customizations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(1);
    
    if (error) {
      console.error('Error checking enterprise customizations:', error);
      return false;
    }
    
    return (data?.length || 0) > 0;
  }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Initialize default vertical configuration for account type
 */
export async function initializeVerticalConfiguration(
  organizationId: string,
  accountType: AccountType
): Promise<void> {
  try {
    // Set account type for organization
    await OrganizationVerticalService.setOrganizationAccountType(organizationId, accountType);
    
    console.log(`Vertical configuration initialized for organization ${organizationId} with type ${accountType}`);
  } catch (error) {
    console.error('Error initializing vertical configuration:', error);
    throw error;
  }
}

/**
 * Get account setup summary for organization
 */
export async function getAccountSetupSummary(organizationId: string) {
  try {
    const accountType = await OrganizationVerticalService.getOrganizationAccountType(organizationId);
    if (!accountType) return null;
    
    const [config, templates, customFields, hasCustomizations] = await Promise.all([
      VerticalAccountService.getVerticalConfig(accountType),
      VerticalTemplateService.getTemplatesForAccountType(accountType),
      VerticalCustomFieldService.getCustomFields(accountType),
      OrganizationVerticalService.hasEnterpriseCustomizations(organizationId)
    ]);
    
    return {
      accountType,
      config,
      templatesCount: templates.length,
      customFieldsCount: customFields.length,
      hasEnterpriseCustomizations: hasCustomizations
    };
  } catch (error) {
    console.error('Error getting account setup summary:', error);
    throw error;
  }
}