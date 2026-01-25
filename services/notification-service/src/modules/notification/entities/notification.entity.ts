import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  TRANSACTION = 'transaction',
  SYSTEM = 'system',
  SECURITY = 'security',
  ACCOUNT = 'account',
  WALLET = 'wallet',
  OTHER = 'other',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({
  collection: 'notifications',
  timestamps: true,
})
export class Notification {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({
    type: String,
    enum: NotificationType,
    default: NotificationType.OTHER,
    index: true,
  })
  type: NotificationType;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
    index: true,
  })
  status: NotificationStatus;

  @Prop({
    type: String,
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
    index: true,
  })
  priority: NotificationPriority;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: null })
  readAt: Date | null;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create indexes for better query performance
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, createdAt: -1 });
NotificationSchema.index({ 'metadata.transactionId': 1 });
