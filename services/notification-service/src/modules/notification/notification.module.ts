import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationInAppService } from './notification-in-app.service';
import { NotificationInAppController } from './notification-in-app.controller';
import { Notification, NotificationSchema } from './entities/notification.entity';
import { RabbitMQModule } from '../../shared/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => RabbitMQModule),
  ],
  providers: [NotificationInAppService],
  controllers: [NotificationInAppController],
  exports: [NotificationInAppService],
})
export class NotificationModule {}
