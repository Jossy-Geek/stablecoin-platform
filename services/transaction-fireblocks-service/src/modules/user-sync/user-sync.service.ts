import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../shared/database/entities/user.entity';
import { UserBalance } from '../../shared/database/entities/user-balance.entity';
import { DepositAddress } from '../../shared/database/entities/deposit-address.entity';
import { ethers } from 'ethers';
import { UserRepository } from './user.repository';
import { UserBalanceRepository } from '../transaction/user-balance.repository';
import { DepositAddressRepository } from '../transaction/deposit-address.repository';

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(
    private userRepository: UserRepository,
    private userBalanceRepository: UserBalanceRepository,
    private depositAddressRepository: DepositAddressRepository,
    private dataSource: DataSource,
  ) {}

  /**
   * Handle user.created event from Kafka
   */
  async handleUserCreated(data: { userId: string; displayId: string; email: string; firstName?: string; lastName?: string; mobileNumber?: string; countryCode?: string; role: string; timestamp: string }): Promise<void> {
    this.logger.log(`Syncing user created: ${data.userId} (${data.displayId}) - ${data.email} with role ${data.role}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      let user = await this.userRepository.findById(data.userId);

      if (user) {
        // User exists, update fields if changed
        const needsUpdate = 
          user.email !== data.email || 
          user.displayId !== data.displayId ||
          user.firstName !== data.firstName ||
          user.lastName !== data.lastName ||
          user.mobileNumber !== data.mobileNumber ||
          user.countryCode !== data.countryCode;

        if (needsUpdate) {
          await this.userRepository.updateUser(data.userId, {
            email: data.email,
            displayId: data.displayId,
            firstName: data.firstName,
            lastName: data.lastName,
            mobileNumber: data.mobileNumber,
            countryCode: data.countryCode,
          });
        }
        this.logger.log(`User ${data.userId} already synced, fields updated if needed`);
      } else {
        // Create user (only once per user, regardless of roles)
        user = await this.userRepository.create({
          id: data.userId,
          displayId: data.displayId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          mobileNumber: data.mobileNumber,
          countryCode: data.countryCode,
          role: data.role, // Store first role, but user can have multiple roles
        });

        // Create initial balance (only once per user)
        const existingBalance = await this.userBalanceRepository.findByUserId(data.userId);

        if (!existingBalance) {
          await this.userBalanceRepository.create({
            userId: data.userId,
            balance: '0',
            stablecoinBalance: '0',
            currency: 'USD',
          });
        }

        // Create deposit address (only once per user)
        const existingDepositAddress = await this.depositAddressRepository.findByUserId(data.userId);

        if (!existingDepositAddress) {
          const address = ethers.Wallet.createRandom().address;
          const customerRefId = `user_${data.userId}_${Date.now()}`;
          await this.depositAddressRepository.create({
            userId: data.userId,
            address,
            customerRefId,
            vaultAccountId: null, // Will be set when Fireblocks vault is created
            isActive: true,
          });
        }

        this.logger.log(`User ${data.userId} synced successfully with balance and deposit address`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error syncing user created: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle user.updated event from Kafka
   */
  async handleUserUpdated(data: { userId: string; displayId: string; email: string; firstName?: string; lastName?: string; mobileNumber?: string; countryCode?: string; role?: string; timestamp: string }): Promise<void> {
    this.logger.log(`Syncing user updated: ${data.userId} (${data.displayId}) - ${data.email}`);

    try {
      const user = await this.userRepository.findById(data.userId);

      if (!user) {
        this.logger.warn(`User ${data.userId} not found, creating...`);
        // If user doesn't exist, create it (might be a race condition)
        await this.handleUserCreated({
          userId: data.userId,
          displayId: data.displayId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          mobileNumber: data.mobileNumber,
          countryCode: data.countryCode,
          role: data.role || 'user',
          timestamp: data.timestamp,
        });
        return;
      }

      // Update user
      await this.userRepository.updateUser(data.userId, {
        email: data.email,
        displayId: data.displayId,
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        countryCode: data.countryCode,
      });

      this.logger.log(`User ${data.userId} updated successfully`);
    } catch (error) {
      this.logger.error(`Error syncing user updated: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
