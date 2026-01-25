import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TokenWhitelistService {
  private readonly logger = new Logger(TokenWhitelistService.name);

  constructor(private redisService: RedisService) {}

  /**
   * Store token in Redis whitelist when user logs in or refreshes token
   * @param userId - User ID
   * @param role - Role from token
   * @param token - JWT token
   * @param expiresIn - Token expiration time in seconds
   */
  async addToken(userId: string, role: string, token: string, expiresIn: number): Promise<void> {
    const key = `token:${userId}:${role}`;
    await this.redisService.set(key, token, expiresIn);
    this.logger.debug(`Token stored in whitelist: ${key}`);
  }

  /**
   * Check if token exists in whitelist
   * @param userId - User ID from JWT
   * @param role - Role from JWT
   * @param token - JWT token to validate
   * @returns true if token exists and matches, false otherwise
   */
  async isTokenValid(userId: string, role: string, token: string): Promise<boolean> {
    const key = `token:${userId}:${role}`;
    const storedToken = await this.redisService.get(key);
    
    if (!storedToken) {
      this.logger.debug(`Token not found in whitelist: ${key}`);
      return false; // Token not in whitelist
    }

    // Verify token matches (prevent token reuse if user has multiple sessions)
    const isValid = storedToken === token;
    if (!isValid) {
      this.logger.debug(`Token mismatch for: ${key}`);
    }
    return isValid;
  }

  /**
   * Remove token from whitelist (logout or block)
   * @param userId - User ID
   * @param role - Role
   */
  async removeToken(userId: string, role: string): Promise<void> {
    const key = `token:${userId}:${role}`;
    await this.redisService.del(key);
    this.logger.log(`Token removed from whitelist: ${key}`);
  }

  /**
   * Remove all tokens for a specific role when role is blocked
   * @param userId - User ID
   * @param role - Role that is blocked
   */
  async removeRoleTokens(userId: string, role: string): Promise<void> {
    await this.removeToken(userId, role);
    this.logger.log(`All tokens removed for blocked role: ${userId}:${role}`);
  }

  /**
   * Update token TTL when refreshing (extend expiration)
   * @param userId - User ID
   * @param role - Role
   * @param token - New or same token
   * @param expiresIn - New expiration time
   */
  async refreshToken(userId: string, role: string, token: string, expiresIn: number): Promise<void> {
    const key = `token:${userId}:${role}`;
    const existingToken = await this.redisService.get(key);
    
    if (existingToken && existingToken === token) {
      // Extend TTL for existing token
      await this.redisService.set(key, token, expiresIn);
      this.logger.debug(`Token TTL extended: ${key}`);
    } else {
      // Store new token (if token changed during refresh)
      await this.addToken(userId, role, token, expiresIn);
      this.logger.debug(`New token stored during refresh: ${key}`);
    }
  }
}
