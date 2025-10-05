/**
 * GUARDIAN AI CRM - ACCOUNT DUPLICATION SERVICE
 * Sistema automatico di duplicazione template account durante registrazione
 * Data: 2025-10-05
 */

import { supabase } from '../supabase';
import { 
  AccountType, 
  VerticalTemplate,
  EnterpriseCustomization
} from './types';

interface CustomField {
  field_name: string;
  field_type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'multiselect' | 'date' | 'boolean';
  field_label: string;
  field_options?: Record<string, any>;
  validation_rules?: Record<string, any>;
  display_order?: number;
  is_required?: boolean;
}

export interface AccountDuplicationOptions {
  organizationId: string;
  accountType: AccountType;
  templateId?: string;
  customizations?: Partial<EnterpriseCustomization>;
  userId: string;
}

export interface DuplicationResult {
  success: boolean;
  organizationId: string;
  templatesApplied: string[];
  customFieldsCreated: number;
  error?: string;
}

export class AccountDuplicationService {
  /**
   * Duplica template account durante registrazione cliente
   */
  static async duplicateAccountTemplate(options: AccountDuplicationOptions): Promise<DuplicationResult> {
    const { organizationId, accountType, templateId, customizations, userId } = options;
    
    try {
      // 1. Recupera template verticale specifico o default
      const template = await this.getVerticalTemplate(accountType, templateId);
      if (!template) {
        throw new Error(`Template not found for account type: ${accountType}`);
      }

      // 2. Applica configurazione verticale all'organizzazione
      await this.applyVerticalConfiguration(organizationId, accountType, template);

      // 3. Crea custom fields specifici per il verticale
      const customFieldsCount = await this.createVerticalCustomFields(
        organizationId, 
        accountType, 
(template as any).custom_fields || []
      );

      // 4. Applica customizzazioni enterprise se fornite
      if (customizations) {
        await this.applyEnterpriseCustomizations(organizationId, customizations);
      }

      // 5. Duplica dati sample se richiesto dal template
      if ((template as any).include_sample_data) {
        await this.duplicateSampleData(organizationId, accountType, userId);
      }

      // 6. Configura automazioni default
      await this.setupDefaultAutomations(organizationId, accountType);

      // 7. Personalizza interfaccia utente
      await this.customizeUserInterface(organizationId, accountType, template);

      return {
        success: true,
        organizationId,
        templatesApplied: [template.id],
        customFieldsCreated: customFieldsCount
      };

    } catch (error) {
      console.error('Account duplication error:', error);
      return {
        success: false,
        organizationId,
        templatesApplied: [],
        customFieldsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Recupera template verticale specifico
   */
  private static async getVerticalTemplate(
    accountType: AccountType, 
    templateId?: string
  ): Promise<VerticalTemplate | null> {
    let query = supabase
      .from('vertical_templates')
      .select('*')
      .eq('account_type', accountType);

    if (templateId) {
      query = query.eq('id', templateId);
    } else {
      query = query.eq('is_default', true);
    }

    const { data, error } = await query.single();
    
    if (error) {
      console.error('Error fetching vertical template:', error);
      return null;
    }

    return data;
  }

  /**
   * Applica configurazione verticale all'organizzazione
   */
  private static async applyVerticalConfiguration(
    organizationId: string, 
    accountType: AccountType, 
    template: VerticalTemplate
  ): Promise<void> {
    const { error } = await supabase
      .from('vertical_account_configs')
      .upsert({
        organization_id: organizationId,
        account_type: accountType,
        config: (template as any).configuration || {},
        terminology_overrides: (template as any).terminology_overrides || {},
        ui_customizations: (template as any).ui_customizations || {},
        workflow_configs: (template as any).workflow_configs || {},
        notification_settings: (template as any).notification_settings || {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to apply vertical configuration: ${error.message}`);
    }
  }

  /**
   * Crea custom fields specifici per il verticale
   */
  private static async createVerticalCustomFields(
    organizationId: string, 
    accountType: AccountType, 
    customFields: CustomField[]
  ): Promise<number> {
    if (!customFields.length) return 0;

    const fieldsToInsert = customFields.map(field => ({
      organization_id: organizationId,
      account_type: accountType,
      field_name: field.field_name,
      field_type: field.field_type,
      field_label: field.field_label,
      field_options: field.field_options || {},
      validation_rules: field.validation_rules || {},
      display_order: field.display_order || 0,
      is_required: field.is_required || false,
      is_active: true,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('vertical_custom_fields')
      .insert(fieldsToInsert);

    if (error) {
      throw new Error(`Failed to create custom fields: ${error.message}`);
    }

    return fieldsToInsert.length;
  }

  /**
   * Applica customizzazioni enterprise
   */
  private static async applyEnterpriseCustomizations(
    organizationId: string, 
    customizations: Partial<EnterpriseCustomization>
  ): Promise<void> {
    const { error } = await supabase
      .from('enterprise_customizations')
      .upsert({
        organization_id: organizationId,
        ...customizations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to apply enterprise customizations: ${error.message}`);
    }
  }

  /**
   * Duplica dati sample per iniziare velocemente
   */
  private static async duplicateSampleData(
    organizationId: string, 
    accountType: AccountType, 
    userId: string
  ): Promise<void> {
    try {
      // Sample Contacts
      await this.createSampleContacts(organizationId, accountType, userId);
      
      // Sample Deals/Policies/Campaigns
      await this.createSampleBusinessData(organizationId, accountType, userId);
      
      // Sample Tasks
      await this.createSampleTasks(organizationId, userId);

    } catch (error) {
      console.error('Error creating sample data:', error);
      // Non-blocking error
    }
  }

  /**
   * Crea contatti sample basati sul verticale
   */
  private static async createSampleContacts(
    organizationId: string, 
    accountType: AccountType, 
    userId: string
  ): Promise<void> {
    const sampleContacts = this.getSampleContactsForVertical(accountType);
    
    const contactsToInsert = sampleContacts.map((contact, index) => ({
      organization_id: organizationId,
      created_by: userId,
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      position: contact.position,
      tags: contact.tags,
      lead_status: 'qualified',
      lead_score: 70 + (index * 5),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    await supabase.from('contacts').insert(contactsToInsert);
  }

  /**
   * Genera contatti sample specifici per verticale
   */
  private static getSampleContactsForVertical(accountType: AccountType) {
    const baseContacts = [
      {
        firstName: 'Mario',
        lastName: 'Rossi',
        email: 'mario.rossi@email.com',
        phone: '+39 333 1234567',
        company: 'Rossi SRL',
        position: 'Titolare',
        tags: ['prospect', 'priority']
      },
      {
        firstName: 'Laura',
        lastName: 'Bianchi',
        email: 'laura.bianchi@email.com',
        phone: '+39 347 2345678',
        company: 'Bianchi & Associates',
        position: 'CEO',
        tags: ['client', 'vip']
      }
    ];

    // Personalizza per verticale specifico
    if (accountType === 'insurance_agency') {
      return [
        ...baseContacts,
        {
          firstName: 'Giuseppe',
          lastName: 'Verdi',
          email: 'giuseppe.verdi@email.com',
          phone: '+39 339 3456789',
          company: 'Verdi Costruzioni',
          position: 'Direttore',
          tags: ['polizza-auto', 'rinnovo-marzo']
        }
      ];
    }

    if (accountType === 'marketing_agency') {
      return [
        ...baseContacts,
        {
          firstName: 'Elena',
          lastName: 'Conti',
          email: 'elena.conti@email.com',
          phone: '+39 328 4567890',
          company: 'Conti Fashion',
          position: 'Marketing Manager',
          tags: ['social-media', 'campaign-active']
        }
      ];
    }

    return baseContacts;
  }

  /**
   * Crea dati business sample (deals, policies, campaigns)
   */
  private static async createSampleBusinessData(
    organizationId: string, 
    accountType: AccountType, 
    userId: string
  ): Promise<void> {
    // Logica specifica per verticale per creare sample deals, policies, etc.
    const sampleDeals = [
      {
        organization_id: organizationId,
        created_by: userId,
        title: `Sample ${accountType === 'insurance_agency' ? 'Policy' : 'Campaign'} 1`,
        amount: accountType === 'insurance_agency' ? 1200 : 5000,
        stage: 'proposal',
        probability: 75,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    await supabase.from('deals').insert(sampleDeals);
  }

  /**
   * Crea task sample per orientare l'utente
   */
  private static async createSampleTasks(organizationId: string, userId: string): Promise<void> {
    const sampleTasks = [
      {
        organization_id: organizationId,
        created_by: userId,
        assigned_to: userId,
        title: 'Benvenuto in Guardian AI - Completa il setup',
        description: 'Esplora le funzionalità principali e personalizza il tuo workspace',
        priority: 'high',
        status: 'todo',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        organization_id: organizationId,
        created_by: userId,
        assigned_to: userId,
        title: 'Importa i tuoi contatti esistenti',
        description: 'Carica la tua lista contatti per iniziare subito',
        priority: 'medium',
        status: 'todo',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }
    ];

    await supabase.from('tasks').insert(sampleTasks);
  }

  /**
   * Configura automazioni default per il verticale
   */
  private static async setupDefaultAutomations(
    organizationId: string, 
    accountType: AccountType
  ): Promise<void> {
    const automations = this.getDefaultAutomationsForVertical(accountType);
    
    if (automations.length > 0) {
      const automationsToInsert = automations.map(automation => ({
        organization_id: organizationId,
        name: automation.name,
        description: automation.description,
        trigger_type: automation.trigger,
        conditions: automation.conditions,
        actions: automation.actions,
        is_active: true,
        created_at: new Date().toISOString()
      }));

      await supabase.from('automations').insert(automationsToInsert);
    }
  }

  /**
   * Genera automazioni default per verticale
   */
  private static getDefaultAutomationsForVertical(accountType: AccountType) {
    if (accountType === 'insurance_agency') {
      return [
        {
          name: 'Alert Scadenza Polizza',
          description: 'Invia reminder 30 giorni prima della scadenza',
          trigger: 'date_based',
          conditions: { days_before_expiry: 30 },
          actions: { send_email: true, create_task: true }
        }
      ];
    }

    if (accountType === 'marketing_agency') {
      return [
        {
          name: 'Follow-up Nuovi Lead',
          description: 'Invia email di benvenuto ai nuovi contatti',
          trigger: 'contact_created',
          conditions: { lead_source: 'website' },
          actions: { send_welcome_email: true, assign_to_team: true }
        }
      ];
    }

    return [];
  }

  /**
   * Personalizza interfaccia utente per il verticale
   */
  private static async customizeUserInterface(
    organizationId: string, 
    accountType: AccountType, 
    template: VerticalTemplate
  ): Promise<void> {
    if (!(template as any).ui_customizations) return;

    // Applica customizzazioni UI specifiche del template
    const { error } = await supabase
      .from('ui_customizations')
      .upsert({
        organization_id: organizationId,
        theme_colors: (template as any).ui_customizations.theme_colors || {},
        dashboard_layout: (template as any).ui_customizations.dashboard_layout || {},
        menu_structure: (template as any).ui_customizations.menu_structure || {},
        field_visibility: (template as any).ui_customizations.field_visibility || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to apply UI customizations: ${error.message}`);
    }
  }

  /**
   * Verifica stato duplicazione account
   */
  static async getDuplicationStatus(organizationId: string): Promise<{
    isConfigured: boolean;
    accountType?: AccountType;
    templatesApplied: number;
    customFieldsCount: number;
  }> {
    try {
      // Check vertical configuration
      const { data: config } = await supabase
        .from('vertical_account_configs')
        .select('account_type')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

      // Count templates applied
      const { count: templatesCount } = await supabase
        .from('vertical_templates')
        .select('*', { count: 'exact', head: true })
        .eq('account_type', config?.account_type || '');

      // Count custom fields
      const { count: fieldsCount } = await supabase
        .from('vertical_custom_fields')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      return {
        isConfigured: !!config,
        accountType: config?.account_type,
        templatesApplied: templatesCount || 0,
        customFieldsCount: fieldsCount || 0
      };

    } catch (error) {
      console.error('Error checking duplication status:', error);
      return {
        isConfigured: false,
        templatesApplied: 0,
        customFieldsCount: 0
      };
    }
  }
}

export default AccountDuplicationService;