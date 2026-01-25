import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EthersService } from './ethersjs.service';

@Module({
  imports: [ConfigModule],
  providers: [EthersService],
  exports: [EthersService],
})
export class EthersModule {}
