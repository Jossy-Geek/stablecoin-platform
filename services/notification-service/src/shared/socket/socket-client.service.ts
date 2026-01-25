import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface NotificationSocketEvent {
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
  } | null; // null for bulk updates
  unreadCount: number;
  eventType: 'NOTIFICATION_CREATED' | 'NOTIFICATION_UPDATED' | 'NOTIFICATION_DELETED';
}

@Injectable()
export class SocketClientService implements OnModuleInit {
  private readonly logger = new Logger(SocketClientService.name);

  async onModuleInit() {
    this.logger.log(`✅ Socket client service initialized (using RabbitMQ)`);
  }

  /**
   * Emit notification event to socket service via RabbitMQ
   * This will be forwarded to the user's connected socket
   * 
   * @deprecated This method is no longer used. Use RabbitMQService.publishToSocketService instead.
   */
  async emitNotificationEvent(event: NotificationSocketEvent): Promise<boolean> {
    // This method is now handled by RabbitMQ publisher in notification-service
    // The notification-in-app.service will call rabbitmqService.publishToSocketService
    // This method is kept for backward compatibility but will be unused
    this.logger.debug(`Notification event will be published via RabbitMQ: ${event.eventType}`);
    return true;
  }
}
