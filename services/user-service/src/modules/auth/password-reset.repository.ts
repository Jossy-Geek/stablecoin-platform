import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from '../../shared/database/entities/password-reset.entity';

@Injectable()
export class PasswordResetRepository {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly repository: Repository<PasswordReset>,
  ) {}

  /**
   * Find password reset by token
   */
  async findByToken(token: string): Promise<PasswordReset | null> {
    return this.repository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  /**
   * Find password reset by user ID
   */
  async findByUserId(userId: string): Promise<PasswordReset[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create new password reset
   */
  async create(resetData: Partial<PasswordReset>): Promise<PasswordReset> {
    const passwordReset = this.repository.create(resetData);
    return this.repository.save(passwordReset);
  }

  /**
   * Update password reset
   */
  async update(id: string, updateData: Partial<PasswordReset>): Promise<PasswordReset> {
    await this.repository.update(id, updateData);
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Save password reset (create or update)
   */
  async save(passwordReset: PasswordReset): Promise<PasswordReset> {
    return this.repository.save(passwordReset);
  }

  /**
   * Delete password reset
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Delete expired password resets
   */
  async deleteExpired(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
