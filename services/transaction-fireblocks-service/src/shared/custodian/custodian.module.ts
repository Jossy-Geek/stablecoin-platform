import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustodianFactory } from './custodian.factory';

/**
 * Custodian Module
 * 
 * This module provides the custodian factory and manages custodian instances.
 * It exports the factory so other modules can get custodian instances.
 */
@Module({
  imports: [ConfigModule],
  providers: [CustodianFactory],
  exports: [CustodianFactory],
})
export class CustodianModule {}
