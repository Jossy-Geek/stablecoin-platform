import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionType } from '../../shared/database/entities/transaction.entity';
import { CreateDepositDto, CreateWithdrawDto } from './dto/wallet.dto';
import { DepositAddressRepository } from '../transaction/deposit-address.repository';
import { UserBalanceRepository } from '../transaction/user-balance.repository';
import { UserRepository } from '../user-sync/user.repository';
import { ethers } from 'ethers';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private transactionService: TransactionService,
    private depositAddressRepository: DepositAddressRepository,
    private userBalanceRepository: UserBalanceRepository,
    private userRepository: UserRepository,
  ) {}

  /**
   * Get user balance
   */
  async getBalance(userId: string) {
    return this.transactionService.getUserBalance(userId);
  }

  /**
   * Get complete wallet information
   */
  async getWalletInfo(userId: string) {
    const [balance, depositAddress, user] = await Promise.all([
      this.transactionService.getUserBalance(userId),
      this.depositAddressRepository.findByUserId(userId, true),
      this.userRepository.findById(userId),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      balance: balance.balance,
      stablecoinBalance: balance.stablecoinBalance,
      currency: balance.currency || 'USD',
      depositAddress: depositAddress?.address || null,
      vaultAccountId: depositAddress?.vaultAccountId || null,
      isActive: depositAddress?.isActive || false,
      user: {
        id: user.id,
        displayId: user.displayId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Get or create deposit address
   */
  async getDepositAddress(userId: string) {
    let depositAddress = await this.depositAddressRepository.findByUserId(userId, true);

    if (!depositAddress) {
      // Create new deposit address
      const address = ethers.Wallet.createRandom().address;
      const customerRefId = `user_${userId}_${Date.now()}`;
      
      depositAddress = await this.depositAddressRepository.create({
        userId,
        address,
        customerRefId,
        vaultAccountId: null, // Will be set when Fireblocks vault is created
        isActive: true,
      });

      this.logger.log(`Created deposit address for user ${userId}: ${address}`);
    }

    return {
      address: depositAddress.address,
      vaultAccountId: depositAddress.vaultAccountId,
      customerRefId: depositAddress.customerRefId,
      isActive: depositAddress.isActive,
      createdAt: depositAddress.createdAt,
    };
  }

  /**
   * Create deposit transaction
   */
  async createDeposit(userId: string, createDepositDto: CreateDepositDto) {
    return this.transactionService.createTransaction(userId, {
      amount: createDepositDto.amount,
      currency: createDepositDto.currency || 'USD',
      transactionType: TransactionType.DEPOSIT,
      note: createDepositDto.note || 'Deposit transaction',
    } as any);
  }

  /**
   * Create withdraw transaction
   */
  async createWithdraw(userId: string, createWithdrawDto: CreateWithdrawDto) {
    // Check balance before withdrawing
    const balance = await this.transactionService.getUserBalance(userId);
    const withdrawAmount = parseFloat(createWithdrawDto.amount);
    const currentBalance = parseFloat(balance.balance || '0');

    if (currentBalance < withdrawAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.transactionService.createTransaction(userId, {
      amount: createWithdrawDto.amount,
      currency: createWithdrawDto.currency || 'USD',
      transactionType: TransactionType.WITHDRAW,
      destinationAddress: createWithdrawDto.destinationAddress,
      note: createWithdrawDto.note || 'Withdraw transaction',
    } as any);
  }

  /**
   * Get user transactions with pagination
   */
  async getUserTransactions(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      transactionType?: TransactionType;
    },
  ) {
    return this.transactionService.getTransactions({
      userId,
      page: options.page || 1,
      limit: options.limit || 10,
      status: options.status,
      transactionType: options.transactionType,
    });
  }

  /**
   * Get a single transaction by ID (with user validation)
   */
  async getTransactionById(userId: string, transactionId: string) {
    const transaction = await this.transactionService.getTransactionById(transactionId);
    
    // Verify that the transaction belongs to the user
    if (transaction.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }
    
    return transaction;
  }
}
