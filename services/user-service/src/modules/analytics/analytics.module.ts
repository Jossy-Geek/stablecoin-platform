import { Module } from '@nestjs/common';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from './analytics.service';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    ConfigModule,
  ],
  providers: [AnalyticsResolver, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
