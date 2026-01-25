# Integration Examples

## Frontend Socket.IO Connection (User Frontend)

### Installation

```bash
npm install socket.io-client
```

### React/Next.js Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';

export function useTransactionSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found, cannot connect to socket');
      return;
    }

    // Connect to socket with JWT token
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token, // JWT token from login
      },
      transports: ['websocket'],
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to transaction socket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from transaction socket');
      setIsConnected(false);
    });

    // Transaction events
    newSocket.on('TRANSACTION_APPROVED', (payload) => {
      console.log('✅ Transaction approved:', payload);
      // Handle transaction approved
      // e.g., show notification, update UI, refresh balance
    });

    newSocket.on('TRANSACTION_REJECTED', (payload) => {
      console.log('❌ Transaction rejected:', payload);
      // Handle transaction rejected
      // e.g., show error message, update UI
    });

    newSocket.on('TRANSACTION_PENDING', (payload) => {
      console.log('⏳ Transaction pending:', payload);
      // Handle transaction pending
    });

    newSocket.on('TRANSACTION_CONFIRMED', (payload) => {
      console.log('✅ Transaction confirmed:', payload);
      // Handle transaction confirmed
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, isConnected };
}

// Usage in component
export default function WalletPage() {
  const { socket, isConnected } = useTransactionSocket();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('TRANSACTION_APPROVED', (payload) => {
      // Update transactions list
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === payload.transactionId
            ? { ...tx, status: 'approved', ...payload }
            : tx
        )
      );
      
      // Show success notification
      alert(`Transaction ${payload.transactionId} has been approved!`);
    });

    socket.on('TRANSACTION_REJECTED', (payload) => {
      // Update transactions list
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === payload.transactionId
            ? { ...tx, status: 'rejected', reason: payload.reason }
            : tx
        )
      );
      
      // Show error notification
      alert(`Transaction ${payload.transactionId} has been rejected: ${payload.reason}`);
    });
  }, [socket]);

  return (
    <div>
      <p>Socket Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      {/* Your wallet UI */}
    </div>
  );
}
```

### Vanilla JavaScript Example

```javascript
const token = localStorage.getItem('token');
const socket = io('http://localhost:3005', {
  auth: {
    token: token
  }
});

socket.on('connect', () => {
  console.log('Connected to transaction socket');
});

socket.on('TRANSACTION_APPROVED', (payload) => {
  console.log('Transaction approved:', payload);
  // Update UI
  updateTransactionStatus(payload.transactionId, 'approved');
  showNotification('Transaction approved!', 'success');
});

socket.on('TRANSACTION_REJECTED', (payload) => {
  console.log('Transaction rejected:', payload);
  // Update UI
  updateTransactionStatus(payload.transactionId, 'rejected');
  showNotification(`Transaction rejected: ${payload.reason}`, 'error');
});
```

## Backend Event Publishing (transaction-fireblocks-service)

### Example: Publishing Transaction Event to RabbitMQ

```typescript
// In transaction-fireblocks-service
import { Injectable } from '@nestjs/common';
import { RabbitMQService } from './shared/rabbitmq/rabbitmq.service';

@Injectable()
export class TransactionService {
  constructor(private rabbitMQService: RabbitMQService) {}

  async confirmTransaction(transactionId: string) {
    // ... transaction confirmation logic ...

    // Publish event to RabbitMQ
    await this.rabbitMQService.publish('transaction-events', {
      eventType: 'TRANSACTION_APPROVED',
      payload: {
        transactionId: transaction.id,
        userId: transaction.userId,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        status: 'CONFIRMED',
        txHash: transaction.txHash,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async rejectTransaction(transactionId: string, reason: string) {
    // ... transaction rejection logic ...

    // Publish event to RabbitMQ
    await this.rabbitMQService.publish('transaction-events', {
      eventType: 'TRANSACTION_REJECTED',
      payload: {
        transactionId: transaction.id,
        userId: transaction.userId,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        status: 'REJECTED',
        timestamp: new Date().toISOString(),
        reason: reason,
      },
    });
  }
}
```

### RabbitMQ Message Format

```json
{
  "eventType": "TRANSACTION_APPROVED",
  "payload": {
    "transactionId": "a0000000-0000-0000-0000-000000000001",
    "userId": "00000000-0000-0000-0000-000000000001",
    "transactionType": "mint",
    "amount": "100.00",
    "status": "CONFIRMED",
    "txHash": "0xabc123...",
    "timestamp": "2026-01-17T22:30:00.000Z"
  }
}
```

## Environment Variables

### transaction-socket-service

```env
PORT=3005
JWT_SECRET=your-secret-key
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
CORS_ORIGIN=http://localhost:3006,http://localhost:3007
```

### User Frontend (.env.local)

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3005
```
