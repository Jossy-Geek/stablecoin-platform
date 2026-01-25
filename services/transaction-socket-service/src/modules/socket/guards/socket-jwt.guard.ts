import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { SocketUser } from '../../../shared/auth/dto/socket-user.dto';

@Injectable()
export class SocketJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    console.log(`🔐 [Auth Guard] ========== NEW CONNECTION ATTEMPT ==========`);
    console.log(`🔐 [Auth Guard] Socket ID: ${client.id}`);
    console.log(`🔐 [Auth Guard] Handshake URL: ${client.handshake.url}`);
    console.log(`🔐 [Auth Guard] Handshake query:`, client.handshake.query);
    console.log(`🔐 [Auth Guard] Handshake auth:`, JSON.stringify(client.handshake.auth, null, 2));
    console.log(`🔐 [Auth Guard] Handshake headers:`, JSON.stringify(client.handshake.headers, null, 2));
    
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      console.error(`❌ [Auth Guard] ========== AUTHENTICATION FAILED ==========`);
      console.error(`❌ [Auth Guard] No token found. Disconnecting socket: ${client.id}`);
      console.error(`❌ [Auth Guard] Handshake auth keys:`, Object.keys(client.handshake.auth || {}));
      console.error(`❌ [Auth Guard] Handshake auth object:`, client.handshake.auth);
      console.error(`❌ [Auth Guard] Handshake headers keys:`, Object.keys(client.handshake.headers || {}));
      console.error(`❌ [Auth Guard] Authorization header:`, client.handshake.headers?.authorization);
      console.error(`❌ [Auth Guard] Full handshake:`, {
        url: client.handshake.url,
        query: client.handshake.query,
        auth: client.handshake.auth,
        headers: client.handshake.headers,
      });
      
      // Emit error before disconnecting to provide feedback
      client.emit('auth_error', { message: 'No authentication token provided' });
      client.disconnect();
      return false;
    }

    console.log(`🔐 [Auth Guard] Token extracted. Length: ${token.length} characters`);
    console.log(`🔐 [Auth Guard] Token preview: ${token.substring(0, 20)}...`);

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
      console.log(`🔐 [Auth Guard] JWT_SECRET configured: ${secret ? 'YES (length: ' + secret.length + ')' : 'NO'}`);
      console.log(`🔐 [Auth Guard] Verifying JWT token...`);
      console.log(`🔐 [Auth Guard] Token length: ${token.length}`);
      console.log(`🔐 [Auth Guard] Token preview: ${token.substring(0, 50)}...`);
      
      const payload = await this.jwtService.verifyAsync(token, { secret });
      console.log(`✅ [Auth Guard] ========== AUTHENTICATION SUCCESS ==========`);
      console.log(`✅ [Auth Guard] Token verified successfully`);
      console.log(`✅ [Auth Guard] User ID: ${payload.userId}`);
      console.log(`✅ [Auth Guard] Email: ${payload.email}`);
      console.log(`✅ [Auth Guard] Role: ${payload.role || 'user'}`);
      console.log(`✅ [Auth Guard] Full payload:`, JSON.stringify(payload, null, 2));

      // Attach user to socket
      (client as any).user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
      } as SocketUser;

      console.log(`✅ [Auth Guard] User attached to socket. Authentication successful.`);
      return true;
    } catch (error: any) {
      console.error(`❌ [Auth Guard] ========== TOKEN VERIFICATION FAILED ==========`);
      console.error(`❌ [Auth Guard] Error type: ${error.name}`);
      console.error(`❌ [Auth Guard] Error message: ${error.message}`);
      console.error(`❌ [Auth Guard] Error stack:`, error.stack);
      console.error(`❌ [Auth Guard] JWT_SECRET used: ${this.configService.get<string>('JWT_SECRET', 'NOT SET')}`);
      console.error(`❌ [Auth Guard] Disconnecting socket: ${client.id}`);
      
      // Emit specific error message before disconnecting
      const errorMessage = error.name === 'TokenExpiredError' 
        ? 'JWT token has expired'
        : error.name === 'JsonWebTokenError'
        ? 'Invalid JWT token format'
        : error.name === 'NotBeforeError'
        ? 'JWT token not active yet'
        : `Token verification failed: ${error.message}`;
      
      client.emit('auth_error', { 
        message: errorMessage,
        errorType: error.name,
      });
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    console.log(`🔍 [Auth Guard] Extracting token from socket...`);
    
    // Try to get token from handshake auth first (Socket.IO client sends it here)
    const authToken = client.handshake.auth?.token;
    console.log(`🔍 [Auth Guard] Token from handshake.auth.token: ${authToken ? 'FOUND (length: ' + authToken.length + ')' : 'NOT FOUND'}`);
    
    // Try to get token from headers as fallback
    const headerToken = client.handshake.headers?.authorization;
    console.log(`🔍 [Auth Guard] Token from headers.authorization: ${headerToken ? 'FOUND' : 'NOT FOUND'}`);
    
    // Prefer auth token over header token
    const token = authToken || headerToken;

    if (typeof token === 'string') {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      console.log(`✅ [Auth Guard] Token extracted successfully. Length: ${cleanToken.length}`);
      return cleanToken;
    }

    console.warn(`⚠️  [Auth Guard] No valid token found in handshake`);
    return null;
  }
}
