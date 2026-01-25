import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaultWebhookController } from './fireblocks-webhook.controller';
import { VaultWebhookService } from './fireblocks-webhook.service';
import { Transaction } from '../../shared/database/entities/transaction.entity';
import { UserBalance } from '../../shared/database/entities/user-balance.entity';
import { DepositAddress } from '../../shared/database/entities/deposit-address.entity';
import { CustodianModule } from '../../shared/custodian/custodian.module';
import { KafkaModule } from '../../shared/kafka/kafka.module';
import { EthersModule } from '../../shared/ethersjs/ethersjs.module';
import { DatabaseModule } from '../../shared/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Transaction, UserBalance, DepositAddress]),
    CustodianModule,
    KafkaModule,
    EthersModule,
  ],
  controllers: [VaultWebhookController],
  providers: [VaultWebhookService],
})
export class VaultWebhookModule {}
