import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from './entities/notification.entity';
import { RabbitMQService } from '../../shared/rabbitmq/rabbitmq.service';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationDto {
  status?: NotificationStatus;
  readAt?: Date;
}

export interface NotificationQuery {
  userId: string;
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

@Injectable()
export class NotificationInAppService {
  private readonly logger = new Logger(NotificationInAppService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => RabbitMQService))
    private rabbitMQService: RabbitMQService,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
    try {
      const notification = new this.notificationModel({
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || NotificationType.OTHER,
        priority: dto.priority || NotificationPriority.MEDIUM,
        metadata: dto.metadata || {},
        status: NotificationStatus.UNREAD,
      });

      const saved = await notification.save();
      this.logger.log(`✅ Notification created for user ${dto.userId}: ${saved._id}`);

      // Publish to socket service via RabbitMQ AFTER DB save
      try {
        const unreadCount = await this.getUnreadCount(dto.userId);
        await this.rabbitMQService.publishToSocketService({
          userId: dto.userId,
          notification: {
            _id: saved._id.toString(),
            userId: saved.userId,
            title: saved.title,
            message: saved.message,
            type: saved.type,
            status: saved.status,
            priority: saved.priority,
            metadata: saved.metadata,
            readAt: saved.readAt ? saved.readAt.toISOString() : null,
            createdAt: saved.createdAt.toISOString(),
            updatedAt: saved.updatedAt.toISOString(),
          },
          unreadCount,
          eventType: 'NOTIFICATION_CREATED',
        });
      } catch (error) {
        // Don't fail notification creation if RabbitMQ publish fails
        this.logger.warn(`⚠️  Failed to publish notification event to RabbitMQ: ${error.message}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(`❌ Error creating notification:`, error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with filters
   */
  async getNotifications(query: NotificationQuery): Promise<{
    notifications: NotificationDocument[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const { userId, status, type, priority, limit = 50, offset = 0 } = query;

      // Build filter
      const filter: any = { userId };
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;

      // Get notifications
      const notifications = await this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .exec();

      // Get total count
      const total = await this.notificationModel.countDocuments(filter);

      // Get unread count
      const unreadCount = await this.notificationModel.countDocuments({
        userId,
        status: NotificationStatus.UNREAD,
      });

      return {
        notifications,
        total,
        unreadCount,
      };
    } catch (error) {
      this.logger.error(`❌ Error fetching notifications:`, error);
      throw error;
    }
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    try {
      return await this.notificationModel
        .findOne({ _id: notificationId, userId })
        .exec();
    } catch (error) {
      this.logger.error(`❌ Error fetching notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    try {
      const notification = await this.notificationModel.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      ).exec();

      if (notification) {
        this.logger.log(`✅ Notification ${notificationId} marked as read`);
        
        // Publish to socket service via RabbitMQ AFTER DB update
        try {
          const unreadCount = await this.getUnreadCount(userId);
          await this.rabbitMQService.publishToSocketService({
            userId,
            notification: {
              _id: notification._id.toString(),
              userId: notification.userId,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              status: notification.status,
              priority: notification.priority,
              metadata: notification.metadata,
              readAt: notification.readAt ? notification.readAt.toISOString() : null,
              createdAt: notification.createdAt.toISOString(),
              updatedAt: notification.updatedAt.toISOString(),
            },
            unreadCount,
            eventType: 'NOTIFICATION_UPDATED',
          });
        } catch (error) {
          this.logger.warn(`⚠️  Failed to publish notification event to RabbitMQ: ${error.message}`);
        }
      }
      return notification;
    } catch (error) {
      this.logger.error(`❌ Error marking notification as read:`, error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.notificationModel.updateMany(
        { userId, status: NotificationStatus.UNREAD },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
          updatedAt: new Date(),
        },
      ).exec();

      this.logger.log(`✅ Marked ${result.modifiedCount} notifications as read for user ${userId}`);
      
      // Publish to socket service via RabbitMQ AFTER DB update
      if (result.modifiedCount > 0) {
        try {
          const unreadCount = await this.getUnreadCount(userId);
          await this.rabbitMQService.publishToSocketService({
            userId,
            notification: null, // No specific notification for bulk update
            unreadCount,
            eventType: 'NOTIFICATION_UPDATED',
          });
        } catch (error) {
          this.logger.warn(`⚠️  Failed to publish notification event to RabbitMQ: ${error.message}`);
        }
      }
      
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`❌ Error marking all notifications as read:`, error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationModel.deleteOne({
        _id: notificationId,
        userId,
      }).exec();

      if (result.deletedCount > 0) {
        this.logger.log(`✅ Notification ${notificationId} deleted`);
        
        // Publish to socket service via RabbitMQ AFTER DB delete
        try {
          const unreadCount = await this.getUnreadCount(userId);
          await this.rabbitMQService.publishToSocketService({
            userId,
            notification: {
              _id: notificationId,
              userId,
              title: '',
              message: '',
              type: NotificationType.OTHER,
              status: NotificationStatus.UNREAD,
              priority: NotificationPriority.MEDIUM,
              metadata: {},
              readAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            unreadCount,
            eventType: 'NOTIFICATION_DELETED',
          });
        } catch (error) {
          this.logger.warn(`⚠️  Failed to publish notification event to RabbitMQ: ${error.message}`);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`❌ Error deleting notification:`, error);
      throw error;
    }
  }

  /**
   * Archive a notification
   */
  async archiveNotification(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    try {
      const notification = await this.notificationModel.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          status: NotificationStatus.ARCHIVED,
          updatedAt: new Date(),
        },
        { new: true },
      ).exec();

      if (notification) {
        this.logger.log(`✅ Notification ${notificationId} archived`);
      }
      return notification;
    } catch (error) {
      this.logger.error(`❌ Error archiving notification:`, error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationModel.countDocuments({
        userId,
        status: NotificationStatus.UNREAD,
      });
    } catch (error) {
      this.logger.error(`❌ Error getting unread count:`, error);
      return 0;
    }
  }

  /**
   * Create transaction notification
   */
  async createTransactionNotification(
    userId: string,
    transactionData: {
      transactionId: string;
      transactionType: string;
      transactionStatus: string;
      amount?: string;
      currency?: string;
      txHash?: string;
      reason?: string;
    },
  ): Promise<NotificationDocument> {
    const { transactionId, transactionType, transactionStatus, amount, currency, txHash, reason } =
      transactionData;

    // Determine title and message based on status
    let title = '';
    let message = '';
    let priority = NotificationPriority.MEDIUM;

    switch (transactionStatus.toLowerCase()) {
      case 'pending':
        title = `Transaction ${transactionType} Pending`;
        message = `Your ${transactionType} transaction is pending confirmation.`;
        priority = NotificationPriority.MEDIUM;
        break;
      case 'confirmed':
      case 'completed':
        title = `Transaction ${transactionType} Confirmed`;
        message = `Your ${transactionType} transaction has been confirmed successfully.`;
        priority = NotificationPriority.LOW;
        break;
      case 'rejected':
      case 'failed':
        title = `Transaction ${transactionType} Rejected`;
        message = reason || `Your ${transactionType} transaction has been rejected.`;
        priority = NotificationPriority.HIGH;
        break;
      default:
        title = `Transaction ${transactionType} Update`;
        message = `Your ${transactionType} transaction status has been updated.`;
    }

    if (amount && currency) {
      message += ` Amount: ${amount} ${currency}`;
    }

    return this.createNotification({
      userId,
      title,
      message,
      type: NotificationType.TRANSACTION,
      priority,
      metadata: {
        transactionId,
        transactionType,
        transactionStatus,
        amount,
        currency,
        txHash,
        reason,
        actionUrl: `/transactions/${transactionId}`,
      },
    });
  }
}
