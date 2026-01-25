import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import {
  TransactionEmailData,
  generateTransactionPendingEmail,
  generateTransactionConfirmedEmail,
  generateTransactionRejectedEmail,
  getTransactionEmailSubject,
} from './templates/email-templates';
import { Email, EmailDocument } from './entities/email.entity';
import { EmailProviderFactory, EmailProvider } from './email-provider.factory';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isEmailEnabled: boolean = false;
  private emailProvider: EmailProvider | null = null;

  constructor(
    private configService: ConfigService,
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    private emailProviderFactory: EmailProviderFactory,
  ) {}

  async onModuleInit() {
    const provider = this.emailProviderFactory.getProvider();
    this.logger.log(`📧 Initializing email provider: ${provider.toUpperCase()}`);

    const { transporter, provider: configuredProvider } = this.emailProviderFactory.createTransporter();
    
    if (!transporter) {
      this.logger.warn('⚠️  Email transporter could not be created. Email sending will be disabled.');
      this.logDiagnostics(provider);
      this.isEmailEnabled = false;
      return;
    }

    this.transporter = transporter;
    this.emailProvider = configuredProvider;

    try {
      // Verify connection
      await this.transporter.verify();
      this.isEmailEnabled = true;
      this.logger.log(`✅ ${provider.toUpperCase()} connection verified successfully`);
    } catch (error) {
      this.logger.error(`❌ ${provider.toUpperCase()} connection verification failed:`, error);
      this.logger.warn('⚠️  Email sending will be disabled until email provider is properly configured.');
      this.isEmailEnabled = false;
    }
  }

  /**
   * Log diagnostic information for email provider configuration
   */
  private logDiagnostics(provider: EmailProvider): void {
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.warn(`📋 ${provider.toUpperCase()} Configuration Status:`);

    switch (provider) {
      case EmailProvider.SENDGRID:
        const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
        this.logger.warn(`   SENDGRID_API_KEY: ${sendGridApiKey ? '✅ Set' : '❌ Missing'}`);
        this.logger.warn('💡 SendGrid Setup:');
        this.logger.warn('   EMAIL_PROVIDER=sendgrid');
        this.logger.warn('   SENDGRID_API_KEY=your-sendgrid-api-key');
        this.logger.warn('   SENDGRID_USER=apikey (default)');
        break;
      case EmailProvider.MAILGUN:
        const mailgunUser = this.configService.get<string>('MAILGUN_USER');
        const mailgunPassword = this.configService.get<string>('MAILGUN_PASSWORD');
        this.logger.warn(`   MAILGUN_USER: ${mailgunUser ? '✅ Set' : '❌ Missing'}`);
        this.logger.warn(`   MAILGUN_PASSWORD: ${mailgunPassword ? '✅ Set' : '❌ Missing'}`);
        this.logger.warn('💡 Mailgun Setup:');
        this.logger.warn('   EMAIL_PROVIDER=mailgun');
        this.logger.warn('   MAILGUN_USER=your-mailgun-username');
        this.logger.warn('   MAILGUN_PASSWORD=your-mailgun-password');
        this.logger.warn('   MAILGUN_HOST=smtp.mailgun.org (default)');
        this.logger.warn('   MAILGUN_PORT=587 (default)');
        break;
    }
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Save email record to MongoDB
   */
  private async saveEmailRecord(
    userId: string,
    templateName: string,
    templateVariables: Record<string, any>,
    isSent: boolean,
    retry: number = 0,
  ): Promise<EmailDocument> {
    try {
      const emailRecord = new this.emailModel({
        userId,
        templateName,
        templateVariables,
        emailProvider: this.emailProvider || 'sendgrid',
        isSent,
        retry,
      });
      return await emailRecord.save();
    } catch (error) {
      this.logger.error('❌ Error saving email record to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Update email record after sending
   */
  private async updateEmailRecord(
    emailId: string,
    isSent: boolean,
    retry: number,
  ): Promise<void> {
    try {
      await this.emailModel.findByIdAndUpdate(emailId, {
        isSent,
        retry,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`❌ Error updating email record ${emailId}:`, error);
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    userId?: string,
    templateName?: string,
    templateVariables?: Record<string, any>,
  ): Promise<boolean> {
    let emailRecord: EmailDocument | null = null;

    // Save email record before sending
    if (userId && templateName) {
      try {
        emailRecord = await this.saveEmailRecord(
          userId,
          templateName,
          templateVariables || {},
          false,
          0,
        );
      } catch (error) {
        this.logger.warn('⚠️  Failed to save email record, continuing with send attempt');
      }
    }

    if (!this.isEmailEnabled || !this.transporter) {
      this.logger.warn(`⚠️  Email sending is disabled. Skipping email to ${to}`);
      // Update record as failed if it exists
      if (emailRecord) {
        await this.updateEmailRecord(emailRecord._id.toString(), false, 0);
      }
      return false;
    }

    let retryCount = emailRecord?.retry || 0;
    const maxRetries = 3;

    try {
      // Get FROM address based on provider
      let emailFrom = this.configService.get<string>('EMAIL_FROM');
      
      if (!emailFrom) {
        // Provider-specific defaults
        if (this.emailProvider === EmailProvider.SENDGRID) {
          emailFrom = 'noreply@stablecoin.com';
        } else if (this.emailProvider === EmailProvider.MAILGUN) {
          emailFrom = 'noreply@stablecoin.com';
        } else {
          emailFrom = 'noreply@stablecoin.com';
        }
      }
      
      const info = await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
      });

      this.logger.log(`📧 Email sent successfully to ${to} (Message ID: ${info.messageId})`);
      
      // Update record as sent
      if (emailRecord) {
        await this.updateEmailRecord(emailRecord._id.toString(), true, retryCount);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`❌ Error sending email to ${to}:`, error);
      
      // Update record with retry count
      if (emailRecord) {
        retryCount++;
        await this.updateEmailRecord(
          emailRecord._id.toString(),
          false,
          retryCount < maxRetries ? retryCount : maxRetries,
        );
      }
      
      // Don't throw - fail gracefully
      return false;
    }
  }

  /**
   * Send transaction pending email
   */
  async sendTransactionPendingEmail(data: TransactionEmailData, userEmail: string): Promise<boolean> {
    if (!this.isEmailEnabled) {
      this.logger.warn(`⚠️  Email sending is disabled. Skipping transaction pending email to ${userEmail}`);
      return false;
    }

    try {
      const subject = getTransactionEmailSubject(data.transactionType, 'pending');
      const html = generateTransactionPendingEmail(data);
      return await this.sendEmail(
        userEmail,
        subject,
        html,
        data.userId,
        'transaction-pending',
        data,
      );
    } catch (error) {
      this.logger.error(`❌ Error sending transaction pending email:`, error);
      return false;
    }
  }

  /**
   * Send transaction confirmed email
   */
  async sendTransactionConfirmedEmail(data: TransactionEmailData, userEmail: string): Promise<boolean> {
    if (!this.isEmailEnabled) {
      this.logger.warn(`⚠️  Email sending is disabled. Skipping transaction confirmed email to ${userEmail}`);
      return false;
    }

    try {
      const subject = getTransactionEmailSubject(data.transactionType, 'confirmed');
      const html = generateTransactionConfirmedEmail(data);
      return await this.sendEmail(
        userEmail,
        subject,
        html,
        data.userId,
        'transaction-confirmed',
        data,
      );
    } catch (error) {
      this.logger.error(`❌ Error sending transaction confirmed email:`, error);
      return false;
    }
  }

  /**
   * Send transaction rejected email
   */
  async sendTransactionRejectedEmail(data: TransactionEmailData, userEmail: string): Promise<boolean> {
    if (!this.isEmailEnabled) {
      this.logger.warn(`⚠️  Email sending is disabled. Skipping transaction rejected email to ${userEmail}`);
      return false;
    }

    try {
      const subject = getTransactionEmailSubject(data.transactionType, 'rejected');
      const html = generateTransactionRejectedEmail(data);
      return await this.sendEmail(
        userEmail,
        subject,
        html,
        data.userId,
        'transaction-rejected',
        data,
      );
    } catch (error) {
      this.logger.error(`❌ Error sending transaction rejected email:`, error);
      return false;
    }
  }

  /**
   * Check if email service is enabled and ready
   */
  isReady(): boolean {
    return this.isEmailEnabled && this.transporter !== null;
  }
}
