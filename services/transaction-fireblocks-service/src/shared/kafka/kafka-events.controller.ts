import { Controller, Logger, Inject, forwardRef } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { UserSyncService } from '../../modules/user-sync/user-sync.service';

@Controller()
export class KafkaEventsController {
  private readonly logger = new Logger(KafkaEventsController.name);

  constructor(
    @Inject(forwardRef(() => UserSyncService))
    private userSyncService: UserSyncService,
  ) {}

  // Listen to user service events for sync
  @EventPattern('user.created')
  async handleUserCreated(data: {
    userId: string;
    displayId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    countryCode?: string;
    role: string;
    timestamp?: string;
  }) {
    this.logger.log(`Received user.created event: ${JSON.stringify(data)}`);
    
    try {
      await this.userSyncService.handleUserCreated({
        userId: data.userId,
        displayId: data.displayId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        countryCode: data.countryCode,
        role: data.role,
        timestamp: data.timestamp || new Date().toISOString(),
      });
      this.logger.log(`Successfully synced user created: ${data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to sync user created: ${data.userId}`, error.stack);
      // Don't throw - we don't want to crash the service on sync failures
    }
  }

  @EventPattern('user.updated')
  async handleUserUpdated(data: {
    userId: string;
    displayId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    countryCode?: string;
    role?: string;
    timestamp?: string;
  }) {
    this.logger.log(`Received user.updated event: ${JSON.stringify(data)}`);
    
    try {
      await this.userSyncService.handleUserUpdated({
        userId: data.userId,
        displayId: data.displayId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        countryCode: data.countryCode,
        role: data.role,
        timestamp: data.timestamp || new Date().toISOString(),
      });
      this.logger.log(`Successfully synced user updated: ${data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to sync user updated: ${data.userId}`, error.stack);
      // Don't throw - we don't want to crash the service on sync failures
    }
  }
}
