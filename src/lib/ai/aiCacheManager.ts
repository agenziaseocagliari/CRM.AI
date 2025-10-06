// File: src/lib/ai/aiCacheManager.ts
// Multi-Layer AI Cache System for Guardian AI CRM

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { diagnosticLogger } from '../mockDiagnosticLogger';
// Note: This would typically use Redis in production
// For this implementation, we'll use a hybrid approach with in-memory + Supabase storage

export interface CacheEntry {
  key: string;
  result: unknown;
  timestamp: number;
  ttl: number; // Time to live in seconds
  actionType: string;
  organizationId: string;
  inputHash: string;
  metadata?: {
    model: string;
    promptVersion: string;
    responseTime: number;
    tokenCount?: number;
  };
}

export interface SemanticCacheEntry {
  id: string;
  inputHash: string;
  inputText: string;
  embedding: number[];
  result: unknown;
  actionType: string;
  organizationId: string;
  similarity_threshold: number;
  usage_count: number;
  last_used: Date;
  created_at: Date;
}

export interface TemplateCacheEntry {
  templateId: string;
  templateContent: string;
  variables: string[];
  organizationId: string;
  industry?: string;
  lastUpdated: Date;
  usageCount: number;
}

class AICache {
  private exactCache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly SIMILARITY_THRESHOLD = 0.85;
  private _supabase?: SupabaseClient;

  private get supabase(): SupabaseClient {
    if (!this._supabase) {
      this._supabase = createClient(
        process.env.VITE_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );
    }
    return this._supabase;
  }

  // Layer 1: Exact Match Cache (immediate results)
  async getExactMatch(
    input: string,
    actionType: string,
    organizationId: string
  ): Promise<unknown | null> {
    const cacheKey = this.createCacheKey(input, actionType, organizationId);

    // Check in-memory cache first
    const memoryResult = this.exactCache.get(cacheKey);
    if (memoryResult && !this.isExpired(memoryResult)) {
      await this.trackCacheHit('exact', actionType, organizationId);
      return memoryResult.result;
    }

    // Check persistent cache (Supabase)
    try {
      const { data, error } = await this.supabase
        .from('ai_cache_exact')
        .select('*')
        .eq('cache_key', cacheKey)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (data && !error) {
        // Store in memory for faster future access
        const cacheEntry: CacheEntry = {
          key: cacheKey,
          result: data.result,
          timestamp: new Date(data.created_at).getTime(),
          ttl: data.ttl,
          actionType,
          organizationId,
          inputHash: data.input_hash,
          metadata: data.metadata
        };
        this.exactCache.set(cacheKey, cacheEntry);

        await this.trackCacheHit('exact', actionType, organizationId);
        return data.result;
      }
    } catch (error) {
      diagnosticLogger.warn('[AICache] Error checking persistent cache:', error);
    }

    return null;
  }

  async setExactMatch(
    input: string,
    result: unknown,
    actionType: string,
    organizationId: string,
    metadata?: CacheEntry['metadata'],
    customTTL?: number
  ): Promise<void> {
    const cacheKey = this.createCacheKey(input, actionType, organizationId);
    const ttl = customTTL || this.DEFAULT_TTL;
    const expiresAt = new Date(Date.now() + (ttl * 1000));
    const inputHash = await this.hashInput(input);

    const cacheEntry: CacheEntry = {
      key: cacheKey,
      result,
      timestamp: Date.now(),
      ttl,
      actionType,
      organizationId,
      inputHash,
      metadata
    };

    // Store in memory
    this.exactCache.set(cacheKey, cacheEntry);

    // Store in persistent cache
    try {
      await this.supabase
        .from('ai_cache_exact')
        .upsert({
          cache_key: cacheKey,
          input_hash: inputHash,
          result,
          action_type: actionType,
          organization_id: organizationId,
          ttl,
          expires_at: expiresAt.toISOString(),
          metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      diagnosticLogger.warn('[AICache] Error storing in persistent cache:', error);
    }
  }

  // Layer 2: Semantic Similarity Cache (for lead scoring)
  async getSemanticMatch(
    input: string,
    actionType: string,
    organizationId: string,
    threshold: number = this.SIMILARITY_THRESHOLD
  ): Promise<unknown | null> {
    if (actionType !== 'ai_lead_scoring') {
      return null; // Only use semantic matching for lead scoring
    }

    try {
      // Generate embedding for input (simplified - in production use actual embedding model)
      const inputEmbedding = await this.generateSimpleEmbedding(input);

      // Find similar entries in database
      const { data, error } = await this.supabase
        .from('ai_cache_semantic')
        .select('*')
        .eq('action_type', actionType)
        .eq('organization_id', organizationId);

      if (error || !data?.length) { return null; }

      // Calculate similarity scores
      let bestMatch: SemanticCacheEntry | null = null;
      let bestSimilarity = 0;

      for (const entry of data) {
        const similarity = this.calculateCosineSimilarity(
          inputEmbedding,
          entry.embedding
        );

        if (similarity > threshold && similarity > bestSimilarity) {
          bestMatch = entry;
          bestSimilarity = similarity;
        }
      }

      if (bestMatch) {
        // Update usage statistics
        await this.supabase
          .from('ai_cache_semantic')
          .update({
            usage_count: bestMatch.usage_count + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', bestMatch.id);

        await this.trackCacheHit('semantic', actionType, organizationId);

        // Adapt result for current input
        return this.adaptSemanticResult(bestMatch.result, input, bestSimilarity);
      }

    } catch (error) {
      diagnosticLogger.warn('[AICache] Error in semantic matching:', error);
    }

    return null;
  }

  async setSemanticMatch(
    input: string,
    result: unknown,
    actionType: string,
    organizationId: string
  ): Promise<void> {
    if (actionType !== 'ai_lead_scoring') { return; }

    try {
      const inputHash = await this.hashInput(input);
      const embedding = await this.generateSimpleEmbedding(input);

      await this.supabase
        .from('ai_cache_semantic')
        .insert({
          input_hash: inputHash,
          input_text: input.substring(0, 1000), // Store first 1000 chars for reference
          embedding,
          result,
          action_type: actionType,
          organization_id: organizationId,
          similarity_threshold: this.SIMILARITY_THRESHOLD,
          usage_count: 1,
          last_used: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

    } catch (error) {
      diagnosticLogger.warn('[AICache] Error storing semantic match:', error);
    }
  }

  // Layer 3: Template Cache (for content generation)
  async getTemplateMatch(
    input: string,
    actionType: string,
    organizationId: string
  ): Promise<unknown | null> {
    if (!['ai_email_generation', 'ai_whatsapp_generation'].includes(actionType)) {
      return null;
    }

    try {
      // Extract key template variables from input
      const templateVars = this.extractTemplateVariables(input);

      const { data, error } = await this.supabase
        .from('ai_cache_templates')
        .select('*')
        .eq('action_type', actionType)
        .eq('organization_id', organizationId)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error || !data?.length) { return null; }

      // Find best matching template
      for (const template of data) {
        const matchScore = this.calculateTemplateMatch(templateVars, template.variables);

        if (matchScore > 0.7) { // 70% match threshold
          await this.trackCacheHit('template', actionType, organizationId);

          // Personalize template with current variables
          return this.personalizeTemplate(template.content, templateVars);
        }
      }

    } catch (error) {
      diagnosticLogger.warn('[AICache] Error in template matching:', error);
    }

    return null;
  }

  async setTemplateMatch(
    input: string,
    result: unknown,
    actionType: string,
    organizationId: string
  ): Promise<void> {
    if (!['ai_email_generation', 'ai_whatsapp_generation'].includes(actionType)) {
      return;
    }

    try {
      const templateVars = this.extractTemplateVariables(input);
      const templateId = await this.hashInput(JSON.stringify(templateVars));

      await this.supabase
        .from('ai_cache_templates')
        .upsert({
          template_id: templateId,
          content: result,
          variables: templateVars,
          action_type: actionType,
          organization_id: organizationId,
          usage_count: 1,
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

    } catch (error) {
      diagnosticLogger.warn('[AICache] Error storing template:', error);
    }
  }

  // Main cache interface
  async get(
    input: string,
    actionType: string,
    organizationId: string
  ): Promise<{ result: unknown; cacheType: 'exact' | 'semantic' | 'template' } | null> {

    // 1. Try exact match first
    const exactResult = await this.getExactMatch(input, actionType, organizationId);
    if (exactResult) {
      return { result: exactResult, cacheType: 'exact' };
    }

    // 2. Try semantic similarity (for lead scoring)
    const semanticResult = await this.getSemanticMatch(input, actionType, organizationId);
    if (semanticResult) {
      return { result: semanticResult, cacheType: 'semantic' };
    }

    // 3. Try template matching (for content generation)
    const templateResult = await this.getTemplateMatch(input, actionType, organizationId);
    if (templateResult) {
      return { result: templateResult, cacheType: 'template' };
    }

    return null;
  }

  async set(
    input: string,
    result: unknown,
    actionType: string,
    organizationId: string,
    metadata?: CacheEntry['metadata']
  ): Promise<void> {
    // Always store exact match
    await this.setExactMatch(input, result, actionType, organizationId, metadata);

    // Store semantic match for applicable action types
    await this.setSemanticMatch(input, result, actionType, organizationId);

    // Store template for applicable action types
    await this.setTemplateMatch(input, result, actionType, organizationId);
  }

  // Cache invalidation
  async invalidate(
    pattern: string,
    organizationId?: string
  ): Promise<void> {
    try {
      const conditions = pattern.split('_');
      let query = this.supabase.from('ai_cache_exact').delete();

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (conditions.includes('lead')) {
        query = query.eq('action_type', 'ai_lead_scoring');
      }

      await query;

      // Clear in-memory cache
      for (const [key, entry] of this.exactCache.entries()) {
        if ((!organizationId || entry.organizationId === organizationId) &&
          key.includes(pattern)) {
          this.exactCache.delete(key);
        }
      }

    } catch (error) {
      diagnosticLogger.warn('[AICache] Error during invalidation:', error);
    }
  }

  // Utility methods
  private createCacheKey(input: string, actionType: string, organizationId: string): string {
    const inputHash = this.simpleHash(input).toString(36);
    return `${organizationId}_${actionType}_${inputHash}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async hashInput(input: string): Promise<string> {
    // Simple hash for demo - use crypto.subtle.digest in production
    return this.simpleHash(input).toString(36);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + (entry.ttl * 1000));
  }

  private async generateSimpleEmbedding(text: string): Promise<number[]> {
    // Simplified embedding generation - use actual embedding model in production
    const words = text.toLowerCase().split(/\s+/);
    const embedding: number[] = new Array(50).fill(0);

    words.forEach((word) => {
      const hash = this.simpleHash(word);
      const index = hash % 50;
      embedding[index] = (embedding[index] || 0) + 1;
    });

    return embedding;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private adaptSemanticResult(
    originalResult: unknown,
    _currentInput: string,
    similarity: number
  ): unknown {
    // Type guard for result with score
    if (
      originalResult &&
      typeof originalResult === 'object' &&
      'score' in originalResult &&
      typeof (originalResult as Record<string, unknown>).score === 'number'
    ) {
      const result = originalResult as { score: number; reasoning?: string;[key: string]: unknown };
      // Adjust score based on similarity
      const adjustedScore = Math.round(result.score * similarity);
      return {
        ...result,
        score: adjustedScore,
        reasoning: `${result.reasoning || ''} (adapted from similar lead)`,
        confidence: similarity
      };
    }

    return originalResult;
  }

  private extractTemplateVariables(input: string): Record<string, unknown> {
    try {
      const inputObj = JSON.parse(input);
      return {
        industry: inputObj.industry || 'general',
        company_size: inputObj.companySize || inputObj.employees || 'unknown',
        title: inputObj.title || 'unknown',
        pain_point: inputObj.painPoint || 'general'
      };
    } catch {
      return { type: 'general' };
    }
  }

  private calculateTemplateMatch(
    vars1: Record<string, unknown>,
    vars2: Record<string, unknown>
  ): number {
    const keys1 = Object.keys(vars1);
    const keys2 = Object.keys(vars2);
    const commonKeys = keys1.filter(k => keys2.includes(k));

    if (commonKeys.length === 0) { return 0; }

    const matches = commonKeys.filter(k => vars1[k] === vars2[k]).length;
    return matches / Math.max(keys1.length, keys2.length);
  }

  private personalizeTemplate(
    template: string,
    variables: Record<string, unknown>
  ): string {
    let personalized = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const stringValue = typeof value === 'string' ? value : String(value);
      personalized = personalized.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return personalized;
  }

  private async trackCacheHit(
    cacheType: 'exact' | 'semantic' | 'template',
    actionType: string,
    organizationId: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_cache_metrics')
        .insert({
          cache_type: cacheType,
          action_type: actionType,
          organization_id: organizationId,
          hit_at: new Date().toISOString()
        });
    } catch (error) {
      diagnosticLogger.warn('[AICache] Error tracking cache hit:', error);
    }
  }

  // Cache statistics
  async getStats(organizationId: string): Promise<{
    totalHits: number;
    hitsByType: Record<string, number>;
    hitsByAction: Record<string, number>;
    averageResponseTime: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_cache_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('hit_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error || !data) {
        return {
          totalHits: 0,
          hitsByType: {},
          hitsByAction: {},
          averageResponseTime: 0
        };
      }

      const hitsByType: Record<string, number> = {};
      const hitsByAction: Record<string, number> = {};

      data.forEach(hit => {
        hitsByType[hit.cache_type] = (hitsByType[hit.cache_type] || 0) + 1;
        hitsByAction[hit.action_type] = (hitsByAction[hit.action_type] || 0) + 1;
      });

      return {
        totalHits: data.length,
        hitsByType,
        hitsByAction,
        averageResponseTime: 50 // Estimated cache response time
      };

    } catch (error) {
      diagnosticLogger.warn('[AICache] Error getting stats:', error);
      return {
        totalHits: 0,
        hitsByType: {},
        hitsByAction: {},
        averageResponseTime: 0
      };
    }
  }
}

// Singleton instance
export const aiCache = new AICache();

// Convenience functions
export async function getCachedAIResult(
  input: string,
  actionType: string,
  organizationId: string
): Promise<unknown | null> {
  const cached = await aiCache.get(input, actionType, organizationId);
  return cached?.result || null;
}

export async function setCachedAIResult(
  input: string,
  result: unknown,
  actionType: string,
  organizationId: string,
  metadata?: CacheEntry['metadata']
): Promise<void> {
  await aiCache.set(input, result, actionType, organizationId, metadata);
}

export async function invalidateAICache(
  pattern: string,
  organizationId?: string
): Promise<void> {
  await aiCache.invalidate(pattern, organizationId);
}

export default aiCache;
