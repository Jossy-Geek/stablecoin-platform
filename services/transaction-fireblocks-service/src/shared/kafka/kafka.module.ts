import { Module, forwardRef, Logger } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaEventsController } from './kafka-events.controller';
import { UserSyncModule } from '../../modules/user-sync/user-sync.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const logger = new Logger('KafkaModule');
          const kafkaBroker = configService.get('KAFKA_BROKER', 'localhost:9092');
          
          logger.log(`🔌 Configuring Kafka connection to ${kafkaBroker}...`);
          
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: configService.get('KAFKA_CLIENT_ID', 'transaction-fireblocks-service'),
                brokers: [kafkaBroker],
                // Add connection timeout
                connectionTimeout: 10000, // 10 seconds
                requestTimeout: 30000, // 30 seconds
              },
              consumer: {
                groupId: configService.get('KAFKA_GROUP_ID', 'transaction-fireblocks-service-group'),
                // Don't fail on connection errors
                allowAutoTopicCreation: false,
              },
              subscribe: {
                fromBeginning: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
    forwardRef(() => UserSyncModule),
  ],
  controllers: [KafkaEventsController],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
