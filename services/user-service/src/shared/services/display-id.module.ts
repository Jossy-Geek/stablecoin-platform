import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisplayIdService } from './display-id.service';
import { UserRepository } from '../../modules/user/user.repository';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [DisplayIdService, UserRepository],
  exports: [DisplayIdService],
})
export class DisplayIdModule {}
