export enum SocketEventType {
  TRANSACTION_PENDING = 'TRANSACTION_PENDING',
  TRANSACTION_APPROVED = 'TRANSACTION_APPROVED',
  TRANSACTION_CONFIRMED = 'TRANSACTION_CONFIRMED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_UPDATE = 'TRANSACTION_UPDATE', // Single event type for all transaction updates
}

export interface SocketEventPayload {
  eventType: SocketEventType | string; // Allow string for flexibility (e.g., 'TRANSACTION_UPDATE')
  userId: string;
  transactionId: string;
  status: string;
  amount: string;
  currency: string;
  transactionType?: string;
  txHash?: string;
  reason?: string;
  timestamp?: string;
}
