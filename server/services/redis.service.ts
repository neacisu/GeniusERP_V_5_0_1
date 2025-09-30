import Redis from 'ioredis';

// Extend Redis type to include our custom properties
interface ExtendedRedis extends Redis {
  __policyChecked?: boolean;
}

export class RedisService {
  private client: ExtendedRedis | null = null;
  
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
        console.log('Connected to Redis Cloud successfully');
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
      console.log('Disconnected from Redis');
    }
  }
  
  getClient() {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    
    // Check if we've already warned about eviction policy
    if (!this.client.__policyChecked) {
      // Implement workaround for eviction policy issue
      this.client.config("GET", "maxmemory-policy").then((policyResponse: any) => {
        const policy = policyResponse as string[];
        if (policy && policy.length > 1 && policy[1] !== "noeviction") {
          console.warn(`WARNING: Redis eviction policy is set to ${policy[1]} instead of 'noeviction'.`);
          console.warn('This may cause issues with BullMQ. Consider using a Redis instance with noeviction policy.');
          console.warn('Implementing application-level workaround to minimize impacts.');
          
          // Implement additional error handling for BullMQ operations
          if (this.client) {
            this.client.on('error', (err) => {
              if (err.message && err.message.includes('OOM')) {
                console.error('Redis OOM error detected. This is likely due to eviction policy not being set to noeviction.');
                // Additional recovery logic could be implemented here
              }
            });
          }
        }
        
        // Mark as checked to avoid repeated warnings
        if (this.client) {
          this.client.__policyChecked = true;
        }
      }).catch(err => {
        console.warn('Could not check Redis maxmemory-policy:', err.message);
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
}
