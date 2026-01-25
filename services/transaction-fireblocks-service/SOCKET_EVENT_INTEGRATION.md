# Socket Event Integration

## Overview

The `SocketEventPublisher` service emits transaction lifecycle events to the `transaction-socket-service` via HTTP POST requests. This enables real-time updates to users through WebSocket connections.

## Architecture

```
transaction-fireblocks-service → HTTP POST → transaction-socket-service → Socket.IO → User Frontend
```

## Integration Points

### 1. Transaction Created (PENDING)

**Location:** `transaction.service.ts` → `createTransaction()`

```typescript
// Publish socket event for transaction pending (non-blocking)
this.socketEventPublisher.publishTransactionPending(
  userId,
  savedTransaction.id,
  amount,
  currency || 'USD',
  transactionType,
  TransactionStatus.PENDING,
).catch((error) => {
  this.logger.warn(`Failed to publish socket event: ${error.message}`);
});
```

**Triggered when:**
- User creates a deposit, withdraw, mint, or burn transaction
- Transaction status is set to PENDING

### 2. Transaction Approved/Confirmed

**Location:** `transaction.service.ts` → `confirmTransaction()`

```typescript
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
  this.logger.warn(`Failed to publish socket event: ${error.message}`);
});
```

**Triggered when:**
- Admin approves a pending transaction
- Transaction status changes to CONFIRMED
- Balance updates are completed

### 3. Transaction Rejected

**Location:** `transaction.service.ts` → `rejectTransaction()`

```typescript
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
  this.logger.warn(`Failed to publish socket event: ${error.message}`);
});
```

**Triggered when:**
- Admin rejects a pending transaction
- Transaction status changes to REJECTED

## Event Payload Format

```typescript
{
  eventType: 'TRANSACTION_APPROVED' | 'TRANSACTION_REJECTED' | 'TRANSACTION_PENDING' | 'TRANSACTION_CONFIRMED',
  userId: string,
  transactionId: string,
  status: string,
  amount: string,
  currency: string,
  transactionType?: string,
  txHash?: string,
  reason?: string,
  timestamp: string
}
```

## Configuration

### Environment Variables

Add to `.env`:

```env
# Socket Service Configuration
SOCKET_SERVICE_URL=http://localhost:3005
SOCKET_SERVICE_ENABLED=true
```

### Disable Socket Events

Set `SOCKET_SERVICE_ENABLED=false` to disable socket event publishing without code changes.

## Error Handling

- **Non-blocking:** Socket event publishing never blocks the main transaction flow
- **Error logging:** Failures are logged but don't throw errors
- **Timeout:** HTTP requests timeout after 5 seconds
- **Retry:** No automatic retries (fire-and-forget pattern)

## Example Event Flow

1. **User creates mint transaction:**
   ```
   POST /transactions/mint
   → Transaction created with PENDING status
   → Socket event: TRANSACTION_PENDING emitted
   ```

2. **Admin approves transaction:**
   ```
   POST /transactions/:id/approve
   → Transaction status → CONFIRMED
   → Balance updated
   → Socket event: TRANSACTION_APPROVED emitted
   ```

3. **Admin rejects transaction:**
   ```
   POST /transactions/:id/reject
   → Transaction status → REJECTED
   → Socket event: TRANSACTION_REJECTED emitted
   ```

## Testing

### Manual Test

1. Create a transaction:
   ```bash
   POST http://localhost:3003/transactions/mint
   ```

2. Check socket service logs for:
   ```
   📥 [RabbitMQ] Received message...
   📤 [Socket] Emitting TRANSACTION_PENDING...
   ```

3. Approve transaction:
   ```bash
   POST http://localhost:3003/transactions/:id/approve
   ```

4. Check socket service logs for:
   ```
   📥 [RabbitMQ] Received message...
   📤 [Socket] Emitting TRANSACTION_APPROVED...
   ```

## Dependencies

- `axios` - HTTP client for POST requests
- `@nestjs/config` - Configuration management

## Files Created

- `src/shared/socket-event/socket-event.publisher.ts` - Main publisher service
- `src/shared/socket-event/socket-event.module.ts` - NestJS module
- `src/shared/socket-event/dto/socket-event.dto.ts` - DTOs and types

## Integration Checklist

- ✅ SocketEventPublisher service created
- ✅ Integrated into TransactionModule
- ✅ Events published on transaction creation
- ✅ Events published on admin approval
- ✅ Events published on admin rejection
- ✅ Non-blocking error handling
- ✅ Environment configuration
- ✅ Comprehensive logging
