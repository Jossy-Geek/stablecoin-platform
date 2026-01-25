import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository, PaginationOptions, PaginatedUsersResult } from './user.repository';
import { UserRoleRepository } from '../auth/user-role.repository';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { User } from '../../shared/database/entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private userRepository: UserRepository,
    private userRoleRepository: UserRoleRepository,
    private kafkaService: KafkaService,
    private configService: ConfigService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    // Emit user.updated event for all active roles
    const userRoles = await this.userRoleRepository.findActiveRolesByUserId(updatedUser.id);

    for (const userRole of userRoles) {
      await this.kafkaService.emit('user.updated', {
        userId: updatedUser.id,
        displayId: updatedUser.displayId,
        email: updatedUser.email,
        role: userRole.role,
        timestamp: new Date().toISOString(),
      });
    }

    return updatedUser;
  }

  async getUserRoles(userId: string) {
    return this.userRoleRepository.findByUserId(userId);
  }

  /**
   * Get users list with pagination
   */
  async getUsersList(options: PaginationOptions): Promise<PaginatedUsersResult> {
    return this.userRepository.findWithPagination(options);
  }

  /**
   * Get admins list with pagination (admin and super_admin only)
   */
  async getAdminsList(options: PaginationOptions): Promise<PaginatedUsersResult> {
    // Filter to only include admin and super_admin roles
    return this.userRepository.findWithPagination({
      ...options,
      role: 'admin', // This will fetch users with admin or super_admin roles
    });
  }

  /**
   * Get user profile by ID with all details
   */
  async getUserProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user profile image
   */
  async updateProfileImage(userId: string, imagePath: string): Promise<User> {
    const user = await this.findById(userId);
    user.profileImage = imagePath;
    const updatedUser = await this.userRepository.save(user);

    // Emit user.updated event
    const userRoles = await this.userRoleRepository.findActiveRolesByUserId(updatedUser.id);

    for (const userRole of userRoles) {
      await this.kafkaService.emit('user.updated', {
        userId: updatedUser.id,
        displayId: updatedUser.displayId,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        mobileNumber: updatedUser.mobileNumber,
        countryCode: updatedUser.countryCode,
        role: userRole.role,
        timestamp: new Date().toISOString(),
      });
    }

    return updatedUser;
  }
}
