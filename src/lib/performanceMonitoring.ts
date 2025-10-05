// Performance Monitoring System for Guardian AI CRM
// Core Web Vitals and advanced performance metrics tracking

import { diagnosticLogger } from './mockDiagnosticLogger';

// Performance Metrics Interfaces
export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface PerformanceMetrics {
  coreWebVitals: Partial<CoreWebVitals>;
  customMetrics: Record<string, number>;
  navigationTiming: PerformanceNavigationTiming | null;
  resourceTiming: PerformanceResourceTiming[];
  timestamp: number;
  userAgent: string;
  url: string;
  connectionType?: string;
}

export interface PerformanceBudget {
  lcp: number; // 2.5s good, 4s needs improvement
  fid: number; // 100ms good, 300ms needs improvement
  cls: number; // 0.1 good, 0.25 needs improvement
  fcp: number; // 1.8s good, 3s needs improvement
  ttfb: number; // 800ms good, 1800ms needs improvement
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  scores: Record<keyof CoreWebVitals, 'good' | 'needs-improvement' | 'poor' | 'unknown'>;
  recommendations: string[];
  overallScore: number; // 0-100
}

class PerformanceMonitor {
  private budget: PerformanceBudget = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 800
  };

  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') {
      return; // Skip in SSR environment
    }

    // Initialize Core Web Vitals monitoring
    this.initializeLCP();
    this.initializeFID();
    this.initializeCLS();
    this.initializeFCP();
    this.initializeTTFB();

    // Initialize navigation timing
    this.captureNavigationTiming();

    // Initialize resource timing
    this.captureResourceTiming();

    this.isMonitoring = true;
    diagnosticLogger.info('performance', 'Performance monitoring initialized');
  }

  // Largest Contentful Paint
  private initializeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        
        if (lastEntry) {
          const lcp = Math.round(lastEntry.startTime);
          this.updateMetric('lcp', lcp);
          diagnosticLogger.debug('performance', `LCP measured: ${lcp}ms`);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (error) {
      diagnosticLogger.warn('performance', 'LCP monitoring failed', error);
    }
  }

  // First Input Delay
  private initializeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          if (fidEntry.name === 'first-input') {
            const fid = Math.round(fidEntry.processingStart - fidEntry.startTime);
            this.updateMetric('fid', fid);
            diagnosticLogger.debug('performance', `FID measured: ${fid}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (error) {
      diagnosticLogger.warn('performance', 'FID monitoring failed', error);
    }
  }

  // Cumulative Layout Shift
  private initializeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry & { hadRecentInput?: boolean; value?: number }) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
          }
        });
        
        this.updateMetric('cls', Math.round(clsValue * 1000) / 1000);
        diagnosticLogger.debug('performance', `CLS measured: ${clsValue}`);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (error) {
      diagnosticLogger.warn('performance', 'CLS monitoring failed', error);
    }
  }

  // First Contentful Paint
  private initializeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            const fcp = Math.round(entry.startTime);
            this.updateMetric('fcp', fcp);
            diagnosticLogger.debug('performance', `FCP measured: ${fcp}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', observer);
    } catch (error) {
      diagnosticLogger.warn('performance', 'FCP monitoring failed', error);
    }
  }

  // Time to First Byte
  private initializeTTFB(): void {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return;

    try {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = Math.round(navigation.responseStart - navigation.requestStart);
        this.updateMetric('ttfb', ttfb);
        diagnosticLogger.debug('performance', `TTFB measured: ${ttfb}ms`);
      }
    } catch (error) {
      diagnosticLogger.warn('performance', 'TTFB monitoring failed', error);
    }
  }

  private captureNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return;

    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.navigationTiming = navigation;
    }
  }

  private captureResourceTiming(): void {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return;

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.metrics.resourceTiming = resources;
  }

  private updateMetric(key: keyof CoreWebVitals, value: number): void {
    if (!this.metrics.coreWebVitals) {
      this.metrics.coreWebVitals = {};
    }
    this.metrics.coreWebVitals[key] = value;
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    return {
      coreWebVitals: this.metrics.coreWebVitals || {},
      customMetrics: this.metrics.customMetrics || {},
      navigationTiming: this.metrics.navigationTiming || null,
      resourceTiming: this.metrics.resourceTiming || [],
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      connectionType: this.getConnectionType()
    };
  }

  public generateReport(): PerformanceReport {
    const metrics = this.getMetrics();
    const scores = this.calculateScores(metrics.coreWebVitals);
    const recommendations = this.generateRecommendations(metrics);
    const overallScore = this.calculateOverallScore(scores);

    return {
      metrics,
      scores,
      recommendations,
      overallScore
    };
  }

  private calculateScores(vitals: Partial<CoreWebVitals>): Record<keyof CoreWebVitals, 'good' | 'needs-improvement' | 'poor' | 'unknown'> {
    const scores = {} as Record<keyof CoreWebVitals, 'good' | 'needs-improvement' | 'poor' | 'unknown'>;

    // LCP scoring
    if (vitals.lcp !== undefined) {
      if (vitals.lcp <= 2500) scores.lcp = 'good';
      else if (vitals.lcp <= 4000) scores.lcp = 'needs-improvement';
      else scores.lcp = 'poor';
    } else {
      scores.lcp = 'unknown';
    }

    // FID scoring
    if (vitals.fid !== undefined) {
      if (vitals.fid <= 100) scores.fid = 'good';
      else if (vitals.fid <= 300) scores.fid = 'needs-improvement';
      else scores.fid = 'poor';
    } else {
      scores.fid = 'unknown';
    }

    // CLS scoring
    if (vitals.cls !== undefined) {
      if (vitals.cls <= 0.1) scores.cls = 'good';
      else if (vitals.cls <= 0.25) scores.cls = 'needs-improvement';
      else scores.cls = 'poor';
    } else {
      scores.cls = 'unknown';
    }

    // FCP scoring
    if (vitals.fcp !== undefined) {
      if (vitals.fcp <= 1800) scores.fcp = 'good';
      else if (vitals.fcp <= 3000) scores.fcp = 'needs-improvement';
      else scores.fcp = 'poor';
    } else {
      scores.fcp = 'unknown';
    }

    // TTFB scoring
    if (vitals.ttfb !== undefined) {
      if (vitals.ttfb <= 800) scores.ttfb = 'good';
      else if (vitals.ttfb <= 1800) scores.ttfb = 'needs-improvement';
      else scores.ttfb = 'poor';
    } else {
      scores.ttfb = 'unknown';
    }

    return scores;
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    const { coreWebVitals } = metrics;

    if (coreWebVitals.lcp && coreWebVitals.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing resource loading');
    }

    if (coreWebVitals.fid && coreWebVitals.fid > 100) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time and optimizing main thread work');
    }

    if (coreWebVitals.cls && coreWebVitals.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by ensuring proper image dimensions and avoiding dynamic content insertion');
    }

    if (coreWebVitals.fcp && coreWebVitals.fcp > 1800) {
      recommendations.push('Optimize First Contentful Paint by prioritizing critical resources and reducing render-blocking resources');
    }

    if (coreWebVitals.ttfb && coreWebVitals.ttfb > 800) {
      recommendations.push('Improve Time to First Byte by optimizing server configuration and using CDN');
    }

    // Resource-based recommendations
    if (metrics.resourceTiming.length > 0) {
      const largeResources = metrics.resourceTiming.filter(r => r.transferSize > 1000000); // 1MB
      if (largeResources.length > 0) {
        recommendations.push(`Consider optimizing ${largeResources.length} large resources (>1MB)`);
      }
    }

    return recommendations;
  }

  private calculateOverallScore(scores: Record<keyof CoreWebVitals, string>): number {
    const scoreValues = Object.values(scores);
    const goodCount = scoreValues.filter(s => s === 'good').length;
    const improvementCount = scoreValues.filter(s => s === 'needs-improvement').length;
    const totalMeasured = scoreValues.filter(s => s !== 'unknown').length;

    if (totalMeasured === 0) return 0;

    const goodScore = (goodCount / totalMeasured) * 100;
    const improvementPenalty = (improvementCount / totalMeasured) * 25;
    
    return Math.max(0, Math.round(goodScore - improvementPenalty));
  }

  private getConnectionType(): string | undefined {
    type NavigatorWithConnection = Navigator & {
      connection?: { effectiveType?: string };
      mozConnection?: { effectiveType?: string };
      webkitConnection?: { effectiveType?: string };
    };
    const connection = (navigator as NavigatorWithConnection).connection ||
                      (navigator as NavigatorWithConnection).mozConnection ||
                      (navigator as NavigatorWithConnection).webkitConnection;
    return connection?.effectiveType;
  }

  // Custom metrics
  public trackCustomMetric(name: string, value: number): void {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {};
    }
    this.metrics.customMetrics[name] = value;
    diagnosticLogger.debug('performance', `Custom metric tracked: ${name} = ${value}`);
  }

  // Performance marks and measures
  public mark(name: string): void {
    if (window.performance?.mark) {
      window.performance.mark(name);
      diagnosticLogger.debug('performance', `Performance mark: ${name}`);
    }
  }

  public measure(name: string, startMark: string, endMark?: string): number | null {
    if (window.performance?.measure && window.performance?.getEntriesByName) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name, 'measure')[0];
        const duration = Math.round(measure.duration);
        
        this.trackCustomMetric(name, duration);
        diagnosticLogger.debug('performance', `Performance measure: ${name} = ${duration}ms`);
        
        return duration;
      } catch (error) {
        diagnosticLogger.warn('performance', `Failed to measure ${name}`, error);
      }
    }
    return null;
  }

  // Export data for analytics
  public exportData(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  // Cleanup
  public destroy(): void {
    this.observers.forEach((observer, key) => {
      observer.disconnect();
      diagnosticLogger.debug('performance', `Disconnected observer: ${key}`);
    });
    this.observers.clear();
    this.isMonitoring = false;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export function measureAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performanceMonitor.mark(startMark);
    
    operation()
      .then(result => {
        performanceMonitor.mark(endMark);
        performanceMonitor.measure(name, startMark, endMark);
        resolve(result);
      })
      .catch(error => {
        performanceMonitor.mark(endMark);
        performanceMonitor.measure(`${name}-error`, startMark, endMark);
        reject(error);
      });
  });
}

export function measureSyncOperation<T>(
  name: string,
  operation: () => T
): T {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  
  performanceMonitor.mark(startMark);
  
  try {
    const result = operation();
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(name, startMark, endMark);
    return result;
  } catch (error) {
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(`${name}-error`, startMark, endMark);
    throw error;
  }
}

// React Hook for performance monitoring
export function usePerformanceMonitoring() {
  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    generateReport: () => performanceMonitor.generateReport(),
    trackCustomMetric: (name: string, value: number) => performanceMonitor.trackCustomMetric(name, value),
    mark: (name: string) => performanceMonitor.mark(name),
    measure: (name: string, start: string, end?: string) => performanceMonitor.measure(name, start, end),
    exportData: () => performanceMonitor.exportData()
  };
}

// Performance budget monitoring
export function checkPerformanceBudget(): boolean {
  const report = performanceMonitor.generateReport();
  const { scores } = report;
  
  const failedMetrics = Object.entries(scores)
    .filter(([, score]) => score === 'poor')
    .map(([metric]) => metric);
  
  if (failedMetrics.length > 0) {
    diagnosticLogger.warn('performance', `Performance budget exceeded for: ${failedMetrics.join(', ')}`);
    return false;
  }
  
  return true;
}

// Auto-reporting (can be configured to send to analytics service)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const report = performanceMonitor.generateReport();
    diagnosticLogger.info('performance', 'Final performance report', report);
  });
}