import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocketGatewayModule } from './modules/socket/socket-gateway.module';
import { HealthModule } from './modules/health/health.module';
import { RabbitMQModule } from './shared/rabbitmq/rabbitmq.module';
import { AuthModule } from './shared/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    RabbitMQModule,
    HealthModule,
    SocketGatewayModule,
  ],
})
export class AppModule {}
