import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../../shared/database/entities/transaction.entity';
import { UserBalance } from '../../shared/database/entities/user-balance.entity';
import { DepositAddress } from '../../shared/database/entities/deposit-address.entity';
import { User } from '../../shared/database/entities/user.entity';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { CustodianFactory } from '../../shared/custodian/custodian.factory';
import { ICustodian } from '../../shared/custodian/interfaces/custodian.interface';
import { EthersService } from '../../shared/ethersjs/ethersjs.service';
import { RedisService } from '../../shared/redis/redis.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PeerType, TransactionOperation } from 'fireblocks-sdk';
import { ethers } from 'ethers';
import { TransactionRepository } from './transaction.repository';
import { UserBalanceRepository } from './user-balance.repository';
import { DepositAddressRepository } from './deposit-address.repository';
import { UserRepository } from '../user-sync/user.repository';
import { SocketEventPublisher } from '../../shared/socket-event/socket-event.publisher';
import { SocketEventType } from '../../shared/socket-event/dto/socket-event.dto';
import { NotificationClientService } from '../../shared/notification/notification-client.service';

@Injectable()
export class TransactionService implements OnModuleInit {
  private readonly logger = new Logger(TransactionService.name);
  private readonly mintVaultAccountId: string;
  private readonly burnVaultAccountId: string;
  private readonly burnExternalWalletId: string;
  private readonly burnOneTimeAddress: string;
  private readonly isVaultEnabled: boolean;
  private readonly enableDemoEvents: boolean;

  constructor(
    private transactionRepository: TransactionRepository,
    private userBalanceRepository: UserBalanceRepository,
    private depositAddressRepository: DepositAddressRepository,
    private userRepository: UserRepository,
    private kafkaService: KafkaService,
    private custodianFactory: CustodianFactory,
    private ethersService: EthersService,
    private redisService: RedisService,
    private dataSource: DataSource,
    private configService: ConfigService,
    private socketEventPublisher: SocketEventPublisher,
    private notificationClientService: NotificationClientService,
  ) {
    this.isVaultEnabled = this.configService.get('IS_VAULT_ENABLED', 'false') === 'true';
    
    // Get demo events configuration
    const demoEventsConfig = this.configService.get('ENABLE_DEMO_SOCKET_EVENTS', 'false');
    this.enableDemoEvents = demoEventsConfig === 'true';
    
    console.log(`🔧 [TransactionService] Constructor - ENABLE_DEMO_SOCKET_EVENTS from env: "${demoEventsConfig}"`);
    console.log(`🔧 [TransactionService] Constructor - enableDemoEvents: ${this.enableDemoEvents}`);
    this.mintVaultAccountId = this.configService.get('MINT_VAULT_ACCOUNT_ID', '');
    this.burnVaultAccountId = this.configService.get('BURN_VAULT_ACCOUNT_ID', '');
    this.burnExternalWalletId = this.configService.get('BURN_EXTERNAL_WALLET_ID', '');
    this.burnOneTimeAddress = this.configService.get('BURN_ONE_TIME_ADDRESS', '');

    // Log demo events configuration
    console.log(`🔧 [TransactionService] Demo Events Enabled: ${this.enableDemoEvents}`);
    this.logger.log(`Demo Events Configuration: ${this.enableDemoEvents ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * On module init - emit demo events for testing
   */
  async onModuleInit() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 [TransactionService] onModuleInit() CALLED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🚀 [TransactionService] enableDemoEvents value: ${this.enableDemoEvents}`);
    console.log(`🚀 [TransactionService] Type of enableDemoEvents: ${typeof this.enableDemoEvents}`);
    this.logger.log('TransactionService onModuleInit executed');

    if (this.enableDemoEvents === true) {
      this.logger.log('🧪 DEMO MODE: Emitting test socket events...');
      console.log('');
      console.log('🧪 [Demo Events] ═══════════════════════════════════════');
      console.log('🧪 [Demo Events] DEMO MODE ENABLED ✓');
      console.log('🧪 [Demo Events] Starting demo transaction events...');
      console.log('🧪 [Demo Events] Waiting 5 seconds for services to be ready...');
      console.log('🧪 [Demo Events] ═══════════════════════════════════════');
      console.log('');
      
      // Wait a bit for services to be ready (socket service, etc.)
      setTimeout(() => {
        console.log('');
        console.log('🧪 [Demo Events] ⏰ Timer fired - calling emitDemoEvents()');
        console.log('');
        this.emitDemoEvents().catch((error) => {
          console.error('❌ [Demo Events] Error in emitDemoEvents:', error);
          this.logger.error(`Error in emitDemoEvents: ${error.message}`);
        });
      }, 30000); // 1 second delay to ensure all services are ready
    } else {
      console.log(' ');
      console.log('ℹ️  [Demo Events] ═══════════════════════════════════════');
      console.log('ℹ️  [Demo Events] Demo events are DISABLED');
      console.log('ℹ️  [Demo Events] Set ENABLE_DEMO_SOCKET_EVENTS=true in .env to enable');
      console.log('ℹ️  [Demo Events] ═══════════════════════════════════════');
      console.log('');
      this.logger.log('Demo events are disabled');
    }
  }

  /**
   * Emit demo transaction events for testing
   * Note: These events will only be delivered if a user with the demoUserId is connected
   */
  private async emitDemoEvents() {
    // Use configurable demo user ID or default
    const demoUserId = this.configService.get<string>(
      'DEMO_USER_ID',
      '00000000-0000-0000-0000-000000000002',
    );
    
    console.log('🧪 [Demo Events] ========================================');
    console.log('🧪 [Demo Events] STARTING DEMO TRANSACTION EVENTS');
    console.log('🧪 [Demo Events] ========================================');
    console.log(`🧪 [Demo Events] Demo User ID: ${demoUserId}`);
    console.log(`🧪 [Demo Events] Note: Events will only be delivered if user ${demoUserId} is connected`);
    console.log(`🧪 [Demo Events] To test with your user, set DEMO_USER_ID=<your-user-id> in .env`);
    this.logger.log(`🧪 Emitting demo socket events for testing (User ID: ${demoUserId})`);

    try {
      // Demo 1: Transaction PENDING
      console.log('🧪 [Demo Events] 1. Emitting TRANSACTION_UPDATE (pending)...');
      await this.socketEventPublisher.publishEvent({
        eventType: SocketEventType.TRANSACTION_UPDATE,
        userId: demoUserId,
        transactionId: '95365443-1e26-4966-8105-5005379c190c',
        status: TransactionStatus.PENDING,
        amount: '100.00',
        currency: 'USD',
        transactionType: TransactionType.MINT,
      });
      await this.delay(2000);

      // Demo 2: Transaction CONFIRMED
      console.log('🧪 [Demo Events] 2. Emitting TRANSACTION_UPDATE (confirmed)...');
      await this.socketEventPublisher.publishEvent({
        eventType: SocketEventType.TRANSACTION_UPDATE,
        userId: demoUserId,
        transactionId: '95365443-1e26-4966-8105-5005379c190c',
        status: TransactionStatus.CONFIRMED,
        amount: '500.00',
        currency: 'USD',
        transactionType: TransactionType.MINT,
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      });
      await this.delay(2000);

      // Demo 3: Transaction REJECTED
      console.log('🧪 [Demo Events] 3. Emitting TRANSACTION_UPDATE (rejected)...');
      await this.socketEventPublisher.publishEvent({
        eventType: SocketEventType.TRANSACTION_UPDATE,
        userId: demoUserId,
        transactionId: 'e9d20933-9db2-4320-bb21-fe001ad76e44',
        status: TransactionStatus.REJECTED,
        amount: '200.00',
        currency: 'USD',
        transactionType: TransactionType.WITHDRAW,
        reason: 'Insufficient balance for withdrawal',
      });
      await this.delay(2000);

      // Demo 4: Deposit CONFIRMED
      console.log('🧪 [Demo Events] 4. Emitting TRANSACTION_UPDATE (deposit confirmed)...');
      await this.socketEventPublisher.publishEvent({
        eventType: SocketEventType.TRANSACTION_UPDATE,
        userId: demoUserId,
        transactionId: '95365443-1e26-4966-8105-5005379c190c',
        status: TransactionStatus.CONFIRMED,
        amount: '1000.00',
        currency: 'USD',
        transactionType: TransactionType.DEPOSIT,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      });
      await this.delay(2000);

      // Demo 5: Burn CONFIRMED
      console.log('🧪 [Demo Events] 5. Emitting TRANSACTION_UPDATE (burn confirmed)...');
      await this.socketEventPublisher.publishEvent({
        eventType: SocketEventType.TRANSACTION_UPDATE,
        userId: demoUserId,
        transactionId: '95365443-1e26-4966-8105-5005379c190c',
        status: TransactionStatus.CONFIRMED,
        amount: '250.00',
        currency: 'STC',
        transactionType: TransactionType.BURN,
        txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      });

      console.log('✅ [Demo Events] All demo socket events emitted successfully!');
      console.log(`ℹ️  [Demo Events] Note: If you didn't receive events, make sure user ${demoUserId} is connected`);
      console.log(`ℹ️  [Demo Events] To test with your user, set DEMO_USER_ID=<your-user-id> in .env`);
      this.logger.log('✅ Demo socket events emitted successfully');

      // Now emit demo notification events (email + in-app notifications)
      console.log('');
      console.log('🔔 [Demo Notifications] ========================================');
      console.log('🔔 [Demo Notifications] STARTING DEMO NOTIFICATION EVENTS');
      console.log('🔔 [Demo Notifications] ========================================');
      
      await this.delay(2000);

      // Demo Notification 1: Transaction PENDING notification
      console.log('🔔 [Demo Notifications] 1. Sending transaction PENDING notification...');
      await this.notificationClientService.sendTransactionEvent({
        userId: demoUserId,
        transactionId: '95365443-1e26-4966-8105-5005379c190c',
        transactionType: TransactionType.MINT,
        status: TransactionStatus.PENDING,
        amount: '100.00',
        currency: 'USD',
        userEmail: 'demo@example.com',
      });
      await this.delay(2000);

      // Demo Notification 2: Transaction CONFIRMED notification
      console.log('🔔 [Demo Notifications] 2. Sending transaction CONFIRMED notification...');
      await this.notificationClientService.sendTransactionEvent({
        userId: demoUserId,
        transactionId: '95365443-1e26-4966-8105-5005379c190c',
        transactionType: TransactionType.MINT,
        status: TransactionStatus.CONFIRMED,
        amount: '500.00',
        currency: 'USD',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        userEmail: 'demo@example.com',
      });
      await this.delay(2000);

      // Demo Notification 3: Transaction REJECTED notification
      console.log('🔔 [Demo Notifications] 3. Sending transaction REJECTED notification...');
      await this.notificationClientService.sendTransactionEvent({
        userId: demoUserId,
        transactionId: 'e9d20933-9db2-4320-bb21-fe001ad76e44',
        transactionType: TransactionType.WITHDRAW,
        status: TransactionStatus.REJECTED,
        amount: '200.00',
        currency: 'USD',
        reason: 'Insufficient balance for withdrawal',
        userEmail: 'demo@example.com',
      });
      await this.delay(2000);

      // Demo Notification 4: Custom system notification
      console.log('🔔 [Demo Notifications] 4. Sending custom system notification...');
      await this.notificationClientService.createNotification({
        userId: demoUserId,
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance will occur on January 20, 2026 from 2:00 AM to 4:00 AM UTC. Services may be temporarily unavailable.',
        type: 'system',
        priority: 'medium',
        metadata: {
          maintenanceDate: '2026-01-20T02:00:00Z',
          duration: '2 hours',
        },
      });
      await this.delay(2000);

      // Demo Notification 5: Security notification
      console.log('🔔 [Demo Notifications] 5. Sending security notification...');
      await this.notificationClientService.createNotification({
        userId: demoUserId,
        title: 'New Login Detected',
        message: 'A new login was detected from a new device. If this was not you, please secure your account immediately.',
        type: 'security',
        priority: 'high',
        metadata: {
          device: 'Chrome on Windows',
          location: 'New York, USA',
          ipAddress: '192.168.1.1',
          actionUrl: '/security/sessions',
        },
      });
      await this.delay(2000);

      // Demo Notification 6: Transaction BURN confirmed
      console.log('🔔 [Demo Notifications] 6. Sending transaction BURN confirmed notification...');
      await this.notificationClientService.sendTransactionEvent({
        userId: demoUserId,
        transactionId: '95365443-1e26-4966-8105-5005379c190c',
        transactionType: TransactionType.BURN,
        status: TransactionStatus.CONFIRMED,
        amount: '250.00',
        currency: 'STC',
        txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        userEmail: 'demo@example.com',
      });

      console.log('✅ [Demo Notifications] All demo notification events sent successfully!');
      console.log(`ℹ️  [Demo Notifications] Check the bell icon in user/admin frontend to see real-time notifications`);
      this.logger.log('✅ Demo notification events sent successfully');
    } catch (error: any) {
      console.error('❌ [Demo Events] Error emitting demo events:', error);
      this.logger.error(`Error emitting demo events: ${error.message}`);
    }
  }

  /**
   * Helper method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Add wallet balance manually (Admin only)
   */
  async addBalanceManually(userId: string, amount: string): Promise<UserBalance> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let balance = await this.userBalanceRepository.findByUserId(userId);

      if (!balance) {
        balance = await this.userBalanceRepository.create({
          userId,
          balance: '0',
          stablecoinBalance: '0',
        });
      }

      await this.userBalanceRepository.addBalance(userId, amount);
      balance = await this.userBalanceRepository.findByUserId(userId);
      await queryRunner.commitTransaction();

      // Emit Kafka event
      await this.kafkaService.emit('balance.updated', {
        userId,
        balance: balance.balance,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Balance added manually for user ${userId}: ${amount}`);
      return balance;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error adding balance: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create transaction
   */
  async createTransaction(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { transactionType, amount, currency, toCurrency } = createTransactionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get or create deposit address
      let depositAddress = await this.depositAddressRepository.findByUserId(userId, true);

      if (!depositAddress) {
        depositAddress = await this.createDepositAddress(userId);
        depositAddress = await this.depositAddressRepository.save(depositAddress);
      }

      // Create transaction record
      const savedTransaction = await this.transactionRepository.create({
        userId,
        depositAddressId: depositAddress.id,
        transactionType,
        amount,
        amountRequested: amount,
        currency: currency || 'USD',
        toCurrency: toCurrency || 'STC',
        status: TransactionStatus.PENDING,
        destinationAddress: (createTransactionDto as any).destinationAddress || null,
        note: (createTransactionDto as any).note || null,
      });
      await queryRunner.commitTransaction();

      // Process transaction asynchronously (but NOT for DEPOSIT, MINT, BURN, WITHDRAW - these need admin approval)
      if (transactionType === TransactionType.DEPOSIT || 
          transactionType === TransactionType.MINT || 
          transactionType === TransactionType.BURN || 
          transactionType === TransactionType.WITHDRAW) {
        this.logger.log(`${transactionType} transaction ${savedTransaction.id} created with PENDING status - awaiting admin approval`);
      } else {
        this.processTransaction(savedTransaction.id).catch((error) => {
          this.logger.error(`Error processing transaction ${savedTransaction.id}: ${error.message}`);
        });
      }

      // Emit Kafka event
      await this.kafkaService.emit('transaction.created', {
        transactionId: savedTransaction.id,
        userId,
        transactionType,
        amount,
        timestamp: new Date().toISOString(),
      });

      // Publish socket event for transaction pending (non-blocking)
      this.socketEventPublisher.publishTransactionPending(
        userId,
        savedTransaction.id,
        amount,
        currency || 'USD',
        transactionType,
        TransactionStatus.PENDING,
      ).catch((error) => {
        this.logger.warn(`Failed to publish socket event for transaction ${savedTransaction.id}: ${error.message}`);
      });

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating transaction: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process transaction
   */
  async processTransaction(transactionId: string): Promise<void> {
    const transaction = await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.transactionRepository.updateStatus(transaction.id, TransactionStatus.PROCESSING);
    const updatedTransaction = await this.transactionRepository.findById(transactionId);

    try {
      switch (updatedTransaction.transactionType) {
        case TransactionType.MINT:
          await this.processMint(updatedTransaction);
          break;
        case TransactionType.BURN:
          await this.processBurn(updatedTransaction);
          break;
        case TransactionType.DEPOSIT:
          await this.processDeposit(updatedTransaction);
          break;
        case TransactionType.WITHDRAW:
          await this.processWithdraw(updatedTransaction);
          break;
        default:
          throw new BadRequestException('Invalid transaction type');
      }
    } catch (error) {
      this.logger.error(`Transaction processing failed: ${error.message}`);
      await this.transactionRepository.incrementRetryCount(transactionId);
      await this.transactionRepository.updateStatus(transactionId, TransactionStatus.FAILED, error.message);
      const failedTransaction = await this.transactionRepository.findById(transactionId);

      // Retry logic
      if (failedTransaction.retryCount < 3) {
        const delay = Math.pow(2, failedTransaction.retryCount) * 1000;
        setTimeout(() => {
          this.processTransaction(transactionId).catch(console.error);
        }, delay);
      } else {
        await this.kafkaService.emit('transaction-dlq', {
          transactionId: failedTransaction.id,
          error: error.message,
          retryCount: failedTransaction.retryCount,
        });
      }
    }
  }

  /**
   * Process mint transaction
   */
  private async processMint(transaction: Transaction): Promise<void> {
    this.logger.log(`Processing mint transaction: ${transaction.id}`);

    const custodian = this.custodianFactory.getCustodian();
    if (this.isVaultEnabled && custodian && custodian.isInitialized()) {
      // Use custodian for minting
      const depositAddress = await this.depositAddressRepository.findByUserId(transaction.userId, true);

      if (!depositAddress || !depositAddress.vaultAccountId) {
        throw new BadRequestException('Deposit address or vault account not found');
      }

      const assetId = 'STC'; // Stablecoin asset ID
      const amount = transaction.amount;

      // Estimate gas fee
      const txOptions = {
        assetId,
        sourceId: this.mintVaultAccountId,
        sourceType: 'VAULT_ACCOUNT',
        destinationId: depositAddress.vaultAccountId,
        destinationType: 'VAULT_ACCOUNT',
        amount,
        customerRefId: depositAddress.customerRefId || transaction.id,
        operation: 'TRANSFER',
        note: 'MINT_TOKEN',
      };

      const txGasFee = await custodian.calculateGasFee(txOptions);

      // Check balance
      const hasBalance = await custodian.checkVaultBalance(
        this.mintVaultAccountId,
        assetId,
        txGasFee,
        amount,
      );

      if (!hasBalance) {
        throw new BadRequestException('Insufficient balance in mint vault');
      }

      // Create custodian transaction
      const custodianTx = await custodian.submitTransaction(txOptions);

      await this.transactionRepository.update(transaction.id, {
        txnId: custodianTx.id,
        status: TransactionStatus.PROCESSING,
        note: 'MINT_TOKEN',
      });

      this.logger.log(`${custodian.getProviderName()} mint transaction created: ${custodianTx.id}`);
    } else {
      // Local mode: Use contract directly
      const contract = this.ethersService.getContract();
      if (!contract) {
        throw new BadRequestException('Contract not initialized');
      }

      // Get user address from deposit address
      const depositAddress = await this.depositAddressRepository.findByUserId(transaction.userId, true);

      if (!depositAddress || !depositAddress.address) {
        throw new BadRequestException('Deposit address not found');
      }

      // Encode mint function
      const contractCallData = this.ethersService.encodeMintFunction(
        depositAddress.address,
        transaction.amount,
      );

      // In local mode, simulate transaction
      await this.transactionRepository.update(transaction.id, {
        txHash: `0x${'0'.repeat(64)}`,
        status: TransactionStatus.CONFIRMED,
      });

      // Update balance
      await this.updateBalance(transaction.userId, TransactionType.MINT, transaction.amount);
    }
  }

  /**
   * Process burn transaction
   */
  private async processBurn(transaction: Transaction): Promise<void> {
    this.logger.log(`Processing burn transaction: ${transaction.id}`);

    const custodian = this.custodianFactory.getCustodian();
    if (this.isVaultEnabled && custodian && custodian.isInitialized()) {
      // Use custodian for burning
      const depositAddress = await this.depositAddressRepository.findByUserId(transaction.userId, true);

      if (!depositAddress || !depositAddress.vaultAccountId) {
        throw new BadRequestException('Deposit address or vault account not found');
      }

      const assetId = 'STC';
      const amount = transaction.amount;

      // First, transfer from user vault to default vault (using contract call)
      const contractCallData = this.ethersService.encodeBurnFunction(
        depositAddress.address,
        amount,
      );

      const txOptions = {
        assetId: 'ETH', // Use ETH for contract call
        sourceId: depositAddress.vaultAccountId,
        sourceType: 'VAULT_ACCOUNT',
        destinationId: this.burnVaultAccountId,
        destinationType: 'VAULT_ACCOUNT',
        amount: '0', // Contract call doesn't transfer tokens
        customerRefId: depositAddress.customerRefId || transaction.id,
        operation: 'CONTRACT_CALL',
        note: 'BURN_TOKEN',
        contractCallData,
      };

      const txGasFee = await custodian.calculateGasFee(txOptions);

      const hasBalance = await custodian.checkVaultBalance(
        depositAddress.vaultAccountId,
        assetId,
        txGasFee,
        amount,
      );

      if (!hasBalance) {
        throw new BadRequestException('Insufficient balance');
      }

      const custodianTx = await custodian.submitTransaction(txOptions);

      await this.transactionRepository.update(transaction.id, {
        txnId: custodianTx.id,
        status: TransactionStatus.PROCESSING,
        note: 'BURN_TOKEN',
      });

      this.logger.log(`${custodian.getProviderName()} burn transaction created: ${custodianTx.id}`);
    } else {
      // Local mode
      const contract = this.ethersService.getContract();
      if (!contract) {
        throw new BadRequestException('Contract not initialized');
      }

      const depositAddress = await this.depositAddressRepository.findByUserId(transaction.userId, true);

      if (!depositAddress || !depositAddress.address) {
        throw new BadRequestException('Deposit address not found');
      }

      await this.transactionRepository.update(transaction.id, {
        txHash: `0x${'0'.repeat(64)}`,
        status: TransactionStatus.CONFIRMED,
      });

      await this.updateBalance(transaction.userId, TransactionType.BURN, transaction.amount);
    }
  }

  /**
   * Process deposit transaction
   */
  private async processDeposit(transaction: Transaction): Promise<void> {
    this.logger.log(`Processing deposit transaction: ${transaction.id}`);
    // Deposit logic - update balance directly
    await this.updateBalance(transaction.userId, TransactionType.DEPOSIT, transaction.amount);
    await this.transactionRepository.updateStatus(transaction.id, TransactionStatus.CONFIRMED);
  }

  /**
   * Process withdraw transaction
   */
  private async processWithdraw(transaction: Transaction): Promise<void> {
    this.logger.log(`Processing withdraw transaction: ${transaction.id}`);
    // Withdraw logic - update balance
    await this.updateBalance(transaction.userId, TransactionType.WITHDRAW, transaction.amount);
    await this.transactionRepository.updateStatus(transaction.id, TransactionStatus.CONFIRMED);
  }

  /**
   * Update user balance
   */
  private async updateBalance(
    userId: string,
    type: TransactionType,
    amount: string,
  ): Promise<void> {
    let balance = await this.userBalanceRepository.findByUserId(userId);

    if (!balance) {
      balance = await this.userBalanceRepository.create({
        userId,
        balance: '0',
        stablecoinBalance: '0',
      });
    }

    const amountNum = parseFloat(amount);

    switch (type) {
      case TransactionType.MINT:
      case TransactionType.DEPOSIT:
        await this.userBalanceRepository.updateStablecoinBalance(
          userId,
          (parseFloat(balance.stablecoinBalance) + amountNum).toString(),
        );
        break;
      case TransactionType.BURN:
      case TransactionType.WITHDRAW:
        const currentBalance = parseFloat(balance.stablecoinBalance);
        if (currentBalance < amountNum) {
          throw new BadRequestException('Insufficient balance');
        }
        await this.userBalanceRepository.updateStablecoinBalance(
          userId,
          (currentBalance - amountNum).toString(),
        );
        break;
    }

    balance = await this.userBalanceRepository.findByUserId(userId);

    // Emit Kafka event
    await this.kafkaService.emit('balance.updated', {
      userId,
      balance: balance.balance,
      stablecoinBalance: balance.stablecoinBalance,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create deposit address for user
   */
  private async createDepositAddress(userId: string): Promise<DepositAddress> {
    // In production, this would create a Fireblocks vault account
    // Generate deposit address
    const address = ethers.Wallet.createRandom().address;
    const customerRefId = `user_${userId}_${Date.now()}`;

    return this.depositAddressRepository.create({
      userId,
      address,
      customerRefId,
      vaultAccountId: null, // Would be set when creating Fireblocks vault
      isActive: true,
    });
  }

  /**
   * Get user balance
   */
  async getUserBalance(userId: string): Promise<UserBalance> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found. Please ensure user is synced from user-service.`);
    }

    let balance = await this.userBalanceRepository.findByUserId(userId);
    if (!balance) {
      balance = await this.userBalanceRepository.create({
        userId,
        balance: '0',
        stablecoinBalance: '0',
      });
    }
    return balance;
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId);
  }

  /**
   * Get transactions with pagination
   */
  async getTransactions(options: {
    userId?: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
    transactionType?: TransactionType;
    id?: string;
    amount?: string;
    currency?: string;
    toCurrency?: string;
    txHash?: string;
  }): Promise<{ data: Transaction[]; total: number; page: number; limit: number; totalPages: number }> {
    const result = await this.transactionRepository.findWithFilters({
      userId: options.userId,
      search: options.search,
      status: options.status as any,
      transactionType: options.transactionType,
      id: options.id,
      amount: options.amount,
      currency: options.currency,
      toCurrency: options.toCurrency,
      txHash: options.txHash,
      page: options.page,
      limit: options.limit,
    });
    return {
      data: result.data,
      total: result.total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(result.total / options.limit),
    };
  }

  /**
   * Generate random transaction hash (like ethers.js format)
   */
  private generateRandomTxHash(): string {
    // Generate 64 hex characters (32 bytes)
    const hexChars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    return `0x${hash}`;
  }

  /**
   * Confirm pending transaction (Admin only)
   * For deposit transactions, adds balance to fiat USD
   * For mint transactions, converts USD to stablecoin (adds stablecoin, subtracts USD)
   * For burn transactions, converts stablecoin to USD (adds USD, subtracts stablecoin)
   * For withdraw transactions, subtracts balance from fiat USD
   */
  async confirmTransaction(transactionId: string): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      
      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(`Transaction is not pending. Current status: ${transaction.status}`);
      }

      // Generate random transaction hash (like ethers.js format)
      const txHash = this.generateRandomTxHash();

      // Get or create user balance
      let balance = await this.userBalanceRepository.findByUserId(transaction.userId);
      if (!balance) {
        balance = await this.userBalanceRepository.create({
          userId: transaction.userId,
          balance: '0',
          stablecoinBalance: '0',
        });
      }

      const transactionAmount = parseFloat(transaction.amount);
      let newUsdBalance = parseFloat(balance.balance || '0');
      let newStablecoinBalance = parseFloat(balance.stablecoinBalance || '0');

      // Handle different transaction types
      switch (transaction.transactionType) {
        case TransactionType.DEPOSIT:
          // Add deposit amount to fiat USD balance
          newUsdBalance = newUsdBalance + transactionAmount;
          await this.userBalanceRepository.updateBalance(transaction.userId, newUsdBalance.toString());
          this.logger.log(`Deposit confirmed: Added ${transaction.amount} USD to user ${transaction.userId} balance`);
          break;

        case TransactionType.WITHDRAW:
          // Subtract withdraw amount from fiat USD balance
          if (newUsdBalance < transactionAmount) {
            throw new BadRequestException('Insufficient USD balance');
          }
          newUsdBalance = newUsdBalance - transactionAmount;
          await this.userBalanceRepository.updateBalance(transaction.userId, newUsdBalance.toString());
          this.logger.log(`Withdraw confirmed: Subtracted ${transaction.amount} USD from user ${transaction.userId} balance`);
          break;

        case TransactionType.MINT:
          // Convert USD to stablecoin: add stablecoin, subtract USD
          if (newUsdBalance < transactionAmount) {
            throw new BadRequestException('Insufficient USD balance');
          }
          newUsdBalance = newUsdBalance - transactionAmount;
          newStablecoinBalance = newStablecoinBalance + transactionAmount;
          await this.userBalanceRepository.updateBalance(transaction.userId, newUsdBalance.toString());
          await this.userBalanceRepository.updateStablecoinBalance(transaction.userId, newStablecoinBalance.toString());
          this.logger.log(`Mint confirmed: Converted ${transaction.amount} USD to ${transaction.amount} STC for user ${transaction.userId}`);
          break;

        case TransactionType.BURN:
          // Convert stablecoin to USD: add USD, subtract stablecoin
          if (newStablecoinBalance < transactionAmount) {
            throw new BadRequestException('Insufficient stablecoin balance');
          }
          newStablecoinBalance = newStablecoinBalance - transactionAmount;
          newUsdBalance = newUsdBalance + transactionAmount;
          await this.userBalanceRepository.updateBalance(transaction.userId, newUsdBalance.toString());
          await this.userBalanceRepository.updateStablecoinBalance(transaction.userId, newStablecoinBalance.toString());
          this.logger.log(`Burn confirmed: Converted ${transaction.amount} STC to ${transaction.amount} USD for user ${transaction.userId}`);
          break;

        default:
          throw new BadRequestException(`Unsupported transaction type for confirmation: ${transaction.transactionType}`);
      }

      // Update transaction status to confirmed with hash
      await this.transactionRepository.update(transactionId, {
        status: TransactionStatus.CONFIRMED,
        txHash: txHash,
      });

      await queryRunner.commitTransaction();

      // Emit Kafka event for balance update
      await this.kafkaService.emit('balance.updated', {
        userId: transaction.userId,
        balance: newUsdBalance.toString(),
        stablecoinBalance: newStablecoinBalance.toString(),
        timestamp: new Date().toISOString(),
      });

      // Emit Kafka event for transaction confirmation
      await this.kafkaService.emit('transaction.confirmed', {
        transactionId: transaction.id,
        userId: transaction.userId,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        txHash: txHash,
        timestamp: new Date().toISOString(),
      });

      // Publish socket event for transaction approval/confirmation (non-blocking)
      this.socketEventPublisher.publishTransactionApproved(
        transaction.userId,
        transaction.id,
        transaction.amount,
        transaction.currency || 'USD',
        transaction.transactionType,
        TransactionStatus.CONFIRMED,
        txHash,
      ).catch((error) => {
        this.logger.warn(`Failed to publish socket event for transaction ${transaction.id}: ${error.message}`);
      });

      // Return updated transaction
      return await this.transactionRepository.findById(transactionId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error confirming transaction ${transactionId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject pending transaction (Admin only)
   */
  async rejectTransaction(transactionId: string, reason?: string): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      
      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(`Transaction is not pending. Current status: ${transaction.status}`);
      }

      // Update transaction status to rejected
      await this.transactionRepository.update(transactionId, {
        status: TransactionStatus.REJECTED,
        failureReason: reason || 'Transaction rejected by admin',
      });

      await queryRunner.commitTransaction();

      // Emit Kafka event for transaction rejection
      await this.kafkaService.emit('transaction.rejected', {
        transactionId: transaction.id,
        userId: transaction.userId,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        reason: reason || 'Transaction rejected by admin',
        timestamp: new Date().toISOString(),
      });

      // Publish socket event for transaction rejection (non-blocking)
      this.socketEventPublisher.publishTransactionRejected(
        transaction.userId,
        transaction.id,
        transaction.amount,
        transaction.currency || 'USD',
        transaction.transactionType,
        TransactionStatus.REJECTED,
        reason || 'Transaction rejected by admin',
      ).catch((error) => {
        this.logger.warn(`Failed to publish socket event for transaction ${transaction.id}: ${error.message}`);
      });

      this.logger.log(`Transaction ${transactionId} rejected by admin. Reason: ${reason || 'No reason provided'}`);

      // Return updated transaction
      return await this.transactionRepository.findById(transactionId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error rejecting transaction ${transactionId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(): Promise<{ totalMint: string; totalBurn: string }> {
    try {
      const mintTransactions = await this.transactionRepository.findByType(TransactionType.MINT, TransactionStatus.CONFIRMED);
      const burnTransactions = await this.transactionRepository.findByType(TransactionType.BURN, TransactionStatus.CONFIRMED);
      
      const totalMint = mintTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
      const totalBurn = burnTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
      
      return {
        totalMint: totalMint.toFixed(2),
        totalBurn: totalBurn.toFixed(2),
      };
    } catch (error) {
      this.logger.error(`Error getting transaction stats: ${error.message}`);
      throw error;
    }
  }
}
