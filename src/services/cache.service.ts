import Redis from 'ioredis';
import { redisConfig } from '../config/redis';
import { logger } from '../utils/logger.util';

class CacheService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(redisConfig);

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis connection error:', error);
    });
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.flushdb();
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isConnected || keys.length === 0) {
      return [];
    }

    try {
      return await this.client.mget(...keys);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return [];
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs: { [key: string]: string }): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const flatArray: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        flatArray.push(key, value);
      }
      await this.client.mset(...flatArray);
    } catch (error) {
      logger.error('Cache mset error:', error);
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

export default new CacheService();