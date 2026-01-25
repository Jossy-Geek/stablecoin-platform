import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { TokenWhitelistService } from '../auth/token-whitelist.service';

@Injectable()
export class JwtAuthWithBlockCheckGuard extends AuthGuard('jwt') {
  constructor(
    private tokenWhitelistService: TokenWhitelistService,
    private reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check JWT validity
    const isValid = await super.canActivate(context);
    if (!isValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Contains userId, email, role from JWT
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    // Check if token exists in whitelist
    const isTokenValid = await this.tokenWhitelistService.isTokenValid(
      user.userId,
      user.role,
      token
    );

    if (!isTokenValid) {
      throw new UnauthorizedException(
        'Token is not valid or has been revoked. Please login again.'
      );
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    return authHeader.replace('Bearer ', '');
  }
}
