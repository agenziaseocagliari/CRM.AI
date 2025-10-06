// Enhanced FormMaster AI - Real API Integration
// Replaces stub methods with actual Gemini AI processing

import { GoogleGenAI } from '@google/generative-ai';
import { invokeSupabaseFunction } from '../api';

export class RealFormMasterAI {
  private geminiAI: GoogleGenAI;
  
  constructor() {
    this.geminiAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
  }

  async processFormRequest(request: {
    userPrompt: string;
    businessType: string;
    formGoal: string;
    targetAudience: string;
    organizationContext: any;
  }): Promise<{
    formFields: FormField[];
    htmlCode: string;
    cssStyles: string;
    conversionTips: string[];
    mobileOptimizations: string[];
  }> {
    
    const prompt = `
Sei FormMaster AI, esperto nella creazione di form ad alta conversione.

RICHIESTA UTENTE: "${request.userPrompt}"

CONTESTO BUSINESS:
- Tipo di business: ${request.businessType}
- Obiettivo form: ${request.formGoal}
- Target audience: ${request.targetAudience}

COMPITO:
1. Analizza la richiesta e crea un form ottimizzato
2. Genera campi specifici per il business type
3. Ottimizza per mobile e conversione
4. Includi design accattivante per WordPress/Kadence

RISPOSTA IN FORMATO JSON:
{
  "formFields": [
    {
      "name": "campo_nome",
      "type": "text|email|tel|textarea|select",
      "label": "Label accattivante",
      "placeholder": "Placeholder utile",
      "required": true|false,
      "validation": "regex pattern se necessario",
      "helpText": "Testo di aiuto per l'utente"
    }
  ],
  "htmlCode": "HTML completo del form",
  "cssStyles": "CSS per design accattivante e mobile-friendly",
  "conversionTips": ["Suggerimento 1", "Suggerimento 2"],
  "mobileOptimizations": ["Ottimizzazione mobile 1", "Ottimizzazione mobile 2"]
}

ESEMPI CAMPI PER AGENZIA SEO/WEB:
- Nome/Azienda (obbligatorio)
- Email aziendale (validazione email business)
- Telefono (con prefisso internazionale)
- Tipo di sito necessario (select: E-commerce, Corporate, Blog, Landing)
- Budget indicativo (range slider)
- Tempistiche (select: Urgente, 1-2 mesi, 3+ mesi)
- Note/Requisiti specifici (textarea)

DESIGN REQUIREMENTS:
- Color scheme professionale
- Mobile-first approach
- Micro-interactions CSS
- Progress indicator per form multi-step
- CTA accattivante e prominente
`;

    try {
      const model = this.geminiAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse JSON response
      const formData = JSON.parse(response);
      
      // Log for analytics
      await this.logFormGeneration(request, formData);
      
      return formData;
      
    } catch (error) {
      console.error('FormMaster AI Error:', error);
      throw new Error('Impossibile generare il form. Riprova tra poco.');
    }
  }

  private async logFormGeneration(request: any, result: any) {
    // Track usage for analytics
    await invokeSupabaseFunction('track-ai-usage', {
      agent: 'FormMaster',
      action: 'form_generation',
      input_tokens: request.userPrompt.length,
      output_tokens: JSON.stringify(result).length,
      success: true
    });
  }
}

// Form Field Interface
interface FormField {
  name: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'range';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select/radio
  validation?: string; // regex pattern
  helpText?: string;
  step?: number; // for range inputs
  min?: number;
  max?: number;
}