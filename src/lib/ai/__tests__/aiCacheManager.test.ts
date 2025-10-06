// File: src/lib/ai/__tests__/aiCacheManager.test.ts
// Test Suite for AI Cache Manager
// Phase 5: Code Quality Enhancement - Cache System Testing

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { 
  aiCache, 
  getCachedAIResult, 
  setCachedAIResult, 
  invalidateAICache,
  type CacheEntry 
} from '../aiCacheManager';

// Mock successful Supabase operations for testing
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

describe('AI Cache Manager', () => {
  const mockOrgId = 'test-org-123';
  const mockInput = JSON.stringify({ name: 'John Doe', email: 'john@example.com' });
  const mockResult = { score: 85, category: 'Hot', reasoning: 'High-value lead' };
  const mockActionType = 'ai_lead_scoring';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset in-memory cache
    aiCache['exactCache'].clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Exact Match Cache', () => {
    it('should store and retrieve exact matches from memory cache', async () => {
      // Store in cache
      await aiCache.set(mockInput, mockResult, mockActionType, mockOrgId);
      
      // Retrieve from cache
      const cached = await aiCache.get(mockInput, mockActionType, mockOrgId);
      
      expect(cached).toBeDefined();
      expect(cached?.result).toEqual(mockResult);
      expect(cached?.cacheType).toBe('exact');
    });

    it('should return null for cache miss', async () => {
      const cached = await aiCache.get('non-existent-input', mockActionType, mockOrgId);
      
      expect(cached).toBeNull();
    });

    it('should handle expired cache entries', async () => {
      // Mock expired entry in persistent cache
      mockSupabaseSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const cached = await aiCache.getExactMatch(mockInput, mockActionType, mockOrgId);
      
      expect(cached).toBeNull();
    });

    it('should store in persistent cache on set', async () => {
      mockSupabaseUpsert.mockResolvedValueOnce({ data: null, error: null });
      
      await aiCache.setExactMatch(
        mockInput,
        mockResult,
        mockActionType,
        mockOrgId,
        { model: 'gemini-2.5-flash', promptVersion: '2.0', responseTime: 150 }
      );
      
      expect(mockSupabaseUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          result: mockResult,
          action_type: mockActionType,
          organization_id: mockOrgId,
        })
      );
    });
  });

  describe('Semantic Similarity Cache', () => {
    it('should only apply semantic matching to lead scoring', async () => {
      const emailResult = await aiCache.getSemanticMatch(
        mockInput,
        'ai_email_generation',
        mockOrgId
      );
      
      expect(emailResult).toBeNull();
    });

    it('should find similar leads with high similarity', async () => {
      // Mock similar lead data
      const similarLeadData = [{
        id: 'similar-lead-1',
        input_hash: 'hash123',
        embedding: [1, 2, 3, 4, 5],
        result: { score: 82, category: 'Hot', reasoning: 'Similar lead' },
        usage_count: 3,
      }];

      mockSupabaseSingle.mockResolvedValueOnce({ data: similarLeadData, error: null });
      
      // Mock cosine similarity calculation to return high similarity
      vi.spyOn(aiCache as any, 'calculateCosineSimilarity').mockReturnValue(0.9);
      
      const result = await aiCache.getSemanticMatch(
        mockInput,
        'ai_lead_scoring',
        mockOrgId,
        0.85
      );
      
      expect(result).toBeDefined();
      expect((result as { score: number }).score).toBe(74); // 82 * 0.9 (adapted score)
    });

    it('should store semantic matches for lead scoring', async () => {
      mockSupabaseInsert.mockResolvedValueOnce({ data: null, error: null });
      
      await aiCache.setSemanticMatch(
        mockInput,
        mockResult,
        'ai_lead_scoring',
        mockOrgId
      );
      
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          result: mockResult,
          action_type: 'ai_lead_scoring',
          organization_id: mockOrgId,
        })
      );
    });
  });

  describe('Template Cache', () => {
    it('should apply template matching to content generation actions', async () => {
      const nonContentResult = await aiCache.getTemplateMatch(
        mockInput,
        'ai_lead_scoring',
        mockOrgId
      );
      
      expect(nonContentResult).toBeNull();
    });

    it('should find matching templates for email generation', async () => {
      const mockTemplateData = [{
        content: 'Hi {{name}}, interested in improving {{company}} sales?',
        variables: { industry: 'technology', pain_point: 'lead_qualification' },
        usage_count: 5,
      }];

      mockSupabaseSingle.mockResolvedValueOnce({ data: mockTemplateData, error: null });
      
      // Mock template matching
      vi.spyOn(aiCache as any, 'calculateTemplateMatch').mockReturnValue(0.8);
      vi.spyOn(aiCache as any, 'personalizeTemplate').mockReturnValue(
        'Hi John, interested in improving TechCorp sales?'
      );
      
      const result = await aiCache.getTemplateMatch(
        JSON.stringify({ name: 'John', company: 'TechCorp' }),
        'ai_email_generation',
        mockOrgId
      );
      
      expect(result).toBe('Hi John, interested in improving TechCorp sales?');
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache entries by pattern', async () => {
      // Store some cache entries
      aiCache['exactCache'].set('key1_lead_hash1', {
        key: 'key1_lead_hash1',
        result: mockResult,
        timestamp: Date.now(),
        ttl: 3600,
        actionType: 'ai_lead_scoring',
        organizationId: mockOrgId,
        inputHash: 'hash1',
      });

      expect(aiCache['exactCache'].size).toBe(1);
      
      await aiCache.invalidate('lead', mockOrgId);
      
      expect(aiCache['exactCache'].size).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', async () => {
      const mockStatsData = [
        { cache_type: 'exact', action_type: 'ai_lead_scoring' },
        { cache_type: 'semantic', action_type: 'ai_lead_scoring' },
        { cache_type: 'exact', action_type: 'ai_email_generation' },
      ];

      mockSupabaseSingle.mockResolvedValueOnce({ data: mockStatsData, error: null });
      
      const stats = await aiCache.getStats(mockOrgId);
      
      expect(stats.totalHits).toBe(3);
      expect(stats.hitsByType.exact).toBe(2);
      expect(stats.hitsByType.semantic).toBe(1);
      expect(stats.hitsByAction['ai_lead_scoring']).toBe(2);
    });

    it('should handle errors in stats collection gracefully', async () => {
      mockSupabaseSingle.mockRejectedValueOnce(new Error('Database error'));
      
      const stats = await aiCache.getStats(mockOrgId);
      
      expect(stats.totalHits).toBe(0);
      expect(stats.hitsByType).toEqual({});
      expect(stats.hitsByAction).toEqual({});
    });
  });

  describe('Utility Methods', () => {
    it('should create consistent cache keys', () => {
      const key1 = aiCache['createCacheKey']('input1', 'action1', 'org1');
      const key2 = aiCache['createCacheKey']('input1', 'action1', 'org1');
      const key3 = aiCache['createCacheKey']('input2', 'action1', 'org1');
      
      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should calculate cosine similarity correctly', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 3];
      const vec3 = [3, 2, 1];
      
      const similarity1 = aiCache['calculateCosineSimilarity'](vec1, vec2);
      const similarity2 = aiCache['calculateCosineSimilarity'](vec1, vec3);
      
      expect(similarity1).toBeCloseTo(1.0, 2);
      expect(similarity2).toBeLessThan(1.0);
      expect(similarity2).toBeGreaterThan(0);
    });

    it('should detect expired cache entries', () => {
      const expiredEntry: CacheEntry = {
        key: 'test-key',
        result: mockResult,
        timestamp: Date.now() - 7200000, // 2 hours ago
        ttl: 3600, // 1 hour TTL
        actionType: mockActionType,
        organizationId: mockOrgId,
        inputHash: 'hash',
      };
      
      const isExpired = aiCache['isExpired'](expiredEntry);
      expect(isExpired).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    it('should provide convenient get function', async () => {
      await setCachedAIResult(mockInput, mockResult, mockActionType, mockOrgId);
      const cached = await getCachedAIResult(mockInput, mockActionType, mockOrgId);
      
      expect(cached).toEqual(mockResult);
    });

    it('should provide convenient set function', async () => {
      await setCachedAIResult(mockInput, mockResult, mockActionType, mockOrgId, {
        model: 'gemini-2.5-flash',
        promptVersion: '2.0',
        responseTime: 200,
      });
      
      const cached = await getCachedAIResult(mockInput, mockActionType, mockOrgId);
      expect(cached).toEqual(mockResult);
    });

    it('should provide convenient invalidation function', async () => {
      await setCachedAIResult(mockInput, mockResult, mockActionType, mockOrgId);
      await invalidateAICache('lead', mockOrgId);
      
      const cached = await getCachedAIResult(mockInput, mockActionType, mockOrgId);
      expect(cached).toBeNull();
    });
  });
});