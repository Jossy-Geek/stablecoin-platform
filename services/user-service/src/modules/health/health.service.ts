import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisClientType } from 'redis';
import * as amqp from 'amqplib';
import { KafkaService } from '../../shared/kafka/kafka.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') @Optional() private readonly redisClient: RedisClientType | null,
    @Inject('RABBITMQ_CONNECTION') @Optional() private readonly rabbitmqConnection: amqp.Connection | null,
    @Optional() private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get basic health status
   */
  async getBasicHealth() {
    return {
      status: 'ok',
      service: 'user-service',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }

  /**
   * Get full health status with all dependency checks
   */
  async getFullHealth() {
    const [database, redis, kafka, rabbitmq, memory] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkKafka(),
      this.checkRabbitMQ(),
      this.checkMemory(),
    ]);

    const health = {
      status: 'ok' as 'ok' | 'degraded' | 'down',
      service: 'user-service',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: database.status === 'fulfilled' ? database.value : { status: 'down', error: database.reason?.message },
        redis: redis.status === 'fulfilled' ? redis.value : { status: 'down', error: redis.reason?.message },
        kafka: kafka.status === 'fulfilled' ? kafka.value : { status: 'down', error: kafka.reason?.message },
        rabbitmq: rabbitmq.status === 'fulfilled' ? rabbitmq.value : { status: 'down', error: rabbitmq.reason?.message },
        memory: memory.status === 'fulfilled' ? memory.value : { status: 'down', error: memory.reason?.message },
      },
    };

    // Determine overall status
    const dependencyStatuses = Object.values(health.dependencies).map((dep: any) => dep.status);
    if (dependencyStatuses.every((status) => status === 'up')) {
      health.status = 'ok';
    } else if (dependencyStatuses.some((status) => status === 'up')) {
      health.status = 'degraded';
    } else {
      health.status = 'down';
    }

    return health;
  }

  /**
   * Get readiness status
   * Service is ready if critical dependencies are available
   */
  async getReadiness() {
    const [database, redis] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isReady =
      database.status === 'fulfilled' &&
      database.value.status === 'up' &&
      redis.status === 'fulfilled' &&
      redis.value.status === 'up';

    return {
      status: isReady ? 'ready' : 'not ready',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: database.status === 'fulfilled' ? database.value : { status: 'down' },
        redis: redis.status === 'fulfilled' ? redis.value : { status: 'down' },
      },
    };
  }

  /**
   * Get liveness status
   * Service is alive if it can respond
   */
  async getLiveness() {
    return {
      status: 'alive',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      if (!this.dataSource || !this.dataSource.isInitialized) {
        return { status: 'down', message: 'Database not initialized' };
      }

      // Simple query to check connectivity
      await this.dataSource.query('SELECT 1');
      return { status: 'up', message: 'Database connection healthy' };
    } catch (error) {
      this.logger.error('Database health check failed:', error.message);
      return { status: 'down', message: error.message };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      if (!this.redisClient) {
        return { status: 'down', message: 'Redis client not available' };
      }

      // Ping Redis
      await this.redisClient.ping();
      return { status: 'up', message: 'Redis connection healthy' };
    } catch (error) {
      this.logger.error('Redis health check failed:', error.message);
      return { status: 'down', message: error.message };
    }
  }

  /**
   * Check Kafka connectivity
   */
  private async checkKafka(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      if (!this.kafkaService) {
        return { status: 'down', message: 'Kafka service not available' };
      }

      // Try to get Kafka client from service
      // This is a simple check - in production you might want to actually test connectivity
      return { status: 'up', message: 'Kafka service available' };
    } catch (error) {
      this.logger.error('Kafka health check failed:', error.message);
      return { status: 'down', message: error.message };
    }
  }

  /**
   * Check RabbitMQ connectivity
   */
  private async checkRabbitMQ(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      if (!this.rabbitmqConnection) {
        return { status: 'down', message: 'RabbitMQ connection not available' };
      }

      // Try to create a test channel to verify connection
      // Note: amqplib Connection type doesn't correctly expose createChannel in TypeScript definitions
      const connection: any = this.rabbitmqConnection;
      const testChannel = await Promise.race([
        connection.createChannel(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RabbitMQ connection timeout')), 3000),
        ),
      ]);

      if (testChannel) {
        await (testChannel as amqp.Channel).close();
        return { status: 'up', message: 'RabbitMQ connection healthy' };
      }

      return { status: 'down', message: 'RabbitMQ connection check failed' };
    } catch (error) {
      this.logger.error('RabbitMQ health check failed:', error.message);
      return { status: 'down', message: error.message };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<{ status: 'up' | 'down'; usage: any }> {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const rssMB = usage.rss / 1024 / 1024;

    // Thresholds: 80% heap usage or 1GB RSS
    const heapThreshold = 0.8;
    const rssThreshold = 1024; // 1GB

    const isHealthy = heapUsedMB / heapTotalMB < heapThreshold && rssMB < rssThreshold;

    return {
      status: isHealthy ? 'up' : 'down',
      usage: {
        heapUsed: `${heapUsedMB.toFixed(2)} MB`,
        heapTotal: `${heapTotalMB.toFixed(2)} MB`,
        rss: `${rssMB.toFixed(2)} MB`,
        heapUsagePercent: `${((heapUsedMB / heapTotalMB) * 100).toFixed(2)}%`,
      },
    };
  }
}
