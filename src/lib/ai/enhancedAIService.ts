// File: src/lib/ai/enhancedAIService.ts
// Enhanced AI Service with Prompt Templates, Caching, and Monitoring

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

import { withRateLimit } from '../rateLimiter';

import { getCachedAIResult, setCachedAIResult } from './aiCacheManager';
import { getPromptTemplate, validatePromptOutput, trackTemplateUsage, type OrganizationAIContext } from './promptTemplates';

import { diagnosticLogger } from '../mockDiagnosticLogger';
export interface AIRequestConfig {
  organizationId: string;
  actionType: string;
  input: unknown;
  model?: string;
  priority?: 'critical' | 'standard' | 'background';
  bypassCache?: boolean;
  organizationContext?: OrganizationAIContext;
}

export interface AIResponse<T = unknown> {
  result: T;
  success: boolean;
  cached: boolean;
  cacheType?: 'exact' | 'semantic' | 'template';
  responseTimeMs: number;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  metadata: {
    model: string;
    promptVersion: string;
    organizationId: string;
    actionType: string;
    requestId: string;
  };
  error?: string;
}

interface PromptTemplate {
  systemContext: string;
  userContext: string;
  examples: Array<{ input: string; output: string }>;
  constraints: string[];
}

export interface AIMetrics {
  requestId: string;
  organizationId: string;
  actionType: string;
  model: string;
  responseTimeMs: number;
  success: boolean;
  cached: boolean;
  cacheType?: string;
  tokenUsage?: number;
  cost?: number;
  errorType?: string;
  timestamp: Date;
}

class EnhancedAIService {
  private ai: GoogleGenAI;
  private readonly DEFAULT_MODEL = 'gemini-2.5-flash';
  private readonly MODEL_COSTS = {
    'gemini-2.5-flash': { input: 0.000125, output: 0.000375 }, // per 1K tokens
    'gemini-2.0-flash': { input: 0.000075, output: 0.00015 }
  };

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processAIRequest<T = unknown>(config: AIRequestConfig): Promise<AIResponse<T>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const model = config.model || this.DEFAULT_MODEL;

    try {
      // 1. Check cache first (unless bypassed)
      if (!config.bypassCache) {
        const cached = await getCachedAIResult(
          JSON.stringify(config.input),
          config.actionType,
          config.organizationId
        );

        if (cached) {
          const responseTime = Date.now() - startTime;
          await this.trackMetrics({
            requestId,
            organizationId: config.organizationId,
            actionType: config.actionType,
            model,
            responseTimeMs: responseTime,
            success: true,
            cached: true,
            cacheType: 'exact', // We'd get this from cache response in real implementation
            timestamp: new Date()
          });

          return {
            result: cached as T,
            success: true,
            cached: true,
            cacheType: 'exact',
            responseTimeMs: responseTime,
            metadata: {
              model,
              promptVersion: '2.0',
              organizationId: config.organizationId,
              actionType: config.actionType,
              requestId
            }
          };
        }
      }

      // 2. Apply rate limiting
      const aiResult = await withRateLimit(
        config.organizationId,
        config.actionType,
        `ai_${config.actionType}`,
        async () => {
          // 3. Get enhanced prompt template
          const template = getPromptTemplate(config.actionType, config.organizationContext);
          
          // 4. Build final prompt
          const prompt = this.buildFinalPrompt(template, config.input);
          
          // 5. Make AI request
          const response = await this.ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: this.getTemperatureForAction(config.actionType),
              maxOutputTokens: this.getMaxTokensForAction(config.actionType),
              topP: 0.8,
              topK: 40,
              ...(template.outputFormat === 'json' && {
                responseMimeType: 'application/json',
                responseSchema: this.getSchemaForAction(config.actionType)
              })
            }
          });

          return { response, template };
        }
      );

      const { response, template } = aiResult;
      const aiResponseTime = Date.now() - startTime;

      // 6. Parse and validate response
      let result: T;
      try {
        const responseText = response.text || '';
        result = template.outputFormat === 'json' 
          ? JSON.parse(responseText.trim())
          : responseText.trim() as T;

        // Validate output
        const validation = validatePromptOutput(result, template);
        if (!validation.isValid) {
          diagnosticLogger.warn(`[EnhancedAI] Validation failed for ${config.actionType}:`, validation.errors);
          // Continue with result but log the issue
        }

      } catch (parseError) {
        throw new Error(`Failed to parse AI response: ${parseError}`);
      }

      // 7. Calculate token usage and cost
      const tokenUsage = this.estimateTokenUsage(response);
      const cost = this.calculateCost(model, tokenUsage);

      // 8. Cache the result
      if (!config.bypassCache) {
        await setCachedAIResult(
          JSON.stringify(config.input),
          result,
          config.actionType,
          config.organizationId,
          {
            model,
            promptVersion: template.version,
            responseTime: aiResponseTime,
            tokenCount: tokenUsage.total
          }
        );
      }

      // 9. Track metrics
      await this.trackMetrics({
        requestId,
        organizationId: config.organizationId,
        actionType: config.actionType,
        model,
        responseTimeMs: aiResponseTime,
        success: true,
        cached: false,
        tokenUsage: tokenUsage.total,
        cost,
        timestamp: new Date()
      });

      // 10. Track template usage
      await trackTemplateUsage(
        `${config.actionType}_${template.version}`,
        config.organizationId,
        aiResponseTime,
        true
      );

      return {
        result,
        success: true,
        cached: false,
        responseTimeMs: aiResponseTime,
        tokenUsage,
        metadata: {
          model,
          promptVersion: template.version,
          organizationId: config.organizationId,
          actionType: config.actionType,
          requestId
        }
      };

    } catch (error: unknown) {
      const errorTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown AI processing error';
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      
      // Track error metrics
      await this.trackMetrics({
        requestId,
        organizationId: config.organizationId,
        actionType: config.actionType,
        model,
        responseTimeMs: errorTime,
        success: false,
        cached: false,
        errorType,
        timestamp: new Date()
      });

      return {
        result: null as T,
        success: false,
        cached: false,
        responseTimeMs: errorTime,
        metadata: {
          model,
          promptVersion: '2.0',
          organizationId: config.organizationId,
          actionType: config.actionType,
          requestId
        },
        error: errorMessage
      };
    }
  }

  // Specialized methods for each AI action type
  async scoreContactLead(
    contact: Record<string, unknown>,
    organizationId: string,
    organizationContext?: OrganizationAIContext,
    priority: 'critical' | 'standard' | 'background' = 'critical'
  ): Promise<AIResponse<{
    score: number;
    category: 'Hot' | 'Warm' | 'Cold';
    reasoning: string;
    breakdown: Record<string, number>;
    next_actions: string[];
    priority: string;
  }>> {
    return this.processAIRequest({
      organizationId,
      actionType: 'ai_lead_scoring',
      input: contact,
      priority,
      organizationContext
    });
  }

  async generateEmailContent(
    emailContext: Record<string, unknown>,
    organizationId: string,
    organizationContext?: OrganizationAIContext,
    priority: 'critical' | 'standard' | 'background' = 'standard'
  ): Promise<AIResponse<{
    subject: string;
    body: string;
    cta: string;
    personalizedElements: string[];
  }>> {
    return this.processAIRequest({
      organizationId,
      actionType: 'ai_email_generation',
      input: emailContext,
      priority,
      organizationContext
    });
  }

  async generateWhatsAppMessage(
    messageContext: Record<string, unknown>,
    organizationId: string,
    organizationContext?: OrganizationAIContext,
    priority: 'critical' | 'standard' | 'background' = 'standard'
  ): Promise<AIResponse<string>> {
    return this.processAIRequest({
      organizationId,
      actionType: 'ai_whatsapp_generation',
      input: messageContext,
      priority,
      organizationContext
    });
  }

  // Utility methods
  private buildFinalPrompt(template: PromptTemplate, input: unknown): string {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    
    return `${template.systemContext}

${template.userContext}

INPUT DATA:
${inputStr}

${template.examples.length > 0 ? `
EXAMPLES:
${template.examples.map((ex, i: number) => 
  `Example ${i + 1}:
  Input: ${ex.input}
  Output: ${ex.output}`
).join('\n\n')}
` : ''}

CONSTRAINTS:
${template.constraints.map((c: string) => `- ${c}`).join('\n')}

Please analyze the input data and provide your response in the specified format.`;
  }

  private getTemperatureForAction(actionType: string): number {
    switch (actionType) {
      case 'ai_lead_scoring': return 0.1; // Low temperature for consistent scoring
      case 'ai_email_generation': return 0.7; // Higher for creative content
      case 'ai_whatsapp_generation': return 0.6; // Moderate creativity
      default: return 0.5;
    }
  }

  private getMaxTokensForAction(actionType: string): number {
    switch (actionType) {
      case 'ai_lead_scoring': return 500; // JSON response
      case 'ai_email_generation': return 800; // Email content
      case 'ai_whatsapp_generation': return 200; // Short message
      default: return 500;
    }
  }

  private getSchemaForAction(actionType: string): Record<string, unknown> | undefined {
    switch (actionType) {
      case 'ai_lead_scoring':
        return {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 1, maximum: 100 },
            category: { type: 'string', enum: ['Hot', 'Warm', 'Cold'] },
            reasoning: { type: 'string', maxLength: 150 },
            breakdown: { type: 'object' },
            next_actions: { type: 'array', items: { type: 'string' } },
            priority: { type: 'string' }
          },
          required: ['score', 'category', 'reasoning']
        };
      
      case 'ai_email_generation':
        return {
          type: 'object',
          properties: {
            subject: { type: 'string', maxLength: 50 },
            body: { type: 'string', maxLength: 1000 },
            cta: { type: 'string' },
            personalizedElements: { type: 'array', items: { type: 'string' } }
          },
          required: ['subject', 'body', 'cta']
        };
      
      default:
        return undefined;
    }
  }

  private estimateTokenUsage(response: GenerateContentResponse): {
    input: number;
    output: number;
    total: number;
  } {
    // Rough estimation - in production, use actual token counting
    const responseText = response.text || '';
    const outputTokens = Math.ceil(responseText.length / 4);
    const inputTokens = Math.ceil(outputTokens * 0.7); // Estimate based on typical ratio
    
    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    };
  }

  private calculateCost(model: string, tokenUsage: { input: number; output: number }): number {
    const modelCost = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS];
    if (!modelCost) {return 0;}

    const inputCost = (tokenUsage.input / 1000) * modelCost.input;
    const outputCost = (tokenUsage.output / 1000) * modelCost.output;
    
    return inputCost + outputCost;
  }

  private async trackMetrics(metrics: AIMetrics): Promise<void> {
    try {
      // In a real implementation, this would send to your metrics collection system
      diagnosticLogger.info('[EnhancedAI] Metrics:', {
        requestId: metrics.requestId,
        organizationId: metrics.organizationId,
        actionType: metrics.actionType,
        responseTime: `${metrics.responseTimeMs}ms`,
        success: metrics.success,
        cached: metrics.cached,
        cost: metrics.cost ? `$${metrics.cost.toFixed(6)}` : undefined
      });

      // Store in database for analysis
      // await supabase.from('ai_metrics').insert(metrics);
      
    } catch (error) {
      diagnosticLogger.warn('[EnhancedAI] Failed to track metrics:', error);
    }
  }

  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods for monitoring
  async getAIMetrics(
    _organizationId: string,
    _timeRangeHours: number = 24
  ): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
    totalCost: number;
    requestsByAction: Record<string, number>;
  }> {
    // Implementation would query metrics database
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      totalCost: 0,
      requestsByAction: {}
    };
  }

  async checkAIHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unavailable';
    responseTime: number;
    details: Record<string, unknown>;
  }> {
    const start = Date.now();
    
    try {
      // Simple health check
      const response = await this.ai.models.generateContent({
        model: this.DEFAULT_MODEL,
        contents: 'Health check: respond with "OK"',
        config: {
          maxOutputTokens: 10,
          temperature: 0
        }
      });

      const responseTime = Date.now() - start;
      const responseText = response.text || '';
      const isHealthy = responseText.trim().toLowerCase().includes('ok');

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime,
        details: {
          model: this.DEFAULT_MODEL,
          response: responseText.trim()
        }
      };

    } catch (error: unknown) {
      return {
        status: 'unavailable',
        responseTime: Date.now() - start,
        details: {
          error: error instanceof Error ? error.message : String(error),
          model: this.DEFAULT_MODEL
        }
      };
    }
  }
}

// Singleton instance
export const enhancedAIService = new EnhancedAIService();

// Convenience functions for backward compatibility
export async function scoreContactLead(
  contact: Record<string, unknown>,
  organizationId: string,
  organizationContext?: OrganizationAIContext
) {
  return enhancedAIService.scoreContactLead(contact, organizationId, organizationContext);
}

export async function generateEmailContent(
  emailContext: Record<string, unknown>,
  organizationId: string,
  organizationContext?: OrganizationAIContext
) {
  return enhancedAIService.generateEmailContent(emailContext, organizationId, organizationContext);
}

export async function generateWhatsAppMessage(
  messageContext: Record<string, unknown>,
  organizationId: string,
  organizationContext?: OrganizationAIContext
) {
  return enhancedAIService.generateWhatsAppMessage(messageContext, organizationId, organizationContext);
}

export default enhancedAIService;
