// Real FormMaster AI Implementation - Guardian AI CRM
// Implementazione reale per FormMaster con integrazione Gemini

import { invokeSupabaseFunction } from '../api';

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  conditional?: {
    dependsOn: string;
    value: string;
    operator: 'equals' | 'not_equals' | 'contains';
  };
}

export interface FormConfiguration {
  title: string;
  description: string;
  fields: FormField[];
  styling: {
    theme: 'modern' | 'classic' | 'minimal';
    primaryColor: string;
    borderRadius: number;
  };
  behavior: {
    progressBar: boolean;
    multiStep: boolean;
    autoSave: boolean;
    redirectUrl?: string;
  };
  integrations: {
    wordpress: boolean;
    kadence: boolean;
    webhook?: string;
  };
}

export class RealFormMasterAI {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  // Genera form intelligente basato su business context
  async generateIntelligentForm(prompt: string, businessContext?: any): Promise<FormConfiguration> {
    try {
      // Usa la edge function esistente generate-form-fields
      const response = await invokeSupabaseFunction('generate-form-fields', {
        prompt,
        context: businessContext,
        organization_id: this.organizationId
      });

      const formData = response as any;
      
      // Trasforma la risposta in FormConfiguration
      return this.transformToFormConfiguration(formData, prompt);
    } catch (error) {
      console.error('Errore nella generazione del form:', error);
      throw error;
    }
  }

  private transformToFormConfiguration(geminiResponse: any, originalPrompt: string): FormConfiguration {
    const fields = geminiResponse?.fields || [];
    
    return {
      title: this.extractFormTitle(originalPrompt),
      description: 'Form generato automaticamente da AI',
      fields: fields.map((field: any) => ({
        name: field.name || 'field',
        type: field.type || 'text',
        label: field.label || field.name || 'Campo',
        required: field.required || false,
        placeholder: field.placeholder,
        options: field.options,
        validation: field.validation,
        conditional: field.conditional
      })),
      styling: {
        theme: 'modern',
        primaryColor: '#3B82F6',
        borderRadius: 8
      },
      behavior: {
        progressBar: fields.length > 5,
        multiStep: fields.length > 8,
        autoSave: true
      },
      integrations: {
        wordpress: true,
        kadence: true
      }
    };
  }

  private extractFormTitle(prompt: string): string {
    // Estrae un titolo dal prompt
    if (prompt.toLowerCase().includes('contact')) return 'Modulo di Contatto';
    if (prompt.toLowerCase().includes('lead')) return 'Genera Lead';
    if (prompt.toLowerCase().includes('newsletter')) return 'Iscrizione Newsletter';
    if (prompt.toLowerCase().includes('quote')) return 'Richiedi Preventivo';
    return 'Modulo Personalizzato';
  }

  // Ottimizza form esistente per conversione
  async optimizeFormForConversion(currentForm: FormConfiguration): Promise<FormConfiguration> {
    try {
      const optimizationPrompt = `
Ottimizza questo form per massimizzare la conversione:
${JSON.stringify(currentForm, null, 2)}

Applica best practices per UX e conversion rate optimization.
`;

      const response = await invokeSupabaseFunction('generate-form-fields', {
        prompt: optimizationPrompt,
        context: { currentForm },
        organization_id: this.organizationId
      });

      return this.transformToFormConfiguration(response, 'Form Ottimizzato');
    } catch (error) {
      console.error('Errore nell\'ottimizzazione del form:', error);
      return currentForm; // Ritorna il form originale in caso di errore
    }
  }

  // Genera form per WordPress/Kadence
  async generateWordPressForm(prompt: string): Promise<string> {
    const formConfig = await this.generateIntelligentForm(prompt);
    return this.generateKadenceShortcode(formConfig);
  }

  private generateKadenceShortcode(config: FormConfiguration): string {
    const fields = config.fields.map(field => {
      let shortcode = `[kadence_form_field type="${field.type}" label="${field.label}" name="${field.name}"`;
      
      if (field.required) shortcode += ' required="true"';
      if (field.placeholder) shortcode += ` placeholder="${field.placeholder}"`;
      if (field.options) shortcode += ` options="${field.options.join(',')}"`;
      
      shortcode += ']';
      return shortcode;
    }).join('\n');

    return `[kadence_form title="${config.title}" description="${config.description}"]
${fields}
[/kadence_form]`;
  }
}

// Factory per creare istanze RealFormMasterAI
export const createRealFormMasterAI = (organizationId: string) => {
  return new RealFormMasterAI(organizationId);
};