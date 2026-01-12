import React, {
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { debounce, throttle } from "lodash";

/**
 * Performance optimization utilities for GitHub integration
 */

// Cache management
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Clean up expired entries
    this.cleanup();

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value as string;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();

// Performance monitoring
export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;

  startTimer(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
      });
    };
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(name?: string): PerformanceMetrics[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  getSlowestOperations(limit: number = 10): PerformanceMetrics[] {
    return this.metrics.sort((a, b) => b.duration - a.duration).slice(0, limit);
  }

  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Memory management
export class MemoryManager {
  private cleanupTasks: (() => void)[] = [];
  private isMonitoring = false;
  private monitorInterval: NodeJS.Timeout | number | null = null;

  addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  cleanup(): void {
    this.cleanupTasks.forEach(task => task());
    this.cleanupTasks = [];
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
  }

  private checkMemoryUsage(): void {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const usagePercent = (usedMB / totalMB) * 100;

      // Log high memory usage
      if (usagePercent > 80) {
        console.warn(`High memory usage detected: ${usagePercent.toFixed(2)}%`);
      }

      // Trigger cleanup if memory usage is very high
      if (usagePercent > 90) {
        this.cleanup();
      }
    }
  }
}

export const memoryManager = new MemoryManager();

// Optimized hooks
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay: number = 300,
): T {
  return useCallback(debounce(callback, delay), deps) as unknown as T;
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay: number = 1000,
): T {
  return useCallback(
    throttle(callback, delay, { leading: true, trailing: false }),
    deps,
  ) as unknown as T;
}

export function useLazyLoading<T>(
  data: T[],
  batchSize: number = 20,
): { visibleData: T[]; loadMore: () => void; hasMore: boolean } {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const visibleData = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount],
  );
  const hasMore = visibleCount < data.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + batchSize, data.length));
    }
  }, [hasMore, batchSize, data.length]);

  return { visibleData, loadMore, hasMore };
}

export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5,
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );

    return { start: startIndex, end: endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items
      .slice(visibleRange.start, visibleRange.end + 1)
      .map((item, index) => ({
        item,
        index: visibleRange.start + index,
        style: {
          position: "absolute" as const,
          top: (visibleRange.start + index) * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        },
      }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (event: any) => {
      setScrollTop(event.nativeEvent.contentOffset.y);
    },
  };
}

// Image optimization
export function useOptimizedImage(
  uri: string,
  options?: { width?: number; height?: number },
) {
  const [imageUri, setImageUri] = useState(uri);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if image is cached
        const cached = cacheManager.get<string>(`image_${uri}`);
        if (cached) {
          setImageUri(cached);
          setIsLoading(false);
          return;
        }

        // Load image with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(uri, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const optimizedUri = URL.createObjectURL(blob);

        // Cache the optimized image
        cacheManager.set(`image_${uri}`, optimizedUri, 60 * 60 * 1000); // 1 hour
        setImageUri(optimizedUri);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [uri]);

  return { imageUri, isLoading, error };
}

// Bundle size optimization
export function lazyImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType,
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await importFn();
      return { default: module.default };
    } catch (error) {
      console.error("Failed to load module:", error);
      if (fallback) {
        return { default: fallback as any };
      }
      throw error;
    }
  });
}

// Network optimization
export class NetworkOptimizer {
  private requestQueue: {
    url: string;
    options: RequestInit;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }[] = [];
  private isProcessing = false;
  private maxConcurrentRequests = 3;

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.maxConcurrentRequests);

      await Promise.allSettled(
        batch.map(async ({ url, options, resolve, reject }) => {
          try {
            const response = await fetch(url, options);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        }),
      );
    }

    this.isProcessing = false;
  }
}

export const networkOptimizer = new NetworkOptimizer();

// Bundle analysis utilities
export function analyzeBundleSize(): void {
  if (typeof window !== "undefined" && window.performance) {
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const totalSize = resources.reduce((sum, resource) => {
      return sum + (resource.transferSize || 0);
    }, 0);

    console.log(
      `Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    );

    // Log largest resources
    const largestResources = resources
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 10);

    console.log(
      "Largest resources:",
      largestResources.map(r => ({
        name: r.name,
        size: `${(r.transferSize || 0) / 1024} KB`,
      })),
    );
  }
}

// Startup performance optimization
export function optimizeStartup(): void {
  // Preload critical resources
  const criticalResources = [
    "/assets/fonts/Inter.ttf",
    "/assets/icons/app-icon.png",
    "/assets/images/splash-icon.png",
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = resource;
    document.head.appendChild(link);
  });

  // Optimize font loading
  const fontPreload = document.createElement("link");
  fontPreload.rel = "preconnect";
  fontPreload.href = "https://fonts.googleapis.com";
  document.head.appendChild(fontPreload);
}
