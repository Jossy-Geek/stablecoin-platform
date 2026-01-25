import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBalance } from '../../shared/database/entities/user-balance.entity';

@Injectable()
export class UserBalanceRepository {
  constructor(
    @InjectRepository(UserBalance)
    private readonly repository: Repository<UserBalance>,
  ) {}

  /**
   * Find balance by user ID
   */
  async findByUserId(userId: string): Promise<UserBalance | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  /**
   * Create new balance
   */
  async create(balanceData: Partial<UserBalance>): Promise<UserBalance> {
    const balance = this.repository.create(balanceData);
    return this.repository.save(balance);
  }

  /**
   * Update balance
   */
  async update(id: string, updateData: Partial<UserBalance>): Promise<UserBalance> {
    await this.repository.update(id, updateData);
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Save balance (create or update)
   */
  async save(balance: UserBalance): Promise<UserBalance> {
    return this.repository.save(balance);
  }

  /**
   * Update balance amount
   */
  async updateBalance(userId: string, newBalance: string): Promise<UserBalance> {
    const balance = await this.findByUserId(userId);
    if (balance) {
      balance.balance = newBalance;
      return this.save(balance);
    }
    throw new Error('Balance not found');
  }

  /**
   * Update stablecoin balance
   */
  async updateStablecoinBalance(userId: string, newBalance: string): Promise<UserBalance> {
    const balance = await this.findByUserId(userId);
    if (balance) {
      balance.stablecoinBalance = newBalance;
      return this.save(balance);
    }
    throw new Error('Balance not found');
  }

  /**
   * Add to balance
   */
  async addBalance(userId: string, amount: string): Promise<UserBalance> {
    const balance = await this.findByUserId(userId);
    if (balance) {
      const currentBalance = parseFloat(balance.balance || '0');
      const newBalance = currentBalance + parseFloat(amount);
      balance.balance = newBalance.toString();
      return this.save(balance);
    }
    throw new Error('Balance not found');
  }

  /**
   * Subtract from balance
   */
  async subtractBalance(userId: string, amount: string): Promise<UserBalance> {
    const balance = await this.findByUserId(userId);
    if (balance) {
      const currentBalance = parseFloat(balance.balance || '0');
      const newBalance = Math.max(0, currentBalance - parseFloat(amount));
      balance.balance = newBalance.toString();
      return this.save(balance);
    }
    throw new Error('Balance not found');
  }
}
