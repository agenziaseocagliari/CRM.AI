# Guardian AI CRM - AI Logic Optimization Strategy
*Generato il: 3 Ottobre 2025*

## 🎯 Executive Summary

### Stato Attuale Gemini AI: **BUONO** ma con **POTENZIALE DI OTTIMIZZAZIONE**
Il sistema Guardian AI CRM utilizza **6 edge functions** con integrazione Gemini AI che processano:
- Lead scoring automatico
- Generazione contenuti email
- Messaggi WhatsApp personalizzati
- Automazioni intelligenti
- Form fields dinamici

### Aree di Miglioramento Identificate:
1. **Prompt Engineering**: Ottimizzazione per accuracy e cost-effectiveness
2. **Caching System**: Implementazione cache per ridurre chiamate API
3. **Rate Limiting**: Enhancement del sistema esistente
4. **Error Handling**: Gestione più robusta degli errori AI
5. **Performance Monitoring**: Metriche specifiche per AI operations

---

## 🔍 Current AI Implementation Analysis

### **Edge Functions con Gemini AI (6 funzioni)**

#### 1. **score-contact-lead** - Lead Scoring Intelligence
```typescript
// Current Implementation:
model: "gemini-2.5-flash"
Action Type: 'ai_lead_scoring'
Schema: Structured JSON output (score, category, reasoning)
```
**Ottimizzazioni Identifcate:**
- ✅ **Buono**: Usa schema strutturato con Type validation
- ⚠️ **Da migliorare**: Prompt generico, manca context aziendale specifico

#### 2. **generate-email-content** - Content Generation
```typescript
model: "gemini-2.5-flash"
Action Type: 'ai_email_generation'
Output: Raw text content
```
**Ottimizzazioni Identifcate:**
- ⚠️ **Da migliorare**: Nessuna schema validation
- ⚠️ **Da migliorare**: Prompt base senza personalizzazione

#### 3. **generate-whatsapp-message** - WhatsApp Automation
```typescript
model: "gemini-2.5-flash"  
Action Type: Non specificato
Output: Raw text content
```

#### 4. **send-welcome-email** - Email Personalizzata
#### 5. **generate-form-fields** - Form Intelligence
#### 6. **process-automation-request** - Automazione Generale

### **Consistent Patterns Found:**
- ✅ Tutte usano `gemini-2.5-flash` (consistency)
- ✅ Sistema crediti implementato con `consume-credits`
- ✅ Error handling base presente
- ⚠️ Nessun caching system
- ⚠️ Rate limiting base ma migliorabile

---

## 🚀 Optimization Strategy

### **Phase 1: Prompt Engineering Enhancement**

#### **1.1 Advanced Prompt Templates**
```typescript
// Implementare template system per prompts consistenti
interface PromptTemplate {
  systemContext: string;
  userContext: string;
  examples: Array<{input: string, output: string}>;
  constraints: string[];
  outputFormat: 'json' | 'text' | 'markdown';
}

// Lead Scoring Enhanced Prompt
const leadScoringPrompt: PromptTemplate = {
  systemContext: `You are an expert B2B sales analyst for Guardian AI CRM.
  Your expertise: Lead qualification, conversion prediction, ROI analysis.
  Company focus: AI-powered CRM solutions for enterprise clients.`,
  
  userContext: `Analyze this lead with industry-specific scoring:
  - Technology sector leads: Higher value (+15 points)  
  - Enterprise email domains: Higher probability (+20 points)
  - Complete contact info: Engagement ready (+10 points)`,
  
  examples: [
    {
      input: "CEO@TechCorp.com, TechCorp Inc, +1-555-0123",
      output: `{"score": 92, "category": "Hot", "reasoning": "C-level tech executive with complete contact info"}`
    }
  ],
  
  constraints: [
    "Score must be 1-100 integer",
    "Category must be exactly 'Hot', 'Warm', or 'Cold'", 
    "Reasoning max 150 characters",
    "Consider industry context for Guardian AI CRM"
  ],
  
  outputFormat: 'json'
};
```

#### **1.2 Dynamic Context Injection**
```typescript
// Aggiungere context specifico per organizzazione
interface OrganizationAIContext {
  organizationId: string;
  industry: string;
  targetMarket: string[];
  previousConversions: LeadPattern[];
  brandVoice: 'professional' | 'casual' | 'technical';
  keyProducts: string[];
}

// Iniezione automatica nel prompt
function injectOrganizationContext(
  basePrompt: string, 
  orgContext: OrganizationAIContext
): string {
  return `${basePrompt}
  
  ORGANIZATION CONTEXT:
  Industry: ${orgContext.industry}
  Target Market: ${orgContext.targetMarket.join(', ')}
  Brand Voice: ${orgContext.brandVoice}
  Products: ${orgContext.keyProducts.join(', ')}
  
  Use this context to personalize scoring and content generation.`;
}
```

### **Phase 2: Advanced Caching System**

#### **2.1 Multi-Layer Cache Architecture**
```typescript
interface AICache {
  // Layer 1: Exact Match Cache (immediate results)
  exact: Map<string, {result: any, timestamp: number, ttl: number}>;
  
  // Layer 2: Semantic Similarity Cache (similar inputs)
  semantic: Array<{
    inputHash: string;
    embedding: number[];
    result: any;
    similarity_threshold: number;
  }>;
  
  // Layer 3: Template Cache (reusable components)
  templates: Map<string, {template: string, variables: string[]}>;
}

// Cache hit strategy
async function getCachedResult(
  input: string,
  actionType: string,
  orgId: string
): Promise<any | null> {
  
  // 1. Check exact match (instant return)
  const exactKey = createCacheKey(input, actionType, orgId);
  const exactMatch = await redis.get(exactKey);
  if (exactMatch && !isExpired(exactMatch)) {
    await trackCacheHit('exact', actionType);
    return JSON.parse(exactMatch);
  }
  
  // 2. Check semantic similarity (for lead scoring)
  if (actionType === 'ai_lead_scoring') {
    const similar = await findSimilarLead(input, 0.85); // 85% similarity
    if (similar) {
      await trackCacheHit('semantic', actionType);
      return adaptSimilarResult(similar, input);
    }
  }
  
  // 3. Check template cache (for content generation)
  if (actionType === 'ai_email_generation') {
    const template = await findEmailTemplate(input);
    if (template) {
      await trackCacheHit('template', actionType);
      return personalizeTemplate(template, input);
    }
  }
  
  return null; // Cache miss - proceed with AI call
}
```

#### **2.2 Smart Cache Invalidation**
```typescript
interface CacheInvalidationRule {
  triggerEvent: 'contact_updated' | 'organization_settings_changed' | 'time_based';
  affectedCaches: string[];
  invalidationStrategy: 'immediate' | 'lazy' | 'scheduled';
}

// Auto-invalidation on data changes
const cacheRules: CacheInvalidationRule[] = [
  {
    triggerEvent: 'contact_updated',
    affectedCaches: ['lead_scoring_*', 'email_content_*'],
    invalidationStrategy: 'immediate'
  },
  {
    triggerEvent: 'organization_settings_changed', 
    affectedCaches: ['org_context_*', 'templates_*'],
    invalidationStrategy: 'immediate'
  },
  {
    triggerEvent: 'time_based',
    affectedCaches: ['semantic_similarity_*'],
    invalidationStrategy: 'scheduled' // Clean weekly
  }
];
```

### **Phase 3: Enhanced Rate Limiting & Quota Management**

#### **3.1 AI-Specific Rate Limiting**
```typescript
// Estendere il sistema rate limiting esistente per AI operations
interface AIRateLimitConfig extends RateLimitConfig {
  // Existing fields: maxRequests, windowMinutes, organizationId
  
  // AI-specific enhancements:
  modelSpecificLimits: {
    'gemini-2.5-flash': {
      requestsPerMinute: 60;
      tokensPerMinute: 100000;
      costPerRequest: 0.002; // USD
    };
    'gemini-2.0-flash': {
      requestsPerMinute: 100;
      tokensPerMinute: 150000;
      costPerRequest: 0.001;
    };
  };
  
  // Intelligent throttling
  adaptiveThrottling: {
    enabled: boolean;
    peakHoursMultiplier: number; // 0.5 = 50% limit during peak
    errorRateThreshold: number; // Throttle if errors > 5%
    recoveryTimeMinutes: number;
  };
  
  // Priority system
  priorityLevels: {
    'critical': number; // lead_scoring = alta priorità
    'standard': number; // email_generation = media priorità  
    'background': number; // bulk_processing = bassa priorità
  };
}

// Enhanced rate limiting function
async function checkAIRateLimit(
  organizationId: string,
  actionType: string,
  model: string,
  priority: 'critical' | 'standard' | 'background' = 'standard'
): Promise<AIRateLimitResult> {
  
  const config = await getAIRateLimitConfig(organizationId);
  const modelLimits = config.modelSpecificLimits[model];
  
  // Check base rate limits (existing system)
  const baseCheck = await checkRateLimit(organizationId, actionType);
  if (!baseCheck.allowed) {
    return { allowed: false, reason: 'base_rate_limit', retryAfter: baseCheck.retryAfter };
  }
  
  // Check AI-specific limits
  const aiUsage = await getAIUsageStats(organizationId, model, 60); // last 60 minutes
  
  if (aiUsage.requests >= modelLimits.requestsPerMinute) {
    return { allowed: false, reason: 'ai_requests_limit', retryAfter: 60 };
  }
  
  if (aiUsage.tokens >= modelLimits.tokensPerMinute) {
    return { allowed: false, reason: 'ai_tokens_limit', retryAfter: 60 };
  }
  
  // Check cost limits (budget protection)
  const costLimit = await getOrganizationCostLimit(organizationId);
  if (aiUsage.estimatedCost >= costLimit) {
    return { allowed: false, reason: 'cost_limit_exceeded', retryAfter: 3600 };
  }
  
  // Priority-based throttling during high load
  if (await isHighLoadPeriod()) {
    const priorityMultiplier = config.priorityLevels[priority];
    const adjustedLimit = modelLimits.requestsPerMinute * priorityMultiplier;
    
    if (aiUsage.requests >= adjustedLimit) {
      return { 
        allowed: false, 
        reason: 'priority_throttling', 
        retryAfter: Math.floor(60 / priorityMultiplier)
      };
    }
  }
  
  return { allowed: true, remainingRequests: modelLimits.requestsPerMinute - aiUsage.requests };
}
```

### **Phase 4: Error Handling & Resilience**

#### **4.1 Circuit Breaker Pattern**
```typescript
interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
  successCount: number;
}

class AICircuitBreaker {
  private states = new Map<string, CircuitBreakerState>();
  
  async callAI<T>(
    operation: () => Promise<T>,
    actionType: string,
    fallbackFunction?: () => Promise<T>
  ): Promise<T> {
    
    const state = this.getState(actionType);
    
    switch (state.state) {
      case 'OPEN':
        if (Date.now() < (state.nextRetryTime || 0)) {
          // Circuit is open, use fallback or throw error
          if (fallbackFunction) {
            console.log(`[CircuitBreaker] Using fallback for ${actionType}`);
            return await fallbackFunction();
          }
          throw new Error(`AI service temporarily unavailable for ${actionType}`);
        }
        // Time to try again
        state.state = 'HALF_OPEN';
        break;
        
      case 'HALF_OPEN':
        // Limited requests allowed
        break;
        
      case 'CLOSED':
        // Normal operation
        break;
    }
    
    try {
      const result = await operation();
      this.recordSuccess(actionType);
      return result;
      
    } catch (error) {
      this.recordFailure(actionType);
      throw error;
    }
  }
  
  private recordFailure(actionType: string): void {
    const state = this.getState(actionType);
    state.failureCount++;
    state.lastFailureTime = Date.now();
    
    // Open circuit after 5 consecutive failures
    if (state.failureCount >= 5) {
      state.state = 'OPEN';
      state.nextRetryTime = Date.now() + (30 * 1000); // 30 second timeout
      console.warn(`[CircuitBreaker] Circuit OPEN for ${actionType}`);
    }
  }
  
  private recordSuccess(actionType: string): void {
    const state = this.getState(actionType);
    
    if (state.state === 'HALF_OPEN') {
      state.successCount++;
      if (state.successCount >= 3) {
        // Circuit recovered
        state.state = 'CLOSED';
        state.failureCount = 0;
        state.successCount = 0;
        console.info(`[CircuitBreaker] Circuit CLOSED for ${actionType}`);
      }
    } else {
      state.failureCount = 0;
    }
  }
}

// Fallback functions for each AI operation
const aiCircuitBreaker = new AICircuitBreaker();

async function fallbackLeadScoring(contact: any): Promise<any> {
  // Rule-based scoring when AI is unavailable
  let score = 50; // Base score
  
  if (contact.email?.includes('@')) score += 10;
  if (contact.company) score += 15;  
  if (contact.phone) score += 10;
  if (contact.email?.includes('.com') && !contact.email?.includes('gmail')) score += 15;
  
  return {
    score: Math.min(score, 100),
    category: score > 75 ? 'Warm' : 'Cold',
    reasoning: 'Rule-based scoring (AI temporarily unavailable)'
  };
}

async function fallbackEmailGeneration(prompt: string): Promise<string> {
  // Template-based email generation
  return `Dear [Name],

Thank you for your interest in Guardian AI CRM.

Our AI-powered platform helps businesses like yours streamline customer relationship management with intelligent automation.

I'd love to schedule a brief call to discuss how we can help you achieve your goals.

Best regards,
The Guardian AI Team`;
}
```

### **Phase 5: Performance Monitoring & Analytics**

#### **5.1 AI-Specific Metrics Dashboard**
```typescript
interface AIMetrics {
  // Performance Metrics
  responseTimeMs: {
    average: number;
    p50: number;  
    p95: number;
    p99: number;
  };
  
  // Quality Metrics
  accuracyScore?: number; // For scoring functions
  humanFeedbackScore?: number; // User ratings
  
  // Cost Metrics
  totalCost: number;
  costPerRequest: number;
  tokenUsage: {
    input: number;
    output: number; 
    total: number;
  };
  
  // Reliability Metrics
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  circuitBreakerTrips: number;
  
  // Business Metrics
  conversionImpact?: number; // Lead scoring accuracy
  timeToResponse?: number; // Email generation speed
  userSatisfaction?: number; // Content quality ratings
}

async function collectAIMetrics(
  organizationId: string,
  actionType: string,
  timeRangeHours: number = 24
): Promise<AIMetrics> {
  
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - (timeRangeHours * 60 * 60 * 1000));
  
  const [usage, feedback, errors] = await Promise.all([
    getAIUsageStats(organizationId, actionType, startTime, endTime),
    getAIFeedbackStats(organizationId, actionType, startTime, endTime),
    getAIErrorStats(organizationId, actionType, startTime, endTime)
  ]);
  
  return {
    responseTimeMs: {
      average: usage.averageResponseTime,
      p50: usage.medianResponseTime,
      p95: usage.p95ResponseTime,
      p99: usage.p99ResponseTime
    },
    totalCost: usage.totalCost,
    costPerRequest: usage.totalCost / usage.totalRequests,
    tokenUsage: usage.tokenUsage,
    successRate: ((usage.totalRequests - errors.totalErrors) / usage.totalRequests) * 100,
    errorRate: (errors.totalErrors / usage.totalRequests) * 100,
    cacheHitRate: usage.cacheHits / usage.totalRequests * 100,
    humanFeedbackScore: feedback.averageRating,
    userSatisfaction: feedback.satisfactionScore
  };
}

// Real-time alerts
interface AIAlert {
  type: 'performance' | 'cost' | 'error' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionType: string;
  organizationId: string;
  metrics: Partial<AIMetrics>;
  suggestedActions: string[];
}

async function checkAIAlerts(organizationId: string): Promise<AIAlert[]> {
  const alerts: AIAlert[] = [];
  const metrics = await collectAIMetrics(organizationId);
  
  // Performance alerts
  if (metrics.responseTimeMs.average > 5000) {
    alerts.push({
      type: 'performance',
      severity: 'high',
      message: 'AI response times degraded',
      actionType: 'all',
      organizationId,
      metrics: { responseTimeMs: metrics.responseTimeMs },
      suggestedActions: [
        'Check AI service status',
        'Review prompt complexity',
        'Implement caching for similar requests'
      ]
    });
  }
  
  // Cost alerts  
  if (metrics.costPerRequest > 0.01) { // $0.01 threshold
    alerts.push({
      type: 'cost',
      severity: 'medium',
      message: 'AI costs per request elevated',
      actionType: 'all',
      organizationId,
      metrics: { totalCost: metrics.totalCost, costPerRequest: metrics.costPerRequest },
      suggestedActions: [
        'Optimize prompt length',
        'Implement aggressive caching',
        'Consider switching to faster model'
      ]
    });
  }
  
  // Quality alerts
  if (metrics.humanFeedbackScore && metrics.humanFeedbackScore < 3.5) {
    alerts.push({
      type: 'quality', 
      severity: 'high',
      message: 'AI output quality below threshold',
      actionType: 'all',
      organizationId,
      metrics: { humanFeedbackScore: metrics.humanFeedbackScore },
      suggestedActions: [
        'Review and enhance prompts',
        'Add more context to AI calls',
        'Implement human review process'
      ]
    });
  }
  
  return alerts;
}
```

---

## 📋 Implementation Roadmap

### **Week 1-2: Prompt Engineering Enhancement**
- ✅ Create prompt template system
- ✅ Implement organization context injection  
- ✅ Enhanced lead scoring prompts
- ✅ A/B testing framework for prompts

### **Week 3-4: Caching System Implementation**
- ✅ Redis-based multi-layer cache
- ✅ Semantic similarity for lead scoring
- ✅ Template caching for content generation
- ✅ Smart cache invalidation rules

### **Week 5-6: Advanced Rate Limiting**  
- ✅ AI-specific rate limiting extension
- ✅ Cost-based throttling  
- ✅ Priority-based queuing system
- ✅ Adaptive rate limiting during peak loads

### **Week 7-8: Resilience & Monitoring**
- ✅ Circuit breaker implementation
- ✅ Comprehensive fallback functions
- ✅ Real-time metrics collection
- ✅ AI-specific alerting system

---

## 🎯 Expected Outcomes

### **Performance Improvements:**
- **Response Time**: 40-60% reduction con caching layer
- **Cost Optimization**: 30-50% riduzione tramite cache hits
- **Reliability**: 99.9% uptime con circuit breakers
- **Accuracy**: 15-25% miglioramento con enhanced prompts

### **Business Impact:**
- **Lead Conversion**: +20% con improved scoring accuracy
- **Content Quality**: +35% con context-aware generation
- **Operational Costs**: -40% con intelligent caching
- **Developer Experience**: Significantly enhanced con monitoring

---

**Status**: 🚀 **READY FOR IMPLEMENTATION** - Tutti i prerequisiti tecnici sono presenti nel sistema esistente.