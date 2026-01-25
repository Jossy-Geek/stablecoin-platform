import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const serviceName = configService.get('SERVICE_NAME', 'user-service');
        const logger = new Logger(`DatabaseModule [${serviceName}]`);

        // Get synchronize and logging from env, default to false for safety
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const synchronizeEnv = configService.get('DATABASE_SYNCHRONIZE');
        const loggingEnv = configService.get('DATABASE_LOGGING');
        
        // Default to false unless explicitly set to 'true' or true
        // This prevents accidental schema modifications in production
        const synchronize = synchronizeEnv !== undefined 
          ? synchronizeEnv === 'true' || synchronizeEnv === true
          : false; // Changed from nodeEnv === 'development' to false for safety
        
        const logging = loggingEnv !== undefined
          ? loggingEnv === 'true' || loggingEnv === true
          : nodeEnv === 'development';

        // Connection pool settings
        // Default to moderate values - too many connections can cause resource exhaustion
        const poolMax = parseInt(configService.get('DATABASE_POOL_MAX', '50'), 10);
        const poolMin = parseInt(configService.get('DATABASE_POOL_MIN', '5'), 10);
        const poolIdleTimeout = parseInt(configService.get('DATABASE_POOL_IDLE_TIMEOUT', '30000'), 10);
        const poolConnectionTimeout = parseInt(configService.get('DATABASE_POOL_CONNECTION_TIMEOUT', '10000'), 10);

        const databaseConfig = {
          type: 'postgres' as const,
          host: configService.get('DATABASE_HOST', 'localhost'),
          port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
          username: configService.get('DATABASE_USER', 'postgres'),
          password: configService.get('DATABASE_PASSWORD', 'postgres123'),
          database: configService.get('DATABASE_NAME', 'st_user_db'),
          entities: [User, UserRoleEntity, PasswordReset, TwoFactorAuth],
          synchronize,
          logging,
          // Connection pool configuration for high load
          extra: {
            max: poolMax,                    // Maximum number of connections in pool
            min: poolMin,                    // Minimum number of connections in pool
            idleTimeoutMillis: poolIdleTimeout,        // Close idle connections after 30 seconds
            connectionTimeoutMillis: poolConnectionTimeout, // Timeout when acquiring connection (10 seconds)
            // Additional pool settings
            acquireTimeoutMillis: 60000,     // Timeout when acquiring connection from pool
            createTimeoutMillis: 30000,      // Timeout when creating new connection
            reapIntervalMillis: 1000,        // How often to check for idle connections
            createRetryIntervalMillis: 200,  // Retry interval for connection creation
          },
        };

        logger.log(`[${serviceName}] Database Configuration:`);
        logger.log(`[${serviceName}]   Host: ${databaseConfig.host}`);
        logger.log(`[${serviceName}]   Port: ${databaseConfig.port}`);
        logger.log(`[${serviceName}]   Database: ${databaseConfig.database}`);
        logger.log(`[${serviceName}]   User: ${databaseConfig.username}`);
        logger.log(`[${serviceName}]   Synchronize: ${databaseConfig.synchronize} (from ${synchronizeEnv !== undefined ? 'DATABASE_SYNCHRONIZE' : 'NODE_ENV'})`);
        logger.log(`[${serviceName}]   Logging: ${databaseConfig.logging} (from ${loggingEnv !== undefined ? 'DATABASE_LOGGING' : 'NODE_ENV'})`);
        logger.log(`[${serviceName}]   Connection Pool: max=${poolMax}, min=${poolMin}, idleTimeout=${poolIdleTimeout}ms, connectionTimeout=${poolConnectionTimeout}ms`);

        return databaseConfig;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, UserRoleEntity, PasswordReset, TwoFactorAuth]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
