import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { createClient, RedisClientType } from 'redis';

@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService): Promise<RedisClientType | null> => {
        const logger = new Logger('RedisModule');
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);

        try {
          logger.log(`🔌 Attempting to connect to Redis at ${redisHost}:${redisPort}...`);
          
          const redisPassword = configService.get<string>('REDIS_PASSWORD');
          const clientConfig: any = {
            socket: {
              host: redisHost,
              port: redisPort,
              connectTimeout: 5000, // 5 seconds timeout
              reconnectStrategy: false, // Don't auto-reconnect on initial connection failure
            },
          };

          // Add password if provided
          if (redisPassword && redisPassword.trim() !== '') {
            clientConfig.password = redisPassword;
          }
          
          const client = createClient(clientConfig);

          // Set up error handlers
          client.on('error', (err) => {
            logger.warn(`⚠️  Redis connection error: ${err.message}`);
          });

          // Attempt connection with timeout
          await Promise.race([
            client.connect(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Redis connection timeout')), 5000),
            ),
          ]);

          logger.log('✅ Redis connected successfully');
          // Type assertion to handle Redis modules type incompatibility
          return client as unknown as RedisClientType;
        } catch (error) {
          logger.warn(`⚠️  Failed to connect to Redis: ${error.message}`);
          logger.warn('⚠️  Service will continue without Redis. Redis features will not be available.');
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
