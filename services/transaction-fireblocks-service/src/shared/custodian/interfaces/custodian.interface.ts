/**
 * Custodian Interface
 * 
 * This interface defines the contract that all custodian implementations must follow.
 * It abstracts the operations needed for blockchain custody services.
 */

export interface TransactionOptions {
  assetId: string;
  sourceId: string;
  sourceType: string;
  destinationId: string;
  destinationType: string;
  amount: string;
  customerRefId?: string;
  operation: string;
  note?: string;
  contractCallData?: string;
}

export interface TransactionResult {
  id: string;
  status: string;
  txHash?: string;
  [key: string]: any;
}

export interface BalanceResult {
  balance: string;
  assetId: string;
  available: string;
}

/**
 * Main Custodian Interface
 * All custodian implementations must implement this interface
 */
export interface ICustodian {
  /**
   * Get the custodian provider name
   */
  getProviderName(): string;

  /**
   * Check if custodian is initialized and ready
   */
  isInitialized(): boolean;

  /**
   * Get vault/account asset balance
   */
  getVaultAssetBalance(vaultAccountId: string, assetId: string): Promise<string>;

  /**
   * Check if vault has sufficient balance for transaction
   */
  checkVaultBalance(
    vaultAccountId: string,
    assetId: string,
    txGasFee: string,
    tokenAmount?: string,
  ): Promise<boolean>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): Promise<boolean>;

  /**
   * Estimate gas fee for transaction
   */
  calculateGasFee(txOptions: TransactionOptions): Promise<string>;

  /**
   * Submit transaction to custodian
   */
  submitTransaction(txOptions: TransactionOptions): Promise<TransactionResult>;

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): Promise<TransactionResult>;

  /**
   * Create vault account for user
   */
  createVaultAccount(userId: string, customerRefId?: string): Promise<{ vaultAccountId: string; address?: string }>;

  /**
   * Get vault account details
   */
  getVaultAccount(vaultAccountId: string): Promise<any>;
}
