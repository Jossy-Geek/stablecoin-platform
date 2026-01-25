import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { TransactionModule } from './modules/transaction/transaction.module';
import { VaultWebhookModule } from './modules/fireblocks-webhook/fireblocks-webhook.module';
import { UserSyncModule } from './modules/user-sync/user-sync.module';
import { ContractModule } from './modules/contract/contract.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './shared/auth/auth.module';
import { KafkaModule } from './shared/kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }) => ({ req }),
      playground: true,
      introspection: true,
    }),
    DatabaseModule,
    AuthModule,
    KafkaModule,
    HealthModule,
    UserSyncModule,
    TransactionModule,
    WalletModule,
    VaultWebhookModule,
    ContractModule,
  ],
})
export class AppModule {}
