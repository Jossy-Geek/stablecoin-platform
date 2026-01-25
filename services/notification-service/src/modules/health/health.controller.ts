import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HEALTH_BASE_URL } from './config/health.config';
import { HealthService } from './health.service';

/**
 * Health Controller for microservice health checks
 * 
 * Provides comprehensive health check of all components.
 * Includes all dependencies, resources, and system metrics.
 * Used for monitoring and debugging.
 */
@Controller(HEALTH_BASE_URL)
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthService: HealthService,
  ) {}

  /**
   * Full Health Check
   * 
   * Comprehensive health check of all components.
   * Includes all dependencies, resources, and system metrics.
   * Used for monitoring and debugging.
   * 
   * @returns {Promise<HealthCheckResult>} Complete health check result
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    try {
      const result = await this.health.check([
        // Database connectivity
        async () => this.healthService.dbHealthCheck(),
        // Message queue connectivity
        async () => this.healthService.rabbitmqHealthCheck(),
        // Memory checks
        async () => this.healthService.heapHealthCheck(),
        async () => this.healthService.rssHealthCheck(),
        // Disk storage checks
        async () => this.healthService.diskAbsoluteHealthCheck(),
        async () => this.healthService.diskPercentageHealthCheck(),
      ]);

      // Add service information
      return {
        ...result,
        info: {
          ...result.info,
          ...this.healthService.getServiceInfo(),
        },
        details: {
          ...(result.details || {}),
          service: this.healthService.getServiceInfo(),
        },
      };
    } catch (error) {
      // Even on error, return partial health status
      const errorInfo = {
        status: 'down' as const,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      };

      return {
        status: 'error',
        info: {
          ...this.healthService.getServiceInfo(),
        },
        error: {
          health_check: errorInfo,
        },
        details: {
          health_check: errorInfo,
        },
      };
    }
  }
}
