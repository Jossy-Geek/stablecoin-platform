import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import * as amqp from 'amqplib';

@Module({
  imports: [ConfigModule],
  providers: [
    RabbitMQService,
    {
      provide: 'RABBITMQ_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const serviceName = configService.get('SERVICE_NAME', 'user-service');
        const logger = new Logger(`RabbitMQModule [${serviceName}]`);
        const useRabbitMQ = configService.get('USE_RABBITMQ', 'true') === 'true';

        if (!useRabbitMQ) {
          logger.warn(`[${serviceName}] RabbitMQ is disabled via USE_RABBITMQ=false`);
          return null;
        }

        const rabbitmqUrl = configService.get('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672');
        const maskedUrl = rabbitmqUrl.replace(/:[^:@]+@/, ':****@');
        
        try {
          logger.log(`[${serviceName}] Connecting to RabbitMQ at ${maskedUrl}`);
          const connection = await amqp.connect(rabbitmqUrl);
          
          connection.on('error', (err) => {
            logger.error(`[${serviceName}] RabbitMQ Connection Error: ${err.message}`);
          });

          connection.on('close', () => {
            logger.warn(`[${serviceName}] RabbitMQ Connection Closed`);
          });

          logger.log(`[${serviceName}] ✅ RabbitMQ Client Successfully Connected`);
          return connection;
        } catch (error: any) {
          // Extract detailed error information
          const errorCode = error.code || 'UNKNOWN';
          const errorMessage = error.message || 'Unknown error';
          
          // Check for specific error types
          if (errorMessage.includes('ACCESS_REFUSED') || errorMessage.includes('403')) {
            logger.error(`[${serviceName}] ❌ RabbitMQ Authentication Failed (Handshake Error)`);
            logger.error(`[${serviceName}] Error Code: ${errorCode}`);
            logger.error(`[${serviceName}] Error Message: ${errorMessage}`);
            logger.error(`[${serviceName}] Connection URL: ${maskedUrl}`);
            logger.error(`[${serviceName}] Possible causes:`);
            logger.error(`[${serviceName}]   1. Incorrect username/password in RABBITMQ_URL`);
            logger.error(`[${serviceName}]   2. RabbitMQ user doesn't have permission to connect`);
            logger.error(`[${serviceName}]   3. RabbitMQ server authentication mechanism mismatch`);
            logger.error(`[${serviceName}] Solution: Check RABBITMQ_URL format: amqp://username:password@host:port`);
            logger.error(`[${serviceName}] Example: amqp://admin:admin123@localhost:5672`);
          } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
            logger.error(`[${serviceName}] ❌ RabbitMQ Connection Refused`);
            logger.error(`[${serviceName}] Error Code: ${errorCode}`);
            logger.error(`[${serviceName}] Error Message: ${errorMessage}`);
            logger.error(`[${serviceName}] Connection URL: ${maskedUrl}`);
            logger.error(`[${serviceName}] Possible causes:`);
            logger.error(`[${serviceName}]   1. RabbitMQ server is not running`);
            logger.error(`[${serviceName}]   2. Incorrect host/port in RABBITMQ_URL`);
            logger.error(`[${serviceName}]   3. Firewall blocking connection`);
            logger.error(`[${serviceName}] Solution: Start RabbitMQ or check connection settings`);
          } else {
            logger.error(`[${serviceName}] ❌ RabbitMQ Connection Failed`);
            logger.error(`[${serviceName}] Error Code: ${errorCode}`);
            logger.error(`[${serviceName}] Error Message: ${errorMessage}`);
            logger.error(`[${serviceName}] Connection URL: ${maskedUrl}`);
          }
          
          logger.warn(`[${serviceName}] ⚠️  Continuing without RabbitMQ - notifications may not work`);
          logger.warn(`[${serviceName}] To disable RabbitMQ, set USE_RABBITMQ=false in .env`);
          
          // Return null instead of throwing to allow app to continue
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
