import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/database/entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Find user by display ID
   */
  async findByDisplayId(displayId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { displayId },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  /**
   * Create new user
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  /**
   * Update user
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  /**
   * Save user (create or update)
   */
  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  /**
   * Update email and display ID
   */
  async updateEmailAndDisplayId(id: string, email: string, displayId: string): Promise<User> {
    return this.update(id, { email, displayId, updatedAt: new Date() });
  }

  /**
   * Update user with all fields
   */
  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    return this.update(id, { ...updateData, updatedAt: new Date() });
  }
}
