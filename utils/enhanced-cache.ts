import {
  CacheEntry,
  CacheOptions,
  CacheStats,
  CacheConfig,
} from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { gzip, ungzip } from "pako";

/**
 * Compression manager for cache data
 */
class CompressionManager {
  private static instance: CompressionManager;

  static getInstance(): CompressionManager {
    if (!CompressionManager.instance) {
      CompressionManager.instance = new CompressionManager();
    }
    return CompressionManager.instance;
  }

  compress(data: string): string {
    try {
      const compressed = gzip(data, { level: 6 });
      return btoa(String.fromCharCode(...compressed));
    } catch (error) {
      console.warn("Compression failed:", error);
      return data;
    }
  }

  decompress(data: string): string {
    try {
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return ungzip(bytes, { to: "string" });
    } catch (error) {
      console.warn("Decompression failed:", error);
      return data;
    }
  }

  shouldCompress(data: any): boolean {
    const dataString = JSON.stringify(data);
    return dataString.length > 1024; // Compress if > 1KB
  }
}

/**
 * Persistent storage manager using AsyncStorage
 */
class PersistentCache {
  private static instance: PersistentCache;
  private cache: Map<string, CacheEntry> = new Map();
  private isLoaded = false;

  static getInstance(): PersistentCache {
    if (!PersistentCache.instance) {
      PersistentCache.instance = new PersistentCache();
    }
    return PersistentCache.instance;
  }

  async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith("cache_"));

      if (cacheKeys.length === 0) {
        this.isLoaded = true;
        return;
      }

      const entries = await AsyncStorage.multiGet(cacheKeys);

      for (const [key, value] of entries) {
        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            // Check if entry is still valid
            if (Date.now() - entry.timestamp < entry.ttl) {
              this.cache.set(key.replace("cache_", ""), entry);
            } else {
              // Remove expired entry
              await AsyncStorage.removeItem(key);
            }
          } catch (error) {
            console.warn("Failed to parse cache entry:", key, error);
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load persistent cache:", error);
    } finally {
      this.isLoaded = true;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.load();

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      await AsyncStorage.removeItem(`cache_${key}`);
      return null;
    }

    return entry.data;
  }

  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {},
  ): Promise<void> {
    await this.load();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      compressed: options.compress || false,
    };

    // Compress if enabled and beneficial
    if (
      options.compress &&
      CompressionManager.getInstance().shouldCompress(data)
    ) {
      const compression = CompressionManager.getInstance();
      const dataString = JSON.stringify(data);
      const compressedData = compression.compress(dataString);
      entry.data = compressedData as any;
      entry.compressed = true;
    }

    this.cache.set(key, entry);

    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn("Failed to persist cache entry:", key, error);
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.load();

    const deleted = this.cache.delete(key);
    if (deleted) {
      try {
        await AsyncStorage.removeItem(`cache_${key}`);
      } catch (error) {
        console.warn("Failed to delete persistent cache entry:", key, error);
      }
    }
    return deleted;
  }

  async clear(): Promise<void> {
    await this.load();

    this.cache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith("cache_"));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn("Failed to clear persistent cache:", error);
    }
  }

  get size(): number {
    return this.cache.size;
  }

  async getStats(): Promise<{ size: number; keys: string[] }> {
    await this.load();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Enhanced caching system with memory and persistent storage
 */
export class EnhancedCacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private persistentCache: PersistentCache;
  private compression: CompressionManager;
  private config: CacheConfig;
  private stats: CacheStats;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      memorySize: 50, // 50MB
      persistentSize: 100, // 100MB
      compressionEnabled: true,
      backgroundSync: true,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      ...config,
    };

    this.persistentCache = PersistentCache.getInstance();
    this.compression = CompressionManager.getInstance();

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      compressionRatio: 1.0,
      memoryUsage: 0,
      persistentUsage: 0,
    };
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    let entry = this.memoryCache.get(key);

    if (entry) {
      // Check TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        this.stats.evictions++;
        entry = undefined;
      } else {
        this.stats.hits++;
        return this.decompressIfNeeded<T>(entry.data);
      }
    }

    // Check persistent cache
    const persistentData = await this.persistentCache.get<T>(key);
    if (persistentData !== null) {
      // Move to memory cache for faster future access
      this.memoryCache.set(key, {
        data: persistentData,
        timestamp: Date.now(),
        ttl: this.config.defaultTTL,
      });

      this.stats.hits++;
      return persistentData;
    }

    this.stats.misses++;
    return null;
  }

  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const ttl = options.ttl || this.config.defaultTTL;
    const shouldCompress =
      options.compress !== undefined
        ? options.compress
        : this.config.compressionEnabled;

    // Prepare entry
    const entry: CacheEntry<T> = {
      data: shouldCompress ? this.compressIfNeeded(data) : data,
      timestamp: Date.now(),
      ttl,
      compressed: shouldCompress && this.compression.shouldCompress(data),
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in persistent cache
    await this.persistentCache.set(key, data, {
      ttl,
      compress: shouldCompress,
    });

    this.stats.sets++;

    // Check memory limits and evict if necessary
    await this.enforceMemoryLimits();
  }

  async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryCache.delete(key);
    const persistentDeleted = await this.persistentCache.delete(key);

    if (memoryDeleted || persistentDeleted) {
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.persistentCache.clear();

    this.stats = {
      ...this.stats,
      deletes: this.stats.deletes + this.memoryCache.size,
      evictions: 0,
    };
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        this.stats.deletes++;
      }
    }

    // Clear from persistent cache
    const persistentStats = await this.persistentCache.getStats();
    for (const key of persistentStats.keys) {
      if (regex.test(key)) {
        await this.persistentCache.delete(key);
        this.stats.deletes++;
      }
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  private async enforceMemoryLimits(): Promise<void> {
    // Simple LRU eviction - remove oldest entries when memory limit is reached
    if (this.memoryCache.size > 1000) {
      // Rough limit
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 10% of entries
      const toRemove = Math.floor(entries.length * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
        this.stats.evictions++;
      }
    }
  }

  private compressIfNeeded<T>(data: T): any {
    if (
      this.config.compressionEnabled &&
      this.compression.shouldCompress(data)
    ) {
      const dataString = JSON.stringify(data);
      return this.compression.compress(dataString);
    }
    return data;
  }

  private decompressIfNeeded<T>(data: any): T {
    if (typeof data === "string" && data.length > 100) {
      try {
        const decompressed = this.compression.decompress(data);
        return JSON.parse(decompressed) as T;
      } catch {
        // Not compressed data, return as-is
        return data as T;
      }
    }
    return data as T;
  }
}

// Export singleton instance
export const enhancedCache = new EnhancedCacheManager();
