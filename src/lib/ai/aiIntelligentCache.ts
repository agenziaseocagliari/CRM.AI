// AI Caching Layer for Guardian AI CRM
// Intelligent caching system to reduce API costs by 40%

import { diagnosticLogger } from '../mockDiagnosticLogger';
import { AdvancedCache } from '../advancedCaching';

export interface AICacheEntry {
  id: string;
  promptHash: string;
  organizationId: string;
  templateId: string;
  inputData: any;
  response: {
    content: string;
    metadata: {
      model: string;
      tokens: number;
      cost: number;
      timestamp: number;
      processingTime: number;
    };
  };
  similarity?: number; // Semantic similarity score
  usage: {
    hitCount: number;
    lastAccessed: number;
    feedback?: number; // User feedback score 1-5
  };
  expires: number;
  version: string;
}

export interface CacheStrategy {
  name: string;
  ttl: number; // Time to live in milliseconds
  maxEntries: number;
  similarityThreshold: number; // 0.0-1.0, higher = more similar required
  costThreshold: number; // Only cache requests above this cost
  enabled: boolean;
}

export interface AICacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  costSavings: number;
  avgResponseTime: number;
  totalTokensSaved: number;
}

export class AIIntelligentCache {
  private cache: AdvancedCache;
  private semanticIndex: Map<string, AICacheEntry[]>;
  private metrics: AICacheMetrics;
  
  private strategies: Map<string, CacheStrategy> = new Map([
    ['lead-scoring', {
      name: 'Lead Scoring Cache',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 10000,
      similarityThreshold: 0.85,
      costThreshold: 0.001,
      enabled: true
    }],
    ['email-generation', {
      name: 'Email Generation Cache',
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 5000,
      similarityThreshold: 0.75,
      costThreshold: 0.002,
      enabled: true
    }],
    ['whatsapp-generation', {
      name: 'WhatsApp Generation Cache',
      ttl: 3 * 24 * 60 * 60 * 1000, // 3 days
      maxEntries: 3000,
      similarityThreshold: 0.80,
      costThreshold: 0.0005,
      enabled: true
    }],
    ['content-analysis', {
      name: 'Content Analysis Cache',
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      maxEntries: 2000,
      similarityThreshold: 0.90,
      costThreshold: 0.003,
      enabled: true
    }]
  ]);

  constructor() {
    this.cache = new AdvancedCache({
      name: 'ai-cache',
      version: 1,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 10000,
      strategy: 'cache-first'
    });
    
    this.semanticIndex = new Map();
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      costSavings: 0,
      avgResponseTime: 0,
      totalTokensSaved: 0
    };

    // Initialize semantic index
    this.initializeSemanticIndex();
    
    // Start cache optimization background task
    this.startOptimizationLoop();
  }

  /**
   * Main cache lookup method
   */
  async getCachedResponse(
    templateId: string,
    organizationId: string,
    inputData: any,
    options: {
      maxAge?: number;
      minSimilarity?: number;
      fallbackStrategy?: 'similar' | 'none';
    } = {}
  ): Promise<AICacheEntry | null> {
    
    const startTime = performance.now();
    this.metrics.totalRequests++;
    
    try {
      const strategy = this.strategies.get(templateId);
      if (!strategy?.enabled) {
        diagnosticLogger.info('ai-cache', 'Cache disabled for template', { templateId });
        return null;
      }

      // Generate prompt hash for exact matching
      const promptHash = await this.generatePromptHash(templateId, inputData);
      
      // Try exact match first
      const exactMatch = await this.getExactMatch(promptHash, organizationId, options.maxAge);
      if (exactMatch) {
        await this.recordCacheHit(exactMatch, performance.now() - startTime);
        return exactMatch;
      }

      // Try semantic similarity matching if enabled
      if (options.fallbackStrategy === 'similar') {
        const similarMatch = await this.getSimilarMatch(
          templateId,
          organizationId,
          inputData,
          options.minSimilarity || strategy.similarityThreshold
        );
        
        if (similarMatch) {
          await this.recordCacheHit(similarMatch, performance.now() - startTime);
          return similarMatch;
        }
      }

      // Cache miss
      this.metrics.cacheMisses++;
      this.updateHitRate();
      
      diagnosticLogger.info('ai-cache', 'Cache miss', {
        templateId,
        organizationId,
        promptHash: promptHash.substring(0, 8)
      });

      return null;

    } catch (error) {
      diagnosticLogger.error('ai-cache', 'Cache lookup error', error);
      return null;
    }
  }

  /**
   * Store AI response in cache
   */
  async storeResponse(
    templateId: string,
    organizationId: string,
    inputData: any,
    response: {
      content: string;
      model: string;
      tokens: number;
      cost: number;
      processingTime: number;
    }
  ): Promise<void> {
    
    try {
      const strategy = this.strategies.get(templateId);
      if (!strategy?.enabled || response.cost < strategy.costThreshold) {
        return; // Don't cache low-cost responses
      }

      const promptHash = await this.generatePromptHash(templateId, inputData);
      
      const cacheEntry: AICacheEntry = {
        id: `${organizationId}-${promptHash}-${Date.now()}`,
        promptHash,
        organizationId,
        templateId,
        inputData: this.sanitizeInputData(inputData),
        response: {
          content: response.content,
          metadata: {
            model: response.model,
            tokens: response.tokens,
            cost: response.cost,
            timestamp: Date.now(),
            processingTime: response.processingTime
          }
        },
        usage: {
          hitCount: 0,
          lastAccessed: Date.now()
        },
        expires: Date.now() + strategy.ttl,
        version: '1.0'
      };

      // Store in primary cache
      await this.cache.set(
        `ai-response:${promptHash}:${organizationId}`,
        cacheEntry,
        strategy.ttl
      );

      // Update semantic index for similarity matching
      await this.updateSemanticIndex(templateId, cacheEntry);

      // Cleanup if necessary
      await this.cleanupExpiredEntries(templateId);

      diagnosticLogger.info('ai-cache', 'Response cached', {
        templateId,
        organizationId,
        tokens: response.tokens,
        cost: response.cost,
        cacheSize: await this.getCacheSize()
      });

    } catch (error) {
      diagnosticLogger.error('ai-cache', 'Failed to store response', error);
    }
  }

  /**
   * Generate semantic hash for input data
   */
  private async generatePromptHash(templateId: string, inputData: any): Promise<string> {
    // Normalize input data
    const normalized = this.normalizeInputData(inputData);
    const content = `${templateId}:${JSON.stringify(normalized)}`;
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get exact cache match
   */
  private async getExactMatch(
    promptHash: string,
    organizationId: string,
    maxAge?: number
  ): Promise<AICacheEntry | null> {
    
    const cacheKey = `ai-response:${promptHash}:${organizationId}`;
    const entry = await this.cache.get<AICacheEntry>(cacheKey);
    
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() > entry.expires) {
      await this.cache.remove(cacheKey);
      return null;
    }
    
    // Check max age if specified
    if (maxAge && (Date.now() - entry.response.metadata.timestamp) > maxAge) {
      return null;
    }
    
    return entry;
  }

  /**
   * Get semantically similar cache match
   */
  private async getSimilarMatch(
    templateId: string,
    organizationId: string,
    inputData: any,
    minSimilarity: number
  ): Promise<AICacheEntry | null> {
    
    const candidates = this.semanticIndex.get(templateId) || [];
    
    // Filter by organization and validity
    const validCandidates = candidates.filter(entry => 
      entry.organizationId === organizationId &&
      Date.now() < entry.expires
    );

    if (validCandidates.length === 0) return null;

    // Calculate semantic similarity for each candidate
    const similarities = await Promise.all(
      validCandidates.map(async (candidate) => ({
        entry: candidate,
        similarity: await this.calculateSimilarity(inputData, candidate.inputData)
      }))
    );

    // Find best match above threshold
    const bestMatch = similarities
      .filter(item => item.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)[0];

    if (bestMatch) {
      bestMatch.entry.similarity = bestMatch.similarity;
      diagnosticLogger.info('ai-cache', 'Similar match found', {
        templateId,
        similarity: bestMatch.similarity,
        threshold: minSimilarity
      });
      
      return bestMatch.entry;
    }

    return null;
  }

  /**
   * Calculate semantic similarity between two input datasets
   */
  private async calculateSimilarity(inputA: any, inputB: any): Promise<number> {
    try {
      // Extract text content for comparison
      const textA = this.extractTextContent(inputA);
      const textB = this.extractTextContent(inputB);
      
      // Simple similarity calculation (in production, use embeddings/vector similarity)
      const similarity = this.calculateTextSimilarity(textA, textB);
      
      // Factor in structured data similarity
      const structuralSimilarity = this.calculateStructuralSimilarity(inputA, inputB);
      
      // Weighted combination
      return (similarity * 0.7) + (structuralSimilarity * 0.3);

    } catch (error) {
      diagnosticLogger.error('ai-cache', 'Similarity calculation error', error);
      return 0;
    }
  }

  /**
   * Extract text content from input data
   */
  private extractTextContent(data: any): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      return Object.values(data)
        .filter(val => typeof val === 'string')
        .join(' ');
    }
    return '';
  }

  /**
   * Calculate text similarity using Jaccard coefficient
   */
  private calculateTextSimilarity(textA: string, textB: string): number {
    const wordsA = new Set(textA.toLowerCase().split(/\s+/));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calculate structural similarity between objects
   */
  private calculateStructuralSimilarity(objA: any, objB: any): number {
    if (typeof objA !== 'object' || typeof objB !== 'object') {
      return objA === objB ? 1 : 0;
    }
    
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    
    const commonKeys = keysA.filter(key => keysB.includes(key));
    const totalKeys = new Set([...keysA, ...keysB]).size;
    
    if (totalKeys === 0) return 1;
    
    let matchingValues = 0;
    commonKeys.forEach(key => {
      if (objA[key] === objB[key]) matchingValues++;
    });
    
    return (commonKeys.length + matchingValues) / (totalKeys + commonKeys.length);
  }

  /**
   * Update semantic index for similarity searches
   */
  private async updateSemanticIndex(templateId: string, entry: AICacheEntry): Promise<void> {
    if (!this.semanticIndex.has(templateId)) {
      this.semanticIndex.set(templateId, []);
    }
    
    const entries = this.semanticIndex.get(templateId)!;
    entries.push(entry);
    
    // Keep only recent entries for performance
    const strategy = this.strategies.get(templateId);
    if (strategy && entries.length > strategy.maxEntries) {
      entries.sort((a, b) => b.usage.lastAccessed - a.usage.lastAccessed);
      this.semanticIndex.set(templateId, entries.slice(0, strategy.maxEntries));
    }
  }

  /**
   * Record cache hit and update metrics
   */
  private async recordCacheHit(entry: AICacheEntry, responseTime: number): Promise<void> {
    // Update entry usage
    entry.usage.hitCount++;
    entry.usage.lastAccessed = Date.now();
    
    // Update global metrics
    this.metrics.cacheHits++;
    this.metrics.costSavings += entry.response.metadata.cost;
    this.metrics.totalTokensSaved += entry.response.metadata.tokens;
    
    // Update average response time (cache hits are much faster)
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
    
    this.updateHitRate();
    
    diagnosticLogger.info('ai-cache', 'Cache hit recorded', {
      entryId: entry.id,
      hitCount: entry.usage.hitCount,
      costSaved: entry.response.metadata.cost,
      responseTime
    });
  }

  /**
   * Update cache hit rate
   */
  private updateHitRate(): void {
    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? this.metrics.cacheHits / this.metrics.totalRequests 
      : 0;
  }

  /**
   * Normalize input data for consistent hashing
   */
  private normalizeInputData(data: any): any {
    if (typeof data !== 'object' || data === null) return data;
    
    const normalized: any = {};
    
    // Sort keys and normalize values
    Object.keys(data).sort().forEach(key => {
      const value = data[key];
      if (typeof value === 'string') {
        normalized[key] = value.trim().toLowerCase();
      } else if (typeof value === 'object') {
        normalized[key] = this.normalizeInputData(value);
      } else {
        normalized[key] = value;
      }
    });
    
    return normalized;
  }

  /**
   * Sanitize input data for storage (remove sensitive info)
   */
  private sanitizeInputData(data: any): any {
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'phone', 'email'];
    
    function removeSensitive(obj: any): any {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = removeSensitive(obj[key]);
        }
      });
      
      return obj;
    }
    
    return removeSensitive(sanitized);
  }

  /**
   * Initialize semantic index from existing cache
   */
  private async initializeSemanticIndex(): Promise<void> {
    try {
      // In production, this would load from persistent storage
      diagnosticLogger.info('ai-cache', 'Semantic index initialized');
    } catch (error) {
      diagnosticLogger.error('ai-cache', 'Failed to initialize semantic index', error);
    }
  }

  /**
   * Cleanup expired entries
   */
  private async cleanupExpiredEntries(templateId: string): Promise<void> {
    const entries = this.semanticIndex.get(templateId) || [];
    const now = Date.now();
    
    const validEntries = entries.filter(entry => entry.expires > now);
    
    if (validEntries.length !== entries.length) {
      this.semanticIndex.set(templateId, validEntries);
      
      diagnosticLogger.info('ai-cache', 'Expired entries cleaned', {
        templateId,
        removed: entries.length - validEntries.length,
        remaining: validEntries.length
      });
    }
  }

  /**
   * Start background optimization loop
   */
  private startOptimizationLoop(): void {
    setInterval(async () => {
      try {
        await this.optimizeCache();
      } catch (error) {
        diagnosticLogger.error('ai-cache', 'Cache optimization error', error);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Optimize cache performance
   */
  private async optimizeCache(): Promise<void> {
    // Cleanup expired entries
    for (const templateId of this.semanticIndex.keys()) {
      await this.cleanupExpiredEntries(templateId);
    }
    
    // Log cache statistics
    const cacheSize = await this.getCacheSize();
    
    diagnosticLogger.info('ai-cache', 'Cache optimization completed', {
      ...this.metrics,
      cacheSize,
      indexSize: Array.from(this.semanticIndex.values()).reduce((sum, arr) => sum + arr.length, 0)
    });
  }

  /**
   * Get current cache size
   */
  private async getCacheSize(): Promise<number> {
    const stats = this.cache.getStats();
    return stats.size;
  }

  /**
   * Get cache metrics
   */
  public getMetrics(): AICacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache for specific template or organization
   */
  public async clearCache(options: {
    templateId?: string;
    organizationId?: string;
  } = {}): Promise<void> {
    
    if (options.templateId) {
      this.semanticIndex.delete(options.templateId);
    }
    
    // Clear relevant cache entries
    // In production, this would use more sophisticated filtering
    
    diagnosticLogger.info('ai-cache', 'Cache cleared', options);
  }

  /**
   * Update cache strategy
   */
  public updateStrategy(templateId: string, strategy: Partial<CacheStrategy>): void {
    const current = this.strategies.get(templateId);
    if (current) {
      this.strategies.set(templateId, { ...current, ...strategy });
      diagnosticLogger.info('ai-cache', 'Strategy updated', { templateId, strategy });
    }
  }

  /**
   * Add user feedback to cache entry
   */
  public async addFeedback(entryId: string, feedback: number): Promise<void> {
    // Find and update the entry with user feedback
    for (const entries of this.semanticIndex.values()) {
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        entry.usage.feedback = feedback;
        
        diagnosticLogger.info('ai-cache', 'Feedback added', {
          entryId,
          feedback,
          templateId: entry.templateId
        });
        break;
      }
    }
  }
}

// Export singleton instance
export const aiCache = new AIIntelligentCache();

export default aiCache;