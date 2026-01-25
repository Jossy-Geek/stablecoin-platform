import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { KafkaService } from '../../shared/kafka/kafka.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get basic health status
   */
  async getBasicHealth() {
    return {
      status: 'ok',
      service: 'transaction-fireblocks-service',
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
    const [database, kafka, memory] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkKafka(),
      this.checkMemory(),
    ]);

    const health = {
      status: 'ok' as 'ok' | 'degraded' | 'down',
      service: 'transaction-fireblocks-service',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: database.status === 'fulfilled' ? database.value : { status: 'down', error: database.reason?.message },
        kafka: kafka.status === 'fulfilled' ? kafka.value : { status: 'down', error: kafka.reason?.message },
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
    const [database] = await Promise.allSettled([
      this.checkDatabase(),
    ]);

    const isReady =
      database.status === 'fulfilled' &&
      database.value.status === 'up';

    return {
      status: isReady ? 'ready' : 'not ready',
      service: 'transaction-fireblocks-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: database.status === 'fulfilled' ? database.value : { status: 'down' },
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
      service: 'transaction-fireblocks-service',
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
   * Check Kafka connectivity
   */
  private async checkKafka(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      if (!this.kafkaService) {
        return { status: 'down', message: 'Kafka service not available' };
      }

      // Kafka service is available
      return { status: 'up', message: 'Kafka service available' };
    } catch (error) {
      this.logger.error('Kafka health check failed:', error.message);
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

    // Thresholds: 80% heap usage or 2GB RSS (higher for transaction service)
    const heapThreshold = 0.8;
    const rssThreshold = 2048; // 2GB

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
