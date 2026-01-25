import { Injectable, Inject, OnModuleInit, Logger, forwardRef } from '@nestjs/common';
import * as amqp from 'amqplib';
import { SocketGateway } from '../../modules/socket/socket.gateway';
import { TRANSACTION_UPDATE, TransactionEventMessage } from '../../modules/socket/dto/transaction-event.dto';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private channel: amqp.Channel | null = null;

  constructor(
    @Inject('RABBITMQ_CONNECTION') private connection: amqp.Connection,
    @Inject(forwardRef(() => SocketGateway)) private socketGateway: SocketGateway,
  ) {}

  async onModuleInit() {
    if (!this.channel) {
      // @ts-ignore - amqplib Connection type doesn't correctly expose createChannel method
      this.channel = await this.connection.createChannel();
    }

    if (!this.channel) {
      throw new Error('Failed to create RabbitMQ channel');
    }

    // Assert queues
    await this.channel.assertQueue('transaction-events', { durable: true });
    await this.channel.assertQueue('socket-notification-events', { durable: true });

    this.logger.log(`✅ Connected to RabbitMQ. Listening on queues: transaction-events, socket-notification-events`);
    console.log(`📡 [RabbitMQ] Subscribed to queue: transaction-events`);
    console.log(`📡 [RabbitMQ] Waiting for transaction events...`);

    // Consume transaction events
    this.channel.consume('transaction-events', async (msg) => {
      if (msg && this.channel) {
        try {
          const messageContent = msg.content.toString();
          console.log(`📥 [RabbitMQ] Received message from queue: transaction-events`);
          console.log(`📥 [RabbitMQ] Message content:`, messageContent);
          
          const message: TransactionEventMessage = JSON.parse(messageContent);
          const originalEventType = message.eventType || message.payload.eventType || 'N/A';
          console.log(`📥 [RabbitMQ] Parsed transaction event`);
          console.log(`📥 [RabbitMQ] Original event type: ${originalEventType}`);
          console.log(`📥 [RabbitMQ] Transaction ID: ${message.payload.transactionId}`);
          console.log(`📥 [RabbitMQ] Status: ${message.payload.status}`);
          console.log(`📥 [RabbitMQ] User ID: ${message.payload.userId}`);
          
          await this.handleTransactionEvent(message);
          
          console.log(`✅ [RabbitMQ] Successfully processed transaction update`);
          this.channel.ack(msg);
        } catch (error) {
          console.error(`❌ [RabbitMQ] Error processing transaction event:`, error);
          this.logger.error('Error processing transaction event:', error);
          // Reject message and don't requeue if it fails
          this.channel.nack(msg, false, false);
        }
      }
    });

    // Consume notification events from notification-service
    console.log(`📡 [RabbitMQ] Subscribed to queue: socket-notification-events`);
    console.log(`📡 [RabbitMQ] Waiting for notification events...`);

    this.channel.consume('socket-notification-events', async (msg) => {
      if (msg && this.channel) {
        try {
          const messageContent = msg.content.toString();
          console.log(`📥 [RabbitMQ] Received notification event from queue: socket-notification-events`);
          console.log(`📥 [RabbitMQ] Message content:`, messageContent);
          
          const event = JSON.parse(messageContent);
          console.log(`📥 [RabbitMQ] Event type: ${event.eventType}`);
          console.log(`📥 [RabbitMQ] User ID: ${event.userId}`);
          console.log(`📥 [RabbitMQ] Unread count: ${event.unreadCount}`);
          
          await this.handleNotificationEvent(event);
          
          console.log(`✅ [RabbitMQ] Successfully processed notification event`);
          this.channel.ack(msg);
        } catch (error) {
          console.error(`❌ [RabbitMQ] Error processing notification event:`, error);
          this.logger.error('Error processing notification event:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async handleTransactionEvent(message: TransactionEventMessage) {
    const { payload } = message;
    const originalEventType = message.eventType || payload.eventType;

    this.logger.log(`📥 Received transaction event for transaction: ${payload.transactionId}`);
    console.log(`🔄 [Event Handler] Processing transaction update`);
    console.log(`🔄 [Event Handler] Original event type: ${originalEventType || 'N/A'}`);
    console.log(`🔄 [Event Handler] Transaction: ${payload.transactionId}`);
    console.log(`🔄 [Event Handler] User: ${payload.userId}`);
    console.log(`🔄 [Event Handler] Type: ${payload.transactionType}`);
    console.log(`🔄 [Event Handler] Status: ${payload.status}`);
    console.log(`🔄 [Event Handler] Amount: ${payload.amount} ${payload.currency || ''}`);

    // Store original event type in payload for reference (optional)
    const eventPayload = {
      ...payload,
      eventType: originalEventType, // Include original event type in payload if needed
    };

    // Always emit as TRANSACTION_UPDATE - frontend will handle based on status
    console.log(`📤 [Event Handler] Emitting TRANSACTION_UPDATE to user: ${payload.userId}`);
    this.socketGateway.emitToUser(
      payload.userId,
      TRANSACTION_UPDATE,
      eventPayload,
    );
  }

  private async handleNotificationEvent(event: {
    userId: string;
    notification: any | null;
    unreadCount: number;
    eventType: 'NOTIFICATION_CREATED' | 'NOTIFICATION_UPDATED' | 'NOTIFICATION_DELETED';
  }) {
    this.logger.log(`📥 Received notification event: ${event.eventType} for user: ${event.userId}`);
    console.log(`🔄 [Notification Handler] Processing notification event`);
    console.log(`🔄 [Notification Handler] Event type: ${event.eventType}`);
    console.log(`🔄 [Notification Handler] User: ${event.userId}`);
    console.log(`🔄 [Notification Handler] Unread count: ${event.unreadCount}`);

    // Emit notification event to user via Socket.IO
    this.socketGateway.emitNotificationToUser(
      event.userId,
      event.eventType,
      event.notification,
      event.unreadCount,
    );
  }
}
