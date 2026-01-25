import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly isAvailable: boolean;

  constructor(
    @Inject('REDIS_CLIENT') @Optional() private readonly redisClient: RedisClientType | null,
  ) {
    this.isAvailable = this.redisClient !== null && this.redisClient !== undefined;
    if (!this.isAvailable) {
      this.logger.warn('⚠️  Redis client is not available. Redis operations will be skipped.');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable) {
      this.logger.debug(`Redis get skipped (Redis not available): ${key}`);
      return null;
    }

    try {
      return await this.redisClient!.get(key);
    } catch (error) {
      this.logger.warn(`Redis get failed: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isAvailable) {
      this.logger.debug(`Redis set skipped (Redis not available): ${key}`);
      return;
    }

    try {
      if (ttl) {
        await this.redisClient!.setEx(key, ttl, value);
      } else {
        await this.redisClient!.set(key, value);
      }
    } catch (error) {
      this.logger.warn(`Redis set failed: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable) {
      this.logger.debug(`Redis del skipped (Redis not available): ${key}`);
      return;
    }

    try {
      await this.redisClient!.del(key);
    } catch (error) {
      this.logger.warn(`Redis del failed: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable) {
      this.logger.debug(`Redis exists skipped (Redis not available): ${key}`);
      return false;
    }

    try {
      const result = await this.redisClient!.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.warn(`Redis exists failed: ${error.message}`);
      return false;
    }
  }
}
