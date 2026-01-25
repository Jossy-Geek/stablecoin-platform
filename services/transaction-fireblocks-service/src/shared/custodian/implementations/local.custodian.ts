import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICustodian, TransactionOptions, TransactionResult } from '../interfaces/custodian.interface';
import { CustodianProvider } from '../custodian-provider.enum';

/**
 * Local Custodian Implementation
 * 
 * This implementation represents direct blockchain interaction without a custodian.
 * It's used when IS_VAULT_ENABLED=false and transactions are processed directly
 * via smart contracts.
 */
@Injectable()
export class LocalCustodian implements ICustodian {
  private readonly logger = new Logger(LocalCustodian.name);
  private initialized: boolean = true;

  constructor(private configService: ConfigService) {
    this.logger.log('✅ Local custodian initialized (direct blockchain interaction)');
  }

  getProviderName(): string {
    return CustodianProvider.LOCAL;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async getVaultAssetBalance(vaultAccountId: string, assetId: string): Promise<string> {
    // Local mode doesn't use vault accounts
    this.logger.warn('getVaultAssetBalance called in local mode - not applicable');
    return '0';
  }

  async checkVaultBalance(
    vaultAccountId: string,
    assetId: string,
    txGasFee: string,
    tokenAmount?: string,
  ): Promise<boolean> {
    // In local mode, balance checks are done via contract calls
    return true;
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    // Local mode doesn't use webhooks
    return false;
  }

  async calculateGasFee(txOptions: TransactionOptions): Promise<string> {
    // Estimate gas for local transactions
    return '0.0001';
  }

  async submitTransaction(txOptions: TransactionOptions): Promise<TransactionResult> {
    // In local mode, transactions are submitted directly via ethers.js
    // This should not be called - transactions are handled in transaction.service
    throw new Error('Local custodian does not submit transactions - use direct contract calls');
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionResult> {
    // In local mode, transaction status is tracked in database
    throw new Error('Local custodian does not track transaction status - check database');
  }

  async createVaultAccount(userId: string, customerRefId?: string): Promise<{ vaultAccountId: string; address?: string }> {
    // In local mode, addresses are generated directly
    throw new Error('Local custodian does not create vault accounts - generate addresses directly');
  }

  async getVaultAccount(vaultAccountId: string): Promise<any> {
    // Local mode doesn't use vault accounts
    throw new Error('Local custodian does not use vault accounts');
  }
}
