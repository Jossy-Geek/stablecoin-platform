# Socket.IO Integration Guide

## Overview

The user frontend now supports real-time transaction updates via Socket.IO. When transaction status changes (pending → approved/rejected), users receive instant updates without page refresh.

## Architecture

```
transaction-fireblocks-service → transaction-socket-service → Socket.IO → User Frontend
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install `socket.io-client` package.

### 2. Environment Configuration

Add to `.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3005
```

### 3. Usage

The socket connection is automatically initialized when:
- User is logged in (has valid JWT token)
- User ID is available
- Transactions page is loaded

## Implementation Details

### Files Created

1. **`src/lib/socket.ts`**
   - Socket connection utility
   - Manages singleton socket instance
   - Handles authentication with JWT

2. **`src/hooks/useTransactionSocket.ts`**
   - React hook for socket connection
   - Listens to transaction events
   - Provides connection status
   - Handles reconnection automatically

3. **`src/pages/transactions.tsx`** (Updated)
   - Integrated socket hook
   - Real-time transaction list updates
   - Updates existing transactions or adds new ones

### Event Types

The hook listens to these Socket.IO events:
- `TRANSACTION_APPROVED` - Transaction approved by admin
- `TRANSACTION_REJECTED` - Transaction rejected by admin
- `TRANSACTION_PENDING` - Transaction pending approval
- `TRANSACTION_CONFIRMED` - Transaction confirmed on blockchain

### Event Payload

```typescript
{
  transactionId: string;
  userId: string;
  transactionType: string; // 'deposit', 'withdraw', 'mint', 'burn'
  amount: string;
  status: string; // 'pending', 'confirmed', 'rejected'
  txHash?: string;
  timestamp: string;
  reason?: string; // For rejected transactions
}
```

### Update Logic

When a socket event is received:

1. **Transaction exists in list:**
   - Find transaction by `transactionId`
   - Update: `status`, `txHash`, `updatedAt`
   - Preserve other fields

2. **Transaction doesn't exist:**
   - Create new transaction object
   - Prepend to list (newest first)
   - Set all fields from payload

## Connection Status

The transactions page displays connection status:
- 🟢 Green dot = Connected (real-time updates active)
- 🔴 Red dot = Disconnected (checking connection...)

## Testing

1. **Start services:**
   ```bash
   # Terminal 1: Socket Service
   cd transaction-socket-service
   npm run start:dev

   # Terminal 2: Transaction Service (with demo events)
   cd transaction-fireblocks-service
   # Set ENABLE_DEMO_SOCKET_EVENTS=true in .env
   npm run start:dev

   # Terminal 3: User Frontend
   cd user-frontend1
   npm run dev
   ```

2. **Login to user frontend:**
   - Navigate to http://localhost:3006
   - Login with user credentials
   - Go to Transactions page

3. **Watch for updates:**
   - Connection status should show "Real-time updates active"
   - Demo events will trigger after 5 seconds
   - Transaction list will update automatically

## Troubleshooting

### Socket Not Connecting

1. Check `NEXT_PUBLIC_SOCKET_URL` is set correctly
2. Verify socket service is running on that URL
3. Check browser console for connection errors
4. Verify JWT token is valid in localStorage

### Events Not Received

1. Check socket service logs for event emission
2. Verify user ID matches the event's userId
3. Check browser console for received events
4. Verify user is in the correct room: `user:{userId}`

### Transactions Not Updating

1. Check `handleTransactionUpdate` callback is being called
2. Verify transactionId matches existing transactions
3. Check browser console for update logs
4. Verify transaction list state is updating

## Production Considerations

- Socket URL should be configured via environment variables
- Handle reconnection gracefully
- Show user-friendly error messages
- Consider rate limiting for updates
- Monitor socket connection health
