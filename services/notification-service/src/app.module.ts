import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './modules/notification/notification.module';
import { RabbitMQModule } from './shared/rabbitmq/rabbitmq.module';
import { DatabaseModule } from './shared/database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RabbitMQModule,
    NotificationModule,
    HealthModule,
  ],
})
export class AppModule {}
