import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQPublisherService } from './rabbitmq-publisher.service';
import * as amqp from 'amqplib';

@Module({
  imports: [ConfigModule],
  providers: [
    RabbitMQPublisherService,
    {
      provide: 'RABBITMQ_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        try {
          const rabbitmqUrl = configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
          console.log(`🔌 [RabbitMQ] Attempting to connect to: ${rabbitmqUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs
          const connection = await amqp.connect(rabbitmqUrl);
          console.log('✅ [RabbitMQ] Successfully connected to RabbitMQ');
          
          // Handle connection errors
          connection.on('error', (err) => {
            console.error('❌ [RabbitMQ] Connection error:', err.message);
          });
          
          connection.on('close', () => {
            console.warn('⚠️  [RabbitMQ] Connection closed');
          });
          
          return connection as unknown as amqp.Connection;
        } catch (error: any) {
          console.error(`❌ [RabbitMQ] Failed to connect to RabbitMQ: ${error.message}`);
          console.warn('⚠️  [RabbitMQ] Service will continue without RabbitMQ. Event publishing will be skipped.');
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [RabbitMQPublisherService],
})
export class RabbitMQPublisherModule {}
