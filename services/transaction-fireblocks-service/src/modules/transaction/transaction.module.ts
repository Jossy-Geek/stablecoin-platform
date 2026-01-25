import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionResolver } from './transaction.resolver';
import { TransactionRepository } from './transaction.repository';
import { UserBalanceRepository } from './user-balance.repository';
import { DepositAddressRepository } from './deposit-address.repository';
import { Transaction } from '../../shared/database/entities/transaction.entity';
import { UserBalance } from '../../shared/database/entities/user-balance.entity';
import { DepositAddress } from '../../shared/database/entities/deposit-address.entity';
import { User } from '../../shared/database/entities/user.entity';
import { KafkaModule } from '../../shared/kafka/kafka.module';
import { CustodianModule } from '../../shared/custodian/custodian.module';
import { EthersModule } from '../../shared/ethersjs/ethersjs.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../../shared/auth/auth.module';
import { UserSyncModule } from '../user-sync/user-sync.module';
import { SocketEventModule } from '../../shared/socket-event/socket-event.module';
import { NotificationClientModule } from '../../shared/notification/notification-client.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    TypeOrmModule.forFeature([Transaction, UserBalance, DepositAddress, User]),
    KafkaModule,
    CustodianModule,
    EthersModule,
    RedisModule,
    AuthModule,
    UserSyncModule,
    SocketEventModule,
    NotificationClientModule,
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionResolver,
    TransactionRepository,
    UserBalanceRepository,
    DepositAddressRepository,
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
