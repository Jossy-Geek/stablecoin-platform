import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQPublisherService } from '../rabbitmq/rabbitmq-publisher.service';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: 'transaction' | 'system' | 'security' | 'account' | 'wallet' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationClientService implements OnModuleInit {
  private readonly logger = new Logger(NotificationClientService.name);
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private rabbitMQPublisher: RabbitMQPublisherService,
  ) {
    this.isEnabled = this.configService.get<string>('NOTIFICATION_SERVICE_ENABLED', 'true') === 'true';
  }

  async onModuleInit() {
    if (this.isEnabled) {
      this.logger.log(`✅ Notification Client Service initialized (using RabbitMQ)`);
    } else {
      this.logger.warn(`⚠️  Notification Client Service is DISABLED`);
    }
  }

  /**
   * Send transaction event to notification service via RabbitMQ
   * This will create both email and in-app notifications
   */
  async sendTransactionEvent(event: {
    userId: string;
    transactionId: string;
    transactionType: string;
    status: string;
    amount: string;
    currency: string;
    txHash?: string;
    reason?: string;
    userEmail?: string;
  }): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.debug(`Notification service disabled. Skipping transaction event: ${event.transactionId}`);
      return false;
    }

    this.logger.log(`📤 [Notification Client] Publishing transaction event to RabbitMQ queue: ${event.transactionId}`);
    this.logger.log(`📤 [Notification Client] User: ${event.userId}, Status: ${event.status}, Type: ${event.transactionType}`);

    try {
      const success = await this.rabbitMQPublisher.publishTransactionEvent({
        userId: event.userId,
        transactionId: event.transactionId,
        transactionType: event.transactionType,
        status: event.status,
        amount: event.amount,
        currency: event.currency,
        txHash: event.txHash,
        reason: event.reason,
        userEmail: event.userEmail,
        timestamp: new Date().toISOString(),
      });

      if (success) {
        this.logger.log(
          `✅ [Notification Client] Transaction event published to RabbitMQ queue 'transaction-events': ${event.transactionId}`,
        );
      } else {
        this.logger.warn(
          `⚠️  [Notification Client] Failed to publish transaction event to RabbitMQ: ${event.transactionId}`,
        );
      }
      return success;
    } catch (error: any) {
      this.logger.error(
        `❌ [Notification Client] Error publishing transaction event to RabbitMQ: ${error.message}`,
      );
      this.logger.error(`❌ [Notification Client] Error stack: ${error.stack}`);
      return false;
    }
  }

  /**
   * Create a custom notification via RabbitMQ
   */
  async createNotification(dto: CreateNotificationDto): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.debug(`Notification service disabled. Skipping notification creation`);
      return false;
    }

    try {
      const success = await this.rabbitMQPublisher.publishNotificationEvent({
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'other',
        priority: dto.priority || 'medium',
        metadata: dto.metadata || {},
      });

      if (success) {
        this.logger.log(`✅ Notification event published to RabbitMQ for user ${dto.userId}`);
      }
      return success;
    } catch (error: any) {
      this.logger.error(
        `❌ Error publishing notification event to RabbitMQ: ${error.message}`,
      );
      return false;
    }
  }
}
