import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import { EmailModule } from '../../modules/email/email.module';
import { NotificationModule } from '../../modules/notification/notification.module';
import * as amqp from 'amqplib';

@Module({
  imports: [ConfigModule, EmailModule, forwardRef(() => NotificationModule)],
  providers: [
    RabbitMQService,
    {
      provide: 'RABBITMQ_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const connection = await amqp.connect(
          configService.get('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672'),
        );
        return connection as unknown as amqp.Connection;
      },
      inject: [ConfigService],
    },
  ],
  exports: [RabbitMQService, 'RABBITMQ_CONNECTION'],
})
export class RabbitMQModule {}
