import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { TRANSACTION_UPDATE, TransactionEventPayload } from './dto/transaction-event.dto';

@Controller('events')
export class SocketEventsController {
  private readonly logger = new Logger(SocketEventsController.name);

  constructor(private socketGateway: SocketGateway) {}

  @Post()
  async receiveEvent(@Body() payload: {
    eventType: string;
    userId: string;
    transactionId: string;
    status: string;
    amount: string;
    currency: string;
    transactionType?: string;
    txHash?: string;
    reason?: string;
    timestamp?: string;
  }) {
    console.log(`📥 [HTTP Event] Received POST /events`);
    console.log(`📥 [HTTP Event] Payload:`, JSON.stringify(payload, null, 2));

    try {
      // Create event payload with all data from request
      const eventPayload: TransactionEventPayload = {
        transactionId: payload.transactionId,
        userId: payload.userId,
        transactionType: payload.transactionType || 'unknown',
        amount: payload.amount,
        currency: payload.currency,
        status: payload.status,
        txHash: payload.txHash,
        timestamp: payload.timestamp || new Date().toISOString(),
        reason: payload.reason,
        eventType: payload.eventType, // Store original event type in payload for reference
      };

      console.log(`🔄 [HTTP Event] Processing transaction update`);
      console.log(`🔄 [HTTP Event] Original event type: ${payload.eventType || 'N/A'}`);
      console.log(`🔄 [HTTP Event] Status: ${payload.status}`);
      console.log(`🔄 [HTTP Event] User: ${payload.userId}`);
      console.log(`🔄 [HTTP Event] Transaction: ${payload.transactionId}`);

      // Always emit as TRANSACTION_UPDATE - frontend will handle based on status
      this.socketGateway.emitToUser(payload.userId, TRANSACTION_UPDATE, eventPayload);

      console.log(`✅ [HTTP Event] Event processed and emitted successfully`);
      this.logger.log(`TRANSACTION_UPDATE processed for user ${payload.userId}, transaction ${payload.transactionId}`);

      return {
        success: true,
        message: 'Event received and emitted',
        eventType: TRANSACTION_UPDATE,
        userId: payload.userId,
        transactionId: payload.transactionId,
      };
    } catch (error: any) {
      console.error(`❌ [HTTP Event] Error processing event:`, error);
      this.logger.error(`Error processing event: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: error.message || 'Failed to process event',
      };
    }
  }

  @Post('notification')
  async receiveNotificationEvent(@Body() payload: {
    userId: string;
    notification: {
      _id: string;
      userId: string;
      title: string;
      message: string;
      type: string;
      status: string;
      priority: string;
      metadata: Record<string, any>;
      readAt: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    unreadCount: number;
    eventType: 'NOTIFICATION_CREATED' | 'NOTIFICATION_UPDATED' | 'NOTIFICATION_DELETED';
  }) {
    console.log(`📥 [HTTP Notification Event] Received POST /events/notification`);
    console.log(`📥 [HTTP Notification Event] Payload:`, JSON.stringify(payload, null, 2));

    try {
      console.log(`🔄 [HTTP Notification Event] Processing notification event`);
      console.log(`🔄 [HTTP Notification Event] Event type: ${payload.eventType}`);
      console.log(`🔄 [HTTP Notification Event] User: ${payload.userId}`);
      console.log(`🔄 [HTTP Notification Event] Unread count: ${payload.unreadCount}`);

      // Emit notification event to user via Socket.IO
      this.socketGateway.emitNotificationToUser(
        payload.userId,
        payload.eventType,
        payload.notification,
        payload.unreadCount,
      );

      console.log(`✅ [HTTP Notification Event] Event processed and emitted successfully`);
      this.logger.log(`Notification ${payload.eventType} processed for user ${payload.userId}`);

      return {
        success: true,
        message: 'Notification event received and emitted',
        eventType: payload.eventType,
        userId: payload.userId,
        unreadCount: payload.unreadCount,
      };
    } catch (error: any) {
      console.error(`❌ [HTTP Notification Event] Error processing event:`, error);
      this.logger.error(`Error processing notification event: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: error.message || 'Failed to process notification event',
      };
    }
  }
}
