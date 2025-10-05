// File: src/lib/ai/__tests__/enhancedAIService.test.ts
// Test Suite for Enhanced AI Service
// Phase 5: Code Quality Enhancement - AI Component Testing

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { enhancedAIService } from '../enhancedAIService';
import type { OrganizationAIContext } from '../promptTemplates';

describe('EnhancedAIService', () => {
  const mockOrganizationId = 'test-org-123';
  const mockOrganizationContext: OrganizationAIContext = {
    organizationId: mockOrganizationId,
    industry: 'Technology',
    targetMarket: ['Enterprise', 'SMB'],
    brandVoice: 'professional',
    keyProducts: ['Guardian AI CRM'],
    companySize: 'medium',
  };

  const mockLead = {
    name: 'Sarah Johnson',
    email: 'sarah@techcorp.com',
    company: 'TechCorp Solutions',
    title: 'VP of Sales',
    industry: 'Software',
    employees: 250,
    phone: '+1-555-0123',
    source: 'demo_request',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scoreContactLead', () => {
    it('should return valid lead scoring response', async () => {
      const result = await enhancedAIService.scoreContactLead(
        mockLead,
        mockOrganizationId,
        mockOrganizationContext
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.score).toBeGreaterThanOrEqual(1);
      expect(result.result.score).toBeLessThanOrEqual(100);
      expect(['Hot', 'Warm', 'Cold']).toContain(result.result.category);
      expect(result.result.reasoning).toBeTruthy();
      expect(result.metadata.organizationId).toBe(mockOrganizationId);
      expect(result.metadata.actionType).toBe('ai_lead_scoring');
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service to throw error
      vi.mocked(enhancedAIService['ai'].models.generateContent).mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      const result = await enhancedAIService.scoreContactLead(
        mockLead,
        mockOrganizationId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service unavailable');
    });

    it('should respect priority levels', async () => {
      const criticalResult = await enhancedAIService.scoreContactLead(
        mockLead,
        mockOrganizationId,
        mockOrganizationContext,
        'critical'
      );

      const backgroundResult = await enhancedAIService.scoreContactLead(
        mockLead,
        mockOrganizationId,
        mockOrganizationContext,  
        'background'
      );

      expect(criticalResult.success).toBe(true);
      expect(backgroundResult.success).toBe(true);
      // Critical requests should generally be faster (mocked, so same in test)
      expect(criticalResult.responseTimeMs).toBeGreaterThan(0);
      expect(backgroundResult.responseTimeMs).toBeGreaterThan(0);
    });
  });

  describe('generateEmailContent', () => {
    const mockEmailContext = {
      recipientName: 'Sarah Johnson',
      company: 'TechCorp Solutions',
      title: 'VP of Sales',
      industry: 'Software',
      painPoint: 'lead_qualification',
      brandVoice: 'professional',
    };

    it('should generate valid email content', async () => {
      // Mock successful email generation
      vi.mocked(enhancedAIService['ai'].models.generateContent).mockResolvedValueOnce({
        text: () => JSON.stringify({
          subject: 'Sarah, improve TechCorp lead qualification',
          body: 'Hi Sarah, saw TechCorp is scaling fast. We helped similar companies increase lead qualification by 40%. Worth a 15-min chat?',
          cta: 'Schedule quick call',
          personalizedElements: ['company reference', 'role-specific pain point']
        })
      } as any);

      const result = await enhancedAIService.generateEmailContent(
        mockEmailContext,
        mockOrganizationId,
        mockOrganizationContext
      );

      expect(result.success).toBe(true);
      expect(result.result.subject).toBeTruthy();
      expect(result.result.subject.length).toBeLessThanOrEqual(50);
      expect(result.result.body).toBeTruthy();
      expect(result.result.cta).toBeTruthy();
      expect(Array.isArray(result.result.personalizedElements)).toBe(true);
    });

    it('should handle invalid JSON responses', async () => {
      // Mock invalid JSON response
      vi.mocked(enhancedAIService['ai'].models.generateContent).mockResolvedValueOnce({
        text: () => 'Invalid JSON response'
      } as any);

      const result = await enhancedAIService.generateEmailContent(
        mockEmailContext,
        mockOrganizationId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse AI response');
    });
  });

  describe('generateWhatsAppMessage', () => {
    const mockMessageContext = {
      recipientName: 'Mike',
      company: 'TechStartup',
      context: 'demo_request',
      urgency: 'medium',
    };

    it('should generate valid WhatsApp message', async () => {
      // Mock WhatsApp message generation
      vi.mocked(enhancedAIService['ai'].models.generateContent).mockResolvedValueOnce({
        text: () => 'Hi Mike! 👋 Thanks for demo interest. Can show TechStartup how we helped similar companies boost sales 30% in 10 min. Free to chat? Reply STOP to opt out.'
      } as any);

      const result = await enhancedAIService.generateWhatsAppMessage(
        mockMessageContext,
        mockOrganizationId,
        mockOrganizationContext
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeTruthy();
      expect(typeof result.result).toBe('string');
      expect(result.result.length).toBeLessThanOrEqual(160);
      expect(result.result).toContain('Mike');
    });
  });

  describe('caching behavior', () => {
    it('should return cached results when available', async () => {
      // Mock cache hit
      const cachedResult = {
        score: 85,
        category: 'Hot',
        reasoning: 'Cached lead score',
      };
      
      vi.doMock('../aiCacheManager', () => ({
        getCachedAIResult: vi.fn().mockResolvedValue(cachedResult),
        setCachedAIResult: vi.fn(),
      }));

      const result = await enhancedAIService.scoreContactLead(
        mockLead,
        mockOrganizationId
      );

      expect(result.cached).toBe(true);
      expect(result.result).toEqual(cachedResult);
    });
  });

  describe('AI health check', () => {
    it('should return healthy status when AI service responds', async () => {
      // Mock healthy AI response
      vi.mocked(enhancedAIService['ai'].models.generateContent).mockResolvedValueOnce({
        text: () => 'OK'
      } as any);

      const health = await enhancedAIService.checkAIHealth();

      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.details.model).toBe('gemini-2.5-flash');
    });

    it('should return unavailable status when AI service fails', async () => {
      // Mock AI service failure
      vi.mocked(enhancedAIService['ai'].models.generateContent).mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const health = await enhancedAIService.checkAIHealth();

      expect(health.status).toBe('unavailable');
      expect(health.details.error).toBe('Service unavailable');
    });
  });

  describe('rate limiting integration', () => {
    it('should respect rate limits', async () => {
      // Mock rate limit exceeded
      const rateLimitMock = vi.fn().mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );
      
      vi.doMock('../rateLimiter', () => ({
        withRateLimit: rateLimitMock,
      }));

      const result = await enhancedAIService.scoreContactLead(
        mockLead,
        mockOrganizationId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });

  describe('token usage and cost calculation', () => {
    it('should calculate token usage and costs', async () => {
      const result = await enhancedAIService.scoreContactLead(
        mockLead,
        mockOrganizationId
      );

      if (result.success && !result.cached) {
        expect(result.tokenUsage).toBeDefined();
        expect(result.tokenUsage?.input).toBeGreaterThan(0);
        expect(result.tokenUsage?.output).toBeGreaterThan(0);
        expect(result.tokenUsage?.total).toBeGreaterThan(0);
      }
    });
  });
});