import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleEntity, UserRole } from '../../shared/database/entities/user-role.entity';

@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly repository: Repository<UserRoleEntity>,
  ) {}

  /**
   * Find user role by user ID and role
   */
  async findByUserIdAndRole(userId: string, role: UserRole): Promise<UserRoleEntity | null> {
    return this.repository.findOne({
      where: { userId, role },
    });
  }

  /**
   * Find all roles for a user
   */
  async findByUserId(userId: string): Promise<UserRoleEntity[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find active roles for a user
   */
  async findActiveRolesByUserId(userId: string): Promise<UserRoleEntity[]> {
    return this.repository.find({
      where: { userId, isActive: true, isBlocked: false },
    });
  }

  /**
   * Create new user role
   */
  async create(roleData: Partial<UserRoleEntity>): Promise<UserRoleEntity> {
    const userRole = this.repository.create(roleData);
    return this.repository.save(userRole);
  }

  /**
   * Update user role
   */
  async update(id: string, updateData: Partial<UserRoleEntity>): Promise<UserRoleEntity> {
    await this.repository.update(id, updateData);
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Save user role (create or update)
   */
  async save(userRole: UserRoleEntity): Promise<UserRoleEntity> {
    return this.repository.save(userRole);
  }

  /**
   * Delete user role
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
