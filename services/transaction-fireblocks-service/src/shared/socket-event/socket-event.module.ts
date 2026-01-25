import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocketEventPublisher } from './socket-event.publisher';
import { RabbitMQPublisherModule } from '../rabbitmq/rabbitmq-publisher.module';

@Module({
  imports: [ConfigModule, RabbitMQPublisherModule],
  providers: [SocketEventPublisher],
  exports: [SocketEventPublisher],
})
export class SocketEventModule {}
