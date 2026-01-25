import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transaction } from './entities/transaction.entity';
import { UserBalance } from './entities/user-balance.entity';
import { DepositAddress } from './entities/deposit-address.entity';
import { User } from './entities/user.entity';
import { ContractState } from './entities/contract-state.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const serviceName = configService.get('SERVICE_NAME', 'transaction-fireblocks-service');
        const logger = new Logger(`DatabaseModule [${serviceName}]`);

        // Get synchronize and logging from env, fallback to NODE_ENV check
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const synchronizeEnv = configService.get('DATABASE_SYNCHRONIZE');
        const loggingEnv = configService.get('DATABASE_LOGGING');
        
        const synchronize = synchronizeEnv !== undefined 
          ? synchronizeEnv === 'true' || synchronizeEnv === true
          : nodeEnv === 'development';
        
        const logging = loggingEnv !== undefined
          ? loggingEnv === 'true' || loggingEnv === true
          : nodeEnv === 'development';

        const databaseConfig = {
          type: 'postgres' as const,
          host: configService.get('DATABASE_HOST', 'localhost'),
          port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
          username: configService.get('DATABASE_USER', 'postgres'),
          password: configService.get('DATABASE_PASSWORD', 'postgres123'),
          database: configService.get('DATABASE_NAME', 'st_transaction_db'),
          entities: [Transaction, UserBalance, DepositAddress, User, ContractState],
          synchronize,
          logging,
          // Add connection timeout and retry options
          connectTimeoutMS: 10000, // 10 seconds
          retryAttempts: 3,
          retryDelay: 3000, // 3 seconds
          // Don't fail on connection errors during module initialization
          // Connection will be attempted but won't block service startup
        };

        logger.log(`[${serviceName}] Database Configuration:`);
        logger.log(`[${serviceName}]   Host: ${databaseConfig.host}`);
        logger.log(`[${serviceName}]   Port: ${databaseConfig.port}`);
        logger.log(`[${serviceName}]   Database: ${databaseConfig.database}`);
        logger.log(`[${serviceName}]   User: ${databaseConfig.username}`);
        logger.log(`[${serviceName}]   Synchronize: ${databaseConfig.synchronize} (from ${synchronizeEnv !== undefined ? 'DATABASE_SYNCHRONIZE' : 'NODE_ENV'})`);
        logger.log(`[${serviceName}]   Logging: ${databaseConfig.logging} (from ${loggingEnv !== undefined ? 'DATABASE_LOGGING' : 'NODE_ENV'})`);

        return databaseConfig;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Transaction, UserBalance, DepositAddress, User, ContractState]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
