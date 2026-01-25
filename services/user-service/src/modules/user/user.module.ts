import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { UserRepository } from './user.repository';
import { UserRoleRepository } from '../auth/user-role.repository';
import { User } from '../../shared/database/entities/user.entity';
import { UserRoleEntity } from '../../shared/database/entities/user-role.entity';
import { KafkaModule } from '../../shared/kafka/kafka.module';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module';
import { StorageModule } from '../../shared/storage/storage.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserRoleEntity]),
    KafkaModule,
    SharedAuthModule,
    StorageModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserResolver, UserRepository, UserRoleRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
