import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepositAddress } from '../../shared/database/entities/deposit-address.entity';

@Injectable()
export class DepositAddressRepository {
  constructor(
    @InjectRepository(DepositAddress)
    private readonly repository: Repository<DepositAddress>,
  ) {}

  /**
   * Find deposit address by user ID
   */
  async findByUserId(userId: string, activeOnly: boolean = false): Promise<DepositAddress | null> {
    const where: any = { userId };
    if (activeOnly) {
      where.isActive = true;
    }
    return this.repository.findOne({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find all deposit addresses for a user
   */
  async findAllByUserId(userId: string): Promise<DepositAddress[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find deposit address by address
   */
  async findByAddress(address: string): Promise<DepositAddress | null> {
    return this.repository.findOne({
      where: { address },
    });
  }

  /**
   * Find deposit address by vault account ID
   */
  async findByVaultAccountId(vaultAccountId: string): Promise<DepositAddress | null> {
    return this.repository.findOne({
      where: { vaultAccountId },
    });
  }

  /**
   * Create new deposit address
   */
  async create(addressData: Partial<DepositAddress>): Promise<DepositAddress> {
    const depositAddress = this.repository.create(addressData);
    return this.repository.save(depositAddress);
  }

  /**
   * Update deposit address
   */
  async update(id: string, updateData: Partial<DepositAddress>): Promise<DepositAddress> {
    await this.repository.update(id, updateData);
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Save deposit address (create or update)
   */
  async save(depositAddress: DepositAddress): Promise<DepositAddress> {
    return this.repository.save(depositAddress);
  }

  /**
   * Deactivate all addresses for a user
   */
  async deactivateAllByUserId(userId: string): Promise<void> {
    await this.repository.update({ userId }, { isActive: false });
  }
}
