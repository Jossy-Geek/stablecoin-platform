import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject('RABBITMQ_CONNECTION') @Optional() private readonly rabbitmqConnection: amqp.Connection | null,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get basic health status
   */
  async getBasicHealth() {
    return {
      status: 'ok',
      service: 'transaction-socket-service',
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
    const [rabbitmq, memory] = await Promise.allSettled([
      this.checkRabbitMQ(),
      this.checkMemory(),
    ]);

    const health = {
      status: 'ok' as 'ok' | 'degraded' | 'down',
      service: 'transaction-socket-service',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
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
    const [rabbitmq] = await Promise.allSettled([
      this.checkRabbitMQ(),
    ]);

    const isReady =
      rabbitmq.status === 'fulfilled' &&
      rabbitmq.value.status === 'up';

    return {
      status: isReady ? 'ready' : 'not ready',
      service: 'transaction-socket-service',
      timestamp: new Date().toISOString(),
      checks: {
        rabbitmq: rabbitmq.status === 'fulfilled' ? rabbitmq.value : { status: 'down' },
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
      service: 'transaction-socket-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
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

    // Thresholds: 80% heap usage or 512MB RSS
    const heapThreshold = 0.8;
    const rssThreshold = 512; // 512MB

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
