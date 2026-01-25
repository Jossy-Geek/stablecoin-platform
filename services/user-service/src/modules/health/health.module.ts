import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { KafkaModule } from '../../shared/kafka/kafka.module';
import { RabbitMQModule } from '../../shared/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    KafkaModule,
    RabbitMQModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
