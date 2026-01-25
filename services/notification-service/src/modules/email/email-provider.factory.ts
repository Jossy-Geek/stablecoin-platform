import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export enum EmailProvider {
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
}

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);

  constructor(private configService: ConfigService) {}

  /**
   * Create email transporter based on EMAIL_PROVIDER
   */
  createTransporter(): { transporter: Transporter | null; provider: EmailProvider | null } {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'sendgrid').toLowerCase() as EmailProvider;

    switch (provider) {
      case EmailProvider.SENDGRID:
        return this.createSendGridTransporter();
      case EmailProvider.MAILGUN:
        return this.createMailgunTransporter();
      default:
        this.logger.warn(`⚠️  Unknown email provider: ${provider}. Falling back to SendGrid.`);
        return this.createSendGridTransporter();
    }
  }

  /**
   * Create SendGrid SMTP transporter
   */
  private createSendGridTransporter(): { transporter: Transporter | null; provider: EmailProvider } {
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    const sendGridUser = this.configService.get<string>('SENDGRID_USER', 'apikey');

    if (!sendGridApiKey) {
      this.logger.warn('⚠️  SendGrid API key not configured');
      return { transporter: null, provider: EmailProvider.SENDGRID };
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: sendGridUser,
        pass: sendGridApiKey,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    this.logger.log('✅ SendGrid transporter created');
    return { transporter, provider: EmailProvider.SENDGRID };
  }

  /**
   * Create Mailgun SMTP transporter
   */
  private createMailgunTransporter(): { transporter: Transporter | null; provider: EmailProvider } {
    const mailgunUser = this.configService.get<string>('MAILGUN_USER');
    const mailgunPassword = this.configService.get<string>('MAILGUN_PASSWORD');
    const mailgunHost = this.configService.get<string>('MAILGUN_HOST', 'smtp.mailgun.org');
    const mailgunPort = this.configService.get<number>('MAILGUN_PORT', 587);

    if (!mailgunUser || !mailgunPassword) {
      this.logger.warn('⚠️  Mailgun credentials not configured');
      return { transporter: null, provider: EmailProvider.MAILGUN };
    }

    const transporter = nodemailer.createTransport({
      host: mailgunHost,
      port: mailgunPort,
      secure: mailgunPort === 465,
      auth: {
        user: mailgunUser,
        pass: mailgunPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    this.logger.log('✅ Mailgun transporter created');
    return { transporter, provider: EmailProvider.MAILGUN };
  }

  /**
   * Get the configured email provider
   */
  getProvider(): EmailProvider {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'sendgrid').toLowerCase() as EmailProvider;
    return provider;
  }
}
