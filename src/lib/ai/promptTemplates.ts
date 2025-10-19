// File: src/lib/ai/promptTemplates.ts
// Advanced Prompt Templates System for Guardian AI CRM

export interface PromptTemplate {
  systemContext: string;
  userContext: string;
  examples: Array<{
    input: string;
    output: string;
  }>;
  constraints: string[];
  outputFormat: 'json' | 'text' | 'markdown';
  version: string;
  lastUpdated: Date;
}

export interface OrganizationAIContext {
  organizationId: string;
  industry: string;
  targetMarket: string[];
  brandVoice: 'professional' | 'casual' | 'technical' | 'friendly';
  keyProducts: string[];
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  previousConversions?: LeadPattern[];
}

export interface LeadPattern {
  score: number;
  category: 'Hot' | 'Warm' | 'Cold';
  industry: string;
  characteristics: string[];
  conversionRate: number;
}

// Enhanced Lead Scoring Prompt Template
export const leadScoringPrompt: PromptTemplate = {
  systemContext: `You are an expert B2B sales analyst and lead qualification specialist for Guardian AI CRM.

Your expertise includes:
- Advanced lead qualification methodologies (BANT, MEDDIC, CHAMP)
- Industry-specific conversion patterns and buyer behavior analysis
- ROI prediction and sales pipeline optimization
- AI-powered CRM solution positioning for enterprise clients

Your analysis must be data-driven, contextually aware, and optimized for Guardian AI CRM's target market.`,

  userContext: `Analyze this lead using advanced qualification criteria:

SCORING FRAMEWORK:
1. Contact Quality (0-25 points):
   - Business email domain: +15 points
   - Complete contact information: +10 points
   - Generic emails (gmail, yahoo): -5 points

2. Company Profile (0-30 points):
   - Enterprise (1000+ employees): +25 points
   - Mid-market (100-999 employees): +20 points
   - Small business (10-99 employees): +15 points
   - Technology/SaaS industry: +10 points bonus
   - High-growth sectors: +5 points bonus

3. Engagement Indicators (0-25 points):
   - Direct inquiry/demo request: +20 points
   - Downloaded resources: +15 points
   - Multiple touchpoints: +10 points
   - Referral source: +5 points

4. Fit for Guardian AI CRM (0-20 points):
   - Existing CRM challenges mentioned: +15 points
   - AI/automation interest expressed: +10 points
   - Sales team size > 5: +10 points
   - Integration requirements: +5 points

INDUSTRY-SPECIFIC ADJUSTMENTS:
- Technology/Software: +10 points (high fit)
- Professional Services: +8 points
- Healthcare/Legal: +6 points (compliance needs)
- Manufacturing: +5 points
- Retail/E-commerce: +3 points`,

  examples: [
    {
      input: `{
        "name": "Sarah Johnson",
        "email": "sarah.johnson@techcorp.com", 
        "company": "TechCorp Solutions",
        "phone": "+1-555-0123",
        "title": "VP of Sales",
        "industry": "Software",
        "employees": 250,
        "source": "demo_request"
      }`,
      output: `{
        "score": 88,
        "category": "Hot",
        "reasoning": "VP-level tech executive at mid-market software company with direct demo request",
        "breakdown": {
          "contact_quality": 25,
          "company_profile": 30,
          "engagement": 20,
          "crm_fit": 13
        },
        "next_actions": ["Schedule demo within 24h", "Prepare technical integration discussion", "Research current CRM stack"],
        "priority": "immediate"
      }`
    },
    {
      input: `{
        "name": "Mike Chen",
        "email": "mikechen@gmail.com",
        "company": "Local Restaurant Group", 
        "phone": null,
        "title": "Owner",
        "industry": "Food Service",
        "employees": 15,
        "source": "website_visit"
      }`,
      output: `{
        "score": 32,
        "category": "Cold",
        "reasoning": "Small business owner with personal email and low CRM complexity needs",
        "breakdown": {
          "contact_quality": 5,
          "company_profile": 15,
          "engagement": 5,
          "crm_fit": 7
        },
        "next_actions": ["Send educational content", "Qualify budget and timeline", "Assess actual CRM needs"],
        "priority": "low"
      }`
    }
  ],

  constraints: [
    "Score must be integer between 1-100",
    "Category must be exactly 'Hot' (80-100), 'Warm' (50-79), or 'Cold' (1-49)",
    "Reasoning must be concise but specific (50-150 characters)",
    "Include numerical breakdown for transparency",
    "Provide 2-3 specific next actions",
    "Assign priority: 'immediate', 'high', 'medium', 'low'"
  ],

  outputFormat: 'json',
  version: '2.0',
  lastUpdated: new Date('2025-01-19')
};

// Enhanced Email Generation Prompt Template
export const emailGenerationPrompt: PromptTemplate = {
  systemContext: `You are a senior sales copywriter and email marketing specialist for Guardian AI CRM.

Your expertise:
- B2B sales email optimization with proven conversion rates
- Industry-specific messaging and pain point targeting
- Personalization at scale while maintaining authenticity
- CRM and sales automation positioning for enterprise clients

Your emails consistently achieve:
- 35%+ open rates through compelling subject lines
- 8%+ click-through rates via targeted CTAs
- High engagement through value-first approach`,

  userContext: `Create a highly personalized sales email that:

STRUCTURE REQUIREMENTS:
1. Subject Line: Compelling, specific, under 50 characters
2. Opening: Personalized reference to their business/industry
3. Value Proposition: Specific benefit for their situation
4. Social Proof: Relevant case study or metric
5. Clear CTA: Single, specific next step
6. Professional Close: Warm but business-appropriate

TONE GUIDELINES:
- Professional yet conversational
- Value-focused, not product-pushing
- Respectful of their time
- Confident but not aggressive

PERSONALIZATION ELEMENTS:
- Reference their industry/company size
- Address specific pain points
- Use relevant success metrics
- Mention appropriate use cases`,

  examples: [
    {
      input: `{
        "recipientName": "Sarah Johnson",
        "company": "TechCorp Solutions", 
        "title": "VP of Sales",
        "industry": "Software",
        "painPoint": "lead_qualification",
        "brandVoice": "professional"
      }`,
      output: `{
        "subject": "Sarah, how TechCorp could qualify 40% more leads",
        "body": "Hi Sarah,\n\nI noticed TechCorp Solutions has been scaling rapidly in the software space. As VP of Sales, you're likely seeing the challenge many growing tech companies face: distinguishing high-value leads from the noise.\n\nGuardian AI helped CloudTech (similar 250-person software company) increase their lead qualification accuracy by 43% and reduce sales cycle time by 3 weeks.\n\nThe key was implementing AI-powered lead scoring that actually understood their ideal customer profile.\n\nWould you be open to a brief 15-minute call this week to see how this might apply to TechCorp's pipeline?\n\nBest regards,\n[Your Name]\nGuardian AI CRM",
        "cta": "Schedule 15-minute call",
        "personalizedElements": ["company scaling reference", "role-specific pain point", "similar company case study", "specific metrics"]
      }`
    }
  ],

  constraints: [
    "Subject line under 50 characters",
    "Email body 100-200 words maximum",
    "Include exactly one clear CTA",
    "Reference recipient's company and role",
    "Include relevant social proof/metrics",
    "Maintain professional tone throughout"
  ],

  outputFormat: 'json',
  version: '2.0',
  lastUpdated: new Date('2025-01-19')
};

// WhatsApp Message Generation Prompt Template
export const whatsappMessagePrompt: PromptTemplate = {
  systemContext: `You are a conversational messaging expert specializing in WhatsApp business communication.

Your expertise:
- Short-form, mobile-optimized business messaging
- WhatsApp etiquette and best practices
- High engagement rates through conversational tone
- Respectful business outreach via messaging platforms

Key principles:
- Brevity is essential (under 160 characters ideal)
- Casual but professional tone
- Clear value proposition in minimal words
- Respect for personal communication channel`,

  userContext: `Create a WhatsApp business message that:

MESSAGE REQUIREMENTS:
1. Brief introduction (who you are)
2. Clear reason for contact
3. Specific value proposition
4. Simple next step/CTA
5. Easy opt-out option

TONE GUIDELINES:
- Conversational and friendly
- Respectful of their time
- Direct but not pushy
- Mobile-optimized (short sentences)

LENGTH LIMITS:
- Total message: 160 characters or less
- Single clear thought per sentence
- Use emojis sparingly and professionally`,

  examples: [
    {
      input: `{
        "recipientName": "Mike",
        "company": "TechStartup",
        "context": "demo_request",
        "urgency": "medium"
      }`,
      output: `Hi Mike! ðŸ‘‹ 

Thanks for your interest in Guardian AI CRM. 

I can show you how we helped TechStartup competitors increase sales by 30% in 10 minutes.

Free to chat this week?

Reply STOP to opt out anytime.`
    }
  ],

  constraints: [
    "Maximum 160 characters total",
    "Include recipient's name",
    "Mention specific benefit/result",
    "Include clear next step",
    "Add opt-out instruction"
  ],

  outputFormat: 'text',
  version: '2.0',
  lastUpdated: new Date('2025-01-19')
};

// Dynamic Context Injection Functions
export function injectOrganizationContext(
  basePrompt: string,
  orgContext: OrganizationAIContext
): string {
  const contextAddition = `
  
ORGANIZATION-SPECIFIC CONTEXT:
Industry Focus: ${orgContext.industry}
Target Market: ${orgContext.targetMarket.join(', ')}
Company Size: ${orgContext.companySize}
Brand Voice: ${orgContext.brandVoice}
Key Products: ${orgContext.keyProducts.join(', ')}

${orgContext.previousConversions ? `
HISTORICAL CONVERSION PATTERNS:
${orgContext.previousConversions.map(pattern =>
    `- ${pattern.industry}: ${pattern.score}+ score = ${pattern.conversionRate}% conversion`
  ).join('\n')}
` : ''}

Use this context to personalize analysis and content generation for maximum relevance and effectiveness.`;

  return basePrompt + contextAddition;
}

export function getPromptTemplate(
  actionType: string,
  organizationContext?: OrganizationAIContext
): PromptTemplate {
  let template: PromptTemplate;

  switch (actionType) {
    case 'ai_lead_scoring':
      template = leadScoringPrompt;
      break;
    case 'ai_email_generation':
      template = emailGenerationPrompt;
      break;
    case 'ai_whatsapp_generation':
      template = whatsappMessagePrompt;
      break;
    default:
      throw new Error(`No template found for action type: ${actionType}`);
  }

  // Inject organization context if provided
  if (organizationContext) {
    template = {
      ...template,
      userContext: injectOrganizationContext(template.userContext, organizationContext)
    };
  }

  return template;
}

// Prompt Template Validation
export function validatePromptOutput(
  output: unknown,
  template: PromptTemplate
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Check output format
    if (template.outputFormat === 'json') {
      if (typeof output !== 'object') {
        errors.push('Output must be valid JSON object');
      }
    }

    // Validate specific constraints based on action type
    if (template === leadScoringPrompt) {
      const leadOutput = output as { score?: number; category?: string; reasoning?: string };
      if (!leadOutput.score || leadOutput.score < 1 || leadOutput.score > 100) {
        errors.push('Score must be between 1-100');
      }
      if (!['Hot', 'Warm', 'Cold'].includes(leadOutput.category || '')) {
        errors.push('Category must be Hot, Warm, or Cold');
      }
      if (!leadOutput.reasoning || leadOutput.reasoning.length > 150) {
        errors.push('Reasoning must be 1-150 characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error}`]
    };
  }
}

// Template Performance Tracking
export interface TemplateMetrics {
  templateId: string;
  actionType: string;
  version: string;
  usageCount: number;
  averageResponseTime: number;
  successRate: number;
  userFeedbackScore?: number;
  lastUsed: Date;
}

export async function trackTemplateUsage(
  _templateId: string,
  _organizationId: string,
  _responseTimeMs: number,
  _success: boolean
): Promise<void> {
  // Implementation would track template performance
  // for continuous optimization
  // diagnosticLogger.info(`Template ${templateId} used by ${organizationId}: ${responseTimeMs}ms, success: ${success}`);
}

export default {
  getPromptTemplate,
  injectOrganizationContext,
  validatePromptOutput,
  trackTemplateUsage,
  leadScoringPrompt,
  emailGenerationPrompt,
  whatsappMessagePrompt
};
