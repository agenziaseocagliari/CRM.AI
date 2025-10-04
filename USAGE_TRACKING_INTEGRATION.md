# 🚀 Guardian AI CRM - Usage Tracking Integration Guide

## 📖 **Guida per Developers: Integrazione Sistema Usage Tracking**

Questa guida spiega come integrare il sistema di usage tracking nei servizi esistenti del Guardian AI CRM.

---

## 🏗️ **Architettura del Sistema**

### Componenti Principali
- **Database Schema**: 5 tabelle per tracking completo (`subscription_tiers`, `organization_subscriptions`, `usage_tracking`, `usage_quotas`, `billing_events`)
- **TypeScript Types**: 12 interfacce complete in `src/types/usage.ts`
- **Service Layer**: `UsageTrackingService` per logica business
- **React Hooks**: 3 hook specializzati per diverse esigenze
- **UI Components**: Dashboard completo con progress bars e alert

### Flusso di Tracking
```
[Service Call] → [Quota Check] → [Execute] → [Track Usage] → [Update Stats] → [Check Alerts]
```

---

## 🔧 **Quick Start Integration**

### 1. Import Hook di Integrazione
```typescript
import { useUsageTrackingIntegration } from '../lib/hooks/useUsageTrackingIntegration';
```

### 2. Setup nel Component
```typescript
function MyAIComponent() {
  const { trackAIRequest, trackWhatsAppMessage, trackEmailMarketing } = useUsageTrackingIntegration({
    organizationId: 'your-org-id',
    onQuotaExceeded: (serviceType) => {
      toast.error(`Quota exceeded for ${serviceType}! Please upgrade your plan.`);
    },
    onQuotaWarning: (serviceType, percentage) => {
      if (percentage >= 90) {
        toast.warn(`${serviceType} usage at ${percentage}%`);
      }
    }
  });
  
  // Your component logic here...
}
```

### 3. Wrapper Existing Functions
```typescript
// Prima (senza tracking)
const generateEmailWithAI = async (prompt: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
  return response.choices[0].message.content;
};

// Dopo (con tracking automatico)
const generateEmailWithAI = async (prompt: string) => {
  return await trackAIRequest(
    async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      });
      return response.choices[0].message.content;
    },
    {
      service_action: 'email_generation',
      model: 'gpt-4',
      prompt_length: prompt.length,
      contact_id: contactId
    }
  );
};
```

---

## 🎯 **Esempi di Integrazione per Servizio**

### 🤖 AI Request Tracking

#### Lead Scoring Service
```typescript
// src/services/leadScoringService.ts
import { useUsageTrackingIntegration } from '../lib/hooks/useUsageTrackingIntegration';

export function useLeadScoringService(organizationId: string) {
  const { trackAIRequest } = useUsageTrackingIntegration({ organizationId });

  const scoreLeadWithAI = async (leadData: LeadData) => {
    return trackAIRequest(
      async () => {
        // Your existing AI logic
        const score = await callGeminiAPI(leadData);
        return score;
      },
      {
        service_action: 'lead_scoring',
        model: 'gemini-pro',
        lead_id: leadData.id,
        data_points: Object.keys(leadData).length
      }
    );
  };

  return { scoreLeadWithAI };
}
```

#### Email Generation Service
```typescript
// src/services/emailGenerationService.ts
export function useEmailGenerationService(organizationId: string) {
  const { trackAIRequest } = useUsageTrackingIntegration({ organizationId });

  const generatePersonalizedEmail = async (contact: Contact, template: string) => {
    return trackAIRequest(
      async () => {
        const personalizedEmail = await callGeminiAPI({
          template,
          contact_name: contact.name,
          contact_company: contact.company
        });
        return personalizedEmail;
      },
      {
        service_action: 'email_generation',
        model: 'gemini-pro',
        contact_id: contact.id,
        template_type: template,
        personalization_fields: ['name', 'company']
      }
    );
  };

  return { generatePersonalizedEmail };
}
```

### 📱 WhatsApp Message Tracking

#### Bulk WhatsApp Campaign
```typescript
// src/services/whatsappCampaignService.ts
export function useWhatsAppCampaignService(organizationId: string) {
  const { trackWhatsAppMessage } = useUsageTrackingIntegration({
    organizationId,
    onQuotaExceeded: () => {
      toast.error('WhatsApp quota exceeded! Campaign paused.');
    }
  });

  const sendBulkCampaign = async (contacts: Contact[], message: string) => {
    return trackWhatsAppMessage(
      async () => {
        // Your existing Twilio logic
        const results = await twilioClient.sendBulkMessages(contacts, message);
        return results;
      },
      contacts.length, // recipient count
      {
        campaign_type: 'bulk_promotional',
        message_length: message.length,
        template_used: true,
        contacts: contacts.map(c => c.id)
      }
    );
  };

  return { sendBulkCampaign };
}
```

#### Automated Follow-up
```typescript
// src/services/whatsappAutomationService.ts
export function useWhatsAppAutomationService(organizationId: string) {
  const { trackWhatsAppMessage } = useUsageTrackingIntegration({ organizationId });

  const sendAutomatedFollowUp = async (leadId: string, followUpType: string) => {
    return trackWhatsAppMessage(
      async () => {
        const template = getFollowUpTemplate(followUpType);
        const result = await twilioClient.sendMessage(leadId, template);
        return result;
      },
      1, // single recipient
      {
        automation_id: `follow_up_${followUpType}`,
        lead_id: leadId,
        trigger: 'lead_score_threshold',
        automated: true
      }
    );
  };

  return { sendAutomatedFollowUp };
}
```

### 📧 Email Marketing Tracking

#### Newsletter Campaign
```typescript
// src/services/emailMarketingService.ts
export function useEmailMarketingService(organizationId: string) {
  const { trackEmailMarketing } = useUsageTrackingIntegration({
    organizationId,
    onQuotaWarning: (serviceType, percentage) => {
      if (percentage >= 80) {
        toast.warn(`Email quota at ${percentage}% - consider upgrading`);
      }
    }
  });

  const sendNewsletterCampaign = async (campaign: NewsletterCampaign) => {
    return trackEmailMarketing(
      async () => {
        // Your existing SendGrid logic
        const result = await sendGridClient.send({
          to: campaign.recipients,
          subject: campaign.subject,
          html: campaign.content
        });
        return result;
      },
      campaign.recipients.length,
      {
        campaign_id: campaign.id,
        campaign_type: 'newsletter',
        subject: campaign.subject,
        template_id: campaign.templateId,
        segment: campaign.segment,
        scheduled: campaign.scheduledAt ? true : false
      }
    );
  };

  return { sendNewsletterCampaign };
}
```

---

## 🔍 **Pattern di Integrazione Avanzati**

### 1. Workflow Multi-Service
```typescript
// Workflow completo: Lead Scoring → WhatsApp Follow-up → Email Nurturing
export function useLeadNurturingWorkflow(organizationId: string) {
  const { trackAIRequest, trackWhatsAppMessage, trackEmailMarketing } = 
    useUsageTrackingIntegration({ organizationId });

  const processNewLead = async (lead: Lead) => {
    // Step 1: AI Lead Scoring
    const score = await trackAIRequest(
      () => scoreLeadWithAI(lead),
      { service_action: 'lead_scoring', lead_id: lead.id }
    );

    // Step 2: High score → WhatsApp immediate follow-up
    if (score > 80) {
      await trackWhatsAppMessage(
        () => sendImmediateFollowUp(lead),
        1,
        { lead_id: lead.id, trigger: 'high_score' }
      );
    }

    // Step 3: Add to email nurture sequence
    await trackEmailMarketing(
      () => addToNurtureSequence(lead),
      1,
      { lead_id: lead.id, sequence: 'new_lead_nurture' }
    );

    return { leadId: lead.id, score, processed: true };
  };

  return { processNewLead };
}
```

### 2. Conditional Quota Checking
```typescript
// Check quota before starting expensive operations
export function useConditionalAIService(organizationId: string) {
  const { trackAIRequest } = useUsageTrackingIntegration({ organizationId });
  const { canUseAI } = useQuotaCheck(organizationId);

  const smartContentGeneration = async (content: ContentRequest) => {
    // Check if we have quota for AI
    const quotaCheck = canUseAI(1);
    
    if (!quotaCheck.allowed) {
      // Fallback to template-based generation
      return generateWithTemplate(content);
    }

    // Use AI if quota available
    return trackAIRequest(
      () => generateWithAI(content),
      { 
        service_action: 'content_generation',
        fallback_avoided: true,
        content_type: content.type 
      }
    );
  };

  return { smartContentGeneration };
}
```

### 3. Batch Processing con Rate Limiting
```typescript
// Process large batches while respecting quotas
export function useBatchProcessingService(organizationId: string) {
  const { trackAIRequest } = useUsageTrackingIntegration({ organizationId });
  const { canUseAI } = useQuotaCheck(organizationId);

  const processBatchWithRateLimit = async (items: ProcessingItem[]) => {
    const results = [];
    const batchSize = 5;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Check quota before each batch
      const quotaCheck = canUseAI(batch.length);
      if (!quotaCheck.allowed) {
        console.warn(`Stopping batch processing: ${quotaCheck.reason}`);
        break;
      }

      // Process batch with tracking
      const batchResults = await Promise.all(
        batch.map(item => 
          trackAIRequest(
            () => processItem(item),
            { 
              batch_id: Math.floor(i / batchSize),
              item_id: item.id,
              batch_size: batch.length 
            }
          )
        )
      );

      results.push(...batchResults);
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  };

  return { processBatchWithRateLimit };
}
```

---

## 🎛️ **Hook Configuration Options**

### useUsageTrackingIntegration Props
```typescript
interface UseUsageTrackingIntegrationProps {
  organizationId: string;
  
  // Callbacks per eventi quota
  onQuotaExceeded?: (serviceType: ServiceType) => void;
  onQuotaWarning?: (serviceType: ServiceType, percentage: number) => void;
  
  // Opzioni avanzate
  enableRetries?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  
  // Debug mode
  debugMode?: boolean;
}
```

### Esempi di Configurazione
```typescript
// Configurazione Basic
const { trackAIRequest } = useUsageTrackingIntegration({
  organizationId: orgId
});

// Configurazione Advanced con Callbacks
const { trackAIRequest } = useUsageTrackingIntegration({
  organizationId: orgId,
  onQuotaExceeded: (serviceType) => {
    // Redirect to upgrade page
    router.push(`/upgrade?service=${serviceType}`);
  },
  onQuotaWarning: (serviceType, percentage) => {
    // Show progressive warnings
    if (percentage >= 90) {
      toast.error(`${serviceType} quota at ${percentage}%!`);
    } else if (percentage >= 80) {
      toast.warn(`${serviceType} quota at ${percentage}%`);
    }
  }
});

// Configurazione Debug
const { trackAIRequest } = useUsageTrackingIntegration({
  organizationId: orgId,
  debugMode: process.env.NODE_ENV === 'development',
  enableRetries: true,
  maxRetries: 3
});
```

---

## 📊 **Monitoring e Dashboard Integration**

### 1. Add Dashboard to Existing Components
```typescript
// src/components/YourExistingComponent.tsx
import { UsageDashboard } from '../components/usage/UsageDashboard';

function YourExistingComponent() {
  return (
    <div>
      {/* Your existing content */}
      
      {/* Add usage dashboard */}
      <div className="mt-6">
        <h3>Usage & Quotas</h3>
        <UsageDashboard organizationId={organizationId} />
      </div>
    </div>
  );
}
```

### 2. Real-time Usage Monitoring
```typescript
// Hook per monitoraggio real-time
export function useRealTimeUsageMonitoring(organizationId: string) {
  const { usageStats, refreshUsage } = useUsageTracking(organizationId);

  useEffect(() => {
    // Refresh every 30 seconds
    const interval = setInterval(refreshUsage, 30000);
    return () => clearInterval(interval);
  }, [refreshUsage]);

  // Alert when approaching limits
  useEffect(() => {
    if (usageStats) {
      Object.entries(usageStats.usage).forEach(([service, data]) => {
        if (data.percentage >= 90 && data.percentage < 100) {
          toast.warn(`${service} usage at ${data.percentage}%`);
        }
      });
    }
  }, [usageStats]);

  return usageStats;
}
```

---

## 🔧 **Testing e Debugging**

### 1. Demo Script Usage
```typescript
// In browser console or component
import { runUsageTrackingDemo } from '../utils/usageTrackingDemo';

// Run comprehensive test suite
await runUsageTrackingDemo('your-organization-id');
```

### 2. Enable Debug Logging
```typescript
// Set debug mode in hook
const { trackAIRequest } = useUsageTrackingIntegration({
  organizationId,
  debugMode: true
});

// Check browser console for detailed logs
```

### 3. Manual Testing Scenarios
```typescript
// Test quota limits
const testQuotaLimits = async () => {
  const { canUseAI, canSendWhatsApp, canSendEmails } = useQuotaCheck(orgId);
  
  console.log('AI Quota:', canUseAI(10));
  console.log('WhatsApp Quota:', canSendWhatsApp(50));
  console.log('Email Quota:', canSendEmails(1000));
};
```

---

## 🚀 **Best Practices**

### ✅ **Do's**
- Always wrap service calls with tracking hooks
- Check quotas before expensive operations
- Include meaningful metadata for analytics
- Handle quota exceeded gracefully
- Use batch processing for large operations
- Implement progressive warnings (80%, 90%, 100%)

### ❌ **Don'ts**
- Don't call tracking hooks inside loops without batching
- Don't ignore quota exceeded callbacks
- Don't track internal/system operations
- Don't forget to handle errors in tracked functions
- Don't use tracking for read-only operations

### 🎯 **Performance Tips**
- Use batch processing for multiple items
- Implement rate limiting for external APIs
- Cache quota checks for short periods
- Use simple hook for fire-and-forget tracking
- Debounce high-frequency operations

---

## 🔗 **File Structure Reference**

```
src/
├── types/usage.ts                              # TypeScript definitions
├── lib/services/usageTrackingService.ts        # Core service logic
├── lib/hooks/useUsageTrackingIntegration.ts    # Integration wrappers
├── hooks/useUsageTracking.ts                   # React hooks
├── components/usage/UsageDashboard.tsx         # UI dashboard
├── utils/usageTrackingDemo.ts                  # Testing utilities
└── __tests__/usageTrackingIntegration.test.ts  # Test scenarios

supabase/migrations/
├── create_usage_tracking_system.sql           # Database schema
└── create_usage_functions.sql                 # Stored procedures
```

---

## 📞 **Support & Troubleshooting**

### Common Issues
1. **"organizationId not available"**: Ensure user is authenticated and organization context is set
2. **"Quota exceeded"**: Implement proper upgrade flow or usage optimization
3. **"Slow tracking"**: Use simple hook for non-critical tracking
4. **"Missing metadata"**: Add service-specific context for better analytics

### Debug Commands
```javascript
// Browser console debugging
window.runUsageTrackingDemo('org-id');
localStorage.setItem('usage_debug', 'true');
```

---

**🎉 Il sistema di usage tracking è ora completamente integrato e pronto per il deployment in produzione!**