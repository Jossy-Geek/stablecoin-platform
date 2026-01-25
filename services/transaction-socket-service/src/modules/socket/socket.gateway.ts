import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketJwtGuard } from './guards/socket-jwt.guard';
import { SocketUser } from '../../shared/auth/dto/socket-user.dto';
import { TransactionEventPayload } from './dto/transaction-event.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3006', 'http://localhost:3007'],
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['authorization', 'content-type'],
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
@UseGuards(SocketJwtGuard)
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);
  private readonly userRooms = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Log CORS configuration on startup
    const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3006', 'http://localhost:3007'];
    console.log(`🌐 [Socket Gateway] CORS origins configured:`, corsOrigins);
    console.log(`🌐 [Socket Gateway] Transports enabled: websocket, polling`);
  }

  /**
   * Manually verify token and attach user to socket (fallback when guard fails)
   */
  private async authenticateSocket(client: Socket): Promise<SocketUser | null> {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || 
                   (client.handshake.headers?.authorization?.startsWith('Bearer ') 
                     ? client.handshake.headers.authorization.substring(7) 
                     : client.handshake.headers?.authorization);

      if (!token) {
        console.error(`❌ [Socket Gateway] No token found in handshake`);
        return null;
      }

      console.log(`🔍 [Socket Gateway] Attempting manual token verification...`);
      console.log(`🔍 [Socket Gateway] Token length: ${token.length}`);

      // Verify token
      const secret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      console.log(`✅ [Socket Gateway] Token verified successfully`);
      console.log(`✅ [Socket Gateway] User ID: ${payload.userId}`);
      console.log(`✅ [Socket Gateway] Email: ${payload.email}`);

      // Create user object
      const user: SocketUser = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
      };

      // Attach user to socket
      (client as any).user = user;

      console.log(`✅ [Socket Gateway] User attached to socket manually`);
      return user;
    } catch (error: any) {
      console.error(`❌ [Socket Gateway] Manual authentication failed:`, error.message);
      console.error(`❌ [Socket Gateway] Error type: ${error.name}`);
      return null;
    }
  }

  async handleConnection(client: Socket) {
    console.log(`🔌 [Socket Gateway] ========== CONNECTION RECEIVED ==========`);
    console.log(`🔌 [Socket Gateway] Socket ID: ${client.id}`);
    console.log(`🔌 [Socket Gateway] Transport: ${client.conn.transport.name}`);
    console.log(`🔌 [Socket Gateway] Handshake URL: ${client.handshake.url}`);
    console.log(`🔌 [Socket Gateway] Handshake origin: ${client.handshake.headers.origin}`);
    console.log(`🔌 [Socket Gateway] Handshake auth:`, JSON.stringify(client.handshake.auth, null, 2));
    console.log(`🔌 [Socket Gateway] Handshake headers:`, JSON.stringify(client.handshake.headers, null, 2));
    
    // Check if guard ran and attached user
    const user = (client as any).user as SocketUser;
    console.log(`🔍 [Socket Gateway] Checking user attachment...`);
    console.log(`🔍 [Socket Gateway] User object:`, user);
    console.log(`🔍 [Socket Gateway] User exists:`, !!user);
    console.log(`🔍 [Socket Gateway] User ID:`, user?.userId);
    
    if (!user || !user.userId) {
      console.error(`❌ [Socket Gateway] ========== USER NOT ATTACHED ==========`);
      console.error(`❌ [Socket Gateway] Guard may not have run or failed silently`);
      console.error(`❌ [Socket Gateway] Attempting to authenticate manually...`);
      
      // Try to authenticate manually as fallback
      const authenticatedUser = await this.authenticateSocket(client);
      
      if (!authenticatedUser || !authenticatedUser.userId) {
        console.warn(`⚠️  [Socket Gateway] Manual authentication failed. Disconnecting...`);
        this.logger.warn('Connection attempt without valid user - manual auth failed');
        client.emit('auth_error', { message: 'User not authenticated. Token verification failed.' });
        client.disconnect();
        return;
      }

      // Use the authenticated user
      const finalUser = authenticatedUser;
      console.log(`✅ [Socket Gateway] Manual authentication successful. Proceeding with connection...`);
      
      // Join user-specific room
      const userRoom = `user:${finalUser.userId}`;
      client.join(userRoom);
      console.log(`✅ [Socket] User authenticated: ${finalUser.userId} (${finalUser.email})`);
      console.log(`✅ [Socket] Socket ID: ${client.id}`);
      console.log(`✅ [Socket] Joined room: ${userRoom}`);

      // Track socket for this user
      if (!this.userRooms.has(finalUser.userId)) {
        this.userRooms.set(finalUser.userId, new Set());
      }
      this.userRooms.get(finalUser.userId)!.add(client.id);

      const totalSocketsForUser = this.userRooms.get(finalUser.userId)!.size;
      console.log(`📊 [Socket] Total sockets for user ${finalUser.userId}: ${totalSocketsForUser}`);
      console.log(`📊 [Socket] Total connected users: ${this.userRooms.size}`);
      console.log(`📊 [Socket] Currently connected user IDs:`, Array.from(this.userRooms.keys()));

      this.logger.log(`✅ User ${finalUser.userId} (${finalUser.email}) connected. Socket: ${client.id}`);
      this.logger.log(`   Joined room: ${userRoom}`);
      return;
    }

    // Join user-specific room
    const userRoom = `user:${user.userId}`;
    client.join(userRoom);
    console.log(`✅ [Socket] User authenticated: ${user.userId} (${user.email})`);
    console.log(`✅ [Socket] Socket ID: ${client.id}`);
    console.log(`✅ [Socket] Joined room: ${userRoom}`);

    // Track socket for this user
    if (!this.userRooms.has(user.userId)) {
      this.userRooms.set(user.userId, new Set());
    }
    this.userRooms.get(user.userId)!.add(client.id);

    const totalSocketsForUser = this.userRooms.get(user.userId)!.size;
    console.log(`📊 [Socket] Total sockets for user ${user.userId}: ${totalSocketsForUser}`);
    console.log(`📊 [Socket] Total connected users: ${this.userRooms.size}`);
    console.log(`📊 [Socket] Currently connected user IDs:`, Array.from(this.userRooms.keys()));

    this.logger.log(`✅ User ${user.userId} (${user.email}) connected. Socket: ${client.id}`);
    this.logger.log(`   Joined room: ${userRoom}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 [Socket] Disconnection. Socket ID: ${client.id}`);
    
    const user = (client as any).user as SocketUser;
    
    if (user && user.userId) {
      const userSockets = this.userRooms.get(user.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        console.log(`❌ [Socket] Removed socket ${client.id} from user ${user.userId}`);
        
        if (userSockets.size === 0) {
          this.userRooms.delete(user.userId);
          console.log(`❌ [Socket] User ${user.userId} has no more active sockets`);
        } else {
          console.log(`📊 [Socket] User ${user.userId} still has ${userSockets.size} active socket(s)`);
        }
      }

      console.log(`📊 [Socket] Total connected users: ${this.userRooms.size}`);
      this.logger.log(`❌ User ${user.userId} disconnected. Socket: ${client.id}`);
    } else {
      console.warn(`⚠️  [Socket] Disconnection without user info. Socket ID: ${client.id}`);
    }
  }

  /**
   * Emit transaction event to specific user
   */
  emitToUser(userId: string, eventType: string, payload: TransactionEventPayload) {
    const userRoom = `user:${userId}`;
    const isUserConnected = this.isUserConnected(userId);
    
    console.log(`📤 [Socket] Preparing to emit event: ${eventType}`);
    console.log(`📤 [Socket] Target user: ${userId}`);
    console.log(`📤 [Socket] Target room: ${userRoom}`);
    console.log(`📤 [Socket] User connected: ${isUserConnected ? '✅ Yes' : '❌ No'}`);
    console.log(`📤 [Socket] Transaction ID: ${payload.transactionId}`);
    console.log(`📤 [Socket] Payload:`, JSON.stringify(payload, null, 2));
    
    if (!isUserConnected) {
      console.warn(`⚠️  [Socket] User ${userId} is not connected. Event will not be delivered.`);
      console.warn(`⚠️  [Socket] Currently connected users:`, Array.from(this.userRooms.keys()));
      console.warn(`⚠️  [Socket] Total connected users: ${this.userRooms.size}`);
      this.logger.warn(`User ${userId} is not connected. Event ${eventType} will not be delivered.`);
      this.logger.warn(`Currently connected users: ${Array.from(this.userRooms.keys()).join(', ')}`);
    }
    
    // Emit to the room
    this.server.to(userRoom).emit(eventType, payload);
    
    console.log(`✅ [Socket] Event ${eventType} emitted to room: ${userRoom}`);
    console.log(`✅ [Socket] Transaction: ${payload.transactionId}`);
    this.logger.log(`📤 Emitted ${eventType} to user:${userId} - Transaction: ${payload.transactionId}`);
  }

  /**
   * Emit notification event to specific user
   */
  emitNotificationToUser(
    userId: string,
    eventType: 'NOTIFICATION_CREATED' | 'NOTIFICATION_UPDATED' | 'NOTIFICATION_DELETED',
    notification: any | null,
    unreadCount: number,
  ) {
    const userRoom = `user:${userId}`;
    const isUserConnected = this.isUserConnected(userId);
    
    console.log(`📤 [Socket] Preparing to emit notification event: ${eventType}`);
    console.log(`📤 [Socket] Target user: ${userId}`);
    console.log(`📤 [Socket] Target room: ${userRoom}`);
    console.log(`📤 [Socket] User connected: ${isUserConnected ? '✅ Yes' : '❌ No'}`);
    console.log(`📤 [Socket] Unread count: ${unreadCount}`);
    
    if (!isUserConnected) {
      console.warn(`⚠️  [Socket] User ${userId} is not connected. Notification event will not be delivered.`);
      console.warn(`⚠️  [Socket] Currently connected users:`, Array.from(this.userRooms.keys()));
      this.logger.warn(`User ${userId} is not connected. Notification event ${eventType} will not be delivered.`);
    }
    
    // Emit notification event to the room
    const payload = {
      notification,
      unreadCount,
      eventType,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to(userRoom).emit('NOTIFICATION_UPDATE', payload);
    
    console.log(`✅ [Socket] Notification event ${eventType} emitted to room: ${userRoom}`);
    this.logger.log(`📤 Emitted notification ${eventType} to user:${userId} - Unread: ${unreadCount}`);
  }

  /**
   * Get connected users count (for monitoring)
   */
  getConnectedUsersCount(): number {
    return this.userRooms.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userRooms.has(userId) && this.userRooms.get(userId)!.size > 0;
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    const user = (client as any).user as SocketUser;
    console.log(`🏓 [Socket] Ping received from user: ${user?.userId || 'unknown'}, socket: ${client.id}`);
    
    const response = { event: 'pong', timestamp: new Date().toISOString() };
    console.log(`🏓 [Socket] Sending pong response:`, response);
    
    return response;
  }
}
