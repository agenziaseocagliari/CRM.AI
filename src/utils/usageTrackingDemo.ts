// ===================================================================
// GUARDIAN AI CRM - USAGE TRACKING DEMO SCRIPT
// File: src/utils/usageTrackingDemo.ts
// Script per testare manualmente il sistema di usage tracking
// ===================================================================

import { UsageTrackingService } from '../lib/services/usageTrackingService';
import type { TrackUsageRequest, ServiceType } from '../types/usage';

/**
 * Demo script per testare il sistema di usage tracking
 * Esegue vari scenari di test per validare funzionalità
 */
export class UsageTrackingDemo {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Test 1: Simulare richieste AI multiple
   */
  async testAIRequests() {
    console.log('🤖 Testing AI Request Tracking...');
    
    try {
      // Simula 5 richieste AI con metadati diversi
      const aiScenarios = [
        { action: 'lead_scoring', metadata: { model: 'gpt-4', tokens: 150 } },
        { action: 'email_generation', metadata: { model: 'gpt-3.5', tokens: 300 } },
        { action: 'chatbot_response', metadata: { model: 'gpt-4', tokens: 120 } },
        { action: 'content_analysis', metadata: { model: 'gpt-4', tokens: 200 } },
        { action: 'sentiment_analysis', metadata: { model: 'gpt-3.5', tokens: 80 } }
      ];

      for (const scenario of aiScenarios) {
        const request: TrackUsageRequest = {
          organizationId: this.organizationId,
          service_type: 'ai_request',
          service_action: scenario.action,
          quantity: 1,
          metadata: {
            ...scenario.metadata,
            timestamp: new Date().toISOString(),
            demo: true
          }
        };

        const result = await UsageTrackingService.trackUsage(this.organizationId, request);
        console.log(`✅ AI ${scenario.action}:`, result.success ? 'tracked' : 'failed');
        
        if (result.quota_exceeded) {
          console.warn(`⚠️ Quota exceeded for AI requests!`);
        }
      }

    } catch (error) {
      console.error('❌ AI Request Test Failed:', error);
    }
  }

  /**
   * Test 2: Simulare invio WhatsApp bulk
   */
  async testWhatsAppBulk() {
    console.log('📱 Testing WhatsApp Bulk Tracking...');
    
    try {
      // Simula invio bulk a 25 contatti
      const request: TrackUsageRequest = {
        organizationId: this.organizationId,
        service_type: 'whatsapp_message',
        quantity: 25,
        metadata: {
          campaign: 'monthly_newsletter',
          template: 'newsletter_v2',
          recipient_count: 25,
          success_rate: 0.96,
          demo: true
        }
      };

      const result = await UsageTrackingService.trackUsage(this.organizationId, request);
      console.log('✅ WhatsApp Bulk:', result.success ? 'tracked' : 'failed');
      
      if (result.quota_exceeded) {
        console.warn('⚠️ Quota exceeded for WhatsApp messages!');
      }

    } catch (error) {
      console.error('❌ WhatsApp Test Failed:', error);
    }
  }

  /**
   * Test 3: Simulare email marketing campaign
   */
  async testEmailMarketing() {
    console.log('📧 Testing Email Marketing Tracking...');
    
    try {
      // Simula invio email a 500 contatti
      const request: TrackUsageRequest = {
        organizationId: this.organizationId,
        service_type: 'email_marketing',
        quantity: 500,
        metadata: {
          campaign: 'black_friday_2024',
          segment: 'active_customers',
          template_id: 'bf_promo_v3',
          subject: 'Black Friday Exclusive: 50% Off!',
          open_rate_estimate: 0.24,
          click_rate_estimate: 0.08,
          demo: true
        }
      };

      const result = await UsageTrackingService.trackUsage(this.organizationId, request);
      console.log('✅ Email Marketing:', result.success ? 'tracked' : 'failed');
      
      if (result.quota_exceeded) {
        console.warn('⚠️ Quota exceeded for email marketing!');
      }

    } catch (error) {
      console.error('❌ Email Marketing Test Failed:', error);
    }
  }

  /**
   * Test 4: Verificare statistiche usage
   */
  async testUsageStatistics() {
    console.log('📊 Testing Usage Statistics...');
    
    try {
      const stats = await UsageTrackingService.getUsageStatistics(this.organizationId);
      
      if (stats) {
        console.log('✅ Usage Statistics Retrieved:');
        console.log(`📈 AI Requests: ${stats.usage.ai_requests.used}/${stats.usage.ai_requests.limit} (${stats.usage.ai_requests.percentage}%)`);
        console.log(`📱 WhatsApp Messages: ${stats.usage.whatsapp_messages.used}/${stats.usage.whatsapp_messages.limit} (${stats.usage.whatsapp_messages.percentage}%)`);
        console.log(`📧 Email Marketing: ${stats.usage.email_marketing.used}/${stats.usage.email_marketing.limit} (${stats.usage.email_marketing.percentage}%)`);
        console.log(`💰 Current Period Cost: €${(stats.costs.total_cents / 100).toFixed(2)}`);
        console.log(`📅 Days Remaining: ${stats.current_period.days_remaining}`);
        
        // Alert status
        if (stats.alerts.ai_warning || stats.alerts.whatsapp_warning || stats.alerts.email_warning) {
          console.warn('⚠️ Usage warnings detected!');
        }
        
        if (stats.alerts.ai_critical || stats.alerts.whatsapp_critical || stats.alerts.email_critical) {
          console.error('🚨 Critical usage alerts detected!');
        }
        
      } else {
        console.error('❌ No statistics available');
      }

    } catch (error) {
      console.error('❌ Statistics Test Failed:', error);
    }
  }

  /**
   * Test 5: Simulare scenario reale - Lead Scoring Workflow
   */
  async testLeadScoringWorkflow() {
    console.log('🎯 Testing Real Lead Scoring Workflow...');
    
    try {
      // Step 1: AI Lead Scoring
      console.log('  1. Running AI Lead Scoring...');
      const leadScoringResult = await UsageTrackingService.trackUsage(this.organizationId, {
        organizationId: this.organizationId,
        service_type: 'ai_request',
        service_action: 'lead_scoring',
        quantity: 1,
        metadata: {
          lead_id: 'lead_demo_123',
          lead_email: 'prospect@example.com',
          model: 'gpt-4',
          score_result: 87,
          confidence: 0.93,
          factors: ['company_size', 'budget_fit', 'decision_timeline'],
          demo: true
        }
      });

      if (leadScoringResult.success && !leadScoringResult.quota_exceeded) {
        // Step 2: High score lead gets WhatsApp follow-up
        console.log('  2. High score detected, sending WhatsApp follow-up...');
        const whatsappResult = await UsageTrackingService.trackUsage(this.organizationId, {
          organizationId: this.organizationId,
          service_type: 'whatsapp_message',
          quantity: 1,
          metadata: {
            lead_id: 'lead_demo_123',
            template: 'high_score_follow_up',
            personalized: true,
            sent_within_minutes: 2,
            demo: true
          }
        });

        console.log('✅ Complete Lead Scoring Workflow:', whatsappResult.success ? 'success' : 'failed');
      } else {
        console.warn('⚠️ Lead scoring failed or quota exceeded');
      }

    } catch (error) {
      console.error('❌ Lead Scoring Workflow Failed:', error);
    }
  }

  /**
   * Esegue tutti i test in sequenza
   */
  async runAllTests() {
    console.log('🚀 Starting Usage Tracking Demo Tests...');
    console.log(`Organization ID: ${this.organizationId}`);
    console.log('='.repeat(50));

    await this.testAIRequests();
    console.log();
    
    await this.testWhatsAppBulk();
    console.log();
    
    await this.testEmailMarketing();
    console.log();
    
    await this.testLeadScoringWorkflow();
    console.log();
    
    await this.testUsageStatistics();
    console.log();
    
    console.log('✅ All tests completed!');
    console.log('='.repeat(50));
  }

  /**
   * Test delle performance con richieste multiple
   */
  async testPerformance() {
    console.log('⚡ Testing Performance with Concurrent Requests...');
    
    const startTime = Date.now();
    const promises: Promise<unknown>[] = [];
    
    // Simula 20 richieste concorrenti
    for (let i = 0; i < 20; i++) {
      const serviceTypes: ServiceType[] = ['ai_request', 'whatsapp_message', 'email_marketing'];
      const serviceType = serviceTypes[i % 3];
      
      promises.push(
        UsageTrackingService.trackUsage(this.organizationId, {
          organizationId: this.organizationId,
          service_type: serviceType,
          quantity: 1,
          metadata: {
            test_request: i,
            batch: 'performance_test',
            demo: true
          }
        })
      );
    }
    
    try {
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successCount = results.filter(r => (r as { success: boolean }).success).length;
      
      console.log(`✅ Performance Test Results:`);
      console.log(`   - Total Requests: 20`);
      console.log(`   - Successful: ${successCount}`);
      console.log(`   - Duration: ${duration}ms`);
      console.log(`   - Average: ${(duration / 20).toFixed(2)}ms per request`);
      
    } catch (error) {
      console.error('❌ Performance Test Failed:', error);
    }
  }
}

// Funzione di utilità per eseguire demo da console
export async function runUsageTrackingDemo(organizationId: string) {
  const demo = new UsageTrackingDemo(organizationId);
  await demo.runAllTests();
  await demo.testPerformance();
}

// Export per uso in development
if (typeof window !== 'undefined') {
  (window as { runUsageTrackingDemo?: typeof runUsageTrackingDemo }).runUsageTrackingDemo = runUsageTrackingDemo;
  console.log('🔧 Usage Tracking Demo available: runUsageTrackingDemo("your-org-id")');
}

export default UsageTrackingDemo;