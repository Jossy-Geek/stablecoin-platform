import { Injectable, Inject, OnModuleInit, Logger, forwardRef } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EmailService } from '../../modules/email/email.service';
import { NotificationInAppService } from '../../modules/notification/notification-in-app.service';
import { TransactionEmailData } from '../../modules/email/templates/email-templates';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private channel: amqp.Channel | null = null;

  constructor(
    @Inject('RABBITMQ_CONNECTION') private connection: amqp.Connection,
    private emailService: EmailService,
    @Inject(forwardRef(() => NotificationInAppService))
    private notificationInAppService: NotificationInAppService,
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
    await this.channel.assertQueue('email-notifications', { durable: true });
    await this.channel.assertQueue('transaction-events', { durable: true });
    await this.channel.assertQueue('notification-events', { durable: true });
    await this.channel.assertQueue('socket-notification-events', { durable: true }); // Queue to send to socket service
    
    // Consume generic email notifications
    this.channel.consume('email-notifications', async (msg) => {
      if (msg && this.channel) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.handleGenericEmail(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing email notification:', error);
          // Reject message and don't requeue if it fails
          this.channel.nack(msg, false, false);
        }
      }
    });

    // Consume transaction events
    this.channel.consume('transaction-events', async (msg) => {
      if (msg && this.channel) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.handleTransactionEvent(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing transaction event:', error);
          // Reject message and don't requeue if it fails
          this.channel.nack(msg, false, false);
        }
      }
    });

    // Consume notification events (custom notifications)
    this.channel.consume('notification-events', async (msg) => {
      if (msg && this.channel) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.handleNotificationEvent(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Error processing notification event:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });

    this.logger.log('✅ RabbitMQ consumers started for email-notifications, transaction-events, and notification-events');
  }

  /**
   * Handle custom notification events
   */
  private async handleNotificationEvent(event: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      // Create in-app notification (this will automatically emit socket event)
      await this.notificationInAppService.createNotification({
        userId: event.userId,
        title: event.title,
        message: event.message,
        type: event.type as any,
        priority: event.priority as any,
        metadata: event.metadata || {},
      });
      this.logger.log(`✅ Custom notification created for user ${event.userId}`);
    } catch (error) {
      this.logger.error(`❌ Error creating custom notification:`, error);
      // Don't throw - fail gracefully
    }
  }

  /**
   * Publish notification event to socket service via RabbitMQ
   */
  async publishToSocketService(event: {
    userId: string;
    notification: any | null;
    unreadCount: number;
    eventType: 'NOTIFICATION_CREATED' | 'NOTIFICATION_UPDATED' | 'NOTIFICATION_DELETED';
  }): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn('⚠️  RabbitMQ channel not available. Cannot publish to socket service.');
      return false;
    }

    try {
      const queueName = 'socket-notification-events';
      const message = JSON.stringify(event);
      this.channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
      this.logger.debug(`✅ Published notification event to socket service queue: ${event.eventType}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Error publishing to socket service: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle generic email notifications
   */
  private async handleGenericEmail(data: { to: string; subject: string; html?: string; template?: string; data?: any }) {
    try {
      let htmlContent = data.html;
      
      // If template is provided, generate HTML from template
      if (!htmlContent && data.template) {
        htmlContent = this.generateEmailHtml(data.template, data.data || {});
      }
      
      if (!htmlContent) {
        htmlContent = '<p>No content provided</p>';
      }

      const success = await this.emailService.sendEmail(data.to, data.subject, htmlContent);
      if (success) {
        this.logger.log(`✅ Email sent successfully to ${data.to}: ${data.subject}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending email to ${data.to}:`, error);
      // Don't throw - fail gracefully
    }
  }

  /**
   * Handle transaction events and send appropriate emails
   */
  private async handleTransactionEvent(event: any) {
    try {
      // Extract transaction data from event
      const transactionData: TransactionEmailData = {
        transactionId: event.transactionId || event.id || 'N/A',
        userId: event.userId || 'N/A',
        amount: event.amount || '0',
        currency: event.currency || 'USD',
        transactionType: event.transactionType || event.type || 'deposit',
        status: event.status || 'pending',
        txHash: event.txHash || event.transactionHash,
        reason: event.reason || event.rejectionReason,
        timestamp: event.timestamp || event.createdAt || new Date().toISOString(),
      };

      // Get user email from event (should be included by the publisher)
      const userEmail = event.userEmail || event.email;
      
      if (!userEmail) {
        this.logger.warn(`⚠️  Transaction event missing userEmail. Event: ${JSON.stringify(event)}`);
        return;
      }

      // Send email based on transaction status
      let emailSuccess = false;
      switch (transactionData.status.toLowerCase()) {
        case 'pending':
          emailSuccess = await this.emailService.sendTransactionPendingEmail(transactionData, userEmail);
          break;
        case 'confirmed':
        case 'approved':
          emailSuccess = await this.emailService.sendTransactionConfirmedEmail(transactionData, userEmail);
          break;
        case 'rejected':
        case 'failed':
          emailSuccess = await this.emailService.sendTransactionRejectedEmail(transactionData, userEmail);
          break;
        default:
          this.logger.warn(`⚠️  Unknown transaction status: ${transactionData.status}`);
      }

      if (emailSuccess) {
        this.logger.log(`✅ Transaction ${transactionData.status} email sent to ${userEmail} for transaction ${transactionData.transactionId}`);
      }

      // Create in-app notification (this will automatically emit socket event)
      try {
        await this.notificationInAppService.createTransactionNotification(
          transactionData.userId,
          {
            transactionId: transactionData.transactionId,
            transactionType: transactionData.transactionType,
            transactionStatus: transactionData.status,
            amount: transactionData.amount,
            currency: transactionData.currency,
            txHash: transactionData.txHash,
            reason: transactionData.reason,
          },
        );
        this.logger.log(`✅ In-app notification created for transaction ${transactionData.transactionId}`);
        // Socket event is automatically emitted by createTransactionNotification -> createNotification
      } catch (error) {
        this.logger.error(`❌ Error creating in-app notification:`, error);
        // Don't throw - fail gracefully
      }
    } catch (error) {
      this.logger.error(`❌ Error handling transaction event:`, error);
      // Don't throw - fail gracefully
    }
  }

  /**
   * Generate HTML for generic email templates (fallback)
   */
  private generateEmailHtml(template: string, data: any): string {
    let html = '';
    
    switch (template) {
      case 'transaction-confirmed':
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Transaction Confirmed</h2>
            <p>Your transaction has been confirmed.</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</p>
            <p><strong>Amount:</strong> ${data.amount || 'N/A'}</p>
            <p><strong>Type:</strong> ${data.transactionType || 'N/A'}</p>
          </div>
        `;
        break;
      case 'transaction-pending':
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Transaction Pending</h2>
            <p>Your transaction is pending admin approval.</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</p>
            <p><strong>Amount:</strong> ${data.amount || 'N/A'}</p>
            <p><strong>Type:</strong> ${data.transactionType || 'N/A'}</p>
          </div>
        `;
        break;
      case 'transaction-rejected':
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Transaction Rejected</h2>
            <p>Your transaction has been rejected.</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</p>
            <p><strong>Amount:</strong> ${data.amount || 'N/A'}</p>
            <p><strong>Type:</strong> ${data.transactionType || 'N/A'}</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
        `;
        break;
      default:
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Notification</h2>
            <p>${JSON.stringify(data, null, 2)}</p>
          </div>
        `;
    }
    
    return html;
  }
}
