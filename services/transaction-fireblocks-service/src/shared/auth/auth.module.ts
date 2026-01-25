import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { TokenWhitelistService } from './token-whitelist.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PassportModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy, TokenWhitelistService],
  exports: [JwtStrategy, PassportModule, JwtModule, TokenWhitelistService],
})
export class AuthModule {}
