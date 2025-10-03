// File: src/lib/ai/__tests__/promptTemplates.test.ts
// Test Suite for Prompt Templates System
// Phase 5: Code Quality Enhancement - Template Testing

import { describe, it, expect } from 'vitest';

import {
  getPromptTemplate,
  validatePromptOutput,
  injectOrganizationContext,
  leadScoringPrompt,
  emailGenerationPrompt,
  whatsappMessagePrompt,
  type OrganizationAIContext,
} from '../promptTemplates';

describe('Prompt Templates', () => {
  const mockOrgContext: OrganizationAIContext = {
    organizationId: 'test-org-123',
    industry: 'Technology',
    targetMarket: ['Enterprise', 'SMB'],
    brandVoice: 'professional',
    keyProducts: ['Guardian AI CRM', 'Analytics Suite'],
    companySize: 'medium',
    previousConversions: [
      {
        score: 80,
        category: 'Hot',
        industry: 'Technology',
        characteristics: ['enterprise', 'demo_request'],
        conversionRate: 85,
      },
    ],
  };

  describe('getPromptTemplate', () => {
    it('should return lead scoring template for ai_lead_scoring', () => {
      const template = getPromptTemplate('ai_lead_scoring');
      
      expect(template).toBeDefined();
      expect(template.systemContext).toContain('B2B sales analyst');
      expect(template.outputFormat).toBe('json');
      expect(template.version).toBe('2.0');
      expect(template.constraints).toContain('Score must be integer between 1-100');
    });

    it('should return email generation template for ai_email_generation', () => {
      const template = getPromptTemplate('ai_email_generation');
      
      expect(template).toBeDefined();
      expect(template.systemContext).toContain('sales copywriter');
      expect(template.outputFormat).toBe('json');
      expect(template.constraints).toContain('Subject line under 50 characters');
    });

    it('should return WhatsApp template for ai_whatsapp_generation', () => {
      const template = getPromptTemplate('ai_whatsapp_generation');
      
      expect(template).toBeDefined();
      expect(template.systemContext).toContain('WhatsApp business communication');
      expect(template.outputFormat).toBe('text');
      expect(template.constraints).toContain('Maximum 160 characters total');
    });

    it('should throw error for unknown action type', () => {
      expect(() => getPromptTemplate('unknown_action')).toThrow(
        'No template found for action type: unknown_action'
      );
    });

    it('should inject organization context when provided', () => {
      const template = getPromptTemplate('ai_lead_scoring', mockOrgContext);
      
      expect(template.userContext).toContain('ORGANIZATION-SPECIFIC CONTEXT');
      expect(template.userContext).toContain('Technology');
      expect(template.userContext).toContain('Guardian AI CRM');
      expect(template.userContext).toContain('HISTORICAL CONVERSION PATTERNS');
    });
  });

  describe('injectOrganizationContext', () => {
    it('should properly inject organization context into prompt', () => {
      const basePrompt = 'Base prompt content';
      const enhancedPrompt = injectOrganizationContext(basePrompt, mockOrgContext);
      
      expect(enhancedPrompt).toContain(basePrompt);
      expect(enhancedPrompt).toContain('Industry Focus: Technology');
      expect(enhancedPrompt).toContain('Target Market: Enterprise, SMB');
      expect(enhancedPrompt).toContain('Brand Voice: professional');
      expect(enhancedPrompt).toContain('Key Products: Guardian AI CRM, Analytics Suite');
      expect(enhancedPrompt).toContain('Technology: 80+ score = 85% conversion');
    });

    it('should handle organization context without previous conversions', () => {
      const contextWithoutConversions = { ...mockOrgContext };
      delete contextWithoutConversions.previousConversions;
      
      const enhancedPrompt = injectOrganizationContext(
        'Base prompt',
        contextWithoutConversions
      );
      
      expect(enhancedPrompt).toContain('Industry Focus: Technology');
      expect(enhancedPrompt).not.toContain('HISTORICAL CONVERSION PATTERNS');
    });
  });

  describe('validatePromptOutput', () => {
    describe('lead scoring validation', () => {
      it('should validate correct lead scoring output', () => {
        const validOutput = {
          score: 85,
          category: 'Hot',
          reasoning: 'VP-level tech executive at mid-market software company',
          breakdown: { contact_quality: 25, company_profile: 30 },
          next_actions: ['Schedule demo', 'Research current CRM'],
          priority: 'high',
        };

        const validation = validatePromptOutput(validOutput, leadScoringPrompt);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should reject invalid score values', () => {
        const invalidOutput = {
          score: 150, // Invalid: > 100
          category: 'Hot',
          reasoning: 'Valid reasoning',
        };

        const validation = validatePromptOutput(invalidOutput, leadScoringPrompt);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Score must be between 1-100');
      });

      it('should reject invalid category values', () => {
        const invalidOutput = {
          score: 85,
          category: 'Medium', // Invalid: not Hot/Warm/Cold
          reasoning: 'Valid reasoning',
        };

        const validation = validatePromptOutput(invalidOutput, leadScoringPrompt);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Category must be Hot, Warm, or Cold');
      });

      it('should reject reasoning that is too long', () => {
        const invalidOutput = {
          score: 85,
          category: 'Hot',
          reasoning: 'A'.repeat(200), // Too long: > 150 chars
        };

        const validation = validatePromptOutput(invalidOutput, leadScoringPrompt);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Reasoning must be 1-150 characters');
      });

      it('should handle missing required fields', () => {
        const invalidOutput = {
          score: 85,
          // Missing category and reasoning
        };

        const validation = validatePromptOutput(invalidOutput, leadScoringPrompt);
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate non-JSON output formats', () => {
      const textOutput = 'Simple text response';
      const validation = validatePromptOutput(textOutput, whatsappMessagePrompt);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle validation errors gracefully', () => {
      const invalidData = null;
      const validation = validatePromptOutput(invalidData, leadScoringPrompt);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('template structure validation', () => {
    const templates = [
      { name: 'leadScoringPrompt', template: leadScoringPrompt },
      { name: 'emailGenerationPrompt', template: emailGenerationPrompt },
      { name: 'whatsappMessagePrompt', template: whatsappMessagePrompt },
    ];

    templates.forEach(({ name, template }) => {
      describe(name, () => {
        it('should have required structure', () => {
          expect(template.systemContext).toBeTruthy();
          expect(template.userContext).toBeTruthy();
          expect(Array.isArray(template.examples)).toBe(true);
          expect(Array.isArray(template.constraints)).toBe(true);
          expect(['json', 'text', 'markdown']).toContain(template.outputFormat);
          expect(template.version).toBeTruthy();
          expect(template.lastUpdated).toBeInstanceOf(Date);
        });

        it('should have meaningful examples', () => {
          template.examples.forEach(example => {
            expect(example.input).toBeTruthy();
            expect(example.output).toBeTruthy();
          });
        });

        it('should have actionable constraints', () => {
          expect(template.constraints.length).toBeGreaterThan(0);
          template.constraints.forEach(constraint => {
            expect(typeof constraint).toBe('string');
            expect(constraint.length).toBeGreaterThan(10);
          });
        });
      });
    });
  });

  describe('template versioning', () => {  
    it('should have consistent version across templates', () => {
      const templates = [leadScoringPrompt, emailGenerationPrompt, whatsappMessagePrompt];
      const versions = templates.map(t => t.version);
      
      // All templates should have the same major version
      expect(new Set(versions)).toHaveProperty('size', 1);
      expect(versions[0]).toBe('2.0');
    });

    it('should have recent lastUpdated dates', () => {
      const templates = [leadScoringPrompt, emailGenerationPrompt, whatsappMessagePrompt];
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      templates.forEach(template => {
        expect(template.lastUpdated).toBeInstanceOf(Date);
        expect(template.lastUpdated.getTime()).toBeGreaterThan(oneWeekAgo.getTime());
      });
    });
  });
});