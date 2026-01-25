import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketEventsController } from './socket-events.controller';
import { AuthModule } from '../../shared/auth/auth.module';
import { SocketJwtGuard } from './guards/socket-jwt.guard';

@Module({
  imports: [AuthModule],
  controllers: [SocketEventsController],
  providers: [SocketGateway, SocketJwtGuard],
  exports: [SocketGateway],
})
export class SocketGatewayModule {}
