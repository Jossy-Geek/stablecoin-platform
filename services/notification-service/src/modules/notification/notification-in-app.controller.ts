import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { NotificationInAppService } from './notification-in-app.service';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from './entities/notification.entity';

// DTOs
interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

@Controller('notifications')
export class NotificationInAppController {
  private readonly logger = new Logger(NotificationInAppController.name);

  constructor(private readonly notificationService: NotificationInAppService) {}

  @Get()
  async getNotifications(
    @Query('userId') userId: string,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    const result = await this.notificationService.getNotifications({
      userId,
      status,
      type,
      priority,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      offset: offset ? parseInt(offset.toString(), 10) : undefined,
    });

    return {
      success: true,
      data: result.notifications,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit.toString(), 10) : 50,
        offset: offset ? parseInt(offset.toString(), 10) : 0,
      },
      unreadCount: result.unreadCount,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    const count = await this.notificationService.getUnreadCount(userId);
    return {
      success: true,
      unreadCount: count,
    };
  }

  @Get(':id')
  async getNotification(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    const notification = await this.notificationService.getNotificationById(id, userId);
    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      data: notification,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(@Body() dto: CreateNotificationDto) {
    try {
      const notification = await this.notificationService.createNotification(dto);
      return {
        success: true,
        data: notification,
        message: 'Notification created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating notification:', error);
      return {
        success: false,
        message: error.message || 'Failed to create notification',
      };
    }
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    const notification = await this.notificationService.markAsRead(id, userId);
    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      data: notification,
      message: 'Notification marked as read',
    };
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Query('userId') userId: string) {
    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    const count = await this.notificationService.markAllAsRead(userId);
    return {
      success: true,
      message: `Marked ${count} notifications as read`,
      count,
    };
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archiveNotification(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    const notification = await this.notificationService.archiveNotification(id, userId);
    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      data: notification,
      message: 'Notification archived',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    const deleted = await this.notificationService.deleteNotification(id, userId);
    if (!deleted) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

}
