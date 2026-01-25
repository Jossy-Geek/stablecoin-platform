import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ContractRepository } from './contract.repository';
import { ContractState } from '../../shared/database/entities/contract-state.entity';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../../shared/auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([ContractState]),
    AuthModule,
  ],
  controllers: [ContractController],
  providers: [ContractService, ContractRepository],
  exports: [ContractService],
})
export class ContractModule {}
