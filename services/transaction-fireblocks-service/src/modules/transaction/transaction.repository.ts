import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../../shared/database/entities/transaction.entity';

export interface TransactionFilterOptions {
  userId?: string;
  status?: TransactionStatus;
  transactionType?: TransactionType;
  page?: number;
  limit?: number;
  search?: string;
  id?: string;
  amount?: string;
  currency?: string;
  toCurrency?: string;
  txHash?: string;
}

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  /**
   * Find transaction by ID
   */
  async findById(id: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Find transaction by transaction ID (txn_id)
   */
  async findByTxnId(txnId: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { txnId },
    });
  }

  /**
   * Find transaction by tx hash
   */
  async findByTxHash(txHash: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { txHash },
    });
  }

  /**
   * Find transactions by user ID
   */
  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<Transaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC');

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }
    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    return queryBuilder.getMany();
  }

  /**
   * Find transactions with filters
   */
  async findWithFilters(options: TransactionFilterOptions): Promise<{ data: Transaction[]; total: number }> {
    const { userId, status, transactionType, page = 1, limit = 10, search, id, amount, currency, toCurrency, txHash } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .skip(skip)
      .take(limit)
      .orderBy('transaction.createdAt', 'DESC');

    // Apply general search filter (searches across multiple fields)
    if (search) {
      queryBuilder.where(
        '(transaction.id::text ILIKE :search OR transaction.userId::text ILIKE :search OR transaction.amount::text ILIKE :search OR transaction.currency ILIKE :search OR transaction.toCurrency ILIKE :search OR transaction.txHash ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply column-specific filters
    if (id) {
      if (search) {
        queryBuilder.andWhere('transaction.id::text ILIKE :id', { id: `%${id}%` });
      } else {
        queryBuilder.where('transaction.id::text ILIKE :id', { id: `%${id}%` });
      }
    }

    if (userId) {
      if (search || id) {
        queryBuilder.andWhere('transaction.userId::text ILIKE :userId', { userId: `%${userId}%` });
      } else {
        queryBuilder.where('transaction.userId = :userId', { userId });
      }
    }

    if (amount) {
      if (search || id || userId) {
        queryBuilder.andWhere('transaction.amount::text ILIKE :amount', { amount: `%${amount}%` });
      } else {
        queryBuilder.where('transaction.amount::text ILIKE :amount', { amount: `%${amount}%` });
      }
    }

    if (currency) {
      if (search || id || userId || amount) {
        queryBuilder.andWhere('transaction.currency ILIKE :currency', { currency: `%${currency}%` });
      } else {
        queryBuilder.where('transaction.currency ILIKE :currency', { currency: `%${currency}%` });
      }
    }

    if (toCurrency) {
      if (search || id || userId || amount || currency) {
        queryBuilder.andWhere('transaction.toCurrency ILIKE :toCurrency', { toCurrency: `%${toCurrency}%` });
      } else {
        queryBuilder.where('transaction.toCurrency ILIKE :toCurrency', { toCurrency: `%${toCurrency}%` });
      }
    }

    if (txHash) {
      if (search || id || userId || amount || currency || toCurrency) {
        queryBuilder.andWhere('transaction.txHash ILIKE :txHash', { txHash: `%${txHash}%` });
      } else {
        queryBuilder.where('transaction.txHash ILIKE :txHash', { txHash: `%${txHash}%` });
      }
    }

    if (status) {
      const conditions = [search, id, userId, amount, currency, toCurrency, txHash].filter(Boolean);
      if (conditions.length > 0) {
        queryBuilder.andWhere('transaction.status = :status', { status });
      } else {
        queryBuilder.where('transaction.status = :status', { status });
      }
    }

    if (transactionType) {
      const conditions = [search, id, userId, amount, currency, toCurrency, txHash, status].filter(Boolean);
      if (conditions.length > 0) {
        queryBuilder.andWhere('transaction.transactionType = :transactionType', { transactionType });
      } else {
        queryBuilder.where('transaction.transactionType = :transactionType', { transactionType });
      }
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Create new transaction
   */
  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.repository.create(transactionData);
    return this.repository.save(transaction);
  }

  /**
   * Update transaction
   */
  async update(id: string, updateData: Partial<Transaction>): Promise<Transaction> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  /**
   * Save transaction (create or update)
   */
  async save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }

  /**
   * Update transaction status
   */
  async updateStatus(id: string, status: TransactionStatus, failureReason?: string): Promise<Transaction> {
    const updateData: Partial<Transaction> = { status };
    if (failureReason) {
      updateData.failureReason = failureReason;
    }
    return this.update(id, updateData);
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id: string): Promise<Transaction> {
    const transaction = await this.findById(id);
    if (transaction) {
      transaction.retryCount = (transaction.retryCount || 0) + 1;
      return this.save(transaction);
    }
    throw new Error('Transaction not found');
  }

  /**
   * Find transactions by type and status
   */
  async findByType(transactionType: TransactionType, status: TransactionStatus): Promise<Transaction[]> {
    return this.repository.find({
      where: {
        transactionType,
        status,
      },
    });
  }
}
