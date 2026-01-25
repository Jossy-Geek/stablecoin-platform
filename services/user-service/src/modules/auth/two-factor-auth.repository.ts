import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorAuth } from '../../shared/database/entities/two-factor-auth.entity';

@Injectable()
export class TwoFactorAuthRepository {
  constructor(
    @InjectRepository(TwoFactorAuth)
    private readonly repository: Repository<TwoFactorAuth>,
  ) {}

  /**
   * Find 2FA by user ID
   */
  async findByUserId(userId: string): Promise<TwoFactorAuth | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  /**
   * Create new 2FA record
   */
  async create(twoFactorData: Partial<TwoFactorAuth>): Promise<TwoFactorAuth> {
    const twoFactorAuth = this.repository.create(twoFactorData);
    return this.repository.save(twoFactorAuth);
  }

  /**
   * Create or update 2FA record by user ID
   */
  async createOrUpdate(userId: string, twoFactorData: Partial<TwoFactorAuth>): Promise<TwoFactorAuth> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await this.repository.update(existing.id, twoFactorData);
      return this.repository.findOne({ where: { id: existing.id } });
    } else {
      return this.create({ ...twoFactorData, userId });
    }
  }

  /**
   * Update 2FA record
   */
  async update(id: string, updateData: Partial<TwoFactorAuth>): Promise<TwoFactorAuth> {
    await this.repository.update(id, updateData);
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Save 2FA record (create or update)
   */
  async save(twoFactorAuth: TwoFactorAuth): Promise<TwoFactorAuth> {
    return this.repository.save(twoFactorAuth);
  }

  /**
   * Delete 2FA record
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
