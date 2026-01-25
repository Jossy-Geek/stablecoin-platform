import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from '../user/user.repository';
import { UserRoleRepository } from './user-role.repository';
import { PasswordResetRepository } from './password-reset.repository';
import { TwoFactorAuthRepository } from './two-factor-auth.repository';
import { User } from '../../shared/database/entities/user.entity';
import { UserRoleEntity } from '../../shared/database/entities/user-role.entity';
import { PasswordReset } from '../../shared/database/entities/password-reset.entity';
import { TwoFactorAuth } from '../../shared/database/entities/two-factor-auth.entity';
import { KafkaModule } from '../../shared/kafka/kafka.module';
import { RabbitMQModule } from '../../shared/rabbitmq/rabbitmq.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module';
import { DatabaseModule } from '../../shared/database/database.module';
import { DisplayIdModule } from '../../shared/services/display-id.module';
import { TokenWhitelistService } from '../../shared/auth/token-whitelist.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    TypeOrmModule.forFeature([User, UserRoleEntity, PasswordReset, TwoFactorAuth]),
    SharedAuthModule,
    KafkaModule,
    RabbitMQModule,
    RedisModule,
    DisplayIdModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    UserRoleRepository,
    PasswordResetRepository,
    TwoFactorAuthRepository,
    TokenWhitelistService,
  ],
  exports: [AuthService, UserRepository],
})
export class AuthModule {}
