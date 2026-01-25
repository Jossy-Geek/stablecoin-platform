import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import { SocketGatewayModule } from '../../modules/socket/socket-gateway.module';
import * as amqp from 'amqplib';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => SocketGatewayModule),
  ],
  providers: [
    RabbitMQService,
    {
      provide: 'RABBITMQ_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const connection = await amqp.connect(
          configService.get('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672'),
        );
        return connection as unknown as amqp.Connection;
      },
      inject: [ConfigService],
    },
  ],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
