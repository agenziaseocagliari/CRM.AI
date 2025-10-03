// Advanced Caching System for Guardian AI CRM
// Multi-layer caching strategy for optimal performance

import { diagnosticLogger } from './mockDiagnosticLogger';

// Cache Configuration
export interface CacheConfig {
  name: string;
  version: number;
  maxAge: number; // milliseconds
  maxEntries: number;
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate';
}

// Cache Entry Interface
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  size?: number;
}

// Cache Statistics
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
}

class AdvancedCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0
  };

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeCache();
  }

  private initializeCache() {
    // Load persisted cache data
    this.loadFromPersistentStorage();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Clean every 5 minutes

    diagnosticLogger.info('cache', `Advanced cache initialized: ${this.config.name}`, {
      strategy: this.config.strategy,
      maxEntries: this.config.maxEntries,
      maxAge: this.config.maxAge
    });
  }

  // Get item from cache
  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      this.stats.hits++;
      this.updateStats();
      return memoryEntry.data;
    }

    // Check persistent cache
    const persistentEntry = await this.getFromPersistentCache<T>(cacheKey);
    if (persistentEntry && this.isValidEntry(persistentEntry)) {
      // Promote to memory cache
      this.memoryCache.set(cacheKey, persistentEntry);
      this.stats.hits++;
      this.updateStats();
      return persistentEntry.data;
    }

    this.stats.misses++;
    this.updateStats();
    return null;
  }

  // Set item in cache
  async set<T = any>(key: string, data: T, customTtl?: number): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const ttl = customTtl || this.config.maxAge;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.config.version,
      size: this.calculateSize(data)
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);
    
    // Store in persistent cache
    await this.setInPersistentCache(cacheKey, entry);
    
    // Enforce cache limits
    this.enforceLimits();
    
    this.stats.entries++;
    this.stats.size += entry.size || 0;
    this.updateStats();

    diagnosticLogger.debug('cache', `Cached item: ${key}`, {
      size: entry.size,
      ttl: ttl
    });
  }

  // Remove item from cache
  async remove(key: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);
    
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry) {
      this.stats.size -= memoryEntry.size || 0;
      this.stats.entries--;
    }
    
    this.memoryCache.delete(cacheKey);
    await this.removeFromPersistentCache(cacheKey);
    
    this.updateStats();
    return true;
  }

  // Clear entire cache
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.clearPersistentCache();
    
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0,
      hitRate: 0
    };

    diagnosticLogger.info('cache', `Cache cleared: ${this.config.name}`);
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Cache strategies implementation
  async fetchWithStrategy<T = any>(
    key: string,
    fetchFunction: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    const strategy = this.config.strategy;

    switch (strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(key, fetchFunction, options);
      
      case 'network-first':
        return this.networkFirstStrategy(key, fetchFunction, options);
      
      case 'cache-only':
        return this.cacheOnlyStrategy(key);
      
      case 'network-only':
        return this.networkOnlyStrategy(fetchFunction);
      
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(key, fetchFunction, options);
      
      default:
        return this.cacheFirstStrategy(key, fetchFunction, options);
    }
  }

  // Strategy implementations
  private async cacheFirstStrategy<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFunction();
    await this.set(key, data, options?.ttl);
    return data;
  }

  private async networkFirstStrategy<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    try {
      const data = await fetchFunction();
      await this.set(key, data, options?.ttl);
      return data;
    } catch (error) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        diagnosticLogger.warn('cache', `Network failed, serving from cache: ${key}`, error);
        return cached;
      }
      throw error;
    }
  }

  private async cacheOnlyStrategy<T>(key: string): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached === null) {
      throw new Error(`Cache miss for key: ${key}`);
    }
    return cached;
  }

  private async networkOnlyStrategy<T>(fetchFunction: () => Promise<T>): Promise<T> {
    return fetchFunction();
  }

  private async staleWhileRevalidateStrategy<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    // Return cached data immediately if available
    if (cached !== null) {
      // Revalidate in background
      fetchFunction()
        .then(data => this.set(key, data, options?.ttl))
        .catch(error => {
          diagnosticLogger.warn('cache', `Background revalidation failed: ${key}`, error);
        });
      
      return cached;
    }

    // No cached data, fetch synchronously
    const data = await fetchFunction();
    await this.set(key, data, options?.ttl);
    return data;
  }

  // Utility methods
  private getCacheKey(key: string): string {
    return `${this.config.name}:${this.config.version}:${key}`;
  }

  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;
    const isVersionValid = entry.version === this.config.version;
    
    return !isExpired && isVersionValid;
  }

  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.memoryCache.delete(key);
        this.stats.size -= entry.size || 0;
        this.stats.entries--;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      diagnosticLogger.info('cache', `Cache cleanup completed: ${cleanedCount} expired entries removed`);
      this.updateStats();
    }
  }

  private enforceLimits(): void {
    if (this.memoryCache.size <= this.config.maxEntries) {
      return;
    }

    // Remove oldest entries first
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, this.memoryCache.size - this.config.maxEntries);

    for (const [key, entry] of entries) {
      this.memoryCache.delete(key);
      this.stats.size -= entry.size || 0;
      this.stats.entries--;
    }

    diagnosticLogger.info('cache', `Cache limit enforced: ${entries.length} entries evicted`);
  }

  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  // Persistent cache methods (using IndexedDB or localStorage)
  private async loadFromPersistentStorage(): Promise<void> {
    // Implementation would use IndexedDB for larger datasets
    // For now, using localStorage as fallback
    try {
      const data = localStorage.getItem(`cache_${this.config.name}`);
      if (data) {
        const entries = JSON.parse(data);
        for (const [key, entry] of Object.entries(entries)) {
          if (this.isValidEntry(entry as CacheEntry)) {
            this.memoryCache.set(key, entry as CacheEntry);
          }
        }
      }
    } catch (error) {
      diagnosticLogger.warn('cache', 'Failed to load persistent cache', error);
    }
  }

  private async getFromPersistentCache<T>(key: string): Promise<CacheEntry<T> | null> {
    // Simplified implementation - would use IndexedDB in production
    return null;
  }

  private async setInPersistentCache(key: string, entry: CacheEntry): Promise<void> {
    // Simplified implementation - would use IndexedDB in production
  }

  private async removeFromPersistentCache(key: string): Promise<void> {
    // Simplified implementation - would use IndexedDB in production
  }

  private async clearPersistentCache(): Promise<void> {
    try {
      localStorage.removeItem(`cache_${this.config.name}`);
    } catch (error) {
      diagnosticLogger.warn('cache', 'Failed to clear persistent cache', error);
    }
  }
}

// Pre-configured cache instances
export const apiCache = new AdvancedCache({
  name: 'api',
  version: 1,
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxEntries: 500,
  strategy: 'stale-while-revalidate'
});

export const imageCache = new AdvancedCache({
  name: 'images',
  version: 1,
  maxAge: 60 * 60 * 1000, // 1 hour
  maxEntries: 200,
  strategy: 'cache-first'
});

export const staticCache = new AdvancedCache({
  name: 'static',
  version: 1,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 100,
  strategy: 'cache-first'
});

// Export cache class for custom instances
export { AdvancedCache };

// Utility functions
export async function getCacheStats(): Promise<Record<string, CacheStats>> {
  return {
    api: apiCache.getStats(),
    images: imageCache.getStats(),
    static: staticCache.getStats()
  };
}

export async function clearAllCaches(): Promise<void> {
  await Promise.all([
    apiCache.clear(),
    imageCache.clear(),
    staticCache.clear()
  ]);
  
  diagnosticLogger.info('cache', 'All caches cleared');
}