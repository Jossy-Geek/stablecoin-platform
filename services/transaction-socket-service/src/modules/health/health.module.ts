import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { RabbitMQModule } from '../../shared/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    RabbitMQModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
