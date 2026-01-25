import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';

interface RedisConnectionPool {
  pool: any[];
  poolSize: number;
  getClient: () => RedisClientType;
  getAllClients: () => any[];
  isReady: () => boolean;
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClientOrPool: RedisClientType | RedisConnectionPool | null,
  ) {}

  private isRedisAvailable(): boolean {
    if (!this.redisClientOrPool) {
      return false;
    }
    
    // Check if it's a connection pool
    if (typeof (this.redisClientOrPool as any).isReady === 'function') {
      return (this.redisClientOrPool as RedisConnectionPool).isReady();
    }
    
    // Check if it's a single client
    return (this.redisClientOrPool as any).isReady !== false;
  }

  private getClient(): RedisClientType | null {
    if (!this.isRedisAvailable()) {
      return null;
    }

    // If it's a connection pool, get a client from the pool
    if (typeof (this.redisClientOrPool as any).getClient === 'function') {
      return (this.redisClientOrPool as RedisConnectionPool).getClient();
    }

    // Otherwise, it's a single client
    return this.redisClientOrPool as RedisClientType;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isRedisAvailable()) {
      this.logger.debug('Redis not available, returning null');
      return null;
    }
    
    const client = this.getClient();
    if (!client) {
      return null;
    }

    try {
      return await client.get(key);
    } catch (error: any) {
      this.logger.error(`Redis get error: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isRedisAvailable()) {
      this.logger.debug('Redis not available, skipping set');
      return;
    }
    
    const client = this.getClient();
    if (!client) {
      return;
    }

    try {
      if (ttl) {
        await client.setEx(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    } catch (error: any) {
      this.logger.error(`Redis set error: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isRedisAvailable()) {
      this.logger.debug('Redis not available, skipping delete');
      return;
    }
    
    const client = this.getClient();
    if (!client) {
      return;
    }

    try {
      await client.del(key);
    } catch (error: any) {
      this.logger.error(`Redis delete error: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      this.logger.debug('Redis not available, returning false');
      return false;
    }
    
    const client = this.getClient();
    if (!client) {
      return false;
    }

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error: any) {
      this.logger.error(`Redis exists error: ${error.message}`);
      return false;
    }
  }
}
