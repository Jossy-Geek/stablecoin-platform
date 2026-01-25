import { Module } from '@nestjs/common';
import { NotificationClientService } from './notification-client.service';
import { RabbitMQPublisherModule } from '../rabbitmq/rabbitmq-publisher.module';

@Module({
  imports: [RabbitMQPublisherModule],
  providers: [NotificationClientService],
  exports: [NotificationClientService],
})
export class NotificationClientModule {}
