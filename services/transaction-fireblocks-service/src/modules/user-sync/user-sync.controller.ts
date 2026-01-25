import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserSyncService } from './user-sync.service';

@Controller()
export class UserSyncController {
  private readonly logger = new Logger(UserSyncController.name);

  constructor(private readonly userSyncService: UserSyncService) {}

  @EventPattern('user.created')
  async handleUserCreated(@Payload() data: { userId: string; displayId: string; email: string; firstName?: string; lastName?: string; mobileNumber?: string; countryCode?: string; role: string; timestamp: string }) {
    this.logger.log(`Processing user.created event for user: ${data.userId}`);
    try {
      await this.userSyncService.handleUserCreated(data);
    } catch (error) {
      this.logger.error(`Error processing user.created event: ${error.message}`, error.stack);
    }
  }

  @EventPattern('user.updated')
  async handleUserUpdated(@Payload() data: { userId: string; displayId: string; email: string; firstName?: string; lastName?: string; mobileNumber?: string; countryCode?: string; role?: string; timestamp: string }) {
    this.logger.log(`Processing user.updated event for user: ${data.userId}`);
    try {
      await this.userSyncService.handleUserUpdated(data);
    } catch (error) {
      this.logger.error(`Error processing user.updated event: ${error.message}`, error.stack);
    }
  }
}
