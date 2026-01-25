import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TokenWhitelistService {
  private readonly logger = new Logger(TokenWhitelistService.name);

  constructor(private redisService: RedisService) {}

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
}
