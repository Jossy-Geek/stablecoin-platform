import {
  DiskHealthIndicator,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { HEALTH_INDICATORS } from './config/health.config';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private memory: MemoryHealthIndicator,
    private mongoDb: MongooseHealthIndicator,
    private disk: DiskHealthIndicator,
    @Inject('RABBITMQ_CONNECTION') private rabbitmqConnection: amqp.Connection,
    private configService: ConfigService,
  ) {}

  /**
   * Perform a MongoDB connectivity check
   */
  async dbHealthCheck(): Promise<any> {
    try {
      return await this.mongoDb.pingCheck(
        HEALTH_INDICATORS.connectivity.database.name,
        {
          timeout: HEALTH_INDICATORS.connectivity.database.timeout,
        },
      );
    } catch (error) {
      this.logger.error('MongoDB health check failed:', error);
      throw error;
    }
  }

  /**
   * Perform a RabbitMQ connectivity check
   */
  async rabbitmqHealthCheck(): Promise<any> {
    try {
      if (!this.rabbitmqConnection) {
        throw new Error('RabbitMQ connection not available');
      }

      // Try to create a test channel to verify connection
      const testChannel = await Promise.race([
        // @ts-ignore - amqplib Connection type doesn't correctly expose createChannel method
        this.rabbitmqConnection.createChannel(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RabbitMQ connection timeout')), HEALTH_INDICATORS.connectivity.rabbitmq.timeout),
        ),
      ]);

      if (testChannel) {
        await testChannel.close();
        return {
          status: 'up',
          [HEALTH_INDICATORS.connectivity.rabbitmq.name]: {
            status: 'up',
            message: 'RabbitMQ connection is healthy',
          },
        };
      }

      throw new Error('RabbitMQ connection check failed');
    } catch (error) {
      this.logger.error('RabbitMQ health check failed:', error);
      return {
        status: 'down',
        [HEALTH_INDICATORS.connectivity.rabbitmq.name]: {
          status: 'down',
          message: error.message || 'RabbitMQ connection check failed',
        },
      };
    }
  }

  /**
   * Perform a heap memory usage check
   */
  async heapHealthCheck(): Promise<any> {
    try {
      return await this.memory.checkHeap(
        HEALTH_INDICATORS.memory.heap.name,
        HEALTH_INDICATORS.memory.heap.threshold,
      );
    } catch (error) {
      this.logger.error('Heap memory health check failed:', error);
      throw error;
    }
  }

  /**
   * Perform a resident set size (RSS) memory usage check
   */
  async rssHealthCheck(): Promise<any> {
    try {
      return await this.memory.checkRSS(
        HEALTH_INDICATORS.memory.rss.name,
        HEALTH_INDICATORS.memory.rss.threshold,
      );
    } catch (error) {
      this.logger.error('RSS memory health check failed:', error);
      throw error;
    }
  }

  /**
   * Perform a disk storage usage check (absolute threshold)
   */
  async diskAbsoluteHealthCheck(): Promise<any> {
    try {
      return await this.disk.checkStorage(HEALTH_INDICATORS.memory.diskAbsolute.name, {
        threshold: HEALTH_INDICATORS.memory.diskAbsolute.threshold,
        path: HEALTH_INDICATORS.memory.diskAbsolute.path,
      });
    } catch (error) {
      this.logger.error('Disk absolute health check failed:', error);
      throw error;
    }
  }

  /**
   * Perform a disk storage usage check (percentage threshold)
   */
  async diskPercentageHealthCheck(): Promise<any> {
    try {
      return await this.disk.checkStorage(
        HEALTH_INDICATORS.memory.diskPercentage.name,
        {
          thresholdPercent: HEALTH_INDICATORS.memory.diskPercentage.threshold,
          path: HEALTH_INDICATORS.memory.diskPercentage.path,
        },
      );
    } catch (error) {
      this.logger.error('Disk percentage health check failed:', error);
      throw error;
    }
  }

  /**
   * Get service information
   */
  getServiceInfo(): any {
    return {
      service: 'notification-service',
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
