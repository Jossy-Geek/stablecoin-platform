import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DatabaseModule } from './shared/database/database.module';
import { RedisModule } from './shared/redis/redis.module';
import { KafkaModule } from './shared/kafka/kafka.module';
import { RabbitMQModule } from './shared/rabbitmq/rabbitmq.module';

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
    RedisModule,
    KafkaModule,
    RabbitMQModule,
    HealthModule,
    UserModule,
    AuthModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
