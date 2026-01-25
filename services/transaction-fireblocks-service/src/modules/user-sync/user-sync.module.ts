import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSyncController } from './user-sync.controller';
import { UserSyncService } from './user-sync.service';
import { UserRepository } from './user.repository';
import { UserBalanceRepository } from '../transaction/user-balance.repository';
import { DepositAddressRepository } from '../transaction/deposit-address.repository';
import { User } from '../../shared/database/entities/user.entity';
import { UserBalance } from '../../shared/database/entities/user-balance.entity';
import { DepositAddress } from '../../shared/database/entities/deposit-address.entity';
import { DatabaseModule } from '../../shared/database/database.module';
import { KafkaModule } from '../../shared/kafka/kafka.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, UserBalance, DepositAddress]),
    forwardRef(() => KafkaModule),
  ],
  controllers: [UserSyncController],
  providers: [
    UserSyncService,
    UserRepository,
    UserBalanceRepository,
    DepositAddressRepository,
  ],
  exports: [UserSyncService, UserRepository],
})
export class UserSyncModule {}
