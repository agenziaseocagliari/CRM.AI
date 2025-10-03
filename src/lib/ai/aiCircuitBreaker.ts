// AI Circuit Breaker Pattern for Guardian AI CRM
// Prevents cascade failures and implements graceful degradation

import { diagnosticLogger } from '../mockDiagnosticLogger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time in ms before trying half-open
  monitoringWindow: number; // Time window for failure counting
  successThreshold: number; // Successes needed to close from half-open
  degradationMode: 'cache_only' | 'fallback_response' | 'queue_request';
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
  recoveryAttempts: number;
  degradedRequests: number;
}

export interface FallbackResponse {
  success: boolean;
  result: any;
  degraded: true;
  fallbackReason: string;
  confidence: 'high' | 'medium' | 'low';
  metadata: {
    circuitState: CircuitState;
    fallbackStrategy: string;
    suggestedRetryTime?: number;
  };
}

/**
 * Circuit Breaker for AI Services with intelligent fallback strategies
 */
export class AICircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private totalRequests = 0;
  private totalFailures = 0;
  private recoveryAttempts = 0;
  private degradedRequests = 0;

  private config: CircuitBreakerConfig;
  private actionType: string;
  private organizationId: string;

  constructor(
    actionType: string,
    organizationId: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.actionType = actionType;
    this.organizationId = organizationId;
    
    // Default configuration based on action type
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringWindow: 300000, // 5 minutes
      successThreshold: 3,
      degradationMode: 'cache_only',
      ...this.getDefaultConfigForAction(actionType),
      ...config
    };

    diagnosticLogger.info('ai-circuit-breaker', 'Circuit breaker initialized', {
      actionType,
      organizationId,
      config: this.config
    });
  }

  /**
   * Execute request through circuit breaker
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallbackStrategy?: () => Promise<FallbackResponse>
  ): Promise<T | FallbackResponse> {
    
    this.totalRequests++;
    
    // Check circuit state
    if (this.state === 'OPEN') {
      if (this.canAttemptRecovery()) {
        this.state = 'HALF_OPEN';
        this.recoveryAttempts++;
        
        diagnosticLogger.info('ai-circuit-breaker', 'Attempting recovery', {
          actionType: this.actionType,
          organizationId: this.organizationId,
          recoveryAttempts: this.recoveryAttempts
        });
      } else {
        // Circuit is open, use fallback
        return this.handleDegradedMode(fallbackStrategy);
      }
    }

    try {
      // Execute the operation
      const result = await operation();
      
      // Success - update metrics
      this.onSuccess();
      
      return result;

    } catch (error) {
      // Store original state before failure processing
      const wasHalfOpen = this.state === 'HALF_OPEN';
      
      // Failure - update metrics and check if circuit should open
      this.onFailure(error);
      
      // If circuit is now open (either from closed->open or half_open->open) or we failed during recovery, use fallback
      const currentState = this.state as CircuitState;
      const shouldUseFallback = currentState === 'OPEN' || wasHalfOpen;
      
      if (shouldUseFallback) {
        return this.handleDegradedMode(fallbackStrategy);
      }
      
      // Circuit still closed, re-throw error
      throw error;
    }
  }

  /**
   * Handle success response
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.config.successThreshold) {
        // Recovery successful, close circuit
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        
        diagnosticLogger.info('ai-circuit-breaker', 'Circuit closed - recovery successful', {
          actionType: this.actionType,
          organizationId: this.organizationId,
          recoveryAttempts: this.recoveryAttempts
        });
      }
    }
    
    // Reset failure count in monitoring window
    if (this.isWithinMonitoringWindow()) {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Handle failure response
   */
  private onFailure(error: any): void {
    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    
    diagnosticLogger.error('ai-circuit-breaker', 'Operation failed', {
      actionType: this.actionType,
      organizationId: this.organizationId,
      failureCount: this.failureCount,
      error: error instanceof Error ? error.message : error
    });

    // Check if circuit should open
    if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.successCount = 0;
      
      diagnosticLogger.warn('ai-circuit-breaker', 'Circuit opened due to failures', {
        actionType: this.actionType,
        organizationId: this.organizationId,
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold
      });
    } else if (this.state === 'HALF_OPEN') {
      // Failed during recovery, open circuit again
      this.state = 'OPEN';
      this.successCount = 0;
      
      diagnosticLogger.warn('ai-circuit-breaker', 'Recovery failed, circuit reopened', {
        actionType: this.actionType,
        organizationId: this.organizationId,
        recoveryAttempts: this.recoveryAttempts
      });
    }
  }

  /**
   * Check if can attempt recovery (half-open)
   */
  private canAttemptRecovery(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  /**
   * Check if within monitoring window
   */
  private isWithinMonitoringWindow(): boolean {
    return Date.now() - this.lastFailureTime <= this.config.monitoringWindow;
  }

  /**
   * Handle degraded mode operation
   */
  private async handleDegradedMode(
    fallbackStrategy?: () => Promise<FallbackResponse>
  ): Promise<FallbackResponse> {
    
    this.degradedRequests++;
    
    if (fallbackStrategy) {
      try {
        const fallback = await fallbackStrategy();
        
        diagnosticLogger.info('ai-circuit-breaker', 'Fallback strategy executed', {
          actionType: this.actionType,
          organizationId: this.organizationId,
          fallbackReason: fallback.fallbackReason,
          confidence: fallback.confidence
        });
        
        return fallback;
      } catch (fallbackError) {
        diagnosticLogger.error('ai-circuit-breaker', 'Fallback strategy failed', fallbackError);
      }
    }

    // Default degradation based on configuration
    return this.getDefaultFallback();
  }

  /**
   * Get default fallback response based on degradation mode
   */
  private getDefaultFallback(): FallbackResponse {
    const baseResponse: FallbackResponse = {
      success: false,
      result: null,
      degraded: true,
      fallbackReason: 'AI service temporarily unavailable',
      confidence: 'low',
      metadata: {
        circuitState: this.state,
        fallbackStrategy: this.config.degradationMode,
        suggestedRetryTime: Date.now() + this.config.recoveryTimeout
      }
    };

    switch (this.config.degradationMode) {
      case 'cache_only':
        return {
          ...baseResponse,
          fallbackReason: 'Using cached data only - AI service unavailable',
          confidence: 'medium'
        };
      
      case 'fallback_response':
        return {
          ...baseResponse,
          result: this.getDefaultResponseForAction(),
          fallbackReason: 'Using default response - AI service unavailable',
          confidence: 'low'
        };
      
      case 'queue_request':
        return {
          ...baseResponse,
          fallbackReason: 'Request queued for later processing - AI service unavailable',
          confidence: 'high',
          metadata: {
            ...baseResponse.metadata,
            fallbackStrategy: 'queued'
          }
        };
      
      default:
        return baseResponse;
    }
  }

  /**
   * Get default configuration for specific action types
   */
  private getDefaultConfigForAction(actionType: string): Partial<CircuitBreakerConfig> {
    switch (actionType) {
      case 'ai_lead_scoring':
        return {
          failureThreshold: 3, // More sensitive for critical scoring
          recoveryTimeout: 30000, // 30 seconds
          degradationMode: 'fallback_response'
        };
      
      case 'ai_email_generation':
        return {
          failureThreshold: 5,
          recoveryTimeout: 60000, // 1 minute
          degradationMode: 'cache_only'
        };
      
      case 'ai_whatsapp_generation':
        return {
          failureThreshold: 5,
          recoveryTimeout: 45000, // 45 seconds
          degradationMode: 'fallback_response'
        };
      
      default:
        return {
          failureThreshold: 5,
          recoveryTimeout: 60000,
          degradationMode: 'cache_only'
        };
    }
  }

  /**
   * Get default response for action type when degraded
   */
  private getDefaultResponseForAction(): any {
    switch (this.actionType) {
      case 'ai_lead_scoring':
        return {
          score: 50,
          category: 'Warm',
          reasoning: 'Default scoring - AI service unavailable',
          breakdown: { default: 50 },
          next_actions: ['Manual review required'],
          priority: 'medium'
        };
      
      case 'ai_email_generation':
        return {
          subject: 'Follow-up: Guardian AI CRM',
          content: 'Thank you for your interest in Guardian AI CRM. We will follow up with personalized information soon.',
          tone: 'professional',
          callToAction: 'Please reply to this email if you have any immediate questions.'
        };
      
      case 'ai_whatsapp_generation':
        return {
          message: 'Thanks for your interest! We will follow up with more details soon.',
          tone: 'professional',
          urgency: 'medium'
        };
      
      default:
        return {
          message: 'Service temporarily unavailable. Please try again later.',
          fallback: true
        };
    }
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      recoveryAttempts: this.recoveryAttempts,
      degradedRequests: this.degradedRequests
    };
  }

  /**
   * Force circuit state (for testing/manual control)
   */
  forceState(state: CircuitState): void {
    diagnosticLogger.warn('ai-circuit-breaker', 'Circuit state forced', {
      actionType: this.actionType,
      organizationId: this.organizationId,
      oldState: this.state,
      newState: state
    });
    
    this.state = state;
    
    if (state === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  /**
   * Reset circuit breaker metrics
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.recoveryAttempts = 0;
    
    diagnosticLogger.info('ai-circuit-breaker', 'Circuit breaker reset', {
      actionType: this.actionType,
      organizationId: this.organizationId
    });
  }
}

/**
 * Circuit Breaker Manager for multiple AI services
 */
export class AICircuitBreakerManager {
  private breakers: Map<string, AICircuitBreaker> = new Map();

  /**
   * Get or create circuit breaker for specific action
   */
  getCircuitBreaker(
    actionType: string,
    organizationId: string,
    config?: Partial<CircuitBreakerConfig>
  ): AICircuitBreaker {
    
    const key = `${organizationId}:${actionType}`;
    
    if (!this.breakers.has(key)) {
      this.breakers.set(key, new AICircuitBreaker(actionType, organizationId, config));
    }
    
    return this.breakers.get(key)!;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [key, breaker] of this.breakers.entries()) {
      metrics[key] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Get health status across all circuit breakers
   */
  getHealthStatus(): {
    healthy: number;
    degraded: number;
    failed: number;
    total: number;
  } {
    
    let healthy = 0;
    let degraded = 0;
    let failed = 0;
    
    for (const breaker of this.breakers.values()) {
      const metrics = breaker.getMetrics();
      
      switch (metrics.state) {
        case 'CLOSED':
          healthy++;
          break;
        case 'HALF_OPEN':
          degraded++;
          break;
        case 'OPEN':
          failed++;
          break;
      }
    }
    
    return {
      healthy,
      degraded,
      failed,
      total: this.breakers.size
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    
    diagnosticLogger.info('ai-circuit-breaker', 'All circuit breakers reset');
  }

  /**
   * Force state for all circuit breakers
   */
  forceAllState(state: CircuitState): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceState(state);
    }
    
    diagnosticLogger.warn('ai-circuit-breaker', 'All circuit breakers forced to state', { state });
  }
}

// Export singleton manager
export const aiCircuitBreakerManager = new AICircuitBreakerManager();

export default aiCircuitBreakerManager;