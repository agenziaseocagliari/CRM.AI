// Enhanced AI Prompt Templates System for Guardian AI CRM
// Context-aware prompts with industry-specific optimization

import { diagnosticLogger } from '../mockDiagnosticLogger';

export interface PromptTemplate {
  id: string;
  systemContext: string;
  userContext: string;
  examples: Array<{input: string, output: string}>;
  constraints: string[];
  outputFormat: 'json' | 'text' | 'markdown';
  version: string;
  performance: {
    averageResponseTime?: number;
    accuracyScore?: number;
    costPerRequest?: number;
  };
}

export interface OrganizationContext {
  organizationId: string;
  industry: string;
  targetMarkets: string[];
  brandVoice: 'professional' | 'casual' | 'technical' | 'friendly';
  keyProducts: string[];
  companySize: 'startup' | 'small' | 'medium' | 'enterprise';
  previousConversions?: Array<{
    score: number;
    category: string;
    industry: string;
    characteristics: string[];
    conversionRate: number;
  }>;
}

// Enhanced Lead Scoring Prompt with Dynamic Context
export const createLeadScoringPrompt = (orgContext: OrganizationContext): PromptTemplate => ({
  id: 'lead-scoring-enhanced-v2',
  systemContext: `You are an expert B2B sales analyst for Guardian AI CRM specializing in ${orgContext.industry} sector.

Your expertise includes:
- Lead qualification and conversion prediction for ${orgContext.industry} industry
- ROI analysis for ${orgContext.companySize} companies
- Market analysis for ${orgContext.targetMarkets.join(', ')} segments
- Guardian AI CRM solution optimization

Company Context:
- Industry Focus: ${orgContext.industry}
- Company Size: ${orgContext.companySize}
- Target Markets: ${orgContext.targetMarkets.join(', ')}
- Key Products: ${orgContext.keyProducts.join(', ')}
- Brand Voice: ${orgContext.brandVoice}

${orgContext.previousConversions ? `
Historical Performance Context:
${orgContext.previousConversions.map(conv => 
  `- ${conv.category} leads in ${conv.industry}: ${conv.conversionRate}% conversion rate`
).join('\n')}` : ''}`,

  userContext: `Analyze this lead with industry-specific scoring optimized for ${orgContext.industry}:

SCORING FRAMEWORK (1-100 points):

1. Contact Quality (0-25 points):
   ${orgContext.industry === 'Technology' ? `
   - Technology sector executive email: +20 points
   - Enterprise domain (@company.com): +15 points
   - CTO/CIO/VP Engineering titles: +20 points
   - Complete tech stack info: +10 points` : orgContext.industry === 'Healthcare' ? `
   - Healthcare executive (.org/.health domains): +20 points
   - Medical practice/hospital email: +15 points
   - Chief Medical Officer/Director titles: +20 points
   - HIPAA compliance needs mentioned: +10 points` : `
   - Executive email domain: +15 points
   - Complete contact information: +10 points
   - LinkedIn profile match: +5 points`}

2. Company Profile (0-30 points):
   ${orgContext.companySize === 'enterprise' ? `
   - Enterprise (1000+ employees): +25 points
   - Fortune 500 company: +30 points
   - Multiple locations: +10 points` : `
   - ${orgContext.companySize} business profile: +20 points
   - Growth indicators present: +15 points`}
   
   ${orgContext.industry === 'Technology' ? `
   - SaaS/Technology company: +15 points bonus
   - Existing CRM challenges: +10 points
   - API integration needs: +10 points` : `
   - ${orgContext.industry} sector alignment: +10 points
   - Industry-specific challenges: +10 points`}

3. Engagement Indicators (0-25 points):
   - Direct demo request: +20 points
   - Downloaded ${orgContext.keyProducts[0]} resources: +15 points
   - Multiple touchpoints: +10 points
   - Referral from existing client: +15 points
   - Attended webinar/event: +10 points

4. Guardian AI CRM Fit (0-20 points):
   - Current CRM limitations mentioned: +15 points
   - AI/automation interest expressed: +15 points
   - ${orgContext.companySize === 'enterprise' ? 'Enterprise' : 'Growing'} sales team: +10 points
   - Integration requirements specified: +10 points
   - Budget authority confirmed: +15 points

INDUSTRY-SPECIFIC ADJUSTMENTS:
${orgContext.industry === 'Technology' ? `
- Open source technology usage: +5 points
- DevOps/Agile methodology: +5 points
- API-first approach mentioned: +10 points
- Cloud-native infrastructure: +5 points` : orgContext.industry === 'Healthcare' ? `
- HIPAA compliance requirements: +10 points
- Patient data management needs: +10 points
- Electronic Health Records usage: +5 points
- Telehealth capabilities needed: +5 points` : `
- Industry-specific regulations mentioned: +5 points
- Compliance requirements specified: +5 points`}

${orgContext.previousConversions ? `
HISTORICAL PERFORMANCE INSIGHTS:
Based on previous conversions, prioritize leads with characteristics:
${orgContext.previousConversions
  .filter(conv => conv.conversionRate > 70)
  .map(conv => `- ${conv.characteristics.join(', ')}: High conversion pattern`)
  .join('\n')}` : ''}`,

  examples: [
    {
      input: `Name: Sarah Chen
Email: sarah.chen@techcorp.com  
Company: TechCorp Solutions Inc.
Title: VP of Engineering
Phone: +1-555-0123
Industry: Software Development
Employees: 450
Message: "We're struggling with our current CRM integration with our development workflow. Looking for an AI-powered solution that can handle our technical requirements and API integrations."`,
      output: JSON.stringify({
        score: 88,
        category: 'Hot',
        reasoning: 'VP Engineering at tech company with clear CRM pain points and API integration needs. Perfect fit for Guardian AI CRM technical capabilities.',
        breakdown: {
          contactQuality: 20,
          companyProfile: 25,
          engagement: 18,
          crmFit: 25,
          industryBonus: 10
        },
        nextActions: [
          'Schedule technical demo focusing on API capabilities',
          'Prepare integration documentation',
          'Connect with technical sales engineer'
        ],
        expectedConversionRate: '78%'
      })
    }
  ],

  constraints: [
    'Score must be integer between 1-100',
    'Category must be exactly "Hot" (80-100), "Warm" (50-79), or "Cold" (1-49)',
    'Reasoning must be specific and actionable, max 200 characters',
    'Include breakdown of scoring components',
    'Provide 2-3 specific next actions',
    'Consider industry context and company fit',
    'Factor in historical conversion patterns when available'
  ],

  outputFormat: 'json',
  version: '2.0-enhanced',
  performance: {
    averageResponseTime: 2800, // ms
    accuracyScore: 0.85,
    costPerRequest: 0.0023 // USD
  }
});

// Enhanced Email Generation Prompt
export const createEmailGenerationPrompt = (orgContext: OrganizationContext): PromptTemplate => ({
  id: 'email-generation-enhanced-v2',
  systemContext: `You are an expert copywriter for Guardian AI CRM specializing in ${orgContext.industry} sector communication.

Your expertise:
- ${orgContext.brandVoice} tone email copywriting
- ${orgContext.industry} industry knowledge and pain points
- Guardian AI CRM value proposition articulation
- ${orgContext.companySize} business communication best practices

Brand Guidelines:
- Voice: ${orgContext.brandVoice}
- Industry: ${orgContext.industry}
- Key Products: ${orgContext.keyProducts.join(', ')}
- Target Audience: ${orgContext.targetMarkets.join(', ')}`,

  userContext: `Generate a personalized email for this lead context.

EMAIL REQUIREMENTS:
- Tone: ${orgContext.brandVoice}
- Industry-specific pain points for ${orgContext.industry}
- Guardian AI CRM value proposition aligned with ${orgContext.companySize} needs
- Clear call-to-action appropriate for lead temperature
- Professional formatting with proper structure

INDUSTRY-SPECIFIC VALUE PROPS:
${orgContext.industry === 'Technology' ? `
- API-first CRM architecture
- Developer-friendly integrations
- Scalable cloud infrastructure
- Advanced automation for tech workflows` : orgContext.industry === 'Healthcare' ? `
- HIPAA-compliant patient data management
- Healthcare workflow optimization
- Secure communication features
- Regulatory reporting capabilities` : `
- Industry-specific CRM customization
- Compliance and reporting features
- Workflow automation
- Integration capabilities`}

Include specific mentions of:
- Lead's industry context
- Company size appropriate messaging
- Relevant Guardian AI features
- Next step suggestion`,

  examples: [
    {
      input: `Lead: Sarah Chen, VP Engineering at TechCorp Solutions
Temperature: Hot
Industry: Technology
Pain Points: CRM integration with development workflow
Interest: API-powered solution`,
      output: `Subject: API-First CRM Solution for TechCorp's Development Workflow

Hi Sarah,

I noticed your interest in an AI-powered CRM that integrates seamlessly with development workflows. As VP of Engineering at TechCorp, you understand the challenge of bridging sales and technical operations.

Guardian AI CRM was built specifically for technology companies like yours:

🔧 API-First Architecture
- Native REST/GraphQL APIs for custom integrations
- Webhook support for real-time development workflow sync
- SDK libraries for popular programming languages

🤖 AI-Powered Automation
- Automatically sync lead scoring with your development priorities
- Smart assignment based on technical requirements
- Predictive pipeline analysis using your data patterns

For a team of 450+ at TechCorp, our enterprise features include:
- Multi-environment deployment support
- Advanced permission controls for technical teams
- Custom field mapping for your development metrics

Would you be available for a 30-minute technical demo next week? I can show you exactly how our API integrations would work with your current tech stack.

Best regards,
[Name]
Guardian AI CRM - Technical Solutions

P.S. I can also provide API documentation and sample integration code for your review.`
    }
  ],

  constraints: [
    'Email must be 200-400 words',
    'Include specific industry value propositions',
    'Maintain brand voice consistency',
    'Include clear call-to-action',
    'Personalize based on lead context',
    'Use professional email formatting',
    'Include subject line',
    'No generic placeholder text'
  ],

  outputFormat: 'text',
  version: '2.0-enhanced',
  performance: {
    averageResponseTime: 3200, // ms
    accuracyScore: 0.82,
    costPerRequest: 0.0031 // USD
  }
});

// WhatsApp Message Generation
export const createWhatsAppPrompt = (orgContext: OrganizationContext): PromptTemplate => ({
  id: 'whatsapp-enhanced-v2',
  systemContext: `You are an expert at creating professional WhatsApp messages for ${orgContext.industry} business communication.
  
Your expertise:
- Concise, professional messaging for ${orgContext.brandVoice} brand voice
- ${orgContext.industry} industry communication norms
- Guardian AI CRM value articulation in brief format
- Mobile-optimized messaging for busy executives`,

  userContext: `Create a professional WhatsApp message for this business context.

MESSAGE REQUIREMENTS:
- Maximum 160 characters (SMS-friendly)
- Professional but conversational tone
- Clear value proposition
- Appropriate call-to-action
- Industry-relevant context
- Respect cultural communication norms

FORMATTING GUIDELINES:
- Use emojis sparingly and professionally
- Include company branding subtly
- End with clear next step
- Maintain ${orgContext.brandVoice} voice`,

  examples: [
    {
      input: `Lead: Sarah Chen, VP Engineering
Company: TechCorp Solutions
Interest: API integration demo
Urgency: High`,
      output: `Hi Sarah! 👋 Thanks for your interest in Guardian AI CRM's API integration capabilities. Perfect fit for TechCorp's development workflow needs. Available for a quick 15min demo this week? - Guardian AI Team`
    }
  ],

  constraints: [
    'Maximum 160 characters',
    'Professional tone appropriate for business',
    'Include clear call-to-action',
    'Mention Guardian AI CRM naturally',
    'Respect messaging best practices',
    'No excessive emojis or casual language'
  ],

  outputFormat: 'text',
  version: '2.0-enhanced',
  performance: {
    averageResponseTime: 1800, // ms
    accuracyScore: 0.88,
    costPerRequest: 0.0015 // USD
  }
});

// Dynamic Context Injection
export function injectDynamicContext(
  basePrompt: PromptTemplate,
  leadData: Record<string, unknown>,
  orgContext: OrganizationContext
): PromptTemplate {
  
  // Analyze lead characteristics
  const leadCharacteristics = analyzeLeadCharacteristics(leadData);
  
  // Find similar historical conversions
  const similarConversions = orgContext.previousConversions?.filter(conv => 
    conv.industry === leadData.industry ||
    conv.characteristics.some(char => leadCharacteristics.includes(char))
  ) || [];

  // Inject dynamic context
  const enhancedPrompt = {
    ...basePrompt,
    userContext: basePrompt.userContext + `

DYNAMIC CONTEXT FOR THIS LEAD:
- Lead Characteristics: ${leadCharacteristics.join(', ')}
${similarConversions.length > 0 ? `
- Similar Historical Performance: ${similarConversions.map(conv => 
  `${conv.category} leads with ${conv.characteristics.join(', ')} had ${conv.conversionRate}% conversion`
).join('; ')}` : ''}
- Recommended Approach: ${getRecommendedApproach(leadCharacteristics, orgContext)}`,
    
    performance: {
      ...basePrompt.performance,
      // Adjust expected metrics based on context
      accuracyScore: (basePrompt.performance.accuracyScore || 0.8) + 
        (similarConversions.length > 0 ? 0.1 : 0)
    }
  };

  diagnosticLogger.info('ai', 'Dynamic context injected', {
    leadCharacteristics,
    similarConversions: similarConversions.length,
    promptId: basePrompt.id
  });

  return enhancedPrompt;
}

function analyzeLeadCharacteristics(leadData: Record<string, unknown>): string[] {
  const characteristics: string[] = [];
  
  // Type guard for email
  if (typeof leadData.email === 'string' && leadData.email.includes('@')) {
    const domain = leadData.email.split('@')[1];
    if (domain.includes('.com') && !['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain)) {
      characteristics.push('corporate_email');
    }
  }
  
  // Type guard for title
  if (typeof leadData.title === 'string') {
    const title = leadData.title.toLowerCase();
    if (title.includes('ceo') || title.includes('founder')) characteristics.push('executive');
    if (title.includes('cto') || title.includes('engineering')) characteristics.push('technical');
    if (title.includes('sales') || title.includes('revenue')) characteristics.push('sales_focused');
  }
  
  if (leadData.company) {
    characteristics.push('company_provided');
    // Type guard for employees
    if (typeof leadData.employees === 'number') {
      if (leadData.employees > 100) characteristics.push('medium_enterprise');
      if (leadData.employees > 1000) characteristics.push('large_enterprise');
    }
  }
  
  // Type guard for message
  if (typeof leadData.message === 'string') {
    const message = leadData.message.toLowerCase();
    if (message.includes('api') || message.includes('integration')) characteristics.push('technical_needs');
    if (message.includes('demo') || message.includes('trial')) characteristics.push('ready_to_evaluate');
    if (message.includes('budget') || message.includes('pricing')) characteristics.push('budget_conscious');
  }
  
  return characteristics;
}

function getRecommendedApproach(characteristics: string[], orgContext: OrganizationContext): string {
  if (characteristics.includes('executive') && characteristics.includes('large_enterprise')) {
    return 'Executive-level presentation focusing on ROI and strategic value';
  }
  
  if (characteristics.includes('technical') && characteristics.includes('technical_needs')) {
    return 'Technical deep-dive demo with API documentation and integration examples';
  }
  
  if (characteristics.includes('ready_to_evaluate')) {
    return 'Fast-track to demo with trial setup and immediate next steps';
  }
  
  if (characteristics.includes('budget_conscious')) {
    return 'Value-focused presentation with ROI calculations and pricing flexibility';
  }
  
  return `${orgContext.brandVoice} approach with industry-specific value proposition`;
}

// Template Performance Tracking
export interface TemplateMetrics {
  templateId: string;
  organizationId: string;
  usage: {
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    totalCost: number;
  };
  quality: {
    averageAccuracy: number;
    userFeedbackScore: number;
    conversionRate?: number;
  };
  trends: {
    dailyUsage: Array<{ date: string; count: number }>;
    accuracyTrend: Array<{ date: string; score: number }>;
  };
}

export async function trackTemplatePerformance(
  templateId: string,
  organizationId: string,
  responseTimeMs: number,
  success: boolean,
  cost: number,
  userFeedback?: number
): Promise<void> {
  
  diagnosticLogger.info('ai', 'Template performance tracked', {
    templateId,
    organizationId,
    responseTimeMs,
    success,
    cost,
    userFeedback
  });
  
  // In production, this would update performance metrics in database
  // For now, just log for monitoring
}

// Export enhanced template system
export const EnhancedPromptSystem = {
  createLeadScoringPrompt,
  createEmailGenerationPrompt,
  createWhatsAppPrompt,
  injectDynamicContext,
  trackTemplatePerformance
};

export default EnhancedPromptSystem;