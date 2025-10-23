import Redis from 'ioredis';
import { Logger } from '../logger';

const logger = new Logger('RedisService');

// Extend Redis type to include our custom properties
interface ExtendedRedis extends Redis {
  __policyChecked?: boolean;
}

/**
 * Cache metrics interface
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage?: number;
}

/**
 * Enhanced Redis Service with advanced caching capabilities
 * Suports typed caching, pattern invalidation, batch operations and metrics
 */
export class RedisService {
  private client: ExtendedRedis | null = null;
  
  // Metrics tracking
  private metrics: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  } = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  
  constructor() {
    this.client = null;
  }
  
  async connect() {
    try {
      // Check if Redis credentials are available
      if (!process.env.REDIS_HOST && !process.env.REDIS_PASSWORD) {
        console.warn('Redis credentials not provided, using in-memory fallback');
        this.client = null;
        return null;
      }
      
      // Connect to Redis Cloud using credentials from environment variables
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
        // Always enable TLS for Redis Cloud connections
        tls: process.env.REDIS_HOST?.endsWith('.upstash.io') || 
             process.env.REDIS_HOST?.endsWith('.redis.cache.windows.net') || 
             process.env.REDIS_HOST?.includes('redis.cloud.redislabs.com') ? 
             { rejectUnauthorized: false } : undefined,
        connectTimeout: 5000, // 5 seconds timeout
        maxRetriesPerRequest: 3, // Allow a few retries
        retryStrategy: (times) => {
          if (times > 3) return null; // Stop retrying after 3 attempts
          return Math.min(times * 500, 3000); // Start with 500ms and increase up to 3s
        },
      });
      
      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
        // Don't crash the app, just log the error
      });
      
      try {
        // Test the connection with a timeout
        await Promise.race([
          this.client.ping(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis ping timeout')), 3000)
          )
        ]);
        logger.info('Connected to Redis Cloud successfully');
        return this.client;
      } catch (pingError) {
        console.error('Redis ping failed:', pingError);
        // Close the client to prevent hanging connections
        await this.client.quit().catch(() => {});
        this.client = null;
        console.warn('Using in-memory fallback instead of Redis');
        return null;
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Fallback to a local in-memory object if Redis is not available
      this.client = null;
      console.warn('Using in-memory fallback instead of Redis');
      return null;
    }
  }
  
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Disconnected from Redis');
    }
  }
  
  getClient() {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    
    // Check if we've already warned about eviction policy (only once globally)
    if (!this.client.__policyChecked && !(global as { __redisEvictionPolicyWarned?: boolean }).__redisEvictionPolicyWarned) {
      // Implement workaround for eviction policy issue
      this.client.config("GET", "maxmemory-policy").then((policyResponse: unknown) => {
        const policy = policyResponse as string[];
        if (policy && policy.length > 1 && policy[1] !== "noeviction") {
          console.warn(`⚠️  Redis Cloud Eviction Policy: ${policy[1]}`);
          console.warn('📋 Action Required: Change Redis Cloud maxmemory-policy to "noeviction"');
          console.warn('   1. Login to Redis Cloud console (https://app.redislabs.com)');
          console.warn('   2. Go to Database Settings');
          console.warn('   3. Set "Data eviction policy" to "noeviction"');
          console.warn('✅ Workaround active: All cache operations use TTL to work with volatile-lru');
          
          // Mark as globally warned to prevent duplicate warnings
          (global as { __redisEvictionPolicyWarned?: boolean }).__redisEvictionPolicyWarned = true;
          
          // Implement additional error handling for BullMQ operations
          if (this.client) {
            this.client.on('error', (err) => {
              if (err.message && err.message.includes('OOM')) {
                console.error('❌ Redis OOM error: Memory full. Consider upgrading Redis Cloud plan.');
              }
            });
          }
        }
        
        // Mark as checked to avoid repeated checks
        if (this.client) {
          this.client.__policyChecked = true;
        }
      }).catch(err => {
        // Silently fail if can't check policy (Redis Cloud may restrict CONFIG command)
        if (!err.message.includes('unknown command') && !err.message.includes('not allowed')) {
          console.warn('Could not check Redis maxmemory-policy:', err.message);
        }
      });
    }
    
    return this.client;
  }
  
  // Cache methods
  async get(key: string): Promise<string | null> {
    try {
      if (!this.client) return null;
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: string, expiryInSeconds?: number): Promise<boolean> {
    try {
      if (!this.client) return false;
      
      if (expiryInSeconds) {
        await this.client.set(key, value, 'EX', expiryInSeconds);
      } else {
        await this.client.set(key, value);
      }
      
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }
  
  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }
  
  async incr(key: string): Promise<number> {
    try {
      if (!this.client) return 0;
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }
  
  // Hash methods
  async hget(key: string, field: string): Promise<string | null> {
    try {
      if (!this.client) return null;
      return await this.client.hget(key, field);
    } catch (error) {
      console.error('Redis hget error:', error);
      return null;
    }
  }
  
  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      console.error('Redis hset error:', error);
      return false;
    }
  }
  
  async hdel(key: string, field: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.hdel(key, field);
      return true;
    } catch (error) {
      console.error('Redis hdel error:', error);
      return false;
    }
  }
  
  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      if (!this.client) return null;
      return await this.client.hgetall(key);
    } catch (error) {
      console.error('Redis hgetall error:', error);
      return null;
    }
  }
  
  /**
   * ============================================================================
   * ADVANCED CACHING METHODS - Pentru Accounting Module
   * ============================================================================
   */
  
  /**
   * Get typed cached value with automatic JSON parsing
   * Tracks cache hits/misses for metrics
   */
  async getCached<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) {
        this.metrics.misses++;
        return null;
      }
      
      const value = await this.client.get(key);
      
      if (value === null) {
        this.metrics.misses++;
        return null;
      }
      
      this.metrics.hits++;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // If not JSON, return as-is (cast to unknown first for type safety)
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Redis getCached error for key ${key}:`, error);
      this.metrics.misses++;
      return null;
    }
  }
  
  /**
   * Set typed cached value with automatic JSON serialization
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified if object)
   * @param ttl Time to live in seconds (optional)
   */
  async setCached<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.client) {
        return;
      }
      
      // Serialize value
      const serialized = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      
      if (ttl) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
      
      this.metrics.sets++;
    } catch (error) {
      console.error(`Redis setCached error for key ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * Invalidate all keys matching a pattern
   * Uses SCAN for safe iteration in production
   * @param pattern Pattern to match (e.g., 'acc:sales-journal:*')
   * @returns Number of keys deleted
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      if (!this.client) {
        return 0;
      }
      
      let cursor = '0';
      let deletedCount = 0;
      const keysToDelete: string[] = [];
      
      // Use SCAN to safely iterate through keys
      do {
        const [newCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        
        cursor = newCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');
      
      // Delete in batches to avoid blocking
      if (keysToDelete.length > 0) {
        // Delete in chunks of 100
        for (let i = 0; i < keysToDelete.length; i += 100) {
          const chunk = keysToDelete.slice(i, i + 100);
          await this.client.del(...chunk);
          deletedCount += chunk.length;
        }
        
        this.metrics.deletes += deletedCount;
      }
      
      return deletedCount;
    } catch (error) {
      console.error(`Redis invalidatePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }
  
  /**
   * Get multiple keys at once (batch operation)
   * @param keys Array of keys to retrieve
   * @returns Array of values (null for missing keys)
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      if (!this.client || keys.length === 0) {
        return keys.map(() => null);
      }
      
      const values = await this.client.mget(...keys);
      
      // Track metrics
      values.forEach(v => {
        if (v === null) {
          this.metrics.misses++;
        } else {
          this.metrics.hits++;
        }
      });
      
      return values;
    } catch (error) {
      console.error('Redis mget error:', error);
      return keys.map(() => null);
    }
  }
  
  /**
   * Set multiple key-value pairs at once (batch operation)
   * @param keyValues Object with key-value pairs
   * @param ttl Optional TTL in seconds (applied to all keys)
   */
  async mset(keyValues: Record<string, string>, ttl?: number): Promise<void> {
    try {
      if (!this.client || Object.keys(keyValues).length === 0) {
        return;
      }
      
      // Convert object to array for MSET
      const args: string[] = [];
      for (const [key, value] of Object.entries(keyValues)) {
        args.push(key, value);
      }
      
      await this.client.mset(...args);
      
      // Set TTL for each key if specified
      if (ttl) {
        const pipeline = this.client.pipeline();
        for (const key of Object.keys(keyValues)) {
          pipeline.expire(key, ttl);
        }
        await pipeline.exec();
      }
      
      this.metrics.sets += Object.keys(keyValues).length;
    } catch (error) {
      console.error('Redis mset error:', error);
      throw error;
    }
  }
  
  /**
   * Get cache metrics
   * @returns Current cache metrics including hit rate
   */
  async getMetrics(): Promise<CacheMetrics> {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    
    let totalKeys = 0;
    let memoryUsage: number | undefined = undefined;
    
    try {
      if (this.client) {
        // Get total number of keys
        totalKeys = await this.client.dbsize();
        
        // Get memory usage info
        const info = await this.client.info('memory');
        const match = info.match(/used_memory:(\d+)/);
        if (match) {
          memoryUsage = parseInt(match[1], 10);
        }
      }
    } catch (error) {
      console.error('Error getting Redis metrics:', error);
    }
    
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      hitRate: parseFloat(hitRate.toFixed(2)),
      totalKeys,
      memoryUsage
    };
  }
  
  /**
   * Reset metrics counters
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
  
  /**
   * Check if Redis is available and connected
   */
  isConnected(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }
  
  /**
   * Flush all keys from current database (USE WITH CAUTION!)
   * Only use in development/testing
   */
  async flushDB(): Promise<void> {
    try {
      if (!this.client) {
        return;
      }
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('flushDB is not allowed in production');
      }
      
      await this.client.flushdb();
      logger.info('Redis database flushed');
    } catch (error) {
      console.error('Redis flushDB error:', error);
      throw error;
    }
  }
}
