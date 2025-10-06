// Knowledge Base System for AI Agents
// Enables AI agents to learn company-specific information

import { supabase } from '../supabaseClient';

export interface CompanyKnowledgeBase {
  organizationId: string;
  companyInfo: {
    name: string;
    industry: string;
    targetAudience: string[];
    brandVoice: 'professional' | 'casual' | 'technical' | 'friendly';
    uniqueSellingPoints: string[];
    competitors: string[];
  };
  services: Service[];
  products: Product[];
  faqDatabase: FAQ[];
  salesProcesses: SalesProcess[];
  pricingStructure: PricingInfo[];
  customerProfiles: CustomerProfile[];
  conversationTemplates: ConversationTemplate[];
  documentLibrary: Document[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  features: string[];
  benefits: string[];
  targetCustomer: string;
  pricing: string;
  deliveryTime: string;
  requirements: string[];
  commonQuestions: string[];
  salesTalkingPoints: string[];
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  linkedServices: string[];
}

interface ConversationTemplate {
  id: string;
  scenario: 'initial_contact' | 'follow_up' | 'objection_handling' | 'closing';
  trigger: string;
  responseTemplate: string;
  variables: string[];
  nextActions: string[];
}

export class KnowledgeBaseManager {
  
  async createKnowledgeBase(organizationId: string): Promise<CompanyKnowledgeBase> {
    // Initialize empty knowledge base
    const kb: CompanyKnowledgeBase = {
      organizationId,
      companyInfo: {
        name: '',
        industry: '',
        targetAudience: [],
        brandVoice: 'professional',
        uniqueSellingPoints: [],
        competitors: []
      },
      services: [],
      products: [],
      faqDatabase: [],
      salesProcesses: [],
      pricingStructure: [],
      customerProfiles: [],
      conversationTemplates: [],
      documentLibrary: []
    };
    
    // Save to database
    await this.saveKnowledgeBase(kb);
    return kb;
  }

  async uploadDocument(organizationId: string, file: File, category: string): Promise<void> {
    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('knowledge-base')
        .upload(`${organizationId}/${file.name}`, file);
      
      if (error) throw error;

      // Process document content based on type
      let extractedContent = '';
      if (file.type === 'application/pdf') {
        extractedContent = await this.extractPDFContent(file);
      } else if (file.type.includes('text')) {
        extractedContent = await file.text();
      }

      // Use AI to structure the content
      const structuredData = await this.processDocumentWithAI(extractedContent, category);
      
      // Update knowledge base
      await this.updateKnowledgeBaseFromDocument(organizationId, structuredData, category);
      
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  async scrapeCompanyWebsite(organizationId: string, websiteUrl: string): Promise<void> {
    try {
      // Call edge function to scrape website
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { 
          organizationId,
          url: websiteUrl,
          sections: ['about', 'services', 'products', 'contact', 'pricing', 'faq']
        }
      });

      if (error) throw error;

      // Process scraped content with AI to extract structured information
      const structuredData = await this.processWebsiteDataWithAI(data.content);
      
      // Update knowledge base
      await this.updateKnowledgeBaseFromWebsite(organizationId, structuredData);
      
    } catch (error) {
      console.error('Website scraping error:', error);
      throw error;
    }
  }

  async getKnowledgeForAgent(organizationId: string, agentType: string): Promise<string> {
    const kb = await this.getKnowledgeBase(organizationId);
    
    // Customize knowledge based on agent type
    switch (agentType) {
      case 'WhatsAppButler':
        return this.formatWhatsAppKnowledge(kb);
      case 'EmailGenius':
        return this.formatEmailKnowledge(kb);
      case 'FormMaster':
        return this.formatFormKnowledge(kb);
      default:
        return this.formatGeneralKnowledge(kb);
    }
  }

  private formatWhatsAppKnowledge(kb: CompanyKnowledgeBase): string {
    return `
INFORMAZIONI AZIENDA:
${kb.companyInfo.name} - ${kb.companyInfo.industry}
Target: ${kb.companyInfo.targetAudience.join(', ')}
Brand Voice: ${kb.companyInfo.brandVoice}

SERVIZI PRINCIPALI:
${kb.services.map(s => `- ${s.name}: ${s.description} (€${s.pricing})`).join('\n')}

FAQ PIÙ COMUNI:
${kb.faqDatabase.filter(f => f.priority === 'high').map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

OBIETTIVO: Rispondere alle domande dei clienti e guidarli verso la prenotazione di un appuntamento.
STILE: ${kb.companyInfo.brandVoice}, utile, persuasivo ma non invadente.

TEMPLATE APPUNTAMENTO:
"Perfetto! Ti posso proporre un appuntamento gratuito di 30 minuti per discutere nel dettaglio delle tue esigenze. Quando saresti disponibile? Mattina o pomeriggio?"
`;
  }

  private formatEmailKnowledge(kb: CompanyKnowledgeBase): string {
    return `
BRAND GUIDELINES:
Voice: ${kb.companyInfo.brandVoice}
USP: ${kb.companyInfo.uniqueSellingPoints.join(', ')}

SERVIZI PER EMAIL MARKETING:
${kb.services.map(s => `${s.name}: ${s.benefits.join(', ')}`).join('\n')}

CUSTOMER PAIN POINTS:
${kb.customerProfiles.map(c => c.challenges?.join(', ')).join('\n')}

CALL-TO-ACTION EXAMPLES:
- "Richiedi consulenza gratuita"
- "Scopri come possiamo aiutarti"
- "Prenota una chiamata di 15 minuti"
`;
  }

  private async processDocumentWithAI(content: string, category: string): Promise<any> {
    // Use AI to extract structured information from document
    // This would call Gemini/Claude to parse and structure the content
    // Return structured data based on category (services, faq, pricing, etc.)
  }

  private async saveKnowledgeBase(kb: CompanyKnowledgeBase): Promise<void> {
    const { error } = await supabase
      .from('organization_knowledge_base')
      .upsert({
        organization_id: kb.organizationId,
        knowledge_data: kb,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
  }

  private async getKnowledgeBase(organizationId: string): Promise<CompanyKnowledgeBase> {
    const { data, error } = await supabase
      .from('organization_knowledge_base')
      .select('knowledge_data')
      .eq('organization_id', organizationId)
      .single();
    
    if (error) throw error;
    return data.knowledge_data;
  }

  private async extractPDFContent(file: File): Promise<string> {
    // Implement PDF text extraction
    // Could use PDF.js or similar library
    return '';
  }
}

export const knowledgeBaseManager = new KnowledgeBaseManager();