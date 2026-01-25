import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

/**
 * Health Controller for Transaction Socket Service
 * 
 * Provides health check endpoints for monitoring service status
 * and dependency connectivity (RabbitMQ).
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check endpoint
   * Returns service status without checking dependencies
   * 
   * @returns {Promise<object>} Basic health status
   */
  @Get()
  async health() {
    return this.healthService.getBasicHealth();
  }

  /**
   * Comprehensive health check
   * Checks all dependencies: RabbitMQ
   * 
   * @returns {Promise<object>} Complete health status
   */
  @Get('full')
  async fullHealth() {
    return this.healthService.getFullHealth();
  }

  /**
   * Readiness probe
   * Checks if service is ready to accept traffic
   * 
   * @returns {Promise<object>} Readiness status
   */
  @Get('ready')
  async readiness() {
    return this.healthService.getReadiness();
  }

  /**
   * Liveness probe
   * Checks if service is alive
   * 
   * @returns {Promise<object>} Liveness status
   */
  @Get('live')
  async liveness() {
    return this.healthService.getLiveness();
  }
}
