import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICustodian, TransactionOptions, TransactionResult } from '../interfaces/custodian.interface';
import { CustodianProvider } from '../custodian-provider.enum';

/**
 * Mock Custodian Implementation
 * 
 * This is a mock implementation for development and testing.
 * It simulates custodian operations without making real API calls.
 */
@Injectable()
export class MockCustodian implements ICustodian {
  private readonly logger = new Logger(MockCustodian.name);
  private initialized: boolean = true;
  private mockBalances: Map<string, string> = new Map();

  constructor(private configService: ConfigService) {
    this.logger.log('✅ Mock custodian initialized (for testing/development)');
  }

  getProviderName(): string {
    return CustodianProvider.MOCK;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async getVaultAssetBalance(vaultAccountId: string, assetId: string): Promise<string> {
    const key = `${vaultAccountId}_${assetId}`;
    return this.mockBalances.get(key) || '1000.00'; // Default mock balance
  }

  async checkVaultBalance(
    vaultAccountId: string,
    assetId: string,
    txGasFee: string,
    tokenAmount?: string,
  ): Promise<boolean> {
    const balance = await this.getVaultAssetBalance(vaultAccountId, assetId);
    const balanceNum = parseFloat(balance);
    const gasFeeNum = parseFloat(txGasFee);
    const tokenAmountNum = tokenAmount ? parseFloat(tokenAmount) : 0;
    return balanceNum >= gasFeeNum + tokenAmountNum;
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    // Mock always returns true
    return true;
  }

  async calculateGasFee(txOptions: TransactionOptions): Promise<string> {
    // Mock gas fee
    return '0.0001';
  }

  async submitTransaction(txOptions: TransactionOptions): Promise<TransactionResult> {
    // Mock transaction - generate fake transaction ID
    const mockTxId = `mock_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockTxHash = `0x${'0'.repeat(64)}`;

    this.logger.log(`[MOCK] Simulating transaction: ${mockTxId}`);

    return {
      id: mockTxId,
      status: 'SUBMITTED',
      txHash: mockTxHash,
    };
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionResult> {
    // Mock transaction status
    return {
      id: transactionId,
      status: 'CONFIRMED',
      txHash: `0x${'0'.repeat(64)}`,
    };
  }

  async createVaultAccount(userId: string, customerRefId?: string): Promise<{ vaultAccountId: string; address?: string }> {
    // Mock vault account creation
    const mockVaultId = `mock_vault_${userId}_${Date.now()}`;
    const mockAddress = `0x${'0'.repeat(40)}`;

    this.logger.log(`[MOCK] Created vault account: ${mockVaultId}`);

    return {
      vaultAccountId: mockVaultId,
      address: mockAddress,
    };
  }

  async getVaultAccount(vaultAccountId: string): Promise<any> {
    // Mock vault account
    return {
      id: vaultAccountId,
      name: 'Mock Vault Account',
      assets: [],
    };
  }
}
