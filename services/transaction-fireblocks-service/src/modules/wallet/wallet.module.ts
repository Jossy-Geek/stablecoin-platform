import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { TransactionModule } from '../transaction/transaction.module';
import { DepositAddress } from '../../shared/database/entities/deposit-address.entity';
import { UserBalance } from '../../shared/database/entities/user-balance.entity';
import { DepositAddressRepository } from '../transaction/deposit-address.repository';
import { UserBalanceRepository } from '../transaction/user-balance.repository';
import { UserSyncModule } from '../user-sync/user-sync.module';

@Module({
  imports: [
    TransactionModule,
    TypeOrmModule.forFeature([DepositAddress, UserBalance]),
    UserSyncModule,
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    DepositAddressRepository,
    UserBalanceRepository,
  ],
  exports: [WalletService],
})
export class WalletModule {}
