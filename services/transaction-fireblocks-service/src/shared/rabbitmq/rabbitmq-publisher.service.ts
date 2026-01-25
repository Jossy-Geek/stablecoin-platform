import { Injectable, Inject, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQPublisherService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQPublisherService.name);
  private channel: amqp.Channel | null = null;
  private isConnected: boolean = false;

  constructor(
    @Inject('RABBITMQ_CONNECTION') @Optional() private connection: amqp.Connection | null,
    private configService: ConfigService,
  ) {
    if (!this.connection) {
      this.logger.warn('⚠️  RabbitMQ connection is not available. RabbitMQ publishing will be skipped.');
    }
  }

  async onModuleInit() {
    if (!this.connection) {
      this.logger.error('❌ RabbitMQ connection is not available!');
      this.logger.error('❌ Please check:');
      this.logger.error('   1. RabbitMQ server is running');
      this.logger.error('   2. RABBITMQ_URL is set correctly in .env file');
      this.logger.error('   3. Connection credentials are correct');
      this.logger.warn('⚠️  Service will continue without RabbitMQ. Event publishing will be skipped.');
      return;
    }

    try {
      // @ts-ignore - amqplib Connection type doesn't correctly expose createChannel method
      this.channel = await this.connection.createChannel();
      
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Assert queues
      await this.channel.assertQueue('transaction-events', { durable: true });
      await this.channel.assertQueue('notification-events', { durable: true });

      this.isConnected = true;
      this.logger.log('✅ RabbitMQ Publisher Service initialized');
      this.logger.log('✅ Queues asserted: transaction-events, notification-events');
    } catch (error: any) {
      this.logger.error(`❌ Failed to initialize RabbitMQ Publisher: ${error.message}`);
      this.logger.error('❌ Please check RabbitMQ connection and configuration');
      this.logger.warn('⚠️  Service will continue without RabbitMQ. Event publishing will be skipped.');
      this.isConnected = false;
    }
  }

  /**
   * Publish transaction event to transaction-socket-service and notification-service
   * This message is consumed by both services from the 'transaction-events' queue
   */
  async publishTransactionEvent(event: {
    userId: string;
    transactionId: string;
    transactionType: string;
    status: string;
    amount: string;
    currency: string;
    txHash?: string;
    reason?: string;
    userEmail?: string;
    timestamp?: string;
    eventType?: string; // Optional: for transaction-socket-service (e.g., 'TRANSACTION_UPDATE')
  }): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      this.logger.debug(`RabbitMQ not available. Skipping transaction event: ${event.transactionId}`);
      return false;
    }

    try {
      const queueName = 'transaction-events';
      const timestamp = event.timestamp || new Date().toISOString();
      
      // Format message to be compatible with both transaction-socket-service and notification-service
      // transaction-socket-service expects: { eventType?, payload: { ... } }
      // notification-service expects: flat object with userEmail/email
      const message = JSON.stringify({
        // For transaction-socket-service (TransactionEventMessage format)
        eventType: event.eventType || 'TRANSACTION_UPDATE',
        payload: {
          transactionId: event.transactionId,
          userId: event.userId,
          transactionType: event.transactionType,
          amount: event.amount,
          currency: event.currency,
          status: event.status,
          txHash: event.txHash,
          reason: event.reason,
          timestamp: timestamp,
          eventType: event.eventType || 'TRANSACTION_UPDATE', // Also in payload for backward compatibility
        },
        // For notification-service (flat format compatibility)
        userId: event.userId,
        transactionId: event.transactionId,
        transactionType: event.transactionType,
        status: event.status,
        amount: event.amount,
        currency: event.currency,
        txHash: event.txHash,
        reason: event.reason,
        userEmail: event.userEmail,
        email: event.userEmail, // Also include as 'email' for compatibility with notification-service
        timestamp: timestamp,
      });

      this.channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
      this.logger.log(`✅ Published transaction event to queue ${queueName}: ${event.transactionId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Error publishing transaction event: ${error.message}`);
      return false;
    }
  }

  /**
   * Publish custom notification event
   */
  async publishNotificationEvent(event: {
    userId: string;
    title: string;
    message: string;
    type?: 'transaction' | 'system' | 'security' | 'account' | 'wallet' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      this.logger.debug(`RabbitMQ not available. Skipping notification event`);
      return false;
    }

    try {
      const queueName = 'notification-events';
      const message = JSON.stringify({
        userId: event.userId,
        title: event.title,
        message: event.message,
        type: event.type || 'other',
        priority: event.priority || 'medium',
        metadata: event.metadata || {},
      });

      this.channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
      this.logger.log(`✅ Published notification event to queue ${queueName} for user ${event.userId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Error publishing notification event: ${error.message}`);
      return false;
    }
  }
}
