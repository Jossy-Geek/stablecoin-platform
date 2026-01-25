/**
 * Health check configuration constants
 */
export const HEALTH_BASE_URL = 'health';

export const HEALTH_INDICATORS = {
  connectivity: {
    database: {
      name: 'mongodb',
      timeout: 5000, // 5 seconds
    },
    rabbitmq: {
      name: 'rabbitmq',
      timeout: 3000, // 3 seconds
    },
  },
  memory: {
    heap: {
      name: 'memory_heap',
      threshold: 300 * 1024 * 1024, // 300MB (increased for production)
    },
    rss: {
      name: 'memory_rss',
      threshold: 500 * 1024 * 1024, // 500MB (increased for production)
    },
    diskAbsolute: {
      name: 'storage',
      threshold: 100 * 1024 * 1024 * 1024, // 100GB
      path: '/',
    },
    diskPercentage: {
      name: 'storage_percent',
      threshold: 0.8, // 80%
      path: '/',
    },
  },
};

/**
 * Health check types for different probe types
 */
export enum HealthCheckType {
  LIVENESS = 'liveness',
  READINESS = 'readiness',
  STARTUP = 'startup',
  FULL = 'full',
}
