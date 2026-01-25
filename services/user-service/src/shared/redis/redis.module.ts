import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { createClient, RedisClientType } from 'redis';

@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const host = configService.get('REDIS_HOST', 'localhost');
        const port = configService.get('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        
        // Redis connection pool size (default: 10, configurable via env)
        // NOTE: Too many connections can cause resource exhaustion - start with 10
        const poolSize = parseInt(configService.get('REDIS_POOL_SIZE', '10'), 10);

        const baseClientConfig: any = {
          socket: {
            host,
            port: Number(port),
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('Redis connection failed after 10 retries');
                return new Error('Redis connection failed');
              }
              return Math.min(retries * 100, 3000);
            },
          },
        };

        // Add password if provided
        if (redisPassword && redisPassword.trim() !== '') {
          baseClientConfig.password = redisPassword;
        }

        // Create connection pool (array of clients)
        // Use any[] to avoid module extension type conflicts
        const clients: any[] = [];
        let connectedCount = 0;

        try {
          // Create multiple Redis clients for connection pooling
          for (let i = 0; i < poolSize; i++) {
            const client = createClient(baseClientConfig);

            client.on('error', (err) => {
              logger.error(`Redis Client ${i} Error: ${err.message}`);
            });

            client.on('connect', () => {
              logger.debug(`Redis Client ${i} Connecting...`);
            });

            client.on('ready', () => {
              connectedCount++;
              if (connectedCount === 1) {
                logger.log(`Redis Connection Pool: Creating ${poolSize} connections to ${host}:${port}`);
              }
              if (connectedCount === poolSize) {
                logger.log(`✅ Redis Connection Pool Ready: ${poolSize} connections established`);
              }
            });

            await client.connect();
            // Push client to pool (using any to avoid type conflicts with module extensions)
            clients.push(client);
          }

          logger.log(`✅ Redis Connection Pool Successfully Created: ${poolSize} connections`);
          
          // Return the pool as an object with a method to get a client
          return {
            pool: clients,
            poolSize,
            getClient: () => {
              // Round-robin selection for load distribution
              const index = Math.floor(Math.random() * poolSize);
              return clients[index] as RedisClientType;
            },
            getAllClients: () => clients as RedisClientType[],
            isReady: () => clients.every(client => (client as any).isReady !== false),
          };
        } catch (error) {
          logger.error(`Failed to create Redis connection pool: ${error.message}`);
          logger.warn('Continuing without Redis - some features may be limited');
          // Return null instead of throwing to allow app to continue
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
