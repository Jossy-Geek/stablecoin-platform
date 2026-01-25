// Single event type for all transaction updates
export const TRANSACTION_UPDATE = 'TRANSACTION_UPDATE';

export interface TransactionEventPayload {
  transactionId: string;
  userId: string;
  transactionType: string;
  amount: string;
  currency?: string;
  status: string;
  txHash?: string;
  timestamp: string;
  reason?: string; // For rejected transactions
  eventType?: string; // Original event type (optional, for backward compatibility)
}

export interface TransactionEventMessage {
  eventType?: string; // Optional, for backward compatibility
  payload: TransactionEventPayload;
}
