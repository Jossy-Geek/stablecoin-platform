import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VaultService } from './fireblocks.service';

@Module({
  imports: [ConfigModule],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule {}
