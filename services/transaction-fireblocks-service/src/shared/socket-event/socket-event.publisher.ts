import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocketEventPayload, SocketEventType } from './dto/socket-event.dto';
import { RabbitMQPublisherService } from '../rabbitmq/rabbitmq-publisher.service';

@Injectable()
export class SocketEventPublisher {
  private readonly logger = new Logger(SocketEventPublisher.name);
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    @Optional() private rabbitMQPublisher: RabbitMQPublisherService,
  ) {
    this.isEnabled = this.configService.get<string>('SOCKET_SERVICE_ENABLED', 'true') === 'true';

    if (this.isEnabled) {
      this.logger.log(`✅ Socket Event Publisher initialized (using RabbitMQ)`);
    } else {
      this.logger.warn(`⚠️  Socket Event Publisher is DISABLED`);
    }
  }

  /**
   * Publish transaction event to socket service via RabbitMQ (non-blocking)
   */
  async publishEvent(payload: SocketEventPayload): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(`Socket events disabled. Skipping event: ${payload.eventType}`);
      return;
    }

    if (!this.rabbitMQPublisher) {
      this.logger.warn(`⚠️  RabbitMQ Publisher not available. Skipping socket event: ${payload.eventType}`);
      return;
    }

    // Add timestamp if not provided
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }

    // Fire and forget - don't block the main flow
    this.publishEventAsync(payload).catch((error) => {
      // Log error but don't throw - this should not break the main transaction flow
      this.logger.error(
        `Failed to publish socket event via RabbitMQ: ${payload.eventType} for transaction: ${payload.transactionId}`,
        error.message,
      );
      console.error(`❌ [Socket Publisher] Failed to emit ${payload.eventType}:`, error.message);
    });
  }

  /**
   * Async publish method using RabbitMQ
   */
  private async publishEventAsync(payload: SocketEventPayload): Promise<void> {
    try {
      console.log(`📤 [Socket Publisher] Publishing event via RabbitMQ: ${payload.eventType}`);
      console.log(`📤 [Socket Publisher] Transaction: ${payload.transactionId}`);
      console.log(`📤 [Socket Publisher] User: ${payload.userId}`);
      console.log(`📤 [Socket Publisher] Payload:`, JSON.stringify(payload, null, 2));

      // Publish to RabbitMQ transaction-events queue
      // Format: { eventType, payload: { transactionId, userId, ... } }
      // This matches the TransactionEventMessage format expected by transaction-socket-service
      const success = await this.rabbitMQPublisher.publishTransactionEvent({
        userId: payload.userId,
        transactionId: payload.transactionId,
        transactionType: payload.transactionType || 'unknown',
        status: payload.status,
        amount: payload.amount,
        currency: payload.currency || 'USD',
        txHash: payload.txHash,
        reason: payload.reason,
        timestamp: payload.timestamp || new Date().toISOString(),
        eventType: payload.eventType || SocketEventType.TRANSACTION_UPDATE, // Include eventType for socket service
      });

      if (success) {
        console.log(`✅ [Socket Publisher] Event published successfully via RabbitMQ: ${payload.eventType}`);
        this.logger.log(
          `✅ Published socket event via RabbitMQ: ${payload.eventType} for transaction: ${payload.transactionId}`,
        );
      } else {
        console.warn(`⚠️  [Socket Publisher] Failed to publish event via RabbitMQ: ${payload.eventType}`);
        this.logger.warn(
          `⚠️  Failed to publish socket event via RabbitMQ: ${payload.eventType} for transaction: ${payload.transactionId}`,
        );
      }
    } catch (error: any) {
      console.error(`❌ [Socket Publisher] Error publishing via RabbitMQ:`, error.message);
      this.logger.error(`Socket event publish error via RabbitMQ: ${error.message}`);
      throw error; // Re-throw to be caught by publishEvent
    }
  }

  /**
   * Helper method to publish transaction approved event
   */
  async publishTransactionApproved(
    userId: string,
    transactionId: string,
    amount: string,
    currency: string,
    transactionType: string,
    status: string,
    txHash?: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: SocketEventType.TRANSACTION_APPROVED,
      userId,
      transactionId,
      status,
      amount,
      currency,
      transactionType,
      txHash,
    });
  }

  /**
   * Helper method to publish transaction rejected event
   */
  async publishTransactionRejected(
    userId: string,
    transactionId: string,
    amount: string,
    currency: string,
    transactionType: string,
    status: string,
    reason: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: SocketEventType.TRANSACTION_REJECTED,
      userId,
      transactionId,
      status,
      amount,
      currency,
      transactionType,
      reason,
    });
  }

  /**
   * Helper method to publish transaction pending event
   */
  async publishTransactionPending(
    userId: string,
    transactionId: string,
    amount: string,
    currency: string,
    transactionType: string,
    status: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: SocketEventType.TRANSACTION_PENDING,
      userId,
      transactionId,
      status,
      amount,
      currency,
      transactionType,
    });
  }

  /**
   * Helper method to publish transaction confirmed event
   */
  async publishTransactionConfirmed(
    userId: string,
    transactionId: string,
    amount: string,
    currency: string,
    transactionType: string,
    status: string,
    txHash?: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: SocketEventType.TRANSACTION_CONFIRMED,
      userId,
      transactionId,
      status,
      amount,
      currency,
      transactionType,
      txHash,
    });
  }
}
