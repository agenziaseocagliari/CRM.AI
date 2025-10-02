# 🚀 API Optimization & Best Practices - Guardian AI CRM

**Version**: 1.0  
**Date**: January 2025  
**Status**: Production Guide

---

## 📋 Executive Summary

This guide provides best practices for optimizing API performance, reliability, and developer experience in Guardian AI CRM.

### API Performance Goals

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| **Response Time (p95)** | 800ms | 500ms | High |
| **Response Time (p99)** | 1500ms | 1000ms | High |
| **Error Rate** | 2% | <1% | Critical |
| **Throughput** | 500 req/min | 1000 req/min | Medium |
| **Cache Hit Rate** | N/A | 60%+ | High |

---

## 🎯 Core Optimization Strategies

### 1. Request Batching

**Problem**: Multiple sequential API calls slow down operations

**Solution**: Batch related requests

```typescript
// ❌ BAD: Sequential requests (slow)
async function loadContactData(contactIds: string[]) {
  const contacts = [];
  for (const id of contactIds) {
    const contact = await fetchContact(id);  // 100ms each
    contacts.push(contact);
  }
  return contacts;  // Total: 100ms × N
}

// ✅ GOOD: Batch request (fast)
async function loadContactData(contactIds: string[]) {
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .in('id', contactIds);  // Single query
  
  return data;  // Total: ~100ms regardless of N
}

// ✅ BETTER: Parallel requests when batching not available
async function loadContactData(contactIds: string[]) {
  const promises = contactIds.map(id => fetchContact(id));
  return await Promise.all(promises);  // Total: ~100ms (parallel)
}
```

**Expected Impact**:
- Latency: -70% for batch operations
- Database load: -80%
- Network overhead: -60%

---

### 2. Response Caching

**Strategy**: Cache responses at multiple levels

```typescript
// src/utils/apiCache.ts
interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string | (() => string);
  invalidateOn?: string[]; // Events that invalidate cache
}

export class APICache {
  private static cache = new Map<string, { data: any; expires: number }>();
  
  /**
   * Wrap API call with caching
   */
  static async withCache<T>(
    config: CacheConfig,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cacheKey = typeof config.key === 'function' 
      ? config.key() 
      : config.key;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      console.log(`Cache HIT: ${cacheKey}`);
      return cached.data;
    }
    
    // Cache miss - fetch data
    console.log(`Cache MISS: ${cacheKey}`);
    const data = await fetcher();
    
    // Store in cache
    this.cache.set(cacheKey, {
      data,
      expires: Date.now() + (config.ttl * 1000),
    });
    
    // Setup invalidation listeners
    if (config.invalidateOn) {
      this.setupInvalidation(cacheKey, config.invalidateOn);
    }
    
    return data;
  }
  
  /**
   * Invalidate cache entries
   */
  static invalidate(pattern: string | RegExp) {
    const keys = Array.from(this.cache.keys());
    
    keys.forEach(key => {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      } else {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    });
  }
  
  private static setupInvalidation(
    cacheKey: string,
    events: string[]
  ) {
    events.forEach(event => {
      // Listen for invalidation events
      window.addEventListener(event, () => {
        this.cache.delete(cacheKey);
      });
    });
  }
}

// Usage examples
export async function getContacts(orgId: string) {
  return APICache.withCache(
    {
      key: `contacts:${orgId}`,
      ttl: 300, // 5 minutes
      invalidateOn: ['contact:created', 'contact:updated', 'contact:deleted'],
    },
    async () => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId);
      return data;
    }
  );
}

export async function getWorkflows(orgId: string) {
  return APICache.withCache(
    {
      key: `workflows:${orgId}`,
      ttl: 600, // 10 minutes
      invalidateOn: ['workflow:updated'],
    },
    async () => {
      const { data } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('organization_id', orgId);
      return data;
    }
  );
}

// Trigger cache invalidation on updates
export async function updateContact(id: string, updates: any) {
  const result = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id);
  
  // Invalidate related caches
  window.dispatchEvent(new Event('contact:updated'));
  
  return result;
}
```

**Cache Strategy by Data Type**:

| Data Type | TTL | Invalidation |
|-----------|-----|--------------|
| Static config | 1 hour | Manual deploy |
| User profile | 15 minutes | On update |
| Contact list | 5 minutes | On CRUD |
| Workflow list | 10 minutes | On update |
| Dashboard stats | 2 minutes | Real-time updates |
| Aggregations | 5 minutes | On data change |

**Expected Impact**:
- API calls: -60%
- Response time: -40%
- Database load: -60%
- Bandwidth: -50%

---

### 3. Pagination & Infinite Scroll

**Strategy**: Load data progressively

```typescript
// src/hooks/useInfiniteScroll.ts
import { useState, useEffect, useCallback } from 'react';

interface PaginationConfig {
  pageSize: number;
  fetchFunction: (offset: number, limit: number) => Promise<any[]>;
}

export function useInfiniteScroll<T>(config: PaginationConfig) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newItems = await config.fetchFunction(offset, config.pageSize);
      
      if (newItems.length < config.pageSize) {
        setHasMore(false);
      }
      
      setItems(prev => [...prev, ...newItems]);
      setOffset(prev => prev + config.pageSize);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoading(false);
    }
  }, [offset, loading, hasMore, config]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []);

  return { items, loading, hasMore, loadMore };
}

// Usage in component
export const ContactsList: React.FC = () => {
  const { items, loading, hasMore, loadMore } = useInfiniteScroll<Contact>({
    pageSize: 50,
    fetchFunction: async (offset, limit) => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Intersection observer for auto-load
  const observerTarget = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div>
      {items.map(item => (
        <ContactCard key={item.id} contact={item} />
      ))}
      
      {loading && <LoadingSpinner />}
      
      <div ref={observerTarget} style={{ height: 20 }} />
      
      {!hasMore && <div>No more contacts</div>}
    </div>
  );
};
```

**Benefits**:
- Initial load time: -60%
- Memory usage: -70%
- Perceived performance: +80%

---

### 4. Query Optimization

**Strategy**: Select only needed fields

```typescript
// ❌ BAD: Fetch all fields (slow, wasteful)
const { data } = await supabase
  .from('contacts')
  .select('*')  // All fields including large JSONB
  .eq('organization_id', orgId);

// ✅ GOOD: Select only needed fields (fast)
const { data } = await supabase
  .from('contacts')
  .select('id, name, email, phone, status')  // Only what's needed
  .eq('organization_id', orgId);

// ✅ BETTER: Use views for common queries
const { data } = await supabase
  .from('v_contacts_summary')  // Pre-computed view
  .select('*')
  .eq('organization_id', orgId);

// ✅ BEST: Combine with pagination and caching
const { data } = await APICache.withCache(
  {
    key: `contacts:summary:${orgId}:${page}`,
    ttl: 300,
  },
  async () => {
    const { data } = await supabase
      .from('v_contacts_summary')
      .select('id, name, email, status, last_contact_date')
      .eq('organization_id', orgId)
      .range(page * 50, (page + 1) * 50 - 1);
    return data;
  }
);
```

**Query Performance Tips**:

1. **Use indexes**: Ensure filtered columns have indexes
2. **Limit joins**: Avoid joining too many tables
3. **Use materialized views**: For complex aggregations
4. **Filter early**: Apply WHERE clauses as early as possible
5. **Avoid N+1**: Batch related queries

---

### 5. Error Handling & Retries

**Strategy**: Graceful degradation with automatic retries

```typescript
// src/utils/apiRetry.ts
interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export class APIRetry {
  private static defaultConfig: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED',
    ],
  };

  /**
   * Execute API call with automatic retries
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const cfg = { ...this.defaultConfig, ...config };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry non-retryable errors
        if (!this.isRetryable(error, cfg.retryableErrors)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === cfg.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = cfg.delayMs * Math.pow(cfg.backoffMultiplier, attempt - 1);
        
        console.log(`Retry attempt ${attempt}/${cfg.maxAttempts} after ${delay}ms`);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private static isRetryable(error: any, retryableErrors: string[]): boolean {
    const errorCode = error.code || error.name || '';
    return retryableErrors.some(code => 
      errorCode.toUpperCase().includes(code)
    );
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
export async function createContact(data: ContactInput) {
  return APIRetry.withRetry(
    async () => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return contact;
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
    }
  );
}
```

**Error Response Format**:

```typescript
interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
    timestamp: string;
  };
}

// Example error responses
const errors = {
  validation: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: { field: 'email', issue: 'Invalid format' },
    retryable: false,
  },
  
  rateLimit: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    details: { retryAfter: 60 },
    retryable: true,
  },
  
  serverError: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    retryable: true,
  },
};
```

---

### 6. Rate Limiting

**Strategy**: Protect API from abuse

```typescript
// Edge Function: Rate limiting middleware
export async function rateLimitMiddleware(
  req: Request,
  organizationId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check rate limit
  const { data } = await supabase.rpc('check_rate_limit', {
    p_org_id: organizationId,
    p_endpoint: endpoint,
    p_max_requests: 100,  // 100 requests
    p_window_ms: 60000,   // per minute
  });

  if (!data.allowed) {
    throw new Error('Rate limit exceeded');
  }

  return {
    allowed: true,
    remaining: data.remaining,
    resetAt: new Date(data.reset_at),
  };
}

// Include rate limit info in response headers
export function addRateLimitHeaders(
  response: Response,
  rateLimit: { remaining: number; resetAt: Date }
): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
  
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
```

**Rate Limit Tiers**:

| Tier | Requests/Min | Burst | Notes |
|------|--------------|-------|-------|
| Free | 60 | 100 | Basic usage |
| Pro | 300 | 500 | Standard tier |
| Enterprise | 1000 | 2000 | High volume |
| Internal | Unlimited | - | Admin operations |

---

### 7. Response Compression

**Strategy**: Reduce payload size

```typescript
// Vercel Edge Function with compression
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const data = await fetchLargeData();
  
  // Check if client accepts gzip
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  
  if (acceptEncoding.includes('gzip')) {
    // Compress response
    const compressed = await compressData(data);
    
    return new Response(compressed, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
    });
  }
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Expected Impact**:
- Payload size: -60-80%
- Transfer time: -60-80%
- Bandwidth costs: -60-80%

---

## 📈 Monitoring API Performance

### Key Metrics to Track

```typescript
// Record API metrics
export async function recordAPIMetrics(
  endpoint: string,
  duration: number,
  status: number,
  organizationId?: string
) {
  await supabase.rpc('record_metric', {
    p_metric_name: 'api_response_time_ms',
    p_metric_value: duration,
    p_metric_type: 'histogram',
    p_tags: {
      endpoint,
      status,
      status_class: `${Math.floor(status / 100)}xx`,
    },
    p_organization_id: organizationId,
  });
  
  // Record error rate
  if (status >= 400) {
    await supabase.rpc('record_metric', {
      p_metric_name: 'api_errors',
      p_metric_value: 1,
      p_metric_type: 'counter',
      p_tags: { endpoint, status },
    });
  }
}
```

### Performance Dashboard

**Metrics to Display**:
- Response time (p50, p95, p99)
- Error rate by endpoint
- Throughput (requests per minute)
- Cache hit rate
- Rate limit consumption

---

## ✅ API Best Practices Checklist

### Design

- [ ] RESTful endpoint naming
- [ ] Consistent response format
- [ ] Proper HTTP status codes
- [ ] Versioning strategy (v1, v2, etc.)
- [ ] Clear error messages

### Performance

- [ ] Response caching implemented
- [ ] Pagination for list endpoints
- [ ] Query optimization (indexes, views)
- [ ] Compression enabled
- [ ] Batch endpoints for bulk operations

### Reliability

- [ ] Rate limiting configured
- [ ] Automatic retries for transient failures
- [ ] Circuit breaker for external APIs
- [ ] Graceful degradation
- [ ] Proper error handling

### Security

- [ ] Authentication required
- [ ] Authorization checks
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] Rate limiting

### Monitoring

- [ ] Response time tracking
- [ ] Error rate monitoring
- [ ] Usage metrics
- [ ] Cache hit rate
- [ ] Alert rules configured

---

## 🎯 Expected Results

### Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **API Response Time (p95)** | 800ms | 500ms | -37.5% |
| **Cache Hit Rate** | 0% | 60% | New |
| **Error Rate** | 2% | 0.5% | -75% |
| **API Calls** | 10K/day | 4K/day | -60% |
| **Bandwidth** | 100GB/month | 40GB/month | -60% |

### Cost Savings

- **Database queries**: -60% → $40/month saved
- **Bandwidth**: -60% → $30/month saved
- **Compute time**: -40% → $50/month saved
- **Total**: $120/month saved

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: February 2025  
**API Team Contact**: api@guardian-ai-crm.com
